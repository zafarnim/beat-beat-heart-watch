CREATE TYPE public.scan_result AS ENUM ('normal', 'clear_classification', 'inconclusive', 'emergency', 'try_again');

CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES public.recordings(id) ON DELETE SET NULL,
  result scan_result NOT NULL,
  result_title text NOT NULL,
  result_description text NOT NULL,
  condition_name text,
  recommended_steps text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_to_kry boolean NOT NULL DEFAULT false
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert scans" ON public.scans FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can view scans" ON public.scans FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update scans" ON public.scans FOR UPDATE TO public USING (true);