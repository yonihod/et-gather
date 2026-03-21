-- Single-row table for cached server status
CREATE TABLE public.server_status (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  online BOOLEAN NOT NULL DEFAULT false,
  hostname TEXT NOT NULL DEFAULT '',
  map TEXT NOT NULL DEFAULT '',
  players JSONB NOT NULL DEFAULT '[]',
  max_players INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with empty row
INSERT INTO public.server_status (id) VALUES (1);

-- Public read, service role write
ALTER TABLE public.server_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "server_status_select" ON public.server_status
  FOR SELECT USING (true);
