from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime
from bson import ObjectId

class PortfolioItemBase(BaseModel):
    coin_symbol: str
    buy_price: float
    quantity: float

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItemInDB(PortfolioItemBase):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    date_added: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PortfolioItemResponse(PortfolioItemBase):
    id: Optional[str] = Field(alias="_id", default=None)
    date_added: Optional[datetime] = None  # Made optional for backward compatibility

    @field_validator('id', mode='before')
    @classmethod
    def convert_objectid(cls, v: Any) -> Optional[str]:
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

