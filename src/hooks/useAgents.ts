// hooks/useAgents.ts
import { useState, useEffect, useCallback } from 'react';
import { oc } from '../lib/opencode';
import type { Agent } from '../types';

interface UseAgentsReturn {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAgents(): UseAgentsReturn {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await oc.app.agents();
      
      if (result.error) {
        throw new Error(String(result.error));
      }
      
      const data = result.data;
      if (Array.isArray(data)) {
        const mappedAgents: Agent[] = data
          .filter((a) => !a.hidden)
          .map((a) => ({
            name: a.name,
            description: a.description,
            mode: a.mode,
            native: a.native,
            hidden: a.hidden,
          }));
        setAgents(mappedAgents);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch agents:', err);
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    isLoading,
    error,
    refetch: fetchAgents,
  };
}
