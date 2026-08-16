import React from "react";

interface ChomskyLogoProps {
  className?: string;
  size?: number;
  isDark?: boolean;
}

export const ChomskyLogo: React.FC<ChomskyLogoProps> = ({
  className = "",
  size = 32,
  isDark = true,
}) => {
  const primaryColor = isDark ? "#ffedd7" : "#424874";
  const accentColor = "#dc5000";
  const innerBg = isDark ? "#382416" : "#DCD6F7";
  const ringColor = isDark ? "#6c5f51" : "#A6B1E1";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 hover:scale-105 ${className}`}
    >
      {/* Outer Accept State Double Ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke={primaryColor}
        strokeWidth="3.5"
        strokeDasharray="1 0"
      />
      <circle
        cx="50"
        cy="50"
        r="37"
        stroke={primaryColor}
        strokeWidth="2.5"
      />

      {/* Inner State Core */}
      <circle
        cx="50"
        cy="50"
        r="28"
        fill={innerBg}
        stroke={ringColor}
        strokeWidth="1.5"
      />

      {/* Start State Transition Arrow */}
      <path
        d="M 6 50 L 22 50"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 16 44 L 22 50 L 16 56"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Orbiting Delta Transition Loop Vector */}
      <path
        d="M 40 22 C 34 8, 66 8, 60 22"
        stroke={primaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 62 16 L 60 22 L 54 20"
        stroke={primaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Stylized 'CS' Symbol (Chomsky Shrink) */}
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fill={primaryColor}
        fontFamily="JetBrains Mono, monospace"
        fontSize="17"
        fontWeight="800"
        letterSpacing="-0.5"
      >
        CS
      </text>

      {/* Ember Active Focal Point */}
      <circle
        cx="68"
        cy="33"
        r="3.5"
        fill={accentColor}
      />
    </svg>
  );
};
