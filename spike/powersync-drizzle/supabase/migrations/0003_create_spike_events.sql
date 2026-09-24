CREATE TABLE public.spike_events (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  type text NOT NULL CHECK (type IN ('exam', 'deadline', 'registration', 'lecture', 'other')),
  importance text NOT NULL CHECK (importance IN ('high', 'medium', 'low')),
  is_multi_day boolean NOT NULL DEFAULT false,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE INDEX spike_events_owner_id_idx ON public.spike_events(owner_id);
CREATE INDEX spike_events_start_date_idx ON public.spike_events(start_date);

ALTER TABLE public.spike_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spike_events_select_own"
  ON public.spike_events FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "spike_events_insert_own"
  ON public.spike_events FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "spike_events_update_own"
  ON public.spike_events FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "spike_events_delete_own"
  ON public.spike_events FOR DELETE
  USING (auth.uid() = owner_id);

REVOKE ALL ON TABLE public.spike_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.spike_events TO authenticated;
GRANT SELECT ON TABLE public.spike_events TO powersync_role;

ALTER PUBLICATION powersync ADD TABLE public.spike_events;
