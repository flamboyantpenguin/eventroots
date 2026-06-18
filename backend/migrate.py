import asyncio
import os
import sys

import asyncpg
from dotenv import load_dotenv

load_dotenv()

DB_NAME = "eventroots"

DB_URL = os.getenv(
    "DATABASE_URL", f"postgresql://postgres:postgres@localhost:5432/{DB_NAME}"
)

SHOULD_SEED = os.getenv("DEBUG_SEED_DATA", "false").lower() in ("true", "1")

MIGRATION_SQL = """
-- Enable UUID extension for high-performance non-sequential keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    username VARCHAR(50),
    pfp VARCHAR(2048),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_online TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EVENTS / CANVAS TABLE
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    banner_url VARCHAR(2048),
    data JSONB DEFAULT '{}'::jsonb,
    flow JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EVENT TEMPLATE
CREATE TABLE IF NOT EXISTS event_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    banner_url VARCHAR(2048),
    data JSONB DEFAULT '{}'::jsonb,
    flow JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORY REPOSITORY
CREATE TABLE IF NOT EXISTS category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VENDORS REPOSITORY
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SESSIONS REPOSITORY (Auth Token State)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN REPOSITORY
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    pfp VARCHAR(2048),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE OR REPLACE FUNCTION protect_created_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := CURRENT_TIMESTAMP;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.created_at := OLD.created_at;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 💡 FIXED: Drop existing triggers before creation instead of invalid 'CREATE OR REPLACE'
DROP TRIGGER IF EXISTS shield_events_created_at ON events;
CREATE TRIGGER shield_events_created_at
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION protect_created_at_timestamp();

DROP TRIGGER IF EXISTS shield_vendors_created_at ON vendors;
CREATE TRIGGER shield_vendors_created_at
    BEFORE INSERT OR UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION protect_created_at_timestamp();

DROP TRIGGER IF EXISTS shield_users_created_at ON users;
CREATE TRIGGER shield_users_created_at
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION protect_created_at_timestamp();

CREATE OR REPLACE FUNCTION update_modified_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_modtime ON events;
CREATE TRIGGER update_events_modtime
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_timestamp_column();

DROP TRIGGER IF EXISTS update_vendors_modtime ON vendors;
CREATE TRIGGER update_vendors_modtime
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_timestamp_column();

-- INDEX OPTIMIZATIONS
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category_id ON vendors(category_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_events_data_gin ON events USING gin (data);
CREATE INDEX IF NOT EXISTS idx_events_flow_gin ON events USING gin (flow);
"""
SEED_SQL = """
-- SEED MASTER ADMINISTRATIVE PRIVILEGES
INSERT INTO admin (email, hashed_password) VALUES
('admin@eventroots.org', '$2b$12$RGZN0jIYdjY5YVgnDokt.uvzbFVJji7Wi9qZI0hJo3iXvysNspZse')
ON CONFLICT (email) DO NOTHING;

-- SEED CATEGORY REPOSITORY
INSERT INTO category (name) VALUES
('Photography'),
('Videography'),
('Catering'),
('Floral & Decor'),
('Sound & Lighting')
ON CONFLICT (name) DO NOTHING;

-- SEED VENDORS REPOSITORY
INSERT INTO vendors (name, category_id, location, data) VALUES
(
    'Pixel Perfect Studios',
    (SELECT id FROM category WHERE name = 'Photography' LIMIT 1),
    'New York, NY',
    '{"rating": 4.9, "contact_email": "hello@pixelperfect.com", "price_tier": "$$$", "features": ["Drone Coverage", "Second Shooter", "Digital Gallery"]}'::jsonb
),
(
    'Lumiere Wedding Captures',
    (SELECT id FROM category WHERE name = 'Photography' LIMIT 1),
    'Brooklyn, NY',
    '{"rating": 4.7, "contact_email": "info@lumierecaptures.com", "price_tier": "$$", "features": ["Fine Art Style", "Engagement Session Included"]}'::jsonb
),
(
    'CineFrame Media Works',
    (SELECT id FROM category WHERE name = 'Videography' LIMIT 1),
    'Los Angeles, CA',
    '{"rating": 4.8, "contact_email": "bookings@cineframe.media", "price_tier": "$$$$", "features": ["4K Cinematic Film", "Same-Day Edit Teaser"]}'::jsonb
),
(
    'Artisanal Bites Catering',
    (SELECT id FROM category WHERE name = 'Catering' LIMIT 1),
    'Manhattan, NY',
    '{"rating": 5.0, "contact_email": "events@artisanalbites.com", "price_tier": "$$$", "cuisines": ["Modern American", "French Fusion"]}'::jsonb
)
ON CONFLICT (name) DO NOTHING;


-- 1. CONFERENCE TEMPLATE
INSERT INTO event_templates (title, banner_url, data, flow)
SELECT
    'Tech Summit & Networking Conference',
    '/static/uploads/templates/conference.avif',
    '{
        "type": "Conference",
        "theme": "Modern Corporate",
        "budget": 12000,
        "guest_count": 300,
        "progress_percentage": 0,
        "status": "Planning",
        "startDateTime": "",
        "endDateTime": "",
        "venueName": "",
        "venueAddress": "",
        "currency": "INR",
        "notes": ""
    }'::jsonb,
    '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM event_templates WHERE title = 'Tech Summit & Networking Conference');

-- 2. CONCERT TEMPLATE
INSERT INTO event_templates (title, banner_url, data, flow)
SELECT
    'Live Music & Indie Rock Concert',
    '/static/uploads/templates/concert.avif',
    '{
        "type": "Concert",
        "theme": "Neon Retro",
        "budget": 25000,
        "guest_count": 500,
        "progress_percentage": 0,
        "status": "Planning",
        "startDateTime": "",
        "endDateTime": "",
        "venueName": "",
        "venueAddress": "",
        "currency": "INR",
        "notes": ""
    }'::jsonb,
    '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM event_templates WHERE title = 'Live Music & Indie Rock Concert');

-- 3. WEDDING TEMPLATE
INSERT INTO event_templates (title, banner_url, data, flow)
SELECT
    'Rustic Romantic Grand Wedding',
    '/static/uploads/templates/wedding.avif',
    '{
        "type": "Wedding",
        "theme": "Rustic Romantic",
        "budget": 35000,
        "guest_count": 150,
        "progress_percentage": 0,
        "status": "Planning",
        "startDateTime": "",
        "endDateTime": "",
        "venueName": "",
        "venueAddress": "",
        "currency": "INR",
        "notes": ""
    }'::jsonb,
    '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM event_templates WHERE title = 'Rustic Romantic Grand Wedding');

-- 4. FUNERAL TEMPLATE
INSERT INTO event_templates (title, banner_url, data, flow)
SELECT
    'Memorial & Celebration of Life',
    '/static/uploads/templates/funeral.avif',
    '{
        "type": "Funeral",
        "theme": "Serene Traditional",
        "budget": 8000,
        "guest_count": 80,
        "progress_percentage": 0,
        "status": "Planning",
        "startDateTime": "",
        "endDateTime": "",
        "venueName": "",
        "venueAddress": "",
        "currency": "INR",
        "notes": ""
    }'::jsonb,
    '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM event_templates WHERE title = 'Memorial & Celebration of Life');

-- 5. ANNIVERSARY TEMPLATE
INSERT INTO event_templates (title, banner_url, data, flow)
SELECT
    'Silver Milestone Anniversary Gala',
    '/static/uploads/templates/anniversary.avif',
    '{
        "type": "Anniversary",
        "theme": "Silver & Elegant White",
        "budget": 15000,
        "guest_count": 100,
        "progress_percentage": 0,
        "status": "Planning",
        "startDateTime": "",
        "endDateTime": "",
        "venueName": "",
        "venueAddress": "",
        "currency": "INR",
        "notes": ""
    }'::jsonb,
    '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM event_templates WHERE title = 'Silver Milestone Anniversary Gala');

-- 6. BIRTHDAY TEMPLATE
INSERT INTO event_templates (title, banner_url, data, flow)
SELECT
    'Milestone Birthday Bash',
    '/static/uploads/templates/birthday.avif',
    '{
        "type": "Birthday",
        "theme": "Vibrant Casual",
        "budget": 3000,
        "guest_count": 50,
        "progress_percentage": 0,
        "status": "Planning",
        "startDateTime": "",
        "endDateTime": "",
        "venueName": "",
        "venueAddress": "",
        "currency": "INR",
        "notes": ""
    }'::jsonb,
    '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM event_templates WHERE title = 'Milestone Birthday Bash');

-- 7. LAN PARTY TEMPLATE
INSERT INTO event_templates (title, banner_url, data, flow)
SELECT
    'Competitive Esports & Gaming LAN',
    '/static/uploads/templates/lanparty.avif',
    '{
        "type": "LAN Party",
        "theme": "Cyberpunk RGB",
        "budget": 2000,
        "guest_count": 24,
        "progress_percentage": 0,
        "status": "Planning",
        "startDateTime": "",
        "endDateTime": "",
        "venueName": "",
        "venueAddress": "",
        "currency": "INR",
        "notes": ""
    }'::jsonb,
    '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM event_templates WHERE title = 'Competitive Esports & Gaming LAN');
"""


async def run_migrations_async():
    print("⚙️🌱🚀")
    try:
        conn = await asyncpg.connect(DB_URL)
        try:
            print("⚙️🟡")
            await conn.execute(MIGRATION_SQL)
            print("⚙️🟢")

            if SHOULD_SEED:
                print("🌱🟡")
                await conn.execute(SEED_SQL)
                print("🌱🟢")
            else:
                print("🌱🔵")

        finally:
            await conn.close()

    except Exception as e:
        print(
            f"🔴: {str(e)}",
            file=sys.stderr,
        )
        sys.exit(1)


def run_migrations():
    asyncio.run(run_migrations_async())


if __name__ == "__main__":
    run_migrations()
