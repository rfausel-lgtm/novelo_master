import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/pages";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { CopiarPrompt } from "@/components/entity/CopiarPrompt";
import { corpus, stats } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Perguntar a um assistente",
  description:
    "Como usar Claude, ChatGPT ou outro assistente para consultar o acervo inteiro do Novelo Master, com as regras que mantêm a resposta presa às fontes.",
  path: "/perguntar",
  type: "website",
});

const PROMPT = `Leia https://novelo-master.fausel.adv.br/acervo.txt — é o acervo completo do caso Banco Master, com a classe de evidência e a fonte de cada registro.

Responda usando apenas o que está nesse arquivo. Cite sempre a classe de evidência (D documental, C corroborado, A alegação, I inferência) e o id do registro, para eu conferir na página. Se algo não constar, diga que não consta em vez de completar de memória. Não trate alegação ou inferência como fato, e não afirme crime.

Minha pergunta: `;

function Secao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-border scroll-mt-20 border-t pt-8 pb-6 first:border-t-0 first:pt-0">
      <h2 className="text-fg mb-3 text-[1.375rem] leading-snug font-semibold tracking-[-0.01em]">
        {titulo}
      </h2>
      <div className="prose-novelo text-fg-2 text-sm sm:text-base">{children}</div>
    </section>
  );
}

export default function PerguntarPage() {
  const n = (v: number) => v.toLocaleString("pt-BR");
  return (
    <PageShell>
      <PageTitle
        eyebrow="Ler o acervo com ajuda"
        title="Perguntar a um assistente"
        lede="O acervo inteiro cabe num arquivo. Se você usa Claude, ChatGPT ou outro assistente no navegador, dá para perguntar sobre o caso e receber respostas presas às fontes daqui — não à memória do modelo."
      />

      <Secao id="como" titulo="Como fazer">
        <p>
          Abra seu assistente, cole o texto abaixo, escreva a pergunta no fim e envie. O arquivo tem{" "}
          {n(corpus.people.length)} pessoas, {n(corpus.organizations.length)} organizações,{" "}
          {n(corpus.events.length)} eventos e {n(corpus.relationships.length)} relações, cada um com a
          classe de evidência e a contagem de fontes.
        </p>
        <div className="not-prose mt-4">
          <CopiarPrompt texto={PROMPT} />
        </div>
      </Secao>

      <Secao id="porque" titulo="Por que colar isso, e não só perguntar">
        <p>
          Um assistente de navegador lê a página que está aberta, não o site. Sem apontar o acervo,
          ele responde sobre o caso a partir do que aprendeu no treino — que pode estar desatualizado,
          incompleto ou simplesmente errado, e que não distingue o que aqui é documento do que é
          alegação.
        </p>
        <p>
          As instruções do prompt não são cerimônia: são as mesmas regras que a{" "}
          <Link href="/metodologia">metodologia</Link> impõe a este site. Sem elas, um modelo tende a
          transformar alegação em fato e a costurar conexões que o corpus não afirma — exatamente o
          que o projeto existe para não fazer.
        </p>
      </Secao>

      <Secao id="limites" titulo="O que a resposta não é">
        <p>
          Resposta de assistente <strong className="text-fg">não é fonte</strong>. Ela pode errar
          mesmo com o acervo à mão: resumir demais, embaralhar datas, atribuir a uma pessoa o que é de
          outra. Use-a para achar o caminho, e confirme no registro citado — cada id do acervo tem
          página própria, com as fontes e a posição do citado.
        </p>
        <p>
          Se a resposta divergir do que está na página, a página prevalece. E se você encontrar erro
          no próprio acervo, <Link href="/sobre#resposta">escreva</Link>: correção confirmada entra em{" "}
          <Link href="/atualizacoes">atualizações</Link>.
        </p>
      </Secao>

      <Secao id="arquivos" titulo="Os arquivos, para quem quiser ir direto">
        <ul>
          <li>
            <a href="/acervo.txt">acervo.txt</a> — o corpus inteiro em texto, com classe de evidência
            e fontes por registro. É o arquivo do prompt acima.
          </li>
          <li>
            <a href="/llms.txt">llms.txt</a> — índice curto no padrão que assistentes procuram, com as
            regras de leitura e os links.
          </li>
          <li>
            <a href="/data/graph.json">graph.json</a> — o grafo: nós, arestas, categorias e posições.{" "}
            <a href="/data/graph-evidence.json">graph-evidence.json</a> traz a camada probatória.
          </li>
          <li>
            <a href="/data/novelo.kml">novelo.kml</a> — os lugares geolocalizados, para abrir no
            Google Earth ou no QGIS.
          </li>
        </ul>
        <p className="text-fg-3 text-xs">
          Tudo sob a mesma condição do resto do site: {n(stats.official_sources)} das{" "}
          {n(stats.sources)} fontes são oficiais, e cada afirmação carrega a classe que a sustenta.
          Reúso com atribuição e link para {SITE.url.replace(/^https?:\/\//, "")}.
        </p>
      </Secao>
    </PageShell>
  );
}
