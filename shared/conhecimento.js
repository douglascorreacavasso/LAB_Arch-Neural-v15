/* ════════════════════════════════════════════════════════════════
   conhecimento.js — conhecimento COMPACTADO do LAB (Wikipédia, dicionário, entidades, regras do português)

   As bases ficam em conhecimento/<base>/ em pedaços .tsv.gz em ordem alfabética + indice.json
   (gerados por ferramentas/montar_conhecimento.py). O navegador baixa só o índice e, quando a
   conversa pergunta "o que é X?", baixa só o pedaço de X (~100 KB), descompacta e responde.
   Nada vai para a memória sem ser pedido: por isso cabe até no celular.

   Quando a resposta vem de uma base, o cérebro APRENDE: a frase "X é ..." entra no grafo pelo
   v112_processar (o grafo cresce com o uso, não com a base inteira de uma vez).

   API:
     CONHECIMENTO.catalogo()                 → Promise do catalogo.json (bases existentes)
     CONHECIMENTO.ativar(base, sim)          → liga/desliga uma base ('wiki','dic','ent','gram')
     CONHECIMENTO.ativas()                   → lista das bases ligadas
     CONHECIMENTO.ehPergunta(texto)          → {termo, tipo} ou null
     CONHECIMENTO.buscar(base, termo)        → Promise [{titulo, texto, extra}] (pode ser vazia)
     CONHECIMENTO.responder(texto)           → Promise {resposta, fonte, base, termo, aprender} ou null
     CONHECIMENTO.aprenderNoGrafo(achado)    → ensina ao cérebro a frase curta do achado

   Autoria: infraestrutura do assistente de código (Claude), 16/11/2026, a pedido do autor.
   ════════════════════════════════════════════════════════════════ */
