-- Statut de la roulette : PENDING (collecte de propositions) ou ACTIVE (prête à spinner)
ALTER TABLE roulettes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- Qui a proposé ce segment (null pour les segments créés directement)
ALTER TABLE segments ADD COLUMN proposed_by UUID REFERENCES users(id) ON DELETE SET NULL;
