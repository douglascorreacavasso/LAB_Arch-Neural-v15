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
        'Tudo que você digitar no chat ele vai aprender. Por isso, ensinar com ' +
        'qualidade vale mais que ensinar muito.'
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
      titulo: '✅ Pronto pra ensinar!',
      texto:
        'Resumindo:\n\n' +
        '✓ Apresente-se com nome\n' +
        '✓ Fale como humano (gírias OK)\n' +
        '✓ Defina conceitos simples\n' +
        '✓ Ensine relações\n' +
        '✓ Conte seu dia\n' +
        '✓ Faça perguntas pra testar\n' +
        '✓ Crie reflexos com repetição\n' +
        '✓ Medite a cada 50-100 frases\n\n' +
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
      titulo: '✅ Pronto!',
      texto:
        'Agora você sabe usar:\n\n' +
        '✓ Menu ☰ (ensinar, meditar, salvar)\n' +
        '✓ 4 paletas/estilos no topo\n' +
        '✓ 8 painéis laterais\n' +
        '✓ 20 experimentos rápidos\n' +
        '✓ Gestos 3D no cérebro\n\n' +
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
