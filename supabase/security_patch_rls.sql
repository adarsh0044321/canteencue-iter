-- ==============================================================================
-- CANTEEN CUE: SUPABASE ROW LEVEL SECURITY (RLS) PATCH & HARDENING
-- ==============================================================================
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- This script secures chat sessions, messages, and catalog tables against
-- unauthorized access, IDOR data exfiltration, and tampering.
-- It is 100% idempotent and self-healing: if tables do not exist yet, it creates
-- them safely before applying RLS policies.
-- ==============================================================================

-- 1. BASE TABLE DEFINITIONS (Guarantees tables exist before policy operations)
CREATE TABLE IF NOT EXISTS public.outlets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    cuisine TEXT NOT NULL,
    description TEXT,
    operating_hours TEXT DEFAULT '8:00 AM - 10:00 PM',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    outlet_id TEXT REFERENCES public.outlets(id) ON DELETE CASCADE,
    shop TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    portion_options JSONB,
    dietary TEXT NOT NULL CHECK (dietary IN ('vegetarian', 'non_vegetarian', 'contains_egg')),
    tags TEXT[] DEFAULT '{}',
    ingredients TEXT[] DEFAULT '{}',
    estimated_prep_time INTEGER DEFAULT 10,
    availability BOOLEAN DEFAULT true,
    spice_level TEXT CHECK (spice_level IN ('mild', 'medium', 'spicy')),
    filling_level TEXT CHECK (filling_level IN ('light', 'medium', 'heavy')),
    food_type TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.2,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT DEFAULT 'Student',
    session_name TEXT DEFAULT 'Campus Food Chat',
    last_interaction TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    text TEXT,
    decision JSONB,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id TEXT REFERENCES public.menu_items(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SCHEMA MIGRATION: Ensure user_id column and indexes exist on chat_sessions
ALTER TABLE public.chat_sessions 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_name ON public.chat_sessions(user_name);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

-- 3. DROP LEGACY POLICIES (Safe now because tables are guaranteed to exist)
DROP POLICY IF EXISTS "Allow public all access on chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Allow public all access on chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can select own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can select own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;

DROP POLICY IF EXISTS "Allow public read access on outlets" ON public.outlets;
DROP POLICY IF EXISTS "Allow public all access on outlets" ON public.outlets;
DROP POLICY IF EXISTS "Allow public write access on outlets" ON public.outlets;
DROP POLICY IF EXISTS "Allow public delete access on outlets" ON public.outlets;

DROP POLICY IF EXISTS "Allow public read access on menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public all access on menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public write access on menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public delete access on menu items" ON public.menu_items;

DROP POLICY IF EXISTS "Allow public read reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Allow public write reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Allow verified write reviews" ON public.product_reviews;

-- 4. ENFORCE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 5. SECURE CHAT SESSIONS POLICIES: Owner-only access
CREATE POLICY "Users can select own chat sessions" ON public.chat_sessions
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND user_name = auth.jwt()->>'email')
    );

CREATE POLICY "Users can insert own chat sessions" ON public.chat_sessions
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        OR (user_id IS NULL AND user_name = auth.jwt()->>'email')
    );

CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND user_name = auth.jwt()->>'email')
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR (user_id IS NULL AND user_name = auth.jwt()->>'email')
    );

CREATE POLICY "Users can delete own chat sessions" ON public.chat_sessions
    FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND user_name = auth.jwt()->>'email')
    );

-- 6. SECURE CHAT MESSAGES POLICIES: Constrained to owned sessions
CREATE POLICY "Users can select own chat messages" ON public.chat_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = chat_messages.session_id
            AND (cs.user_id = auth.uid() OR (cs.user_id IS NULL AND cs.user_name = auth.jwt()->>'email'))
        )
    );

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = chat_messages.session_id
            AND (cs.user_id = auth.uid() OR (cs.user_id IS NULL AND cs.user_name = auth.jwt()->>'email'))
        )
    );

-- 7. CATALOG SECURITY: Public read-only
CREATE POLICY "Allow public read access on outlets" ON public.outlets
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on menu items" ON public.menu_items
    FOR SELECT USING (true);

-- 8. REVIEWS SECURITY: Public read, verified rating insert
CREATE POLICY "Allow public read reviews" ON public.product_reviews
    FOR SELECT USING (true);

CREATE POLICY "Allow verified write reviews" ON public.product_reviews
    FOR INSERT WITH CHECK (
        rating >= 1.0 AND rating <= 5.0 AND length(user_name) > 0
    );
