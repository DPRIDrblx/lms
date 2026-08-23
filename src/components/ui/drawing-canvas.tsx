import React, { useRef, useEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  color: string;
  width: number;
  points: Point[];
}

interface DrawingCanvasProps {
  width: number;
  height: number;
  drawings: Stroke[];
  onDrawingsChange: (drawings: Stroke[]) => void;
  activeTool: 'pen' | 'eraser' | null;
  penColor: string;
  penWidth: number;
}

export function DrawingCanvas({
  width,
  height,
  drawings,
  onDrawingsChange,
  activeTool,
  penColor,
  penWidth
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // Redraw all strokes when drawings change or current stroke changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    
    // Draw committed strokes
    drawings.forEach(stroke => drawStroke(ctx, stroke));
    
    // Draw current stroke
    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
  }, [drawings, currentStroke, width, height]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;
    
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (stroke.points.length === 1) {
      // Draw a dot if it's a single point
      ctx.fillStyle = stroke.color;
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinates based on canvas internal resolution vs display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    // Only accept primary pointer (e.g. left click or single touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const point = getCoordinates(e);
    
    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentStroke({
        color: penColor,
        width: penWidth,
        points: [point]
      });
    } else if (activeTool === 'eraser') {
      setIsDrawing(true);
      eraseAtPoint(point);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeTool) return;
    
    const point = getCoordinates(e);
    
    if (activeTool === 'pen' && currentStroke) {
      setCurrentStroke({
        ...currentStroke,
        points: [...currentStroke.points, point]
      });
    } else if (activeTool === 'eraser') {
      eraseAtPoint(point);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (activeTool === 'pen' && currentStroke) {
      onDrawingsChange([...drawings, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const eraseAtPoint = (point: Point) => {
    // Basic eraser logic: remove strokes that are close to the eraser point
    const ERASE_RADIUS = 15;
    
    const filteredDrawings = drawings.filter(stroke => {
      // Check if any point in the stroke is within the erase radius
      const hit = stroke.points.some(p => {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) < ERASE_RADIUS;
      });
      return !hit; // Keep if not hit
    });
    
    if (filteredDrawings.length !== drawings.length) {
      onDrawingsChange(filteredDrawings);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        touchAction: activeTool ? 'none' : 'auto', // Prevent scrolling when drawing
        pointerEvents: activeTool ? 'auto' : 'none', // Only capture events if tool is active
        zIndex: 10
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
