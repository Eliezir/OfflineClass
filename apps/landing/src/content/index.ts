import siteData from './site.json'
import docsData from './docs.json'

export type Accent = 'primary' | 'secondary' | 'tertiary' | 'quaternary'

export type DemoLang = 'pt' | 'en'

export interface DemoCover {
  kind: 'cover'
  pt: { kicker: string; title: string; subtitle: string }
  en: { kicker: string; title: string; subtitle: string }
}
export interface DemoPoints {
  kind: 'points'
  pt: { title: string; points: string[] }
  en: { title: string; points: string[] }
}
export interface DemoQuiz {
  kind: 'quiz'
  pt: { title: string; question: string; options: string[]; answer: number; correct: string; wrong: string }
  en: { title: string; question: string; options: string[]; answer: number; correct: string; wrong: string }
}
export type DemoSlide = DemoCover | DemoPoints | DemoQuiz
export interface Demo {
  hint: string
  slides: DemoSlide[]
}

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
  featuredDemo: { title: string; url: string }
  nav: { label: string; to: string }[]
  stats: { value: number | string; suffix?: string; label: string }[]
  features: { accent: string; icon: string; title: string; body: string; span?: string }[]
  interactive: { icon: string; title: string; body: string; points?: string[] }[]
  demo: Demo
  steps: { n: string; title: string; body: string }[]
  examples: { title: string; tag: string; image: string; href: string }[]
  platforms: { id: string; label: string; icon: string; match: string[] }[]
  stack: string[]
  team: { name: string; github: string }[]
  advisor: string
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
