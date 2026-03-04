-- ─────────────────────────────────────────────────────────────────────────────
-- SpinMyLunch — Migration initiale V1
-- 12 tables, 4 domaines : Utilisateurs, Groupes, Roulettes, Votes + Gamification
-- ─────────────────────────────────────────────────────────────────────────────

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enum Types ──────────────────────────────────────────────────────────────

CREATE TYPE user_theme AS ENUM ('LIGHT', 'DARK', 'NEON');
CREATE TYPE food_avatar AS ENUM ('PIZZA', 'SUSHI', 'BURGER', 'SALADE');
CREATE TYPE group_role AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE roulette_mode AS ENUM ('EQUAL', 'WEIGHTED', 'RANDOM');
CREATE TYPE vote_mode AS ENUM ('MAJORITY', 'APPROVAL', 'POINTS');
CREATE TYPE vote_status AS ENUM ('PENDING', 'ACTIVE', 'CLOSED');

-- ─── Domaine : Utilisateurs ──────────────────────────────────────────────────

CREATE TABLE users (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id        VARCHAR(255) UNIQUE NOT NULL,
    email            VARCHAR(255) UNIQUE NOT NULL,
    name             VARCHAR(255) NOT NULL,
    picture_url      TEXT,
    level            INTEGER     NOT NULL DEFAULT 1,
    xp               INTEGER     NOT NULL DEFAULT 0,
    streak_count     INTEGER     NOT NULL DEFAULT 0,
    last_active_at   TIMESTAMPTZ,
    food_avatar_type food_avatar NOT NULL DEFAULT 'PIZZA',
    preferences_json JSONB       NOT NULL DEFAULT '{}',
    theme            user_theme  NOT NULL DEFAULT 'DARK',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens JWT (httpOnly cookie, 7 jours)
CREATE TABLE refresh_tokens (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   VARCHAR(255) NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Domaine : Groupes ───────────────────────────────────────────────────────

CREATE TABLE groups (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    admin_user_id UUID        NOT NULL REFERENCES users(id),
    invite_code   VARCHAR(20)  UNIQUE NOT NULL,
    invite_qr_url TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_members (
    id        UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id  UUID       NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id   UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      group_role NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
);

-- ─── Domaine : Roulettes ─────────────────────────────────────────────────────

CREATE TABLE roulettes (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id         UUID          REFERENCES groups(id) ON DELETE CASCADE,
    creator_id       UUID          NOT NULL REFERENCES users(id),
    name             VARCHAR(255)  NOT NULL,
    mode             roulette_mode NOT NULL DEFAULT 'EQUAL',
    is_surprise_mode BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE segments (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    roulette_id UUID          NOT NULL REFERENCES roulettes(id) ON DELETE CASCADE,
    label       VARCHAR(255)  NOT NULL,
    weight      DECIMAL(8,4)  NOT NULL DEFAULT 1.0,
    color       VARCHAR(7)    NOT NULL DEFAULT '#FF6B35',
    position    INTEGER       NOT NULL,
    CONSTRAINT chk_weight_positive CHECK (weight > 0)
);

CREATE TABLE spin_results (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    roulette_id        UUID          NOT NULL REFERENCES roulettes(id),
    group_id           UUID          REFERENCES groups(id),
    winning_segment_id UUID          NOT NULL REFERENCES segments(id),
    server_angle       DECIMAL(10,4) NOT NULL,
    spun_by            UUID          NOT NULL REFERENCES users(id),
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Domaine : Votes ─────────────────────────────────────────────────────────

CREATE TABLE vote_sessions (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    roulette_id    UUID        REFERENCES roulettes(id),
    group_id       UUID        NOT NULL REFERENCES groups(id),
    mode           vote_mode   NOT NULL DEFAULT 'MAJORITY',
    status         vote_status NOT NULL DEFAULT 'PENDING',
    quorum_percent INTEGER     NOT NULL DEFAULT 50,
    timeout_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_quorum CHECK (quorum_percent BETWEEN 1 AND 100)
);

CREATE TABLE vote_options (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID         NOT NULL REFERENCES vote_sessions(id) ON DELETE CASCADE,
    segment_id UUID         REFERENCES segments(id),
    label      VARCHAR(255) NOT NULL
);

CREATE TABLE votes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID        NOT NULL REFERENCES vote_sessions(id) ON DELETE CASCADE,
    option_id  UUID        NOT NULL REFERENCES vote_options(id),
    user_id    UUID        NOT NULL REFERENCES users(id),
    points     INTEGER     NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_points CHECK (points >= 0),
    CONSTRAINT uq_vote_per_option UNIQUE (session_id, user_id, option_id)
);

-- ─── Domaine : Gamification ──────────────────────────────────────────────────

CREATE TABLE badges (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url    TEXT
);

CREATE TABLE user_badges (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id  UUID        NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- ─── Index de performance ─────────────────────────────────────────────────────

CREATE INDEX idx_users_google_id         ON users(google_id);
CREATE INDEX idx_users_email             ON users(email);
CREATE INDEX idx_refresh_tokens_user     ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires  ON refresh_tokens(expires_at);
CREATE INDEX idx_groups_invite_code      ON groups(invite_code);
CREATE INDEX idx_group_members_group     ON group_members(group_id);
CREATE INDEX idx_group_members_user      ON group_members(user_id);
CREATE INDEX idx_roulettes_group         ON roulettes(group_id);
CREATE INDEX idx_roulettes_creator       ON roulettes(creator_id);
CREATE INDEX idx_segments_roulette       ON segments(roulette_id);
CREATE INDEX idx_spin_results_roulette   ON spin_results(roulette_id);
CREATE INDEX idx_spin_results_group      ON spin_results(group_id);
CREATE INDEX idx_spin_results_created    ON spin_results(created_at DESC);
CREATE INDEX idx_vote_sessions_group     ON vote_sessions(group_id);
CREATE INDEX idx_vote_sessions_status    ON vote_sessions(status);
CREATE INDEX idx_votes_session           ON votes(session_id);
CREATE INDEX idx_votes_user              ON votes(user_id);
CREATE INDEX idx_user_badges_user        ON user_badges(user_id);

-- ─── Données initiales : Badges ──────────────────────────────────────────────

INSERT INTO badges (code, name, description, icon_url) VALUES
    ('FIRST_SPIN',       'Premier Spin',     'Votre tout premier spin de roulette !',           '/badges/first-spin.svg'),
    ('FOODIE_EXPLORER',  'Foodie Explorer',  '10 restaurants ou plats différents découverts',   '/badges/foodie-explorer.svg'),
    ('STREAK_7',         '7-Day Streak',     '7 jours de connexion consécutifs',                '/badges/streak-7.svg'),
    ('LUCKY_SPIN',       'Lucky Spin',       'Tombé 3 fois de suite sur le même segment',       '/badges/lucky-spin.svg'),
    ('LEADER_SUPREME',   'Leader Suprême',   'Admin de 3 groupes actifs simultanément',         '/badges/leader-supreme.svg'),
    ('WORLD_TOUR',       'Tour du Monde',    '20 cuisines différentes essayées',                '/badges/world-tour.svg'),
    ('SOCIAL_BUTTERFLY', 'Social Butterfly', 'Invité 10 membres dans vos groupes',              '/badges/social-butterfly.svg'),
    ('SPIN_MASTER',      'Spin Master',      '100 spins effectués — vous êtes un pro !',        '/badges/spin-master.svg');
