# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). O histórico editorial
dos dados está em `/atualizacoes` no site e em `data/revisions`.

## [Não publicado]

### Adicionado

- Filtros da cronologia e dos índices na URL (`?agente=`, `?tipo=`, `?classe=`, `?q=`), com botão
  "Copiar link deste recorte". Voltar de um registro deixou de perder o recorte, e o link mostra a
  outra pessoa a mesma vista. O recorte é reproduzido sobre os dados atuais, não sobre uma versão
  histórica. A leitura da URL é feita por `useSyncExternalStore`, e não por `useSearchParams`, que na
  exportação estática tiraria a cronologia e os índices do HTML — justamente o conteúdo indexável.
- "Copiar dossiê" e "Baixar .txt" em cada pessoa e organização, servindo `/dossies/<id>.txt`
  gerado no build: 194 arquivos com as mesmas regras de vínculo das páginas, sem truncamento, com as
  fontes por URL. Serve para perguntar sobre um registro só, e para quando o assistente não consegue
  abrir endereço nenhum — foi o que aconteceu num teste real. O tamanho é anunciado no botão, porque
  os dossiês vão de 3 KB a 339 KB.
- Três últimas atualizações editoriais na página inicial, com os registros que cada uma tocou e
  âncora para a entrada correspondente em `/atualizacoes`. Revisões, não commits.
- Marcas oficiais de mais sete organizações (STF, TCU, CVM, COAF, OAB Conselho Federal, Partido Novo e
  Polícia Civil de SP), do Wikimedia Commons, em domínio público ou Creative Commons, com autoria,
  licença e link para o arquivo original — de 13 para 20 das 80 organizações. As 60 restantes são,
  em maioria, empresas privadas, fundos e holdings sem presença no Commons; a política editorial só
  admite marca com licença livre ou material institucional com uso permitido, e nada disso foi
  localizado para elas.
- Identidade visual "cartografia documental": arte de fundo do hero da home, fundo discreto do
  carregamento do grafo e faixas de abertura em Cronologia, Fontes e Metodologia, cada uma em arte
  própria para o tema claro e para o escuro (nunca inversão), servida em AVIF com fallback WebP a
  partir de `public/assets/novelo/`. O centro do hero fica protegido por um véu radial para o texto
  não competir com a arte. Masters, prompts e critérios de geração ficam fora do repositório.
- Acervo em texto (`/acervo.txt`), índice `llms.txt` e página `/perguntar`. O corpus publicado inteiro
  num arquivo — 666 registros, com classe de evidência, contagem de fontes e id de volta para a página —
  precedido das regras de leitura que o site impõe a si mesmo. Existe porque uma extensão de navegador lê
  a página aberta, não o site: sem artefato único, "analise o acervo" vira resposta baseada numa página
  só, ou no que o modelo acha que sabe do caso. A página entrega o prompt pronto e diz o que a resposta
  de um assistente não é — não é fonte, e a página prevalece sobre ela.
- Lugares geolocalizados em eventos e organizações (`place`: nome, coordenada, precisão e nota), com
  minimapa estático servido pela própria origem e exportação em `public/data/novelo.kml`. Os tiles do
  OpenStreetMap são compostos no repositório por `python/novelo_osint/minimapas.py`: mapa embutido de
  provedor exigiria afrouxar a CSP e faria cada leitor de um dossiê ser requisitado por um terceiro.
  Onde a localização exata não é conhecida, marca-se o município, com a precisão declarada na legenda.
- Tema claro, escuro e automático, com alternador no cabeçalho, persistência local e aplicação antes da
  primeira pintura. `tests/unit/contraste.test.ts` mede a razão de contraste de cada par token/fundo nas
  duas paletas e falha abaixo de WCAG AA.
- Página `/sobre` com autoria, motivo do projeto, como o corpus é feito, declaração de ausência de
  conflito de interesse, direito de resposta e condições de reúso; botão de contato no rodapé.
- Imagem de compartilhamento (WhatsApp, redes sociais) que desenha o grafo real do corpus atrás da
  chamada, gerada no build; site registrado no Google Search Console com o sitemap processado.
- Retratos de licença livre de 19 pessoas além das 37 iniciais (56 de 114), do Wikimedia Commons e da
  Agência Brasil, sempre com autoria, licença e link para o arquivo original; coletor da Agência Brasil
  em `python/novelo_osint/fotos.py`.

- Lote 86 do corpus: o caso gêmeo do Rio, e o caminho que ele tomou até o Supremo. Obtidas as cinco
  publicações do agravo nº 3000060-09.2026.8.19.0000 do TJ-RJ, com os inteiros teores. A ação de origem é a
  cautelar nº 3049678-51.2025.8.19.0001, do Estado do Rio e do Rioprevidência contra o Banco Master e a PKL
  One Participações, por crédito de cerca de R$ 970 milhões; a liminar tem a mesma arquitetura da do Amapá,
  com multa de R$ 50 mil por servidor indevidamente negativado. Os autores sustentam atuação integrada entre
  o banco e a PKL, com possível grupo econômico, e afirmam que o CredCesta foi "originado dentro da estrutura
  do próprio Banco Master". O percurso processual difere do Amapá: o Banco Central pediu para intervir, o
  juízo estadual remeteu à Justiça Federal e esta ao Supremo, e o tribunal estadual julgou o agravo
  prejudicado. Registrada a provável duplicação de registros da PKL no próprio corpus.
- Lotes 85 e 85b do corpus: a cautelar dos consignados do Amapá, em 3.475 páginas lidas. A única prestação de
  contas do processo nº 6102005-63.2025.8.03.0001, de 22/04/2026, soma R$ 7.933.491,87 — e os R$ 63 milhões
  anunciados publicamente em fevereiro de 2026 não têm correspondência em nenhuma peça. A segunda prestação,
  vencida em junho, não foi apresentada; o liquidante impugna as contas e aponta diferença de R$ 11,16
  milhões do lado do Estado. Esclarecido o que é a "notificação do desenquadramento": não é ato de órgão
  externo, mas a reação administrativa da própria entidade ao rebaixamento do rating, com o liquidante
  sustentando que nunca houve ordem de resgate. Localizado o ofício de 11/09/2025 em que a Amprev pergunta ao
  presidente do Banco Central, pela segunda vez, os motivos da negativa à compra do Master pelo BRB — dois
  meses antes da liquidação, sem resposta nos autos.
- Lote 84 do corpus: os contratos do escritório Barci de Moraes, lidos nos autos. Obtidos os autos completos
  da PET 16.662 do Supremo, com sigilo levantado em 01/09/2026, incluindo os três anexos que não eram
  públicos. O contrato com o Banco Master, de 16/01/2024, prevê 36 parcelas mensais de R$ 3.000.000,00
  líquidos — R$ 131.275.071,72 em três anos — e estrutura cinco núcleos de atuação perante Judiciário,
  Ministério Público, polícia judiciária, Executivo e Legislativo, este para acompanhamento de projetos de
  lei de interesse do contratante. O segundo, de 12/05/2025, é com a Viking Participações, com teto de R$ 50
  milhões e previsão expressa de pagamento por dação: sete dias depois, R$ 40 milhões foram quitados com
  participações nas sociedades proprietárias de um jato Legacy 650 e de um helicóptero EC 155 B1.
- Lotes 83 e 83b do corpus: os autos de Itaguaí, em 203 páginas submetidas a reconhecimento óptico. A
  identidade textual entre os termos de credenciamento do Banco Master deixa de ser descrição de auditoria
  sigilosa e passa a ser constatação da equipe sobre duas cópias lidas: a de Itaguaí e a publicada pela
  Alagoas Previdência coincidem palavra por palavra. Os autos trazem o e-mail com que o banco remeteu a
  documentação, assinado pela mesma executiva de relações institucionais documentada em Goiás, no Amapá e em
  Alagoas, e o termo em duas versões — uma sem assinatura e já preenchida, com o CNPJ do banco impresso no
  campo do representante legal. Aberto em 11/01/2024 e assinado em 16/01/2024, pela mesma pessoa nos dois
  campos reservados a funções distintas, com dois minutos de diferença. E a Lista Exaustiva do Ministério da
  Previdência, que não traz o banco em nenhuma de suas seções, está juntada ao próprio processo, nas páginas
  182 e 183 — a poucas dezenas de páginas da atestação que afirma o requisito que ela espelha.
- Lote 83 do corpus (achados negativos): nem Roberta Luchsinger nem qualquer filho do presidente Lula tem
  ligação documentada com o caso Banco Master. A busca textual nas peças primárias retorna zero ocorrências,
  com controles de extração funcionando; ambos estão em outro caso, a Operação Sem Desconto, do INSS. A
  confusão tem origem rastreável: os dois inquéritos têm o mesmo relator e um relatório da PF os compara, de
  modo que os nomes aparecem no mesmo documento sem vínculo entre as pessoas. Registrada também a armadilha
  do apelido "Careca", que no caso Master designa Alexandre de Moraes, segundo a própria PF, e no caso do
  INSS designa pessoa inteiramente distinta. Nenhum registro de pessoa foi criado: incluir no grafo quem não
  tem ligação com o caso sugeriria vínculo pela simples presença.
