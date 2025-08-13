import { useState, useRef } from 'react';
import { Media } from '../types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface MediaViewerProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaViewer({ media, isOpen, onClose }: MediaViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!media) return null;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.5, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.5, 1));
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleClose = () => {
    resetView();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {/* Controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {media.kind === 'image' && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={scale <= 1}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="secondary" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Media Content */}
          {media.kind === 'video' ? (
            <video
              ref={videoRef}
              src={media.uri}
              controls
              autoPlay
              className="max-w-full max-h-full"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={media.uri}
                alt="Exercise media"
                className="max-w-full max-h-full object-contain select-none"
                style={{
                  transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                }}
                draggable={false}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}