/* ════════ NEREAL_PATCH_POSICIONAR_NOS_V1 ════════
   Corrige o bug do 3D depois de ensinar: nós criados em runtime nascem em [0,0,0]
   (v112_node usa pos: opts.pos || [0,0,0]) e empilham no centro, fazendo as arestas
   virarem um leque caótico ao girar a câmera.
   Aqui posicionamos os "órfãos de posição": cada nó-texto em [0,0,0] (que NÃO seja o
   self_core) ganha posição perto da média dos vizinhos já posicionados (+ leve jitter
   determinístico). Sem vizinhos posicionados -> posição numa esfera, por hash do id.
   Roda no fim da meditação e via window.v112_posicionar_orfaos(). Idempotente e sem NaN. */
(function(){
  'use strict';
  if(typeof window === 'undefined' || window._posicionar_nos_v1) return;
  var V = window.V112; if(!V) return;

  function quaseZero(p){ return !p || (Math.abs(p[0])<1e-6 && Math.abs(p[1])<1e-6 && Math.abs(p[2])<1e-6); }
  function hash(str){ var h=2166136261; str=String(str); for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0); }
  function jitter(id, amp){ var h=hash(id); return ((h%1000)/1000 - 0.5) * 2 * amp; }

  function posicionarOrfaos(opts){
    opts = opts || {};
    var RAIO = (opts.raio != null) ? opts.raio : 60;   // raio da esfera p/ quem não tem vizinho
    var JIT  = (opts.jitter != null) ? opts.jitter : 6; // dispersão ao redor do centróide
    var rel = { posicionados:0, porVizinho:0, porEsfera:0 };

    // índice id -> nó (posição atual)
    var byId = {};
    for(var i=0;i<V.nodes.length;i++){ var n=V.nodes[i]; if(n && n.id) byId[n.id]=n; }

    // vizinhos por nó (só precisamos dos órfãos)
    for(var k=0;k<V.nodes.length;k++){
      var n = V.nodes[k];
      if(!n || !n.text) continue;
      if(n.camada === 'self_core') continue;          // self_core fica no centro absoluto
      if(!quaseZero(n.pos)) continue;                  // já tem posição -> não mexe

      // coleta vizinhos posicionados
      var sx=0, sy=0, sz=0, cnt=0;
      for(var e=0;e<V.edges.length;e++){ var ed=V.edges[e];
        var other = null;
        if(ed.from===n.id) other=ed.to; else if(ed.to===n.id) other=ed.from; else continue;
        var vn = byId[other];
        if(vn && vn.pos && !quaseZero(vn.pos)){ sx+=vn.pos[0]; sy+=vn.pos[1]; sz+=vn.pos[2]; cnt++; }
      }

      if(cnt > 0){
        n.pos = [ sx/cnt + jitter(n.id+'x', JIT),
                  sy/cnt + jitter(n.id+'y', JIT),
                  sz/cnt + jitter(n.id+'z', JIT) ];
        rel.porVizinho++;
      } else {
        // esfera determinística por hash (Fibonacci-ish), evita empilhar
        var h = hash(n.id);
        var theta = (h % 360) * Math.PI/180;
        var phi   = ((h>>>9) % 180) * Math.PI/180;
        n.pos = [ RAIO*Math.sin(phi)*Math.cos(theta),
                  RAIO*Math.cos(phi),
                  RAIO*Math.sin(phi)*Math.sin(theta) ];
        rel.porEsfera++;
      }
      // saneamento anti-NaN
      if(!isFinite(n.pos[0])||!isFinite(n.pos[1])||!isFinite(n.pos[2])) n.pos=[jitter(n.id,RAIO),jitter(n.id+'b',RAIO),jitter(n.id+'c',RAIO)];
      rel.posicionados++;
    }
    return rel;
  }

  window.v112_posicionar_orfaos = posicionarOrfaos;

  // roda DEPOIS da meditação (e a meditação roda de tempos em tempos)
  if(typeof window.v112_sleep_replay === 'function'){
    var orig = window.v112_sleep_replay;
    window.v112_sleep_replay = function(){
      var r = orig.apply(this, arguments);
      try { var p = posicionarOrfaos(); if(p.posicionados>0 && typeof console!=='undefined') console.log('[posicionar_nos] posicionados='+p.posicionados+' (vizinho='+p.porVizinho+' esfera='+p.porEsfera+')'); } catch(e){}
      return r;
    };
  }
  window._posicionar_nos_v1 = true;
  try { console.log('[posicionar_nos] instalado — nós de runtime deixam de empilhar em [0,0,0]'); } catch(e){}
})();
/* ════════ FIM NEREAL_PATCH_POSICIONAR_NOS_V1 ════════ */
