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

    @staticmethod
    def _fallback_turn_analysis(messages: list[dict], reply: str) -> dict:
        last_user_message = next((item.get("content", "") for item in reversed(messages) if item.get("role") == "user"), "")
        normalized = last_user_message.lower().strip()
        word_count = len(normalized.split())
        uncertainty_markers = ("i don't know", "i do not know", "not sure", "i am not sure", "idk", "no idea")
        if any(marker in normalized for marker in uncertainty_markers):
            quality, delta, signal = 25, 20, "The answer sounded uncertain, so the partner needs a clearer response."
        elif word_count < 8:
            quality, delta, signal = 42, 12, "The answer was very brief; adding an example would lower the pressure."
        elif word_count >= 28:
            quality, delta, signal = 82, -14, "The answer was developed and specific, which eased the pressure."
        else:
            quality, delta, signal = 64, -5, "The answer gave the conversation something clear to build on."
        return {"reply": reply, "response_quality": quality, "pressure_delta": delta, "response_signal": signal}

    async def classify_answer_attempt(self, messages: list[dict]) -> str:
        """Classify whether the latest learner turn answers the current prompt."""
        last_user_message = next((item.get("content", "") for item in reversed(messages) if item.get("role") == "user"), "")
        normalized = last_user_message.lower().strip()
        skip_markers = ("i don't know", "i do not know", "not sure", "i am not sure", "idk", "no idea")
        if any(marker in normalized for marker in skip_markers):
            return "skip"

        if self.groq_client:
            try:
                completion = self.groq_client.chat.completions.create(
                    model=settings.DEFAULT_LLM_MODEL,
                    messages=[
                        {"role": "system", "content": "Decide whether the learner's latest reply answers the partner's current question. Reply with exactly one word: ANSWER, RETRY, or SKIP. ANSWER means it addresses the question, even with imperfect English. RETRY means it is unrelated, empty, or too vague. SKIP means the learner explicitly says they do not know."},
                        {"role": "user", "content": "Conversation:\n" + "\n".join(f"{item.get('role')}: {item.get('content')}" for item in messages[-4:])},
                    ],
                    temperature=0,
                    max_tokens=5,
                )
                label = completion.choices[0].message.content.strip().upper()
                if "SKIP" in label:
                    return "skip"
                if "RETRY" in label:
                    return "retry"
                if "ANSWER" in label:
                    return "answer"
            except Exception as error:
                print(f"[AIService] Attempt classifier error: {error}")

        return "retry" if len(normalized.split()) < 5 else "answer"

    async def generate_response(self, messages: list[dict], system_prompt: str, temperature: float = 0.7, include_turn_analysis: bool = False) -> str | dict:
        """
        Generates roleplay conversational response using Groq or Colab tunnel.
        """
        if include_turn_analysis:
            system_prompt += """

Return ONLY valid JSON in this exact shape:
{
  "reply": "your natural roleplay response",
  "response_quality": 0,
  "pressure_delta": 0,
  "response_signal": "a concise explanation"
}
Score the learner's most recent answer, not their whole history. response_quality is 0-100.
pressure_delta must be an integer from -25 to 35: use a negative value for a clear, relevant, developed answer; use a positive value for an unclear, off-topic, extremely short, or uncertain answer such as "I don't know". response_signal must be a short supportive explanation of why pressure rose or fell. Do not mention these hidden scores in reply.
"""
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages

        # 1. Try Groq (Llama 3.3 70B / 3.1 8B)
        if self.groq_client:
            try:
                completion_args = dict(
                    model=settings.DEFAULT_LLM_MODEL,
                    messages=formatted_messages,
                    temperature=temperature,
                    max_tokens=300
                )
                completion = self.groq_client.chat.completions.create(**completion_args)
                content = completion.choices[0].message.content.strip()
                if include_turn_analysis:
                    try:
                        analysis = json.loads(content)
                        return {
                            "reply": str(analysis.get("reply", "Could you tell me a little more?")).strip(),
                            "response_quality": max(0, min(100, int(analysis.get("response_quality", 50)))),
                            "pressure_delta": max(-25, min(35, int(analysis.get("pressure_delta", 0)))),
                            "response_signal": str(analysis.get("response_signal", "The answer was reviewed.")).strip(),
                        }
                    except (json.JSONDecodeError, TypeError, ValueError):
                        return self._fallback_turn_analysis(messages, content)
                return content
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
                        reply = data.get("reply", "")
                        if include_turn_analysis:
                            return {"reply": reply, "response_quality": 50, "pressure_delta": 0, "response_signal": "The answer was reviewed."}
                        return reply
            except Exception as e:
                print(f"[AIService] Colab call error: {e}")

        # 3. Fallback demo response if no key is configured yet
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "")
                break

        fallback_reply = (
            f"I hear you! You mentioned: \"{last_user_msg[:60]}...\". "
            "That's an insightful point. Can you elaborate on the specific actions or challenges you encountered?"
        )
        if include_turn_analysis:
            return self._fallback_turn_analysis(messages, fallback_reply)
        return fallback_reply

ai_service = AIService()
