import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'

import { ScrollArea } from '@renderer/shared/ui/scroll-area'
import { cn } from '@renderer/shared/utils'

type EmojiPickerProps = {
  /** Currently selected emoji — highlighted in the grid. */
  value?: string | null
  onSelect: (emoji: string) => void
  className?: string
}

type EmojiEntry = { char: string; keywords: string }
type EmojiSection = { id: string; icon: string; terms: string; emojis: EmojiEntry[] }

// Curated, education-focused set — fully offline. `terms`/`keywords` power the
// search (Portuguese, accent-insensitive). `icon` is the category-strip glyph.
const EMOJI_SECTIONS: EmojiSection[] = [
  {
    id: 'education',
    icon: '📚',
    terms: 'educacao escola estudo',
    emojis: [
      { char: '📚', keywords: 'livros estudo' },
      { char: '📖', keywords: 'livro aberto leitura' },
      { char: '📝', keywords: 'nota anotacao redacao' },
      { char: '✏️', keywords: 'lapis escrever' },
      { char: '🖊️', keywords: 'caneta escrever' },
      { char: '🖍️', keywords: 'giz cera lapis' },
      { char: '📒', keywords: 'caderno' },
      { char: '📕', keywords: 'livro vermelho' },
      { char: '📗', keywords: 'livro verde' },
      { char: '📘', keywords: 'livro azul' },
      { char: '📙', keywords: 'livro laranja' },
      { char: '📔', keywords: 'caderno capa' },
      { char: '🎓', keywords: 'formatura graduacao diploma' },
      { char: '🏫', keywords: 'escola colegio' },
      { char: '🧑‍🏫', keywords: 'professor ensino aula' },
      { char: '📐', keywords: 'regua esquadro geometria' },
      { char: '📏', keywords: 'regua medir' },
      { char: '📎', keywords: 'clipe' },
      { char: '📌', keywords: 'alfinete fixar' },
      { char: '📋', keywords: 'prancheta lista prova' },
      { char: '🗂️', keywords: 'pasta arquivo organizar' },
      { char: '🔖', keywords: 'marcador pagina' }
    ]
  },
  {
    id: 'science',
    icon: '🔬',
    terms: 'ciencias biologia quimica fisica',
    emojis: [
      { char: '🔬', keywords: 'microscopio biologia' },
      { char: '🧪', keywords: 'tubo ensaio quimica' },
      { char: '🧬', keywords: 'dna genetica' },
      { char: '🔭', keywords: 'telescopio astronomia' },
      { char: '🌡️', keywords: 'termometro temperatura' },
      { char: '⚗️', keywords: 'alambique quimica' },
      { char: '🦠', keywords: 'microbio virus bacteria' },
      { char: '🧲', keywords: 'ima magnetismo' },
      { char: '⚛️', keywords: 'atomo fisica' },
      { char: '🌍', keywords: 'terra planeta mundo' },
      { char: '🪐', keywords: 'planeta saturno espaco' },
      { char: '🌙', keywords: 'lua' },
      { char: '☀️', keywords: 'sol' },
      { char: '💡', keywords: 'lampada ideia' },
      { char: '🔋', keywords: 'bateria energia' },
      { char: '🌱', keywords: 'planta broto biologia' },
      { char: '🧫', keywords: 'placa petri cultura' },
      { char: '🩺', keywords: 'estetoscopio saude medicina' }
    ]
  },
  {
    id: 'math',
    icon: '🧮',
    terms: 'matematica numeros calculo',
    emojis: [
      { char: '🧮', keywords: 'abaco calculo' },
      { char: '➕', keywords: 'mais soma adicao' },
      { char: '➖', keywords: 'menos subtracao' },
      { char: '✖️', keywords: 'vezes multiplicacao' },
      { char: '➗', keywords: 'divisao dividir' },
      { char: '🟰', keywords: 'igual' },
      { char: '🔢', keywords: 'numeros digitos' },
      { char: '📊', keywords: 'grafico barras dados' },
      { char: '📈', keywords: 'grafico subindo crescimento' },
      { char: '📉', keywords: 'grafico descendo queda' },
      { char: '💯', keywords: 'cem nota cheia' },
      { char: '🔣', keywords: 'simbolos' }
    ]
  },
  {
    id: 'tech',
    icon: '💻',
    terms: 'tecnologia informatica computador redes',
    emojis: [
      { char: '💻', keywords: 'notebook laptop computador' },
      { char: '🖥️', keywords: 'computador monitor desktop' },
      { char: '⌨️', keywords: 'teclado' },
      { char: '🖱️', keywords: 'mouse' },
      { char: '🌐', keywords: 'internet web rede mundo' },
      { char: '📡', keywords: 'antena satelite sinal' },
      { char: '🛰️', keywords: 'satelite espaco' },
      { char: '📱', keywords: 'celular smartphone' },
      { char: '🔌', keywords: 'tomada energia plugue' },
      { char: '⚙️', keywords: 'engrenagem configuracao sistema' },
      { char: '🤖', keywords: 'robo ia inteligencia' },
      { char: '💾', keywords: 'disquete salvar' },
      { char: '🗄️', keywords: 'arquivo gabinete servidor' },
      { char: '🔧', keywords: 'chave ferramenta' }
    ]
  },
  {
    id: 'humanities',
    icon: '🗺️',
    terms: 'humanas artes historia geografia',
    emojis: [
      { char: '🗺️', keywords: 'mapa geografia' },
      { char: '🌎', keywords: 'mundo americas geografia' },
      { char: '🏛️', keywords: 'predio historia grecia' },
      { char: '⚖️', keywords: 'balanca justica direito' },
      { char: '📜', keywords: 'pergaminho historia documento' },
      { char: '🗣️', keywords: 'falando idioma lingua' },
      { char: '💬', keywords: 'balao conversa dialogo' },
      { char: '🎨', keywords: 'paleta arte pintura' },
      { char: '🎭', keywords: 'teatro mascaras drama' },
      { char: '🎵', keywords: 'nota musical musica' },
      { char: '🎼', keywords: 'partitura musica' },
      { char: '📷', keywords: 'camera foto' },
      { char: '🎬', keywords: 'cinema filme' },
      { char: '🌍', keywords: 'terra europa africa geografia' }
    ]
  },
  {
    id: 'evaluation',
    icon: '✅',
    terms: 'avaliacao prova nota correcao',
    emojis: [
      { char: '✅', keywords: 'check correto certo' },
      { char: '☑️', keywords: 'caixa marcada selecionado' },
      { char: '✔️', keywords: 'certo correto' },
      { char: '❓', keywords: 'pergunta duvida questao' },
      { char: '❗', keywords: 'exclamacao importante' },
      { char: '⭐', keywords: 'estrela favorito' },
      { char: '🏆', keywords: 'trofeu premio' },
      { char: '🥇', keywords: 'medalha ouro primeiro' },
      { char: '🎯', keywords: 'alvo meta objetivo' },
      { char: '⏱️', keywords: 'cronometro tempo' },
      { char: '⏰', keywords: 'relogio despertador prazo' },
      { char: '📅', keywords: 'calendario data' },
      { char: '🔔', keywords: 'sino notificacao aviso' },
      { char: '✍️', keywords: 'escrevendo prova mao' }
    ]
  }
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function EmojiPicker({ value, onSelect, className }: EmojiPickerProps): React.JSX.Element {
  const { t } = useLingui()
  const [query, setQuery] = useState('')

  const labels: Record<string, string> = {
    education: t`Educação`,
    science: t`Ciências`,
    math: t`Matemática`,
    tech: t`Tecnologia`,
    humanities: t`Humanas e artes`,
    evaluation: t`Avaliação`
  }

  const q = normalize(query.trim())
  const results = useMemo(() => {
    if (!q) return null
    const matches: string[] = []
    for (const section of EMOJI_SECTIONS) {
      const sectionMatch = normalize(section.terms).includes(q)
      for (const emoji of section.emojis) {
        if (sectionMatch || normalize(emoji.keywords).includes(q)) matches.push(emoji.char)
      }
    }
    return matches
  }, [q])

  const cell = (char: string): React.JSX.Element => (
    <button
      key={char}
      type="button"
      onClick={() => onSelect(char)}
      className={cn(
        'flex h-9 w-full items-center justify-center rounded-[10px] text-xl outline-none transition-colors',
        'hover:bg-accent focus-visible:bg-accent',
        value === char && 'bg-primary-soft text-primary ring-2 ring-primary ring-inset'
      )}
    >
      {char}
    </button>
  )

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t`Buscar ícone…`}
            className="h-9 w-full rounded-[12px] border border-input-border bg-input pl-8 pr-8 text-sm shadow-[var(--edge-soft)] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
          />
          {query && (
            <button
              type="button"
              aria-label={t`Limpar busca`}
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea type="always" className="h-64 w-full border-t border-border bg-blue-500">
        <div className="space-y-3 p-2 pr-3">
          {q ? (
            results && results.length > 0 ? (
              <div className="grid grid-cols-8 gap-1">{results.map(cell)}</div>
            ) : (
              <div className="py-12 text-center text-sm font-medium text-muted-foreground">
                {t`Nenhum ícone encontrado.`}
              </div>
            )
          ) : (
            EMOJI_SECTIONS.map((section) => (
              <div key={section.id}>
                <div className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {labels[section.id]}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {section.emojis.map((emoji) => cell(emoji.char))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
