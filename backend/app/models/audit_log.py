import uuid 
from sqlalchemy import Column , String , Integer , DateTime , func
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True) , primary_key=True , default=uuid.uuid4 , index=True)
    user_id = Column(String , nullable=True , index=True)
    action = Column(String , nullable=False)
    target_resource = Column(String , nullable=False)
    payload = Column(String,nullable=True) 
    ip_address = Column(String,nullable=True)
    status_code = Column(Integer , nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


