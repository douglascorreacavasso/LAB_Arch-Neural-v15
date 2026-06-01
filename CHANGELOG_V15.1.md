# 📜 CHANGELOG — V15.1

## V15.2 (Jun/2026) — Modularizacao do engine + fixes

### Novo
- **Nome persiste entre sessoes** (`shared/identidade_persist.js`): nome/user/genero sao salvos no `localStorage` e restaurados no boot (o criador continua fixo no proprio cerebro). Fecha o "nome sumia ao recarregar".
- **Baterias rodam apos o ensino** (`baterias/` + `shared/baterias_runner.js`): as 3 baterias (integracao, estatistica, nivel_deus) foram adaptadas pra browser e rodam automaticamente quando o ENSINAR termina. Elas validam E treinam a rede (teste: +118 nos / +1268 arestas numa rodada; placar 226/227).
- **3 treinos adaptativos** (`treinos/treino_xadrez.js`, `treino_labirinto.js`, `treino_benchmark.js` + `shared/treinos_adapt_runner.js`): treinos DINAMICOS que sobem de dificuldade sozinhos, alimentam o `v112_processar` (treinam a rede) e PARAM sozinhos. Xadrez vs oponentes nivel 1->5 (random->minimax); labirinto de 10 niveis comecando no escuro e ganhando visao por sensacao; benchmark que gera desafios logicos cada vez mais dificeis com pegadinhas e encerra quando nao consegue gerar nada mais dificil. Sao assincronos (nao travam a aba). Dispara via `TREINOS_EXTRA.rodar("xadrez"|"labirinto"|"benchmark")` ou `.rodarTodos()`.
- **Treino so no PC**: celular (`mobile.html`) so ENSINA; baterias e treinos adaptativos rodam so no PC (`index.html`), com trava de reforco por user-agent/tela.


### Refatorado
- **Engine modularizado.** `arch_neural_v15_final.js` (4.2MB, monolito) foi cortado em 14 arquivos na pasta `engine/` (01_v112_core ... 14_cerebro_embutido), carregados em ordem no `index.html` e `mobile.html`. Corte lossless (concatenacao byte-a-byte == original) e cada parte validada com `node --check`. O cerebro serializado (~3.7MB) ficou isolado no `engine/14_cerebro_embutido.js`.
- **`_patches/` removido** do app: fusao_quase_identicos, motor_cortex e posicionar_nos ja vivem embutidos no engine. Os arquivos de patch eram duplicata.

### Corrigido
- **Nome nao gravava** (`self_core.nome` ficava vazio mesmo dando "seu nome e X"). Causa: o reflexo social `quem_e_voce` (regiao 09 / v158) casava com "seu nome" e engolia a frase antes do handler que grava. Fix em `engine/09_v158_reflexos_sociais.js` (sentinela [NEREAL_FIX_NOME_V158]): o reflexo so trata "quem e voce"; "seu nome e X" e "qual seu nome" caem no handler certo. Testado: grava e lembra.
- **Paineis laterais vazios** no boot (SELF-CORE, EVENTOS, CANDIDATOS, PESOS). Fix em `index.js` (sentinela [NEREAL_FIX_PAINEIS]): boot agora renderiza esses paineis; `renderPesos` blindado pra nao estourar em turno de reflexo.
- **`area_identidade.js` removido**: gravava o nome em `window.__IDENT__` (objeto solto, nunca salvo) e sobrescrevia o handler bom. Era a causa raiz do nome sumir.
- **`criador` no cérebro embutido**: o app sobe pelo embutido (engine/14); ele estava com criador vazio. Agora o embutido (e o default do engine/01) tem `criador=["douglas corrêa cavasso"]`. Os arquivos externos (cerebro_V15.json e cerebro_V15_1.json) já tinham o criador certo.
- **Campo `user` corrigido**: "meu nome é X" gravava em `sc.user.nome` (objeto), e o painel lê o array `sc.user`. Agora grava no array — o nome do usuário aparece no painel SELF-CORE.
- **`device_check.js` consolidado**: ficou so a versao melhorada (menos agressiva, com override `localStorage.setItem("arch_forcar_cerebro","pesado")`).

### Nota honesta
- Os modulos de `shared/` continuam como JS (corpo/infra). A migracao deles para dentro do cerebro (como receitas/nos) segue como passo futuro — nada foi deletado.

---


Mudanças desta versão em relação ao V15.0 (Maio/2026).

---

## ✨ NOVO

### Visual
- **Botão ⚛ Formato** no header (mobile e desktop) com **13 estilos visuais prontos**:
  - Padrão (limpo, leve)
  - Original (cores por camada com pulse — era o modo criança)
  - Cristal (hexágonos + linhas magnéticas curvadas)
  - Glifo (glifos rúnicos + circuitos em L)
  - Cosmos Atômico (átomos com órbitas + partículas)
  - Sabre Laizer (núcleo+anel + laser brilhante)
  - Bio-Celular (células membrana + fios trançados)
  - X (pétalas + energia vibrando)
  - Estrelas Neurais (estrelas 5 pontas + pulso disparado)
  - + (cruzes + fumaça paralela)
  - Gema Holográfica (estrelas 8 pontas + pontilhada animada)
  - Cyberpunk Neon (quadrados + dash longo animado)
  - Triângulo Trino (triângulos + linha gradiente)

