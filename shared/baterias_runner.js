/* ════════════════════════════════════════════════════════════════
   baterias_runner.js — roda as baterias da pasta baterias/ DEPOIS do ensino.
   As baterias sao testes que TAMBEM treinam a rede (feed via v112_processar).

   Carregue DEPOIS de treino_loader.js E das baterias/bateria_*.js:
     <script src="shared/treino_loader.js"></script>
     <script src="baterias/bateria_integracao.js"></script>
     <script src="baterias/bateria_estatistica.js"></script>
     <script src="baterias/bateria_nivel_deus.js"></script>
     <script src="shared/baterias_runner.js"></script>

   API:
     window.BATERIAS.rodar()        -> roda todas, retorna {ok,total,baterias:[...]}
     (auto) apos window.TREINO.ensinarProximo() bem-sucedido, roda sozinho.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(window.BATERIAS) return;
  window.BATERIAS_REGISTRO = window.BATERIAS_REGISTRO || [];

  function ehCelular(){
    try {
      var ua = navigator.userAgent || '';
      var mob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
      return mob || (window.innerWidth && window.innerWidth < 768);
    } catch(e){ return false; }
  }

  function rodar(){
    var regs = window.BATERIAS_REGISTRO || [];
    var resumo = [], totOk = 0, tot = 0;
    for(var i = 0; i < regs.length; i++){
      try {
        var rr = regs[i].run();
        if(rr){ resumo.push(rr); totOk += (rr.ok || 0); tot += (rr.total || 0); }
      } catch(e){
        try { console.warn('[baterias] erro em ' + (regs[i] && regs[i].nome) + ': ' + e.message); } catch(_){}
      }
    }
    return { ok: totOk, total: tot, baterias: resumo };
  }

  window.BATERIAS = { rodar: rodar, registro: window.BATERIAS_REGISTRO };

  // ── HOOK: depois que o ENSINO termina, roda as baterias (treina + valida) ──
  function rodarComOverlay(){
    function exec(){
      var res = rodar();
      var msg = '🧪 baterias (treino extra): ' + res.ok + '/' + res.total + ' ok';
      try { if(typeof window.addMsg === 'function') window.addMsg('brain', msg, 'sleep'); } catch(e){}
      try { if(typeof window.toastExtra === 'function') window.toastExtra(msg, 3500); } catch(e){}
      try { console.log('[baterias] ' + msg + ' — ' + res.baterias.map(function(b){return b.nome+' '+b.ok+'/'+b.total;}).join(' | ')); } catch(e){}
      // o ensino mexeu no grafo -> atualiza paineis se existirem
      ['renderStats','renderPalavras','renderEventos','renderSelfCore'].forEach(function(fn){
        try { if(typeof window[fn] === 'function') window[fn](); } catch(e){}
      });
      return res;
    }
    if(window.LOADING && typeof window.LOADING.run === 'function'){
      return window.LOADING.run('🧪 Rodando baterias (treino extra)...', function(){
        return new Promise(function(s){ setTimeout(function(){ s(exec()); }, 30); });
      });
    }
    return Promise.resolve(exec());
  }

  function hookTreino(){
    if(!window.TREINO || typeof window.TREINO.ensinarProximo !== 'function' || window.TREINO.__baterias_hook) return;
    var _orig = window.TREINO.ensinarProximo;
    window.TREINO.ensinarProximo = function(){
      var p = _orig.apply(this, arguments);
      return Promise.resolve(p).then(function(r){
        if(r && r.ok && !ehCelular()){ return rodarComOverlay().then(function(){ return r; }); }
        return r;
      });
    };
    window.TREINO.__baterias_hook = true;
    try { console.log('[baterias_runner] ativo — ' + (window.BATERIAS_REGISTRO.length) + ' baterias, roda apos o ensino'); } catch(e){}
  }

  hookTreino();
  if(typeof window.addEventListener === 'function') window.addEventListener('DOMContentLoaded', hookTreino);
})();
