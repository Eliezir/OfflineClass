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
  platforms: { id: string; label: string; icon: string; match: string[] }[]
  stack: string[]
  team: { name: string; github: string }[]
  advisor?: string
  course: string
  footerNote: string
}

export interface Docs {
  intro: string
  sections: {
    id: string
    title: string
    articles: { id: string; title: string; body: string[] }[]
  }[]
}

export const site = siteData as Site
export const docs = docsData as Docs
