"""Reset an existing administrator password using local environment variables.

Run manually from backend after setting ADMIN_EMAIL and ADMIN_PASSWORD.
This is an operator script, not an HTTP endpoint.
"""
import os
import sys

from app.database import SessionLocal
from app.modules.identity_catalog.models import User
from app.modules.identity_catalog.roles import UserRole
from app.modules.identity_catalog.security import hash_password


def reset_admin_password():
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "")

    if not email or not password:
        print("Set ADMIN_EMAIL and ADMIN_PASSWORD first.")
        sys.exit(1)

    if len(password) < 9 or not any(c.isupper() for c in password) or not any(c.islower() for c in password) or not any(not c.isalnum() for c in password):
        print("Password must be at least 9 characters and include uppercase, lowercase and special characters.")
        sys.exit(1)

    db = SessionLocal()
    try:
        admin = (
            db.query(User)
            .filter(User.email == email, User.role == UserRole.ADMIN)
            .first()
        )
        if not admin:
            print("No ADMIN account found for that email. No changes made.")
            sys.exit(1)

        admin.password_hash = hash_password(password)
        admin.is_active = True
        db.commit()
        print(f"Password reset successfully for administrator: {email}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset_admin_password()
