# BikeShed

**Norwich Hackspace Membership, Equipment & Booking System**

---

## 1. Purpose

BikeShed is an internal web application for **Norwich Hackspace** that supports the day‑to‑day operational needs of the space while respecting hackspace culture: trust, collaboration, volunteer effort, and minimal bureaucracy.

The system focuses on:
- managing members,
- managing shared equipment,
- recording inductions,
- and enabling equipment booking.

This document is a **high‑level design specification** intended to be shared with members. It captures agreed principles, scope, and structure to guide future development and avoid unnecessary bikeshedding.

---

## 2. Design Principles

- **Trust-first, not enforcement-first**  
  The system supports social norms rather than policing behaviour.

- **Risk-based complexity**  
  Only equipment that meaningfully benefits from induction or booking is modelled as such.

- **Volunteer-friendly**  
  Low admin overhead, clear responsibilities, no fragile processes.

- **Hackspace-aligned**  
  Collaborative, transparent, pragmatic, and slightly self-aware.

---

## 3. Goals

- Provide a clear, shared view of:
  - who is a member,
  - what equipment exists,
  - who is inducted on what,
  - and when equipment is booked.
- Support maintainers in inducting members and managing equipment
- Reduce informal knowledge silos ("who can use the laser?")
- Enable members to self-serve induction requests and bookings

---

## 4. Non‑Goals (Initial Scope)

The following are explicitly out of scope for the initial system:

- Financial systems or payment processing (note: read-only bank transaction import for reconciliation is supported)
- Physical access control or machine interlocks
- Automated enforcement or disciplinary logic
- Wiki-style long-form documentation
- Incident management or formal safety compliance tracking

These may be considered in later phases if needed.

---

## 5. User Roles

### 5.1 Member

All registered members of Norwich Hackspace.

Capabilities:
- View personal profile and membership status
- View equipment list and induction requirements
- Request inductions for equipment
- View own inductions
- Book equipment once inducted
- Create and manage personal projects

---

### 5.2 Equipment Maintainer

Members who volunteer to look after specific equipment.

Characteristics:
- A piece of equipment may have **multiple maintainers**
- Maintainers collaborate; no primary or hierarchical maintainer role

Capabilities:
- Be assigned as maintainer for one or more pieces of equipment
- Order and manage consumables (tracked informally)
- Perform repairs and upgrades
- Record maintenance notes
- Conduct inductions for assigned equipment
- Sign off members as inducted and authorised

---

### 5.3 Administrator / Trustee (Core Team)

Members responsible for governance and operational oversight.

Capabilities:
- Assign and revoke equipment maintainer status
- Manage users and roles
- Create and manage equipment records
- View all bookings and inductions
- Configure system-wide settings

---

## 6. Core Feature Areas

### 6.1 Membership Management

- User profiles:
  - name
  - contact details
  - join date
  - role(s)
- Membership status:
  - active
  - inactive / lapsed
- Role assignment:
  - member
  - equipment maintainer
  - administrator

CRUD operations are required for administrators.

---

### 6.2 Equipment Management

Each shared tool or machine is represented as an equipment record.

Equipment attributes include:
- Name
- Model (optional)
- Category (e.g. laser cutting, 3D printing, woodworking)
- Description
- Risk level (informational only)
- Induction required: yes / no
- Booking required: yes / no
- Assigned maintainers (zero or more)
- Images (multiple)
- Specifications (JSON metadata)
- Operational status:
  - operational
  - out of service
  - retired

#### URL Structure

Equipment uses a hierarchical URL structure for better organization and SEO:

- **Equipment list**: `/equipment` - Grid view of all equipment
- **Equipment detail**: `/equipment/[category]/[id]` - Full detail page for a piece of equipment

Example URLs:
- `/equipment/laser-cutting/abc123` - A laser cutter
- `/equipment/3d-printing/def456` - A 3D printer
- `/equipment/uncategorized/ghi789` - Equipment without a category

#### Equipment Detail Page

Each piece of equipment has a dedicated detail page that displays:
- Images gallery
- Full description
- Technical specifications
- Requirements (induction, booking)
- Risk level
- Current status
- Assigned maintainers
- Quick action buttons (Book, Request Induction)

The detail page includes an **Edit** button that switches to an inline edit form (not a modal), allowing administrators to update equipment information without leaving the page.

Equipment records are managed via CRUD interfaces by administrators.

