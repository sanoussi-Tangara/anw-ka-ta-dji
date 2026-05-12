const API_URL = "http://127.0.0.1:8000/api";

export async function apiFetch(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error("Erreur API");
  }

  return response.json();
}