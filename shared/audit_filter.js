/* ════════════════════════════════════════════════════════════════
   audit_filter.js — remove nomes pessoais privados (configurável via REGRAS)
                     de strings de experimentos e listas de treino
                     antes de exibir/processar.

   Uso:
     const limpa = window.AUDIT.scrub('o nome do user é (NOME_PRIVADO)');
     // → 'o nome do user é Usuário'

     const frasesLimpas = window.AUDIT.scrubList(['olá (NOME_PRIVADO)', 'fato']);
     // → ['olá Usuário', 'fato']

   Política:
     - Substitui nome pessoal configurado por "Usuário"
     - Substitui "Cavasso" por "" (sobrenome)
     - Mantém sentido gramatical da frase
   ════════════════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if(window.AUDIT) return;

  // Pares [regex, replacement] aplicados em ordem
  const REGRAS = [
    // Nome completo
    [/douglas\s+corr[êe]a\s+cavasso/gi, 'Usuário'],
    [/douglas\s+cavasso/gi, 'Usuário'],
    // Só nome
    [/\bdouglas\b/gi, 'Usuário'],
    // Só sobrenome
    [/\bcavasso\b/gi, ''],
    [/\bcorrea\b/gi, ''],
    [/\bcorr[êe]a\b/gi, ''],
    // E-mail pessoal
    [/douglas\.cavasso@gmail\.com/gi, '(email do autor)'],
    // Limpeza de espaços duplos resultantes
    [/\s{2,}/g, ' '],
  ];

  /**
   * Limpa UMA string aplicando todas as REGRAS.
   */
  function scrub(s) {
    if(typeof s !== 'string') return s;
    let out = s;
    for(const [re, rep] of REGRAS) {
      out = out.replace(re, rep);
    }
    return out.trim();
  }

  /**
   * Limpa uma lista de strings (filtra vazias).
   */
  function scrubList(arr) {
    if(!Array.isArray(arr)) return arr;
    return arr.map(scrub).filter(s => s && s.length > 0);
  }

  /**
   * Limpa um objeto de pacote de treino (estrutura: { frases: [...], nome, ... }).
   */
  function scrubPacoteTreino(pacote) {
    if(!pacote || typeof pacote !== 'object') return pacote;
    const out = Object.assign({}, pacote);
    if(Array.isArray(out.frases)) {
      out.frases = scrubList(out.frases);
    }
    if(typeof out.nome === 'string') out.nome = scrub(out.nome);
    if(typeof out.descricao === 'string') out.descricao = scrub(out.descricao);
    return out;
  }

  /**
   * Limpa uma lista de experimentos { label, frase }[].
   */
  function scrubExperimentos(lista) {
    if(!Array.isArray(lista)) return lista;
    return lista.map(exp => {
      if(typeof exp === 'string') return scrub(exp);
      const out = Object.assign({}, exp);
      if(typeof out.label === 'string') out.label = scrub(out.label);
      if(typeof out.frase === 'string') out.frase = scrub(out.frase);
      if(typeof out.input === 'string') out.input = scrub(out.input);
      if(typeof out.descricao === 'string') out.descricao = scrub(out.descricao);
      return out;
    });
  }

  /**
   * Detecta se uma string contém referência pessoal.
   */
  function isContaminado(s) {
    if(typeof s !== 'string') return false;
    return /\bdouglas\b|\bcavasso\b|douglas\.cavasso/i.test(s);
  }

  window.AUDIT = { scrub, scrubList, scrubPacoteTreino, scrubExperimentos, isContaminado };
})();
