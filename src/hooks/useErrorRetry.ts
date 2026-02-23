
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseErrorRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

export function useErrorRetry(options: UseErrorRetryOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async (fn: () => Promise<any>) => {
    if (retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached');
      return;
    }

    setIsRetrying(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      const result = await fn();
      setRetryCount(0); // Reset on success
      return result;
    } catch (error) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      if (error instanceof Error) {
        onError?.(error);
        if (newRetryCount < maxRetries) {
          toast.error(`Attempt ${newRetryCount} failed. Retrying...`);
        } else {
          toast.error('All retry attempts failed');
        }
      }
      
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, retryDelay, onError]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries
  };
}
