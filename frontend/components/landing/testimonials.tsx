"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Amadou Diallo",
    role: "Gérant de station",
    location: "Bamako",
    avatar: "AD",
    rating: 5,
    text: "Anw Ka Ta Djì a révolutionné ma façon de gérer ma station. Le suivi des stocks en temps réel m'évite les ruptures et mes clients sont satisfaits.",
    gradient: "from-[#ff6b00] to-[#ff8533]",
  },
  {
    name: "Fatoumata Traoré",
    role: "Consommatrice",
    location: "Ségou",
    avatar: "FT",
    rating: 5,
    text: "Plus besoin de faire la queue pendant des heures ! Je réserve mon carburant depuis mon téléphone et je paie avec Orange Money. C'est tellement pratique.",
    gradient: "from-[#008751] to-[#00a863]",
  },
  {
    name: "Ibrahim Coulibaly",
    role: "Chauffeur-livreur",
    location: "Sikasso",
    avatar: "IC",
    rating: 5,
    text: "Le GPS intégré et les signatures électroniques ont simplifié mes livraisons. Tout est tracé et sécurisé. Mon travail est beaucoup plus efficace.",
    gradient: "from-[#0f172a] to-[#1e293b]",
  },
  {
    name: "Mariam Keita",
    role: "Responsable ICR",
    location: "Mopti",
    avatar: "MK",
    rating: 5,
    text: "La plateforme nous permet de coordonner toutes les missions de livraison efficacement. Les rapports automatiques sont un gain de temps énorme.",
    gradient: "from-[#ff6b00] to-[#ff8533]",
  },
  {
    name: "Oumar Sangaré",
    role: "Pompiste",
    location: "Kayes",
    avatar: "OS",
    rating: 5,
    text: "Le mode hors-ligne est indispensable dans notre région. Je peux continuer à servir les clients même sans internet. Excellente application !",
    gradient: "from-[#008751] to-[#00a863]",
  },
  {
    name: "Aissata Bah",
    role: "Gérante de dépôt",
    location: "Koulikoro",
    avatar: "AB",
    rating: 5,
    text: "La vérification par code sécurisé a éliminé toute possibilité de fraude. Notre dépôt fonctionne maintenant avec une transparence totale.",
    gradient: "from-[#0f172a] to-[#1e293b]",
  },
]

export function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="temoignages" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050505]">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#008751]/5 rounded-full blur-[150px]" />
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
            Témoignages
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f5f5f5] mb-6">
            Ce que disent
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#008751]"> nos utilisateurs</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[#a3a3a3]">
            Des milliers de Maliens font confiance à Anw Ka Ta Djì pour leur approvisionnement en carburant
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b00]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              <div className="relative glass rounded-2xl p-6 h-full border border-[#262626] group-hover:border-[#ff6b00]/30 transition-all">
                {/* Quote Icon */}
                <div className="absolute top-4 right-4 opacity-10">
                  <Quote className="w-12 h-12 text-[#ff6b00]" />
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#ff6b00] text-[#ff6b00]" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-[#a3a3a3] mb-6 leading-relaxed text-sm">
                  &quot;{testimonial.text}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-[#f5f5f5]">{testimonial.name}</p>
                    <p className="text-xs text-[#a3a3a3]">{testimonial.role} • {testimonial.location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-[#a3a3a3] mb-6">Ils nous font confiance</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            {['TOTAL', 'SHELL', 'ORYX', 'YARAOIL', 'PETROBAMBA'].map((brand, index) => (
              <span key={index} className="text-xl font-bold text-[#a3a3a3] tracking-wider">
                {brand}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
