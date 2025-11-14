from flask_migrate import upgrade
from flask import current_app
import os

def run_auto_migrate():
    """
    Kjør automatisk 'flask db upgrade' ved oppstart.
    Hvis ingen migrasjoner finnes -> gjør ingenting.
    """
    try:
        migrations_dir = os.path.join(current_app.root_path, "migrations")

        # Ingen migrations ennå
        if not os.path.exists(migrations_dir):
            current_app.logger.info("Ingen migrations-mappe – hopper over auto-migrate.")
            return

        current_app.logger.info("Kjører auto-migrate...")
        upgrade()
        current_app.logger.info("Database er oppdatert.")
    except Exception as e:
        current_app.logger.error(f"Auto-migrate feilet: {e}")
