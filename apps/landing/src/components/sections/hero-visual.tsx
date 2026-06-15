import { QrCode, Wifi } from 'lucide-react'

function Group({
  name,
  answered,
  pct,
  avatars,
  note,
  barClass,
}: {
  name: string
  answered: string
  pct: number
  avatars: string[]
  note: string
  barClass: string
}) {
  return (
    <div className="mt-3 rounded-xl border border-border p-3">
      <div className="mb-2.5 flex items-center gap-2 text-xs font-bold">
        {name}
        <span className="ml-auto font-bold text-muted-foreground">{answered}</span>
      </div>
      <div className="flex">
        {avatars.map((c, i) => (
          <span
            key={i}
            className="-ml-1.5 size-6 rounded-full border-2 border-card first:ml-0"
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-bold text-muted-foreground">
        <span>{note}</span>
        <span>{pct}%</span>
      </div>
    </div>
  )
}

/** Hero illustration: a "painel do professor" window showing a live session,
    with a QR-join chip and a Wi-Fi/LAN badge. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-2 text-xs font-bold text-muted-foreground">
            OfflineClass — painel do professor
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
            <span className="size-2 shrink-0 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.3)]" />
            <div className="min-w-0">
              <div className="text-[13px] font-extrabold">Sessão ao vivo · Prova de Redes</div>
              <div className="text-[11px] font-bold opacity-90">3 grupos · 8 alunos conectados</div>
            </div>
            <span className="ml-auto rounded-md bg-white/20 px-2 py-1 font-mono text-[13px] font-bold">
              12:00
            </span>
          </div>
          <Group
            name="Grupo A"
            answered="7/15"
            pct={62}
            note="respondendo ao vivo…"
            barClass="bg-lime"
            avatars={['oklch(0.7 0.17 270)', 'oklch(0.78 0.16 145)', 'oklch(0.72 0.16 14)']}
          />
          <Group
            name="Grupo B"
            answered="11/15"
            pct={73}
            note="2 alunos · sincronizado"
            barClass="bg-amber"
            avatars={['oklch(0.84 0.15 80)', 'oklch(0.7 0.17 270)']}
          />
        </div>
      </div>

      <div className="absolute -top-4 -left-4 grid size-11 place-items-center rounded-xl bg-lime text-background shadow-lg">
        <Wifi className="size-5" />
      </div>
      <div className="absolute -right-4 -bottom-4 grid size-[88px] place-items-center rounded-2xl border border-border bg-card shadow-xl">
        <QrCode className="size-12" />
      </div>
    </div>
  )
}
