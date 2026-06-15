import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BentoGridProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<'div'> {
  name: string
  className: string
  background?: ReactNode
  Icon: React.ElementType
  description: string
  href?: string
  cta?: string
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[18rem] grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) {
  return (
    <div
      key={name}
      className={cn(
        'group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl',
        'bg-card border border-border [box-shadow:0_0_0_1px_rgba(0,0,0,.02),0_2px_4px_rgba(0,0,0,.04)]',
        'transform-gpu transition-all duration-300 hover:border-primary/40',
        className,
      )}
      {...props}
    >
      <div>{background}</div>
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1.5 p-6 transition-all duration-300 group-hover:-translate-y-10">
        <Icon className="size-9 text-primary transition-all duration-300 ease-in-out group-hover:scale-90" />
        <h3 className="text-lg font-semibold text-card-foreground">{name}</h3>
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>

      {cta && (
        <div className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Button variant="ghost" asChild size="sm" className="pointer-events-auto">
            <a href={href}>
              {cta}
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-foreground/[0.02]" />
    </div>
  )
}
