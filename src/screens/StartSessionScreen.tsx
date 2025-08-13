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
  const [startTime] = useState(new Date().toISOString());

  useEffect(() => {
    if (workoutId) {
      loadWorkout();
    }
  }, [workoutId]);

  const loadWorkout = async () => {
    if (!workoutId) return;
    
    const workoutData = await getWorkout(workoutId);
    if (workoutData) {
      setWorkout(workoutData);
      
      // Inicializar entries
      const initialEntries: SessionExerciseLog[] = workoutData.exercises.map(exercise => {
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

      // Carregar hints para exercícios de alongamento e aeróbico
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
    };

    await createSession(session);
    onSessionComplete();
  };

  const formatHint = (value: number | null): string => {
    return value !== null ? value.toFixed(1) : '-';
  };

  if (!workout) {
    return (
      <div className="p-4">
        <p>Carregando treino...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sessão: {workout.name}</h1>
          <p className="text-sm text-muted-foreground">
            Iniciada às {new Date(startTime).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar Sessão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja cancelar a sessão? Todos os dados serão perdidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continuar Sessão</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel}>
                  Cancelar Sessão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button onClick={handleSaveSession}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Sessão
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {workout.exercises.map((exercise, index) => {
          const entry = entries[index];
          const exerciseHints = hints.get(exercise.name);

          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  {exercise.media && (
                    <MediaThumb
                      media={exercise.media}
                      onPress={() => setViewerMedia(exercise.media)}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label htmlFor={`stretch-${index}`}>Tempo (segundos)</Label>
                    <Input
                      id={`stretch-${index}`}
                      type="number"
                      placeholder="Segundos"
                      value={entry.seconds ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        updateEntry(index, { seconds: value });
                      }}
                      className="text-center"
                    />
                    {exerciseHints && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Últ: {formatHint(exerciseHints.last)}</span>
                        <span>Méd: {formatHint(exerciseHints.avg)}</span>
                      </div>
                    )}
                  </div>
                )}

                {exercise.type === 'AEROBICO' && entry.type === 'AEROBICO' && (
                  <div className="space-y-2">
                    <Label htmlFor={`cardio-${index}`}>Tempo (minutos)</Label>
                    <Input
                      id={`cardio-${index}`}
                      type="number"
                      step="0.5"
                      placeholder="Minutos"
                      value={entry.minutes ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseFloat(e.target.value);
                        updateEntry(index, { minutes: value });
                      }}
                      className="text-center"
                    />
                    {exerciseHints && (
                      <div className="flex justify-between text-xs text-muted-foreground">
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
      </div>

      <MediaViewer
        media={viewerMedia}
        isOpen={!!viewerMedia}
        onClose={() => setViewerMedia(null)}
      />
    </div>
  );
}