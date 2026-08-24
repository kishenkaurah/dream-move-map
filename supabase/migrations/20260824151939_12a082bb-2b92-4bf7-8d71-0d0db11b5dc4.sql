CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  anonymous_session_id text NOT NULL,
  assessment_attempt_id text,
  page text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.analytics_events TO anon;
GRANT INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record analytics events"
  ON public.analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(event_name) BETWEEN 1 AND 64
    AND char_length(anonymous_session_id) BETWEEN 1 AND 64
    AND (assessment_attempt_id IS NULL OR char_length(assessment_attempt_id) <= 64)
    AND (page IS NULL OR char_length(page) <= 200)
    AND pg_column_size(metadata) <= 2048
  );

CREATE UNIQUE INDEX analytics_events_dedupe_idx
  ON public.analytics_events (anonymous_session_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX analytics_events_created_at_idx ON public.analytics_events (created_at DESC);
CREATE INDEX analytics_events_event_name_idx ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX analytics_events_session_idx ON public.analytics_events (anonymous_session_id, created_at DESC);
CREATE INDEX analytics_events_attempt_idx ON public.analytics_events (assessment_attempt_id, created_at DESC);