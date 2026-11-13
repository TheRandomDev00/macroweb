export function GradientOrbs({
  variant = "hero",
}: {
  variant?: "hero" | "cta";
}) {
  return (
    <div
      className={`gradient-orbs gradient-orbs--${variant}`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </div>
  );
}
