"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { MapPin, Fuel, AlertTriangle, Navigation } from "lucide-react"

const stations = [
  { name: "Bamako Centre", status: "available", x: 30, y: 65, fuel: "85%" },
  { name: "Sikasso", status: "available", x: 55, y: 85, fuel: "72%" },
  { name: "Ségou", status: "available", x: 45, y: 55, fuel: "91%" },
  { name: "Mopti", status: "low", x: 55, y: 45, fuel: "25%" },
  { name: "Kayes", status: "available", x: 15, y: 55, fuel: "68%" },
  { name: "Koulikoro", status: "available", x: 35, y: 58, fuel: "79%" },
  { name: "Gao", status: "low", x: 75, y: 35, fuel: "15%" },
  { name: "Tombouctou", status: "available", x: 55, y: 25, fuel: "54%" },
  { name: "Kidal", status: "available", x: 80, y: 20, fuel: "45%" },
]

export function MapSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="stations" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <div className="absolute inset-0 gradient-mesh opacity-20" />
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
            Couverture nationale
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f5f5f5] mb-6">
            Stations à travers
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#008751]"> le Mali</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[#a3a3a3]">
            Visualisez en temps réel la disponibilité du carburant dans toutes nos stations
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="relative glass rounded-3xl p-4 sm:p-8 border border-[#262626] overflow-hidden">
              {/* Mali Map Simplified SVG */}
              <div className="relative aspect-[4/3] bg-[#0a0a0a] rounded-2xl overflow-hidden">
                {/* Grid overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage: `linear-gradient(#ff6b00 1px, transparent 1px),
                                    linear-gradient(90deg, #ff6b00 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                  }}
                />
                
                {/* Mali outline glow */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Simplified Mali shape */}
                  <path
                    d="M10 45 L15 35 L25 30 L35 25 L50 20 L65 18 L80 15 L90 20 L85 35 L75 45 L70 55 L60 65 L55 75 L45 85 L35 80 L25 70 L15 60 Z"
                    fill="none"
                    stroke="#ff6b00"
                    strokeWidth="0.5"
                    opacity="0.3"
                    filter="url(#glow)"
                  />
                  <path
                    d="M10 45 L15 35 L25 30 L35 25 L50 20 L65 18 L80 15 L90 20 L85 35 L75 45 L70 55 L60 65 L55 75 L45 85 L35 80 L25 70 L15 60 Z"
                    fill="#ff6b00"
                    opacity="0.03"
                  />
                </svg>

                {/* Station pins */}
                {stations.map((station, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    className="absolute group cursor-pointer"
                    style={{ left: `${station.x}%`, top: `${station.y}%` }}
                  >
                    {/* Pulse ring for low stock */}
                    {station.status === 'low' && (
                      <span className="absolute inset-0 -m-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-40" />
                      </span>
                    )}
                    
                    {/* Pin */}
                    <div className={`relative w-4 h-4 rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-150 ${
                      station.status === 'available' 
                        ? 'bg-[#008751] shadow-[0_0_15px_rgba(0,135,81,0.5)]' 
                        : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    }`}>
                      <MapPin className="w-2 h-2 text-white" />
                    </div>

                    {/* Tooltip */}
                    <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="glass rounded-lg px-3 py-2 whitespace-nowrap">
                        <p className="text-xs font-medium text-[#f5f5f5]">{station.name}</p>
                        <p className={`text-xs ${station.status === 'available' ? 'text-[#008751]' : 'text-red-400'}`}>
                          Stock: {station.fuel}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Legend & Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Legend */}
            <div className="glass rounded-2xl p-6 border border-[#262626]">
              <h3 className="text-lg font-semibold text-[#f5f5f5] mb-4">Légende</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#008751] shadow-[0_0_10px_rgba(0,135,81,0.5)]" />
                  <span className="text-sm text-[#a3a3a3]">Stock disponible</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <span className="text-sm text-[#a3a3a3]">Stock faible / Rupture</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-2xl p-6 border border-[#262626]">
              <h3 className="text-lg font-semibold text-[#f5f5f5] mb-4">Statistiques</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#008751]/20 flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-[#008751]" />
                    </div>
                    <span className="text-sm text-[#a3a3a3]">Disponibles</span>
                  </div>
                  <span className="text-xl font-bold text-[#008751]">7</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-sm text-[#a3a3a3]">Stock faible</span>
                  </div>
                  <span className="text-xl font-bold text-red-500">2</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button className="w-full glass rounded-2xl p-6 border border-[#262626] hover:border-[#ff6b00]/30 transition-all group">
              <div className="flex items-center justify-center gap-3">
                <Navigation className="w-5 h-5 text-[#ff6b00]" />
                <span className="text-[#f5f5f5] font-medium group-hover:text-[#ff6b00] transition-colors">
                  Trouver la station la plus proche
                </span>
              </div>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
