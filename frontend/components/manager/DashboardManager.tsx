"use client";

import { useState, useEffect } from "react";
import {
  getFournisseurs,
  getIcrs,
  getResponsablesDepot,
  getStations,
  getPrix,
  fixerPrix,
  createFournisseur,
  createIcr,
  createResponsableDepot,
  desactiverFournisseur,
  activerFournisseur,
  desactiverIcr,
  activerIcr,
  desactiverResponsableDepot,
  activerResponsableDepot,
  creerDepot,
  getDepots,
  changerResponsable,  // ← Changé ici (au lieu de affecterResponsable)
} from "../../lib/api";

/* ================= TYPES ================= */

type User = {
  id_utilisateur?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  statut?: boolean;
  created_at?: string;
};

type Fournisseur = {
  id_fournisseur: number;
  nom_societe: string;
  adresse?: string;
  nif?: string;
  created_at?: string;
  user?: User;
};

type Icr = {
  id_icr: number;
  matricule: string;
  nom_entreprise?: string;
  created_at?: string;
  user?: User;
};

type Responsable = {
  id_responsable: number;
  created_at?: string;
  user?: User;
  depot?: {
    id_depot: number;
    nom: string;
    localisation: string;
  };
};

type Depot = {
  id_depot: number;
  nom: string;
  localisation: string;
  id_responsable?: number;
  responsable?: {
    id_responsable: number;
    user?: User;
  };
};

type Station = {
  id_station?: number;
  nom?: string;
  adresse?: string;
};

type Prix = {
  essence: number;
  gasoil: number;
};

