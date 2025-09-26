export function LoginBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="shape-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="shape-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="shape-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="100%" height="100%" fill="url(#bg-gradient)" />

        {/* Geometric shapes */}
        {/* Large circle - top right */}
        <circle
          cx="1000"
          cy="100"
          r="200"
          fill="url(#shape-gradient-1)"
          opacity="0.6"
        />

        {/* Medium circle - bottom left */}
        <circle
          cx="200"
          cy="600"
          r="150"
          fill="url(#shape-gradient-2)"
          opacity="0.5"
        />

        {/* Small circles scattered */}
        <circle
          cx="800"
          cy="500"
          r="80"
          fill="url(#shape-gradient-3)"
          opacity="0.4"
        />

        <circle
          cx="100"
          cy="200"
          r="60"
          fill="url(#shape-gradient-1)"
          opacity="0.3"
        />

        {/* Rounded rectangles */}
        <rect
          x="900"
          y="400"
          width="250"
          height="120"
          rx="20"
          fill="url(#shape-gradient-2)"
          opacity="0.3"
          transform="rotate(15 1025 460)"
        />

        <rect
          x="50"
          y="350"
          width="180"
          height="80"
          rx="15"
          fill="url(#shape-gradient-3)"
          opacity="0.25"
          transform="rotate(-10 140 390)"
        />

        {/* Subtle grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Floating dots */}
        <g opacity="0.4">
          <circle cx="300" cy="150" r="3" fill="#64748b" />
          <circle cx="700" cy="250" r="2" fill="#64748b" />
          <circle cx="500" cy="100" r="2.5" fill="#64748b" />
          <circle cx="150" cy="450" r="2" fill="#64748b" />
          <circle cx="950" cy="300" r="3" fill="#64748b" />
          <circle cx="400" cy="650" r="2.5" fill="#64748b" />
        </g>

        {/* Subtle wave pattern at bottom */}
        <path
          d="M0,700 Q300,680 600,700 T1200,700 L1200,800 L0,800 Z"
          fill="url(#shape-gradient-1)"
          opacity="0.2"
        />
      </svg>
    </div>
  );
}