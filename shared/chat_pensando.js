/* ════════════════════════════════════════════════════════════════
   chat_pensando.js — bolha "pensando..." com 3 pontinhos
                       Aparece SÓ se o turno demorar >2s

   Uso:
     const handle = window.PENSANDO.start(chatContent);
     // ...processamento async...
     handle.stop();  // remove a bolha (se chegou a aparecer)

   Requisitos:
     - chatContent deve ser o elemento DOM da área de mensagens
     - A bolha herda o estilo de .ph-msg.brain (mobile) ou .msg.brain (desktop)
   ════════════════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if(window.PENSANDO) return;

  const CSS = `
  .anv-pensando-bolha {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 14px;
    background: rgba(94, 234, 212, 0.10);
    border: 1px solid rgba(94, 234, 212, 0.28);
    border-radius: 14px;
    margin: 6px 0;
    max-width: 90px;
  }
  .anv-pensando-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #5eead4;
    animation: anv-pensando-pulse 1.2s infinite ease-in-out;
  }
  .anv-pensando-dot:nth-child(2) { animation-delay: 0.18s; background: #a78bfa; }
  .anv-pensando-dot:nth-child(3) { animation-delay: 0.36s; background: #fbbf24; }
  @keyframes anv-pensando-pulse {
    0%, 60%, 100% { transform: scale(0.7); opacity: 0.5; }
    30%           { transform: scale(1.2); opacity: 1; }
  }
  /* Wrapper que respeita o layout de mensagem do app */
  .anv-pensando-wrap {
    text-align: left;
    padding: 0 12px;
  }
  `;

  const style = document.createElement('style');
  style.id = 'anv-pensando-style';
  style.textContent = CSS;
  document.head.appendChild(style);

  const DELAY = 2000; // só aparece se demorar >2s

  /**
   * Inicia o timer. Se nada chamar .stop() em 2s, mostra a bolha.
   * @param {HTMLElement} chatContent - container de mensagens
   * @returns {{stop: function}}
   */
  function start(chatContent) {
    let bolhaEl = null;
    let timerId = setTimeout(() => {
      timerId = null;
      bolhaEl = document.createElement('div');
      bolhaEl.className = 'anv-pensando-wrap';
      bolhaEl.innerHTML = `
        <div class="anv-pensando-bolha">
          <div class="anv-pensando-dot"></div>
          <div class="anv-pensando-dot"></div>
          <div class="anv-pensando-dot"></div>
        </div>
      `;
      if(chatContent) {
        chatContent.appendChild(bolhaEl);
        chatContent.scrollTop = chatContent.scrollHeight;
      }
    }, DELAY);

    return {
      stop: function() {
        if(timerId !== null) {
          clearTimeout(timerId);
          timerId = null;
        }
        if(bolhaEl && bolhaEl.parentNode) {
          bolhaEl.parentNode.removeChild(bolhaEl);
          bolhaEl = null;
        }
      }
    };
  }

  window.PENSANDO = { start };
})();
