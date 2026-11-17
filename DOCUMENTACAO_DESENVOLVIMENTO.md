# Documentação de desenvolvimento — LAB_ARCH-NEURAL V15.3

Data: 15/11/2026 · Pasta: `C:\Users\Douglas\Documents\GitHub\LAB_Arch-Neural-v15`
Backup de antes das mudanças: `E:\BACKUPS_CLAUDE\LAB_Arch-Neural-v15_antes_de_mexer_20261115`

Quem fez: todas as correções e o módulo novo desta versão foram detectados e escritos pelo assistente de código (Claude), a pedido do autor. É infraestrutura, não aprendizado do cérebro. Nada foi enviado ao GitHub (sem commit, sem push).

---

## 1. Como rodar e testar

1. Abra um terminal na pasta do projeto e suba um servidor local (o `file://` bloqueia `treinos/*.json`):
   ```
   python -m http.server 8000
   ```
2. PC: `http://localhost:8000/index.html` (força desktop: `?desktop=1`). Celular na mesma rede: `http://IP-DO-PC:8000/` (redireciona para `mobile.html`).
3. Testes no console do navegador (F12):
   ```js
   BATERIAS.rodar()          // 4 baterias; resultado em {ok, total, baterias:[...]}
   PERFIL.resumo()           // nível do aparelho e números medidos
   PERFIL.forcar('fraco')    // simula aparelho fraco (recarregar); PERFIL.forcar('') volta ao automático
   ```
4. Sempre que mudar um `.js`, suba o número de versão `?v=159` em `index.html` e `mobile.html` (substituir tudo). Sem isso o navegador usa a cópia velha em cache — isso enganou um teste meu nesta sessão.

## 2. Estrutura

| Pasta/arquivo | Papel |
|---|---|
| `engine/01..13` | regiões do cérebro. 01–02 rodam direto; 03–13 são textos que `arch_neural_init()` executa em ordem |
| `engine/14_cerebro_embutido.js` | cérebro leve embutido (2.344 nós) + `arch_neural_init` |
| `cerebro_V15.json` (40 MB, 9.246 nós) | cérebro completo, carregado por botão (PC) ou automático (celular forte) |
| `cerebro_V15_1.json` (3,8 MB) | cérebro leve para aparelho fraco |
| `shared/perfil_aparelho.js` | **novo**: mede o aparelho e adapta a carga (ver seção 4) |
| `shared/overlay_loading.js` | overlay com bolinha girando + barra de % (`LOADING.run/wrap`) |
| `shared/chat_pensando.js` | 3 pontinhos "pensando" no chat |
| `shared/treino_loader.js` | botão ENSINAR (pacotes de `treinos/`) |
| `shared/baterias_runner.js` | roda `baterias/` depois do ensino (só PC, não em aparelho fraco) |
| `index.html` + `index.js` | versão PC · `mobile.html` (JS embutido) versão celular |
| `index_old.js`, `mobile_old.html` | cópias antigas, ninguém carrega (proposta: apagar — ver seção 6) |

## 3. O que foi mudado (cada erro: quem detectou e quem corrigiu)

