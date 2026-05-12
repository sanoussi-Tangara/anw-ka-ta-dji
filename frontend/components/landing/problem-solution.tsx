"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { 
  FileText, 
  AlertTriangle, 
  TrendingDown, 
  Clock,
  Users,
  Zap,
  Eye,
  MapPin,
  BarChart3,
  Smartphone,
  ArrowRight,
  X,
  Check
} from "lucide-react"

const problemItems = [
  { icon: FileText, text: "Registres papier désorganisés" },
  { icon: TrendingDown, text: "Pertes et gaspillages importants" },
  { icon: AlertTriangle, text: "Fraudes difficiles à détecter" },
  { icon: Clock, text: "Ruptures de stock fréquentes" },
  { icon: Users, text: "Longues files d'attente" },
]

const solutionItems = [
  { icon: Zap, text: "Suivi intelligent en temps réel" },
  { icon: Eye, text: "Transparence totale de la chaîne" },
  { icon: MapPin, text: "Géolocalisation précise" },
  { icon: BarChart3, text: "Stock en temps réel" },
  { icon: Smartphone, text: "Réservation mobile instantanée" },
]

export function ProblemSolution() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050505]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-transparent" />
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
            Pourquoi Anw Ka Ta Djì ?
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f5f5f5] mb-6">
            La transformation digitale
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#008751]">
              du secteur pétrolier
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[#a3a3a3]">
            Découvrez comment nous révolutionnons la gestion du carburant au Mali
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Before Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-3xl blur-xl" />
            <div className="relative glass rounded-3xl p-8 border border-red-500/20 h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <X className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#f5f5f5]">Avant</h3>
                  <p className="text-sm text-[#a3a3a3]">Gestion traditionnelle</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {problemItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a]/50 border border-[#262626]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-[#a3a3a3]">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* After Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#008751]/10 to-[#ff6b00]/5 rounded-3xl blur-xl" />
            <div className="relative glass rounded-3xl p-8 border border-[#008751]/20 h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#008751] to-[#00a863] flex items-center justify-center glow-green">
                  <Check className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#f5f5f5]">Après</h3>
                  <p className="text-sm text-[#a3a3a3]">Avec Anw Ka Ta Djì</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {solutionItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a]/50 border border-[#262626] hover:border-[#008751]/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#008751]/20 to-[#ff6b00]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#008751]" />
                    </div>
                    <span className="text-[#f5f5f5]">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Arrow indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#ff6b00] to-[#008751] flex items-center justify-center glow-orange">
            <ArrowRight className="w-8 h-8 text-[#050505]" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
