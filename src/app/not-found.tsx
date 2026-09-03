import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-fg-3 font-mono text-xs tracking-[0.2em] uppercase">404</p>
      <h1 className="text-fg mt-2 text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-fg-2 mt-3 text-sm">O registro pode não existir ou ainda não ter sido publicado após revisão.</p>
      <Link href="/grafo" className="text-accent mt-6 underline underline-offset-4">
        Voltar ao grafo
      </Link>
    </div>
  );
}
