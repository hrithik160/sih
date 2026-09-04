from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
# Import the prediction function from the AI script we wrote earlier
from ai_dda_engine import evaluate_patient_session 

app = FastAPI()

# --- CORS Configuration ---
# Because allow_credentials is set to True, the CORS specification dictates that we cannot use a wildcard ["*"] for allow_origins.
# We must explicitly list the local React development ports.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"], # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all HTTP headers
)

# Define the data structure React will send us
class GameSessionData(BaseModel):
    latency_ms: float
    error_count: int
    completion_sec: float
    baseline_stage: int

# Create the API Endpoint
@app.post("/api/evaluate")
def evaluate_game(data: GameSessionData):
    # Feed React's telemetry into the Decision Tree
    new_difficulty = evaluate_patient_session(
        latency=data.latency_ms,
        errors=data.error_count,
        time_sec=data.completion_sec,
        stage=data.baseline_stage
    )
    
    print(f"AI evaluated session. New difficulty assigned: Level {new_difficulty}")
    return {"new_level": new_difficulty}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)