---

### 6.3 Training & Inductions

Inductions represent the relationship between a member and a piece of equipment.

Key rules:
- Only equipment marked as requiring induction uses this feature
- Members may request inductions
- Inductions are conducted and signed off by equipment maintainers
- The system records inductions but does not enforce behaviour

Induction records include:
- Member
- Equipment
- Maintainer who signed off
- Date
- Optional notes

An induction grants permission to book the equipment.

---

### 6.4 Equipment Booking

Booking is the primary functional benefit unlocked by induction.

Booking rules (initial scope):
- A member may book a piece of equipment **if and only if** they are inducted
- No additional constraints are enforced initially

Booking attributes:
- Equipment
- Member
- Start time
- End time
- Optional notes

Booking features:
- Calendar view per piece of equipment
- Visibility of upcoming bookings to all members
- CRUD operations for bookings

---

### 6.5 Projects

Projects provide light-weight visibility into what members are working on.

Project attributes:
- Title
- Description
- Owning member
- Optional associated equipment

Projects are informational and optional.

---

### 6.6 Bank Transaction Import

Administrators can import bank statements (CSV format) to track membership payments and reconcile them against member records.

#### Import Workflow

1. **Upload CSV** - Admin uploads a bank statement CSV file via drag-and-drop or file browser
2. **Auto-matching** - System automatically matches transactions to members using their `payment_reference` field
3. **Review & Manual Match** - Admin reviews matches, can manually assign unmatched transactions to members
4. **Confirm Import** - Only matched transactions are imported; unmatched and duplicates are skipped

#### Matching Rules

- Transactions are matched when the bank description **starts with** a member's `payment_reference`
- Payment references must be at least 5 characters
- When manually matching a member who has no payment reference, it is automatically set from the transaction description
- Only matched transactions (auto or manual) are imported to the database

#### Duplicate Detection

- Before import, transactions are checked against existing records
- Duplicates are identified by matching: date + description + amount
- Duplicates are displayed with strikethrough styling and skipped during import

#### CSV Format Support

The parser supports various bank CSV formats with flexible column detection:
- **Date columns**: Date, Transaction Date, Trans Date, Posted Date, Value Date
- **Description columns**: Description, Narrative, Details, Memo
- **Amount columns**: Amount, Value, or separate Credit/Debit columns
- **Date formats**: DD/MM/YYYY (UK), YYYY-MM-DD (ISO), DD MMM YYYY

#### Data Model

**Transaction Import**
- Filename
- Upload date and user
- Row count and matched count
- Status (pending, processing, completed)

**Transaction**
- Transaction date
- Description
- Amount
- User reference (matched member)
- Match confidence (auto, manual, unmatched)
- Import batch reference
- Original CSV row data (for audit)

#### Access Control

- Only administrators can access the transaction import feature
- Members can view their own payment history (future enhancement)

---

## 7. Data Model & Relationships (High Level)

### 7.1 Core Entities

#### User
- Has many projects
- Has many bookings
- Has many inductions
- May be a maintainer for many pieces of equipment

#### Equipment
- Has many maintainers
- Has many inductions
- Has many bookings

#### Induction
- Joins one user and one piece of equipment
- Signed off by a maintainer
- Grants booking permission

#### Booking
- Belongs to one user
- Belongs to one piece of equipment
- Requires an existing induction

#### Project
- Belongs to one user
- May reference many pieces of equipment

#### Transaction Import
- Belongs to one user (uploader)
- Has many transactions

#### Transaction
- Belongs to one transaction import
- May belong to one user (matched member)
- May reference a user who performed the match

---

## 8. CRUD Interfaces

The application will provide administrative and member-facing CRUD pages for:

- Users
- Equipment
- Inductions
- Bookings
- Projects
- Transactions (admin only - import, view, match/unmatch)

Interfaces should prioritise clarity and ease of use over density of information.

---

## 9. MVP Definition

The minimum viable version of BikeShed includes:

- User accounts and roles
- Equipment records
- Induction recording
- Booking system gated by induction

Everything else is secondary.

---

## 10. Future Considerations (Out of Scope for Now)

- Booking constraints (time limits, cooldowns)
- Maintenance scheduling
- Reporting and analytics
- Deeper project tracking
- Integration with physical systems

---

## 11. Status

This document is expected to evolve through discussion and iteration.

