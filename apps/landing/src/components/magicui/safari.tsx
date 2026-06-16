import type { SVGProps } from 'react'

export interface SafariProps extends SVGProps<SVGSVGElement> {
  url?: string
  imageSrc?: string
  width?: number
  height?: number
}

/**
 * Safari-style browser frame (Magic UI). Renders the screenshot inside a
 * rounded window chrome with traffic lights and a URL pill.
 */
export function Safari({
  imageSrc,
  url = 'offlineclass.app',
  width = 1203,
  height = 753,
  ...props
}: SafariProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#path0)">
        <path
          d="M0 52H1202V741C1202 747.627 1196.63 753 1190 753H12C5.37258 753 0 747.627 0 741V52Z"
          className="fill-card"
        />
        <path
          d="M0 12C0 5.37258 5.37258 0 12 0H1190C1196.63 0 1202 5.37259 1202 12V52H0V12Z"
          className="fill-muted"
        />
        <circle cx="27" cy="25" r="6" className="fill-border" />
        <circle cx="47" cy="25" r="6" className="fill-border" />
        <circle cx="67" cy="25" r="6" className="fill-border" />

        <rect
          x="286"
          y="17"
          width="630"
          height="17"
          rx="8.5"
          className="fill-background"
        />
        <text
          x="601"
          y="30"
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="13"
          fontFamily="ui-monospace, monospace"
        >
          {url}
        </text>

        {imageSrc && (
          <image
            href={imageSrc}
            width="1202"
            height="701"
            x="0"
            y="52"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#roundedBottom)"
          />
        )}
      </g>
      <defs>
        <clipPath id="path0">
          <rect width={width} height={height} rx="12" fill="white" />
        </clipPath>
        <clipPath id="roundedBottom">
          <path d="M0 52H1202V741C1202 747.627 1196.63 753 1190 753H12C5.37258 753 0 747.627 0 741V52Z" />
        </clipPath>
      </defs>
    </svg>
  )
}
