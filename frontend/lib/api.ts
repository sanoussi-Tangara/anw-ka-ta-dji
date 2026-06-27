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
    window.location.href = '/';//je peux mettre login pour que ça me redirige sur la page login
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

// ========== RESPONSABLE DÉPÔT (Gestion des stocks du DÉPÔT) ==========

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

// Gestion des bons pour responsable dépôt
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

// Stocks du DÉPÔT (pour responsable dépôt)
export async function getStockDepot(id_responsable: number): Promise<any> {
  return apiGet(`/responsable-depot/stock/${id_responsable}`, true);
}

export async function getHistoriqueSorties(id_responsable: number): Promise<any> {
  return apiGet(`/responsable-depot/historique-sorties/${id_responsable}`, true);
}

export async function updateStockDepot(id_responsable: number, data: {
  type_carburant: string;
  quantite: number;
  operation: 'add' | 'remove' | 'set';
}): Promise<any> {
  return apiPut(`/responsable-depot/stock/${id_responsable}`, data, true);
}

export async function updateSeuilAlerteDepot(id_responsable: number, data: {
  type_carburant: string;
  seuil_alerte: number;
}): Promise<any> {
  return apiPut(`/responsable-depot/seuil-alerte/${id_responsable}`, data, true);
}

// Alias pour compatibilité avec l'existant
export const updateSeuilAlerte = updateSeuilAlerteDepot;

export async function getAlertesStockDepot(id_responsable: number): Promise<any> {
  return apiGet(`/responsable-depot/alertes/${id_responsable}`, true);
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
    const response = await apiGet(`/chauffeur/mission-en-cours/${id}`, true);
    console.log("✅ Réponse API:", response);
    return response;
  } catch (error: any) {
    console.error("❌ Erreur API:", error);
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

// ========== GÉRANT DE STATION (Gestion des stocks de la STATION) ==========

const getGerantId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.specific_id || user?.gerant?.id_gerant || null;
  } catch {
    return null;
  }
};

// Profil
export const getGerantProfil = async (id_gerant: number) => {
  return apiGet(`/gerant/profil/${id_gerant}`, true);
};

export const updateGerantProfil = async (id_gerant: number, data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
}) => {
  return apiPut(`/gerant/profil/${id_gerant}`, data, true);
};

// Dashboard
export const getGerantDashboard = async (id_gerant: number) => {
  return apiGet(`/gerant/dashboard/${id_gerant}`, true);
};

// Pompistes
export const getGerantPompistes = async (id_gerant: number) => {
  return apiGet(`/gerant/pompistes/${id_gerant}`, true);
};

export const creerPompiste = async (data: {
  id_gerant: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password?: string;
  id_station?: number;
}) => {
  return apiPost('/gerant/pompiste/creer', data, true);
};

export const modifierPompiste = async (id_pompiste: number, data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
}) => {
  return apiPut(`/gerant/pompiste/modifier/${id_pompiste}`, data, true);
};

export const desactiverPompiste = async (id_pompiste: number) => {
  return apiPut(`/gerant/pompiste/desactiver/${id_pompiste}`, {}, true);
};

export const activerPompiste = async (id_pompiste: number) => {
  return apiPut(`/gerant/pompiste/activer/${id_pompiste}`, {}, true);
};

// Stocks de la STATION (pour gérant)
export const getGerantStocks = async (id_gerant: number) => {
  return apiGet(`/gerant/stocks/${id_gerant}`, true);
};

// Livraisons
export const getGerantLivraisonsEnAttente = async (id_gerant: number) => {
  return apiGet(`/gerant/livraisons/attente/${id_gerant}`, true);
};

export const getGerantHistoriqueLivraisons = async (id_gerant: number) => {
  return apiGet(`/gerant/livraisons/historique/${id_gerant}`, true);
};

export const validerReceptionLivraison = async (data: {
  id_livraison: number;
  id_gerant: number;
  code_validation: string;
  quantite_recue: number;
  photo_compteur?: string;
  signature?: string;
}) => {
  return apiPost('/gerant/livraison/valider', data, true);
};

// Ventes
export const getGerantVentes = async (id_gerant: number) => {
  return apiGet(`/gerant/ventes/${id_gerant}`, true);
};

// Alertes
export const getGerantAlertes = async (id_gerant: number) => {
  return apiGet(`/gerant/alertes/${id_gerant}`, true);
};

export const marquerAlerteLue = async (id_alerte: number) => {
  return apiPut(`/gerant/alerte/lire/${id_alerte}`, {}, true);
};

