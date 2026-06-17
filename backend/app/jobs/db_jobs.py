# app/jobs/db_jobs.py

from datetime import datetime, timezone

from app.store.db import db


async def purge_expired_sessions():
    """Background task to remove dead sessions from the database."""
    try:
        now = datetime.now(timezone.utc)
        deleted_count = await db.delete_expired_sessions()

        if deleted_count > 0:
            print(f"[{now}] DB Housekeeping: Purged {deleted_count} expired sessions.")

    except Exception as e:
        print(f"Error running database session clear: {e}")
