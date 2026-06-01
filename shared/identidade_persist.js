/* ════════════════════════════════════════════════════════════════
   identidade_persist.js — persiste nome/user/genero no localStorage.
   Resolve o "nome some entre sessoes": o boot recarrega o cerebro embutido
   (nome/user vazios), entao guardamos a identidade ensinada e restauramos.

   - criador NAO entra aqui (e fixo no proprio cerebro).
   - so guarda nome (da IA), user (de quem fala) e genero.

   Carregue DEPOIS do engine (qualquer lugar dos shared):
     <script src="shared/identidade_persist.js"></script>
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(window._identidade_persist) return;
  var KEY = 'arch_identidade_v1';

  function sc(){ return (window.V112 && window.V112.self_core) ? window.V112.self_core : null; }

  function salvar(){
    var s = sc(); if(!s) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({
        nome:   s.nome   || [],
        user:   s.user   || [],
        genero: s.genero || []
      }));
    } catch(e){}
  }

  function restaurar(){
    var s = sc(); if(!s) return false;
    try {
      var raw = localStorage.getItem(KEY); if(!raw) return false;
      var d = JSON.parse(raw); var mudou = false;
      // so preenche se o que ja esta no self_core estiver vazio (nao sobrescreve algo recem-carregado)
      if(d.nome   && d.nome.length   && !(s.nome   && s.nome.length))   { s.nome   = d.nome;   mudou = true; }
      if(d.user   && d.user.length   && !(s.user   && s.user.length))   { s.user   = d.user;   mudou = true; }
      if(d.genero && d.genero.length && !(s.genero && s.genero.length)) { s.genero = d.genero; mudou = true; }
      if(mudou){
        // atualiza o painel SELF-CORE se a UI ja tiver a funcao
        try { if(typeof window.renderSelfCore === 'function') window.renderSelfCore(); } catch(e){}
      }
      return mudou;
    } catch(e){ return false; }
  }

  // restaura assim que possivel e de novo quando o DOM estiver pronto
  // (o boot do app importa o cerebro embutido antes do DOMContentLoaded; restaurar depois disso)
  restaurar();
  if(typeof window.addEventListener === 'function') window.addEventListener('DOMContentLoaded', restaurar);

  // salva apos cada turno que possa ter mudado a identidade
  if(typeof window.v112_processar === 'function' && !window.v112_processar.__id_persist){
    var _o = window.v112_processar;
    window.v112_processar = function(){ var r = _o.apply(this, arguments); try { salvar(); } catch(e){} return r; };
    window.v112_processar.__id_persist = true;
  }

  window._identidade_persist = { salvar: salvar, restaurar: restaurar, KEY: KEY };
  try { console.log('[identidade_persist] ativo — nome/user/genero persistem no localStorage'); } catch(e){}
})();
