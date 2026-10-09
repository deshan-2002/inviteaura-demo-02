-- ==============================================================================
-- Wedding Invitation RSVP & Admin Dashboard Migration
-- Run this in the Supabase SQL Editor if you need to set up or verify RLS policies
-- ==============================================================================

-- 1. Ensure Tables Exist
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Wedding Invitation',
    is_open BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_members (
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('developer', 'client')),
    PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    contact TEXT,
    attending BOOLEAN NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 1 CHECK (guest_count >= 0),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. RLS Policies: public.events
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view open events" ON public.events;
CREATE POLICY "Anyone can view open events"
ON public.events FOR SELECT
TO anon, authenticated
USING (true);

-- ------------------------------------------------------------------------------
-- 4. RLS Policies: public.event_members
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view their own membership" ON public.event_members;
CREATE POLICY "Members can view their own membership"
ON public.event_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 5. RLS Policies: public.rsvps
-- ------------------------------------------------------------------------------
-- Public guests (anonymous or authenticated) can submit RSVPs only to open events
DROP POLICY IF EXISTS "Public can submit RSVPs to open events" ON public.rsvps;
CREATE POLICY "Public can submit RSVPs to open events"
ON public.rsvps FOR INSERT
TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = rsvps.event_id
          AND events.is_open = true
    )
);

-- Only authorized event members can view RSVPs for their event
DROP POLICY IF EXISTS "Authorized members can read event RSVPs" ON public.rsvps;
CREATE POLICY "Authorized members can read event RSVPs"
ON public.rsvps FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_members
        WHERE event_members.event_id = rsvps.event_id
          AND event_members.user_id = auth.uid()
    )
);

-- Prevent unauthorized updates and deletes (only developer role can delete if needed)
DROP POLICY IF EXISTS "Developers can delete RSVPs" ON public.rsvps;
CREATE POLICY "Developers can delete RSVPs"
ON public.rsvps FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_members
        WHERE event_members.event_id = rsvps.event_id
          AND event_members.user_id = auth.uid()
          AND event_members.role = 'developer'
    )
);

-- ------------------------------------------------------------------------------
-- Helper: How to Add Developer and Client Accounts
-- ------------------------------------------------------------------------------
-- 1. Create the user accounts in Supabase Dashboard -> Authentication -> Users.
-- 2. Run the queries below, replacing the placeholder UUIDs with actual user IDs:
--
-- INSERT INTO public.event_members (event_id, user_id, role)
-- VALUES 
--   ('<EVENT_ID>', '<DEVELOPER_AUTH_USER_UUID>', 'developer'),
--   ('<EVENT_ID>', '<CLIENT_AUTH_USER_UUID>', 'client')
-- ON CONFLICT (event_id, user_id) DO UPDATE SET role = EXCLUDED.role;
