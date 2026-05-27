# 🧠 ARCH-NEURAL V15.1 FINAL

**Cérebro cognitivo modular — Anatomia + Fisiologia + Cérebro Serializado num único arquivo JavaScript.**

> **Autor:** Douglas Corrêa Cavasso
> **Contato:** douglas.cavasso@gmail.com
> **GitHub:** [github.com/douglascorreacavasso](https://github.com/douglascorreacavasso)
> **Versão:** V15.1 FINAL (Maio/2026)
> **Licença:** Proprietária — todos os direitos reservados

🇺🇸 [English version](README.en.md)

---

## 🎯 Filosofia

O cérebro é **UMA coisa só**. Não tem "código fora do cérebro" e "JSON dentro do cérebro" — é uma estrutura única com regiões especializadas. Igual o cérebro humano: córtex motor é anatomia E fisiologia juntos, não separados em arquivos.

Por isso a V15.1 FINAL entrega **`arch_neural_v15_final.js`** — **um único arquivo de 4MB** com tudo dentro:

- ✅ Estrutura do grafo (anatomia)
- ✅ Motor de execução (fisiologia)
- ✅ Reflexos sociais
- ✅ Córtex Turing (variáveis, loops, condicionais)
- ✅ Córtex Cognitivo (hipóteses, simulação, analogia, eng-reversa, metacognição)
- ✅ Córtex Estatístico (10 motores matemáticos REAIS)
- ✅ Auto-modificação (aprendiz, válvula, evolução biológica)
- ✅ **Cérebro serializado embutido** (115 sub-redes, 2400+ nós)

**14 regiões empilhadas em ordem cronológica do projeto, num único arquivo.**

Não chama APIs externas. Não usa LLM. Não precisa de internet. Tudo roda no navegador, JavaScript puro, **totalmente offline e determinístico**.

---

## 🚀 Como usar

### 🌐 Demo online (no navegador, sem instalar nada)

👉 **[https://douglascorreacavasso.github.io/arch-neural-cortex-v15/](https://douglascorreacavasso.github.io/arch-neural-cortex-v15/)**

(disponível após você ativar GitHub Pages no repositório — instruções em [PUBLICAR.md](PUBLICAR.md))

### 💻 Desktop (interface completa)

```bash
git clone https://github.com/douglascorreacavasso/arch-neural-cortex-v15.git
cd arch-neural-cortex-v15
# Abra index.html no navegador, ou:
python3 -m http.server 8000
# Acesse http://localhost:8000
```

### 📱 Mobile (interface touch-friendly)

Abra `mobile.html` no celular ou tablet. **Mesma capacidade do cérebro**, UI otimizada pra toque, com:
- Menu de **5 paletas de cores** (Sci-Fi, Matrix, Solar, Borboleta, Cyber)
- Toggle **2D/3D** (com aviso de desempenho)
- Botão **carregar cérebro do GitHub** ou manual do seu PC
- Abas flutuantes: meditar, árvore, resetar, salvar, importar, mesclar

### 🧪 Rodar baterias de teste (Node.js)

```bash
cd baterias
node bateria_reflexos_sociais.js  # 340/340 = 100%
node bateria_estatistica.js       # 157/157 = 100%
node bateria_integracao.js        # 50/50 = 100%
node bateria_nivel_deus.js        # 20/20 = 100%
```

---

## 📊 Validação completa

Todas as baterias rodadas contra o arquivo único `arch_neural_v15_final.js`:

| Bateria | Score | O que valida |
|---|---|---|
| Reflexos sociais | **340/340 = 100%** ✅ | 20 padrões × 5 contextos emocionais |
| Estatística | **157/157 = 100%** 🏆 | 10 motores matemáticos com execução real |
| Integração entre módulos | **50/50 = 100%** 🏆 | Roteamento, não-invasão, encadeamento |
| Nível DEUS (2× mais difícil) | **20/20 = 100%** 🏆🏆 | Bayes raro, paradoxo aniversário, (x+1)², ANOVA 4 grupos |
| **TOTAL** | **567/567 = 100%** | |

---

## 🎯 O que ele consegue fazer

### Motor Turing (variáveis, loops, condicionais, funções)
```
> estado: x=0, soma=0, i=1
> regra: enquanto i menor_que 11 faça [soma = soma + i, i = i + 1]
> execute e mostre valor de soma
  → soma = 55
```

### Córtex cognitivo (hipóteses + simulação)
```
> qual rende mais: 1000 com taxa 5% por 10 anos vs 2000 com taxa 3% por 8 anos?
  → Melhor opção: Investimento 2 (rende 2533.54). Diferença de 904.65.
```

### Analogia estrutural (8 padrões reconhecidos)
```
> tanque com 200L vazando 8L/min, quanto tempo até zerar?
  → Padrão reconhecido: decremento_ate_zero — variável diminui até zero.
    Fórmula sugerida: tempo = quantidade_inicial / taxa_decremento
```

### Engenharia reversa (linear, quadrática, estrutural)
```
> entrada 2 → saida 5
> entrada 5 → saida 11
> entrada 10 → saida 21
  → Regra inferida: f(x) = 2*x + 1 (tipo linear, acerto 100%)
```

### Estatística (matemática real, não alucinação de LLM)
```
> média de [10, 20, 30, 40, 50]
  → Análise descritiva (n=5): média=30, mediana=30, desvio=15.81, IQR=20...

> bayes prior=0.01 sensibilidade=0.99 especificidade=0.95
  → P(D|+) = 0.1667 (16.67%) — baixa probabilidade real apesar do teste +
```

### Raciocínio causal reverso
```
> a causa b
> b causa c
> c causa d
> estado atual é d. onde começou?
  → começou em: a
```

---

## 🧱 Arquitetura — 14 regiões empilhadas

```
01. v112_core              ← Anatomia do grafo (V112.nodes, edges, subredes)
02. v112_brain             ← Motor de execução (v112_processar, propagação)
03. v151_logica_prog       ← Lógica/programação inicial
04. v152_afastamentos      ← Sub-redes especializadas (caso RH)
05. v153_auto_mod          ← Aprendiz emergencial (cria handlers sob falha)
06. v154_aprendiz_meta     ← Meta-aprendiz (5 estratégias)
07. v155_valvula_escape    ← Válvula de escape (libera sob sobrecarga)
08. v156_evolucao          ← Evolução biológica (pesos de arestas)
09. v158_reflexos_sociais  ← Reflexos sociais (20 padrões)
10. v15_cortex_logico      ← ★ Córtex Turing completo
11. v159_cortex_cognitivo  ← ★ Córtex cognitivo (base)
12. v159b_motores          ← ★ 6 motores cognitivos + árbitro
13. v160_estatistico       ← ★ 10 motores estatísticos
14. CEREBRO_DATA           ← ★ Cérebro JSON serializado embutido
```

**Hemisférios com inibição lateral GABA:**
- `H_LING` (linguístico/social, x < 200)
- `H_MAT` (matemático/lógico, x ≥ 200)
- `B_corpo_caloso` roteia entre hemisférios

---

## 🔬 Os 10 motores estatísticos (matemática real)

| Motor | Implementa | Validado contra |
|---|---|---|
| E1 Descritivo | n, média, mediana, moda, var, sd, IQR, assimetria, curtose, CV | Cálculo manual |
| E2 Distribuições | Normal/Binomial/Poisson/t/F/Chi²/Beta/Gamma/Exp/Uniforme | erf via Abramowitz 7.1.26; gamma via Lanczos |
| E3 Testes de hipótese | t-teste (1 amostra, indep, pareado), ANOVA, chi², Mann-Whitney | Tabelas t, F, chi² |
| E4 Correlação | Pearson, Spearman (via ranks) | Reproduz Anscombe r=0.816 |
| E5 Regressão | Linear simples (slope, intercepto, R², SE) | Recupera coeficientes sob ruído |
| E6 Bayesiano | Atualização simples, cadeia sequencial, Fator de Bayes | Paradoxo doença rara: 0.1667 exato |
| E7 Monte Carlo | 10k+ simulações, bootstrap, percentis, VaR | Box-Muller, paradoxo aniversário |
| E8 Série temporal | SMA, EMA, decomposição, previsão linear | Projeção exata em série linear |
| E9 Cruzamento | Inner join, group-by, contingência 2×2, OR, lift | Tabulação cruzada |
| E10 Validador | Adequação de n, validade de p, outlier IQR 1.5× | Sanity check após cada análise |

---

## 🧠 Os 6 motores cognitivos

| Motor | Função | Exemplo |
|---|---|---|
| M1 Gerador de hipóteses | Gera 2-4 hipóteses antes de agir | "X vs Y" → 3 hipóteses |
| M2 Simulador mental | Roda hipóteses sobre clone de estado — real não muda | Juros compostos |
| M3 Busca de analogia | Reconhece 8 padrões estruturais | "tanque vazando" → decremento |
| M4 Engenheiro reverso | Linear (Cramer), quadrático (Gauss), estrutural | 3 pares → f(x) = 2x+1 |
| M5 Metacognição | Lê próprias estatísticas, identifica motor fraco | Auto-treino |
| M6 Observador estrutural | Bigramas/trigramas sobre histórico | Antecipa user |

O **N_árbitro** roteia entre motores e **se recusa a invadir** inputs claramente Turing.

---

## 📁 Estrutura do projeto

```
arch-neural-cortex-v15/
├── README.md                      # Português (este)
├── README.en.md                   # English
├── LICENSE                        # Licença proprietária
├── .gitignore
├── PUBLICAR.md                    # Como ativar GitHub Pages
│
├── arch_neural_v15_final.js       ★ ARQUIVO ÚNICO (4MB) — TUDO está aqui
├── index.html                     ★ UI desktop (com 5 paletas)
├── mobile.html                    ★ UI mobile (com menu, paletas, abas)
│
└── baterias/
    ├── bateria_reflexos_sociais.js  (340 testes)
    ├── bateria_estatistica.js       (157 testes)
    ├── bateria_integracao.js        (50 testes)
    └── bateria_nivel_deus.js        (20 testes — 2× mais difícil)
```

---

## 🎨 Paletas de cores (no mobile e desktop)

A interface tem 5 temas pré-configurados:

| Tema | Cores | Estilo |
|---|---|---|
| 🌌 Sci-Fi | Azul + Roxo | Default — futurista |
| 💚 Matrix | Preto + Verde neon | Visual hacker |
| 🌅 Solar | Laranja + Âmbar | Quente, contrastado |
| 🦋 Borboleta | Azul + Violeta | Suave, sci-fi clean |
| 💎 Cyber | Ciano + Magenta | Cyberpunk neon |

A escolha é salva em `localStorage` — persiste entre sessões.

---

## 🎓 Filosofia técnica

> *"Um cérebro que sabe o que não sabe, recusa-se a inventar, valida-se antes de responder."*

Esta base de código rejeita explicitamente três modos comuns de falha de IA:

1. **Alucinação em matemática** — todo resultado estatístico é calculado a partir de princípios fundamentais, nunca gerado por plausibilidade.
2. **Vazamento de domínio** — módulos respeitam o território uns dos outros via inibição lateral.
3. **Opacidade de caixa-preta** — cada nó, cada peso, cada regra é inspecionável.

**Versionamento append-only:** o código nunca apaga, sempre acumula. Cada versão preserva a anterior.

---

## 🛣️ Roadmap (V16+)

- [ ] **Aprendizado por leitura** — ingerir documentos, extrair conceitos, criar nós/arestas
- [ ] **Curiosidade ativa** — exploração em idle, formação autônoma de perguntas
- [ ] **Motor lógico simbólico** — silogismo, modus ponens/tollens
- [ ] **Persistência além de JSON** — porte para NEREAL (Python + SQLite)
- [ ] **Memória cross-conversação**
- [ ] **Capacidades multimodais** — visão, áudio, interação com tela

---

## 📜 Licença

**Proprietária — Todos os direitos reservados**

Este software é propriedade intelectual de Douglas Corrêa Cavasso. Uso permitido para estudo pessoal, aprendizado e citação acadêmica com atribuição. Uso comercial, redistribuição e treinamento de IAs são proibidos sem autorização expressa.

Ver [LICENSE](LICENSE) para termos completos.

Para autorização de uso comercial: **douglas.cavasso@gmail.com**

---

## 🙏 Sobre o autor

**Douglas Corrêa Cavasso** — desenvolvedor independente, Curitiba/PR, Brasil.

Este projeto é parte de uma pesquisa solo de longa duração em **arquiteturas cognitivas alternativas**, mesclando metáforas de neurociência com engenharia de software prática. Construído em sessões de pair-programming com assistentes de IA sob disciplina **append-only** rigorosa.

📧 douglas.cavasso@gmail.com
🐙 [github.com/douglascorreacavasso](https://github.com/douglascorreacavasso)

---

*"O cérebro é uma coisa só."* — Douglas Corrêa Cavasso, 2026
