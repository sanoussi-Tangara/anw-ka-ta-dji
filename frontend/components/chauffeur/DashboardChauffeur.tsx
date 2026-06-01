"use client";

import { useState, useEffect, useRef } from "react";
import {
  getMissionEnCoursChauffeur,
  envoyerPositionChauffeur,
  demarrerMissionChauffeur,
  signalerIncidentChauffeur,
  signerCertificatChauffeur,
} from "../../lib/api";

// ================= TYPES =================

type User = {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
};

type Certificat = {
  id_certificat: number;
  signature_icr: string | null;
  signature_chauffeur: string | null;
  est_signe_icr: boolean;
  est_signe_chauffeur: boolean;
  est_complet: boolean;
};

type Bon = {
  id_bon: number;
  code_verification: string;
  type_carburant: string;
  quantite_commandee: number;
  quantite_chargee: number;
  date_disponibilite: string;
  depot?: {
    nom: string;
    localisation: string;
  };
};

type Camion = {
  id_camion: number;
  immatriculation: string;
  capacite: number;
  type_carburant: string;
};

type Station = {
  id_station: number;
  nom: string;
  adresse: string;
  latitude?: number;
  longitude?: number;
};

type Livraison = {
  id_livraison: number;
  quantite_prevue: number;
  quantite_livree: number | null;
  code_validation: string;
  date_livraison: string | null;
  statut: string;
  station: Station;
};

type Mission = {
  id_mission: number;
  statut: string;
  date_debut: string | null;
  date_depart: string | null;
  bon?: Bon;
  camion?: Camion;
  livraisons: Livraison[];
  certificat?: Certificat;
};

