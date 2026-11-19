export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          light ? 'bg-white/15 text-white' : 'bg-[#E8F7F0] text-[#078A59]'
        }`}
      >
        <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none" aria-hidden="true">
          <path
            d="M4 13L14 5L24 13"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 11.5V22.5H21V11.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="14.5" r="2" fill="currentColor" />
          <path
            d="M10.5 21C10.5 18.8 12.1 17.5 14 17.5C15.9 17.5 17.5 18.8 17.5 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span
        className={`text-lg font-bold tracking-tight whitespace-nowrap ${
          light ? 'text-white' : 'text-[#064B3C]'
        }`}
      >
        AqlliMahalla
      </span>
    </div>
  );
}
