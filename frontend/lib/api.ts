// lib/api.ts

const API_URL = "http://127.0.0.1:8000/api";

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface FetchOptions {
  method?: HttpMethod;
  body?: any;
  headers?: HeadersInit;
  requiresAuth?: boolean;
}

export async function apiFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const { method = 'GET', body, headers = {}, requiresAuth = true } = options;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers,
  };

  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    
        throw new Error('mot de passe ou email incorrect, veuillez vous reconnecter');
      }

      let errorMessage = `Erreur ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error('API Error:', error.message);
      throw error;
    }
    throw new Error('Erreur de connexion au serveur');
  }
}

// ========== MÉTHODES HTTP DE BASE ==========

export async function apiGet(endpoint: string, requiresAuth: boolean = true): Promise<any> {
  return apiFetch(endpoint, { method: 'GET', requiresAuth });
}

export async function apiPost(endpoint: string, body: any, requiresAuth: boolean = true): Promise<any> {
  return apiFetch(endpoint, { method: 'POST', body, requiresAuth });
}

export async function apiPut(endpoint: string, body: any, requiresAuth: boolean = true): Promise<any> {
  return apiFetch(endpoint, { method: 'PUT', body, requiresAuth });
}

export async function apiPatch(endpoint: string, body: any, requiresAuth: boolean = true): Promise<any> {
  return apiFetch(endpoint, { method: 'PATCH', body, requiresAuth });
}

export async function apiDelete(endpoint: string, requiresAuth: boolean = true): Promise<any> {
  return apiFetch(endpoint, { method: 'DELETE', requiresAuth });
}

// ========== AUTHENTIFICATION ==========

export async function login(email: string, password: string): Promise<any> {
  const response = await apiPost('/login', { email, password }, false);
  
  if (response.token) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }
  
  return response;
}

export async function registerConsommateur(userData: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
}): Promise<any> {
  return apiPost('/register', userData, false);
}

export async function logout(): Promise<void> {
  try {
    await apiPost('/logout', {}, true);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

export async function getCurrentUser(): Promise<any> {
  return apiGet('/me', true);
}

// ========== GESTION DES FOURNISSEURS (PAR MANAGER) ==========

export async function createFournisseur(data: {
  nom_societe: string;
  adresse: string;
  nif: string;
  email: string;
  password: string;
  telephone: string;
}): Promise<any> {
  return apiPost('/manager/fournisseur/creer', data, true);
}

export async function updateFournisseur(id: number, data: {
  nom_societe?: string;
  adresse?: string;
  nif?: string;
  telephone?: string;
}): Promise<any> {
  return apiPut(`/manager/fournisseur/modifier/${id}`, data, true);
}

export async function getFournisseurs(): Promise<any> {
  return apiGet('/manager/fournisseurs', true);
}

export async function desactiverFournisseur(id: number): Promise<any> {
  return apiPut(`/manager/fournisseur/desactiver/${id}`, {}, true);
}

export async function activerFournisseur(id: number): Promise<any> {
  return apiPut(`/manager/fournisseur/activer/${id}`, {}, true);
}

// ========== GESTION DES ICR (PAR MANAGER) ==========

export async function createIcr(data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
  matricule: string;
  zone: string;
}): Promise<any> {
  return apiPost('/manager/icr/creer', data, true);
}

export async function updateIcr(id: number, data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
  zone?: string;
}): Promise<any> {
  return apiPut(`/manager/icr/modifier/${id}`, data, true);
}

export async function getIcrs(): Promise<any> {
  return apiGet('/manager/icrs', true);
}

export async function desactiverIcr(id: number): Promise<any> {
  return apiPut(`/manager/icr/desactiver/${id}`, {}, true);
}

export async function activerIcr(id: number): Promise<any> {
  return apiPut(`/manager/icr/activer/${id}`, {}, true);
}

// ========== GESTION DES RESPONSABLES DE DÉPÔT (PAR MANAGER) ==========

export async function createResponsableDepot(data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
}): Promise<any> {
  return apiPost('/manager/responsable/creer', data, true);
}

export async function updateResponsableDepot(id: number, data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
}): Promise<any> {
  return apiPut(`/manager/responsable/modifier/${id}`, data, true);
}

export async function getResponsablesDepot(): Promise<any> {
  return apiGet('/manager/responsables', true);
}

export async function desactiverResponsableDepot(id: number): Promise<any> {
  return apiPut(`/manager/responsable/desactiver/${id}`, {}, true);
}

export async function activerResponsableDepot(id: number): Promise<any> {
  return apiPut(`/manager/responsable/activer/${id}`, {}, true);
}

// ========== GESTION DES GÉRANTS (PAR ICR) ==========

export async function createGerant(data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
  id_station: number;
}): Promise<any> {
  return apiPost('/icr/gerant/creer', data, true);
}

export async function getGerants(): Promise<any> {
  return apiGet('/icr/gerants', true);
}

export async function desactiverGerant(id: number): Promise<any> {
  return apiPut(`/icr/gerant/desactiver/${id}`, {}, true);
}

export async function activerGerant(id: number): Promise<any> {
  return apiPut(`/icr/gerant/activer/${id}`, {}, true);
}

// ========== GESTION DES CHAUFFEURS (PAR ICR) ==========

export async function createChauffeur(data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
  permis: string;
}): Promise<any> {
  return apiPost('/icr/chauffeur/creer', data, true);
}

export async function updateChauffeur(id: number, data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
  permis?: string;
}): Promise<any> {
  return apiPut(`/icr/chauffeur/modifier/${id}`, data, true);
}

export async function getChauffeurs(): Promise<any> {
  return apiGet('/icr/chauffeurs', true);
}

export async function desactiverChauffeur(id: number): Promise<any> {
  return apiPut(`/icr/chauffeur/desactiver/${id}`, {}, true);
}

export async function activerChauffeur(id: number): Promise<any> {
  return apiPut(`/icr/chauffeur/activer/${id}`, {}, true);
}

// ========== GESTION DES POMPISTES (PAR GÉRANT) ==========

export async function createPompiste(data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
}): Promise<any> {
  return apiPost('/gerant/pompiste/creer', data, true);
}

export async function getPompistes(): Promise<any> {
  return apiGet('/gerant/pompistes', true);
}

export async function desactiverPompiste(id: number): Promise<any> {
  return apiPut(`/gerant/pompiste/desactiver/${id}`, {}, true);
}

export async function activerPompiste(id: number): Promise<any> {
  return apiPut(`/gerant/pompiste/activer/${id}`, {}, true);
}

// ========== GESTION DES STATIONS ==========

export async function getStations(): Promise<any> {
  return apiGet('/stations', false);
}

export async function getStationById(id: number): Promise<any> {
  return apiGet(`/stations/${id}`, false);
}

// ========== GESTION DES BONS (PAR FOURNISSEUR) ==========

export async function createBon(data: {
  type_carburant: string;
  quantite_commandee: number;
  date_disponibilite: string;
  id_depot: number;
  id_icr: number;
}): Promise<any> {
  return apiPost('/fournisseur/bon/creer', data, true);
}

export async function signerBon(id: number, signature: string, code_verification: string): Promise<any> {
  return apiPost(`/fournisseur/bon/signer/${id}`, { signature_fournisseur: signature, code_verification }, true);
}

export async function getHistoriqueBons(): Promise<any> {
  return apiGet('/fournisseur/bons/historique', true);
}

// ========== GESTION DES PRIX (PAR MANAGER) ==========

export async function fixerPrix(prix_essence: number, prix_gasoil: number): Promise<any> {
  return apiPost('/manager/prix/fixer', { prix_essence, prix_gasoil }, true);
}

export async function getPrix(): Promise<any> {
  return apiGet('/manager/prix', true);
}