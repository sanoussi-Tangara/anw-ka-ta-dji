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
  nom_depot: string;
  adresse: string;
  ville: string;
  latitude?: number;
  longitude?: number;
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
};

type Responsable = {
  id_responsable: number;
  user?: User;
  depot?: Depot;
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
  
  // Formulaires
  const [codeVerification, setCodeVerification] = useState("");
  const [quantiteChargee, setQuantiteChargee] = useState<number>(0);
  const [profilForm, setProfilForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
  });

  // ID du responsable (à récupérer depuis le localStorage/ contexte d'auth)
  // À modifier selon votre système d'authentification
  const responsableId = 1; // TODO: Remplacer par l'ID réel du responsable connecté

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfil(),
        fetchBonsRecus(),
        fetchStocks(),
        fetchHistorique(),
      ]);
    } catch (err) {
      showMessage("Erreur de chargement des données", true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfil = async () => {
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
    try {
      const res = await getBonsRecus(responsableId);
      setBonsRecus(res.bons || []);
    } catch (err) {
      console.error("Erreur chargement bons", err);
    }
  };

  const fetchStocks = async () => {
    try {
      const res = await getStockDepot(responsableId);
      setStocks(res.stocks || []);
    } catch (err) {
      console.error("Erreur chargement stocks", err);
    }
  };

  const fetchHistorique = async () => {
    try {
      const res = await getHistoriqueSorties(responsableId);
      setHistorique(res.historique || []);
    } catch (err) {
      console.error("Erreur chargement historique", err);
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

  // Vérifier le code et autoriser le chargement
  const handleVerifierEtAutoriser = async (bon: Bon) => {
    if (!codeVerification) {
      showMessage("Veuillez entrer le code de vérification", true);
      return;
    }

    setLoading(true);
    try {
      // Vérifier le code
      const verification = await verifierCodeChargement(bon.id_bon, codeVerification);
      
      if (verification.valide) {
        // Autoriser le chargement
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

  // Terminer le chargement
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

  // Voir détail du bon
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

  // Mettre à jour le profil
  const handleUpdateProfil = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // Statistiques
  const stats = {
    totalBons: bonsRecus.length,
    bonsEnAttente: bonsRecus.filter(b => b.statut === "signe").length,
    bonsEnCours: bonsRecus.filter(b => b.statut === "en_cours").length,
    bonsTermines: bonsRecus.filter(b => b.statut === "termine").length,
    stockEssence: stocks.find(s => s.type_carburant === "essence")?.quantite || 0,
    stockGasoil: stocks.find(s => s.type_carburant === "gasoil")?.quantite || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* HEADER PREMIUM */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-orange-500/20 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                🏭 Dashboard Responsable de Dépôt
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {responsable?.depot?.nom_depot || "Chargement..."} • Gestion des chargements
              </p>
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

      {/* ALERTES */}
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

      {/* NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
          {[
            ["dashboard", "📊 Tableau de bord"],
            ["bons", "📋 Bons à traiter"],
            ["chargement", "🚛 Chargement en cours"],
            ["stocks", "📦 Gestion des stocks"],
            ["historique", "📜 Historique"],
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

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* ==================== DASHBOARD ==================== */}
        {activeTab === "dashboard" && (
          <div>
            {/* Cartes statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Bons à traiter", value: stats.bonsEnAttente, color: "from-yellow-500 to-orange-500", icon: "📋" },
                { title: "En chargement", value: stats.bonsEnCours, color: "from-blue-500 to-cyan-500", icon: "🚛" },
                { title: "Terminés", value: stats.bonsTermines, color: "from-green-500 to-emerald-500", icon: "✅" },
                { title: "Total reçus", value: stats.totalBons, color: "from-purple-500 to-pink-500", icon: "📊" },
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

            {/* Stocks rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-orange-500/10 to-green-500/10 border border-orange-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">⛽ Stock Essence</h3>
                <p className="text-3xl font-bold text-orange-400">{stats.stockEssence.toLocaleString()} L</p>
                <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min((stats.stockEssence / 50000) * 100, 100)}%` }}></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/10 to-green-500/10 border border-green-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">🛢️ Stock Gasoil</h3>
                <p className="text-3xl font-bold text-green-400">{stats.stockGasoil.toLocaleString()} L</p>
                <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((stats.stockGasoil / 50000) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Derniers bons reçus */}
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

        {/* ==================== BONS À TRAITER ==================== */}
        {activeTab === "bons" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📋 Bons en attente de chargement</h2>
            {bonsRecus.filter(b => b.statut === "signe").length === 0 && (
              <div className="bg-white/5 rounded-2xl p-12 text-center text-gray-400">
                <div className="text-6xl mb-4">📭</div>
                <p>Aucun bon en attente de traitement</p>
              </div>
            )}
            {bonsRecus
              .filter(b => b.statut === "signe")
              .map((bon) => (
                <div key={bon.id_bon} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm">En attente</span>
                        <span className="text-xs text-gray-500">#{bon.id_bon}</span>
                      </div>
                      <h3 className="font-bold text-lg">{bon.fournisseur?.nom_societe}</h3>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-400">Carburant</p>
                          <p className="font-semibold">{bon.type_carburant === "essence" ? "⛽ Essence" : "🛢️ Gasoil"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Quantité</p>
                          <p className="font-semibold">{bon.quantite_commandee.toLocaleString()} L</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Date disponibilité</p>
                          <p className="text-sm">{new Date(bon.date_disponibilite).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Code vérif.</p>
                          <p className="font-mono font-bold text-orange-400">{bon.code_verification}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVoirDetail(bon)}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition"
                    >
                      Traiter
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ==================== CHARGEMENT EN COURS ==================== */}
        {activeTab === "chargement" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 mb-4">🚛 Chargements en cours</h2>
            {bonsRecus.filter(b => b.statut === "en_cours").length === 0 && (
              <div className="bg-white/5 rounded-2xl p-12 text-center text-gray-400">
                <div className="text-6xl mb-4">🔄</div>
                <p>Aucun chargement en cours</p>
              </div>
            )}
            {bonsRecus
              .filter(b => b.statut === "en_cours")
              .map((bon) => (
                <div key={bon.id_bon} className="bg-white/5 border border-blue-500/30 rounded-2xl p-5">
                  <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm animate-pulse">Chargement en cours</span>
                        <span className="text-xs text-gray-500">#{bon.id_bon}</span>
                      </div>
                      <h3 className="font-bold text-lg">{bon.fournisseur?.nom_societe}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {bon.type_carburant} • {bon.quantite_commandee} L
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Code ICR</p>
                      <p className="font-mono font-bold text-lg text-orange-400">{bon.code_verification}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-4 mt-2">
                    <label className="block text-sm text-gray-400 mb-2">
                      Quantité chargée (L)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        className="flex-1 p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none"
                        placeholder="Entrez la quantité chargée"
                        value={quantiteChargee}
                        onChange={(e) => setQuantiteChargee(parseFloat(e.target.value))}
                      />
                      <button
                        onClick={() => handleTerminerChargement(bon)}
                        disabled={loading}
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-black font-semibold hover:shadow-lg transition"
                      >
                        {loading ? "..." : "Terminer"}
                      </button>
                    </div>
                    {quantiteChargee > bon.quantite_commandee && (
                      <p className="text-red-400 text-xs mt-2">⚠️ Quantité supérieure à la commande</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ==================== STOCKS ==================== */}
        {activeTab === "stocks" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-orange-400 mb-4">📦 Niveaux des stocks</h2>
              {stocks.length === 0 && (
                <div className="text-center text-gray-400 py-8">Aucun stock enregistré</div>
              )}
              {stocks.map((stock) => (
                <div key={stock.id_stock} className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">
                      {stock.type_carburant === "essence" ? "⛽ Essence" : "🛢️ Gasoil"}
                    </span>
                    <span className="text-orange-400 font-bold">
                      {stock.quantite.toLocaleString()} L
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        stock.type_carburant === "essence" ? "bg-orange-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min((stock.quantite / 50000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière mise à jour: {new Date(stock.date_mise_a_jour).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-orange-400 mb-4">🏭 Informations du dépôt</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Nom:</span>
                  <span className="font-semibold">{responsable?.depot?.nom_depot}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Adresse:</span>
                  <span>{responsable?.depot?.adresse}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Ville:</span>
                  <span>{responsable?.depot?.ville}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Responsable:</span>
                  <span>{responsable?.user?.prenom} {responsable?.user?.nom}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== HISTORIQUE ==================== */}
        {activeTab === "historique" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📜 Historique des opérations</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {historique.length === 0 && (
                <div className="text-center text-gray-400 py-8">Aucune opération enregistrée</div>
              )}
              {historique.map((bon) => (
                <div key={bon.id_bon} className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">Bon #{bon.id_bon}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          bon.statut === "termine" 
                            ? "bg-green-500/20 text-green-300" 
                            : "bg-red-500/20 text-red-300"
                        }`}>
                          {bon.statut === "termine" ? "Terminé" : "Annulé"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {bon.type_carburant} • {bon.quantite_chargee || bon.quantite_commandee} L
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Fournisseur: {bon.fournisseur?.nom_societe}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                       {new Date(bon.fin_chargement || bon.date_creation).toLocaleString()}
                      </div>
                      {bon.quantite_chargee && (
                        <div className="text-sm text-orange-400 mt-1">
                          Chargé: {bon.quantite_chargee} L
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== PROFIL ==================== */}
        {activeTab === "profil" && (
          <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center text-2xl font-bold text-black">
                {responsable?.user?.prenom?.[0]}{responsable?.user?.nom?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{responsable?.user?.prenom} {responsable?.user?.nom}</h2>
                <p className="text-orange-400">Responsable de dépôt</p>
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfil} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nom</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none"
                    value={profilForm.nom}
                    onChange={(e) => setProfilForm({...profilForm, nom: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prénom</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none"
                    value={profilForm.prenom}
                    onChange={(e) => setProfilForm({...profilForm, prenom: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-gray-400 cursor-not-allowed"
                  value={responsable?.user?.email || ""}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Téléphone</label>
                <input
                  type="tel"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-orange-500 focus:outline-none"
                  value={profilForm.telephone}
                  onChange={(e) => setProfilForm({...profilForm, telephone: e.target.value})}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Mise à jour..." : "Mettre à jour mon profil"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ==================== MODAL DÉTAIL BON ==================== */}
      {selectedBon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">📄 Détail du Bon</h2>
              <button
                onClick={() => {
                  setSelectedBon(null);
                  setCodeVerification("");
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">N° Bon</span>
                  <span className="font-mono font-bold">#{selectedBon.id_bon}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">Code vérification</span>
                  <span className="font-mono font-bold text-orange-400 text-xl tracking-wider">{selectedBon.code_verification}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Carburant</p>
                  <p className="font-semibold">{selectedBon.type_carburant === "essence" ? "⛽ Essence" : "🛢️ Gasoil"}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Quantité commandée</p>
                  <p className="font-semibold">{selectedBon.quantite_commandee.toLocaleString()} L</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Fournisseur</p>
                  <p className="font-semibold text-sm">{selectedBon.fournisseur?.nom_societe}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Date disponibilité</p>
                  <p className="text-sm">{new Date(selectedBon.date_disponibilite).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Statut</p>
                <span className={`px-3 py-1 rounded-full text-sm inline-block ${
                  selectedBon.statut === "signe" ? "bg-yellow-500/20 text-yellow-300" :
                  selectedBon.statut === "en_cours" ? "bg-blue-500/20 text-blue-300" :
                  selectedBon.statut === "termine" ? "bg-green-500/20 text-green-300" :
                  "bg-gray-500/20 text-gray-300"
                }`}>
                  {selectedBon.statut === "signe" ? "En attente de chargement" :
                   selectedBon.statut === "en_cours" ? "Chargement en cours" :
                   selectedBon.statut === "termine" ? "Terminé" : selectedBon.statut}
                </span>
              </div>
            </div>
            
            {/* Zone de vérification si bon en attente */}
            {selectedBon.statut === "signe" && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <label className="block text-sm text-gray-400 mb-2">
                  🔐 Code de vérification ICR
                </label>
                <input
                  type="text"
                  maxLength={4}
                  className="w-full p-4 rounded-lg bg-black/50 border border-white/10 text-white text-center text-3xl font-mono tracking-[0.5em] focus:border-orange-500 focus:outline-none"
                  placeholder="0000"
                  value={codeVerification}
                  onChange={(e) => setCodeVerification(e.target.value.toUpperCase())}
                  autoFocus
                />
                <button
                  onClick={() => handleVerifierEtAutoriser(selectedBon)}
                  disabled={loading}
                  className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "Vérification..." : "✅ Vérifier et autoriser le chargement"}
                </button>
              </div>
            )}
            
            <button
              onClick={() => {
                setSelectedBon(null);
                setCodeVerification("");
              }}
              className="mt-4 w-full bg-white/10 py-3 rounded-lg hover:bg-white/20 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}