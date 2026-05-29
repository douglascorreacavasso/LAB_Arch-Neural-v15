/* ════════════════════════════════════════════════════════════════
   desenho_simbolos.js — o ÚNICO primitivo de I/O do desenho.
   Carregue DEPOIS do arch_neural_v15_final.js:
     <script src="arch_neural_v15_final.js"></script>
     <script src="shared/desenho_simbolos.js"></script>

   Faz duas coisas (só isso):
   1. Registra o handler 'h_desenhar' no V112_HANDLERS (handlers não
      serializam — por isso precisa ser registrado no load, igual o
      arch_neural faz com os 142 handlers padrão).
   2. Garante que os comandos-nó de desenho existem no cérebro (idempotente).

   A partir daí, o PRÓPRIO cérebro desenha via v112_processar:
     "faz um coração"  → coração em símbolos no tamanho que cabe + quadros do pulso
     "faz uma porta"   → porta fechada
     "abre ela"        → porta abrindo em QUADROS (blocos de texto)

   AUTO-DETECÇÃO: mede #chat-content ao vivo; sem DOM usa a medida aprendida.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(!window.v112_registrar_handler){ console.warn('[desenho] arch_neural não carregado ainda'); return; }

  // ── geradores: formas só de símbolos ──
  function heart(scale, ch){
    const out=[]; const yT=Math.round(1.3*scale), yB=Math.round(-1.45*scale);
    for(let y=yT;y>=yB;y--){ let l='';
      for(let x=Math.round(-1.7*scale);x<=Math.round(1.7*scale);x++){
        const xn=x/scale, yn=(y/scale)*0.92;
        const v=Math.pow(xn*xn+yn*yn-1,3)-xn*xn*Math.pow(yn,3);
        l += (v<=0)?ch:' ';
      } out.push(l.replace(/\s+$/,''));
    }
    while(out.length&&!out[0].trim())out.shift();
    while(out.length&&!out[out.length-1].trim())out.pop();
    return out.join('\n');
  }
  function door(t, mc){
    const W=Math.max(6, Math.min(18, mc-4)), H=9;
    const dw=Math.max(1, Math.round(W*(1-t*0.93)));
    const rows=[' .'+'-'.repeat(W)+'. '];
    for(let r=0;r<H;r++){
      let f = t<0.02 ? '#'.repeat(dw) : '#'.repeat(Math.max(0,dw-1))+(dw>1?'\\':'');
      if(t<0.55 && r===4 && dw>2) f=f.slice(0,dw-2)+'o'+f.slice(dw-1);
      const lw=W-f.length; let lt=''; for(let c=0;c<lw;c++){ const d=c/Math.max(1,lw); lt += d<0.16?':':(d<0.5?'.':' '); }
      rows.push(' |'+f+lt+'| ');
    }
    rows.push(" '"+'-'.repeat(W)+"' ");
    return rows.join('\n');
  }
  // AUTO-DETECTA a área de texto; fallback = medida aprendida
  function maxCols(){
    try{
      var el = document.getElementById('chat-content') || document.querySelector('.ph-chat-content') || document.getElementById('chat');
      if(el && el.clientWidth){
        var px = el.clientWidth*0.80 - 24;   // bolha .ph-msg-b: 80% - paddings
        return Math.max(8, Math.floor(px/6.2)); // ~6.2px por caractere monospace
      }
    }catch(e){}
    return 26; // a "própria medida" aprendida
  }
  function fitPeak(mc){ for(let s=14;s>=3;s--){ if(2*Math.round(1.7*s)+1<=mc) return s; } return 3; }

  // ── o primitivo ──
  window.v112_registrar_handler('h_desenhar', function(m, input){
    var mc = maxCols(); var t = String(input).toLowerCase();
    if(/\b(abre|abrir)\b/.test(t)){
      var fr=[0,.25,.5,.75,1].map(function(x){return door(x,mc);});
      return { resposta_direta: fr.join('\n— — —\n'), desenho:'porta_abre', area:mc };
    }
    if(/porta/.test(t)){ return { resposta_direta: door(0,mc), desenho:'porta', area:mc }; }
    var peak=fitPeak(mc), base=Math.max(3,peak-2);
    var seq=[base,base+1,peak,base+1,base].map(function(s){return heart(s,'*');});
    return { resposta_direta: seq.join('\n· · ·\n'), desenho:'coracao', area:mc };
  });

  // ── garante os comandos-nó (idempotente) ──
  function temCmd(nome){ return (window.V112 && V112.nodes||[]).some(function(n){return n.tipo==='comando'&&n.text==='_cmd_'+nome;}); }
  function garantir(){
    if(!window.v112_comando_criar_no || !window.V112) return;
    if(!temCmd('desenhar_coracao')) v112_comando_criar_no('\\b(faz|fazer|desenh\\w+|cria\\w*)\\b.*\\bcora','h_desenhar',{prioridade:150,nome:'desenhar_coracao',origem:'desenho_simbolo'});
    if(!temCmd('criar_porta'))      v112_comando_criar_no('\\b(faz|fazer|cria\\w*)\\b.*\\bporta','h_desenhar',{prioridade:150,nome:'criar_porta',origem:'desenho_simbolo'});
    if(!temCmd('abrir_porta'))      v112_comando_criar_no('\\b(abre|abrir)\\b.*(porta|ela)','h_desenhar',{prioridade:152,nome:'abrir_porta',origem:'desenho_simbolo'});
  }
  // tenta agora; se o cérebro ainda não importou, tenta de novo no load
  garantir();
  if(window.V112 && (!V112.nodes || V112.nodes.length===0)){
    window.addEventListener('DOMContentLoaded', garantir);
  }

  window.DESENHO = { heart:heart, door:door, maxCols:maxCols, fitPeak:fitPeak };
})();
