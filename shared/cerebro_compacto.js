/* ════════════════════════════════════════════════════════════════
   cerebro_compacto.js — lê o cérebro no formato HIPERCOMPACTADO (LAB-CMP-1)

   Mesma ideia do Nerael: cada símbolo guardado uma vez e ligações em colunas de números.
   O arquivo .lab.json é ~4x menor que o JSON de sempre (40,9 MB → 9,7 MB no cérebro completo)
   e SEM PERDA: CEREBRO_COMPACTO.abrir(arquivo) devolve exatamente o mesmo objeto que o
   v112_importar sempre recebeu. Quem gera: ferramentas/cerebro_compacto.py.

   API:
     CEREBRO_COMPACTO.ehCompacto(obj)   → true se for LAB-CMP-1
     CEREBRO_COMPACTO.abrir(obj)        → cérebro no formato normal (objeto comum devolve igual)

   Autoria: infraestrutura do assistente de código (Claude), 16/11/2026, a pedido do autor.
   ════════════════════════════════════════════════════════════════ */
(function(raiz){
  'use strict';
  var FORMATO = 'LAB-CMP-1';

  function copia(v){ return (v !== null && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v; }

  function coluna(c, n){
    var out = new Array(n), i, x;
    if('c' in c){ for(i = 0; i < n; i++) out[i] = copia(c.c); return out; }
    if('b' in c){ for(i = 0; i < n; i++) out[i] = c.b.charCodeAt(i) === 49; return out; }
    if('p' in c){ x = 0; for(i = 0; i < n; i++){ x = i === 0 ? c.dn[0] : x + c.dn[i]; out[i] = c.p + x; } return out; }
    if('d' in c){
      var simples = c.d.every(function(v){ return v === null || typeof v !== 'object'; });
      for(i = 0; i < n; i++) out[i] = simples ? c.d[c.i[i]] : copia(c.d[c.i[i]]);
      return out;
    }
    if('dv' in c){ x = 0; for(i = 0; i < n; i++){ x = i === 0 ? c.dv[0] : x + c.dv[i]; out[i] = x; } return out; }
    return c.v.slice();
  }

  function tabela(t){
    var esq = coluna(t.esq, t.n), conta = t.esquemas.map(function(){ return 0; }), e, i, k;
    for(i = 0; i < esq.length; i++) conta[esq[i]]++;
    var cols = t.esquemas.map(function(chaves, e2){
      var m = {};
      chaves.forEach(function(ch){ m[ch] = coluna(t.colunas[e2][ch], conta[e2]); });
      return m;
    });
    var pos = conta.map(function(){ return 0; }), out = new Array(t.n);
    for(i = 0; i < esq.length; i++){
      e = esq[i]; var j = pos[e]++, o = {}, chaves = t.esquemas[e];
      for(k = 0; k < chaves.length; k++) o[chaves[k]] = cols[e][chaves[k]][j];
      out[i] = o;
    }
    return out;
  }

  function ehCompacto(obj){ return !!(obj && obj.formato === FORMATO && obj.corpo); }

  function abrir(obj){
    if(!ehCompacto(obj)) return obj;
    var out = {};
    obj.chaves.forEach(function(k){
      var p = obj.corpo[k];
      out[k] = ('tabela' in p) ? tabela(p.tabela) : p.valor;
    });
    return out;
  }

  // Baixa um cérebro preferindo a versão compactada: 'cerebro_V15.json' tenta antes 'cerebro_V15.lab.json'.
  // Devolve { cerebro, arquivo } já no formato normal. aoProgredir(lido, total, fase) como PERFIL.baixarJSON.
  async function baixar(arquivo, aoProgredir){
    var tentativas = /\.lab\.json$/.test(arquivo) ? [arquivo] : [arquivo.replace(/\.json$/, '.lab.json'), arquivo];
    var ultimoErro = null;
    for(var i = 0; i < tentativas.length; i++){
      try {
        var obj;
        if(raiz.PERFIL && raiz.PERFIL.baixarJSON) obj = await raiz.PERFIL.baixarJSON(tentativas[i], aoProgredir);
        else { var r = await fetch(tentativas[i]); if(!r.ok){ var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } obj = await r.json(); }
        if(aoProgredir) { try { aoProgredir(1, 1, 'abrindo'); } catch(e2){} }
        if(raiz.PERFIL && raiz.PERFIL.pintar) await raiz.PERFIL.pintar();
        return { cerebro: abrir(obj), arquivo: tentativas[i] };
      } catch(e){ ultimoErro = e; if(!e || !e.status) throw e; }   // só tenta o próximo quando o arquivo não existe
    }
    throw ultimoErro || new Error('cérebro não encontrado: ' + arquivo);
  }

  raiz.CEREBRO_COMPACTO = { ehCompacto: ehCompacto, abrir: abrir, baixar: baixar, FORMATO: FORMATO };
  if(typeof module !== 'undefined' && module.exports) module.exports = raiz.CEREBRO_COMPACTO;
})(typeof window !== 'undefined' ? window : globalThis);
