/* ════════ NEREAL_PATCH_MOTOR_CORTEX_V1 ════════
   Cortex motor emergente. Estilo auto_receita: wrapper por cima do v112_processar.
   - Semeia a PORTA [M_exec_sandbox] (idempotente, um unico nervo motor pra fora).
   - HOOK 1 (NMJ): dispara executores do pool motor que cruzaram o threshold (O(pool), seguro pro mega).
   - PORTA: "executar/rodar/rode: <pseudocodigo>" -> roda no interpretador SEGURO do proprio
            engine (v112_prog_executar, limitado a passos/frames, SEM eval) -> dispara a porta ->
            eferencia +energia no Self-Core -> cristaliza no motor [M_exec_aprendido] no 1o sucesso.
   Sem eval novo. So por cima. Reversivel pelo --rollback. */
(function instalar_motor_cortex_v1(){
  if(typeof window === 'undefined') return;
  if(window._motor_cortex_v1) return;
  if(typeof window.v112_processar !== 'function') return;
  var V = window.V112; if(!V) return;

  function nodeByText(t){ return (V.nodes||[]).find(function(n){ return n.text === t; }); }
  function fio(fromId, toId){ if(typeof v112_edge === 'function') return v112_edge(fromId, toId, 1, {tipo:'motor_cmd'}); return null; }
  function eferencia(id, q){ var n=(V.nodes||[]).find(function(x){return x.id===id;}); if(n) n.acumulador=(n.acumulador||0)+q; }

  function semearPorta(){
    var p = nodeByText('[M_exec_sandbox]');
    if(!p && typeof v112_node === 'function'){
      p = v112_node({ text:'[M_exec_sandbox]', camada:'motor', threshold:1, estado:'pronto', _subrede:true,
        _proposito:'PORTA generica (unico nervo motor pra fora): roda pseudocodigo no interpretador seguro v112_prog_executar. O comportamento emerge sobre ela.' });
    }
    return p || nodeByText('[M_exec_sandbox]');
  }

  // CAMADA 1 — NMJ: varre SO o pool motor (O(pool)), dispara quem cruzou o threshold.
  function dispararProntos(){
    var nodes = V.nodes || [];
    for(var i=0;i<nodes.length;i++){
      var n = nodes[i];
      if(n.camada === 'motor' && n.estado === 'pronto' && (n.acumulador||0) >= (n.threshold||1)){
        n.ativacoes = (n.ativacoes||0)+1;
        n._disparos = (n._disparos||0)+1;
        n.acumulador = 0; // descarrega o musculo
      }
    }
  }

  function rodarSeguro(src){
    if(typeof window.v112_prog_parsear !== 'function' || typeof window.v112_prog_executar !== 'function')
      return { ok:false, err:'interpretador seguro ausente' };
    var ast = window.v112_prog_parsear(src);
    if(!ast || ast.erro) return { ok:false, err: 'parse: ' + (ast ? ast.erro : 'nulo') };
    var r = window.v112_prog_executar(ast);
    return { ok: !r.erro, resultado:r.resultado, saida:r.saida, passos:r.passos, err:r.erro };
  }

  function cristalizar(verbo){
    var t = '[M_' + verbo + '_aprendido]';
    var no = nodeByText(t);
    if(!no && typeof v112_node === 'function'){
      no = v112_node({ text:t, camada:'motor', threshold:1, estado:'pronto', _subrede:true,
        _proposito:'EMERGIU por estimulo: dispara "'+verbo+'" na PORTA. Sequencia consolidada.' });
      if(V.self_core_id) fio(V.self_core_id, no.id);
      var _p = nodeByText('[M_exec_sandbox]');
      if(_p) fio(no.id, _p.id);
    } else if(no){ no.ativacoes=(no.ativacoes||0)+1; }
    return no;
  }

  // CAMADA 2 — BABBLING: o cerebro COMPOE o programa a partir da intencao.
  // Dispara so em fallback (igual auto_receita) e so com expressao aritmetica (v2 seguro).
  function ehFallback(r){
    var t = (r && (r.resposta_direta || r.resposta) || '').toString().toLowerCase().trim();
    return !t || t==='hm.' || t==='...' || t==='?' || t.length < 3;
  }
  var RE_PRINT = /(?:imprim\w*|escrev\w*|mostr\w*|print)\s+([\d\s+\-*/().]+)\s*$/i;
  function babblingPrint(input){
    if(typeof input !== 'string') return null;
    var m = input.match(RE_PRINT);
    if(!m) return null;
    var expr = (m[1]||'').trim();
    if(!expr || !/[0-9]/.test(expr)) return null;        // so expressao numerica (v2)
    var PORTA = semearPorta(); if(!PORTA) return null;
    PORTA.ativacoes = (PORTA.ativacoes||0)+1;
    var r = rodarSeguro('imprime ' + expr);              // COMPOE o pseudo valido e roda no interpretador seguro
    if(r.ok){
      PORTA.sucessos = (PORTA.sucessos||0)+1;
      if(V.self_core_id) eferencia(V.self_core_id, 100);
      cristalizar('imprimir');                            // nasce [M_imprimir_aprendido] por estimulo
      try { dispararProntos(); } catch(e){}
      var saida = (r.saida && r.saida.length) ? r.saida.join(', ') : (r.resultado!==undefined ? r.resultado : '(ok)');
      return { resposta: String(saida), motor:true, babbling:true, fallback:false };
    }
    return null;
  }

  var RE_PROG_EXPLICITO = /^\s*(?:faca|fa\u00e7a|cria[r]?\s+(?:um\s+)?programa\s+que)\b/i;
  var RE_EXEC = /^\s*(?:executa[r]?|roda[r]?(?:\s+isso)?|rode)\b\s*[:]?\s*([\s\S]+)$/i;

  var orig = window.v112_processar;
  window.v112_processar = function(input){
    var args = Array.prototype.slice.call(arguments);
    var m = (typeof input === 'string') ? input.match(RE_EXEC) : null;

    // PORTA: execucao via interpretador seguro, disparando o nervo motor
    if(m){
      var PORTA = semearPorta();
      if(!PORTA){ return orig.apply(this, args); }
      var src = m[1];
      PORTA.ativacoes = (PORTA.ativacoes||0)+1;
      var r = rodarSeguro(src);
      if(r.ok){
        PORTA.sucessos = (PORTA.sucessos||0)+1;
        if(V.self_core_id) eferencia(V.self_core_id, 100);   // eferencia +energia
        cristalizar('exec');                                  // nasce/reforca o no motor
        try { dispararProntos(); } catch(e){}                 // NMJ
        var partes = [];
        if(r.resultado !== undefined) partes.push('resultado = ' + r.resultado);
        if(r.saida && r.saida.length) partes.push('saida: [' + r.saida.join(', ') + ']');
        partes.push((r.passos||0) + ' passos');
        return { resposta: partes.join(' | '), motor:true, porta:true, fallback:false };
      } else {
        if(typeof V.amigdala_tensao === 'number') V.amigdala_tensao += 10; // erro sobe tensao
        return { resposta: 'porta: ' + (r.err||'falhou'), motor:true, porta:true };
      }
    }

    // BABBLING explicito: "faca um programa que imprime <expr>" -> compoe ANTES do brain
    if(RE_PROG_EXPLICITO.test(String(input||''))){
      var bx = babblingPrint(input);
      if(bx) return bx;
    }

    // turno normal -> processa; se deu fallback e a intencao foi "imprimir/programa", BABBLING
    var res = orig.apply(this, args);
    if(ehFallback(res)){
      var b = babblingPrint(input);
      if(b) return b;
    }
    try { dispararProntos(); } catch(e){}
    return res;
  };

  window._motor_cortex_v1 = true;
  try { console.log('[motor_cortex_v1] instalado — porta ' + (PORTA?PORTA.id:'?') + ', NMJ ativo'); } catch(e){}
})();
/* ════════ FIM NEREAL_PATCH_MOTOR_CORTEX_V1 ════════ */
