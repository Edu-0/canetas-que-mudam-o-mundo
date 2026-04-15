from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.models.user import Base
import datetime

class TokenDenyList(Base):
    __tablename__ = "token_denylist"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(1000), unique=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.now)
    revoked = Column(Boolean, default=True, nullable=False)