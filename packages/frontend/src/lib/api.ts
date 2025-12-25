export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, options);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (!json.success) {
      throw new Error(json.error || 'Unknown API Error');
  }

  return json.data;
}
