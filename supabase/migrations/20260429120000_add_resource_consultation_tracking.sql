ALTER TABLE resource
ADD COLUMN consultation_count integer NOT NULL DEFAULT 0,
ADD COLUMN last_consulted_at timestamptz;

CREATE INDEX idx_resource_last_consulted_at ON resource (last_consulted_at DESC);
