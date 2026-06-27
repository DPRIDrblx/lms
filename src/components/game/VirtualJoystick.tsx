import React, { useRef, useState, useEffect } from 'react';

export default function VirtualJoystick({ onMove, onEnd }: { onMove: (x: number, y: number) => void, onEnd: () => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent | any) => {
    if (!active || !baseRef.current) return;
    
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    const maxRadius = rect.width / 2;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    setPos({ x: deltaX, y: deltaY });
    onMove(deltaX / maxRadius, deltaY / maxRadius);
  };

  const handleTouchEnd = () => {
    setActive(false);
    setPos({ x: 0, y: 0 });
    onEnd();
  };

  useEffect(() => {
    if (active) {
      window.addEventListener('mousemove', handleTouchMove);
      window.addEventListener('mouseup', handleTouchEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleTouchMove);
      window.removeEventListener('mouseup', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleTouchMove);
      window.removeEventListener('mouseup', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [active]);

  return (
    <div 
      ref={baseRef}
      className="w-32 h-32 rounded-full bg-slate-800/50 border-2 border-slate-600/50 backdrop-blur-sm fixed bottom-8 left-8 flex items-center justify-center touch-none pointer-events-auto"
      onMouseDown={handleTouchStart}
      onTouchStart={handleTouchStart}
    >
      <div 
        className="w-12 h-12 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-none"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      />
    </div>
  );
}
