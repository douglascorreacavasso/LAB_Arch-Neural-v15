# 🧠 LAB_ARCH-NEURAL V15.1 FINAL

**Autor:** Douglas Corrêa Cavasso
**Versão:** V15.1 FINAL (Maio/2026)
**Licença:** Proprietária — todos os direitos reservados
**Contato:** douglas.cavasso@gmail.com
**GitHub:** [github.com/douglascorreacavasso](https://github.com/douglascorreacavasso)

🇺🇸 [English version](README.en.md) · 📋 [Aplicações e casos de uso](APLICACOES.md) · 🚀 [Como publicar no GitHub](PUBLICAR.md)

---

> *Um cérebro modular cognitivo em JavaScript puro. Roda no navegador. Sem APIs externas. Sem chamadas LLM. Sem Python. Em UM ÚNICO ARQUIVO de 4MB.*

---

## 🎯 Filosofia

O cérebro é **UMA coisa só**. Não tem "código fora do cérebro" e "JSON dentro do cérebro" — é uma estrutura única com regiões especializadas. Igual o cérebro humano.

`arch_neural_v15_final.js` (4.2 MB) contém **TUDO** empilhado em 14 regiões cronológicas:

```
01. v112_core              ← anatomia do grafo
02. v112_brain             ← motor de execução
03. v151_logica_prog
04. v152_afastamentos
05. v153_auto_mod_necessidade
06. v154_aprendiz_meta
07. v155_valvula_escape
08. v156_evolucao
09. v158_reflexos_sociais
10. v15_cortex_logico      ← córtex Turing completo
11. v159_cortex_cognitivo  ← córtex cognitivo (base)
12. v159b_motores          ← 6 motores cognitivos + árbitro
13. v160_estatistico       ← 10 motores estatísticos REAIS
14. CEREBRO_DATA           ← cérebro serializado embutido (115 sub-redes, 2414 nós)
```

---

## 🚀 Como usar — DETECÇÃO AUTOMÁTICA Desktop/Mobile

### ⭐ Use SEMPRE o `index.html` — ele detecta automaticamente o dispositivo

Basta abrir o **`index.html`** em qualquer navegador:

- 💻 **Desktop / tablet grande:** carrega a versão completa com cérebro 3D + 11 faixas anatômicas + painéis laterais
- 📱 **Celular / tela pequena (<768px) / user-agent mobile:** redireciona automaticamente para `mobile.html` — UI touch-friendly otimizada

### 🔀 Como funciona a detecção:

No topo do `index.html`, um pequeno script detecta o dispositivo **antes** de carregar o cérebro (4MB):

```javascript
// Se for mobile OU tela < 768px → redireciona pra mobile.html
var mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent);
var smallScreen = window.innerWidth < 768;
if(mobileUA || smallScreen) {
  location.replace('mobile.html');
}
```

Isso economiza memória/processamento em celulares antigos — não carrega o canvas pesado do desktop.

### 🛑 Forçar versão desktop no celular

Se quiser forçar a versão desktop num celular (debug, demonstração), adicione `?desktop=1` na URL:

```
https://seu-site.com/index.html?desktop=1
```

### 🌐 Acesso direto via GitHub Pages

Quando o projeto estiver publicado:

```
https://douglascorreacavasso.github.io/arch-neural-cortex-v15/
```

Abre automaticamente na versão correta pro dispositivo de quem acessa.

---

## 📱 Interface Mobile (`mobile.html`)

A versão mobile foi desenhada do zero pra ser **realmente touch-friendly**:

### Layout
- **Cérebro 3D no centro** (60% da tela superior), com botões F/L/↻ (frontal/lateral/girar)
- **Ícones laterais grandes** (38px) com badges live mostrando status
- **Legenda anatômica** flutuante à esquerda — clique pra recolher (vira ícone ℹ)
- **Chat embaixo** com barra de arrastar (resize vertical)

### Ícones laterais (direita)
| Ícone | Painel |
|---|---|
| 🕸️ | Estado da Rede (nós, arestas, sub-redes, SENS, TÁLAMO, HIPO, GABA, etc) |
| 🚨 | Amígdala (estado, tensão, gatilhos) |
| UT | Último Turno (input, resposta, candidatos, motores ativados) |
| 🧠 | Hipocampo (eventos, frases preservadas) |
| 🔧 | Ajustes de Emissão (critério dropdown + sliders k_ratio/k_media/k_absoluto + botão loop bg) |
| ⭐ | Self-Core (fatos aprendidos sobre si + sobre o usuário) |
| 🎯 | Candidatos de resposta |
| 🧪 | 20 Experimentos (A-T) — atalhos prontos pra testar |

### Botões do header
- **☰** — Drawer lateral com ações (ensinar 240, meditar, salvar, carregar, etc)
- **🎨** — Paleta geral da interface (10 cores: Sci-Fi, Matrix, Solar, Borboleta, Cyber, Fogo, Oceano, Floresta, Rosa Neon, Dourado)
- **🧠 colorido** — Paleta SÓ dos aglomerados do cérebro (10 variações: Padrão, Arco-íris, Frio, Quente, Neon, Terra, Pastel, Mono Azul/Verde/Roxo)

### Botões da área do cérebro
- **F** — Vista frontal
- **L** — Vista lateral (comprime horizontalmente)
- **↻** — Botão giro com 3 estados:
  - 1º clique → gira **horizontal** (eixo Y, indicador `↻H` teal)
  - 2º clique → gira **vertical** (eixo X, indicador `↻V` roxo)
  - 3º clique → **PARA** onde está (não volta ao zero)

### Animações vivas
- **Piscada de status:** quando algum valor da legenda muda (ex: amígdala sobe, núcleos cria módulo), os números **piscam em amarelo/laranja** — efeito tipo "level up de personagem"
- **Badges live:** os badges dos ícones laterais atualizam em tempo real conforme você interage

### Persistência
Tema escolhido salva em `localStorage` — persiste entre sessões.

---

## 🎓 Sistema de Treinamento Progressivo

A versão mobile tem um **botão de ensinar PROGRESSIVO** que evolui a cada clique:

| Aperto | Pacote | Quantidade | Acumulado | Conteúdo |
|---|---|---|---|---|
| **1º** | `treino_240.json` | 240 frases | 240 | Básico: alfabeto, números, cores, animais, comidas |
| **2º** | `treino_500.json` | 500+ frases | ~750 | Médio: profissões, comparações + **gírias WhatsApp** (tb, vc, blz, vlw) |
| **3º** | `treino_1000.json` | 800+ frases | ~1550 | Avançado: ciência, raciocínio, narrativas |
| **4º** | `treino_2000.json` | ~1000 frases | ~2550 | Comunicação real: gírias, kkk, "te amo" |
| **5º** | `treino_5000.json` | 5000 frases | ~7550 | **TUDO**: conversas pares, typos, abreviações, como lidar com palavras erradas |
| **6º** | — | — | — | 🎉 **"AGORA ENSINE VOCÊ! PREGUIÇOSO!!!"** (botão some, mensagem brincalhona aparece) |

A cada aperto, o botão **muda o label** mostrando o próximo pacote disponível. Treinamento é assíncrono em batches pra não travar a UI, com progresso em toast.

---

## 💻 Interface Desktop (`index.html`)

Quando aberto num desktop, mostra a UI completa do laboratório:

- **Cérebro 3D** com 11 faixas anatômicas (canvas grande)
- **Painel "Estado da Rede"** lateral (NÓS, ARESTAS, TURNO, SENS, TÁLAMO, HIPO, GABA, CÓRTEX, AMIG, NÚCLEOS, MOTORA, BROCA)
- **Painel "Pesos Semânticos Calculados"**
- **Painel "Palavras na Rede (top 12)"**
- **Painel "Último Turno"** com Self-Core, 3 Candidatos de Resposta, Ajustes de Emissão
- **Painel "Amígdala"** com tensão em tempo real
- **Painel "Eventos no Hipocampo"** (frases preservadas)
- **Sidebar de Experimentos** com 11 testes pré-prontos
- **Botões originais:** ensinar 240, meditar, salvar, carregar, juntar, árvore, Y, log JSON, log TXT, reset
- **Barra V15.1 nova:** 5 paletas (Sci-Fi, Matrix, Solar, Borboleta, Cyber) + 🌐 carregar do GitHub + 📂 carregar manual

---

## 📊 Validação completa

Todas as baterias rodam contra `arch_neural_v15_final.js`:

| Bateria | Score |
|---|---|
| Reflexos sociais | **340/340 = 100%** ✅ |
| Estatística | **157/157 = 100%** 🏆 |
| Integração entre módulos | **50/50 = 100%** 🏆 |
| Nível DEUS (2× mais difícil) | **20/20 = 100%** 🏆🏆 |
| **TOTAL** | **567/567 = 100%** |

```bash
cd baterias
node bateria_reflexos_sociais.js
node bateria_estatistica.js
node bateria_integracao.js
node bateria_nivel_deus.js
```

---

## 🚀 Como instalar e rodar

### Modo simples (sem servidor)

1. **Clone ou baixe** este repositório
2. **Abra o `index.html`** num navegador moderno (Chrome, Firefox, Safari, Edge)
3. Pronto — funciona offline 100%

### Modo com servidor local (recomendado pra mobile via Wi-Fi)

```bash
git clone https://github.com/douglascorreacavasso/arch-neural-cortex-v15.git
cd arch-neural-cortex-v15
python3 -m http.server 8000
```

Depois, no PC abre `http://localhost:8000/index.html`. No celular conectado à mesma rede, abre `http://SEU-IP-LOCAL:8000/index.html` — o sistema redireciona pra `mobile.html` automaticamente.

### Modo online (GitHub Pages)

Veja [PUBLICAR.md](PUBLICAR.md) pro passo-a-passo de subir no GitHub e ativar Pages. Depois fica acessível em:

```
https://douglascorreacavasso.github.io/arch-neural-cortex-v15/
```

---

## 🎯 O que sabe fazer

### Motor Turing (variáveis, loops, condicionais, funções)
```
> estado: x=0, soma=0, i=1
> regra: enquanto i menor_que 11 faça [soma = soma + i, i = i + 1]
> execute e mostre valor de soma
  → soma = 55
```

### Córtex cognitivo
```
> qual rende mais: 1000 com taxa 5% por 10 anos vs 2000 com taxa 3% por 8 anos?
  → Melhor opção: Investimento 2 (rende 2533.54). Diferença de 904.65.
```

### Engenharia reversa
```
> entrada 2 → saida 5
> entrada 5 → saida 11
> entrada 10 → saida 21
  → Regra inferida: f(x) = 2*x + 1 (tipo linear, acerto 100%)
```

### Estatística determinística
```
> bayes prior=0.01 sensibilidade=0.99 especificidade=0.95
  → P(D|+) = 0.1667 (16.67%) — paradoxo doença rara resolvido exato
```

---

## 📁 Estrutura do projeto

```
arch-neural-cortex-v15/
├── README.md                    # Este arquivo (português)
├── README.en.md                 # English version
├── LICENSE                      # Licença proprietária
├── APLICACOES.md                # Casos de uso, para que serve, mercados
├── PUBLICAR.md                  # Como subir no GitHub + GitHub Pages
├── DESCRICAO_GITHUB.md          # Textos prontos pra About do GitHub
├── .gitignore
│
├── arch_neural_v15_final.js     ⭐ 4.2 MB — TUDO num único arquivo
├── cerebro_V15.json             # Cérebro pré-treinado (carga via "do GitHub")
├── index.html                   # Desktop + detecção mobile automática
├── mobile.html                  # Mobile touch-friendly otimizada
│
└── baterias/
    ├── bateria_reflexos_sociais.js  (340 testes)
    ├── bateria_estatistica.js       (157 testes)
    ├── bateria_integracao.js        (50 testes)
    └── bateria_nivel_deus.js        (20 testes — 2× mais difícil)
```

---

## 📜 Licença

**Proprietária — todos os direitos reservados.**

Este software é propriedade intelectual de Douglas Corrêa Cavasso. Uso permitido para estudo pessoal, aprendizado e citação acadêmica com atribuição. **Uso comercial, redistribuição e treinamento de IAs são proibidos sem autorização expressa.**

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
