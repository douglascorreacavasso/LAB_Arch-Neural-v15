/* ════════════════════════════════════════════════════════════════
   treinos/treino_benchmark.js — BENCHMARK EVOLUTIVO ADAPTATIVO (browser)
   Inspirado em utils/auto_benchmark.py (portado, nao linha-a-linha).

   Ideia: uma "mini-IA geradora" cria desafios logicos cada vez mais
   dificeis (com pegadinhas/armadilhas). A rede responde via v112_processar
   (treina de verdade). Acertou -> dificuldade sobe. Quando a geradora NAO
   consegue mais produzir um desafio NOVO e mais dificil, PARA (nao roda
   pra sempre).

   Categorias: logica, sequencia, matematica, armadilha (sem solucao/ambigua),
               einstein (deducao), metacognicao.

   API:  window.TREINO_BENCHMARK.run({maxNivel:20, tentativasGerar:12, log:fn})
   Registra em window.TREINOS_ADAPT.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(typeof window === 'undefined') return;

  function P(txt){ try { if(typeof window.v112_processar === 'function') return window.v112_processar(txt); } catch(e){} return null; }
  function resp(r){ return String((r && (r.resposta || r.resposta_direta)) || '').toLowerCase(); }
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }
  function _yield(){ return new Promise(function(res){ if(typeof setTimeout==='function') setTimeout(res,0); else res(); }); }


  // ── geradores por categoria. cada um recebe nivel (1..N) e devolve {pergunta, gabarito, armadilha?} ──
  function gLogica(n){
    var nomes=['ana','beto','caio','duda','eva','foca','gil','hugo'];
    var a=pick(nomes), b=pick(nomes.filter(function(x){return x!==a;}));
    var rel = n<5 ? 'mais alto que' : (n<10?'mais velho que':'mais rapido que');
    return { pergunta:'se '+a+' e '+rel+' '+b+', quem e o menor?', gabarito:b };
  }
  function gSequencia(n){
    var passo = 1 + rnd(Math.min(9, 1+Math.floor(n/2)));
    var ini = rnd(5), k = 3 + Math.min(5, Math.floor(n/3));
    var seq=[], v=ini; for(var i=0;i<k;i++){ seq.push(v); v+=passo; }
    return { pergunta:'qual o proximo numero: '+seq.join(', ')+', ?', gabarito:String(v) };
  }
  function gMatematica(n){
    var esc = Math.pow(10, 1+Math.floor(n/4));
    var a = 2+rnd(esc), b = 2+rnd(esc);
    var op = n<6 ? '+' : (n<12?'-':'*');
    var g = op==='+'?a+b : op==='-'?a-b : a*b;
    return { pergunta:'quanto e '+a+' '+op+' '+b+'?', gabarito:String(g) };
  }
  function gArmadilha(n){
    // problemas SEM solucao / ambiguos: o certo e NAO chutar
    var t=[
      'qual a cor invisivel do numero sete?',
      'quantos lados tem um circulo quadrado?',
      'se ontem fosse amanha, que dia e hoje sem calendario?',
      'qual o peso exato da palavra silencio?'
    ];
    return { pergunta:pick(t), gabarito:'(sem resposta)', armadilha:true };
  }
  function gEinstein(n){
    // deducao curta: 3 itens, uma pista
    var casas=['vermelha','azul','verde'], pets=['gato','cao','passaro'];
    var i=rnd(3);
    return { pergunta:'casa '+casas[i]+' tem o '+pets[i]+'. quem mora na casa '+casas[i]+' tem qual pet?', gabarito:pets[i] };
  }
  function gMetacog(n){
    return { pergunta:'voce tem certeza absoluta da ultima resposta? responda sim ou nao com humildade.', gabarito:'nao' };
  }
  var GERADORES = { logica:gLogica, sequencia:gSequencia, matematica:gMatematica, armadilha:gArmadilha, einstein:gEinstein, metacognicao:gMetacog };
  var CATS = Object.keys(GERADORES);

  function avaliar(des, r){
    var rr = resp(r);
    if(des.armadilha){
      // acerta se admite que nao sabe / nao chuta
      return /(nao sei|n\u00e3o sei|sem resposta|nao faz sentido|n\u00e3o faz sentido|imposs|nao da|talvez)/.test(rr);
    }
    var g = String(des.gabarito).toLowerCase();
    return rr.indexOf(g) !== -1;
  }

  async function run(opts){
    opts = opts || {};
    var maxNivel = opts.maxNivel || 20;
    var tentativasGerar = opts.tentativasGerar || 12;  // qtas vezes tenta gerar um desafio NOVO antes de desistir
    var maxRodadas = opts.maxRodadas || 600;            // teto duro de seguranca
    var log = (typeof opts.log==='function') ? opts.log : function(){};

    var nivel = 1, vistos = {}, rodadas = 0;
    var ok=0, erro=0, subiu=0, porCat={};
    var nosAntes = (window.V112 && window.V112.nodes) ? window.V112.nodes.length : 0;

    while(nivel <= maxNivel && rodadas < maxRodadas){
      // a geradora tenta criar um desafio NOVO neste nivel
      var des=null, tent=0;
      while(tent < tentativasGerar){
        tent++;
        var cat = pick(CATS);
        var d = GERADORES[cat](nivel); d.cat = cat; d.nivel = nivel;
        var chave = nivel+'|'+d.pergunta;
        if(!vistos[chave]){ vistos[chave]=1; des=d; break; }
      }
      if(!des){
        // NAO conseguiu gerar nada novo/mais dificil -> PARA (nao roda pra sempre)
        log('geradora esgotou no nivel '+nivel+' — encerrando.');
        break;
      }
      rodadas++; if(rodadas%6===0) await _yield();
      var r = P(des.pergunta);                 // <- TREINA a rede
      var acertou = avaliar(des, r);
      porCat[des.cat] = porCat[des.cat] || {ok:0,total:0}; porCat[des.cat].total++;
      if(acertou){ ok++; porCat[des.cat].ok++; }
      else erro++;
      log('N'+nivel+' ['+des.cat+'] '+(acertou?'OK':'X')+' :: '+des.pergunta.slice(0,60));
      // ensina o gabarito (reforco) salvo armadilha
      if(!des.armadilha) P(des.pergunta.replace(/\?.*/,'')+' = '+des.gabarito);
      // adaptativo: acertou -> sobe; errou demais seguido no nivel -> tambem sobe (pra nao travar)
      if(acertou){ nivel++; subiu++; }
    }

    var nosDepois = (window.V112 && window.V112.nodes) ? window.V112.nodes.length : 0;
    return { nome:'benchmark', nivelFinal:Math.min(nivel,maxNivel), subiu:subiu, ok:ok, erro:erro,
             rodadas:rodadas, porCat:porCat, nosCriados:(nosDepois-nosAntes), parouPorEsgotar:(nivel<=maxNivel && rodadas<maxRodadas) };
  }

  window.TREINO_BENCHMARK = { run: run };
  window.TREINOS_ADAPT = window.TREINOS_ADAPT || [];
  window.TREINOS_ADAPT.push({ nome:'benchmark', run:run });
  try { console.log('[treino_benchmark] pronto — window.TREINO_BENCHMARK.run()'); } catch(e){}
})();
