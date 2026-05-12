"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Fuel, ChevronRight, XCircle } from "lucide-react"
import Link from "next/link"
import Login from "./login"
import Register from "./register"  // ← Import du composant Register

const navLinks = [
  { href: "#accueil", label: "Accueil" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#processus", label: "Processus" },
  { href: "#stations", label: "Stations" },
  { href: "#temoignages", label: "Témoignages" },
  { href: "#contact", label: "Contact" },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false) // ← Nouvel état

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  // ← Nouvelle fonction pour ouvrir le modal d'inscription
  const handleRegisterClick = () => {
    setIsRegisterModalOpen(true)
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[#050505]/80 backdrop-blur-xl border-b border-[#262626]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="#accueil" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-[#ff6b00] blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#ff6b00] to-[#ff8533] rounded-xl flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-[#050505]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#f5f5f5] tracking-tight">
                  Anw Ka Ta Djì
                </span>
                <span className="text-[10px] text-[#a3a3a3] tracking-widest uppercase">
                  Notre carburant
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#ff6b00] group-hover:w-1/2 transition-all duration-300" />
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={handleLoginClick}
                className="px-5 py-2.5 text-sm font-medium text-[#f5f5f5] hover:text-[#ff6b00] transition-colors cursor-pointer"
              >
                Connexion
              </button>
              {/* Bouton Commencer - ouvre le modal register */}
              <button
                onClick={handleRegisterClick}
                className="group relative px-6 py-2.5 text-sm font-semibold text-[#050505] bg-gradient-to-r from-[#ff6b00] to-[#ff8533] rounded-full overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Commencer
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#f5f5f5] hover:text-[#ff6b00] transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden pt-20"
          >
            <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative h-full flex flex-col p-6"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-4 text-lg text-[#f5f5f5] hover:text-[#ff6b00] hover:bg-[#111111] rounded-xl transition-all"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-auto flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleLoginClick()
                  }}
                  className="w-full py-4 text-center text-[#f5f5f5] border border-[#262626] rounded-xl hover:border-[#ff6b00] transition-colors cursor-pointer"
                >
                  Connexion
                </button>
                {/* Bouton Commencer mobile - ouvre le modal register */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleRegisterClick()
                  }}
                  className="w-full py-4 text-center text-[#050505] bg-gradient-to-r from-[#ff6b00] to-[#ff8533] rounded-xl font-semibold cursor-pointer"
                >
                  Commencer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050505]/90 backdrop-blur-md"
            onClick={() => setIsLoginModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute -top-12 right-0 p-2 text-[#f5f5f5]/60 hover:text-[#ff6b00] transition-colors z-10"
              >
                <XCircle className="w-8 h-8" />
              </button>
              <Login />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register Modal - AJOUTÉ */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050505]/90 backdrop-blur-md"
            onClick={() => setIsRegisterModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="absolute -top-12 right-0 p-2 text-[#f5f5f5]/60 hover:text-[#ff6b00] transition-colors z-10"
              >
                <XCircle className="w-8 h-8" />
              </button>
              <Register />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}