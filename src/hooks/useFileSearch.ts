// hooks/useFileSearch.ts
import { useState, useCallback, useRef } from 'react';
import { api } from '../api';
import type { FileReference } from '../types';

interface UseFileSearchReturn {
  results: FileReference[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

export function useFileSearch(
  directory: string,
  options: { maxResults?: number; debounceMs?: number } = {}
): UseFileSearchReturn {
  const { maxResults = 10, debounceMs = 150 } = options;
  const [results, setResults] = useState<FileReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (query: string) => {
      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!query.trim()) {
        setResults([]);
        return;
      }

      // Debounce search
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const response = await api.get<{
            results: {
              path: string;
              name: string;
              size: number;
              lastModified: number;
            }[];
          }>('/directory/search', {
            directory,
            query: query.trim(),
            limit: maxResults,
          });

          const files: FileReference[] = response.results.map((r) => ({
            path: r.path,
            absolutePath: `${directory}/${r.path}`,
            name: r.name,
            extension: r.name.split('.').pop() || '',
            size: r.size,
            lastModified: r.lastModified,
          }));

          setResults(files);
        } catch (err) {
          setError((err as Error).message);
          console.error('File search failed:', err);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [directory, maxResults, debounceMs]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clearResults,
  };
}
