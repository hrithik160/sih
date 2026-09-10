import Dexie from 'dexie';

// 1. Declare the offline-first database
export const db = new Dexie('CareCompanionDB');

// 2. Define the schema
db.version(2).stores({
  patient_profile: 'id', 
  telemetry_logs: '++id, log_uuid, game_id, sync_status', 
  schedule_and_audit: 'task_id, scheduled_time, is_completed',
  behavioral_logs: '++log_id, timestamp',
  sos_events: '++event_id, sync_status'
});

// 3. Seed initial data so the dashboard is ready for the hackathon demo
export async function seedInitialData() {
  const profileCount = await db.patient_profile.count();
  
  // Only seed if the database is completely empty
  if (profileCount === 0) {
    console.log("🌱 Seeding initial dummy data...");
    
    // --- DUMMY PATIENT PROFILE ---
    await db.patient_profile.add({
      id: 'PT-NER-104',
      name: 'Biren Baruah (Dadu Ji)',
      phone: '+91 98765 43210',
      assigned_doctor: 'Dr. Ananya Sengupta',
      dementia_stage: 'Moderate',
      current_ai_level: 2
    });

    // --- DUMMY SCHEDULE & PRESCRIPTIONS ---
    await db.schedule_and_audit.bulkAdd([
      { 
        task_id: 'task_001', 
        title: 'Morning Water & Walk', 
        detail: '1 Large Glass + 10 mins gentle sun',
        category: 'HEALTH ☀️',
        scheduled_time: '08:00', 
        is_completed: 1, // Already done today
        requires_photo: 0, 
        ai_audit_status: 'none' 
      },
      { 
        task_id: 'med_001', 
        title: 'Donepezil', 
        detail: '5mg • 1 Pill (Morning)',
        category: 'MEDICATION 💊',
        scheduled_time: '09:00', 
        is_completed: 1, // Already taken
        requires_photo: 1, 
        ai_audit_status: 'verified' 
      },
      { 
        task_id: 'task_002', 
        title: 'Lunch & Rest', 
        detail: 'Have a light meal and rest',
        category: 'HEALTH 🍲',
        scheduled_time: '13:00', 
        is_completed: 0, 
        requires_photo: 0, 
        ai_audit_status: 'none' 
      },
      { 
        task_id: 'med_002', 
        title: 'Memantine', 
        detail: '10mg • 1 Pill (Afternoon)',
        category: 'MEDICATION 💊',
        scheduled_time: '14:30', 
        is_completed: 0, 
        requires_photo: 1, 
        ai_audit_status: 'pending' 
      },
      { 
        task_id: 'task_003', 
        title: 'Cognitive Therapy', 
        detail: 'Play 2 games on the tablet',
        category: 'ACTIVITY 🧠',
        scheduled_time: '16:00', 
        is_completed: 0, 
        requires_photo: 0, 
        ai_audit_status: 'none' 
      },
      { 
        task_id: 'med_003', 
        title: 'Amlodipine (Blood Pressure)', 
        detail: '5mg • 1 Pill (Night)',
        category: 'MEDICATION 💊',
        scheduled_time: '20:00', 
        is_completed: 0, 
        requires_photo: 1, 
        ai_audit_status: 'pending' 
      }
    ]);

    // --- DUMMY PAST GAME SCORES (For Doctor Analytics) ---
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await db.telemetry_logs.bulkAdd([
      {
        log_uuid: crypto.randomUUID(),
        game_id: 'Memory Match',
        timestamp: yesterday.toISOString(),
        latency_ms: 1850,
        error_count: 2,
        duration_sec: 45.2,
        sync_status: 1 // 1 means already synced to AWS
      },
      {
        log_uuid: crypto.randomUUID(),
        game_id: 'The Tray',
        timestamp: yesterday.toISOString(),
        latency_ms: 2100,
        error_count: 0,
        duration_sec: 30.5,
        sync_status: 1
      },
      {
        log_uuid: crypto.randomUUID(),
        game_id: 'Heritage Match',
        timestamp: new Date().toISOString(), // Played today
        latency_ms: 1400,
        error_count: 1,
        duration_sec: 28.1,
        sync_status: 0 // Waiting to sync
      }
    ]);
  }
}

// 4. Helper Function: Save a game score and mark it for AWS Sync
export async function saveTelemetryLocal(gameId, latency, errors, durationSec, patientEmail) {
  await db.telemetry_logs.add({
    log_uuid: crypto.randomUUID(),
    game_id: gameId,
    timestamp: new Date().toISOString(),
    latency_ms: latency,
    error_count: errors,
    duration_sec: durationSec,
    sync_status: 0,
    patient_email: patientEmail || 'unknown'
  });
}