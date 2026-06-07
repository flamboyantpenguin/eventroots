# app/jobs/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler

from app.jobs.db_jobs import purge_expired_sessions

scheduler = BackgroundScheduler()


def init_scheduler():
    """Configures the job schedule and boots the background runner engine."""

    """
    scheduler.add_job(
        purge_expired_sessions,
        trigger="cron",
        hour=0,
        minute=0,
        id="session_cleanup_job",
        replace_existing=True,
    )
    """

    # 💡 TIP: For local testing, swap 'cron' for this line to run it every 10 seconds:
    scheduler.add_job(purge_expired_sessions, trigger="interval", seconds=10)

    scheduler.start()
    print("Background scheduler initialized")