| # | Erro real encontrado | Detectou | Corrigiu | Onde | Prova |
|---|---|---|---|---|---|
| 1 | **6 regiões não carregavam no navegador**: v154 aprendiz, v155 válvula, v156 evolução, v159 córtex cognitivo, v159b motores, v160 estatístico. Erro `global is not defined` (código feito para Node). `média de [1,2,3,4,5]` respondia "beleza"; bayes respondia "interessante" | Claude, no console do app | Claude | `engine/06,07,08,11,12,13` (marca `FIX_GLOBAL_NAVEGADOR_V1`, troca por `globalThis`) | baterias 142/347 → 332/347; estatística 0/157 → 157/157; nível deus 3/20 → 20/20 |
| 2 | Cérebro leve nunca carregava: o código pedia `cerebro_V15.1.json`, o arquivo é `cerebro_V15_1.json` → aparelho fraco baixava os 40 MB | Claude, lendo `device_check.js` | Claude | `shared/device_check.js`, `index.js`, `mobile.html` (`FIX_PERFIL_CEREBRO_V1`) | com perfil fraco o celular carrega 2.366 nós (antes 9.247) |
| 3 | Celular carregava o cérebro de 40 MB **sem aviso** logo depois de abrir (tela congelada) | Claude | Claude | `mobile.html` (`FIX_CARGA_AUTO_COM_SPINNER_V1`) | overlay mostra "baixando 20%… 65%… 97%… lendo… importando" |
| 4 | Toda abertura apagava **todo** o localStorage: a caixinha "não mostrar isso toda vez" e o tema nunca funcionavam | Claude | Claude | `index.html`, `mobile.html` (`FIX_PREFERENCIAS_FICAM_V1`) — só preferências ficam; cérebro/identidade continuam zerando como antes | testado: boas-vindas some na abertura seguinte; chave estranha é apagada |
| 5 | ENSINAR processava lotes fixos de 30 frases: no cérebro completo (~0,45 s por frase) eram ~15 s de tela congelada por lote | Claude, medindo | Claude | `shared/treino_loader.js` (`FIX_ENSINO_FATIAS_V1`) | maior pausa no ensino: 93 ms |
| 6 | Baterias pós-ensino rodavam num bloco só (3 a 15 s congelado) | Claude, medindo | Claude | `shared/baterias_runner.js` (`FIX_BATERIAS_FATIAS_V1`) | agora 1 bateria por vez com %; ainda há pausas de 1–3 s dentro de uma bateria (seção 6) |
| 7 | Os 3 pontinhos "pensando" nunca apareciam (o timer de 2 s não dispara durante um turno síncrono) e o envio de verdade nem os usava | Claude | Claude | `shared/chat_pensando.js`, `index.js` `enviar()`, `mobile.html` (`FIX_PENSANDO_IMEDIATO_V1`) | cérebro completo: bolinha aparece na hora e some com a resposta |
| 8 | Indicador do cérebro dizia "V15 · completo" quando rodava o embutido leve | Claude | Claude | `index.js` (`FIX_INDICADOR_CEREBRO_V1`) | — |
| 9 | Spinner podia não aparecer antes de trabalho síncrono (só `setTimeout 30`) | Claude | Claude | `shared/overlay_loading.js` (`FIX_SPINNER_PINTA_V1`) — espera um quadro pintado e gira na GPU (`will-change`) | — |
| 10 | Abertura sem aviso enquanto ~4,5 MB do motor baixam | Claude | Claude | `index.html` (`FIX_BOOT_SPINNER_V1`), mostra erro se o motor falhar | — |
| 11 | Salvar revogava o link do arquivo na hora (Firefox/Safari podem cancelar o download) | Claude | Claude | `index.js` (`FIX_SALVAR_REVOKE_V1`) | — |
| 12 | Engenharia reversa só aceitava a seta `→`; quem digita `->` ou `saída` com acento não era entendido | Claude, testando como usuário | Claude | `engine/12_v159b_motores_cognitivos.js` | `entrada 2 -> saida 5` … infere `f(x) = 2*x + 1` |

## 4. Carga adaptada ao aparelho (`shared/perfil_aparelho.js`)

Na abertura mede núcleos, RAM (quando o navegador informa), um teste de CPU de ~1 ms, se é celular e se está em economia de dados, e escolhe:

| Nível | Fatia de trabalho | 3D até | Cérebro automático (celular) | Baterias pós-ensino |
|---|---|---|---|---|
| fraco | 8 ms | 20 qps | leve | não roda |
| médio | 14 ms | 30 qps | leve no celular | roda no PC |
| forte | 24 ms | 60 qps | completo | roda no PC |

- **Trabalho em fatias**: `PERFIL.emFatias(lista, fn, aoProgredir)` roda até a fatia de tempo acabar e devolve a tela ao navegador (barra de % anda, botões respondem).
- **3D adaptativo**: o intervalo entre quadros é o maior entre o tamanho do cérebro, o teto de qps do nível e o custo medido do desenho × fator (fraco 4, médio 3, forte 2). Com uma operação pesada aberta, o 3D cai para ~4 qps e a CPU vai para o trabalho.
- **Download com % real**: `PERFIL.baixarJSON(url, aoProgredir)` lê o arquivo em partes e informa MB baixados.
- **Chat**: se as respostas andam lentas (média > 120 ms, cérebro > 8.000 nós, ou fraco com > 3.000), os pontinhos aparecem antes do turno.
- Escolha manual: `localStorage.setItem('arch_perfil','fraco'|'medio'|'forte')` (sobrevive à limpeza de cada abertura).

