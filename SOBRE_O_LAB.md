# LAB ARCH-NEURAL V15.1 — um cérebro simbólico que cresce sozinho

> **O que é, em uma frase:** um protótipo de arquitetura cognitiva **simbólica e emergente** —
> um grafo de conceitos que nasce pequeno, aprende conversando, consolida o que repete e
> desenvolve comportamento a partir de regras gerais, **sem nada de roteiro escrito à mão**.

> ⚠️ **Escopo honesto.** Este LAB é um **avião de papel**, não o foguete. É a base / prova de
> conceito de um sistema maior e multimodal que está sendo construído em separado. Aqui o objetivo
> não é desempenho de mercado nem competir com LLMs — é **investigar como cognição pode emergir de
> regras simples e auditáveis**. Tudo aqui é inspecionável: cada nó, cada aresta, cada decisão.

---

## 1. A ideia central

A maioria dos sistemas de IA hoje é estatística e opaca: pesos contínuos, bilhões de parâmetros,
nenhuma explicação local. O LAB segue o caminho oposto, e mais antigo: **representação simbólica**.

O conhecimento é um **grafo**. Cada **nó** é um conceito (uma palavra, um símbolo, um comando, um
evento). Cada **aresta** é uma relação, com peso. O cérebro "pensa" **propagando energia** pelo
grafo e vendo o que acende. Aprender é **criar e engrossar conexões**. Lembrar é **deixar o que
importa subir** — não guardar tudo achatado.

O princípio de design que atravessa tudo é: **emergente, não hardcoded.** Em vez de programar "se
o usuário disser X, responda Y", programam-se **mecanismos gerais** (propagação, reforço hebbiano,
consolidação, composição de receitas) e deixa-se o comportamento **aparecer** do uso.

---

## 2. Arquitetura em alto nível

| Camada | Papel |
|---|---|
| **Engine** (`engine/` — 14 arquivos) | O cérebro de fato: grafo, propagação, aprendizado, meditação, córtices. **Modular**: 14 regiões em arquivos separados (~22 mil linhas no total), carregados em ordem. Sem dependências externas. |
| **Cérebros** (`cerebro_V15.json`, `cerebro_V15.1.json`) | Estados salvos do grafo. Um **mega** (denso, ~9k nós) e um **leve** (~2,3k nós) escolhido automaticamente em aparelhos fracos. |
| **Treinos** (`treinos/`) | Pacotes de frases (240 → 7000) que o usuário "ensina" pelo botão **ENSINAR**. |
| **Módulos** (`shared/`) | Features sobre o engine: visualização, desenho de símbolos, receitas, guarda de render, tutoriais. Cada um se auto-anexa; o engine não os chama. |
| **Interfaces** (`index.html`, `mobile.html`) | Chat + visualização 3D do grafo, desktop e mobile. |

O engine **não importa** nada dos módulos. Os módulos é que se penduram nele (padrão de
*decorator* / hook). Isso mantém o núcleo independente e os recursos plugáveis.

---

## 3. Os mecanismos que importam

### 3.1 Nós e arestas
Um nó tem `id`, `text`, `mass` (saliência acumulada), `camada` (sensorial, córtex, hipocampo,
motora, self_core…) e `pos` (posição 3D para a visualização). Uma aresta tem `from`, `to`, `peso`
e `tipo` (associativa, cronológica, mielinizada…). Conexões muito usadas **engrossam**; conexões
fracas **dormem** (não são deletadas).

### 3.2 Propagação de energia (o "pensar")
Uma entrada acende nós sensoriais; a energia se espalha pelas arestas mais fortes. O que acumula
mais energia é o que vem à tona. É daí que sai a resposta — não de um `switch/case`.

### 3.3 Meditação / *sleep replay*
Periodicamente o cérebro "dorme": repropaga os conceitos mais densos, **reforça (Hebb)** as
conexões que acendem juntas, e **coloca para dormir** as arestas fracas e sem uso. Poda aqui
significa **dormir, não apagar** — preserva memória de evento.

### 3.4 Fusão de quase-idênticos *(novidade desta versão)*
Conceitos que são **a mesma coisa escrita diferente** (caixa, acento, pontuação) são **fundidos**
durante a meditação: soma a massa, engrossa os pesos, migra as arestas para o nó canônico. O
original absorvido **dorme por uma carência e depois é deletado** — sobra só o conceito final,
mais denso e mais rápido. **Grafo de qualidade, não de variedade.**

