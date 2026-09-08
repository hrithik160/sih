import Dexie from 'dexie';

// 1. Declare the offline-first database
export const db = new Dexie('CareCompanionDB');

// 2. Define the schema (Only specify the primary keys and indexed fields used for searching)
db.version(1).stores({
  patient_profile: 'id', 
  telemetry_logs: '++id, game_id, sync_status', // sync_status indexed so we can easily find unsynced data
  schedule_and_audit: 'task_id, scheduled_time, is_completed',
  behavioral_logs: '++log_id, timestamp',
  sos_events: '++event_id, sync_status'
});

// 3. Seed initial data so the dashboard is ready for the hackathon demo
export async function seedInitialData() {
  const profileCount = await db.patient_profile.count();
  
  if (profileCount === 0) {
    console.log("🌱 Seeding initial database...");
    
    await db.patient_profile.add({
      id: 'PT-NER-104',
      name: 'Biren Baruah (Dadu Ji)',
      phone: '+91 98765 43210',
      assigned_doctor: 'Dr. Ananya Sengupta',
      dementia_stage: 'Moderate',
      current_ai_level: 2
    });

    await db.schedule_and_audit.bulkAdd([
      { 
        task_id: 'morning_water', 
        title: 'Drink Water & Walk', 
        detail: '1 Large Glass + 5 mins gentle morning sun',
        category: 'HEALTH ☀️',
        scheduled_time: '08:00', 
        is_completed: 0, 
        requires_photo: 0, 
        ai_audit_status: 'none' 
      },
      { 
        task_id: 'bp_meds', 
        title: 'Blood Pressure Pill', 
        detail: 'Donepezil 5mg • 1 Pill',
        category: 'MEDICATION 💊',
        scheduled_time: '19:30', 
        is_completed: 0, 
        requires_photo: 1, 
        ai_audit_status: 'pending' 
      }
    ]);
  }
}

// 4. Helper Function: Save a game score and mark it for AWS Sync
export async function saveTelemetryLocal(gameId, latency, errors, durationSec) {
  await db.telemetry_logs.add({
    game_id: gameId,
    timestamp: new Date().toISOString(),
    latency_ms: latency,
    error_count: errors,
    duration_sec: durationSec,
    sync_status: 0 // 0 means offline/unsynced. We change to 1 when AWS receives it.
  });
}