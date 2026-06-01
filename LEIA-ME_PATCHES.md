# 📦 LEIA-ME — V15.1 + Motor + Guard de Render

> **ATUALIZACAO V15.2:** o engine agora e MODULAR (pasta `engine/`, 14 arquivos) — nao existe mais
> o `arch_neural_v15_final.js` monolito. A pasta `_patches/` foi REMOVIDA (fusao/motor_cortex/posicionar
> ja vivem embutidos no engine). Os comandos de `--apply/--rollback` abaixo viraram so registro historico.
> Tambem foram aplicados: fix do NOME (engine/09, [NEREAL_FIX_NOME_V158]) e fix dos PAINEIS (index.js,
> [NEREAL_FIX_PAINEIS]). O `area_identidade.js` foi descartado (gravava o nome em lugar nenhum). Ver CHANGELOG_V15.1.md.



O que mudou neste pacote em relação ao teu projeto original, e onde cada coisa fica.

---

## ✅ O QUE JÁ ESTÁ APLICADO (não precisa rodar nada)

1. **`arch_neural_v15_final.js`** — recebeu o **Córtex Motor v2** no fim do arquivo
   (sentinela `NEREAL_PATCH_MOTOR_CORTEX_V1`). Sem eval novo; reusa o interpretador
   seguro `v112_prog_executar`.
2. **`index.html`** e **`mobile.html`** — recebem `shared/render_guard.js` logo após o
   `viz_renderer` (sentinela `NEREAL_PATCH_RENDER_GUARD_V1`).
3. **`shared/render_guard.js`** — arquivo novo (congela a imagem do cérebro quando fica pesado).

## 🧠 OS DOIS CÉREBROS (na raiz, é onde o `device_check` procura)

- **`cerebro_V15.json`** = MEGA (pesado). Carregado em aparelho forte.
- **`cerebro_V15.1.json`** = LEVE (era o `cerebro_V15_motor.json`). Carregado em aparelho fraco.
- O `device_check.js` escolhe sozinho no boot. **Os dois ganham motor pelo engine** (o motor
  mora no engine, não no JSON) — não precisa enfiar motor em cada cérebro.

## 🎛️ O QUE O MOTOR FAZ (via chat)

- `executar: x = 2 + 2` → roda no interpretador seguro (porta), dispara o nervo motor.
- `faça um programa que imprime 7+1` → o cérebro **compõe** o pseudo e roda → `8` (babbling).
- `imprime 2+2` → `4`. Cada sucesso **cristaliza um nó motor** novo (emerge por estímulo).
- **v2 cobre expressão aritmética.** Texto/strings no print é o próximo passo (precisa de
  suporte a string literal no interpretador).

## 🖼️ O GUARD DE RENDER

- Acima de **6000 nós / 60000 arestas** a imagem 3D **congela** + aviso, e o cérebro
  **continua processando/crescendo** por baixo (não-destrutivo).
- Ajustar limite no console: `window.VIZ_GUARD.setLimite(nos, arestas)`.

---

## 🗂️ DENTRO/FORA DO CÉREBRO (situação HONESTA)

Combinamos um plano de mover comportamentos pro cérebro e enxugar os `.js`. **Esse passo
ainda NÃO foi executado.** Então **todos os `shared/` continuam aqui** — apagar qualquer um
agora quebraria o app. A remoção só acontece quando a gente fizer a fusão de verdade
(transformar `desenho_simbolos` etc. em receitas dentro do cérebro). Nada foi deletado.

Classificação (pra quando formos fazer a fusão):
- **Fica fora (corpo/infra):** `arch_neural_v15_final.js`, `shared/viz_renderer.js`,
  `shared/device_check.js`, `shared/render_guard.js`, `shared/overlay_loading.js`,
  `shared/chat_pensando.js`, `shared/audit_filter.js`.
- **Substrato (some quando fundir no engine):** `shared/motor_receitas.js`,
  `shared/auto_receita.js`, `shared/desenho_alfabeto.js`.
- **Comportamento (vira nó/receita no cérebro):** `shared/desenho_simbolos.js`, `tutorials.js`.
- **Só dev (nem app nem cérebro):** `baterias/*`, `_patches/*`.

---

## 🔧 PASTA `_patches/` (ferramentas de dev — NÃO fazem parte do app)

Guardadas pra registro e reversão. Não precisa carregar no HTML.

Reverter o motor:  `node _patches/patch_motor_cortex.js --rollback arch_neural_v15_final.js`
Reverter o guard:  `cd _patches && node patch_render_guard.js --rollback ../index.html ../mobile.html`
Status:            `--status` em qualquer um dos dois.

