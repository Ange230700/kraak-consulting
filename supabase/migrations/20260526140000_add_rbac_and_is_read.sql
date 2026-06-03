-- Add is_read to support_request
ALTER TABLE support_request
  ADD COLUMN is_read boolean NOT NULL DEFAULT false;

CREATE INDEX idx_support_request_unread
  ON support_request (user_id, is_read)
  WHERE is_read = false;

-- Add employe role to the enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'employe';
