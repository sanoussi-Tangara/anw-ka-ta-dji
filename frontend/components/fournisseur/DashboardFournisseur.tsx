"use client";

import { useEffect, useState } from "react";
import {
  createBon,
  signerBon,
  transmettreBon,
  getHistoriqueBons,
  suivreBon,
  annulerBon,
  getIcrs,
  getDepots,
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
  nom_depot?: string;
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

  const [newBon, setNewBon] = useState({
    type_carburant: "essence",
    quantite_commandee: 0,
    date_disponibilite: "",
    id_depot: "",
    id_icr: "",
  });

  const [signatureData, setSignatureData] = useState({
    signature_fournisseur: "",
    code_verification: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
     const [bonsRes, icrsRes, depotsRes] = await Promise.all([
     getHistoriqueBons(),
     getIcrs(),
     getDepots(),
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

  const showMessage = (
    msg: string,
    isError = false
  ) => {
    setMessage(msg);

    if (isError) {
      setError(msg);
    }

    setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
  };

  /* ================= CREER BON ================= */

  const handleCreateBon = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);

    try {
      await createBon({
     type_carburant: bonForm.type_carburant,
      quantite_commandee: bonForm.quantite_commandee,
     date_disponibilite: bonForm.date_disponibilite,
     id_depot: parseInt(bonForm.id_depot),
     id_icr: parseInt(bonForm.id_icr)
});
    showMessage("Bon créee avec succès")

      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessage(err.message, true);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= SIGNER ================= */

  const handleSignerBon = async (
    id: number
  ) => {
    try {
      await signerBon(id, signatureData.signature_fournisseur, signatureData.code_verification);

      showMessage("Bon signé avec succès");

      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessage(err.message, true);
      }
    }
  };

  /* ================= TRANSMETTRE ================= */

  const handleTransmettre = async (
    id: number
  ) => {
    try {
      await transmettreBon(id);
      showMessage("Bon transmis avec succès");

      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessage(err.message, true);
      }
    }
  };

  /* ================= ANNULER ================= */

  const handleAnnuler = async (
    id: number
  ) => {
    try {
      await annulerBon(id);

      showMessage("Bon annulé");

      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessage(err.message, true);
      }
    }
  };

  /* ================= SUIVI ================= */

  const handleSuivi = async (
    id: number
  ) => {
    try {
      const res = await suivreBon(id);

      setSelectedBon(res.bon);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showMessage(err.message, true);
      }
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

          <p className="text-sm text-gray-400 mt-1">
            Gestion des bons d’enlèvement
          </p>
        </div>
      </div>

      {/* ALERTES */}

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
            ["bons", "🧾 Bons"],
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
              [
                "Total Bons",
                bons.length,
                "from-blue-500 to-cyan-500",
              ],

              [
                "Créés",
                bons.filter((b) => b.statut === "cree").length,
                "from-yellow-500 to-orange-500",
              ],

              [
                "En cours",
                bons.filter((b) => b.statut === "en_cours").length,
                "from-purple-500 to-pink-500",
              ],

              [
                "Terminés",
                bons.filter((b) => b.statut === "termine").length,
                "from-green-500 to-emerald-500",
              ],
            ].map(([title, value, color], i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <p className="text-sm text-gray-400">
                  {title}
                </p>

                <h2
                  className={`text-3xl font-bold bg-gradient-to-r ${color} text-transparent bg-clip-text`}
                >
                  {value}
                </h2>
              </div>
            ))}
          </div>
        )}

        {/* CREER BON */}

        {activeTab === "creer" && (
          <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6">

            <h2 className="text-xl font-bold text-orange-400 mb-4">
              ➕ Nouveau bon
            </h2>

            <form
              onSubmit={handleCreateBon}
              className="space-y-4"
            >

              <select
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={newBon.type_carburant}
                onChange={(e) =>
                  setNewBon({
                    ...newBon,
                    type_carburant: e.target.value,
                  })
                }
              >
                <option value="essence">
                  Essence
                </option>

                <option value="gasoil">
                  Gasoil
                </option>
              </select>

              <input
                type="number"
                placeholder="Quantité commandée"
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={newBon.quantite_commandee}
                onChange={(e) =>
                  setNewBon({
                    ...newBon,
                    quantite_commandee: parseFloat(e.target.value),
                  })
                }
                required
              />

              <input
                type="datetime-local"
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={newBon.date_disponibilite}
                onChange={(e) =>
                  setNewBon({
                    ...newBon,
                    date_disponibilite: e.target.value,
                  })
                }
                required
              />

              {/* DEPOT */}

              <select
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={newBon.id_depot}
                onChange={(e) =>
                  setNewBon({
                    ...newBon,
                    id_depot: e.target.value,
                  })
                }
                required
              >
                <option value="">
                  Choisir dépôt
                </option>

                {depots.map((d) => (
                  <option
                    key={d.id_depot}
                    value={d.id_depot}
                  >
                    {d.nom_depot}
                  </option>
                ))}
              </select>

              {/* ICR */}

              <select
                className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                value={newBon.id_icr}
                onChange={(e) =>
                  setNewBon({
                    ...newBon,
                    id_icr: e.target.value,
                  })
                }
                required
              >
                <option value="">
                  Choisir ICR
                </option>

                {icrs.map((i) => (
                  <option
                    key={i.id_icr}
                    value={i.id_icr}
                  >
                    {i.user?.nom} {i.user?.prenom}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-black py-3 rounded-lg font-semibold"
              >
                Créer le bon
              </button>

            </form>
          </div>
        )}

        {/* BONS */}

        {activeTab === "bons" && (
          <div className="space-y-4">

            {bons.map((bon) => (
              <div
                key={bon.id_bon}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >

                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-lg">
                      Bon #{bon.id_bon}
                    </h2>

                    <p className="text-sm text-gray-400">
                      {bon.type_carburant} •{" "}
                      {bon.quantite_commandee} L
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm">
                    {bon.statut}
                  </span>
                </div>

                <div className="mt-4 text-sm text-gray-300 space-y-1">
                  <p>
                    Dépôt : {bon.depot?.nom_depot}
                  </p>

                  <p>
                    ICR : {bon.icr?.user?.nom}{" "}
                    {bon.icr?.user?.prenom}
                  </p>

                  <p>
                    Code : {bon.code_verification}
                  </p>
                </div>

                {/* ACTIONS */}

                <div className="flex gap-2 flex-wrap mt-5">

                  {bon.statut === "cree" && (
                    <>
                      <button
                        onClick={() =>
                          handleSignerBon(bon.id_bon)
                        }
                        className="px-4 py-2 rounded-lg bg-green-500 text-black font-semibold"
                      >
                        Signer
                      </button>

                      <button
                        onClick={() =>
                          handleAnnuler(bon.id_bon)
                        }
                        className="px-4 py-2 rounded-lg bg-red-500 text-white"
                      >
                        Annuler
                      </button>
                    </>
                  )}

                  {bon.statut === "signe" && (
                    <button
                      onClick={() =>
                        handleTransmettre(bon.id_bon)
                      }
                      className="px-4 py-2 rounded-lg bg-blue-500 text-white"
                    >
                      Transmettre
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleSuivi(bon.id_bon)
                    }
                    className="px-4 py-2 rounded-lg bg-white/10"
                  >
                    Suivre
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

        {/* HISTORIQUE */}

        {activeTab === "historique" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

            <h2 className="text-xl font-bold text-orange-400 mb-4">
              📜 Historique
            </h2>

            <div className="space-y-3">

              {bons.map((bon) => (
                <div
                  key={bon.id_bon}
                  className="border border-white/10 rounded-lg p-4 flex justify-between items-center"
                >

                  <div>
                    <div className="font-semibold">
                      Bon #{bon.id_bon}
                    </div>

                    <div className="text-sm text-gray-400">
                      {bon.type_carburant} •{" "}
                      {bon.quantite_commandee} L
                    </div>
                  </div>

                  <div className="text-sm text-gray-300">
                    {bon.statut}
                  </div>

                </div>
              ))}

            </div>

          </div>
        )}

        {/* MODAL SUIVI */}

        {selectedBon && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg">

              <h2 className="text-xl font-bold text-orange-400 mb-4">
                🚛 Suivi du bon
              </h2>

              <div className="space-y-2 text-sm text-gray-300">

                <p>
                  Statut : {selectedBon.statut}
                </p>

                <p>
                  Début chargement :
                  {" "}
                  {selectedBon.date_debut_chargement || "-"}
                </p>

                <p>
                  Fin chargement :
                  {" "}
                  {selectedBon.date_fin_chargement || "-"}
                </p>

                <p>
                  Quantité chargée :
                  {" "}
                  {selectedBon.quantite_chargee || 0} L
                </p>

              </div>

              {/* SIGNATURE */}

              <div className="mt-5 space-y-3">

                <input
                  type="text"
                  placeholder="Signature"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                  value={signatureData.signature_fournisseur}
                  onChange={(e) =>
                    setSignatureData({
                      ...signatureData,
                      signature_fournisseur:
                        e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  placeholder="Code vérification"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10"
                  value={signatureData.code_verification}
                  onChange={(e) =>
                    setSignatureData({
                      ...signatureData,
                      code_verification:
                        e.target.value,
                    })
                  }
                />

              </div>

              <button
                onClick={() =>
                  setSelectedBon(null)
                }
                className="mt-6 w-full bg-red-500 py-3 rounded-lg"
              >
                Fermer
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}