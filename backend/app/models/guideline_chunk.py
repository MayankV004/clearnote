from sqlalchemy import Column, Integer, String
from pgvector.sqlalchemy import Vector
from app.db.base import Base

class GuidelineChunk(Base):
    __tablename__ = "guideline_chunks"

    id=Column(Integer,primary_key=True,autoincrement=True)
    source=Column(String,nullable=False)
    page=Column(Integer,nullable=True)
    content=Column(String,nullable=False)
    embedding=Column(Vector(768))