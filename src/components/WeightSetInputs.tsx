import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SetTriple } from '../types';
import { getLastSameWorkoutSets, getGlobalAveragesBySet } from '../utils/metrics';

interface WeightSetInputsProps {
  workoutId: string;
  exerciseName: string;
  sets: SetTriple;
  onChange: (sets: SetTriple) => void;
}

export function WeightSetInputs({ workoutId, exerciseName, sets, onChange }: WeightSetInputsProps) {
  const [lastSets, setLastSets] = useState<SetTriple>([null, null, null]);
  const [avgSets, setAvgSets] = useState<SetTriple>([null, null, null]);

  useEffect(() => {
    async function loadHints() {
      if (exerciseName) {
        const [last, avg] = await Promise.all([
          getLastSameWorkoutSets(workoutId, exerciseName),
          getGlobalAveragesBySet(exerciseName),
        ]);
        setLastSets(last);
        setAvgSets(avg);
      }
    }
    loadHints();
  }, [workoutId, exerciseName]);

  const handleSetChange = (index: number, value: string) => {
    const newSets: SetTriple = [...sets];
    const numValue = value === '' ? null : parseFloat(value);
    newSets[index] = numValue;
    onChange(newSets);
  };

  const formatHint = (value: number | null): string => {
    return value !== null ? value.toFixed(1) : '-';
  };

  return (
    <div className="space-y-4">
      {[0, 1, 2].map((index) => (
        <div key={index} className="space-y-1">
          <Label htmlFor={`set-${index}`} className="text-sm font-medium">
            Série {index + 1}
          </Label>
          <Input
            id={`set-${index}`}
            type="number"
            step="0.5"
            placeholder="Peso (kg)"
            value={sets[index] ?? ''}
            onChange={(e) => handleSetChange(index, e.target.value)}
            className="text-center"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Últ: {formatHint(lastSets[index])}</span>
            <span>Méd: {formatHint(avgSets[index])}</span>
          </div>
        </div>
      ))}
    </div>
  );
}