- **Botão ⛓ Conexão** no header com **22 tipos de conexão** mixáveis:
  line, line_grad, lightning, wave, curve, dotted, particles, dipole, dna, rope, laser, smoke, pulse, ribbon, energy, dash, aurora, circuit, plasma_arc, fractal_swirl, magnetic_lines, spark_chain

- **21 formas de núcleo** disponíveis pro modo livre:
  circle, hex, triangle, star, star8, diamond, square, ring, halo, plasma_ball, drop, cross, petal, gem, atom, glyph, cell, orb, toroidal, dual_star, vortex

- **Paleta cérebro** (botão 🧠) agora aplica suas 10 paletas (padrão, arco-íris, frio, quente, neon, terra, pastel, mono azul/verde/roxo) nos clusters dos estilos coloridos

### Treinamento
- **Novo nível 5: pacote de 7000 frases** (substitui o 5000 antigo)
  - 5000 frases originais + 2000 novas frases ensinando **identificação de usuário**
  - As 2000 novas cobrem: nomes genéricos, perguntas tipo "qual seu nome?", papéis usuário/eu, pronomes, cumprimentos contextualizados, contar o dia, gírias informais

- **Botão de ensinar progride**: 240 → 500 → 1000 → 2000 → **7000** → Acabou
  - Cada label troca no momento certo (sem "clica pra ver" no final)

### UX
- **Overlay de loading global bloqueante** em:
  - Importar cérebro (GitHub e manual)
  - Mesclar/Juntar cérebros
  - Ensinar pacote (com % real)
  - Meditar (com contador 1/40 → 40/40)
  - Salvar cérebro (exportar JSON)
- O overlay tem fundo translúcido, bloqueia interação, mostra label dinâmico + barra de progresso
- **"Pensando..." (3 pontinhos animados)** aparece no chat **só se a resposta demorar >2s**

### Tutoriais embutidos
- **❓ Tutorial Como Ensinar** (10 slides):
  apresente-se, linguagem natural com gírias, conceitos simples, relações, conte o dia, faça perguntas pra testar, criar reflexos com repetição, meditar
- **❗ Tutorial Como Usar o Sistema** (12 slides):
  menu ☰, paletas, ⚛ estilos, ⛓ conexões, painéis laterais, meditar, salvar/carregar, experimentos, pacotes de treino, gestos 3D
- Mobile: slides automáticos com setas ◀▶, auto-avanço 8s/slide, barra de progresso
- Desktop: versão texto longo scrollável

### Desktop (`index.html`)
- **`btn-treinar` agora FUNCIONA** — antes era hardcoded a um pacote pequeno fixo
- Botões novos na topbar: "🎨 formato", "⛓ conexão", "? ensinar", "! usar"
- Menus dropdown com previews ao clicar
- Mesma progressão de pacotes do mobile

---

## 🐛 CORRIGIDO

- **Bug girar**: arrastar com o dedo no canvas NÃO interrompe mais a rotação automática. Agora as duas coisas compõem (gira + pan ao mesmo tempo). Pra parar, só clicando no botão ↻ de novo
- **Pulse com direção correta**: o pulso disparado do estilo "Estrelas Neurais" agora viaja **em direção à coroa** (do nó com Y menor pro Y maior), seguindo o fluxo real do sistema cognitivo

---

## ♻️ REFATORADO

### Arquitetura modular nova
Código antes monolítico foi quebrado em módulos compartilhados:

```
shared/
├── viz_renderer.js     ← renderizador 3D (formas + conexões + estilos)
├── overlay_loading.js  ← overlay bloqueante
├── chat_pensando.js    ← 3 pontinhos
├── audit_filter.js     ← filtra dados pessoais
├── treino_loader.js    ← sistema progressivo de pacotes
└── tutorials.js        ← slides
```

- Mobile.html e index.html agora importam esses módulos via `<script src="shared/...">`
- Mexer num módulo atualiza nas duas telas
- Cada módulo expõe um namespace `window.VIZ`, `window.LOADING`, `window.TREINO`, etc

### Treinos em pasta separada
- Todos os `treino_*.json` foram movidos pra `treinos/`
- Carregamento centralizado via `window.TREINO.ensinarProximo()`

### Dados pessoais removidos
- Título HTML, header desktop, treinos, experimentos: limpos de qualquer referência nominativa pessoal
- Módulo `audit_filter.js` disponível pra aplicar mesma limpeza em conteúdo futuro

---

## 🗂️ NOVOS ARQUIVOS

```
shared/
  overlay_loading.js
  chat_pensando.js
  audit_filter.js
  viz_renderer.js
  treino_loader.js
  tutorials.js

treinos/
  treino_2000_identificacao.json
```

---

## 🔧 ARQUIVOS MODIFICADOS

- `mobile.html` — integração com shared/, novos botões, função `desenharCerebro()` usa VIZ
- `index.html` — integração, "ensinar" funcional, novos botões topbar, menus dropdown
- `README.md`, `README.en.md`, `APLICACOES.md`, `PUBLICAR.md`, `DESCRICAO_GITHUB.md` — atualizados e despersonalizados

---

## 📦 ARQUIVOS PRESERVADOS

- `arch_neural_v15_final.js` — intocado (4.2 MB, todas as 14 regiões)
- `cerebro_V15.json` — intocado (115 sub-redes, 2414 nós)
- `LICENSE` — intocado
- Todos os `treino_240/500/1000/2000/5000.json` — intocados
- `.gitignore` — intocado
