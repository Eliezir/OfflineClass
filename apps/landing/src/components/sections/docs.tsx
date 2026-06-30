import { useState } from 'react'
import { Play } from 'lucide-react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/lib/markdown'
import { SectionHeading } from './shared'
import { SlideView, slides } from './docs-slides'
import { DocsPresent } from './docs-present'
import { docs } from '@/content'

export function Docs() {
  const [presenting, setPresenting] = useState(false)

  return (
    <section id="docs" className="container-page scroll-mt-24 py-20 sm:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Documentação"
          title="Como o OfflineClass funciona por dentro"
        />
        <BlurFade delay={0.15}>
          <Button size="lg" onClick={() => setPresenting(true)} className="gap-2">
            <Play className="size-4 fill-current" />
            Apresentar
          </Button>
        </BlurFade>
      </div>

      <BlurFade delay={0.1}>
        <div className="mt-3 max-w-2xl text-lg text-muted-foreground">
          <Markdown source={docs.intro} />
        </div>
      </BlurFade>

      <div className="mt-14 space-y-8">
        {slides.map((slide) => (
          <SlideView key={slide.key} slide={slide} />
        ))}
      </div>

      {presenting && <DocsPresent onClose={() => setPresenting(false)} />}
    </section>
  )
}
