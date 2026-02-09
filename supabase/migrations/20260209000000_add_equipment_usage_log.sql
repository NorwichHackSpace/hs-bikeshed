-- Equipment Usage Log Migration
-- Tracks equipment usage over time for insights and reporting

CREATE TABLE public.equipment_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('booking', 'manual', 'check_in')),
  notes TEXT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_usage_log_equipment_id ON public.equipment_usage_log(equipment_id);
CREATE INDEX idx_usage_log_user_id ON public.equipment_usage_log(user_id);
CREATE INDEX idx_usage_log_started_at ON public.equipment_usage_log(started_at);
CREATE INDEX idx_usage_log_source ON public.equipment_usage_log(source);

-- Enable RLS
ALTER TABLE public.equipment_usage_log ENABLE ROW LEVEL SECURITY;

-- Members can view their own usage logs
CREATE POLICY "Members can view own usage logs"
  ON public.equipment_usage_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all usage logs
CREATE POLICY "Admins can view all usage logs"
  ON public.equipment_usage_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Any authenticated member can log usage
CREATE POLICY "Members can log usage"
  ON public.equipment_usage_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Members can update their own manual usage logs
CREATE POLICY "Members can update own usage logs"
  ON public.equipment_usage_log
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND source = 'manual');

-- Members can delete their own manual usage logs
CREATE POLICY "Members can delete own usage logs"
  ON public.equipment_usage_log
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND source = 'manual');

-- Admins can manage all usage logs
CREATE POLICY "Admins can manage all usage logs"
  ON public.equipment_usage_log
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Allow all authenticated users to read aggregate counts per equipment
-- (for showing "X sessions this month" on equipment detail pages)
CREATE POLICY "Authenticated users can view equipment usage counts"
  ON public.equipment_usage_log
  FOR SELECT
  TO authenticated
  USING (true);
