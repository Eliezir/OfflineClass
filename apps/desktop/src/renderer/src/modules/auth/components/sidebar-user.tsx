import { useState } from 'react'
import { ChevronsUpDown, LogOut, Settings, UserRound } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'
import { useNavigate } from '@tanstack/react-router'
import { Avatar } from '@offlineclass/avatar'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverItem,
  PopoverSeparator,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger
} from '@renderer/shared/ui/popover'
import { cn } from '@renderer/shared/utils'
import { useLogout, useMe } from '../queries'
import { initials } from '../initials'

/** Logged-in teacher chip pinned to the sidebar bottom, with a popover for
    quick settings access and logout. */
export function SidebarUser(): React.JSX.Element | null {
  const { t } = useLingui()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: me } = useMe()
  const logout = useLogout()

  if (!me) return null

  const goProfile = (): void => {
    setOpen(false)
    void navigate({ to: '/profile' })
  }

  const goSettings = (): void => {
    setOpen(false)
    void navigate({ to: '/settings' })
  }

  const handleLogout = async (): Promise<void> => {
    setOpen(false)
    await logout.mutateAsync()
    await navigate({ to: '/auth' })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left',
            'transition-colors duration-150 outline-none',
            'hover:bg-foreground/[0.05]',
            'focus-visible:ring-[3px] focus-visible:ring-ring/25',
            'data-[state=open]:bg-foreground/[0.05]'
          )}
        >
          {me.avatar ? (
            <Avatar config={me.avatar} size={36} />
          ) : (
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
              {initials(me.name)}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{me.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{me.email}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        className="w-(--radix-popover-trigger-width) p-1.5"
      >
        <PopoverHeader>
          <PopoverTitle className="truncate">{me.name}</PopoverTitle>
          <PopoverDescription className="truncate">{me.email}</PopoverDescription>
        </PopoverHeader>
        <PopoverSeparator />
        <PopoverItem
          icon={<UserRound className="size-4" />}
          title={t`Perfil`}
          onClick={goProfile}
        />
        <PopoverItem
          icon={<Settings className="size-4" />}
          title={t`Configurações`}
          onClick={goSettings}
        />
        <PopoverItem
          icon={<LogOut className="size-4" />}
          title={t`Sair`}
          onClick={handleLogout}
          disabled={logout.isPending}
          className="hover:bg-destructive/10"
          iconClassName="group-hover:bg-destructive group-hover:text-destructive-foreground"
        />
      </PopoverContent>
    </Popover>
  )
}
