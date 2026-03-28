interface Props {
  variant?: "dark-to-light" | "light-to-dark";
  className?: string;
}

export function SectionDivider({ variant = "dark-to-light", className = "" }: Props) {
  const colors =
    variant === "dark-to-light"
      ? { top: "#0F1729", bottom: "#E8DCC8" }
      : { top: "#E8DCC8", bottom: "#0F1729" };

  return (
    <svg
      viewBox="0 0 1440 80"
      className={`w-full block ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M0,0 L1440,0 L1440,40 Q1200,80 960,50 Q720,20 480,55 Q240,90 0,45 Z"
        fill={colors.top}
      />
      <path
        d="M0,45 Q240,90 480,55 Q720,20 960,50 Q1200,80 1440,40 L1440,80 L0,80 Z"
        fill={colors.bottom}
      />
    </svg>
  );
}
