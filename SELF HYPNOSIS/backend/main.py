import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
from dotenv import load_dotenv

# Load local .env file if it exists (for local development)
load_dotenv()

app = FastAPI()

# Enable CORS for all origins to allow your frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    provider: str
    system_prompt: str
    user_prompt: str
    # If the frontend sends a key, we use it. Otherwise, we use the server's env var.
    api_key: Optional[str] = None

@app.get("/")
def health_check():
    return {"status": "ok", "message": "TranceState Backend is active"}

@app.post("/generate")
async def generate_script(request: GenerateRequest):
    provider = request.provider.lower()
    
    # 1. Determine API Key
    # Priority: Request Body Key > Server Environment Variable
    api_key = request.api_key
    if not api_key:
        if provider == "deepseek":
            api_key = os.environ.get("DEEPSEEK_API_KEY")
        elif provider == "openai":
            api_key = os.environ.get("OPENAI_API_KEY")
        elif provider == "gemini":
            api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        raise HTTPException(
            status_code=400, 
            detail=f"No API key configured for {provider}. Please add DEEPSEEK_API_KEY to server environment variables."
        )

    # 2. Call the AI Provider
    timeout = httpx.Timeout(60.0, connect=10.0)
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            # --- OPENAI / DEEPSEEK (Compatible APIs) ---
            if provider == "openai" or provider == "deepseek":
                base_url = "https://api.openai.com/v1" if provider == "openai" else "https://api.deepseek.com"
                model = "gpt-4o-mini" if provider == "openai" else "deepseek-chat"
                
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": request.system_prompt},
                            {"role": "user", "content": request.user_prompt}
                        ],
                        "temperature": 0.7,
                        "stream": False
                    }
                )
                
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail=response.text)
                
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return {"content": content}

            # --- GEMINI ---
            elif provider == "gemini":
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                response = await client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{
                            "parts": [{"text": f"{request.system_prompt}\n\n{request.user_prompt}"}]
                        }]
                    }
                )
                
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail=response.text)
                    
                data = response.json()
                try:
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"content": content}
                except (KeyError, IndexError):
                    return {"content": "Error parsing Gemini response. Please try again."}

            else:
                raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

        except httpx.RequestError as e:
            print(f"Request Error: {e}")
            raise HTTPException(status_code=503, detail="Failed to connect to AI provider.")
        except Exception as e:
            print(f"General Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
