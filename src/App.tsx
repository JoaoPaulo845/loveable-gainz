import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Play, History, BarChart3 } from "lucide-react";
import { WorkoutsScreen } from "./screens/WorkoutsScreen";
import { StartSessionScreen } from "./screens/StartSessionScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { StatisticsScreen } from "./screens/StatisticsScreen";

const queryClient = new QueryClient();

type Screen = 'workouts' | 'session' | 'history' | 'statistics';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('workouts');
  const [sessionWorkoutId, setSessionWorkoutId] = useState<string | null>(() => {
    // Check if there's an active session in localStorage
    const keys = Object.keys(localStorage);
    const sessionKey = keys.find(key => key.startsWith('session-'));
    return sessionKey ? sessionKey.replace('session-', '') : null;
  });

  const handleStartSession = (workoutId: string) => {
    setSessionWorkoutId(workoutId);
    setCurrentScreen('session');
  };

  const handleSessionComplete = () => {
    setSessionWorkoutId(null);
    setCurrentScreen('history');
  };

  const handleCancelSession = () => {
    setSessionWorkoutId(null);
    setCurrentScreen('workouts');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'workouts':
        return <WorkoutsScreen onStartSession={handleStartSession} />;
      case 'session':
        return (
          <StartSessionScreen
            workoutId={sessionWorkoutId}
            onSessionComplete={handleSessionComplete}
            onCancel={handleCancelSession}
          />
        );
      case 'history':
        return <HistoryScreen />;
      case 'statistics':
        return <StatisticsScreen />;
      default:
        return <WorkoutsScreen onStartSession={handleStartSession} />;
    }
  };

  const getTabIcon = (screen: Screen) => {
    switch (screen) {
      case 'workouts':
        return <Dumbbell className="h-5 w-5" />;
      case 'session':
        return <Play className="h-5 w-5" />;
      case 'history':
        return <History className="h-5 w-5" />;
      case 'statistics':
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getTabLabel = (screen: Screen) => {
    switch (screen) {
      case 'workouts':
        return 'Treinos';
      case 'session':
        return 'Sessão';
      case 'history':
        return 'Histórico';
      case 'statistics':
        return 'Estatísticas';
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen bg-background flex flex-col">
          {/* Main Content */}
          <div className="flex-1 pb-20">
            {renderScreen()}
          </div>

          {/* Bottom Navigation */}
          <Card className="fixed bottom-0 left-0 right-0 rounded-none border-t border-l-0 border-r-0 border-b-0">
            <CardContent className="p-2">
              <div className="grid grid-cols-4 gap-1">
                {(['workouts', 'session', 'history', 'statistics'] as Screen[]).map((screen) => (
                  <Button
                    key={screen}
                    variant={currentScreen === screen ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                  if (screen === 'session') {
                        // Check for active session in localStorage when clicking session tab
                        const keys = Object.keys(localStorage);
                        const sessionKey = keys.find(key => key.startsWith('session-'));
                        if (sessionKey) {
                          const workoutId = sessionKey.replace('session-', '');
                          setSessionWorkoutId(workoutId);
                          setCurrentScreen('session');
                        } else {
                          // No active session found, clear sessionWorkoutId
                          setSessionWorkoutId(null);
                        }
                      } else {
                        setCurrentScreen(screen);
                      }
                    }}
                    disabled={screen === 'session' && !sessionWorkoutId && !Object.keys(localStorage).some(key => key.startsWith('session-'))}
                    className="flex flex-col h-14 gap-1"
                  >
                    {getTabIcon(screen)}
                    <span className="text-xs">{getTabLabel(screen)}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