## 5. Dados pessoais

- `cerebro_V15.json` tinha aprendido "meu nome é douglas" e guardava `user: ["douglas"]`. Troquei as 16 ocorrências pelo nome fictício **otavio** (nome que não existia em nenhum arquivo, então nenhuma chave colidiu) e esvaziei `self_core.user`, para o app não chamar todo visitante por um nome.
- `baterias/bateria_selfcore.js`: lista de nomes de teste usava "douglas" → "otavio".
- Comentários "pedido do Douglas", "Caso real RH (Douglas)" etc. → "do autor".
- **Mantidos de propósito** (autoria, não dado de treino): `LICENSE` (direitos autorais, e-mail e GitHub do autor), cabeçalho `Autor:` em `engine/01_v112_core.js`, campo `criador` do cérebro ("quem te criou?") e as expressões de `shared/audit_filter.js` (que existem justamente para esconder o nome em auditorias). Se quiser tirar também, são poucas linhas.
- Nenhum telefone, CPF ou endereço real foi encontrado (os "números de telefone" achados na busca eram coordenadas e hashes).

## 6. Melhorias propostas (não feitas)

1. **Baterias em fatias de verdade**: cada bateria roda todos os testes de uma vez (pausas de 1–3 s). Transformar o laço de cada `bateria_*.js` em lista de testes e usar `PERFIL.emFatias`.
2. **Turno do cérebro completo** custa ~450 ms num PC rápido (estimativa 2–5 s em celular médio). Mover `v112_processar` para um Web Worker exigiria separar o motor do DOM — maior ganho, maior trabalho.
3. **Selfcore 106/120**: as 14 falhas são perguntas como "você sabe meu nome?", "como eu me chamo?", "qual é o nome que te disse?" — o reflexo de nome do usuário não reconhece essas variações.
4. **Integração 49/50**: "execute função dobra" é capturado pela válvula de escape antes do córtex Turing (agora que a válvula carrega).
5. **README desatualizado**: diz 567/567; no navegador, hoje, é 332/347 (antes desta correção era 142/347). Os 100% foram medidos fora do navegador (Node), onde `global` existe.
6. **Arquivos mortos**: `index_old.js` e `mobile_old.html` não são carregados por nada. Apagar quando quiser (não apaguei).
7. **Código duplicado**: `index.js` tem três versões de envio de mensagem (`enviar`, "CHAT com PENSANDO" e `corrigeEnvio`); só a última está ligada aos botões. Unificar.
8. **Cache**: trocar o `?v=` manual por um número único definido num só lugar.

## 7. Como desenvolver (regras práticas)

- Cada correção leva uma marca `[NOME_DO_FIX_V1]` no código, para achar depois com busca.
- Teste no navegador, não só no Node: o app real roda os módulos por `eval` dentro do navegador.
- Antes de dizer pronto: `BATERIAS.rodar()` numa aba recém-aberta (as baterias também treinam a rede, então rodar duas vezes muda o resultado) e conversar pelo campo de texto do app.
- Operação pesada nova: envolva em `LOADING.run(titulo, async (setProgress, setLabel) => { ... })` e, se for um laço, use `PERFIL.emFatias`.
- Não renomear funções públicas (`v112_processar`, `v112_importar`, `arch_neural_init`, `escolherCerebro`, `LOADING`, `PENSANDO`, `TREINO`, `BATERIAS`): `index.js`, `mobile.html` e as baterias dependem delas.

---

# Parte 2 (16/11/2026) — cérebro hipercompactado, conhecimento das bases e "já ensinado"

