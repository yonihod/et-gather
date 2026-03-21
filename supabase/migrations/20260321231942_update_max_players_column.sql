-- Update generated column to handle 3v3 and 4v4
ALTER TABLE public.gathers DROP COLUMN max_players;
ALTER TABLE public.gathers ADD COLUMN max_players SMALLINT NOT NULL GENERATED ALWAYS AS (
  CASE
    WHEN mode = '3v3' THEN 6
    WHEN mode = '4v4' THEN 8
    WHEN mode = '5v5' THEN 10
    ELSE 12
  END
) STORED;
