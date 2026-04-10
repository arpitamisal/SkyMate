from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ChatHistoryMessage(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    message: str
    user_id: Optional[int] = None
    current_flight: Optional[Dict[str, Any]] = None
    chat_history: Optional[List[ChatHistoryMessage]] = None


class AIChatResponse(BaseModel):
    reply: str
    tool_used: Optional[str] = None
    data_source: Optional[str] = None
    suggested_actions: Optional[List[str]] = None