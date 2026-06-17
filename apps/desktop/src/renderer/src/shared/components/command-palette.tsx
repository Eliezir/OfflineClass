import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Globe, LogOut, Moon, Plus, Radio, Sun } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useLingui } from '@lingui/react/macro'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '@renderer/shared/ui/command'
import { allNav, type NavTo } from '@renderer/shared/layouts/nav-items'
import { useThemeContext } from '@renderer/shared/hooks/theme-context'
import { activateLocale } from '@renderer/shared/i18n'
import {
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_NAMES,
  isAppLocale,
  type AppLocale
} from '@renderer/shared/i18n/locales'
import { useLogout } from '@renderer/modules/auth/queries'
import { CommandPaletteContext } from './command-palette-context'

type Page = 'root' | 'language'

/** Owns the palette open state + the global ⌘K / Ctrl+K shortcut, and renders
    the palette once for the whole shell. Must sit inside the router + theme
    providers so its actions can navigate and toggle the theme. */
export function CommandPaletteProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [page, setPage] = useState<Page>('root')
  const [search, setSearch] = useState('')

  const navigate = useNavigate()
  const { isDark, toggleTheme } = useThemeContext()
  const logout = useLogout()
  const { i18n, t } = useLingui()
  const currentLocale: AppLocale = isAppLocale(i18n.locale) ? i18n.locale : 'pt-BR'

  const open = useCallback(() => setIsOpen(true), [])

  const onOpenChange = useCallback((next: boolean) => {
    setIsOpen(next)
    if (!next) {
      // Reset to the root page for the next open.
      setPage('root')
      setSearch('')
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Run an action and dismiss the palette.
  const run = useCallback((action: () => void) => {
    action()
    setIsOpen(false)
  }, [])

  const ctxValue = useMemo(() => ({ open }), [open])

  const goPage = (to: Page): void => {
    setPage(to)
    setSearch('')
  }

  // Backspace on an empty query returns from a sub-page to the root.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Backspace' && search === '' && page !== 'root') {
      e.preventDefault()
      setPage('root')
    }
  }

  return (
    <CommandPaletteContext.Provider value={ctxValue}>
      {children}
      <CommandDialog
        open={isOpen}
        onOpenChange={onOpenChange}
        showCloseButton={false}
        title={t`Paleta de comandos`}
        description={t`Busque páginas e ações`}
      >
        <CommandInput
          value={search}
          onValueChange={setSearch}
          onKeyDown={onKeyDown}
          placeholder={page === 'language' ? t`Selecionar idioma…` : t`Buscar páginas e ações…`}
        />
        <CommandList>
          <CommandEmpty>{t`Nenhum resultado.`}</CommandEmpty>

          {page === 'root' && (
            <>
              <CommandGroup heading={t`Navegação`}>
                {allNav.map((item) => (
                  <CommandItem
                    key={item.to}
                    keywords={item.caption ? [i18n._(item.caption)] : undefined}
                    onSelect={() => run(() => void navigate({ to: item.to as NavTo }))}
                  >
                    <item.icon />
                    <span>{i18n._(item.label)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading={t`Ações`}>
                <CommandItem
                  keywords={[t`criar`, t`avaliação`]}
                  onSelect={() =>
                    run(() => void navigate({ to: '/provas', search: { new: true } }))
                  }
                >
                  <Plus />
                  <span>{t`Nova prova`}</span>
                </CommandItem>

                <CommandItem
                  keywords={[t`aplicar`, t`ao vivo`]}
                  onSelect={() => run(() => void navigate({ to: '/sessao' }))}
                >
                  <Radio />
                  <span>{t`Iniciar sessão ao vivo`}</span>
                </CommandItem>

                <CommandItem
                  keywords={[t`tema`, t`claro`, t`escuro`]}
                  onSelect={() => run(toggleTheme)}
                >
                  {isDark ? <Sun /> : <Moon />}
                  <span>{isDark ? t`Mudar para tema claro` : t`Mudar para tema escuro`}</span>
                  <CommandShortcut>⌘⇧D</CommandShortcut>
                </CommandItem>

                <CommandItem keywords={['language', t`idioma`]} onSelect={() => goPage('language')}>
                  <Globe />
                  <span>{t`Mudar idioma`}</span>
                  <ChevronRight className="ml-auto" />
                </CommandItem>

                <CommandItem
                  keywords={['logout', t`encerrar`]}
                  disabled={logout.isPending}
                  onSelect={() =>
                    run(() => {
                      void logout.mutateAsync().then(() => navigate({ to: '/auth' }))
                    })
                  }
                  className="text-destructive data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive [&_svg:not([class*='text-'])]:text-destructive"
                >
                  <LogOut />
                  <span>{t`Sair`}</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {page === 'language' && (
            <CommandGroup heading={t`Idioma`}>
              {LOCALES.map((locale) => (
                <CommandItem
                  key={locale}
                  value={LOCALE_NAMES[locale]}
                  onSelect={() => run(() => activateLocale(locale))}
                >
                  <span className="text-base leading-none">{LOCALE_FLAGS[locale]}</span>
                  <span>{LOCALE_NAMES[locale]}</span>
                  {locale === currentLocale && <Check className="ml-auto text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  )
}
