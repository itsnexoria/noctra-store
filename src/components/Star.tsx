/** The four-point star from the Noctra wordmark, as an inline SVG so it inherits currentColor. */
export function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Noctra star" fill="currentColor">
      <path d="M32 2c1.7 14.5 5.5 25.5 30 30-24.5 4.5-28.3 15.5-30 30-1.7-14.5-5.5-25.5-30-30 24.5-4.5 28.3-15.5 30-30z" />
    </svg>
  );
}
