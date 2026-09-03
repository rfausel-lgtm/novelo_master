/**
 * Marca: o "O" formado por nós e conexões (rede sendo desfeita).
 * Sem desenho literal de novelo.
 */
export function Logo({ className = "h-8 w-8", title = "O Novelo Master" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g stroke="#4C8DFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
        <path d="M32 8 L50 16 L56 34 L44 52 L22 54 L10 40 L12 20 Z" />
        <path d="M32 8 L44 52" opacity="0.45" />
        <path d="M50 16 L22 54" opacity="0.45" />
        <path d="M56 34 L12 20" opacity="0.45" />
        <path d="M10 40 L50 16" opacity="0.3" />
        <path d="M22 54 L56 34" opacity="0.3" />
      </g>
      <g fill="#F4F6F8">
        <circle cx="32" cy="8" r="3.2" />
        <circle cx="50" cy="16" r="2.6" />
        <circle cx="56" cy="34" r="3.2" />
        <circle cx="44" cy="52" r="2.6" />
        <circle cx="22" cy="54" r="3.2" />
        <circle cx="10" cy="40" r="2.6" />
        <circle cx="12" cy="20" r="3.2" />
      </g>
      <circle cx="33" cy="33" r="2.2" fill="#4DBF91" />
    </svg>
  );
}
