-- Gather participants
CREATE TABLE public.gather_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gather_id UUID NOT NULL REFERENCES public.gathers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  team SMALLINT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gather_id, user_id)
);

CREATE INDEX idx_gather_participants_gather ON public.gather_participants(gather_id);
CREATE INDEX idx_gather_participants_user ON public.gather_participants(user_id);

-- RLS
ALTER TABLE public.gather_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select" ON public.gather_participants
  FOR SELECT USING (true);

CREATE POLICY "participants_insert" ON public.gather_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_delete" ON public.gather_participants
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );
