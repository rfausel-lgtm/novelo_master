import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "pt_BR",
    title: SITE.name,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  authors: [{ name: SITE.author, url: `${SITE.url}/sobre/` }],
  creator: SITE.author,
  publisher: SITE.author,
  applicationName: SITE.name,
  keywords: [
    "Banco Master",
    "Daniel Vorcaro",
    "Operação Compliance Zero",
    "Banco Central",
    "liquidação extrajudicial",
    "investigação",
    "fontes públicas",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090C11" },
    { media: "(prefers-color-scheme: light)", color: "#F4F6F9" },
  ],
  colorScheme: "light dark",
};

/*
 * Decide o tema antes do primeiro paint. Em export estatico nao ha servidor para negociar,
 * entao o script vai inline no HTML de cada pagina; sem ele o leitor de tema claro veria um
 * flash escuro a cada navegacao.
 */
const TEMA_INICIAL = `(function(){try{
var e=localStorage.getItem("novelo-tema");
var s=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";
var t=(e==="light"||e==="dark")?e:s;
var r=document.documentElement;
r.setAttribute("data-theme",t);
r.style.colorScheme=t;
if(e==="light"||e==="dark")r.setAttribute("data-theme-source","user");
}catch(_){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
      </head>
      <body className="bg-bg text-fg flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="focus:bg-accent focus:text-bg sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:px-3 focus:py-2"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
