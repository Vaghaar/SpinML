-- Force winning_segment_id FK to ON DELETE CASCADE.
-- V5 incorrectly set it to ON DELETE SET NULL on a NOT NULL column.
-- V6 attempted this fix but may not have been applied in all environments.

ALTER TABLE spin_results DROP CONSTRAINT IF EXISTS spin_results_winning_segment_id_fkey;

ALTER TABLE spin_results
    ADD CONSTRAINT spin_results_winning_segment_id_fkey
        FOREIGN KEY (winning_segment_id) REFERENCES segments(id) ON DELETE CASCADE;
