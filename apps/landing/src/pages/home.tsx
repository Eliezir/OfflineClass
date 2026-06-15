import { Hero } from '@/components/sections/hero'
import { Features } from '@/components/sections/features'
import { Interactive } from '@/components/sections/interactive'
import { HowItWorks } from '@/components/sections/how-it-works'
import { Team } from '@/components/sections/team'
import { HomeCTA } from '@/components/sections/home-cta'

export function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Interactive />
      <HowItWorks />
      <Team />
      <HomeCTA />
    </>
  )
}
