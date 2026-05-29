/* ════════ NEREAL_PATCH_FUSAO_QUASE_IDENTICOS_V1 ════════
   Funde nós QUASE-idênticos (variação de grafia/caixa/acento/pontuação) durante a meditação.
   Filosofia: grafo de QUALIDADE, não de variedade. NÃO deleta conhecimento único — só
   consolida o que é o MESMO conceito escrito diferente. Soma massa, migra arestas.
   3 SALVAGUARDAS contra lixo lógico:
     1) só agrupa se a CHAVE NORMALIZADA for igual (mesma palavra, só grafia/caixa/acento difere) — bem conservador.
     2) CONTEXTO: se os dois forem densos e os vizinhos quase não se sobrepõem -> NÃO funde (provável sentido diferente).
     3) QUARENTENA: borderline não funde; fica marcado _fusao_quarentena pra revisão.
   O original absorvido NÃO é deletado: vira dormente com _fundido_em (recuperável).
   Roda no fim da meditação (v112_sleep_replay) e também via window.v112_fundir_quase_identicos(). */
(function(){
  'use strict';
  if(typeof window === 'undefined' || window._fusao_qi_v1) return;
  if(typeof window.v112_sleep_replay !== 'function') return;
  var V = window.V112; if(!V) return;

  function norm(t){
    if(!t) return '';
    return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').trim();
  }
  // SÓ funde linguagem natural. Nunca regra/regex/marcador/handler/módulo/código.
  function ehTextoNatural(t){
    if(!t) return false;
    if(/^[\[_]/.test(t)) return false;                 // [marcadores], _regra_, _funcoes
    if(/^(B_|H_|M_|n_|p_|e_)/.test(t)) return false;   // nós de sistema/handler/módulo/porta
    if(/[\\(){}|^$*+<>]/.test(t)) return false;        // metacaracteres de regex/código
    if(/\?\:|\\s|\\b|\\d|\\w/.test(t)) return false;    // fragmentos de regex
    return true;
  }
  function vizinhos(id){
    var s = {};
    for(var i=0;i<V.edges.length;i++){ var e=V.edges[i];
      if(e.from===id) s[e.to]=1; else if(e.to===id) s[e.from]=1; }
    return s;
  }
  function overlap(a,b){
    var ka=Object.keys(a), kb=Object.keys(b);
    if(ka.length===0 || kb.length===0) return 1; // variante recém-nascida sem vizinhos = compatível
    var inter=0; for(var i=0;i<ka.length;i++) if(b[ka[i]]) inter++;
    return inter/Math.min(ka.length,kb.length);
  }

  function fundirQuaseIdenticos(opts){
    opts = opts || {};
    var MIN_OVERLAP = (opts.minOverlap != null) ? opts.minOverlap : 0.34;
    var DENSO = (opts.denso != null) ? opts.denso : 6;
    var GRACE = (opts.graceCiclos != null) ? opts.graceCiclos : 1;  // ciclos de carência antes de deletar de vez
    var rel = { grupos:0, fundidos:0, quarentena:0, apagados:0 };

    // contador de ciclos de meditação/fusão
    V._fusao_ciclo = (V._fusao_ciclo || 0) + 1;
    var cic = V._fusao_ciclo;

    // GC: o original já fundido que passou da carência é DELETADO de vez (só o conceito final fica).
    // Evita acumular dormidos. Seguro: as arestas dele já foram migradas; limpamos resíduos defensivamente.
    if(GRACE >= 0){
      var mortos = {};
      for(var gi=0; gi<V.nodes.length; gi++){ var gn=V.nodes[gi];
        if(gn._fundido_em && gn._fundido_ciclo != null && (cic - gn._fundido_ciclo) > GRACE){
          mortos[gn.id] = 1; rel.apagados++;
        }
      }
      if(rel.apagados > 0){
        V.nodes = V.nodes.filter(function(n){ return !mortos[n.id]; });
        V.edges = V.edges.filter(function(e){ return !mortos[e.from] && !mortos[e.to]; });
      }
    }

    var grupos = {};
    for(var i=0;i<V.nodes.length;i++){ var n=V.nodes[i];
      if(!n.text || n._dormindo || n._fundido_em) continue;
      if(!n.id || typeof n.id !== 'string') continue;   // sem id válido -> nunca funde
      if(n.camada === 'self_core') continue;            // nunca mexe no SELF-CORE
      if(!ehTextoNatural(n.text)) continue;             // só linguagem natural
      var k = norm(n.text); if(!k) continue;
      (grupos[k] = grupos[k] || []).push(n);
    }

    for(var k in grupos){
      var g = grupos[k]; if(g.length < 2) continue;
      var rawset = {}; for(var j=0;j<g.length;j++) rawset[g[j].text] = 1;
      if(Object.keys(rawset).length < 2) continue;    // todos raw iguais = exato (não é "quase")
      rel.grupos++;
      g.sort(function(a,b){ return (b.mass||0)-(a.mass||0); });   // canônico = maior massa
      var canon = g[0]; var vc = vizinhos(canon.id);
      for(var x=1;x<g.length;x++){
        var c = g[x]; var vv = vizinhos(c.id);
        var ov = overlap(vc, vv);
        var ambosDensos = (Object.keys(vc).length > DENSO && Object.keys(vv).length > DENSO);
        if(ambosDensos && ov < MIN_OVERLAP){            // SALVAGUARDA 2/3
          c._fusao_quarentena = canon.id; rel.quarentena++; continue;
        }
        // FUNDE: migra arestas pro canônico (dedup+engrossa, sem self-loop), soma massa, aposenta original
        var canonAdj = {};
        for(var e=0;e<V.edges.length;e++){ var ed=V.edges[e];
          if(ed.from===canon.id) canonAdj[ed.to]=ed; else if(ed.to===canon.id) canonAdj[ed.from]=ed; }
        var remover = [];
        for(var e=0;e<V.edges.length;e++){ var ed=V.edges[e];
          if(ed.from!==c.id && ed.to!==c.id) continue;
          var other = (ed.from===c.id) ? ed.to : ed.from;
          if(other===canon.id){ remover.push(e); continue; }          // viraria self-loop -> remove
          if(canonAdj[other]){                                         // já existe -> engrossa o peso e remove dup
            canonAdj[other].peso = (canonAdj[other].peso||1) + (ed.peso||1);
            remover.push(e); continue;
          }
          if(ed.from===c.id) ed.from=canon.id; else ed.to=canon.id;    // reaponta pro canônico
          canonAdj[other] = ed;
        }
        for(var rr=remover.length-1;rr>=0;rr--) V.edges.splice(remover[rr],1);
        canon.mass = (canon.mass||1) + (c.mass||1);
        canon._funditos = (canon._funditos||0) + 1;
        c._dormindo = true; c._fundido_em = canon.id; c._fundido_ciclo = cic;  // dorme; deletado após carência
        rel.fundidos++;
        var nvv = vizinhos(canon.id); for(var key in nvv) vc[key]=1;
      }
    }
    if(V._edges_idx_from !== undefined){ V._edges_idx_from=null; V._edges_idx_to=null; }
    return rel;
  }

  window.v112_fundir_quase_identicos = fundirQuaseIdenticos;

  // HOOK: roda a fusão DEPOIS da meditação normal
  var orig = window.v112_sleep_replay;
  window.v112_sleep_replay = function(){
    var r = orig.apply(this, arguments);
    try {
      var f = fundirQuaseIdenticos();
      if(typeof console !== 'undefined') console.log('[fusao_qi] grupos=' + f.grupos + ' fundidos=' + f.fundidos + ' quarentena=' + f.quarentena + ' apagados=' + f.apagados);
    } catch(e){}
    return r;
  };
  window._fusao_qi_v1 = true;
  try { console.log('[fusao_qi] instalado — funde quase-idênticos na meditação (3 salvaguardas, sem deletar)'); } catch(e){}
})();
/* ════════ FIM NEREAL_PATCH_FUSAO_QUASE_IDENTICOS_V1 ════════ */
