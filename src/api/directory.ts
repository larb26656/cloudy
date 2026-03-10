// api/directory.ts
import { api } from './client';

export interface ValidateDirectoryResponse {
  valid: boolean;
  error?: string;
}

export interface ListDirectoryResponse {
  files: {
    name: string;
    path: string;
    size: number;
    lastModified: number;
  }[];
  directories: {
    name: string;
    path: string;
  }[];
}

export interface SearchFilesResponse {
  results: {
    path: string;
    name: string;
    size: number;
    lastModified: number;
  }[];
}

export interface ReadFileResponse {
  content: string;
  size: number;
  encoding: string;
}

export const directoryApi = {
  validate: (path: string): Promise<ValidateDirectoryResponse> => {
    return api.get('/directory/validate', { path });
  },

  list: (path: string, recursive?: boolean): Promise<ListDirectoryResponse> => {
    return api.get('/directory/list', { path, recursive });
  },

  search: (directory: string, query: string, limit?: number): Promise<SearchFilesResponse> => {
    return api.get('/directory/search', { directory, query, limit });
  },

  readFile: (path: string): Promise<ReadFileResponse> => {
    return api.get('/file/read', { path });
  },
};
