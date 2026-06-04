import os
import sys

import psycopg
from dotenv import load_dotenv

load_dotenv()

DB_NAME = "erdb0"

# Build connection string from environment parameters or fallback to local defaults
DB_URL = os.getenv(
    "DATABASE_URL", f"postgresql://postgres:postgres@localhost:5432/{DB_NAME}"
)

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
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VENDORS REPOSITORY
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE, -- 💡 Fixed type mismatch and column naming
    location VARCHAR(255) NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SESSIONS REPOSITORY (Auth Token State)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL, -- 💡 Replaced hashed_password with a true unique session token string
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 💡 Added expiration handling for secure sessions
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN REPOSITORY
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hashed_password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE OR REPLACE FUNCTION protect_created_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- If someone tries to overwrite created_at on insertion, reset it to server time
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := CURRENT_TIMESTAMP;
    -- If someone updates a row, lock down created_at so it stays matching the original record date
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.created_at := OLD.created_at;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shield_events_created_at
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION protect_created_at_timestamp();

CREATE TRIGGER shield_vendors_created_at
    BEFORE INSERT OR UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION protect_created_at_timestamp();

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

CREATE TRIGGER update_events_modtime
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_timestamp_column();

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
INSERT INTO category (name) VALUES
('Photography'),
('Videography'),
('Catering'),
('Floral & Decor'),
('Sound & Lighting')
ON CONFLICT DO NOTHING;

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
);

INSERT INTO vendors (name, category_id, location, data) VALUES
(
    'CineFrame Media Works',
    (SELECT id FROM category WHERE name = 'Videography' LIMIT 1),
    'Los Angeles, CA',
    '{"rating": 4.8, "contact_email": "bookings@cineframe.media", "price_tier": "$$$$", "features": ["4K Cinematic Film", "Same-Day Edit Teaser"]}'::jsonb
),
(
    'Velvet Motion Films',
    (SELECT id FROM category WHERE name = 'Videography' LIMIT 1),
    'Austin, TX',
    '{"rating": 4.6, "contact_email": "velvetmotionfilms@gmail.com", "price_tier": "$$", "features": ["Documentary Style", "Raw Footage Delivery"]}'::jsonb
);

INSERT INTO vendors (name, category_id, location, data) VALUES
(
    'Artisanal Bites Catering',
    (SELECT id FROM category WHERE name = 'Catering' LIMIT 1),
    'Manhattan, NY',
    '{"rating": 5.0, "contact_email": "events@artisanalbites.com", "price_tier": "$$$", "cuisines": ["Modern American", "French Fusion"], "dietary_options": ["Vegan", "Gluten-Free"]}'::jsonb
);

INSERT INTO vendors (name, category_id, location, data) VALUES
(
    'Blossom & Vine Floral Design',
    (SELECT id FROM category WHERE name = 'Floral & Decor' LIMIT 1),
    'Seattle, WA',
    '{"rating": 4.8, "contact_email": "design@blossomvine.com", "price_tier": "$$", "specialties": ["Boho Chic", "Minimalist Installations"]}'::jsonb
);

INSERT INTO vendors (name, category_id, location, data) VALUES
(
    'Aura Sonic Productions',
    (SELECT id FROM category WHERE name = 'Sound & Lighting' LIMIT 1),
    'Miami, FL',
    '{"rating": 4.9, "contact_email": "support@aurasonicevents.com", "price_tier": "$$$", "equipment": ["L-Acoustics Sound Array", "Intelligent Moving Head Lights"]}'::jsonb
);
"""


def run_migrations():
    print("🚀 Initiating Workspace Database Migration Engine...")
    try:
        # Establish synchronous transaction pipeline context to Postgres
        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                print("Connecting to PostgreSQL context instance...")
                cur.execute(MIGRATION_SQL)
                cur.execute(SEED_SQL)
                print("✅ Tables, Indices, and Extensions compiled successfully!")

    except Exception as e:
        print(
            f"❌ Migration Aborted: Pipeline execution bottleneck: {str(e)}",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()
