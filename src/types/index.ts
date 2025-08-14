export type ExerciseType = 'PESO' | 'ALONGAMENTO' | 'AEROBICO';

export type Media = { 
  uri: string; 
  kind: 'image' | 'video' 
};

export type WorkoutExercise = {
  name: string;
  type: ExerciseType;
  media?: Media; // mídia associada ao EXERCÍCIO
};

export type Workout = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: string;
};

export type SetTriple = [number | null, number | null, number | null]; // S1,S2,S3

export type SessionExerciseLog =
  | { exerciseName: string; type: 'PESO'; sets: SetTriple }
  | { exerciseName: string; type: 'ALONGAMENTO'; seconds: number | null }
  | { exerciseName: string; type: 'AEROBICO'; minutes: number | null };

export type Session = {
  id: string;
  workoutId: string;
  startedAt: string; // ISO
  endedAt: string;   // ISO
  entries: SessionExerciseLog[];
  calories?: number; // Estimativa de calorias queimadas
};

export type Db = { 
  workouts: Workout[]; 
  sessions: Session[] 
};