BikeShed is intentionally named to remind us that the goal is **useful progress**, not perfection.

---

## 12. Ideas

This section captures feature ideas for future consideration. Ideas here are not commitments - they are starting points for discussion and refinement.

---

### 12.1 Equipment Consumables List

**Summary:** Equipment can have an optional list of consumables - materials that are used up during normal operation and need regular replenishment.

**Problem:** Members often don't know what materials they need to bring or purchase for specific equipment. Maintainers field repeated questions about compatible materials, and consumables run out without visibility.

**Proposed Solution:**

Each piece of equipment can have an associated consumables list with:
- **Name** - e.g., "MDF sheets", "PLA filament", "Drill bits"
- **Description** - Specifications, compatible brands, sizes
- **Where to buy** - Suggested suppliers or links
- **Stock status** (optional) - In stock / Low / Out of stock
- **Member-provided vs Hackspace-provided** - Who supplies it

**Examples by equipment type:**
- **Laser cutter:** Acrylic sheets, MDF, plywood, lens cleaner, extraction filter
- **3D printer:** PLA/PETG/ABS filament, glue stick, isopropyl alcohol, build plates
- **CNC router:** End mills, collets, sacrificial boards, dust bags
- **Sewing machine:** Needles, bobbins, thread, fabric scissors

**User Experience:**
- Consumables list displayed on equipment detail page
- Maintainers can add/edit/remove consumables for their equipment
- Optional stock status allows members to see what's available before booking
- Links to suppliers help members purchase compatible materials

**Data Model:**
```
equipment_consumables
- id
- equipment_id (FK)
- name
- description
- supplier_info
- stock_status (enum: in_stock, low, out_of_stock, member_provided)
- created_by
- updated_at
```

**Considerations:**
- Keep it simple - avoid full inventory management
- Stock status is informational, not enforced
- Maintainers are responsible for keeping the list current

---

### 12.2 Equipment Usage Log

**Summary:** Track equipment usage over time to understand which tools are most valuable to the community and inform future decisions.

**Problem:** The hackspace has no visibility into which equipment is actually being used. This makes it difficult to:
- Justify purchases of new equipment
- Prioritise maintenance efforts
- Identify underutilised equipment that could be promoted or retired
- Make data-informed decisions about the space

**Proposed Solution:**

Log usage events for equipment with:
- **User** - Who used it (optional anonymisation for reports)
- **Equipment** - What was used
- **Timestamp** - When it was used
- **Duration** - How long (estimated or actual)
- **Source** - How the usage was recorded

**Usage Tracking Methods:**

1. **Booking-based (automatic)**
   - Every completed booking creates a usage log entry
   - Duration derived from booking start/end times
   - Low friction - no extra action required

2. **Check-in/Check-out (manual)**
   - Member taps/scans to start and end a session
   - More accurate for walk-up usage
   - Could use QR codes on equipment

3. **Simple "I used this" button**
   - One-tap logging on equipment detail page
   - Quick way to record ad-hoc usage
   - Less accurate but very low friction

**Insights & Reports:**

- **Popular equipment** - Most used items by session count or total hours
- **Usage trends** - Daily/weekly/monthly patterns
- **Peak times** - When equipment is busiest (inform booking availability)
- **User engagement** - How many unique members use each item
- **Underutilised equipment** - Items that might need promotion or training

**User Experience:**
- Members can view their own usage history
- Admins see aggregated reports and dashboards
- Equipment detail page shows "X sessions this month" or similar

**Data Model:**
```
equipment_usage_log
- id
- equipment_id (FK)
- user_id (FK, nullable for anonymous)
- started_at
- ended_at (nullable for simple check-ins)
- duration_minutes
- source (enum: booking, check_in, manual)
- booking_id (FK, nullable - links to booking if applicable)
- created_at
```

**Privacy Considerations:**
- Reports should show aggregated data, not individual usage
- Members can see their own history
- Consider opt-out for usage tracking
- Admin reports focus on equipment popularity, not member surveillance

**Considerations:**
- Start with booking-based tracking (already have the data)
- Add manual logging later if needed
- Keep reporting simple - avoid analysis paralysis
- Focus on actionable insights for the community

---

### 12.3 Document Store

**Summary:** A flexible file storage system where users can upload documents, organise them with tags, and attach them to multiple entities (equipment, projects, etc.) with configurable visibility.

