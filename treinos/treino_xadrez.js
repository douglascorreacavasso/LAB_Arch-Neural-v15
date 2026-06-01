/* ════════════════════════════════════════════════════════════════
   treinos/treino_xadrez.js — XADREZ EVOLUTIVO (browser)
   Inspirado em utils/xadrez_test.py (portado, nao linha-a-linha).

   Motor de xadrez COMPACTO (sem libs). A Nerael joga de brancas com uma
   politica fixa (material 1-ply) e ENFRENTA oponentes que ficam mais fortes:
     nivel 1 RANDOM | 2 captura-gulosa | 3 material 1-ply | 4 minimax 2-ply | 5 minimax 3-ply
   Vence N seguidas -> sobe de nivel. Cada lance/posicao vira texto e alimenta
   v112_processar (treina). Para sozinho ao passar do nivel 5 ou no teto de partidas.

   Simplificacoes honestas: sem roque, sem en passant, promocao sempre a dama.
   API: window.TREINO_XADREZ.run({partidasMax:60, vitoriasParaSubir:3, log:fn})
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(typeof window === 'undefined') return;
  function P(txt){ try { if(typeof window.v112_processar === 'function') return window.v112_processar(txt); } catch(e){} return null; }
  var VAL={p:1,n:3,b:3,r:5,q:9,k:0};
  function isW(c){ return c!=='.' && c===c.toUpperCase(); }
  function isB(c){ return c!=='.' && c===c.toLowerCase(); }
  function inb(x,y){ return x>=0&&x<8&&y>=0&&y<8; }
  function _yield(){ return new Promise(function(res){ if(typeof setTimeout==='function') setTimeout(res,0); else res(); }); }


  function inicial(){
    return [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];
  }
  function clone(b){ return b.map(function(r){return r.slice();}); }

  // gera lances pseudo-legais de quem (white=true)
  function pseudo(b, white){
    var mv=[], dir=white?-1:1;
    for(var y=0;y<8;y++) for(var x=0;x<8;x++){
      var c=b[y][x]; if(c==='.') continue;
      if(white && !isW(c)) continue; if(!white && !isB(c)) continue;
      var t=c.toLowerCase();
      if(t==='p'){
        if(inb(x,y+dir)&&b[y+dir][x]==='.'){ mv.push([x,y,x,y+dir]);
          var base=white?6:1; if(y===base&&b[y+2*dir][x]==='.') mv.push([x,y,x,y+2*dir]); }
        [[-1,dir],[1,dir]].forEach(function(d){ var nx=x+d[0],ny=y+dir; if(inb(nx,ny)){ var o=b[ny][nx]; if(o!=='.'&&(white?isB(o):isW(o))) mv.push([x,y,nx,ny]); } });
      } else if(t==='n'){
        [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(function(d){ var nx=x+d[0],ny=y+d[1]; if(inb(nx,ny)){ var o=b[ny][nx]; if(o==='.'||(white?isB(o):isW(o))) mv.push([x,y,nx,ny]); } });
      } else if(t==='k'){
        [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(d){ var nx=x+d[0],ny=y+d[1]; if(inb(nx,ny)){ var o=b[ny][nx]; if(o==='.'||(white?isB(o):isW(o))) mv.push([x,y,nx,ny]); } });
      } else {
        var dirs=[]; if(t==='b'||t==='q') dirs=dirs.concat([[1,1],[1,-1],[-1,1],[-1,-1]]); if(t==='r'||t==='q') dirs=dirs.concat([[1,0],[-1,0],[0,1],[0,-1]]);
        dirs.forEach(function(d){ var nx=x+d[0],ny=y+d[1]; while(inb(nx,ny)){ var o=b[ny][nx]; if(o==='.'){ mv.push([x,y,nx,ny]); } else { if(white?isB(o):isW(o)) mv.push([x,y,nx,ny]); break; } nx+=d[0]; ny+=d[1]; } });
      }
    }
    return mv;
  }
  function aplica(b,m){ var nb=clone(b), c=nb[m[1]][m[0]]; nb[m[3]][m[2]]=c; nb[m[1]][m[0]]='.';
    // promocao
    if(c==='P'&&m[3]===0) nb[m[3]][m[2]]='Q'; if(c==='p'&&m[3]===7) nb[m[3]][m[2]]='q'; return nb; }
  function achaRei(b,white){ var k=white?'K':'k'; for(var y=0;y<8;y++)for(var x=0;x<8;x++) if(b[y][x]===k) return [x,y]; return null; }
  function atacado(b,x,y,porBrancas){ // (x,y) e atacado por peca de 'porBrancas'? (direcionado, rapido)
    var PA=porBrancas?'P':'p', KN=porBrancas?'N':'n', BI=porBrancas?'B':'b', RO=porBrancas?'R':'r', QU=porBrancas?'Q':'q', KI=porBrancas?'K':'k', i, nx, ny, c;
    var pr=porBrancas?y+1:y-1;                               // linha do peao atacante
    if(inb(x-1,pr)&&b[pr][x-1]===PA) return true;
    if(inb(x+1,pr)&&b[pr][x+1]===PA) return true;
    var kn=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
    for(i=0;i<8;i++){ nx=x+kn[i][0]; ny=y+kn[i][1]; if(inb(nx,ny)&&b[ny][nx]===KN) return true; }
    var kd=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    for(i=0;i<8;i++){ nx=x+kd[i][0]; ny=y+kd[i][1]; if(inb(nx,ny)&&b[ny][nx]===KI) return true; }
    var dd=[[1,1],[1,-1],[-1,1],[-1,-1]];
    for(i=0;i<4;i++){ nx=x+dd[i][0]; ny=y+dd[i][1]; while(inb(nx,ny)){ c=b[ny][nx]; if(c!=='.'){ if(c===BI||c===QU) return true; break; } nx+=dd[i][0]; ny+=dd[i][1]; } }
    var od=[[1,0],[-1,0],[0,1],[0,-1]];
    for(i=0;i<4;i++){ nx=x+od[i][0]; ny=y+od[i][1]; while(inb(nx,ny)){ c=b[ny][nx]; if(c!=='.'){ if(c===RO||c===QU) return true; break; } nx+=od[i][0]; ny+=od[i][1]; } }
    return false; }
  function legais(b,white){
    var ps=pseudo(b,white), out=[];
    for(var i=0;i<ps.length;i++){ var nb=aplica(b,ps[i]); var rk=achaRei(nb,white); if(!rk) continue; if(!atacado(nb,rk[0],rk[1],!white)) out.push(ps[i]); }
    return out;
  }
  function material(b,white){ var s=0; for(var y=0;y<8;y++)for(var x=0;x<8;x++){ var c=b[y][x]; if(c==='.')continue; var v=VAL[c.toLowerCase()]; s += isW(c)?v:-v; } return white?s:-s; }

  function minimax(b, prof, maximizando, ladoBrancas, alpha, beta){
    if(prof===0) return material(b, ladoBrancas);
    var turnoBrancas = maximizando ? ladoBrancas : !ladoBrancas;
    var mv=legais(b, turnoBrancas);
    if(mv.length===0){ var rk=achaRei(b,turnoBrancas); if(rk&&atacado(b,rk[0],rk[1],!turnoBrancas)) return maximizando?-9999:9999; return 0; }
    if(maximizando){ var best=-1e9; for(var i=0;i<mv.length;i++){ var v=minimax(aplica(b,mv[i]),prof-1,false,ladoBrancas,alpha,beta); if(v>best)best=v; if(v>alpha)alpha=v; if(beta<=alpha)break; } return best; }
    else { var best2=1e9; for(var j=0;j<mv.length;j++){ var v2=minimax(aplica(b,mv[j]),prof-1,true,ladoBrancas,alpha,beta); if(v2<best2)best2=v2; if(v2<beta)beta=v2; if(beta<=alpha)break; } return best2; }
  }

  function escolheMelhor(b, white, prof){ // escolhe lance que maximiza material apos minimax
    var mv=legais(b,white); if(mv.length===0) return null; var best=mv[0], bv=-1e9;
    for(var i=0;i<mv.length;i++){ var v=minimax(aplica(b,mv[i]), prof-1, false, white, -1e9, 1e9); if(v>bv){ bv=v; best=mv[i]; } } return best;
  }
  // oponentes (jogam de pretas, white=false)
  function opp(nivel, b){
    var mv=legais(b,false); if(mv.length===0) return null;
    if(nivel===1) return mv[Math.floor(Math.random()*mv.length)];
    if(nivel===2){ // captura gulosa
      var caps=mv.filter(function(m){return b[m[3]][m[2]]!=='.';}); if(caps.length){ caps.sort(function(a,c){return VAL[b[c[3]][c[2]].toLowerCase()]-VAL[b[a[3]][a[2]].toLowerCase()];}); return caps[0]; } return mv[Math.floor(Math.random()*mv.length)]; }
    return escolheMelhor(b,false, nivel===3?1:2);
  }

  function casa(x,y){ return 'abcdefgh'[x]+(8-y); }
  function fenLinha(b){ var s=''; for(var y=0;y<8;y++){ for(var x=0;x<8;x++) s+= b[y][x]==='.'?'.':b[y][x]; s+='/'; } return s; }

  async function partida(nivel, treina){
    var b=inicial(), ply=0, MAXPLY=70;
    while(ply<MAXPLY){
      // Nerael (brancas) — politica material 1-ply
      var mb=escolheMelhor(b,true,1);
      if(!mb){ var rk=achaRei(b,true); if(rk&&atacado(b,rk[0],rk[1],false)) return 'derrota'; return 'empate'; }
      if(treina && ply%4===0) P('xadrez n'+nivel+': posicao '+fenLinha(b)+' jogo '+casa(mb[0],mb[1])+casa(mb[2],mb[3]));
      b=aplica(b,mb); ply++;
      // oponente (pretas)
      var mo=opp(nivel,b);
      if(!mo){ var rk2=achaRei(b,false); if(rk2&&atacado(b,rk2[0],rk2[1],true)) return 'vitoria'; return 'empate'; }
      b=aplica(b,mo); ply++;
      if(ply%10===0) await _yield();
    }
    // por material no fim
    var m=material(b,true); return m>1?'vitoria':(m<-1?'derrota':'empate');
  }

  async function run(opts){
    opts=opts||{};
    var partidasMax=opts.partidasMax||24;
    var vitoriasParaSubir=opts.vitoriasParaSubir||3;
    var log=(typeof opts.log==='function')?opts.log:function(){};
    var nosAntes=(window.V112&&window.V112.nodes)?window.V112.nodes.length:0;
    var nivel=1, seguidas=0, jogadas=0, v=0, d=0, e=0, subiu=0, porNivel={};
    while(jogadas<partidasMax && nivel<=5){
      jogadas++;
      var res=await partida(nivel, jogadas%6===0); await _yield(); // treina 1 a cada 3 (xadrez e pesado)
      porNivel[nivel]=porNivel[nivel]||{v:0,d:0,e:0}; porNivel[nivel][res[0]]++;
      if(res==='vitoria'){ v++; seguidas++; P('venci uma partida de xadrez no nivel '+nivel); }
      else { if(res==='derrota')d++; else e++; seguidas=0; }
      log('partida '+jogadas+' nivel '+nivel+': '+res+' (seguidas '+seguidas+')');
      if(seguidas>=vitoriasParaSubir){ nivel++; subiu++; seguidas=0; P('subi de nivel no xadrez: agora nivel '+nivel); }
    }
    var nosDepois=(window.V112&&window.V112.nodes)?window.V112.nodes.length:0;
    return { nome:'xadrez', nivelFinal:Math.min(nivel,5), partidas:jogadas, vitorias:v, derrotas:d, empates:e,
             subiu:subiu, porNivel:porNivel, nosCriados:(nosDepois-nosAntes), passouTudo:(nivel>5) };
  }

  window.TREINO_XADREZ = { run: run };
  window.TREINOS_ADAPT = window.TREINOS_ADAPT || [];
  window.TREINOS_ADAPT.push({ nome:'xadrez', run:run });
  try { console.log('[treino_xadrez] pronto — window.TREINO_XADREZ.run()'); } catch(e){}
})();
