// ─── REGIÃO 08/14 — v156_evolucao.js ───
window._ARCH_MODULOS.push({nome:"v156_evolucao.js", src: `
// ═══════════════════════════════════════════════════════════════════
// v156_evolucao.js — Auto-mod TIPO 4
//
// METÁFORA BIOLÓGICA:
//   Não existe "versão" no cérebro real. Quando uma estrutura evolui,
//   ela nasce JÁ ADAPTADA aos erros/acertos do passado. A geração
//   anterior fica como "fóssil" (não responde, mas é registrada).
//
// QUANDO ATIVA:
//   Após período de STRESS (leve ou alto) que JÁ PASSOU.
//   = stress global subiu acima de limiar e depois voltou ao normal.
//   Sistema usa esse momento de calma vitoriosa pra evoluir estruturas.
//
// O QUE FAZ (global, todas sub-redes):
//   1. COLETA — analisa quais sub-redes tiveram acertos/erros
//   2. COMPARA — identifica padrões das vitoriosas que poderiam ajudar outras
//   3. EVOLUI — cria sub-rede da "nova geração" já adaptada
//      - Herda handlers das vitoriosas relevantes
//      - Incorpora correções dos erros
//      - Recebe novo _id_evolucao (incrementa)
//   4. CICATRIZ — geração anterior some de V112.subredes mas fica como
//      nó com _geracao_anterior=true
//   5. SE A NOVA FALHAR — vira cicatriz também; anterior pode voltar
//
// NÃO modifica v112_core/v112_brain. Append-only.
// ═══════════════════════════════════════════════════════════════════

(function(){

if(typeof V112 === 'undefined') return;
if(typeof window === 'undefined') var window = global;

// ───────────────────────────────────────────────────────────────────
// CONSTANTES DE EVOLUÇÃO
// ───────────────────────────────────────────────────────────────────
const EVOL = {
  // Trigger: pico de stress + queda subsequente
  LIMIAR_STRESS_PICO: 20,        // stress global mínimo p/ ser "período de stress"
  LIMIAR_STRESS_CALMA: 5,         // stress global p/ ser "passou"
  TURNOS_CALMA_NECESSARIOS: 10,   // turnos seguidos calmo p/ disparar evolução

  // Critérios de "vitoriosa" (boa pra herdar padrões)
  MIN_ATIVACOES_VITORIA: 5,
  MIN_TAXA_SUCESSO_VITORIA: 0.7,

  // Critérios de "candidata a evoluir" (precisa melhorar)
  MIN_ATIVACOES_CANDIDATA: 10,
  MAX_TAXA_SUCESSO_CANDIDATA: 0.6,

  // Geração nova em prova
  PROVA_SUCESSOS: 3,    // sucessos consecutivos p/ confirmar geração nova
  PROVA_FALHAS: 5,      // falhas consecutivas → reverte
  TURNOS_MAX_PROVA: 50,

  // Limite de evoluções simultâneas
  MAX_EVOLUCOES_PROVA: 2
};

// Sub-redes estruturais — NÃO evoluem
const NAO_EVOLUI = new Set([
  'B_prioridade','B_atencao','B_iterador','B_propagacao',
  'B_compositor','B_introspector','B_estado','B_mundo',
  'B_planejamento','B_objetivo','B_curiosidade',
  'B_metacontexto','B_contexto','B_amigdala','B_hipocampo',
  'B_dopamina','B_serotonina','B_gaba',
  'B_aprendiz_emergencial','B_aprendiz_meta','B_valvula_escape',
  'B_gerador_comandos','B_evolucao'
]);

function _eh_evoluivel(nome){
  if(NAO_EVOLUI.has(nome)) return false;
  if(nome.startsWith('B_valvula_')) return false;
  if(nome.startsWith('B_emerge_')) return false;
  if(nome.startsWith('B_aux_')) return false;
  if(nome.endsWith('__gen0')) return false;  // cicatriz
  if(nome.endsWith('__gen1')) return false;
  if(nome.endsWith('__gen2')) return false;
  return true;
}

// ───────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────
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
// ESTADO INTERNO
// ───────────────────────────────────────────────────────────────────
const STATE = {
  hist_stress: [],          // [{turno, stress_global}]
  HIST_MAX: 50,
  turno: 0,
  ja_teve_pico: false,      // viu stress alto
  turnos_seguidos_calmos: 0,

  evolucoes_prova: {},      // {nome_base: {id_nova, id_anterior_cicatriz, ...}}

  total_evolucoes_disparadas: 0,
  total_evolucoes_confirmadas: 0,
  total_evolucoes_revertidas: 0
};

// ───────────────────────────────────────────────────────────────────
// SUB-REDE B_evolucao (central)
// ───────────────────────────────────────────────────────────────────
function v156_init(){
  let central;
  if(V112.subredes.B_evolucao){
    central = v112_node_by_id(V112.subredes.B_evolucao.id);
  } else {
    const id = _getNextId();
    central = {
      id, text:'[B_evolucao]',
      tipo:null, camada:'subrede',
      pos:[300, 30, 100],
      cor:'verde_esmeralda',
      acumulador:0, limiar:50, estado:'dormindo',
      ativacoes:0, sucessos:0,
      _subrede:true,
      _proposito:'Auto-mod tipo 4: evolui sub-redes após período de stress (analogia biológica)'
    };
    V112.nodes.push(central);
    V112.subredes.B_evolucao = {id, satelites:[], pos:central.pos};
  }

  if(central._ativacoes === undefined) central._ativacoes = 0;
  if(central._sucessos === undefined) central._sucessos = 0;
  if(central._evolucoes_disparadas === undefined) central._evolucoes_disparadas = 0;
  if(central._evolucoes_confirmadas === undefined) central._evolucoes_confirmadas = 0;
  if(central._evolucoes_revertidas === undefined) central._evolucoes_revertidas = 0;
  if(central._ultimo_disparo === undefined) central._ultimo_disparo = null;

  return central;
}

function _no_central(){
  if(!V112.subredes.B_evolucao) return null;
  return v112_node_by_id(V112.subredes.B_evolucao.id);
}

v156_init();

// ───────────────────────────────────────────────────────────────────
// ANÁLISE: identifica vitoriosas e candidatas
// ───────────────────────────────────────────────────────────────────
function _analisar_subredes(){
  const vitoriosas = [];
  const candidatas = [];

  for(const nome of Object.keys(V112.subredes)){
    if(!_eh_evoluivel(nome)) continue;
    const no = v112_node_by_id(V112.subredes[nome].id);
    if(!no) continue;

    const atv = no._ativacoes || 0;
    const suc = no._sucessos || 0;
    const taxa = atv > 0 ? suc / atv : 0;

    if(atv >= EVOL.MIN_ATIVACOES_VITORIA && taxa >= EVOL.MIN_TAXA_SUCESSO_VITORIA){
      vitoriosas.push({nome, no, atv, suc, taxa});
    }
    if(atv >= EVOL.MIN_ATIVACOES_CANDIDATA && taxa <= EVOL.MAX_TAXA_SUCESSO_CANDIDATA){
      candidatas.push({nome, no, atv, suc, taxa});
    }
  }

  return {vitoriosas, candidatas};
}

// ───────────────────────────────────────────────────────────────────
// COMPARAÇÃO: extrai "lições" das vitoriosas
// ───────────────────────────────────────────────────────────────────
function _extrair_licoes(vitoriosas){
  const licoes = {
    // Técnicas usadas pelas vitoriosas
    usa_regex_validacao: 0,      // sub-rede tem _regex_str
    usa_storage_proprio: 0,      // tem _registros, _tags, etc
    tem_purpose_claro: 0,        // _proposito definido
    tem_helpers_internos: 0,     // _helpers/handlers próprios

    // Padrões de nomenclatura/estrutura
    handlers_compartilhados: {}, // {nome_handler: count}
    categorias_handlers: {},     // {categoria: count}

    // Score médio das vitoriosas
    score_medio: 0
  };

  let score_total = 0;
  for(const v of vitoriosas){
    if(v.no._regex_str) licoes.usa_regex_validacao++;
    if(v.no._registros || v.no._tags || v.no._cache) licoes.usa_storage_proprio++;
    if(v.no._proposito) licoes.tem_purpose_claro++;
    score_total += v.taxa;
  }
  licoes.score_medio = vitoriosas.length > 0 ? score_total / vitoriosas.length : 0;

  // Coletar handlers e categorias comuns
  if(typeof v112_comandos_listar === 'function'){
    try {
      const cmds = v112_comandos_listar();
      for(const c of cmds){
        const cat = (c._padrao_str && c._padrao_str.categoria) ||
                   c._categoria || 'geral';
        licoes.categorias_handlers[cat] = (licoes.categorias_handlers[cat]||0) + 1;
      }
    } catch(e){}
  }

  return licoes;
}

// ───────────────────────────────────────────────────────────────────
// EVOLUIR: cria nova geração de uma sub-rede candidata
// ───────────────────────────────────────────────────────────────────
function _evoluir_subrede(candidata, licoes){
  const nome = candidata.nome;
  if(EVOL.evolucoes_prova && Object.keys(STATE.evolucoes_prova).length >= EVOL.MAX_EVOLUCOES_PROVA) return null;
  if(STATE.evolucoes_prova[nome]) return null;  // já em evolução

  const id_antigo = V112.subredes[nome].id;
  const no_antigo = v112_node_by_id(id_antigo);
  if(!no_antigo) return null;

  // Determinar id_evolucao (incrementa)
  const id_evolucao_atual = no_antigo._id_evolucao || 1;
  const id_evolucao_novo = id_evolucao_atual + 1;

  // 1. CICATRIZ: marca a geração anterior
  // Some de V112.subredes mas fica como nó com _geracao_anterior=true
  const nome_cicatriz = nome + '__gen' + id_evolucao_atual;
  no_antigo.text = '[' + nome_cicatriz + ']';
  no_antigo._geracao_anterior = true;
  no_antigo._evoluido_em = new Date().toISOString();
  no_antigo._estado_pre_evolucao = {
    ativacoes: candidata.atv,
    sucessos: candidata.suc,
    taxa: candidata.taxa
  };
  no_antigo.estado = 'cicatriz';
  // Remove de V112.subredes (cicatriz não responde mais)
  delete V112.subredes[nome];

  // 2. NOVA GERAÇÃO: nasce com nome canônico, já adaptada
  const id_novo = _getNextId();
  const central_novo = {
    id: id_novo,
    text: '[' + nome + ']',
    tipo: null, camada: 'subrede',
    pos: [no_antigo.pos[0] + 5, no_antigo.pos[1], no_antigo.pos[2]],
    cor: no_antigo.cor,
    acumulador: 0, limiar: 50,
    estado: 'nascida_em_evolucao',
    ativacoes: 0, sucessos: 0,

    _subrede: true,
    _proposito: (no_antigo._proposito || '') + ' [evoluída]',
    _ativacoes: 0, _sucessos: 0,
    _id_evolucao: id_evolucao_novo,
    _nasceu_em: new Date().toISOString(),
    _pai_id: id_antigo,
    _pai_nome_cicatriz: nome_cicatriz,
    _licoes_herdadas: {
      usa_regex_validacao: licoes.usa_regex_validacao > 0,
      usa_storage_proprio: licoes.usa_storage_proprio > 0,
      score_medio_vitoriosas: licoes.score_medio
    },

    // HERDA dados do pai (storage, helpers, etc) — não começa do zero
    _registros: no_antigo._registros ? JSON.parse(JSON.stringify(no_antigo._registros)) : null,
    _tags: no_antigo._tags ? JSON.parse(JSON.stringify(no_antigo._tags)) : null,
    _cache: no_antigo._cache ? JSON.parse(JSON.stringify(no_antigo._cache)) : null,

    // Marca evolutiva: o que herda das vitoriosas
    _heranca_evolutiva: {
      tem_validacao_extra: true,        // nova sempre tem try/catch defensivo
      tem_score_decisao: licoes.score_medio > 0.8,
      cor_herdada: no_antigo.cor
    }
  };

  V112.nodes.push(central_novo);
  V112.subredes[nome] = {id: id_novo, satelites: [], pos: central_novo.pos};

  // 3. Registrar em prova
  STATE.evolucoes_prova[nome] = {
    nome_canonico: nome,
    id_novo,
    id_cicatriz: id_antigo,
    nome_cicatriz,
    id_evolucao: id_evolucao_novo,
    nascimento_turno: STATE.turno,
    sucessos_consecutivos: 0,
    falhas_consecutivas: 0,
    ativacoes_inicial: 0
  };

  // 4. Atualizar contador
  STATE.total_evolucoes_disparadas++;
  const cen = _no_central();
  if(cen){
    cen._evolucoes_disparadas = (cen._evolucoes_disparadas||0) + 1;
    cen._ativacoes = (cen._ativacoes||0) + 1;
    cen._ultimo_disparo = new Date().toISOString();
  }

  // 5. LIMPEZA DE GERAÇÕES MUITO ANTIGAS
  // Se a sub-rede tinha cicatrizes __gen anteriores (gen anteriores), e a nova é gen >= 3,
  // remove a __gen mais antiga (limpeza de memória ancestral)
  if(id_evolucao_novo >= 3){
    const gen_mais_antiga = nome + '__gen' + (id_evolucao_novo - 3);
    const cicatriz_antiga = V112.nodes.find(n => (n.text||'') === '[' + gen_mais_antiga + ']');
    if(cicatriz_antiga){
      // Marca pra remoção lógica (sem deletar do array pra integridade)
      cicatriz_antiga._removida = true;
      cicatriz_antiga.text = '[' + gen_mais_antiga + '_removida]';
      cicatriz_antiga.estado = 'fossil_removido';
    }
  }

  return central_novo;
}

// ───────────────────────────────────────────────────────────────────
// AVALIAR EVOLUÇÕES EM PROVA
// ───────────────────────────────────────────────────────────────────
function _avaliar_evolucoes(){
  for(const [nome, ev] of Object.entries(STATE.evolucoes_prova)){
    const novo = v112_node_by_id(ev.id_novo);
    if(!novo) continue;

    const atv = novo._ativacoes || 0;
    const suc = novo._sucessos || 0;
    const turnos_vida = STATE.turno - ev.nascimento_turno;

    // Em prova precisa de pelo menos algumas ativações pra ser avaliada
    if(atv >= EVOL.PROVA_SUCESSOS){
      const taxa = suc / atv;
      if(taxa >= 0.7){
        // CONFIRMA — geração nova vingou
        novo.estado = 'confirmada';
        novo._confirmada_em = new Date().toISOString();
        STATE.total_evolucoes_confirmadas++;
        const cen = _no_central();
        if(cen) cen._evolucoes_confirmadas = (cen._evolucoes_confirmadas||0) + 1;
        delete STATE.evolucoes_prova[nome];
      } else if(suc < atv - EVOL.PROVA_FALHAS){
        // REVERTE — geração nova falhou, restaurar cicatriz
        _reverter_evolucao(nome, ev);
      }
    } else if(turnos_vida > EVOL.TURNOS_MAX_PROVA){
      // Nova não foi usada o suficiente — não há como avaliar, fica em estado dormente
      novo.estado = 'dormente_nao_avaliada';
      delete STATE.evolucoes_prova[nome];
    }
  }
}

function _reverter_evolucao(nome, ev){
  const novo = v112_node_by_id(ev.id_novo);
  const antigo = v112_node_by_id(ev.id_cicatriz);

  if(novo){
    // Nova vira fóssil descartado
    novo.text = '[' + nome + '__gen' + ev.id_evolucao + '_falhou]';
    novo.estado = 'fossil_descartado';
    novo._descartada = true;
    novo._falhou_em = new Date().toISOString();
  }

  if(antigo){
    // Cicatriz volta a ser canônica
    antigo.text = '[' + nome + ']';
    antigo._geracao_anterior = false;
    antigo._restaurada_em = new Date().toISOString();
    antigo.estado = 'restaurada_pos_falha_evolucao';
    V112.subredes[nome] = {id: ev.id_cicatriz, satelites:[], pos: antigo.pos};
  }

  STATE.total_evolucoes_revertidas++;
  const cen = _no_central();
  if(cen) cen._evolucoes_revertidas = (cen._evolucoes_revertidas||0) + 1;
  delete STATE.evolucoes_prova[nome];
}

// ───────────────────────────────────────────────────────────────────
// DETECTOR: período de stress → calma (trigger pra evoluir)
// ───────────────────────────────────────────────────────────────────
function _checar_trigger(){
  // Tenta ler stress global do v155
  let stress_atual = 0;
  if(typeof window.v112_escape_status === 'function'){
    try {
      const st = window.v112_escape_status();
      stress_atual = st.stress_global || 0;
    } catch(e){}
  }

  STATE.hist_stress.push({turno: STATE.turno, stress: stress_atual});
  if(STATE.hist_stress.length > STATE.HIST_MAX) STATE.hist_stress.shift();

  // Detectar "houve pico"
  if(stress_atual >= EVOL.LIMIAR_STRESS_PICO){
    STATE.ja_teve_pico = true;
    STATE.turnos_seguidos_calmos = 0;
    return false;
  }

  // Detectar "está calmo"
  if(stress_atual <= EVOL.LIMIAR_STRESS_CALMA && STATE.ja_teve_pico){
    STATE.turnos_seguidos_calmos++;
    if(STATE.turnos_seguidos_calmos >= EVOL.TURNOS_CALMA_NECESSARIOS){
      // TRIGGER! Período de stress passou.
      STATE.ja_teve_pico = false;
      STATE.turnos_seguidos_calmos = 0;
      return true;
    }
  }

  return false;
}

// ───────────────────────────────────────────────────────────────────
// CICLO DE EVOLUÇÃO
// ───────────────────────────────────────────────────────────────────
function _executar_ciclo_evolucao(){
  const {vitoriosas, candidatas} = _analisar_subredes();

  // Sem dados suficientes? skip
  if(vitoriosas.length === 0 && candidatas.length === 0) return;

  const licoes = _extrair_licoes(vitoriosas);

  // Evoluir as candidatas (com base no que aprendeu das vitoriosas)
  for(const c of candidatas){
    _evoluir_subrede(c, licoes);
  }

  // Atualizar nó central
  const cen = _no_central();
  if(cen){
    cen._ultimo_ciclo = {
      turno: STATE.turno,
      vitoriosas: vitoriosas.length,
      candidatas: candidatas.length,
      evoluidas: candidatas.length,
      timestamp: new Date().toISOString()
    };
  }
}

// ───────────────────────────────────────────────────────────────────
// HOOK NO PROCESSAR
// ───────────────────────────────────────────────────────────────────
const _orig_processar = window.v112_processar;
if(typeof _orig_processar === 'function' && !window._v156_hooked){
  window.v112_processar = function(input, ...args){
    const resultado = _orig_processar.apply(this, [input, ...args]);

    try {
      STATE.turno++;

      // Checar trigger (stress passou → evolui)
      if(_checar_trigger()){
        _executar_ciclo_evolucao();
      }

      // Avaliar evoluções em prova a cada N turnos
      if(STATE.turno % 5 === 0){
        _avaliar_evolucoes();
      }
    } catch(e){}

    return resultado;
  };
  window._v156_hooked = true;
}

// ───────────────────────────────────────────────────────────────────
// HANDLERS NL
// ───────────────────────────────────────────────────────────────────
window.V112_HANDLERS = window.V112_HANDLERS || {};

window.V112_HANDLERS.h_evolucao_status = function(m, ctx){
  const cen = _no_central();
  if(!cen) return {resposta_direta:'B_evolucao ausente', tratou:true};

  const linhas = [
    'B_evolucao (auto-mod tipo 4):',
    '  evoluções disparadas:  ' + (cen._evolucoes_disparadas||0),
    '  evoluções confirmadas: ' + (cen._evolucoes_confirmadas||0),
    '  evoluções revertidas:  ' + (cen._evolucoes_revertidas||0),
    '  em prova ativas:       ' + Object.keys(STATE.evolucoes_prova).length,
    '  já viu pico:           ' + STATE.ja_teve_pico,
    '  turnos calmos:         ' + STATE.turnos_seguidos_calmos + '/' + EVOL.TURNOS_CALMA_NECESSARIOS
  ];
  if(cen._ultimo_ciclo){
    linhas.push('  último ciclo: vit=' + cen._ultimo_ciclo.vitoriosas + ' cand=' + cen._ultimo_ciclo.candidatas);
  }
  return {resposta_direta: linhas.join('\\n'), tratou:true};
};

window.V112_HANDLERS.h_evolucao_listar = function(m, ctx){
  // Lista sub-redes que evoluíram + cicatrizes
  const evoluidas = V112.nodes.filter(n => n._id_evolucao && n._id_evolucao > 1 && !n._geracao_anterior && !n._descartada);
  const cicatrizes = V112.nodes.filter(n => n._geracao_anterior && !n._removida);

  if(evoluidas.length === 0 && cicatrizes.length === 0){
    return {resposta_direta:'nenhuma evolução registrada', tratou:true};
  }
  const linhas = ['estruturas evoluídas:'];
  for(const e of evoluidas){
    linhas.push('  ' + e.text + ' gen=' + e._id_evolucao + ' estado=' + e.estado);
  }
  if(cicatrizes.length > 0){
    linhas.push('cicatrizes (gerações anteriores):');
    for(const c of cicatrizes){
      linhas.push('  ' + c.text + ' (estado_pre: taxa=' + ((c._estado_pre_evolucao||{}).taxa||0).toFixed(2) + ')');
    }
  }
  return {resposta_direta: linhas.join('\\n'), tratou:true};
};

window.V112_HANDLERS.h_evolucao_forcar = function(m, ctx){
  // "forçar evolução" — útil pra teste
  const {vitoriosas, candidatas} = _analisar_subredes();
  if(candidatas.length === 0){
    return {resposta_direta:'nenhuma candidata a evoluir (precisa atv>=10 e taxa<=0.6)', tratou:true};
  }
  const licoes = _extrair_licoes(vitoriosas);
  let n = 0;
  for(const c of candidatas){
    if(_evoluir_subrede(c, licoes)) n++;
  }
  return {resposta_direta:'forçou ' + n + ' evolução(ões) com base em ' + vitoriosas.length + ' vitoriosa(s)', tratou:true};
};

if(typeof v112_comando_criar_no === 'function'){
  try {
    v112_comando_criar_no('^status\\\\s+evolu[çc][ãa]o$', 'h_evolucao_status', {prioridade:85, descricao:'status do sistema de evolução', categoria:'evolucao'});
    v112_comando_criar_no('^(?:listar\\\\s+)?evolu[çc][õo]es$', 'h_evolucao_listar', {prioridade:85, descricao:'listar evoluções e cicatrizes', categoria:'evolucao'});
    v112_comando_criar_no('^for[çc]ar\\\\s+evolu[çc][ãa]o$', 'h_evolucao_forcar', {prioridade:85, descricao:'forçar ciclo evolutivo', categoria:'evolucao'});
  } catch(e){}
}

// ───────────────────────────────────────────────────────────────────
// API DEBUG
// ───────────────────────────────────────────────────────────────────
window.v112_evolucao_status = function(){
  const cen = _no_central();
  if(!cen) return {erro:'ausente'};
  return {
    turno: STATE.turno,
    ja_teve_pico: STATE.ja_teve_pico,
    turnos_calmos: STATE.turnos_seguidos_calmos,
    evolucoes_disparadas: cen._evolucoes_disparadas||0,
    evolucoes_confirmadas: cen._evolucoes_confirmadas||0,
    evolucoes_revertidas: cen._evolucoes_revertidas||0,
    em_prova: Object.keys(STATE.evolucoes_prova),
    ultimo_ciclo: cen._ultimo_ciclo
  };
};

window.v112_evolucao_forcar = function(){
  const {vitoriosas, candidatas} = _analisar_subredes();
  const licoes = _extrair_licoes(vitoriosas);
  let evoluidas = 0;
  for(const c of candidatas){
    if(_evoluir_subrede(c, licoes)) evoluidas++;
  }
  return {vitoriosas: vitoriosas.length, candidatas: candidatas.length, evoluidas};
};

console.log('[v156_evolucao] carregado: B_evolucao (auto-mod tipo 4 — evolução biológica)');

})();
`});