- Lote 82 do corpus: o Metrópoles, e uma declaração de conflito da própria plataforma. O Banco Master pagou
  R$ 27,28 milhões ao veículo entre o segundo semestre de 2024 e outubro de 2025, movimentação que o Coaf
  classificou como atípica. A contrapartida existe e é lícita — naming rights da Série D de 2025, com
  contrato confirmado pela CBF —, embora haja descasamento de cerca de seis meses entre o início dos
  pagamentos e a veiculação da marca. O teste objetivo da cobertura pesa contra a hipótese de captura, e está
  registrado com o mesmo peso: depois da liquidação ela foi ampla e pioneira, e foi o Metrópoles que revelou
  o contrato de R$ 129 milhões do escritório Barci de Moraes. Mas há dois artefatos datados de omissão do
  próprio nome. Como o veículo é uma das fontes mais usadas deste corpus, aplicou-se nota de contexto
  padronizada a todos os seus registros de fonte, por dever de transparência.
- Lote 81 do corpus: o documento — o parecer que aprovou o banco foi escrito pelo banco. Localizado e lido o
  Termo de Credenciamento nº 033/2024 do Banco Master na Alagoas Previdência, publicado aberto e datado de
  05/04/2024, com as frases exatas que a auditoria do Ministério da Previdência descreveu como idênticas em
  outros quatro entes: o campo destinado à análise do regime próprio contém texto promocional, e o de
  qualificação do corpo técnico, uma única frase sem nomes nem indicadores. O Tribunal de Contas do Estado do
  Rio de Janeiro, em voto de 56 páginas sobre Itaguaí, afirma que o termo foi "integralmente preenchido pelo
  próprio Banco Master", que a documentação comprobatória era formada "unicamente por certidões e relatórios
  gerados e enviados pelo próprio Banco Master" e que a análise durou "menos de 2 dias úteis". Registrado
  ainda o vetor humano entre o Rioprevidência e o Itaprevi.
- Lote 80 do corpus: Nelson Tanure — a cadeia de atribuição, e a ponte que não existe. Leitura integral da
  decisão de 06/01/2026 na PET 15.198: a expressão "sócio oculto" está dentro da transcrição da manifestação
  do procurador-geral, que reporta o que a autoridade policial afirmou, e o relator registra que sua cognição
  nessa fase é necessariamente limitada. Distinguidos os estágios — investigado e alvo de busca no caso
  Master, réu em ação penal distinta sobre a Gafisa, cuja conexão o próprio relator rejeitou. Testada na base
  primária da CVM a hipótese de que recursos de regimes próprios teriam chegado a veículos dele: zero
  cotistas de regimes próprios no FIDC Maranta, no Bordeaux FIP e no Fonte de Saúde FIP. O fluxo documentado
  é o inverso, do caixa da Ligga para cédulas de crédito do Master.
- Lote 79 do corpus: o parecer escrito pelo próprio banco, e a consultoria dos dois lados. O relatório de
  auditoria federal tem nome oficial, revelado pela própria PF em nota pública — "Relatório de Auditoria
  Direta — Letras Financeiras", da Coordenação-Geral de Auditoria do DRPPS —, é sigiloso, está com a PF e não
  trata de quatro entes, mas percorre regimes próprios em vários estados. Seu achado central, de que os
  termos de credenciamento eram idênticos e elaborados pelo próprio banco, tem confirmação independente do
  TCE-RJ no caso de Itaguaí. Registrado que a consultoria presente em sete dos compradores declara à CVM
  assessorar os dois lados do mesmo credenciamento, e que seu principal executivo é quem propõe a compra de
  letras financeiras na ata de Congonhas. Documentada a assimetria que define o caso: 265 fundos de pensão
  privados com exposição zero.
- Lote 78 do corpus: Congonhas — o critério que o próprio comitê fixou e que a compra violou. A ata de
  07/05/2024 autoriza compra genérica de letras financeiras sem nomear emissor, exigindo apenas instituição
  no mínimo S3 e presente na lista exaustiva da Secretaria de Previdência. Vinte dias depois compra-se R$ 14
  milhões do Banco Master, que não constava da lista e só passaria a constar em abril de 2025. A autorização
  descreve a compra de letra financeira de banco privado como "aplicação em títulos públicos". A única
  relação de credenciadas publicada pela autarquia, de 2023, não inclui o banco, e nenhuma ata registra a
  aprovação de seu credenciamento. O saldo chegou a R$ 16,5 milhões em outubro de 2025 e foi baixado a um
  centavo no mês da liquidação.
- Lotes 77 e 77b do corpus: o balanço do Master, e a prova de escala. Demonstrações financeiras auditadas de
  2024 lidas integralmente: a letra financeira não existia no passivo em 2022, somava R$ 486 milhões ao fim
  de 2023 e R$ 2,11 bilhões ao fim de 2024 — alta de 333% no ano —, com 95,7% vencendo acima de cinco anos,
  enquanto a letra de crédito imobiliário caía 76%. A taxa de IPCA + 8,35% que a Amprev aceitou é exatamente
  o teto da faixa de emissão declarada pelo banco (em 2023 o teto era 8,00%). A base IF.data do Banco Central
  confirma os números ao centavo e mostra o estoque crescendo até R$ 4,11 bilhões em junho de 2025, cinco
  meses antes da liquidação. Varredura por amostragem no mercado secundário da B3 — 91 dias com dados, quase
  18 mil registros de 46 emissores — não encontrou uma única negociação de papel do Master: os títulos não
  circulavam. Os dezoito regimes próprios responderam por cerca de 88% do estoque, e o total nacional foi
  corrigido para R$ 1,867 bilhão.
- Lote 76 do corpus: Aparecida de Goiânia — a mesma vendedora, e um controle contornado. Em 20/12/2023, três
  meses antes do Amapá, a mesma representante do Banco Master participou por videoconferência da sessão que
  credenciou o banco no regime próprio local. Em 28/02/2024 o conselho rejeitou por sete votos a três a
  proposta de reduzir a exigência de rating da política de investimentos — proposta que um conselheiro
  perguntou em ata se seria "para atender somente ao Banco Master", e que o diretor financeiro confirmou ser
  a única instituição credenciada fora do enquadramento, por não constar da lista exaustiva. Em 06/06/2024 os
  R$ 40 milhões foram aplicados assim mesmo, e o conselho só registrou conhecimento em setembro; em audiência
  pública de dezembro de 2025 a direção confirmou não existir documento formal de aprovação.
- Lotes 75 e 75b do corpus: a mesa institucional do Master, nomeada. A ata de 14/03/2024 traz o próprio banco
  nomeando os cinco regimes próprios já captados — Rioprevidência, Maceió, Paulista, Cajamar e Araras —,
  todos presentes na lista final dos dezoito compradores: a carteira pública já conquistada era o argumento
  de venda para o comprador público seguinte. Verificação primária da Lista Exaustiva do Ministério da
  Previdência: o Banco Master não constava em 06/05/2024 e só entrou em 11/04/2025, sem nenhuma atualização
  da lista entre as duas datas — ou seja, durante todo o período das compras dos dezoito regimes próprios ele
  não constava. Registrados os intermediários remunerados, o parecer que o escritório Barci de Moraes
  produziu para o banco em julho de 2024 sobre a captação junto a RPPS, o Parecer SEI 146/2024 e a Nota
  Técnica 726/2024, que rejeita a tese do conglomerado.
- Lote 74 do corpus: o relatório do celular, medido. Classificação das 109 menções a "Moraes" no relatório da
  PF, uma a uma, por contexto: 51 ao ministro ou ao contato salvo, 58 ao escritório da esposa, nenhuma a
  terceiro homônimo. A contagem bruta quase empata, mas a arquitetura do documento não: a seção "Da análise
  do destinatário das notas" ocupa 190 das 218 páginas, das quais só cerca de 31 tratam dos contratos do
  escritório. Registrado que o relatório não imputa conduta a magistrado e não cita nenhuma decisão, voto ou
  ato de ofício; que a titularidade da linha não está demonstrada; que os metadados da minuta trazem nome de
  conta de usuário, não autoria; e que a manifestação da PGR ataca a via processual, não o mérito.
  Acrescentada a PET 16.704, aberta de ofício por Fachin, cujo objeto alcança a conduta da própria PF.
- Lote 73 do corpus: o canal de colocação, e uma retratação. As atas do Comitê de Investimentos da Amprev
  estão públicas e nunca foram usadas pela cobertura; quatro foram lidas. A de 14/03/2024 registra o próprio
  Banco Master pedindo reunião com o comitê e descrevendo em números a captação junto a regimes próprios
  montada desde novembro de 2023 — cinco clientes, quarenta credenciamentos em andamento, R$ 700 milhões
  captados —, além de recomendar o prazo de dez anos. A de 19/07/2024 mostra que os R$ 400 milhões
  equivaliam a quase 59% de todo o estoque de letras financeiras do emissor. Corrigida a leitura sobre a
  rejeição de ofertas de bancos de primeira linha: elas não foram rejeitadas, foram aprovadas na mesma
  sessão. RETRATAÇÃO: o evento de deliberação de FIDC em 14/09/2021, publicado no lote 71 com base na decisão
  judicial, foi retirado — não houve reunião do comitê naquela data, não havia FIDC na carteira em nenhum mês
  de 2021 e nenhum dos investigados integrava o colegiado naquele ano. A evidência de que a passagem existe
  no documento judicial permanece, reformulada.
