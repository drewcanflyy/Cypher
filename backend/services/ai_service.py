import os
import json
import httpx
from groq import Groq
from backend.config import settings

class AIService:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.colab_url = settings.COLAB_BACKEND_URL or os.getenv("COLAB_BACKEND_URL", "")
        self.groq_client = Groq(api_key=self.groq_api_key) if self.groq_api_key else None

    def update_keys(self, groq_key: str = None, colab_url: str = None):
        if groq_key is not None:
            self.groq_api_key = groq_key
            self.groq_client = Groq(api_key=groq_key) if groq_key else None
        if colab_url is not None:
            self.colab_url = colab_url.rstrip("/")

    async def generate_response(self, messages: list[dict], system_prompt: str, temperature: float = 0.7) -> str:
        """
        Generates roleplay conversational response using Groq or Colab tunnel.
        """
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages

        # 1. Try Groq (Llama 3.3 70B / 3.1 8B)
        if self.groq_client:
            try:
                completion = self.groq_client.chat.completions.create(
                    model=settings.DEFAULT_LLM_MODEL,
                    messages=formatted_messages,
                    temperature=temperature,
                    max_tokens=300
                )
                return completion.choices[0].message.content.strip()
            except Exception as e:
                print(f"[AIService] Groq call error: {e}")

        # 2. Try Colab URL if configured
        if self.colab_url:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        f"{self.colab_url}/chat",
                        json={"messages": formatted_messages, "temperature": temperature}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return data.get("reply", "")
            except Exception as e:
                print(f"[AIService] Colab call error: {e}")

        # 3. Fallback demo response if no key is configured yet
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "")
                break

        return (
            f"I hear you! You mentioned: \"{last_user_msg[:60]}...\". "
            "That's an insightful point. Can you elaborate on the specific actions or challenges you encountered?"
        )

ai_service = AIService()
