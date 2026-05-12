"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Fuel, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Send,
  ArrowRight
} from "lucide-react"

const footerLinks = {
  produit: [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Tarification", href: "#tarifs" },
    { label: "API", href: "#api" },
    { label: "Mobile App", href: "#mobile" },
  ],
  entreprise: [
    { label: "À propos", href: "#apropos" },
    { label: "Carrières", href: "#carrieres" },
    { label: "Presse", href: "#presse" },
    { label: "Partenaires", href: "#partenaires" },
  ],
  ressources: [
    { label: "Documentation", href: "#docs" },
    { label: "Blog", href: "#blog" },
    { label: "Support", href: "#support" },
    { label: "FAQ", href: "#faq" },
  ],
  legal: [
    { label: "Confidentialité", href: "#confidentialite" },
    { label: "Conditions", href: "#conditions" },
    { label: "Cookies", href: "#cookies" },
  ],
}

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Instagram, href: "#", label: "Instagram" },
]

export function Footer() {
  return (
    <footer id="contact" className="relative pt-24 pb-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050505]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mb-16"
        >
          <div className="glass rounded-3xl p-8 sm:p-12 border border-[#262626] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b00]/5 to-[#008751]/5" />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-3">
                  Restez informé
                </h3>
                <p className="text-[#a3a3a3] max-w-md">
                  Inscrivez-vous à notre newsletter pour recevoir les dernières actualités et mises à jour.
                </p>
              </div>
              <div className="w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a3a3a3]" />
                    <input
                      type="email"
                      placeholder="Votre email"
                      className="w-full sm:w-80 pl-12 pr-4 py-4 bg-[#0a0a0a] border border-[#262626] rounded-xl text-[#f5f5f5] placeholder:text-[#666] focus:outline-none focus:border-[#ff6b00]/50 transition-colors"
                    />
                  </div>
                  <button className="group px-6 py-4 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] rounded-xl font-semibold text-[#050505] hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] transition-all flex items-center justify-center gap-2">
                    <Send className="w-5 h-5" />
                    <span>S&apos;inscrire</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="#accueil" className="inline-flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#ff6b00] blur-lg opacity-50" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#ff6b00] to-[#ff8533] rounded-xl flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-[#050505]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#f5f5f5]">Anw Ka Ta Djì</span>
                <span className="text-[10px] text-[#a3a3a3] tracking-widest uppercase">Notre carburant</span>
              </div>
            </Link>
            <p className="text-[#a3a3a3] text-sm mb-6 max-w-xs leading-relaxed">
              La plateforme numérique de référence pour la gestion intelligente du carburant au Mali.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:contact@anwkatadji.ml" className="flex items-center gap-3 text-sm text-[#a3a3a3] hover:text-[#ff6b00] transition-colors">
                <Mail className="w-4 h-4" />
                contact@anwkatadji.ml
              </a>
              <a href="tel:+22370000000" className="flex items-center gap-3 text-sm text-[#a3a3a3] hover:text-[#ff6b00] transition-colors">
                <Phone className="w-4 h-4" />
                +223 70 00 00 00
              </a>
              <div className="flex items-center gap-3 text-sm text-[#a3a3a3]">
                <MapPin className="w-4 h-4" />
                Bamako, Mali
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f5] mb-4">Produit</h4>
            <ul className="space-y-3">
              {footerLinks.produit.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm text-[#a3a3a3] hover:text-[#ff6b00] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f5] mb-4">Entreprise</h4>
            <ul className="space-y-3">
              {footerLinks.entreprise.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm text-[#a3a3a3] hover:text-[#ff6b00] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f5] mb-4">Ressources</h4>
            <ul className="space-y-3">
              {footerLinks.ressources.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm text-[#a3a3a3] hover:text-[#ff6b00] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f5] mb-4">Légal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm text-[#a3a3a3] hover:text-[#ff6b00] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#262626]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#666] text-center md:text-left">
              © 2026 Anw Ka Ta Djì. Tous droits réservés. Fait avec  au Mali.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-[#111] flex items-center justify-center text-[#a3a3a3] hover:text-[#ff6b00] hover:bg-[#ff6b00]/10 transition-all"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Back to top */}
        <motion.button
          whileHover={{ y: -3 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ff8533] flex items-center justify-center text-[#050505] shadow-[0_0_20px_rgba(255,107,0,0.3)] z-50"
        >
          <ArrowRight className="w-5 h-5 -rotate-90" />
        </motion.button>
      </div>
    </footer>
  )
}
