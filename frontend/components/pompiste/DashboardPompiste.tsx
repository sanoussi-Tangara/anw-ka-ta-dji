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
  
  const [venteForm, setVenteForm] = useState({
    type_carburant: "essence",
    quantite: 0,
    mode_paiement: "especes",
  });
  
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
  
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
    fetchAllData();
    checkModeHorsLigne();
    fetchPrix();
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
        montant_total: toNumber(vente.montant_total || vente.montant)
      }));
      setVentes(ventesFormatees);
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
  
  const handleSaisirVente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (venteForm.quantite <= 0) {
      showMessage("Veuillez entrer une quantité valide", true);
      return;
    }
    
    const stock = stocks.find(s => s.type_carburant === venteForm.type_carburant);
    if (!stock || stock.quantite < venteForm.quantite) {
      showMessage("Stock insuffisant", true);
      return;
    }
    
    setLoading(true);
    try {
      if (modeHorsLigne) {
        const ventesExistantes = JSON.parse(localStorage.getItem("ventes_hors_ligne") || "[]");
        ventesExistantes.push({
          type_carburant: venteForm.type_carburant,
          quantite: venteForm.quantite,
          mode_paiement: venteForm.mode_paiement,
          id_pompiste: profil?.id_pompiste,
          id_station: profil?.station?.id_station,
          date_vente: new Date().toISOString(),
        });
        localStorage.setItem("ventes_hors_ligne", JSON.stringify(ventesExistantes));
        showMessage("✅ Vente enregistrée en mode hors-ligne");
      } else {
        await enregistrerVente({
          type_carburant: venteForm.type_carburant,
          quantite: venteForm.quantite,
          mode_paiement: venteForm.mode_paiement,
        });
        showMessage("✅ Vente enregistrée avec succès");
      }
      
      setVenteForm({ type_carburant: "essence", quantite: 0, mode_paiement: "especes" });
      await Promise.all([fetchStocks(), fetchVentes(), fetchPrix()]);
      
    } catch (err: any) {
      console.error("Erreur lors de la vente:", err);
      showMessage(err.message || "Erreur lors de l'enregistrement", true);
    } finally {
      setLoading(false);
    }
  };
  
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
  
  const montantVente = venteForm.quantite * (venteForm.type_carburant === 'essence' ? prix.essence : prix.gasoil);
  
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
            ["vente", "💰 Nouvelle vente"],
            ["reservations", "📅 Réservations"],
            ["historique", "📜 Historique"],
            ["cloture", "📊 Fin de journée"],
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
            
            {/* Ventes du jour */}
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
            </div>
          </div>
        )}
        
        {/* VENTE */}
        {activeTab === "vente" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-orange-400 text-center mb-6">💰 Nouvelle vente</h2>
              
              <div className="bg-blue-500/10 rounded-xl p-3 mb-6 text-center">
                <p className="text-sm text-gray-400">Prix unitaire en vigueur</p>
                <p className="text-xl font-bold text-blue-400">
                  {venteForm.type_carburant === 'essence' ? prix.essence : prix.gasoil} FCFA/L
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setVenteForm({...venteForm, type_carburant: "essence"})}
                  className={`py-6 rounded-xl text-2xl font-bold transition ${
                    venteForm.type_carburant === "essence"
                      ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  ⛽ Essence
                </button>
                <button
                  type="button"
                  onClick={() => setVenteForm({...venteForm, type_carburant: "gasoil"})}
                  className={`py-6 rounded-xl text-2xl font-bold transition ${
                    venteForm.type_carburant === "gasoil"
                      ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  🛢️ Gasoil
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-400 text-center mb-2">Quantité (Litres)</label>
                <input
                  type="number"
                  value={venteForm.quantite || ""}
                  onChange={(e) => setVenteForm({...venteForm, quantite: parseFloat(e.target.value) || 0})}
                  className="w-full p-4 text-center text-3xl rounded-xl bg-black/50 border border-white/10 text-white"
                  placeholder="0"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  ["especes", "💵 Espèces"],
                  ["orange_money", "📱 Orange Money"],
                  ["mobicash", "📱 Mobicash"],
                  ["wave", "📱 Wave"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVenteForm({...venteForm, mode_paiement: value})}
                    className={`py-3 rounded-lg text-sm font-medium transition ${
                      venteForm.mode_paiement === value
                        ? "bg-green-500 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              <div className="bg-orange-500/20 rounded-xl p-4 mb-6 text-center">
                <p className="text-gray-400">Montant à encaisser</p>
                <p className="text-3xl font-bold text-orange-400">{montantVente.toLocaleString()} FCFA</p>
              </div>
              
              <button
                onClick={handleSaisirVente}
                disabled={loading || venteForm.quantite <= 0}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "✅ VALIDER LA VENTE"}
              </button>
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
        
        {/* HISTORIQUE */}
        {activeTab === "historique" && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📜 Historique des ventes</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ventes.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Aucune vente</div>
              ) : (
                ventes.map((vente) => {
                  const montant = vente.montant_total || vente.montant || 0;
                  return (
                    <div key={vente.id_vente} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <p className="font-semibold">
                            {vente.type_carburant === 'essence' ? '⛽ Essence' : '🛢️ Gasoil'} - {vente.quantite} L
                          </p>
                          <p className="text-sm text-gray-400">{vente.mode_paiement}</p>
                          <p className="text-xs text-gray-500">{new Date(vente.date_vente).toLocaleString()}</p>
                        </div>
                        <p className="text-lg font-bold text-green-400">
                          {typeof montant === 'number' ? montant.toLocaleString() : parseFloat(montant).toLocaleString()} FCFA
                        </p>
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