"use client"

import { motion } from "framer-motion"
import { 
  Fuel, 
  MapPin, 
  Truck, 
  Smartphone, 
  Wifi, 
  ArrowRight,
  Play,
  BarChart3,
  Shield,
  Zap
} from "lucide-react"

const floatingCards = [
  {
    icon: BarChart3,
    label: "Stock en temps réel",
    value: "15,420 L",
    color: "from-[#ff6b00] to-[#ff8533]",
    position: "top-32 left-[5%]",
    delay: 0.2,
  },
  {
    icon: Shield,
    label: "Livraison sécurisée",
    value: "100%",
    color: "from-[#008751] to-[#00a863]",
    position: "top-48 right-[8%]",
    delay: 0.4,
  },
  {
    icon: Smartphone,
    label: "Paiement mobile",
    value: "Orange Money",
    color: "from-[#ff6b00] to-[#ff8533]",
    position: "bottom-48 left-[10%]",
    delay: 0.6,
  },
  {
    icon: MapPin,
    label: "GPS actif",
    value: "Bamako",
    color: "from-[#0f172a] to-[#1e293b]",
    position: "bottom-32 right-[5%]",
    delay: 0.8,
  },
]

export function Hero() {
  return (
    <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[#050505]">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        
        {/* Animated grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,107,0,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,107,0,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff6b00]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[#008751]/5 rounded-full blur-[100px]" />
      </div>

      {/* Floating Cards */}
      <div className="absolute inset-0 hidden lg:block">
        {floatingCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.6 }}
            className={`absolute ${card.position}`}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
              className="glass rounded-2xl p-4 min-w-[180px]"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-[#a3a3a3] mb-1">{card.label}</p>
              <p className="text-lg font-bold text-[#f5f5f5]">{card.value}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#008751] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#008751]" />
            </span>
            <span className="text-sm text-[#a3a3a3]">
              Plateforme en ligne • <span className="text-[#008751]">Mali</span>
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-[#f5f5f5]">Le carburant</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] via-[#ff8533] to-[#ff6b00] text-glow-orange">
              intelligent du Mali
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg sm:text-xl text-[#a3a3a3] mb-10 leading-relaxed"
          >
            Une plateforme numérique qui sécurise, suit et optimise toute la chaîne 
            d&apos;approvisionnement en carburant au Mali en temps réel.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] rounded-full font-semibold text-[#050505] overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(255,107,0,0.4)]">
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Fuel className="w-5 h-5" />
                Réserver du carburant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button className="group w-full sm:w-auto px-8 py-4 glass rounded-full font-semibold text-[#f5f5f5] hover:border-[#ff6b00]/50 transition-all flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#ff6b00]/20 flex items-center justify-center">
                <Play className="w-4 h-4 text-[#ff6b00] fill-[#ff6b00]" />
              </div>
              Suivre une livraison
            </button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { icon: Fuel, value: "150+", label: "Stations actives" },
              { icon: Truck, value: "500+", label: "Livraisons/jour" },
              { icon: MapPin, value: "8", label: "Régions couvertes" },
              { icon: Wifi, value: "99.9%", label: "Disponibilité" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="glass rounded-2xl p-4 sm:p-6 text-center"
              >
                <stat.icon className="w-6 h-6 text-[#ff6b00] mx-auto mb-2" />
                <p className="text-2xl sm:text-3xl font-bold text-[#f5f5f5]">{stat.value}</p>
                <p className="text-xs sm:text-sm text-[#a3a3a3]">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Visual Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
            <div className="relative glass rounded-3xl p-2 sm:p-4 max-w-5xl mx-auto overflow-hidden border border-[#262626]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b00]/5 to-[#008751]/5" />
              <div className="relative bg-[#0a0a0a] rounded-2xl p-6 sm:p-8">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff8533] flex items-center justify-center">
                      <Zap className="w-5 h-5 text-[#050505]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#f5f5f5]">Dashboard Principal</p>
                      <p className="text-xs text-[#a3a3a3]">Vue en temps réel</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#008751]" />
                    <span className="text-xs text-[#a3a3a3]">En ligne</span>
                  </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Carburant distribué", value: "2.5M L", change: "+12%" },
                    { label: "Camions actifs", value: "45", change: "+5" },
                    { label: "Commandes", value: "1,234", change: "+89" },
                    { label: "Revenus", value: "890M", change: "+23%" },
                  ].map((item, index) => (
                    <div key={index} className="glass-light rounded-xl p-4">
                      <p className="text-xs text-[#a3a3a3] mb-1">{item.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#f5f5f5]">{item.value}</p>
                      <p className="text-xs text-[#008751]">{item.change}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-[#262626] flex items-start justify-center p-1"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-[#ff6b00] rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
