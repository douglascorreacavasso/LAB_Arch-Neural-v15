/* ════════════════════════════════════════════════════════════════
   overlay_loading.js — overlay bloqueante translúcido com % opcional

   Uso:
     await window.LOADING.run('Meditando...', async (setProgress) => {
       for(let i = 0; i < N; i++) {
         setProgress(i, N);          // opcional
         await pesado(i);
       }
     });

   Garantias:
     - Bloqueia TODOS os cliques/touches enquanto rodando
     - Fundo translúcido (fundo da app fica visível mas escurecido)
     - Some sozinho ao terminar (mesmo se der erro)
     - Stack: chamadas aninhadas suportadas (mantém a última msg)
   ════════════════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if(window.LOADING) return;

  const CSS = `
  .anv-loading-ov {
    position: fixed;
    inset: 0;
    background: rgba(6, 8, 15, 0.72);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    z-index: 999998;
    display: none;
    align-items: center;
    justify-content: center;
    pointer-events: all;
    animation: anv-fade-in 0.18s ease-out;
  }
  .anv-loading-ov.show { display: flex; }
  .anv-loading-card {
    background: rgba(13, 20, 36, 0.92);
    border: 1px solid rgba(94, 234, 212, 0.4);
    border-radius: 14px;
    padding: 32px 36px;
    min-width: 260px;
    max-width: 88vw;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6),
                0 0 32px rgba(94, 234, 212, 0.18);
    text-align: center;
  }
  .anv-loading-spin {
    width: 64px;
    height: 64px;
    margin: 0 auto 18px;
    border-radius: 50%;
    border: 3px solid rgba(94, 234, 212, 0.18);
    border-top-color: #5eead4;
    border-right-color: #a78bfa;
    animation: anv-spin 0.9s linear infinite;
  }
  .anv-loading-label {
    color: #d1dbf0;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 6px;
    letter-spacing: 0.3px;
  }
  .anv-loading-sub {
    color: #5a6a8a;
    font-size: 11px;
    line-height: 1.4;
  }
  .anv-loading-bar-wrap {
    margin-top: 16px;
    height: 6px;
    background: rgba(94, 234, 212, 0.12);
    border-radius: 3px;
    overflow: hidden;
    display: none;
  }
  .anv-loading-bar-wrap.show { display: block; }
  .anv-loading-bar {
    height: 100%;
    background: linear-gradient(90deg, #a78bfa, #5eead4);
    width: 0%;
    border-radius: 3px;
    transition: width 0.15s ease-out;
    box-shadow: 0 0 8px rgba(94, 234, 212, 0.6);
  }
  .anv-loading-pct {
    margin-top: 8px;
    color: #5eead4;
    font-size: 12px;
    font-family: monospace;
    font-weight: 700;
    display: none;
  }
  .anv-loading-pct.show { display: block; }
  @keyframes anv-spin { to { transform: rotate(360deg); } }
  @keyframes anv-fade-in { from { opacity: 0; } to { opacity: 1; } }
  `;

  // Injeta CSS
  const style = document.createElement('style');
  style.id = 'anv-loading-style';
  style.textContent = CSS;
  document.head.appendChild(style);

  // Cria DOM (uma vez)
  const ov = document.createElement('div');
  ov.className = 'anv-loading-ov';
  ov.id = 'anv-loading-ov';
  ov.innerHTML = `
    <div class="anv-loading-card">
      <div class="anv-loading-spin"></div>
      <div class="anv-loading-label" id="anv-loading-label">Carregando...</div>
      <div class="anv-loading-sub" id="anv-loading-sub">aguarde um instante</div>
      <div class="anv-loading-bar-wrap" id="anv-loading-bar-wrap">
        <div class="anv-loading-bar" id="anv-loading-bar"></div>
      </div>
      <div class="anv-loading-pct" id="anv-loading-pct">0%</div>
    </div>`;
  document.body.appendChild(ov);

  // Bloqueia rolagem do body enquanto overlay tá aberto
  function lockScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }
  function unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  // Stack pra chamadas aninhadas
  const stack = [];

  // NEREAL_FIX_PCT_TODAS_V1: barra de % SEMPRE visivel (com creep) em qualquer LOADING.run/wrap.
  // Se o trabalho chamar setProgress, o % real assume; senao, a barra sobe sozinha ate 90% e
  // finaliza em 100%. Resolve "mesclar/importar/baterias sem porcentagem".
  let _creepIv = null, _creepPct = 0, _realUsed = false;
  function _setBar(pct){
    pct = Math.max(0, Math.min(100, pct));
    const w = document.getElementById('anv-loading-bar-wrap');
    const p = document.getElementById('anv-loading-pct');
    const b = document.getElementById('anv-loading-bar');
    if(w) w.classList.add('show');
    if(p){ p.classList.add('show'); p.textContent = Math.round(pct) + '%'; }
    if(b) b.style.width = pct + '%';
  }
  function _startCreep(){
    _stopCreep(); _creepPct = 8; _realUsed = false; _setBar(_creepPct);
    _creepIv = setInterval(function(){
      if(_realUsed) return;
      if(_creepPct < 90){ _creepPct += (_creepPct < 35 ? 6 : (_creepPct < 70 ? 2 : 1)); _setBar(_creepPct); }
    }, 110);
  }
  function _stopCreep(){ if(_creepIv){ clearInterval(_creepIv); _creepIv = null; } }

  function show(label, sub) {
    ov.classList.add('show');
    document.getElementById('anv-loading-label').textContent = label || 'Carregando...';
    document.getElementById('anv-loading-sub').textContent = sub || 'aguarde um instante';
    document.getElementById('anv-loading-bar').style.width = '0%';
    document.getElementById('anv-loading-bar-wrap').classList.add('show');
    document.getElementById('anv-loading-pct').classList.add('show');
    document.getElementById('anv-loading-pct').textContent = '0%';
    lockScroll();
  }

  function hide() {
    ov.classList.remove('show');
    unlockScroll();
  }

  function setProgress(cur, tot) {
    _realUsed = true; _stopCreep();   // progresso real assume; para o creep
    const pct = Math.min(100, Math.floor((cur / tot) * 100));
    document.getElementById('anv-loading-bar-wrap').classList.add('show');
    document.getElementById('anv-loading-pct').classList.add('show');
    document.getElementById('anv-loading-bar').style.width = pct + '%';
    document.getElementById('anv-loading-pct').textContent = pct + '% (' + cur + '/' + tot + ')';
  }

  function setLabel(label, sub) {
    document.getElementById('anv-loading-label').textContent = label || 'Carregando...';
    if(sub !== undefined) {
      document.getElementById('anv-loading-sub').textContent = sub;
    }
  }

  /**
   * Execução envolvida pelo overlay.
   * @param {string} label  - texto principal
   * @param {Function} fn   - async function que recebe (setProgress, setLabel)
   * @param {string} sub    - subtexto opcional
   * @returns valor retornado por fn()
   */
  async function run(label, fn, sub) {
    stack.push({ label, sub });
    show(label, sub);
    _startCreep();
    try {
      const result = await fn(setProgress, setLabel);
      return result;
    } finally {
      _stopCreep();
      _setBar(100);            // sempre termina em 100%
      stack.pop();
      if(stack.length > 0) {
        const top = stack[stack.length - 1];
        show(top.label, top.sub);
        _startCreep();
      } else {
        setTimeout(hide, 180); // deixa o 100% aparecer um instante antes de sumir
      }
    }
  }

  // Wrapper síncrono: pra envolver coisas que não retornam promise (ex: salvar)
  function wrap(label, fn, sub) {
    return run(label, async () => {
      // Dá 1 tick pro browser renderizar o overlay ANTES da operação síncrona pesada
      await new Promise(r => setTimeout(r, 30));
      return fn();
    }, sub);
  }

  window.LOADING = { run, wrap, show, hide, setProgress, setLabel };
})();
