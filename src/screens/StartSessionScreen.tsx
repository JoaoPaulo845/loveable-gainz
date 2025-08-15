import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Save, X } from 'lucide-react';
import { Workout, SessionExerciseLog, SetTriple } from '../types';
import { getWorkout, createSession } from '../storage/db';
import { getGlobalAvgSeconds, getGlobalLastSeconds, getGlobalAvgMinutes, getGlobalLastMinutes } from '../utils/metrics';
import { WeightSetInputs } from '../components/WeightSetInputs';
import { MediaThumb } from '../components/MediaThumb';
import { MediaViewer } from '../components/MediaViewer';

interface StartSessionScreenProps {
  workoutId: string | null;
  onSessionComplete: () => void;
  onCancel: () => void;
}

export function StartSessionScreen({ workoutId, onSessionComplete, onCancel }: StartSessionScreenProps) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [entries, setEntries] = useState<SessionExerciseLog[]>([]);
  const [hints, setHints] = useState<Map<string, { avg: number | null; last: number | null }>>(new Map());
  const [viewerMedia, setViewerMedia] = useState(null);
  const [startTime] = useState(() => {
    const saved = localStorage.getItem(`session-${workoutId}`);
    return saved ? JSON.parse(saved).startTime : new Date().toISOString();
  });

  // Calculate calories automatically based on exercises
  const calculateCalories = (entries: SessionExerciseLog[]): number => {
    let totalCalories = 0;
    
    entries.forEach(entry => {
      if (entry.type === 'PESO') {
        // Count non-null sets and multiply by 6 kcal per set
        const completedSets = entry.sets.filter(set => set !== null).length;
        totalCalories += completedSets * 6;
      } else if (entry.type === 'AEROBICO') {
        // Minutes * 6 kcal per minute
        if (entry.minutes) {
          totalCalories += entry.minutes * 6;
        }
      }
      // Ignore ALONGAMENTO
    });
    
    return totalCalories;
  };

  // Save session data to localStorage whenever entries change
  useEffect(() => {
    if (workoutId && entries.length > 0) {
      const calories = calculateCalories(entries);
      localStorage.setItem(`session-${workoutId}`, JSON.stringify({
        workoutId,
        startTime,
        entries,
        calories
      }));
    }
  }, [workoutId, entries, startTime]);

  // Reload workout data when coming back to session screen
  useEffect(() => {
    if (workoutId) {
      loadWorkout();
    }
    
    // Set up interval to check for workout updates every 2 seconds
    const interval = setInterval(() => {
      if (workoutId) {
        loadWorkout();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [workoutId]);

  // Force re-render when workout changes to update entries
  useEffect(() => {
    if (workout) {
      // Try to restore saved session data first
      const savedSession = localStorage.getItem(`session-${workoutId}`);
      
      if (savedSession) {
        const { entries: savedEntries } = JSON.parse(savedSession);
        
        // Sync saved entries with current workout exercises
        const syncedEntries: SessionExerciseLog[] = workout.exercises.map(exercise => {
          // Find existing entry for this exercise
          const existingEntry = savedEntries.find((entry: SessionExerciseLog) => 
            entry.exerciseName === exercise.name && entry.type === exercise.type
          );
          
          if (existingEntry) {
            return existingEntry;
          } else {
            // Create new entry for new exercise
            switch (exercise.type) {
              case 'PESO':
                return { exerciseName: exercise.name, type: 'PESO' as const, sets: [null, null, null] as SetTriple };
              case 'ALONGAMENTO':
                return { exerciseName: exercise.name, type: 'ALONGAMENTO' as const, seconds: null };
              case 'AEROBICO':
                return { exerciseName: exercise.name, type: 'AEROBICO' as const, minutes: null };
              default:
                throw new Error(`Unknown exercise type: ${exercise.type}`);
            }
          }
        });
        
        setEntries(syncedEntries);
      } else {
        // Create initial entries if no saved session
        const initialEntries: SessionExerciseLog[] = workout.exercises.map(exercise => {
          switch (exercise.type) {
            case 'PESO':
              return { exerciseName: exercise.name, type: 'PESO' as const, sets: [null, null, null] as SetTriple };
            case 'ALONGAMENTO':
              return { exerciseName: exercise.name, type: 'ALONGAMENTO' as const, seconds: null };
            case 'AEROBICO':
              return { exerciseName: exercise.name, type: 'AEROBICO' as const, minutes: null };
            default:
              throw new Error(`Unknown exercise type: ${exercise.type}`);
          }
        });
        setEntries(initialEntries);
      }
    }
  }, [workout?.exercises, workoutId]);

  const loadWorkout = async () => {
    if (!workoutId) return;
    
    try {
      const workoutData = await getWorkout(workoutId);
      if (workoutData) {
        // Only update if the workout has actually changed
        const workoutChanged = !workout || 
          workout.exercises.length !== workoutData.exercises.length ||
          JSON.stringify(workout.exercises) !== JSON.stringify(workoutData.exercises);
        
        if (workoutChanged) {
          setWorkout(workoutData);
        }
        
        // Always reload hints as they may have changed
        const newHints = new Map();
        for (const exercise of workoutData.exercises) {
          if (exercise.type === 'ALONGAMENTO') {
            const [avg, last] = await Promise.all([
              getGlobalAvgSeconds(exercise.name),
              getGlobalLastSeconds(exercise.name),
            ]);
            newHints.set(exercise.name, { avg, last });
          } else if (exercise.type === 'AEROBICO') {
            const [avg, last] = await Promise.all([
              getGlobalAvgMinutes(exercise.name),
              getGlobalLastMinutes(exercise.name),
            ]);
            newHints.set(exercise.name, { avg, last });
          }
        }
        setHints(newHints);
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    }
  };

  const updateEntry = (index: number, updates: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], ...updates };
    setEntries(newEntries);
  };

  const handleSaveSession = async () => {
    if (!workout) return;

    const session = {
      workoutId: workout.id,
      startedAt: startTime,
      endedAt: new Date().toISOString(),
      entries,
      calories: calculateCalories(entries),
    };

    await createSession(session);
    // Clear saved session data after successful save
    localStorage.removeItem(`session-${workoutId}`);
    onSessionComplete();
  };

  const handleCancelSession = () => {
    // Clear saved session data when canceling
    localStorage.removeItem(`session-${workoutId}`);
    onCancel();
  };

  const formatHint = (value: number | null): string => {
    return value !== null ? value.toFixed(1) : '-';
  };

  if (!workoutId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Nenhuma sessão ativa</h2>
          <p className="text-muted-foreground">Inicie um treino na aba Treinos</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Carregando treino...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{workout.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {new Date(startTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <X className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Cancelar</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Sessão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar a sessão? Todos os dados serão perdidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full">Continuar Sessão</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelSession} className="w-full">
                      Cancelar Sessão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button onClick={handleSaveSession} size="sm" className="flex-1 sm:flex-none">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salvar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {workout.exercises.map((exercise, index) => {
          const entry = entries[index];
          if (!entry) return null; // Proteção contra entry undefined
          const exerciseHints = hints.get(exercise.name);

          return (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg leading-tight">
                      {exercise.name}
                    </CardTitle>
                    {exercise.description && (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                  {exercise.media && (
                    <div className="flex-shrink-0">
                      <MediaThumb
                        media={exercise.media}
                        onPress={() => setViewerMedia(exercise.media)}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {exercise.type === 'PESO' && entry.type === 'PESO' && (
                  <WeightSetInputs
                    workoutId={workout.id}
                    exerciseName={exercise.name}
                    sets={entry.sets}
                    onChange={(sets: SetTriple) => updateEntry(index, { sets })}
                  />
                )}

                {exercise.type === 'ALONGAMENTO' && entry.type === 'ALONGAMENTO' && (
                  <div className="space-y-2">
                    <Label htmlFor={`stretch-${index}`} className="text-sm font-medium">
                      Tempo (segundos)
                    </Label>
                    <Input
                      id={`stretch-${index}`}
                      type="number"
                      inputMode="numeric"
                      placeholder="Segundos"
                      value={entry.seconds ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        updateEntry(index, { seconds: value });
                      }}
                      className="text-center text-lg h-12"
                    />
                    {exerciseHints && (
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>Últ: {formatHint(exerciseHints.last)}</span>
                        <span>Méd: {formatHint(exerciseHints.avg)}</span>
                      </div>
                    )}
                  </div>
                )}

                {exercise.type === 'AEROBICO' && entry.type === 'AEROBICO' && (
                  <div className="space-y-2">
                    <Label htmlFor={`cardio-${index}`} className="text-sm font-medium">
                      Tempo (minutos)
                    </Label>
                    <Input
                      id={`cardio-${index}`}
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      placeholder="Minutos"
                      value={entry.minutes ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseFloat(e.target.value);
                        updateEntry(index, { minutes: value });
                      }}
                      className="text-center text-lg h-12"
                    />
                    {exerciseHints && (
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>Últ: {formatHint(exerciseHints.last)}</span>
                        <span>Méd: {formatHint(exerciseHints.avg)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {/* Estimativa automática de calorias */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Estimativa de Calorias</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {calculateCalories(entries)} kcal
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em séries de peso (6 kcal/série) e aeróbico (6 kcal/min)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <MediaViewer
        media={viewerMedia}
        isOpen={!!viewerMedia}
        onClose={() => setViewerMedia(null)}
      />
    </div>
  );
}