- Lote 72 do corpus: o nó do Amapá em documentos primários. Lidos três edições do Diário Oficial do Estado, a
  Lei estadual 0915/2005 consolidada, a ata da 9ª reunião ordinária do Conselho Estadual de Previdência e
  duas publicações do site oficial da Amprev. A atribuição do convite a Davi Alcolumbre não vem de fonte
  anônima nem de peça policial, mas de declaração do próprio Jocildo Lemos, repetida em dois registros
  oficiais; a decisão judicial da Zona Cinzenta não menciona o senador nenhuma vez; e a nomeação da diretoria
  é ato de livre escolha do governador, sem participação legal de parlamentar. Identificados os dois
  conselheiros vencidos em 19/07/2024. Corrigido o enquadramento jurídico da entidade — não é autarquia, mas
  serviço social autônomo — e reconciliados os percentuais de concentração, que usavam denominadores
  distintos.
- Lote 71 do corpus: leitura integral da decisão da operação Zona Cinzenta. O corpus registrava a decisão da
  4ª Vara Federal Criminal do Amapá apenas pela descrição de terceiros, com ressalva expressa de que não fora
  lida pela equipe. As 14 páginas foram extraídas e lidas, acrescentando as condições contratuais do primeiro
  aporte (IPCA + 8,35% ao ano, dez anos), o alerta de concentração de 40% da carteira líquida, a recusa
  prévia da Caixa em adquirir os mesmos ativos, a visita técnica tratada como formalidade e os dois votos
  contrários de 19/07/2024. Deslocou também o centro da imputação policial: a PF aponta o conselheiro José
  Milton Afonso Gonçalves, e não o diretor-presidente, como mentor intelectual.
- Lote 70 do corpus: o nó BN/BK, resolvido em registro público. BN Financeira Ltda. é a razão social e BK
  Financeira o nome fantasia da mesma pessoa jurídica — a imprensa dividiu-se entre o nome empresarial, usado
  nos documentos judiciais, e o fantasia, usado por agregadores. Empresa distinta, da mesma sócia, é a BN
  Representações Tecnológicas, que migrou de floricultura para software poucos meses antes da operação.
  Resolvido o nome, sobram três achados: um metodológico — a representação da PF, ao datar o contrato, cita
  como fonte uma reportagem, e documento oficial e matéria não são fontes independentes nesses pontos; um
  regulatório que a cobertura não explorou — o art. 8º da Resolução CMN 4.935/2021 exigia autorização prévia
  do Banco Central para contratar como correspondente empresa fora do sistema financeiro que usasse termos
  característicos de instituição financeira no nome; e uma correção — o número de R$ 5,5 milhões que circulou
  não existe nos autos.
- Lote 69 do corpus: o eixo nacional — e o que os documentos primários não dizem sobre Lula. Lidos
  integralmente o relatório da PF sobre o celular de Vorcaro (218 páginas) e o relatório final da CPI do
  Crime Organizado (221). O resultado sobre o presidente da República é negativo e firme: não aparece no
  relatório policial, não está entre os quatro indiciamentos propostos pela CPI, não consta das minutas de
  delação e não é interlocutor de nenhuma mensagem apreendida. O que existe é a audiência de 04/12/2024, que
  ele próprio confirmou, com duas versões não conciliadas sobre o teor. Documentada a Pollaris, de Guido
  Mantega, que recebeu R$ 14 milhões do banco, com a ressalva do próprio relatório de que pagamentos isolados
  não configuram ilícito a priori. Corrigidos três pontos, entre eles o mais sensível: Galípolo não negou ter
  tratado do Master com ministros do STF, mas recusou-se a responder invocando sigilo.
- Lote 68 do corpus: a rede baiana — e a correção sobre a Emenda 30. A correção principal favorece o
  investigado e desmonta uma leitura que circulava em veículos de posições opostas: a Emenda nº 30 à MP
  1.106/2022 é de Jaques Wagner, mas propunha um TETO de juros de 300% do CDI — dispositivo restritivo, não
  expansivo — e não foi incorporada ao texto final. O que a PF lhe imputa, em suas próprias palavras, é
  correlação temporal e de comportamento, em linguagem expressamente preliminar. Registrado que não houve
  depoimento, indiciamento, denúncia nem arquivamento até setembro de 2026, e que a PGR se opôs à própria PF
  quanto às medidas da operação. Acrescentados Jerônimo Rodrigues e a ASSEBA, por onde teriam transitado
  R$ 140,1 milhões segundo relatório do Coaf, com a negativa do governo baiano.
- Lote 67 do corpus: a arquitetura do CredCesta, em texto primário. Extraída do Diário Oficial da Bahia a
  íntegra dos três decretos que estruturam o negócio, o que corrigiu dois erros do corpus: o CredCesta não
  foi criado em 2018 — existia desde pelo menos 2014 —, e a EBAL não era sócia nem conveniada, mas a gestora
  estatal do programa, privatizada com ele embutido no lote. O achado estrutural está no Decreto 18.354, que
  reescreveu o inciso reservando 30% de margem a benefícios do poder público, passando-a ao operador privado,
  cumulativa com a dos bancos — dezesseis dias após o leilão que vendeu a estatal por R$ 15 milhões, com
  dívidas de R$ 93 milhões deixadas ao Estado. Em 2022, outro decreto retirou do servidor o direito de portar
  a dívida para instituição mais barata. O produto cobrava cerca de 5% ao mês contra média de mercado
  inferior a 1,6%, e virou 85,4% das operações do banco em 2022.
- Lote 66 do corpus: o mapa da CVM e o julgamento de 8 de setembro. Dezenove acusados no processo do Brazil
  Realty FII — entre eles Daniel Vorcaro, o pai, o irmão, o Banco Master, a Milo, a Sefer, Benjamim Botelho e
  Antônio Carlos Freixo Júnior —, no mesmo processo que o voto de dezembro de 2020 considerou sem
  materialidade suficiente para obstar o acordo então firmado com Vorcaro. Publicado o mecanismo descrito no
  parecer técnico: laudo sem assinatura, sobreavaliação de R$ 56 milhões, avaliadora que não reconheceu a
  autoria, matrícula apontando outro proprietário, pagamento em espécie e recibo com assinatura aparentemente
  colada, além do retorno irregular de R$ 84,9 milhões à Milo. Entre os investidores lesados havia regimes
  próprios de previdência. Registradas as três propostas de acordo rejeitadas e a prestação de contas da
  autarquia no Senado, incluindo a admissão de que "pode ter havido erro".
- Lote 65 do corpus: o estado das alegações de intimidação, com o mesmo ceticismo aplicado aos dois lados.
  Contra a alegação: Vorcaro não nomeou nenhum agente, os supostos autores estavam mascarados, não houve
  perícia nem exame de corpo de delito, nenhum agente foi formalmente investigado, e o contexto é o de uma
  terceira tentativa de delação feita no mesmo dia em que ele deveria depor à PF. Contra a versão oficial: a
  resposta da corporação veio inteiramente por interlocutores anônimos, sem nota institucional nem
  pronunciamento do diretor-geral, e a versão do encontro casual em Londres é enfraquecida pelo próprio
  relatório da PF. Nenhuma das frentes teve desfecho, e o procurador-geral que pediu o arquivamento é ele
  próprio citado nas mensagens.
- Lote 64 do corpus: o acordo de 2020 — quando a CVM já tinha Vorcaro como acusado. Cinco anos antes do
  colapso, ele figurou pessoalmente como acusado num processo da autarquia e fechou termo de compromisso por
  R$ 250 mil, dentro de um acordo total de R$ 2,325 milhões, aceito em 01/12/2020 depois de duas rejeições do
  Comitê competente. O voto do diretor Henrique Machado, lido na íntegra, mostra que a área técnica já
  descrevia em 2020 estruturação de emissões para transferir recursos de uma massa falida a familiares dos
  controladores. Cerca de seis meses depois, ao fim do mandato, Machado passou a integrar escritório que
  atende o Master; a PF registrou a sequência como suspeita, sem pedir diligências, e ele nega. Registrado
  com o mesmo destaque o que pesa a favor dele, inclusive a restituição documentada de mais de R$ 51 milhões
  antes da apreciação. Criado o registro da própria CVM como organização.
- Lote 63 do corpus: o que o relatório da PF diz — e não diz — sobre o diretor-geral. Lida a íntegra das 218
  páginas do relatório IPJ-A nº 3298613/2026, de onde veio o elemento mais exculpatório do documento, que
  não constava do corpus: não há contato salvo com o nome de Andrei Passos no celular de Vorcaro, nem uma
  única mensagem trocada entre os dois — todas as menções são de terceiros, e o relatório usa o condicional.
  O documento declara que não realizou atos de aprofundamento investigativo e que não tem caráter exaustivo.
  Em contrapartida, transcreve a trilha do convite ao fórum de Londres de abril de 2024, com a pergunta sobre
  quem cobriria hospedagem e passagem e a resposta "todas as despesas bancadas por nós". Fecha com o
  inventário dos sete procedimentos que o alcançam — nenhum decidido — e com o registro de que ele nunca se
  manifestou sobre o mérito.