export default function DashboardManager() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [icrs, setIcrs] = useState<Icr[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [prix, setPrix] = useState<Prix>({
    essence: 750,
    gasoil: 700,
  });

  // Fournisseur
  const [newFournisseur, setNewFournisseur] = useState({
    nom: "",
    prenom: "",
    nom_societe: "",
    adresse: "",
    nif: "",
    email: "",
    password: "",
    telephone: "",
  });

  // ICR
  const [newIcr, setNewIcr] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
    matricule: "",
    nom_entreprise: "",
  });

  const [newResponsable, setNewResponsable] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
  });

  // Dépôt
  const [newDepot, setNewDepot] = useState({
    nom: "",
    localisation: "",
    id_responsable: undefined as number | undefined,
  });

  const [affectation, setAffectation] = useState({
    id_depot: "",
    id_responsable: "",
  });

  const [prixForm, setPrixForm] = useState<Prix>({
    essence: 750,
    gasoil: 700,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [
        fournisseursRes,
        icrsRes,
        responsablesRes,
        stationsRes,
        prixRes,
        depotsRes,
      ] = await Promise.all([
        getFournisseurs(),
        getIcrs(),
        getResponsablesDepot(),
        getStations(),
        getPrix(),
        getDepots(),
      ]);

      setFournisseurs(fournisseursRes.fournisseurs || []);
      setIcrs(icrsRes.icrs || []);
      setResponsables(responsablesRes.responsables || []);
      setStations(stationsRes.stations || []);
      setDepots(depotsRes.depots || []);

      setPrix({
        essence: prixRes.essence || 750,
        gasoil: prixRes.gasoil || 700,
      });

      setPrixForm({
        essence: prixRes.essence || 750,
        gasoil: prixRes.gasoil || 700,
      });
    } catch {
      setError("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    setError(isError ? msg : "");
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
  };

  // Création Fournisseur
  const handleCreateFournisseur = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createFournisseur(newFournisseur);
      showMessage("Fournisseur créé avec succès");
      setNewFournisseur({
        nom: "",
        prenom: "",
        nom_societe: "",
        adresse: "",
        nif: "",
        email: "",
        password: "",
        telephone: "",
      });
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Création ICR
  const handleCreateIcr = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createIcr(newIcr);
      showMessage("ICR créé avec succès");
      setNewIcr({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        telephone: "",
        matricule: "",
        nom_entreprise: "",
      });
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Création Responsable Dépôt
  const handleCreateResponsable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createResponsableDepot(newResponsable);
      showMessage("Responsable de dépôt créé avec succès");
      setNewResponsable({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        telephone: "",
      });
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Création Dépôt (avec responsable obligatoire)
  const handleCreateDepot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await creerDepot({
        nom: newDepot.nom,
        localisation: newDepot.localisation,
        id_responsable: newDepot.id_responsable!,
      });
      showMessage("Dépôt créé avec succès");
      setNewDepot({ nom: "", localisation: "", id_responsable: undefined });
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Changer le responsable d'un dépôt
  const handleChangerResponsable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changerResponsable({
        id_depot: parseInt(affectation.id_depot),
        id_responsable: parseInt(affectation.id_responsable),
      });
      showMessage("Responsable changé avec succès");
      setAffectation({ id_depot: "", id_responsable: "" });
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Fixer les prix
  const handleFixerPrix = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fixerPrix(prixForm.essence, prixForm.gasoil);
      showMessage("Prix mis à jour avec succès");
      setPrix({
        essence: prixForm.essence,
        gasoil: prixForm.gasoil,
      });
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Désactiver/Activer Fournisseur
  const toggleFournisseur = async (id: number, actif: boolean) => {
    try {
      if (actif) {
        await desactiverFournisseur(id);
        showMessage("Fournisseur désactivé");
      } else {
        await activerFournisseur(id);
        showMessage("Fournisseur activé");
      }
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    }
  };

  // Désactiver/Activer ICR
  const toggleIcr = async (id: number, actif: boolean) => {
    try {
      if (actif) {
        await desactiverIcr(id);
        showMessage("ICR désactivé");
      } else {
        await activerIcr(id);
        showMessage("ICR activé");
      }
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    }
  };

  // Désactiver/Activer Responsable
  const toggleResponsable = async (id: number, actif: boolean) => {
    try {
      if (actif) {
        await desactiverResponsableDepot(id);
        showMessage("Responsable désactivé");
      } else {
        await activerResponsableDepot(id);
        showMessage("Responsable activé");
      }
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) showMessage(err.message, true);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* HEADER PREMIUM */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-500 text-transparent bg-clip-text">
            Tableau de bord Manager
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestion intelligente du réseau carburant - Anw Ka Ta Djì
          </p>
        </div>
      </div>

      {/* ALERTS */}
      {message && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl backdrop-blur">
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

      {/* NAV TABS PREMIUM */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-3 flex-wrap border-b border-white/10 pb-3">
          {[
            ["dashboard", "📊 Dashboard"],
            ["fournisseurs", "🏢 Fournisseurs"],
            ["icr", "👤 ICR"],
            ["responsables", "📦 Responsables"],
            ["depots", "🏭 Dépôts"],
            ["prix", "💰 Prix"]
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                activeTab === key
                  ? "bg-orange-500 text-black font-semibold shadow-lg shadow-orange-500/20"
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

        {/* DASHBOARD CARDS */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <p className="text-gray-400 text-sm">Fournisseurs</p>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-transparent bg-clip-text">
                {fournisseurs.length}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <p className="text-gray-400 text-sm">ICR</p>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-transparent bg-clip-text">
                {icrs.length}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <p className="text-gray-400 text-sm">Responsables</p>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 text-transparent bg-clip-text">
                {responsables.length}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <p className="text-gray-400 text-sm">Dépôts</p>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
                {depots.length}
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <p className="text-gray-400 text-sm">Stations</p>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text">
                {stations.length}
              </h2>
            </div>
          </div>
        )}

        {/* FOURNISSEURS TAB */}
        {activeTab === "fournisseurs" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">➕ Nouveau fournisseur</h2>
              <form onSubmit={handleCreateFournisseur} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Nom" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newFournisseur.nom} onChange={(e) => setNewFournisseur({...newFournisseur, nom: e.target.value})} required />
                  <input type="text" placeholder="Prénom" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newFournisseur.prenom} onChange={(e) => setNewFournisseur({...newFournisseur, prenom: e.target.value})} required />
                </div>
                <input type="text" placeholder="Nom société *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newFournisseur.nom_societe} onChange={(e) => setNewFournisseur({...newFournisseur, nom_societe: e.target.value})} required />
                <input type="text" placeholder="Adresse" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newFournisseur.adresse} onChange={(e) => setNewFournisseur({...newFournisseur, adresse: e.target.value})} />
                <input type="text" placeholder="NIF" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newFournisseur.nif} onChange={(e) => setNewFournisseur({...newFournisseur, nif: e.target.value})} />
                <input type="email" placeholder="Email *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newFournisseur.email} onChange={(e) => setNewFournisseur({...newFournisseur, email: e.target.value})} required />
                <input type="password" placeholder="Mot de passe *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newFournisseur.password} onChange={(e) => setNewFournisseur({...newFournisseur, password: e.target.value})} required />
                <input type="tel" placeholder="Téléphone" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newFournisseur.telephone} onChange={(e) => setNewFournisseur({...newFournisseur, telephone: e.target.value})} />
                <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-semibold py-2 rounded-lg">Créer</button>
              </form>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">📋 Fournisseurs</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {fournisseurs.map((f) => (
                  <div key={f.id_fournisseur} className="border border-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-orange-400">{f.nom_societe}</div>
                      <span className={`text-xs px-2 py-1 rounded ${f.user?.statut ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {f.user?.statut ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      <div>Contact: {f.user?.prenom} {f.user?.nom}</div>
                      <div>Email: {f.user?.email}</div>
                      <div>Téléphone: {f.user?.telephone || "-"}</div>
                      <div>Adresse: {f.adresse || "-"}</div>
                      <div>NIF: {f.nif || "-"}</div>
                      <div>Inscrit le: {formatDate(f.created_at)}</div>
                    </div>
                    <button onClick={() => toggleFournisseur(f.id_fournisseur, f.user?.statut ?? false)} className={`mt-2 px-3 py-1 rounded text-sm ${f.user?.statut ? 'bg-red-500/80' : 'bg-green-500/80'} text-white`}>
                      {f.user?.statut ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ICR TAB */}
        {activeTab === "icr" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">➕ Nouvel ICR</h2>
              <form onSubmit={handleCreateIcr} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Nom *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newIcr.nom} onChange={(e) => setNewIcr({...newIcr, nom: e.target.value})} required />
                  <input type="text" placeholder="Prénom *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newIcr.prenom} onChange={(e) => setNewIcr({...newIcr, prenom: e.target.value})} required />
                </div>
                <input type="email" placeholder="Email *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newIcr.email} onChange={(e) => setNewIcr({...newIcr, email: e.target.value})} required />
                <input type="password" placeholder="Mot de passe *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newIcr.password} onChange={(e) => setNewIcr({...newIcr, password: e.target.value})} required />
                <input type="tel" placeholder="Téléphone *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newIcr.telephone} onChange={(e) => setNewIcr({...newIcr, telephone: e.target.value})} required />
                <input type="text" placeholder="Matricule *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newIcr.matricule} onChange={(e) => setNewIcr({...newIcr, matricule: e.target.value})} required />
                <input type="text" placeholder="Nom de l'entreprise" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newIcr.nom_entreprise} onChange={(e) => setNewIcr({...newIcr, nom_entreprise: e.target.value})} />
                <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-semibold py-2 rounded-lg">Créer</button>
              </form>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">📋 ICR</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {icrs.map((i) => (
                  <div key={i.id_icr} className="border border-white/10 rounded-lg p-3">
                    <div className="font-semibold">{i.user?.prenom} {i.user?.nom}</div>
                    <div className="text-sm text-gray-400">Matricule: {i.matricule}</div>
                    <div className="text-sm text-gray-400">Email: {i.user?.email}</div>
                    <div className="text-sm text-gray-400">Téléphone: {i.user?.telephone || "-"}</div>
                    <div className="text-sm text-gray-400">Entreprise: {i.nom_entreprise || "-"}</div>
                    <div className="text-sm text-gray-400">Inscrit le: {formatDate(i.created_at)}</div>
                    <button onClick={() => toggleIcr(i.id_icr, i.user?.statut ?? false)} className="mt-2 px-3 py-1 rounded text-sm bg-red-500/80 text-white">
                      {i.user?.statut ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESPONSABLES TAB */}
        {activeTab === "responsables" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">➕ Nouveau responsable dépôt</h2>
              <form onSubmit={handleCreateResponsable} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Nom *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newResponsable.nom} onChange={(e) => setNewResponsable({...newResponsable, nom: e.target.value})} required />
                  <input type="text" placeholder="Prénom *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newResponsable.prenom} onChange={(e) => setNewResponsable({...newResponsable, prenom: e.target.value})} required />
                </div>
                <input type="email" placeholder="Email *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newResponsable.email} onChange={(e) => setNewResponsable({...newResponsable, email: e.target.value})} required />
                <input type="password" placeholder="Mot de passe *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newResponsable.password} onChange={(e) => setNewResponsable({...newResponsable, password: e.target.value})} required />
                <input type="tel" placeholder="Téléphone *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newResponsable.telephone} onChange={(e) => setNewResponsable({...newResponsable, telephone: e.target.value})} required />
                <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-semibold py-2 rounded-lg">Créer</button>
              </form>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">📋 Responsables</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {responsables.map((r) => (
                  <div key={r.id_responsable} className="border border-white/10 rounded-lg p-3">
                    <div className="font-semibold">{r.user?.prenom} {r.user?.nom}</div>
                    <div className="text-sm text-gray-400">Email: {r.user?.email}</div>
                    <div className="text-sm text-gray-400">Téléphone: {r.user?.telephone || "-"}</div>
                    {r.depot && (
                      <>
                        <div className="text-sm text-gray-400">Dépôt géré: {r.depot.nom}</div>
                        <div className="text-sm text-gray-400">Localisation: {r.depot.localisation}</div>
                      </>
                    )}
                    <div className="text-sm text-gray-400">Inscrit le: {formatDate(r.created_at)}</div>
                    <button onClick={() => toggleResponsable(r.id_responsable, r.user?.statut ?? false)} className="mt-2 px-3 py-1 rounded text-sm bg-red-500/80 text-white">
                      {r.user?.statut ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DEPOTS TAB */}
        {activeTab === "depots" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire création dépôt avec responsable */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">➕ Nouveau dépôt</h2>
              <form onSubmit={handleCreateDepot} className="space-y-3">
                <input type="text" placeholder="Nom du dépôt *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newDepot.nom} onChange={(e) => setNewDepot({...newDepot, nom: e.target.value})} required />
                <input type="text" placeholder="Localisation *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newDepot.localisation} onChange={(e) => setNewDepot({...newDepot, localisation: e.target.value})} required />
                <select
                  className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  value={newDepot.id_responsable || ""}
                  onChange={(e) => setNewDepot({...newDepot, id_responsable: e.target.value ? parseInt(e.target.value) : undefined})}
                  required
                >
                  <option value="">Choisir un responsable *</option>
                  {responsables.map((r) => (
                    <option key={r.id_responsable} value={r.id_responsable}>
                      {r.user?.prenom} {r.user?.nom}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-semibold py-2 rounded-lg">Créer</button>
              </form>
            </div>

            {/* Formulaire changement responsable */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">🔗 Changer le responsable</h2>
              <form onSubmit={handleChangerResponsable} className="space-y-3">
                <select className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={affectation.id_depot} onChange={(e) => setAffectation({...affectation, id_depot: e.target.value})} required>
                  <option value="">Choisir un dépôt</option>
                  {depots.map((d) => (
                    <option key={d.id_depot} value={d.id_depot}>{d.nom}</option>
                  ))}
                </select>
                <select className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={affectation.id_responsable} onChange={(e) => setAffectation({...affectation, id_responsable: e.target.value})} required>
                  <option value="">Choisir un responsable</option>
                  {responsables.map((r) => (
                    <option key={r.id_responsable} value={r.id_responsable}>{r.user?.prenom} {r.user?.nom}</option>
                  ))}
                </select>
                <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg">Changer</button>
              </form>
            </div>

            {/* Liste des dépôts */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">📋 Liste des dépôts</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {depots.map((d) => (
                  <div key={d.id_depot} className="border border-white/10 rounded-lg p-3">
                    <div className="font-semibold">{d.nom}</div>
                    <div className="text-sm text-gray-400">{d.localisation}</div>
                    <div className="text-sm text-gray-400">Responsable: {d.responsable?.user?.prenom} {d.responsable?.user?.nom || "Non affecté"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRIX TAB */}
                {/* DEPOTS TAB */}
        {activeTab === "depots" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire création dépôt avec responsable */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">➕ Nouveau dépôt</h2>
              <form onSubmit={handleCreateDepot} className="space-y-3">
                <input type="text" placeholder="Nom du dépôt *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newDepot.nom} onChange={(e) => setNewDepot({...newDepot, nom: e.target.value})} required />
                <input type="text" placeholder="Localisation *" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={newDepot.localisation} onChange={(e) => setNewDepot({...newDepot, localisation: e.target.value})} required />
                <select
                  className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  value={newDepot.id_responsable || ""}
                  onChange={(e) => setNewDepot({...newDepot, id_responsable: e.target.value ? parseInt(e.target.value) : undefined})}
                  required
                >
                  <option value="">Choisir un responsable *</option>
                  {responsables.map((r) => (
                    <option key={r.id_responsable} value={r.id_responsable}>
                      {r.user?.prenom} {r.user?.nom}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-semibold py-2 rounded-lg">Créer</button>
              </form>
            </div>

            {/* Formulaire changement responsable */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">🔗 Changer le responsable</h2>
              <form onSubmit={handleChangerResponsable} className="space-y-3">
                <select className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={affectation.id_depot} onChange={(e) => setAffectation({...affectation, id_depot: e.target.value})} required>
                  <option value="">Choisir un dépôt</option>
                  {depots.map((d) => (
                    <option key={d.id_depot} value={d.id_depot}>{d.nom}</option>
                  ))}
                </select>
                <select className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={affectation.id_responsable} onChange={(e) => setAffectation({...affectation, id_responsable: e.target.value})} required>
                  <option value="">Choisir un responsable</option>
                  {responsables.map((r) => (
                    <option key={r.id_responsable} value={r.id_responsable}>{r.user?.prenom} {r.user?.nom}</option>
                  ))}
                </select>
                <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg">Changer</button>
              </form>
            </div>

            {/* Liste des dépôts */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">📋 Liste des dépôts</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {depots.map((d) => (
                  <div key={d.id_depot} className="border border-white/10 rounded-lg p-3">
                    <div className="font-semibold">{d.nom}</div>
                    <div className="text-sm text-gray-400">{d.localisation}</div>
                    <div className="text-sm text-gray-400">Responsable: {d.responsable?.user?.prenom} {d.responsable?.user?.nom || "Non affecté"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRIX TAB */}
        {activeTab === "prix" && (
          <div className="max-w-md mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-orange-400">💰 Fixer les prix</h2>
              <form onSubmit={handleFixerPrix} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-300">Essence (FCFA/L)</label>
                  <input type="number" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={prixForm.essence} onChange={(e) => setPrixForm({...prixForm, essence: parseInt(e.target.value)})} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-300">Gasoil (FCFA/L)</label>
                  <input type="number" className="w-full p-2 rounded-lg bg-black/50 border border-white/10 text-white" value={prixForm.gasoil} onChange={(e) => setPrixForm({...prixForm, gasoil: parseInt(e.target.value)})} required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-semibold py-2 rounded-lg">Fixer les prix</button>
              </form>
              <div className="mt-6 pt-4 border-t border-white/10">
                <h3 className="font-semibold mb-2 text-gray-300">Prix actuels</h3>
                <div className="flex justify-between"><span>Essence:</span><span className="font-bold text-orange-400">{prix.essence} FCFA/L</span></div>
                <div className="flex justify-between mt-1"><span>Gasoil:</span><span className="font-bold text-orange-400">{prix.gasoil} FCFA/L</span></div>
              </div>
            </div>
          </div>
        )}

      </div>  
    </div>   
  );        
}          