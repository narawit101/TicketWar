import React from "react";

interface TicketWarLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textSize?: string;
}

export const TicketWarLogo: React.FC<TicketWarLogoProps> = ({
  size = 32,
  className = "",
  showText = false,
  textSize = "text-xl",
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient
            id="ticket-green-grad"
            x1="6"
            y1="6"
            x2="26"
            y2="26"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#24ef6c" />
            <stop offset="100%" stopColor="#18b64e" />
          </linearGradient>
        </defs>

        {/* Dark Squircle Container */}
        <rect width="32" height="32" rx="7" fill="#0f0f0f" />
        <rect
          x="0.5"
          y="0.5"
          width="31"
          height="31"
          rx="6.5"
          stroke="#2a2a2a"
          strokeWidth="1"
        />

        {/* Concert Ticket Stub with Notch Cutouts */}
        <path
          d="M9 5h14a3 3 0 0 1 3 3v4.25a2.75 2.75 0 0 0 0 5.5V23a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-5.25a2.75 2.75 0 0 0 0-5.5V8a3 3 0 0 1 3-3z"
          fill="url(#ticket-green-grad)"
        />

        {/* War Clash Lightning Bolt */}
        <path
          d="M17.5 7.5L11 16.5h4.5l-1.5 8 7-9.5h-4.5l1.5-7.5z"
          fill="#0f0f0f"
        />
      </svg>

      {showText && (
        <span className={`font-extrabold tracking-tight text-white ${textSize}`}>
          Ticket<span className="text-[#1ed760]">War</span>
        </span>
      )}
    </div>
  );
};
