"use client";

import { useEffect, useState, useRef } from "react";
import {
  createBon,
  transmettreBon,
  getHistoriqueBons,
  suivreBon,
  annulerBon,
  getIcrsForFournisseur,
  getDepotsForFournisseur,
  signerBonAvecCanvas,
  getDetailsBon,
} from "../../lib/api";

/* ================= TYPES ================= */

type User = {
  nom?: string;
  prenom?: string;
  email?: string;
};

type Icr = {
  id_icr: number;
  matricule: string;
  zone?: string;
  user?: User;
};

type Depot = {
  id_depot: number;
  nom: string;
  localisation?: string;
};

type Bon = {
  id_bon: number;
  code_verification: string;
  type_carburant: string;
  quantite_commandee: number;
  quantite_chargee?: number;
  statut: string;
  date_creation?: string;
  date_disponibilite?: string;
  signature_fournisseur?: string;
  icr?: Icr;
  depot?: Depot;
  date_debut_chargement?: string;
  date_fin_chargement?: string;
};

export default function DashboardFournisseur() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [bonForm, setBonForm] = useState({
    type_carburant: "essence",
    quantite_commandee: 0,
    date_disponibilite: "",
    id_depot: "",
    id_icr: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [bons, setBons] = useState<Bon[]>([]);
  const [icrs, setIcrs] = useState<Icr[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedBon, setSelectedBon] = useState<Bon | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [bonDetails, setBonDetails] = useState<any>(null);
  
  // États pour la signature
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [bonToSign, setBonToSign] = useState<Bon | null>(null);
  const [codeVerification, setCodeVerification] = useState("");
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bonsRes, icrsRes, depotsRes] = await Promise.all([
        getHistoriqueBons(),
        getIcrsForFournisseur(),
        getDepotsForFournisseur(),
      ]);
      setBons(bonsRes.bons?.data || []);
      setIcrs(icrsRes.icrs || []);
      setDepots(depotsRes.depots || []);
    } catch {
      setError("Erreur de chargement");
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

  // ========== FONCTIONS DE SIGNATURE ==========
  
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
    
    if (!codeVerification) {
      showMessage("Veuillez entrer le code de vérification", true);
      return;
    }
    
    setLoading(true);
    try {
      const signatureDataURL = canvas.toDataURL('image/png');
      await signerBonAvecCanvas(bonToSign?.id_bon!, signatureDataURL, codeVerification);
      
      showMessage("✅ Bon signé avec succès !");
      setShowSignatureModal(false);
      setBonToSign(null);
      setCodeVerification("");
      fetchData();
      
    } catch (err: any) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // ========== GESTION DES BONS ==========

  const handleCreateBon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dateDisponibilite = bonForm.date_disponibilite;
      const formattedDate = dateDisponibilite.replace('T', ' ') + ':00';

      await createBon({
        type_carburant: bonForm.type_carburant,
        quantite_commandee: bonForm.quantite_commandee,
        date_disponibilite: formattedDate,
        id_depot: parseInt(bonForm.id_depot),
        id_icr: parseInt(bonForm.id_icr),
      });
      showMessage("Bon créé avec succès");
      setBonForm({
        type_carburant: "essence",
        quantite_commandee: 0,
        date_disponibilite: "",
        id_depot: "",
        id_icr: "",
      });
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Ouvre la modal de signature
  const handleOpenSignature = (bon: Bon) => {
    setBonToSign(bon);
    setCodeVerification("");
    setShowSignatureModal(true);
  };

  const handleTransmettre = async (id: number) => {
    try {
      await transmettreBon(id);
      showMessage("Bon transmis avec succès");
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    }
  };

  const handleAnnuler = async (id: number) => {
    try {
      await annulerBon(id);
      showMessage("Bon annulé");
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    }
  };

  const handleSuivi = async (id: number) => {
    try {
      const res = await suivreBon(id);
      setSelectedBon(res.bon);
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    }
  };

  // Voir les détails du bon (ce qui concerne le fournisseur)
  const handleVoirDetails = async (id_bon: number) => {
    setLoading(true);
    try {
      const details = await getDetailsBon(id_bon);
      setBonDetails(details);
      setShowDetailsModal(true);
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* HEADER */}
      <div className="bg-[#0a0a0a]/80 border-b border-white/10 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-500 text-transparent bg-clip-text">
            Dashboard Fournisseur
          </h1>
          <p className="text-sm text-gray-400 mt-1">Gestion des bons d'enlèvement</p>
        </div>
      </div>

      {/* ALERTS */}
      {message && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl">
            {message}
          </div>
        </div>
      )}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-3 flex-wrap border-b border-white/10 pb-3">
          {[
            ["dashboard", "📊 Dashboard"],
            ["creer", "➕ Créer Bon"],
            ["bons", "🧾 Mes Bons"],
            ["historique", "📜 Historique"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                activeTab === key
                  ? "bg-orange-500 text-black font-semibold"
                  : "bg-white/5 hover:bg-white/10 text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              ["Total Bons", bons.length, "from-blue-500 to-cyan-500"],
              ["Créés", bons.filter((b) => b.statut === "cree").length, "from-yellow-500 to-orange-500"],
              ["Signés", bons.filter((b) => b.statut === "signe").length, "from-purple-500 to-pink-500"],
              ["Terminés", bons.filter((b) => b.statut === "termine").length, "from-green-500 to-emerald-500"],
            ].map(([title, value, color], i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400">{title}</p>
                <h2 className={`text-3xl font-bold bg-gradient-to-r ${color} text-transparent bg-clip-text`}>
                  {value}
                </h2>
              </div>
            ))}
          </div>
        )}

        {/* CREER BON */}
        {activeTab === "creer" && (
          <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">➕ Nouveau bon</h2>
            <form onSubmit={handleCreateBon} className="space-y-4">
              <select
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={bonForm.type_carburant}
                onChange={(e) => setBonForm({ ...bonForm, type_carburant: e.target.value })}
              >
                <option value="essence">Essence</option>
                <option value="gasoil">Gasoil</option>
              </select>
              <input
                type="number"
                placeholder="Quantité commandée (L)"
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={bonForm.quantite_commandee}
                onChange={(e) => setBonForm({ ...bonForm, quantite_commandee: parseFloat(e.target.value) })}
                required
              />
              <input
                type="datetime-local"
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={bonForm.date_disponibilite}
                onChange={(e) => setBonForm({ ...bonForm, date_disponibilite: e.target.value })}
                required
              />
              <select
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={bonForm.id_depot}
                onChange={(e) => setBonForm({ ...bonForm, id_depot: e.target.value })}
                required
              >
                <option value="">Choisir dépôt</option>
                {depots.map((d) => (
                  <option key={d.id_depot} value={d.id_depot}>
                    {d.nom}
                  </option>
                ))}
              </select>
              <select
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={bonForm.id_icr}
                onChange={(e) => setBonForm({ ...bonForm, id_icr: e.target.value })}
                required
              >
                <option value="">Choisir ICR</option>
                {icrs.map((i) => (
                  <option key={i.id_icr} value={i.id_icr}>
                    {i.user?.nom} {i.user?.prenom} - {i.matricule}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black py-3 rounded-lg font-semibold">
                Créer le bon
              </button>
            </form>
          </div>
        )}

        {/* MES BONS */}
        {activeTab === "bons" && (
          <div className="space-y-4">
            {bons.map((bon) => (
              <div key={bon.id_bon} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-lg">Bon #{bon.id_bon}</h2>
                    <p className="text-sm text-gray-400">{bon.type_carburant} • {bon.quantite_commandee} L</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    bon.statut === "cree" ? "bg-yellow-500/20 text-yellow-300" :
                    bon.statut === "signe" ? "bg-blue-500/20 text-blue-300" :
                    bon.statut === "termine" ? "bg-green-500/20 text-green-300" :
                    "bg-red-500/20 text-red-300"
                  }`}>
                    {bon.statut === "cree" ? "Créé" :
                     bon.statut === "signe" ? "Signé" :
                     bon.statut === "termine" ? "Terminé" : bon.statut}
                  </span>
                </div>
                
                <div className="mt-4 text-sm text-gray-300 space-y-1">
                  <p>🏭 Dépôt : {bon.depot?.nom}</p>
                  <p>👤 ICR : {bon.icr?.user?.nom} {bon.icr?.user?.prenom}</p>
                  <p>🔑 Code : {bon.code_verification}</p>
                </div>
                
                <div className="flex gap-2 flex-wrap mt-5">
                  {bon.statut === "cree" && (
                    <>
                      <button 
                        onClick={() => handleOpenSignature(bon)} 
                        className="px-4 py-2 rounded-lg bg-green-500 text-black font-semibold"
                      >
                        ✍️ Signer
                      </button>
                      <button onClick={() => handleAnnuler(bon.id_bon)} className="px-4 py-2 rounded-lg bg-red-500 text-white">
                        Annuler
                      </button>
                    </>
                  )}
                  {bon.statut === "signe" && (
                    <button onClick={() => handleTransmettre(bon.id_bon)} className="px-4 py-2 rounded-lg bg-blue-500 text-white">
                      Transmettre à l'ICR
                    </button>
                  )}
                  <button onClick={() => handleSuivi(bon.id_bon)} className="px-4 py-2 rounded-lg bg-white/10">
                    Suivre
                  </button>
                  <button onClick={() => handleVoirDetails(bon.id_bon)} className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
                    📄 Voir détails
                  </button>
                </div>
              </div>
            ))}
            {bons.length === 0 && (
              <div className="text-center text-gray-400 py-8">Aucun bon créé</div>
            )}
          </div>
        )}

        {/* HISTORIQUE */}
        {activeTab === "historique" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-orange-400 mb-4">📜 Historique des bons</h2>
            <div className="space-y-3">
              {bons.map((bon) => (
                <div key={bon.id_bon} className="border border-white/10 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Bon #{bon.id_bon}</div>
                    <div className="text-sm text-gray-400">{bon.type_carburant} • {bon.quantite_commandee} L</div>
                    <div className="text-xs text-gray-500">Dépôt: {bon.depot?.nom}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">{bon.statut}</div>
                    <div className="text-xs text-gray-500">{bon.date_creation ? new Date(bon.date_creation).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL SIGNATURE FOURNISSEUR */}
        {showSignatureModal && bonToSign && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-orange-400">✍️ Signature du Bon</h2>
                <button 
                  onClick={() => { setShowSignatureModal(false); setBonToSign(null); }} 
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-gray-400 text-sm">Bon #{bonToSign.id_bon}</p>
                <p className="text-sm text-orange-400 mt-1">
                  Veuillez signer pour valider ce bon
                </p>
              </div>
              
              {/* Code de vérification */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Code de vérification</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Entrez le code à 4 chiffres"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white text-center text-2xl font-mono"
                  value={codeVerification}
                  onChange={(e) => setCodeVerification(e.target.value)}
                />
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

        {/* MODAL SUIVI SIMPLE */}
        {selectedBon && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold text-orange-400 mb-4">🚛 Suivi du bon</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Statut:</span>
                  <span>{selectedBon.statut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Début chargement:</span>
                  <span>{selectedBon.date_debut_chargement || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fin chargement:</span>
                  <span>{selectedBon.date_fin_chargement || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantité chargée:</span>
                  <span>{selectedBon.quantite_chargee || 0} L</span>
                </div>
                {selectedBon.signature_fournisseur && (
                  <div className="mt-3">
                    <p className="text-gray-400 mb-2">Votre signature:</p>
                    <img src={selectedBon.signature_fournisseur} alt="Signature" className="h-16 object-contain bg-white rounded" />
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedBon(null)} className="mt-6 w-full bg-red-500 py-3 rounded-lg">
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* MODAL DÉTAILS DU BON (CE QUI CONCERNE LE FOURNISSEUR) */}
        {showDetailsModal && bonDetails && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-gradient-to-br from-gray-900 to-black">
                <h2 className="text-xl font-bold text-orange-400">📄 Détails du Bon #{bonDetails.bon.id_bon}</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>
              
              <div className="space-y-4">
                {/* Statut */}
                <div className="bg-gradient-to-r from-orange-500/10 to-green-500/10 rounded-lg p-4 border border-orange-500/30">
                  <p className="text-center text-lg font-bold">BON D'ENLÈVEMENT</p>
                  <p className="text-center text-sm text-gray-400">N° {bonDetails.bon.id_bon}</p>
                  <p className="text-center mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      bonDetails.bon.statut === "cree" ? "bg-yellow-500/20 text-yellow-300" :
                      bonDetails.bon.statut === "signe" ? "bg-blue-500/20 text-blue-300" :
                      bonDetails.bon.statut === "termine" ? "bg-green-500/20 text-green-300" :
                      "bg-red-500/20 text-red-300"
                    }`}>
                      {bonDetails.bon.statut === "cree" ? "Créé" :
                       bonDetails.bon.statut === "signe" ? "Signé" :
                       bonDetails.bon.statut === "termine" ? "Terminé" : bonDetails.bon.statut}
                    </span>
                  </p>
                </div>

                {/* Informations du bon */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-orange-400 font-semibold mb-2">📋 Informations</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-400">Type carburant:</p>
                    <p className="text-white">{bonDetails.bon.type_carburant}</p>
                    <p className="text-gray-400">Quantité commandée:</p>
                    <p className="text-white font-bold">{bonDetails.bon.quantite_commandee} L</p>
                    <p className="text-gray-400">Quantité chargée:</p>
                    <p className="text-white">{bonDetails.bon.quantite_chargee || '-'} L</p>
                    <p className="text-gray-400">Code vérification:</p>
                    <p className="text-white font-mono">{bonDetails.bon.code_verification}</p>
                    <p className="text-gray-400">Date disponibilité:</p>
                    <p className="text-white">{new Date(bonDetails.bon.date_disponibilite).toLocaleString()}</p>
                    <p className="text-gray-400">Date création:</p>
                    <p className="text-white">{new Date(bonDetails.bon.date_creation).toLocaleString()}</p>
                  </div>
                </div>

                {/* ICR concerné */}
                {bonDetails.bon.icr && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-orange-400 font-semibold mb-2">👤 ICR concerné</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Nom complet:</p>
                      <p className="text-white">{bonDetails.bon.icr.prenom} {bonDetails.bon.icr.nom}</p>
                      <p className="text-gray-400">Matricule:</p>
                      <p className="text-white">{bonDetails.bon.icr.matricule}</p>
                      <p className="text-gray-400">Email:</p>
                      <p className="text-white">{bonDetails.bon.icr.email}</p>
                      <p className="text-gray-400">Téléphone:</p>
                      <p className="text-white">{bonDetails.bon.icr.telephone}</p>
                      <p className="text-gray-400">Zone:</p>
                      <p className="text-white">{bonDetails.bon.icr.zone || '-'}</p>
                    </div>
                  </div>
                )}

                {/* Dépôt concerné */}
                {bonDetails.bon.depot && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-orange-400 font-semibold mb-2">🏭 Dépôt concerné</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Nom du dépôt:</p>
                      <p className="text-white font-semibold">{bonDetails.bon.depot.nom}</p>
                      <p className="text-gray-400">Localisation:</p>
                      <p className="text-white">{bonDetails.bon.depot.localisation || '-'}</p>
                    </div>
                  </div>
                )}

                {/* Votre signature */}
                {bonDetails.bon.signature_fournisseur && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-orange-400 font-semibold mb-2">✍️ Votre signature</h3>
                    <img 
                      src={bonDetails.bon.signature_fournisseur} 
                      alt="Signature Fournisseur" 
                      className="h-20 object-contain bg-white rounded p-2" 
                    />
                    <p className="text-green-400 text-xs mt-2">✓ Signature apposée</p>
                  </div>
                )}

                {/* Informations de chargement */}
                {(bonDetails.bon.date_debut_chargement || bonDetails.bon.date_fin_chargement) && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-orange-400 font-semibold mb-2">⏱️ Chargement</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Début chargement:</p>
                      <p className="text-white">{bonDetails.bon.date_debut_chargement ? new Date(bonDetails.bon.date_debut_chargement).toLocaleString() : '-'}</p>
                      <p className="text-gray-400">Fin chargement:</p>
                      <p className="text-white">{bonDetails.bon.date_fin_chargement ? new Date(bonDetails.bon.date_fin_chargement).toLocaleString() : '-'}</p>
                    </div>
                  </div>
                )}

                {/* Récapitulatif */}
                <div className="bg-gradient-to-r from-orange-500/20 to-green-500/20 rounded-lg p-4 border border-orange-500/30">
                  <h3 className="text-orange-400 font-semibold mb-2">📊 Récapitulatif</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-400">Statut du bon:</p>
                    <p className="text-white font-semibold">
                      {bonDetails.bon.statut === "cree" && "📝 En attente de signature"}
                      {bonDetails.bon.statut === "signe" && "✅ Signé - En attente de transmission"}
                      {bonDetails.bon.statut === "termine" && "🏁 Terminé"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}