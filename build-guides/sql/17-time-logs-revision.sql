-- Tambahkan REVISION_REQUESTED ke tipe enum time_log_status
ALTER TYPE time_log_status ADD VALUE IF NOT EXISTS 'REVISION_REQUESTED';

-- Tambahkan kolom untuk negosiasi jam kerja di tabel time_logs
ALTER TABLE time_logs
ADD COLUMN IF NOT EXISTS proposed_hours numeric(5,2),
ADD COLUMN IF NOT EXISTS negotiation_notes text;
