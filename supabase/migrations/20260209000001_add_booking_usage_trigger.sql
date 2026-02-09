-- Auto-create usage log entries from bookings
-- Trigger fires when a booking is created, creating a usage log entry
-- with source='booking' linked to the booking

CREATE OR REPLACE FUNCTION create_usage_log_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.equipment_usage_log (
    equipment_id,
    user_id,
    started_at,
    ended_at,
    duration_minutes,
    source,
    booking_id
  ) VALUES (
    NEW.equipment_id,
    NEW.user_id,
    NEW.start_time,
    NEW.end_time,
    EXTRACT(EPOCH FROM (NEW.end_time::timestamp - NEW.start_time::timestamp)) / 60,
    'booking',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_creates_usage_log
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_usage_log_from_booking();

-- Also handle booking updates (time changes)
CREATE OR REPLACE FUNCTION update_usage_log_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.equipment_usage_log
  SET
    started_at = NEW.start_time,
    ended_at = NEW.end_time,
    duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time::timestamp - NEW.start_time::timestamp)) / 60
  WHERE booking_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_updates_usage_log
  AFTER UPDATE OF start_time, end_time ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_log_from_booking();

-- Clean up usage log when booking is deleted
CREATE OR REPLACE FUNCTION delete_usage_log_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.equipment_usage_log
  WHERE booking_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_deletes_usage_log
  BEFORE DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION delete_usage_log_from_booking();
