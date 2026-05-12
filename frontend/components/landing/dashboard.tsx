"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { 
  Fuel, 
  Truck, 
  TrendingUp, 
  Users, 
  MapPin,
  Activity,
  ArrowUpRight
} from "lucide-react"

const stats = [
  {
    icon: Fuel,
    label: "Stations actives",
    value: 156,
    suffix: "",
    change: "+12",
    color: "#ff6b00",
  },
  {
    icon: Truck,
    label: "Livraisons effectuées",
    value: 2847,
    suffix: "",
    change: "+89",
    color: "#008751",
  },
  {
    icon: Activity,
    label: "Litres distribués",
    value: 4.2,
    suffix: "M",
    change: "+15%",
    color: "#ff6b00",
  },
  {
    icon: Users,
    label: "Réservations",
    value: 1234,
    suffix: "",
    change: "+156",
    color: "#008751",
  },
  {
    icon: MapPin,
    label: "Camions connectés",
    value: 78,
    suffix: "",
    change: "+5",
    color: "#ff6b00",
  },
]

function AnimatedCounter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    let start = 0
    const end = value
    const increment = end / (duration * 60)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start * 10) / 10)
      }
    }, 1000 / 60)

    return () => clearInterval(timer)
  }, [isInView, value, duration])

  return (
    <span ref={ref}>
      {count % 1 === 0 ? count.toLocaleString() : count.toFixed(1)}{suffix}
    </span>
  )
}

export function Dashboard() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050505]">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#ff6b00]/5 rounded-full blur-[150px]" />
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
            Tableau de bord
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f5f5f5] mb-6">
            Analytics en
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#008751]"> temps réel</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[#a3a3a3]">
            Suivez les performances de votre réseau de distribution en un coup d&apos;œil
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="glass rounded-2xl p-6 border border-[#262626] hover:border-[#ff6b00]/30 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#008751]/20 text-[#008751] text-xs">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              <p className="text-3xl font-bold text-[#f5f5f5] mb-1">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-[#a3a3a3]">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
          
          <div className="glass rounded-3xl p-4 sm:p-6 border border-[#262626] overflow-hidden">
            <div className="bg-[#0a0a0a] rounded-2xl p-4 sm:p-8">
              {/* Dashboard Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff8533] flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#050505]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#f5f5f5]">Vue nationale</h3>
                    <p className="text-sm text-[#a3a3a3]">Mise à jour il y a 2 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#008751] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#008751]" />
                  </span>
                  <span className="text-sm text-[#a3a3a3]">Données en direct</span>
                </div>
              </div>

              {/* Chart Area Placeholder */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 glass-light rounded-xl p-6 h-64">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-[#f5f5f5]">Distribution mensuelle</h4>
                    <span className="text-xs text-[#a3a3a3]">Litres (millions)</span>
                  </div>
                  <div className="h-full flex items-end gap-2 pb-8">
                    {[65, 78, 52, 91, 85, 73, 98, 67, 82, 95, 88, 100].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={isInView ? { height: `${height}%` } : {}}
                        transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                        className="flex-1 bg-gradient-to-t from-[#ff6b00] to-[#ff6b00]/30 rounded-t-lg"
                      />
                    ))}
                  </div>
                </div>

                {/* Side Stats */}
                <div className="space-y-4">
                  {[
                    { label: "Taux de satisfaction", value: "98.5%", trend: "up" },
                    { label: "Temps moyen livraison", value: "2.4h", trend: "down" },
                    { label: "Efficacité réseau", value: "94%", trend: "up" },
                  ].map((item, index) => (
                    <div key={index} className="glass-light rounded-xl p-4">
                      <p className="text-xs text-[#a3a3a3] mb-1">{item.label}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-[#f5f5f5]">{item.value}</p>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          item.trend === 'up' ? 'bg-[#008751]/20' : 'bg-[#ff6b00]/20'
                        }`}>
                          <ArrowUpRight className={`w-4 h-4 ${
                            item.trend === 'up' ? 'text-[#008751]' : 'text-[#ff6b00] rotate-90'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
