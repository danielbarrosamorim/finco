const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const API_KEY = import.meta.env.VITE_API_KEY ?? ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
      ...options?.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? 'Ocorreu um erro inesperado')
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
