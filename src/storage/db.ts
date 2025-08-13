import type { Db, Workout, Session } from '../types';

const STORAGE_KEY = '@gym_ts_v3';

// Fallback para crypto.randomUUID()
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback simples
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Carrega dados do localStorage
export async function loadDb(): Promise<Db> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { workouts: [], sessions: [] };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading database:', error);
    return { workouts: [], sessions: [] };
  }
}

// Salva dados no localStorage
export async function saveDb(db: Db): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// CRUD operations
export async function createWorkout(name: string): Promise<Workout> {
  const db = await loadDb();
  const workout: Workout = {
    id: generateId(),
    name,
    exercises: [],
    createdAt: new Date().toISOString(),
  };
  
  db.workouts.push(workout);
  await saveDb(db);
  return workout;
}

export async function updateWorkout(id: string, updates: Partial<Workout>): Promise<void> {
  const db = await loadDb();
  const index = db.workouts.findIndex(w => w.id === id);
  if (index !== -1) {
    db.workouts[index] = { ...db.workouts[index], ...updates };
    await saveDb(db);
  }
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await loadDb();
  db.workouts = db.workouts.filter(w => w.id !== id);
  // Remove sessões do treino também
  db.sessions = db.sessions.filter(s => s.workoutId !== id);
  await saveDb(db);
}

export async function createSession(session: Omit<Session, 'id'>): Promise<Session> {
  const db = await loadDb();
  const newSession: Session = {
    ...session,
    id: generateId(),
  };
  
  db.sessions.push(newSession);
  await saveDb(db);
  return newSession;
}

export async function deleteSession(id: string): Promise<void> {
  const db = await loadDb();
  db.sessions = db.sessions.filter(s => s.id !== id);
  await saveDb(db);
}

export async function getWorkouts(): Promise<Workout[]> {
  const db = await loadDb();
  return db.workouts;
}

export async function getWorkout(id: string): Promise<Workout | undefined> {
  const db = await loadDb();
  return db.workouts.find(w => w.id === id);
}

export async function getSessions(): Promise<Session[]> {
  const db = await loadDb();
  return db.sessions;
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await loadDb();
  return db.sessions.find(s => s.id === id);
}