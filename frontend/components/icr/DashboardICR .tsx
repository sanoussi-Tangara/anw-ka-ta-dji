"use client";

import { useState, useEffect, useRef } from "react";
import {
  getGerants,
  getChauffeurs,
  getBonsRecusIcr,
  organiserMission,
  getMissionsIcr,
  getStationsIcr,
  getCamionsIcr,
  createGerant,
  createChauffeur,
  createStation,
  createCamion,
  updateGerant,
  updateChauffeur,
  updateCamion,
  desactiverGerant,
  activerGerant,
  desactiverChauffeur,
  activerChauffeur,
  annulerMission,
  getIcrProfil,
  updateIcrProfil,
  getCertificatByMission,
  signerMissionParIcr,  
  getStatutSignatureCertificat,  // ← Ajoutez ceci
  downloadCertificatPDF,   // ← Changement ici (au lieu de signerCertificatICR)
  getPositionMission,  // ← AJOUTEZ CETTE LIGNE
} from "../../lib/api";

// ================= TYPES =================

type User = {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statut: boolean;
};

type Station = {
  id_station: number;
  nom: string;
  adresse: string;
  latitude?: number;
  longitude?: number;
  id_gerant?: number;
  gerant?: Gerant;
};

type Gerant = {
  id_gerant: number;
  id_utilisateur: number;
  id_icr: number;
  user?: User;
  station?: Station;
};

type Chauffeur = {
  id_chauffeur: number;
  id_utilisateur: number;
  id_icr: number;
  permis: string;
  user?: User;
};

type Camion = {
  id_camion: number;
  immatriculation: string;
  capacite: number;
  type_carburant: string;
  statut: string;
  id_chauffeur?: number;
  chauffeur?: Chauffeur;
};

type Bon = {
  id_bon: number;
  code_verification: string;
  type_carburant: string;
  quantite_commandee: number;
  quantite_chargee: number | null;
  date_disponibilite: string;
  statut: string;
  fournisseur?: { nom_societe: string };
  depot?: { nom: string };
};

type Mission = {
  id_mission: number;
  id_bon: number;
  id_chauffeur: number;
  id_camion: number;
  statut: string;
  bon?: Bon;
  chauffeur?: Chauffeur;
  camion?: Camion;
};

type IcrProfile = {
  id_icr: number;
  user?: User;
};

export default function DashboardIcr() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // États principaux
  const [icrId, setIcrId] = useState<number | null>(null);
  const [profile, setProfile] = useState<IcrProfile | null>(null);
  const [gerants, setGerants] = useState<Gerant[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [camions, setCamions] = useState<Camion[]>([]);
  const [bonsRecus, setBonsRecus] = useState<Bon[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  // États modaux
  const [showGerantModal, setShowGerantModal] = useState(false);
  const [showChauffeurModal, setShowChauffeurModal] = useState(false);
  const [showStationModal, setShowStationModal] = useState(false);
  const [showCamionModal, setShowCamionModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [selectedBon, setSelectedBon] = useState<Bon | null>(null);
  
  // États pour la signature
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [missionToSign, setMissionToSign] = useState<{id_mission: number, certificat_id: number} | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // États pour la modal certificat
const [showCertificatModal, setShowCertificatModal] = useState(false);
const [certificatDetails, setCertificatDetails] = useState<any>(null);

// États pour le suivi GPS
const [showGpsModal, setShowGpsModal] = useState(false);
const [positionData, setPositionData] = useState<any>(null);
const [selectedMissionGps, setSelectedMissionGps] = useState<number | null>(null);
const [rafraichissement, setRafraichissement] = useState(false);

  // Formulaires
  const [gerantForm, setGerantForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
  });

  const [chauffeurForm, setChauffeurForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    permis: "",
  });

  const [stationForm, setStationForm] = useState({
    nom: "",
    adresse: "",
    latitude: "",
    longitude: "",
    id_gerant: "",
  });

  const [camionForm, setCamionForm] = useState({
    immatriculation: "",
    capacite: "",
    type_carburant: "",
    id_chauffeur: "",
  });

  const [missionForm, setMissionForm] = useState({
    id_chauffeur: "",
    id_camion: "",
    livraisons: [] as { id_station: string; quantite_prevue: string; code_validation: string }[],
  });

  const [profilForm, setProfilForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
  });

  // Récupérer l'ID ICR depuis le localStorage
  useEffect(() => {
    const getIcrId = () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const id = user?.specific_id ?? user?.icr?.id_icr ?? null;
        console.log("=== ICR ID RÉCUPÉRÉ ===");
        console.log("ID:", id);
        return id;
      } catch {
        return null;
      }
    };
    setIcrId(getIcrId());
  }, []);

  // Charger les données
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
    if (icrId) {
      console.log("Chargement des données pour ICR ID:", icrId);
      fetchAllData();
      fetchProfile();
    }
  }, [icrId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchGerants(),
        fetchChauffeurs(),
        fetchStations(),
        fetchCamions(),
        fetchBonsRecus(),
        fetchMissions(),
      ]);
    } catch (err) {
      showMessage("Erreur de chargement des données", true);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!icrId) return;
    try {
      const res = await getIcrProfil(icrId);
      setProfile(res);
      if (res.user) {
        setProfilForm({
          nom: res.user.nom || "",
          prenom: res.user.prenom || "",
          telephone: res.user.telephone || "",
        });
      }
    } catch (err) {
      console.error("Erreur chargement profil", err);
    }
  };

  const fetchGerants = async () => {
    try {
      const res = await getGerants(icrId!);
      setGerants(res.gerants || []);
    } catch (err) {
      console.error("Erreur chargement gérants", err);
    }
  };

  const fetchChauffeurs = async () => {
    try {
      const res = await getChauffeurs(icrId!);
      console.log("=== CHAUFFEURS REÇUS ===");
      console.log("Réponse complète:", res);
      console.log("Nombre de chauffeurs:", res.chauffeurs?.length);
      if (res.chauffeurs && res.chauffeurs.length > 0) {
        console.log("Premier chauffeur:", res.chauffeurs[0]);
        console.log("Son ID:", res.chauffeurs[0].id_chauffeur);
      } else {
        console.log("Aucun chauffeur trouvé dans la réponse!");
      }
      setChauffeurs(res.chauffeurs || []);
    } catch (err) {
      console.error("Erreur chargement chauffeurs", err);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await getStationsIcr();
      setStations(res.stations || []);
    } catch (err) {
      console.error("Erreur chargement stations", err);
    }
  };

  const fetchCamions = async () => {
    try {
      const res = await getCamionsIcr();
      setCamions(res.camions || []);
    } catch (err) {
      console.error("Erreur chargement camions", err);
    }
  };

  const fetchBonsRecus = async () => {
    try {
      const res = await getBonsRecusIcr(icrId!);
      setBonsRecus(res.bons || []);
    } catch (err) {
      console.error("Erreur chargement bons", err);
    }
  };

  const fetchMissions = async () => {
  try {
    const res = await getMissionsIcr(icrId!);
    const missionsData = res.missions || [];
    
    // Pour chaque mission, on va chercher le statut du certificat
    const missionsAvecCertificat = await Promise.all(
      missionsData.map(async (mission: Mission) => {
        try {
          const certificatStatut = await getStatutSignatureCertificat(mission.id_mission);
          return { ...mission, certificat_statut: certificatStatut.statut };
        } catch {
          return { ...mission, certificat_statut: 'non_cree' };
        }
      })
    );
    
    setMissions(missionsAvecCertificat);
  } catch (err) {
    console.error("Erreur chargement missions", err);
  }
};

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    if (isError) setError(msg);
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
  };

  // Fonctions de signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.beginPath();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };
