import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

app = FastAPI(title="GuruAI Mentor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatRequest(BaseModel):
    message: str
    language: str = "Hinglish"
    personality: str = "Friendly"


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/chat")
def chat(req: ChatRequest):
    if not os.getenv("OPENAI_API_KEY"):
        return {"reply": "OpenAI key missing. .env me OPENAI_API_KEY add karo."}

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": f"You are GuruAI, a {req.personality} mentor. Reply in {req.language}. Keep answers short and useful.",
            },
            {"role": "user", "content": req.message},
        ],
    )
    return {"reply": response.choices[0].message.content}
