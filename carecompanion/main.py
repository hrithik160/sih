import sqlite3
import uvicorn
from datetime import datetime
from uuid import uuid4
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from ai_dda_engine import evaluate_patient_session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 0. Initialize SQLite Database
def init_db():
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry_logs (
            log_uuid TEXT PRIMARY KEY,
            game_id TEXT,
            latency_ms REAL,
            error_count INTEGER,
            duration_sec REAL,
            timestamp TEXT,
            patient_email TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS routines (
            task_id TEXT PRIMARY KEY,
            patient_email TEXT,
            title TEXT,
            detail TEXT,
            category TEXT,
            scheduled_time TEXT,
            is_completed INTEGER,
            requires_photo INTEGER,
            ai_audit_status TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            role TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            email TEXT PRIMARY KEY,
            name TEXT,
            caregiver TEXT,
            stage TEXT,
            doctor_email TEXT,
            emergencyPhone TEXT,
            dementia_level INTEGER
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctors (
            email TEXT PRIMARY KEY,
            name TEXT,
            specialty TEXT,
            hospital TEXT,
            certificate TEXT
        )
    ''')
    
    # Simple migration in case the table already exists without the certificate column
    try:
        cursor.execute("ALTER TABLE doctors ADD COLUMN certificate TEXT")
    except sqlite3.OperationalError:
        pass # Column already exists
        
    conn.commit()
    conn.close()

init_db()

# 1. Define what the offline data looks like
class TelemetryLog(BaseModel):
    model_config = {"extra": "ignore"}
    log_uuid: Optional[str] = None
    game_id: Optional[str] = "Memory Match"
    latency_ms: Optional[float] = 1500.0
    error_count: Optional[int] = 0
    duration_sec: Optional[float] = 30.0
    timestamp: Optional[str] = None
    patient_email: Optional[str] = "unknown"

class SyncPayload(BaseModel):
    model_config = {"extra": "ignore"}
    logs: List[TelemetryLog]

class RoutineRequest(BaseModel):
    task_id: str
    patient_email: str
    title: str
    detail: str
    category: str
    scheduled_time: str
    requires_photo: int
    ai_audit_status: str

class LoginRequest(BaseModel):
    email: str

class PatientRegisterRequest(BaseModel):
    email: str
    name: str
    caregiver: str
    doctor_email: str
    emergencyPhone: str
    dementia_level: int
    stage: str

class DoctorRegisterRequest(BaseModel):
    email: str
    name: str
    specialty: str
    hospital: str
    certificate: str

# 2. Create the Cloud Sync Endpoint
@app.post("/api/sync")
async def sync_offline_data(payload: SyncPayload):
    print("========================================")
    print(f"[SYNC INITIATED] Received {len(payload.logs)} offline records")
    print("========================================")
    
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    
    synced_count = 0
    for log in payload.logs:
        try:
            log_id = log.log_uuid or str(uuid4())
            ts = log.timestamp or datetime.utcnow().isoformat()
            email = log.patient_email or "unknown"
            
            # Use IGNORE to ensure idempotency based on log_uuid
            cursor.execute('''
                INSERT OR IGNORE INTO telemetry_logs (log_uuid, game_id, latency_ms, error_count, duration_sec, timestamp, patient_email)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (log_id, log.game_id, log.latency_ms, log.error_count, log.duration_sec, ts, email))
            
            if cursor.rowcount > 0:
                print(f"Saved to DB -> {log.game_id} | Patient: {email} | Latency: {log.latency_ms}ms | Errors: {log.error_count}")
                synced_count += 1
        except Exception as e:
            print(f"Error saving log {log.log_uuid}: {e}")
            
    conn.commit()
    conn.close()
        
    print(f"[SYNC COMPLETED] {synced_count} new records successfully synced to cloud database.\n")
    return {"status": "success", "synced_count": synced_count}

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

@app.post("/api/login")
def login(data: LoginRequest):
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM users WHERE email = ?", (data.email,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return {"exists": False}
        
    role = user[0]
    if role == "patient":
        cursor.execute("SELECT * FROM patients WHERE email = ?", (data.email,))
        p = cursor.fetchone()
        conn.close()
        return {
            "exists": True,
            "role": "patient",
            "data": {
                "id": p[0],
                "email": p[0],
                "name": p[1],
                "caregiver": p[2],
                "stage": p[3],
                "doctorName": p[4], # mapped as doctorName for now
                "emergencyPhone": p[5],
                "dementia_level": p[6]
            }
        }
    else:
        cursor.execute("SELECT * FROM doctors WHERE email = ?", (data.email,))
        d = cursor.fetchone()
        conn.close()
        return {
            "exists": True,
            "role": "doctor",
            "data": {
                "id": d[0],
                "email": d[0],
                "name": d[1],
                "specialty": d[2],
                "hospital": d[3],
                "certificate": d[4] if len(d) > 4 else ''
            }
        }

@app.post("/api/register/patient")
def register_patient(data: PatientRegisterRequest):
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    
    # check doctor exists
    cursor.execute("SELECT * FROM doctors WHERE email = ?", (data.doctor_email,))
    doc = cursor.fetchone()
    if not doc:
        conn.close()
        return {"success": False, "message": "Doctor not found"}
        
    cursor.execute("INSERT OR REPLACE INTO users (email, role) VALUES (?, ?)", (data.email, "patient"))
    cursor.execute("INSERT OR REPLACE INTO patients (email, name, caregiver, stage, doctor_email, emergencyPhone, dementia_level) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                   (data.email, data.name, data.caregiver, data.stage, data.doctor_email, data.emergencyPhone, data.dementia_level))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/api/register/doctor")
def register_doctor(data: DoctorRegisterRequest):
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO users (email, role) VALUES (?, ?)", (data.email, "doctor"))
    cursor.execute("INSERT OR REPLACE INTO doctors (email, name, specialty, hospital, certificate) VALUES (?, ?, ?, ?, ?)", 
                   (data.email, data.name, data.specialty, data.hospital, data.certificate))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/doctor/patients/{email}")
def get_doctor_patients(email: str):
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    cursor.execute("SELECT email, name, caregiver, stage, emergencyPhone, dementia_level FROM patients WHERE doctor_email = ?", (email,))
    patients = cursor.fetchall()
    conn.close()
    
    return {
        "patients": [
            {
                "id": p[0],
                "email": p[0],
                "name": p[1],
                "caregiver": p[2],
                "stage": p[3],
                "emergencyPhone": p[4],
                "dementia_level": p[5]
            } for p in patients
        ]
    }

@app.get("/api/patients/{email}/telemetry")
def get_patient_telemetry(email: str):
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM telemetry_logs WHERE patient_email = ?", (email,))
    logs = cursor.fetchall()
    conn.close()
    return {
        "logs": [
            {
                "log_uuid": r[0], "game_id": r[1], "latency_ms": r[2], "error_count": r[3],
                "duration_sec": r[4], "timestamp": r[5], "patient_email": r[6]
            } for r in logs
        ]
    }

@app.get("/api/patients/{email}/routines")
def get_patient_routines(email: str):
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM routines WHERE patient_email = ?", (email,))
    rts = cursor.fetchall()
    conn.close()
    return {
        "routines": [
            {
                "task_id": r[0], "patient_email": r[1], "title": r[2], "detail": r[3],
                "category": r[4], "scheduled_time": r[5], "is_completed": r[6],
                "requires_photo": r[7], "ai_audit_status": r[8]
            } for r in rts
        ]
    }

@app.post("/api/routines")
def create_routine(data: RoutineRequest):
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO routines (task_id, patient_email, title, detail, category, scheduled_time, is_completed, requires_photo, ai_audit_status)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    ''', (data.task_id, data.patient_email, data.title, data.detail, data.category, data.scheduled_time, data.requires_photo, data.ai_audit_status))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/routines/{task_id}")
def delete_routine(task_id: str):
    conn = sqlite3.connect('carelink_v2.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM routines WHERE task_id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
