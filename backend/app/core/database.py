from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings

settings = get_settings()

motor_client: AsyncIOMotorClient | None = None


async def init_db():
    global motor_client
    from app.models.debate import DebateDocument

    motor_client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=motor_client[settings.mongodb_db],
        document_models=[DebateDocument],
    )


async def close_db():
    global motor_client
    if motor_client:
        motor_client.close()
