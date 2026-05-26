-- ============================================================
-- Migration : services, service_detail et program_feature
-- ============================================================

CREATE TABLE service (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       text NOT NULL,
  description text NOT NULL,
  icon        text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE service_detail (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id  uuid NOT NULL REFERENCES service(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE program_feature (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id uuid NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  title      text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_detail_service_id ON service_detail(service_id);
CREATE INDEX idx_service_sort_order ON service(sort_order);
CREATE INDEX idx_service_detail_sort_order ON service_detail(sort_order);
CREATE INDEX idx_program_feature_program_id ON program_feature(program_id);

CREATE TRIGGER trg_service_updated_at
  BEFORE UPDATE ON service
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_service_detail_updated_at
  BEFORE UPDATE ON service_detail
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_program_feature_updated_at
  BEFORE UPDATE ON program_feature
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE service ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_admin_all ON service
  FOR ALL USING (is_admin());

CREATE POLICY service_select_public ON service
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY service_detail_admin_all ON service_detail
  FOR ALL USING (is_admin());

CREATE POLICY service_detail_select_public ON service_detail
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY program_feature_admin_all ON program_feature
  FOR ALL USING (is_admin());

CREATE POLICY program_feature_select_public ON program_feature
  FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1
      FROM program p
      WHERE p.id = program_feature.program_id
        AND p.status = 'published'
        AND p.visibility = 'public'
    )
  );