**Problem:** Currently there's no centralised place for:
- Members to store project files, designs, and notes
- Sharing equipment manuals, guides, and templates with other members
- Publishing resources that could benefit the wider maker community

Files end up scattered across personal drives, Discord, email, and the wiki with no consistent organisation.

**Proposed Solution:**

A document store with flexible visibility and multi-entity attachment.

#### Visibility Model

Documents have two visibility options:

1. **Inherit from parent** - Visibility determined by what it's attached to
   - Attached to equipment → visible to members
   - Attached to private project → visible to project owner only
   - Attached to public project → visible to everyone

2. **Explicit visibility** - Override with specific setting
   - Private (owner only)
   - Members (logged-in members)
   - Public (anyone)

This allows scenarios like:
- A public PDF manual attached to equipment (anyone can download)
- A members-only settings file attached to same equipment
- A private work-in-progress attached to a public project

#### Multi-Entity Attachment

A single document can be attached to **multiple entities**:
- One safety guide PDF linked to 3 different laser cutters
- One template file linked to equipment AND a tutorial project
- Standalone documents with no attachment (general resources)

This avoids duplication and keeps documents in sync across related items.

#### Organisation

Documents are organised using **tags/categories** rather than folders:
- Tags like: `manual`, `safety`, `template`, `settings`, `tutorial`
- Category groupings: `Equipment Docs`, `Project Files`, `Guides`
- Search and filter by tags
- Equipment and projects show their attached documents inline

#### Permissions

Who can attach/update documents depends on the entity:

| Entity Type | Who can manage documents |
|-------------|-------------------------|
| **Equipment with maintainer or induction required** | Maintainers and admins only |
| **Low-level equipment** (no maintainer, no induction) | Any member |
| **Projects** | Project owner |
| **Standalone documents** | Creator (private), Admins (members/public) |

This respects the existing trust model - critical equipment documentation is controlled, but casual equipment is open to community contribution.

#### Features

- **Upload** - Drag-and-drop, multi-file upload
- **Attach** - Link to one or more equipment, projects, or standalone
- **Organise** - Tags and categories
- **Preview** - In-browser preview for PDFs, images, text, STL (3D viewer)
- **Download** - Direct download, shareable URLs for public files
- **Search** - Find by name, tag, entity, or content type

#### Use Cases

**Equipment attachments:**
- PDF manuals and datasheets
- Material settings spreadsheets (laser power/speed tables)
- Safety procedures
- Quick-reference cards

**Project attachments:**
- STL/3MF files for 3D printing
- DXF/SVG files for laser cutting
- CAD source files
- Build instructions and notes
- Photos of finished work

**Standalone documents:**
- General workshop safety guide
- Hackspace policies
- Beginner tutorials
- Event materials

#### Data Model

```
documents
- id
- filename
- storage_path
- file_size
- mime_type
- visibility (enum: inherit, private, members, public)
- uploaded_by (FK to profiles)
- title (display name)
- description
- tags (text array)
- category
- created_at
- updated_at

document_attachments
- id
- document_id (FK)
- entity_type (enum: equipment, project)
- entity_id (uuid)
- attached_by (FK to profiles)
- attached_at
```

Note: A document with no entries in `document_attachments` is standalone.

#### Storage

- Supabase Storage bucket: `documents`
- RLS policies check visibility + attachment permissions
- File size limit: 50MB per file (configurable)
- Supported formats: PDF, images, STL/3MF, DXF/SVG, text, Office docs

#### Considerations

- Start with equipment attachments (highest value, clearest use case)
- Add project attachments and standalone docs in later iteration
- Preview support can be progressive (PDFs first, then images, then 3D)
- Monitor storage usage - may need quotas per user for private files
- Consider virus/malware scanning for uploaded files

---

### 12.4 Induction Content System

**Summary:** Transform inductions from simple sign-offs into structured learning experiences with markdown-based information slides followed by verification questions.

**Problem:** Currently, inductions are recorded as a binary yes/no - either you've been inducted or you haven't. This creates several issues:

- No standardisation of what an induction covers
- Knowledge depends entirely on who conducts the induction
- No way for members to refresh their knowledge later
- Maintainers repeat the same information verbally for each inductee
- No verification that critical safety information has been understood
- New maintainers have no template for conducting inductions

**Proposed Solution:**

