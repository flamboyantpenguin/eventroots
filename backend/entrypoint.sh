#!/bin/sh

DB_HOST=$(echo "$DATABASE_URL" | sed -e 's|.*@||' -e 's|/.*||')
DB_PORT=5432

if [ -z $DB_HOST ]; then
    echo "DB not set. Terminating..."
    exit 1
fi

echo "Waiting for PostgreSQL to init..."

while ! nc -z "$DB_HOST" "$DB_PORT"; do
    sleep 0.5
done

echo "Applying database migrations..."
python migrate.py

exec "$@"
