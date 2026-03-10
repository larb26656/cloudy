// api/models.ts
import { api } from './client';

export interface ListModelsResponse {
  providers: {
    id: string;
    name: string;
    models: {
      id: string;
      name: string;
      description?: string;
      maxTokens?: number;
      supportsStreaming: boolean;
      supportsTools: boolean;
    }[];
  }[];
}

export const modelsApi = {
  list: (): Promise<ListModelsResponse> => {
    return api.get('/models');
  },
};
