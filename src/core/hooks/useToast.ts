import { useState, useCallback } from 'react';

export function useToast() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  }, []);

  return {
    showToast,
    toastMessage,
    setShowToast,
    setToastMessage,
    triggerToast
  };
}
