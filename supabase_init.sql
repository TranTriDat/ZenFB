-- ==========================================
-- ZENFB SUPABASE INITIALIZATION SCRIPT
-- Project: ZenFB Automation
-- Reference: RBC-WebApp Core Schema
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE zenfb_account_status AS ENUM ('active', 'checkpointed', 'expired', 'restricted');
    CREATE TYPE zenfb_post_status AS ENUM ('pending', 'running', 'success', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Accounts table
CREATE TABLE IF NOT EXISTS public.zenfb_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fb_user_id TEXT,
    fb_name TEXT,
    fb_avatar TEXT,
    access_token TEXT,
    cookies JSONB DEFAULT '[]'::jsonb,
    proxy_settings JSONB,
    status zenfb_account_status DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS public.zenfb_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.zenfb_accounts(id) ON DELETE CASCADE,
    fb_group_id TEXT NOT NULL,
    name TEXT,
    privacy TEXT, -- 'OPEN', 'CLOSED', 'SECRET'
    member_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    last_posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table (Templates)
CREATE TABLE IF NOT EXISTS public.zenfb_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Made nullable for local dev
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    post_type VARCHAR(20) DEFAULT 'TEXT', -- 'TEXT', 'IMAGE', 'VIDEO', 'LINK'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules table (Transactions)
CREATE TABLE IF NOT EXISTS public.zenfb_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.zenfb_posts(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.zenfb_groups(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.zenfb_accounts(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status zenfb_post_status DEFAULT 'pending',
    fb_post_id TEXT, -- The actual ID returned by FB after success
    error_log TEXT,
    execution_time TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs table (Audit/Anti-Checkpoint)
CREATE TABLE IF NOT EXISTS public.zenfb_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.zenfb_accounts(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'LOGIN', 'POST_START', 'POST_END', 'SYNC_GROUPS'
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
ALTER TABLE public.zenfb_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zenfb_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zenfb_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zenfb_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zenfb_logs ENABLE ROW LEVEL SECURITY;

-- zenfb_accounts policies
CREATE POLICY "Users can manage their own accounts" ON public.zenfb_accounts
    FOR ALL USING (auth.uid() = user_id);

-- zenfb_groups policies (Nested access check)
CREATE POLICY "Users can view groups of their accounts" ON public.zenfb_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.zenfb_accounts 
            WHERE id = zenfb_groups.account_id AND user_id = auth.uid()
        )
    );

-- zenfb_posts policies
-- TEMPORARY BYPASS FOR LOCAL TESTING
CREATE POLICY "Users can manage their own posts" ON public.zenfb_posts
    FOR ALL USING (true) WITH CHECK (true);

-- zenfb_schedules policies
CREATE POLICY "Users can manage their own schedules" ON public.zenfb_schedules
    FOR ALL USING (auth.uid() = user_id);

-- zenfb_logs policies
CREATE POLICY "Users can view their own logs" ON public.zenfb_logs
    FOR ALL USING (auth.uid() = user_id);

-- 5. INDEXES
CREATE INDEX idx_zenfb_accounts_user ON public.zenfb_accounts(user_id);
CREATE INDEX idx_zenfb_groups_account ON public.zenfb_groups(account_id);
CREATE INDEX idx_zenfb_posts_user ON public.zenfb_posts(user_id);
CREATE INDEX idx_zenfb_schedules_user_status ON public.zenfb_schedules(user_id, status);
CREATE INDEX idx_zenfb_schedules_time ON public.zenfb_schedules(scheduled_for);
CREATE INDEX idx_zenfb_logs_user ON public.zenfb_logs(user_id);

-- 6. UPDATED_AT TRIGGERS (Optional but recommended)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_zenfb_accounts_modtime BEFORE UPDATE ON public.zenfb_accounts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_zenfb_posts_modtime BEFORE UPDATE ON public.zenfb_posts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
