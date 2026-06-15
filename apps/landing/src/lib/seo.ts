const SITE_URL = 'https://eliezir.github.io/OfflineClass'

const ROUTE_SEO: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'OfflineClass — Provas em grupo, ao vivo, sem internet',
    description:
      'App desktop para aplicar avaliações colaborativas na rede local da sala. O professor hospeda, os alunos entram pela Wi-Fi e respondem em grupo, em tempo real — sem depender da internet.',
  },
  '/download': {
    title: 'Download — OfflineClass',
    description:
      'Baixe o OfflineClass para macOS, Windows ou Linux e comece a aplicar avaliações na rede local da sua sala.',
  },
  '/releases': {
    title: 'Releases — OfflineClass',
    description: 'Histórico de versões e notas de cada release do OfflineClass.',
  },
  '/docs': {
    title: 'Documentação — OfflineClass',
    description: 'Guia rápido para instalar o OfflineClass e aplicar sua primeira avaliação na rede local.',
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
