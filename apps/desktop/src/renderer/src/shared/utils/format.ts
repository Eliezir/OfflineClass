/** Compact PT-BR relative time, e.g. "agora", "há 2 h", "há 3 dias". */
export function formatRelativeTime(ms: number): string {
  const min = Math.round((Date.now() - ms) / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  if (d < 7) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
  const w = Math.round(d / 7)
  return `há ${w} ${w === 1 ? 'semana' : 'semanas'}`
}
