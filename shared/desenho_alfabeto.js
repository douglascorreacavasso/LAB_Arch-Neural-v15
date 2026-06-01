/* ════════════════════════════════════════════════════════════════
   desenho_alfabeto.js — DESENHO COMPONÍVEL via alfabeto de primitivos

   Diferença pro desenho_simbolos.js (que tinha lógica hardcoded):
   aqui o conhecimento de COMO desenhar cada coisa é uma RECEITA
   (string de primitivos) guardada como NÓ no grafo → SERIALIZA.

   ARQUITETURA:
   - 1 handler h_compor (código fixo, igual aos 149) = o INTERPRETADOR
   - 31 primitivos (o ALFABETO) embutidos no handler
   - receitas conceito→string guardadas como nós tipo 'receita_desenho'
   - comandos-nó "faz um X" disparam h_compor

   A SACADA: adicionar forma nova = adicionar 1 nó de receita (DADO).
   O motor de criar (B_gerador_comandos) JÁ cria nós → pode criar receitas.
   Não precisa escrever código novo (handler), que é o que ele NÃO consegue.

   Carregue depois do arch_neural:
     <script src="arch_neural_v15_final.js"></script>
     <script src="shared/desenho_alfabeto.js"></script>
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(typeof window==='undefined'){ /* node */ }
  var reg = (typeof window!=='undefined' && window.v112_registrar_handler) || (typeof global!=='undefined' && global.v112_registrar_handler);
  if(!reg){ console.warn('[desenho_alfabeto] arch_neural não carregado'); return; }

  // ───────────────────────────────────────────────────────────
  // ALFABETO — 31 primitivos (26 base + 5 especiais)
  // ───────────────────────────────────────────────────────────
  function larg(g){ return g.reduce(function(m,l){return Math.max(m,l.length)},0); }
  function norm(g){ var w=larg(g); return g.map(function(l){ var c=l.slice(); while(c.length<w)c.push(' '); return c; }); }
  function txt(g){ return g.map(function(l){return l.join('').replace(/\s+$/,'')}).join('\n'); }
  function flipCh(c){ var m={'╱':'╲','╲':'╱','(':')',')':'(','[':']',']':'[','<':'>','>':'<','/':'\\','\\':'/','┌':'┐','┐':'┌','└':'┘','┘':'└'}; return m[c]||c; }

  function circ(r){ var g=[]; for(var y=-r;y<=r;y++){ var l=[]; for(var x=-r;x<=r;x++){ var d=Math.sqrt(x*x+(y*1.6)*(y*1.6)); l.push(Math.abs(d-r)<0.6?'●':' '); } g.push(l);} return g; }
  function tri(n){ var g=[]; for(var i=0;i<n;i++){ var l=[],c=n-1,w=2*n-1; for(var k=0;k<w;k++)l.push(' '); l[c-i]='╱'; l[c+i]='╲'; if(i===n-1)for(var j=c-i;j<=c+i;j++)if(l[j]===' ')l[j]='─'; g.push(l);} return g; }
  function cx(w,h){ var g=[],t=['┌']; for(var a=0;a<w-2;a++)t.push('─'); t.push('┐'); g.push(t); for(var i=0;i<h-2;i++){ var l=['│']; for(var b=0;b<w-2;b++)l.push(' '); l.push('│'); g.push(l);} var u=['└']; for(var c=0;c<w-2;c++)u.push('─'); u.push('┘'); g.push(u); return g; }
  function ondaL(n,f){ f=f||0; var l=[]; for(var i=0;i<n;i++){ var v=Math.sin((i+f)*0.9); l.push(v>0.3?'╱':v<-0.3?'╲':'~'); } return l; }
  function arco(n){ var g=[]; for(var i=0;i<n;i++){ var l=[]; for(var k=0;k<n;k++)l.push(' '); l[i]=i<n/2?'╲':'╱'; g.push(l);} return g; }

  function empilhar(gs){ var out=[],w=0; gs.forEach(function(g){w=Math.max(w,larg(g))}); gs.forEach(function(g){ g.forEach(function(l){ var c=l.slice(); while(c.length<w)c.push(' '); out.push(c);});}); return out; }
  function ladear(gs){ gs=gs.map(norm); var h=0; gs.forEach(function(g){h=Math.max(h,g.length)}); var out=[]; for(var i=0;i<h;i++){ var l=[]; gs.forEach(function(g){ var ln=g[i]||[]; var w=larg(g); var cp=ln.slice(); while(cp.length<w)cp.push(' '); l=l.concat(cp,[' ']);}); out.push(l);} return out; }
  function moldura(g){ g=norm(g); var w=larg(g); var top=['┌']; for(var a=0;a<w;a++)top.push('─'); top.push('┐'); var out=[top]; g.forEach(function(l){out.push(['│'].concat(l,['│']))}); var bot=['└']; for(var b=0;b<w;b++)bot.push('─'); bot.push('┘'); out.push(bot); return out; }
  function repH(g,n){ g=norm(g); return g.map(function(l){ var nl=[]; for(var k=0;k<n;k++)nl=nl.concat(l); return nl; }); }
  function espH(g){ return g.map(function(l){ return l.slice().reverse().map(flipCh); }); }
  function flipV(g){ return g.slice().reverse(); }
  function escalar(g,f){ var out=[]; g.forEach(function(l){ var nl=[]; l.forEach(function(ch){ for(var k=0;k<f;k++)nl.push(ch);}); for(var r=0;r<f;r++)out.push(nl.slice());}); return out; }
  function gradiente(n){ var ch=[' ','.',':','▒','▓','█'],g=[]; for(var i=0;i<n;i++){ var l=[]; for(var j=0;j<n;j++){ l.push(ch[Math.round((j/n)*(ch.length-1))]); } g.push(l);} return g; }

  var ALF = {
    'P':function(){return [['•']]},
    'H':function(n){n=n||5;var l=[];for(var i=0;i<n;i++)l.push('─');return [l]},
    'V':function(n){n=n||3;var g=[];for(var i=0;i<n;i++)g.push(['│']);return g},
    'O':function(r){return circ(r||3)},
    'B':function(w,h){w=w||3;h=h||3;var g=[];for(var i=0;i<h;i++){var l=[];for(var j=0;j<w;j++)l.push('█');g.push(l);}return g},
    'T':function(n){return tri(n||3)},
    'Q':function(w,h){return cx(w||4,h||3)},
    'W':function(n){return [ondaL(n||7,0)]},
    'S':function(){return [[' ','*',' '],['*','*','*'],[' ','*',' ']]},
    'C':function(n){return arco(n||3)},
    'D':function(n){n=n||3;var g=[];for(var i=0;i<n;i++){var l=[];for(var k=0;k<n;k++)l.push(' ');l[n-1-i]='╱';g.push(l);}return g},
    'E':function(n){n=n||3;var g=[];for(var i=0;i<n;i++){var l=[];for(var k=0;k<n;k++)l.push(' ');l[i]='╲';g.push(l);}return g},
    'L':function(n){n=n||4;var g=[];for(var i=0;i<n;i++){var l=[];for(var k=0;k<n;k++)l.push(' ');for(var j=0;j<=i;j++)l[j]='╱';g.push(l);}return g},
    'R':function(g,n){return repH(g,n||2)},
    'M':function(g){return espH(g)},
    'F':function(g){return flipV(g)},
    'U':function(){return empilhar(Array.prototype.slice.call(arguments))},
    'J':function(){return ladear(Array.prototype.slice.call(arguments))},
    'G':function(g){return moldura(g)},
    'K':function(g,w){g=norm(g);var gw=larg(g);w=w||gw+4;var p=Math.max(0,Math.floor((w-gw)/2));return g.map(function(l){var pad=[];for(var i=0;i<p;i++)pad.push(' ');return pad.concat(l);})},
    'X':function(g,f){return escalar(g,f||2)},
    'I':function(g){return g.map(function(l){return l.map(function(c){return c===' '?'█':c==='█'?' ':c})})},
    'N':function(g,n){n=n||1;return g.map(function(l){var pad=[];for(var i=0;i<n;i++)pad.push(' ');return pad.concat(l);})},
    'Y':function(a,b){a=norm(a);b=norm(b);var h=Math.max(a.length,b.length),w=Math.max(larg(a),larg(b)),out=[];for(var y=0;y<h;y++){var l=[];for(var x=0;x<w;x++){var cb=(b[y]&&b[y][x])||' ';var ca=(a[y]&&a[y][x])||' ';l.push(cb!==' '?cb:ca);}out.push(l);}return out},
    'Z':function(g,ch){ch=ch||'█';return g.map(function(l){return l.map(function(c){return c===' '?c:ch})})},
    'A':function(g){return moldura(g)},
    '@':function(v){v=v||8;var N=2*v+1,g=[];for(var i=0;i<N;i++){var r=[];for(var j=0;j<N;j++)r.push(' ');g.push(r);}var x=v,y=v,dx=1,dy=0,ps=1,c=0,tr=0;for(var k=0;k<v*v*2;k++){if(x>=0&&x<N&&y>=0&&y<N)g[y][x]='•';x+=dx;y+=dy;c++;if(c===ps){c=0;var t=dx;dx=-dy;dy=t;tr++;if(tr%2===0)ps++;}}return g},
    '#':function(n){return gradiente(n||5)},
    '&':function(p){p=p||3;var L=[];for(var i=1;i<=p;i++){var sp='';for(var s=0;s<p-i;s++)sp+=' ';var mid='';for(var m=0;m<2*i-1;m++)mid+='─';L.push((sp+'╱'+mid+'╲').split(''));}var st='';for(var z=0;z<p-1;z++)st+=' ';L.push((st+'│││').split(''));return L},
    '%':function(g,seed){var s=seed||1;function rnd(){s=(s*9301+49297)%233280;return s/233280;}return g.map(function(l){return l.map(function(c){return c!==' '&&rnd()<0.2?'·':c})})},
    '~':function(n,f){return [ondaL(n||7,f||0)]}
  };

  // ───────────────────────────────────────────────────────────
  // COMPOSITOR — interpreta receita string
  // ───────────────────────────────────────────────────────────
  function compor(receita){
    var pos=0;
    function expr(){
      while(receita[pos]===' ')pos++;
      if(/[0-9.\-]/.test(receita[pos])){ var num=''; while(pos<receita.length&&/[0-9.\-]/.test(receita[pos])){num+=receita[pos];pos++;} return Number(num); }
      var letra=receita[pos]; pos++;
      var fn=ALF[letra];
      if(!fn) throw new Error("letra desconhecida: '"+letra+"'");
      if(receita[pos]==='('){ pos++; var partes=[]; while(receita[pos]!==')'&&pos<receita.length){ partes.push(expr()); while(receita[pos]===' ')pos++; if(receita[pos]===';')pos++; } pos++; return fn.apply(null,partes); }
      if(receita[pos]===':'){ pos++; var a=''; while(pos<receita.length&&/[0-9,.\-]/.test(receita[pos])){a+=receita[pos];pos++;} return fn.apply(null,a.split(',').map(Number)); }
      return fn();
    }
    return txt(norm(expr()));
  }

  // ───────────────────────────────────────────────────────────
  // RECEITAS PADRÃO — guardadas como NÓS no grafo (serializam!)
  // ───────────────────────────────────────────────────────────
  var RECEITAS_PADRAO = {
    'coracao':   'U(O:2;F(T:3))',          // círculos em cima + ponta embaixo (aproximação)
    'casa':      'U(T:5;Q:9,4)',           // telhado + parede
    'arvore':    '&:4',                     // copa fractal
    'estrela':   'S',
    'rosto':     'U(J(O:2;O:2);H:7)',       // olhos + boca
    'pessoa':    'U(O:2;Q:5,4)',            // cabeça + corpo
    'caixa':     'Q:6,4',
    'porta':     'Q:7,9',
    'sol':       'O:4',
    'onda':      'R(W:6;3)',
    'losango':   'U(T:4;F(T:4))',
    'espiral':   '@:5',
    'montanha':  'J(T:4;T:5)',              // dois picos
    'flor':      'U(S;V:2)',                // estrela + caule
    'cerca':     'R(Q:3,3;5)',
  };

  function V(){ return (typeof window!=='undefined'&&window.V112)||(typeof global!=='undefined'&&global.V112); }
  var criarNo = (typeof window!=='undefined'&&window.v112_node) || (typeof global!=='undefined'&&global.v112_node);

  // Garante que cada receita exista como NÓ (idempotente)
  function garantirReceitas(){
    var v=V(); if(!v||!v.nodes) return 0;
    var criados=0;
    for(var conceito in RECEITAS_PADRAO){
      var existe = v.nodes.some(function(n){ return n.tipo==='receita_desenho' && n._conceito===conceito; });
      if(!existe){
        var id = 'n_'+(v._next_node_id++);
        v.nodes.push({
          id:id, text:'[receita:'+conceito+']', tipo:'receita_desenho',
          _conceito:conceito, _receita:RECEITAS_PADRAO[conceito],
          camada:'cortex', pos:[0,0,0], mass:1, acumulador:0
        });
        criados++;
      }
    }
    return criados;
  }

  // Busca a receita de um conceito (primeiro no grafo, depois no padrão)
  function buscarReceita(conceito){
    var v=V();
    if(v&&v.nodes){
      var no = v.nodes.find(function(n){ return n.tipo==='receita_desenho' && n._conceito===conceito; });
      if(no&&no._receita) return no._receita;
    }
    return RECEITAS_PADRAO[conceito]||null;
  }

  // Lista TODOS os conceitos conhecidos (padrão + nós de receita do grafo)
  function conceitosConhecidos(){
    var conceitos = Object.keys(RECEITAS_PADRAO);
    var v=V();
    if(v&&v.nodes){
      v.nodes.forEach(function(n){
        if(n.tipo==='receita_desenho' && n._conceito && conceitos.indexOf(n._conceito)===-1){
          conceitos.push(n._conceito);
        }
      });
    }
    return conceitos;
  }

  // Extrai conceito do input ("faz um coração" → "coracao")
  function extrairConceito(input){
    var t=String(input).toLowerCase()
      .replace(/ç/g,'c').replace(/ã/g,'a').replace(/á/g,'a').replace(/â/g,'a')
      .replace(/é/g,'e').replace(/ê/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ô/g,'o').replace(/ú/g,'u');
    var conceitos = conceitosConhecidos();
    for(var i=0;i<conceitos.length;i++){
      if(t.indexOf(conceitos[i])!==-1) return conceitos[i];
    }
    // sinônimos
    if(/cora|coracao/.test(t)) return 'coracao';
    if(/face|cara|rosto/.test(t)) return 'rosto';
    if(/humano|gente|pessoa/.test(t)) return 'pessoa';
    return null;
  }

  // ───────────────────────────────────────────────────────────
  // O HANDLER (código fixo, igual aos 149) — o INTERPRETADOR
  // ───────────────────────────────────────────────────────────
  reg('h_compor', function(m, input){
    var conceito = extrairConceito(input);
    if(!conceito) return { resposta_direta:'(não sei desenhar isso ainda — me ensina a receita)', desenho:null };
    var receita = buscarReceita(conceito);
    if(!receita) return { resposta_direta:'(conceito sem receita: '+conceito+')', desenho:null };
    try {
      var arte = compor(receita);
      return { resposta_direta: arte, desenho:conceito, receita:receita };
    } catch(e){
      return { resposta_direta:'(erro na receita "'+receita+'": '+e.message+')', desenho:null };
    }
  });

  // ───────────────────────────────────────────────────────────
  // COMANDOS-NÓ — disparam h_compor (idempotente)
  // ───────────────────────────────────────────────────────────
  function temCmd(nome){ var v=V(); return v&&(v.nodes||[]).some(function(n){return n.tipo==='comando'&&n.text==='_cmd_'+nome;}); }
  function garantirComandos(){
    var criar = (typeof window!=='undefined'&&window.v112_comando_criar_no)||(typeof global!=='undefined'&&global.v112_comando_criar_no);
    if(!criar||!V()) return;
    // regex restrita: verbo de desenho + "um/uma" (evita roubar "mostra o que sabe", "faz 5+3")
    if(!temCmd('comp_desenhar')) criar('\\b(desenh\\w+|faz|fazer|cria\\w*)\\s+(um|uma)\\s','h_compor',{prioridade:95,nome:'comp_desenhar',origem:'alfabeto'});
  }

  // ───────────────────────────────────────────────────────────
  // API pública: ENSINAR nova forma em runtime (vira nó serializável)
  // ───────────────────────────────────────────────────────────
  function ensinarForma(conceito, receita){
    var v=V(); if(!v) return false;
    conceito = conceito.toLowerCase();
    // valida receita
    try { compor(receita); } catch(e){ console.warn('[desenho] receita inválida:', e.message); return false; }
    RECEITAS_PADRAO[conceito] = receita;
    var no = v.nodes.find(function(n){ return n.tipo==='receita_desenho' && n._conceito===conceito; });
    if(no){ no._receita = receita; }
    else {
      v.nodes.push({ id:'n_'+(v._next_node_id++), text:'[receita:'+conceito+']', tipo:'receita_desenho', _conceito:conceito, _receita:receita, camada:'cortex', pos:[0,0,0], mass:1, acumulador:0 });
    }
    return true;
  }

  // ── inicialização ──
  function init(){ garantirReceitas(); garantirComandos(); }
  init();
  if(typeof window!=='undefined'){
    if(window.V112 && (!window.V112.nodes || window.V112.nodes.length===0)){
      window.addEventListener('DOMContentLoaded', init);
    }
    window.DESENHO_ALFABETO = { ALF:ALF, compor:compor, ensinarForma:ensinarForma, buscarReceita:buscarReceita, RECEITAS:RECEITAS_PADRAO, garantirReceitas:garantirReceitas };
  }
  if(typeof global!=='undefined'){
    global.DESENHO_ALFABETO = { ALF:ALF, compor:compor, ensinarForma:ensinarForma, buscarReceita:buscarReceita, RECEITAS:RECEITAS_PADRAO, garantirReceitas:garantirReceitas, init:init };
  }
})();
