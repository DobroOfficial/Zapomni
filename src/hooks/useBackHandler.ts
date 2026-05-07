import { useEffect, useRef } from 'react';

export function useBackHandler(isActive: boolean, onBack: () => void, layerId: string) {
  const onBackRef = useRef(onBack);
  
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (isActive) {
      window.history.pushState({ modal: true, layerId }, '');
      
      const handlePopState = (e: PopStateEvent) => {
        if (e.state?.layerId !== layerId) {
          onBackRef.current();
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.layerId === layerId) {
          window.history.back();
        }
      };
    }
  }, [isActive, layerId]);
}

