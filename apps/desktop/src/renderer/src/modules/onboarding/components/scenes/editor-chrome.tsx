import { Trans } from '@lingui/react/macro'

type DemoFrameProps = {
  /** Filename shown in the title bar — changes per beat to sell continuity. */
  file: string
  children: React.ReactNode
}

/** The persistent app window that wraps the whole "Como funciona" demo. Its
    chrome (traffic lights + filename) stays put while the stage content
    crossfades between scenes, so it reads as one continuous app. */
export function DemoFrame({ file, children }: DemoFrameProps): React.JSX.Element {
  return (
    <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-[16px] border border-border bg-card shadow-2xl ring-1 ring-foreground/[0.04]">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/70 bg-muted/40 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
          <Trans>
            Apresenta.AI —{' '}
            <span
              key={file}
              className="inline-block animate-in fade-in text-foreground/70 animation-duration-[400ms]"
            >
              {file}
            </span>
          </Trans>
        </span>
      </div>
      <div className="relative flex-1">{children}</div>
    </div>
  )
}
