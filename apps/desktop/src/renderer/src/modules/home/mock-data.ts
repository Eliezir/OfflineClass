import type { Presentation, SlideModel, VisualModel } from './types'

export const allSlideModels: SlideModel[] = [
  {
    id: '1',
    name: 'Pitch de produto',
    slides: 8,
    features: ['theme', 'zoom', 'animations'],
    tone: 'primary'
  },
  {
    id: '2',
    name: 'Aula expositiva',
    slides: 12,
    features: ['theme', 'quiz', 'notes'],
    tone: 'quaternary'
  },
  {
    id: '3',
    name: 'Relatório executivo',
    slides: 6,
    features: ['theme', 'translation', 'zoom'],
    tone: 'tertiary'
  },
  {
    id: '4',
    name: 'Defesa de TCC',
    slides: 14,
    features: ['notes', 'zoom', 'animations', 'theme'],
    tone: 'secondary'
  },
  {
    id: '5',
    name: 'Estudo de caso',
    slides: 9,
    features: ['quiz', 'translation'],
    tone: 'primary'
  }
]

export const placeholderVisualModel: VisualModel = {
  id: 'placeholder',
  name: 'Tema',
  colors: ['#000000', '#000000', '#000000', '#000000'],
  fonts: ['—'],
  font: 'sans',
  modes: ['light'],
  assets: []
}

export const allPresentations: Presentation[] = [
  {
    id: '1',
    title: 'Heurísticas de Nielsen no Spotify',
    subject: 'IHC · Avaliação heurística',
    visualModel: 'Editorial',
    modifiedAt: 'há 2 horas',
    tone: 'primary'
  },
  {
    id: '2',
    title: 'Princípios SOLID',
    subject: 'POO · Boas práticas',
    visualModel: 'Minimalist',
    modifiedAt: 'ontem',
    tone: 'quaternary'
  },
  {
    id: '3',
    title: 'Algoritmos de Ordenação',
    subject: 'DSA · Análise de complexidade',
    visualModel: 'Dark Mono',
    modifiedAt: 'há 3 dias',
    tone: 'secondary'
  },
  {
    id: '4',
    title: 'Arquitetura MVC',
    subject: 'POO · Arquitetura de software',
    visualModel: 'Default',
    modifiedAt: 'há 5 dias',
    tone: 'tertiary'
  },
  {
    id: '5',
    title: 'Percurso Cognitivo no ADT Studio',
    subject: 'IHC · Inspeção de usabilidade',
    visualModel: 'Editorial',
    modifiedAt: 'há 1 semana',
    tone: 'primary'
  },
  {
    id: '6',
    title: 'Padrão Strategy na prática',
    subject: 'POO · Padrões de projeto',
    visualModel: 'Minimalist',
    modifiedAt: 'há 2 semanas',
    tone: 'quaternary'
  },
  {
    id: '7',
    title: 'Complexidade de Big-O',
    subject: 'DSA · Análise assintótica',
    visualModel: 'Dark Mono',
    modifiedAt: 'há 3 semanas',
    tone: 'secondary'
  },
  {
    id: '8',
    title: 'Normalização de Bancos de Dados',
    subject: 'BD · Modelagem relacional',
    visualModel: 'Default',
    modifiedAt: 'há 1 mês',
    tone: 'tertiary'
  }
]

export const allVisualModels: VisualModel[] = [
  {
    id: '1',
    name: 'Editorial',
    colors: ['#FAF7F2', '#2A2440', '#7C3AED', '#E11D48'],
    fonts: ['Lora', 'Inter'],
    font: 'serif',
    modes: ['light', 'dark'],
    assets: [
      { label: 'Imagens', count: 6 },
      { label: 'Logos', count: 2 },
      { label: 'Fundos', count: 3 }
    ]
  },
  {
    id: '2',
    name: 'Minimalist',
    colors: ['#FFFFFF', '#D9D5E4', '#6B6580', '#111827'],
    fonts: ['Inter'],
    font: 'sans',
    modes: ['light', 'dark'],
    assets: [
      { label: 'Imagens', count: 2 },
      { label: 'Ícones', count: 8 }
    ]
  },
  {
    id: '3',
    name: 'Dark Mono',
    colors: ['#1E1A2E', '#A78BFA', '#ECE9F5', '#7C3AED'],
    fonts: ['JetBrains Mono'],
    font: 'mono',
    modes: ['dark'],
    assets: [
      { label: 'Fundos', count: 4 },
      { label: 'Ícones', count: 5 }
    ]
  },
  {
    id: '4',
    name: 'Acadêmico',
    colors: ['#EEF1F7', '#2D3554', '#5B6CA8', '#B45309'],
    fonts: ['Merriweather', 'Inter'],
    font: 'serif',
    modes: ['light'],
    assets: [
      { label: 'Imagens', count: 4 },
      { label: 'Logos', count: 1 },
      { label: 'Diagramas', count: 5 }
    ]
  },
  {
    id: '5',
    name: 'Vibrante',
    colors: ['#7C3AED', '#DB2777', '#F59E0B', '#FFFFFF'],
    fonts: ['Poppins'],
    font: 'sans',
    modes: ['light', 'dark'],
    assets: [
      { label: 'Imagens', count: 5 },
      { label: 'Fundos', count: 3 }
    ]
  },
  {
    id: '6',
    name: 'Clean Slides',
    colors: ['#FFFFFF', '#10B981', '#1F2937', '#E5E7EB'],
    fonts: ['Inter'],
    font: 'sans',
    modes: ['light', 'dark'],
    assets: [
      { label: 'Imagens', count: 4 },
      { label: 'Ícones', count: 6 }
    ]
  }
]
