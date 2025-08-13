import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Play, Camera, Video } from 'lucide-react';
import { Workout, ExerciseType, WorkoutExercise } from '../types';
import { getWorkouts, createWorkout, updateWorkout, deleteWorkout } from '../storage/db';
import { MediaThumb } from '../components/MediaThumb';
import { MediaViewer } from '../components/MediaViewer';

interface WorkoutsScreenProps {
  onStartSession: (workoutId: string) => void;
}

export function WorkoutsScreen({ onStartSession }: WorkoutsScreenProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [editWorkoutName, setEditWorkoutName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>('PESO');
  const [editingExercise, setEditingExercise] = useState<number | null>(null);
  const [viewerMedia, setViewerMedia] = useState(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const data = await getWorkouts();
    setWorkouts(data);
  };

  const handleCreateWorkout = async () => {
    if (newWorkoutName.trim()) {
      await createWorkout(newWorkoutName.trim());
      await loadWorkouts();
      setNewWorkoutName('');
      setShowCreateDialog(false);
    }
  };

  const handleUpdateWorkout = async () => {
    if (selectedWorkout && editWorkoutName.trim()) {
      await updateWorkout(selectedWorkout.id, { name: editWorkoutName.trim() });
      await loadWorkouts();
      setEditWorkoutName('');
      setShowEditDialog(false);
      setSelectedWorkout(null);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    await deleteWorkout(id);
    await loadWorkouts();
  };

  const handleAddExercise = async () => {
    if (selectedWorkout && newExerciseName.trim()) {
      const newExercise: WorkoutExercise = {
        name: newExerciseName.trim(),
        type: newExerciseType,
      };

      const updatedExercises = [...selectedWorkout.exercises, newExercise];
      await updateWorkout(selectedWorkout.id, { exercises: updatedExercises });
      await loadWorkouts();
      
      setNewExerciseName('');
      setNewExerciseType('PESO');
      setShowExerciseDialog(false);
    }
  };

  const handleUpdateExercise = async (index: number, updates: Partial<WorkoutExercise>) => {
    if (selectedWorkout) {
      const updatedExercises = [...selectedWorkout.exercises];
      updatedExercises[index] = { ...updatedExercises[index], ...updates };
      await updateWorkout(selectedWorkout.id, { exercises: updatedExercises });
      await loadWorkouts();
    }
  };

  const handleRemoveExercise = async (index: number) => {
    if (selectedWorkout) {
      const updatedExercises = selectedWorkout.exercises.filter((_, i) => i !== index);
      await updateWorkout(selectedWorkout.id, { exercises: updatedExercises });
      await loadWorkouts();
    }
  };

  const handleMediaUpload = async (index: number, type: 'image' | 'video') => {
    // Simular upload de mídia
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'video/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const uri = URL.createObjectURL(file);
        await handleUpdateExercise(index, {
          media: { uri, kind: type }
        });
      }
    };
    
    input.click();
  };

  if (selectedWorkout) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedWorkout(null)}
              className="mb-2"
            >
              ← Voltar
            </Button>
            <h1 className="text-2xl font-bold">{selectedWorkout.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditWorkoutName(selectedWorkout.name);
                setShowEditDialog(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              onClick={() => onStartSession(selectedWorkout.id)}
              disabled={selectedWorkout.exercises.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Sessão
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {selectedWorkout.exercises.map((exercise, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground">{exercise.type}</p>
                  </div>
                  
                  {exercise.media && (
                    <MediaThumb
                      media={exercise.media}
                      onPress={() => setViewerMedia(exercise.media)}
                      className="mr-2"
                    />
                  )}
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMediaUpload(index, 'image')}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMediaUpload(index, 'video')}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveExercise(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={() => setShowExerciseDialog(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Exercício
        </Button>

        {/* Dialog para adicionar exercício */}
        <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Exercício</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="exercise-name">Nome</Label>
                <Input
                  id="exercise-name"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="Nome do exercício"
                />
              </div>
              <div>
                <Label htmlFor="exercise-type">Tipo</Label>
                <Select value={newExerciseType} onValueChange={(value: ExerciseType) => setNewExerciseType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PESO">PESO</SelectItem>
                    <SelectItem value="ALONGAMENTO">ALONGAMENTO</SelectItem>
                    <SelectItem value="AEROBICO">AERÓBICO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddExercise} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar nome do treino */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Treino</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-workout-name">Nome</Label>
                <Input
                  id="edit-workout-name"
                  value={editWorkoutName}
                  onChange={(e) => setEditWorkoutName(e.target.value)}
                  placeholder="Nome do treino"
                />
              </div>
              <Button onClick={handleUpdateWorkout} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <MediaViewer
          media={viewerMedia}
          isOpen={!!viewerMedia}
          onClose={() => setViewerMedia(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Treinos</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Treino
        </Button>
      </div>

      <div className="grid gap-4">
        {workouts.map((workout) => (
          <Card key={workout.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedWorkout(workout)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{workout.name}</CardTitle>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Treino</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {workout.exercises.length} exercícios
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para criar treino */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="workout-name">Nome</Label>
              <Input
                id="workout-name"
                value={newWorkoutName}
                onChange={(e) => setNewWorkoutName(e.target.value)}
                placeholder="Nome do treino"
              />
            </div>
            <Button onClick={handleCreateWorkout} className="w-full">
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}