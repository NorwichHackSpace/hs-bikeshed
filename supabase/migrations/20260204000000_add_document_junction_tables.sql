-- Document Library Junction Tables Migration
-- Creates junction tables for linking documents to equipment and projects
-- Also makes equipment_id nullable on documents for standalone docs

-- Create document-equipment junction table
CREATE TABLE public.document_equipment_links (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL REFERENCES public.profiles(id),
  linked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, equipment_id)
);

-- Create document-project junction table
CREATE TABLE public.document_project_links (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL REFERENCES public.profiles(id),
  linked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, project_id)
);

-- Make equipment_id nullable on documents (for standalone docs)
ALTER TABLE public.documents ALTER COLUMN equipment_id DROP NOT NULL;
