"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getPompisteProfil,
  getPompisteStocks,
  getPompisteVentes,
  getPompisteReservations,
  getPompisteClotureCaisse,
  enregistrerVente,
  marquerReservationServie,
  synchroniserVentesHorsLigne,
  getPrixActuels,
} from "../../lib/api";

// ================= TYPES =================

type User = {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
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
};

type Vente = {
  id_vente: number;
  type_carburant: string;
  quantite: number;
  montant: number;
  montant_total: number;
  mode_paiement: string;
  date_vente: string;
  prix_unitaire?: number;
};

type Reservation = {
  id_reservation: number;
  type_carburant: string;
  quantite: number;
  statut: string;
  date_reservation: string;
  montant_total?: number;
  code_reservation?: string;
  consommateur?: {
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
  };
  nom_client?: string;
  prenom_client?: string;
  telephone_client?: string;
  email_client?: string;
};

type PompisteProfil = {
  id_pompiste: number;
  user: User;
  station: Station;
};

type ClotureCaisse = {
  date: string;
  nombre_ventes: number;
  total_ventes: number;
  detail_par_mode: {
    especes: number;
    orange_money: number;
    mobicash: number;
    wave: number;
  };
};

type Prix = {
  essence: number;
  gasoil: number;
  derniere_mise_a_jour?: string;
};

// Helper : comparer si deux dates sont le même jour
const estMemeJour = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
};

// Fonction pour obtenir les infos client quel que soit le format
const getClientInfo = (res: Reservation) => {
  if (res.consommateur) {
    return {
      prenom: res.consommateur.prenom,
      nom: res.consommateur.nom,
      telephone: res.consommateur.telephone
    };
  }
  const anyRes = res as any;
  if (anyRes.prenom_client || anyRes.nom_client) {
    return {
      prenom: anyRes.prenom_client,
      nom: anyRes.nom_client,
      telephone: anyRes.telephone_client
    };
  }
  return null;
};

