/* ════════════════════════════════════════════════════════════════
   perfil_aparelho.js — mede o que o aparelho aguenta e adapta a carga.

   Carregue LOGO DEPOIS de shared/device_check.js e ANTES de
   overlay_loading.js / chat_pensando.js / treino_loader.js.

   Expõe window.PERFIL:
     PERFIL.nivel        → 'fraco' | 'medio' | 'forte'
     PERFIL.motivos      → lista de textos explicando o nível
     PERFIL.fatiaMs      → quanto tempo (ms) um trabalho pesado roda antes de
                           devolver a tela pro navegador (8 / 14 / 24)
     PERFIL.fpsMax       → teto de quadros por segundo do 3D (20 / 30 / 60)
     PERFIL.ocupado      → >0 enquanto uma operação pesada está rodando
     PERFIL.pintar()     → Promise: garante que a tela foi desenhada (spinner
                           aparece) ANTES de começar um trabalho síncrono
     PERFIL.ceder()      → Promise: devolve a vez pro navegador (rápido)
     PERFIL.emFatias(lista, fn, aoProgredir) → roda fn(item, i) em fatias de
                           tempo, cedendo a tela entre elas
     PERFIL.intervaloRender(nNos) → ms mínimos entre dois quadros do 3D
     PERFIL.medirRender(ms) / PERFIL.medirTurno(ms) → alimentam a adaptação
     PERFIL.turnoLento() → true se as últimas respostas demoraram (mostra os
                           "pensando" na hora, sem esperar 2 s)
     PERFIL.baixarJSON(url, aoProgredir) → baixa com % real e lê o JSON
     PERFIL.forcar('fraco'|'medio'|'forte'|'') → guarda escolha manual

   Escolha manual (vale entre sessões):
     localStorage.setItem('arch_perfil', 'fraco')   // ou 'medio' / 'forte'

   Autoria: infraestrutura escrita pelo assistente de código (Claude) em
   15/11/2026, a pedido do autor do projeto. Não é aprendizado do cérebro.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(window.PERFIL) return;

  var CHAVE = 'arch_perfil';
  var agora = (window.performance && performance.now) ? function(){ return performance.now(); } : function(){ return Date.now(); };

  // ── 1. Mede o aparelho ──────────────────────────────────────────
  function microBenchmark(){
    // ~1-3 ms num PC bom, 10+ ms num celular fraco. Repete 3x e fica com o menor.
    var melhor = Infinity;
    for(var r = 0; r < 3; r++){
      var t0 = agora(), s = 0;
      for(var i = 0; i < 120000; i++){ s += Math.sqrt(i) * 0.5; }
      var dt = agora() - t0;
      if(dt < melhor) melhor = dt;
      if(s < 0) console.log(s); // impede o otimizador de apagar o laço
    }
    return melhor;
  }

  function detectar(){
    var forcado = '';
    try { forcado = (localStorage.getItem(CHAVE) || '').toLowerCase(); } catch(e){}
    if(forcado === 'fraco' || forcado === 'medio' || forcado === 'forte'){
      return { nivel: forcado, motivos: ['escolhido pelo usuário (localStorage arch_perfil)'], bench: null };
    }
    var cores = navigator.hardwareConcurrency || 4;
    var ram = navigator.deviceMemory || 0;           // só Chrome/Android informam
    var ua = (navigator.userAgent || '').toLowerCase();
    var ehMobile = /android|iphone|ipad|ipod|mobile/.test(ua);
    var economia = !!(navigator.connection && navigator.connection.saveData);
    var bench = microBenchmark();

    var pontos = 0, motivos = [];
    if(cores >= 8) pontos += 2; else if(cores >= 4) pontos += 1; else { pontos -= 1; motivos.push('CPU ' + cores + ' núcleos'); }
    if(ram){ if(ram >= 8) pontos += 2; else if(ram >= 4) pontos += 1; else { pontos -= 1; motivos.push('RAM ' + ram + ' GB'); } }
    if(bench < 2.5) pontos += 2; else if(bench < 6) pontos += 1; else { pontos -= 1; motivos.push('teste de CPU lento (' + bench.toFixed(1) + ' ms)'); }
    if(ehMobile){ pontos -= 1; motivos.push('celular/tablet'); }
    if(economia){ pontos -= 2; motivos.push('modo economia de dados'); }

    var nivel = pontos >= 4 ? 'forte' : (pontos >= 1 ? 'medio' : 'fraco');
    if(!motivos.length) motivos.push('CPU ' + cores + ' núcleos, teste ' + bench.toFixed(1) + ' ms');
    return { nivel: nivel, motivos: motivos, bench: bench };
  }

  var det = detectar();
  var TABELA = {
    fraco: { fatiaMs: 8,  fpsMax: 20, fatorRender: 4 },
    medio: { fatiaMs: 14, fpsMax: 30, fatorRender: 3 },
    forte: { fatiaMs: 24, fpsMax: 60, fatorRender: 2 }
  };
  var cfg = TABELA[det.nivel];

  // ── 2. Ceder a tela ─────────────────────────────────────────────
  // MessageChannel é mais rápido que setTimeout(0) (sem o atraso mínimo de 4 ms).
  var _fila = [], _canal = null;
  try {
    _canal = new MessageChannel();
    _canal.port1.onmessage = function(){ var f = _fila.shift(); if(f) f(); };
  } catch(e){ _canal = null; }
  function ceder(){
    return new Promise(function(res){
      if(_canal){ _fila.push(res); _canal.port2.postMessage(0); }
      else setTimeout(res, 0);
    });
  }
  // Garante 1 quadro desenhado (o overlay/spinner aparece de verdade).
  // Aba escondida não roda requestAnimationFrame → teto de 80 ms.
  function pintar(){
    return new Promise(function(res){
      var feito = false;
      function fim(){ if(!feito){ feito = true; res(); } }
      setTimeout(fim, 80);
      if(typeof requestAnimationFrame === 'function'){
        requestAnimationFrame(function(){ setTimeout(fim, 0); });
      }
    });
  }

  // ── 3. Trabalho em fatias de tempo ──────────────────────────────
  async function emFatias(lista, fn, aoProgredir){
    var total = lista.length, i = 0;
    while(i < total){
      var t0 = agora();
      do {
        try { fn(lista[i], i); } catch(e){ /* item com erro não para o lote */ }
        i++;
      } while(i < total && (agora() - t0) < PERFIL.fatiaMs);
      if(aoProgredir) { try { aoProgredir(i, total); } catch(e){} }
      await ceder();
      // de vez em quando deixa o navegador pintar (barra de % e spinner)
      if((agora() - _ultimaPintura) > 120){ await pintar(); _ultimaPintura = agora(); }
    }
    return i;
  }
  var _ultimaPintura = 0;

  // ── 4. Adaptação do 3D e do chat ────────────────────────────────
  var _renderMedio = 0, _turnoMedio = 0;
  function medirRender(ms){ _renderMedio = _renderMedio ? (_renderMedio * 0.85 + ms * 0.15) : ms; }
  function medirTurno(ms){ _turnoMedio = _turnoMedio ? (_turnoMedio * 0.6 + ms * 0.4) : ms; }
  function turnoLento(){
    var n = (window.V112 && V112.nodes) ? V112.nodes.length : 0;
    return _turnoMedio > 120 || n > 8000 || (det.nivel === 'fraco' && n > 3000);
  }
  function intervaloRender(nNos){
    var porNos = 0;                                 // mesma escala que já existia
    if(nNos > 40000) porNos = 90; else if(nNos > 12000) porNos = 60; else if(nNos > 4000) porNos = 40;
    var porFps = 1000 / cfg.fpsMax;
    var porCusto = _renderMedio * cfg.fatorRender;  // desenho usa no máx. 1/fator do tempo
    var ms = Math.max(porNos, porFps, porCusto);
    if(PERFIL.ocupado > 0) ms = Math.max(ms, 250); // durante operação pesada: 4 qps, CPU vai pro trabalho
    return Math.min(ms, 400);
  }

  // ── 5. Download com % real ──────────────────────────────────────
  async function baixarJSON(url, aoProgredir){
    var r = await fetch(url);
    if(!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
    var total = parseInt(r.headers.get('content-length') || '0', 10);
    var texto;
    if(r.body && r.body.getReader && total > 0 && typeof TextDecoder !== 'undefined'){
      var leitor = r.body.getReader(), dec = new TextDecoder('utf-8'), partes = [], lido = 0;
      while(true){
        var p = await leitor.read();
        if(p.done) break;
        lido += p.value.length;
        partes.push(dec.decode(p.value, { stream: true }));
        if(aoProgredir) { try { aoProgredir(lido, total, 'baixando'); } catch(e2){} }
      }
      partes.push(dec.decode());
      texto = partes.join('');
    } else {
      texto = await r.text();
    }
    if(aoProgredir) { try { aoProgredir(1, 1, 'lendo'); } catch(e3){} }
    await pintar();                                  // mostra "lendo..." antes do parse
    return JSON.parse(texto);
  }

  function forcar(n){
    try {
      if(n) localStorage.setItem(CHAVE, n); else localStorage.removeItem(CHAVE);
    } catch(e){}
    return 'recarregue a página para aplicar (' + (n || 'automático') + ')';
  }

  var PERFIL = window.PERFIL = {
    nivel: det.nivel, motivos: det.motivos, bench: det.bench,
    fatiaMs: cfg.fatiaMs, fpsMax: cfg.fpsMax,
    ocupado: 0,
    pintar: pintar, ceder: ceder, emFatias: emFatias,
    medirRender: medirRender, medirTurno: medirTurno, turnoLento: turnoLento,
    intervaloRender: intervaloRender, baixarJSON: baixarJSON, forcar: forcar,
    resumo: function(){
      return 'aparelho ' + det.nivel + ' — ' + det.motivos.join(', ') +
             ' | fatia ' + cfg.fatiaMs + ' ms | 3D até ' + cfg.fpsMax + ' qps' +
             ' | render médio ' + _renderMedio.toFixed(1) + ' ms | turno médio ' + _turnoMedio.toFixed(0) + ' ms';
    }
  };

  try { console.log('[perfil_aparelho] ' + PERFIL.resumo() + ' — pra forçar: PERFIL.forcar("fraco"|"medio"|"forte")'); } catch(e){}
})();
