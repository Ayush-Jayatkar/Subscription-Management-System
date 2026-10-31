import os
import sys

from app.database import SessionLocal
from app.modules.identity_catalog.models import User
from app.modules.identity_catalog.security import hash_password
from app.modules.identity_catalog.roles import UserRole


def create_admin():
    name = os.getenv("ADMIN_NAME")
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")

    if not all([name, email, password]):
        print("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD first.")
        sys.exit(1)

    db = SessionLocal()

    try:
        existing_admin = (
            db.query(User)
            .filter(User.role == UserRole.ADMIN)
            .first()
        )

        if existing_admin:
            admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
            print("An admin account already exists. No changes made.")
            print("Existing admin account(s):")
            for account in admins:
                print(f"- {account.full_name} <{account.email}> (active={account.is_active})")
            print("If you need to set a known password, use scripts.reset_admin_password.")
            return

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            print("This email already belongs to another account.")
            print("Use a different email for the initial admin.")
            return

        admin = User(
            full_name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print(f"Admin account created successfully: {email}")

    except Exception as error:
        db.rollback()
        print(f"Admin creation failed: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()