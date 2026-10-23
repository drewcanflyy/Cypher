import os
import io
import edge_tts
from groq import Groq
from backend.config import settings

VOICES = {
    "male_us": "en-US-GuyNeural",
    "female_us": "en-US-AriaNeural",
    "male_gb": "en-GB-RyanNeural",
    "female_gb": "en-GB-SoniaNeural"
}

class AudioService:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.groq_client = Groq(api_key=self.groq_api_key) if self.groq_api_key else None

    def update_key(self, groq_key: str):
        self.groq_api_key = groq_key
        self.groq_client = Groq(api_key=groq_key) if groq_key else None

    async def generate_speech_bytes(self, text: str, voice: str = "en-US-GuyNeural") -> bytes:
        """
        Converts text to MP3 audio bytes using Microsoft Edge-TTS neural voices.
        Zero cost, human-like cadence, crystal-clear pronunciation.
        """
        communicate = edge_tts.Communicate(text, voice)
        mp3_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                mp3_buffer.write(chunk["data"])
        return mp3_buffer.getvalue()

    async def transcribe_audio_bytes(self, audio_bytes: bytes, filename: str = "input.wav") -> str:
        """
        Transcribes user voice recording to text using Whisper-large-v3 via Groq or Colab.
        """
        if self.groq_client:
            try:
                transcription = self.groq_client.audio.transcriptions.create(
                    file=(filename, audio_bytes),
                    model="whisper-large-v3",
                    response_format="text",
                    language="en"
                )
                return str(transcription).strip()
            except Exception as error:
                print(f"[AudioService] Whisper error: {error}")
                return ""
        return ""

audio_service = AudioService()
