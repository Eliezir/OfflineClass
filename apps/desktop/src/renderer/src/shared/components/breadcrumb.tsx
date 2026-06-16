import { Fragment } from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'

export type BreadcrumbItem = {
  label: string
  /** Rota opcional. Se ausente, o segmento vira só rótulo. O último é sempre a página atual. */
  to?: LinkProps['to']
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Trilha de navegação das seções internas. Cada segmento é um rótulo;
 * passe `to` para torná-lo um link. O último segmento é a página atual.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps): React.JSX.Element {
  const { t } = useLingui()
  return (
    <nav
      aria-label={t`Trilha de navegação`}
      className={cn('flex items-center gap-1.5 text-sm', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <Fragment key={item.label}>
            {index > 0 && (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
            )}

            {!isLast && item.to ? (
              <Link
                to={item.to}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={isLast ? 'font-medium text-foreground' : 'text-muted-foreground'}
              >
                {item.label}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
