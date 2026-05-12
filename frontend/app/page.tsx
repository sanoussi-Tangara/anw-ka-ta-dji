import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { ProblemSolution } from "@/components/landing/problem-solution"
import { Features } from "@/components/landing/features"
import { Process } from "@/components/landing/process"
import { Dashboard } from "@/components/landing/dashboard"
import { MapSection } from "@/components/landing/map-section"
import { Testimonials } from "@/components/landing/testimonials"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f5f5] overflow-x-hidden">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <Features />
      <Process />
      <Dashboard />
      <MapSection />
      <Testimonials />
      <Footer />
    </main>
  )
}
