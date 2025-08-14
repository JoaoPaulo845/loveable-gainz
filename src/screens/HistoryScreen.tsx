import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Eye } from 'lucide-react';
import { Session, Workout } from '../types';
import { getSessions, getWorkouts, deleteSession } from '../storage/db';

export function HistoryScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [sessionsData, workoutsData] = await Promise.all([
      getSessions(),
      getWorkouts(),
    ]);
    
    // Ordenar sessões por data (mais recente primeiro)
    sessionsData.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    
    setSessions(sessionsData);
    setWorkouts(workoutsData);
  };

  const getWorkoutName = (workoutId: string): string => {
    const workout = workouts.find(w => w.id === workoutId);
    return workout?.name || 'Treino Deletado';
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    await loadData();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startedAt: string, endedAt: string): string => {
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.round(durationMs / (1000 * 60));
    return `${minutes} min`;
  };

  const openSessionDetail = (session: Session) => {
    setSelectedSession(session);
    setShowDetailDialog(true);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Histórico</h1>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma sessão encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{getWorkoutName(session.workoutId)}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{formatDate(session.startedAt)} às {formatTime(session.startedAt)}</p>
                      <p>Duração: {formatDuration(session.startedAt, session.endedAt)}</p>
                      <p>{session.entries.length} exercícios</p>
                      <p>{session.calories || 0} kcal</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openSessionDetail(session)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Sessão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSession(session.id)}
                            className="bg-destructive text-destructive-foreground"
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
      )}

      {/* Dialog de detalhes da sessão */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSession && getWorkoutName(selectedSession.workoutId)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>{formatDate(selectedSession.startedAt)} às {formatTime(selectedSession.startedAt)}</p>
                <p>Duração: {formatDuration(selectedSession.startedAt, selectedSession.endedAt)}</p>
                <p>Calorias: {selectedSession.calories || 0} kcal</p>
              </div>
              
              <div className="space-y-3">
                {selectedSession.entries.map((entry, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <h4 className="font-medium mb-2">{entry.exerciseName}</h4>
                      
                      {entry.type === 'PESO' && (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground">S1</p>
                            <p className="font-medium">
                              {entry.sets[0] !== null ? `${entry.sets[0]} kg` : '-'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">S2</p>
                            <p className="font-medium">
                              {entry.sets[1] !== null ? `${entry.sets[1]} kg` : '-'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">S3</p>
                            <p className="font-medium">
                              {entry.sets[2] !== null ? `${entry.sets[2]} kg` : '-'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {entry.type === 'ALONGAMENTO' && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Tempo: </span>
                          <span className="font-medium">
                            {entry.seconds !== null ? `${entry.seconds} segundos` : 'Não registrado'}
                          </span>
                        </p>
                      )}
                      
                      {entry.type === 'AEROBICO' && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Tempo: </span>
                          <span className="font-medium">
                            {entry.minutes !== null ? `${entry.minutes} minutos` : 'Não registrado'}
                          </span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}