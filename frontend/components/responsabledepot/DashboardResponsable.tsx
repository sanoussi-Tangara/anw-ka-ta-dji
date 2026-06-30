"use client";

import { useState, useEffect } from "react";
import {
  getResponsableProfil,
  getBonsRecus,
  getDetailBon,
  verifierCodeChargement,
  autoriserChargement,
  terminerChargement,
  getStockDepot,
  getHistoriqueSorties,
  updateResponsableProfil,
  getNotificationsNonLues,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
  getNotificationsStatistiques,
  updateStockDepot,
  updateSeuilAlerte,
} from "../../lib/api";

// ================= TYPES =================

type User = {
  id_utilisateur: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statut: boolean;
};

type Depot = {
  id_depot: number;
  nom: string;
  localisation: string;
};

type Fournisseur = {
  id_fournisseur: number;
  nom_societe: string;
  user?: User;
};

type Icr = {
  id_icr: number;
  matricule: string;
  user?: User;
};

type Bon = {
  id_bon: number;
  code_verification: string;
  type_carburant: "essence" | "gasoil";
  quantite_commandee: number;
  quantite_chargee: number | null;
  date_creation: string;
  date_disponibilite: string;
  statut: "cree" | "signe" | "en_cours" | "termine" | "annule";
  signature_fournisseur: string | null;
  debut_chargement?: string | null;
  fin_chargement?: string | null;
  fournisseur?: Fournisseur;
  icr?: Icr;
  depot?: Depot;
};

type Stock = {
  id_stock: number;
  type_carburant: string;
  quantite: number;
  seuil_alerte?: number;
  date_mise_a_jour: string;
  alerte?: boolean;
};

type Responsable = {
  id_responsable: number;
  user?: User;
  depot?: Depot;
};

type Notification = {
  id_notification: number;
  titre: string;
  message: string;
  date_envoi: string;
  lu: boolean;
  id_destinataire: number;
};

