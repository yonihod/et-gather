-- ========================================
-- PROFILES (extends auth.users)
-- ========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  et_nickname TEXT,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'organizer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Player'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- GATHERS
-- ========================================
CREATE TYPE gather_status AS ENUM ('open', 'ready', 'live', 'completed', 'cancelled');
CREATE TYPE gather_mode AS ENUM ('5v5', '6v6');

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

-- ========================================
-- GATHER PARTICIPANTS
-- ========================================
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

-- ========================================
-- ATTENDANCE STATS (materialized view)
-- ========================================
CREATE MATERIALIZED VIEW public.attendance_stats AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  p.et_nickname,
  COUNT(gp.id) FILTER (WHERE g.status = 'completed') AS total_gathers,
  COUNT(gp.id) FILTER (
    WHERE g.status = 'completed'
    AND g.completed_at >= now() - INTERVAL '30 days'
  ) AS gathers_last_30_days,
  (COUNT(gp.id) FILTER (WHERE g.status = 'completed')) * 10 AS attendance_points
FROM public.profiles p
LEFT JOIN public.gather_participants gp ON gp.user_id = p.id
LEFT JOIN public.gathers g ON g.id = gp.gather_id
GROUP BY p.id, p.display_name, p.avatar_url, p.et_nickname;

CREATE UNIQUE INDEX idx_attendance_stats_user ON public.attendance_stats(user_id);
CREATE INDEX idx_attendance_stats_points ON public.attendance_stats(attendance_points DESC);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_attendance_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.attendance_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for time-filtered leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(since_date TIMESTAMPTZ)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  et_nickname TEXT,
  total_gathers BIGINT,
  gathers_last_30_days BIGINT,
  attendance_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    p.et_nickname,
    COUNT(gp.id) FILTER (WHERE g.status = 'completed' AND g.completed_at >= since_date) AS total_gathers,
    COUNT(gp.id) FILTER (WHERE g.status = 'completed' AND g.completed_at >= since_date) AS gathers_last_30_days,
    (COUNT(gp.id) FILTER (WHERE g.status = 'completed' AND g.completed_at >= since_date)) * 10 AS attendance_points
  FROM public.profiles p
  LEFT JOIN public.gather_participants gp ON gp.user_id = p.id
  LEFT JOIN public.gathers g ON g.id = gp.gather_id
  GROUP BY p.id, p.display_name, p.avatar_url, p.et_nickname
  HAVING COUNT(gp.id) FILTER (WHERE g.status = 'completed' AND g.completed_at >= since_date) > 0
  ORDER BY attendance_points DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable realtime on gathers and participants
ALTER PUBLICATION supabase_realtime ADD TABLE public.gathers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gather_participants;
