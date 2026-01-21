import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  label?: string
  colorScheme?: 'auto' | 'blue' | 'green' | 'amber' | 'red'
  className?: string
}

const sizeConfig = {
  sm: {
    size: 48,
    strokeWidth: 6,
    fontSize: 'text-sm',
    labelFontSize: 'text-[10px]',
  },
  md: {
    size: 64,
    strokeWidth: 8,
    fontSize: 'text-base',
    labelFontSize: 'text-xs',
  },
  lg: {
    size: 96,
    strokeWidth: 8,
    fontSize: 'text-2xl',
    labelFontSize: 'text-sm',
  },
}

const colorConfig = {
  green: {
    stroke: '#10b981', // emerald-500
    glow: 'rgba(16, 185, 129, 0.4)',
    gradientStart: '#34d399', // emerald-400
    gradientEnd: '#059669', // emerald-600
  },
  blue: {
    stroke: '#3b82f6', // blue-500
    glow: 'rgba(59, 130, 246, 0.4)',
    gradientStart: '#60a5fa', // blue-400
    gradientEnd: '#2563eb', // blue-600
  },
  amber: {
    stroke: '#f59e0b', // amber-500
    glow: 'rgba(245, 158, 11, 0.4)',
    gradientStart: '#fbbf24', // amber-400
    gradientEnd: '#d97706', // amber-600
  },
  red: {
    stroke: '#ef4444', // red-500
    glow: 'rgba(239, 68, 68, 0.4)',
    gradientStart: '#f87171', // red-400
    gradientEnd: '#dc2626', // red-600
  },
}

function getColorScheme(value: number, scheme?: CircularProgressProps['colorScheme']): keyof typeof colorConfig {
  if (scheme && scheme !== 'auto') {
    return scheme
  }

  // Auto-determine color based on value
  if (value >= 85) return 'green'
  if (value >= 70) return 'blue'
  if (value >= 50) return 'amber'
  return 'red'
}

export function CircularProgress({
  value,
  size = 'md',
  showValue = true,
  label,
  colorScheme = 'auto',
  className,
}: CircularProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100)
  const config = sizeConfig[size]
  const colorKey = getColorScheme(clampedValue, colorScheme)
  const colors = colorConfig[colorKey]

  const circleSize = config.size
  const strokeWidth = config.strokeWidth
  const radius = (circleSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedValue / 100) * circumference

  const gradientId = React.useId()
  const filterId = React.useId()

  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center justify-center",
        className
      )}
      style={{ width: circleSize, height: circleSize }}
    >
      {/* SVG Circle */}
      <svg
        width={circleSize}
        height={circleSize}
        className="absolute inset-0 -rotate-90"
      >
        <defs>
          {/* Gradient definition */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradientStart} />
            <stop offset="100%" stopColor={colors.gradientEnd} />
          </linearGradient>

          {/* Glow filter */}
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
            />
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          stroke="rgb(51 65 85)" // slate-700
          strokeWidth={strokeWidth}
          opacity={0.3}
        />

        {/* Glow layer */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          stroke={colors.glow}
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#${filterId})`}
          className="transition-all duration-500 ease-out"
        />

        {/* Progress circle */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center content */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span
              className={cn(
                "font-bold tabular-nums tracking-tight font-mono",
                config.fontSize
              )}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {Math.round(clampedValue)}
            </span>
            <span
              className={cn(
                "ml-0.5 text-muted-foreground tabular-nums font-mono",
                config.labelFontSize
              )}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              /100
            </span>
          </div>
          {label && (
            <span
              className={cn(
                "mt-0.5 text-muted-foreground text-center leading-tight",
                config.labelFontSize
              )}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default CircularProgress