const saveSignature = async () => {
  const canvas = signatureCanvasRef.current;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const pixelData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
  const isEmpty = pixelData?.data.every(value => value === 255);
  
  if (isEmpty) {
    showMessage("Veuillez signer avant de valider", true);
    return;
  }
  
  setLoading(true);
  try {
    const signatureDataURL = canvas.toDataURL('image/png');
    
    // L'ICR signe
    // Dans DashboardICR.tsx, remplacez l'appel par :

const result = await signerMissionParIcr(missionToSign?.id_mission!, signatureDataURL);
    
showMessage("✅ Signature ICR enregistrée ! Le chauffeur peut maintenant voir la mission dans son dashboard.");

// Fermer la modal ICR
setShowSignatureModal(false);
setMissionToSign(null);

// Rafraîchir la liste des missions
await fetchMissions();
  } catch (err: any) {
    showMessage(err.message, true);
  } finally {
    setLoading(false);
  }
};

  // Gestion des gérants
  const handleCreateGerant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createGerant({
        id_icr: icrId!,
        ...gerantForm,
      });
      showMessage("✅ Gérant créé avec succès");
      setShowGerantModal(false);
      setGerantForm({ nom: "", prenom: "", email: "", telephone: "", password: "" });
      await fetchGerants();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGerantStatus = async (gerant: Gerant) => {
    setLoading(true);
    try {
      if (gerant.user?.statut) {
        await desactiverGerant(gerant.id_gerant);
        showMessage("✅ Gérant désactivé");
      } else {
        await activerGerant(gerant.id_gerant);
        showMessage("✅ Gérant activé");
      }
      await fetchGerants();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des chauffeurs
  const handleCreateChauffeur = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createChauffeur({
        id_icr: icrId!,
        ...chauffeurForm,
      });
      showMessage("✅ Chauffeur créé avec succès");
      setShowChauffeurModal(false);
      setChauffeurForm({ nom: "", prenom: "", email: "", telephone: "", password: "", permis: "" });
      await fetchChauffeurs();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChauffeurStatus = async (chauffeur: Chauffeur) => {
    setLoading(true);
    try {
      if (chauffeur.user?.statut) {
        await desactiverChauffeur(chauffeur.id_chauffeur);
        showMessage("✅ Chauffeur désactivé");
      } else {
        await activerChauffeur(chauffeur.id_chauffeur);
        showMessage("✅ Chauffeur activé");
      }
      await fetchChauffeurs();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des stations
  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stationForm.id_gerant) {
      showMessage("Veuillez sélectionner un gérant", true);
      return;
    }
    
    setLoading(true);
    try {
      await createStation({
        id_icr: icrId!,
        nom: stationForm.nom,
        adresse: stationForm.adresse,
        latitude: parseFloat(stationForm.latitude),
        longitude: parseFloat(stationForm.longitude),
        id_gerant: parseInt(stationForm.id_gerant),
      });
      showMessage("✅ Station créée avec succès");
      setShowStationModal(false);
      setStationForm({ nom: "", adresse: "", latitude: "", longitude: "", id_gerant: "" });
      await fetchStations();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des camions
  const handleCreateCamion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== HANDLE CREATE CAMION ===");
    console.log("1. icrId:", icrId);
    console.log("2. camionForm.id_chauffeur:", camionForm.id_chauffeur);
    console.log("3. Type de id_chauffeur:", typeof camionForm.id_chauffeur);
    console.log("4. Nombre de chauffeurs dans la liste:", chauffeurs.length);
    
    if (!camionForm.id_chauffeur) {
      showMessage("Veuillez sélectionner un chauffeur", true);
      return;
    }
    
    const idChauffeur = Number(camionForm.id_chauffeur);
    console.log("5. idChauffeur converti:", idChauffeur);
    
    if (isNaN(idChauffeur)) {
      showMessage("Chauffeur invalide", true);
      return;
    }
    
    setLoading(true);
    try {
      const data = {
        id_icr: icrId!,
        immatriculation: camionForm.immatriculation,
        capacite: parseFloat(camionForm.capacite),
        type_carburant: camionForm.type_carburant,
        id_chauffeur: idChauffeur,
      };
      console.log("6. Données envoyées à l'API:", JSON.stringify(data, null, 2));
      
      const result = await createCamion(data);
      console.log("7. Réponse API:", result);
      
      showMessage("✅ Camion créé avec succès");
      setShowCamionModal(false);
      setCamionForm({ immatriculation: "", capacite: "", type_carburant: "", id_chauffeur: "" });
      await fetchCamions();
    } catch (err: any) {
      console.error("8. ERREUR:", err);
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCamionStatus = async (id_camion: number, statut: string) => {
    setLoading(true);
    try {
      await updateCamion(id_camion, { statut });
      showMessage(`✅ Statut du camion mis à jour`);
      await fetchCamions();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des missions
// Gestion des missions
const handleOrganiserMission = async () => {
  if (!selectedBon) return;

  if (!missionForm.id_chauffeur || !missionForm.id_camion || missionForm.livraisons.length === 0) {
    showMessage("Veuillez remplir tous les champs", true);
    return;
  }

  setLoading(true);
  try {
    const result = await organiserMission({
      id_bon: selectedBon.id_bon,
      id_icr: icrId!,
      id_chauffeur: parseInt(missionForm.id_chauffeur),
      id_camion: parseInt(missionForm.id_camion),
      livraisons: missionForm.livraisons.map(l => ({
        id_station: parseInt(l.id_station),
        quantite_prevue: parseFloat(l.quantite_prevue),
        code_validation: l.code_validation,
      })),
    });
    
    showMessage("✅ Mission organisée avec succès");
    setShowMissionModal(false);
    setSelectedBon(null);
    setMissionForm({ id_chauffeur: "", id_camion: "", livraisons: [] });
    await fetchMissions();
    await fetchBonsRecus();
    
    // ✅ Ouvrir la modal de signature directement avec l'ID mission
    // Pas besoin d'attendre ou de récupérer le certificat
    const idMission = result?.id_mission || result?.mission?.id_mission;

    if (idMission) {
      setMissionToSign({
        id_mission: idMission,
        certificat_id: 0  // Valeur factice, car on utilise id_mission maintenant
      });
      setShowSignatureModal(true);
    } else {
      console.error("❌ ID mission introuvable:", result);
      showMessage("Mission créée, mais ID non trouvé", true);
    }
    
  } catch (err: any) {
    showMessage(err.message, true);
  } finally {
    setLoading(false);
  }
};
const handleAnnulerMission = async (id_mission: number) => {
  setLoading(true);
  try {
    await annulerMission(id_mission);
    showMessage("✅ Mission annulée");
    await fetchMissions();
  } catch (err: any) {
    showMessage(err.message, true);
  } finally {
    setLoading(false);
  }
};

const voirCertificat = async (id_mission: number) => {
  try {
    const response = await getCertificatByMission(id_mission);
    // La réponse peut être dans différents formats
    const certificatData = response.certificat || response;
    const missionData = response.mission || response;
    
    console.log("Structure de la réponse:", response); // Pour déboguer
    
    setCertificatDetails({
      certificat: certificatData,
      mission: missionData,
      bon: response.bon || null,
      icr: response.icr || null,
      chauffeur: response.chauffeur || null,
      camion: response.camion || null,
      livraisons: response.livraisons || [],
      totaux: response.totaux || null,
      signatures: response.signatures || null
    });
    setShowCertificatModal(true);
  } catch (err) {
    console.error("Erreur:", err);
    showMessage("Certificat non trouvé", true);
  }
};

  const ajouterLivraison = () => {
    setMissionForm({
      ...missionForm,
      livraisons: [...missionForm.livraisons, { id_station: "", quantite_prevue: "", code_validation: "" }],
    });
  };

  const supprimerLivraison = (index: number) => {
    const nouvellesLivraisons = [...missionForm.livraisons];
    nouvellesLivraisons.splice(index, 1);
    setMissionForm({ ...missionForm, livraisons: nouvellesLivraisons });
  };

  const updateLivraison = (index: number, field: string, value: string) => {
    const nouvellesLivraisons = [...missionForm.livraisons];
    nouvellesLivraisons[index] = { ...nouvellesLivraisons[index], [field]: value };
    setMissionForm({ ...missionForm, livraisons: nouvellesLivraisons });
  };

  const stats = {
    nbGerants: gerants.length,
    nbChauffeurs: chauffeurs.length,
    nbMissionsEnCours: missions.filter(m => m.statut === "en_cours").length,
    nbBonsEnAttente: bonsRecus.filter(b => b.statut === "signe").length,
    nbStations: stations.length,
    nbCamions: camions.length,
  };


  // Voir la position du camion
const voirPositionCamion = async (id_mission: number) => {
  setSelectedMissionGps(id_mission);
  setShowGpsModal(true);
  await chargerPosition(id_mission);
};

// Charger la position
const chargerPosition = async (id_mission: number) => {
  try {
    const res = await getPositionMission(id_mission);
    setPositionData(res);
  } catch (err) {
    console.error("Erreur", err);
    setPositionData(null);
  }
};

// Rafraîchir automatiquement toutes les 10 secondes
useEffect(() => {
  let interval: NodeJS.Timeout;
  
  if (showGpsModal && selectedMissionGps && rafraichissement) {
    interval = setInterval(() => {
      chargerPosition(selectedMissionGps);
    }, 10000); // 10 secondes
  }
  
  return () => {
    if (interval) clearInterval(interval);
  };
}, [showGpsModal, selectedMissionGps, rafraichissement]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* HEADER */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-orange-500/20 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                🏭 Dashboard ICR - Inspecteur Commercial de Réseaux
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Gestion des gérants, chauffeurs, missions et stations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-400">{profile?.user?.prenom} {profile?.user?.nom}</p>
                <p className="text-xs text-orange-400">ICR</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center">
                <span className="text-black font-bold text-lg">{profile?.user?.prenom?.[0]}{profile?.user?.nom?.[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {(message || error) && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          {message && !error && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl backdrop-blur">
              <span>✅</span> {message}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl backdrop-blur">
              <span>❌</span> {error}
            </div>
          )}
        </div>
      )}

      {/* TABS */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
          {[
            ["dashboard", "📊 Tableau de bord"],
            ["stations", "📍 Stations"],
            ["gerants", "👥 Gérants"],
            ["chauffeurs", "🚛 Chauffeurs"],
            ["camions", "🚚 Camions"],
            ["bons", "📋 Bons reçus"],
            ["missions", "📦 Missions"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === key
                  ? "bg-gradient-to-r from-orange-500 to-green-500 text-black shadow-lg"
                  : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: "Gérants", value: stats.nbGerants, color: "from-blue-500 to-cyan-500", icon: "👥" },
                { title: "Chauffeurs", value: stats.nbChauffeurs, color: "from-green-500 to-emerald-500", icon: "🚛" },
                { title: "Stations", value: stats.nbStations, color: "from-purple-500 to-pink-500", icon: "📍" },
                { title: "Camions", value: stats.nbCamions, color: "from-yellow-500 to-orange-500", icon: "🚚" },
                { title: "Missions en cours", value: stats.nbMissionsEnCours, color: "from-red-500 to-orange-500", icon: "📦" },
                { title: "Bons en attente", value: stats.nbBonsEnAttente, color: "from-indigo-500 to-purple-500", icon: "📋" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.title}</p>
                      <h2 className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </h2>
                    </div>
                    <span className="text-3xl opacity-50">{stat.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Derniers bons reçus */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">📋 Derniers bons reçus</h3>
              <div className="space-y-2">
                {bonsRecus.slice(0, 5).map((bon) => (
                  <div key={bon.id_bon} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-mono text-sm">Bon #{bon.id_bon}</p>
                      <p className="text-xs text-gray-400">{bon.type_carburant} • {bon.quantite_commandee} L</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-300">En attente</span>
                  </div>
                ))}
                {bonsRecus.length === 0 && (
                  <p className="text-center text-gray-400 py-4">Aucun bon reçu</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STATIONS */}
        {activeTab === "stations" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">📍 Gestion des stations</h2>
              <button
                onClick={() => setShowStationModal(true)}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
              >
                + Nouvelle station
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((station) => (
                <div key={station.id_station} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-orange-500/30 transition">
                  <h3 className="font-bold text-lg text-orange-400">{station.nom}</h3>
                  <p className="text-sm text-gray-400 mt-1">{station.adresse}</p>
                  {station.latitude && station.longitude && (
                    <p className="text-xs text-gray-500 mt-2">📍 {station.latitude}, {station.longitude}</p>
                  )}
                  <p className="text-xs text-orange-400 mt-1">👨‍💼 Gérant: {station.gerant?.user?.prenom} {station.gerant?.user?.nom}</p>
                  <div className="flex gap-2 mt-3">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                      target="_blank"
                      className="text-xs px-3 py-1 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition"
                    >
                      🗺️ Y aller
                    </a>
                  </div>
                </div>
              ))}
              {stations.length === 0 && (
                <div className="text-center text-gray-400 py-8 col-span-3">Aucune station enregistrée</div>
              )}
            </div>
          </div>
        )}

        {/* GÉRANTS */}
        {activeTab === "gerants" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">👥 Gestion des gérants</h2>
              <button
                onClick={() => setShowGerantModal(true)}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
              >
                + Nouveau gérant
              </button>
            </div>
            <div className="space-y-3">
              {gerants.map((gerant) => (
                <div key={gerant.id_gerant} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-orange-500/30 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{gerant.user?.prenom} {gerant.user?.nom}</p>
                      <p className="text-sm text-gray-400">{gerant.user?.email}</p>
                      <p className="text-sm text-gray-400">📞 {gerant.user?.telephone}</p>
                      <p className="text-xs text-orange-400 mt-1">📍 Station: {gerant.station?.nom || "Non affecté"}</p>
                    </div>
                    <button
                      onClick={() => handleToggleGerantStatus(gerant)}
                      className={`px-2 py-1 rounded-full text-xs ${gerant.user?.statut ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
                    >
                      {gerant.user?.statut ? "Actif" : "Inactif"}
                    </button>
                  </div>
                </div>
              ))}
              {gerants.length === 0 && (
                <div className="text-center text-gray-400 py-8">Aucun gérant enregistré</div>
              )}
            </div>
          </div>
        )}

        {/* CHAUFFEURS */}
        {activeTab === "chauffeurs" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">🚛 Gestion des chauffeurs</h2>
              <button
                onClick={() => setShowChauffeurModal(true)}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
              >
                + Nouveau chauffeur
              </button>
            </div>
            <div className="space-y-3">
              {chauffeurs.map((chauffeur) => (
                <div key={chauffeur.id_chauffeur} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-orange-500/30 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{chauffeur.user?.prenom} {chauffeur.user?.nom}</p>
                      <p className="text-sm text-gray-400">{chauffeur.user?.email}</p>
                      <p className="text-sm text-gray-400">📞 {chauffeur.user?.telephone}</p>
                      <p className="text-xs text-orange-400 mt-1">🪪 Permis: {chauffeur.permis}</p>
                    </div>
                    <button
                      onClick={() => handleToggleChauffeurStatus(chauffeur)}
                      className={`px-2 py-1 rounded-full text-xs ${chauffeur.user?.statut ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
                    >
                      {chauffeur.user?.statut ? "Actif" : "Inactif"}
                    </button>
                  </div>
                </div>
              ))}
              {chauffeurs.length === 0 && (
                <div className="text-center text-gray-400 py-8">Aucun chauffeur enregistré</div>
              )}
            </div>
          </div>
        )}

        {/* CAMIONS */}
        {activeTab === "camions" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">🚚 Gestion des camions</h2>
              <button
                onClick={() => setShowCamionModal(true)}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
              >
                + Nouveau camion
              </button>
            </div>
            <div className="space-y-3">
              {camions.map((camion) => (
                <div key={camion.id_camion} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-orange-500/30 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{camion.immatriculation}</p>
                      <p className="text-sm text-gray-400">Capacité: {camion.capacite} L</p>
                      <p className="text-sm text-gray-400">Type: {camion.type_carburant}</p>
                      {camion.chauffeur && (
                        <p className="text-xs text-orange-400 mt-1">👨‍✈️ Chauffeur: {camion.chauffeur.user?.prenom} {camion.chauffeur.user?.nom}</p>
                      )}
                    </div>
                    <select
                      value={camion.statut}
                      onChange={(e) => handleUpdateCamionStatus(camion.id_camion, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs ${
                        camion.statut === "disponible" ? "bg-green-500/20 text-green-300" : 
                        camion.statut === "en_mission" ? "bg-yellow-500/20 text-yellow-300" : 
                        "bg-red-500/20 text-red-300"
                      }`}
                    >
                      <option value="disponible">Disponible</option>
                      <option value="en_mission">En mission</option>
                      <option value="en_panne">En panne</option>
                    </select>
                  </div>
                </div>
              ))}
              {camions.length === 0 && (
                <div className="text-center text-gray-400 py-8">Aucun camion enregistré</div>
              )}
            </div>
          </div>
        )}

        {/* BONS REÇUS */}
        {activeTab === "bons" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📋 Bons reçus des fournisseurs</h2>
            <div className="space-y-3">
              {bonsRecus.map((bon) => (
                <div key={bon.id_bon} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-orange-500/30 transition">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-sm font-bold">Bon #{bon.id_bon}</p>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-300">En attente</span>
                      </div>
                      <p className="font-semibold mt-2">{bon.fournisseur?.nom_societe}</p>
                      <p className="text-sm text-gray-400">{bon.type_carburant} • {bon.quantite_commandee} L</p>
                      <p className="text-xs text-gray-500">Disponible: {new Date(bon.date_disponibilite).toLocaleString()}</p>
                      <p className="text-xs text-orange-400 font-mono">Code: {bon.code_verification}</p>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => {
                          setSelectedBon(bon);
                          setShowMissionModal(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold hover:shadow-lg transition"
                      >
                        🚀 Organiser mission
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {bonsRecus.length === 0 && (
                <div className="text-center text-gray-400 py-8">Aucun bon reçu</div>
              )}
            </div>
          </div>
        )}

        {/* MISSIONS */}
     {activeTab === "missions" && (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
    <h2 className="text-xl font-bold text-orange-400 mb-4">📦 Missions</h2>
    <div className="space-y-3">
      {missions.map((mission) => (
        <div key={mission.id_mission} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-orange-500/30 transition">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-mono text-sm font-bold">Mission #{mission.id_mission}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  mission.statut === "planifiee" ? "bg-yellow-500/20 text-yellow-300" :
                  mission.statut === "en_cours" ? "bg-blue-500/20 text-blue-300 animate-pulse" :
                  mission.statut === "terminee" ? "bg-green-500/20 text-green-300" :
                  "bg-red-500/20 text-red-300"
                }`}>
                  {mission.statut === "planifiee" ? "Planifiée" :
                   mission.statut === "en_cours" ? "En cours" :
                   mission.statut === "terminee" ? "Terminée" : mission.statut}
                </span>
                
                {/* Statut du certificat */}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  mission.certificat_statut === "complet" ? "bg-green-500/20 text-green-300" :
                  mission.certificat_statut === "icr_signe" ? "bg-yellow-500/20 text-yellow-300" :
                  "bg-gray-500/20 text-gray-300"
                }`}>
                  {mission.certificat_statut === "complet" ? "✅ Certificat signé" :
                   mission.certificat_statut === "icr_signe" ? "✍️ En attente chauffeur" :
                   "⏳ Non signé"}
                </span>
              </div>
              <p className="text-sm mt-2">Bon #{mission.bon?.id_bon} - {mission.bon?.type_carburant}</p>
              <p className="text-sm text-gray-400">🚛 Chauffeur: {mission.chauffeur?.user?.prenom} {mission.chauffeur?.user?.nom}</p>
              <p className="text-sm text-gray-400">🚚 Camion: {mission.camion?.immatriculation}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{mission.bon?.quantite_commandee} L à transporter</p>
              <div className="flex gap-2 mt-2 flex-wrap justify-end">
                {/* ✅ Bouton Voir position - visible pour planifiee et en_cours */}
                {(mission.statut === "planifiee" || mission.statut === "en_cours") && (
                  <button
                    onClick={() => voirPositionCamion(mission.id_mission)}
                    className="text-xs px-3 py-1 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
                  >
                    📍 Voir position
                  </button>
                )}
                
                {mission.statut === "planifiee" && (
                  <button
                    onClick={() => handleAnnulerMission(mission.id_mission)}
                    className="text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                  >
                    Annuler
                  </button>
                )}
                
                <button
                  onClick={() => voirCertificat(mission.id_mission)}
                  className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition"
                >
                  📄 Voir certificat
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {missions.length === 0 && (
        <div className="text-center text-gray-400 py-8">Aucune mission</div>
      )}
    </div>
  </div>
)}
      </div>

      {/* MODAL CRÉATION GÉRANT */}
      {showGerantModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">👥 Nouveau gérant</h2>
              <button onClick={() => setShowGerantModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleCreateGerant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Nom</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={gerantForm.nom} onChange={(e) => setGerantForm({...gerantForm, nom: e.target.value})} required /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Prénom</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={gerantForm.prenom} onChange={(e) => setGerantForm({...gerantForm, prenom: e.target.value})} required /></div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Email</label><input type="email" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={gerantForm.email} onChange={(e) => setGerantForm({...gerantForm, email: e.target.value})} required /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Téléphone</label><input type="tel" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={gerantForm.telephone} onChange={(e) => setGerantForm({...gerantForm, telephone: e.target.value})} required /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Mot de passe</label><input type="password" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={gerantForm.password} onChange={(e) => setGerantForm({...gerantForm, password: e.target.value})} required /></div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg">{loading ? "Création..." : "Créer le gérant"}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION CHAUFFEUR */}
      {showChauffeurModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">🚛 Nouveau chauffeur</h2>
              <button onClick={() => setShowChauffeurModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleCreateChauffeur} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Nom</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={chauffeurForm.nom} onChange={(e) => setChauffeurForm({...chauffeurForm, nom: e.target.value})} required /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Prénom</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={chauffeurForm.prenom} onChange={(e) => setChauffeurForm({...chauffeurForm, prenom: e.target.value})} required /></div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Email</label><input type="email" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={chauffeurForm.email} onChange={(e) => setChauffeurForm({...chauffeurForm, email: e.target.value})} required /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Téléphone</label><input type="tel" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={chauffeurForm.telephone} onChange={(e) => setChauffeurForm({...chauffeurForm, telephone: e.target.value})} required /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Mot de passe</label><input type="password" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={chauffeurForm.password} onChange={(e) => setChauffeurForm({...chauffeurForm, password: e.target.value})} required /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Numéro de permis</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={chauffeurForm.permis} onChange={(e) => setChauffeurForm({...chauffeurForm, permis: e.target.value})} required /></div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg">{loading ? "Création..." : "Créer le chauffeur"}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION STATION */}
      {showStationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">📍 Nouvelle station</h2>
              <button onClick={() => setShowStationModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleCreateStation} className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Nom de la station</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={stationForm.nom} onChange={(e) => setStationForm({...stationForm, nom: e.target.value})} required /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Adresse</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={stationForm.adresse} onChange={(e) => setStationForm({...stationForm, adresse: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Latitude</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={stationForm.latitude} onChange={(e) => setStationForm({...stationForm, latitude: e.target.value})} required /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Longitude</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={stationForm.longitude} onChange={(e) => setStationForm({...stationForm, longitude: e.target.value})} required /></div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Gérant</label>
                <select className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={stationForm.id_gerant} onChange={(e) => setStationForm({...stationForm, id_gerant: e.target.value})} required>
                  <option value="">Sélectionner un gérant</option>
                  {gerants.map((gerant) => (
                    <option key={gerant.id_gerant} value={gerant.id_gerant}>
                      {gerant.user?.prenom} {gerant.user?.nom}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg">{loading ? "Création..." : "Créer la station"}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION CAMION */}
      {showCamionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">🚚 Nouveau camion</h2>
              <button onClick={() => setShowCamionModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleCreateCamion} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Immatriculation</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none" 
                  placeholder="Ex: AB-123-CD"
                  value={camionForm.immatriculation} 
                  onChange={(e) => setCamionForm({...camionForm, immatriculation: e.target.value.toUpperCase()})} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Capacité (L)</label>
                <input 
                  type="number" 
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none" 
                  placeholder="Ex: 20000"
                  value={camionForm.capacite} 
                  onChange={(e) => setCamionForm({...camionForm, capacite: e.target.value})} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type de carburant</label>
                <select 
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none" 
                  value={camionForm.type_carburant} 
                  onChange={(e) => setCamionForm({...camionForm, type_carburant: e.target.value})} 
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="essence">Essence</option>
                  <option value="gasoil">Gasoil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Chauffeur</label>
                <select 
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none" 
                  value={camionForm.id_chauffeur} 
                  onChange={(e) => {
                    console.log("=== SELECTION CHAUFFEUR ===");
                    console.log("Nouvelle valeur sélectionnée:", e.target.value);
                    setCamionForm({...camionForm, id_chauffeur: e.target.value});
                  }} 
                  required
                >
                  <option value="">Sélectionner un chauffeur</option>
                  {chauffeurs.map((chauffeur) => {
                    console.log("Option ajoutée - ID:", chauffeur.id_chauffeur, "Nom:", chauffeur.user?.nom);
                    return (
                      <option key={chauffeur.id_chauffeur} value={chauffeur.id_chauffeur}>
                        {chauffeur.user?.prenom} {chauffeur.user?.nom} - {chauffeur.permis}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez un chauffeur pour ce camion
                </p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-2">
                <p className="text-xs text-orange-300">
                  ℹ️ Le camion sera créé avec le statut "Disponible" par défaut.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "Création en cours..." : "✅ Créer le camion"}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCamionModal(false)} 
                  className="flex-1 bg-white/10 py-3 rounded-lg hover:bg-white/20 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUIVI GPS */}
{showGpsModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-orange-400">📍 Suivi GPS - Mission #{selectedMissionGps}</h2>
        <button 
          onClick={() => {
            setShowGpsModal(false);
            setPositionData(null);
            setSelectedMissionGps(null);
          }} 
          className="text-gray-400 hover:text-white text-2xl"
        >
          ✕
        </button>
      </div>
      
      {!positionData ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de la position...</p>
        </div>
      ) : positionData.has_position === false ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📍</div>
          <p className="text-gray-400">{positionData.message || "Position non disponible"}</p>
          <p className="text-sm text-gray-500 mt-2">
            Le chauffeur n'a pas encore partagé sa position
          </p>
          <button
            onClick={() => chargerPosition(selectedMissionGps!)}
            className="mt-6 px-6 py-2 rounded-lg bg-orange-500 text-black font-semibold"
          >
            🔄 Actualiser
          </button>
        </div>
      ) : (
        <>
          {/* Affichage des coordonnées */}
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-lg font-semibold">Position actuelle</p>
              <p className="text-sm text-gray-400 mt-2">
                Latitude: {positionData.position?.latitude || positionData.latitude}<br />
                Longitude: {positionData.position?.longitude || positionData.longitude}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Dernière mise à jour: {positionData.position?.date ? new Date(positionData.position.date).toLocaleString() : 
                  positionData.date ? new Date(positionData.date).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Lien Google Maps */}
          <div className="bg-white/5 rounded-lg p-4">
            <a
              href={`https://www.google.com/maps?q=${positionData.position?.latitude || positionData.latitude},${positionData.position?.longitude || positionData.longitude}`}
              target="_blank"
              className="block w-full px-4 py-3 rounded-lg bg-orange-500 text-black text-center font-semibold hover:bg-orange-600 transition"
            >
              🗺️ Ouvrir dans Google Maps
            </a>
          </div>
          
          {/* Bouton actualiser */}
          <div className="mt-4">
            <button
              onClick={() => chargerPosition(selectedMissionGps!)}
              className="w-full px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition"
            >
              🔄 Actualiser la position
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

      {/* MODAL ORGANISER MISSION */}
      {showMissionModal && selectedBon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">🚀 Organiser la mission</h2>
              <button onClick={() => { setShowMissionModal(false); setSelectedBon(null); }} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Bon #{selectedBon.id_bon}</p>
                <p className="font-bold">{selectedBon.type_carburant} • {selectedBon.quantite_commandee} L</p>
                <p className="text-xs text-orange-400">Code: {selectedBon.code_verification}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Chauffeur</label>
                  <select className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={missionForm.id_chauffeur} onChange={(e) => setMissionForm({...missionForm, id_chauffeur: e.target.value})}>
                    <option value="">Sélectionner un chauffeur</option>
                    {chauffeurs.map((chauffeur) => (
                      <option key={chauffeur.id_chauffeur} value={chauffeur.id_chauffeur}>{chauffeur.user?.prenom} {chauffeur.user?.nom} - {chauffeur.permis}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Camion</label>
                  <select className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" value={missionForm.id_camion} onChange={(e) => setMissionForm({...missionForm, id_camion: e.target.value})}>
                    <option value="">Sélectionner un camion</option>
                    {camions.filter(c => c.statut === "disponible").map((camion) => (
                      <option key={camion.id_camion} value={camion.id_camion}>{camion.immatriculation} - {camion.capacite}L - {camion.type_carburant}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">📍 Livraisons</label>
                  <button type="button" onClick={ajouterLivraison} className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-300">+ Ajouter station</button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {missionForm.livraisons.length === 0 && <div className="text-center text-gray-500 py-4 text-sm">Aucune livraison. Cliquez sur "+ Ajouter station"</div>}
                  {missionForm.livraisons.map((livraison, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex justify-between mb-2"><span className="text-xs text-orange-400">Livraison #{index + 1}</span><button onClick={() => supprimerLivraison(index)} className="text-red-400 text-xs">Supprimer</button></div>
                      <div className="grid grid-cols-3 gap-2">
                        <select className="p-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" value={livraison.id_station} onChange={(e) => updateLivraison(index, "id_station", e.target.value)}>
                          <option value="">Station</option>
                          {stations.map((station) => (<option key={station.id_station} value={station.id_station}>{station.nom}</option>))}
                        </select>
                        <input type="number" placeholder="Quantité (L)" className="p-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" value={livraison.quantite_prevue} onChange={(e) => updateLivraison(index, "quantite_prevue", e.target.value)} />
                        <input type="text" maxLength={4} placeholder="Code" className="p-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" value={livraison.code_validation} onChange={(e) => updateLivraison(index, "code_validation", e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleOrganiserMission} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg">{loading ? "Organisation..." : "✅ Organiser la mission"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIGNATURE ICR */}
      {showSignatureModal && missionToSign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">✍️ Signature du Certificat</h2>
              <button 
                onClick={() => { setShowSignatureModal(false); setMissionToSign(null); }} 
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-gray-400 text-sm">Mission #{missionToSign.id_mission}</p>
              <p className="text-sm text-orange-400 mt-1">
                Veuillez signer dans le cadre ci-dessous pour valider le certificat de transport
              </p>
            </div>
            
            {/* Zone de signature */}
            <div className="border-2 border-orange-500/30 rounded-lg p-2 bg-white mb-4">
              <canvas
                ref={signatureCanvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair"
                style={{ touchAction: 'none', backgroundColor: 'white' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
              />
            </div>
            
            <div className="text-center text-xs text-gray-500 mb-4">
              Signez dans le cadre ci-dessus
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={clearSignature}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
              >
                🧹 Effacer
              </button>
              <button
                onClick={saveSignature}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "✅ Valider et signer"}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* MODAL AFFICHAGE CERTIFICAT */}
{/* MODAL AFFICHAGE CERTIFICAT */}
{showCertificatModal && certificatDetails && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-gradient-to-br from-gray-900 to-black">
        <h2 className="text-xl font-bold text-orange-400">📄 Certificat de Transport</h2>
        <button onClick={() => setShowCertificatModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
      </div>
      
      <div className="space-y-4">
        {/* En-tête du certificat */}
        <div className="bg-gradient-to-r from-orange-500/10 to-green-500/10 rounded-lg p-4 border border-orange-500/30">
          <p className="text-center text-lg font-bold">CERTIFICAT DE TRANSPORT</p>
          <p className="text-center text-sm text-gray-400">N° {certificatDetails.mission.id_mission}</p>
          <p className="text-center text-xs text-gray-500">Généré le {new Date(certificatDetails.certificat?.date_generation).toLocaleString()}</p>
        </div>

        {/* Informations de la mission */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-orange-400 font-semibold mb-2">📋 Informations de la mission</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-gray-400">Statut:</p>
            <p className="text-white">{certificatDetails.mission.statut}</p>
            <p className="text-gray-400">Date début:</p>
            <p className="text-white">{certificatDetails.mission.date_debut ? new Date(certificatDetails.mission.date_debut).toLocaleString() : '-'}</p>
            <p className="text-gray-400">Date départ:</p>
            <p className="text-white">{certificatDetails.mission.date_depart ? new Date(certificatDetails.mission.date_depart).toLocaleString() : '-'}</p>
          </div>
        </div>

        {/* Informations du bon */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-orange-400 font-semibold mb-2">🎫 Informations du bon</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-gray-400">N° Bon:</p>
            <p className="text-white">{certificatDetails.bon.id_bon}</p>
            <p className="text-gray-400">Code vérification:</p>
            <p className="text-white font-mono">{certificatDetails.bon.code_verification}</p>
            <p className="text-gray-400">Type carburant:</p>
            <p className="text-white">{certificatDetails.bon.type_carburant}</p>
            <p className="text-gray-400">Quantité commandée:</p>
            <p className="text-white">{certificatDetails.bon.quantite_commandee} L</p>
            <p className="text-gray-400">Quantité chargée:</p>
            <p className="text-white">{certificatDetails.bon.quantite_chargee || '-'} L</p>
            <p className="text-gray-400">Fournisseur:</p>
            <p className="text-white">{certificatDetails.bon.fournisseur?.nom_societe || '-'}</p>
            <p className="text-gray-400">Dépôt:</p>
            <p className="text-white">{certificatDetails.bon.depot?.nom || '-'}</p>
          </div>
        </div>

        {/* ICR et Chauffeur */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-orange-400 font-semibold mb-2">👤 ICR</h3>
            <p className="text-sm">{certificatDetails.icr.prenom} {certificatDetails.icr.nom}</p>
            <p className="text-xs text-gray-400">{certificatDetails.icr.email}</p>
            <p className="text-xs text-gray-400">{certificatDetails.icr.telephone}</p>
            <p className="text-xs text-gray-400">Matricule: {certificatDetails.icr.matricule}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-orange-400 font-semibold mb-2">🚛 Chauffeur</h3>
            <p className="text-sm">{certificatDetails.chauffeur.prenom} {certificatDetails.chauffeur.nom}</p>
            <p className="text-xs text-gray-400">{certificatDetails.chauffeur.email}</p>
            <p className="text-xs text-gray-400">{certificatDetails.chauffeur.telephone}</p>
            <p className="text-xs text-gray-400">Permis: {certificatDetails.chauffeur.permis}</p>
          </div>
        </div>

        {/* Camion */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-orange-400 font-semibold mb-2">🚚 Camion</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-gray-400">Immatriculation:</p>
            <p className="text-white">{certificatDetails.camion.immatriculation}</p>
            <p className="text-gray-400">Capacité:</p>
            <p className="text-white">{certificatDetails.camion.capacite} L</p>
            <p className="text-gray-400">Type carburant:</p>
            <p className="text-white">{certificatDetails.camion.type_carburant}</p>
          </div>
        </div>

        {/* Livraisons */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-orange-400 font-semibold mb-2">📍 Livraisons</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-2">Station</th>
                  <th className="text-left py-2">Quantité prévue</th>
                  <th className="text-left py-2">Quantité livrée</th>
                  <th className="text-left py-2">Code</th>
                  <th className="text-left py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {certificatDetails.livraisons.map((livraison: any, index: number) => (
                  <tr key={index} className="border-b border-white/5">
                    <td className="py-2">{livraison.station.nom}</td>
                    <td className="py-2">{livraison.quantite_prevue} L</td>
                    <td className="py-2">{livraison.quantite_livree || '-'} L</td>
                    <td className="py-2 font-mono">{livraison.code_validation}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        livraison.statut === 'validee' ? 'bg-green-500/20 text-green-300' :
                        livraison.statut === 'ecart' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {livraison.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-white/10">
                <tr className="text-orange-400">
                  <td className="py-2 font-semibold">Total</td>
                  <td className="py-2">{certificatDetails.totaux.quantite_totale_prevue} L</td>
                  <td className="py-2">{certificatDetails.totaux.quantite_totale_livree || '-'} L</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-orange-400 font-semibold mb-2">✍️ Signature ICR</h3>
            {certificatDetails.signatures.signature_icr ? (
              <div>
                <img src={certificatDetails.signatures.signature_icr} alt="Signature ICR" className="max-w-full h-20 object-contain bg-white rounded" />
                <p className="text-green-400 text-xs mt-1">✅ Signé</p>
              </div>
            ) : (
              <p className="text-yellow-400 text-sm">⏳ En attente</p>
            )}
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-orange-400 font-semibold mb-2">✍️ Signature Chauffeur</h3>
            {certificatDetails.signatures.signature_chauffeur ? (
              <div>
                <img src={certificatDetails.signatures.signature_chauffeur} alt="Signature Chauffeur" className="max-w-full h-20 object-contain bg-white rounded" />
                <p className="text-green-400 text-xs mt-1">✅ Signé</p>
              </div>
            ) : (
              <p className="text-yellow-400 text-sm">⏳ En attente</p>
            )}
          </div>
        </div>

        {/* Statut final */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-orange-400 font-semibold mb-2">📊 Statut du certificat</h3>
          {certificatDetails.signatures.certificat_complet ? (
            <p className="text-green-400">✅ Certificat complet et validé - Toutes les signatures sont présentes</p>
          ) : certificatDetails.signatures.icr_signe ? (
            <p className="text-yellow-400">✍️ En attente de la signature du chauffeur</p>
          ) : (
            <p className="text-red-400">❌ Aucune signature - En attente des signatures</p>
          )}
        </div>

        {/* Bouton téléchargement */}
        {certificatDetails.signatures.certificat_complet && (
          <button
            onClick={() => downloadCertificatPDF(certificatDetails.certificat.id_certificat)}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold hover:shadow-lg transition"
          >
            📥 Télécharger le certificat PDF
          </button>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
}