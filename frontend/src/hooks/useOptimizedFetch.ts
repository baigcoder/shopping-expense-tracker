// Custom hook for optimized data fetching with caching
import { useState, useEffect, useCallback, useRef } from 'react';
import { appCache, dedupedFetch, debounce } from '../utils/performance';

interface UseFetchOptions<T> {
    cacheKey?: string;
    cacheTtl?: number;
    refetchInterval?: number;
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    initialData?: T;
}

interface UseFetchResult<T> {
    data: T | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    isRefetching: boolean;
    lastUpdated: Date | null;
}

export function useOptimizedFetch<T>(
    fetchFn: () => Promise<T>,
    deps: any[] = [],
    options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
    const {
        cacheKey,
        cacheTtl = 300, // 5 minutes default
        refetchInterval,
        enabled = true,
        onSuccess,
        onError,
        initialData,
    } = options;

    const [data, setData] = useState<T | null>(initialData || null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const mountedRef = useRef(true);
    const fetchFnRef = useRef(fetchFn);

    // Update fetchFn ref when it changes
    useEffect(() => {
        fetchFnRef.current = fetchFn;
    }, [fetchFn]);

    const fetch = useCallback(async (isRefresh = false) => {
        if (!enabled) return;

        if (isRefresh) {
            setIsRefetching(true);
        } else {
            setIsLoading(true);
        }

        setIsError(false);
        setError(null);

        try {
            let result: T;

            // Use caching if cacheKey provided
            if (cacheKey) {
                result = await dedupedFetch(cacheKey, fetchFnRef.current, cacheTtl);
            } else {
                result = await fetchFnRef.current();
            }

            if (mountedRef.current) {
                setData(result);
                setLastUpdated(new Date());
                onSuccess?.(result);
            }
        } catch (err) {
            if (mountedRef.current) {
                const error = err instanceof Error ? err : new Error('Fetch failed');
                setIsError(true);
                setError(error);
                onError?.(error);
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
                setIsRefetching(false);
            }
        }
    }, [cacheKey, cacheTtl, enabled, onSuccess, onError]);

    // Initial fetch and refetch on deps change
    useEffect(() => {
        fetch(false);
    }, [...deps, enabled]);

    // Auto-refetch interval
    useEffect(() => {
        if (!refetchInterval || !enabled) return;

        const intervalId = setInterval(() => {
            fetch(true);
        }, refetchInterval);

        return () => clearInterval(intervalId);
    }, [refetchInterval, enabled, fetch]);

    // Cleanup
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const refetch = useCallback(async () => {
        // Clear cache for this key
        if (cacheKey) {
            appCache.delete(cacheKey);
        }
        await fetch(true);
    }, [cacheKey, fetch]);

    return {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
        lastUpdated,
    };
}

// Hook for debounced search
export function useDebouncedSearch<T>(
    searchFn: (query: string) => Promise<T>,
    delay: number = 300
) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<T | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const debouncedSearch = useCallback(
        debounce(async (q: string) => {
            if (!q.trim()) {
                setResults(null);
                setIsSearching(false);
                return;
            }

            try {
                const data = await searchFn(q);
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
                setResults(null);
            } finally {
                setIsSearching(false);
            }
        }, delay),
        [searchFn, delay]
    );

    const search = useCallback((q: string) => {
        setQuery(q);
        if (q.trim()) {
            setIsSearching(true);
            debouncedSearch(q);
        } else {
            setResults(null);
        }
    }, [debouncedSearch]);

    const clear = useCallback(() => {
        setQuery('');
        setResults(null);
    }, []);

    return { query, results, isSearching, search, clear };
}

// Hook for paginated data
export function usePaginatedFetch<T>(
    fetchFn: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
    limit: number = 10
) {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<T[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetch = useCallback(async (pageNum: number, append = false) => {
        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }

        try {
            const result = await fetchFn(pageNum, limit);

            if (append) {
                setData(prev => [...prev, ...result.data]);
            } else {
                setData(result.data);
            }

            setHasMore(result.hasMore);
            setPage(pageNum);
        } catch (error) {
            console.error('Pagination error:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [fetchFn, limit]);

    const loadMore = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            fetch(page + 1, true);
        }
    }, [fetch, page, isLoadingMore, hasMore]);

    const refresh = useCallback(() => {
        setPage(1);
        fetch(1, false);
    }, [fetch]);

    useEffect(() => {
        fetch(1, false);
    }, []);

    return {
        data,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
        refresh,
        page,
    };
}

export default useOptimizedFetch;