Pedido do autor: trocar a arquitetura de guardar o cérebro pela hipercompactada (igual ao Nerael); ensinar a Wikipédia inteira, o Livro de Entidades, as regras da língua portuguesa e o dicionário; deixar um cérebro já ensinado e um botão para escolher entre ele e treinar desde o básico. Tudo escrito pelo assistente de código (Claude); quem aprende as frases é o próprio motor do LAB (`v112_processar`).

## Limite medido (por que a base inteira não entra frase por frase)
No motor do LAB cada frase ensinada cria ~80 ligações e custa 80–170 ms (cérebro leve) a 0,5 s (completo), e o custo cresce. A Wikipédia tem ~1,1 milhão de artigos e o dicionário 123.634 verbetes: ensinar tudo pelo grafo levaria dias e geraria um arquivo de dezenas de GB, que não abre em navegador nem cabe no celular. Por isso cada base tem duas partes:
1. **Núcleo no grafo** (aprendido de verdade): definições e regras do Livro de Entidades (353 frases), 1ª acepção das 300 palavras que o cérebro mais usa, 1ª frase dos artigos da Wikipédia cujo título é palavra do cérebro.
2. **Base inteira compactada**, consultada na conversa: o navegador baixa só o índice e, na pergunta, só o pedaço onde está a resposta (~100 KB). Cada resposta consultada também é ensinada ao grafo ("aprendi no grafo"), então o grafo cresce com o uso.

## Arquivos novos
| Arquivo | O que faz |
|---|---|
| `shared/cerebro_compacto.js` | lê o formato LAB-CMP-1 (`CEREBRO_COMPACTO.abrir/baixar`); todo carregar/importar do PC e do celular passa por ele |
| `shared/conhecimento.js` | consulta as bases (`conhecimento/<base>/`), reconhece "o que é / quem foi / o que significa / defina X", responde com a fonte e ensina a frase curta ao grafo |
| `shared/ensino_modo.js` | botões "⚡ usar cérebro já ensinado completo" e "🌱 treinar desde o básico" + caixinhas das bases (PC) |
| `conhecimento/catalogo.json`, `conhecimento/{dic,ent,wiki}/` | bases em pedaços `.tsv.gz` + `indice.json` |
| `cerebro_V15.lab.json` (9,7 MB), `cerebro_V15_1.lab.json` (0,8 MB) | os cérebros de sempre no formato hipercompactado (o `.json` antigo continua, para compatibilidade) |
| `treinos/treino_entidades.json`, `treino_dicionario.json`, `treino_wikipedia.json` | pacotes novos do ENSINAR |
| `ferramentas/` | `extrair_wikipedia.py`, `extrair_dicionario.py`, `extrair_entidades.py`, `montar_conhecimento.py`, `cerebro_compacto.py`, `motor_node.js` (motor no Node, sem navegador), `treinar_cerebro_ensinado.js` |

## Formato hipercompactado LAB-CMP-1
Cada lista de objetos (nós, arestas, eventos) vira colunas; texto repetido fica uma vez num dicionário; `e_1, e_2...` vira prefixo + diferenças; coluna constante vira um valor só. Resultado: cérebro completo 40,9 MB → 9,7 MB (1,6 MB pela rede com gzip), abre em 185 ms contra 363 ms. **Sem perda**: `cerebro_compacto.py conferir` e o teste no Node comparam o JSON byte a byte (IGUAL). Na memória o motor continua com o formato de sempre. Salvar ainda grava o JSON normal (para versões antigas do app conseguirem abrir).

