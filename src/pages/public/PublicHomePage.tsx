import { BookingPreviewSection } from './components/BookingPreviewSection'
import { BranchesSection } from './components/BranchesSection'
import { HeroSection } from './components/HeroSection'
import { LoyaltySection } from './components/LoyaltySection'
import { ProcessSection } from './components/ProcessSection'
import { PublicHeader } from './components/PublicHeader'
import { ServicesSection } from './components/ServicesSection'

export function PublicHomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PublicHeader />
      <HeroSection />
      <BookingPreviewSection />
      <ServicesSection />
      <ProcessSection />
      <LoyaltySection />
      <BranchesSection />
    </main>
  )
}