(function(raiz){
  'use strict';
  if(raiz.CONHECIMENTO) return;

  var PASTA = 'conhecimento/';
  var NOMES = { wiki: 'Wikipédia', dic: 'Dicionário (Cândido de Figueiredo, 1913)', ent: 'Livro de Entidades', gram: 'Regras do português' };
  var ligadas = {};
  var indices = {};          // base -> Promise(indice)
  var pedacos = new Map();   // "base/arquivo" -> Promise(Map chave -> [linhas])
  var MAX_PEDACOS = 10;      // cache pequeno (memória do celular)
  var catalogoP = null;

  function chave(t){
    t = String(t || '').replace(/\s*\([^)]*\)\s*$/, '');
    t = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return t.replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function catalogo(){
    if(!catalogoP){
      catalogoP = fetch(PASTA + 'catalogo.json').then(function(r){ return r.ok ? r.json() : {}; }).catch(function(){ return {}; });
    }
    return catalogoP;
  }

  function indice(base){
    if(!indices[base]){
      indices[base] = fetch(PASTA + base + '/indice.json').then(function(r){
        if(!r.ok) throw new Error('sem índice de ' + base);
        return r.json();
      });
      indices[base].catch(function(){ delete indices[base]; });
    }
    return indices[base];
  }

  async function gunzipTexto(buf){
    var b = new Uint8Array(buf);
    if(!(b[0] === 0x1f && b[1] === 0x8b)) return new TextDecoder('utf-8').decode(b);  // servidor já descompactou
    if(typeof DecompressionStream === 'undefined') throw new Error('este navegador não descompacta gzip (atualize o navegador)');
    var ds = new DecompressionStream('gzip');
    var stream = new Blob([b]).stream().pipeThrough(ds);
    return await new Response(stream).text();
  }

  function pedaco(base, arquivo){
    var k = base + '/' + arquivo;
    if(pedacos.has(k)){
      var p = pedacos.get(k); pedacos.delete(k); pedacos.set(k, p);   // LRU
      return p;
    }
    var prom = fetch(PASTA + base + '/' + arquivo).then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status + ' em ' + k);
      return r.arrayBuffer();
    }).then(gunzipTexto).then(function(txt){
      var m = new Map(), linhas = txt.split('\n');
      for(var i = 0; i < linhas.length; i++){
        var l = linhas[i]; if(!l) continue;
        var p = l.split('\t');
        var lista = m.get(p[0]); if(!lista){ lista = []; m.set(p[0], lista); }
        lista.push({ titulo: p[1] || p[0], texto: p[2] || '', extra: p[3] || '' });
      }
      return m;
    });
    prom.catch(function(){ pedacos.delete(k); });
    pedacos.set(k, prom);
    while(pedacos.size > MAX_PEDACOS){ pedacos.delete(pedacos.keys().next().value); }
    return prom;
  }

  async function buscar(base, termo){
    var k = chave(termo);
    if(!k) return [];
    var ind = await indice(base);
    var lista = ind.indice, lo = 0, hi = lista.length - 1, pos = -1;
    while(lo <= hi){                                  // último pedaço cuja 1ª chave <= k
      var meio = (lo + hi) >> 1;
      if(lista[meio][0] <= k){ pos = meio; lo = meio + 1; } else hi = meio - 1;
    }
    if(pos < 0) return [];
    var m = await pedaco(base, lista[pos][1]);
    return m.get(k) || [];
  }

  // ── perguntas que as bases respondem ─────────────────────────────
  var ARTIGOS = /^(?:o|a|os|as|um|uma|uns|umas)\s+/i;
  var PADROES = [
    { rx: /^\s*(?:o\s+)?que\s+(?:significa|quer\s+dizer)\s+(?:a\s+palavra\s+)?(.+?)\s*\??\s*$/i, tipo: 'significado' },
    { rx: /^\s*(?:qual\s+(?:[eé]\s+)?)?(?:o\s+)?significado\s+d[eoa]s?\s+(?:palavra\s+)?(.+?)\s*\??\s*$/i, tipo: 'significado' },
    { rx: /^\s*defin[ae]\s+(.+?)\s*\??\s*$/i, tipo: 'significado' },
    { rx: /^\s*quem\s+(?:foi|[eé]|era)\s+(.+?)\s*\??\s*$/i, tipo: 'quem' },
    { rx: /^\s*(?:o\s+)?que\s+(?:[eé]|s[aã]o|era|foi|eram)\s+(.+?)\s*\??\s*$/i, tipo: 'oque' },
    { rx: /^\s*(?:me\s+)?(?:fale|fala|conte|conta|explique|explica)(?:-me)?\s+(?:sobre|de|do|da|o\s+que\s+[eé])\s+(.+?)\s*\??\s*$/i, tipo: 'oque' },
    { rx: /^\s*o\s+que\s+(?:voc[eê]|vc)\s+sabe\s+(?:sobre|de|do|da)\s+(.+?)\s*\??\s*$/i, tipo: 'oque' },
    { rx: /^\s*onde\s+fica\s+(.+?)\s*\??\s*$/i, tipo: 'oque' }
  ];
  var NAO_TERMO = /^(isso|isto|aquilo|voc[eê]|vc|eu|ele|ela|n[oó]s|tu|seu nome|meu nome|o seu nome|o meu nome|a vida|tudo|nada)$/i;

  function ehPergunta(texto){
    var t = String(texto || '').trim();
    for(var i = 0; i < PADROES.length; i++){
      var m = t.match(PADROES[i].rx);
      if(m){
        var termo = m[1].replace(ARTIGOS, '').replace(/[?.!]+$/, '').trim();
        if(!termo || termo.length > 60 || NAO_TERMO.test(termo) || /\d\s*[+\-*/x]\s*\d/.test(termo)) return null;
        return { termo: termo, tipo: PADROES[i].tipo };
      }
    }
    return null;
  }

  function primeiraFrase(t, max){
    max = max || 200;
    var m = String(t).match(/^(.{8,}?[.;])(\s|$)/);
    var f = m ? m[1] : String(t);
    return f.length > max ? f.slice(0, max).replace(/\s+\S*$/, '') + '…' : f;
  }

  function variantes(termo){
    var v = [termo];
    if(/s$/i.test(termo) && termo.length > 3) v.push(termo.replace(/s$/i, ''));          // plural simples
    if(/ões$/i.test(termo)) v.push(termo.replace(/ões$/i, 'ão'));
    var cap = termo.charAt(0).toUpperCase() + termo.slice(1);
    if(cap !== termo) v.push(cap);
    return v;
  }

  async function primeiroAchado(base, termo){
    var vs = variantes(termo);
    for(var i = 0; i < vs.length; i++){
      var r = await buscar(base, vs[i]);
      if(r.length){
        // prefere o título sem "(algo)" e igual ao pedido
        var exato = r.filter(function(x){ return !/\(/.test(x.titulo); });
        return { item: (exato[0] || r[0]), outros: r.length - 1 };
      }
    }
    return null;
  }

  async function responder(texto){
    var p = ehPergunta(texto);
    if(!p) return null;
    var ordem = p.tipo === 'significado' ? ['dic', 'ent', 'gram', 'wiki']
              : p.tipo === 'quem' ? ['wiki']
              : ['ent', 'gram', 'wiki', 'dic'];
    for(var i = 0; i < ordem.length; i++){
      var base = ordem[i];
      if(!ligadas[base]) continue;
      var a;
      try { a = await primeiroAchado(base, p.termo); } catch(e){ continue; }
      if(!a) continue;
      var it = a.item, resposta;
      if(base === 'dic') resposta = it.titulo + ' (' + it.extra + '): ' + primeiraFrase(it.texto, 260);
      else if(base === 'wiki') resposta = it.texto;
      else resposta = it.texto + (it.extra ? ' ' + primeiraFrase(it.extra, 220) : '');
      var curta;
      if(base === 'wiki') curta = primeiraFrase(it.texto, 160);
      else if(base === 'dic'){
        var d = primeiraFrase(it.texto, 140);
        curta = it.titulo + ' é ' + d.charAt(0).toLowerCase() + d.slice(1);
      } else {
        // livro: usa a frase da definição que fala do próprio conceito (ela já tem sujeito: "Um apelido é ...")
        var frases = it.texto.split(/(?<=\.)\s+/), alvo = chave(it.titulo).split(' ')[0];
        curta = frases.filter(function(f){ return chave(f).indexOf(alvo) >= 0; })[0] || frases[0];
      }
      return { resposta: resposta, fonte: NOMES[base], base: base, termo: p.termo, titulo: it.titulo,
               outros: a.outros, aprender: curta };
    }
    return null;
  }

  function aprenderNoGrafo(achado){
    if(!achado || !achado.aprender || typeof raiz.v112_processar !== 'function') return false;
    try { raiz.v112_processar(achado.aprender); return true; } catch(e){ return false; }
  }

  // Usado pelo chat (PC e celular): se o cérebro respondeu com "enrolação" (r.fallback) e a frase é uma
  // pergunta que as bases respondem, troca pela resposta da base, ensina a frase curta ao grafo e devolve
  // { texto, tag }. Senão devolve null e o chat mostra a resposta do cérebro como sempre.
  // O cérebro "não sabe" quando dá enrolação (r.fallback) ou só uma corrente de associação
  // ("aquiles → com → peça → quem"), sem um módulo especializado ter tratado a frase.
  function precisaDaBase(r){
    if(!r) return false;
    if(r.fallback) return true;
    var especial = r.tratou || r._estatistico || r._cognitivo || r.reflexo;
    return !especial && /→/.test(String(r.resposta || ''));
  }

  async function completarTurno(texto, r){
    if(!precisaDaBase(r) || !ativas().length || !ehPergunta(texto)) return null;
    var a = null;
    try { a = await responder(texto); } catch(e){ a = null; }
    if(!a) return null;
    var aprendeu = aprenderNoGrafo(a);
    var associacao = (!r.fallback && /→/.test(String(r.resposta || ''))) ? '\n— eu tinha associado: ' + r.resposta : '';
    return { texto: a.resposta + associacao + '\n— fonte: ' + a.fonte + (aprendeu ? ' · aprendi no grafo' : ''), tag: 'con', achado: a };
  }

  function ativar(base, sim){ if(NOMES[base]) ligadas[base] = sim !== false; }
  function ativas(){ return Object.keys(ligadas).filter(function(b){ return ligadas[b]; }); }

  raiz.CONHECIMENTO = { catalogo: catalogo, ativar: ativar, ativas: ativas, ehPergunta: ehPergunta, buscar: buscar,
                        responder: responder, aprenderNoGrafo: aprenderNoGrafo, completarTurno: completarTurno, precisaDaBase: precisaDaBase,
                        chave: chave, NOMES: NOMES };
  if(typeof module !== 'undefined' && module.exports) module.exports = raiz.CONHECIMENTO;
})(typeof window !== 'undefined' ? window : globalThis);
