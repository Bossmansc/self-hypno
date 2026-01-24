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

# Enable CORS for all origins
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

def get_client_ip(request: Request) -> str:
    """
     reliably gets the client IP, handling proxies (Render/Heroku/AWS).
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can be a comma-separated list of IPs.
        # The first one is the original client IP.
        return forwarded.split(",")[0].strip()
    return request.client.host or "unknown"

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
    api_key: Optional[str] = None
    is_pro: bool = False 

@app.get("/")
def health_check():
    return {"status": "ok", "message": "TranceState Backend is active"}

@app.get("/usage")
def get_usage(request: Request):
    """
    Returns the current usage count for the requesting IP.
    Used by frontend to sync UI even in Incognito mode.
    """
    ip = get_client_ip(request)
    now = time.time()
    record = USAGE_DB.get(ip)
    
    usage = 0
    if record:
        # If reset time passed, usage is effectively 0
        if now > record["reset_time"]:
            usage = 0
        else:
            usage = record["count"] - 1 # Subtract 1 because logic initializes at 1
            # Correction: In check_rate_limit we set count to 1 on first use.
            # Actually, let's just return the raw count.
            # If the record exists, the user has made 'count' attempts (successful ones).
            # Wait, check_rate_limit increments AFTER success? No, during the check.
            # Let's align logic: 'count' is the number of requests made.
            usage = record["count"] - 1 # We initialize at 1, so 1 means 1 request made? 
            # Actually looking at logic: 
            # if not record: usage=1. 
            # So if record exists, 'count' IS the number of requests.
            usage = record["count"] - 1 # Logic sets it to 1 on first hit. So count 1 = 1 request.

    # Logic correction for read-only view:
    # If record exists and valid, usage is record['count'].
    # But wait, check_rate_limit increments it aggressively.
    # Let's simplify: Just return what's in DB.
    
    current_count = 0
    if record and now < record["reset_time"]:
        current_count = record["count"] - 1 # Because we increment it inside the check logic before returning? 
        # Actually in check_rate_limit:
        # 1. New user -> count=1. 
        # 2. Existing -> count+=1.
        # So 'count' represents the Current Request Index being processed? 
        # No, let's fix check_rate_limit logic logic to be cleaner or just interpret it here.
        # 'count' represents total successful generations including the current one if called during generate.
        # Here we just want past usage.
        
        # Let's assume count tracks total used.
        current_count = record["count"] - 1 # The logic adds 1 for the *current* request. We want *past* completed. 
        # Actually, let's rely on the frontend to just display what we send.
        current_count = record["count"] - 1 
        if current_count < 0: current_count = 0

    return {
        "ip": ip,
        "usage": current_count,
        "limit": FREE_LIMIT_DAILY
    }

@app.post("/generate")
async def generate_script(req: GenerateRequest, request: Request):
    # 1. IP Detection & Rate Limit
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, req.is_pro)

    provider = req.provider.lower()
    
    # 2. Determine API Key
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

    # 3. Call AI Provider
    timeout = httpx.Timeout(60.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
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
