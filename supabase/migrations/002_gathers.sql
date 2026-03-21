-- Gather status and mode enums
CREATE TYPE gather_status AS ENUM ('open', 'ready', 'live', 'completed', 'cancelled');
CREATE TYPE gather_mode AS ENUM ('5v5', '6v6');

-- Gathers table
CREATE TABLE public.gathers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status gather_status NOT NULL DEFAULT 'open',
  mode gather_mode NOT NULL DEFAULT '5v5',
  max_players SMALLINT NOT NULL GENERATED ALWAYS AS (
    CASE WHEN mode = '5v5' THEN 10 ELSE 12 END
  ) STORED,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ready_at TIMESTAMPTZ,
  live_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_gathers_status ON public.gathers(status);
CREATE INDEX idx_gathers_created_at ON public.gathers(created_at DESC);

-- RLS
ALTER TABLE public.gathers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gathers_select" ON public.gathers
  FOR SELECT USING (true);

CREATE POLICY "gathers_insert" ON public.gathers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "gathers_update" ON public.gathers
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );
