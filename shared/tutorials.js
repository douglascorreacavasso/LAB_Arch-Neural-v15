/* ════════════════════════════════════════════════════════════════
   tutorials.js — 2 tutoriais com 2 modos de exibição

   Tutoriais:
     ❓ ENSINAR    → como ensinar gírias, nomes, conceitos triviais
     ❗ USAR       → como salvar, importar, mesclar, paletas, etc

   Exibição:
     - mobile: slides com setas ◀▶ + auto-avanço (~8s/slide)
     - desktop: texto longo scrollável

   API:
     window.TUTORIAL.abrir('ensinar' | 'usar', 'mobile' | 'desktop')
     window.TUTORIAL.fechar()
   ════════════════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if(window.TUTORIAL) return;

  // ─── CONTEÚDO: tutorial ENSINAR ──────────────────────────────
  const SLIDES_ENSINAR = [
    {
      titulo: '🎓 Como ensinar o cérebro',
      texto:
        'Esse cérebro NÃO é como um LLM. Ele aprende SÓ com o que você fala.\n\n' +
        '➡️ Há DUAS formas de ensinar:\n\n' +
        '📚 BOTÃO "ENSINAR" (menu ☰) — o jeito RÁPIDO: pacotes prontos 240 → 500 → 1000 → ' +
        '2000 → 7000 frases. Clica e ele aprende milhares de frases de uma vez. ' +
        'Comece SEMPRE por aqui pra dar base.\n\n' +
        '💬 CONVERSA — tudo que você digita ele aprende. Use pra personalizar depois. ' +
        'Qualidade vale mais que quantidade.'
    },
    {
      titulo: '1️⃣ Apresente-se',
      texto:
        'Comece dizendo quem você é. Exemplos:\n\n' +
        '• "meu nome é João"\n' +
        '• "sou pedro, prazer"\n' +
        '• "pode me chamar de Ana"\n\n' +
        'Repita 2-3 vezes, com variações. Isso fortalece a memória.'
    },
    {
      titulo: '2️⃣ Linguagem natural',
      texto:
        'Fale como você fala com um amigo. Pode usar gírias:\n\n' +
        '• "tô cansado, slk"\n' +
        '• "blz"\n' +
        '• "vc é massa"\n' +
        '• "kkk"\n\n' +
        'O cérebro adora linguagem real. Não precisa ser formal.'
    },
    {
      titulo: '3️⃣ Ensine conceitos',
      texto:
        'Defina coisas em termos simples:\n\n' +
        '• "amigo é alguém que ajuda"\n' +
        '• "tristeza é quando algo ruim acontece"\n' +
        '• "casa é onde a gente mora"\n' +
        '• "comida é o que a gente come"\n\n' +
        'Use frases curtas e diretas.'
    },
    {
      titulo: '4️⃣ Ensine relações',
      texto:
        'Conexões entre pessoas, lugares, coisas:\n\n' +
        '• "João é amigo do Pedro"\n' +
        '• "morro em Curitiba"\n' +
        '• "trabalho com música"\n' +
        '• "gosto de café pela manhã"\n\n' +
        'O cérebro liga os conceitos automaticamente.'
    },
    {
      titulo: '5️⃣ Conte o dia',
      texto:
        'Diga ao cérebro como foi seu dia. Isso ensina:\n' +
        '• vocabulário do cotidiano\n' +
        '• sentimentos\n' +
        '• rotinas humanas\n\n' +
        '• "hoje foi um dia corrido"\n' +
        '• "tô feliz porque saí com amigos"\n' +
        '• "comi pizza no jantar"'
    },
    {
      titulo: '6️⃣ Faça perguntas',
      texto:
        'Pergunte coisas que você já ensinou:\n\n' +
        '• "qual meu nome?"\n' +
        '• "quem é o João?"\n' +
        '• "o que é amigo?"\n\n' +
        'Se a resposta vier errada, corrija ensinando de novo. ' +
        'O cérebro vai aprender que aquela é a versão certa.'
    },
    {
      titulo: '7️⃣ Crie novas habilidades',
      texto:
        'Quer ensinar uma capacidade nova? Repita o padrão:\n\n' +
        '• "se eu disser oi, responda oi também"\n' +
        '• "quando eu falar tchau, fale tchau"\n' +
        '• "se perguntar como vai, responda bem"\n\n' +
        'Repita várias vezes. Ele forma o reflexo.'
    },
    {
      titulo: '8️⃣ Medite!',
      texto:
        'Depois de ensinar muita coisa, clica em "Meditar" no menu ☰.\n\n' +
        'Isso é o "sono" do cérebro:\n' +
        '• fortalece o que você ensinou repetido\n' +
        '• esquece ruído\n' +
        '• organiza conexões\n\n' +
        'Sem meditar, o cérebro fica confuso depois de muito treino.'
    },
    {
      titulo: '🎨 Cores e sentimentos',
      texto:
        'Ensine como cores se conectam com emoções:\n\n' +
        '• "azul significa paz"\n' +
        '• "vermelho significa paixão"\n' +
        '• "amarelo significa energia"\n' +
        '• "verde significa esperança"\n' +
        '• "preto significa mistério"\n\n' +
        'E ensine misturas:\n' +
        '• "misturar azul com amarelo cria verde"\n' +
        '• "misturar vermelho com azul cria roxo"\n\n' +
        'O cérebro aprende abstração visual assim.'
    },
    {
      titulo: '💪 Sinais do corpo',
      texto:
        'Pra ele entender linguagem corporal nas histórias:\n\n' +
        '• "sorriso significa felicidade"\n' +
        '• "braços cruzados significa defesa"\n' +
        '• "olhar para baixo significa timidez"\n' +
        '• "gaguejar significa nervosismo"\n' +
        '• "lágrima significa tristeza"\n' +
        '• "abraço significa carinho"\n\n' +
        'Depois você pode contar histórias com esses sinais.'
    },
    {
      titulo: '👤 Seus gostos pessoais',
      texto:
        'Crie o teu perfil — ele vai lembrar tudo:\n\n' +
        '• "eu prefiro café sem açúcar"\n' +
        '• "eu acho música clássica relaxante"\n' +
        '• "eu detesto filas demoradas"\n' +
        '• "eu gosto de frio"\n' +
        '• "minha cor favorita é turquesa"\n\n' +
        'Depois pergunta: "liste o que sabe sobre mim" — ' +
        'ele vai responder com tudo que aprendeu.'
    },
    {
      titulo: '🍋 Sabores e combinações',
      texto:
        'Pra ele entender conceitos abstratos:\n\n' +
        '• "limão é azedo"\n' +
        '• "mel é doce"\n' +
        '• "pimenta é picante"\n' +
        '• "queijo com goiabada significa combinação perfeita"\n' +
        '• "café com canela causa foco"\n\n' +
        'Misture conceitos! É assim que o cérebro vira criativo.'
    },
    {
      titulo: '✨ Padrão "X significa Y"',
      texto:
        'Esse é O padrão mais poderoso pra ensinar QUALQUER coisa:\n\n' +
        '🔑 [nome] significa [explicação]\n\n' +
        'Funciona pra TUDO:\n' +
        '• "saudade significa sentir falta de alguém"\n' +
        '• "domingo significa dia de descansar"\n' +
        '• "código significa instruções pra computador"\n' +
        '• "amizade significa confiança e tempo juntos"\n\n' +
        'Use esse padrão pra ensinar conceitos novos rapidamente.'
    },
    {
      titulo: '🎭 Emojis estruturados',
      texto:
        'Você pode ensinar ele a criar medidores visuais:\n\n' +
        '• "energia_baixa significa 🟥"\n' +
        '• "energia_média significa 🟥🟨"\n' +
        '• "energia_alta significa 🟥🟨🟩"\n\n' +
        'Depois conecte com situações:\n' +
        '• "segunda-feira causa cansaço alto"\n' +
        '• "sexta-feira causa energia alta"\n\n' +
        'Pergunte: "qual a bateria de segunda?" — ' +
        'ele cruza os dados e responde com emojis!'
    },
    {
      titulo: '🌳 Hierarquia (família, pastas)',
      texto:
        'Pra ele entender estruturas em árvore:\n\n' +
        '• "filho significa colocar > antes do nome"\n' +
        '• "neto significa colocar >> antes do nome"\n\n' +
        'Depois alimente os dados:\n' +
        '• "João é pai de Pedro"\n' +
        '• "Pedro é pai de Lucas"\n\n' +
        'Comando: "liste a árvore de João"\n' +
        'Resposta esperada:\n' +
        '  João\n' +
        '  > Pedro\n' +
        '  >> Lucas'
    },
    {
      titulo: '💡 A sacada de mestre',
      texto:
        'Pra ensinar qualquer coisa estranha:\n\n' +
        '1️⃣ Dê um NOME pra coisa\n' +
        '   (ex: "código_1", "caixa", "espelhar")\n\n' +
        '2️⃣ Diga o que esse nome FAZ\n' +
        '   usando palavras de comando mecânico:\n' +
        '   "trocar", "colocar em cima",\n' +
        '   "ler do fim pro começo",\n' +
        '   "colocar 4 espaços".\n\n' +
        'Funciona pra ASCII art, padrões visuais,\n' +
        'qualquer transformação que você imaginar!'
    },
    {
      titulo: '📝 Mensagens longas',
      texto:
        'Pode mandar textos GRANDES! Use:\n\n' +
        '• Shift+Enter pra quebrar linha\n' +
        '• Enter sozinho pra enviar\n\n' +
        'O cérebro processa frase por frase. Texto longo = ' +
        'várias frases conectadas, vira contexto rico.\n\n' +
        'Quanto mais você fala em uma mensagem, ' +
        'mais conexões ele cria entre os conceitos.'
    },
    {
      titulo: '🎯 Primeira vez? Comece pelo treino!',
      texto:
        'Se é teu primeiro contato:\n\n' +
        '1️⃣ Abre o menu ☰\n' +
        '2️⃣ Clica "ensinar 240" → espera carregar\n' +
        '3️⃣ Clica "ensinar 500" → espera\n' +
        '4️⃣ Continua: 1000, 2000, 7000\n\n' +
        'Isso dá pro cérebro a BASE de linguagem natural ' +
        '(gírias, conversa, identificação de usuário).\n\n' +
        'Sem isso, ele começa quase mudo. Com isso, ' +
        'ele já consegue conversar contigo de cara!'
    },
    {
      titulo: '✅ Pronto pra ensinar!',
      texto:
        'Resumindo:\n\n' +
        '✓ Apresente-se com nome\n' +
        '✓ Fale como humano (gírias OK)\n' +
        '✓ Defina conceitos com "X significa Y"\n' +
        '✓ Ensine relações entre coisas\n' +
        '✓ Conte seu dia\n' +
        '✓ Faça perguntas pra testar\n' +
        '✓ Crie reflexos com repetição\n' +
        '✓ Medite a cada 50-100 frases\n' +
        '✓ SALVA o cérebro antes de fechar! 💾\n\n' +
        'Boa conversa! 🧠'
    },
  ];

  // ─── CONTEÚDO: tutorial USAR SISTEMA ─────────────────────────
  const SLIDES_USAR = [
    {
      titulo: '🛠️ Como usar o sistema',
      texto:
        'O cérebro tem várias ferramentas. Vou te mostrar onde fica cada uma ' +
        'e o que faz.\n\nUse as setas ◀▶ pra navegar ou espere o auto-avanço.'
    },
    {
      titulo: '☰ Menu principal',
      texto:
        'Toque no botão ☰ no canto superior esquerdo.\n\n' +
        'Lá ficam as ações principais:\n' +
        '• 📌 Ensinar (pacotes pré-prontos)\n' +
        '• 🧘 Meditar (consolida memórias)\n' +
        '• 💾 Salvar cérebro (download .json)\n' +
        '• 📂 Carregar do GitHub\n' +
        '• 📥 Importar JSON manual\n' +
        '• 🔄 Reset'
    },
    {
      titulo: '🎨 Paletas de cores',
      texto:
        'Existem 3 botões de paleta no topo:\n\n' +
        '🎨 Paleta geral — cores da interface\n' +
        '🧠 Paleta cérebro — cores dos clusters\n' +
        '⚛ Estilo visual — formato e movimento do cérebro\n' +
        '⛓ Conexões — como as linhas entre nós aparecem\n\n' +
        'Misture à vontade!'
    },
    {
      titulo: '⚛ Estilos visuais',
      texto:
        'No botão ⚛ você troca entre 13 estilos:\n\n' +
        '• Padrão (leve)\n' +
        '• Original (criança, cores vivas)\n' +
        '• Cristal, Glifo, Cosmos Atômico\n' +
        '• Sabre Laizer, Bio-Celular, X\n' +
        '• Estrelas Neurais, +, Gema Holográfica\n' +
        '• Cyberpunk Neon, Triângulo Trino\n\n' +
        'Cada um muda o formato dos núcleos.'
    },
    {
      titulo: '⛓ Estilos de conexão',
      texto:
        'No botão ⛓ você muda como as linhas entre os nós aparecem:\n\n' +
        '• Linha simples, gradiente, raio elétrico\n' +
        '• Onda, curva, DNA, fio trançado\n' +
        '• Laser, pulso disparado, partículas\n' +
        '• Aurora, fractal swirl, plasma elétrico\n\n' +
        'Combine forma + conexão pra criar visuais únicos.'
    },
    {
      titulo: '🕸️ Painéis laterais',
      texto:
        'Os ícones do lado direito abrem painéis:\n\n' +
        '🕸️ Estado da Rede — nós, arestas, contadores\n' +
        '🚨 Amígdala — tensão emocional\n' +
        'UT — Último Turno (input, resposta)\n' +
        '🧠 Hipocampo — frases preservadas\n' +
        '🔧 Ajustes — sliders de emissão\n' +
        '⭐ Self-Core — fatos sobre si e usuário\n' +
        '🎯 Candidatos de resposta\n' +
        '🧪 Experimentos rápidos (A-T)'
    },
    {
      titulo: '🧘 Meditar',
      texto:
        'A meditação é como o sono do cérebro:\n\n' +
        '• Fortalece conexões muito usadas\n' +
        '• Esquece conexões pouco usadas\n' +
        '• Consolida memórias do hipocampo\n\n' +
        'Use depois de ensinar muita coisa ou se notar ' +
        'que ele tá respondendo confuso.'
    },
    {
      titulo: '💾 Salvar e carregar',
      texto:
        'Pra preservar o que ensinou:\n\n' +
        '💾 Salvar — baixa um arquivo .json com tudo\n' +
        '📂 Carregar do GitHub — cérebro pré-treinado\n' +
        '📥 Importar manual — sobe um .json local\n\n' +
        'Importante: SEMPRE salve antes de testar coisas novas. ' +
        'Você pode voltar pro estado anterior.'
    },
    {
      titulo: '🧪 Experimentos',
      texto:
        'Na aba 🧪 tem 20 experimentos prontos (A-T):\n\n' +
        'São inputs que testam capacidades específicas — ' +
        'matemática, lógica, conceitos, conversa.\n\n' +
        'Clica em uma letra e vê como o cérebro responde. ' +
        'Bom pra entender o que ele sabe e o que falta ensinar.'
    },
    {
      titulo: '📌 Pacotes de treino',
      texto:
        'No menu ☰, o botão "Ensinar" tem 5 níveis:\n\n' +
        '1️⃣ 240 frases — básico (alfabeto, números, cores)\n' +
        '2️⃣ 500 frases — médio (gírias WhatsApp)\n' +
        '3️⃣ 1000 frases — avançado (raciocínio)\n' +
        '4️⃣ 2000 frases — gírias + comunicação real\n' +
        '5️⃣ 7000 frases — TUDO + identificação de usuário\n\n' +
        'Cada clique avança 1 nível. Demora um pouco.'
    },
    {
      titulo: '✋ Gestos no cérebro 3D',
      texto:
        'Na área do cérebro:\n\n' +
        '• 1 dedo arrastar = mover\n' +
        '• 2 dedos pinçar = zoom\n' +
        '• Botão F = vista frontal\n' +
        '• Botão L = vista lateral\n' +
        '• Botão ↻ = girar (3 estados: H, V, parado)\n\n' +
        'Girando continua girando mesmo se você arrastar — ' +
        'só para quando você clica de novo no ↻.'
    },
    {
      titulo: '📥 Antes de começar: IMPORTE',
      texto:
        '⚠️ MUITO IMPORTANTE!\n\n' +
        'Se você já ensinou coisas antes:\n\n' +
        '1️⃣ Abre o menu ☰\n' +
        '2️⃣ Clica em "📥 importar JSON"\n' +
        '3️⃣ Escolhe o último .json que você salvou\n\n' +
        'Assim ele VOLTA com tudo que aprendeu.\n\n' +
        '⚠️ Sem importar, ele começa zerado e ' +
        'você perde todo o aprendizado anterior!'
    },
    {
      titulo: '💾 Antes de FECHAR: SALVE',
      texto:
        '⚠️ NUNCA esqueça!\n\n' +
        'Antes de fechar o navegador:\n\n' +
        '1️⃣ Abre o menu ☰\n' +
        '2️⃣ Clica em "💾 salvar cérebro"\n' +
        '3️⃣ Salva o .json em algum lugar seguro\n\n' +
        'A conversa em si se perde (não dá pra recuperar ' +
        'as falas exatas), mas TUDO que ele aprendeu ' +
        'fica preservado pro próximo uso.\n\n' +
        'Pense nele como uma memória externa. Sempre salve!'
    },
    {
      titulo: '🎯 Primeira vez? Treine ele!',
      texto:
        'Se é teu primeiro contato com esse cérebro:\n\n' +
        'Recomendação: rode os 5 pacotes em ordem ' +
        '(240 → 500 → 1000 → 2000 → 7000).\n\n' +
        '• Cada pacote ensina mais frases\n' +
        '• O último (7000) inclui identificação de usuário\n' +
        '• Depois SALVA esse cérebro como "base.json"\n\n' +
        'Da próxima vez, importa esse base e já começa ' +
        'com vocabulário rico de linguagem natural.'
    },
    {
      titulo: '✅ Pronto!',
      texto:
        'Agora você sabe usar:\n\n' +
        '✓ Menu ☰ (ensinar, meditar, salvar)\n' +
        '✓ 4 paletas/estilos no topo\n' +
        '✓ 8 painéis laterais\n' +
        '✓ 20 experimentos rápidos\n' +
        '✓ Gestos 3D no cérebro (H/V/D/parar)\n' +
        '✓ Shift+Enter pra mensagem longa\n\n' +
        'Sempre lembre:\n' +
        '📥 Importe ANTES de começar\n' +
        '💾 Salve ANTES de fechar\n\n' +
        'Bom uso! 🚀'
    },
  ];

  // ─── CSS ─────────────────────────────────────────────────────
  const CSS = `
  .anv-tut-ov {
    position: fixed;
    inset: 0;
    background: rgba(6, 8, 15, 0.85);
    z-index: 999996;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: anv-fade-in 0.25s ease-out;
  }
  .anv-tut-ov.show { display: flex; }
  .anv-tut-card {
    background: rgba(13, 20, 36, 0.96);
    border: 1px solid rgba(94, 234, 212, 0.4);
    border-radius: 14px;
    padding: 24px 26px;
    max-width: 540px;
    width: 100%;
    max-height: 88vh;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6),
                0 0 30px rgba(94, 234, 212, 0.18);
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .anv-tut-titulo {
    color: #5eead4;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 14px;
    letter-spacing: 0.3px;
  }
  .anv-tut-texto {
    color: #d1dbf0;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    flex: 1;
    overflow-y: auto;
  }
  .anv-tut-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid rgba(94, 234, 212, 0.2);
  }
  .anv-tut-arrow {
    background: rgba(94, 234, 212, 0.12);
    border: 1px solid rgba(94, 234, 212, 0.35);
    color: #5eead4;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .anv-tut-arrow:active { transform: scale(0.92); }
  .anv-tut-arrow:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .anv-tut-counter {
    color: #5a6a8a;
    font-size: 12px;
    font-family: monospace;
  }
  .anv-tut-progress {
    height: 3px;
    background: rgba(94, 234, 212, 0.12);
    border-radius: 2px;
    margin-top: 12px;
    overflow: hidden;
  }
  .anv-tut-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #a78bfa, #5eead4);
    transition: width 0.3s ease-out;
    box-shadow: 0 0 6px rgba(94, 234, 212, 0.5);
  }
  .anv-tut-close {
    position: absolute;
    top: 12px;
    right: 14px;
    background: transparent;
    border: none;
    color: #5a6a8a;
    font-size: 22px;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .anv-tut-close:hover { background: rgba(94, 234, 212, 0.1); color: #5eead4; }

  /* DESKTOP — texto longo scrollável */
  .anv-tut-desk-section {
    margin-bottom: 22px;
    padding-bottom: 18px;
    border-bottom: 1px solid rgba(94, 234, 212, 0.15);
  }
  .anv-tut-desk-section:last-child { border-bottom: none; }
  .anv-tut-desk-titulo {
    color: #5eead4;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .anv-tut-desk-texto {
    color: #d1dbf0;
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
  }
  `;

  const style = document.createElement('style');
  style.id = 'anv-tut-style';
  style.textContent = CSS;
  document.head.appendChild(style);

  // ─── ESTADO ──────────────────────────────────────────────────
  let modal = null;
  let slidesAtuais = null;
  let idxAtual = 0;
  let autoAdvanceTimer = null;
  const AUTO_MS = 8000; // 8s por slide

  function clearTimer(){
    if(autoAdvanceTimer){
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  function renderMobile(){
    const slide = slidesAtuais[idxAtual];
    modal.innerHTML = `
      <div class="anv-tut-card">
        <button class="anv-tut-close" onclick="window.TUTORIAL.fechar()">×</button>
        <div class="anv-tut-titulo">${escapeHtml(slide.titulo)}</div>
        <div class="anv-tut-texto">${escapeHtml(slide.texto)}</div>
        <div class="anv-tut-progress">
          <div class="anv-tut-progress-bar" style="width:${((idxAtual+1)/slidesAtuais.length)*100}%"></div>
        </div>
        <div class="anv-tut-nav">
          <button class="anv-tut-arrow" id="anv-tut-prev" ${idxAtual === 0 ? 'disabled' : ''}>◀</button>
          <span class="anv-tut-counter">${idxAtual+1} / ${slidesAtuais.length}</span>
          <button class="anv-tut-arrow" id="anv-tut-next">${idxAtual === slidesAtuais.length-1 ? '✓' : '▶'}</button>
        </div>
      </div>`;
    document.getElementById('anv-tut-prev').onclick = () => { clearTimer(); navegar(-1); };
    document.getElementById('anv-tut-next').onclick = () => {
      clearTimer();
      if(idxAtual === slidesAtuais.length-1) fechar();
      else navegar(1);
    };
    agendarAutoAdvance();
  }

  function agendarAutoAdvance(){
    clearTimer();
    autoAdvanceTimer = setTimeout(() => {
      if(idxAtual < slidesAtuais.length-1){
        navegar(1);
      } else {
        // Último slide: aguarda mais alguns segundos e fecha
        autoAdvanceTimer = setTimeout(fechar, AUTO_MS);
      }
    }, AUTO_MS);
  }

  function navegar(dir){
    idxAtual += dir;
    if(idxAtual < 0) idxAtual = 0;
    if(idxAtual >= slidesAtuais.length) idxAtual = slidesAtuais.length - 1;
    renderMobile();
  }

  function renderDesktop(){
    const sections = slidesAtuais.map(s => `
      <div class="anv-tut-desk-section">
        <div class="anv-tut-desk-titulo">${escapeHtml(s.titulo)}</div>
        <div class="anv-tut-desk-texto">${escapeHtml(s.texto)}</div>
      </div>`).join('');
    modal.innerHTML = `
      <div class="anv-tut-card" style="max-width:680px;max-height:90vh;">
        <button class="anv-tut-close" onclick="window.TUTORIAL.fechar()">×</button>
        <div class="anv-tut-titulo">${slidesAtuais === SLIDES_ENSINAR ? '🎓 Tutorial: Como Ensinar' : '🛠️ Tutorial: Como Usar o Sistema'}</div>
        <div class="anv-tut-texto" style="padding-right:8px;">
          ${sections}
        </div>
        <div class="anv-tut-nav">
          <span class="anv-tut-counter">${slidesAtuais.length} seções</span>
          <button class="anv-tut-arrow" style="width:auto;padding:0 16px;border-radius:6px;font-size:13px;" onclick="window.TUTORIAL.fechar()">Fechar</button>
        </div>
      </div>`;
  }

  function escapeHtml(s){
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  /**
   * Abre o tutorial.
   * @param {'ensinar'|'usar'} qual
   * @param {'mobile'|'desktop'} formato — auto-detectado se omitido
   */
  function abrir(qual, formato){
    slidesAtuais = (qual === 'usar') ? SLIDES_USAR : SLIDES_ENSINAR;
    idxAtual = 0;
    if(!formato){
      formato = (window.innerWidth < 900) ? 'mobile' : 'desktop';
    }
    if(!modal){
      modal = document.createElement('div');
      modal.className = 'anv-tut-ov';
      modal.id = 'anv-tut-ov';
      // ESC fecha
      document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && modal.classList.contains('show')) fechar();
      });
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
    if(formato === 'mobile') renderMobile();
    else renderDesktop();
  }

  function fechar(){
    clearTimer();
    if(modal) modal.classList.remove('show');
  }

  window.TUTORIAL = { abrir, fechar };
})();
