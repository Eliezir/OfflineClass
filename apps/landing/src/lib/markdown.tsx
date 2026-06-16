import { Fragment, type ReactNode } from 'react'

/** Inline: `code`, **bold**, [text](url). Input is escaped via React text nodes. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Split on code | bold | link, keeping delimiters.
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const token = m[0]
    const key = `${keyBase}-${i++}`
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(token)!
      nodes.push(
        <a
          key={key}
          href={mm[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {mm[1]}
        </a>,
      )
    }
    last = m.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/** Block-level mini-markdown → React. Accepts a string or array of lines. */
export function Markdown({ source }: { source: string | string[] }) {
  const lines = Array.isArray(source) ? source : source.split('\n')
  const blocks: ReactNode[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null
  let key = 0

  const flush = () => {
    if (!list) return
    const items = list.items.map((it, i) => (
      <li key={i}>{renderInline(it, `li-${key}-${i}`)}</li>
    ))
    blocks.push(
      list.type === 'ul' ? (
        <ul key={`b-${key++}`} className="my-3 list-disc space-y-1.5 pl-5">
          {items}
        </ul>
      ) : (
        <ol key={`b-${key++}`} className="my-3 list-decimal space-y-1.5 pl-5">
          {items}
        </ol>
      ),
    )
    list = null
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    const ul = /^[-*]\s+(.*)/.exec(line)
    const ol = /^\d+[.)]\s+(.*)/.exec(line)
    const quote = /^>\s?(.*)/.exec(line)
    const heading = /^#{1,4}\s+(.*)/.exec(line)
    if (ul) {
      if (list?.type !== 'ul') {
        flush()
        list = { type: 'ul', items: [] }
      }
      list.items.push(ul[1])
    } else if (ol) {
      if (list?.type !== 'ol') {
        flush()
        list = { type: 'ol', items: [] }
      }
      list.items.push(ol[1])
    } else if (quote) {
      flush()
      blocks.push(
        <blockquote
          key={`b-${key++}`}
          className="my-4 rounded-r-lg border-l-2 border-primary bg-accent/40 py-2 pl-4 text-muted-foreground"
        >
          {renderInline(quote[1], `q-${key}`)}
        </blockquote>,
      )
    } else if (heading) {
      flush()
      blocks.push(
        <h4 key={`b-${key++}`} className="mt-5 mb-1 font-semibold text-foreground">
          {renderInline(heading[1], `h-${key}`)}
        </h4>,
      )
    } else {
      flush()
      blocks.push(
        <p key={`b-${key++}`} className="my-2 leading-relaxed">
          {renderInline(line, `p-${key}`)}
        </p>,
      )
    }
  }
  flush()
  return <Fragment>{blocks}</Fragment>
}
