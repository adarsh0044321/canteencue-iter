-- ==============================================================================
-- CANTEEN CUE: SUPABASE DATABASE INITIALIZATION & MENU MIGRATION SCRIPT
-- ==============================================================================
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- It creates all required tables, indexes, row-level security (RLS), and seeds
-- 250+ real campus canteen items across 5 food outlets.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. OUTLETS TABLE
CREATE TABLE IF NOT EXISTS public.outlets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    cuisine TEXT NOT NULL,
    description TEXT,
    operating_hours TEXT DEFAULT '8:00 AM - 10:00 PM',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Outlets
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on outlets" ON public.outlets
    FOR SELECT USING (true);

-- 3. MENU ITEMS TABLE
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

-- Enable RLS for Menu Items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on menu items" ON public.menu_items
    FOR SELECT USING (true);

-- 4. CHAT SESSIONS & CONVERSATION MEMORY TABLE
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT DEFAULT 'Student',
    session_name TEXT DEFAULT 'Campus Food Chat',
    last_interaction TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_name ON public.chat_sessions(user_name);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

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

-- 5. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    text TEXT,
    decision JSONB,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = chat_messages.session_id
            AND (cs.user_id = auth.uid() OR (cs.user_id IS NULL AND cs.user_name = auth.jwt()->>'email'))
        )
    );