Três salvaguardas evitam "lixo lógico": (1) só toca **linguagem natural** — nunca regra/regex,
marcador ou nó de sistema; (2) checa o **contexto** — se dois nós densos têm vizinhanças
incompatíveis, não funde (provável homônimo, ex.: *banco* de sentar vs. de dinheiro); (3)
**quarentena** para casos de fronteira.

> Por que isso é interessante: cérebros biológicos **podam** porque neurônio custa energia. Um
> cérebro digital não tem esse custo — então a estratégia ótima se inverte: **não esquecer o único,
> consolidar o repetido.** "oi" dito mil vezes vira um nó denso que responde rápido. Frequência
> virando saliência.

### 3.5 Córtex motor emergente *(novidade desta versão)*
O sistema ganha um **lado ação**, não só percepção. Há uma "porta" genérica (`[M_exec_sandbox]`)
e, por **balbucio** (*babbling*), o cérebro compõe pequenos programas a partir de primitivas
(ex.: "faça um programa que imprime 7+1" → compõe, roda num interpretador seguro, cristaliza a
habilidade aprendida). Execução real, **sem `eval`** — um interpretador de pseudocódigo com limite
de passos.

### 3.6 Alfabeto de receitas (desenho e comandos)
Um módulo de **receitas** compõe saídas (arte de caractere, comandos novos) a partir de primitivas.
O cérebro pode **aprender e salvar** uma receita e reusá-la depois — é assim que "cria habilidade
nova" em vez de ter cada habilidade escrita à mão.

---

## 4. A visualização

O grafo é desenhado em 3D: cada nó é um ponto, posicionado por camada e densidade; arestas fortes
aparecem; o `self_core` pulsa no centro. Há um estilo **Padrão** (limpo) e estilos alternativos
(anatômico colorido etc.). Uma **guarda de render** congela o desenho (sem parar o cérebro) acima
de um limite de nós/arestas, para a UI não travar em cérebros grandes.

---

## 5. O que este protótipo demonstra

- Que **comportamento conversacional e habilidades** podem emergir de mecanismos gerais + uso,
  sem roteiro.
- Que **consolidação por fusão** (em vez de poda destrutiva) é um modelo coerente de memória para
  um substrato digital.
- Que um sistema de IA pode ser **100% auditável**: dá para abrir qualquer nó e entender por que
  ele respondeu o que respondeu.

## 6. O que este protótipo **não** é

- Não é um LLM e não compete com um. Não generaliza linguagem como um modelo estatístico.
- Não é multimodal (isto é o foguete, em separado). Aqui é texto + símbolo.
- Não tem ainda avaliação formal contra *baselines* — é prova de conceito, não resultado científico
  fechado.

---

## 7. Para onde isto aponta (caminho de pesquisa)

O LAB é o ponto de partida natural para um trabalho mais sério sobre **arquiteturas cognitivas
simbólicas emergentes**: como definir, medir e comparar "emergência" de comportamento; como a
consolidação por fusão se compara a esquemas de memória clássicos; como o lado motor cresce em
relação ao perceptivo. Essas são perguntas de **mestrado**, não de curso aplicado — e encaixam em
linhas como IA & Métodos Formais / Inteligência Computacional.

---

## 8. Como rodar

```bash
# na raiz do projeto
python3 -m http.server 8000
# abra http://localhost:8000/  (desktop)  ou  /mobile.html  (celular)
```

Fale com ele no chat, use o botão **ENSINAR** para crescer o cérebro (240 → 7000), e o 🎨 para
trocar o estilo da visualização.

---

## 9. Estrutura do repositório

```
engine/                    # o engine modular (14 regiões: 01_core … 14_cerebro_embutido)
index.html / mobile.html   # interfaces desktop / mobile
cerebro_V15.json           # cérebro mega (denso)
cerebro_V15.1.json         # cérebro leve (aparelhos fracos)
shared/                    # módulos plugáveis (viz, desenho, receitas, guarda, tutoriais)
treinos/                   # pacotes de ensino (240 … 7000)
baterias/                  # suítes de teste (uso de desenvolvimento)
#  (_patches/ foi removido: os patches já vivem embutidos no engine)
LEIA-ME_PATCHES.md         # o que cada patch faz e como reverter
```

---

*ARCH-NEURAL V15.1 — protótipo de pesquisa. Construído de forma independente, do zero, em
JavaScript puro. Emergente por princípio.*