// Version simplifiée avec récupération automatique de l'ID
export const getMonGerantProfil = async () => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return getGerantProfil(id);
};

export const getMonGerantDashboard = async () => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return getGerantDashboard(id);
};

export const getMesStocks = async () => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return getGerantStocks(id);
};

export const getMesPompistes = async () => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return getGerantPompistes(id);
};

export const getMesLivraisonsEnAttente = async () => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return getGerantLivraisonsEnAttente(id);
};

export const getMonHistoriqueLivraisons = async () => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return getGerantHistoriqueLivraisons(id);
};

export const getMesVentes = async () => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return getGerantVentes(id);
};

export const getMesAlertes = async () => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return getGerantAlertes(id);
};

export const validerMaReception = async (data: {
  id_livraison: number;
  code_validation: string;
  quantite_recue: number;
  photo_compteur?: string;
  signature?: string;
}) => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return validerReceptionLivraison({
    ...data,
    id_gerant: id
  });
};

// Mettre à jour le seuil d'alerte pour le gérant (station)
export const updateSeuilAlerteGerant = async (id_gerant: number, type_carburant: string, seuil_alerte: number) => {
  return apiPut(`/gerant/stocks/${id_gerant}/seuil`, { type_carburant, seuil_alerte }, true);
};

// Version simplifiée pour le gérant
export const updateMonSeuilAlerte = async (type_carburant: string, seuil_alerte: number) => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return updateSeuilAlerteGerant(id, type_carburant, seuil_alerte);
};

// Vérifier les alertes de stock (station)
export const verifierAlertesStock = async (id_gerant: number) => {
  return apiGet(`/gerant/alertes/verifier/${id_gerant}`, true);
};

// Version simplifiée
export const verifierMesAlertesStock = async () => {
  const id = getGerantId();
  if (!id) throw new Error('Gérant non trouvé');
  return verifierAlertesStock(id);
};

// ========== NOTIFICATIONS POUR GÉRANT ==========
export const getGerantNotifications = async () => {
  return apiGet(`/gerant/notifications`, true);
};

// ✅ Renommer pour éviter le conflit avec les notifications générales
export const marquerNotificationGerantLue = async (id_notification: number) => {
  return apiPut(`/gerant/notification/lire/${id_notification}`, {}, true);
};

// ✅ Renommer pour éviter le conflit avec les notifications générales
export const marquerToutesNotificationsGerantLues = async () => {
  return apiPut(`/gerant/notifications/lire-toutes`, {}, true);
};
// ========== POMPISTE ==========

// Récupérer l'ID du pompiste depuis le localStorage
const getPompisteId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.specific_id || user?.pompiste?.id_pompiste || null;
  } catch {
    return null;
  }
};

// Profil
export const getPompisteProfil = async () => {
  return apiGet('/pompiste/profil', true);
};

export const updatePompisteProfil = async (data: {
  nom?: string;
  prenom?: string;
  telephone?: string;
}) => {
  return apiPut('/pompiste/profil', data, true);
};

// Ventes - Utilise la route /pompiste/vente
export const saisirVente = async (data: {
  id_pompiste: number;
  id_station: number;
  type_carburant: string;
  quantite: number;
  mode_paiement: string;
}) => {
  return apiPost('/pompiste/vente', data, true);
};

export const getPompisteVentes = async () => {
  return apiGet('/pompiste/ventes', true);
};

export const getPompisteVentesDuJour = async () => {
  return apiGet('/pompiste/ventes/jour', true);
};

// Stocks
export const getPompisteStocks = async () => {
  return apiGet('/pompiste/stocks', true);
};

// Réservations
export const getPompisteReservations = async () => {
  return apiGet('/pompiste/reservations', true);
};

export const marquerReservationServie = async (id_reservation: number) => {
  return apiPut(`/pompiste/reservation/${id_reservation}/servir`, {}, true);
};

// Fin de journée
export const getPompisteClotureCaisse = async () => {
  return apiGet('/pompiste/cloture', true);
};

// Synchronisation hors-ligne
export const synchroniserVentesHorsLigne = async (ventes: any[]) => {
  return apiPost('/pompiste/synchroniser', { ventes }, true);
};

// Version simplifiée avec récupération auto de l'ID
export const getMonPompisteProfil = async () => {
  return getPompisteProfil();
};

export const getMesStocksPompiste = async () => {
  return getPompisteStocks();
};

export const getMesVentesPompiste = async () => {
  return getPompisteVentes();
};

export const getMesReservationsPompiste = async () => {
  return getPompisteReservations();
};

