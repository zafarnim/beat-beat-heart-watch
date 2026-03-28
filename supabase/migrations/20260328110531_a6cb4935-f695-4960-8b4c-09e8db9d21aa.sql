-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true);

-- Create recordings metadata table
CREATE TABLE public.recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds NUMERIC,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (no auth yet)
CREATE POLICY "Anyone can view recordings" ON public.recordings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert recordings" ON public.recordings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete recordings" ON public.recordings FOR DELETE USING (true);

-- Storage policies - allow public access
CREATE POLICY "Anyone can view recording files" ON storage.objects FOR SELECT USING (bucket_id = 'recordings');
CREATE POLICY "Anyone can upload recording files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recordings');
CREATE POLICY "Anyone can delete recording files" ON storage.objects FOR DELETE USING (bucket_id = 'recordings');