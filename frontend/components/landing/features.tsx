"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { 
  FileCheck, 
  ShieldCheck, 
  MapPin, 
  BarChart3, 
  Calendar,
  Smartphone,
  WifiOff,
  PenTool,
  Bell,
  FileBarChart
} from "lucide-react"

const features = [
  {
    icon: FileCheck,
    title: "Gestion des bons d'enlèvement",
    description: "Créez, validez et suivez tous vos bons d'enlèvement de manière digitale et sécurisée.",
    gradient: "from-[#ff6b00] to-[#ff8533]",
  },
  {
    icon: ShieldCheck,
    title: "Vérification par code sécurisé",
    description: "Authentification à deux facteurs avec codes uniques pour chaque transaction.",
    gradient: "from-[#008751] to-[#00a863]",
  },
  {
    icon: MapPin,
    title: "Suivi GPS des camions",
    description: "Localisez en temps réel chaque camion-citerne sur tout le territoire malien.",
    gradient: "from-[#ff6b00] to-[#ff8533]",
  },
  {
    icon: BarChart3,
    title: "Gestion des stocks",
    description: "Surveillez les niveaux de stock dans chaque dépôt et station en temps réel.",
    gradient: "from-[#0f172a] to-[#1e293b]",
  },
  {
    icon: Calendar,
    title: "Réservation de carburant",
    description: "Permettez aux clients de réserver leur carburant à l'avance sans attente.",
    gradient: "from-[#008751] to-[#00a863]",
  },
  {
    icon: Smartphone,
    title: "Paiement mobile",
    description: "Intégration Orange Money, Moov Money et Wave pour des paiements instantanés.",
    gradient: "from-[#ff6b00] to-[#ff8533]",
  },
  {
    icon: WifiOff,
    title: "Mode hors-ligne",
    description: "Continuez à travailler même sans connexion internet, synchronisation automatique.",
    gradient: "from-[#0f172a] to-[#1e293b]",
  },
  {
    icon: PenTool,
    title: "Signatures électroniques",
    description: "Validez les documents avec des signatures électroniques légalement reconnues.",
    gradient: "from-[#008751] to-[#00a863]",
  },
  {
    icon: Bell,
    title: "Alertes automatiques",
    description: "Notifications instantanées pour les stocks bas, livraisons et anomalies.",
    gradient: "from-[#ff6b00] to-[#ff8533]",
  },
  {
    icon: FileBarChart,
    title: "Rapports intelligents",
    description: "Générez des rapports détaillés et analyses pour optimiser vos opérations.",
    gradient: "from-[#0f172a] to-[#1e293b]",
  },
]

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="fonctionnalites" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050505]">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#ff6b00]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[#008751]/5 rounded-full blur-[150px]" />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full glass text-sm text-[#ff6b00] font-medium mb-6">
            Fonctionnalités
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f5f5f5] mb-6">
            Une plateforme
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8533]">
              complète et puissante
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[#a3a3a3]">
            Découvrez toutes les fonctionnalités qui font d&apos;Anw Ka Ta Djì 
            la solution de référence pour la gestion du carburant au Mali
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b00]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative glass rounded-2xl p-6 h-full border border-[#262626] group-hover:border-[#ff6b00]/30 transition-all duration-500">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] transition-all duration-500`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2 group-hover:text-[#ff6b00] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff6b00] to-transparent group-hover:w-3/4 transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
