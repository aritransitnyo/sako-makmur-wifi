-- ==============================================================================
-- PATCH AUDIT SISTEM INFORMASI AKUNTANSI & KONTROL INTERNAL
-- Aplikasi: Sako Makmur WiFi (LSM NetOS)
-- Standar : ISACA CISA / ACID Transaction Integrity / Immutable Accounting Ledger
-- Target  : Supabase PostgreSQL Database (https://quxkfnlizpsdccuomqdd.supabase.co)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Payment history archive: immutable monthly customer payments
CREATE TABLE IF NOT EXISTS payment_history (
    id TEXT PRIMARY KEY,
    subscriber_id TEXT NOT NULL,
    subscriber_name TEXT NOT NULL,
    username_pppoe TEXT,
    period_key TEXT NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    package_name TEXT NOT NULL DEFAULT 'Paket Internet',
    package_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (package_price >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Tunai', 'Transfer Bank')),
    receipt_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (subscriber_id, period_key)
);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscriber ON payment_history(subscriber_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_period ON payment_history(period_key);

-- Status pending_installation = akun PPPoE sudah disiapkan, tetapi layanan belum terpasang.
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS chk_subscribers_status;
ALTER TABLE subscribers ADD CONSTRAINT chk_subscribers_status
  CHECK (status IN ('active', 'suspended', 'terminated', 'pending_installation'));

-- 1. KONTROL INTEGRITAS DATA: CHECK CONSTRAINT TABEL EXPENSES
--    Mencegah pencatatan nominal pengeluaran/pemasukan bernilai minus (< 0)
-- ------------------------------------------------------------------------------
ALTER TABLE expenses 
    DROP CONSTRAINT IF EXISTS chk_expenses_amount_non_negative;

ALTER TABLE expenses 
    ADD CONSTRAINT chk_expenses_amount_non_negative 
    CHECK (amount >= 0);

COMMENT ON CONSTRAINT chk_expenses_amount_non_negative ON expenses 
    IS 'Memastikan nominal transaksi kas tidak boleh negatif (< 0)';


-- ------------------------------------------------------------------------------
-- 2. KONTROL INTEGRITAS DATA: CHECK CONSTRAINT TABEL SUBSCRIBERS
--    Mencegah penetapan tarif paket iuran pelanggan bernilai minus (< 0)
-- ------------------------------------------------------------------------------
ALTER TABLE subscribers 
    DROP CONSTRAINT IF EXISTS chk_subscribers_package_price_non_negative;

ALTER TABLE subscribers 
    ADD CONSTRAINT chk_subscribers_package_price_non_negative 
    CHECK (package_price >= 0);

COMMENT ON CONSTRAINT chk_subscribers_package_price_non_negative ON subscribers 
    IS 'Memastikan tarif paket iuran bulanan pelanggan tidak boleh bernilai negatif';


-- ------------------------------------------------------------------------------
-- 3. AUDIT KONTROL INTERNAL & IMMUTABILITY: FUNCTION & TRIGGER PENGUNCIAN ARSIP
--    Menolak (RAISE EXCEPTION) operasi UPDATE atau DELETE pada transaksi kas
--    jika tanggal transaksi berada pada periode bulan yang sudah ditutup buku
--    (dicocokkan dengan kolom `period_key` (YYYY-MM) di tabel `monthly_closings`)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_expense_period_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_target_period TEXT;
    v_is_closed BOOLEAN;
BEGIN
    -- Skenario 1: Operasi DELETE
    IF (TG_OP = 'DELETE') THEN
        -- Ekstrak format YYYY-MM dari kolom tanggal (mengambil 7 karakter pertama, misal: '2026-09')
        v_target_period := SUBSTRING(OLD.date::TEXT FROM 1 FOR 7);

        -- Verifikasi apakah periode tersebut sudah dibukukan di tabel monthly_closings
        SELECT EXISTS (
            SELECT 1 FROM monthly_closings 
            WHERE period_key = v_target_period
        ) INTO v_is_closed;

        IF v_is_closed THEN
            RAISE EXCEPTION 'Audit Violation [IS-LOCK-001]: Transaksi kas tanggal % (Periode %) telah TUTUP BUKU dan berstatus LOCKED. Penghapusan data ditolak demi integritas jejak audit konsorsium!', OLD.date, v_target_period;
        END IF;

        RETURN OLD;

    -- Skenario 2: Operasi UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Periksa periode data sebelum perubahan (OLD)
        v_target_period := SUBSTRING(OLD.date::TEXT FROM 1 FOR 7);
        SELECT EXISTS (
            SELECT 1 FROM monthly_closings 
            WHERE period_key = v_target_period
        ) INTO v_is_closed;

        IF v_is_closed THEN
            RAISE EXCEPTION 'Audit Violation [IS-LOCK-002]: Transaksi kas tanggal % (Periode %) telah TUTUP BUKU dan berstatus LOCKED. Modifikasi data ditolak!', OLD.date, v_target_period;
        END IF;

        -- Periksa juga jika tanggal baru (NEW) mencoba dimanipulasi ke periode yang sudah ditutup
        v_target_period := SUBSTRING(NEW.date::TEXT FROM 1 FOR 7);
        SELECT EXISTS (
            SELECT 1 FROM monthly_closings 
            WHERE period_key = v_target_period
        ) INTO v_is_closed;

        IF v_is_closed THEN
            RAISE EXCEPTION 'Audit Violation [IS-LOCK-003]: Tidak diizinkan memindahkan transaksi kas ke Periode % yang telah TUTUP BUKU!', v_target_period;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang Trigger ke tabel expenses
DROP TRIGGER IF EXISTS trg_protect_closed_expenses ON expenses;

CREATE TRIGGER trg_protect_closed_expenses
BEFORE UPDATE OR DELETE ON expenses
FOR EACH ROW
EXECUTE FUNCTION check_expense_period_lock();

COMMENT ON FUNCTION check_expense_period_lock() 
    IS 'Fungsi proteksi CISA untuk mencegah perusakan data transaksi buku kas periode tertutup';

-- ==============================================================================
-- SELESAI: Script ini siap dijalankan langsung di Supabase SQL Editor.
-- ==============================================================================
