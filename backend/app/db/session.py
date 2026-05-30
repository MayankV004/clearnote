from sqlalchemy.ext.asyncio import (create_async_engine, async_sessionmaker , AsyncSession)
from app.core.config import settings

#Create Aysnc postgresql Engine

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
   
)

#Async Session Maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Dependency function for FastAPI route
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()