---

*Resumo: rode local com `python3 -m http.server 8000` e abre `http://localhost:8000/`.*

---

## 🔄 AJUSTES DESTA VERSÃO

- **Visual padronizado:** o desktop (`index.html`) agora abre no estilo **Padrão** (azul/bolinhas),
  IGUAL ao mobile. (Antes o desktop forçava o renderer anatômico colorido no boot.)
- **Tutorial reforçado:** o 1º slide de "Como ensinar" agora destaca o **botão ENSINAR**
  (pacotes 240→7000) como o jeito rápido, além da conversa.
- **Motor nos DOIS cérebros:** a porta `[M_exec_sandbox]` foi semeada tanto no `cerebro_V15.1.json`
  (leve) quanto no `cerebro_V15.json` (mega). O motor em si mora no engine, então ambos já o teriam;
  a porta foi pré-semeada pra ficarem idênticos. Integridade conferida (nenhuma aresta perdida).
- **Nota honesta:** no mega, "executar:" pode ser capturado pelo córtex Turing existente antes do
  motor novo (os dois coexistem). O babbling ("faça um programa que imprime X") usa o motor novo.

---

## 🧬 PATCH 3 — FUSÃO DE QUASE-IDÊNTICOS NA MEDITAÇÃO

**Sentinela:** `NEREAL_PATCH_FUSAO_QUASE_IDENTICOS_V1`
**Arquivos:** `_patches/fusao_quase_identicos.js` (bloco) + `_patches/patch_fusao.js` (aplicador)
**Onde mora:** anexado ao engine; roda no fim de `v112_sleep_replay` (meditação) e via
`window.v112_fundir_quase_identicos()`.

**O que faz:** consolida nós que são o MESMO conceito escrito diferente (caixa/acento/pontuação),
somando a massa, **engrossando o peso das arestas** (dedup) e migrando as conexões pro nó canônico
(o de maior massa). Grafo de QUALIDADE, não de variedade.

**NÃO deleta:** o nó absorvido vira **dormente e recuperável** (`_dormindo=true`, `_fundido_em=<id>`).

**3 salvaguardas contra lixo lógico:**
1. **Só linguagem natural.** Nunca toca regra/regex (`_regra_`, `\s`, `(?:`…), marcador (`[...]`),
   nó de sistema (`B_`,`H_`,`M_`,`n_`…), self_core, nem nó sem id válido.
2. **Contexto.** Se os dois forem densos (>6 vizinhos) e os vizinhos quase não se sobrepõem
   (overlap < 0,34), **NÃO funde** — provável homônimo (ex.: "banco" de sentar vs de dinheiro).
3. **Quarentena.** O borderline não funde; fica marcado `_fusao_quarentena` pra revisão.

**Ajustar:** `window.v112_fundir_quase_identicos({minOverlap:0.34, denso:6})`.

**Aplicar:**  `cd _patches && node patch_fusao.js --apply ../arch_neural_v15_final.js`
**Reverter:** `cd _patches && node patch_fusao.js --rollback ../arch_neural_v15_final.js`
**Status:**   `node patch_fusao.js --status ../arch_neural_v15_final.js`

**Testado (headless):** caso real de fusão (massa somada, arestas migradas e engrossadas, original
dormente) + homônimo corretamente mandado pra quarentena + **zero** self-loops/arestas órfãs criados.

> ⚠️ **Achado durante o teste:** o `cerebro_V15.1.json` já tinha **220 self-loops e 214 arestas
> órfãs PRÉ-EXISTENTES** (não foram a fusão — ela não criou nenhuma). Vale uma limpeza de dados
> separada algum dia; não é urgente.

---

## 🔄 AJUSTES (rodada 2)

- **Fusão agora tem GC (deleção pós-dormência).** O nó absorvido dorme por uma carência
  (`graceCiclos`, default 1 ≈ 2 meditações, recuperável) e depois é **deletado de vez** — sobra só
  o conceito final. Isso evita acumular dormidos. As arestas já foram migradas; o GC limpa resíduos.
  Ajuste: `window.v112_fundir_quase_identicos({graceCiclos:1})` (use 0 pra deletar já na próxima).
- **Visual Padrão UNIFICADO (mobile = desktop).** Os dois agora usam o MESMO renderizador
  compartilhado (`VIZ.desenhar`, estilo 0) no Padrão. Antes o mobile caía no `desenharCerebro_legacy`
  e o desktop no `VIZ.desenhar` — por isso não batiam. Agora batem (mesmo código, mesmo cfg).
  O `desenharCerebro_legacy` do mobile fica só como fallback se o VIZ não carregar.
