"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { login } from "../../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Récupérer le message directement depuis l'URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Lire l'URL complète
      const fullUrl = window.location.href;
      console.log("📍 URL complète:", fullUrl);
      
      // Extraire le paramètre message
      const match = fullUrl.match(/[?&]message=([^&]+)/);
      console.log("🔍 Match trouvé:", match);
      
      if (match) {
        const decodedMessage = decodeURIComponent(match[1]);
        console.log("📝 Message décodé:", decodedMessage);
        setMessage(decodedMessage);
        
        // Effacer après 8 secondes
        setTimeout(() => setMessage(""), 8000);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await login(email, password);
      
      if (response.redirect_to) {
        window.location.href = response.redirect_to;
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("❌ Erreur login:", err);
      if (err.message?.includes("désactivé") || err.message?.includes("Compte désactivé")) {
        setError("❌ Votre compte a été désactivé. Veuillez contacter l'administrateur.");
      } else {
        setError(err.message || "Email ou mot de passe incorrect");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] flex items-center justify-center px-4 py-8">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 2 }}
          className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#ff6b00] blur-[150px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#008751] blur-[150px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 2, delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#ff6b00] blur-[200px]"
        />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Retour */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 text-sm text-[#f5f5f5]/60 hover:text-[#ff6b00] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour 
          </button>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-10 text-center"
        >
          <motion.h1
            className="text-3xl font-bold tracking-tight text-[#f5f5f5] sm:text-4xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="bg-gradient-to-r from-[#ff6b00] via-[#ff8533] to-[#008751] bg-clip-text text-transparent">
              Anw Ka Ta Djì
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-3 text-sm text-[#f5f5f5]/60 tracking-wide"
          >
            Le carburant intelligent du Mali
          </motion.p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative rounded-2xl border border-white/[0.08] bg-[#111111]/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          style={{
            boxShadow:
              "0 0 50px rgba(255, 107, 0, 0.05), 0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6b00]/30 to-transparent" />

          {/* ✅ MESSAGE DE L'URL (compte désactivé, session expirée) */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mb-4 rounded-lg bg-red-500/20 border-2 border-red-500/60 p-4 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">
                  {message.includes("désactivé") ? "🚫" : "⚠️"}
                </span>
                <span className="text-red-400 font-semibold">
                  {message}
                </span>
              </div>
              {message.includes("désactivé") && (
                <p className="text-red-300/70 text-sm mt-1">
                  Veuillez contacter l'administrateur pour plus d'informations.
                </p>
              )}
            </motion.div>
          )}

          {/* ✅ ERREUR DE CONNEXION */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#f5f5f5]/70"
              >
                Email
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className="h-5 w-5 text-[#f5f5f5]/30 transition-colors group-focus-within:text-[#ff6b00]" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-[#050505]/50 py-3.5 pl-12 pr-4 text-[#f5f5f5] placeholder-[#f5f5f5]/30 transition-all duration-300 focus:border-[#ff6b00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#f5f5f5]/70"
              >
                Mot de passe
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-5 w-5 text-[#f5f5f5]/30 transition-colors group-focus-within:text-[#ff6b00]" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-[#050505]/50 py-3.5 pl-12 pr-12 text-[#f5f5f5] placeholder-[#f5f5f5]/30 transition-all duration-300 focus:border-[#ff6b00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#f5f5f5]/30 transition-colors hover:text-[#ff6b00]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="pt-2"
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ff8533] py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Connexion...</span>
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </span>
              </motion.button>
            </motion.div>
          </form>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#008751]/30 to-transparent"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-8 text-center text-xs text-[#f5f5f5]/30"
        >
          © 2024 Anw Ka Ta Djì. Tous droits réservés.
        </motion.p>
      </motion.div>
    </div>
  );
}