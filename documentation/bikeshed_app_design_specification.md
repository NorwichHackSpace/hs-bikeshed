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
- Category (e.g. laser cutting, 3D printing, woodworking)
- Description
- Risk level (informational only)
- Induction required: yes / no
- Assigned maintainers (zero or more)
- Operational status:
  - operational
  - out of service
  - retired

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