- Lote 62 do corpus: os policiais cooptados têm nome. O corpus registrava, de fonte única e sem nomes, que
  Marilson Roseno da Silva teria cooptado "ao menos três policiais", e estava seis meses desatualizado. A 6ª
  fase da Compliance Zero, em 14/05/2026, identificou o núcleo: o agente Anderson Wander da Silva Lima,
  preso; a delegada Valéria Vieira Pereira da Silva, afastada; e dois aposentados. A decisão judicial mostra
  que as consultas de fato ocorreram e que a informação chegou — a delegada acessou pelo e-Pol, sem
  atribuição legal, exatamente o inquérito em que Henrique Vorcaro fora intimado, e a PF apreendeu com o pai
  do banqueiro documento extraído do sistema Sinapse. Nenhum dos citados foi julgado, não há denúncia
  oferecida, e as defesas que se manifestaram negam.
- Lote 61 do corpus: os limites da verificação, documentados. Duas lacunas foram perseguidas até o fim e
  voltaram negativas — mas com prova de por quê, que é o que distingue um limite de uma omissão. O processo
  da CVM que acusa 29 pessoas e empresas de oferecer vantagens a prefeitos e gestores de previdências
  municipais NÃO foi julgado: consta da planilha oficial de pendentes, posição de 31/01/2026, sem
  movimentação pública desde 24/05/2022, mais de nove anos após a instauração do inquérito; fica sinalizada,
  sem afirmação de mérito, a hipótese de prescrição intercorrente. E o documento que nomearia cotistas de
  fundos em outubro de 2015, gargalo de toda a alegação sobre o narcotraficante espanhol, não pode ser
  público: o sistema de divulgação só existe desde junho de 2016, o formato identifica cotistas por faixas
  percentuais anônimas, e o dado é coberto por sigilo bancário.
- Lote 60 do corpus: a absolvição de Botelho, confirmada em sentença — correção em favor de pessoa
  identificada. O corpus registrava a absolvição apenas como versão da defesa, marcada como não confirmada, o
  que lhe era desfavorável sem lastro. A íntegra da sentença foi obtida pela API pública do DJEN/CNJ, rota
  que resolveu o acesso depois de o TRF3 e o PJe de primeiro grau recusarem conexão: a ação penal nº
  5003557-34.2021.4.03.6181 absolveu em 25/04/2025 quatro dos cinco réus com fundamento no art. 386, V, do
  CPP, condenando apenas Saul Dutra Sabbá. Registrado, com o mesmo destaque, o que a nota da defesa omitia: o
  MPF apelou, e o recurso seguia pendente no TRF3.
- Lote 59 do corpus: a frente rondoniense em profundidade — e uma correção ao lote 56. A Operação Miquéias,
  de 2013, mostra que a estrutura Foco/Aquilla já estava sob apuração federal sete anos antes da Fundo Fake e
  quatro antes de Vorcaro contratar a compra do Máxima. Registrado que ele foi alvo dessa frente e teve
  mandado de prisão expedido em 2020, nunca cumprido e depois anulado, com o inquérito trancado pelo TRF-1 em
  2023 — e registrado, com o mesmo destaque, o argumento temporal da defesa, que tem lastro parcial. A
  correção ao lote 56: a transferência de R$ 2 milhões afirmada na peça da CPI não foi corroborada, e a única
  fonte jornalística sobre o tema descreve o fluxo em sentido inverso.
- Lote 58 do corpus: a alegação do narcotraficante espanhol, separada em camadas. Publica-se como fato a
  condenação de Oliver Ortiz em 2013; como evidência atribuída, a decisão da Justiça Federal do Rio que o
  descreve como cotista de fundos do Grupo Aquilla; como documento oficial, o requerimento aprovado na CPI do
  Crime Organizado que acolheu a tese. O núcleo causal permanece registrado como alegação em disputa, de
  fonte anônima única, com os limites explicitados — entre eles a constatação, por busca textual no PDF
  oficial, de que o relatório final da CPI não menciona nenhum dos envolvidos. Por decisão editorial, não se
  cria vínculo entre Ortiz e Daniel Vorcaro no grafo: nenhuma fonte afirma que Vorcaro o conhecesse ou
  soubesse da origem dos recursos.
- Lote 57 do corpus: quem é Benjamim Botelho de Almeida. O registro, antes de um parágrafo, passa a ter
  lastro documental: cargos fixados em parecer da CVM, três processos sancionadores, a liquidação da Sefer
  pelo Banco Central em 26/06/2026 com bloqueio de seus bens, e a condição de alvo da 2ª fase da Compliance
  Zero. O elo estrutural mais relevante: o fundo Aquilla Veyron, do grupo que ele dirigia, é apontado pelo
  MPF como instrumento da mesma fraude contábil pela qual Saul Dutra Sabbá foi inabilitado e condenado.
  Corrigidos três pontos do corpus, entre eles o de que ele seria silente — manifestou-se por seus advogados,
  e suas versões passam a constar.
- Lote 56 do corpus: a origem do capital e a frente de Rondônia. Vorcaro declarava R$ 2,8 milhões à Receita
  Federal em 2015, dois anos antes de contratar a compra de 56,87% de um banco por R$ 40 milhões — e a
  diferença foi preenchida por uma engrenagem imobiliária que inclui um terreno em Jequitibá (MG),
  regularizado por R$ 2,5 milhões e vendido por R$ 57 milhões a um fundo abastecido por previdências de
  servidores públicos. A alegação de prisão decretada em Ji-Paraná em outubro de 2019 foi submetida a nova
  verificação e NÃO se confirmou; registra-se o resultado negativo com as ressalvas que o reforçam. Em
  compensação, documentou-se o que estava por trás: há linha investigativa federal em Ji-Paraná alcançando
  Vorcaro desde janeiro de 2019, nove meses antes do aval do Banco Central.
- Lote 55 do corpus: o vendedor e o banco — o que o Máxima era antes de virar Master. O registro sobre Saul
  Dutra Sabbá passa a documentar que o Banco Central o inabilitou em 19/07/2018 por prestar informações
  incorretas de forma intencional e sistemática para ocultar grave insuficiência de capital, que ele foi
  condenado por gestão fraudulenta em abril de 2025 por fatos de 2014 a 2016, e que obteve acordo de não
  persecução penal homologado em 05/02/2026. Acrescentados o preço e a forma de pagamento — 56,87% do capital
  por R$ 40 milhões, dos quais apenas R$ 4 milhões em espécie e R$ 36 milhões em cotas de fundo — e o porte
  real do banco vendido: patrimônio líquido de R$ 30 milhões, desenquadrado e à beira da liquidação.
- Lote 54 do corpus: o que era, afinal, o aporte do FGC na origem do Master. Lido o texto consolidado da
  Resolução CMN nº 4.222/2013 e identificada a redação do Estatuto do FGC vigente em dezembro de 2017: o art.
  4º prevê expressamente assistência financeira do fundo a instituições associadas e a seus acionistas
  controladores, inclusive para promover transferência de controle acionário. Isso retira da operação, em si,
  o caráter de anomalia — correção importante contra a leitura intuitiva de escândalo. A verificação
  enfraqueceu o número de dezembro de 2017 (fonte única, não reproduzida pelas demais coberturas dos mesmos
  votos) e acrescentou uma operação distinta e melhor documentada: o empréstimo emergencial de R$ 20 a R$ 30
  milhões concedido pelo FGC ao Máxima em 2019, com a versão do próprio fundo de que não financia aquisições.
- Lote 53 do corpus: dois pontos de fechamento. A repercussão internacional do caso — cobertura
  investigativa sustentada da Bloomberg e análise institucional do The Economist, sem evidência de
  rebaixamento do rating soberano do Brasil (S&P manteve 'BB/B' estável); a falha de avaliação de risco
  documentada é doméstica, da Fitch sobre o próprio Banco Master (elevado a 'A-(bra)' em 2024, rebaixado a
  'D' após a liquidação). E a Operação Sem Desconto (fraude de descontos do INSS): esclarece sua conexão
  investigativa real com o Master, via o consignado "M Fácil Consignado" (ex-CredCesta) e o cruzamento de
  dados autorizado por Mendonça em 25/02/2026 — origem concreta do atrito com a cúpula da PF já registrado
  no corpus.
- Lote 52 do corpus: a primeira delação da Compliance Zero em detalhe. A PGR assinou, em 02/09/2026, o
  acordo com João Carlos Mansur (ex-Reag) — 17 temas, multa de R$ 40 milhões —, que promete revelar o
  paradeiro de R$ 20 bilhões em ativos atribuídos a Vorcaro; audiência de voluntariedade ocorreu em
  03/09, homologação por Mendonça ainda pendente. Registra também a rejeição da segunda proposta de
  delação do próprio Vorcaro em 15/06/2026 — antecedente direto da terceira tentativa já registrada no
  lote 51.
- Lote 51 do corpus: Vorcaro sinaliza que vai poupar Moraes em sua terceira tentativa de delação premiada
  — após duas propostas já rejeitadas por PF e PGR, mantém a versão de relação de amizade com o ministro
  e de contrato comercial de R$ 129 milhões com a advogada Viviane Barci de Moraes. Segundo a CNN Brasil,
  o próprio Vorcaro atribui ao levantamento do sigilo do relatório da PF o prejuízo à sua estratégia de
  negociação; no MPF, a percepção é de que as chances de acordo se esgotaram.
