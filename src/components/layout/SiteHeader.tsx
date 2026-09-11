"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Onde o menu completo passa a caber.
 *
 * Ele aparecia a partir de `md` (768 px) e não cabia: medido em produção, a linha do cabeçalho pede
 * 1111 px — marca 101, vão 16, menu 946 e respiro 48. Entre 768 e 1110 o menu vazava para fora da
 * janela e TODA página do site ganhava rolagem horizontal, inclusive no tablet deitado.
 *
 * 1140 é o valor medido mais uma folga de ~3%, para mudança de fonte ou item novo não reabrir o
 * defeito em silêncio. Se o menu ganhar itens, remeça: some a largura da marca, do vão, do `scrollWidth`
 * do nav e do padding da linha.
 *
 * O MESMO NÚMERO está em globals.css (busque por 1140). Mexeu aqui, mexa lá.
 */
const LARGURA_DO_MENU_COMPLETO = "(max-width: 1139px)";

const NAV = [
  { href: "/grafo", label: "Grafo" },
  { href: "/cronologia", label: "Cronologia" },
  { href: "/coincidencias", label: "Coincidências temporais" },
  { href: "/pessoas", label: "Pessoas" },
  { href: "/organizacoes", label: "Organizações" },
  { href: "/fontes", label: "Fontes" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/perguntar", label: "Sua IA responde" },
  { href: "/sobre", label: "Sobre" },
];

export function SiteHeader() {
  const rota = usePathname();
  const menuRef = useRef<HTMLDialogElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => menuRef.current?.close();
  useEffect(() => {
    menuRef.current?.close();
  }, [rota]);
  useEffect(() => {
    const mq = window.matchMedia(LARGURA_DO_MENU_COMPLETO);
    const closeOnDesktop = () => {
      if (!mq.matches) menuRef.current?.close();
    };
    mq.addEventListener("change", closeOnDesktop);
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const ativo = (href: string) => rota === href || rota.startsWith(`${href}/`);

  return (
    <header className="site-header border-border bg-bg/95 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="O Novelo Master, página inicial"
        >
          <Logo className="h-7 w-7" />
          <span className="text-fg text-sm font-semibold tracking-[0.10em] uppercase">
            O Novelo Master
          </span>
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 min-[1140px]:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo(item.href) ? "page" : undefined}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                ativo(item.href)
                  ? "text-fg border-accent border-b-2"
                  : "text-fg-2 hover:text-fg hover:bg-bg-3"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle className="ml-2" />
        </nav>
        <button
          ref={triggerRef}
          type="button"
          className="mobile-menu-trigger min-[1140px]:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-haspopup="dialog"
          onClick={() => {
            menuRef.current?.showModal();
            setMenuOpen(true);
          }}
        >
          <span aria-hidden="true">☰</span> Menu
        </button>
        <dialog
          ref={menuRef}
          id="mobile-navigation"
          className="mobile-navigation"
          aria-labelledby="mobile-navigation-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
          onClose={() => {
            setMenuOpen(false);
            if (triggerRef.current?.getClientRects().length) triggerRef.current.focus();
          }}
        >
          <div className="mobile-navigation-heading">
            <span id="mobile-navigation-title" className="font-semibold">
              O Novelo Master
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="mobile-menu-trigger"
              aria-label="Fechar menu"
            >
              Fechar ×
            </button>
          </div>
          <nav aria-label="Principal (móvel)" className="mobile-navigation-links">
            {[
              {
                title: "Explorar",
                items: [...NAV.slice(0, 5), { href: "/rede", label: "Rede em tabela" }],
              },
              { title: "Fontes e metodologia", items: NAV.slice(5, 7) },
              {
                title: "Sobre o projeto",
                items: [...NAV.slice(7), { href: "/imprensa", label: "Para a imprensa" }],
              },
            ].map((group) => (
              <div key={group.title} className="mobile-navigation-group">
                <p className="text-fg-3 mb-1 text-xs font-medium tracking-wider uppercase">
                  {group.title}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={ativo(item.href) ? "page" : undefined}
                  >
                    {item.label}
                    <span aria-hidden="true">{ativo(item.href) ? "●" : "↗"}</span>
                  </Link>
                ))}
              </div>
            ))}
            <div className="border-border border-t pt-4">
              <p className="text-fg-3 mb-2 text-xs">Aparência</p>
              <ThemeToggle />
            </div>
          </nav>
        </dialog>
      </div>
    </header>
  );
}
