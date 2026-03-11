-- Ajoute un lien vers la roulette de départage générée automatiquement en cas d'égalité
ALTER TABLE vote_sessions
    ADD COLUMN IF NOT EXISTS tiebreaker_roulette_id UUID
        REFERENCES roulettes(id) ON DELETE SET NULL;
