import { createFileRoute } from '@tanstack/react-router'
import { Header } from '~/components/header'
import { HeroSection } from '~/components/hero-section'
import { Footer } from '~/components/footer'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
      </main>
      <Footer />
    </div>
  )
}