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

## O que não entrou (pendências de pesquisa)

Material já capturado em `processed/captures`, aguardando triagem e classificação:

- Dark Horse: Intercept (13, 14, 15 e 19/05/2026; 02/07/2026), CartaCapital e CNN (01/09/2026), negativas
  de Mário Frias (Gazeta 13/05) e Eduardo Bolsonaro (Congresso em Foco 15/05). Pessoas: Flávio Bolsonaro,
  Eduardo Bolsonaro, Mário Frias, Thiago Miranda, Karina Ferreira da Gama; organização Go Up Entertainment.
- Tayayá/Toffoli (Metrópoles e Gazeta 14/02/2026) e a lista de contatos do celular (Poder360 05/03/2026).
- Filho de Nunes Marques e Consult Inteligência (Band e Gazeta 20 e 21/03/2026; O Antagonista 19/03).
- Reag/João Carlos Mansur (CNN 05/02/2026; Migalhas 03/02/2026), Will Bank (CNN 21/01/2026), Banco Pleno
  (B3 18/02/2026), Ligga/Tanure (Gazeta 30/01/2026), Amprev/Alcolumbre (Metrópoles 19/01 e Poder360 10/02/2026),
  Vorcaro e Alcolumbre (Poder360 12/06/2026 e Congresso em Foco 12/06/2026).
- Jaques Wagner: Metrópoles e O Tempo (24/01/2026), Poder360 (31/07/2026), saída da liderança (24/06/2026).
- Fábio Faria e SBT (Times Brasil 05/08/2026; Portal Alta Definição), projeto eólico (Oeste 29/01/2026).
- Airton Vieira (Gazeta 14/08/2024), Bruno Bianco (JOTA 24/07/2023), João Camargo/Esfera (InvestNews 05/06/2025).
- Robinson Faria, Patrícia Abravanel e Rodrigo Pacheco: sem fonte documental localizada nesta rodada
  além de menções genéricas; não foram criados registros para evitar inclusão por mera menção.
- Atos do Banco Central (liquidações de Reag, Will Bank e Banco Pleno): páginas do BC são renderizadas
  em JavaScript; buscar os PDFs de "Atos do Presidente" ou o DOU.
- Fotografias: nenhuma ingerida; usar Wikimedia Commons com licença registrada em `photo`.

## Armadilhas encontradas

- gov.br/pf e EBC (Agência Brasil, Agência Gov) restritos no período eleitoral; usar Internet Archive.
- bcb.gov.br: notícias em Angular; PDFs de atas e comunicados funcionam.
- O Globo, Folha e Valor: paywall; preferir reproduções em veículos abertos ou documentos originais.
- Datas de matéria: preferir `datePublished` dos metadados a inferências pelo texto.
