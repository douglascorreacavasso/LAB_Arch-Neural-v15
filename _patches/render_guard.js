/* ════════════════════════════════════════════════════════════════
   render_guard.js — congela a IMAGEM do cérebro quando fica pesado,
   sem parar o processamento. Carregue DEPOIS do viz_renderer:
     <script src="shared/viz_renderer.js"></script>
     <script src="shared/render_guard.js"></script>

   Regra (do Douglas): ao passar de X nós/arestas, o 3D para de atualizar
   (congela o último frame) e mostra um aviso. O cérebro NÃO encolhe e
   continua crescendo/respondendo por baixo — só a renderização pausa.

   NÃO-destrutivo. Reversível (basta remover o <script>). Limite ajustável:
     window.VIZ_GUARD.setLimite(nos, arestas)
     window.VIZ_GUARD.descongelar()   // força voltar a desenhar
     window.VIZ_GUARD.estado()
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(window._render_guard_v1) return;
  if(!window.VIZ || typeof window.VIZ.desenhar !== 'function'){
    try{ console.warn('[render_guard] VIZ não carregado ainda'); }catch(e){}
    return;
  }

  // Limites padrão: o leve normal (~2.3k nós / ~14k arestas) passa;
  // mega (~9k nós / ~160k arestas) e leve-treinado (~15k nós) congelam.
  var LIM = { nos: 6000, arestas: 60000 };
  var congelado = false;

  function pesado(c){
    if(!c || !c.nodes) return false;
    return c.nodes.length > LIM.nos || (c.edges && c.edges.length > LIM.arestas);
  }

  function desenharAviso(canvas, c){
    try{
      var ctx = canvas.getContext('2d');
      var rect = canvas.getBoundingClientRect();
      var W = rect.width, H = rect.height;
      var kn = (c.nodes.length/1000).toFixed(1);
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      var bh = 56;
      ctx.fillStyle = 'rgba(6,8,15,0.82)';
      ctx.fillRect(0, H - bh, W, bh);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '600 13px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠ Cérebro grande (' + kn + 'k nós) — imagem congelada pra não travar.', 14, H - bh + 18);
      ctx.fillStyle = '#9fb0d0';
      ctx.font = '11px sans-serif';
      ctx.fillText('Ele continua aprendendo e respondendo por baixo. (toque 2x pra tentar desenhar)', 14, H - bh + 38);
      ctx.restore();
    }catch(e){}
  }

  var orig = window.VIZ.desenhar;
  window.VIZ.desenhar = function(opts){
    var c = opts && opts.cerebro;
    if(pesado(c)){
      if(!congelado){
        try { orig(opts); } catch(e){}     // um último frame
        if(opts && opts.canvas) desenharAviso(opts.canvas, c);
        congelado = true;
        try{ console.log('[render_guard] congelado: ' + c.nodes.length + ' nós'); }catch(e){}
      }
      return; // congelado: não re-renderiza (cérebro segue processando normalmente)
    }
    // leve: render normal
    if(congelado) congelado = false;
    return orig(opts);
  };

  window.VIZ_GUARD = {
    setLimite: function(nos, arestas){ if(nos) LIM.nos = nos|0; if(arestas) LIM.arestas = arestas|0; congelado = false; },
    descongelar: function(){ congelado = false; },
    estado: function(){ return { congelado: congelado, limite: LIM }; },
  };
  window._render_guard_v1 = true;
  try{ console.log('[render_guard] ativo — limite ' + LIM.nos + ' nós / ' + LIM.arestas + ' arestas'); }catch(e){}
})();
