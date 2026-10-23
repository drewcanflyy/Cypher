import json
from fastapi import Depends, FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from backend.config import settings
from backend.scenarios import SCENARIOS
from backend.services.ai_service import ai_service
from backend.services.audio_service import audio_service, VOICES
from backend.services.assessment_service import assessment_service
from backend.services.auth_service import auth_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CYPHER - Interactive AI English Practice & Assessment Platform"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    scenario_id: str
    messages: List[ChatMessage]
    custom_role: Optional[str] = None
    voice: Optional[str] = "en-US-GuyNeural"
    level: Optional[str] = "Intermediate"

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-GuyNeural"

class AssessRequest(BaseModel):
    scenario_id: str
    conversation: List[ChatMessage]
    level: Optional[str] = "Intermediate"

class AuthRequest(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = ""

class SaveSessionRequest(BaseModel):
    scenario_id: str
    level: str
    conversation: List[ChatMessage]
    assessment: Optional[dict] = None

class SettingsUpdate(BaseModel):
    groq_api_key: Optional[str] = None
    colab_backend_url: Optional[str] = None

@app.get("/api/health")
def health_check():
    has_groq = bool(settings.GROQ_API_KEY)
    has_colab = bool(settings.COLAB_BACKEND_URL)
    return {
        "status": "online",
        "app": "CYPHER AI",
        "groq_configured": has_groq,
        "colab_configured": has_colab
    }

@app.get("/api/scenarios")
def get_scenarios():
    return list(SCENARIOS.values())

def current_user(authorization: Optional[str] = Header(default=None)):
    token = authorization.removeprefix("Bearer ").strip() if authorization else None
    user = auth_service.get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    return user

@app.post("/api/auth/register")
def register(auth: AuthRequest):
    try:
        user, token = auth_service.register(auth.email, auth.password, auth.display_name)
        return {"user": user, "token": token}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@app.post("/api/auth/login")
def login(auth: AuthRequest):
    try:
        user, token = auth_service.login(auth.email, auth.password)
        return {"user": user, "token": token}
    except ValueError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error

@app.get("/api/auth/me")
def me(user: dict = Depends(current_user)):
    return user

@app.get("/api/dashboard")
def dashboard(user: dict = Depends(current_user)):
    return auth_service.dashboard(user["id"])

@app.post("/api/sessions")
def save_session(req: SaveSessionRequest, user: dict = Depends(current_user)):
    session_id = auth_service.save_practice_session(
        user["id"], req.scenario_id, req.level,
        json.dumps([message.model_dump() for message in req.conversation]),
        json.dumps(req.assessment) if req.assessment else None,
    )
    return {"id": session_id, "success": True}

@app.post("/api/chat")
async def chat_interaction(req: ChatRequest):
    scenario = SCENARIOS.get(req.scenario_id)
    if not scenario:
        system_prompt = (
            f"You are roleplaying in the following scenario: {req.custom_role or 'English conversation partner'}. "
            "Engage in authentic dialogue, ask thoughtful questions, and keep answers to 2-4 sentences."
        )
    else:
        system_prompt = scenario["system_prompt"]
    level = req.level if req.level in {"Beginner", "Intermediate", "Advanced"} else "Intermediate"
    system_prompt += (
        f"\nThe learner selected {level} level. Adapt vocabulary, question complexity, and correction expectations to that level. "
        "Do not announce the level unless the learner asks."
    )

    dict_messages = [{"role": m.role, "content": m.content} for m in req.messages]
    reply_text = await ai_service.generate_response(dict_messages, system_prompt)

    return {
        "reply": reply_text,
        "scenario_id": req.scenario_id
    }

@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    """
    Generates high-definition neural MP3 audio stream for any English text.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    voice_id = req.voice or "en-US-GuyNeural"
    try:
        audio_bytes = await audio_service.generate_speech_bytes(req.text, voice=voice_id)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation error: {str(e)}")

@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribes spoken voice to text using Whisper-large-v3.
    """
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file")

    text = await audio_service.transcribe_audio_bytes(content, filename=audio.filename or "recording.webm")
    if not text:
        raise HTTPException(
            status_code=502,
            detail="We could not transcribe that recording. Check your microphone and Groq configuration, then try again.",
        )
    return {"text": text}

@app.post("/api/assess")
async def assess_conversation(req: AssessRequest):
    """
    Runs CEFR evaluation, grammar and vocabulary corrections, score and drill guidance.
    """
    scenario = SCENARIOS.get(req.scenario_id, {"title": "Conversational Practice"})
    dict_conv = [{"role": m.role, "content": m.content} for m in req.conversation]
    result = await assessment_service.evaluate_transcript(scenario["title"], dict_conv)
    return result

@app.post("/api/settings")
def update_runtime_settings(up: SettingsUpdate):
    if up.groq_api_key is not None:
        settings.GROQ_API_KEY = up.groq_api_key
        ai_service.update_keys(groq_key=up.groq_api_key)
        audio_service.update_key(up.groq_api_key)
        assessment_service.update_key(up.groq_api_key)
    if up.colab_backend_url is not None:
        settings.COLAB_BACKEND_URL = up.colab_backend_url
        ai_service.update_keys(colab_url=up.colab_backend_url)

    return {
        "success": True,
        "groq_configured": bool(settings.GROQ_API_KEY),
        "colab_configured": bool(settings.COLAB_BACKEND_URL)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
