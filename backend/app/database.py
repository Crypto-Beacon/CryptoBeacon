from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

class Database:
    client: AsyncIOMotorClient = None

    def connect_db(self):
        self.client = AsyncIOMotorClient(settings.MONGO_URI)
        print("Connected to MongoDB via Motor.")

    def close_db(self):
        if self.client:
            self.client.close()
            print("Closed MongoDB connection.")

    def get_db(self):
        return self.client[settings.DB_NAME]

db = Database()

async def get_database():
    return db.get_db()