export default function DashboardResponsable() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // États principaux
  const [responsable, setResponsable] = useState<Responsable | null>(null);
  const [bonsRecus, setBonsRecus] = useState<Bon[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [historique, setHistorique] = useState<Bon[]>([]);
  const [selectedBon, setSelectedBon] = useState<Bon | null>(null);
  
  // États Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsNonLues, setNotificationsNonLues] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifStats, setNotifStats] = useState({ total: 0, non_lues: 0, lues: 0 });
  
  // États Gestion des stocks
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockOperation, setStockOperation] = useState<"add" | "remove" | "set">("add");
  const [stockQuantite, setStockQuantite] = useState<number>(0);
  
  // États Seuil d'alerte
  const [showSeuilModal, setShowSeuilModal] = useState(false);
  const [selectedStockSeuil, setSelectedStockSeuil] = useState<Stock | null>(null);
  const [nouveauSeuil, setNouveauSeuil] = useState<number>(5000);
  
  // Formulaires
  const [codeVerification, setCodeVerification] = useState("");
  const [quantiteChargee, setQuantiteChargee] = useState<number>(0);
  const [profilForm, setProfilForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
  });

  const getResponsableId = (): number | null => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const id = user?.specific_id ?? user?.responsable_depot?.id_responsable;
      return id != null ? Number(id) : null;
    } catch {
      return null;
    }
  };

  const responsableId = getResponsableId();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      showMessage("Session expirée, veuillez vous reconnecter", true);
      return;
    }
    if (!responsableId) {
      showMessage("Profil responsable introuvable. Reconnectez-vous.", true);
      return;
    }
    fetchAllData();
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfil(),
        fetchBonsRecus(),
        fetchStocks(),
        fetchHistorique(),
        fetchNotifications(),
        fetchNotifStats(),
      ]);
    } catch (err) {
      showMessage("Erreur de chargement des données", true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfil = async () => {
    if (!responsableId) return;
    try {
      const res = await getResponsableProfil(responsableId);
      setResponsable(res);
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

  const fetchBonsRecus = async () => {
    if (!responsableId) return;
    try {
      const res = await getBonsRecus(responsableId);
      setBonsRecus(res.bons || []);
    } catch (err) {
      console.error("Erreur chargement bons", err);
    }
  };

  const fetchStocks = async () => {
    if (!responsableId) return;
    try {
      const res = await getStockDepot(responsableId);
      setStocks(res.stocks || []);
    } catch (err) {
      console.error("Erreur chargement stocks", err);
    }
  };

  const fetchHistorique = async () => {
    if (!responsableId) return;
    try {
      const res = await getHistoriqueSorties(responsableId);
      setHistorique(res.historique || []);
    } catch (err) {
      console.error("Erreur chargement historique", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsNonLues();
      setNotificationsNonLues(res.notifications || []);
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error("Erreur chargement notifications", err);
    }
  };

  const fetchNotifStats = async () => {
    try {
      const res = await getNotificationsStatistiques();
      setNotifStats(res);
    } catch (err) {
      console.error("Erreur chargement stats notifications", err);
    }
  };

  const handleMarquerLue = async (id: number) => {
    try {
      await marquerNotificationLue(id);
      await fetchNotifications();
      await fetchNotifStats();
      showMessage("✅ Notification marquée comme lue");
    } catch (err) {
      console.error("Erreur", err);
    }
  };

  const handleMarquerToutesLues = async () => {
    try {
      await marquerToutesNotificationsLues();
      await fetchNotifications();
      await fetchNotifStats();
      showMessage("✅ Toutes les notifications sont lues");
    } catch (err) {
      console.error("Erreur", err);
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

  const handleVerifierEtAutoriser = async (bon: Bon) => {
    if (!codeVerification) {
      showMessage("Veuillez entrer le code de vérification", true);
      return;
    }

    setLoading(true);
    try {
      const verification = await verifierCodeChargement(bon.id_bon, codeVerification);
      
      if (verification.valide) {
        await autoriserChargement(bon.id_bon);
        showMessage("✅ Code valide, chargement autorisé !");
        await fetchBonsRecus();
        setSelectedBon(null);
        setCodeVerification("");
      }
    } catch (err: any) {
      showMessage(err.message || "❌ Code invalide", true);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminerChargement = async (bon: Bon) => {
    if (!quantiteChargee || quantiteChargee <= 0) {
      showMessage("Veuillez entrer la quantité chargée", true);
      return;
    }

    if (quantiteChargee > bon.quantite_commandee) {
      showMessage("La quantité chargée ne peut pas dépasser la quantité commandée", true);
      return;
    }

    setLoading(true);
    try {
      await terminerChargement(bon.id_bon, quantiteChargee);
      showMessage("✅ Chargement terminé avec succès !");
      await Promise.all([fetchBonsRecus(), fetchStocks(), fetchHistorique()]);
      setSelectedBon(null);
      setQuantiteChargee(0);
    } catch (err: any) {
      showMessage(err.message || "Erreur lors de la finalisation", true);
    } finally {
      setLoading(false);
    }
  };

  const handleVoirDetail = async (bon: Bon) => {
    setLoading(true);
    try {
      const res = await getDetailBon(bon.id_bon);
      setSelectedBon(res);
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsableId) return;
    setLoading(true);
    try {
      await updateResponsableProfil(responsableId, profilForm);
      showMessage("✅ Profil mis à jour avec succès");
      await fetchProfil();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedStock || stockQuantite <= 0) {
      showMessage("Veuillez entrer une quantité valide", true);
      return;
    }

    if (stockOperation === "remove" && stockQuantite > selectedStock.quantite) {
      showMessage("La quantité à retirer ne peut pas dépasser le stock actuel", true);
      return;
    }

    setLoading(true);
    try {
      await updateStockDepot(responsableId!, {
        type_carburant: selectedStock.type_carburant,
        quantite: stockQuantite,
        operation: stockOperation
      });
      
      const operationMessage = 
        stockOperation === "add" ? "ajouté" : 
        stockOperation === "remove" ? "retiré" : "défini";
      
      showMessage(`✅ Stock ${operationMessage} avec succès`);
      await fetchStocks();
      setShowStockModal(false);
      setSelectedStock(null);
      setStockQuantite(0);
    } catch (err: any) {
      console.error("Erreur mise à jour stock:", err);
      showMessage(err.message || "Erreur lors de la mise à jour du stock", true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSeuilAlerte = async () => {
    if (!selectedStockSeuil || nouveauSeuil <= 0) {
      showMessage("Veuillez entrer un seuil valide", true);
      return;
    }

    setLoading(true);
    try {
      await updateSeuilAlerte(responsableId!, {
        type_carburant: selectedStockSeuil.type_carburant,
        seuil_alerte: nouveauSeuil
      });
      
      showMessage(`✅ Seuil d'alerte mis à jour: ${nouveauSeuil} L`);
      await fetchStocks();
      setShowSeuilModal(false);
      setSelectedStockSeuil(null);
      setNouveauSeuil(5000);
    } catch (err: any) {
      showMessage(err.message || "Erreur lors de la mise à jour", true);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalBons: bonsRecus.length,
    bonsEnAttente: bonsRecus.filter(b => b.statut === "signe").length,
    bonsEnCours: bonsRecus.filter(b => b.statut === "en_cours").length,
    bonsTermines: bonsRecus.filter(b => b.statut === "termine").length,
    stockEssence: stocks.find(s => s.type_carburant === "essence")?.quantite || 0,
    stockGasoil: stocks.find(s => s.type_carburant === "gasoil")?.quantite || 0,
    alertesCount: stocks.filter(s => s.quantite < (s.seuil_alerte || 5000)).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="bg-black/40 backdrop-blur-xl border-b border-orange-500/20 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                🏭 Dashboard Responsable de Dépôt
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {responsable?.depot?.nom || "Chargement..."} • {responsable?.depot?.localisation || ""}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="text-2xl">🔔</span>
                  {notificationsNonLues.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {notificationsNonLues.length}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-96 bg-gray-900 border border-orange-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                      <h3 className="font-semibold text-white">
                        Notifications ({notifStats.non_lues} non lues)
                      </h3>
                      {notificationsNonLues.length > 0 && (
                        <button
                          onClick={handleMarquerToutesLues}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          Tout marquer lu
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notificationsNonLues.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <span className="text-4xl">📭</span>
                          <p className="mt-2">Aucune notification</p>
                        </div>
                      ) : (
                        notificationsNonLues.map((notif) => (
                          <div
                            key={notif.id_notification}
                            className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all"
                            onClick={() => handleMarquerLue(notif.id_notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 animate-pulse"></div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-white">
                                  {notif.titre}
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(notif.date_envoi).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-white/10 bg-black/50">
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="w-full text-center text-sm text-gray-400 hover:text-white"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-400">
                    {responsable?.user?.prenom} {responsable?.user?.nom}
                  </p>
                  <p className="text-xs text-orange-400">Responsable</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center">
                  <span className="text-black font-bold">
                    {responsable?.user?.prenom?.[0]}{responsable?.user?.nom?.[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats.alertesCount > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl backdrop-blur flex items-center gap-2">
            <span>⚠️</span> Attention: {stats.alertesCount} stock(s) bas (inférieur au seuil)
          </div>
        </div>
      )}

      {(message || error) && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          {message && !error && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl backdrop-blur flex items-center gap-2">
              <span>✅</span> {message}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl flex items-center gap-2">
              <span>❌</span> {error}
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
          {[
            ["dashboard", "📊 Tableau de bord"],
            ["bons", "📋 Bons à traiter"],
            ["chargement", "🚛 Chargement en cours"],
            ["stocks", "📦 Gestion des stocks"],
            ["historique", "📜 Historique"],
            ["notifications", `🔔 Notifications ${notificationsNonLues.length > 0 ? `(${notificationsNonLues.length})` : ""}`],
            ["profil", "👤 Mon profil"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === key
                  ? "bg-gradient-to-r from-orange-500 to-green-500 text-black shadow-lg shadow-orange-500/20"
                  : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {activeTab === "dashboard" && (
          <div>
            {/* ✅ CARTE D'INFORMATION DU DÉPÔT - EN HAUT DU TABLEAU DE BORD */}
            <div className="bg-gradient-to-r from-orange-500/10 via-green-500/5 to-orange-500/10 border border-orange-500/20 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🏭</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-orange-400">
                    {responsable?.depot?.nom || "Dépôt non défini"}
                  </h2>
                  <p className="text-gray-400 flex items-center gap-2">
                    <span>📍</span> {responsable?.depot?.localisation || "Localisation non définie"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-400">Responsable: <span className="text-white font-semibold">{responsable?.user?.prenom} {responsable?.user?.nom}</span></span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                    <p className="text-xs text-gray-400">Statut</p>
                    <p className="text-sm font-semibold text-green-400">✅ Actif</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Bons à traiter", value: stats.bonsEnAttente, color: "from-yellow-500 to-orange-500", icon: "📋" },
                { title: "En chargement", value: stats.bonsEnCours, color: "from-blue-500 to-cyan-500", icon: "🚛" },
                { title: "Terminés", value: stats.bonsTermines, color: "from-green-500 to-emerald-500", icon: "✅" },
                { title: "Alertes Stock", value: stats.alertesCount, color: "from-red-500 to-pink-500", icon: "⚠️" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition-all duration-300">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ✅ Carte Stock Essence avec nom du dépôt */}
              <div className="bg-gradient-to-br from-orange-500/10 to-green-500/10 border border-orange-500/20 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">⛽ Stock Essence</h3>
                  {stats.stockEssence < (stocks.find(s => s.type_carburant === "essence")?.seuil_alerte || 5000) && <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-lg text-xs">⚠️ Stock bas</span>}
                </div>
                <p className="text-3xl font-bold text-orange-400">{stats.stockEssence.toLocaleString()} L</p>
                <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min((stats.stockEssence / 50000) * 100, 100)}%` }}></div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedStock({ type_carburant: "essence", quantite: stats.stockEssence } as Stock);
                    setStockOperation("add");
                    setStockQuantite(0);
                    setShowStockModal(true);
                  }}
                  className="mt-4 text-sm text-orange-400 hover:text-orange-300"
                >
                  + Gérer le stock
                </button>
              </div>

              {/* ✅ Carte Stock Gasoil avec nom du dépôt */}
              <div className="bg-gradient-to-br from-orange-500/10 to-green-500/10 border border-green-500/20 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">🛢️ Stock Gasoil</h3>
                  {stats.stockGasoil < (stocks.find(s => s.type_carburant === "gasoil")?.seuil_alerte || 5000) && <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-lg text-xs">⚠️ Stock bas</span>}
                </div>
                <p className="text-3xl font-bold text-green-400">{stats.stockGasoil.toLocaleString()} L</p>
                <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((stats.stockGasoil / 50000) * 100, 100)}%` }}></div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedStock({ type_carburant: "gasoil", quantite: stats.stockGasoil } as Stock);
                    setStockOperation("add");
                    setStockQuantite(0);
                    setShowStockModal(true);
                  }}
                  className="mt-4 text-sm text-green-400 hover:text-green-300"
                >
                  + Gérer le stock
                </button>
              </div>
            </div>

            <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">📋 Derniers bons reçus</h3>
              <div className="space-y-2">
                {bonsRecus.slice(0, 5).map((bon) => (
                  <div key={bon.id_bon} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-mono text-sm">Bon #{bon.id_bon}</p>
                      <p className="text-xs text-gray-400">{bon.type_carburant} • {bon.quantite_commandee} L</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      bon.statut === "signe" ? "bg-yellow-500/20 text-yellow-300" :
                      bon.statut === "en_cours" ? "bg-blue-500/20 text-blue-300" :
                      "bg-green-500/20 text-green-300"
                    }`}>
                      {bon.statut === "signe" ? "En attente" : bon.statut === "en_cours" ? "En cours" : "Terminé"}
                    </span>
                  </div>
                ))}
                {bonsRecus.length === 0 && (
                  <p className="text-center text-gray-400 py-4">Aucun bon reçu</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "bons" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📋 Bons en attente de chargement</h2>
            {bonsRecus.filter(b => b.statut === "signe").length === 0 && (
              <div className="bg-white/5 rounded-2xl p-12 text-center text-gray-400">
                <div className="text-6xl mb-4">📭</div>
                <p>Aucun bon en attente de traitement</p>
              </div>
            )}
            {bonsRecus.filter(b => b.statut === "signe").map((bon) => (
              <div key={bon.id_bon} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm">En attente</span>
                    </div>
                    <h3 className="font-bold text-lg">{bon.fournisseur?.nom_societe}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div><p className="text-gray-400">Carburant</p><p className="font-semibold">{bon.type_carburant === "essence" ? "⛽ Essence" : "🛢️ Gasoil"}</p></div>
                      <div><p className="text-gray-400">Quantité</p><p className="font-semibold">{bon.quantite_commandee.toLocaleString()} L</p></div>
                      <div><p className="text-gray-400">Date disponibilité</p><p className="text-sm">{new Date(bon.date_disponibilite).toLocaleDateString()}</p></div>
                      <div><p className="text-gray-400">Code vérif.</p><p className="font-mono font-bold text-orange-400">{bon.code_verification}</p></div>
                    </div>
                  </div>
                  <button onClick={() => handleVoirDetail(bon)} className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition">Traiter</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "chargement" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 mb-4">🚛 Chargements en cours</h2>
            {bonsRecus.filter(b => b.statut === "en_cours").length === 0 && (
              <div className="bg-white/5 rounded-2xl p-12 text-center text-gray-400">
                <div className="text-6xl mb-4">🔄</div>
                <p>Aucun chargement en cours</p>
              </div>
            )}
            {bonsRecus.filter(b => b.statut === "en_cours").map((bon) => (
              <div key={bon.id_bon} className="bg-white/5 border border-blue-500/30 rounded-2xl p-5">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm animate-pulse">Chargement en cours</span>
                    </div>
                    <h3 className="font-bold text-lg">{bon.fournisseur?.nom_societe}</h3>
                    <p className="text-sm text-gray-400 mt-1">{bon.type_carburant} • {bon.quantite_commandee} L</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Code ICR</p>
                    <p className="font-mono font-bold text-lg text-orange-400">{bon.code_verification}</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4 mt-2">
                  <label className="block text-sm text-gray-400 mb-2">Quantité chargée (L)</label>
                  <div className="flex gap-3">
                    <input type="number" className="flex-1 p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none" placeholder="Entrez la quantité chargée" value={quantiteChargee} onChange={(e) => setQuantiteChargee(parseFloat(e.target.value))} />
                    <button onClick={() => handleTerminerChargement(bon)} disabled={loading} className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-black font-semibold hover:shadow-lg transition">{loading ? "..." : "Terminer"}</button>
                  </div>
                  {quantiteChargee > bon.quantite_commandee && <p className="text-red-400 text-xs mt-2">⚠️ Quantité supérieure à la commande</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "stocks" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-orange-400">📦 Niveaux des stocks</h2>
                <button 
                  onClick={() => {
                    setSelectedStock({ type_carburant: "essence", quantite: 0, id_stock: 0, date_mise_a_jour: "" } as Stock);
                    setStockOperation("add");
                    setStockQuantite(0);
                    setShowStockModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 text-sm hover:bg-orange-500/30 transition"
                >
                  + Ajouter du stock
                </button>
              </div>
              {stocks.length === 0 && <div className="text-center text-gray-400 py-8">Aucun stock enregistré</div>}
              {stocks.map((stock) => (
                <div key={stock.id_stock} className="mb-6 p-4 bg-white/5 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">
                      {stock.type_carburant === "essence" ? "⛽ Essence" : "🛢️ Gasoil"}
                    </span>
                    <span className={`font-bold ${stock.quantite < (stock.seuil_alerte || 5000) ? "text-red-400" : "text-orange-400"}`}>
                      {stock.quantite.toLocaleString()} L
                    </span>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        stock.type_carburant === "essence" ? "bg-orange-500" : "bg-green-500"
                      } ${stock.quantite < (stock.seuil_alerte || 5000) ? "opacity-50" : ""}`}
                      style={{ width: `${Math.min((stock.quantite / 50000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  
                  {/* Indicateur du seuil */}
                  <div className="relative w-full h-1 bg-gray-600 rounded-full mt-1">
                    <div 
                      className="absolute h-1 w-0.5 bg-yellow-400 rounded-full"
                      style={{ left: `${Math.min(((stock.seuil_alerte || 5000) / 50000) * 100, 100)}%` }}
                      title={`Seuil: ${(stock.seuil_alerte || 5000).toLocaleString()} L`}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0 L</span>
                    <span className="text-yellow-400">Seuil: {(stock.seuil_alerte || 5000).toLocaleString()} L</span>
                    <span>50 000 L</span>
                  </div>
                  
                  {stock.quantite < (stock.seuil_alerte || 5000) && (
                    <p className="text-red-400 text-xs mt-2">⚠️ Stock bas (inférieur au seuil d'alerte)</p>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Dernière mise à jour: {new Date(stock.date_mise_a_jour).toLocaleString()}
                  </p>
                  
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => {
                        setSelectedStock(stock);
                        setStockOperation("add");
                        setStockQuantite(0);
                        setShowStockModal(true);
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
                    >
                      + Ajouter
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedStock(stock);
                        setStockOperation("remove");
                        setStockQuantite(0);
                        setShowStockModal(true);
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                    >
                      - Retirer
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedStock(stock);
                        setStockOperation("set");
                        setStockQuantite(stock.quantite);
                        setShowStockModal(true);
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition"
                    >
                      = Définir
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedStockSeuil(stock);
                        setNouveauSeuil(stock.seuil_alerte || 5000);
                        setShowSeuilModal(true);
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition"
                    >
                      ⚙️ Seuil
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* ✅ CARTE DES INFORMATIONS DU DÉPÔT - AMÉLIORÉE */}
            <div className="bg-gradient-to-br from-orange-500/10 to-green-500/10 border border-orange-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-orange-400 mb-4">🏭 Informations du dépôt</h2>
              
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🏛️</span>
                  <div>
                    <p className="text-xs text-gray-400">Nom du dépôt</p>
                    <p className="text-xl font-bold text-white">{responsable?.depot?.nom || "Non défini"}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="text-xs text-gray-400">Localisation</p>
                    <p className="text-lg font-semibold text-orange-400">{responsable?.depot?.localisation || "Non définie"}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Responsable</p>
                  <p className="text-sm font-semibold text-white">{responsable?.user?.prenom} {responsable?.user?.nom}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Statut</p>
                  <p className="text-sm font-semibold text-green-400">✅ Actif</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="text-gray-400">Dernière mise à jour:</span>
                  <span className="text-gray-300">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "historique" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📜 Historique des opérations</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {historique.length === 0 && <div className="text-center text-gray-400 py-8">Aucune opération enregistrée</div>}
              {historique.map((bon) => (
                <div key={bon.id_bon} className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">Bon #{bon.id_bon}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${bon.statut === "termine" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>{bon.statut === "termine" ? "Terminé" : "Annulé"}</span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">{bon.type_carburant} • {bon.quantite_chargee || bon.quantite_commandee} L</div>
                      <div className="text-xs text-gray-500 mt-1">Fournisseur: {bon.fournisseur?.nom_societe}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{new Date(bon.fin_chargement || bon.date_creation).toLocaleString()}</div>
                      {bon.quantite_chargee && <div className="text-sm text-orange-400 mt-1">Chargé: {bon.quantite_chargee} L</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">🔔 Centre de notifications</h2>
              {notificationsNonLues.length > 0 && (
                <button onClick={handleMarquerToutesLues} className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition text-sm">Tout marquer comme lu</button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-orange-400">{notifStats.total}</p><p className="text-xs text-gray-400">Total</p></div>
              <div className="bg-white/5 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-yellow-400">{notifStats.non_lues}</p><p className="text-xs text-gray-400">Non lues</p></div>
              <div className="bg-white/5 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-400">{notifStats.lues}</p><p className="text-xs text-gray-400">Lues</p></div>
            </div>
            {notificationsNonLues.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-12 text-center text-gray-400"><div className="text-6xl mb-4">📭</div><p>Aucune notification non lue</p></div>
            ) : (
              <div className="space-y-3">
                {notificationsNonLues.map((notif) => (
                  <div key={notif.id_notification} className="bg-gradient-to-r from-orange-500/5 to-green-500/5 border border-orange-500/20 rounded-2xl p-5 hover:bg-white/5 transition-all cursor-pointer" onClick={() => handleMarquerLue(notif.id_notification)}>
                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 mt-1 rounded-full bg-orange-500 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg">{notif.titre}</h3><span className="text-xs text-gray-500">{new Date(notif.date_envoi).toLocaleString()}</span></div>
                        <p className="text-gray-300">{notif.message}</p>
                        <div className="mt-3 flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleMarquerLue(notif.id_notification); }} className="text-xs px-3 py-1 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition">Marquer comme lu</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profil" && (
          <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center text-2xl font-bold text-black">
                {responsable?.user?.prenom?.[0]}{responsable?.user?.nom?.[0]}
              </div>
              <div><h2 className="text-2xl font-bold">{responsable?.user?.prenom} {responsable?.user?.nom}</h2><p className="text-orange-400">Responsable de dépôt</p></div>
            </div>
            <form onSubmit={handleUpdateProfil} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Nom</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none" value={profilForm.nom} onChange={(e) => setProfilForm({...profilForm, nom: e.target.value})} /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Prénom</label><input type="text" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none" value={profilForm.prenom} onChange={(e) => setProfilForm({...profilForm, prenom: e.target.value})} /></div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Email</label><input type="email" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-gray-400 cursor-not-allowed" value={responsable?.user?.email || ""} disabled /><p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p></div>
              <div><label className="block text-sm text-gray-400 mb-1">Téléphone</label><input type="tel" className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none" value={profilForm.telephone} onChange={(e) => setProfilForm({...profilForm, telephone: e.target.value})} /></div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50">{loading ? "Mise à jour..." : "Mettre à jour mon profil"}</button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL GESTION STOCK */}
      {showStockModal && selectedStock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">
                {stockOperation === "add" ? "➕ Ajouter du stock" : 
                 stockOperation === "remove" ? "➖ Retirer du stock" : 
                 "📊 Définir le stock"}
              </h2>
              <button onClick={() => { setShowStockModal(false); setSelectedStock(null); }} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Carburant</p>
                <p className="font-bold text-lg">{selectedStock.type_carburant === "essence" ? "⛽ Essence" : "🛢️ Gasoil"}</p>
              </div>
              
              {stockOperation !== "set" && (
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Stock actuel</p>
                  <p className="font-bold text-2xl text-orange-400">{selectedStock.quantite.toLocaleString()} L</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {stockOperation === "add" ? "Quantité à ajouter (L)" :
                   stockOperation === "remove" ? "Quantité à retirer (L)" :
                   "Nouvelle quantité (L)"}
                </label>
                <input
                  type="number"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none"
                  value={stockQuantite}
                  onChange={(e) => setStockQuantite(parseFloat(e.target.value))}
                  autoFocus
                />
              </div>
              
              {stockOperation === "remove" && stockQuantite > selectedStock.quantite && (
                <p className="text-red-400 text-xs">⚠️ La quantité à retirer ne peut pas dépasser le stock actuel</p>
              )}
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleUpdateStock}
                  disabled={loading || (stockOperation === "remove" && stockQuantite > selectedStock.quantite)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "Traitement..." : "Confirmer"}
                </button>
                <button
                  onClick={() => { setShowStockModal(false); setSelectedStock(null); }}
                  className="flex-1 bg-white/10 py-3 rounded-lg hover:bg-white/20 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SEUIL D'ALERTE */}
      {showSeuilModal && selectedStockSeuil && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">⚙️ Seuil d'alerte</h2>
              <button onClick={() => { setShowSeuilModal(false); setSelectedStockSeuil(null); setNouveauSeuil(5000); }} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Carburant</p>
                <p className="font-bold text-lg">{selectedStockSeuil.type_carburant === "essence" ? "⛽ Essence" : "🛢️ Gasoil"}</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Stock actuel</p>
                <p className="font-bold text-2xl text-orange-400">{selectedStockSeuil.quantite.toLocaleString()} L</p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Seuil d'alerte (L)
                </label>
                <input
                  type="number"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none"
                  value={nouveauSeuil}
                  onChange={(e) => setNouveauSeuil(parseFloat(e.target.value) || 5000)}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Une alerte sera déclenchée quand le stock sera inférieur à ce seuil
                </p>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleUpdateSeuilAlerte}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "Traitement..." : "Enregistrer"}
                </button>
                <button
                  onClick={() => { setShowSeuilModal(false); setSelectedStockSeuil(null); setNouveauSeuil(5000); }}
                  className="flex-1 bg-white/10 py-3 rounded-lg hover:bg-white/20 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">📄 Détail du Bon</h2>
              <button onClick={() => { setSelectedBon(null); setCodeVerification(""); }} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center"><span className="text-gray-400">N° Bon</span><span className="font-mono font-bold">#{selectedBon.id_bon}</span></div>
                <div className="flex justify-between items-center mt-2"><span className="text-gray-400">Code vérification</span><span className="font-mono font-bold text-orange-400 text-xl tracking-wider">{selectedBon.code_verification}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Carburant</p><p className="font-semibold">{selectedBon.type_carburant === "essence" ? "⛽ Essence" : "🛢️ Gasoil"}</p></div>
                <div className="bg-white/5 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Quantité commandée</p><p className="font-semibold">{selectedBon.quantite_commandee.toLocaleString()} L</p></div>
                <div className="bg-white/5 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Fournisseur</p><p className="font-semibold text-sm">{selectedBon.fournisseur?.nom_societe}</p></div>
                <div className="bg-white/5 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Date disponibilité</p><p className="text-sm">{new Date(selectedBon.date_disponibilite).toLocaleString()}</p></div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Statut</p>
                <span className={`px-3 py-1 rounded-full text-sm inline-block ${selectedBon.statut === "signe" ? "bg-yellow-500/20 text-yellow-300" : selectedBon.statut === "en_cours" ? "bg-blue-500/20 text-blue-300" : selectedBon.statut === "termine" ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-300"}`}>
                  {selectedBon.statut === "signe" ? "En attente de chargement" : selectedBon.statut === "en_cours" ? "Chargement en cours" : selectedBon.statut === "termine" ? "Terminé" : selectedBon.statut}
                </span>
              </div>
            </div>
            {selectedBon.statut === "signe" && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <label className="block text-sm text-gray-400 mb-2">🔐 Code de vérification ICR</label>
                <input type="text" maxLength={4} className="w-full p-4 rounded-lg bg-black/50 border border-white/10 text-white text-center text-3xl font-mono tracking-[0.5em] focus:border-orange-500 focus:outline-none" placeholder="0000" value={codeVerification} onChange={(e) => setCodeVerification(e.target.value.toUpperCase())} autoFocus />
                <button onClick={() => handleVerifierEtAutoriser(selectedBon)} disabled={loading} className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50">{loading ? "Vérification..." : "✅ Vérifier et autoriser le chargement"}</button>
              </div>
            )}
            <button onClick={() => { setSelectedBon(null); setCodeVerification(""); }} className="mt-4 w-full bg-white/10 py-3 rounded-lg hover:bg-white/20 transition">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}