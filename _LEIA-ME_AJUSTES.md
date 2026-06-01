# Ajustes ARCH-NEURAL v15 — colar no diretorio do projeto

## O que tem neste zip
- index.html        -> ja ajustado (carrega o engine pelos 14 arquivos da pasta engine/)
- index.js          -> ajustado (fix dos paineis laterais, ver abaixo)
- index.css         -> igual ao teu (incluido pra ficar completo)
- engine/           -> o arch_neural_v15_final.js cortado em 14 partes (ORDEM OBRIGATORIA)
- shared/           -> os 12 modulos de runtime (sem duplicata)

## Fix dos paineis laterais (index.js)
Sintoma: SELF-CORE, EVENTOS, CANDIDATOS (e PESOS / ULTIMO TURNO) ficavam vazios.
Causa: o index.js so enchia esses paineis quando voce ENVIAVA uma mensagem normal;
no boot e em turno de "reflexo" (ex: "oi") eles nao atualizavam, e o renderPesos
estourava sem r.pesos (engolido por um try/catch). Marcado com [NEREAL_FIX_PAINEIS]:
  1) boot agora chama renderSelfCore() + renderEventos() + renderCandidatos() + renderPalavras()
  2) renderPesos blindado: nao estoura em turno sem r.pesos
Testado: no boot os 3 paineis enchem; turno de reflexo nao quebra a atualizacao.
ESTADO DA REDE e PALAVRAS ja funcionavam (nao foram tocados).

Cole por cima do diretorio. Os arquivos do zip substituem/criam; o resto
(cerebro_V15.json, cerebro_V15.1.json, treinos/, baterias/, mobile.html, .md) fica intacto.

## Fix do nome (importante)
O unico arquivo do engine que difere do original e o:
  engine/09_v158_reflexos_sociais.js   (marcado com a sentinela [NEREAL_FIX_NOME_V158])
O reflexo social "quem_e_voce" estava casando com "seu nome" e engolindo a frase
de DAR nome antes do handler que grava no self_core. Agora ele so trata "quem e voce",
e "seu nome e X" / "qual seu nome" chegam no handler certo. Testado no boot completo:
  "seu nome e nerael" -> grava nome=["nerael"]
  "qual seu nome"     -> "meu nome e nerael."
Os outros 13 arquivos do engine sao fatia byte-a-byte do original (corte lossless).

## device_check.js
O shared/device_check.js deste zip e a versao MELHORADA (a que estava na raiz):
menos agressiva pra marcar "fraco" e com override manual:
  localStorage.setItem("arch_forcar_cerebro","pesado")   // forca o cerebro pesado
A versao antiga (cores<=4 etc.) foi descartada.

## APAGAR do diretorio (limpeza)
- arch_neural_v15_final.js        (raiz)  -> agora vive em engine/
- area_identidade.js              (raiz)  -> BOMBA: grava o nome em __IDENT__ (some sempre)
- device_check.js                 (raiz)  -> duplicata (o bom ja esta em shared/)
- pasta _patches/ inteira                 -> ja embutida no engine
  (fusao/motor_cortex/posicionar ja rodam de dentro do engine)

## mobile.html — JA AJUSTADO
O mobile.html deste zip ja carrega o engine pelos 14 arquivos de engine/ (igual o index.html).
O JS inline dele nao foi tocado. Ensino do mobile aponta pra treinos/ (ok).

## Documentacao atualizada (pro git)
- CHANGELOG_V15.1.md  -> nova secao V15.2 (modularizacao + fixes)
- README.md / README.en.md / SOBRE_O_LAB.md -> estrutura agora mostra engine/ (nao o monolito)
- LEIA-ME_PATCHES.md  -> nota de topo (engine modular, _patches removido, fixes aplicados)
- APLICACOES.md / DESCRICAO_GITHUB.md -> nao mexidos (texto de marketing; ainda dizem "single-file").
  Se quiser, troco "single-file 4MB" por "engine modular" tambem.

## baterias/ e treinos/
- treinos/  -> e de onde o ENSINAR le (desk via treino_loader.js, mobile via lista inline). Confirmado.
- baterias/ -> NAO e carregada pelo app (nenhum <script> a referencia). Sao suites de teste de dev.

