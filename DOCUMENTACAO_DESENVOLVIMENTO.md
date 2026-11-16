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
