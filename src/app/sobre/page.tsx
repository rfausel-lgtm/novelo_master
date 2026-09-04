import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/pages";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Sobre e contato",
  description:
    "Quem publica O Novelo Master, por que este caso, como o corpus é produzido, declaração de conflito de interesse e o canal de direito de resposta e correções.",
  path: "/sobre",
  type: "website",
});

const ASSUNTO = encodeURIComponent("Novelo Master — ");
const CORPO = encodeURIComponent(
  "Se a mensagem for sobre um registro específico, cole aqui o endereço da página.\n\n",
);

function Secao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-border scroll-mt-20 border-t py-7 first:border-t-0 first:pt-0">
      <h2 className="text-fg mb-3 text-xl font-semibold tracking-tight">{titulo}</h2>
      <div className="prose-novelo text-fg-2 text-sm sm:text-base">{children}</div>
    </section>
  );
}

export default function SobrePage() {
  return (
    <PageShell>
      <PageTitle
        eyebrow="Quem faz e como responder"
        title="Sobre e contato"
        lede="Este site é assinado. Se você é citado aqui, ou encontrou um erro, existe um endereço para escrever — e o que você responder entra no dossiê."
      />

      <Secao id="quem-publica" titulo="Quem publica">
        <p>
          O Novelo Master é escrito e mantido por <strong className="text-fg">Rafael Fausel</strong>,
          advogado. O projeto é pessoal e independente: não é publicação de escritório, de veículo de
          imprensa, de partido ou de instituição.
        </p>
        <p>
          O código, o corpus e o histórico de alterações são{" "}
          <a href={SITE.repository} rel="noreferrer noopener" target="_blank">
            públicos no GitHub
          </a>
          . Qualquer pessoa pode conferir quando cada registro entrou, com que fonte e quem revisou.
        </p>
      </Secao>

      <Secao id="por-que" titulo="Por que este caso">
        <p>
          A liquidação do Banco Master pelo Banco Central e a investigação que se seguiu produziram,
          em pouco tempo, um volume de decisões, relatórios, contratos e depoimentos maior do que uma
          leitura linear consegue sustentar. A pergunta que o noticiário responde bem é o que
          aconteceu; a que fica sem resposta é <em>quem se liga a quem, desde quando, e com que
          prova</em>.
        </p>
        <p>
          Este site tenta responder à segunda. Não acusa ninguém, não conclui por ninguém e não
          substitui a investigação oficial: organiza o que já é público e mostra, para cada linha do
          mapa, de onde ela veio.
        </p>
      </Secao>

      <Secao id="como" titulo="Como o corpus é produzido">
        <p>
          Cada pessoa, organização, evento e relação é um registro com fonte declarada e uma classe de
          evidência: documental direto, corroborado, alegação ou inferência. Um lint editorial roda a
          cada alteração e barra a publicação quando a classificação não se sustenta — por exemplo,
          quando um registro documental não aponta para documento primário.
        </p>
        <p>
          O detalhe está na <Link href="/metodologia">metodologia</Link> e na{" "}
          <Link href="/politica-editorial">política editorial</Link>, que fixa o vocabulário
          permitido, o tratamento de dados pessoais e as regras de correção e retratação.
        </p>
      </Secao>

      <Secao id="conflito" titulo="Conflito de interesse">
        <p>
          O autor não representa, nem representou, nenhuma das pessoas ou organizações citadas neste
          site, e não recebe remuneração, patrocínio ou financiamento de qualquer delas. O projeto não
          tem publicidade.
        </p>
        <p>
          Se essa situação mudar — se o autor passar a atuar profissionalmente em causa ligada a
          alguém citado aqui —, a mudança será declarada nesta página e registrada em{" "}
          <Link href="/atualizacoes">atualizações</Link>.
        </p>
      </Secao>

      <Secao id="resposta" titulo="Direito de resposta e correções">
        <p>
          Se você é citado neste site, tem direito a que sua posição apareça junto do registro que a
          motivou — não em outro lugar, não depois. Ao receber sua manifestação, ela é publicada no
          dossiê como <strong className="text-fg">posição do citado</strong>, com a data e a íntegra
          do que foi enviado ou um resumo fiel, à sua escolha.
        </p>
        <p>
          O mesmo canal vale para apontar erro de fato, fonte mal lida, homônimo trocado ou pedido de
          remoção de dado pessoal. Erros confirmados são corrigidos e a correção fica registrada em{" "}
          <Link href="/atualizacoes">atualizações</Link>, sem apagar o histórico.
        </p>
        <p>O compromisso é responder em até cinco dias úteis.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 not-prose">
          <a
            href={`mailto:${SITE.contactEmail}?subject=${ASSUNTO}&body=${CORPO}`}
            className="bg-accent text-bg hover:bg-accent/90 inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors"
          >
            Entre em contato
          </a>
          <span className="text-fg-3 font-mono text-xs">{SITE.contactEmail}</span>
        </div>
      </Secao>

      <Secao id="reuso" titulo="Reúso e citação">
        <p>
          Jornalistas, pesquisadores e advogados podem citar e reutilizar o conteúdo, com atribuição e
          link. Cada dossiê e cada fonte tem endereço próprio e estável; o grafo aceita link direto
          para um nó (<code>?n=</code>) e para uma conexão (<code>?e=</code>), o que permite apontar
          exatamente o trecho do mapa que sustenta a citação.
        </p>
      </Secao>
    </PageShell>
  );
}
