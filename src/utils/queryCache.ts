
import { QueryClient } from '@tanstack/react-query';

export const queryCache = {
  // Invalidate all player-related queries
  invalidatePlayerQueries: (queryClient: QueryClient, tenantId?: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['players', tenantId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['players-optimized', tenantId] 
    });
  },

  // Invalidate all scrim-related queries
  invalidateScrimQueries: (queryClient: QueryClient, tenantId?: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['scrims', tenantId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['scrims-optimized', tenantId] 
    });
  },

  // Prefetch commonly accessed data
  prefetchOverviewData: async (queryClient: QueryClient, tenantId: string) => {
    // Prefetch first page of players
    queryClient.prefetchQuery({
      queryKey: ['players-optimized', tenantId, 1, 20],
      staleTime: 2 * 60 * 1000
    });

    // Prefetch recent scrims
    queryClient.prefetchQuery({
      queryKey: ['scrims-optimized', tenantId, 1, 5],
      staleTime: 30 * 1000
    });
  },

  // Clear stale cache entries
  clearStaleCache: (queryClient: QueryClient) => {
    queryClient.removeQueries({
      predicate: (query) => {
        return query.state.dataUpdatedAt < Date.now() - 10 * 60 * 1000; // 10 minutes old
      }
    });
  }
};

// Default query options for consistent caching behavior
export const defaultQueryOptions = {
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 5 * 60 * 1000, // 5 minutes
  retry: 2,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
};
