import siteData from './site.json'
import docsData from './docs.json'

export type Accent = 'primary' | 'secondary' | 'tertiary' | 'quaternary'

export interface Site {
  repo: { owner: string; name: string }
  product: {
    name: string
    tagline: string
    headline: string
    headlineAccent: string
    rotatingWords: string[]
    lead: string
    eyebrow: string
  }
  nav: { label: string; to: string }[]
  stats: { value: number | string; suffix?: string; label: string }[]
  features: { accent: string; icon: string; title: string; body: string; span?: string }[]
  interactive: { icon: string; title: string; body: string; points?: string[] }[]
  steps: { n: string; title: string; body: string }[]
  underHood: {
    eyebrow: string
    title: string
    description: string
    cards: { icon: string; title: string; body: string; to: string }[]
  }
  platforms: { id: string; label: string; icon: string; match: string[] }[]
  stack: string[]
  team: { name: string; github: string }[]
  advisor?: string
  course: string
  footerNote: string
}

export interface DocArticle {
  id: string
  title: string
  icon: string
  diagram?: string
  /** Pull-quote shown in the visual slot of slides without a diagram. */
  quote?: string
  /** Technologies/libraries behind this feature, shown as chips. */
  tech?: string[]
  body: string[]
  concept: string
}

export interface Docs {
  intro: string
  sections: {
    id: string
    title: string
    /** One-line lead shown on the section's intro slide. */
    lead: string
    articles: DocArticle[]
  }[]
}

export const site = siteData as Site
export const docs = docsData as Docs
