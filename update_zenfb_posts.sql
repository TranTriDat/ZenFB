-- ==========================================
-- UPDATE SCRIPT: ZENFB POSTS
-- This script fixes the issue where the `zenfb_posts` table 
-- did not receive the new columns or policy bypass
-- when re-running the initialization script.
-- ==========================================

-- 1. Add missing columns for the Drip-Campaign
ALTER TABLE public.zenfb_posts ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Untitled';
ALTER TABLE public.zenfb_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Drop the NOT NULL constraint on user_id to bypass auth requirements for local testing
ALTER TABLE public.zenfb_posts ALTER COLUMN user_id DROP NOT NULL;

-- 3. Replace the old RLS Policy with the open one for local testing
-- We must explicitly DROP the old policy because CREATE POLICY does not overwrite an existing one.
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.zenfb_posts;

CREATE POLICY "Users can manage their own posts" ON public.zenfb_posts
    FOR ALL USING (true) WITH CHECK (true);