Each piece of equipment can have associated induction content consisting of:
1. **Information slides** - Markdown-formatted content covering safety, operation, and best practices
2. **Verification questions** - Multiple-choice or true/false questions to confirm understanding
3. **Pass threshold** - Minimum score required to complete induction

#### Content Structure

**Slides:**
- Written in markdown for easy editing
- Can include images, diagrams, and embedded videos
- Organised into logical sections (Safety, Setup, Operation, Cleanup, Troubleshooting)
- Versioned so changes can be tracked

**Questions:**
- Linked to specific slides or sections
- Multiple choice (single or multi-select) or true/false
- Correct answer(s) defined by content creator
- Optional explanation shown after answering

#### Induction Flow

1. **Member requests induction** (existing functionality)
2. **Member views slides** - Self-paced, can revisit anytime
3. **Member attempts questions** - Must answer all questions
4. **System scores responses** - Shows which were correct/incorrect
5. **If passed:** Induction auto-approved, member can book equipment
6. **If failed:** Member can review slides and retry questions
7. **Maintainer oversight:** Maintainers can view who has completed inductions and their scores

#### Hybrid Induction Model

Some equipment may still require in-person induction alongside or instead of online content:

| Induction Type | Online Content | In-Person Required | Use Case |
|----------------|---------------|-------------------|----------|
| **Self-service** | Required | No | Low-risk equipment, simple operation |
| **Blended** | Required | Yes | Medium-risk, online prep + practical demo |
| **In-person only** | Optional reference | Yes | High-risk, requires hands-on assessment |

Maintainers configure which model applies to their equipment.

#### Content Management

- **Maintainers** create and edit induction content for their equipment
- **Admins** can edit any equipment's induction content
- **Version history** tracks changes with author and timestamp
- **Preview mode** lets maintainers test the full induction flow
- **Clone content** allows copying induction content between similar equipment

#### User Experience

**For members:**
- View available inductions on equipment detail page
- Progress through slides at own pace
- Answer verification questions
- See instant feedback on answers
- Retry if needed (configurable cooldown)
- Access completed induction content anytime for reference

**For maintainers:**
- WYSIWYG markdown editor for slides
- Question builder with answer configuration
- Set pass threshold (e.g., 80%)
- View completion statistics
- Receive notifications of completions (optional)

#### Data Model

```
induction_content
- id
- equipment_id (FK)
- version (integer, auto-increment)
- is_current (boolean)
- created_by (FK to profiles)
- created_at
- pass_threshold (integer, percentage)
- require_in_person (boolean)

induction_slides
- id
- induction_content_id (FK)
- order (integer)
- title
- content (markdown text)
- created_at
- updated_at

induction_questions
- id
- induction_content_id (FK)
- slide_id (FK, nullable - for section-specific questions)
- order (integer)
- question_text
- question_type (enum: multiple_choice, multi_select, true_false)
- options (jsonb - array of {text, is_correct})
- explanation (text, shown after answering)

induction_attempts
- id
- user_id (FK)
- induction_content_id (FK)
- started_at
- completed_at
- score (integer, percentage)
- passed (boolean)
- answers (jsonb - record of responses)
```

Note: The existing `inductions` table remains for recording final sign-off. An `induction_attempt` with `passed: true` can auto-create an induction record, or maintainers can manually approve after reviewing.

#### Examples

**Laser Cutter Induction:**
- Slides: Safety warnings, material compatibility, software setup, cutting process, cleanup procedure
- Questions: "Which materials must NEVER be cut?", "What should you check before starting a cut?", "What do you do if you see flames?"
- Type: Blended (online + in-person demonstration)

**3D Printer Induction:**
- Slides: Printer overview, filament loading, slicing basics, bed levelling, common issues
- Questions: "What temperature should the bed be for PLA?", "How do you know if the first layer is good?"
- Type: Self-service (lower risk, can learn independently)

**Table Saw Induction:**
- Slides: Safety overview (reference material only)
- Questions: None (in-person only)
- Type: In-person only (high risk, requires physical demonstration)

#### Considerations

- Start with simple implementation: markdown slides + multiple choice questions
- Add richer question types later (ordering, matching, free text review)
- Consider time limits for questions (prevents looking up answers)
- Retry cooldown prevents spam attempts (e.g., 24 hours after failure)
- Accessibility: ensure content works with screen readers
- Mobile-friendly slide viewing
- Offline access for reference (PWA consideration)
- Analytics: track which questions are most often missed (content improvement signal)

