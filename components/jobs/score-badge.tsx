export function ScoreBadge({ score }: { score: number }) {
    const config =
      score >= 70
        ? { label: "Strong match", className: "bg-green-100 text-green-700 border-green-200" }
        : score >= 50
          ? { label: "Moderate match", className: "bg-yellow-100 text-yellow-700 border-yellow-200" }
          : { label: "Low match", className: "bg-red-100 text-red-700 border-red-200" }
  
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.className}`}>
        {score}% · {config.label}
      </span>
    )
  }