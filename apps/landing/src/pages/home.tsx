import { Hero } from '@/components/sections/hero'
import { Interactive } from '@/components/sections/interactive'
import { FeatureCarousel } from '@/components/sections/feature-carousel'
import { Features } from '@/components/sections/features'
import { HowItWorks } from '@/components/sections/how-it-works'
import { Examples } from '@/components/sections/examples'
import { Team } from '@/components/sections/team'
import { HomeCTA } from '@/components/sections/home-cta'

export function Home() {
  return (
    <>
      <Hero />
      <Interactive />
      <FeatureCarousel />
      <Features />
      <HowItWorks />
      <Examples />
      <Team />
      <HomeCTA />
    </>
  )
}
