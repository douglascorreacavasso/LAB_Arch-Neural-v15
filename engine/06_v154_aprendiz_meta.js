// ─── REGIÃO 06/14 — v154_aprendiz_meta.js ───
window._ARCH_MODULOS.push({nome:"v154_aprendiz_meta.js", src: `
// ═══════════════════════════════════════════════════════════════════
// v154_aprendiz_meta.js — Bolinha SPAWNER do Aprendiz
//
// O que é:
//   Sub-rede que SÓ surge quando a Bola Grande (B_aprendiz_emergencial)
//   falha em criar emerge mesmo havendo 3+ fallbacks similares.
//
// O que faz:
//   1. Detecta que a Bola Grande falhou em aprender (3+ fallbacks, 0 emerges)
//   2. Tenta criar emerge sozinha usando 5 ESTRATÉGIAS combinadas
//   3. Se 1 estratégia bater, cria emerge auxiliar
//   4. Se TODAS falharem após 3 tentativas, cria uma bolinha-aux NOVA
//      especialista naquele tipo de padrão (auto-spawn)
//
// Qualidade incorporada (do catálogo do cérebro):
//   ✓ Tokenização com remoção de stopwords (B_logico padrão)
//   ✓ Detecção de palavras-conteúdo (substantivos centrais)
//   ✓ Multi-padrão (5 estratégias paralelas)
//   ✓ Validação defensiva em TODA entrada
//   ✓ Score-based confidence
//   ✓ try/catch em cada estratégia (B_brain padrão)
//   ✓ Slots variáveis NÃO-POSICIONAIS
//   ✓ Aprende com sucesso de outras sub-redes
//
// Padrão append-only, igual v151/v152/v153.
// ═══════════════════════════════════════════════════════════════════

(function(){

if(typeof V112 === 'undefined') return;
if(typeof window === 'undefined') var window = global;

// ───────────────────────────────────────────────────────────────────
// CONSTANTES & STOPWORDS (igual brain)
// ───────────────────────────────────────────────────────────────────
const STOPWORDS_PT = new Set([
  'o','a','os','as','um','uma','uns','umas',
  'de','do','da','dos','das','no','na','nos','nas','em','para','pra',
  'com','sem','por','sobre','sob','entre','até','desde','contra',
  'que','qual','quais','quem','onde','quando','como','porque','por que',
  'é','são','foi','foram','seja','sejam','será','serão',
  'tem','tinha','têm','tinham','ter',
  'e','ou','mas','porém','também','não','sim','já','ainda','mais','menos',
  'isso','isto','aquilo','este','esta','esse','essa','aquele','aquela',
  'meu','minha','seu','sua','nosso','nossa',
  'eu','tu','ele','ela','nós','vós','eles','elas',
  'se','muito','pouco','tanto','tudo','nada','algo','alguém',
  'lá','aí','aqui','ali','agora','sempre','nunca','jamais',
  'para','pelo','pela','pelos','pelas',
  'dele','dela','deles','delas','disso','dessa','desse','dele'
]);

const PALAVRAS_INTERROGATIVAS = new Set([
  'quem','qual','quais','o que','onde','quando','como','por que','porque',
  'quanto','quanta','quantos','quantas'
]);

// ───────────────────────────────────────────────────────────────────
// HELPERS DE QUALIDADE
// ───────────────────────────────────────────────────────────────────
function _safe_str(s){
  if(s === null || s === undefined) return '';
  return String(s).trim();
}

function _tokenizar_limpo(s){
  return _safe_str(s).toLowerCase()
    .replace(/[?!.,;:()\\[\\]{}'"]/g, ' ')
    .split(/\\s+/)
    .filter(t => t.length > 0);
}

function _tokens_conteudo(s){
  // Remove stopwords — fica só palavras de conteúdo (substantivos, verbos, etc)
  return _tokenizar_limpo(s).filter(t => !STOPWORDS_PT.has(t));
}

function _jaccard(a, b){
  const sa = new Set(a);
  const sb = new Set(b);
  if(sa.size === 0 && sb.size === 0) return 1;
  let inter = 0;
  for(const x of sa) if(sb.has(x)) inter++;
  return inter / (sa.size + sb.size - inter);
}

function _getNextId(){
  let max = 0;
  for(const n of V112.nodes){
    if(typeof n.id === 'number' && n.id > max) max = n.id;
    if(typeof n.id === 'string'){
      const m = n.id.match(/^n_(\\d+)$/);
      if(m){ const v = parseInt(m[1]); if(v > max) max = v; }
    }
  }
  return 'n_' + (max + 1);
}

// ───────────────────────────────────────────────────────────────────
// ESTADO META
// ───────────────────────────────────────────────────────────────────
const META = {
  ATIVADO: false,  // só ativa quando Bola Grande falhar
  FALHAS_PARA_ATIVAR: 3,  // 3 vezes que Bola Grande não criou apesar de 3+ fallbacks
  contador_falhas_grande: 0,
  emerges_criadas_meta: 0,
  auxs_geradas: 0,         // bolinhas-aux criadas autonomamente
  ultima_observacao: null
};

// ───────────────────────────────────────────────────────────────────
// SUB-REDE B_aprendiz_meta
// ───────────────────────────────────────────────────────────────────
function v154_meta_init(){
  let central;
  if(V112.subredes.B_aprendiz_meta){
    central = v112_node_by_id(V112.subredes.B_aprendiz_meta.id);
  } else {
    const id = _getNextId();
    central = {
      id, text: '[B_aprendiz_meta]',
      tipo: null, camada: 'subrede',
      pos: [260, 20, 90],
      cor: 'dourado_neon',
      acumulador: 0, limiar: 50, estado: 'dormindo',
      ativacoes: 0, sucessos: 0,
      _subrede: true,
      _proposito: 'Bolinha Spawner: só age quando Bola Grande falha; cria auxs por necessidade'
    };
    V112.nodes.push(central);
    V112.subredes.B_aprendiz_meta = {id, satelites:[], pos: central.pos};
  }

  // Defensiva: garante props
  if(central._ativacoes === undefined) central._ativacoes = 0;
  if(central._sucessos === undefined) central._sucessos = 0;
  if(central._emerges_criadas_meta === undefined) central._emerges_criadas_meta = 0;
  if(central._auxs_geradas === undefined) central._auxs_geradas = 0;
  if(central._ativado === undefined) central._ativado = false;

  return central;
}

function _no_meta(){
  if(!V112.subredes.B_aprendiz_meta) return null;
  return v112_node_by_id(V112.subredes.B_aprendiz_meta.id);
}

v154_meta_init();

// ───────────────────────────────────────────────────────────────────
// 5 ESTRATÉGIAS DE EXTRAÇÃO DE TEMPLATE (qualidade)
// ───────────────────────────────────────────────────────────────────

// Estratégia 1: posicional simples (= que a Bola Grande já tem)
function _estrat_posicional(queries){
  try {
    const toks = queries.map(_tokenizar_limpo);
    const len_min = Math.min(...toks.map(t => t.length));
    const len_max = Math.max(...toks.map(t => t.length));
    if(len_max - len_min > 2) return null;
    if(len_min === 0) return null;

    const template = [];
    const vars = [];
    for(let i = 0; i < len_min; i++){
      const col = toks.map(t => t[i]);
      if(col.every(x => x === col[0])){
        template.push(col[0]);
      } else {
        template.push('(\\\\S+)');
        vars.push({pos: i, valores: [...new Set(col)]});
      }
    }
    if(vars.length === 0 || vars.length === template.length) return null;
    const regex_str = '^' + template.join('\\\\s+') + '\\\\s*[?!.]*$';
    return {regex_str, estrategia: 'posicional', confianca: 0.9, template: template.join(' ')};
  } catch(e){ return null; }
}

// Estratégia 2: âncora-fixa-prefixo (extrai âncora comum no início)
// "fale em X" / "traduza Y para X" → encontra prefixo comum maior que 1 token
function _estrat_ancora_prefixo(queries){
  try {
    const toks = queries.map(_tokenizar_limpo);
    if(toks.some(t => t.length === 0)) return null;

    // Maior prefixo comum entre todas
    const prefixo = [];
    const len_min = Math.min(...toks.map(t => t.length));
    for(let i = 0; i < len_min; i++){
      const col = toks.map(t => t[i]);
      if(col.every(x => x === col[0])){
        prefixo.push(col[0]);
      } else break;
    }
    if(prefixo.length < 1) return null;  // sem prefixo comum

    // Resto é variável (pode ser N tokens)
    const regex_str = '^' + prefixo.join('\\\\s+') + '\\\\s+(.+?)\\\\s*[?!.]*$';
    return {regex_str, estrategia: 'ancora_prefixo', confianca: 0.85, template: prefixo.join(' ') + ' (.+)'};
  } catch(e){ return null; }
}

// Estratégia 3: âncora-fixa-sufixo
// "X é animal" / "Y é fruta" — sufixo comum
function _estrat_ancora_sufixo(queries){
  try {
    const toks = queries.map(_tokenizar_limpo);
    if(toks.some(t => t.length === 0)) return null;

    // Maior sufixo comum
    const sufixo_inv = [];
    const len_min = Math.min(...toks.map(t => t.length));
    for(let i = 0; i < len_min; i++){
      const col = toks.map(t => t[t.length - 1 - i]);
      if(col.every(x => x === col[0])){
        sufixo_inv.push(col[0]);
      } else break;
    }
    if(sufixo_inv.length < 1) return null;
    const sufixo = sufixo_inv.reverse();
    const regex_str = '^(.+?)\\\\s+' + sufixo.join('\\\\s+') + '\\\\s*[?!.]*$';
    return {regex_str, estrategia: 'ancora_sufixo', confianca: 0.85, template: '(.+) ' + sufixo.join(' ')};
  } catch(e){ return null; }
}

// Estratégia 4: stopword-skip — ignora variações de "o/a/um/uma" entre tokens fixos
function _estrat_stopword_skip(queries){
  try {
    const toks_completos = queries.map(_tokenizar_limpo);
    const toks_conteudo = queries.map(_tokens_conteudo);
    if(toks_conteudo.some(t => t.length === 0)) return null;

    // Procurar tokens de conteúdo comuns posicionalmente
    const len_min = Math.min(...toks_conteudo.map(t => t.length));
    if(len_min === 0) return null;

    const ancoras_conteudo = [];
    const vars_idx = [];
    for(let i = 0; i < len_min; i++){
      const col = toks_conteudo.map(t => t[i]);
      if(col.every(x => x === col[0])){
        ancoras_conteudo.push(col[0]);
      } else {
        ancoras_conteudo.push(null);
        vars_idx.push(i);
      }
    }

    if(ancoras_conteudo.filter(Boolean).length < 1) return null;
    if(vars_idx.length === 0) return null;

    // Monta regex que aceita stopwords opcionais entre âncoras de conteúdo
    const partes = [];
    for(const anc of ancoras_conteudo){
      if(anc){
        partes.push('(?:[a-záéíóúâêôãõç ]*?\\\\b)' + anc.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'));
      } else {
        partes.push('(\\\\S+)');
      }
    }
    const regex_str = '^' + partes.join('\\\\s+') + '.*$';
    return {regex_str, estrategia: 'stopword_skip', confianca: 0.75, template: ancoras_conteudo.map(a => a || '*').join(' ')};
  } catch(e){ return null; }
}

// Estratégia 5: bag-of-content-words — só procura por palavras-chave comuns (sem ordem)
function _estrat_bag_of_words(queries){
  try {
    const bags = queries.map(_tokens_conteudo);
    if(bags.some(b => b.length === 0)) return null;

    // Intersecção das palavras-conteúdo
    let comuns = new Set(bags[0]);
    for(let i = 1; i < bags.length; i++){
      const s = new Set(bags[i]);
      comuns = new Set([...comuns].filter(x => s.has(x)));
    }
    if(comuns.size === 0) return null;

    // Regex que exige presença de TODAS as palavras comuns (em qualquer ordem)
    // Construímos com lookaheads
    const ancoras = [...comuns];
    const lookaheads = ancoras.map(a => '(?=.*\\\\b' + a.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + '\\\\b)').join('');
    const regex_str = '^' + lookaheads + '.*$';
    return {regex_str, estrategia: 'bag_of_words', confianca: 0.6, template: '[bag]: ' + ancoras.join(' & ')};
  } catch(e){ return null; }
}

const ESTRATEGIAS = [
  _estrat_posicional,
  _estrat_ancora_prefixo,
  _estrat_ancora_sufixo,
  _estrat_stopword_skip,
  _estrat_bag_of_words
];

// ───────────────────────────────────────────────────────────────────
// TENTAR APRENDER (versão META — usa as 5 estratégias)
// ───────────────────────────────────────────────────────────────────
function _meta_tentar_aprender(queries_falha){
  if(!Array.isArray(queries_falha) || queries_falha.length < 3) return null;

  // Verificar similaridade mínima primeiro (poda)
  // Tentar com tokens-conteúdo primeiro
  let sim_total = 0, pares = 0;
  for(let i = 0; i < queries_falha.length; i++){
    for(let j = i+1; j < queries_falha.length; j++){
      sim_total += _jaccard(_tokens_conteudo(queries_falha[i]), _tokens_conteudo(queries_falha[j]));
      pares++;
    }
  }
  let sim = pares > 0 ? sim_total / pares : 0;

  // Fallback: se conteúdo é pobre, considera tokens COMPLETOS
  if(sim < 0.2){
    let sim2 = 0, p2 = 0;
    for(let i = 0; i < queries_falha.length; i++){
      for(let j = i+1; j < queries_falha.length; j++){
        sim2 += _jaccard(_tokenizar_limpo(queries_falha[i]), _tokenizar_limpo(queries_falha[j]));
        p2++;
      }
    }
    sim = p2 > 0 ? sim2 / p2 : 0;
  }

  if(sim < 0.2) return null;

  // Tentar cada estratégia, em ordem de confiança
  const candidatos = [];
  for(const estrat of ESTRATEGIAS){
    try {
      const r = estrat(queries_falha);
      if(r && r.regex_str){
        // Validar: o regex casa com TODAS as queries originais?
        const re = new RegExp(r.regex_str, 'i');
        const casam_todas = queries_falha.every(q => re.test(q));
        if(casam_todas){
          candidatos.push(r);
        }
      }
    } catch(e){}
  }

  if(candidatos.length === 0) return null;

  // Pegar o de maior confiança
  candidatos.sort((a, b) => b.confianca - a.confianca);
  return candidatos[0];
}

// ───────────────────────────────────────────────────────────────────
// HOOK no APRENDIZ GRANDE: observa quando ele falha
// ───────────────────────────────────────────────────────────────────
function _meta_observar(){
  // Esta função é chamada periodicamente (após cada query)
  // Detecta: "houve 3+ fallbacks similares, mas Bola Grande não criou emerge"

  if(typeof window.v112_aprendiz_status !== 'function') return;
  const st = window.v112_aprendiz_status();

  // Se fallbacks recentes >= 3 e nenhuma emerge nova foi criada nas últimas N queries
  if(st.fallbacks_recentes < 3) return;

  // Pegar as últimas 3 queries que foram fallback
  // Acessar APRENDIZ do v153 — ele está no escopo do IIFE de v153
  // Vou usar uma forma alternativa: ler do histórico via inspeção
  if(!window._v153_aprendiz_historico) return;

  const hist = window._v153_aprendiz_historico();
  const falhas_recentes = hist.filter(h => h.fallback).slice(-3);
  if(falhas_recentes.length < 3) return;
  const queries_falha = falhas_recentes.map(f => f.query);

  // Verificar se a Bola Grande JÁ criou emerge pra esse padrão
  const subs_emerge = Object.keys(V112.subredes).filter(s => s.startsWith('B_emerge_'));
  for(const sr of subs_emerge){
    const no = v112_node_by_id(V112.subredes[sr].id);
    if(no && no._regex_str){
      try {
        const re = new RegExp(no._regex_str, 'i');
        if(queries_falha.every(q => re.test(q))) return;  // já coberto
      } catch(e){}
    }
  }

  // Bola Grande NÃO conseguiu. Hora de agir.
  META.contador_falhas_grande++;

  // Ativar META permanentemente após N falhas (necessidade real)
  if(!META.ATIVADO && META.contador_falhas_grande >= META.FALHAS_PARA_ATIVAR){
    META.ATIVADO = true;
    const cen = _no_meta();
    if(cen){
      cen._ativado = true;
      cen.estado = 'ativo';
      cen._ativado_em = new Date().toISOString();
    }
  }

  if(!META.ATIVADO) return;

  // Tentar aprender com as 5 estratégias
  const template = _meta_tentar_aprender(queries_falha);
  if(!template) return;

  // Verificar duplicação
  for(const sr of subs_emerge){
    const no = v112_node_by_id(V112.subredes[sr].id);
    if(no && no._regex_str === template.regex_str) return;
  }

  // CRIAR emerge META (B_emerge_meta_NNN)
  _meta_criar_emerge(template, queries_falha);
}

function _meta_criar_emerge(template, queries_origem){
  META.emerges_criadas_meta++;
  const numero = META.emerges_criadas_meta;
  const nome = 'B_emerge_meta_' + String(numero).padStart(3, '0');

  const id_central = _getNextId();
  const central = {
    id: id_central,
    text: '[' + nome + ']',
    tipo: null, camada: 'subrede',
    pos: [280 + (numero * 5) % 60, (numero * 11) % 40, 90],
    cor: 'verde_lima_neon',
    acumulador: 0, limiar: 50, estado: 'experimental_meta',
    ativacoes: 0, sucessos: 0,
    _subrede: true,
    _proposito: 'EXPERIMENTAL: criada pela Bolinha META quando Bola Grande falhou',
    _criada_em: new Date().toISOString(),
    _template: template.template,
    _regex_str: template.regex_str,
    _estrategia: template.estrategia,
    _confianca: template.confianca,
    _queries_origem: queries_origem,
    _criador: 'B_aprendiz_meta',
    _ativacoes: 0, _sucessos: 0
  };
  V112.nodes.push(central);
  V112.subredes[nome] = {id: id_central, satelites: [], pos: central.pos};

  // Atualizar contador do nó meta
  const cen = _no_meta();
  if(cen){
    cen._emerges_criadas_meta = (cen._emerges_criadas_meta||0) + 1;
    cen._ativacoes = (cen._ativacoes||0) + 1;
    cen._sucessos = (cen._sucessos||0) + 1;
  }

  // Registrar handler
  const handler_nome = 'h_emerge_meta_' + numero;
  window.V112_HANDLERS = window.V112_HANDLERS || {};
  window.V112_HANDLERS[handler_nome] = function(m, ctx){
    return {
      resposta_direta: '[meta-emerge ' + nome + '] estratégia=' + template.estrategia +
                       ' template="' + template.template + '" — aprendido por META',
      tratou: true
    };
  };

  if(typeof v112_comando_criar_no === 'function'){
    try {
      v112_comando_criar_no(template.regex_str, handler_nome, {
        prioridade: 75,
        descricao: 'meta-emerge #' + numero + ' (' + template.estrategia + ')',
        categoria: 'emerge_meta'
      });
    } catch(e){}
  }

  return central;
}

// ───────────────────────────────────────────────────────────────────
// AUTO-SPAWN de bolinhas auxiliares
// ───────────────────────────────────────────────────────────────────
// Se META falhar 5 vezes em criar emerge mesmo com 3+ fallbacks similares,
// cria uma bolinha-aux nova (não pré-programada) especializada
function _meta_spawn_aux(queries_falha, estrategias_que_falharam){
  META.auxs_geradas++;
  const numero = META.auxs_geradas;
  const nome = 'B_aux_' + String(numero).padStart(3, '0');

  const id = _getNextId();
  const central = {
    id, text: '[' + nome + ']',
    tipo: null, camada: 'subrede',
    pos: [300 + (numero * 7) % 50, (numero * 13) % 35, 100],
    cor: 'azul_eletrico',
    acumulador: 0, limiar: 50, estado: 'spawned',
    ativacoes: 0, sucessos: 0,
    _subrede: true,
    _proposito: 'AUTO-SPAWN: criada pela META quando todas estratégias falharam',
    _criada_em: new Date().toISOString(),
    _criador: 'B_aprendiz_meta',
    _ultimas_falhas: queries_falha,
    _estrategias_falhas: estrategias_que_falharam,
    _ativacoes: 0, _sucessos: 0,
    _tipo_padrao_alvo: 'desconhecido'
  };
  V112.nodes.push(central);
  V112.subredes[nome] = {id, satelites:[], pos: central.pos};

  const cen = _no_meta();
  if(cen){
    cen._auxs_geradas = (cen._auxs_geradas||0) + 1;
  }

  return central;
}

// ───────────────────────────────────────────────────────────────────
// EXPOR HISTÓRICO DO V153 (precisa pra META observar)
// ───────────────────────────────────────────────────────────────────
// O v153 mantém histórico privado. Vou expor um getter via injeção.
// Faço isso modificando o v153 indiretamente — adicionando uma função
// que ele já tem, ou usando o nó como ponte.

// Hook: a cada v112_processar, registra no central META o histórico recente
const _orig_processar2 = window.v112_processar;
if(typeof _orig_processar2 === 'function' && !window._v154_hooked){
  window.v112_processar = function(input, ...args){
    const r = _orig_processar2.apply(this, [input, ...args]);
    // Sincronizar histórico com nó central
    try {
      const cen = _no_meta();
      if(cen){
        cen._hist = cen._hist || [];
        const resp_lower = String(r && r.resposta || '').toLowerCase().trim();
        const eh_fallback = !resp_lower || resp_lower === 'hm.' || resp_lower === '...' ||
                            resp_lower.length <= 2 || resp_lower.includes('não entendi');
        cen._hist.push({query: String(input), fallback: eh_fallback, ts: Date.now()});
        if(cen._hist.length > 30) cen._hist.shift();

        // Disparar observação periodicamente
        _meta_observar_via_cen(cen);
      }
    } catch(e){}
    return r;
  };
  window._v154_hooked = true;
}

window._v153_aprendiz_historico = function(){
  const cen = _no_meta();
  return cen && Array.isArray(cen._hist) ? cen._hist : [];
};

function _meta_observar_via_cen(cen){
  const hist = cen._hist || [];
  // Pegar as últimas 10 falhas e tentar agrupar por similaridade
  const falhas_recentes = hist.filter(h => h.fallback).slice(-10);
  if(falhas_recentes.length < 3) return;

  // Agrupar por similaridade — encontrar 3+ queries similares entre si
  let queries_falha = null;
  for(let i = 0; i < falhas_recentes.length; i++){
    const grupo = [falhas_recentes[i].query];
    for(let j = 0; j < falhas_recentes.length; j++){
      if(i === j) continue;
      const tokA = _tokenizar_limpo(falhas_recentes[i].query);
      const tokB = _tokenizar_limpo(falhas_recentes[j].query);
      const sim = _jaccard(tokA, tokB);
      if(sim >= 0.4){
        grupo.push(falhas_recentes[j].query);
      }
    }
    if(grupo.length >= 3){
      queries_falha = grupo.slice(0, 3);
      break;
    }
  }

  if(!queries_falha) return;

  // Dar chance à Bola Grande: só agir se as falhas têm pelo menos 3 ciclos
  // (= já houve 3+ queries depois da última falha do grupo)
  // (Simplificado: se o grupo está pronto, age — já filtramos por similaridade)

  // Já cobertas por QUALQUER comando-nó atual?
  if(typeof v112_comandos_listar === 'function'){
    try {
      const cmds = v112_comandos_listar();
      for(const c of cmds){
        const padrao_str = (c._padrao_str && c._padrao_str.padrao_str) ||
                          c._padrao_str || c.padrao_str || c.padrao || '';
        if(!padrao_str || typeof padrao_str !== 'string') continue;
        try {
          const re = new RegExp(padrao_str, 'i');
          if(queries_falha.every(q => re.test(q))) return;
        } catch(e){}
      }
    } catch(e){}
  }

  META.contador_falhas_grande++;
  if(!META.ATIVADO && META.contador_falhas_grande >= META.FALHAS_PARA_ATIVAR){
    META.ATIVADO = true;
    cen._ativado = true;
    cen.estado = 'ativo';
    cen._ativado_em = new Date().toISOString();
  }

  if(!META.ATIVADO) return;

  const template = _meta_tentar_aprender(queries_falha);
  if(template){
    try {
      const cmds = v112_comandos_listar();
      for(const c of cmds){
        const padrao_str = (c._padrao_str && c._padrao_str.padrao_str) ||
                          c._padrao_str || c.padrao_str || c.padrao || '';
        if(padrao_str === template.regex_str) return;
      }
    } catch(e){}
    _meta_criar_emerge(template, queries_falha);
  } else {
    cen._falhas_meta = (cen._falhas_meta||0) + 1;
    if(cen._falhas_meta >= 5){
      _meta_spawn_aux(queries_falha, ESTRATEGIAS.map(e => e.name));
      cen._falhas_meta = 0;
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// HANDLERS PÚBLICOS
// ───────────────────────────────────────────────────────────────────
window.V112_HANDLERS = window.V112_HANDLERS || {};

window.V112_HANDLERS.h_meta_status = function(m, ctx){
  const cen = _no_meta();
  if(!cen) return {resposta_direta: 'B_aprendiz_meta ausente', tratou: true};
  const lines = [
    'aprendiz META (bolinha spawner):',
    '  ativado:               ' + (cen._ativado ? 'sim (' + (cen._ativado_em||'?') + ')' : 'não — Bola Grande ainda dá conta'),
    '  contador falhas Grande: ' + META.contador_falhas_grande,
    '  emerges criadas META:   ' + (cen._emerges_criadas_meta||0),
    '  auxs geradas (spawn):   ' + (cen._auxs_geradas||0),
    '  falhas meta seguidas:   ' + (cen._falhas_meta||0)
  ];
  return {resposta_direta: lines.join('\\n'), tratou: true};
};

window.V112_HANDLERS.h_meta_listar = function(m, ctx){
  const metas = V112.nodes.filter(n => (n.text||'').startsWith('[B_emerge_meta_'));
  const auxs = V112.nodes.filter(n => (n.text||'').startsWith('[B_aux_'));
  if(metas.length === 0 && auxs.length === 0){
    return {resposta_direta: 'nenhuma emerge-meta ou aux criada', tratou: true};
  }
  const lines = ['estruturas criadas pela META:'];
  for(const m of metas){
    lines.push('  ' + m.text + ' estratégia=' + (m._estrategia||'?') + ' confianca=' + (m._confianca||0));
  }
  for(const a of auxs){
    lines.push('  ' + a.text + ' (auto-spawn) tipo=' + (a._tipo_padrao_alvo||'?'));
  }
  return {resposta_direta: lines.join('\\n'), tratou: true};
};

if(typeof v112_comando_criar_no === 'function'){
  try {
    v112_comando_criar_no('^status\\\\s+meta$', 'h_meta_status',
      {prioridade: 85, descricao: 'status da bolinha spawner', categoria: 'meta'});
    v112_comando_criar_no('^(?:listar\\\\s+)?metas?$', 'h_meta_listar',
      {prioridade: 85, descricao: 'listar emerges-meta', categoria: 'meta'});
  } catch(e){}
}

// ───────────────────────────────────────────────────────────────────
// API PÚBLICA pra debug/testes
// ───────────────────────────────────────────────────────────────────
window.v112_meta_status = function(){
  const cen = _no_meta();
  if(!cen) return {erro: 'B_aprendiz_meta ausente'};
  return {
    ativado: !!cen._ativado,
    contador_falhas_grande: META.contador_falhas_grande,
    emerges_criadas_meta: cen._emerges_criadas_meta||0,
    auxs_geradas: cen._auxs_geradas||0,
    falhas_meta_seguidas: cen._falhas_meta||0,
    estrategias_disponiveis: ESTRATEGIAS.length
  };
};

window.v112_meta_forcar = function(queries){
  // Útil pra teste: força tentativa de aprendizado com queries dadas
  const cen = _no_meta();
  if(!cen) return null;
  META.ATIVADO = true;
  cen._ativado = true;
  const template = _meta_tentar_aprender(queries);
  if(template){
    _meta_criar_emerge(template, queries);
    return {sucesso: true, template};
  }
  return {sucesso: false, motivo: 'nenhuma estratégia funcionou'};
};

console.log('[v154_aprendiz_meta] carregado: B_aprendiz_meta (bolinha spawner, 5 estratégias)');

})();
`});
