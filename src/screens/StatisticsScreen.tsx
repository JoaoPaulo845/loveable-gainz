import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '../components/StatCard';
import { yearlyFrequency, cardioMinutesPerWorkout, stretchSecondsPerWorkout } from '../utils/metrics';
import { getWorkouts } from '../storage/db';
import { Workout } from '../types';

export function StatisticsScreen() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<number[]>([]);
  const [cardioData, setCardioData] = useState<Array<{ workoutId: string; totalMinutes: number }>>([]);
  const [stretchData, setStretchData] = useState<Array<{ workoutId: string; totalSeconds: number }>>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    const [monthly, cardio, stretch, workoutsData] = await Promise.all([
      yearlyFrequency(selectedYear),
      cardioMinutesPerWorkout(30),
      stretchSecondsPerWorkout(30),
      getWorkouts(),
    ]);

    setMonthlyData(monthly);
    setCardioData(cardio);
    setStretchData(stretch);
    setWorkouts(workoutsData);
  };

  const getWorkoutName = (workoutId: string): string => {
    const workout = workouts.find(w => w.id === workoutId);
    return workout?.name || 'Treino Deletado';
  };

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const maxMonthlyValue = Math.max(...monthlyData, 1);
  const maxCardioValue = Math.max(...cardioData.map(d => d.totalMinutes), 1);
  const maxStretchValue = Math.max(...stretchData.map(d => d.totalSeconds), 1);

  // Gerar anos disponíveis (últimos 5 anos + próximos 2)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Estatísticas</h1>

      {/* Frequência Anual */}
      <StatCard title="Frequência Anual">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ano:</span>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {monthlyData.every(count => count === 0) ? (
            <p className="text-center text-muted-foreground py-8">
              Sem dados suficientes para {selectedYear}
            </p>
          ) : (
            <div className="space-y-2">
              {monthNames.map((month, index) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-sm w-8 text-muted-foreground">{month}</span>
                  <div className="flex-1 bg-muted rounded-sm h-6 relative">
                    <div 
                      className="bg-primary h-full rounded-sm transition-all duration-300"
                      style={{ 
                        width: `${(monthlyData[index] / maxMonthlyValue) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm w-6 text-right font-medium">
                    {monthlyData[index]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </StatCard>

      {/* Tempo de Aeróbico por Treino */}
      <StatCard title="Tempo de Aeróbico por Treino (Últimos 30 dias)">
        {cardioData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Sem dados suficientes
          </p>
        ) : (
          <div className="space-y-2">
            {cardioData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground truncate min-w-0 flex-1">
                  {getWorkoutName(item.workoutId)}
                </span>
                <div className="flex-1 bg-muted rounded-sm h-6 relative max-w-32">
                  <div 
                    className="bg-primary h-full rounded-sm transition-all duration-300"
                    style={{ 
                      width: `${(item.totalMinutes / maxCardioValue) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm w-12 text-right font-medium">
                  {item.totalMinutes.toFixed(1)}m
                </span>
              </div>
            ))}
          </div>
        )}
      </StatCard>

      {/* Tempo de Alongamento por Treino (Opcional) */}
      {stretchData.length > 0 && (
        <StatCard title="Tempo de Alongamento por Treino (Últimos 30 dias)">
          <div className="space-y-2">
            {stretchData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground truncate min-w-0 flex-1">
                  {getWorkoutName(item.workoutId)}
                </span>
                <div className="flex-1 bg-muted rounded-sm h-6 relative max-w-32">
                  <div 
                    className="bg-accent h-full rounded-sm transition-all duration-300"
                    style={{ 
                      width: `${(item.totalSeconds / maxStretchValue) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm w-12 text-right font-medium">
                  {Math.round(item.totalSeconds)}s
                </span>
              </div>
            ))}
          </div>
        </StatCard>
      )}
    </div>
  );
}