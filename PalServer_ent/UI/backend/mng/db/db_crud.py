from sqlalchemy.orm import Session
from passlib.context import CryptContext
from mng.db.database import User

# 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------
# Password Utils
# ---------------------------------------------------------
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)

# ---------------------------------------------------------
# User CRUD
# ---------------------------------------------------------
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, username, password, role):
    hashed_pw = get_password_hash(password)
    db_user = User(username=username, password=hashed_pw, role=role)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
