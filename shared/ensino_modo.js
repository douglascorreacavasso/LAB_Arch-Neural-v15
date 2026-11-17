/* ════════════════════════════════════════════════════════════════
   ensino_modo.js — escolha do cérebro: JÁ ENSINADO COMPLETO ou TREINAR DESDE O BÁSICO

   ⚡ já ensinado: baixa o cérebro pronto (cerebro_V15_ensinado.lab.json — o completo de 7.000 frases
      mais o núcleo de Entidades, Regras do português, Dicionário e Wikipédia), liga a consulta das 4
      bases e o ENSINAR fica concluído. Se o ensinado ainda não foi gerado, usa o completo (cerebro_V15).
   🌱 desde o básico: volta ao cérebro leve embutido, desliga as bases e o ENSINAR recomeça do 240;
      depois do 7000 vêm Entidades → Regras → Dicionário → Wikipédia (cada pacote liga a sua base).

   API: ENSINO_MODO.usarEnsinado()  ENSINO_MODO.desdeBasico()  ENSINO_MODO.modo()  ENSINO_MODO.aoMudar(fn)

   Autoria: infraestrutura do assistente de código (Claude), 16/11/2026, a pedido do autor.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(window.ENSINO_MODO) return;

  var BASES = ['ent', 'gram', 'dic', 'wiki'];
  var modoAtual = 'basico';
  var ouvintes = [];
  var embutidoTexto = null;
  try { embutidoTexto = JSON.stringify(window._ARCH_CEREBRO_JSON); } catch(e){}   // cópia limpa do embutido

  // botões do PC: rótulo do modo, botão ENSINAR e caixinhas das bases
  function atualizarTela(){
    var bm = document.getElementById('btn-modo-cerebro');
    if(bm) bm.textContent = modoAtual === 'ensinado' ? '⚡ ensinado ▾' : '🌱 básico ▾';
    var bt = document.getElementById('btn-treinar');
    if(bt && window.TREINO){
      if(window.TREINO.acabou()){ bt.innerHTML = '🎓 acabou'; bt.disabled = true; bt.style.background = 'rgba(251,191,36,0.15)'; }
      else { bt.innerHTML = '📚 ' + window.TREINO.labelProximo(); bt.disabled = false; bt.style.background = ''; }
    }
    renderBases();
  }

  function renderBases(){
    var el = document.getElementById('bases-conhecimento');
    if(!el || !window.CONHECIMENTO) return;
    window.CONHECIMENTO.catalogo().then(function(cat){
      var ativas = window.CONHECIMENTO.ativas();
      var html = BASES.map(function(b){
        var c = cat[b];
        if(!c) return '<div style="opacity:.45">○ ' + window.CONHECIMENTO.NOMES[b] + ' — ainda não gerada</div>';
        var on = ativas.indexOf(b) >= 0;
        return '<label style="display:block;cursor:pointer"><input type="checkbox" data-base="' + b + '"' + (on ? ' checked' : '') +
               '> ' + window.CONHECIMENTO.NOMES[b] + ' <span style="opacity:.6">(' + Number(c.verbetes).toLocaleString('pt-BR') + ')</span></label>';
      }).join('');
      el.innerHTML = html;
      el.querySelectorAll('input[data-base]').forEach(function(cb){
        cb.addEventListener('click', function(ev){ ev.stopPropagation(); });
        cb.addEventListener('change', function(){ window.CONHECIMENTO.ativar(cb.getAttribute('data-base'), cb.checked); });
      });
    });
  }

  function avisar(){
    atualizarTela();
    ouvintes.forEach(function(fn){ try { fn(modoAtual); } catch(e){} });
    ['renderStats', 'renderPalavras', 'renderEventos', 'renderSelfCore', 'updateHeader', '_updCerebroInd',
     'atualizarBadges', 'desenharCerebro', 'atualizarLabelBotaoEnsinar'].forEach(function(f){
      try { if(typeof window[f] === 'function') window[f](); } catch(e){}
    });
  }
  function msg(txt){
    try { if(typeof window.addMsg === 'function') window.addMsg('brain', txt, 'sleep'); } catch(e){}
  }

  async function usarEnsinado(){
    if(!window.LOADING || !window.CEREBRO_COMPACTO) return;
    await window.LOADING.run('⚡ Carregando cérebro já ensinado...', async function(setProgress, setLabel){
      var arquivo = 'cerebro_V15_ensinado.lab.json', res = null;
      var prog = function(lido, total, fase){
        if(fase === 'baixando'){ setProgress(lido, total); setLabel('⚡ Carregando cérebro já ensinado...', 'baixando ' + (lido/1048576).toFixed(1) + ' de ' + (total/1048576).toFixed(1) + ' MB'); }
        else if(fase === 'lendo') setLabel('⚡ Carregando cérebro já ensinado...', 'lendo o arquivo compactado...');
        else setLabel('⚡ Carregando cérebro já ensinado...', 'abrindo (formato hipercompactado)...');
      };
      try { res = await window.CEREBRO_COMPACTO.baixar(arquivo, prog); }
      catch(e){
        if(!e || !e.status) throw e;
        setLabel('⚡ Carregando cérebro já ensinado...', 'o ensinado ainda não foi gerado; usando o completo...');
        res = await window.CEREBRO_COMPACTO.baixar('cerebro_V15.json', prog);
      }
      setLabel('⚡ Carregando cérebro já ensinado...', 'importando ' + (res.cerebro.nodes ? res.cerebro.nodes.length : 0) + ' nós...');
      if(window.PERFIL) await window.PERFIL.pintar();
      window.v112_importar(res.cerebro);
      window._cerebroAtual = res.arquivo;
      var cat = window.CONHECIMENTO ? await window.CONHECIMENTO.catalogo() : {};
      var ligadas = [];
      BASES.forEach(function(b){ if(cat[b] && window.CONHECIMENTO){ window.CONHECIMENTO.ativar(b, true); ligadas.push(window.CONHECIMENTO.NOMES[b]); } });
      if(window.TREINO) window.TREINO.setNivel(window.TREINO.PACOTES.length);
      modoAtual = 'ensinado';
      msg('⚡ Cérebro já ensinado carregado (' + res.cerebro.nodes.length + ' nós' +
          (/ensinado/.test(res.arquivo) ? '' : ' — versão completa; o núcleo das bases ainda está sendo gerado') +
          '). Consulto na conversa: ' + (ligadas.join(', ') || 'nenhuma base encontrada') + '. Pergunte "o que é...?", "quem foi...?" ou "o que significa...?".');
    }, 'preparando...');
    avisar();
  }

  async function desdeBasico(){
    if(!window.LOADING) return;
    await window.LOADING.run('🌱 Voltando ao cérebro básico...', async function(){
      if(!embutidoTexto) throw new Error('cérebro embutido indisponível');
      window.v112_importar(JSON.parse(embutidoTexto));
      window._cerebroAtual = 'embutido';
      if(window.CONHECIMENTO) BASES.forEach(function(b){ window.CONHECIMENTO.ativar(b, false); });
      if(window.TREINO) window.TREINO.reset();
      modoAtual = 'basico';
      msg('🌱 Cérebro básico (' + window.V112.nodes.length + ' nós). Use ENSINAR: 240 → 500 → 1000 → 2000 → 7000 → Entidades → Regras → Dicionário → Wikipédia. Cada pacote de base também liga a consulta dela.');
    });
    avisar();
  }

  // depois de cada pacote do ENSINAR, as caixinhas mostram a base que acabou de ligar
  setTimeout(function(){
    if(window.TREINO && !window.TREINO.__modo_hook){
      var orig = window.TREINO.ensinarProximo;
      window.TREINO.ensinarProximo = function(){
        return Promise.resolve(orig.apply(this, arguments)).then(function(r){ try { atualizarTela(); } catch(e){} return r; });
      };
      window.TREINO.__modo_hook = true;
    }
    atualizarTela();
  }, 700);

  window.ENSINO_MODO = {
    usarEnsinado: usarEnsinado, desdeBasico: desdeBasico, atualizarTela: atualizarTela,
    modo: function(){ return modoAtual; },
    aoMudar: function(fn){ ouvintes.push(fn); }
  };
})();
