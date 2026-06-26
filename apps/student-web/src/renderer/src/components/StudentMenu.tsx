import { useState } from 'react'
import { ChevronsUpDown, LogOut, Pencil, Settings, UserRound } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverItem,
  PopoverSeparator,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger
} from '@/components/ui/popover'
import { SettingsDialog } from '@/components/SettingsDialog'
import { cn } from '@/lib/utils'
import { type StudentProfile, loadProfile, saveProfile, clearProfile, initials } from '@/lib/studentProfile'
import { clearToken } from '@/lib/session'
import { isElectron } from '@/lib/platform'

interface StudentMenuProps {
  onProfileChange: (profile: StudentProfile | null) => void
}

export function StudentMenu({ onProfileChange }: StudentMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [name, setName] = useState('')
  const [matricula, setMatricula] = useState('')
  const [email, setEmail] = useState('')

  const stored = loadProfile()

  const handleEdit = (): void => {
    if (stored) {
      setName(stored.name)
      setMatricula(stored.matricula)
      setEmail(stored.email ?? '')
    }
    setEditing(true)
  }

  const handleSave = (): void => {
    if (name.trim().length < 2 || matricula.trim().length < 2) return
    const profile: StudentProfile = {
      name: name.trim(),
      matricula: matricula.trim(),
      email: email.trim() || undefined
    }
    saveProfile(profile)
    onProfileChange(profile)
    setEditing(false)
    setOpen(false)
  }

  const handleClear = (): void => {
    clearProfile()
    clearToken()
    onProfileChange(null)
    setOpen(false)
  }

  const handleQuit = (): void => {
    setOpen(false)
    if (isElectron()) {
      clearProfile()
      onProfileChange(null)
      window.api.window.close()
    }
  }

  // ── Shared trigger button ───────────────────────────────────────────
  const trigger = (
    <button
      type="button"
      className={cn(
        'flex items-center gap-2.5 rounded-[12px] px-2 py-2 text-left',
        'transition-colors duration-150 outline-none',
        'hover:bg-foreground/[0.05]',
        'focus-visible:ring-[3px] focus-visible:ring-ring/25',
        'data-[state=open]:bg-foreground/[0.05]'
      )}
    >
      {stored ? (
        <>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
            {initials(stored.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{stored.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {stored.matricula}
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">Aluno</span>
            <span className="block truncate text-xs text-muted-foreground">
              Cadastre-se para entrar
            </span>
          </span>
        </>
      )}
      <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )

  // ── Editing mode: inline form inside popover ─────────────────────────
  if (editing) {
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={6} className="w-64 p-3">
            <PopoverHeader>
              <PopoverTitle>Editar perfil</PopoverTitle>
              <PopoverDescription>Preencha seus dados para entrar nas provas.</PopoverDescription>
            </PopoverHeader>
            <div className="space-y-2.5 px-2.5 py-2">
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-input-border bg-input w-full rounded-[10px] border px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
              />
              <input
                type="text"
                placeholder="Matrícula"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="border-input-border bg-input w-full rounded-[10px] border px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
              />
              <input
                type="email"
                placeholder="E-mail (opcional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-input-border bg-input w-full rounded-[10px] border px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 cursor-pointer rounded-[10px] px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={name.trim().length < 2 || matricula.trim().length < 2}
                  className="bg-primary text-primary-foreground flex-1 cursor-pointer rounded-[10px] px-3 py-1.5 text-sm font-bold disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </>
    )
  }

  // ── Registered: full menu with header + items ────────────────────────
  if (stored) {
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={6} className="w-64 p-1.5">
            <PopoverHeader>
              <PopoverTitle className="truncate">{stored.name}</PopoverTitle>
              <PopoverDescription className="truncate">{stored.matricula}</PopoverDescription>
            </PopoverHeader>
            <PopoverSeparator />
            <PopoverItem
              icon={<Pencil className="size-4" />}
              title="Editar perfil"
              onClick={handleEdit}
            />
            <PopoverItem
              icon={<Settings className="size-4" />}
              title="Configurações"
              onClick={() => { setOpen(false); setSettingsOpen(true) }}
            />
            <PopoverSeparator />
            <PopoverItem
              icon={<LogOut className="size-4" />}
              title="Remover cadastro"
              onClick={handleClear}
              className="hover:bg-destructive/10"
              iconClassName="group-hover:bg-destructive group-hover:text-destructive-foreground"
            />
            {isElectron() && (
              <PopoverItem
                icon={<LogOut className="size-4" />}
                title="Sair do app"
                onClick={handleQuit}
                className="hover:bg-destructive/10"
                iconClassName="group-hover:bg-destructive group-hover:text-destructive-foreground"
              />
            )}
          </PopoverContent>
        </Popover>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </>
    )
  }

  // ── Unregistered: registration form ─────────────────────────────────
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent side="top" align="start" sideOffset={6} className="w-64 p-3">
          <PopoverHeader>
            <PopoverTitle>Cadastrar aluno</PopoverTitle>
            <PopoverDescription>
              Salve seus dados para entrar nas provas sem precisar digitar toda vez.
            </PopoverDescription>
          </PopoverHeader>
          <div className="space-y-2.5 px-2.5 py-2">
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-input-border bg-input w-full rounded-[10px] border px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
            <input
              type="text"
              placeholder="Matrícula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              className="border-input-border bg-input w-full rounded-[10px] border px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
            <input
              type="email"
              placeholder="E-mail (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-input-border bg-input w-full rounded-[10px] border px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={name.trim().length < 2 || matricula.trim().length < 2}
              className="bg-primary text-primary-foreground w-full cursor-pointer rounded-[10px] px-3 py-1.5 text-sm font-bold disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
