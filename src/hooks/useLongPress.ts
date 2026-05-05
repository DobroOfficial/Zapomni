import { useState, useRef, useCallback } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  ms?: number;
}

export function useLongPress({ onLongPress, onClick, ms = 600 }: UseLongPressOptions) {
  const [startLongPress, setStartLongPress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelled = useRef(false);
  const startPos = useRef<{ x: number, y: number } | null>(null);

  const start = useCallback((e?: any) => {
    isCancelled.current = false;
    if (e?.touches?.[0]) {
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      startPos.current = null;
    }
    setStartLongPress(true);
    timerRef.current = setTimeout(() => {
      if (!isCancelled.current) {
        onLongPress();
      }
      setStartLongPress(false);
    }, ms);
  }, [onLongPress, ms]);

  const stop = useCallback((e?: any) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (startLongPress && onClick) {
      if (!isCancelled.current) {
        onClick();
      }
    }
    setStartLongPress(false);
    isCancelled.current = false;
  }, [onClick, startLongPress]);

  const move = useCallback((e: any) => {
    if (startPos.current && e.touches?.[0]) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const dx = Math.abs(currentX - startPos.current.x);
      const dy = Math.abs(currentY - startPos.current.y);
      if (dx > 10 || dy > 10) {
        isCancelled.current = true;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: move,
  };
}
