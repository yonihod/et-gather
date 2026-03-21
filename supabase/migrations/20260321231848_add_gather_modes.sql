-- Add 3v3 and 4v4 modes to the enum
ALTER TYPE gather_mode ADD VALUE IF NOT EXISTS '3v3' BEFORE '5v5';
ALTER TYPE gather_mode ADD VALUE IF NOT EXISTS '4v4' BEFORE '5v5';
