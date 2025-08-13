import { Media } from '../types';
import { Button } from '@/components/ui/button';
import { Play, Image as ImageIcon } from 'lucide-react';

interface MediaThumbProps {
  media: Media;
  onPress: () => void;
  className?: string;
}

export function MediaThumb({ media, onPress, className = "" }: MediaThumbProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onPress}
      className={`h-16 w-16 p-1 ${className}`}
    >
      {media.kind === 'video' ? (
        <div className="relative w-full h-full flex items-center justify-center bg-muted rounded">
          <Play className="h-4 w-4" />
          <video 
            src={media.uri} 
            className="absolute inset-0 w-full h-full object-cover rounded opacity-70"
            muted
          />
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center bg-muted rounded">
          <ImageIcon className="h-4 w-4" />
          <img 
            src={media.uri} 
            alt="Exercise media"
            className="absolute inset-0 w-full h-full object-cover rounded"
          />
        </div>
      )}
    </Button>
  );
}