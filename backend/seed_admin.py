from database import SessionLocal
from models import Admin
import bcrypt

def create_admin():
    db = SessionLocal()
    
    username = "jamari"
    plain_password = "admin"          # ← This is the password you will use

    # Delete old admin if it exists (prevents unique constraint error)
    existing = db.query(Admin).filter(Admin.username == username).first()
    if existing:
        db.delete(existing)
        db.commit()
        print(f"🗑️  Deleted old admin user '{username}'")

    # Hash and save new password
    hashed = bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt())

    admin = Admin(username=username, hashed_password=hashed.decode('utf-8'))
    db.add(admin)
    db.commit()
    print(f"✅ Admin user '{username}' created successfully with password '{plain_password}'")
    db.close()

if __name__ == "__main__":
    create_admin()