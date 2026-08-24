CREATE TABLE public.consultation_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  offer_slug text NOT NULL,
  country text NOT NULL,
  provider_slug text NOT NULL,
  provider_name text NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  duration_minutes integer NOT NULL,
  revenue_share_pct numeric(5,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'interest' CHECK (status IN ('interest','awaiting_payment','paid','cancelled')),
  name text NOT NULL,
  email text NOT NULL,
  timezone text NOT NULL,
  preferred_times text NOT NULL,
  help_with text,
  stripe_session_id text,
  stripe_payment_status text,
  anonymous_session_id text,
  user_agent text
);

GRANT ALL ON public.consultation_bookings TO service_role;

ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX consultation_bookings_created_idx ON public.consultation_bookings (created_at DESC);
CREATE INDEX consultation_bookings_offer_idx ON public.consultation_bookings (offer_slug, created_at DESC);
CREATE INDEX consultation_bookings_email_idx ON public.consultation_bookings (email, created_at DESC);
CREATE UNIQUE INDEX consultation_bookings_stripe_session_idx ON public.consultation_bookings (stripe_session_id) WHERE stripe_session_id IS NOT NULL;