export const getMaClotureCaisse = async () => {
  return getPompisteClotureCaisse();
};

// ✅ OPTION 2 - Récupère d'abord le profil pour avoir les IDs
export const enregistrerVente = async (data: {
  type_carburant: string;
  quantite: number;
  mode_paiement: string;
}) => {
  // Récupérer d'abord le profil complet
  const profil = await getPompisteProfil();
  const id_pompiste = profil.pompiste?.id_pompiste;
  const id_station = profil.pompiste?.id_station;
  
  console.log('🔍 Profil pompiste:', profil);
  console.log('🔍 ID pompiste:', id_pompiste);
  console.log('🔍 ID station:', id_station);
  
  if (!id_pompiste) {
    throw new Error('Pompiste non trouvé');
  }
  if (!id_station) {
    throw new Error('Station non trouvée');
  }
  
  // Utiliser la route /pompiste/vente
  return apiPost('/pompiste/vente', {
    id_pompiste,
    id_station,
    type_carburant: data.type_carburant,
    quantite: data.quantite,
    mode_paiement: data.mode_paiement
  }, true);
};

// Récupérer les prix actuels (depuis le manager)
export const getPrixActuels = async () => {
  return apiGet('/pompiste/prix', true);
};

// ========== CONSOMMATEUR - API COMPLÈTE ==========

// ID
const getConsommateurId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.specific_id || user?.consommateur?.id_consommateur || null;
  } catch {
    return null;
  }
};

// ------------------------------------------------------------------
// 1. Stations (renommé pour éviter conflit)
// ------------------------------------------------------------------
export const getStationsConsommateur = async () => {
  return apiGet('/stations', false);
};

export const getStationDetailsConsommateur = async (id: number) => {
  return apiGet(`/stations/${id}`, false);
};

export const getStationsParCarburant = async (type: string) => {
  return apiGet(`/stations/disponibles/${type}`, false);
};

export const getStationsProches = async (lat: number, lng: number) => {
  return apiPost('/stations/proximite', { latitude: lat, longitude: lng }, false);
};

// ------------------------------------------------------------------
// 2. Prix
// ------------------------------------------------------------------
export const getPrixActuelsConsommateur = async () => {
  return apiGet('/prix-actuels', false);
};

// ------------------------------------------------------------------
// 3. Profil
// ------------------------------------------------------------------
export const getConsommateurProfil = async () => {
  return apiGet('/consommateur/profil', true);
};

export const updateConsommateurProfil = async (data: { nom?: string; prenom?: string; telephone?: string }) => {
  return apiPut('/consommateur/profil', data, true);
};

// ------------------------------------------------------------------
// 4. Réservations
// ------------------------------------------------------------------
export const getConsommateurReservations = async () => {
  return apiGet('/reservations', true);
};

export const getConsommateurReservation = async (id: number) => {
  return apiGet(`/reservations/${id}`, true);
};

export const creerReservation = async (data: {
  id_station: number;
  type_carburant: 'essence' | 'gasoil';
  quantite: number;
  date_retrait?: string;
}) => {
  return apiPost('/reservations', data, true);
};

export const annulerReservation = async (id: number) => {
  return apiPut(`/reservations/${id}/annuler`, {}, true);
};

// ------------------------------------------------------------------
// 5. Paiements
// ------------------------------------------------------------------
export const simulerPaiement = async (id_reservation: number, mode_paiement: string) => {
  return apiPost('/paiements/simuler', { id_reservation, mode_paiement }, true);
};

export const verifierPaiement = async (id_reservation: number) => {
  return apiGet(`/paiements/verifier/${id_reservation}`, true);
};

// ------------------------------------------------------------------
// 6. Statistiques
// ------------------------------------------------------------------
export const getConsommateurStatistiques = async () => {
  return apiGet('/consommateur/statistiques', true);
};

// ------------------------------------------------------------------
// 7. Notifications (renommé pour éviter conflit)
// ------------------------------------------------------------------
export const getConsommateurNotifications = async () => {
  return apiGet('/notifications', true);
};

export const lireNotificationConsommateur = async (id: number) => {
  return apiPut(`/notifications/${id}/lire`, {}, true);
};

// ------------------------------------------------------------------
// 8. Pompiste - Voir réservations
// ------------------------------------------------------------------
export const getReservationsPompiste = async () => {
  return apiGet('/pompiste/reservations', true);
};

export const servirReservationPompiste = async (id: number) => {
  return apiPut(`/pompiste/reservation/${id}/servir`, {}, true);
};