-- 6. PRODUCT RATINGS & REVIEWS TABLE (Ready for ratings integration)
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id TEXT REFERENCES public.menu_items(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read reviews" ON public.product_reviews
    FOR SELECT USING (true);
CREATE POLICY "Allow public write reviews" ON public.product_reviews
    FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 7. SEED DATA: OUTLETS
-- ==============================================================================
INSERT INTO public.outlets (id, name, cuisine, description) VALUES
('outlet_annas', 'Anna''s Restaurant & Catering', 'South Indian, Thalis, Rolls & Biryani', 'Traditional campus favorite offering authentic dosas, combo thalis, and quick bites.'),
('outlet_mughlai', 'Mughlai Affair''s', 'Mughlai, North Indian, Kebabs & Gravies', 'Rich curries, fresh rotis, tandoor items, and flavorful biryanis.'),
('outlet_halka_phulka', 'HALKA PHULKA', 'South Indian, North Indian, Breakfast & Snacks', 'Dosas, Savji combos, Vada Pav, Pav Bhaji, and tangy street chats.'),
('outlet_maggie_point', 'MAGGIE POINT', 'Maggi, Pasta, Rice Bowls & Nescafé Beverages', 'Quick noodles in 14+ flavors, pasta, rice bowls, hot coffees, and thick cold frappes.'),
('outlet_fourth_floor', '4TH FLOOR', 'Burgers, Wraps, Longers, Sandwiches & Crispy Treats', 'American fast-food grill featuring crispy chicken wings, smash burgers, and loaded fries.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    cuisine = EXCLUDED.cuisine,
    description = EXCLUDED.description;

-- ==============================================================================
-- 8. SEED DATA: MENU ITEMS (250+ ITEMS)
-- ==============================================================================
INSERT INTO public.menu_items (
  id, outlet_id, shop, name, category, price, portion_options, dietary, tags, estimated_prep_time, availability, spice_level, filling_level, food_type
) VALUES
  ('anna-veg-roll', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Veg Roll', 'Rolls', 59, NULL, 'vegetarian', ARRAY['filling', 'light', 'snack', 'crispy']::text[], 10, true, 'mild', 'medium', 'roll'),
  ('anna-paneer-roll', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Paneer Roll', 'Rolls', 69, NULL, 'vegetarian', ARRAY['filling', 'snack', 'paneer', 'comfort']::text[], 10, true, 'medium', 'medium', 'roll'),
  ('anna-mushroom-roll', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Mushroom Roll', 'Rolls', 69, NULL, 'vegetarian', ARRAY['filling', 'snack', 'mushroom']::text[], 10, true, 'medium', 'medium', 'roll'),
  ('anna-mix-veg-roll', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Mix Veg Roll', 'Rolls', 79, NULL, 'vegetarian', ARRAY['healthy', 'wholesome', 'light', 'veggies', 'snack']::text[], 10, true, 'mild', 'medium', 'roll'),
  ('anna-egg-roll', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Egg Roll', 'Rolls', 79, NULL, 'contains_egg', ARRAY['filling', 'snack', 'egg', 'protein']::text[], 10, true, 'medium', 'medium', 'roll'),
  ('anna-egg-chicken-roll', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Egg Chicken Roll', 'Rolls', 79, NULL, 'non_vegetarian', ARRAY['filling', 'snack', 'chicken', 'protein']::text[], 10, true, 'medium', 'medium', 'roll'),
  ('anna-veg-noodles', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Veg Noodles', 'Noodles', 79, '[{"portion":"half","price":79},{"portion":"full","price":99}]'::jsonb, 'vegetarian', ARRAY['filling', 'comfort', 'noodles']::text[], 15, true, 'mild', 'heavy', 'noodles'),
  ('anna-veg-schezwan-noodles', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Veg Schezwan Noodles', 'Noodles', 89, '[{"portion":"half","price":89},{"portion":"full","price":109}]'::jsonb, 'vegetarian', ARRAY['spicy', 'filling', 'comfort', 'noodles']::text[], 15, true, 'spicy', 'heavy', 'noodles'),
  ('anna-paneer-noodles', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Paneer Noodles', 'Noodles', 89, '[{"portion":"half","price":89},{"portion":"full","price":129}]'::jsonb, 'vegetarian', ARRAY['filling', 'paneer', 'comfort', 'noodles']::text[], 15, true, 'medium', 'heavy', 'noodles'),
  ('anna-egg-noodles', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Egg Noodles', 'Noodles', 89, '[{"portion":"half","price":89},{"portion":"full","price":119}]'::jsonb, 'contains_egg', ARRAY['filling', 'egg', 'comfort', 'noodles']::text[], 15, true, 'medium', 'heavy', 'noodles'),
  ('anna-paneer-fried-rice', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Paneer Fried Rice', 'Rice', 89, NULL, 'vegetarian', ARRAY['filling', 'comfort', 'paneer', 'rice']::text[], 15, true, 'medium', 'heavy', 'rice'),
  ('anna-egg-fried-rice', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Egg Fried Rice', 'Rice', 89, NULL, 'contains_egg', ARRAY['filling', 'comfort', 'egg', 'rice']::text[], 15, true, 'medium', 'heavy', 'rice'),
  ('anna-veg-thali', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Veg Thali', 'Thali', 99, NULL, 'vegetarian', ARRAY['filling', 'wholesome', 'traditional', 'thali']::text[], 15, true, 'medium', 'heavy', 'thali'),
  ('anna-paneer-thali', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Paneer Thali', 'Thali', 109, NULL, 'vegetarian', ARRAY['filling', 'wholesome', 'paneer', 'thali']::text[], 15, true, 'medium', 'heavy', 'thali'),
  ('anna-egg-thali', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Egg Thali', 'Thali', 119, NULL, 'contains_egg', ARRAY['filling', 'wholesome', 'egg', 'thali']::text[], 15, true, 'medium', 'heavy', 'thali'),
  ('anna-chicken-thali', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Chicken Thali', 'Thali', 149, NULL, 'non_vegetarian', ARRAY['filling', 'wholesome', 'chicken', 'thali']::text[], 20, true, 'medium', 'heavy', 'thali'),
  ('anna-fish-thali', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Fish Thali', 'Thali', 129, NULL, 'non_vegetarian', ARRAY['filling', 'wholesome', 'fish', 'thali']::text[], 20, true, 'medium', 'heavy', 'thali'),
  ('anna-mix-veg-biriyani', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Mix Veg Biriyani', 'Biryani', 119, NULL, 'vegetarian', ARRAY['filling', 'aromatic', 'rice']::text[], 15, true, 'medium', 'heavy', 'rice'),
  ('anna-paneer-biriyani', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Paneer Biriyani', 'Biryani', 99, NULL, 'vegetarian', ARRAY['filling', 'aromatic', 'paneer', 'rice']::text[], 15, true, 'medium', 'heavy', 'rice'),
  ('anna-mushroom-biriyani', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Mushroom Biriyani', 'Biryani', 99, NULL, 'vegetarian', ARRAY['filling', 'aromatic', 'mushroom', 'rice']::text[], 15, true, 'medium', 'heavy', 'rice'),
  ('anna-chicken-kasa', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Chicken Kasa', 'Chicken', 99, '[{"portion":"half","price":99},{"portion":"full","price":189}]'::jsonb, 'non_vegetarian', ARRAY['spicy', 'chicken', 'gravy', 'filling', 'comfort']::text[], 15, true, 'spicy', 'heavy', 'chicken'),
  ('anna-kadhai-chicken', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Kadhai Chicken', 'Chicken', 99, '[{"portion":"half","price":99},{"portion":"full","price":189}]'::jsonb, 'non_vegetarian', ARRAY['spicy', 'chicken', 'gravy', 'aromatic']::text[], 15, true, 'spicy', 'heavy', 'chicken'),
  ('anna-chicken-hyderabadi', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Chicken Hyderabadi', 'Chicken', 109, '[{"portion":"half","price":109},{"portion":"full","price":199}]'::jsonb, 'non_vegetarian', ARRAY['spicy', 'chicken', 'rich', 'gravy']::text[], 20, true, 'spicy', 'heavy', 'chicken'),
  ('anna-tandoori-chicken', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Tandoori Chicken', 'Chicken', 119, '[{"portion":"half","price":119},{"portion":"full","price":199}]'::jsonb, 'non_vegetarian', ARRAY['smoky', 'chicken', 'spicy', 'starter']::text[], 20, true, 'spicy', 'medium', 'chicken'),
  ('anna-chicken-tikka', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Chicken Tikka', 'Chicken', 119, '[{"portion":"half","price":119},{"portion":"full","price":169}]'::jsonb, 'non_vegetarian', ARRAY['smoky', 'chicken', 'spicy', 'starter']::text[], 20, false, 'spicy', 'medium', 'chicken'),
  ('anna-chicken-lollipop', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Chicken Lollipop', 'Chicken', 119, '[{"portion":"half","price":119},{"portion":"full","price":199}]'::jsonb, 'non_vegetarian', ARRAY['crispy', 'spicy', 'chicken', 'snack', 'starter']::text[], 15, true, 'spicy', 'medium', 'chicken'),
  ('anna-chilli-chicken', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Chilli Chicken', 'Chicken', 109, '[{"portion":"half","price":109},{"portion":"full","price":189}]'::jsonb, 'non_vegetarian', ARRAY['spicy', 'chicken', 'indo-chinese', 'starter']::text[], 15, true, 'spicy', 'medium', 'chicken'),
  ('anna-chicken-manchurian', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Chicken Manchurian', 'Chicken', 119, '[{"portion":"half","price":119},{"portion":"full","price":189}]'::jsonb, 'non_vegetarian', ARRAY['savory', 'chicken', 'indo-chinese', 'gravy']::text[], 15, true, 'medium', 'medium', 'chicken'),
  ('anna-chicken-65', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Chicken 65', 'Chicken', 189, NULL, 'non_vegetarian', ARRAY['crispy', 'spicy', 'chicken', 'starter']::text[], 15, true, 'spicy', 'medium', 'chicken'),
  ('anna-chilli-paneer', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Chilli Paneer', 'Paneer', 99, '[{"portion":"half","price":99},{"portion":"full","price":149}]'::jsonb, 'vegetarian', ARRAY['spicy', 'paneer', 'indo-chinese', 'starter']::text[], 15, true, 'spicy', 'medium', 'paneer'),
  ('anna-cold-coffee', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Cold Coffee', 'Beverages', 99, NULL, 'vegetarian', ARRAY['sweet', 'refreshing', 'cold', 'drink', 'light']::text[], 5, true, 'mild', 'light', 'beverage'),
  ('anna-coffee', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Coffee', 'Beverages', 79, NULL, 'vegetarian', ARRAY['warm', 'energetic', 'drink', 'light']::text[], 5, true, 'mild', 'light', 'beverage'),
  ('anna-cold-drinks', 'outlet_annas', 'Anna''s Restaurant & Catering', 'Cold Drinks', 'Beverages', 25, NULL, 'vegetarian', ARRAY['refreshing', 'cold', 'drink', 'light']::text[], 2, true, 'mild', 'light', 'beverage'),
  ('mughlai-paneer-fried-rice', 'outlet_mughlai', 'Mughlai Affair''s', 'Paneer Fried Rice', 'Rice', 90, NULL, 'vegetarian', ARRAY['filling', 'comfort', 'paneer', 'rice']::text[], 15, true, 'medium', 'heavy', 'rice'),
  ('mughlai-egg-chicken-rice', 'outlet_mughlai', 'Mughlai Affair''s', 'Egg Chicken Rice', 'Rice', 95, NULL, 'non_vegetarian', ARRAY['filling', 'chicken', 'egg', 'protein', 'rice']::text[], 15, true, 'medium', 'heavy', 'rice'),
  ('mughlai-mushroom-fried-rice', 'outlet_mughlai', 'Mughlai Affair''s', 'Mushroom Fried Rice', 'Rice', 105, NULL, 'vegetarian', ARRAY['filling', 'mushroom', 'rice']::text[], 15, true, 'medium', 'heavy', 'rice'),
  ('mughlai-schezwan-paneer-fried-rice', 'outlet_mughlai', 'Mughlai Affair''s', 'Schezwan Paneer Fried Rice', 'Rice', 105, NULL, 'vegetarian', ARRAY['spicy', 'filling', 'paneer', 'rice']::text[], 15, true, 'spicy', 'heavy', 'rice'),
  ('mughlai-schezwan-egg-chicken-fried-rice', 'outlet_mughlai', 'Mughlai Affair''s', 'Schezwan Egg Chicken Fried Rice', 'Rice', 110, NULL, 'non_vegetarian', ARRAY['spicy', 'filling', 'chicken', 'egg', 'rice']::text[], 15, true, 'spicy', 'heavy', 'rice'),
  ('mughlai-special-mix-veg-fried-rice', 'outlet_mughlai', 'Mughlai Affair''s', 'Special Mix Veg Fried Rice', 'Rice', 125, NULL, 'vegetarian', ARRAY['healthy', 'wholesome', 'rice']::text[], 15, true, 'medium', 'heavy', 'rice'),
  ('mughlai-special-mix-non-veg-fried-rice', 'outlet_mughlai', 'Mughlai Affair''s', 'Special Mix Non-Veg Fried Rice', 'Rice', 150, NULL, 'non_vegetarian', ARRAY['filling', 'chicken', 'meat', 'rice']::text[], 20, true, 'medium', 'heavy', 'rice'),
  ('mughlai-veg-manchurian', 'outlet_mughlai', 'Mughlai Affair''s', 'Veg Manchurian', 'Starters & Gravies', 80, NULL, 'vegetarian', ARRAY['savory', 'indo-chinese', 'snack']::text[], 15, true, 'medium', 'medium', 'starter'),
  ('mughlai-chilly-veg-manchurian', 'outlet_mughlai', 'Mughlai Affair''s', 'Chilly Veg Manchurian', 'Starters & Gravies', 100, NULL, 'vegetarian', ARRAY['spicy', 'indo-chinese']::text[], 15, true, 'spicy', 'medium', 'starter'),
  ('mughlai-chilly-paneer', 'outlet_mughlai', 'Mughlai Affair''s', 'Chilly Paneer', 'Starters & Gravies', 100, NULL, 'vegetarian', ARRAY['spicy', 'paneer', 'indo-chinese']::text[], 15, true, 'spicy', 'medium', 'paneer'),
  ('mughlai-paneer-manchurian', 'outlet_mughlai', 'Mughlai Affair''s', 'Paneer Manchurian', 'Starters & Gravies', 100, NULL, 'vegetarian', ARRAY['savory', 'paneer', 'indo-chinese']::text[], 15, true, 'medium', 'medium', 'paneer'),
  ('mughlai-hot-garlic-paneer', 'outlet_mughlai', 'Mughlai Affair''s', 'Hot Garlic Paneer', 'Starters & Gravies', 120, NULL, 'vegetarian', ARRAY['spicy', 'garlic', 'paneer']::text[], 15, true, 'spicy', 'medium', 'paneer'),
  ('mughlai-schezwan-paneer', 'outlet_mughlai', 'Mughlai Affair''s', 'Schezwan Paneer', 'Starters & Gravies', 120, NULL, 'vegetarian', ARRAY['spicy', 'paneer']::text[], 15, true, 'spicy', 'medium', 'paneer'),
  ('mughlai-paneer-masala', 'outlet_mughlai', 'Mughlai Affair''s', 'Paneer Masala', 'Starters & Gravies', 100, NULL, 'vegetarian', ARRAY['gravy', 'paneer', 'comfort']::text[], 15, true, 'medium', 'medium', 'paneer'),
  ('mughlai-paneer-dopyaza', 'outlet_mughlai', 'Mughlai Affair''s', 'Paneer Dopyaza', 'Starters & Gravies', 100, NULL, 'vegetarian', ARRAY['gravy', 'paneer', 'onion']::text[], 15, true, 'medium', 'medium', 'paneer'),
  ('mughlai-paneer-punjabi', 'outlet_mughlai', 'Mughlai Affair''s', 'Paneer Punjabi', 'Starters & Gravies', 110, NULL, 'vegetarian', ARRAY['rich', 'gravy', 'paneer']::text[], 15, true, 'medium', 'heavy', 'paneer'),
  ('mughlai-paneer-butter-masala', 'outlet_mughlai', 'Mughlai Affair''s', 'Paneer Butter Masala', 'Starters & Gravies', 120, NULL, 'vegetarian', ARRAY['rich', 'butter', 'paneer', 'comfort']::text[], 15, true, 'mild', 'heavy', 'paneer'),
  ('mughlai-kadai-paneer', 'outlet_mughlai', 'Mughlai Affair''s', 'Kadai Paneer', 'Starters & Gravies', 120, NULL, 'vegetarian', ARRAY['spicy', 'paneer', 'aromatic']::text[], 15, true, 'spicy', 'heavy', 'paneer'),
  ('mughlai-paneer-hyderabadi', 'outlet_mughlai', 'Mughlai Affair''s', 'Paneer Hyderabadi', 'Starters & Gravies', 120, NULL, 'vegetarian', ARRAY['rich', 'spicy', 'paneer']::text[], 15, true, 'spicy', 'heavy', 'paneer'),
  ('mughlai-chilly-mushroom', 'outlet_mughlai', 'Mughlai Affair''s', 'Chilly Mushroom', 'Starters & Gravies', 110, NULL, 'vegetarian', ARRAY['spicy', 'mushroom']::text[], 15, true, 'spicy', 'medium', 'mushroom'),
  ('mughlai-mushroom-manchurian', 'outlet_mughlai', 'Mughlai Affair''s', 'Mushroom Manchurian', 'Starters & Gravies', 110, NULL, 'vegetarian', ARRAY['savory', 'mushroom']::text[], 15, true, 'medium', 'medium', 'mushroom'),
  ('mughlai-mushroom-masala', 'outlet_mughlai', 'Mughlai Affair''s', 'Mushroom Masala', 'Starters & Gravies', 120, NULL, 'vegetarian', ARRAY['gravy', 'mushroom']::text[], 15, true, 'medium', 'medium', 'mushroom'),
  ('mughlai-mushroom-dopyaza', 'outlet_mughlai', 'Mughlai Affair''s', 'Mushroom Dopyaza', 'Starters & Gravies', 130, NULL, 'vegetarian', ARRAY['gravy', 'mushroom', 'onion']::text[], 15, true, 'medium', 'medium', 'mushroom'),
  ('mughlai-mushroom-hydrabadi', 'outlet_mughlai', 'Mughlai Affair''s', 'Mushroom Hydrabadi', 'Starters & Gravies', 150, NULL, 'vegetarian', ARRAY['rich', 'spicy', 'mushroom']::text[], 15, true, 'spicy', 'heavy', 'mushroom'),
  ('mughlai-kadai-mushroom', 'outlet_mughlai', 'Mughlai Affair''s', 'Kadai Mushroom', 'Starters & Gravies', 130, NULL, 'vegetarian', ARRAY['spicy', 'mushroom', 'aromatic']::text[], 15, true, 'spicy', 'heavy', 'mushroom'),
  ('mughlai-chilly-chicken', 'outlet_mughlai', 'Mughlai Affair''s', 'Chilly Chicken', 'Chicken', 100, NULL, 'non_vegetarian', ARRAY['spicy', 'chicken', 'indo-chinese', 'starter']::text[], 15, true, 'spicy', 'medium', 'chicken'),
  ('mughlai-chicken-manchurian', 'outlet_mughlai', 'Mughlai Affair''s', 'Chicken Manchurian', 'Chicken', 100, NULL, 'non_vegetarian', ARRAY['savory', 'chicken', 'indo-chinese']::text[], 15, true, 'medium', 'medium', 'chicken'),
  ('mughlai-garlic-chicken', 'outlet_mughlai', 'Mughlai Affair''s', 'Garlic Chicken', 'Chicken', 120, NULL, 'non_vegetarian', ARRAY['garlic', 'savory', 'chicken']::text[], 15, true, 'medium', 'medium', 'chicken'),
  ('mughlai-hot-garlic-chicken', 'outlet_mughlai', 'Mughlai Affair''s', 'Hot Garlic Chicken', 'Chicken', 120, NULL, 'non_vegetarian', ARRAY['spicy', 'garlic', 'chicken']::text[], 15, true, 'spicy', 'medium', 'chicken'),
  ('mughlai-schezwan-chicken', 'outlet_mughlai', 'Mughlai Affair''s', 'Schezwan Chicken', 'Chicken', 130, NULL, 'non_vegetarian', ARRAY['spicy', 'chicken']::text[], 15, true, 'spicy', 'medium', 'chicken'),
  ('mughlai-chicken-masala', 'outlet_mughlai', 'Mughlai Affair''s', 'Chicken Masala', 'Chicken', 100, NULL, 'non_vegetarian', ARRAY['gravy', 'chicken', 'comfort']::text[], 15, true, 'medium', 'heavy', 'chicken'),
  ('mughlai-chicken-dopyaza', 'outlet_mughlai', 'Mughlai Affair''s', 'Chicken Dopyaza', 'Chicken', 100, NULL, 'non_vegetarian', ARRAY['gravy', 'chicken', 'onion']::text[], 15, true, 'medium', 'heavy', 'chicken'),
  ('mughlai-punjabi-chicken', 'outlet_mughlai', 'Mughlai Affair''s', 'Punjabi Chicken', 'Chicken', 110, NULL, 'non_vegetarian', ARRAY['rich', 'gravy', 'chicken']::text[], 15, true, 'medium', 'heavy', 'chicken'),
  ('mughlai-chicken-kolhapuri', 'outlet_mughlai', 'Mughlai Affair''s', 'Chicken Kolhapuri', 'Chicken', 120, NULL, 'non_vegetarian', ARRAY['extra-spicy', 'spicy', 'chicken']::text[], 15, true, 'spicy', 'heavy', 'chicken'),
  ('mughlai-kadai-chicken', 'outlet_mughlai', 'Mughlai Affair''s', 'Kadai Chicken', 'Chicken', 120, NULL, 'non_vegetarian', ARRAY['spicy', 'aromatic', 'chicken']::text[], 15, true, 'spicy', 'heavy', 'chicken'),
  ('mughlai-butter-chicken-masala', 'outlet_mughlai', 'Mughlai Affair''s', 'Butter Chicken Masala', 'Chicken', 120, NULL, 'non_vegetarian', ARRAY['rich', 'butter', 'comfort', 'chicken']::text[], 20, true, 'mild', 'heavy', 'chicken'),
  ('mughlai-mughlai-chicken-masala', 'outlet_mughlai', 'Mughlai Affair''s', 'Mughlai Chicken Masala', 'Chicken', 150, NULL, 'non_vegetarian', ARRAY['rich', 'special', 'chicken']::text[], 20, true, 'medium', 'heavy', 'chicken'),
  ('mughlai-chilly-prawn', 'outlet_mughlai', 'Mughlai Affair''s', 'Chilly Prawn', 'Prawn', 150, NULL, 'non_vegetarian', ARRAY['spicy', 'seafood', 'prawn']::text[], 20, true, 'spicy', 'medium', 'prawn'),
  ('mughlai-prawn-manchurian', 'outlet_mughlai', 'Mughlai Affair''s', 'Prawn Manchurian', 'Prawn', 150, NULL, 'non_vegetarian', ARRAY['savory', 'seafood', 'prawn']::text[], 20, true, 'medium', 'medium', 'prawn'),
  ('mughlai-prawn-masala', 'outlet_mughlai', 'Mughlai Affair''s', 'Prawn Masala', 'Prawn', 140, NULL, 'non_vegetarian', ARRAY['gravy', 'seafood', 'prawn']::text[], 20, true, 'medium', 'heavy', 'prawn'),
  ('mughlai-kadai-prawn', 'outlet_mughlai', 'Mughlai Affair''s', 'Kadai Prawn', 'Prawn', 150, NULL, 'non_vegetarian', ARRAY['spicy', 'seafood', 'prawn']::text[], 20, true, 'spicy', 'heavy', 'prawn'),
  ('mughlai-prawn-dopyaza', 'outlet_mughlai', 'Mughlai Affair''s', 'Prawn Dopyaza', 'Prawn', 150, NULL, 'non_vegetarian', ARRAY['gravy', 'seafood', 'prawn', 'onion']::text[], 20, true, 'medium', 'heavy', 'prawn'),
  ('hp_dosa_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Plain Dosa', 'Dosa', 50, NULL, 'vegetarian', ARRAY['dosa', 'south_indian', 'crispy', 'light']::text[], 8, true, 'mild', 'light', 'dosa'),
  ('hp_dosa_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Plain Onion Dosa', 'Dosa', 60, NULL, 'vegetarian', ARRAY['dosa', 'onion', 'south_indian']::text[], 8, true, 'mild', 'medium', 'dosa'),
  ('hp_dosa_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Butter Onion Dosa', 'Dosa', 70, NULL, 'vegetarian', ARRAY['dosa', 'butter', 'onion', 'south_indian']::text[], 8, true, 'mild', 'medium', 'dosa'),
  ('hp_dosa_4', 'outlet_halka_phulka', 'HALKA PHULKA', 'Masala Dosa', 'Dosa', 60, NULL, 'vegetarian', ARRAY['dosa', 'masala', 'potato', 'popular', 'south_indian']::text[], 10, true, 'medium', 'medium', 'dosa'),
  ('hp_dosa_5', 'outlet_halka_phulka', 'HALKA PHULKA', 'Onion Masala Dosa', 'Dosa', 70, NULL, 'vegetarian', ARRAY['dosa', 'onion', 'masala']::text[], 10, true, 'medium', 'medium', 'dosa'),
  ('hp_dosa_6', 'outlet_halka_phulka', 'HALKA PHULKA', 'Paneer Masala Dosa', 'Dosa', 80, NULL, 'vegetarian', ARRAY['dosa', 'paneer', 'masala', 'protein']::text[], 10, true, 'medium', 'heavy', 'dosa'),
  ('hp_dosa_7', 'outlet_halka_phulka', 'HALKA PHULKA', 'Butter Masala Dosa', 'Dosa', 70, NULL, 'vegetarian', ARRAY['dosa', 'butter', 'masala']::text[], 10, true, 'medium', 'medium', 'dosa'),
  ('hp_dosa_8', 'outlet_halka_phulka', 'HALKA PHULKA', 'Cheese Masala Dosa', 'Dosa', 80, NULL, 'vegetarian', ARRAY['dosa', 'cheese', 'masala']::text[], 10, true, 'medium', 'heavy', 'dosa'),
  ('hp_dosa_9', 'outlet_halka_phulka', 'HALKA PHULKA', 'Butter Onion Masala Dosa', 'Dosa', 80, NULL, 'vegetarian', ARRAY['dosa', 'butter', 'onion', 'masala']::text[], 10, true, 'medium', 'heavy', 'dosa'),
  ('hp_dosa_10', 'outlet_halka_phulka', 'HALKA PHULKA', 'Cheese Onion Masala Dosa', 'Dosa', 90, NULL, 'vegetarian', ARRAY['dosa', 'cheese', 'onion', 'masala']::text[], 10, true, 'medium', 'heavy', 'dosa'),
  ('hp_dosa_11', 'outlet_halka_phulka', 'HALKA PHULKA', 'Butter Cheese Masala Dosa', 'Dosa', 90, NULL, 'vegetarian', ARRAY['dosa', 'butter', 'cheese', 'masala']::text[], 10, true, 'medium', 'heavy', 'dosa'),
  ('hp_dosa_12', 'outlet_halka_phulka', 'HALKA PHULKA', 'Onion Butter Cheese Masala Dosa', 'Dosa', 100, NULL, 'vegetarian', ARRAY['dosa', 'cheese', 'butter', 'special']::text[], 10, true, 'medium', 'heavy', 'dosa'),
  ('hp_dosa_13', 'outlet_halka_phulka', 'HALKA PHULKA', 'Spl Masala Dosa', 'Dosa', 90, NULL, 'vegetarian', ARRAY['dosa', 'special', 'chef_special']::text[], 12, true, 'medium', 'heavy', 'dosa'),
  ('hp_dosa_14', 'outlet_halka_phulka', 'HALKA PHULKA', 'Butter paper Masala Dosa', 'Dosa', 80, NULL, 'vegetarian', ARRAY['dosa', 'butter', 'paper_dosa', 'crispy']::text[], 10, true, 'medium', 'medium', 'dosa'),
  ('hp_utt_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Vegetable Uttapam', 'Uttapam', 60, NULL, 'vegetarian', ARRAY['uttapam', 'vegetable', 'healthy', 'south_indian']::text[], 10, true, 'mild', 'medium', 'dosa'),
  ('hp_utt_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Onion Uttapam', 'Uttapam', 50, NULL, 'vegetarian', ARRAY['uttapam', 'onion']::text[], 10, true, 'mild', 'medium', 'dosa'),
  ('hp_utt_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Tomato Uttapam', 'Uttapam', 60, NULL, 'vegetarian', ARRAY['uttapam', 'tomato']::text[], 10, true, 'mild', 'medium', 'dosa'),
  ('hp_utt_4', 'outlet_halka_phulka', 'HALKA PHULKA', 'Coconut Uttapam', 'Uttapam', 60, NULL, 'vegetarian', ARRAY['uttapam', 'coconut']::text[], 10, true, 'mild', 'medium', 'dosa'),
  ('hp_bf_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Upama', 'Breakfast', 40, NULL, 'vegetarian', ARRAY['upma', 'breakfast', 'quick', 'light', 'healthy']::text[], 5, true, 'mild', 'light', 'breakfast'),
  ('hp_bf_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Idli', 'Breakfast', 40, NULL, 'vegetarian', ARRAY['idli', 'breakfast', 'steamed', 'healthy', 'quick']::text[], 4, true, 'mild', 'light', 'breakfast'),
  ('hp_bf_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Vada', 'Breakfast', 40, NULL, 'vegetarian', ARRAY['vada', 'crispy', 'breakfast', 'south_indian']::text[], 5, true, 'medium', 'medium', 'breakfast'),
  ('hp_bf_4', 'outlet_halka_phulka', 'HALKA PHULKA', 'Aluchop', 'Breakfast', 40, NULL, 'vegetarian', ARRAY['aluchop', 'snack', 'potato', 'crispy']::text[], 5, true, 'medium', 'medium', 'starter'),
  ('hp_bf_5', 'outlet_halka_phulka', 'HALKA PHULKA', 'Samosa', 'Breakfast', 40, NULL, 'vegetarian', ARRAY['samosa', 'snack', 'crispy', 'potato']::text[], 5, true, 'medium', 'medium', 'starter'),
  ('hp_bf_6', 'outlet_halka_phulka', 'HALKA PHULKA', 'Puri', 'Breakfast', 40, NULL, 'vegetarian', ARRAY['puri', 'breakfast', 'puri_sabzi', 'filling']::text[], 8, true, 'medium', 'medium', 'breakfast'),
  ('hp_bf_7', 'outlet_halka_phulka', 'HALKA PHULKA', 'Aludum Dahiwada', 'Breakfast', 40, NULL, 'vegetarian', ARRAY['dahiwada', 'aloodum', 'chaat', 'street_food']::text[], 5, true, 'medium', 'medium', 'starter'),
  ('hp_rooti_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Rooti 2pc + Mixveg + Dahi + Pickle', 'Rooti Savji', 60, NULL, 'vegetarian', ARRAY['roti', 'mixveg', 'thali', 'filling', 'healthy', 'lunch']::text[], 8, true, 'mild', 'heavy', 'thali'),
  ('hp_rooti_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Rooti 2pc + Paneer B.Masala + Dahi + Pickle', 'Rooti Savji', 60, NULL, 'vegetarian', ARRAY['roti', 'paneer', 'butter_masala', 'filling', 'popular', 'lunch']::text[], 8, true, 'medium', 'heavy', 'thali'),
  ('hp_rooti_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Rooti 2pc + Mashroom Masala + Dahi + Pickle', 'Rooti Savji', 60, NULL, 'vegetarian', ARRAY['roti', 'mushroom', 'curry', 'filling', 'lunch']::text[], 8, true, 'medium', 'heavy', 'thali'),
  ('hp_rooti_4', 'outlet_halka_phulka', 'HALKA PHULKA', 'Rooti 2pc + Chili Paneer + Dahi + Pickle', 'Rooti Savji', 60, NULL, 'vegetarian', ARRAY['roti', 'chilli_paneer', 'spicy', 'filling', 'lunch']::text[], 8, true, 'spicy', 'heavy', 'thali'),
  ('hp_rooti_5', 'outlet_halka_phulka', 'HALKA PHULKA', 'Rooti 2pc + Chili Mashroom + Dahi + Pickle', 'Rooti Savji', 60, NULL, 'vegetarian', ARRAY['roti', 'chilli_mushroom', 'spicy', 'filling', 'lunch']::text[], 8, true, 'spicy', 'heavy', 'thali'),
  ('hp_rooti_6', 'outlet_halka_phulka', 'HALKA PHULKA', 'Rooti 2pc + Chana Masala + Dahi + Pickle', 'Rooti Savji', 60, NULL, 'vegetarian', ARRAY['roti', 'chana_masala', 'protein', 'filling', 'lunch']::text[], 8, true, 'medium', 'heavy', 'thali'),
  ('hp_rooti_7', 'outlet_halka_phulka', 'HALKA PHULKA', 'Extra Rooti', 'Rooti Savji', 10, NULL, 'vegetarian', ARRAY['extra', 'roti', 'bread']::text[], 3, true, 'mild', 'light', 'bread'),
  ('hp_par_sav_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Paratha 2pc + Mixveg + Dahi + Pickle', 'Paratha Savji', 70, NULL, 'vegetarian', ARRAY['paratha', 'mixveg', 'meal', 'filling', 'lunch']::text[], 10, true, 'mild', 'heavy', 'thali'),
  ('hp_par_sav_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Paratha 2pc + Paneer B.Masala + Dahi + Pickle', 'Paratha Savji', 70, NULL, 'vegetarian', ARRAY['paratha', 'paneer', 'butter_masala', 'filling', 'lunch']::text[], 10, true, 'medium', 'heavy', 'thali'),
  ('hp_par_sav_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Paratha 2pc + Mashroom Masala + Dahi + Pickle', 'Paratha Savji', 70, NULL, 'vegetarian', ARRAY['paratha', 'mushroom', 'meal', 'filling', 'lunch']::text[], 10, true, 'medium', 'heavy', 'thali'),
  ('hp_par_sav_4', 'outlet_halka_phulka', 'HALKA PHULKA', 'Paratha 2pc + Chili Paneer + Dahi + Pickle', 'Paratha Savji', 70, NULL, 'vegetarian', ARRAY['paratha', 'chilli_paneer', 'spicy', 'filling', 'lunch']::text[], 10, true, 'spicy', 'heavy', 'thali'),
  ('hp_par_sav_5', 'outlet_halka_phulka', 'HALKA PHULKA', 'Paratha 2pc + Chili Mashroom + Dahi + Pickle', 'Paratha Savji', 70, NULL, 'vegetarian', ARRAY['paratha', 'chilli_mushroom', 'spicy', 'filling', 'lunch']::text[], 10, true, 'spicy', 'heavy', 'thali'),
  ('hp_par_sav_6', 'outlet_halka_phulka', 'HALKA PHULKA', 'Paratha 2pc + Chana Masala + Dahi + Pickle', 'Paratha Savji', 70, NULL, 'vegetarian', ARRAY['paratha', 'chana_masala', 'filling', 'lunch']::text[], 10, true, 'medium', 'heavy', 'thali'),
  ('hp_par_sav_7', 'outlet_halka_phulka', 'HALKA PHULKA', 'Extra Paratha', 'Paratha Savji', 15, NULL, 'vegetarian', ARRAY['extra', 'paratha', 'bread']::text[], 4, true, 'mild', 'light', 'bread'),
  ('hp_vp_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Plain Vada Pav', 'Vada Pav', 30, NULL, 'vegetarian', ARRAY['vada_pav', 'mumbai', 'snack', 'budget', 'street_food']::text[], 4, true, 'medium', 'medium', 'starter'),
  ('hp_vp_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Classic Vada Pav', 'Vada Pav', 35, NULL, 'vegetarian', ARRAY['vada_pav', 'classic', 'snack', 'budget']::text[], 4, true, 'medium', 'medium', 'starter'),
  ('hp_vp_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Butter Vada Pav', 'Vada Pav', 40, NULL, 'vegetarian', ARRAY['vada_pav', 'butter', 'snack']::text[], 5, true, 'medium', 'medium', 'starter'),
  ('hp_vp_4', 'outlet_halka_phulka', 'HALKA PHULKA', 'Cheese Vada Pav', 'Vada Pav', 50, NULL, 'vegetarian', ARRAY['vada_pav', 'cheese', 'snack']::text[], 5, true, 'mild', 'heavy', 'starter'),
  ('hp_vp_5', 'outlet_halka_phulka', 'HALKA PHULKA', 'Schezwan Vada Pav', 'Vada Pav', 45, NULL, 'vegetarian', ARRAY['vada_pav', 'schezwan', 'spicy']::text[], 5, true, 'spicy', 'medium', 'starter'),
  ('hp_cb_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Chhole Bhature', 'Chhole Bhature', 60, NULL, 'vegetarian', ARRAY['chhole_bhature', 'punjabi', 'filling', 'popular', 'heavy']::text[], 10, true, 'medium', 'heavy', 'thali'),
  ('hp_cb_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Extra Chhole', 'Chhole Bhature', 30, NULL, 'vegetarian', ARRAY['extra', 'chhole']::text[], 3, true, 'medium', 'medium', 'gravy'),
  ('hp_cb_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Extra Bhature', 'Chhole Bhature', 20, NULL, 'vegetarian', ARRAY['extra', 'bhature']::text[], 5, true, 'mild', 'medium', 'bread'),
  ('hp_par_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Alu Paratha', 'Paratha', 50, NULL, 'vegetarian', ARRAY['paratha', 'aloo', 'breakfast', 'filling']::text[], 10, true, 'medium', 'heavy', 'starter'),
  ('hp_par_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Paneer Paratha', 'Paratha', 60, NULL, 'vegetarian', ARRAY['paratha', 'paneer', 'protein', 'filling']::text[], 10, true, 'medium', 'heavy', 'starter'),
  ('hp_par_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Butter Alu Paratha', 'Paratha', 60, NULL, 'vegetarian', ARRAY['paratha', 'aloo', 'butter']::text[], 10, true, 'medium', 'heavy', 'starter'),
  ('hp_par_4', 'outlet_halka_phulka', 'HALKA PHULKA', 'Butter Paneer Paratha', 'Paratha', 70, NULL, 'vegetarian', ARRAY['paratha', 'paneer', 'butter']::text[], 10, true, 'medium', 'heavy', 'starter'),
  ('hp_par_5', 'outlet_halka_phulka', 'HALKA PHULKA', 'Spl Paneer Paratha', 'Paratha', 80, NULL, 'vegetarian', ARRAY['paratha', 'paneer', 'special']::text[], 12, true, 'medium', 'heavy', 'starter'),
  ('hp_par_6', 'outlet_halka_phulka', 'HALKA PHULKA', 'Crispy Paneer', 'Paratha', 90, NULL, 'vegetarian', ARRAY['paneer', 'starter', 'crispy', 'snack']::text[], 10, true, 'medium', 'medium', 'paneer'),
  ('hp_bev_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Masala Coldrinks', 'Beverages', 30, NULL, 'vegetarian', ARRAY['beverage', 'cold_drinks', 'masala', 'refreshing']::text[], 2, true, 'mild', 'light', 'beverage'),
  ('hp_chat_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Papdi Chat', 'Chat', 40, NULL, 'vegetarian', ARRAY['chaat', 'papdi', 'tangy', 'street_food']::text[], 5, true, 'medium', 'light', 'starter'),
  ('hp_chat_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Samosa Chat', 'Chat', 40, NULL, 'vegetarian', ARRAY['chaat', 'samosa', 'popular', 'street_food']::text[], 5, true, 'medium', 'medium', 'starter'),
  ('hp_chat_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Alu Tika Chat', 'Chat', 40, NULL, 'vegetarian', ARRAY['chaat', 'aloo_tikki', 'tangy']::text[], 5, true, 'medium', 'medium', 'starter'),
  ('hp_chat_4', 'outlet_halka_phulka', 'HALKA PHULKA', 'Cutlet Chat', 'Chat', 40, NULL, 'vegetarian', ARRAY['chaat', 'cutlet']::text[], 5, true, 'medium', 'medium', 'starter'),
  ('hp_chat_5', 'outlet_halka_phulka', 'HALKA PHULKA', 'Mix Masla Chat', 'Chat', 40, NULL, 'vegetarian', ARRAY['chaat', 'masala']::text[], 5, true, 'medium', 'medium', 'starter'),
  ('hp_chat_6', 'outlet_halka_phulka', 'HALKA PHULKA', 'Pani Puri', 'Chat', 30, NULL, 'vegetarian', ARRAY['pani_puri', 'golgappa', 'puchka', 'street_food', 'tangy']::text[], 4, true, 'spicy', 'light', 'starter'),
  ('hp_chat_7', 'outlet_halka_phulka', 'HALKA PHULKA', 'Dahi Gupchup', 'Chat', 40, NULL, 'vegetarian', ARRAY['chaat', 'dahi', 'gupchup', 'cooling', 'street_food']::text[], 5, true, 'mild', 'light', 'starter'),
  ('hp_chat_8', 'outlet_halka_phulka', 'HALKA PHULKA', 'Spl Masala Gupchup', 'Chat', 40, NULL, 'vegetarian', ARRAY['chaat', 'masala', 'gupchup', 'spicy']::text[], 5, true, 'spicy', 'light', 'starter'),
  ('hp_chat_9', 'outlet_halka_phulka', 'HALKA PHULKA', 'Khata Meetha Dahiwada', 'Chat', 30, NULL, 'vegetarian', ARRAY['dahiwada', 'sweet', 'tangy', 'cooling']::text[], 5, true, 'mild', 'light', 'starter'),
  ('hp_pb_1', 'outlet_halka_phulka', 'HALKA PHULKA', 'Plain Pav Bhaji', 'Pav Bhaji', 50, NULL, 'vegetarian', ARRAY['pav_bhaji', 'butter', 'mumbai', 'popular']::text[], 8, true, 'medium', 'medium', 'starter'),
  ('hp_pb_2', 'outlet_halka_phulka', 'HALKA PHULKA', 'Butter Pav Bhaji', 'Pav Bhaji', 60, NULL, 'vegetarian', ARRAY['pav_bhaji', 'extra_butter', 'rich']::text[], 8, true, 'medium', 'heavy', 'starter'),
  ('hp_pb_3', 'outlet_halka_phulka', 'HALKA PHULKA', 'Cheese Pav Bhaji', 'Pav Bhaji', 70, NULL, 'vegetarian', ARRAY['pav_bhaji', 'cheese']::text[], 8, true, 'medium', 'heavy', 'starter'),
  ('hp_pb_4', 'outlet_halka_phulka', 'HALKA PHULKA', 'Cheese Butter Pav Bhaji', 'Pav Bhaji', 80, NULL, 'vegetarian', ARRAY['pav_bhaji', 'cheese', 'butter', 'filling']::text[], 8, true, 'medium', 'heavy', 'starter'),
  ('hp_pb_5', 'outlet_halka_phulka', 'HALKA PHULKA', 'Masala Pav Bhaji', 'Pav Bhaji', 70, NULL, 'vegetarian', ARRAY['pav_bhaji', 'masala', 'spicy']::text[], 8, true, 'spicy', 'heavy', 'starter'),
  ('hp_pb_6', 'outlet_halka_phulka', 'HALKA PHULKA', 'Extra Pav', 'Pav Bhaji', 20, NULL, 'vegetarian', ARRAY['extra', 'pav']::text[], 2, true, 'mild', 'light', 'bread'),
  ('hp_pb_7', 'outlet_halka_phulka', 'HALKA PHULKA', 'Extra Bhaji', 'Pav Bhaji', 20, NULL, 'vegetarian', ARRAY['extra', 'bhaji']::text[], 2, true, 'medium', 'light', 'gravy'),
  ('mp_mg_1', 'outlet_maggie_point', 'MAGGIE POINT', 'Original Masala Maggi', 'Noodles', 55, NULL, 'vegetarian', ARRAY['maggi', 'noodles', 'classic', 'comfort_food']::text[], 6, true, 'mild', 'medium', 'noodles'),
  ('mp_mg_2', 'outlet_maggie_point', 'MAGGIE POINT', 'Atta Masala Maggi', 'Noodles', 60, NULL, 'vegetarian', ARRAY['maggi', 'atta', 'healthy', 'noodles']::text[], 6, true, 'mild', 'medium', 'noodles'),
  ('mp_mg_3', 'outlet_maggie_point', 'MAGGIE POINT', 'Garden Fresh Maggi', 'Noodles', 65, NULL, 'vegetarian', ARRAY['maggi', 'vegetables', 'fresh', 'noodles']::text[], 7, true, 'mild', 'medium', 'noodles'),
  ('mp_mg_4', 'outlet_maggie_point', 'MAGGIE POINT', 'Butter Garlic Maggi', 'Noodles', 70, NULL, 'vegetarian', ARRAY['maggi', 'butter', 'garlic', 'aromatic']::text[], 7, true, 'medium', 'medium', 'noodles'),
  ('mp_mg_5', 'outlet_maggie_point', 'MAGGIE POINT', 'Chilli Garlic Maggi', 'Noodles', 75, NULL, 'vegetarian', ARRAY['maggi', 'chilli', 'garlic', 'spicy']::text[], 7, true, 'spicy', 'medium', 'noodles'),
  ('mp_mg_6', 'outlet_maggie_point', 'MAGGIE POINT', 'Periperi Maggi', 'Noodles', 80, NULL, 'vegetarian', ARRAY['maggi', 'peri_peri', 'spicy', 'zesty']::text[], 7, true, 'spicy', 'medium', 'noodles'),
  ('mp_mg_7', 'outlet_maggie_point', 'MAGGIE POINT', 'Barbeque Maggi', 'Noodles', 80, NULL, 'vegetarian', ARRAY['maggi', 'bbq', 'smoky']::text[], 7, true, 'medium', 'medium', 'noodles'),
  ('mp_mg_8', 'outlet_maggie_point', 'MAGGIE POINT', 'Shillong Szechuan Maggi', 'Noodles', 80, NULL, 'vegetarian', ARRAY['maggi', 'schezwan', 'spicy', 'northeast_flavor']::text[], 7, true, 'spicy', 'medium', 'noodles'),
  ('mp_mg_9', 'outlet_maggie_point', 'MAGGIE POINT', 'Hostel Wali Maggi', 'Noodles', 80, NULL, 'vegetarian', ARRAY['maggi', 'hostel', 'nostalgic', 'comfort_food']::text[], 7, true, 'medium', 'medium', 'noodles'),
  ('mp_mg_10', 'outlet_maggie_point', 'MAGGIE POINT', 'Italiano Maggi', 'Noodles', 90, NULL, 'vegetarian', ARRAY['maggi', 'herbs', 'cheese', 'italian']::text[], 8, true, 'mild', 'heavy', 'noodles'),
  ('mp_mg_11', 'outlet_maggie_point', 'MAGGIE POINT', 'Kolkata Special Maggi', 'Noodles', 90, NULL, 'vegetarian', ARRAY['maggi', 'kolkata_special', 'spicy', 'mustard']::text[], 8, true, 'spicy', 'medium', 'noodles'),
  ('mp_mg_12', 'outlet_maggie_point', 'MAGGIE POINT', 'Hyderabadi Maggi', 'Noodles', 90, NULL, 'vegetarian', ARRAY['maggi', 'hyderabadi', 'spicy', 'biryani_masala']::text[], 8, true, 'spicy', 'medium', 'noodles'),
  ('mp_mg_13', 'outlet_maggie_point', 'MAGGIE POINT', 'Patiala Tandoori Maggi', 'Noodles', 90, NULL, 'vegetarian', ARRAY['maggi', 'tandoori', 'punjabi', 'smoky']::text[], 8, true, 'spicy', 'medium', 'noodles'),
  ('mp_mg_14', 'outlet_maggie_point', 'MAGGIE POINT', 'Korean BBQ Noodles', 'Noodles', 110, NULL, 'vegetarian', ARRAY['noodles', 'korean', 'bbq', 'ramen_style', 'trendy']::text[], 8, true, 'spicy', 'heavy', 'noodles'),
  ('mp_paz_1', 'outlet_maggie_point', 'MAGGIE POINT', 'Cheese Oregano Pazzta', 'Pazzta', 80, NULL, 'vegetarian', ARRAY['pasta', 'cheese', 'oregano', 'creamy']::text[], 8, true, 'mild', 'medium', 'noodles'),
  ('mp_paz_2', 'outlet_maggie_point', 'MAGGIE POINT', 'Tomato Pazzta', 'Pazzta', 80, NULL, 'vegetarian', ARRAY['pasta', 'tomato', 'tangy', 'red_sauce']::text[], 8, true, 'mild', 'medium', 'noodles'),
  ('mp_paz_3', 'outlet_maggie_point', 'MAGGIE POINT', 'Mushroom Pazzta', 'Pazzta', 80, NULL, 'vegetarian', ARRAY['pasta', 'mushroom', 'creamy']::text[], 8, true, 'mild', 'medium', 'noodles'),
  ('mp_paz_4', 'outlet_maggie_point', 'MAGGIE POINT', 'Masala-AE-Magic Pazzta', 'Pazzta', 80, NULL, 'vegetarian', ARRAY['pasta', 'masala_magic', 'indian_fusion']::text[], 8, true, 'medium', 'medium', 'noodles'),
  ('mp_rb_1', 'outlet_maggie_point', 'MAGGIE POINT', 'WOK Rice', 'Rice Bowl', 100, NULL, 'vegetarian', ARRAY['rice', 'wok', 'stir_fry', 'filling']::text[], 10, true, 'medium', 'heavy', 'rice'),
  ('mp_rb_2', 'outlet_maggie_point', 'MAGGIE POINT', 'Chilli Garlic Rice', 'Rice Bowl', 100, NULL, 'vegetarian', ARRAY['rice', 'chilli_garlic', 'spicy', 'filling']::text[], 10, true, 'spicy', 'heavy', 'rice'),
  ('mp_sc_1', 'outlet_maggie_point', 'MAGGIE POINT', 'Chilli Garlic Sweet Corn', 'Sweet Corn', 80, NULL, 'vegetarian', ARRAY['sweet_corn', 'healthy', 'snack', 'chilli_garlic']::text[], 5, true, 'spicy', 'light', 'starter'),
  ('mp_sc_2', 'outlet_maggie_point', 'MAGGIE POINT', 'Masala-AE-Magic Sweet Corn', 'Sweet Corn', 80, NULL, 'vegetarian', ARRAY['sweet_corn', 'masala', 'healthy', 'snack']::text[], 5, true, 'medium', 'light', 'starter'),
  ('mp_bev_1', 'outlet_maggie_point', 'MAGGIE POINT', 'Lemon Tea', 'Hot Beverages', 25, NULL, 'vegetarian', ARRAY['tea', 'lemon', 'beverage', 'budget', 'refreshing']::text[], 3, true, 'mild', 'light', 'beverage'),
  ('mp_bev_2', 'outlet_maggie_point', 'MAGGIE POINT', 'Black Tea', 'Hot Beverages', 25, NULL, 'vegetarian', ARRAY['tea', 'black_tea', 'beverage', 'light']::text[], 3, true, 'mild', 'light', 'beverage'),
  ('mp_bev_3', 'outlet_maggie_point', 'MAGGIE POINT', 'Cardamom Tea', 'Hot Beverages', 30, NULL, 'vegetarian', ARRAY['tea', 'elaichi', 'milk_tea', 'beverage']::text[], 4, true, 'mild', 'light', 'beverage'),
  ('mp_bev_4', 'outlet_maggie_point', 'MAGGIE POINT', 'Masala Tea', 'Hot Beverages', 30, NULL, 'vegetarian', ARRAY['tea', 'masala_chai', 'beverage', 'spiced']::text[], 4, true, 'medium', 'light', 'beverage'),
  ('mp_bev_5', 'outlet_maggie_point', 'MAGGIE POINT', 'Espresso Black Coffee', 'Hot Beverages', 30, NULL, 'vegetarian', ARRAY['coffee', 'espresso', 'black_coffee', 'caffeine']::text[], 3, true, 'mild', 'light', 'beverage'),
  ('mp_bev_6', 'outlet_maggie_point', 'MAGGIE POINT', 'Nescafe Regular Coffee', 'Hot Beverages', 30, NULL, 'vegetarian', ARRAY['coffee', 'nescafe', 'hot_coffee', 'beverage']::text[], 4, true, 'mild', 'light', 'beverage'),
  ('mp_bev_7', 'outlet_maggie_point', 'MAGGIE POINT', 'Cappuccino', 'Hot Beverages', 50, NULL, 'vegetarian', ARRAY['coffee', 'cappuccino', 'frothy', 'beverage']::text[], 5, true, 'mild', 'light', 'beverage'),
  ('mp_bev_8', 'outlet_maggie_point', 'MAGGIE POINT', 'Café Latte', 'Hot Beverages', 50, NULL, 'vegetarian', ARRAY['coffee', 'latte', 'smooth', 'beverage']::text[], 5, true, 'mild', 'light', 'beverage'),
  ('mp_bev_9', 'outlet_maggie_point', 'MAGGIE POINT', 'Hot Chocolate', 'Hot Beverages', 50, NULL, 'vegetarian', ARRAY['hot_chocolate', 'sweet', 'comfort_food', 'beverage']::text[], 5, true, 'mild', 'medium', 'beverage'),
  ('mp_bev_10', 'outlet_maggie_point', 'MAGGIE POINT', 'Café Mocha', 'Hot Beverages', 60, NULL, 'vegetarian', ARRAY['coffee', 'mocha', 'chocolate_coffee']::text[], 5, true, 'mild', 'medium', 'beverage'),
  ('mp_bev_11', 'outlet_maggie_point', 'MAGGIE POINT', 'Irish Cappuccino', 'Hot Beverages', 60, NULL, 'vegetarian', ARRAY['coffee', 'irish', 'specialty']::text[], 5, true, 'mild', 'light', 'beverage'),
  ('mp_bev_12', 'outlet_maggie_point', 'MAGGIE POINT', 'Hazelnut Cappuccino', 'Hot Beverages', 60, NULL, 'vegetarian', ARRAY['coffee', 'hazelnut', 'flavored']::text[], 5, true, 'mild', 'light', 'beverage'),
  ('mp_bev_13', 'outlet_maggie_point', 'MAGGIE POINT', 'Caramel Cappuccino', 'Hot Beverages', 60, NULL, 'vegetarian', ARRAY['coffee', 'caramel', 'sweet']::text[], 5, true, 'mild', 'light', 'beverage'),
  ('mp_soup_1', 'outlet_maggie_point', 'MAGGIE POINT', 'Tomato Soup', 'Soup', 80, NULL, 'vegetarian', ARRAY['soup', 'tomato', 'warm', 'comfort_food']::text[], 6, true, 'mild', 'light', 'starter'),
  ('mp_soup_2', 'outlet_maggie_point', 'MAGGIE POINT', 'Manchow Soup', 'Soup', 80, NULL, 'vegetarian', ARRAY['soup', 'manchow', 'crispy_noodles', 'spicy']::text[], 6, true, 'spicy', 'light', 'starter'),
  ('mp_cbev_1', 'outlet_maggie_point', 'MAGGIE POINT', 'Lemon Ice Tea', 'Cold Beverages', 60, NULL, 'vegetarian', ARRAY['iced_tea', 'lemon', 'cold', 'refreshing']::text[], 4, true, 'mild', 'light', 'beverage'),
  ('mp_cbev_2', 'outlet_maggie_point', 'MAGGIE POINT', 'Masala Ice Tea', 'Cold Beverages', 65, NULL, 'vegetarian', ARRAY['iced_tea', 'masala', 'chilled']::text[], 4, true, 'medium', 'light', 'beverage'),
  ('mp_cbev_3', 'outlet_maggie_point', 'MAGGIE POINT', 'Peach Ice Tea', 'Cold Beverages', 75, NULL, 'vegetarian', ARRAY['iced_tea', 'peach', 'fruity', 'refreshing']::text[], 4, true, 'mild', 'light', 'beverage'),
  ('mp_cbev_4', 'outlet_maggie_point', 'MAGGIE POINT', 'Frappe Mocha', 'Cold Beverages', 75, NULL, 'vegetarian', ARRAY['frappe', 'mocha', 'cold_coffee', 'chocolate']::text[], 5, true, 'mild', 'medium', 'beverage'),
  ('mp_cbev_5', 'outlet_maggie_point', 'MAGGIE POINT', 'Cold Chocolate', 'Cold Beverages', 75, NULL, 'vegetarian', ARRAY['cold_chocolate', 'chocolate', 'sweet', 'beverage']::text[], 5, true, 'mild', 'medium', 'beverage'),
  ('mp_cbev_6', 'outlet_maggie_point', 'MAGGIE POINT', 'Café Frappe (Cold Coffee)', 'Cold Beverages', 80, NULL, 'vegetarian', ARRAY['cold_coffee', 'frappe', 'popular', 'chilled']::text[], 5, true, 'mild', 'medium', 'beverage'),
  ('mp_cbev_7', 'outlet_maggie_point', 'MAGGIE POINT', 'Irish Frappe', 'Cold Beverages', 85, NULL, 'vegetarian', ARRAY['frappe', 'irish', 'chilled']::text[], 5, true, 'mild', 'medium', 'beverage'),
  ('mp_cbev_8', 'outlet_maggie_point', 'MAGGIE POINT', 'Caramel Frappe', 'Cold Beverages', 85, NULL, 'vegetarian', ARRAY['frappe', 'caramel', 'sweet']::text[], 5, true, 'mild', 'medium', 'beverage'),
  ('mp_cbev_9', 'outlet_maggie_point', 'MAGGIE POINT', 'Hazelnut Frappe', 'Cold Beverages', 85, NULL, 'vegetarian', ARRAY['frappe', 'hazelnut', 'chilled']::text[], 5, true, 'mild', 'medium', 'beverage'),
  ('mp_cbev_10', 'outlet_maggie_point', 'MAGGIE POINT', 'Kit Kat Frappe', 'Cold Beverages', 100, NULL, 'vegetarian', ARRAY['frappe', 'kitkat', 'premium', 'dessert_beverage']::text[], 6, true, 'mild', 'heavy', 'beverage'),
  ('mp_cbev_11', 'outlet_maggie_point', 'MAGGIE POINT', 'Munch Nuts Frappe', 'Cold Beverages', 100, NULL, 'vegetarian', ARRAY['frappe', 'munch_nuts', 'crunchy', 'sweet']::text[], 6, true, 'mild', 'heavy', 'beverage'),
  ('ff_nvb_1', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Chicken Burger', 'Non-Veg Burgers', 109, NULL, 'non_vegetarian', ARRAY['burger', 'chicken', 'crispy', 'fast_food']::text[], 10, true, 'medium', 'heavy', 'chicken'),
  ('ff_nvb_2', 'outlet_fourth_floor', '4TH FLOOR', 'Tandoori Chicken Burger', 'Non-Veg Burgers', 119, NULL, 'non_vegetarian', ARRAY['burger', 'chicken', 'tandoori', 'spicy']::text[], 10, true, 'spicy', 'heavy', 'chicken'),
  ('ff_nvb_3', 'outlet_fourth_floor', '4TH FLOOR', 'Peri Peri Chicken Burger', 'Non-Veg Burgers', 109, NULL, 'non_vegetarian', ARRAY['burger', 'chicken', 'peri_peri', 'spicy']::text[], 10, true, 'spicy', 'heavy', 'chicken'),
  ('ff_nvb_4', 'outlet_fourth_floor', '4TH FLOOR', 'Bbq Grill Chicken Burger', 'Non-Veg Burgers', 139, NULL, 'non_vegetarian', ARRAY['burger', 'chicken', 'bbq', 'smoky']::text[], 12, true, 'medium', 'heavy', 'chicken'),
  ('ff_nvb_5', 'outlet_fourth_floor', '4TH FLOOR', 'Doubledown Burger', 'Non-Veg Burgers', 169, NULL, 'non_vegetarian', ARRAY['burger', 'double_patty', 'heavy', 'party', 'filling']::text[], 15, true, 'spicy', 'heavy', 'chicken'),
  ('ff_vb_1', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Paneer Burger', 'Veg Burgers', 119, NULL, 'vegetarian', ARRAY['burger', 'paneer', 'crispy', 'vegetarian']::text[], 10, true, 'medium', 'heavy', 'paneer'),
  ('ff_vb_2', 'outlet_fourth_floor', '4TH FLOOR', 'Veg Deluxe Burger', 'Veg Burgers', 109, NULL, 'vegetarian', ARRAY['burger', 'deluxe', 'veggie']::text[], 10, true, 'mild', 'medium', 'starter'),
  ('ff_vb_3', 'outlet_fourth_floor', '4TH FLOOR', 'Tandoori Paneer Burger', 'Veg Burgers', 119, NULL, 'vegetarian', ARRAY['burger', 'paneer', 'tandoori', 'spicy']::text[], 10, true, 'spicy', 'heavy', 'paneer'),
  ('ff_vb_4', 'outlet_fourth_floor', '4TH FLOOR', 'Aloo Tikki Burger', 'Veg Burgers', 89, NULL, 'vegetarian', ARRAY['burger', 'aloo_tikki', 'budget', 'snack']::text[], 8, true, 'medium', 'medium', 'starter'),
  ('ff_vb_5', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Mushroom Burger', 'Veg Burgers', 99, NULL, 'vegetarian', ARRAY['burger', 'mushroom', 'crispy']::text[], 10, true, 'medium', 'medium', 'starter'),
  ('ff_vb_6', 'outlet_fourth_floor', '4TH FLOOR', 'Veg Finger Burger', 'Veg Burgers', 89, NULL, 'vegetarian', ARRAY['burger', 'veg_finger', 'crispy']::text[], 8, true, 'medium', 'medium', 'starter'),
  ('ff_vb_7', 'outlet_fourth_floor', '4TH FLOOR', 'Farm Fresh Burger (Paneer With Mushroom)', 'Veg Burgers', 109, NULL, 'vegetarian', ARRAY['burger', 'farm_fresh', 'paneer', 'mushroom']::text[], 10, true, 'medium', 'heavy', 'paneer'),
  ('ff_nvw_1', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Chicken Wrap', 'Non-Veg Wraps', 119, NULL, 'non_vegetarian', ARRAY['wrap', 'chicken', 'crispy', 'roll']::text[], 10, true, 'medium', 'medium', 'chicken'),
  ('ff_nvw_2', 'outlet_fourth_floor', '4TH FLOOR', 'Peri Peri Chicken Wrap', 'Non-Veg Wraps', 119, NULL, 'non_vegetarian', ARRAY['wrap', 'chicken', 'peri_peri', 'spicy']::text[], 10, true, 'spicy', 'medium', 'chicken'),
  ('ff_nvw_3', 'outlet_fourth_floor', '4TH FLOOR', 'Tandoori Chicken Wrap', 'Non-Veg Wraps', 129, NULL, 'non_vegetarian', ARRAY['wrap', 'chicken', 'tandoori']::text[], 10, true, 'spicy', 'heavy', 'chicken'),
  ('ff_vw_1', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Paneer Wrap', 'Veg Wraps', 109, NULL, 'vegetarian', ARRAY['wrap', 'paneer', 'crispy', 'vegetarian']::text[], 10, true, 'medium', 'medium', 'paneer'),
  ('ff_vw_2', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Mushroom Wrap', 'Veg Wraps', 99, NULL, 'vegetarian', ARRAY['wrap', 'mushroom', 'crispy']::text[], 10, true, 'medium', 'medium', 'starter'),
  ('ff_vw_3', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Veg Wrap', 'Veg Wraps', 99, NULL, 'vegetarian', ARRAY['wrap', 'crispy', 'veggie']::text[], 10, true, 'mild', 'medium', 'starter'),
  ('ff_vw_4', 'outlet_fourth_floor', '4TH FLOOR', 'Aloo Tikki Wrap', 'Veg Wraps', 99, NULL, 'vegetarian', ARRAY['wrap', 'aloo_tikki', 'budget']::text[], 8, true, 'medium', 'medium', 'starter'),
  ('ff_vw_5', 'outlet_fourth_floor', '4TH FLOOR', 'Tandoori Paneer Wrap', 'Veg Wraps', 119, NULL, 'vegetarian', ARRAY['wrap', 'paneer', 'tandoori']::text[], 10, true, 'spicy', 'heavy', 'paneer'),
  ('ff_vw_6', 'outlet_fourth_floor', '4TH FLOOR', 'Farm Fresh Wrap (Paneer With Mushroom)', 'Veg Wraps', 119, NULL, 'vegetarian', ARRAY['wrap', 'farm_fresh', 'paneer', 'mushroom']::text[], 10, true, 'medium', 'heavy', 'paneer'),
  ('ff_nvl_1', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Chicken Longer', 'Non-Veg Longer', 129, NULL, 'non_vegetarian', ARRAY['longer', 'sub', 'chicken', 'crispy']::text[], 10, true, 'medium', 'heavy', 'chicken'),
  ('ff_nvl_2', 'outlet_fourth_floor', '4TH FLOOR', 'Peri Peri Chicken Longer', 'Non-Veg Longer', 129, NULL, 'non_vegetarian', ARRAY['longer', 'sub', 'chicken', 'peri_peri']::text[], 10, true, 'spicy', 'heavy', 'chicken'),
  ('ff_nvl_3', 'outlet_fourth_floor', '4TH FLOOR', 'Tandoori Chicken Longer', 'Non-Veg Longer', 129, NULL, 'non_vegetarian', ARRAY['longer', 'sub', 'chicken', 'tandoori']::text[], 10, true, 'spicy', 'heavy', 'chicken'),
  ('ff_vl_1', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Paneer Longer', 'Veg Longer', 129, NULL, 'vegetarian', ARRAY['longer', 'sub', 'paneer', 'crispy']::text[], 10, true, 'medium', 'heavy', 'paneer'),
  ('ff_vl_2', 'outlet_fourth_floor', '4TH FLOOR', 'Veg Deluxe Chilli Cheese Longer', 'Veg Longer', 139, NULL, 'vegetarian', ARRAY['longer', 'sub', 'cheese', 'spicy']::text[], 10, true, 'spicy', 'heavy', 'starter'),
  ('ff_vl_3', 'outlet_fourth_floor', '4TH FLOOR', 'Tandoori Paneer Longer', 'Veg Longer', 129, NULL, 'vegetarian', ARRAY['longer', 'sub', 'paneer', 'tandoori']::text[], 10, true, 'spicy', 'heavy', 'paneer'),
  ('ff_vl_4', 'outlet_fourth_floor', '4TH FLOOR', 'Farm Fresh Longer', 'Veg Longer', 129, NULL, 'vegetarian', ARRAY['longer', 'sub', 'veggie', 'farm_fresh']::text[], 10, true, 'medium', 'heavy', 'starter'),
  ('ff_nvs_1', 'outlet_fourth_floor', '4TH FLOOR', 'Chicken Sandwich', 'Non-Veg Sandwich', 79, NULL, 'non_vegetarian', ARRAY['sandwich', 'chicken', 'snack']::text[], 8, true, 'medium', 'medium', 'chicken'),
  ('ff_nvs_2', 'outlet_fourth_floor', '4TH FLOOR', 'Chicken Cheese Sandwich', 'Non-Veg Sandwich', 99, NULL, 'non_vegetarian', ARRAY['sandwich', 'chicken', 'cheese', 'filling']::text[], 8, true, 'medium', 'heavy', 'chicken'),
  ('ff_vs_1', 'outlet_fourth_floor', '4TH FLOOR', 'Paneer Sandwich', 'Veg Sandwich', 79, NULL, 'vegetarian', ARRAY['sandwich', 'paneer', 'vegetarian']::text[], 8, true, 'medium', 'medium', 'paneer'),
  ('ff_vs_2', 'outlet_fourth_floor', '4TH FLOOR', 'Paneer Cheese Sandwich', 'Veg Sandwich', 99, NULL, 'vegetarian', ARRAY['sandwich', 'paneer', 'cheese']::text[], 8, true, 'medium', 'heavy', 'paneer'),
  ('ff_vs_3', 'outlet_fourth_floor', '4TH FLOOR', 'Mushroom Sandwich', 'Veg Sandwich', 79, NULL, 'vegetarian', ARRAY['sandwich', 'mushroom']::text[], 8, true, 'medium', 'medium', 'starter'),
  ('ff_vs_4', 'outlet_fourth_floor', '4TH FLOOR', 'Veg Corn Sandwich', 'Veg Sandwich', 69, NULL, 'vegetarian', ARRAY['sandwich', 'corn', 'budget', 'snack']::text[], 8, true, 'mild', 'medium', 'starter'),
  ('ff_hcc_1', 'outlet_fourth_floor', '4TH FLOOR', 'Chicken Wings Big Size (4pc)', 'Hot & Crispy Chicken', 109, NULL, 'non_vegetarian', ARRAY['crispy_chicken', 'wings', 'chicken', 'party']::text[], 12, true, 'medium', 'heavy', 'chicken'),
  ('ff_hcc_2', 'outlet_fourth_floor', '4TH FLOOR', 'Chicken Wings Small Size (5pc)', 'Hot & Crispy Chicken', 99, NULL, 'non_vegetarian', ARRAY['crispy_chicken', 'wings', 'budget']::text[], 10, true, 'medium', 'medium', 'chicken'),
  ('ff_hcc_3', 'outlet_fourth_floor', '4TH FLOOR', 'Boneless Strips (5pc)', 'Hot & Crispy Chicken', 89, NULL, 'non_vegetarian', ARRAY['crispy_chicken', 'strips', 'boneless', 'popular']::text[], 10, true, 'medium', 'medium', 'chicken'),
  ('ff_hcc_4', 'outlet_fourth_floor', '4TH FLOOR', 'Chicken Popcorn (15pc)', 'Hot & Crispy Chicken', 99, NULL, 'non_vegetarian', ARRAY['crispy_chicken', 'popcorn', 'snack']::text[], 8, true, 'medium', 'medium', 'chicken'),
  ('ff_hcc_5', 'outlet_fourth_floor', '4TH FLOOR', 'Chicken Popcorn (25pc)', 'Hot & Crispy Chicken', 159, NULL, 'non_vegetarian', ARRAY['crispy_chicken', 'popcorn', 'party', 'sharing']::text[], 10, true, 'medium', 'heavy', 'chicken'),
  ('ff_hcc_6', 'outlet_fourth_floor', '4TH FLOOR', 'Drumstick (1pc)', 'Hot & Crispy Chicken', 79, NULL, 'non_vegetarian', ARRAY['crispy_chicken', 'drumstick', 'snack']::text[], 10, true, 'medium', 'medium', 'chicken'),
  ('ff_hcc_7', 'outlet_fourth_floor', '4TH FLOOR', 'Drumstick (2pc)', 'Hot & Crispy Chicken', 140, NULL, 'non_vegetarian', ARRAY['crispy_chicken', 'drumstick', 'meal']::text[], 12, true, 'medium', 'heavy', 'chicken'),
  ('ff_hcv_1', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Paneer Strips (4pc)', 'Hot & Crispy Veg', 99, NULL, 'vegetarian', ARRAY['crispy_veg', 'paneer', 'strips', 'snack']::text[], 8, true, 'medium', 'medium', 'paneer'),
  ('ff_hcv_2', 'outlet_fourth_floor', '4TH FLOOR', 'Potato Bites (15pc)', 'Hot & Crispy Veg', 99, NULL, 'vegetarian', ARRAY['crispy_veg', 'potato', 'bites', 'snack']::text[], 7, true, 'mild', 'medium', 'starter'),
  ('ff_hcv_3', 'outlet_fourth_floor', '4TH FLOOR', 'French Fries', 'Hot & Crispy Veg', 79, NULL, 'vegetarian', ARRAY['fries', 'crispy', 'snack', 'classic']::text[], 6, true, 'mild', 'medium', 'starter'),
  ('ff_hcv_4', 'outlet_fourth_floor', '4TH FLOOR', 'Peri Peri Fries', 'Hot & Crispy Veg', 99, NULL, 'vegetarian', ARRAY['fries', 'peri_peri', 'spicy', 'popular']::text[], 6, true, 'spicy', 'medium', 'starter'),
  ('ff_hcv_5', 'outlet_fourth_floor', '4TH FLOOR', 'Crispy Veggie Finger (4pc)', 'Hot & Crispy Veg', 99, NULL, 'vegetarian', ARRAY['crispy_veg', 'veggie_finger', 'snack']::text[], 8, true, 'mild', 'medium', 'starter')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  dietary = EXCLUDED.dietary,
  tags = EXCLUDED.tags,
  spice_level = EXCLUDED.spice_level,
  filling_level = EXCLUDED.filling_level,
  food_type = EXCLUDED.food_type,
  availability = EXCLUDED.availability;