export default function DashboardPompiste() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [modeHorsLigne, setModeHorsLigne] = useState(false);
  
  const [profil, setProfil] = useState<PompisteProfil | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cloture, setCloture] = useState<ClotureCaisse | null>(null);
  const [prix, setPrix] = useState<Prix>({ essence: 750, gasoil: 700 });
  
  // État pour gérer la session de la journée
  const [journeeActive, setJourneeActive] = useState(false);
  const [debutJournee, setDebutJournee] = useState<string | null>(null);
  
  // Calcul des ventes du jour
  const ventesDuJour = useMemo(() => {
    const aujourdHui = new Date();
    return ventes.filter(v => {
      const dateVente = new Date(v.date_vente);
      return estMemeJour(dateVente, aujourdHui);
    });
  }, [ventes]);
  
  const nombreVentesJour = ventesDuJour.length;
  
  const totalVentesJour = useMemo(() => {
    if (ventesDuJour.length === 0) return 0;
    const total = ventesDuJour.reduce((sum, v) => {
      const montant = v.montant_total || v.montant || 0;
      const montantNombre = typeof montant === 'number' ? montant : parseFloat(String(montant)) || 0;
      return sum + montantNombre;
    }, 0);
    return total;
  }, [ventesDuJour]);
  
  // Calcul des statistiques par mode de paiement
  const statsPaiement = useMemo(() => {
    const stats = {
      especes: 0,
      orange_money: 0,
      mobicash: 0,
      wave: 0
    };
    
    ventesDuJour.forEach(v => {
      const mode = v.mode_paiement?.toLowerCase() || '';
      if (mode.includes('espece') || mode === 'especes') {
        stats.especes += v.montant_total || v.montant || 0;
      } else if (mode.includes('orange')) {
        stats.orange_money += v.montant_total || v.montant || 0;
      } else if (mode.includes('mobicash')) {
        stats.mobicash += v.montant_total || v.montant || 0;
      } else if (mode.includes('wave')) {
        stats.wave += v.montant_total || v.montant || 0;
      }
    });
    
    return stats;
  }, [ventesDuJour]);
  
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
    fetchAllData();
    checkModeHorsLigne();
    fetchPrix();
    
    // Vérifier si une journée est déjà active (depuis localStorage)
    const journee = localStorage.getItem("journee_active");
    if (journee === "true") {
      setJourneeActive(true);
      const debut = localStorage.getItem("debut_journee");
      if (debut) setDebutJournee(debut);
    }
  }, []);
  
  const checkModeHorsLigne = () => {
    if (!navigator.onLine) {
      setModeHorsLigne(true);
      showMessage("📡 Mode hors-ligne actif. Les ventes seront synchronisées automatiquement.");
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  };
  
  const handleOnline = async () => {
    const ventesHL = localStorage.getItem("ventes_hors_ligne");
    if (ventesHL) {
      const ventes = JSON.parse(ventesHL);
      if (ventes.length > 0) {
        setLoading(true);
        try {
          await synchroniserVentesHorsLigne(ventes);
          localStorage.removeItem("ventes_hors_ligne");
          showMessage("✅ Ventes synchronisées avec succès");
          await fetchAllData();
          await fetchPrix();
        } catch (err) {
          console.error("Erreur synchronisation", err);
        } finally {
          setLoading(false);
        }
      }
    }
    setModeHorsLigne(false);
  };
  
  const fetchPrix = async () => {
    try {
      const res = await getPrixActuels();
      setPrix({
        essence: res.essence || 750,
        gasoil: res.gasoil || 700,
        derniere_mise_a_jour: res.derniere_mise_a_jour
      });
    } catch (err) {
      console.error("Erreur chargement prix", err);
    }
  };
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfil(),
        fetchStocks(),
        fetchVentes(),
        fetchReservations(),
      ]);
    } catch (err) {
      showMessage("Erreur de chargement des données", true);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProfil = async () => {
    try {
      const res = await getPompisteProfil();
      setProfil(res.pompiste);
    } catch (err) {
      console.error("Erreur chargement profil", err);
    }
  };
  
  const fetchStocks = async () => {
    try {
      const res = await getPompisteStocks();
      setStocks(res.stocks || []);
    } catch (err) {
      console.error("Erreur chargement stocks", err);
    }
  };
  
  const fetchVentes = async () => {
    try {
      const res = await getPompisteVentes();
      const ventesFormatees = (res.ventes || []).map((vente: any) => ({
        ...vente,
        montant: toNumber(vente.montant),
        montant_total: toNumber(vente.montant_total || vente.montant),
        prix_unitaire: vente.prix_unitaire || (vente.montant_total / vente.quantite)
      }));
      setVentes(ventesFormatees);
      console.log("Ventes chargées:", ventesFormatees);
    } catch (err) {
      console.error("Erreur chargement ventes", err);
      setVentes([]);
    }
  };
  
  const fetchReservations = async () => {
    try {
      const res = await getPompisteReservations();
      setReservations(res.reservations || []);
    } catch (err) {
      console.error("Erreur chargement réservations", err);
      setReservations([]);
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
  
  // ========== GESTION DE LA JOURNÉE ==========
  
  const handleCommencerJournee = () => {
    const maintenant = new Date();
    setJourneeActive(true);
    setDebutJournee(maintenant.toLocaleString());
    localStorage.setItem("journee_active", "true");
    localStorage.setItem("debut_journee", maintenant.toLocaleString());
    showMessage(`✅ Journée commencée à ${maintenant.toLocaleString()}`);
  };
  
  const handleTerminerJournee = async () => {
    setLoading(true);
    try {
      const res = await getPompisteClotureCaisse();
      setCloture(res);
      setJourneeActive(false);
      localStorage.removeItem("journee_active");
      localStorage.removeItem("debut_journee");
      showMessage(`✅ Journée terminée. Total encaissé: ${res.total_ventes.toLocaleString()} FCFA`);
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };
  
  // ========== SIMULER POMPE (Redirection vers Django) ==========
  
  const handleSimulerPompe = () => {
    if (!profil) {
      showMessage("Profil non chargé", true);
      return;
    }
    
    const token = localStorage.getItem("token");
    
    const simulationUrl = `http://127.0.0.1:8001/?pompiste_id=${profil.id_pompiste}&nom=${encodeURIComponent(profil.user?.prenom + ' ' + profil.user?.nom)}&station=${encodeURIComponent(profil.station?.nom)}&station_id=${profil.station?.id_station}&token=${token}`;
    
    window.open(simulationUrl, '_blank');
  };
  
  // ========== FIN DE JOURNÉE ==========
  const handleClotureCaisse = async () => {
    setLoading(true);
    try {
      const res = await getPompisteClotureCaisse();
      setCloture(res);
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };
  
  // ========== RÉSERVATIONS ==========
  const handleServirReservation = async (id_reservation: number) => {
    setLoading(true);
    try {
      await marquerReservationServie(id_reservation);
      showMessage("✅ Réservation marquée comme servie");
      await fetchReservations();
      await fetchStocks();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };
  
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
                ⛽ Dashboard Pompiste - {profil.station?.nom}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {profil.user?.prenom} {profil.user?.nom}
              </p>
              {journeeActive && debutJournee && (
                <p className="text-xs text-green-400 mt-1">
                  ✅ Journée commencée à {debutJournee}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm hidden md:block">
                <p className="text-gray-400">Prix en vigueur</p>
                <p className="text-orange-400">⛽ {prix.essence} FCFA/L | 🛢️ {prix.gasoil} FCFA/L</p>
              </div>
              {modeHorsLigne && (
                <div className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 text-sm">
                  📡 Mode hors-ligne
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center">
                <span className="text-black font-bold text-lg">{profil.user?.prenom?.[0]}{profil.user?.nom?.[0]}</span>
              </div>
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
        <div className="flex gap-3 flex-wrap">
          {[
            ["dashboard", "🏠 Tableau de bord"],
            ["reservations", "📅 Réservations"],
            ["historique", "📜 Historique"],
            ["cloture", "📊 Détails des ventes de la journeé"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300 ${
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
            <div className="bg-orange-500/10 rounded-2xl p-4 mb-6 text-center md:hidden">
              <p className="text-gray-400 text-sm">Prix en vigueur</p>
              <p className="text-orange-400 font-bold">⛽ {prix.essence} FCFA/L | 🛢️ {prix.gasoil} FCFA/L</p>
            </div>
            
            {/* Gestion de la journée */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/30 mb-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">📋 Gestion de la journée</h3>
              <div className="flex flex-wrap gap-3">
                {!journeeActive ? (
                  <button
                    onClick={handleCommencerJournee}
                    className="px-6 py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-600 transition"
                  >
                    🚀 COMMENCER LA JOURNÉE
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSimulerPompe}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold hover:shadow-lg transition"
                    >
                      🛢️ SIMULER POMPE
                    </button>
                    <button
                      onClick={handleTerminerJournee}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-50"
                    >
                      ⏹️ TERMINER LA JOURNÉE
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Stocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {stocks.map((stock) => {
                const capaciteMax = 50000;
                const pourcentage = (stock.quantite / capaciteMax) * 100;
                const estFaible = stock.quantite < (stock.seuil_alerte || 5000);
                return (
                  <div key={stock.id_stock} className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                    <div className="text-5xl mb-4">{stock.type_carburant === 'essence' ? '⛽' : '🛢️'}</div>
                    <h3 className="text-2xl font-bold text-white">{stock.type_carburant.toUpperCase()}</h3>
                    <p className={`text-4xl font-bold mt-2 ${estFaible ? 'text-red-400' : 'text-green-400'}`}>
                      {Math.floor(stock.quantite).toLocaleString()} L
                    </p>
                    <div className="w-full bg-white/10 rounded-full h-3 mt-4">
                      <div 
                        className={`h-3 rounded-full ${estFaible ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(pourcentage, 100)}%` }}
                      />
                    </div>
                    {estFaible && (
                      <p className="text-yellow-400 text-sm mt-2">⚠️ Stock faible</p>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Ventes du jour avec détails */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-orange-400 mb-4">
                💰 Ventes du {new Date().toLocaleDateString('fr-FR')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400">Nombre de ventes</p>
                  <p className="text-3xl font-bold text-white">{nombreVentesJour}</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400">Total encaissé</p>
                  <p className="text-3xl font-bold text-green-400">
                    {totalVentesJour.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
              
              {/* Détail par mode de paiement */}
              {ventesDuJour.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm mb-2">Détail par mode de paiement :</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                      <span>💵 Espèces</span>
                      <span className="text-green-400">{statsPaiement.especes.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                      <span>📱 Orange Money</span>
                      <span className="text-green-400">{statsPaiement.orange_money.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                      <span>📱 Mobicash</span>
                      <span className="text-green-400">{statsPaiement.mobicash.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                      <span>🌊 Wave</span>
                      <span className="text-green-400">{statsPaiement.wave.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* RÉSERVATIONS */}
        {activeTab === "reservations" && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📅 Réservations en attente</h2>
            {reservations.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Aucune réservation en attente</div>
            ) : (
              <div className="space-y-3">
                {reservations.map((res) => {
                  const client = getClientInfo(res);
                  return (
                    <div key={res.id_reservation} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                          {client && (client.prenom || client.nom) && (
                            <div className="mb-2 pb-2 border-b border-white/10">
                              <p className="text-sm text-blue-400">
                                👤 {client.prenom} {client.nom}
                              </p>
                              <p className="text-sm text-gray-400">
                                📞 {client.telephone}
                              </p>
                            </div>
                          )}
                          <p className="font-semibold text-lg">
                            {res.type_carburant === 'essence' ? '⛽ Essence' : '🛢️ Gasoil'}
                          </p>
                          <p className="text-2xl font-bold text-orange-400">{res.quantite} L</p>
                          <p className="text-xs text-gray-500">
                            Réservé le {new Date(res.date_reservation).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleServirReservation(res.id_reservation)}
                          className="px-6 py-3 rounded-lg bg-green-500 text-white font-semibold"
                        >
                          Servir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* HISTORIQUE AVEC DÉTAILS */}
        {activeTab === "historique" && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📜 Historique des ventes</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {ventes.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Aucune vente</div>
              ) : (
                ventes.map((vente) => {
                  const montant = vente.montant_total || vente.montant || 0;
                  const prixUnitaire = vente.prix_unitaire || (montant / vente.quantite);
                  const date = new Date(vente.date_vente);
                  const dateStr = date.toLocaleDateString('fr-FR');
                  const heureStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  
                  // Icône pour le mode de paiement
                  const getPaiementIcon = (mode: string) => {
                    const m = mode?.toLowerCase() || '';
                    if (m.includes('espece')) return '💵';
                    if (m.includes('orange')) return '📱';
                    if (m.includes('mobicash')) return '📱';
                    if (m.includes('wave')) return '🌊';
                    return '💳';
                  };
                  
                  return (
                    <div key={vente.id_vente} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-orange-500/30 transition">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">
                              {vente.type_carburant === 'essence' ? '⛽ Essence' : '🛢️ Gasoil'}
                            </span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-400">{vente.quantite} L</span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-400">{prixUnitaire.toFixed(0)} FCFA/L</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <span>{getPaiementIcon(vente.mode_paiement)} {vente.mode_paiement}</span>
                            <span>•</span>
                            <span>📅 {dateStr}</span>
                            <span>•</span>
                            <span>🕐 {heureStr}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">
                            {typeof montant === 'number' ? montant.toLocaleString() : parseFloat(montant).toLocaleString()} FCFA
                          </p>
                          <p className="text-xs text-gray-500">#{vente.id_vente}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        
        {/* FIN DE JOURNÉE */}
        {activeTab === "cloture" && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📊 Fin de journée</h2>
            
            <button
              onClick={handleClotureCaisse}
              className="w-full py-3 rounded-lg bg-orange-500 text-black font-semibold mb-6"
            >
              Calculer le total du jour
            </button>
            
            {cloture && (
              <div className="space-y-4">
                <div className="bg-green-500/20 rounded-xl p-4 text-center">
                  <p className="text-gray-400">Total encaissé le {new Date(cloture.date).toLocaleDateString()}</p>
                  <p className="text-4xl font-bold text-green-400">{cloture.total_ventes.toLocaleString()} FCFA</p>
                  <p className="text-sm text-gray-400">{cloture.nombre_ventes} ventes</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Espèces</p>
                    <p className="text-lg font-bold text-white">{cloture.detail_par_mode.especes.toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Orange Money</p>
                    <p className="text-lg font-bold text-white">{cloture.detail_par_mode.orange_money.toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Mobicash</p>
                    <p className="text-lg font-bold text-white">{cloture.detail_par_mode.mobicash.toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Wave</p>
                    <p className="text-lg font-bold text-white">{cloture.detail_par_mode.wave.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}