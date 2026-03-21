-- Materialized view for leaderboard performance
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
