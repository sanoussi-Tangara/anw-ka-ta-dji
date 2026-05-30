// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

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
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const msg = `Impossible de joindre l'API (${API_URL}). Démarrez le backend : cd backend && php artisan serve`;
      console.error('API Error:', msg);
      throw new Error(msg);
    }
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
  return apiPost('/manager/fournisseur/creer', data, true);
}

export async function updateFournisseur(id: number, data: {
  nom_societe?: string;
  adresse?: string;
  nif?: string;
  telephone?: string;
  nom?: string;
  prenom?: string;
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
  zone?: string;
  nom_entreprise?: string;
}): Promise<any> {
  return apiPost('/manager/icr/creer', data, true);
}

export async function updateIcr(id: number, data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
  zone?: string;
  nom_entreprise?: string;
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

// ========== GESTION DES DÉPÔTS (PAR MANAGER) ==========

export async function creerDepot(data: {
  nom: string;
  localisation: string;
  id_responsable: number;
}): Promise<any> {
  return apiPost('/manager/depot/creer', data, true);
}

export async function getDepots(): Promise<any> {
  return apiGet('/manager/depots', true);
}

export async function getDepotById(id: number): Promise<any> {
  return apiGet(`/manager/depot/${id}`, true);
}

export async function changerResponsable(data: {
  id_depot: number;
  id_responsable: number;
}): Promise<any> {
  return apiPost('/manager/responsable/affecter', data, true);
}

// ========== GESTION DES PRIX (PAR MANAGER) ==========

export async function fixerPrix(essence: number, gasoil: number): Promise<any> {
  return apiPost('/manager/prix/fixer', { prix_essence: essence, prix_gasoil: gasoil }, true);
}

export async function getPrix(): Promise<any> {
  return apiGet('/manager/prix', true);
}

// ========== GESTION DES STATIONS ==========

export async function getStations(): Promise<any> {
  return apiGet('/stations', false);
}

export async function getStationById(id: number): Promise<any> {
  return apiGet(`/stations/${id}`, false);
}

// ========== GESTION DES ICR (POUR FOURNISSEUR) ==========

export async function getIcrsForFournisseur(): Promise<any> {
  return apiGet('/fournisseur/icrs', true);
}

// ========== GESTION DES DÉPÔTS (POUR FOURNISSEUR) ==========

export async function getDepotsForFournisseur(): Promise<any> {
  return apiGet('/fournisseur/depots', true);
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

export async function signerBon(id: number, signature_fournisseur: string, code_verification: string): Promise<any> {
  return apiPost(`/fournisseur/bon/signer/${id}`, { signature_fournisseur, code_verification }, true);
}

export async function transmettreBon(id: number): Promise<any> {
  return apiPost(`/fournisseur/bon/transmettre/${id}`, {}, true);
}

export async function getHistoriqueBons(): Promise<any> {
  return apiGet('/fournisseur/bons/historique', true);
}

export async function suivreBon(id: number): Promise<any> {
  return apiGet(`/fournisseur/bon/suivre/${id}`, true);
}

export async function annulerBon(id: number): Promise<any> {
  return apiDelete(`/fournisseur/bon/annuler/${id}`, true);
}

// ========== SIGNATURE FOURNISSEUR ==========

export const signerBonAvecCanvas = async (id_bon: number, signature_fournisseur: string, code_verification: string) => {
  return apiPost(`/fournisseur/bon/signer/${id_bon}`, {
    signature_fournisseur,
    code_verification
  }, true);
};

export const getDetailsBon = async (id_bon: number) => {
  return apiGet(`/fournisseur/bon/details/${id_bon}`, true);
};

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
  return apiGet(`/responsable-depot/historique-sorties/${id_responsable}`, true);
}

export async function updateSeuilAlerte(id_responsable: number, data: {
  type_carburant: string;
  seuil_alerte: number;
}): Promise<any> {
  return apiPut(`/responsable-depot/seuil-alerte/${id_responsable}`, data, true);
}

// ========== NOTIFICATIONS ==========

export async function getNotifications(page: number = 1, perPage: number = 20): Promise<any> {
  return apiGet(`/notifications?page=${page}&per_page=${perPage}`, true);
}

export async function getNotificationsNonLues(): Promise<any> {
  return apiGet('/notifications/non-lues', true);
}

export async function getNotificationById(id: number): Promise<any> {
  return apiGet(`/notifications/${id}`, true);
}

export async function marquerNotificationLue(id: number): Promise<any> {
  return apiPut(`/notifications/${id}/lire`, {}, true);
}

export async function marquerToutesNotificationsLues(): Promise<any> {
  return apiPut('/notifications/lire-toutes', {}, true);
}

export async function supprimerNotification(id: number): Promise<any> {
  return apiDelete(`/notifications/${id}`, true);
}

export async function supprimerToutesNotifications(): Promise<any> {
  return apiDelete('/notifications/supprimer/toutes', true);
}

export async function getNotificationsStatistiques(): Promise<any> {
  return apiGet('/notifications/statistiques', true);
}

export async function envoyerNotification(data: {
  id_destinataire: number;
  titre: string;
  message: string;
}): Promise<any> {
  return apiPost('/notifications/envoyer', data, true);
}

export async function updateStockDepot(id_responsable: number, data: {
  type_carburant: string;
  quantite: number;
  operation: 'add' | 'remove' | 'set';
}): Promise<any> {
  return apiPut(`/responsable-depot/stock/${id_responsable}`, data, true);
}

export async function getAlertesStock(id_responsable: number): Promise<any> {
  return apiGet(`/responsable-depot/alertes/${id_responsable}`, true);
}

// ========== GESTION ICR ==========

// Gérants
export async function getGerants(id_icr: number): Promise<any> {
  return apiGet(`/icr/gerants/${id_icr}`, true);
}

export async function createGerant(data: any): Promise<any> {
  return apiPost('/icr/gerant/creer', data, true);
}

export async function updateGerant(id_gerant: number, data: any): Promise<any> {
  return apiPut(`/icr/gerant/modifier/${id_gerant}`, data, true);
}

export async function desactiverGerant(id_gerant: number): Promise<any> {
  return apiPut(`/icr/gerant/desactiver/${id_gerant}`, {}, true);
}

export async function activerGerant(id_gerant: number): Promise<any> {
  return apiPut(`/icr/gerant/activer/${id_gerant}`, {}, true);
}

// Chauffeurs
export async function getChauffeurs(id_icr: number): Promise<any> {
  return apiGet(`/icr/chauffeurs/${id_icr}`, true);
}

export async function createChauffeur(data: any): Promise<any> {
  return apiPost('/icr/chauffeur/creer', data, true);
}

export async function updateChauffeur(id_chauffeur: number, data: any): Promise<any> {
  return apiPut(`/icr/chauffeur/modifier/${id_chauffeur}`, data, true);
}

export async function desactiverChauffeur(id_chauffeur: number): Promise<any> {
  return apiPut(`/icr/chauffeur/desactiver/${id_chauffeur}`, {}, true);
}

export async function activerChauffeur(id_chauffeur: number): Promise<any> {
  return apiPut(`/icr/chauffeur/activer/${id_chauffeur}`, {}, true);
}

// Stations
export async function getStationsIcr(): Promise<any> {
  return apiGet('/icr/stations', true);
}

export async function createStation(data: any): Promise<any> {
  return apiPost('/icr/station/creer', data, true);
}

export async function updateStation(id_station: number, data: any): Promise<any> {
  return apiPut(`/icr/station/modifier/${id_station}`, data, true);
}

export async function desactiverStation(id_station: number): Promise<any> {
  return apiPut(`/icr/station/desactiver/${id_station}`, {}, true);
}

export async function activerStation(id_station: number): Promise<any> {
  return apiPut(`/icr/station/activer/${id_station}`, {}, true);
}

// Camions
export async function getCamionsIcr(): Promise<any> {
  return apiGet('/icr/camions', true);
}

export async function createCamion(data: {
  immatriculation: string;
  capacite: number;
  type_carburant: string;
  id_chauffeur: number;
}): Promise<any> {
  console.log("API createCamion - données:", data);
  return apiPost('/icr/camion/creer', data, true);
}

export async function updateCamion(id_camion: number, data: any): Promise<any> {
  return apiPut(`/icr/camion/modifier/${id_camion}`, data, true);
}

export async function desactiverCamion(id_camion: number): Promise<any> {
  return apiPut(`/icr/camion/desactiver/${id_camion}`, {}, true);
}

export async function activerCamion(id_camion: number): Promise<any> {
  return apiPut(`/icr/camion/activer/${id_camion}`, {}, true);
}

// Bons
export async function getBonsRecusIcr(id_icr: number): Promise<any> {
  return apiGet(`/icr/bons-recus/${id_icr}`, true);
}

// Missions ICR
export async function getMissionsIcr(id_icr: number): Promise<any> {
  return apiGet(`/icr/missions/${id_icr}`, true);
}

export async function organiserMission(data: any): Promise<any> {
  return apiPost('/icr/mission/organiser', data, true);
}

export async function annulerMission(id_mission: number): Promise<any> {
  return apiPut(`/icr/mission/annuler/${id_mission}`, {}, true);
}

// Suivi GPS ICR
export async function suivreMissionGps(id_mission: number): Promise<any> {
  return apiGet(`/icr/mission/suivre/${id_mission}`, true);
}

// Profil ICR
export async function getIcrProfil(id_icr: number): Promise<any> {
  return apiGet(`/icr/profil/${id_icr}`, true);
}

export async function updateIcrProfil(id_icr: number, data: any): Promise<any> {
  return apiPut(`/icr/profil/${id_icr}`, data, true);
}

// Dashboard ICR
export async function getIcrDashboard(id_icr: number): Promise<any> {
  return apiGet(`/icr/dashboard/${id_icr}`, true);
}

// ========== GESTION DES CERTIFICATS ==========

export const getCertificatByMission = async (id_mission: number) => {
  return apiGet(`/certificats/mission/${id_mission}`, true);
};

export const signerMissionParIcr = async (id_mission: number, signature_icr: string) => {
  return apiPost(`/certificats/signer-icr`, { id_mission, signature_icr }, true);
};

export const signerMissionParChauffeur = async (id_mission: number, signature_chauffeur: string) => {
  return apiPost(`/certificats/signer-chauffeur`, { id_mission, signature_chauffeur }, true);
};

export const getStatutSignatureCertificat = async (id_mission: number) => {
  return apiGet(`/certificats/statut-signature/${id_mission}`, true);
};

export const downloadCertificatPDF = async (id_certificat: number) => {
  const token = localStorage.getItem('token');
  window.open(`${API_URL}/certificats/${id_certificat}/download-pdf?token=${token}`, '_blank');
};

export const genererCertificatPDF = async (id_certificat: number) => {
  return apiPost(`/certificats/${id_certificat}/generer-pdf`, {}, true);
};

export const checkSignatureCertificat = async (id_certificat: number) => {
  return apiGet(`/certificats/${id_certificat}/check-signature`, true);
};

export const creerCertificatPourMission = async (id_mission: number) => {
  return apiPost(`/certificats/creer-pour-mission`, { id_mission }, true);
};

// ========== SUIVI GPS ==========

export const getPositionMission = async (id_mission: number) => {
  return apiGet(`/icr/mission/${id_mission}/position`, true);
};

// ========== CHAUFFEUR ==========

const getChauffeurId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.specific_id || user?.chauffeur?.id_chauffeur || null;
  } catch {
    return null;
  }
};

