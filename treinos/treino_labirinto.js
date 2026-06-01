/* ════════════════════════════════════════════════════════════════
   treinos/treino_labirinto.js — LABIRINTO SIMBOLICO 10 NIVEIS (browser)
   Inspirado em utils/labirinto_test.py (portado, nao linha-a-linha).

   A IA navega uma matriz (sem pixels). Comeca TOTAL ESCURO (so sente a
   parede colada). A cada nivel o RAIO de sensacao cresce... mas o labirinto
   fica MAIOR e ganha armadilhas. Cada passo vira um texto de SENSACAO que
   alimenta v112_processar (treina). Politica de movimento e reflexa (anda
   na direcao do objetivo desviando do que sente).

   10 niveis:
     1  raio 0  (so cola)      5x5
     2  raio 1                 6x6
     3  raio 1 + 1 armadilha   7x7
     4  raio 2                 8x8
     5  raio 2 + 2 armadilhas  9x9
     6  raio 2 + 1 perseguidor 10x10
     7  raio 3 + armadilhas    11x11
     8  raio 3 + perseguidor   12x12
     9  raio 3 + 2 persegs     13x13
     10 raio 4 + tudo          14x14

   Para sozinho: 10 niveis ou teto de passos por nivel.
   API: window.TREINO_LABIRINTO.run({maxPassosNivel:300, log:fn})
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(typeof window === 'undefined') return;
  function P(txt){ try { if(typeof window.v112_processar === 'function') return window.v112_processar(txt); } catch(e){} return null; }
  function rnd(n){ return Math.floor(Math.random()*n); }
  function _yield(){ return new Promise(function(res){ if(typeof setTimeout==='function') setTimeout(res,0); else res(); }); }


  var NIVEIS=[
    {n:1, tam:5,  raio:0, traps:0, pers:0},
    {n:2, tam:6,  raio:1, traps:0, pers:0},
    {n:3, tam:7,  raio:1, traps:1, pers:0},
    {n:4, tam:8,  raio:2, traps:1, pers:0},
    {n:5, tam:9,  raio:2, traps:2, pers:0},
    {n:6, tam:10, raio:2, traps:2, pers:1},
    {n:7, tam:11, raio:3, traps:3, pers:1},
    {n:8, tam:12, raio:3, traps:3, pers:1},
    {n:9, tam:13, raio:3, traps:4, pers:2},
    {n:10,tam:14, raio:4, traps:5, pers:2}
  ];

  // gera labirinto simples: bordas = parede; ~22% paredes internas; garante start/goal livres
  function gerar(tam, traps){
    var g=[]; for(var y=0;y<tam;y++){ var row=[]; for(var x=0;x<tam;x++){
      var parede = (x===0||y===0||x===tam-1||y===tam-1) || (Math.random()<0.22);
      row.push(parede?'#':'.');
    } g.push(row); }
    g[1][1]='.'; g[tam-2][tam-2]='.';
    // arma armadilhas em celulas livres
    var t=0, guard=0;
    while(t<traps && guard++<tam*tam){ var x=1+rnd(tam-2), y=1+rnd(tam-2);
      if(g[y][x]==='.' && !(x===1&&y===1) && !(x===tam-2&&y===tam-2)){ g[y][x]='T'; t++; } }
    return g;
  }
  function livre(g,x,y){ return g[y] && g[y][x] && g[y][x]!=='#'; }

  // sensacao: o que a IA SENTE em volta dentro do raio (paredes por direcao) + direcao do objetivo
  function sentir(g, px, py, gx, gy, raio){
    var dirs={N:[0,-1],S:[0,1],L:[1,0],O:[-1,0]}, sente=[];
    for(var d in dirs){
      var dist=null;
      for(var r=1;r<=Math.max(1,raio)+ (raio===0?0:0); r++){
        var nx=px+dirs[d][0]*r, ny=py+dirs[d][1]*r;
        if(!g[ny]||!g[ny][nx]||g[ny][nx]==='#'){ dist=r; break; }
        if(raio===0) break; // escuro: so a celula colada
      }
      if(raio===0){ var ax=px+dirs[d][0], ay=py+dirs[d][1]; sente.push(d+(livre(g,ax,ay)?':livre':':parede')); }
      else sente.push(d+(dist?(':parede a '+dist):':aberto'));
    }
    var rumo = (gx>px?'leste':(gx<px?'oeste':''))+(gy>py?' sul':(gy<py?' norte':''));
    return 'sinto '+sente.join(', ')+'. objetivo a '+rumo.trim();
  }

  // politica reflexa: tenta ir na direcao do objetivo; se parede, desvia
  function decidir(g, px, py, gx, gy){
    var cand=[];
    if(gx>px) cand.push([1,0]); else if(gx<px) cand.push([-1,0]);
    if(gy>py) cand.push([0,1]); else if(gy<py) cand.push([0,-1]);
    cand=cand.concat([[1,0],[-1,0],[0,1],[0,-1]]);
    for(var i=0;i<cand.length;i++){ var nx=px+cand[i][0], ny=py+cand[i][1]; if(livre(g,nx,ny)) return [nx,ny,cand[i]]; }
    return [px,py,[0,0]];
  }

  async function run(opts){
    opts=opts||{};
    var maxPassos = opts.maxPassosNivel || 160;
    var log = (typeof opts.log==='function')?opts.log:function(){};
    var nosAntes=(window.V112&&window.V112.nodes)?window.V112.nodes.length:0;
    var rel=[], resolvidos=0, passosTot=0;

    for(var k=0;k<NIVEIS.length;k++){
      var L=NIVEIS[k];
      var g=gerar(L.tam, L.traps);
      var px=1,py=1, gx=L.tam-2, gy=L.tam-2, passos=0, achou=false, caiu=0;
      P('labirinto nivel '+L.n+' comecando. raio de visao '+L.raio+'. '+(L.raio===0?'tudo escuro, so sinto o que encosto.':'sinto paredes ate '+L.raio+' de distancia.'));
      var visitados={};
      while(passos<maxPassos){
        passos++; passosTot++; if(passos%20===0) await _yield();
        var s=sentir(g,px,py,gx,gy,L.raio);
        if(passos % 6 === 0) P(s);                // <- TREINA (amostra 1/6 dos passos + eventos)
        var mv=decidir(g,px,py,gx,gy);
        // anti-loop leve: se ja visitou muito, faz passo aleatorio livre
        var key=px+','+py; visitados[key]=(visitados[key]||0)+1;
        if(visitados[key]>3){ var alt=[[1,0],[-1,0],[0,1],[0,-1]].filter(function(d){return livre(g,px+d[0],py+d[1]);}); if(alt.length){ var d2=alt[rnd(alt.length)]; mv=[px+d2[0],py+d2[1],d2]; } }
        px=mv[0]; py=mv[1];
        if(g[py][px]==='T'){ caiu++; P('cai numa armadilha. preciso sentir melhor antes de andar.'); }
        if(px===gx && py===gy){ achou=true; break; }
      }
      if(achou){ resolvidos++; P('sai do labirinto nivel '+L.n+' em '+passos+' passos. aprendi o caminho.'); }
      else P('nao sai do nivel '+L.n+' a tempo. preciso de mais sensacao.');
      rel.push({nivel:L.n, raio:L.raio, tam:L.tam, passos:passos, armadilhas:caiu, resolvido:achou});
      log('nivel '+L.n+' (raio '+L.raio+', '+L.tam+'x'+L.tam+'): '+(achou?'RESOLVIDO':'falhou')+' em '+passos+' passos, '+caiu+' armadilhas');
    }
    var nosDepois=(window.V112&&window.V112.nodes)?window.V112.nodes.length:0;
    return { nome:'labirinto', niveis:NIVEIS.length, resolvidos:resolvidos, passosTotais:passosTot,
             detalhe:rel, nosCriados:(nosDepois-nosAntes) };
  }

  window.TREINO_LABIRINTO = { run: run };
  window.TREINOS_ADAPT = window.TREINOS_ADAPT || [];
  window.TREINOS_ADAPT.push({ nome:'labirinto', run:run });
  try { console.log('[treino_labirinto] pronto — 10 niveis — window.TREINO_LABIRINTO.run()'); } catch(e){}
})();
