"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { 
  FileText, 
  ClipboardList, 
  ScanLine, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Fuel,
  User
} from "lucide-react"

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Fournisseur crée un bon",
    description: "Le fournisseur génère un bon d'enlèvement digital avec tous les détails de la commande.",
    color: "#ff6b00",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "ICR organise la mission",
    description: "L'inspecteur de contrôle régional planifie et assigne la mission de livraison.",
    color: "#008751",
  },
  {
    number: "03",
    icon: ScanLine,
    title: "Dépôt vérifie le code",
    description: "Le dépôt scanne et vérifie le code sécurisé avant le chargement du carburant.",
    color: "#ff6b00",
  },
  {
    number: "04",
    icon: Truck,
    title: "Chauffeur charge",
    description: "Le chauffeur charge le carburant et confirme avec sa signature électronique.",
    color: "#008751",
  },
  {
    number: "05",
    icon: MapPin,
    title: "Livraison station",
    description: "Suivi GPS en temps réel jusqu'à la station-service de destination.",
    color: "#ff6b00",
  },
  {
    number: "06",
    icon: CheckCircle2,
    title: "Gérant valide",
    description: "Le gérant de station valide la réception et confirme les quantités.",
    color: "#008751",
  },
  {
    number: "07",
    icon: Fuel,
    title: "Pompiste vend",
    description: "Le pompiste distribue le carburant aux clients avec traçabilité complète.",
    color: "#ff6b00",
  },
  {
    number: "08",
    icon: User,
    title: "Consommateur réserve",
    description: "Les clients peuvent réserver et payer en ligne avant leur arrivée.",
    color: "#008751",
  },
]

export function Process() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="processus" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ff6b00 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
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
            Processus
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f5f5f5] mb-6">
            Comment ça
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#008751]"> marche ?</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[#a3a3a3]">
            Un workflow fluide et sécurisé de bout en bout
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Central Line - Desktop */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#ff6b00] via-[#008751] to-[#ff6b00]" />

          {/* Steps */}
          <div className="space-y-8 lg:space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className={`lg:flex items-center ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Content Card */}
                <div className={`lg:w-[calc(50%-40px)] ${index % 2 === 0 ? 'lg:pr-8 lg:text-right' : 'lg:pl-8'}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass rounded-2xl p-6 border border-[#262626] hover:border-[#ff6b00]/30 transition-all group"
                  >
                    <div className={`flex items-center gap-4 mb-4 ${index % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}>
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${step.color}20` }}
                      >
                        <step.icon className="w-6 h-6" style={{ color: step.color }} />
                      </div>
                      <div>
                        <span className="text-xs font-mono text-[#a3a3a3]">Étape {step.number}</span>
                        <h3 className="text-lg font-semibold text-[#f5f5f5] group-hover:text-[#ff6b00] transition-colors">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-[#a3a3a3] leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                </div>

                {/* Center Node - Desktop */}
                <div className="hidden lg:flex w-20 justify-center relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: index * 0.15 + 0.3 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0a0a0a]"
                    style={{ backgroundColor: step.color }}
                  >
                    <span className="text-xs font-bold text-[#050505]">{step.number}</span>
                  </motion.div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden lg:block lg:w-[calc(50%-40px)]" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
