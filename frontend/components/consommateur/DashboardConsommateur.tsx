"use client";

import { useState, useEffect } from "react";
import {
  getConsommateurProfil,
  updateConsommateurProfil,
  getConsommateurReservations,
  creerReservation,
  annulerReservation,
  getStationsConsommateur,
  getPrixActuelsConsommateur,
  simulerPaiement,
} from "../../lib/api";

// ================= TYPES =================

type User = {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motdepass: string;
};

type Station = {
  id_station: number;
  nom: string;
  adresse: string;
  latitude: number;
  longitude: number;
  stock_essence?: number;
  stock_gasoil?: number;
};

type Reservation = {
  id_reservation: number;
  quantite: number;
  type_carburant: string;
  montant_total: number;
  statut: string;  // "en_attente", "payee", "servie", "annulee"
  date_reservation: string;
  date_retrait: string;
  station: Station;
};

type ConsommateurProfil = {
  id_consommateur: number;
  user: User;
};

// Fonction pour afficher le libellé du statut
const getStatutLibelle = (statut: string): { text: string; color: string; icon: string } => {
  switch (statut) {
    case "servie":
      return { text: "✅ Servie", color: "bg-green-500/20 text-green-300", icon: "✅" };
    case "payee":
      return { text: "💰 Payée - En attente de service", color: "bg-blue-500/20 text-blue-300", icon: "💰" };
    case "en_attente":
      return { text: "⏳ En attente de paiement", color: "bg-yellow-500/20 text-yellow-300", icon: "⏳" };
    case "annulee":
      return { text: "❌ Annulée", color: "bg-red-500/20 text-red-300", icon: "❌" };
    default:
      return { text: statut, color: "bg-gray-500/20 text-gray-300", icon: "❓" };
  }
};

