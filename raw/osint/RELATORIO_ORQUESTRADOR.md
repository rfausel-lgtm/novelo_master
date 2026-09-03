# Relatório de pesquisa do orquestrador (2026-09-03)

## Contexto

Quatro investigadores OSINT paralelos (clusters A a D) foram lançados com o briefing em
`raw/osint/BRIEFING.md`. A API do modelo esteve sobrecarregada (erro 529) durante toda a sessão e os
agentes foram encerrados repetidamente antes de gravar registros. Suas capturas de páginas ficaram em
`processed/captures` (cerca de 200 páginas, fora do Git) e foram parcialmente aproveitadas. A pesquisa
efetivamente publicada foi feita pelo orquestrador em cinco lotes.

## Lotes publicados

| Lote | Escopo | Fontes primárias lidas |
|------|--------|------------------------|
| 1 | Núcleo: liquidação, Compliance Zero (fases 1, 3, 4, 5), Vorcaro, BRB, Ciro Nogueira | STF (4 notas), PF (via Internet Archive), ata do Comef |
| 2 | Judiciário: relatório da PF sobre o celular (PET 16.662), contrato Barci de Moraes, notas de Moraes e do escritório, Toffoli, CPI na Câmara, PEC 65/2023, fases 6 e 8 | STF (6 notas), IPJ-A 3298613/2026 (PDF), contrato (PDF), Senado (matéria) |
| 3 | BRB/CLDF, rejeição do BC, FGC, Planalto (04/12/2024), prisão e soltura (TRF-1) | CLDF, FGC (2 PDFs) |
| 4 | Kassab, pagamentos declarados à Receita (Temer, Rueda, Mantega, Meirelles), Esteves/BTG, encontro Mendonça–Vorcaro | imprensa com posições dos citados |
| 5 | Contraditório dos citados, CPMI/CPI, Londres (abr/2024), 9ª fase (Wagner), Fictor, BRB 28/03/2025 | Agência Senado (5 notas) |
| 6 | Dark Horse (Intercept, CartaCapital, CNN, Metrópoles, Gazeta, Poder360), Tayayá/Maridt (nota de Toffoli), Consult/Nunes Marques (Coaf via Estadão), Reag/Will/Pleno/Ligga, Amprev/Zona Cinzenta, relatório da PF sobre Wagner, projeto eólico de Faria | STF (nota do gabinete), Amprev (comunicado), Agência Brasil (via Internet Archive), Agência Senado |

## O que não entrou (pendências de pesquisa)

Cobertos no lote 6: Dark Horse, Tayayá/Toffoli, Consult/Nunes Marques, Reag/Will/Pleno/Ligga, Amprev/Alcolumbre,
Wagner (relatório da PF, saída da liderança), Fábio Faria (projeto eólico, intermediação com Moraes).

Ainda pendente:

- Karina Ferreira da Gama / Instituto Conhecer Brasil (JB 17/05/2026; Metrópoles): contrato de R$ 108 milhões
  com a Prefeitura de São Paulo; não criado registro de pessoa por envolver investigação estadual sem
  documento oficial lido.
- Airton Vieira (Gazeta 14/08/2024): capturado, mas sem vínculo documentado com o caso Master nas fontes lidas.
- Bruno Bianco (JOTA 24/07/2023) e João Camargo/Esfera (InvestNews 05/06/2025): sem fato ligado ao Master
  além de menções; Vorcaro aparece em eventos da Esfera (foto do Poder360), o que pode virar evento social.
- Robinson Faria, Patrícia Abravanel e Rodrigo Pacheco: apenas menções genéricas (Pacheco e Alcolumbre são
  citados em mensagens de Faria, segundo a piauí); sem registro para evitar inclusão por mera menção.
- Atos do Banco Central (liquidações de Reag/CBSF, Will Financeira e Banco Pleno): buscar os PDFs de
  "Atos do Presidente" ou o DOU; hoje classificados como C/A a partir da imprensa.
- Relatório da PF sobre Wagner (PDF de 33 MB no Poder360), decisão da 10ª fase (PDF no Poder360) e decisão
  da Justiça Federal na Zona Cinzenta (PDF no Poder360): ler e promover evidências A/C para D.
- Fotografias: nenhuma ingerida; usar Wikimedia Commons com licença registrada em `photo`.

## Armadilhas encontradas

- gov.br/pf e EBC (Agência Brasil, Agência Gov) restritos no período eleitoral; usar Internet Archive.
- bcb.gov.br: notícias em Angular; PDFs de atas e comunicados funcionam.
- O Globo, Folha e Valor: paywall; preferir reproduções em veículos abertos ou documentos originais.
- Datas de matéria: preferir `datePublished` dos metadados a inferências pelo texto.
