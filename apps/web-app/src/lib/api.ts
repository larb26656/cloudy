import { env } from "@/config/env"

const createApiClient = () => {
  const baseUrl = env.API_URL

  const request = async (
    path: string,
    options?: RequestInit
  ): Promise<unknown> => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  return {
    idea: {
      list: (query?: Record<string, string>) => {
        const searchParams = query ? '?' + new URLSearchParams(query).toString() : ''
        return request(`/api/idea/${searchParams}`)
      },
      get: (path: string) => request(`/api/idea/${path}`),
      create: (body: unknown) => request('/api/idea/', { method: 'POST', body: JSON.stringify(body) }),
      delete: (path: string) => request(`/api/idea/${path}`, { method: 'DELETE' }),
      patch: (path: string, body: unknown) => request(`/api/idea/${path}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
    memory: {
      list: (query?: Record<string, string>) => {
        const searchParams = query ? '?' + new URLSearchParams(query).toString() : ''
        return request(`/api/memory/${searchParams}`)
      },
      get: (path: string) => request(`/api/memory/${path}`),
    },
    artifact: {
      list: (query?: Record<string, string>) => {
        const searchParams = query ? '?' + new URLSearchParams(query).toString() : ''
        return request(`/api/artifact/${searchParams}`)
      },
      get: (name: string) => request(`/api/artifact/${name}`),
    },
    serve: {
      list: () => request('/api/serve/'),
      get: (key: string) => request(`/api/serve/${key}`),
      create: (body: unknown) => request('/api/serve/', { method: 'POST', body: JSON.stringify(body) }),
      update: (key: string, body: unknown) => request(`/api/serve/${key}`, { method: 'PUT', body: JSON.stringify(body) }),
      delete: (key: string) => request(`/api/serve/${key}`, { method: 'DELETE' }),
    },
  }
}

export const apiClient = createApiClient()