## Fontes usadas
- Wikipédia: `E:\NERAEL_BASES_DADOS\wikipedia_pt\ptwiki-latest-pages-articles.xml.bz2` (a limpeza de wikitexto reaproveita `FORJA\BASES_LEITURA_V1\preparar_bases.py`, para não ter duas).
- Dicionário: Novo Dicionário de Cândido de Figueiredo (1913, domínio público), páginas já lidas em `E:\NERAEL_VISUAL43_DEV\integration_v1\PUC47_DUAL_20261025\PROFESSORES_700_GATE\BOOK_CORPUS\pt_DICIONARIO-acf31020fd2b217d.jsonl`. Os acentos soltos do PDF ("n˜ ao") foram consertados; a grafia é a de 1913 ("phenómeno"); ainda há palavras coladas pelo PDF ("pessôasou").
- Entidades: `E:\NERAEL_MAPA_RECONEXAO\material\livros_tec\_consumo\livro_entidades.txt` (os exemplos com nomes inventados pelo livro não entram no ensino).
- Regras do português: nenhum livro de regras foi achado nos discos (o Nerael aprendeu gramática pelo treebank UD "Bosque" em `E:\NERAEL_MAPA_RECONEXAO\material\ud\` e por uma lição de 14 regras). Com o aval do autor, foi baixado o livro **"Português" da Wikilivros** (CC BY-SA; dump oficial `E:\NERAEL_BASES_DADOS\wikilivros_pt\ptwikibooks-latest-pages-articles.xml.bz2`, 22 MB): 156 temas (acentuação, crase, hífen, classes de palavras, verbos, concordância, regência, colocação pronominal...). `ferramentas/extrair_gramatica.py` gera `gramatica.tsv.gz` (consulta) e `gramatica_frases.txt` (345 frases de regra no pacote `treinos/treino_gramatica.json`).

## Trabalho longo no executor
Ficha `C:\Users\Douglas\Downloads\ARCH-NEURAL 3D-MNLS v3\FORJA\EXECUTOR_SEM_CLAUDE\FILA\lab_v15_extrair_wikipedia.json` (pesado, respeita a trava, retoma sozinho): (1) extrair o resumo de todos os artigos, (2) montar os pedaços da Wikipédia, (3) treinar o cérebro já ensinado no Node, (4) compactar para `cerebro_V15_ensinado.lab.json` com conferência sem perda. Enquanto ele não roda, "já ensinado" usa o `cerebro_V15.lab.json` e a amostra de 5.000 artigos, e avisa isso na conversa.

## Testes feitos (16/11, como usuário, pelo campo da conversa)
- PC, "já ensinado": "o que significa saudade?" → dicionário; "o que é astronomia?" → Wikipédia; "o que é uma entidade?" → Livro de Entidades; "quem foi Aquiles?" → Wikipédia (o cérebro só tinha a associação "aquiles → com → peça → quem", que aparece junto); "qual seu nome?", "quem te criou?" e "média de [1,2,3]" continuam com o cérebro.
- PC, "desde o básico" → ENSINAR Entidades: 353 frases, a base de entidades ligou, baterias depois 332/347 (igual a antes).
- Celular (375×812): carga automática já usa o `.lab.json`; ☰ → "já ensinado": dicionário, Wikipédia e estatística funcionando.

## Atualização 16/11 tarde
- O executor rodou sozinho a ficha da Wikipédia: **1.139.105 artigos** em 658 pedaços (69 MB compactados, ~105 KB por pedaço) e o cérebro já ensinado `cerebro_V15_ensinado.lab.json` (12.228 nós, 316.942 ligações; 18,9 MB compactado, sem perda).
- Regras do português ligadas (base `gram` + pacote `treinos/treino_gramatica.json`).
- O cérebro ensinado será refeito com as regras dentro do grafo pela ficha `C:\Users\Douglas\Downloads\ARCH-NEURAL 3D-MNLS v3\FORJA\EXECUTOR_SEM_CLAUDE\FILA\lab_v15_treinar_com_gramatica.json` (espera a trava pesada). Até lá o ensinado atual já consulta as regras na conversa.
- Teste no PC (cérebro ensinado): "o que é crase?", "o que é próclise?", "o que é concordância verbal?" → regras; "o que é fotossíntese?", "quem foi Machado de Assis?" → Wikipédia; "qual seu nome?" continua com o cérebro. Tempo por pergunta: 2 a 6 s no PC (turno do cérebro grande + pedaço baixado + frase aprendida); no celular será mais.
- Consertos: textos gravados pelo Python no Windows têm fim de linha `\r\n` e o treino no Node agora separa com `\r?\n` (antes as regras davam 0 frases); o núcleo da Wikipédia ignora títulos que não são a própria palavra (".com", "Nao"); nenhuma frase começada por "você/eu/meu..." entra no treino (mexeria na identidade do cérebro).
