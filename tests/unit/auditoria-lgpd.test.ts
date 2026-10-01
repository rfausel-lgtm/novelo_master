import { describe, it, expect } from "vitest";
import { cpfValido, ocorrenciasNaLinha, varrerConteudo } from "../../scripts/lib/auditoria/lgpd";

/**
 * Os CPFs abaixo são sintéticos, construídos só para exercitar o dígito verificador. O arquivo
 * inteiro está na lista `NAO_VARRER` de `scripts/auditoria.ts`: fosse varrido, a própria auditoria
 * acusaria o teste da auditoria.
 */
const CPF_VALIDO = "529.982.247-25";
const CPF_DV_ERRADO = "529.982.247-26";
const CNPJ = "12.345.678/0001-95";

describe("auditoria — dado pessoal: o valor nunca sai", () => {
  const linhasComDado = [
    `summary: titular do CPF ${CPF_VALIDO} segundo o documento`,
    "  telefone de contato: (47) 99123-4567",
    "  e-mail: joao.pereira@provedor.com.br",
    "  Rua X, CEP 89010-000, apto 402",
    "  RG n. 12.345.678-9 apresentado na oitiva",
    "  data de nascimento: 12/03/1975",
  ];

  it("nenhum achado carrega dígito na mensagem ou na evidência mascarada", () => {
    const achados = varrerConteudo(linhasComDado.join("\n"), "data/people/fulano.yaml");
    expect(achados.length).toBeGreaterThan(0);
    for (const a of achados) {
      expect(a.categoria).toBe("dados-pessoais");
      expect(a.mensagem).not.toMatch(/\d/);
      expect(a.evidencia_mascarada ?? "").not.toMatch(/\d/);
    }
  });

  it("o JSON do relatório não contém nenhum dos valores encontrados", () => {
    const serializado = JSON.stringify(
      varrerConteudo(linhasComDado.join("\n"), "data/people/fulano.yaml"),
    );
    for (const valor of [
      CPF_VALIDO,
      "52998224725",
      "99123-4567",
      "joao.pereira@provedor.com.br",
      "joao.pereira",
      "89010-000",
      "12/03/1975",
    ]) {
      expect(serializado).not.toContain(valor);
    }
  });

  it("o id do achado não deriva do valor: só arquivo, linha e tipo", () => {
    const a = varrerConteudo(`CPF ${CPF_VALIDO}`, "data/people/x.yaml");
    const b = varrerConteudo("CPF 111.444.777-35", "data/people/x.yaml");
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(a[0].id).toBe(b[0].id);
  });

  it("localiza o achado por arquivo e linha", () => {
    const achados = varrerConteudo(`primeira\nsegunda\nCPF ${CPF_VALIDO}\n`, "data/people/x.yaml");
    expect(achados[0]).toMatchObject({
      arquivo: "data/people/x.yaml",
      linha: 3,
      gravidade: "alta",
    });
  });
});

describe("auditoria — dado pessoal: falso positivo", () => {
  it("CPF exige dígito verificador", () => {
    expect(cpfValido("52998224725")).toBe(true);
    expect(cpfValido("52998224726")).toBe(false);
    expect(cpfValido("11111111111")).toBe(false);
    expect(ocorrenciasNaLinha(`titular do CPF ${CPF_DV_ERRADO}`)).not.toContain("cpf");
  });

  it("CNPJ é dado público e não vira CPF", () => {
    expect(ocorrenciasNaLinha(`cnpj: ${CNPJ}`)).toEqual([]);
  });

  it("número de processo no padrão CNJ não vira CPF", () => {
    expect(ocorrenciasNaLinha("reference: 0001234-56.2024.8.24.0008")).not.toContain("cpf");
  });

  it("hash sha256 não vira CPF", () => {
    const hash = "a1b2c3d45299822472598765432101234567890abcdef0123456789abcdef0123";
    expect(ocorrenciasNaLinha(`sha256: ${hash}`)).not.toContain("cpf");
  });

  it("intervalo de anos não vira telefone", () => {
    expect(ocorrenciasNaLinha("contato mantido no período (2024-2026)")).not.toContain("telefone");
    expect(ocorrenciasNaLinha("telefone de contato: 99123-4567")).toContain("telefone");
  });

  it("'archive' não é dado de saúde: o termo tem de estar isolado", () => {
    expect(ocorrenciasNaLinha("archive_url: https://web.archive.org/web/2024/x")).toEqual([]);
    expect(ocorrenciasNaLinha("descreve a internação compulsória do desafeto")).toContain(
      "dado-de-saude",
    );
  });

  it("e-mail dentro de uma URL é rebaixado, não descartado — às vezes é o login de quem publicou", () => {
    const tipos = ocorrenciasNaLinha("url: https://orgao.gov.br/uploads/pasta@setor.local/ata.pdf");
    expect(tipos).toEqual(["email-em-url"]);
    expect(tipos).not.toContain("email-pessoal");
    const achado = varrerConteudo(
      "url: https://amprev.ap.gov.br/uploads/fulana@AMPREV.LOCAL/ata.pdf",
      "data/sources/src-x.yaml",
    )[0];
    expect(achado.gravidade).toBe("baixa");
    expect(achado.evidencia_mascarada).not.toContain("fulana");
  });

  it("caixa institucional e domínio do próprio projeto entram como baixa", () => {
    expect(ocorrenciasNaLinha("contato: imprensa@stf.jus.br")).toContain("email-institucional");
    expect(ocorrenciasNaLinha("contactEmail: rafael@fausel.adv.br")).toContain(
      "email-institucional",
    );
    const achado = varrerConteudo("contato: imprensa@stf.jus.br", "src/x.ts")[0];
    expect(achado.gravidade).toBe("baixa");
  });

  it("CEP sozinho é município e não é dado vedado; com unidade, é", () => {
    expect(ocorrenciasNaLinha("sede em Blumenau, CEP 89010-000")).toEqual([]);
    expect(ocorrenciasNaLinha("sede em Blumenau, CEP 89010-000, bloco B")).toContain(
      "cep-com-unidade",
    );
  });

  it("data solta não é data de nascimento sem o contexto", () => {
    expect(ocorrenciasNaLinha("date: 1975-03-12")).toEqual([]);
    expect(ocorrenciasNaLinha("nascido em 12/03/1975")).toContain("data-de-nascimento");
  });
});
