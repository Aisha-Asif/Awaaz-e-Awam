"use client";

interface WaveformVisualizerProps {
  active?: boolean;
  color?: "rani" | "jade" | "marigold";
  barCount?: number;
  className?: string;
}

export function WaveformVisualizer({
  active = false,
  color = "rani",
  barCount = 18,
  className = "",
}: WaveformVisualizerProps) {
  const colorMap = {
    rani: "bg-rani",
    jade: "bg-jade",
    marigold: "bg-marigold",
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 h-12 px-4 py-2 rounded-xl bg-paper-subtle border border-line/70 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Stagger heights and animation delays
        const baseHeight = [25, 45, 75, 90, 60, 30, 70, 100, 85, 40, 65, 95, 55, 35, 80, 50, 65, 30][i % 18];
        const delay = (i * 0.08) % 1.2;
        const duration = 0.8 + ((i % 5) * 0.15);

        return (
          <span
            key={i}
            className={`w-1 rounded-full transition-all duration-150 ${colorMap[color]}`}
            style={{
              height: active ? `${baseHeight}%` : "15%",
              animation: active ? `waveBar ${duration}s ease-in-out ${delay}s infinite alternate` : "none",
              transformOrigin: "center",
              opacity: active ? 0.95 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
}
