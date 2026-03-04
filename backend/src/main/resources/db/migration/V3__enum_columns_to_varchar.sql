-- Hibernate 6 envoie les enums Java en VARCHAR; convertir les colonnes custom PG enum en VARCHAR

ALTER TABLE users
    ALTER COLUMN food_avatar_type TYPE VARCHAR(50) USING food_avatar_type::varchar,
    ALTER COLUMN theme             TYPE VARCHAR(50) USING theme::varchar;

ALTER TABLE group_members
    ALTER COLUMN role TYPE VARCHAR(50) USING role::varchar;

ALTER TABLE roulettes
    ALTER COLUMN mode TYPE VARCHAR(50) USING mode::varchar;

ALTER TABLE vote_sessions
    ALTER COLUMN mode   TYPE VARCHAR(50) USING mode::varchar,
    ALTER COLUMN status TYPE VARCHAR(50) USING status::varchar;
