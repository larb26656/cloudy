async function responseError(response: Response): Promise<Error> {
  const text = await response.text();
  try {
    const body: unknown = JSON.parse(text);
    if (
      body !== null &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return new Error(body.error);
    }
  } catch {
    return new Error(text);
  }
  return new Error(text);
}

export async function jsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await responseError(response);
  return response.json() as Promise<T>;
}

export async function emptyResponse(response: Response): Promise<void> {
  if (!response.ok) throw await responseError(response);
}
