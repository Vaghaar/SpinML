-- Rendre google_id nullable pour les comptes invités
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;

-- Colonne invité
ALTER TABLE users ADD COLUMN is_guest BOOLEAN NOT NULL DEFAULT FALSE;

-- Un email unique mais null autorisé pour les invités (l'email généré est unique)
-- La contrainte unique existante sur email reste, mais les invités ont un email aléatoire
