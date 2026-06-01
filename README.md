# 🧠 LAB_ARCH-NEURAL V15.1

**Versão:** V15.1 (Maio/2026)
**Licença:** Proprietária — ver [LICENSE](LICENSE)

🇺🇸 [English version](README.en.md) · 📋 [Aplicações e casos de uso](APLICACOES.md) · 🚀 [Como publicar no GitHub](PUBLICAR.md)

---

> *Um cérebro modular cognitivo em JavaScript puro. Roda no navegador. Sem APIs externas. Sem chamadas LLM. Sem Python.*

---

## 🎯 Filosofia

O cérebro é **UMA coisa só**. Não tem "código fora do cérebro" e "JSON dentro do cérebro" — é uma estrutura única com regiões especializadas. Igual o cérebro humano.

O engine virou **modular**: a pasta `engine/` tem as 14 regiões em arquivos separados (carregados em ordem no HTML). O cérebro serializado saiu pra `engine/14_cerebro_embutido.js`. As 14 regiões são:

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
14. CEREBRO_DATA           ← cérebro serializado embutido
```

---

## ✨ Novidades V15.1 (esta versão)

### Visual modular
- **2 novos botões no topo:** ⚛ formato + ⛓ conexão
- **13 estilos visuais prontos**: Padrão, Original, Cristal, Glifo, Cosmos Atômico, Sabre Laizer, Bio-Celular, X, Estrelas Neurais, +, Gema Holográfica, Cyberpunk Neon, Triângulo Trino
- **22 tipos de conexão** que podem ser misturados livre com qualquer formato (dipolo, plasma_arc, fractal_swirl, magnetic_lines, DNA, raio elétrico, etc)
- **Paleta cérebro** agora muda as cores dos clusters dos estilos coloridos

### Treinamento progressivo expandido
- 5 níveis: **240 → 500 → 1000 → 2000 → 7000**
- O nível 7000 é o pacote 5000 + 2000 novas frases ensinando **identificação de usuário** (nomes genéricos, perguntas "qual seu nome?", papéis usuário/eu)

### UX melhorada
- **Overlay de loading global** em meditar, ensinar, importar, mesclar, salvar — com %
- **3 pontinhos animados** no chat quando o cérebro demora >2s pra responder
- **Bug girar corrigido**: arrastar com o dedo NÃO interrompe a rotação automática
- **2 tutoriais embutidos**: ❓ Como ensinar · ❗ Como usar o sistema

### Tutoriais
- ❓ Tutorial **Como ensinar**: 10 slides com exemplos práticos (apresentar-se, gírias, conceitos, relações, dia a dia, perguntas, criar reflexos, meditar)
- ❗ Tutorial **Como usar**: 12 slides cobrindo todas as ferramentas (menu, paletas, ⚛ ⛓, painéis laterais, gestos 3D, salvar/carregar, experimentos)
- Mobile: slides com setas ◀▶ + auto-avanço · Desktop: texto longo lendo

---

## 🚀 Como usar

### Modo simples (sem servidor — limitado)

1. **Abra o `index.html`** num navegador moderno (Chrome, Firefox, Safari, Edge)
2. Funciona, mas os arquivos `treinos/*.json` e `shared/*.js` NÃO carregam por restrição CORS de `file://`

### Modo recomendado (servidor local)

```bash
python3 -m http.server 8000
```

Depois:
- PC: abre `http://localhost:8000/index.html`
- Celular (mesma rede Wi-Fi): abre `http://SEU-IP-LOCAL:8000/` — auto-detecta e redireciona pro `mobile.html`

### Modo online (GitHub Pages)

Ver [PUBLICAR.md](PUBLICAR.md). Depois fica em `https://SEU-USER.github.io/SEU-REPO/`.

---

## 📁 Estrutura do projeto

```
arch-neural-v15/
├── engine/                     ⭐ engine modular (14 partes: 01_core … 14_cerebro_embutido)
├── cerebro_V15.json            cérebro pré-treinado (115 sub-redes, 2414 nós)
├── index.html                  desktop + detecção mobile automática
├── mobile.html                 mobile touch-friendly
│
├── shared/                     módulos compartilhados V15.1
│   ├── viz_renderer.js         renderizador 3D (formas + conexões + estilos)
│   ├── overlay_loading.js      overlay bloqueante com %
│   ├── chat_pensando.js        3 pontinhos se >2s
│   ├── audit_filter.js         filtra dados pessoais
│   ├── treino_loader.js        sistema progressivo de pacotes
│   └── tutorials.js            slides de tutorial
│
├── treinos/                    pacotes de treinamento
│   ├── treino_240.json         básico (alfabeto, cores, números)
│   ├── treino_500.json         médio (gírias WhatsApp)
│   ├── treino_1000.json        avançado (raciocínio)
│   ├── treino_2000.json        gírias + comunicação real
│   ├── treino_5000.json        TUDO (conversa real)
│   └── treino_2000_identificacao.json   identificação de usuário (NOVO)
│
├── README.md / README.en.md
├── APLICACOES.md               casos de uso
├── PUBLICAR.md                 publicar no GitHub Pages
├── DESCRICAO_GITHUB.md         textos prontos
├── LICENSE                     licença proprietária
└── .gitignore
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

## 📊 Validação completa

| Bateria | Score |
|---|---|
| Reflexos sociais | **340/340 = 100%** ✅ |
| Estatística | **157/157 = 100%** 🏆 |
| Integração entre módulos | **50/50 = 100%** 🏆 |
| Nível DEUS (2× mais difícil) | **20/20 = 100%** 🏆🏆 |
| **TOTAL** | **567/567 = 100%** |

---

## 📜 Licença

**Proprietária — todos os direitos reservados.**

Software de propriedade intelectual privada. Uso permitido para estudo pessoal, aprendizado e citação acadêmica com atribuição. **Uso comercial, redistribuição e treinamento de IAs são proibidos sem autorização expressa.**

Ver [LICENSE](LICENSE) para termos completos.

---

*"O cérebro é uma coisa só."*
