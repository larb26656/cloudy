interface BotEyeIconProps {
  className?: string;
}

export function BotEyeIcon({ className }: BotEyeIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect
        x="4.59"
        y="7.22"
        width="4.29"
        height="9.56"
        rx="2.15"
        fill="#ffffff"
      />
      <rect
        x="15.12"
        y="7.22"
        width="4.29"
        height="9.56"
        rx="2.15"
        fill="#ffffff"
      />
    </svg>
  );
}
