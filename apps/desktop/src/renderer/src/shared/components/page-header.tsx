const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

type PageHeaderProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Right-aligned actions (buttons). Wrap on narrow widths. */
  actions?: React.ReactNode
}

/** Standard page header: display title + optional subtitle on the left, actions
    on the right. Used by every screen in the app shell. The header doubles as the
    content-side window-drag region (the title area drags; the actions opt out). */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps): React.JSX.Element {
  return (
    <header
      className="mb-6 flex flex-wrap items-end justify-between gap-4 pt-6"
      style={dragRegion}
    >
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2" style={noDragRegion}>
          {actions}
        </div>
      )}
    </header>
  )
}
