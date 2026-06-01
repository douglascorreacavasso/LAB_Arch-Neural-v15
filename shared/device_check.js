/* ════════════════════════════════════════════════════════════════
   device_check.js — detecta se o aparelho é fraco e escolhe o cérebro.

   Carregue DEPOIS do arch_neural, ANTES dos scripts que carregam cérebro:
     <script src="arch_neural_v15_final.js"></script>
     <script src="shared/device_check.js"></script>

   Expõe:
     window.escolherCerebro()  → 'cerebro_V15.1.json' (leve) ou 'cerebro_V15.json' (pesado)
     window.aparelhoEhFraco()  → true/false + razões no console
     window.carregarCerebroAuto(cb) → faz fetch do escolhido, com fallback

   REGRA:
     - Aparelho FRACO  → tenta cerebro_V15.1.json (leve). Se não existir, cai no pesado.
     - Aparelho FORTE  → usa cerebro_V15.json (pesado/completo).
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ── Detecta se o aparelho é fraco ──
  window.aparelhoEhFraco = function(){
    // Override manual: localStorage 'arch_forcar_cerebro' = 'leve' | 'pesado'
    try {
      var forcar = (localStorage.getItem('arch_forcar_cerebro') || '').toLowerCase();
      if(forcar === 'leve'){ console.log('[device_check] forçado pelo usuário: LEVE'); return true; }
      if(forcar === 'pesado' || forcar === 'mega' || forcar === 'forte'){ console.log('[device_check] forçado pelo usuário: PESADO'); return false; }
    } catch(e){}

    var cores = navigator.hardwareConcurrency || 4;     // desconhecido = assume OK (otimista)
    var ram   = navigator.deviceMemory || 0;            // RAM em GB (só Chrome/Android; 0 = desconhecido, ex. iOS)
    var largura = (window.screen && window.screen.width) || 360;
    var ua = (navigator.userAgent || '').toLowerCase();
    var ehMobile = /android|iphone|ipad|ipod|mobile/.test(ua);

    var razoes = [];
    var fraco = false;

    // Só marca FRACO em casos GENUINAMENTE fracos (antes era conservador demais):
    if(cores <= 2){ fraco = true; razoes.push('CPU ' + cores + ' núcleos'); }   // 1–2 núcleos
    if(ram > 0 && ram < 3){ fraco = true; razoes.push('RAM ' + ram + 'GB'); }   // <3GB (só se o browser informou)
    if(largura < 320){ fraco = true; razoes.push('tela ' + largura + 'px'); }   // só telas minúsculas/antigas

    // OBS: removidas as duas heurísticas antigas que derrubavam aparelhos capazes —
    //   (a) tela < 400px pegava QUALQUER celular em retrato;
    //   (b) mobile + sem deviceMemory pegava iPhones e Androids bons (que não reportam RAM).

    try {
      console.log('[device_check] CPU=' + cores + ' núcleos | RAM=' + (ram||'?') + 'GB | tela=' + largura + 'px | mobile=' + ehMobile);
      console.log('[device_check] veredito: ' + (fraco ? 'FRACO' : 'FORTE') + (razoes.length ? ' (' + razoes.join(', ') + ')' : '') + ' — pra forçar: localStorage.setItem("arch_forcar_cerebro","pesado")');
    } catch(e){}

    return fraco;
  };

  // ── Escolhe qual cérebro carregar ──
  window.escolherCerebro = function(){
    return window.aparelhoEhFraco() ? 'cerebro_V15.1.json' : 'cerebro_V15.json';
  };

  // ── Carrega o cérebro escolhido, com fallback pro pesado se o leve faltar ──
  // cb(resultado) onde resultado = {ok, arquivo, nos} ou {ok:false, erro}
  // setLabel opcional: function(titulo, sub) pra mostrar progresso
  window.carregarCerebroAuto = async function(cb, setLabel){
    var preferido = window.escolherCerebro();
    var tentativas = preferido === 'cerebro_V15.1.json'
      ? ['cerebro_V15.1.json', 'cerebro_V15.json']  // fraco: tenta leve, cai no pesado
      : ['cerebro_V15.json'];                        // forte: só o pesado

    for(var i = 0; i < tentativas.length; i++){
      var arquivo = tentativas[i];
      try {
        if(setLabel) setLabel('🧠 Carregando cérebro...', 'tentando ' + arquivo + '...');
        var r = await fetch(arquivo);
        if(!r.ok){
          if(setLabel) setLabel('🧠 Carregando cérebro...', arquivo + ' não achado (HTTP ' + r.status + ')');
          continue;  // tenta o próximo
        }
        if(setLabel) setLabel('🧠 Carregando cérebro...', 'parseando ' + arquivo + '...');
        var c = await r.json();
        if(setLabel) setLabel('🧠 Carregando cérebro...', 'importando ' + (c.nodes ? c.nodes.length : 0) + ' nós...');
        if(window.v112_importar) window.v112_importar(c);
        var res = { ok: true, arquivo: arquivo, nos: (c.nodes ? c.nodes.length : 0), leve: (arquivo === 'cerebro_V15.1.json') };
        if(cb) cb(res);
        return res;
      } catch(e){
        if(setLabel) setLabel('🧠 Carregando cérebro...', 'erro em ' + arquivo + ': ' + e.message);
        // tenta o próximo
      }
    }
    var fail = { ok: false, erro: 'nenhum cérebro carregou (usando o embutido)' };
    if(cb) cb(fail);
    return fail;
  };

  try { console.log('[device_check] carregado — escolherCerebro() pronto'); } catch(e){}
})();
