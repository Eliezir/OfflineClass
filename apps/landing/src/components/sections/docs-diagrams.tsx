import type { ReactNode } from 'react'
import {
  Server,
  Database,
  Monitor,
  Users,
  RadioTower,
  QrCode,
  Keyboard,
  Wifi,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Clock,
  RotateCcw,
  ShieldCheck,
  Lock,
  Check,
  Cpu,
  GitMerge,
  MousePointer2,
  ListChecks,
  LayoutTemplate,
  Mail,
  type LucideIcon,
} from 'lucide-react'

/* ── shared slide-figure primitives ──────────────────────────────────────── */

function Node({
  icon: Icon,
  label,
  sub,
  accent = false,
}: {
  icon?: LucideIcon
  label: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className={[
        'flex items-center gap-3 rounded-xl border px-4 py-3',
        accent ? 'border-primary/40 bg-primary/5' : 'border-border bg-card',
      ].join(' ')}
    >
      {Icon && (
        <Icon className={accent ? 'size-6 shrink-0 text-primary' : 'size-6 shrink-0 text-muted-foreground'} />
      )}
      <div className="min-w-0 leading-tight">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  )
}

function Connector({ label, dir = 'down' }: { label?: string; dir?: 'down' | 'right' | 'up' }) {
  const Icon = dir === 'right' ? ArrowRight : dir === 'up' ? ArrowUp : ArrowDown
  return (
    <div
      className={[
        'flex items-center justify-center gap-2 text-muted-foreground',
        dir === 'right' ? 'flex-row' : 'flex-col',
      ].join(' ')}
    >
      {label && <span className="font-mono text-xs tracking-tight">{label}</span>}
      <Icon className="size-5" />
    </div>
  )
}

function Chip({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground">
      {Icon && <Icon className="size-4 text-primary" />}
      {children}
    </span>
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-6">
      {children}
    </div>
  )
}

/* ── diagrams ─────────────────────────────────────────────────────────────── */

function ProcessDiagram() {
  return (
    <Frame>
      <Node icon={Monitor} label="Renderer · UI do professor" sub="React, em sandbox" />
      <Connector label="IPC" />
      <Node icon={Server} label="Processo main" sub="servidor Hono + SQLite + Yjs" accent />
      <Connector label="HTTPS / WSS" />
      <Node icon={Users} label="Navegador dos alunos" sub="na Wi-Fi local" />
    </Frame>
  )
}

function DiscoveryDiagram() {
  return (
    <Frame>
      <div className="flex flex-wrap justify-center gap-2">
        <Chip icon={RadioTower}>mDNS · offlineclass.local</Chip>
        <Chip icon={QrCode}>QR code</Chip>
        <Chip icon={Keyboard}>IP manual</Chip>
      </div>
      <Connector />
      <Node icon={Server} label="Servidor da sala · :8000" sub="HTTPS · certificado self-signed" accent />
    </Frame>
  )
}

function TopologyDiagram() {
  return (
    <Frame>
      <div className="mx-auto w-full max-w-[20rem]">
        <Node icon={Server} label="PC do professor" sub="servidor da avaliação" accent />
      </div>
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Wifi className="size-5" />
        <span className="font-mono text-xs">Wi-Fi local · HTTPS / WSS</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Node icon={Monitor} label="Aluno" />
        <Node icon={Monitor} label="Aluno" />
        <Node icon={Monitor} label="Aluno" />
      </div>
    </Frame>
  )
}

function CrdtDiagram() {
  return (
    <Frame>
      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <GitMerge className="size-5 text-primary" />
          <span className="text-sm font-bold text-foreground">Y.Doc · Grupo A</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <span className="font-semibold">answers</span> · Y.Map
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <span className="font-semibold">dissertativa / código</span> · Y.XmlFragment
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Chip icon={Users}>Ana</Chip>
        <Chip icon={Users}>João</Chip>
        <Chip icon={Users}>Maria</Chip>
      </div>
      <p className="text-center font-mono text-xs text-muted-foreground">
        update binário · frame 0 = doc · 1 = awareness
      </p>
    </Frame>
  )
}

function SnapshotDiagram() {
  return (
    <Frame>
      <Node icon={Cpu} label="Y.Doc em memória" sub="estado quente" accent />
      <Connector label="debounce 2s" />
      <Node icon={Database} label="snapshot BLOB no SQLite" sub="group_yjs_snapshots" />
      <div className="mt-1 flex items-center justify-center gap-2 text-muted-foreground">
        <RotateCcw className="size-5" />
        <span className="font-mono text-xs">recuperação ao reabrir o app</span>
        <Clock className="size-5" />
      </div>
    </Frame>
  )
}

function StatesDiagram() {
  return (
    <Frame>
      <Node icon={Users} label="lobby" sub="entram & agrupam" />
      <Connector />
      <Node icon={ListChecks} label="em andamento" sub="grupos travados · cronômetro" accent />
      <Connector />
      <Node icon={Check} label="encerrada" sub="grupo enviado" />
    </Frame>
  )
}

function SecurityDiagram() {
  return (
    <Frame>
      <Node icon={Users} label="Alunos · LAN" sub="token Bearer por sessão" />
      <Connector />
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <Check className="size-5 shrink-0 text-lime" />
        <span className="text-sm font-medium text-foreground">/api/* · validado por Zod</span>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3">
        <Lock className="size-5 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Ações do professor · só IPC — fora do alcance da rede
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <ShieldCheck className="size-5" />
        <span className="font-mono text-xs">confiança por topologia</span>
      </div>
    </Frame>
  )
}

export const DOCS_DIAGRAMS: Record<string, () => ReactNode> = {
  process: ProcessDiagram,
  discovery: DiscoveryDiagram,
  topology: TopologyDiagram,
  crdt: CrdtDiagram,
  snapshot: SnapshotDiagram,
  states: StatesDiagram,
  security: SecurityDiagram,
}

export const DOCS_ICONS: Record<string, LucideIcon> = {
  process: Cpu,
  discovery: RadioTower,
  connection: Server,
  crdt: GitMerge,
  presence: MousePointer2,
  durable: Database,
  session: ListChecks,
  security: ShieldCheck,
  canvas: LayoutTemplate,
  email: Mail,
}
