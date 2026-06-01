/* ════════════════════════════════════════════════════════════════
   treinos_adapt_runner.js — dispara os treinos adaptativos (xadrez,
   labirinto, benchmark) que vivem em treinos/treino_*.js.

   Sao treinos DINAMICOS (logica, nao listas de frases): cada um sobe de
   dificuldade sozinho, alimenta v112_processar (treina a rede) e PARA
   sozinho. Por serem pesados, NAO rodam no boot nem apos o ensino comum —
   voce dispara quando quiser.

   Carregue DEPOIS dos treinos:
     <script src="treinos/treino_benchmark.js"></script>
     <script src="treinos/treino_labirinto.js"></script>
     <script src="treinos/treino_xadrez.js"></script>
     <script src="shared/treinos_adapt_runner.js"></script>

   COMO USAR (no console do navegador, ou ligado num botao):
     TREINOS_EXTRA.listar()                       -> ['benchmark','labirinto','xadrez']
     await TREINOS_EXTRA.rodar('xadrez')          -> roda 1 treino (com overlay)
     await TREINOS_EXTRA.rodar('xadrez', {partidasMax:40})
     await TREINOS_EXTRA.rodarTodos()             -> roda os 3 em sequencia

   Pra ligar num botao (exemplo):
     meuBotao.onclick = () => TREINOS_EXTRA.rodar('labirinto');
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(window.TREINOS_EXTRA) return;
  window.TREINOS_ADAPT = window.TREINOS_ADAPT || [];

  function ehCelular(){
    try {
      var ua = navigator.userAgent || '';
      var mob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
      return mob || (window.innerWidth && window.innerWidth < 768);
    } catch(e){ return false; }
  }

  function listar(){ return (window.TREINOS_ADAPT || []).map(function(t){ return t.nome; }); }
  function achar(nome){ var a = window.TREINOS_ADAPT || []; for(var i=0;i<a.length;i++) if(a[i].nome===nome) return a[i]; return null; }

  function frase(res){
    if(!res) return 'treino sem retorno';
    if(res.nome==='benchmark') return '🧠 benchmark: nivel '+res.nivelFinal+', '+res.ok+'/'+(res.ok+res.erro)+' acertos em '+res.rodadas+' rodadas (+'+res.nosCriados+' nos)';
    if(res.nome==='labirinto') return '🧩 labirinto: '+res.resolvidos+'/'+res.niveis+' niveis resolvidos, '+res.passosTotais+' passos (+'+res.nosCriados+' nos)';
    if(res.nome==='xadrez')    return '♟️ xadrez: nivel '+res.nivelFinal+', '+res.vitorias+'V/'+res.derrotas+'D/'+res.empates+'E em '+res.partidas+' partidas (+'+res.nosCriados+' nos)';
    return 'treino '+res.nome+': +'+(res.nosCriados||0)+' nos';
  }

  function reporta(res){
    var msg = frase(res);
    try { if(typeof window.addMsg === 'function') window.addMsg('brain', msg, 'sleep'); } catch(e){}
    try { if(typeof window.toastExtra === 'function') window.toastExtra(msg, 4500); } catch(e){}
    try { console.log('[treinos_extra] ' + msg); } catch(e){}
    ['renderStats','renderPalavras','renderEventos','renderSelfCore'].forEach(function(fn){
      try { if(typeof window[fn] === 'function') window[fn](); } catch(e){}
    });
  }

  function rodar(nome, opts){
    if(ehCelular()){
      var m = '⚠️ treinos avancados (xadrez/labirinto/benchmark) so rodam no PC — no celular e so ensinar.';
      try { if(typeof window.addMsg === 'function') window.addMsg('brain', m, 'sleep'); } catch(e){}
      try { if(typeof window.toastExtra === 'function') window.toastExtra(m, 4500); } catch(e){}
      try { console.warn('[treinos_extra] ' + m); } catch(e){}
      return Promise.resolve(null);
    }
    var t = achar(nome);
    if(!t){
      try { console.warn('[treinos_extra] nao encontrei "' + nome + '". disponiveis: ' + listar().join(', ')); } catch(e){}
      return Promise.resolve(null);
    }
    var labels = { benchmark:'🧠 Benchmark adaptativo', labirinto:'🧩 Labirinto 10 niveis', xadrez:'♟️ Xadrez evolutivo' };
    function exec(){
      return Promise.resolve(t.run(opts || {})).then(function(res){ if(res) reporta(res); return res; });
    }
    if(window.LOADING && typeof window.LOADING.run === 'function'){
      return window.LOADING.run((labels[nome] || ('Treino: ' + nome)) + '...', function(){ return exec(); });
    }
    return exec();
  }

  function rodarTodos(opts){
    var nomes = listar(), i = 0, acc = [];
    function prox(){
      if(i >= nomes.length) return Promise.resolve(acc);
      return rodar(nomes[i++], opts).then(function(r){ acc.push(r); return prox(); });
    }
    return prox();
  }

  window.TREINOS_EXTRA = { rodar: rodar, rodarTodos: rodarTodos, listar: listar };
  try { console.log('[treinos_adapt_runner] pronto — TREINOS_EXTRA.rodar("xadrez"|"labirinto"|"benchmark") | .rodarTodos() | .listar() — disponiveis: ' + listar().join(', ')); } catch(e){}
})();
