-- SQL Schema for iAgri VIP Investment Platform
-- Paste this script directly into your Supabase SQL Editor to initialize all tables!
-- Ce script est 100% protégé contre les erreurs et peut être exécuté plusieurs fois en toute sécurité.

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0,
    daily_earnings NUMERIC NOT NULL DEFAULT 0,
    total_earnings NUMERIC NOT NULL DEFAULT 0,
    total_deposits NUMERIC NOT NULL DEFAULT 0,
    total_withdrawals NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    referral_code TEXT NOT NULL UNIQUE,
    referred_by_code TEXT,
    bonus_points NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_admin BOOLEAN NOT NULL DEFAULT false,
    last_daily_checkin TEXT
);

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    daily_return NUMERIC NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 10,
    total_return NUMERIC NOT NULL DEFAULT 0,
    badge TEXT,
    max_purchase_count INTEGER NOT NULL DEFAULT 3,
    is_blocked BOOLEAN NOT NULL DEFAULT false
);

-- 3. Create Investments Table
CREATE TABLE IF NOT EXISTS public.investments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    plan_name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    daily_return NUMERIC NOT NULL DEFAULT 0,
    total_weeks INTEGER NOT NULL DEFAULT 1,
    days_active INTEGER NOT NULL DEFAULT 0,
    total_return NUMERIC NOT NULL DEFAULT 0,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_claim_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    duration_days INTEGER NOT NULL DEFAULT 10
);

-- 4. Create Deposits Table
CREATE TABLE IF NOT EXISTS public.deposits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    whatsapp TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    reference TEXT,
    payment_capture TEXT, -- Base64 or URL
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    whatsapp TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create Referral Commissions Table
CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level IN (1, 2, 3)),
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create Support Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'admin')),
    message TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL, -- 'all' or user_id
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    read_by JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 9. Create Bonus Codes Table
CREATE TABLE IF NOT EXISTS public.bonus_codes (
    code TEXT PRIMARY KEY,
    amount NUMERIC NOT NULL DEFAULT 0,
    claimed_by JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings
    created_by TEXT NOT NULL,
    usage_limit INTEGER DEFAULT 100
);

-- 10. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    whatsapp_group_link TEXT NOT NULL DEFAULT 'https://chat.whatsapp.com/ExempleGroupeInvesta',
    telegram_channel_link TEXT NOT NULL DEFAULT 'https://t.me/InvestaPremiumCanal'
);

-- Enable Realtime safely without throwing errors if already configured or if publication does not exist
DO $$
DECLARE
    tbl_name text;
    tables_to_add text[] := ARRAY['users', 'products', 'investments', 'deposits', 'withdrawals', 'tickets', 'notifications', 'settings'];
BEGIN
    -- Check if the publication 'supabase_realtime' exists at all
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        FOREACH tbl_name IN ARRAY tables_to_add LOOP
            -- Check if the table is already in the publication
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_publication_rel pr 
                JOIN pg_publication p ON p.oid = pr.pubid 
                JOIN pg_class c ON c.oid = pr.prrelid 
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE p.pubname = 'supabase_realtime' 
                  AND c.relname = tbl_name
                  AND n.nspname = 'public'
            ) THEN
                BEGIN
                    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl_name);
                EXCEPTION WHEN OTHERS THEN
                    -- Ignore failures cleanly
                    RAISE NOTICE 'Could not add table % to publication: %', tbl_name, SQLERRM;
                END;
            END IF;
        END LOOP;
    ELSE
        RAISE NOTICE 'Publication supabase_realtime not found. Skip enabling realtime publication.';
    END IF;
END $$;

-- SEED PRIMARY INITIAL DATA --

-- Initial Products
INSERT INTO public.products (id, name, price, daily_return, duration_days, total_return, badge, max_purchase_count, is_blocked)
VALUES 
('vip-1', 'VIP Bronze - Standard', 3000, 600, 10, 6000, 'Populaire', 3, false),
('vip-2', 'VIP Silver - Pro', 10000, 2500, 10, 25000, 'Recommandé', 3, false),
('vip-3', 'VIP Gold - Élite', 25000, 6500, 10, 65000, 'Rendement Élevé', 2, false),
('vip-4', 'VIP Diamond - Leader', 50000, 14000, 10, 140000, 'Offre VIP', 2, false),
('vip-5', 'VIP Ultimate - Prestige', 100000, 30000, 10, 300000, 'Prestige', 1, false)
ON CONFLICT (id) DO NOTHING;

-- Initial Settings
INSERT INTO public.settings (id, whatsapp_group_link, telegram_channel_link)
VALUES ('primary', 'https://chat.whatsapp.com/ExempleGroupeInvesta', 'https://t.me/InvestaPremiumCanal')
ON CONFLICT (id) DO NOTHING;

-- Initial Bonus Codes
INSERT INTO public.bonus_codes (code, amount, claimed_by, created_by, usage_limit)
VALUES 
('BIENVENUE', 500, '[]'::jsonb, 'admin-master', 100),
('CADEAU2026', 1000, '[]'::jsonb, 'admin-master', 100)
ON CONFLICT (code) DO NOTHING;

-- Seed Master Admins
INSERT INTO public.users (id, name, whatsapp, country, password_hash, balance, daily_earnings, total_earnings, total_deposits, total_withdrawals, status, referral_code, referred_by_code, bonus_points, is_admin)
VALUES 
('admin-master', 'Administrateur Suprême', '22890909090', 'Togo', 'AdminTogo2026*', 1000000, 0, 0, 1000000, 0, 'active', 'ADMIN228', null, 0, true),
('admin-wilfried', 'Administrateur Wilfried', '22870903319', 'Togo', 'AdminWilfried2026*', 1000000, 0, 0, 1000000, 0, 'active', 'WILF228', null, 0, true)
ON CONFLICT (id) DO NOTHING;

-- 11. Disable Row Level Security (RLS) on all tables to ensure write sync from other devices
-- Customarily, Supabase activates RLS by default on new tables which blocks INSERT/UPSERT of new registered accounts.
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referral_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bonus_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;

