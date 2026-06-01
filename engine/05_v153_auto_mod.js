// ─── REGIÃO 05/14 — v153_auto_mod_necessidade.js ───
window._ARCH_MODULOS.push({nome:"v153_auto_mod_necessidade.js", src: `
// ═══════════════════════════════════════════════════════════════════
// v153_auto_mod_necessidade.js — Auto-mod 2.0 TIPO 2
//
// "Aprender por necessidade" — cérebro detecta sozinho quando está
// falhando repetidamente em algo e cria um aglomerado de nós novo
// pra cobrir o gap. Sem ensino manual via NL.
//
// Diferença do TIPO 1 (B_gerador_comandos):
//   TIPO 1: Douglas fala "ensina: X -> Y" → cria comando
//   TIPO 2: cérebro vê 3+ falhas similares → cria sub-rede sozinho
//
// Mecânica:
//   1. Após CADA v112_processar, h_aprendiz_observar registra a query
//      e se houve fallback ou sucesso
//   2. Quando detecta 3+ fallbacks com padrão similar, cria sub-rede
//      experimental B_emerge_NNN com tentativa de handler
//   3. Próximas queries do padrão testam a sub-rede
//   4. Se passar em N consecutivas, vira permanente
//   5. Se falhar em N consecutivas, é deletada
//
// NÃO modifica v112_core.js nem v112_brain.js. Append-only.
// ═══════════════════════════════════════════════════════════════════

(function(){

if(typeof V112 === 'undefined') return;

// ───────────────────────────────────────────────────────────────────
// Estado interno do aprendiz
// ───────────────────────────────────────────────────────────────────
const APRENDIZ = {
  historico: [],             // últimas N queries com {query, fallback, resp, ts}
  HISTORICO_MAX: 50,
  fallbacks_recentes: [],    // só os que falharam (subset filtrado)
  MIN_PADROES_SIMILARES: 3,  // threshold pra ativar aprendizado
  emerges_ativos: {},        // sub-redes em prova {nome: {regex, tentativas, sucessos, criada_em}}
  PROMOVER_APOS: 3,          // sucessos consecutivos pra promover
  DESCARTAR_APOS: 5,         // falhas consecutivas pra descartar
  total_aprendizagens: 0,
  total_descartes: 0
};

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
// SUB-REDE B_aprendiz_emergencial
// ───────────────────────────────────────────────────────────────────
function v153_aprendiz_init(){
  let central;
  if(V112.subredes.B_aprendiz_emergencial){
    central = v112_node_by_id(V112.subredes.B_aprendiz_emergencial.id);
  } else {
    const id = _getNextId();
    central = {
      id, text: '[B_aprendiz_emergencial]',
      tipo: null, camada: 'subrede',
      pos: [240, 0, 80],
      cor: 'magenta_neon',
      acumulador: 0, limiar: 50, estado: 'dormindo',
      ativacoes: 0, sucessos: 0,
      _subrede: true,
      _proposito: 'Auto-mod tipo 2: detecta gaps, cria sub-redes B_emerge_NNN sozinho'
    };
    V112.nodes.push(central);
    V112.subredes.B_aprendiz_emergencial = {id, satelites:[], pos: central.pos};
  }

  // Garante que propriedades de contador existam (mesmo se nó veio de JSON)
  if(central._ativacoes === undefined) central._ativacoes = 0;
  if(central._sucessos === undefined) central._sucessos = 0;
  if(central._emerges_criadas === undefined) central._emerges_criadas = 0;
  if(central._emerges_promovidas === undefined) central._emerges_promovidas = 0;
  if(central._emerges_descartadas === undefined) central._emerges_descartadas = 0;

  return central;
}

// Função de conveniência pra pegar o nó atual (sempre via subredes pra evitar referência órfã)
function _no_central(){
  if(!V112.subredes.B_aprendiz_emergencial) return null;
  return v112_node_by_id(V112.subredes.B_aprendiz_emergencial.id);
}

const _no_aprendiz = v153_aprendiz_init();

// ───────────────────────────────────────────────────────────────────
// Helpers: extração de padrão a partir de queries similares
// ───────────────────────────────────────────────────────────────────
function _tokenizar(s){
  return String(s||'').toLowerCase().trim()
    .replace(/[?!.,;:]/g, '')
    .split(/\\s+/)
    .filter(Boolean);
}

function _similaridade(a, b){
  // Jaccard sobre tokens
  const ta = new Set(_tokenizar(a));
  const tb = new Set(_tokenizar(b));
  if(ta.size === 0 && tb.size === 0) return 1;
  let inter = 0;
  for(const t of ta) if(tb.has(t)) inter++;
  const uniao = ta.size + tb.size - inter;
  return uniao > 0 ? inter / uniao : 0;
}

function _extrair_template(queries){
  // Dadas 3+ queries similares, encontra o padrão comum
  // Ex: ["quantos dias úteis em março", "quantos dias úteis em abril"]
  // → template: "quantos dias úteis em {X}"
  if(queries.length < 2) return null;

  const tokenizadas = queries.map(_tokenizar);
  if(tokenizadas[0].length === 0) return null;

  // Achar tokens comuns em TODAS posicionalmente
  const len_min = Math.min(...tokenizadas.map(t => t.length));
  const len_max = Math.max(...tokenizadas.map(t => t.length));

  if(len_min === 0) return null;
  // Se tamanhos muito diferentes, não dá pra template posicional
  if(len_max - len_min > 2) return null;

  const template_tokens = [];
  const vars = [];

  for(let i = 0; i < len_min; i++){
    const tokens_pos_i = tokenizadas.map(t => t[i]);
    const todos_iguais = tokens_pos_i.every(t => t === tokens_pos_i[0]);
    if(todos_iguais){
      template_tokens.push(tokens_pos_i[0]);
    } else {
      // Posição variável — vira slot {X}, {Y}, ...
      const slot = 'var' + (vars.length + 1);
      vars.push({slot, posicao: i, valores: [...new Set(tokens_pos_i)]});
      template_tokens.push('(\\\\S+)');  // captura genérica
    }
  }

  if(vars.length === 0) return null;  // queries idênticas, não há padrão a aprender
  if(template_tokens.length - vars.length < 1) return null;  // sem âncoras fixas

  // Monta regex: âncoras + slots
  const regex_str = '^' + template_tokens.join('\\\\s+') + '\\\\s*[?!.]*$';

  return {regex_str, vars, template_legivel: template_tokens.join(' ')};
}

// ───────────────────────────────────────────────────────────────────
// Detector de gap: chamado após cada v112_processar
// ───────────────────────────────────────────────────────────────────
function _registrar_query(query, resposta, foi_fallback){
  APRENDIZ.historico.push({
    query: String(query),
    resp: String(resposta||'').substring(0, 80),
    fallback: foi_fallback,
    ts: Date.now()
  });
  if(APRENDIZ.historico.length > APRENDIZ.HISTORICO_MAX){
    APRENDIZ.historico.shift();
  }

  if(foi_fallback){
    APRENDIZ.fallbacks_recentes.push({query: String(query), ts: Date.now()});
    if(APRENDIZ.fallbacks_recentes.length > 20){
      APRENDIZ.fallbacks_recentes.shift();
    }
    _tentar_aprender();
  } else {
    // Sucesso: testar emerges em prova
    _testar_emerges_em_prova(query, resposta);
  }
}

function _tentar_aprender(){
  if(APRENDIZ.fallbacks_recentes.length < APRENDIZ.MIN_PADROES_SIMILARES) return;

  // Pegar as últimas N falhas e ver se há padrão
  const N = APRENDIZ.MIN_PADROES_SIMILARES;
  const recentes = APRENDIZ.fallbacks_recentes.slice(-N).map(f => f.query);

  // Verificar se são similares entre si
  let total_sim = 0;
  let pares = 0;
  for(let i = 0; i < recentes.length; i++){
    for(let j = i+1; j < recentes.length; j++){
      total_sim += _similaridade(recentes[i], recentes[j]);
      pares++;
    }
  }
  const sim_media = pares > 0 ? total_sim / pares : 0;
  if(sim_media < 0.5) return;  // não similares o suficiente

  // Extrair template
  const template = _extrair_template(recentes);
  if(!template) return;

  // Verificar se já não criamos esse emerge
  for(const [nome, em] of Object.entries(APRENDIZ.emerges_ativos)){
    if(em.regex_str === template.regex_str) return;
  }

  // Verificar se algum comando-nó existente já cobre — não duplicar
  if(typeof v112_comandos_listar === 'function'){
    const cmds = v112_comandos_listar();
    for(const c of cmds){
      const pad = c._padrao_str || c.padrao_str || c.padrao || '';
      if(pad === template.regex_str) return;
    }
  }

  // CRIAR SUB-REDE EMERGE
  _criar_emerge(template, recentes);
}

function _criar_emerge(template, queries_origem){
  const numero = APRENDIZ.total_aprendizagens + 1;
  const nome = 'B_emerge_' + String(numero).padStart(3, '0');

  const id_central = _getNextId();
  const central = {
    id: id_central,
    text: '[' + nome + ']',
    tipo: null, camada: 'subrede',
    pos: [260 + (numero * 5) % 50, (numero * 7) % 30, 80],
    cor: 'rosa_neon',
    acumulador: 0, limiar: 50, estado: 'experimental',
    ativacoes: 0, sucessos: 0,
    _subrede: true,
    _proposito: 'EXPERIMENTAL: criada pelo aprendiz emergencial',
    _experimental: true,
    _criada_em: new Date().toISOString(),
    _template: template.template_legivel,
    _regex_str: template.regex_str,
    _vars: template.vars,
    _queries_origem: queries_origem,
    _tentativas: 0,
    _sucessos_consecutivos: 0,
    _falhas_consecutivas: 0,
    _ativacoes: 0, _sucessos: 0
  };
  V112.nodes.push(central);
  V112.subredes[nome] = {id: id_central, satelites: [], pos: central.pos};

  APRENDIZ.emerges_ativos[nome] = {
    nome,
    id_central,
    regex_str: template.regex_str,
    regex: new RegExp(template.regex_str, 'i'),
    template: template.template_legivel,
    vars: template.vars,
    tentativas: 0,
    sucessos_consecutivos: 0,
    falhas_consecutivas: 0
  };

  // Atualizar contadores do aprendiz
  { const __c = _no_central(); if(__c) __c._emerges_criadas = (((_no_central()||{})._emerges_criadas)||0) + 1; }
  { const __c = _no_central(); if(__c) __c._ativacoes = (((_no_central()||{})._ativacoes)||0) + 1; }
  APRENDIZ.total_aprendizagens++;

  // Registrar handler emergente
  const handler_nome = 'h_emerge_' + numero;
  window.V112_HANDLERS[handler_nome] = function(m, ctx){
    // Handler básico: tenta resolver delegando pra sub-redes existentes
    const valores_vars = {};
    for(let i = 0; i < template.vars.length; i++){
      valores_vars[template.vars[i].slot] = m[i+1];
    }
    // Marcar tentativa
    if(APRENDIZ.emerges_ativos[nome]){
      APRENDIZ.emerges_ativos[nome].tentativas++;
    }
    return {
      resposta_direta: '[emerge ' + nome + '] padrão "' + template.template_legivel + '" identificado, vars=' + JSON.stringify(valores_vars) + ' — aprendendo...',
      tratou: true,
      _emerge: nome
    };
  };

  // Registrar comando-nó
  if(typeof v112_comando_criar_no === 'function'){
    try {
      v112_comando_criar_no(template.regex_str, handler_nome, {
        prioridade: 70,  // baixa, pra não atrapalhar comandos confirmados
        descricao: 'aprendizado emergente #' + numero,
        categoria: 'emerge'
      });
    } catch(e){}
  }

  return central;
}

function _testar_emerges_em_prova(query, resposta){
  // Para cada emerge ativo, ver se a query casa com o padrão dele
  for(const [nome, em] of Object.entries(APRENDIZ.emerges_ativos)){
    if(em.regex.test(query)){
      // Verificar se a resposta NÃO foi fallback (já vimos que não foi)
      em.sucessos_consecutivos++;
      em.falhas_consecutivas = 0;

      const central = v112_node_by_id(em.id_central);
      if(central){
        central._sucessos_consecutivos = em.sucessos_consecutivos;
        central._sucessos = (central._sucessos||0) + 1;
        central._ativacoes = (central._ativacoes||0) + 1;
      }

      if(em.sucessos_consecutivos >= APRENDIZ.PROMOVER_APOS){
        _promover_emerge(nome);
      }
    }
  }
}

function _promover_emerge(nome){
  const em = APRENDIZ.emerges_ativos[nome];
  if(!em) return;
  const central = v112_node_by_id(em.id_central);
  if(central){
    central.estado = 'promovido';
    central._experimental = false;
    central._promovido_em = new Date().toISOString();
  }
  { const __c = _no_central(); if(__c) __c._emerges_promovidas = (((_no_central()||{})._emerges_promovidas)||0) + 1; }
  delete APRENDIZ.emerges_ativos[nome];  // sai da prova
}

function _descartar_emerge(nome){
  const em = APRENDIZ.emerges_ativos[nome];
  if(!em) return;

  // Remover sub-rede
  delete V112.subredes[nome];
  // Remover nó central
  V112.nodes = V112.nodes.filter(n => n.id !== em.id_central);

  // Remover comando-nó associado
  if(typeof v112_comandos_listar === 'function'){
    const cmds = v112_comandos_listar();
    const cmd_alvo = cmds.find(c => {
      const pad = c._padrao_str || c.padrao_str || c.padrao || '';
      return pad === em.regex_str;
    });
    if(cmd_alvo && cmd_alvo.id && typeof v112_comando_remover === 'function'){
      try { v112_comando_remover(cmd_alvo.id); } catch(e){}
    }
  }

  // Remover handler
  const numero_match = nome.match(/_(\\d+)$/);
  if(numero_match){
    delete window.V112_HANDLERS['h_emerge_' + parseInt(numero_match[1])];
  }

  { const __c = _no_central(); if(__c) __c._emerges_descartadas = (((_no_central()||{})._emerges_descartadas)||0) + 1; }
  APRENDIZ.total_descartes++;
  delete APRENDIZ.emerges_ativos[nome];
}

// ───────────────────────────────────────────────────────────────────
// HOOK no v112_processar: observador pós-processamento
// ───────────────────────────────────────────────────────────────────
const _original_processar = window.v112_processar;
if(typeof _original_processar === 'function' && !window._v153_hooked){
  window.v112_processar = function(input, ...args){
    const resultado = _original_processar.apply(this, [input, ...args]);

    // Detectar fallback: resposta vazia, "hm.", "não entendi", "...", muito curta repetindo input
    try {
      const resp = String(resultado && resultado.resposta || '').toLowerCase().trim();
      const input_lower = String(input||'').toLowerCase().trim();

      // Heurísticas de fallback
      const eh_vazio = !resp;
      const eh_hm = resp === 'hm.' || resp === 'hmm' || resp === 'hm';
      const eh_pontos = resp === '...' || resp === '..' || resp === '.';
      const eh_n_entendi = resp.includes('não entendi') || resp.includes('nao entendi');
      const eh_interrog = resp === '?' || resp === '??';
      const muito_pobre = resp.length > 0 && resp.length <= 2;

      // Resposta "eco" ou muito curta sem estrutura: provavelmente fallback
      const palavras_resp = resp.replace(/[,;.!?:]+/g, ' ').split(/\\s+/).filter(p => p.length > 1);
      const tokens_input = input_lower.replace(/[,;.!?:]+/g, ' ').split(/\\s+/).filter(Boolean);

      // Eco: palavras todas vindas do input
      let eh_eco = false;
      if(palavras_resp.length > 0 && palavras_resp.length <= 5 && resp.length < 40){
        const todas_estao_no_input = palavras_resp.every(p => tokens_input.includes(p));
        eh_eco = todas_estao_no_input;
      }

      // Resposta "pobre": só 1 palavra avulsa curta (< 20 chars), provável resíduo
      const eh_resp_solta = palavras_resp.length === 1 && resp.length < 20 && !resp.match(/[0-9]/);

      // Resposta no formato "X → Y" onde Y é palavra do input (não aprendeu nada)
      const m_seta = resp.match(/^(.+?)\\s*→\\s*(\\S+)$/);
      const eh_seta_pobre = m_seta && m_seta[2].length < 15 && input_lower.includes(m_seta[2].toLowerCase());

      const foi_fallback = eh_vazio || eh_hm || eh_pontos || eh_n_entendi ||
                           eh_interrog || muito_pobre || eh_eco || eh_resp_solta || eh_seta_pobre ||
                           (resultado && resultado.fallback === true);   // FIX 27/05: respeita flag explícito do v158

      _registrar_query(input, resultado && resultado.resposta || '', foi_fallback);
    } catch(e){}

    return resultado;
  };
  window._v153_hooked = true;
}

// ───────────────────────────────────────────────────────────────────
// Handlers de inspeção/controle (úteis em chat)
// ───────────────────────────────────────────────────────────────────
window.V112_HANDLERS = window.V112_HANDLERS || {};

window.V112_HANDLERS.h_aprendiz_status = function(m, ctx){
  const linhas = [];
  linhas.push('aprendiz emergencial (auto-mod tipo 2):');
  linhas.push('  emerges criadas:     ' + (((_no_central()||{})._emerges_criadas)||0));
  linhas.push('  emerges promovidas:  ' + (((_no_central()||{})._emerges_promovidas)||0));
  linhas.push('  emerges descartadas: ' + (((_no_central()||{})._emerges_descartadas)||0));
  linhas.push('  fallbacks recentes:  ' + APRENDIZ.fallbacks_recentes.length);
  linhas.push('  histórico de queries: ' + APRENDIZ.historico.length);
  linhas.push('  emerges em prova ativas:');
  for(const [nome, em] of Object.entries(APRENDIZ.emerges_ativos)){
    linhas.push('    ' + nome + ' "' + em.template + '" sucessos=' + em.sucessos_consecutivos + ' falhas=' + em.falhas_consecutivas);
  }
  if(Object.keys(APRENDIZ.emerges_ativos).length === 0){
    linhas.push('    (nenhuma)');
  }
  return {resposta_direta: linhas.join('\\n'), tratou: true};
};

window.V112_HANDLERS.h_aprendiz_listar_emerges = function(m, ctx){
  const emerges = V112.nodes.filter(n => (n.text||'').startsWith('[B_emerge_'));
  if(emerges.length === 0){
    return {resposta_direta: 'nenhuma sub-rede emerge criada', tratou: true};
  }
  const linhas = ['sub-redes emerges criadas (auto-mod tipo 2):'];
  for(const e of emerges){
    linhas.push('  ' + e.text + ' estado=' + e.estado + ' template="' + (e._template||'?') + '" ativacoes=' + (e._ativacoes||0) + ' sucessos=' + (e._sucessos||0));
  }
  return {resposta_direta: linhas.join('\\n'), tratou: true};
};

window.V112_HANDLERS.h_aprendiz_descartar_todas = function(m, ctx){
  const nomes = Object.keys(APRENDIZ.emerges_ativos);
  for(const nome of nomes){
    _descartar_emerge(nome);
  }
  return {resposta_direta: 'descartadas ' + nomes.length + ' emerges em prova', tratou: true};
};

// Função pública pra inspeção via código
window.v112_aprendiz_status = function(){
  return {
    emerges_criadas: (_no_central()||{})._emerges_criadas||0,
    emerges_promovidas: (_no_central()||{})._emerges_promovidas||0,
    emerges_descartadas: (_no_central()||{})._emerges_descartadas||0,
    emerges_ativas: Object.keys(APRENDIZ.emerges_ativos),
    fallbacks_recentes: APRENDIZ.fallbacks_recentes.length,
    historico_size: APRENDIZ.historico.length
  };
};

window.v112_aprendiz_forcar_aprender = function(){
  // Útil pra testes — força tentativa de aprendizado mesmo sem 3 falhas
  _tentar_aprender();
};

// ───────────────────────────────────────────────────────────────────
// REGISTRAR COMANDOS-NÓ
// ───────────────────────────────────────────────────────────────────
function _aprendiz_registrar_cmd(padrao, handler_nome, descricao, prio){
  if(typeof v112_comando_criar_no !== 'function') return;
  try {
    v112_comando_criar_no(padrao, handler_nome, {
      prioridade: prio || 80,
      descricao: descricao,
      categoria: 'aprendiz'
    });
  } catch(e){}
}

_aprendiz_registrar_cmd('^status\\\\s+aprendiz$',
  'h_aprendiz_status', 'status do aprendiz emergencial', 85);

_aprendiz_registrar_cmd('^(?:listar\\\\s+)?emerges$',
  'h_aprendiz_listar_emerges', 'listar sub-redes emerges criadas', 85);

_aprendiz_registrar_cmd('^descartar\\\\s+(?:todas\\\\s+)?emerges$',
  'h_aprendiz_descartar_todas', 'descartar todas emerges em prova', 85);

console.log('[v153_auto_mod_necessidade] carregado: B_aprendiz_emergencial + 3 handlers');

})();
`});
