export async function jsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export async function emptyResponse(response: Response): Promise<void> {
  if (!response.ok) throw new Error(await response.text());
}
