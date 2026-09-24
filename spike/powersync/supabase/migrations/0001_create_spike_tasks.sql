CREATE TABLE public.spike_tasks (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX spike_tasks_owner_id_idx ON public.spike_tasks(owner_id);
CREATE INDEX spike_tasks_status_idx ON public.spike_tasks(status);

ALTER TABLE public.spike_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spike_tasks_select_own"
  ON public.spike_tasks FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "spike_tasks_insert_own"
  ON public.spike_tasks FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "spike_tasks_update_own"
  ON public.spike_tasks FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "spike_tasks_delete_own"
  ON public.spike_tasks FOR DELETE
  USING (auth.uid() = owner_id);
