-- ============================================================
-- Migration : modèle éditorial admin (CMS)
-- Entités  : author, category, tag, article
--            + tables de liaison article_category, article_tag
-- ============================================================

CREATE TABLE author (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE category (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL,
  label text NOT NULL,
  description text,
  status publication_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tag (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL,
  label text NOT NULL,
  status publication_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE article (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  cover_image_url text,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  status publication_status NOT NULL DEFAULT 'draft',
  author_id uuid NOT NULL REFERENCES author(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT article_published_at_consistency CHECK (
    (status = 'draft' AND published_at IS NULL)
    OR (status IN ('published', 'archived') AND published_at IS NOT NULL)
  )
);

CREATE TABLE article_category (
  article_id uuid NOT NULL REFERENCES article(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE article_tag (
  article_id uuid NOT NULL REFERENCES article(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, tag_id)
);

CREATE UNIQUE INDEX idx_author_email_unique ON author (email);
CREATE UNIQUE INDEX idx_category_slug_unique ON category (slug);
CREATE UNIQUE INDEX idx_tag_slug_unique ON tag (slug);
CREATE UNIQUE INDEX idx_article_slug_unique ON article (slug);

CREATE INDEX idx_article_status ON article (status);
CREATE INDEX idx_article_published_at ON article (published_at DESC);
CREATE INDEX idx_article_author_id ON article (author_id);
CREATE INDEX idx_category_status ON category (status);
CREATE INDEX idx_tag_status ON tag (status);
CREATE INDEX idx_article_category_category_id ON article_category (category_id);
CREATE INDEX idx_article_tag_tag_id ON article_tag (tag_id);

CREATE TRIGGER trg_author_updated_at
BEFORE UPDATE ON author
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER trg_category_updated_at
BEFORE UPDATE ON category
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER trg_tag_updated_at
BEFORE UPDATE ON tag
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER trg_article_updated_at
BEFORE UPDATE ON article
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
