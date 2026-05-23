// frontend/lib/api.ts
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
      (requestHeaders as any)['Authorization'] = `Bearer ${token}`;

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
        throw new Error('Session expirée, veuillez vous reconnecter');
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
  return apiPost('/manager/fournisseurs', data, true);
}

export async function updateFournisseur(id: number, data: {
  nom_societe?: string;
  adresse?: string;
  nif?: string;
  telephone?: string;
}): Promise<any> {
  return apiPut(`/manager/fournisseurs/${id}`, data, true);
}

export async function getFournisseurs(): Promise<any> {
  return apiGet('/manager/fournisseurs', true);
}

export async function desactiverFournisseur(id: number): Promise<any> {
  return apiDelete(`/manager/fournisseurs/${id}`, true);
}

export async function activerFournisseur(id: number): Promise<any> {
  return apiPut(`/manager/fournisseurs/${id}/activer`, {}, true);
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
  return apiPost('/manager/icr', data, true);
}

export async function updateIcr(id: number, data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
  zone?: string;
}): Promise<any> {
  return apiPut(`/manager/icr/${id}`, data, true);
}

export async function getIcrs(): Promise<any> {
  return apiGet('/manager/icr', true);
}

export async function desactiverIcr(id: number): Promise<any> {
  return apiDelete(`/manager/icr/${id}`, true);
}

export async function activerIcr(id: number): Promise<any> {
  return apiPut(`/manager/icr/${id}/activer`, {}, true);
}

// ========== GESTION DES RESPONSABLES DE DÉPÔT (PAR MANAGER) ==========

export async function createResponsableDepot(data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
}): Promise<any> {
  return apiPost('/manager/responsables-depot', data, true);
}

export async function updateResponsableDepot(id: number, data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
}): Promise<any> {
  return apiPut(`/manager/responsables-depot/${id}`, data, true);
}

export async function getResponsablesDepot(): Promise<any> {
  return apiGet('/manager/responsables-depot', true);
}

export async function desactiverResponsableDepot(id: number): Promise<any> {
  return apiDelete(`/manager/responsables-depot/${id}`, true);
}

export async function activerResponsableDepot(id: number): Promise<any> {
  return apiPut(`/manager/responsables-depot/${id}/activer`, {}, true);
}

// ========== GESTION DES STATIONS ==========

export async function getStations(): Promise<any> {
  return apiGet('/stations', false);
}

export async function getStationById(id: number): Promise<any> {
  return apiGet(`/stations/${id}`, false);
}

// ========== GESTION DES DÉPÔTS ==========

export async function getDepots(): Promise<any> {
  return apiGet('/depots', true);
}

// ========== GESTION DES BONS (PAR FOURNISSEUR) ==========

export async function createBon(data: {
  type_carburant: string;
  quantite_commandee: number;
  date_disponibilite: string;
  id_depot: number;
  id_icr: number;
}): Promise<any> {
  return apiPost('/bons', data, true);
}

export async function signerBon(id: number, signature_fournisseur: string, code_verification: string): Promise<any> {
  return apiPut(`/bons/${id}/sign`, { signature_fournisseur, code_verification }, true);
}

export async function transmettreBon(id: number): Promise<any> {
  return apiPost(`/bons/${id}/transmit`, {}, true);
}

export async function getHistoriqueBons(): Promise<any> {
  // Récupérer l'ID du fournisseur depuis localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const fournisseurId = user.fournisseur?.id_fournisseur;
  
  if (!fournisseurId) {
    throw new Error('ID fournisseur non trouvé');
  }
  
  return apiGet(`/fournisseurs/${fournisseurId}/history`, true);
}

export async function suivreBon(id: number): Promise<any> {
  return apiGet(`/bons/${id}/track`, true);
}

export async function annulerBon(id: number, motif?: string): Promise<any> {
  return apiDelete(`/bons/${id}`, true);
}

// ========== GESTION DES PRIX (PAR MANAGER) ==========

export async function fixerPrix(essence: number, gasoil: number): Promise<any> {
  return apiPost('/manager/prix-carburant', { 
    type_carburant: 'essence', 
    prix_litre: essence,
    date_application: new Date().toISOString().split('T')[0]
  }, true);
}

export async function getPrix(): Promise<any> {
  return apiGet('/manager/prix-carburant', true);
}

// ========== TABLEAU DE BORD MANAGER ==========

export async function getDashboardData(): Promise<any> {
  return apiGet('/manager/dashboard', true);
}

export async function getStocks(): Promise<any> {
  return apiGet('/manager/stocks', true);
}

export async function getSuiviLivraisons(): Promise<any> {
  return apiGet('/manager/livraisons/suivi', true);
}

export async function getStatistiques(params?: any): Promise<any> {
  return apiGet('/manager/statistiques', true);
}

export async function getAlertes(): Promise<any> {
  return apiGet('/manager/alertes', true);
}
// ========== GESTION DES RESPONSABLES DE DÉPÔT (POUR LE RESPONSABLE LUI-MÊME) ==========

export async function getResponsableProfil(id_responsable: number): Promise<any> {
  return apiGet(`/responsable-depot/profil/${id_responsable}`, true);
}

export async function updateResponsableProfil(id_responsable: number, data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
}): Promise<any> {
  return apiPut(`/responsable-depot/profil/${id_responsable}`, data, true);
}

// ========== GESTION DES BONS POUR RESPONSABLE ==========

export async function getBonsRecus(id_responsable: number): Promise<any> {
  return apiGet(`/responsable-depot/bons-recus/${id_responsable}`, true);
}

export async function getDetailBon(id_bon: number): Promise<any> {
  return apiGet(`/responsable-depot/bon/${id_bon}`, true);
}

export async function verifierCodeChargement(id_bon: number, code: string): Promise<any> {
  return apiPost(`/responsable-depot/verifier-code`, { id_bon, code }, true);
}

export async function autoriserChargement(id_bon: number): Promise<any> {
  return apiPost(`/responsable-depot/autoriser-chargement`, { id_bon }, true);
}

export async function terminerChargement(id_bon: number, quantite_chargee: number): Promise<any> {
  return apiPost(`/responsable-depot/terminer-chargement`, { id_bon, quantite_chargee }, true);
}

// ========== GESTION DES STOCKS POUR RESPONSABLE ==========

export async function getStockDepot(id_responsable: number): Promise<any> {
  return apiGet(`/responsable-depot/stock/${id_responsable}`, true);
}

export async function getHistoriqueSorties(id_responsable: number): Promise<any> {
  return apiGet(`/responsable-depot/historique/${id_responsable}`, true);
}