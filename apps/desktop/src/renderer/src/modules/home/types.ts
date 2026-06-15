export type Tone = 'primary' | 'secondary' | 'tertiary' | 'quaternary'

export type Presentation = {
  id: string
  title: string
  subject: string
  visualModel: string
  modifiedAt: string
  tone: Tone
}

/** Capabilities a slide model can ship with. */
export type SlideFeature = 'theme' | 'translation' | 'zoom' | 'quiz' | 'animations' | 'notes'

/** A slide model = a finished deck saved for reuse, with a set of features. */
export type SlideModel = {
  id: string
  name: string
  slides: number
  features: SlideFeature[]
  /** Accent used to color the deck thumbnail. */
  tone: Tone
}

/** A theme = colors + fonts + assets. (`VisualModel` kept as the internal name.) */
export type VisualModel = {
  id: string
  name: string
  /** Palette swatches (hex), shown as the preview strip. */
  colors: string[]
  /** Font names for the label, e.g. ['Lora', 'Inter']. */
  fonts: string[]
  /** Display family used to render the name + the "Aa" sample. */
  font: 'sans' | 'serif' | 'mono'
  /** Which color schemes the theme ships — light, dark, or both. */
  modes: Array<'light' | 'dark'>
  /** Saved assets by category (images, logos…), listed in a popover. */
  assets: Array<{ label: string; count: number }>
}
