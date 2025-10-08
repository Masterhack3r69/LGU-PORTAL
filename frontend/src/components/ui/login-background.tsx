export function LoginBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      <svg
        className="absolute inset-0 h-full w-full opacity-40 dark:opacity-20"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="shape-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.15" />
            <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="shape-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.12" />
            <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="shape-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.1" />
            <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Geometric shapes */}
        {/* Large circle - top right */}
        <circle
          cx="1000"
          cy="100"
          r="200"
          fill="url(#shape-gradient-1)"
        />

        {/* Medium circle - bottom left */}
        <circle
          cx="200"
          cy="600"
          r="150"
          fill="url(#shape-gradient-2)"
        />

        {/* Small circles scattered */}
        <circle
          cx="800"
          cy="500"
          r="80"
          fill="url(#shape-gradient-3)"
        />

        <circle
          cx="100"
          cy="200"
          r="60"
          fill="url(#shape-gradient-1)"
        />

        {/* Rounded rectangles */}
        <rect
          x="900"
          y="400"
          width="250"
          height="120"
          rx="20"
          fill="url(#shape-gradient-2)"
          transform="rotate(15 1025 460)"
        />

        <rect
          x="50"
          y="350"
          width="180"
          height="80"
          rx="15"
          fill="url(#shape-gradient-3)"
          transform="rotate(-10 140 390)"
        />

        {/* Subtle wave pattern at bottom */}
        <path
          d="M0,700 Q300,680 600,700 T1200,700 L1200,800 L0,800 Z"
          fill="url(#shape-gradient-1)"
        />
      </svg>
    </div>
  );
}