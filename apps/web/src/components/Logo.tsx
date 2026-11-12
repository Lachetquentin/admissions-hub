export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="6" className="fill-primary" />
        <path
          d="M8 19 L14 8 L20 19 M10.5 15 H17.5"
          stroke="#fff"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-base font-medium tracking-tight">Admissions Hub</span>
    </span>
  );
}
