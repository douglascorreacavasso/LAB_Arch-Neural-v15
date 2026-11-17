/* ════════════════════════════════════════════════════════════════
   treino_loader.js — sistema de ensino progressivo

   5 botões:  240 → 500 → 1000 → 2000 → 7000 → Acabou
   O 5º (7000) = treino_5000.json + treino_2000_identificacao.json

   API:
     window.TREINO.ensinarProximo()       → carrega+ensina próximo pacote
     window.TREINO.nivelAtual()           → 0..5 (5 = acabou)
     window.TREINO.labelProximo()         → string pro botão
     window.TREINO.acabou()               → true se já passou de todos

   Depende de:
     window.LOADING.run                   → overlay
     window.v112_processar(frase)         → ensina UMA frase
     window.AUDIT.scrubList(arr)          → opcional, filtra dados pessoais
   ════════════════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if(window.TREINO) return;

  const PACOTES = [
    { nivel: 1, arquivos: ['treinos/treino_240.json'],  qtd: 240,
      label: 'Ensinar 240' },
    { nivel: 2, arquivos: ['treinos/treino_500.json'],  qtd: 500,
      label: 'Ensinar 500' },
    { nivel: 3, arquivos: ['treinos/treino_1000.json'], qtd: 1000,
      label: 'Ensinar 1000' },
    { nivel: 4, arquivos: ['treinos/treino_2000.json'], qtd: 2000,
      label: 'Ensinar 2000' },
    { nivel: 5, arquivos: ['treinos/treino_5000.json',
                           'treinos/treino_2000_identificacao.json'],
      qtd: 7000,
      label: 'Ensinar 7000' },
    // [ENSINO_BASES_V1] 16/11: depois do 7000, o núcleo de cada base de conhecimento.
    // Cada pacote ensina as frases-núcleo ao grafo E liga a consulta daquela base na conversa
    // (o resto da base fica compactado em conhecimento/<base>/ e é lido só quando perguntam).
    // Gerados por ferramentas/treinar_cerebro_ensinado.js --exportar-pacotes.
    { nivel: 6, arquivos: ['treinos/treino_entidades.json'],  qtd: 0, base: 'ent',
      label: 'Ensinar Entidades' },
    { nivel: 7, arquivos: ['treinos/treino_gramatica.json'],  qtd: 0, base: 'gram', opcional: true,
      label: 'Ensinar Regras do Português' },
    { nivel: 8, arquivos: ['treinos/treino_dicionario.json'], qtd: 0, base: 'dic',
      label: 'Ensinar Dicionário' },
    { nivel: 9, arquivos: ['treinos/treino_wikipedia.json'],  qtd: 0, base: 'wiki',
      label: 'Ensinar Wikipédia' },
  ];

  let nivelEnsino = 0; // 0 = ainda não ensinou nada; 5 = acabou tudo

  function nivelAtual() { return nivelEnsino; }
  function acabou()     { return nivelEnsino >= PACOTES.length; }
  function labelProximo() {
    if(acabou()) return 'Acabou';
    return PACOTES[nivelEnsino].label;
  }
  function pacoteAtual() {
    if(acabou()) return null;
    return PACOTES[nivelEnsino];
  }

  // Carrega 1 arquivo de treino e retorna lista de frases
  async function carregarPacoteArquivo(url) {
    const r = await fetch(url);
    if(!r.ok) throw new Error('HTTP ' + r.status + ' em ' + url);
    const data = await r.json();
    let frases = data.frases || [];
    // Filtra dados pessoais se AUDIT existir
    if(window.AUDIT && typeof window.AUDIT.scrubList === 'function'){
      frases = window.AUDIT.scrubList(frases);
    }
    return frases;
  }

  // Processa N frases em batches assíncronos
  async function processarFrases(frases, setProgress, setLabel, labelBase) {
    // [FIX_ENSINO_FATIAS_V1] antes: lotes fixos de 30 frases. No cerebro completo cada
    // frase leva ~0,5 s -> 15 s de tela congelada por lote. Agora fatias de TEMPO
    // (8/14/24 ms conforme o aparelho) cedendo a tela entre elas.
    if(window.PERFIL && window.PERFIL.emFatias){
      let ok = 0;
      await window.PERFIL.emFatias(frases, function(frase){
        if(typeof window.v112_processar === 'function') window.v112_processar(frase);
        ok++;
      }, function(feitas, total){
        setProgress(feitas, total);
        if(labelBase) setLabel(labelBase, feitas + ' de ' + total + ' frases');
      });
      return ok;
    }
    const batchSize = 30;
    let processadas = 0;
    const total = frases.length;

    for(let i = 0; i < total; i += batchSize) {
      const fim = Math.min(i + batchSize, total);
      for(let k = i; k < fim; k++) {
        try {
          if(typeof window.v112_processar === 'function') {
            window.v112_processar(frases[k]);
          }
          processadas++;
        } catch(e) {
          // ignora frase com erro mas continua
        }
      }
      setProgress(processadas, total);
      if(labelBase) setLabel(labelBase, processadas + ' de ' + total + ' frases');
      // Cede pro browser respirar (anima overlay)
      await new Promise(r => setTimeout(r, 0));
    }
    return processadas;
  }

  /**
   * Carrega e ensina o próximo pacote (envolto em overlay).
   * @param {function} onFim — callback opcional ao terminar
   * @returns {Promise<{ok:bool, qtd, processadas, erro?}>}
   */
  async function ensinarProximo(onFim) {
    if(acabou()){
      return { ok: false, motivo: 'já-acabou' };
    }
    const pacote = pacoteAtual();
    const labelBase = pacote.base ? ('📚 ' + pacote.label) : ('📚 Ensinando ' + pacote.qtd + ' frases');

    return window.LOADING.run(labelBase, async (setProgress, setLabel) => {
      try {
        // Fase 1: carregar arquivos (pode ser 1 ou 2)
        setLabel(labelBase, 'carregando pacote...');
        let todasFrases = [];
        for(let i = 0; i < pacote.arquivos.length; i++){
          setLabel(labelBase,
            pacote.arquivos.length > 1
              ? 'baixando arquivo ' + (i+1) + '/' + pacote.arquivos.length
              : 'baixando pacote...');
          let fs;
          try { fs = await carregarPacoteArquivo(pacote.arquivos[i]); }
          catch(eArq){
            // pacote de base ainda não gerado (ex.: regras do português sem fonte): pula sem travar a sequência
            if(pacote.opcional){ nivelEnsino++; const rr = { ok: true, qtd: 0, processadas: 0, nivelAgora: nivelEnsino, pulado: true, base: pacote.base };
              if(typeof onFim === 'function') onFim(rr); return rr; }
            throw eArq;
          }
          todasFrases = todasFrases.concat(fs);
        }
        // Embaralha quando há múltiplos arquivos (5000+2000 misturados aprendem melhor)
        if(pacote.arquivos.length > 1){
          for(let i = todasFrases.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i+1));
            [todasFrases[i], todasFrases[j]] = [todasFrases[j], todasFrases[i]];
          }
        }

        // Fase 2: processar
        setLabel(labelBase, '0 de ' + todasFrases.length + ' frases');
        const processadas = await processarFrases(todasFrases, setProgress, setLabel, labelBase);

        // Avança nível
        nivelEnsino++;
        // pacote de base: liga a consulta daquela base na conversa
        if(pacote.base && window.CONHECIMENTO) window.CONHECIMENTO.ativar(pacote.base, true);
        const r = { ok: true, qtd: pacote.qtd || processadas, processadas: processadas, nivelAgora: nivelEnsino, base: pacote.base };
        if(typeof onFim === 'function') onFim(r);
        return r;
      } catch(err) {
        const r = { ok: false, erro: err.message };
        if(typeof onFim === 'function') onFim(r);
        return r;
      }
    });
  }

  /**
   * Reseta o estado (útil se importar cérebro novo).
   */
  function reset() {
    nivelEnsino = 0;
  }

  /**
   * Permite setar manualmente o nível (ex: cérebro importado já avançado).
   */
  function setNivel(n) {
    nivelEnsino = Math.max(0, Math.min(PACOTES.length, n|0));
  }

  /**
   * Mensagem do brain depois de cada pacote (sem incentivo a clicar).
   */
  function mensagemDeConclusao(resultado) {
    if(!resultado || !resultado.ok) {
      return '❌ Não consegui ensinar este pacote: ' + (resultado && resultado.erro || 'erro desconhecido');
    }
    if(resultado.pulado) {
      return 'O pacote de ' + (resultado.base === 'gram' ? 'regras do português' : resultado.base) + ' ainda não existe nesta versão; segui para o próximo.';
    }
    if(resultado.base && window.CONHECIMENTO) {
      return 'Aprendi ' + resultado.processadas + ' frases do núcleo de ' + window.CONHECIMENTO.NOMES[resultado.base] +
             '. Agora também consulto essa base inteira quando você pergunta "o que é...?".';
    }
    if(nivelEnsino >= PACOTES.length) {
      // Última lição
      return 'Aprendi as últimas ' + resultado.processadas + ' frases. Agora sei conversar de verdade.';
    }
    return 'Aprendi ' + resultado.processadas + ' frases (pacote ' + resultado.qtd + ').';
  }

  window.TREINO = {
    PACOTES: PACOTES,
    nivelAtual: nivelAtual,
    acabou: acabou,
    labelProximo: labelProximo,
    pacoteAtual: pacoteAtual,
    ensinarProximo: ensinarProximo,
    reset: reset,
    setNivel: setNivel,
    mensagemDeConclusao: mensagemDeConclusao,
  };
})();
