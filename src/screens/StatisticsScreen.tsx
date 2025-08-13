import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '../components/StatCard';
import { yearlyFrequency, avgCardioMinutesPerWorkout, avgCardioMinutesPerMonth, monthlyAverageFrequency, weightEvolution, cardioEvolution } from '../utils/metrics';
import { getWorkouts } from '../storage/db';
import { Workout } from '../types';

export function StatisticsScreen() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<number[]>([]);
  const [avgCardioPerWorkout, setAvgCardioPerWorkout] = useState<Array<{ workoutId: string; avgMinutes: number }>>([]);
  const [avgCardioPerMonth, setAvgCardioPerMonth] = useState<Array<{ month: string; avgMinutes: number }>>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [monthlyAvgFreq, setMonthlyAvgFreq] = useState<number>(0);
  const [weightEvol, setWeightEvol] = useState<Array<{ exerciseName: string; minWeight: number; maxWeight: number; lastWeight: number; improvement: number }>>([]);
  const [cardioEvol, setCardioEvol] = useState<{ initialAvg: number; currentAvg: number; improvement: number } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    const [monthly, avgCardioWorkout, avgCardioMonth, workoutsData, avgFreq, weightEvolutionData, cardioEvolutionData] = await Promise.all([
      yearlyFrequency(selectedYear),
      avgCardioMinutesPerWorkout(30),
      avgCardioMinutesPerMonth(),
      getWorkouts(),
      monthlyAverageFrequency(),
      weightEvolution(),
      cardioEvolution(),
    ]);

    setMonthlyData(monthly);
    setAvgCardioPerWorkout(avgCardioWorkout);
    setAvgCardioPerMonth(avgCardioMonth);
    setWorkouts(workoutsData);
    setMonthlyAvgFreq(avgFreq);
    setWeightEvol(weightEvolutionData);
    setCardioEvol(cardioEvolutionData);
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
  const maxAvgCardioWorkoutValue = Math.max(...avgCardioPerWorkout.map(d => d.avgMinutes), 1);
  const maxAvgCardioMonthValue = Math.max(...avgCardioPerMonth.map(d => d.avgMinutes), 1);

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

      {/* Tempo Médio de Aeróbico por Treino */}
      <StatCard title="Tempo Médio de Aeróbico por Treino (Últimos 30 dias)">
        {avgCardioPerWorkout.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Sem dados suficientes
          </p>
        ) : (
          <div className="space-y-2">
            {avgCardioPerWorkout.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground truncate min-w-0 flex-1">
                  {getWorkoutName(item.workoutId)}
                </span>
                <div className="flex-1 bg-muted rounded-sm h-6 relative max-w-32">
                  <div 
                    className="bg-primary h-full rounded-sm transition-all duration-300"
                    style={{ 
                      width: `${(item.avgMinutes / maxAvgCardioWorkoutValue) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm w-12 text-right font-medium">
                  {item.avgMinutes.toFixed(1)}m
                </span>
              </div>
            ))}
          </div>
        )}
      </StatCard>

      {/* Tempo Médio de Aeróbico por Mês */}
      <StatCard title="Tempo Médio de Aeróbico por Mês">
        {avgCardioPerMonth.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Sem dados suficientes
          </p>
        ) : (
          <div className="space-y-2">
            {avgCardioPerMonth.slice(-12).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">
                  {item.month}
                </span>
                <div className="flex-1 bg-muted rounded-sm h-6 relative">
                  <div 
                    className="bg-accent h-full rounded-sm transition-all duration-300"
                    style={{ 
                      width: `${(item.avgMinutes / maxAvgCardioMonthValue) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm w-12 text-right font-medium">
                  {item.avgMinutes.toFixed(1)}m
                </span>
              </div>
            ))}
          </div>
        )}
      </StatCard>

      {/* Frequência Mensal Média */}
      <StatCard title="Frequência Mensal Média">
        <div className="text-center py-4">
          <div className="text-3xl font-bold text-primary mb-2">
            {monthlyAvgFreq.toFixed(1)}
          </div>
          <p className="text-sm text-muted-foreground">
            treinos por mês em média
          </p>
        </div>
      </StatCard>

      {/* Evolução de Peso (3ª Série) */}
      {weightEvol.length > 0 && (
        <StatCard title="Evolução de Peso - 3ª Série (Menor → Maior)">
          <div className="space-y-3">
            {weightEvol.slice(0, 5).map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium truncate flex-1 mr-2">
                    {item.exerciseName}
                  </span>
                  <span className={`text-sm font-bold ${item.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.improvement >= 0 ? '+' : ''}{item.improvement.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Menor: {item.minWeight}kg</span>
                  <span>Maior: {item.maxWeight}kg</span>
                </div>
                <div className="text-center text-xs text-primary font-medium">
                  Último: {item.lastWeight}kg
                </div>
              </div>
            ))}
            {weightEvol.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Dados insuficientes para análise de evolução
              </p>
            )}
          </div>
        </StatCard>
      )}

      {/* Evolução do Tempo Aeróbico */}
      {cardioEvol && (
        <StatCard title="Evolução do Tempo Aeróbico">
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${cardioEvol.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {cardioEvol.improvement >= 0 ? '+' : ''}{cardioEvol.improvement.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">
                de melhoria no tempo médio
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-center">
                <div className="font-medium">{cardioEvol.initialAvg.toFixed(1)}min</div>
                <div className="text-muted-foreground">Média inicial</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{cardioEvol.currentAvg.toFixed(1)}min</div>
                <div className="text-muted-foreground">Média atual</div>
              </div>
            </div>
          </div>
        </StatCard>
      )}
    </div>
  );
}