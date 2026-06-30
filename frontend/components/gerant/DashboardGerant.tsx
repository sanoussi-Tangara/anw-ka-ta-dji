"use client";

import { useState, useEffect, useRef } from "react";
import {
  getMonGerantProfil,
  getMesStocks,
  getMesPompistes,
  getMesLivraisonsEnAttente,
  getMonHistoriqueLivraisons,
  getMesVentes,
  getMesAlertes,
  getMonGerantDashboard,
  creerPompiste,
  modifierPompiste,
  desactiverPompiste,
  activerPompiste,
  validerMaReception,
  marquerAlerteLue,
  updateMonSeuilAlerte,
 getGerantNotifications,
  marquerNotificationGerantLue,
  marquerToutesNotificationsGerantLues,
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

type Pompiste = {
  id_pompiste: number;
  id_utilisateur: number;
  user?: User;
};

type Station = {
  id_station: number;
  nom: string;
  adresse: string;
};

type Stock = {
  id_stock: number;
  type_carburant: string;
  quantite: number;
  seuil_alerte: number;
  date_mise_a_jour: string;
};

type Livraison = {
  id_livraison: number;
  quantite_prevue: number;
  quantite_livree: number | null;
  code_validation: string;
  date_livraison: string | null;
  statut: string;
  station: Station;
  mission?: {
    id_mission: number;
    chauffeur?: {
      user?: User;
    };
    camion?: {
      immatriculation: string;
    };
  };
};

type Vente = {
  id_vente: number;
  quantite: number;
  montant: number;
  date_vente: string;
  type_carburant: string;
  pompiste?: {
    user?: User;
  };
};

type Alerte = {
  id_alerte: number;
  message: string;
  type: string;
  statut: string;
  created_at: string;
};

type GerantProfil = {
  id_gerant: number;
  user: User;
  station: Station;
};

type Notification = {
  id_notification: number;
  titre: string;
  message: string;
  lu: boolean;
  lien: string;
  created_at: string;
};

export default function DashboardGerant() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // États principaux
  const [profil, setProfil] = useState<GerantProfil | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [pompistes, setPompistes] = useState<Pompiste[]>([]);
  const [livraisonsAttente, setLivraisonsAttente] = useState<Livraison[]>([]);
  const [historiqueLivraisons, setHistoriqueLivraisons] = useState<Livraison[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
  // États pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsNonLues, setNotificationsNonLues] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // États modaux
  const [showPompisteModal, setShowPompisteModal] = useState(false);
  const [showEditPompisteModal, setShowEditPompisteModal] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [selectedLivraison, setSelectedLivraison] = useState<Livraison | null>(null);
  const [codeValidation, setCodeValidation] = useState("");
  const [quantiteRecue, setQuantiteRecue] = useState("");
  const [photoCompteur, setPhotoCompteur] = useState<string | null>(null);

  // États pour la modification du seuil
  const [showSeuilModal, setShowSeuilModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [nouveauSeuil, setNouveauSeuil] = useState(0);
  
  // États pour la modification du pompiste
  const [editPompiste, setEditPompiste] = useState<{
    id: number | null;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  }>({
    id: null,
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
  });
  
  // Formulaire pompiste
  const [pompisteForm, setPompisteForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
  });
  
  // Signature
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Charger les données au démarrage
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
    fetchAllData();
  }, []);
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfil(),
        fetchStocks(),
        fetchPompistes(),
        fetchLivraisonsAttente(),
        fetchHistoriqueLivraisons(),
        fetchVentes(),
        fetchAlertes(),
        fetchDashboard(),
        fetchNotifications(),
      ]);
    } catch (err) {
      showMessage("Erreur de chargement des données", true);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProfil = async () => {
    try {
      const res = await getMonGerantProfil();
      setProfil(res.gerant);
    } catch (err) {
      console.error("Erreur chargement profil", err);
    }
  };
  
  const fetchStocks = async () => {
    try {
      const res = await getMesStocks();
      setStocks(res.stocks || []);
    } catch (err) {
      console.error("Erreur chargement stocks", err);
    }
  };
  
  const fetchPompistes = async () => {
    try {
      const res = await getMesPompistes();
      setPompistes(res.pompistes || []);
    } catch (err) {
      console.error("Erreur chargement pompistes", err);
    }
  };
  
  const fetchLivraisonsAttente = async () => {
    try {
      const res = await getMesLivraisonsEnAttente();
      setLivraisonsAttente(res.livraisons || []);
    } catch (err) {
      console.error("Erreur chargement livraisons", err);
    }
  };
  
  const fetchHistoriqueLivraisons = async () => {
    try {
      const res = await getMonHistoriqueLivraisons();
      setHistoriqueLivraisons(res.livraisons || []);
    } catch (err) {
      console.error("Erreur chargement historique", err);
    }
  };
  
  const fetchVentes = async () => {
    try {
      const res = await getMesVentes();
      setVentes(res.ventes || []);
    } catch (err) {
      console.error("Erreur chargement ventes", err);
    }
  };
  
  const fetchAlertes = async () => {
    try {
      const res = await getMesAlertes();
      setAlertes(res.alertes || []);
    } catch (err) {
      console.error("Erreur chargement alertes", err);
    }
  };
  
  const fetchDashboard = async () => {
    try {
      const res = await getMonGerantDashboard();
      setDashboardStats(res);
    } catch (err) {
      console.error("Erreur chargement dashboard", err);
    }
  };
  
  const fetchNotifications = async () => {
    try {
      const res = await getGerantNotifications();
      setNotifications(res.notifications?.data || []);
      setNotificationsNonLues(res.non_lues || 0);
    } catch (err) {
      console.error("Erreur chargement notifications", err);
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
  
  // ========== SIGNATURE ==========
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };
  
  // ========== GESTION POMPISTES ==========
  
  // Créer un pompiste
  const handleCreatePompiste = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await creerPompiste({
        id_gerant: profil?.id_gerant!,
        ...pompisteForm,
        id_station: profil?.station?.id_station
      });
      showMessage("✅ Pompiste créé avec succès");
      setShowPompisteModal(false);
      setPompisteForm({ nom: "", prenom: "", email: "", telephone: "", password: "" });
      await fetchPompistes();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ Ouvrir le modal de modification
  const openEditPompiste = (pompiste: Pompiste) => {
    setEditPompiste({
      id: pompiste.id_pompiste,
      nom: pompiste.user?.nom || "",
      prenom: pompiste.user?.prenom || "",
      email: pompiste.user?.email || "",
      telephone: pompiste.user?.telephone || "",
    });
    setShowEditPompisteModal(true);
  };
  
  // ✅ Modifier un pompiste
  const handleEditPompiste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPompiste.id) return;
    setLoading(true);
    try {
      await modifierPompiste(editPompiste.id, {
        nom: editPompiste.nom,
        prenom: editPompiste.prenom,
        telephone: editPompiste.telephone,
      });
      showMessage("✅ Pompiste modifié avec succès");
      setShowEditPompisteModal(false);
      await fetchPompistes();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };
  
  // Activer/Désactiver un pompiste
  const handleTogglePompisteStatus = async (pompiste: Pompiste) => {
    setLoading(true);
    try {
      if (pompiste.user?.statut) {
        await desactiverPompiste(pompiste.id_pompiste);
        showMessage("✅ Pompiste désactivé");
      } else {
        await activerPompiste(pompiste.id_pompiste);
        showMessage("✅ Pompiste activé");
      }
      await fetchPompistes();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };
  
  // ========== RÉCEPTION LIVRAISON ==========
  const handleValiderReception = async () => {
    if (!codeValidation || !quantiteRecue) {
      showMessage("Veuillez remplir tous les champs", true);
      return;
    }
    
    const canvas = signatureCanvasRef.current;
    if (!canvas) {
      showMessage("Erreur de signature", true);
      return;
    }
    
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
      
      await validerMaReception({
        id_livraison: selectedLivraison?.id_livraison!,
        code_validation: codeValidation,
        quantite_recue: parseFloat(quantiteRecue),
        photo_compteur: photoCompteur || undefined,
        signature: signatureDataURL
      });
      
      showMessage("✅ Livraison validée avec succès !");
      setShowReceptionModal(false);
      setSelectedLivraison(null);
      setCodeValidation("");
      setQuantiteRecue("");
      setPhotoCompteur(null);
      await Promise.all([
        fetchLivraisonsAttente(),
        fetchHistoriqueLivraisons(),
        fetchStocks(),
        fetchDashboard(),
      ]);
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
  
  const handleMarquerAlerteLue = async (id_alerte: number) => {
    try {
      await marquerAlerteLue(id_alerte);
      await fetchAlertes();
      await fetchDashboard();
    } catch (err) {
      console.error("Erreur", err);
    }
  };
  
  // ========== GESTION SEUIL D'ALERTE ==========
  const handleModifierSeuil = async () => {
    if (!nouveauSeuil || nouveauSeuil < 0) {
      showMessage("Veuillez entrer un seuil valide", true);
      return;
    }
    
    setLoading(true);
    try {
      await updateMonSeuilAlerte(selectedStock!.type_carburant, nouveauSeuil);
      showMessage("✅ Seuil d'alerte mis à jour");
      setShowSeuilModal(false);
      setSelectedStock(null);
      await fetchStocks();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };
  
  // ========== GESTION NOTIFICATIONS ==========
  const handleMarquerNotificationLue = async (id: number, lien: string) => {
    try {
      await marquerNotificationGerantLue(id);
      await fetchNotifications();
      if (lien) window.location.href = lien;
    } catch (err) {
      console.error("Erreur", err);
    }
  };

  const handleMarquerToutesNotificationsLues = async () => {
    try {
      await marquerToutesNotificationsGerantLues();
      await fetchNotifications();
    } catch (err) {
      console.error("Erreur", err);
    }
  };
  
  // Vérifier les alertes de stock
  const alertesStock = stocks.filter(s => s.quantite <= (s.seuil_alerte || 5000));
  
  // MODAL MODIFICATION SEUIL
  const ModalSeuil = () => (
    showSeuilModal && selectedStock && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-orange-400">⚙️ Modifier le seuil d'alerte</h2>
            <button onClick={() => setShowSeuilModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-400">Type de carburant</p>
              <p className="text-xl font-bold text-white">
                {selectedStock.type_carburant === 'essence' ? '⛽ Essence' : '🛢️ Gasoil'}
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Seuil d'alerte (L)</label>
              <input
                type="number"
                min="0"
                max="50000"
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white text-center text-xl"
                value={nouveauSeuil || 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setNouveauSeuil(isNaN(value) ? 0 : value);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Vous serez alerté quand le stock sera inférieur ou égal à cette valeur
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowSeuilModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleModifierSeuil}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold"
              >
                {loading ? "Enregistrement..." : "✅ Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
  
  if (!profil) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⛽</div>
          <h2 className="text-xl text-gray-400">Chargement...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* HEADER */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-orange-500/20 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                ⛽ Dashboard Gérant - {profil.station?.nom || "Ma station"}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Gérez vos pompistes, suivez vos stocks et validez les livraisons
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* NOTIFICATIONS */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full hover:bg-white/10 transition"
                >
                  🔔
                  {notificationsNonLues > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notificationsNonLues}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-orange-500/30 rounded-lg shadow-lg z-50">
                    <div className="flex justify-between items-center p-3 border-b border-white/10">
                      <h3 className="font-semibold">Notifications</h3>
                      {notificationsNonLues > 0 && (
                        <button
                          onClick={handleMarquerToutesNotificationsLues}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">Aucune notification</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id_notification}
                            className={`p-3 border-b border-white/10 hover:bg-white/5 cursor-pointer transition ${!notif.lu ? 'bg-orange-500/10 border-l-4 border-l-orange-500' : ''}`}
                            onClick={() => handleMarquerNotificationLue(notif.id_notification, notif.lien)}
                          >
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-sm">{notif.titre}</p>
                              {!notif.lu && (
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-400">{profil.user?.prenom} {profil.user?.nom}</p>
                <p className="text-xs text-orange-400">Gérant</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center">
                <span className="text-black font-bold text-lg">{profil.user?.prenom?.[0]}{profil.user?.nom?.[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ALERTES STOCK */}
      {(message || error || alertesStock.length > 0) && (
        <div className="max-w-7xl mx-auto px-6 mt-4 space-y-2">
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
          {alertesStock.map(stock => (
            <div key={stock.id_stock} className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-xl">
              ⚠️ Alerte stock faible : {stock.type_carburant} - {Math.floor(stock.quantite).toLocaleString()} L restants
            </div>
          ))}
        </div>
      )}
      
      {/* TABS */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
          {[
            ["dashboard", "📊 Tableau de bord"],
            ["stocks", "📦 Stocks"],
            ["pompistes", "👥 Pompistes"],
            ["livraisons", "🚚 Livraisons"],
            ["historique", "📜 Historique"],
            ["ventes", "💰 Ventes"],
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
        {activeTab === "dashboard" && dashboardStats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Pompistes", value: dashboardStats.statistiques?.nombre_pompistes || 0, color: "from-blue-500 to-cyan-500", icon: "👥" },
                { title: "Livraisons en attente", value: dashboardStats.statistiques?.livraisons_attente || 0, color: "from-yellow-500 to-orange-500", icon: "🚚" },
                { title: "Ventes totales", value: `${(dashboardStats.statistiques?.total_ventes || 0).toLocaleString()} FCFA`, color: "from-green-500 to-emerald-500", icon: "💰" },
                { title: "Alertes", value: dashboardStats.statistiques?.alertes_non_lues || 0, color: "from-red-500 to-pink-500", icon: "⚠️" },
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
            
            {/* Stocks actuels */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">📦 Niveaux des stocks - {profil.station?.nom}</h3>
              {stocks.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Aucun stock enregistré</div>
              ) : (
                <div className="space-y-3">
                  {stocks.map((stock) => {
                    const capaciteMax = 50000;
                    const pourcentage = (stock.quantite / capaciteMax) * 100;
                    const estFaible = stock.quantite <= (stock.seuil_alerte || 5000);
                    return (
                      <div key={stock.id_stock}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{stock.type_carburant === 'essence' ? '⛽ Essence' : '🛢️ Gasoil'}</span>
                          <span>{Math.floor(stock.quantite).toLocaleString()} L</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${estFaible ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(pourcentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Livraisons en attente */}
            {livraisonsAttente.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">🚚 Livraisons en attente</h3>
                <div className="space-y-3">
                  {livraisonsAttente.slice(0, 3).map((livraison) => (
                    <div key={livraison.id_livraison} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-semibold">{livraison.quantite_prevue} L</p>
                        <p className="text-xs text-orange-400 font-mono">Code: {livraison.code_validation}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLivraison(livraison);
                          setShowReceptionModal(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-green-500/20 text-green-300 text-sm"
                      >
                        Valider
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* STOCKS */}
        {activeTab === "stocks" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">
              📦 Stocks de la station - {profil.station?.nom}
            </h2>
            {stocks.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Aucun stock enregistré pour cette station</div>
            ) : (
              <div className="space-y-4">
                {stocks.map((stock) => {
                  const capaciteMax = 50000;
                  const pourcentage = (stock.quantite / capaciteMax) * 100;
                  const estFaible = stock.quantite <= (stock.seuil_alerte || 5000);
                  return (
                    <div key={stock.id_stock} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg">{stock.type_carburant === 'essence' ? '⛽ Essence' : '🛢️ Gasoil'}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${estFaible ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                          {estFaible ? '⚠️ Stock faible' : '✓ Stock normal'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Niveau actuel</span>
                          <span>{Math.floor(stock.quantite).toLocaleString()} L / {capaciteMax.toLocaleString()} L</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${estFaible ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(pourcentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Seuil d'alerte: {(stock.seuil_alerte || 5000).toLocaleString()} L</span>
                        <button
                          onClick={() => {
                            setSelectedStock(stock);
                            setNouveauSeuil(stock.seuil_alerte || 5000);
                            setShowSeuilModal(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-300 text-xs"
                        >
                          Modifier le seuil
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Dernière mise à jour: {stock.date_mise_a_jour ? new Date(stock.date_mise_a_jour).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* POMPISTES - AVEC MODIFICATION */}
        {activeTab === "pompistes" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">👥 Gestion des pompistes</h2>
              <button
                onClick={() => setShowPompisteModal(true)}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
              >
                + Nouveau pompiste
              </button>
            </div>
            <div className="space-y-3">
              {pompistes.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Aucun pompiste enregistré</div>
              ) : (
                pompistes.map((pompiste) => (
                  <div key={pompiste.id_pompiste} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{pompiste.user?.prenom} {pompiste.user?.nom}</p>
                        <p className="text-sm text-gray-400">{pompiste.user?.email}</p>
                        <p className="text-sm text-gray-400">📞 {pompiste.user?.telephone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTogglePompisteStatus(pompiste)}
                          className={`px-2 py-1 rounded-full text-xs ${pompiste.user?.statut ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
                        >
                          {pompiste.user?.statut ? "Actif" : "Inactif"}
                        </button>
                        {/* ✅ BOUTON MODIFIER */}
                        <button
                          onClick={() => openEditPompiste(pompiste)}
                          className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition"
                        >
                          ✏️ Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* LIVRAISONS EN ATTENTE */}
        {activeTab === "livraisons" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">🚚 Livraisons en attente</h2>
            {livraisonsAttente.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Aucune livraison en attente</div>
            ) : (
              <div className="space-y-3">
                {livraisonsAttente.map((livraison) => (
                  <div key={livraison.id_livraison} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <p className="font-semibold">📦 {livraison.quantite_prevue} L</p>
                        <p className="text-sm text-gray-400">Code: <span className="font-mono">{livraison.code_validation}</span></p>
                        {livraison.mission?.chauffeur?.user && (
                          <p className="text-xs text-gray-500">Chauffeur: {livraison.mission.chauffeur.user.prenom} {livraison.mission.chauffeur.user.nom}</p>
                        )}
                        {livraison.mission?.camion && (
                          <p className="text-xs text-gray-500">Camion: {livraison.mission.camion.immatriculation}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLivraison(livraison);
                          setShowReceptionModal(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold"
                      >
                        📝 Valider la réception
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* HISTORIQUE LIVRAISONS */}
        {activeTab === "historique" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📜 Historique des livraisons</h2>
            {historiqueLivraisons.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Aucune livraison</div>
            ) : (
              <div className="space-y-3">
                {historiqueLivraisons.map((livraison) => (
                  <div key={livraison.id_livraison} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <p className="font-semibold">📦 {livraison.quantite_prevue} L</p>
                        <p className="text-sm text-gray-400">Reçu: {livraison.quantite_livree || 0} L</p>
                        <p className="text-xs text-gray-500">
                          {livraison.date_livraison && new Date(livraison.date_livraison).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        livraison.statut === "validee" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                      }`}>
                        {livraison.statut === "validee" ? "✅ Validée" : "⚠️ Écart"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* VENTES */}
        {activeTab === "ventes" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">💰 Ventes de la station</h2>
            {ventes.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Aucune vente enregistrée</div>
            ) : (
              <div className="space-y-3">
                {ventes.map((vente) => (
                  <div key={vente.id_vente} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <p className="font-semibold">{vente.type_carburant === 'essence' ? '⛽ Essence' : '🛢️ Gasoil'}</p>
                        <p className="text-sm text-gray-400">{vente.quantite} L</p>
                        {vente.pompiste?.user && (
                          <p className="text-xs text-gray-500">Pompiste: {vente.pompiste.user.prenom} {vente.pompiste.user.nom}</p>
                        )}
                        <p className="text-xs text-gray-500">{new Date(vente.date_vente).toLocaleString()}</p>
                      </div>
                      <p className="text-lg font-bold text-orange-400">{vente.montant.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* MODAL CRÉATION POMPISTE */}
      {showPompisteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">👤 Nouveau pompiste</h2>
              <button onClick={() => setShowPompisteModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleCreatePompiste} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nom</label>
                  <input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" 
                    value={pompisteForm.nom} onChange={(e) => setPompisteForm({...pompisteForm, nom: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prénom</label>
                  <input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" 
                    value={pompisteForm.prenom} onChange={(e) => setPompisteForm({...pompisteForm, prenom: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input type="email" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" 
                  value={pompisteForm.email} onChange={(e) => setPompisteForm({...pompisteForm, email: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Téléphone</label>
                <input type="tel" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" 
                  value={pompisteForm.telephone} onChange={(e) => setPompisteForm({...pompisteForm, telephone: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
                <input type="password" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" 
                  value={pompisteForm.password} onChange={(e) => setPompisteForm({...pompisteForm, password: e.target.value})} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg">
                {loading ? "Création..." : "Créer le pompiste"}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* ✅ MODAL MODIFICATION POMPISTE */}
      {showEditPompisteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">✏️ Modifier le pompiste</h2>
              <button onClick={() => setShowEditPompisteModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleEditPompiste} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nom</label>
                  <input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" 
                    value={editPompiste.nom} onChange={(e) => setEditPompiste({...editPompiste, nom: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prénom</label>
                  <input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" 
                    value={editPompiste.prenom} onChange={(e) => setEditPompiste({...editPompiste, prenom: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input type="email" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" 
                  value={editPompiste.email} onChange={(e) => setEditPompiste({...editPompiste, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Téléphone</label>
                <input type="tel" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white" 
                  value={editPompiste.telephone} onChange={(e) => setEditPompiste({...editPompiste, telephone: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg">
                  {loading ? "Modification..." : "✅ Modifier"}
                </button>
                <button type="button" onClick={() => setShowEditPompisteModal(false)} className="flex-1 bg-white/10 py-3 rounded-lg hover:bg-white/20 transition">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* MODAL RÉCEPTION LIVRAISON */}
      {showReceptionModal && selectedLivraison && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">📝 Réception livraison</h2>
              <button onClick={() => setShowReceptionModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="font-semibold">{selectedLivraison.quantite_prevue} L prévus</p>
              <p className="text-sm text-gray-400">Code de validation: <span className="font-mono">{selectedLivraison.code_validation}</span></p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Code de validation</label>
              <input
                type="text"
                maxLength={4}
                placeholder="Code à 4 chiffres"
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white text-center text-2xl font-mono"
                value={codeValidation}
                onChange={(e) => setCodeValidation(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Quantité reçue (L)</label>
              <input
                type="number"
                placeholder="Quantité constatée à la jauge"
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                value={quantiteRecue}
                onChange={(e) => setQuantiteRecue(e.target.value)}
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
              <label className="block text-sm text-gray-400 mb-2">Signature du gérant</label>
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
              onClick={handleValiderReception}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold"
            >
              {loading ? "Validation..." : "✅ Valider la réception"}
            </button>
          </div>
        </div>
      )}
      
      {/* MODAL MODIFICATION SEUIL */}
      <ModalSeuil />
    </div>
  );
}