- Lote 50 do corpus: dois pontos de enriquecimento sobre as liquidações satélites do Master. Vorcaro
  alega, em depoimento, que a venda do Will Bank ao fundo Mubadala Capital (Abu Dhabi) estava praticamente
  concluída e seria formalizada no mesmo dia da liquidação do Master, mas foi interrompida pela ação da
  PF e do BC. Registra o indício, levantado pelo Poder360, de que o Banco Central já sabia de créditos
  podres ligados ao Master antes de aprovar, em 24/07/2025, a venda do Voiter (depois Banco Pleno) a
  Augusto Lima — cuja situação financeira e pessoal (aportes insuficientes, prisão e prisão domiciliar) é
  detalhada com mais precisão.
- Lote 49 do corpus: os desdobramentos de 04/09/2026. Moraes contra-atacou pedindo formalmente a Fachin
  que investigue Mendonça por abuso de autoridade; Fachin avocou o pedido no dia seguinte, dando cinco
  dias úteis à PGR. Veio a público o vídeo do depoimento de Vorcaro à PF ("tenho passado um terror... mas
  ainda tenho esperança"), no qual reconhece "erros" mas insiste que a venda ao BRB e a liquidação
  "precisam ser esclarecidas". Registra a primeira manifestação pública de Lula sobre a crise ("o maior
  roubo da história do Brasil") e a proposta de Gilmar Mendes para retirar delegados da PF dos gabinetes
  de ministros do STF.
- Lote 48 do corpus: dois desdobramentos investigados em paralelo. O rastro da CPMI do INSS após seu
  encerramento sem relatório aprovado — dois textos rejeitados foram entregues informalmente a PF, CGU,
  PGR e aos ministros Fux e Mendonça (STF) em abril de 2026, e um vazamento de dados sigilosos de Vorcaro
  (incluindo conversas privadas) foi rastreado pela PF ao próprio material da comissão. E os limites da
  conexão entre a Operação Carbono Oculto (PCC) e o caso Master: a Justiça já negou formalmente, em
  dezembro de 2025, qualquer conexão processual envolvendo Vorcaro; a sobreposição real é indireta, via a
  gestora Reag (R$ 3,6 bilhões em repasses do Master, também alvo da Carbono Oculto) e a Trustee
  (custodiante comum de fundos bloqueados na operação).
- Lote 47 do corpus: o "efeito bumerangue" de Nikolas Ferreira. Mensagens do próprio celular de Vorcaro
  revelam que o banqueiro financiou voos da campanha de Nikolas em 2022 no Nordeste, e que o deputado o
  procurou em 2025 para intermediar a liberação de um ativo mineral de interesse de seu ex-assessor
  Thiago Rodrigues de Faria — e que, em 2024, Vorcaro mobilizou interlocutores para conter uma crítica
  pública de Nikolas a um evento em Londres patrocinado pelo Master. Nikolas confirma a ajuda logística
  mas nega relação pessoal. Deputados do PT pedem investigação de ambos e do ex-assessor na PGR.
- Lote 46 do corpus: quem controla a Trustee DTVM e a Banvox DTVM, liquidadas pelo BC em 03/09/2026 —
  Maurício Quadrado, ex-diretor de investimentos do Master sob Vorcaro, que vendeu sua fatia em 2024 e
  hoje controla as duas gestoras. Registra a fiança solidária de Vorcaro em R$ 470,5 milhões de debêntures
  da Banvox que capitalizaram o Master, a hipótese sob apuração (negada por Tanure) de participação
  indireta de Nelson Tanure via o fundo Estocolmo, o bloqueio cautelar de R$ 24,2 milhões de Toffoli, a
  negativa das empresas quanto a irregularidades, e a cobrança de R$ 640 milhões da PGE-RJ ao Master que
  aponta a Trustee como operadora do esquema que prejudicou o RioPrevidência.
- Lote 45 do corpus: o cerco patrimonial contra a família Vorcaro em detalhe. A liminar de 17/03/2026 que
  bloqueou bens ligados a Daniel Vorcaro foi ampliada em 23/03/2026 para incluir o pai (Henrique Vorcaro)
  e a irmã (Natália Vorcaro Zettel) como investigados. Registra a tentativa frustrada de venda da mansão
  de Orlando à Chosen Vessel LLC via a holding Sozo Real Estate (sem listagem pública nem advogado
  independente, segundo o liquidante), e a ação civil da EFB nos EUA por mais de US$ 1 bilhão contra pai e
  irmã de Vorcaro. Sinaliza contradição não resolvida entre fontes sobre o status do jato Gulfstream G700.
- Lote 44 do corpus: a escala humana e sistêmica da liquidação. O FGC estimou 1,6 milhão de credores
  elegíveis e R$ 41 bilhões em garantias nos bancos do núcleo Master — a maior operação de sua história;
  em 15/07/2026 já havia pago R$ 40,03 bilhões (98,5%) a mais de 718 mil credores, restando R$ 1,83 bilhão
  em todo o conglomerado (incluindo Pleno e Will Bank). Registra o alvo de R$ 4,8 bilhões em bens de
  Vorcaro sob mira do liquidante (mansões, hotel, jato Gulfstream), a conclusão do Banco Central de que a
  operação não gerou risco sistêmico ao SFN, e a liquidação, em 03/09/2026, de mais duas gestoras ligadas
  ao Master (Trustee DTVM e Banvox DTVM).
- Lote 43 do corpus: a segunda delação premiada do caso — em 03/09/2026, a PGR fechou acordo de
  colaboração com Antonio Carlos Freixo Júnior ('Mineiro'), o operador financeiro que movimentava os
  repasses de Vorcaro ao Havengate Development Fund para o filme 'Dark Horse'. Freixo relatou operações
  'não ortodoxas', incluindo dinheiro em espécie, mas alegou desconhecer a destinação final dos recursos.
  Eduardo Bolsonaro negou ter recebido recursos; Flávio Bolsonaro reiterou destinação integral à produção.
- Lote 42 do corpus: Nelson Tanure e a Ligga Telecom em profundidade. A Ligga aplicou entre R$ 353 milhões
  (dez/2022) e R$ 388,6 milhões (set/2025) do caixa em CCBs do Banco Master, decisão que não passou pelo
  Conselho de Administração; um sócio minoritário notificou a empresa alegando desvio de R$ 400 milhões
  de recursos de debêntures incentivadas. Registra, como hipótese sob apuração (não fato consumado), a
  linha investigativa de que Tanure seria 'sócio oculto' do Master — com origem em depoimento de Vladimir
  Timerman à CPI — e a negativa formal de Tanure. Acrescenta a ação sobre a Gafisa remetida ao STF por
  conexão com o caso.
- Lote 41 do corpus: a reação da OAB à crise institucional, em duas vozes distintas — o Conselho Federal
  manifestou 'extrema preocupação' sem pedir afastamentos, enquanto a seccional do Paraná pediu o
  afastamento cautelar de Moraes e a suspeição de Gonet. Esclarece que o trabalho de Fabio Wajngarten para
  Vorcaro é de comunicação e gestão de crise, não jurídico ('Onde está escrito serviços advocatícios?').
  Registra a entrada do advogado Daniel Bialski na defesa de Vorcaro em agosto de 2026, sinalizando
  disposição de colaborar com a investigação.
- Lote 40 do corpus: as reações políticas à crise institucional de 03-04/09/2026 — Nikolas Ferreira ('Mendonça
  tem que dar voz de prisão a Moraes em plenário'), deputados do PT pedindo a Fachin que declare a
  suspeição de Mendonça, e o senador Carlos Viana pedindo o afastamento de Gonet. Acrescenta a
  manifestação da PGR pelo arquivamento da apuração sobre as 'graves intimidações' alegadas por Vorcaro,
  que embasaram o pedido do partido Novo pela prisão do diretor-geral da PF.
- Lote 39 do corpus: atualização de Jaques Wagner — depoimento à PF, marcado para 07/08/2026, adiado a
  pedido da defesa por falta de acesso aos autos, sem nova data; candidatura à reeleição pela Bahia
  confirmada; negativa própria em entrevista ('não tenho nenhum negócio com o Banco Master') e defesa
  nominal de Lula na TV Globo. Acrescenta sua menção comparativa no relatório da PF sobre 'assimetria' de
  prazos que Moraes usou contra Mendonça — apenas como referência de celeridade, não como participante
  das mensagens Vorcaro-Moraes.
- Lote 38 do corpus: os oito diretores do Banco Central que aprovaram por unanimidade a compra do Máxima
  por Vorcaro em outubro de 2019 — lista reconstruída por reportagem investigativa, já que o extrato
  oficial só nomeia o relator. Quatro deles (Maurício Moura, Carolina de Assis Barros, Paulo Sérgio Neves
  de Souza e Otávio Damaso) já estavam na diretoria em fevereiro daquele ano, quando o mesmo pedido fora
  rejeitado — sem explicação pública individual localizada para a mudança de posição. Acrescenta que
  Roberto Campos Neto evitou repetidamente depor sobre o tema à CPI do Crime Organizado, blindado por
  habeas corpus do STF, e o questionamento de senadores na CAE.
- Lote 37 do corpus: detalha o material que Alexandre de Moraes usou contra André Mendonça (lote 28) — a
  alegação, com base em relatório da PF (INQ 4781), de que Mendonça sugeriu benefício ilegal (redução de
  dois terços de pena) ao delator Maurício Camisotti, da Operação Sem Desconto; a própria PF classifica
  como apenas 'moderada' a confiança de que a fala tenha ocorrido. Registra o rito definido por Fachin em
  04/09/2026: a PGR analisa a admissibilidade da acusação de Moraes antes de Mendonça se manifestar.
- Lote 36 do corpus: Vorcaro admite, em depoimento de 28/08/2026, a viagem à Disney/Universal oferecida a
  Paulo Sérgio Neves de Souza — já apurada pela imprensa (lote 20) —, identificando a empresa organizadora
  (SL Consulting, do empresário Léo Serrano) e classificando o gesto como cortesia pessoal ('agrado'), não
  contrapartida por serviços; nega que qualquer servidor do BC tenha 'trabalhado' para ele.
- Lote 35 do corpus: a terceira proposta de delação de Vorcaro, rejeitada por 'ausência de fatos novos'
  em agosto de 2026, em que alegou que doações de 2022 a Tarcísio de Freitas e Jair Bolsonaro seriam
  propina articulada por Gilberto Kassab para manter o Credcesta no governo paulista. Classificado como
  alegação de baixa confiança, com as negativas de Kassab ('Refuto com veemência') e da campanha de
  Tarcísio.
- Lote 34 do corpus: na noite de 03/09/2026, André Mendonça pediu verbalmente a Fachin o afastamento
  cautelar imediato de Alexandre de Moraes do STF, com petição formal em preparação — ação distinta do
  procedimento de cinco dias úteis aberto por Fachin no mesmo dia (lote 28). Sem decisão pública de
  Fachin até a data desta atualização.
- Lote 33 do corpus: as sanções da Lei Magnitsky dos EUA contra Viviane Barci de Moraes e o Instituto Lex
  (22/09/2025 a 12/12/2025), com a articulação de Eduardo Bolsonaro pela retomada em setembro de 2026;
  e o crescimento de 500% no volume processual do escritório Barci de Moraes desde que Alexandre de
  Moraes assumiu o STF em 2017, segundo levantamento de dados da Gazeta do Povo com base em cadastro
  processual público.
- Lote 32 do corpus: biografia de Andrei Rodrigues (carreira na PF, segurança de Dilma e Lula, indicação
  de Flávio Dino à direção-geral) e o episódio de agosto de 2026 em que os 27 superintendentes regionais
  da PF divulgaram nota em defesa da direção-geral, em meio a atrito com André Mendonça sobre a 'Operação
  Sem Desconto' — três dias antes da divulgação do laudo sobre o celular de Vorcaro.
- Lote 31 do corpus: o laudo da PF sobre a morte de Luiz Phillipi Mourão sob custódia — dez dias depois de
  a família registrar não ter acesso a imagens, autos nem laudo do IML, a PF entregou ao relator, em
  23/04/2026, laudo concluindo suicídio. Não foi localizada resposta da família a essa conclusão.
- Lote 30 do corpus: enriquecimento do dossiê de Augusto Lima — sua presença continuada em reuniões do
  Banco Central como 'CEO do Master' mesmo após a saída formal anunciada em maio de 2024; o dossiê
  apócrifo (autoria não confirmada, achado pela PF em arquivo digital de Vorcaro) que o chama de dono de
  fato do banco e Vorcaro de 'laranja', registrado como hipótese sob apuração (classe I); as duas notas
  públicas de sua defesa, em junho e agosto de 2026, esta última negando qualquer negociação de delação;
  e a disputa da PKL One, empresa de uma prima, pelos repasses do Credcesta em Macapá. Fecha também a
  lacuna de manifestação pública do Banco Pleno sobre sua própria liquidação.
- Lote 29 do corpus: o depoimento cancelado de Vorcaro à CPI do Crime Organizado — convocado como
  testemunha para 04/03/2026, teve o depoimento cancelado no mesmo dia por sua prisão preventiva.
  André Mendonça tornou facultativo seu comparecimento, tratando-o como investigado; a CPI contestou em
  recurso à Segunda Turma do STF, sem desfecho localizado. Não há registro de que Vorcaro tenha, em algum
  momento, efetivamente depoido à comissão antes de seu encerramento sem relatório aprovado.
- Lote 28 do corpus: a crise institucional escala em 03/09/2026 — dois dias depois de o relatório da PF
  vir a público, Alexandre de Moraes proferiu decisão apontando 'fortes indícios' de improbidade
  administrativa, abuso de autoridade e crime de responsabilidade contra André Mendonça, com base em
  relatório da PF sobre 'assimetria' de tratamento por alinhamento político, e alegando 'usurpação da
  direção' das Petições 15.041 (INSS) e 15.556 (Compliance Zero). No mesmo dia, o presidente do STF Edson
  Fachin abriu procedimento formal com prazo de cinco dias úteis para Moraes, Mendonça, Gonet e o
  diretor-geral da PF Andrei Rodrigues se explicarem, e adiou a sessão plenária para a segunda quinzena de
  setembro. É a primeira medida formal de um ministro contra outro desde a divulgação das mensagens.
- Lote 27 do corpus: a reação interna da PF à convocação de 24/08/2026 — delegados chamados sob pretexto
  de outro tema foram confrontados com despacho pronto exigindo análise do celular de Vorcaro em 72 horas;
  a cúpula da corporação temeu que o episódio comprometesse outros inquéritos da Compliance Zero por
  risco de nulidade colegiada. Converge com o argumento da PGR já registrado no lote 21.
- Lote 26 do corpus: o áudio de articulação do encontro entre André Mendonça e Daniel Vorcaro no Instituto
  ITER (14/03/2025) — Ciro Soares diz a Vorcaro que Mendonça 'sabe, soube da situação do Banco Central
  toda' antes mesmo do encontro ocorrer, quase um ano antes de assumir a relatoria do caso.
- Lote 25 do corpus: os dois atos oficiais do Banco Central que decretaram as liquidações extrajudiciais
  da Will Financeira (Ato do Presidente 1.376/2026) e da CBSF DTVM, ex-Reag (Ato 1.375/2026), ambos
  assinados por Gabriel Galípolo — localizados republicados nos sites das próprias empresas liquidadas,
  já que a busca no Diário Oficial da União segue bloqueada para acesso automatizado. O da Will Financeira
  foi lido via OCR, por ser imagem escaneada sem camada de texto. Detalha a fundamentação legal, o termo
  legal da liquidação (24/11/2025, distinto da data do ato) e esclarece que o liquidante nomeado é a
  empresa EFB Regimes Especiais, não a pessoa física isoladamente. Registra a distinção, feita pelo
  próprio Banco Central, entre a CBSF DTVM liquidada e a REAG IP S.A., instituição de pagamento distinta.
- Lote 24 do corpus: o parecer do TCM-SP sobre o Termo de Colaboração 01/SMIT/2024 — 20 irregularidades
  identificadas em abril de 2024, recomendação de suspensão ignorada pela SMIT, que seguiu com um único
  concorrente (Instituto Conhecer Brasil) sem experiência técnica prévia em comunicações. O contrato de
  R$ 108 milhões chegou a R$ 157,1 milhões por três aditivos, com cerca de R$ 26 milhões pagos sem
  comprovação de execução. Acrescenta o escândalo de dados: contatos de usuários do wi-fi gratuito
  repassados à Talk Communications (disparo em massa, 8,1 milhões de mensagens) e ao Instituto Orbis
  (pesquisas de satisfação), sem consentimento.
- Lote 23 do corpus: leitura integral, por OCR, da decisão de 24 páginas que autorizou a 10ª fase da
  Compliance Zero (PET 16.346) — o PDF publicado pela imprensa tinha fonte corrompida, ilegível por
  extração direta de texto. Corrige o link do documento (ausente até então) e o número do processo.
  Acrescenta o núcleo de vigilância contra jornalistas e executivos: o dossiê contra a jornalista Malu
  Gaspar, com mensagens datadas entre março e abril de 2025; o dossiê contra o CEO do Itaú Milton Maluhy
  Filho; os contatos com a jornalista Consuelo Dieguez e o consultor Renato Breia para retirada de
  conteúdo; a plataforma NEXTBUSCAS.PRO; o acordo de confidencialidade da agência UNLTD com um vereador
  ('Projeto UNLTD'); e o achado independente da Febraban sobre ataques coordenados ao Banco Central.
  Registra, como alegação de imprensa não verificada diretamente, a tentativa relatada de usar a
  companheira do presidente do Banco Central, Gabriel Galípolo, como via de influência.
- Lote 22 do corpus: o obstáculo regimental de Hugo Motta à CPI do Banco Master na Câmara — o pedido,
  protocolado por Rodrigo Rollemberg em 02/02/2026 com 201 assinaturas, ocupava em fevereiro a 16ª posição
  entre 17 requerimentos de CPI, com a lista completa das 15 comissões à frente na fila (da CPI das 123
  Milhas, de agosto de 2023, à das Juntas Médicas, de julho de 2025); o Regimento Interno permite apenas
  cinco CPIs simultâneas. Motta reiterou o critério cronológico sem mudança até pelo menos junho de 2026.
- Lote 21 do corpus: a resposta da PGR ao prazo de cinco dias — documento primário lido integralmente,
  a manifestação de Paulo Gonet na PET 16.662 (ASSCRIM/PGR nº 1428987/2026, assinada em 01/09/2026),
  sustentando dupla nulidade da ordem de investigação e pedindo que André Mendonça extinga o processo.
  Registra que 188 das 218 páginas do laudo da PF tratam do ministro Alexandre de Moraes. Acrescenta a
  primeira sessão plenária pós-divulgação (02/09/2026), em que o tema não entrou na pauta, e a fala
  pública do presidente Edson Fachin no mesmo dia, prometendo 'medidas cabíveis e necessárias' sem
  especificá-las.
- Lote 20 do corpus: como os pagamentos aos dois servidores do Banco Central teriam sido operacionalizados
  — mensagens de WhatsApp entre Fabiano Zettel e Daniel Vorcaro ('Belline cobrando. Paga?' / 'Claro'),
  o contrato fictício de consultoria com a Varajo Consultoria Empresarial (objeto declarado: estudo sobre
  integração do mercado jovem, viagem à Disney/Universal para Paulo Sérgio Neves de Souza) e a operadora
  Ana Cláudia Queiroz de Paiva. Camada complementar ao lote 19, publicado em paralelo por outra sessão de
  pesquisa com os registros de pessoa de Paulo Sérgio Neves de Souza e Belline Santana; reconciliado por
  merge, adotando a grafia 'Belline' (Agência Senado). Classe A: apuração relatada pela imprensa (Times
  Brasil), sem confissão nem condenação.
- Lote 19 do corpus, a origem do controle: os dois votos do Banco Central sobre a transferência do Banco
  Máxima a Daniel Vorcaro, cujos extratos vieram a público em abril de 2026. Em fevereiro de 2019 o voto
  BCB 20/2019 indeferiu o pedido por falta de comprovação da origem dos recursos e de capacidade
  financeira, registrando que parcela expressiva teria saído do próprio banco; oito meses depois, o voto
  BCB 218/2019 aprovou a mesma operação, afirmando que a origem fora regularmente demonstrada. Entram o
  caminho patrimonial descrito nos votos (Viking Participações, WWS Holding, Superávit Participações,
  fundo Brazil Realty e o antigo controlador Saul Dutra Sabbá), as remessas de US$ 531 milhões da era
  Máxima à One World Services, com a resposta do banco sobre o acordo administrativo com o Banco Central,
  e a situação dos dois servidores que responderam pela supervisão bancária entre 2019 e 2024, com a
  negativa de um deles e a decisão que tornou facultativo o depoimento do outro à CPI.
- Lote 18 do corpus: seção 6.1 do IPJ-A 3298613/2026 (já extraído no lote 17) — o episódio da eleição do
  Conselho Nacional de Procuradores-Gerais (CNPG) em abril de 2024. Segundo o laudo, o advogado Ciro
  Soares relatou a Vorcaro ter pedido a Paulo Gonet que convencesse um concorrente a desistir da disputa
  em favor de Jarbas Soares Júnior, eleito por aclamação três dias depois. Classificado como alegação
  (classe A): a própria PF registra que a identificação de 'Gonet' nas conversas é possível, não
  confirmada, e o pedido é relato de terceiro em segunda mão. Nenhum dos citados respondeu à imprensa.
- Lote 17 do corpus: leitura direta dos 15 documentos desentranhados da PET 16.662, tornados públicos em
  01/09/2026, entre eles as 218 páginas do IPJ-A 3298613/2026. O lote é sobretudo uma passagem de
  verificação — registros que o corpus mantinha por intermédio da imprensa passam a ter o documento
  primário como lastro. Acrescenta a metodologia da perícia (correlação entre logs do sistema, uso de
  aplicativos e PDFs residuais, sem recuperação do conteúdo das mensagens), as duas ressalvas do próprio
  laudo — não é exaustivo, e não houve atos de aprofundamento dirigidos a magistrados ou a membros do
  Ministério Público —, os dois inquéritos conexos (IPL 2026.0053200 e IPL 2026.0029775, este sobre o
  grupo 'Turma'), a autuação da PET 16.662 por prevenção e o despacho que abriu vista à PGR por cinco
  dias. Corrige a data do primeiro contrato Barci de Moraes para 23/01/2024.

- Lote 16 do corpus: o relatório final apresentado à CPMI do INSS, de 4.340 páginas, e sua rejeição por
  19 votos a 12 na madrugada de 28/03/2026, com a comissão encerrando sem relatório aprovado. O texto
  dedica seção própria ao Banco Master, propõe indiciar Daniel Vorcaro e Augusto Ferreira Lima por oito
  crimes cada, reúne auditoria da CGU (documentação contratual ausente em 84,3% das operações entre
  outubro de 2021 e abril de 2023; 62,5% das averbações com score biométrico insuficiente), registra a
  suspensão do acordo com o INSS em outubro de 2025 e o bloqueio de cerca de R$ 2 bilhões, e recomenda
  exames sobre contratos e relações envolvendo integrantes e familiares do STF. Todos os registros
  trazem o enquadramento de proposta vencida, sem efeito institucional.
- Lote 15 do corpus, quanto o banco pagou e a quem: R$ 304,5 milhões a advogados e escritórios em 2025,
  distribuídos entre ao menos 98 bancas, com o escritório Barci de Moraes no topo (R$ 40,1 milhões só
  naquele ano); R$ 25,8 milhões em consultorias ligadas a três ex-presidentes do Banco Central; o
  contrato de R$ 250 mil mensais com o escritório de Ricardo Lewandowski, pago por 21 meses depois de
  ele assumir o Ministério da Justiça, com sua nota afirmando que deixou a sociedade e suspendeu o
  registro na OAB; e R$ 3,8 milhões à empresa de Fabio Wajngarten para a defesa de Vorcaro, confirmados
  por ele. Entra também a confirmação, pelo senador Jaques Wagner, de que indicou o escritório de
  Lewandowski ao banco.
- Lote 14 do corpus, frente da Procuradoria-Geral da República: o registro, no relatório da PF, de
  pedido para que Daniel Vorcaro custeasse a ida do filho do procurador-geral a evento em Londres,
  feito por intermediário; o custo da degustação de uísque na primeira edição do fórum; a intimação do
  relator para manifestação da PGR em cinco dias; a reação do Conselho Superior do MPF; a rejeição de
  nova tentativa de delação e o pedido de arquivamento das denúncias de ameaça. Fica registrado que o
  relatório não aponta resposta do ministro Alexandre de Moraes às mensagens em que o banqueiro pede
  atuação em seu favor. O filho do procurador-geral, pessoa privada, não integra o mapa.
- Lote 13 do corpus, o chamado núcleo de intimidação: o plano, revelado na 3ª fase, de simular um
  assalto contra o colunista Lauro Jardim, com a reação da Associação Nacional de Jornais; o policial
  federal aposentado apontado como cooptador de agentes para consultas indevidas; a morte de Luiz
  Phillipi Mourão sob custódia da Polícia Federal em 04/03/2026, com a nota da corporação e a
  contestação da família, que não teve acesso às imagens, aos autos nem ao laudo do IML; e a primeira
  manifestação de Daniel Vorcaro sobre o tema. A pessoa morta é tratada pelo nome, e o apelido usado
  pelos investigadores fica registrado como alias, sempre atribuído.
- Lote 12 do corpus, resposta institucional por fontes oficiais: Fato Relevante do BRB de 28/03/2025,
  com os percentuais exatos da compra; requerimento da CAE registrando que o preço equivalia a 75% do
  patrimônio do banco público; convocações da CPI do Crime Organizado e da CPMI do INSS; PLP 135/2026,
  de Ciro Nogueira, elevando o limite do FGC; substitutivo à PEC 65/2023 aprovado na CCJ; projeto da
  Câmara sobre exoneração de diretor do Banco Central; e o comunicado oficial da Polícia Federal sobre
  a 10ª fase. As fontes primárias oficiais passaram de 26 para 34.
- Lote 11 do corpus: os dois contratos do escritório Barci de Moraes. Entra o segundo instrumento, de
  12/05/2025, firmado com a Viking Participações, com limite de R$ 50 milhões líquidos, e o termo de
  dação em pagamento que previa quitar R$ 40 milhões com ações de duas empresas ligadas a aeronaves;
  os R$ 80,2 milhões apontados pela Receita Federal à CPI; a confirmação do escritório de que o ministro
  editou a última versão do primeiro contrato a pedido do compliance do banco; e a ressalva da própria
  Polícia Federal de que o relatório de 218 páginas, feito em 72 horas sobre um único celular, não é
  exaustivo.
- Lote 10 do corpus: inspeção do TCU no Banco Central sobre a liquidação, concluída em 11/02/2026, cujo
  relatório, segundo interlocutores da Corte, não aponta irregularidades na atuação da autoridade
  monetária, seguida da ampliação do sigilo; depoimento de Daniel Vorcaro ao gabinete de André Mendonça
  (02/09/2026), com alegação de intimidação para não citar a Polícia Federal, a resposta de integrantes
  da PF e da PGR e a versão dos interlocutores do diretor-geral; e as duas petições do Partido Novo ao
  STF (03/09/2026) pedindo prisão preventiva e afastamento do diretor-geral.
- Lote 9 do corpus, frente de São Paulo: Termo de Colaboração 01/SMIT/2024, de R$ 108 milhões, entre a
  Secretaria Municipal de Inovação e Tecnologia e o Instituto Conhecer Brasil para 5 mil pontos de wi-fi
  gratuito; Operação Wi-Fi Livre da Polícia Civil (01/06/2026), com oito mandados contra o instituto, a
  Go Up Entertainment, endereços de Karina Ferreira da Gama e a sede da secretaria; autorização do
  ministro Flávio Dino (24/08/2026) para a Polícia Federal acessar os dados; e emendas de R$ 2 milhões
  atribuídas a Mário Frias, negadas pela defesa. Contraditório da empresária e da prefeitura registrado.
- Lote 8 do corpus: Atos do Presidente do Banco Central nº 1.377 e nº 1.378, lidos no Diário Oficial
  de 19/02/2026, que decretam a liquidação do Banco Pleno e da Pleno DTVM e fixam o termo legal em
  22/12/2025; data certa da liquidação da CBSF, antiga Reag (15/01/2026); e a representação da Polícia
  Federal de 98 páginas (INQ 5026, PET 16.032), com o uso gratuito de aeronaves e ingressos, o contrato
  do apartamento quitado na assinatura e a origem da sociedade de Augusto Lima no Master pelas carteiras
  do CredCesta, criado no contexto da Empresa Baiana de Alimentos. Entram a Lei nº 14.431/2022, que
  ampliou margem e público do crédito consignado, o CredCesta e a Ebal.
- Lote 7 do corpus, a partir de documentos primários lidos na íntegra: decisão da Petição 16.229
  (9ª fase da Compliance Zero, 17/06/2026), com os três eixos da apuração sobre Jaques Wagner, o
  apartamento nº 1.702 do Poème Horto, a BN Financeira, a Epítome S.A. e as medidas cautelares;
  decisão da 4ª Vara Federal Criminal do Amapá na operação Zona Cinzenta, com a conduta
  individualizada dos gestores da Amprev e a ata de 30/07/2024; decisão da 6ª fase; e nota da defesa
  de Thiago Miranda. Os eventos da 9ª fase e da Zona Cinzenta deixaram de ser corroborados por
  imprensa e passaram a ser documentais.
- Retratos de 37 pessoas e marcas de 13 organizações, do Wikimedia Commons, com autoria, licença e
  link para o arquivo original exibidos junto da imagem; coletor em `python/novelo_osint/fotos.py`
  recusa licença não livre, imagem que não seja marca própria e arquivo repetido entre entidades.
- Link direto para uma conexão (`/grafo?e=<id>`), compartilhável e coberto por teste de ponta a ponta
  que verifica títulos de fonte e contraditório no card.
- Camada probatória opcional no grafo, com nós de documentos, fontes, claims e evidências e vínculos
  explícitos de rastreabilidade; expansão até o 3º grau com contagem prévia; física contínua, arraste,
  fixação, restauração e rotação do mapa; job semanal/manual de stress com 5.000 nós e 25.000 arestas.
- Lote 6 do corpus: financiamento do filme "Dark Horse" (Flávio, Eduardo e Jair Bolsonaro, Mário Frias,
  Thiago Miranda, Go Up Entertainment, Havengate Development Fund, Entre Investimentos; 10ª fase da
  Compliance Zero), Resort Tayayá e Maridt (Toffoli), pagamentos do Master à Consult Inteligência
  Tributária e ao escritório do filho de Nunes Marques (Coaf), Reag/Mansur, Will Financeira, Banco Pleno,
  Ligga, Amapá Previdência (operação Zona Cinzenta), relatório da PF sobre Jaques Wagner e projeto eólico
  de Fábio Faria; transações (`data/transactions`) passam a ser usadas no corpus real; 4 claims e 3
  sequências temporais novas; contraditório atualizado em Toffoli, Nunes Marques, Alcolumbre, Wagner e Faria.
- Teste unitário de `safeJsonLd`.

### Alterado

- A aba "Perguntar" virou **"Sua IA responde"**, no cabeçalho, no rodapé e no título da página.
  "Perguntar" não dizia a quem, e a página não é um chat do site: é o acervo levado ao assistente do
  próprio leitor. O endereço continua `/perguntar` — já está no prompt do acervo, no `llms.txt` e no
  sitemap indexado.
- O botão "Copiar" do prompt passou a usar a cor de acento em vez de borda discreta: é a ação
  principal daquela página e não se distinguia do resto. O botão do dossiê recebeu acento só no texto
  e na borda, porque ali a ação principal é ler. O par texto/acento do botão primário entrou no teste
  de contraste, que não o cobria — mede 4,5:1 nos dois temas.
- A reprodução da linha do tempo salta para as datas em que algo entra no mapa, em vez de percorrer 321
  meses — só 45 deles têm conteúdo, e o leitor passava a maior parte da animação vendo nada acontecer.
- Dossiês reorganizados: sumário que acompanha a rolagem, contraditório no topo, sem repetição entre
  seções, e altura reduzida de ~47 mil para ~19 mil pixels.
- Grafo legível no celular: rótulos que não saem da tela, alvos de toque maiores, câmera que desloca o
  nó selecionado para fora do painel e escala de evidência explicada uma vez só.
- A camada probatória saiu do arquivo principal do grafo e passou a ser baixada sob demanda
  (`public/data/graph-evidence.json`): o carregamento inicial voltou de 1,4 MB para 586 KB.

### Corrigido

- As 70 revisões do corpus têm a mesma `date`, e a ordenação só por ela deixava o desempate por
  ordem de leitura do disco: `/atualizacoes` abria num lote do meio. O desempate agora é pelo id,
  em ordem natural, que carrega a sequência dos lotes.
- O prompt copiável de `/perguntar` trazia a URL de produção cravada: quem lia a página numa prévia, num
  espelho ou no domínio de deploy mandava o assistente a um endereço que não era o do site à frente.
  Agora o texto é reescrito para a origem em que o leitor está.
- Contrastes abaixo de WCAG AA no tema escuro já publicado, encontrados pela medição sistemática das
  duas paletas.
- Legenda duplicada entre o painel de orientação e o painel de legenda do grafo.
- A imagem de compartilhamento era servida como `application/octet-stream` e, com `nosniff`, recusada
  pelo WhatsApp e pelas redes sociais.
- Cards de conexão agora exibem títulos das fontes e o contraditório específico; o recorte temporal
  oculta relações sem data com aviso explícito; rótulos do grafo usam supressão de colisões e truncamento
  visual preservando o texto completo no hover e nos painéis.
- Contraditórios sem autor identificado passaram a nomear quem se manifestou, em vez de "Envolvido".
- `safeJsonLd` não escapava `<` (a string `"<"` em TypeScript já é `<`), permitindo, em tese,
  fechamento prematuro da tag `<script type="application/ld+json">`. Apontado pelo CodeQL
  (`js/identity-replacement`).
- DEPLOYMENT.md sem e-mail pessoal; app do Cloudflare no GitHub restrito ao repositório.

## [0.1.0] - 2026-09-03 (release candidate)

### Adicionado

- Grafo interativo (Sigma.js 3 + Graphology): busca instantânea, card de nó e de aresta, seleção
  múltipla com conexões comuns, eventos compartilhados, intermediários e caminhos entre pares,
  "Como A se conecta a B?" com alternativas, vizinhança em 1º e 2º grau, isolamento, filtros por tipo
  de nó, de relação e classe de evidência, modos "MOSTRAR APENAS FONTES OFICIAIS" e "MOSTRAR SOMENTE
  FATOS DOCUMENTADOS", time machine com "assistir o novelo se formar", antes/depois de eventos,
  legenda (cor = natureza, forma = força), reorganização por ForceAtlas2 em worker, atalhos de teclado.
- Programas WebGL próprios para arestas tracejadas (alegação) e pontilhadas (inferência), com setas.
- Modelo de dados (Zod) com evidência como entidade central e classes D/C/A/I; lint editorial que
  bloqueia relação sem suporte, alegação/inferência com status verificado, classe D sem documento,
  classe C com fonte única e inferência sem raciocínio escrito.
- Pipeline `data:build` (YAML → corpus.json + graph.json com layout pré-calculado) e dataset sintético
  de estresse (5.000 nós / 25.000 arestas).
- Páginas estáticas indexáveis: pessoas, organizações, eventos, atos públicos, documentos, fontes,
  cronologia com filtros, coincidências temporais, atualizações, metodologia, política editorial e
  rede em tabela; sitemap, robots, JSON-LD, OpenGraph.
- Corpus inicial verificado: 44 pessoas, 26 organizações, 43 eventos, 10 atos públicos, 79 relações,
  24 documentos, 58 fontes (21 oficiais), 81 evidências, 4 claims, 3 sequências temporais.
- Documentação: README, ARCHITECTURE, METHODOLOGY, EDITORIAL_POLICY, OSINT_GUIDELINES, DATA_SCHEMA,
  CONTRIBUTING, SECURITY, DEPLOYMENT, ADRs, notas de performance e relatórios de Red Team.
- Segurança: gitleaks no pre-commit e no CI, scanner de fallback, `.env.example`, CSP e cabeçalhos em
  `public/_headers`, CodeQL, dependency review, Dependabot, `npm audit` limpo.
- Testes: 52 unitários (Vitest) e 10 cenários E2E (Playwright).
- Utilitários Python de captura para OSINT (`python/novelo_osint`).

### Corrigido

- Escape de JSON-LD contra fechamento prematuro da tag `script`.
- Datas de publicação de seis fontes conferidas nos metadados das páginas.
- Reunião no Planalto (04/12/2024) reclassificada de C para D após depoimento oficial de Galípolo à CPI.