export const getChauffeurDashboard = async () => {
  const id = getChauffeurId();
  return apiGet(`/chauffeur/dashboard/${id}`, true);
};

export const getMissionEnCoursChauffeur = async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const id = user?.specific_id || user?.chauffeur?.id_chauffeur;
  
  console.log("🔍 ID Chauffeur récupéré:", id);
  
  if (!id) {
    console.log("❌ Aucun ID chauffeur trouvé dans localStorage");
    return { has_mission: false, mission: null };
  }
  
  try {
    // Essayez d'abord avec la route mission-en-cours
    const response = await apiGet(`/chauffeur/mission-en-cours/${id}`, true);
    console.log("✅ Réponse API:", response);
    return response;
  } catch (error: any) {
    console.error("❌ Erreur API:", error);
    
    // Si la route mission-en-cours ne fonctionne pas, essayez missions
    try {
      const missionsResponse = await apiGet(`/chauffeur/missions/${id}`, true);
      console.log("✅ Missions trouvées:", missionsResponse);
      
      if (missionsResponse.missions && missionsResponse.missions.length > 0) {
        const missionEnCours = missionsResponse.missions.find(
          (m: any) => m.statut === 'planifiee' || m.statut === 'en_cours'
        );
        if (missionEnCours) {
          return { has_mission: true, mission: missionEnCours };
        }
      }
      return { has_mission: false, mission: null };
    } catch (err) {
      return { has_mission: false, mission: null };
    }
  }
};

