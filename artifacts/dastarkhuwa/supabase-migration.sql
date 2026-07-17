-- ============================================================
-- Dastarkhuwa — Supabase Database Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xrdlniijgosyhzavyiad/sql
-- ============================================================

-- Restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  city        TEXT DEFAULT '',
  area        TEXT DEFAULT '',
  cuisine_type TEXT DEFAULT '',
  price_range TEXT DEFAULT 'mid',
  description TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  gallery_images TEXT[] DEFAULT '{}',
  hours       JSONB DEFAULT '{}',
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id   UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_name   TEXT NOT NULL DEFAULT '',
  phone           TEXT DEFAULT '',
  date            TIMESTAMPTZ NOT NULL,
  party_size      INT NOT NULL DEFAULT 1,
  status          TEXT DEFAULT 'pending',
  special_request TEXT DEFAULT '',
  total_amount    NUMERIC DEFAULT 0,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  owner_id      UUID REFERENCES auth.users(id) NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  price         NUMERIC NOT NULL DEFAULT 0,
  category      TEXT NOT NULL DEFAULT 'Starters',
  description   TEXT DEFAULT '',
  image_url     TEXT DEFAULT '',
  is_available  BOOLEAN DEFAULT true,
  is_deleted    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tables table
CREATE TABLE IF NOT EXISTS public.tables (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  owner_id      UUID REFERENCES auth.users(id) NOT NULL,
  table_number  TEXT NOT NULL DEFAULT '',
  capacity      INT NOT NULL DEFAULT 2,
  location      TEXT DEFAULT 'indoor',
  status        TEXT DEFAULT 'available',
  is_deleted    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  owner_id      UUID REFERENCES auth.users(id) NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'Waiter',
  phone         TEXT DEFAULT '',
  is_active     BOOLEAN DEFAULT true,
  is_deleted    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  message       TEXT NOT NULL DEFAULT '',
  read          BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.restaurants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Restaurants: owners can manage their own
CREATE POLICY "Owners manage restaurants" ON public.restaurants
  FOR ALL USING (auth.uid() = owner_id);

-- Bookings: restaurant owners only
CREATE POLICY "Owners manage bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = bookings.restaurant_id AND owner_id = auth.uid())
  );

-- Menu items: by owner_id
CREATE POLICY "Owners manage menu" ON public.menu_items
  FOR ALL USING (auth.uid() = owner_id);

-- Tables: by owner_id
CREATE POLICY "Owners manage tables" ON public.tables
  FOR ALL USING (auth.uid() = owner_id);

-- Staff: by owner_id
CREATE POLICY "Owners manage staff" ON public.staff
  FOR ALL USING (auth.uid() = owner_id);

-- Notifications: via restaurant ownership
CREATE POLICY "Owners manage notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = notifications.restaurant_id AND owner_id = auth.uid())
  );

-- ── Realtime ────────────────────────────────────────────────
-- Enables live updates for all tables (required for booking alerts, etc.)
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.restaurants,
  public.bookings,
  public.menu_items,
  public.tables,
  public.staff,
  public.notifications;
