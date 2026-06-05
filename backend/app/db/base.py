from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here so Alembic can discover them
from app.db.models.doctor import Doctor
from app.db.models.patient import Patient
