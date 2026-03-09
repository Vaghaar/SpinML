-- Correction des FK manquantes pour permettre la suppression d'un groupe
-- en cascade sur les vote_sessions, spin_results (roulette_id / group_id)

-- vote_sessions.group_id → CASCADE (supprimer les sessions avec le groupe)
ALTER TABLE vote_sessions
    DROP CONSTRAINT IF EXISTS vote_sessions_group_id_fkey,
    ADD CONSTRAINT vote_sessions_group_id_fkey
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- vote_sessions.roulette_id → SET NULL (garder la session si la roulette est supprimée séparément)
ALTER TABLE vote_sessions
    DROP CONSTRAINT IF EXISTS vote_sessions_roulette_id_fkey,
    ADD CONSTRAINT vote_sessions_roulette_id_fkey
        FOREIGN KEY (roulette_id) REFERENCES roulettes(id) ON DELETE SET NULL;

-- spin_results.roulette_id → CASCADE (supprimer l'historique avec la roulette)
ALTER TABLE spin_results
    DROP CONSTRAINT IF EXISTS spin_results_roulette_id_fkey,
    ADD CONSTRAINT spin_results_roulette_id_fkey
        FOREIGN KEY (roulette_id) REFERENCES roulettes(id) ON DELETE CASCADE;

-- spin_results.group_id → SET NULL (garder les stats mais sans référence de groupe)
ALTER TABLE spin_results
    DROP CONSTRAINT IF EXISTS spin_results_group_id_fkey,
    ADD CONSTRAINT spin_results_group_id_fkey
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- spin_results.winning_segment_id → SET NULL (segment supprimé avec la roulette)
ALTER TABLE spin_results
    DROP CONSTRAINT IF EXISTS spin_results_winning_segment_id_fkey,
    ADD CONSTRAINT spin_results_winning_segment_id_fkey
        FOREIGN KEY (winning_segment_id) REFERENCES segments(id) ON DELETE SET NULL;
