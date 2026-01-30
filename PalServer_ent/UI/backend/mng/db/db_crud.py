from sqlalchemy.orm import Session
from passlib.context import CryptContext
from mng.db.database import User  # [중요] User 모델이 정의된 파일 경로

# 비밀번호 해싱 설정 (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# =========================================================
# 1. Password Utils (비밀번호 암호화/검증)
# =========================================================

def verify_password(plain_password, hashed_password):
    """입력받은 평문 비밀번호와 DB의 해시 비밀번호가 일치하는지 확인"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """평문 비밀번호를 해싱하여 반환"""
    return pwd_context.hash(password)


# =========================================================
# 2. User CRUD (사용자 생성/조회/삭제)
# =========================================================

def get_user_by_username(db: Session, username: str):
    """ID(username)로 사용자 단건 조회"""
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, username, password, role="operator"):
    """
    사용자 생성
    - role 기본값: 'operator'
    - 비밀번호는 자동 해싱되어 저장됨
    """
    hashed_pw = get_password_hash(password)
    
    db_user = User(
        username=username, 
        password=hashed_pw, 
        role=role
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_users(db: Session):
    """
    [관리자용] 모든 사용자 목록 조회
    User Management 페이지 테이블에 표시할 데이터
    """
    return db.query(User).all()


def delete_user(db: Session, username: str):
    """
    [관리자용] 사용자 삭제
    삭제 성공 시 True, 사용자 없으면 False 반환
    """
    user = get_user_by_username(db, username)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

def update_user(db: Session, username: str, password: str = None, role: str = None):
    """
    사용자 정보 수정
    - password가 있으면 해싱하여 변경
    - role이 있으면 변경
    """
    user = get_user_by_username(db, username)
    if not user:
        return False
        
    if password:
        user.password = get_password_hash(password)
    
    if role:
        user.role = role
        
    db.commit()
    db.refresh(user)
    return user


def update_last_login(db: Session, username: str):
    """
    [로그인 시] 마지막 로그인 시간 업데이트
    """
    from datetime import datetime
    user = get_user_by_username(db, username)
    if user:
        user.last_login = datetime.utcnow()
        db.commit()
        
    