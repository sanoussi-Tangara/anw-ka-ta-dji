"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface FormData {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  email: string;
  motDePasse: string;
  confirmMotDePasse: string;
}

interface FormErrors {
  nom?: string;
  prenom?: string;
  telephone?: string;
  adresse?: string;
  email?: string;
  motDePasse?: string;
  confirmMotDePasse?: string;
}

interface RegisterProps {
  onClose?: () => void;
}

export default function Register({ onClose }: RegisterProps) {
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
    email: "",
    motDePasse: "",
    confirmMotDePasse: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est requis";
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = "Le téléphone est requis";
    } else if (!/^[0-9+\s-]{8,}$/.test(formData.telephone)) {
      newErrors.telephone = "Numéro de téléphone invalide";
    }

    if (!formData.adresse.trim()) {
      newErrors.adresse = "L'adresse est requise";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    if (!formData.motDePasse) {
      newErrors.motDePasse = "Le mot de passe est requis";
    } else if (formData.motDePasse.length < 8) {
      newErrors.motDePasse = "Minimum 8 caractères";
    }

    if (!formData.confirmMotDePasse) {
      newErrors.confirmMotDePasse = "Confirmez le mot de passe";
    } else if (formData.motDePasse !== formData.confirmMotDePasse) {
      newErrors.confirmMotDePasse = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      if (onClose) {
        onClose();
      } else {
        window.location.href = "/";
      }
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBackToHome = () => {
    if (onClose) {
      onClose();
    } else {
      window.location.href = "/";
    }
  };

  const formFields = [
    { name: "nom", label: "Nom", type: "text", placeholder: "Votre nom" },
    { name: "prenom", label: "Prénom", type: "text", placeholder: "Votre prénom" },
    { name: "telephone", label: "Téléphone", type: "tel", placeholder: "+223 XX XX XX XX" },
    { name: "adresse", label: "Adresse", type: "text", placeholder: "Votre adresse" },
    { name: "email", label: "Email", type: "email", placeholder: "votre@email.com" },
    { name: "motDePasse", label: "Mot de passe", type: "password", placeholder: "••••••••" },
    { name: "confirmMotDePasse", label: "Confirmation mot de passe", type: "password", placeholder: "••••••••" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden"
      style={{ backgroundColor: "#050505" }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[150px] opacity-30"
          style={{ backgroundColor: "#ff6b00" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: "#008751" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-10"
          style={{ backgroundColor: "#ff6b00" }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 w-full max-w-md sm:max-w-lg"
      >
        {/* Logo & Slogan */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: "#f5f5f5" }}>
            <span style={{ color: "#ff6b00" }}>Anw Ka Ta</span>{" "}
            <span style={{ color: "#008751" }}>Djì</span>
          </h1>
          <p className="text-sm sm:text-base font-light tracking-wide" style={{ color: "#888888" }}>
            Créez votre compte
          </p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 rounded-xl text-center"
              style={{ backgroundColor: "rgba(0, 135, 81, 0.2)", border: "1px solid rgba(0, 135, 81, 0.5)" }}
            >
              <p style={{ color: "#008751" }}>✓ Inscription réussie ! Redirection...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glass Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative rounded-3xl p-6 sm:p-8 backdrop-blur-xl border"
          style={{
            backgroundColor: "rgba(17, 17, 17, 0.7)",
            borderColor: "rgba(255, 107, 0, 0.15)",
            boxShadow: "0 0 60px rgba(255, 107, 0, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {formFields.map((field, index) => (
              <motion.div
                key={field.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.08 }}
              >
                <label
                  htmlFor={field.name}
                  className="block text-xs sm:text-sm font-medium mb-2 transition-colors duration-200"
                  style={{ color: focusedField === field.name ? "#ff6b00" : "#888888" }}
                >
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={formData[field.name as keyof FormData]}
                    onChange={handleChange}
                    onFocus={() => setFocusedField(field.name)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base outline-none transition-all duration-300 placeholder:text-gray-600"
                    style={{
                      backgroundColor: "rgba(5, 5, 5, 0.8)",
                      color: "#f5f5f5",
                      border: errors[field.name as keyof FormErrors]
                        ? "1px solid rgba(239, 68, 68, 0.5)"
                        : focusedField === field.name
                        ? "1px solid rgba(255, 107, 0, 0.5)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow:
                        focusedField === field.name
                          ? "0 0 20px rgba(255, 107, 0, 0.15), 0 0 40px rgba(255, 107, 0, 0.05)"
                          : "none",
                    }}
                  />
                </div>
                <AnimatePresence>
                  {errors[field.name as keyof FormErrors] && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mt-1.5 text-xs"
                      style={{ color: "#ef4444" }}
                    >
                      {errors[field.name as keyof FormErrors]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Submit Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="pt-4"
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 relative overflow-hidden disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #ff6b00 0%, #ff8533 100%)",
                  color: "#050505",
                  boxShadow: "0 0 30px rgba(255, 107, 0, 0.3), 0 10px 40px rgba(255, 107, 0, 0.2)",
                }}
              >
                <span className={`transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}>
                  Créer un compte
                </span>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: "#050505", borderTopColor: "transparent" }}
                    />
                  </div>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Footer Link - Se connecter */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="text-center mt-6 text-sm"
            style={{ color: "#888888" }}
          >
            Déjà inscrit ?{" "}
            <button
              type="button"
              onClick={handleBackToHome}
              className="font-medium transition-colors duration-200 hover:underline"
              style={{ color: "#ff6b00" }}
            >
              Se connecter
            </button>
          </motion.p>
        </motion.div>

        {/* Bouton Retour en bas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="flex justify-center mt-6"
        >
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#f5f5f5]/60 hover:text-[#ff6b00] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </button>
        </motion.div>

        {/* Bottom decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex items-center justify-center mt-4 gap-2"
        >
          <div className="w-8 h-[1px]" style={{ backgroundColor: "rgba(255, 107, 0, 0.3)" }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#008751" }} />
          <div className="w-8 h-[1px]" style={{ backgroundColor: "rgba(0, 135, 81, 0.3)" }} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}