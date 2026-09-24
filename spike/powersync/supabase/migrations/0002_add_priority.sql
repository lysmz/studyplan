ALTER TABLE public.spike_tasks
  ADD COLUMN priority text
  CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high'));
