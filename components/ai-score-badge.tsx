"use client"

import { cn } from "@/lib/utils"

interface AIScoreBadgeProps {
  score: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  animated?: boolean
  className?: string
}

export function AIScoreBadge({ 
  score, 
  size = "md", 
  showLabel = false,
  animated = false,
  className 
}: AIScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score < 40) return { bg: "bg-red-500/20", text: "text-red-500", glow: "shadow-red-500/30" }
    if (score < 70) return { bg: "bg-amber-500/20", text: "text-amber-500", glow: "shadow-amber-500/30" }
    return { bg: "bg-emerald-500/20", text: "text-emerald-500", glow: "shadow-emerald-500/30" }
  }

  const colors = getScoreColor(score)
  
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl"
  }

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div 
        className={cn(
          "rounded-full flex items-center justify-center font-bold shadow-lg",
          sizeClasses[size],
          colors.bg,
          colors.text,
          colors.glow,
          animated && "animate-pulse"
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", colors.text)}>
          AI Match
        </span>
      )}
    </div>
  )
}

interface AIScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function AIScoreGauge({ 
  score, 
  size = 120, 
  strokeWidth = 8,
  className 
}: AIScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score < 40) return "#EF4444"
    if (score < 70) return "#F59E0B"
    return "#10B981"
  }

  const color = getScoreColor(score)

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  )
}
