-- Fix : suppression en cascade des spin_results quand une roulette ou un segment est supprimé.
-- La contrainte NOT NULL sur winning_segment_id empêchait le SET NULL d'Hibernate.

ALTER TABLE spin_results
    DROP CONSTRAINT IF EXISTS spin_results_roulette_id_fkey,
    DROP CONSTRAINT IF EXISTS spin_results_winning_segment_id_fkey;

ALTER TABLE spin_results
    ADD CONSTRAINT spin_results_roulette_id_fkey
        FOREIGN KEY (roulette_id) REFERENCES roulettes(id) ON DELETE CASCADE,
    ADD CONSTRAINT spin_results_winning_segment_id_fkey
        FOREIGN KEY (winning_segment_id) REFERENCES segments(id) ON DELETE CASCADE;
