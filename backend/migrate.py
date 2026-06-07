import os
import sys

import psycopg
from dotenv import load_dotenv

load_dotenv()

DB_NAME = "erdb0"

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
    user_id UUID,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN REPOSITORY
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
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

-- SEED WORKSPACE CANVAS EVENTS
INSERT INTO events (user_id, title, banner_url, data, flow)
SELECT
    (SELECT id FROM users WHERE email = 'john.smith@gmail.com' LIMIT 1),
    'Smith & Taylor Grand Wedding',
    'https://images.unsplash.com/photo-1519741497674-611481863552',
    '{"guest_count": 150, "budget": 35000, "status": "planning"}'::jsonb,
    '{"timeline": ["4:00 PM Ceremony", "5:30 PM Cocktail Hour", "7:00 PM Reception Grand Entry"]}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM events WHERE title = 'Smith & Taylor Grand Wedding'
);

INSERT INTO events (user_id, title, banner_url, data, flow)
SELECT
    (SELECT id FROM users WHERE email = 'sarah.wilson@gmail.com' LIMIT 1),
    'Corporate Product Launch Canvas',
    'https://images.unsplash.com/photo-1511578314322-379afb476865',
    '{"guest_count": 80, "budget": 12000, "status": "confirmed"}'::jsonb,
    '{"timeline": ["9:00 AM Keynote", "11:00 AM Live Demos", "1:00 PM Networking Lunch"]}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM events WHERE title = 'Corporate Product Launch Canvas'
);
"""


def run_migrations():
    print("⚙️🌱🚀")
    try:
        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                print("⚙️🟡")

                cur.execute(MIGRATION_SQL)
                print("⚙️🟢")

                if SHOULD_SEED:
                    print("🌱🟡")
                    cur.execute(SEED_SQL)
                    print("🌱🟢")
                else:
                    print("🌱🔵")

    except Exception as e:
        print(
            f"🔴: {str(e)}",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()