export const demarrerMissionChauffeur = async (id_mission: number) => {
  return apiPost(`/chauffeur/mission/${id_mission}/demarrer`, {}, true);
};

export const terminerMissionChauffeur = async (id_mission: number) => {
  return apiPost(`/chauffeur/mission/${id_mission}/terminer`, {}, true);
};

export const getDetailsMissionChauffeur = async (id_mission: number) => {
  return apiGet(`/chauffeur/mission/${id_mission}/details`, true);
};

export const validerLivraisonChauffeur = async (data: {
  id_livraison: number;
  code_validation: string;
  quantite_livree: number;
  signature_gerant: string;
  signature_chauffeur: string;
  photo_compteur?: string;
}) => {
  return apiPost(`/chauffeur/livraison/valider`, data, true);
};

export const signerCertificatChauffeur = async (id_mission: number, signature: string) => {
  return apiPost(`/chauffeur/certificat/signer`, { id_mission, signature }, true);
};

export const signalerIncidentChauffeur = async (data: {
  type: string;
  message: string;
  latitude?: number;
  longitude?: number;
}) => {
  const id = getChauffeurId();
  return apiPost(`/chauffeur/incident/signaler`, { id_chauffeur: id, ...data }, true);
};

export const envoyerPositionChauffeur = async (id_mission: number, latitude: number, longitude: number) => {
  return apiPut(`/chauffeur/mission/${id_mission}/position`, { latitude, longitude }, true);
};

// ========== NOTIFICATIONS ==========

export const notifierChauffeur = async (id_mission: number) => {
  try {
    // Récupérer les infos de la mission
    const mission = await apiGet(`/missions/${id_mission}`, true);
    
    // Envoyer une notification (si vous avez une API de notification)
    // Ou simplement logger
    console.log(`📢 Notification: Mission ${id_mission} assignée au chauffeur ${mission.chauffeur?.user?.nom}`);
    
    // Vous pouvez aussi stocker dans une table notifications
    return { success: true };
  } catch (error) {
    console.error("Erreur notification:", error);
    return { success: false };
  }
};