-- Allow gather creator to update participant team assignments (for drag & drop)
CREATE POLICY "gather_creator_can_update_participants"
  ON public.gather_participants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.gathers g
      WHERE g.id = gather_id AND g.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin')
    )
  );

-- Gather chat messages
CREATE TABLE public.gather_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gather_id UUID NOT NULL REFERENCES public.gathers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gather_messages_gather ON public.gather_messages(gather_id, created_at);

ALTER TABLE public.gather_messages ENABLE ROW LEVEL SECURITY;

-- Only gather participants can read messages
CREATE POLICY "participants_can_read_messages"
  ON public.gather_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gather_participants gp
      WHERE gp.gather_id = gather_messages.gather_id
      AND gp.user_id = auth.uid()
    )
  );

-- Only gather participants can send messages
CREATE POLICY "participants_can_send_messages"
  ON public.gather_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.gather_participants gp
      WHERE gp.gather_id = gather_messages.gather_id
      AND gp.user_id = auth.uid()
    )
  );

-- Enable realtime for gather_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.gather_messages;
