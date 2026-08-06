ALTER TABLE public.leads ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS region_preference text;