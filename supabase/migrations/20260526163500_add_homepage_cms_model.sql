-- ============================================================
-- Migration : modèle CMS homepage
-- Entités  : statistic, partner, testimonial, team_member
-- ============================================================

CREATE TABLE
    statistic (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
        label text NOT NULL,
        value text NOT NULL,
        suffix text,
        sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
        status publication_status NOT NULL DEFAULT 'draft',
        created_at timestamptz NOT NULL DEFAULT now (),
        updated_at timestamptz NOT NULL DEFAULT now ()
    );

CREATE TABLE
    partner (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
        name text NOT NULL,
        logo_url text NOT NULL,
        website_url text,
        sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
        status publication_status NOT NULL DEFAULT 'draft',
        created_at timestamptz NOT NULL DEFAULT now (),
        updated_at timestamptz NOT NULL DEFAULT now ()
    );

CREATE TABLE
    testimonial (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
        quote text NOT NULL,
        author_name text NOT NULL,
        author_role text,
        company text,
        avatar_url text,
        sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
        status publication_status NOT NULL DEFAULT 'draft',
        created_at timestamptz NOT NULL DEFAULT now (),
        updated_at timestamptz NOT NULL DEFAULT now ()
    );

CREATE TABLE
    team_member (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
        full_name text NOT NULL,
        role text NOT NULL,
        bio text,
        avatar_url text,
        linkedin_url text,
        sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
        status publication_status NOT NULL DEFAULT 'draft',
        created_at timestamptz NOT NULL DEFAULT now (),
        updated_at timestamptz NOT NULL DEFAULT now ()
    );

CREATE INDEX idx_statistic_status_order ON statistic (status, sort_order, created_at);

CREATE INDEX idx_partner_status_order ON partner (status, sort_order, created_at);

CREATE INDEX idx_testimonial_status_order ON testimonial (status, sort_order, created_at);

CREATE INDEX idx_team_member_status_order ON team_member (status, sort_order, created_at);

CREATE TRIGGER trg_statistic_updated_at BEFORE
UPDATE ON statistic FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_partner_updated_at BEFORE
UPDATE ON partner FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_testimonial_updated_at BEFORE
UPDATE ON testimonial FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_team_member_updated_at BEFORE
UPDATE ON team_member FOR EACH ROW EXECUTE FUNCTION update_updated_at();
