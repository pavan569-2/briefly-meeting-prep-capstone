-- 1. Create table
CREATE TABLE public.meeting_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_brief_id uuid NULL REFERENCES public.meeting_briefs(id) ON DELETE SET NULL,
  title text NOT NULL,
  objective text NOT NULL,
  agenda text NOT NULL,
  context text NULL,
  attendees text NULL,
  previous_notes text NULL,
  generated_brief jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX meeting_briefs_user_id_idx ON public.meeting_briefs(user_id);
CREATE INDEX meeting_briefs_created_at_idx ON public.meeting_briefs(created_at DESC);
CREATE INDEX meeting_briefs_parent_brief_id_idx ON public.meeting_briefs(parent_brief_id);

-- 3. Updated_at Trigger
CREATE OR REPLACE FUNCTION public.set_meeting_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meeting_briefs_updated_at
BEFORE UPDATE ON public.meeting_briefs
FOR EACH ROW EXECUTE FUNCTION public.set_meeting_briefs_updated_at();

-- 4. Enable RLS
ALTER TABLE public.meeting_briefs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (strictly bound to auth.uid())
CREATE POLICY "Users can view own meeting briefs"
  ON public.meeting_briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meeting briefs"
  ON public.meeting_briefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meeting briefs"
  ON public.meeting_briefs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meeting briefs"
  ON public.meeting_briefs FOR DELETE
  USING (auth.uid() = user_id);
