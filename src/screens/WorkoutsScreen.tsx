
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Play, Camera, Video, Dumbbell, Download } from 'lucide-react';
import { Workout, ExerciseType, WorkoutExercise } from '../types';
import { getWorkouts, createWorkout, updateWorkout, deleteWorkout } from '../storage/db';
import { MediaThumb } from '../components/MediaThumb';
import { MediaViewer } from '../components/MediaViewer';
import * as XLSX from 'xlsx';

interface WorkoutsScreenProps {
  onStartSession: (workoutId: string) => void;
}

export function WorkoutsScreen({ onStartSession }: WorkoutsScreenProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newWorkoutDescription, setNewWorkoutDescription] = useState('');
  const [editWorkoutName, setEditWorkoutName] = useState('');
  const [editWorkoutDescription, setEditWorkoutDescription] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseDescription, setNewExerciseDescription] = useState('');
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
      const workout = await createWorkout(newWorkoutName.trim());
      if (newWorkoutDescription.trim()) {
        await updateWorkout(workout.id, { description: newWorkoutDescription.trim() });
      }
      await loadWorkouts();
      setNewWorkoutName('');
      setNewWorkoutDescription('');
      setShowCreateDialog(false);
    }
  };

  const handleUpdateWorkout = async () => {
    if (selectedWorkout && editWorkoutName.trim()) {
      await updateWorkout(selectedWorkout.id, { 
        name: editWorkoutName.trim(),
        description: editWorkoutDescription.trim() || undefined
      });
      await loadWorkouts();
      setEditWorkoutName('');
      setEditWorkoutDescription('');
      setShowEditDialog(false);
      setSelectedWorkout(null);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      console.log('Excluindo treino com ID:', id);
      
      // Se o treino que está sendo excluído é o selecionado, limpar a seleção
      if (selectedWorkout?.id === id) {
        setSelectedWorkout(null);
      }
      
      // Excluir o treino específico
      await deleteWorkout(id);
      
      // Recarregar a lista de treinos
      await loadWorkouts();
      
      console.log('Treino excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
    }
  };

  const handleAddExercise = async () => {
    if (!selectedWorkout || !newExerciseName.trim()) {
      return;
    }
    
    try {
      const newExercise: WorkoutExercise = {
        name: newExerciseName.trim(),
        type: newExerciseType,
        description: newExerciseDescription.trim() || undefined,
      };

      const updatedExercises = [...selectedWorkout.exercises, newExercise];
      await updateWorkout(selectedWorkout.id, { exercises: updatedExercises });
      
      // Recarregar dados e atualizar estado
      await loadWorkouts();
      
      // Buscar o treino atualizado
      const updatedWorkouts = await getWorkouts();
      const updatedWorkout = updatedWorkouts.find(w => w.id === selectedWorkout.id);
      if (updatedWorkout) {
        setSelectedWorkout(updatedWorkout);
      }
      
      // Limpar formulário e fechar dialog
      setNewExerciseName('');
      setNewExerciseDescription('');
      setNewExerciseType('PESO');
      setShowExerciseDialog(false);
    } catch (error) {
      console.error('Erro ao adicionar exercício:', error);
    }
  };

  const handleUpdateExercise = async (index: number, updates: Partial<WorkoutExercise>) => {
    if (selectedWorkout) {
      const updatedExercises = [...selectedWorkout.exercises];
      updatedExercises[index] = { ...updatedExercises[index], ...updates };
      await updateWorkout(selectedWorkout.id, { exercises: updatedExercises });
      const refreshedWorkouts = await getWorkouts();
      setWorkouts(refreshedWorkouts);
      
      // Atualizar o selectedWorkout com os dados atualizados
      const updatedWorkout = refreshedWorkouts.find(w => w.id === selectedWorkout.id);
      if (updatedWorkout) {
        setSelectedWorkout(updatedWorkout);
      }
    }
  };

  const handleRemoveExercise = async (index: number) => {
    if (selectedWorkout) {
      const updatedExercises = selectedWorkout.exercises.filter((_, i) => i !== index);
      await updateWorkout(selectedWorkout.id, { exercises: updatedExercises });
      const refreshedWorkouts = await getWorkouts();
      setWorkouts(refreshedWorkouts);
      
      // Atualizar o selectedWorkout com os dados atualizados
      const updatedWorkout = refreshedWorkouts.find(w => w.id === selectedWorkout.id);
      if (updatedWorkout) {
        setSelectedWorkout(updatedWorkout);
      }
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

  const handleDownloadWorkout = (workout: Workout) => {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['Exercício', 'Descrição'],
      ...workout.exercises.map(exercise => [
        exercise.name,
        exercise.description || ''
      ])
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exercícios');
    
    const fileName = `${workout.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
              <div>
                <h1 className="text-2xl font-bold">{selectedWorkout.name}</h1>
                {selectedWorkout.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedWorkout.description}</p>
                )}
              </div>
            </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDownloadWorkout(selectedWorkout)}
              title="Baixar treino"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditWorkoutName(selectedWorkout.name);
                setEditWorkoutDescription(selectedWorkout.description || '');
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
                    {exercise.description && (
                      <p className="text-xs text-muted-foreground mt-1">{exercise.description}</p>
                    )}
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Exercício</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o exercício "{exercise.name}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveExercise(index)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExercise();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="exercise-description">Descrição (opcional)</Label>
                <Input
                  id="exercise-description"
                  value={newExerciseDescription}
                  onChange={(e) => setNewExerciseDescription(e.target.value)}
                  placeholder="Descrição do exercício"
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
              <Button 
                onClick={handleAddExercise} 
                className="w-full"
                disabled={!newExerciseName.trim()}
              >
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
              <div>
                <Label htmlFor="edit-workout-description">Descrição (opcional)</Label>
                <Input
                  id="edit-workout-description"
                  value={editWorkoutDescription}
                  onChange={(e) => setEditWorkoutDescription(e.target.value)}
                  placeholder="Descrição do treino"
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Beautiful Header */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary rounded-xl">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                ZamperFit
              </h1>
              <p className="text-muted-foreground text-sm">Seus treinos personalizados</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Meus Treinos</h2>
              <p className="text-sm text-muted-foreground">{workouts.length} treino{workouts.length !== 1 ? 's' : ''} criado{workouts.length !== 1 ? 's' : ''}</p>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Treino
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">

        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum treino criado</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro treino para começar!</p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Treino
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {workouts.map((workout) => (
              <Card 
                key={workout.id} 
                className="cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-200 bg-card/80 backdrop-blur-sm border-border/50" 
                onClick={() => setSelectedWorkout(workout)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{workout.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {workout.exercises.length} exercício{workout.exercises.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Treino</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o treino "{workout.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkout(workout.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {workout.exercises.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Toque para ver detalhes</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
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
            <div>
              <Label htmlFor="workout-description">Descrição (opcional)</Label>
              <Input
                id="workout-description"
                value={newWorkoutDescription}
                onChange={(e) => setNewWorkoutDescription(e.target.value)}
                placeholder="Descrição do treino"
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
