import type { Corpus } from "../../../src/lib/schema";
import { idsCitados, percorrerCorpus } from "./corpus";
import { novoAchado, type Achado } from "./tipos";

/**
 * Integridade referencial e órfãos.
 *
 * O lint editorial (`scripts/lib/lint.ts`) já bloqueia o sentido "para frente": id citado que não
 * existe, evidência sem fonte nem documento, entidade isolada sem `isolation_reason`. Nada disso é
 * refeito aqui — a auditoria reaproveita a saída do lint.
 *
 * O que falta é o sentido INVERSO, que nenhuma regra do lint olha: registro que existe e ninguém
 * cita. Fonte capturada e nunca usada, documento que perdeu o registro que o invocava, evidência
 * órfã depois de uma edição. Nada disso quebra o build, e por isso envelhece em silêncio.
 *
 * A única exceção de "para frente" é `data/revisions/`: o lint não percorre revisões, então
 * `affected_ids` apontando para id inexistente passa batido hoje.
 */
export function verificarIntegridade(corpus: Corpus): Achado[] {
  const achados: Achado[] = [];

  const existentes = new Set<string>();
  for (const { id } of percorrerCorpus(corpus)) existentes.add(id);

  /** Quem cita quem. Revisões entram como citantes — e só como citantes. */
  const citados = new Set<string>();
  for (const { registro } of percorrerCorpus(corpus)) {
    for (const id of idsCitados(registro)) citados.add(id);
  }

  const ORFAO_RELEVANTE = {
    sources: {
      gravidade: "baixa" as const,
      mensagem:
        "fonte não é citada por nenhum registro do acervo: confirme se o registro que a invocava foi " +
        "removido ou se a captura ficou pela metade",
    },
    documents: {
      gravidade: "baixa" as const,
      mensagem:
        "documento não é citado por nenhum registro do acervo: confirme se o registro que o invocava " +
        "foi removido ou se a captura ficou pela metade",
    },
    evidence: {
      gravidade: "media" as const,
      mensagem:
        "evidência não é citada por nenhum registro do acervo: evidência existe para sustentar um " +
        "registro, e órfã ou perdeu o registro que a invocava ou nunca foi ligada",
    },
  };

  for (const { chave, id, arquivo } of percorrerCorpus(corpus)) {
    const regra = ORFAO_RELEVANTE[chave as keyof typeof ORFAO_RELEVANTE];
    if (!regra || citados.has(id)) continue;
    achados.push(
      novoAchado({
        categoria: "integridade",
        gravidade: regra.gravidade,
        arquivo,
        registro: id,
        mensagem: regra.mensagem,
      }),
    );
  }

  /* Revisões: o lint não as percorre, então referência quebrada em affected_ids passa batido. */
  for (const revisao of corpus.revisions) {
    for (const ref of revisao.affected_ids) {
      if (existentes.has(ref)) continue;
      achados.push(
        novoAchado({
          categoria: "integridade",
          gravidade: "media",
          arquivo: `data/revisions/${revisao.id}.yaml`,
          registro: revisao.id,
          mensagem: `affected_ids cita id inexistente "${ref}": a atualização aponta para um registro que não está no acervo`,
        }),
      );
    }
  }

  return achados;
}
