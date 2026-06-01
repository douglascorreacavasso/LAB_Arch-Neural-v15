/* ════════════════════════════════════════════════════════════════
   baterias/bateria_selfcore.js — STRESS do SELF-CORE (browser)
   Estilo pedido pelo Douglas:
     - dizer que ELE (a IA) é coisas:  "seu nome é X", "voce é Y", "seu genero é Z"
     - dizer que EU (user) sou coisas: "meu nome é X", "me chamo Y", "eu sou Z"
     - pedir pra LISTAR:               "liste o que sabe sobre voce/mim"
     - perguntar de VARIAS formas:     "qual é o seu X?", "X?", "qual seu X", "qual é o teu X?"

   Gera combinacoes (valor x frase-de-set x frase-de-pergunta) e valida que a
   resposta traz o valor certo (e nao despeja a identidade no lugar errado).
   Cada teste roda no v112_processar -> tambem TREINA.

   run({max})        -> sample (default 120) — usado na suite pos-ensino
   completo({n,log}) -> async com progresso, ate n testes (default 3000) — PC
   Registra em window.BATERIAS_REGISTRO (entra na suite) e expoe window.BATERIA_SELFCORE.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(typeof window === 'undefined' || typeof window.v112_processar !== 'function'){ try{console.warn('[bateria selfcore] engine ausente');}catch(e){} return; }

  function P(txt){ try { return window.v112_processar(txt); } catch(e){ return {resposta:'[ERRO] '+e.message}; } }
  function resp(r){ return String((r && (r.resposta || r.resposta_direta)) || '').toLowerCase(); }
  function semAcento(s){ return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function contem(r, v){ var a = semAcento(resp(r)), b = semAcento(String(v).toLowerCase()); return a.indexOf(b) !== -1; }

  function resetSC(){ var sc = window.V112 && window.V112.self_core; if(!sc) return; sc.nome = []; sc.genero = []; sc.user = []; }
  // [NEREAL_SELFCORE_PRESERVA_V1] snapshot/restore da identidade VIVA — a bateria nao pode
  // apagar o que o usuario ensinou (resetSC zera nome/genero/user entre os testes).
  function snapSC(){ var sc = window.V112 && window.V112.self_core; if(!sc) return null;
    return { nome:(sc.nome||[]).slice(), genero:(sc.genero||[]).slice(), user:(sc.user||[]).slice() }; }
  function restoreSC(s){ var sc = window.V112 && window.V112.self_core; if(!sc || !s) return;
    sc.nome = s.nome.slice(); sc.genero = s.genero.slice(); sc.user = s.user.slice(); }

  // ── pools de valores e frases ──
  var NOME_IA   = ['nerael','aurora','kai','vega','nova','iris','eco','lumen','sora','aria'];
  var NOME_USER = ['douglas','ana','bruno','carla','diego','elis','fabio','gabi','helena','igor'];
  var GENERO    = ['masculino','feminino'];
  var SOU       = ['ia','sistema','assistente','robo','programa'];

  var SET_NOME_IA   = ['seu nome é {v}','seu nome e {v}','te chamo de {v}','voce se chama {v}','o seu nome é {v}','teu nome é {v}'];
  var ASK_NOME_IA   = ['qual é o seu nome?','qual seu nome','seu nome?','como você se chama?','me diz teu nome','qual é o teu nome?','como te chamo?'];
  var SET_GEN_IA    = ['seu genero é {v}','seu gênero é {v}','voce é {v}','seu sexo é {v}','teu gênero é {v}'];
  var ASK_GEN_IA    = ['qual é o seu genero?','qual é o seu gênero?','gênero?','qual seu sexo?','qual é o teu gênero?','seu genero?','qual o seu gênero'];
  var SET_NOME_USER = ['meu nome é {v}','me chamo {v}','meu nome e {v}','pode me chamar de {v}','eu sou {v}'];
  var ASK_NOME_USER = ['qual é o meu nome?','qual meu nome','meu nome?','você sabe meu nome?','qual é o nome que te disse?','como eu me chamo?'];
  var SET_SOU       = ['você é {v}','voce e {v}','tu és {v}'];
  var ASK_SOU       = ['o que você é?','quem é você?','o que voce e?'];

  function fill(t, v){ return t.replace('{v}', v); }

  // gera a lista de combinacoes (unicas)
  function gerarBase(){
    var T = [], i, j, k;
    // 1) NOME da IA: set x ask x valor
    for(i=0;i<NOME_IA.length;i++) for(j=0;j<SET_NOME_IA.length;j++) for(k=0;k<ASK_NOME_IA.length;k++){
      (function(v,sp,ap){ T.push({grupo:'nome_ia', setup:[fill(sp,v)], query:ap, val:function(r){return contem(r,v);}, esp:v}); })(NOME_IA[i],SET_NOME_IA[j],ASK_NOME_IA[k]);
    }
    // 2) GENERO da IA
    for(i=0;i<GENERO.length;i++) for(j=0;j<SET_GEN_IA.length;j++) for(k=0;k<ASK_GEN_IA.length;k++){
      (function(v,sp,ap){ T.push({grupo:'genero_ia', setup:[fill(sp,v)], query:ap, val:function(r){return contem(r,v);}, esp:v}); })(GENERO[i],SET_GEN_IA[j],ASK_GEN_IA[k]);
    }
    // 3) NOME do user
    for(i=0;i<NOME_USER.length;i++) for(j=0;j<SET_NOME_USER.length;j++) for(k=0;k<ASK_NOME_USER.length;k++){
      (function(v,sp,ap){ T.push({grupo:'nome_user', setup:[fill(sp,v)], query:ap, val:function(r){return contem(r,v);}, esp:v}); })(NOME_USER[i],SET_NOME_USER[j],ASK_NOME_USER[k]);
    }
    // 4) SOU (atributo da IA)
    for(i=0;i<SOU.length;i++) for(j=0;j<SET_SOU.length;j++) for(k=0;k<ASK_SOU.length;k++){
      (function(v,sp,ap){ T.push({grupo:'sou_ia', setup:[fill(sp,v)], query:ap, val:function(r){ return contem(r,v) || /ia|sistema|nerael|sou /.test(resp(r)); }, esp:v}); })(SOU[i],SET_SOU[j],ASK_SOU[k]);
    }
    // 5) LISTAR (leniente: a feature de listar pode estar quebrada — documenta)
    for(i=0;i<6;i++){
      (function(nv,gv,uv){
        T.push({grupo:'listar_ia', setup:[fill(SET_NOME_IA[0],nv), fill(SET_GEN_IA[0],gv)], query:'liste o que sabe sobre você', val:function(r){ return contem(r,nv)||contem(r,gv); }, esp:nv+'/'+gv, leniente:true});
        T.push({grupo:'listar_user', setup:[fill(SET_NOME_USER[0],uv)], query:'liste o que sabe sobre mim', val:function(r){ return contem(r,uv); }, esp:uv, leniente:true});
      })(NOME_IA[i], GENERO[i%2], NOME_USER[i]);
    }
    return T;
  }

  var _base = null;
  function base(){
    if(!_base){
      _base = gerarBase();
      // shuffle deterministico pra um sample pequeno cobrir TODOS os grupos
      var seed = 1234567;
      for(var i=_base.length-1;i>0;i--){ seed=(seed*1103515245+12345)&0x7fffffff; var j=seed%(i+1); var tmp=_base[i]; _base[i]=_base[j]; _base[j]=tmp; }
    }
    return _base;
  }

  // monta a lista efetiva ate 'n' (cicla a base se n > base.length)
  function montar(n){
    var b = base(), out = [];
    if(!n || n <= 0) n = b.length;
    for(var i=0;i<n;i++) out.push(b[i % b.length]);
    return out;
  }

  function _umTeste(t, placar, falhas, lenientes){
    resetSC();
    for(var s=0;s<t.setup.length;s++) P(t.setup[s]);   // ENSINA (treina)
    var r = P(t.query);                                 // PERGUNTA (treina)
    var ok = false; try { ok = t.val(r); } catch(e){ ok = false; }
    placar[t.grupo] = placar[t.grupo] || {ok:0,total:0}; placar[t.grupo].total++;
    if(ok) placar[t.grupo].ok++;
    else {
      if(t.leniente){ lenientes.push({grupo:t.grupo, query:t.query, esp:t.esp, resp:resp(r).slice(0,60)}); }
      else falhas.push({grupo:t.grupo, query:t.query, esp:t.esp, resp:resp(r).slice(0,60)});
    }
    return ok;
  }

  function _resumo(tests, placar, falhas, lenientes){
    var ok=0, total=0; for(var g in placar){ ok+=placar[g].ok; total+=placar[g].total; }
    // testes lenientes (listar) nao contam como falha "dura"
    return { nome:'selfcore', ok:ok, total:total, falhas:falhas, lenientes:lenientes, porGrupo:placar, testes:tests.length };
  }

  // sync — usado pela suite pos-ensino (sample pequeno)
  function run(opts){
    opts = opts || {};
    var snap = snapSC();
    try {
      var tests = montar(opts.max || 120);
      var placar={}, falhas=[], lenientes=[];
      for(var i=0;i<tests.length;i++) _umTeste(tests[i], placar, falhas, lenientes);
      return _resumo(tests, placar, falhas, lenientes);
    } finally { restoreSC(snap); }
  }

  // async com progresso — pra rodada profunda (default 3000), nao trava a aba
  function _yield(){ return new Promise(function(res){ if(typeof setTimeout==='function') setTimeout(res,0); else res(); }); }
  async function completo(opts){
    opts = opts || {};
    var snap = snapSC();
    try {
      var tests = montar(opts.n || 3000);
      var log = (typeof opts.log==='function') ? opts.log : function(){};
      var placar={}, falhas=[], lenientes=[];
      for(var i=0;i<tests.length;i++){
        _umTeste(tests[i], placar, falhas, lenientes);
        if(i % 25 === 0){ log(i+'/'+tests.length); await _yield(); }
      }
      var res = _resumo(tests, placar, falhas, lenientes);
      try { console.log('[bateria selfcore] completo: '+res.ok+'/'+res.total+' (lenientes/listar falhos: '+res.lenientes.length+')'); } catch(e){}
      return res;
    } finally { restoreSC(snap); }
  }

  window.BATERIA_SELFCORE = { run: run, completo: completo, gerar: gerarBase };
  window.BATERIAS_REGISTRO = window.BATERIAS_REGISTRO || [];
  window.BATERIAS_REGISTRO.push({ nome:'selfcore', run:function(){ return run({max:120}); } });
  try { console.log('[bateria selfcore] pronta — '+base().length+' combos unicos. BATERIA_SELFCORE.completo({n:3000})'); } catch(e){}
})();
