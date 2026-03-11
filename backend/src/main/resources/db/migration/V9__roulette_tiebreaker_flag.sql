-- Marque les roulettes générées automatiquement pour départager un vote ex-aequo
ALTER TABLE roulettes
    ADD COLUMN IF NOT EXISTS is_tiebreaker_roulette BOOLEAN NOT NULL DEFAULT FALSE;