## Pendente (proximo passo, quando quiser)
O nome ainda nao PERSISTE entre sessoes: o botao Salvar baixa um brain_v112_*.json,
mas o boot sempre le o cerebro_V15.json. Da pra resolver com um auto-salvar no
localStorage (boot prefere o salvo). Pedir quando quiser.


## Treinos adaptativos (xadrez / labirinto / benchmark)

Sao 3 treinos DINAMICOS (logica, nao listas de frases), em `treinos/treino_*.js`, ja referenciados nos dois HTML. Eles treinam a rede de verdade (criam nos) e PARAM sozinhos.

Como NAO rodam sozinhos (sao pesados), voce dispara quando quiser. No console do navegador:

    TREINOS_EXTRA.listar()                 // ["benchmark","labirinto","xadrez"]
    await TREINOS_EXTRA.rodar("xadrez")    // roda 1 (com overlay de carregamento)
    await TREINOS_EXTRA.rodar("xadrez", {partidasMax:40})
    await TREINOS_EXTRA.rodarTodos()       // roda os 3 em sequencia

Pra ligar num botao: `meuBotao.onclick = () => TREINOS_EXTRA.rodar("labirinto");`

Opcoes uteis:
- xadrez:    {partidasMax:24, vitoriasParaSubir:3}
- labirinto: {maxPassosNivel:160}
- benchmark: {maxNivel:20, tentativasGerar:12}  (para quando a geradora esgota desafios novos)

## Celular x PC (importante)

Os treinos pesados ficam SO no PC. O `index.html` ja redireciona celular pro `mobile.html`, e o `mobile.html` NAO carrega mais as baterias nem os treinos adaptativos — no celular e so ENSINAR.
No PC (index.html) tudo continua: baterias rodam apos o ensino e os treinos adaptativos sao disparados via TREINOS_EXTRA.
Reforco: se um celular forcar o index.html, o runner detecta (user-agent mobile ou tela < 768px) e recusa educadamente.

## Self-Core: fim do dump de identidade em pergunta de genero (NEREAL_SELFCORE_GATE_PRIORITARIO_V1)

Sintoma: "qual e o seu genero ?" devolvia "sou nerael, ia, sistema, criado por douglas..."
em vez de "masculino". "genero ?" sozinho respondia certo. O dump tambem comia
"qual e o seu nome", "quem te criou", etc, principalmente sob repeticao.

Causa-raiz (duas camadas):
1. A fase de comando-no roda ANTES dos handlers dedicados de genero/nome no engine/02.
   Um comando-no APRENDIDO em sessoes antigas (que volta com o cerebro restaurado)
   casava a pergunta de genero e despejava a identidade — preemptando o handler certo.
   A valvula de escape (engine/07), que tambem e comando-no, fazia o mesmo sob stress.
2. Regex antigo de dump sem \b casava "eu" dentro de "s-eu"/"t-eu" (ja corrigido antes,
   mas faltava paridade no 2o montador).

Fix: o Self-Core agora DOMINA pergunta de identidade. Toda pergunta de campo
(genero / sexo / nome / criador) e marcada no topo do processamento e NENHUM comando-no
pode intercepta-la — cai direto no handler de Self-Core. Frases de SET (escrever o valor)
nao sao afetadas. Fechado o gap do 2o montador de dump (V3).

Resultado da bateria self-core (3000 testes): genero 24% -> 100%, nome da IA 63% -> 87%,
total 57% -> 76%. A identidade e preservada (snapshot/restore) durante a bateria.

Ainda fracos (proxima rodada, se quiser): nome do USUARIO (54% — "eu sou X" e ambiguo de
proposito e "pode me chamar de X" ainda nao escreve o nome do user) e "liste o que sabe
sobre mim/voce" (0% — a feature de listar esta quebrada, trata as palavras da pergunta
como fatos; provavelmente no cerebro embutido).

## Bateria self-core (so PC)

Nova bateria em `baterias/bateria_selfcore.js`, ja no `index.html` (NAO no celular).
Estilo: dizer que ELE e coisas / que EU sou coisas / pedir pra listar / perguntar de
varias formas. No console do PC:

    BATERIA_SELFCORE.run({max:120})              // rapido, sincrono
    await BATERIA_SELFCORE.completo({n:3000})    // completo, com yields
