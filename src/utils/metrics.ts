import type { Session, SetTriple } from '../types';
import { getSessions } from '../storage/db';

// Normaliza nome do exercício
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

// Filtra valores null/NaN para cálculos
function filterValidNumbers(values: (number | null)[]): number[] {
  return values.filter((v): v is number => v !== null && !isNaN(v));
}

// PESO - Últimas séries do mesmo treino
export async function getLastSameWorkoutSets(
  workoutId: string, 
  exerciseName: string
): Promise<SetTriple> {
  const sessions = await getSessions();
  const normalizedName = normalizeName(exerciseName);
  
  // Sessões do mesmo treino, ordenadas por data (mais recente primeiro)
  const workoutSessions = sessions
    .filter(s => s.workoutId === workoutId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  
  for (const session of workoutSessions) {
    const exercise = session.entries.find(
      e => e.type === 'PESO' && normalizeName(e.exerciseName) === normalizedName
    );
    
    if (exercise && exercise.type === 'PESO') {
      return exercise.sets;
    }
  }
  
  return [null, null, null];
}

// PESO - Média global por série
export async function getGlobalAveragesBySet(exerciseName: string): Promise<SetTriple> {
  const sessions = await getSessions();
  const normalizedName = normalizeName(exerciseName);
  
  const s1Values: number[] = [];
  const s2Values: number[] = [];
  const s3Values: number[] = [];
  
  sessions.forEach(session => {
    session.entries.forEach(exercise => {
      if (exercise.type === 'PESO' && normalizeName(exercise.exerciseName) === normalizedName) {
        if (exercise.sets[0] !== null) s1Values.push(exercise.sets[0]);
        if (exercise.sets[1] !== null) s2Values.push(exercise.sets[1]);
        if (exercise.sets[2] !== null) s3Values.push(exercise.sets[2]);
      }
    });
  });
  
  const avg1 = s1Values.length > 0 ? s1Values.reduce((a, b) => a + b, 0) / s1Values.length : null;
  const avg2 = s2Values.length > 0 ? s2Values.reduce((a, b) => a + b, 0) / s2Values.length : null;
  const avg3 = s3Values.length > 0 ? s3Values.reduce((a, b) => a + b, 0) / s3Values.length : null;
  
  return [avg1, avg2, avg3];
}

// PESO - Última série global
export async function getGlobalLastBySet(exerciseName: string): Promise<SetTriple> {
  const sessions = await getSessions();
  const normalizedName = normalizeName(exerciseName);
  
  // Todas as sessões ordenadas por data (mais recente primeiro)
  const sortedSessions = sessions.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  
  for (const session of sortedSessions) {
    const exercise = session.entries.find(
      e => e.type === 'PESO' && normalizeName(e.exerciseName) === normalizedName
    );
    
    if (exercise && exercise.type === 'PESO') {
      return exercise.sets;
    }
  }
  
  return [null, null, null];
}

// ALONGAMENTO - Média global
export async function getGlobalAvgSeconds(exerciseName: string): Promise<number | null> {
  const sessions = await getSessions();
  const normalizedName = normalizeName(exerciseName);
  
  const values: number[] = [];
  
  sessions.forEach(session => {
    session.entries.forEach(exercise => {
      if (
        exercise.type === 'ALONGAMENTO' && 
        normalizeName(exercise.exerciseName) === normalizedName &&
        exercise.seconds !== null
      ) {
        values.push(exercise.seconds);
      }
    });
  });
  
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

// ALONGAMENTO - Último valor global
export async function getGlobalLastSeconds(exerciseName: string): Promise<number | null> {
  const sessions = await getSessions();
  const normalizedName = normalizeName(exerciseName);
  
  const sortedSessions = sessions.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  
  for (const session of sortedSessions) {
    const exercise = session.entries.find(
      e => e.type === 'ALONGAMENTO' && normalizeName(e.exerciseName) === normalizedName
    );
    
    if (exercise && exercise.type === 'ALONGAMENTO' && exercise.seconds !== null) {
      return exercise.seconds;
    }
  }
  
  return null;
}

// AERÓBICO - Média global
export async function getGlobalAvgMinutes(exerciseName: string): Promise<number | null> {
  const sessions = await getSessions();
  const normalizedName = normalizeName(exerciseName);
  
  const values: number[] = [];
  
  sessions.forEach(session => {
    session.entries.forEach(exercise => {
      if (
        exercise.type === 'AEROBICO' && 
        normalizeName(exercise.exerciseName) === normalizedName &&
        exercise.minutes !== null
      ) {
        values.push(exercise.minutes);
      }
    });
  });
  
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

// AERÓBICO - Último valor global
export async function getGlobalLastMinutes(exerciseName: string): Promise<number | null> {
  const sessions = await getSessions();
  const normalizedName = normalizeName(exerciseName);
  
  const sortedSessions = sessions.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  
  for (const session of sortedSessions) {
    const exercise = session.entries.find(
      e => e.type === 'AEROBICO' && normalizeName(e.exerciseName) === normalizedName
    );
    
    if (exercise && exercise.type === 'AEROBICO' && exercise.minutes !== null) {
      return exercise.minutes;
    }
  }
  
  return null;
}

// Estatísticas - Frequência anual
export async function yearlyFrequency(year: number): Promise<number[]> {
  const sessions = await getSessions();
  const monthCounts = new Array(12).fill(0);
  
  sessions.forEach(session => {
    const date = new Date(session.startedAt);
    if (date.getFullYear() === year) {
      monthCounts[date.getMonth()]++;
    }
  });
  
  return monthCounts;
}

// Estatísticas - Tempo médio de aeróbico por treino (últimos N dias)
export async function avgCardioMinutesPerWorkout(
  lastNDays: number = 30
): Promise<Array<{ workoutId: string; avgMinutes: number }>> {
  const sessions = await getSessions();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lastNDays);
  
  const workoutData = new Map<string, { totalMinutes: number; sessionCount: number }>();
  
  sessions
    .filter(session => new Date(session.startedAt) >= cutoffDate)
    .forEach(session => {
      const totalMinutes = session.entries
        .filter(e => e.type === 'AEROBICO')
        .reduce((sum, e) => {
          if (e.type === 'AEROBICO' && e.minutes !== null) {
            return sum + e.minutes;
          }
          return sum;
        }, 0);
      
      if (totalMinutes > 0) {
        const current = workoutData.get(session.workoutId) || { totalMinutes: 0, sessionCount: 0 };
        workoutData.set(session.workoutId, {
          totalMinutes: current.totalMinutes + totalMinutes,
          sessionCount: current.sessionCount + 1
        });
      }
    });
  
  return Array.from(workoutData.entries()).map(([workoutId, data]) => ({
    workoutId,
    avgMinutes: data.totalMinutes / data.sessionCount,
  }));
}

// Estatísticas - Tempo de aeróbico médio por mês
export async function avgCardioMinutesPerMonth(): Promise<Array<{ month: string; avgMinutes: number }>> {
  const sessions = await getSessions();
  const monthData = new Map<string, { totalMinutes: number; sessionCount: number }>();
  
  sessions.forEach(session => {
    const date = new Date(session.startedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const totalMinutes = session.entries
      .filter(e => e.type === 'AEROBICO')
      .reduce((sum, e) => {
        if (e.type === 'AEROBICO' && e.minutes !== null) {
          return sum + e.minutes;
        }
        return sum;
      }, 0);
    
    if (totalMinutes > 0) {
      const current = monthData.get(monthKey) || { totalMinutes: 0, sessionCount: 0 };
      monthData.set(monthKey, {
        totalMinutes: current.totalMinutes + totalMinutes,
        sessionCount: current.sessionCount + 1
      });
    }
  });
  
  return Array.from(monthData.entries())
    .map(([month, data]) => ({
      month,
      avgMinutes: data.totalMinutes / data.sessionCount,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Estatísticas - Tempo de aeróbico por treino (últimos N dias)
export async function cardioMinutesPerWorkout(
  lastNDays: number = 30
): Promise<Array<{ workoutId: string; totalMinutes: number }>> {
  const sessions = await getSessions();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lastNDays);
  
  const workoutTotals = new Map<string, number>();
  
  sessions
    .filter(session => new Date(session.startedAt) >= cutoffDate)
    .forEach(session => {
      const totalMinutes = session.entries
        .filter(e => e.type === 'AEROBICO')
        .reduce((sum, e) => {
          if (e.type === 'AEROBICO' && e.minutes !== null) {
            return sum + e.minutes;
          }
          return sum;
        }, 0);
      
      if (totalMinutes > 0) {
        const current = workoutTotals.get(session.workoutId) || 0;
        workoutTotals.set(session.workoutId, current + totalMinutes);
      }
    });
  
  return Array.from(workoutTotals.entries()).map(([workoutId, totalMinutes]) => ({
    workoutId,
    totalMinutes,
  }));
}

// Estatísticas - Tempo de alongamento por treino (opcional)
export async function stretchSecondsPerWorkout(
  lastNDays: number = 30
): Promise<Array<{ workoutId: string; totalSeconds: number }>> {
  const sessions = await getSessions();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lastNDays);
  
  const workoutTotals = new Map<string, number>();
  
  sessions
    .filter(session => new Date(session.startedAt) >= cutoffDate)
    .forEach(session => {
      const totalSeconds = session.entries
        .filter(e => e.type === 'ALONGAMENTO')
        .reduce((sum, e) => {
          if (e.type === 'ALONGAMENTO' && e.seconds !== null) {
            return sum + e.seconds;
          }
          return sum;
        }, 0);
      
      if (totalSeconds > 0) {
        const current = workoutTotals.get(session.workoutId) || 0;
        workoutTotals.set(session.workoutId, current + totalSeconds);
      }
    });
  
  return Array.from(workoutTotals.entries()).map(([workoutId, totalSeconds]) => ({
    workoutId,
    totalSeconds,
  }));
}

// Estatísticas - Frequência mensal média
export async function monthlyAverageFrequency(): Promise<number> {
  const sessions = await getSessions();
  if (sessions.length === 0) return 0;
  
  const monthsWithSessions = new Set<string>();
  sessions.forEach(session => {
    const date = new Date(session.startedAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    monthsWithSessions.add(monthKey);
  });
  
  if (monthsWithSessions.size === 0) return 0;
  
  return sessions.length / monthsWithSessions.size;
}

// Estatísticas - Evolução de peso (menor vs maior da terceira série)
export async function weightEvolution(): Promise<Array<{ exerciseName: string; minWeight: number; maxWeight: number; lastWeight: number; improvement: number }>> {
  const sessions = await getSessions();
  const exerciseThirdSets = new Map<string, number[]>();
  
  // Coletar apenas a terceira série de cada exercício em ordem cronológica
  sessions
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .forEach(session => {
      session.entries.forEach(entry => {
        if (entry.type === 'PESO' && entry.sets[2] !== null && !isNaN(entry.sets[2])) {
          const normalizedName = normalizeName(entry.exerciseName);
          if (!exerciseThirdSets.has(normalizedName)) {
            exerciseThirdSets.set(normalizedName, []);
          }
          const weights = exerciseThirdSets.get(normalizedName)!;
          weights.push(entry.sets[2]);
        }
      });
    });
  
  const evolution: Array<{ exerciseName: string; minWeight: number; maxWeight: number; lastWeight: number; improvement: number }> = [];
  
  exerciseThirdSets.forEach((weights, exerciseName) => {
    if (weights.length >= 2) {
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);
      const lastWeight = weights[weights.length - 1];
      const improvement = ((maxWeight - minWeight) / minWeight) * 100;
      
      evolution.push({
        exerciseName,
        minWeight,
        maxWeight,
        lastWeight,
        improvement
      });
    }
  });
  
  return evolution.sort((a, b) => b.improvement - a.improvement);
}

// Estatísticas - Evolução de tempo aeróbico (média inicial vs atual)
export async function cardioEvolution(): Promise<{ initialAvg: number; currentAvg: number; improvement: number } | null> {
  const sessions = await getSessions();
  if (sessions.length === 0) return null;
  
  const sortedSessions = sessions.sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );
  
  // Primeiro mês com dados de aeróbico
  const firstMonthData: number[] = [];
  const firstMonth = new Date(sortedSessions[0].startedAt);
  const firstMonthEnd = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + 1, 0);
  
  // Último mês com dados de aeróbico
  const lastMonthData: number[] = [];
  const lastSession = sortedSessions[sortedSessions.length - 1];
  const lastMonth = new Date(lastSession.startedAt);
  const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  
  sortedSessions.forEach(session => {
    const sessionDate = new Date(session.startedAt);
    const cardioMinutes = session.entries
      .filter(e => e.type === 'AEROBICO')
      .reduce((sum, e) => {
        if (e.type === 'AEROBICO' && e.minutes !== null) {
          return sum + e.minutes;
        }
        return sum;
      }, 0);
    
    if (cardioMinutes > 0) {
      if (sessionDate <= firstMonthEnd) {
        firstMonthData.push(cardioMinutes);
      }
      if (sessionDate >= lastMonthStart) {
        lastMonthData.push(cardioMinutes);
      }
    }
  });
  
  if (firstMonthData.length === 0 || lastMonthData.length === 0) return null;
  
  const initialAvg = firstMonthData.reduce((a, b) => a + b, 0) / firstMonthData.length;
  const currentAvg = lastMonthData.reduce((a, b) => a + b, 0) / lastMonthData.length;
  const improvement = ((currentAvg - initialAvg) / initialAvg) * 100;
  
  return {
    initialAvg,
    currentAvg,
    improvement
  };
}