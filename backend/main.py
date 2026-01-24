import os
import uvicorn
import time
import json
from typing import Optional, Dict
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

# --- PERSISTENT RATE LIMITING ---
DB_FILE = "usage_db.json"
FREE_LIMIT_DAILY = 3
RESET_PERIOD = 86400  # 24 hours in seconds

def load_db() -> Dict:
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_db(db: Dict):
    try:
        with open(DB_FILE, "w") as f:
            json.dump(db, f)
    except Exception as e:
        print(f"Failed to save DB: {e}")

# Load DB on startup
USAGE_DB = load_db()

def check_rate_limit(ip: str, is_pro: bool):
    """
    Checks if the IP has exceeded the daily limit.
    """
    if is_pro: 
        return

    now = time.time()
    record = USAGE_DB.get(ip)

    # New User
    if not record:
        USAGE_DB[ip] = {"count": 1, "reset_time": now + RESET_PERIOD}
        save_db(USAGE_DB)
        return

    # Period Expired -> Reset
    if now > record["reset_time"]:
        USAGE_DB[ip] = {"count": 1, "reset_time": now + RESET_PERIOD}
        save_db(USAGE_DB)
        return

    # Limit Reached
    if record["count"] >= FREE_LIMIT_DAILY:
        print(f"Rate Limit Hit for IP: {ip}")
        raise HTTPException(
            status_code=429, 
            detail="Daily free generation limit reached. Please upgrade to Pro."
        )

    # Increment Usage
    record["count"] += 1
    save_db(USAGE_DB)

class GenerateRequest(BaseModel):
    provider: str
    system_prompt: str
    user_prompt: str
    # If the frontend sends a key, we use it. Otherwise, we use the server's env var.
    api_key: Optional[str] = None
    is_pro: bool = False # New field to bypass limits

@app.get("/")
def health_check():
    return {"status": "ok", "message": "TranceState Backend is active"}

@app.post("/generate")
async def generate_script(req: GenerateRequest, request: Request):
    # 1. Rate Limit Check
    client_ip = request.client.host or "unknown"
    check_rate_limit(client_ip, req.is_pro)

    provider = req.provider.lower()
    
    # 2. Determine API Key
    # Priority: Request Body Key > Server Environment Variable
    api_key = req.api_key
    
    env_var_name = ""
    
    if not api_key:
        if provider == "deepseek":
            api_key = os.environ.get("DEEPSEEK_API_KEY")
            env_var_name = "DEEPSEEK_API_KEY"
        elif provider == "openai":
            api_key = os.environ.get("OPENAI_API_KEY")
            env_var_name = "OPENAI_API_KEY"
        elif provider == "gemini":
            api_key = os.environ.get("GEMINI_API_KEY")
            env_var_name = "GEMINI_API_KEY"
            
    if not api_key:
        raise HTTPException(
            status_code=400, 
            detail=f"No API key configured for '{provider}'. Server expected env var: {env_var_name}"
        )

    # 3. Call the AI Provider
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
                            {"role": "system", "content": req.system_prompt},
                            {"role": "user", "content": req.user_prompt}
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
                            "parts": [{"text": f"{req.system_prompt}\n\n{req.user_prompt}"}]
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