export default function DashboardChauffeur() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mission, setMission] = useState<Mission | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showCertificatModal, setShowCertificatModal] = useState(false);
  const [currentLivraison, setCurrentLivraison] = useState<Livraison | null>(null);
  const [codeValidation, setCodeValidation] = useState("");
  const [quantiteLivree, setQuantiteLivree] = useState("");
  const [photoCompteur, setPhotoCompteur] = useState<string | null>(null);
  const [showSignalementModal, setShowSignalementModal] = useState(false);
  const [signalement, setSignalement] = useState({ type: "", description: "" });
  
  // Signature
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const certificatCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingCertificat, setIsDrawingCertificat] = useState(false);
  
  // GPS
  const [position, setPosition] = useState({ latitude: 0, longitude: 0 });
  const [gpsActif, setGpsActif] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger la mission en cours au démarrage
  useEffect(() => {
    fetchMissionEnCours();
    const interval = setInterval(fetchMissionEnCours, 30000);
    return () => clearInterval(interval);
  }, []);

  // Démarrer/arrêter le GPS
  useEffect(() => {
    if (mission?.statut === "en_cours" && gpsActif) {
      startGPS();
    } else {
      stopGPS();
    }
    return () => stopGPS();
  }, [mission?.statut, gpsActif]);

  const fetchMissionEnCours = async () => {
    setLoading(true);
    try {
      const res = await getMissionEnCoursChauffeur();
      console.log("=== RÉPONSE COMPLÈTE ===", JSON.stringify(res, null, 2));
      
      if (res && res.has_mission === true && res.mission) {
        console.log("✅ Mission trouvée:", res.mission.id_mission);
        setMission(res.mission);
      } else if (res && res.mission) {
        console.log("✅ Mission trouvée (format2):", res.mission.id_mission);
        setMission(res.mission);
      } else {
        console.log("❌ Aucune mission trouvée");
        setMission(null);
      }
    } catch (err: any) {
      console.error("❌ Erreur:", err);
      setMission(null);
    } finally {
      setLoading(false);
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

  // ========== GPS ==========
  const startGPS = () => {
    if (!navigator.geolocation) {
      showMessage("Géolocalisation non supportée", true);
      return;
    }

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setPosition(newPosition);
          
          if (mission) {
            try {
              await envoyerPositionChauffeur(mission.id_mission, newPosition.latitude, newPosition.longitude);
            } catch (err) {
              console.error("Erreur envoi position:", err);
            }
          }
        },
        (err) => console.error("Erreur GPS:", err),
        { enableHighAccuracy: true }
      );
    }, 10000);
  };

  const stopGPS = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // ========== SIGNATURE LIVRAISON ==========
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

  // ========== SIGNATURE CERTIFICAT ==========
  const startDrawingCertificat = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawingCertificat(true);
    const canvas = certificatCanvasRef.current;
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

  const drawCertificat = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingCertificat) return;
    e.preventDefault();
    
    const canvas = certificatCanvasRef.current;
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

  const endDrawingCertificat = () => {
    setIsDrawingCertificat(false);
  };

  const clearSignatureCertificat = () => {
    const canvas = certificatCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
    }
  };

  const saveSignatureLivraison = async () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const pixelData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = pixelData?.data.every(value => value === 255);
    
    if (isEmpty) {
      showMessage("Veuillez signer avant de valider", true);
      return;
    }
    
    if (!codeValidation) {
      showMessage("Veuillez entrer le code de validation", true);
      return;
    }
    
    if (!quantiteLivree) {
      showMessage("Veuillez entrer la quantité livrée", true);
      return;
    }
    
    setLoading(true);
    try {
      const signatureDataURL = canvas.toDataURL('image/png');
      
      await validerLivraisonChauffeur({
        id_livraison: currentLivraison?.id_livraison!,
        code_validation: codeValidation,
        quantite_livree: parseFloat(quantiteLivree),
        signature_gerant: "",
        signature_chauffeur: signatureDataURL,
        photo_compteur: photoCompteur || undefined
      });
      
      showMessage("✅ Livraison validée avec succès !");
      setShowSignatureModal(false);
      setCurrentLivraison(null);
      setCodeValidation("");
      setQuantiteLivree("");
      setPhotoCompteur(null);
      fetchMissionEnCours();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const saveSignatureCertificat = async () => {
    const canvas = certificatCanvasRef.current;
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
      await signerCertificatChauffeur(mission!.id_mission, signatureDataURL);
      
      showMessage("✅ Certificat signé avec succès !");
      setShowCertificatModal(false);
      fetchMissionEnCours();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // ========== SIGNALEMENT ==========
  const envoyerSignalement = async () => {
    if (!signalement.type || !signalement.description) {
      showMessage("Veuillez remplir tous les champs", true);
      return;
    }
    
    setLoading(true);
    try {
      await signalerIncidentChauffeur({
        type: signalement.type,
        message: signalement.description
      });
      
      showMessage("✅ Signalement envoyé à l'ICR");
      setShowSignalementModal(false);
      setSignalement({ type: "", description: "" });
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const prendrePhoto = () => {
    const fakePhoto = "data:image/png;base64,...";
    setPhotoCompteur(fakePhoto);
    showMessage("Photo prise avec succès");
  };

  const handleDemarrerMission = async () => {
    setLoading(true);
    try {
      await demarrerMissionChauffeur(mission!.id_mission);
      showMessage("✅ Mission démarrée !");
      fetchMissionEnCours();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  if (!mission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚛</div>
          <h2 className="text-xl text-gray-400">Aucune mission en cours</h2>
          <p className="text-gray-500 mt-2">Vous serez notifié quand une mission vous sera assignée</p>
        </div>
      </div>
    );
  }

  // Construire l'URL de la carte avec tous les points
  const mapCenter = mission.livraisons[0]?.station.latitude 
    ? `${mission.livraisons[0].station.latitude},${mission.livraisons[0].station.longitude}`
    : "12.6392,-8.0029";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* HEADER */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-orange-500/20 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                🚛 Dashboard Chauffeur
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Mission en cours • {mission.camion?.immatriculation}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${gpsActif ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <button
                onClick={() => setGpsActif(!gpsActif)}
                className={`px-3 py-1 rounded-lg text-xs ${gpsActif ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
              >
                {gpsActif ? 'GPS Actif' : 'GPS Inactif'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {(message || error) && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          {message && !error && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl">
              ✅ {message}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
              ❌ {error}
            </div>
          )}
        </div>
      )}

      {/* TABS */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
          {[
            ["dashboard", "📊 Tableau de bord"],
            ["livraisons", "📍 Livraisons"],
            ["itineraire", "🗺️ Itinéraire"],
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

      {/* CONTENU */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            {/* Statut mission */}
            <div className="bg-gradient-to-r from-orange-500/10 to-green-500/10 rounded-2xl p-6 mb-6 border border-orange-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Mission #{mission.id_mission}</p>
                  <h2 className="text-2xl font-bold text-white">
                    {mission.bon?.depot?.nom || "Dépôt"}
                  </h2>
                  <p className="text-gray-300 mt-1">{mission.bon?.type_carburant} • {mission.bon?.quantite_commandee} L</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    mission.statut === "en_cours" ? "text-blue-400 animate-pulse" : "text-yellow-400"
                  }`}>
                    {mission.statut === "en_cours" ? "🟢 En cours" : "⏳ Planifiée"}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Début: {mission.date_debut ? new Date(mission.date_debut).toLocaleString() : "En attente"}
                  </p>
                </div>
              </div>
            </div>

            {/* Certificat à signer */}
            {mission.certificat && !mission.certificat.est_signe_chauffeur && (
              <div className="bg-white/5 rounded-2xl p-6 border border-orange-500/30 mb-6">
                <h3 className="text-orange-400 font-semibold mb-3">📄 Certificat de transport</h3>
                {mission.certificat.est_signe_icr ? (
                  <div>
                    <p className="text-green-400 text-sm mb-3">✓ L'ICR a déjà signé le certificat</p>
                    <button
                      onClick={() => setShowCertificatModal(true)}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-black font-semibold"
                    >
                      ✍️ Signer le certificat
                    </button>
                  </div>
                ) : (
                  <p className="text-yellow-400 text-sm">⏳ En attente de la signature de l'ICR</p>
                )}
              </div>
            )}

            {/* Infos camion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-orange-400 font-semibold mb-3">🚚 Mon camion</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Immatriculation:</span>
                    <span className="text-white">{mission.camion?.immatriculation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacité:</span>
                    <span className="text-white">{mission.camion?.capacite} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type carburant:</span>
                    <span className="text-white">{mission.camion?.type_carburant}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-orange-400 font-semibold mb-3">📍 Ma position</h3>
                {position.latitude !== 0 ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latitude:</span>
                      <span className="text-white">{position.latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Longitude:</span>
                      <span className="text-white">{position.longitude.toFixed(6)}</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${position.latitude},${position.longitude}`}
                      target="_blank"
                      className="text-orange-400 text-xs block text-center mt-2"
                    >
                      Voir sur Google Maps →
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">En attente du GPS...</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowSignalementModal(true)}
                className="px-6 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
              >
                ⚠️ Signaler un incident
              </button>
              {mission.statut === "planifiee" && (
                <button
                  onClick={handleDemarrerMission}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-600 transition"
                >
                  🚀 Démarrer la mission
                </button>
              )}
            </div>
          </div>
        )}

   {/* LIVRAISONS - Version corrigée (sans validation par le chauffeur) */}
{activeTab === "livraisons" && (
  <div className="space-y-4">
    {mission.livraisons.map((livraison) => (
      <div key={livraison.id_livraison} className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-orange-400">📍 {livraison.station.nom}</h3>
            <p className="text-sm text-gray-400">{livraison.station.adresse}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs ${
            livraison.statut === "validee" ? "bg-green-500/20 text-green-300" :
            livraison.statut === "ecart" ? "bg-red-500/20 text-red-300" :
            "bg-yellow-500/20 text-yellow-300"
          }`}>
            {livraison.statut === "validee" ? "✅ Livrée" :
             livraison.statut === "ecart" ? "⚠️ Écart" :
             "⏳ En attente"}
          </span>
        </div>
        
        {/* Code à donner au gérant - C'est la seule action du chauffeur */}
        {livraison.statut === "en_attente" && (
          <div className="mb-4 p-4 bg-orange-500/20 rounded-lg border border-orange-500/30">
            <p className="text-xs text-gray-400 text-center">📢 Code à communiquer au gérant :</p>
            <p className="text-4xl font-mono font-bold text-orange-400 text-center tracking-wider my-2">
              {livraison.code_validation}
            </p>
            <p className="text-xs text-gray-500 text-center">
              Ce code permettra au gérant de valider la livraison dans son application
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-sm">Quantité prévue</p>
            <p className="text-2xl font-bold text-white">{livraison.quantite_prevue} L</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Quantité livrée</p>
            <p className="text-2xl font-bold text-white">{livraison.quantite_livree || "-"} L</p>
          </div>
        </div>
        
        {livraison.statut === "validee" && livraison.date_livraison && (
          <p className="text-xs text-green-400 mt-2 text-center">
            ✓ Livrée le {new Date(livraison.date_livraison).toLocaleString()}
          </p>
        )}
      </div>
    ))}
  </div>
)}
        {/* ITINERAIRE AVEC CARTE */}
        {activeTab === "itineraire" && (
          <div className="space-y-4">
            {/* Carte OpenStreetMap */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-orange-400 font-semibold mb-3">🗺️ Carte de l'itinéraire</h3>
              <div className="h-[400px] w-full rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=-8.05,12.60,-7.95,12.68&layer=mapnik&marker=${mapCenter}`}
                  style={{ border: 0 }}
                  title="Carte itinéraire"
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Cliquez sur "Naviguer" pour être guidé vers chaque station
              </p>
            </div>

            {/* Liste des étapes - Départ puis livraisons */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-orange-400 font-semibold mb-3">📍 Itinéraire complet</h3>
              
              {/* Point de départ - Dépôt */}
              <div className="mb-4 p-3 bg-blue-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">D</div>
                  <div className="flex-1">
                    <p className="font-semibold">🚛 DÉPART - Dépôt</p>
                    <p className="text-sm">{mission.bon?.depot?.nom || "Dépôt"}</p>
                    <p className="text-xs text-gray-400">{mission.bon?.depot?.localisation}</p>
                  </div>
                </div>
              </div>
              
              {/* Flèche de connexion */}
              <div className="flex justify-center my-2">
                <div className="w-0.5 h-6 bg-orange-500/50"></div>
                <div className="text-orange-400 text-xl ml-1">↓</div>
              </div>
              
              {/* Livraisons */}
              {mission.livraisons.map((livraison, index) => (
                <div key={livraison.id_livraison} className={`mb-4 p-3 rounded-lg ${livraison.statut === 'validee' ? 'bg-green-500/20' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      livraison.statut === 'validee' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-orange-500/30 text-orange-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">📍 {livraison.station.nom}</p>
                      <p className="text-xs text-gray-400">{livraison.station.adresse}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-orange-400">📦 {livraison.quantite_prevue} L</span>
                        <span className="text-xs font-mono text-gray-500">🔑 Code: {livraison.code_validation}</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(mission.bon?.depot?.localisation || '')}&destination=${livraison.station.latitude},${livraison.station.longitude}`}
                      target="_blank"
                      className="text-xs px-3 py-1 rounded-lg bg-orange-500/30 text-orange-300 hover:bg-orange-500/50 transition"
                    >
                      🗺️ Naviguer
                    </a>
                  </div>
                  {index < mission.livraisons.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-0.5 h-4 bg-orange-500/30"></div>
                      <div className="text-orange-400 text-sm ml-1">↓</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Position GPS actuelle */}
            {position.latitude !== 0 && (
              <div className="bg-green-500/10 rounded-2xl p-3 border border-green-500/30">
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  📍 Votre position actuelle: 
                  <a 
                    href={`https://www.google.com/maps?q=${position.latitude},${position.longitude}`}
                    target="_blank"
                    className="text-green-400"
                  >
                    {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
                  </a>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL SIGNATURE LIVRAISON */}
      {showSignatureModal && currentLivraison && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">📝 Validation livraison</h2>
              <button onClick={() => setShowSignatureModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="font-semibold">{currentLivraison.station.nom}</p>
              <p className="text-sm text-gray-400">{currentLivraison.station.adresse}</p>
              <p className="text-sm mt-2">Quantité prévue: <span className="text-orange-400">{currentLivraison.quantite_prevue} L</span></p>
              
              <div className="mt-3 p-3 bg-orange-500/20 rounded-lg">
                <p className="text-xs text-gray-400">Code à donner au gérant :</p>
                <p className="text-3xl font-mono font-bold text-orange-400 text-center tracking-wider">
                  {currentLivraison.code_validation}
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Communiquez ce code au gérant pour valider la livraison
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Code reçu du gérant</label>
              <input                type="text"
                maxLength={4}
                placeholder="Entrez le code à 4 chiffres"
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white text-center text-2xl font-mono"
                value={codeValidation}
                onChange={(e) => setCodeValidation(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Quantité livrée (L)</label>
              <input
                type="number"
                placeholder="Quantité constatée"
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                value={quantiteLivree}
                onChange={(e) => setQuantiteLivree(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Photo du compteur</label>
              <button
                onClick={prendrePhoto}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300"
              >
                📸 Prendre une photo
              </button>
              {photoCompteur && <p className="text-xs text-green-400 mt-1">✓ Photo prise</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Signature du chauffeur</label>
              <div className="border-2 border-orange-500/30 rounded-lg p-2 bg-white">
                <canvas
                  ref={signatureCanvasRef}
                  width={600}
                  height={150}
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
              <button onClick={clearSignature} className="text-xs text-gray-400 mt-1">Effacer la signature</button>
            </div>
            
            <button
              onClick={saveSignatureLivraison}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold"
            >
              {loading ? "Validation..." : "✅ Valider la livraison"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL SIGNATURE CERTIFICAT */}
      {showCertificatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">✍️ Signature du certificat</h2>
              <button onClick={() => setShowCertificatModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-gray-400">Mission #{mission.id_mission}</p>
              <p className="text-sm text-orange-400 mt-1">Veuillez signer le certificat de transport</p>
            </div>
            
            <div className="border-2 border-orange-500/30 rounded-lg p-2 bg-white mb-4">
              <canvas
                ref={certificatCanvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair"
                style={{ touchAction: 'none', backgroundColor: 'white' }}
                onMouseDown={startDrawingCertificat}
                onMouseMove={drawCertificat}
                onMouseUp={endDrawingCertificat}
                onMouseLeave={endDrawingCertificat}
                onTouchStart={startDrawingCertificat}
                onTouchMove={drawCertificat}
                onTouchEnd={endDrawingCertificat}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={clearSignatureCertificat}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white"
              >
                🧹 Effacer
              </button>
              <button
                onClick={saveSignatureCertificat}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold"
              >
                {loading ? "Signature..." : "✅ Signer le certificat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIGNALEMENT */}
      {showSignalementModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-orange-400 mb-4">⚠️ Signaler un incident</h2>
            
            <div className="space-y-4">
              <select
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                value={signalement.type}
                onChange={(e) => setSignalement({...signalement, type: e.target.value})}
              >
                <option value="">Type d'incident</option>
                <option value="panne">🚛 Panne mécanique</option>
                <option value="retard">⏰ Retard</option>
                <option value="accident">💥 Accident</option>
                <option value="autre">📝 Autre</option>
              </select>
              
              <textarea
                placeholder="Description détaillée..."
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                rows={4}
                value={signalement.description}
                onChange={(e) => setSignalement({...signalement, description: e.target.value})}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignalementModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white"
                >
                  Annuler
                </button>
                <button
                  onClick={envoyerSignalement}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}