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

  // Function to check and restore active session
  const checkActiveSession = () => {
    const keys = Object.keys(localStorage);
    const sessionKey = keys.find(key => key.startsWith('session-'));
    const workoutId = sessionKey ? sessionKey.replace('session-', '') : null;
    setSessionWorkoutId(workoutId);
    return workoutId;
  };

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
          <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))]">
            {renderScreen()}
          </div>

          {/* Bottom Navigation */}
          <Card className="fixed bottom-0 left-0 right-0 rounded-none border-t border-l-0 border-r-0 border-b-0">
            <CardContent className="p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-3 gap-1">
                {(['workouts', 'history', 'statistics'] as Screen[]).map((screen) => (
                  <Button
                    key={screen}
                    variant={currentScreen === screen ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentScreen(screen)}
                    disabled={false}
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