export default function DashboardConsommateur() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // États principaux
  const [profil, setProfil] = useState<ConsommateurProfil | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [prix, setPrix] = useState({ essence: 750, gasoil: 700 });
  
  // États modaux
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [reservationForm, setReservationForm] = useState({
    type_carburant: "essence",
    quantite: 0,
    mode_paiement: "orange_money",
  });
  const [reservationToPay, setReservationToPay] = useState<Reservation | null>(null);
  const [paiementEnCours, setPaiementEnCours] = useState(false);
  
  // Éditer profil
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [profilForm, setProfilForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    motdepass: "",

  });
  
  // Position GPS pour carte
  const [position, setPosition] = useState({ lat: 12.6392, lng: -8.0029 });

  // Charger les données
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
    fetchAllData();
    getCurrentPosition();
  }, []);

  const getCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => console.error("Erreur GPS:", err)
      );
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfil(),
        fetchStations(),
        fetchReservations(),
        fetchPrix(),
      ]);
    } catch (err) {
      showMessage("Erreur de chargement des données", true);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfil = async () => {
    try {
      const res = await getConsommateurProfil();
      setProfil(res);
      setProfilForm({
        nom: res.user?.nom || "",
        prenom: res.user?.prenom || "",
        telephone: res.user?.telephone || "",
        motdepass: res.user?.motdepass || "",
      });
    } catch (err) {
      console.error("Erreur chargement profil", err);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await getStationsConsommateur();
      setStations(res.stations || []);
    } catch (err) {
      console.error("Erreur chargement stations", err);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await getConsommateurReservations();
      setReservations(res.reservations || []);
      console.log("Réservations chargées:", res.reservations);
    } catch (err) {
      console.error("Erreur chargement réservations", err);
    }
  };

  const fetchPrix = async () => {
    try {
      const res = await getPrixActuelsConsommateur();
      setPrix({
        essence: res.essence || 750,
        gasoil: res.gasoil || 700,
      });
    } catch (err) {
      console.error("Erreur chargement prix", err);
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

  // ========== PROFIL ==========
  const handleUpdateProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateConsommateurProfil(profilForm);
      showMessage("✅ Profil mis à jour");
      setShowProfilModal(false);
      await fetchProfil();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // ========== RÉSERVATION (étape 1) ==========
  const handleCreerReservation = async () => {
    if (!selectedStation) return;
    if (reservationForm.quantite <= 0) {
      showMessage("Veuillez entrer une quantité valide", true);
      return;
    }

    setLoading(true);
    try {
      const res = await creerReservation({
        id_station: selectedStation.id_station,
        type_carburant: reservationForm.type_carburant as "essence" | "gasoil",
        quantite: reservationForm.quantite,
      });
      
      showMessage("✅ Réservation créée ! Veuillez procéder au paiement");
      setShowReservationModal(false);
      setSelectedStation(null);
      setReservationForm({ type_carburant: "essence", quantite: 0, mode_paiement: "orange_money" });
      
      if (res.reservation) {
        setReservationToPay(res.reservation);
        setShowPaiementModal(true);
      }
      await fetchReservations();
      
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // ========== PAIEMENT (étape 2) ==========
  const handlePaiement = async () => {
    if (!reservationToPay) return;
    
    if (!reservationForm.mode_paiement) {
      showMessage("Veuillez choisir un mode de paiement", true);
      return;
    }
    
    setPaiementEnCours(true);
    try {
      const result = await simulerPaiement(reservationToPay.id_reservation, reservationForm.mode_paiement);
      
      if (result.success) {
        showMessage(`✅ ${result.message || "Paiement accepté !"}`);
        setShowPaiementModal(false);
        setReservationToPay(null);
        await fetchReservations();
      } else {
        showMessage(result.message || "Paiement échoué", true);
      }
    } catch (err: any) {
      console.error("❌ Erreur paiement:", err);
      showMessage(err.message, true);
    } finally {
      setPaiementEnCours(false);
    }
  };

  // ========== ANNULATION ==========
  const handleAnnulerReservation = async (id: number) => {
    if (!confirm("Annuler cette réservation ?")) return;
    
    setLoading(true);
    try {
      await annulerReservation(id);
      showMessage("✅ Réservation annulée");
      await fetchReservations();
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const montantTotal = reservationForm.quantite * (reservationForm.type_carburant === "essence" ? prix.essence : prix.gasoil);

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
                ⛽ Dashboard Consommateur
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Bienvenue {profil.user?.prenom} {profil.user?.nom}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfilModal(true)}
                className="px-3 py-1 rounded-lg bg-white/10 text-sm"
              >
                👤 Mon profil
              </button>
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
        <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
          {[
            ["dashboard", "🏠 Tableau de bord"],
            ["stations", "📍 Stations"],
            ["reservations", "📅 Mes réservations"],
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
            <div className="bg-gradient-to-r from-orange-500/10 to-green-500/10 rounded-2xl p-6 mb-6 border border-orange-500/30">
              <h3 className="text-lg font-semibold mb-2">💰 Prix en vigueur</h3>
              <div className="flex gap-6">
                <div>
                  <p className="text-gray-400">⛽ Essence</p>
                  <p className="text-2xl font-bold text-orange-400">{prix.essence} FCFA/L</p>
                </div>
                <div>
                  <p className="text-gray-400">🛢️ Gasoil</p>
                  <p className="text-2xl font-bold text-green-400">{prix.gasoil} FCFA/L</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Total réservations", value: reservations.length, color: "from-blue-500 to-cyan-500", icon: "📅" },
                { title: "En attente de paiement", value: reservations.filter(r => r.statut === "en_attente").length, color: "from-yellow-500 to-orange-500", icon: "⏳" },
                { title: "Payées", value: reservations.filter(r => r.statut === "payee").length, color: "from-blue-500 to-purple-500", icon: "💰" },
                { title: "Servies", value: reservations.filter(r => r.statut === "servie").length, color: "from-green-500 to-emerald-500", icon: "✅" },
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

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">📅 Dernières réservations</h3>
              {reservations.slice(0, 3).length === 0 ? (
                <p className="text-gray-400 text-center py-4">Aucune réservation</p>
              ) : (
                <div className="space-y-3">
                  {reservations.slice(0, 3).map((res) => {
                    const statutInfo = getStatutLibelle(res.statut);
                    return (
                      <div key={res.id_reservation} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="font-semibold">{res.station?.nom || "Station"}</p>
                          <p className="text-sm text-gray-400">{res.quantite || 0} L - {res.type_carburant || "essence"}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${statutInfo.color}`}>
                          {statutInfo.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATIONS */}
        {activeTab === "stations" && (
          <div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
              <h3 className="text-orange-400 font-semibold mb-3">🗺️ Stations à proximité</h3>
              <div className="h-[400px] w-full rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${position.lng - 0.1},${position.lat - 0.1},${position.lng + 0.1},${position.lat + 0.1}&layer=mapnik&marker=${position.lat},${position.lng}`}
                  style={{ border: 0 }}
                  title="Carte stations"
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-orange-400 mb-4">📍 Stations disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stations.map((station) => (
                  <div key={station.id_station} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-orange-500/30 transition">
                    <h3 className="font-bold text-lg text-orange-400">{station.nom}</h3>
                    <p className="text-sm text-gray-400 mt-1">{station.adresse}</p>
                    <div className="flex gap-2 mt-3">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                        target="_blank"
                        className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300"
                      >
                        🗺️ Y aller
                      </a>
                      <button
                        onClick={() => {
                          setSelectedStation(station);
                          setShowReservationModal(true);
                        }}
                        className="text-xs px-3 py-1 rounded-lg bg-green-500/20 text-green-300"
                      >
                        📝 Réserver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MES RÉSERVATIONS */}
        {activeTab === "reservations" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📅 Mes réservations</h2>
            {reservations.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Aucune réservation</div>
            ) : (
              <div className="space-y-4">
                {reservations.map((res) => {
                  const statutInfo = getStatutLibelle(res.statut);
                  const peutAnnuler = res.statut === "en_attente" || res.statut === "payee";
                  const peutPayer = res.statut === "en_attente";
                  const estServie = res.statut === "servie";
                  
                  return (
                    <div key={res.id_reservation} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                          <p className="font-semibold text-lg">{res.station?.nom || "Station"}</p>
                          <p className="text-sm text-gray-400">{res.station?.adresse || ""}</p>
                          <p className="text-sm mt-2">{res.quantite || 0} L - {res.type_carburant || "essence"}</p>
                          <p className="text-sm text-orange-400">{(res.montant_total || 0).toLocaleString()} FCFA</p>
                          <p className="text-xs text-gray-500">
                            Réservé le: {res.date_reservation ? new Date(res.date_reservation).toLocaleString() : "Non définie"}
                          </p>
                          {estServie && (
                            <p className="text-xs text-green-400 mt-1">
                              ✅ Servie le: {res.date_retrait ? new Date(res.date_retrait).toLocaleString() : "Date non disponible"}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${statutInfo.color}`}>
                            {statutInfo.text}
                          </span>
                          {peutAnnuler && !estServie && (
                            <button
                              onClick={() => handleAnnulerReservation(res.id_reservation)}
                              className="mt-2 text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-300 block w-full"
                            >
                              Annuler
                            </button>
                          )}
                          {peutPayer && (
                            <button
                              onClick={() => {
                                setReservationToPay(res);
                                setShowPaiementModal(true);
                              }}
                              className="mt-2 text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 block w-full"
                            >
                              Payer
                            </button>
                          )}
                          {estServie && (
                            <div className="mt-2 text-xs px-3 py-1 rounded-lg bg-green-500/20 text-green-300">
                               Carburant récupéré
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL RÉSERVATION */}
      {showReservationModal && selectedStation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">📝 Nouvelle réservation</h2>
              <button onClick={() => setShowReservationModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="font-semibold">{selectedStation.nom}</p>
              <p className="text-sm text-gray-400">{selectedStation.adresse}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type de carburant</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReservationForm({...reservationForm, type_carburant: "essence"})}
                    className={`py-2 rounded-lg transition ${
                      reservationForm.type_carburant === "essence"
                        ? "bg-orange-500 text-black"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    ⛽ Essence
                  </button>
                  <button
                    type="button"
                    onClick={() => setReservationForm({...reservationForm, type_carburant: "gasoil"})}
                    className={`py-2 rounded-lg transition ${
                      reservationForm.type_carburant === "gasoil"
                        ? "bg-green-500 text-black"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    🛢️ Gasoil
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Quantité (Litres)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                  value={reservationForm.quantite}
                  onChange={(e) => setReservationForm({...reservationForm, quantite: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div className="bg-orange-500/20 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-400">Montant total</p>
                <p className="text-2xl font-bold text-orange-400">{montantTotal.toLocaleString()} FCFA</p>
              </div>
              
              <button
                onClick={handleCreerReservation}
                disabled={loading || reservationForm.quantite <= 0}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold"
              >
                {loading ? "Création..." : "✅ Réserver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT */}
      {showPaiementModal && reservationToPay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">💳 Paiement</h2>
              <button onClick={() => setShowPaiementModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="font-semibold">{reservationToPay.station?.nom || "Station"}</p>
              <p className="text-sm">{reservationToPay.quantite || 0} L - {reservationToPay.type_carburant || "essence"}</p>
              <p className="text-2xl font-bold text-orange-400 mt-2">
                {(reservationToPay.montant_total || 0).toLocaleString()} FCFA
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <label className="block text-sm text-gray-400">Mode de paiement</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["orange_money", "📱 Orange Money"],
                  ["mobicash", "📱 Mobicash"],
                  ["wave", "🌊 Wave"],
                  ["card", "💳 Carte"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReservationForm({...reservationForm, mode_paiement: value})}
                    className={`py-2 rounded-lg text-sm transition ${
                      reservationForm.mode_paiement === value
                        ? "bg-green-500 text-white"
                        : "bg-white/10 text-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handlePaiement}
              disabled={paiementEnCours}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
            >
              {paiementEnCours ? "Traitement..." : "💰 Payer maintenant"}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 Paiement sécurisé - Simulation
            </p>
          </div>
        </div>
      )}

      {/* MODAL PROFIL */}
      {showProfilModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-400">👤 Mon profil</h2>
              <button onClick={() => setShowProfilModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleUpdateProfil} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                  value={profilForm.nom}
                  onChange={(e) => setProfilForm({...profilForm, nom: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Prénom</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                  value={profilForm.prenom}
                  onChange={(e) => setProfilForm({...profilForm, prenom: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Téléphone</label>
                <input
                  type="tel"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                  value={profilForm.telephone}
                  onChange={(e) => setProfilForm({...profilForm, telephone: e.target.value})}
                />
              </div>
               <div>
  <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
  <input
    type="password"
    className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white"
    value={profilForm.motdepass}
    onChange={(e) => setProfilForm({ ...profilForm, motdepass: e.target.value })}
  />
</div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-green-500 text-black font-semibold"
              >
                {loading ? "Enregistrement..." : "💾 Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}