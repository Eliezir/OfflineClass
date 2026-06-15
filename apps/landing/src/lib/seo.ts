const SITE_URL = 'https://eliezir.github.io/apresenta.ai'

const ROUTE_SEO: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Apresenta.AI — Apresentações interativas em HTML, criadas com IA',
    description:
      'App desktop que transforma ideias em apresentações HTML interativas — quizzes, zoom, animações e troca de tema. Mais que slides: uma experiência criada com IA.',
  },
  '/download': {
    title: 'Download — Apresenta.AI',
    description:
      'Baixe o Apresenta.AI para macOS, Windows ou Linux e comece a criar apresentações HTML interativas.',
  },
  '/releases': {
    title: 'Releases — Apresenta.AI',
    description: 'Histórico de versões e notas de cada release do Apresenta.AI.',
  },
  '/docs': {
    title: 'Documentação — Apresenta.AI',
    description: 'Guia rápido para começar com o Apresenta.AI e criar sua primeira apresentação.',
  },
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setProperty(property: string, content: string) {
  const el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (el) el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/** Update the document head for the current route (CSR-friendly SEO). */
export function applySeo(pathname: string) {
  const meta = ROUTE_SEO[pathname] ?? ROUTE_SEO['/']
  const url = `${SITE_URL}${pathname === '/' ? '/' : pathname}`
  document.title = meta.title
  setMeta('description', meta.description)
  setCanonical(url)
  setProperty('og:title', meta.title)
  setProperty('og:description', meta.description)
  setProperty('og:url', url)
}
