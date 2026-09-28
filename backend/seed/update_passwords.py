from backend.app.database import SessionLocal
from backend.app.models import User
from backend.app.core.security import hash_password


DEMO_PASSWORD = "Campus@123"


def main():
    db = SessionLocal()

    try:
        users = db.query(User).all()

        if not users:
            raise ValueError("No users found in the database.")

        for user in users:
            user.password_hash = hash_password(DEMO_PASSWORD)

        db.commit()

        print(
            f"Successfully updated passwords for {len(users)} users."
        )
        print(f"Development password: {DEMO_PASSWORD}")

    except Exception as error:
        db.rollback()
        print(f"Password update failed: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()