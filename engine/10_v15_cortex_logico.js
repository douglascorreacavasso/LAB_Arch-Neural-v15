// ─── REGIÃO 10/14 — v15_cortex_logico.js ───
window._ARCH_MODULOS.push({nome:"v15_cortex_logico.js", src: `
// ═══════════════════════════════════════════════════════════════════════════
// v15_cortex_logico.js — B_cortex_computacional
//
// Lab V15 — Córtex Computacional (lado matemático do cérebro, H_MAT)
//
// FUNDE 3 áreas que sempre foram a mesma coisa (lógica de programação):
//   - v151_logica_prog.js  → pseudo-código, tradução, complexidade, bugs
//   - v152_afastamentos.js → caso real RH (calendário, vínculos)
//   - v157_turing.js       → ABSORVIDO (loops, escopo, causal reverso, decomposição)
//
// FILOSOFIA:
//   - Lógica de programação é UMA coisa só (não 3 ilhas)
//   - Anatomia dentro do cérebro (nós/sub-redes), comportamento no JS
//   - Inibição lateral: quando córtex acorda, silencia o resto via GABA
//   - SEM teto de loops (decisão Douglas: energia gira até cond liberar)
//   - Estrutura base FIXA (auto-mods criam novo, não modificam base)
//   - Auto-mods interagem 100%
//   - v151 e v152 continuam carregados; córtex orquestra via consulta interna
//
// 13 nós-órgão estruturais:
//   1 núcleo central (B_cortex_computacional)
//   3 sensores (N_detector_simbolos, _palavras_chave, _estrutura)
//   4 motores (M_atribuicao, M_aritmetico, M_comparador, M_clock)
//   3 controladores (N_loop_controller, N_if_controller, N_function_controller)
//   1 debugger (N_debugger_reverso)
//   1 GABA lateral (N_gaba_lateral)
//
// Estado da VM persiste DENTRO do nó central em _estado_vm
// (não em V112._turing solto que o v157 fazia)
// ═══════════════════════════════════════════════════════════════════════════

(function(){
'use strict';

// Proteção contra dupla instalação
if(typeof window !== 'undefined' && window._v15_hook_instalado){
  console.log('[v15_cortex_logico] hook já instalado, pulando re-instalação');
  return;
}
if(typeof V112 === 'undefined' || !V112 || !V112.subredes){
  console.log('[v15_cortex_logico] V112 não pronto, abortando');
  return;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: gerar próximo ID
// ═══════════════════════════════════════════════════════════════════════════
function _getNextId(){
  let max = (V112._next_node_id || 0);
  for(const n of V112.nodes){
    if(typeof n.id === 'number' && n.id > max) max = n.id;
    if(typeof n.id === 'string'){
      const m = n.id.match(/^n_(\\d+)$/);
      if(m){ const v = parseInt(m[1]); if(v > max) max = v; }
    }
  }
  const novo = max + 1;
  // CRITICAL: sincroniza o contador global do brain pra evitar colisão
  V112._next_node_id = novo + 1;
  return 'n_' + novo;
}

function _no_central(){
  if(!V112.subredes.B_cortex_computacional) return null;
  return v112_node_by_id(V112.subredes.B_cortex_computacional.id);
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 2 — ANATOMIA (13 nós-órgão)
// ═══════════════════════════════════════════════════════════════════════════

function _criar_subrede_se_nao_existe(nome, props){
  if(V112.subredes[nome]){
    const no_exist = v112_node_by_id(V112.subredes[nome].id);
    return no_exist;
  }
  const id = _getNextId();
  const no = {
    id,
    text: '[' + nome + ']',
    tipo: null,
    camada: props.camada || 'subrede',
    pos: props.pos || [0, 0, 0],
    cor: props.cor || 'cinza',
    acumulador: 0,
    limiar: props.limiar || 1,
    threshold: props.limiar || 1,
    estado: props.estado || 'dormindo',
    ativacoes: 0,
    sucessos: 0,
    _subrede: true,
    _proposito: props.proposito || '',
    _criado_em: new Date().toISOString(),
    _criado_por: 'v15_cortex_logico'
  };
  if(props.categoria) no._categoria = props.categoria;
  if(nome.startsWith('N_detector')) no._eh_detector = true;
  if(nome.startsWith('M_')) no._eh_motor = true;
  if(nome === 'N_loop_controller' || nome === 'N_if_controller' || nome === 'N_function_controller'){
    no._eh_controlador = true;
  }
  if(nome === 'N_debugger_reverso') no._eh_debugger = true;
  if(nome === 'N_gaba_lateral') no._eh_gaba_local = true;
  
  V112.nodes.push(no);
  V112.subredes[nome] = { id, satelites: [], pos: no.pos };
  return no;
}

function v15_init_anatomia(){
  // 1. Núcleo central
  _criar_subrede_se_nao_existe('B_cortex_computacional', {
    pos: [250, 20, 100],
    cor: 'dourado_neon',
    estado: 'dormindo',
    limiar: 50,
    proposito: 'Córtex computacional: área dedicada a raciocínio lógico de programação. Capacidade Turing completa.'
  });
  
  // 2. Sensores
  _criar_subrede_se_nao_existe('N_detector_simbolos', {pos: [220, 30, 110], cor: 'azul_eletrico', estado: 'monitorando', categoria: 'simbolo', camada: 'sensor', proposito: 'Detecta símbolos típicos de código: =, [], {}, ;, ->, etc'});
  _criar_subrede_se_nao_existe('N_detector_palavras_chave', {pos: [230, 30, 110], cor: 'azul_eletrico', estado: 'monitorando', categoria: 'palavra', camada: 'sensor', proposito: 'Detecta palavras-chave Turing'});
  _criar_subrede_se_nao_existe('N_detector_estrutura', {pos: [240, 30, 110], cor: 'azul_eletrico', estado: 'monitorando', categoria: 'estrutura', camada: 'sensor', proposito: 'Detecta padrões estruturais (atribuições, múltiplas declarações, etc)'});
  
  // 3. Motores
  _criar_subrede_se_nao_existe('M_atribuicao', {pos: [260, 10, 95], cor: 'vermelho_quente', estado: 'pronto', camada: 'motor', proposito: 'Processa x = expr. Cria/atualiza nó-variável com _id_escopo.'});
  _criar_subrede_se_nao_existe('M_aritmetico', {pos: [265, 10, 95], cor: 'vermelho_quente', estado: 'pronto', camada: 'motor', proposito: 'Avalia expressões aritméticas com + - * / e parênteses.'});
  _criar_subrede_se_nao_existe('M_comparador', {pos: [270, 10, 95], cor: 'vermelho_quente', estado: 'pronto', camada: 'motor', proposito: 'Avalia condições. Delega operadores e/ou/não.'});
  _criar_subrede_se_nao_existe('M_clock', {pos: [275, 10, 95], cor: 'vermelho_quente', estado: 'pronto', camada: 'motor', proposito: 'Conta ticks de execução em loops. SEM TETO ARTIFICIAL.'});
  
  // 4. Controladores
  _criar_subrede_se_nao_existe('N_loop_controller', {pos: [255, 5, 90], cor: 'verde_lima', estado: 'pronto', camada: 'controlador', proposito: 'Gerencia loops enquanto/faça. Suporta aninhados.'});
  _criar_subrede_se_nao_existe('N_if_controller', {pos: [260, 5, 90], cor: 'verde_lima', estado: 'pronto', camada: 'controlador', proposito: 'Processa se X então A senão B. Suporta aninhamento.'});
  _criar_subrede_se_nao_existe('N_function_controller', {pos: [265, 5, 90], cor: 'verde_lima', estado: 'pronto', camada: 'controlador', proposito: 'Gerencia funções: push/pop escopo, parâmetros, retorno.'});
  
  // 5. Debugger
  _criar_subrede_se_nao_existe('N_debugger_reverso', {pos: [280, 25, 105], cor: 'roxo_profundo', estado: 'pronto', camada: 'debug', proposito: 'BFS reverso causal com raciocínio abdutivo.'});
  
  // 6. GABA lateral
  _criar_subrede_se_nao_existe('N_gaba_lateral', {pos: [250, 30, 90], cor: 'cinza_metalico', estado: 'dormindo', camada: 'inibitorio', proposito: 'Inibição lateral. Sinaliza B_gaba global pra silenciar outras sub-redes.'});
}

function _inicializar_estado_vm(){
  const cen = _no_central();
  if(!cen) return;
  if(!cen._estado_vm){
    cen._estado_vm = {
      escopos: [{}],          // stack de mapas {nome_var: id_no_variavel}
      regras: {},
      funcoes: {},
      causal_reverso: {},
      causal_direto: {},
      ultimo_retorno: null,
      ultimo_destino_consulta: null,
      passos_loop: 0,
      execucoes: 0,
      historico_ticks: [],
      subredes_referenciadas: [],
      _regra_loop: null
    };
  }
  cen._acumulador_ativacao = 0;
  cen._limiar_ativacao = 0.5;
  cen._total_ativacoes = cen._total_ativacoes || 0;
  cen._total_sucessos = cen._total_sucessos || 0;
  cen._total_falhas = cen._total_falhas || 0;
  cen._ultimo_input_turing = null;
  cen._ultimo_tick_global = 0;
}

function _inicializar_perfil_uso(){
  const cen = _no_central();
  if(!cen) return;
  if(!cen._perfil_uso){
    cen._perfil_uso = {
      motor_atribuicao_ativ: 0,
      motor_aritmetico_ativ: 0,
      motor_comparador_ativ: 0,
      motor_clock_ativ: 0,
      loops_executados: 0,
      funcoes_executadas: 0,
      debugs_reversos: 0,
      fallbacks_para_normal: 0
    };
  }
}

function _marcar_nos_como_estruturais(){
  const nomes_cortex = [
    'B_cortex_computacional',
    'N_detector_simbolos', 'N_detector_palavras_chave', 'N_detector_estrutura',
    'M_atribuicao', 'M_aritmetico', 'M_comparador', 'M_clock',
    'N_loop_controller', 'N_if_controller', 'N_function_controller',
    'N_debugger_reverso', 'N_gaba_lateral'
  ];
  for(const nome of nomes_cortex){
    if(!V112.subredes[nome]) continue;
    const no = v112_node_by_id(V112.subredes[nome].id);
    if(no){
      no._eh_estrutural = true;
      no._eh_estrutural_cortex = true;
      no._nao_evoluir = true;
      no._id_evolucao = 1;
      no._pertence_a = 'B_cortex_computacional';
    }
  }
}

function _registrar_aplicacoes_acopladas(){
  const cen = _no_central();
  if(!cen) return;
  if(!cen._aplicacoes_acopladas) cen._aplicacoes_acopladas = [];
  cen._aplicacoes_acopladas = [];  // reseta na carga
  
  if(V112.subredes.B_pseudo){
    cen._aplicacoes_acopladas.push({
      nome: 'pseudo_codigo',
      origem: 'v151_logica_prog.js',
      sub_redes: ['B_pseudo', 'B_executar_codigo', 'B_traducao', 'B_complexidade', 'B_bug_detect'],
      proposito: 'Análise, tradução e execução de pseudo-código.',
      ativo: true
    });
  }
  if(V112.subredes.B_calendario){
    cen._aplicacoes_acopladas.push({
      nome: 'modulo_afastamentos',
      origem: 'v152_afastamentos.js',
      sub_redes: ['B_calendario', 'B_afastamento', 'B_inconsistencias'],
      proposito: 'Aplicação prática RH: calendário, afastamentos, vínculos.',
      ativo: true
    });
  }
  
  cen._estado_vm.subredes_referenciadas = [
    'B_logico', 'B_matematica', 'B_causal', 'B_gaba',
    'B_hipocampo', 'B_amigdala',
    'B_pseudo', 'B_executar_codigo', 'B_traducao', 'B_complexidade', 'B_bug_detect',
    'B_calendario', 'B_afastamento', 'B_inconsistencias'
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 6 — HELPERS DE MEMÓRIA DE TRABALHO (vars como nós no grafo)
// ═══════════════════════════════════════════════════════════════════════════

function _achar_var_no_escopo_ativo(nome){
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return null;
  const stack = cen._estado_vm.escopos || [{}];
  for(let i = stack.length - 1; i >= 0; i--){
    if(stack[i] && stack[i].hasOwnProperty(nome)){
      const id_no = stack[i][nome];
      const no = v112_node_by_id(id_no);
      if(no && !no._destruida) return no;
    }
  }
  return null;
}

function _achar_var_global(nome){
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return null;
  const global = cen._estado_vm.escopos[0] || {};
  if(global.hasOwnProperty(nome)){
    const no = v112_node_by_id(global[nome]);
    if(no && !no._destruida) return no;
  }
  return null;
}

function _criar_var(nome, valor, tipo, idx_escopo){
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return null;
  const stack = cen._estado_vm.escopos;
  const idx_real = (idx_escopo === undefined || idx_escopo === null) ? (stack.length - 1) : idx_escopo;
  
  const id_var = _getNextId();
  const cor_var = idx_real === 0 ? 'azul_claro' : 'verde_claro';
  const no_var = {
    id: id_var,
    text: '[var ' + nome + ']',
    tipo: null,
    camada: 'variavel',
    pos: [240 + Math.floor(Math.random()*30), 35, 95],
    cor: cor_var,
    acumulador: 0,
    limiar: 1,
    estado: 'ativa',
    _eh_variavel: true,
    _nome: nome,
    _valor: valor,
    _tipo: tipo || (typeof valor === 'number' ? 'numero' : 'texto'),
    _id_escopo: idx_real === 0 ? 'global' : ('escopo_' + idx_real),
    _criada_em_tick: cen._ultimo_tick_global || 0,
    _modificada_em_tick: cen._ultimo_tick_global || 0,
    _criada_em: new Date().toISOString(),
    _criada_por: 'M_atribuicao',
    _destruida: false,
    _destruida_em_tick: null
  };
  V112.nodes.push(no_var);
  if(!stack[idx_real]) stack[idx_real] = {};
  stack[idx_real][nome] = id_var;
  return no_var;
}

function _atualizar_var(no_var, novo_valor){
  if(!no_var) return;
  const cen = _no_central();
  no_var._valor = novo_valor;
  no_var._tipo = typeof novo_valor === 'number' ? 'numero' : 'texto';
  no_var._modificada_em_tick = (cen && cen._ultimo_tick_global) || 0;
}

function _ler_valor(nome){
  const no = _achar_var_no_escopo_ativo(nome);
  if(!no) return 0;
  const v = no._valor;
  if(typeof v === 'number') return v;
  if(typeof v === 'string'){
    const parsed = parseFloat(v);
    return isNaN(parsed) ? 0 : parsed;
  }
  if(typeof v === 'boolean') return v ? 1 : 0;
  return 0;
}

function _registrar_motor(nome_motor, sucesso){
  if(!V112.subredes[nome_motor]) return;
  const no = v112_node_by_id(V112.subredes[nome_motor].id);
  if(!no) return;
  no._ativacoes_motor = (no._ativacoes_motor || 0) + 1;
  if(sucesso) no._sucessos_motor = (no._sucessos_motor || 0) + 1;
  const cen = _no_central();
  if(cen && cen._perfil_uso){
    const chave = 'motor_' + nome_motor.replace('M_', '').toLowerCase() + '_ativ';
    cen._perfil_uso[chave] = (cen._perfil_uso[chave] || 0) + 1;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 4 — MOTORES
// ═══════════════════════════════════════════════════════════════════════════

function motor_aritmetico(expr){
  if(typeof expr === 'number') return expr;
  expr = String(expr).trim();
  if(expr === '') return 0;
  const tokens = [];
  let i = 0;
  while(i < expr.length){
    const c = expr[i];
    if(/\\s/.test(c)){ i++; continue; }
    if(/[0-9]/.test(c)){
      let num = '';
      while(i < expr.length && /[0-9.]/.test(expr[i])){ num += expr[i]; i++; }
      tokens.push({tipo:'num', val: parseFloat(num)});
    } else if(/[a-zA-Z_]/.test(c)){
      let id = '';
      while(i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])){ id += expr[i]; i++; }
      tokens.push({tipo:'id', val: id});
    } else if('+-*/()'.includes(c)){
      tokens.push({tipo:'op', val: c}); i++;
    } else { i++; }
  }
  let pos = 0;
  function soma(){
    let x = produto();
    while(pos < tokens.length && tokens[pos].tipo === 'op' && (tokens[pos].val === '+' || tokens[pos].val === '-')){
      const op = tokens[pos].val; pos++;
      const y = produto();
      x = (op === '+') ? x + y : x - y;
    }
    return x;
  }
  function produto(){
    let x = atomo();
    while(pos < tokens.length && tokens[pos].tipo === 'op' && (tokens[pos].val === '*' || tokens[pos].val === '/')){
      const op = tokens[pos].val; pos++;
      const y = atomo();
      x = (op === '*') ? x * y : x / y;
    }
    return x;
  }
  function atomo(){
    if(pos >= tokens.length) return 0;
    const t = tokens[pos];
    if(t.tipo === 'num'){ pos++; return t.val; }
    if(t.tipo === 'id'){ pos++; return _ler_valor(t.val); }
    if(t.tipo === 'op' && t.val === '('){
      pos++;
      const v = soma();
      if(pos < tokens.length && tokens[pos].val === ')') pos++;
      return v;
    }
    pos++; return 0;
  }
  let resultado;
  try { resultado = soma(); } catch(e){ resultado = 0; }
  _registrar_motor('M_aritmetico', true);
  return resultado;
}

function motor_atribuicao(nome_var, expr_str){
  const valor = motor_aritmetico(expr_str);
  let no_var = _achar_var_no_escopo_ativo(nome_var);
  if(no_var){ _atualizar_var(no_var, valor); }
  else { _criar_var(nome_var, valor, 'numero', null); }
  _registrar_motor('M_atribuicao', true);
  return valor;
}

function motor_atribuicao_em_escopo(nome_var, expr_str, idx_escopo){
  const valor = motor_aritmetico(expr_str);
  const cen = _no_central();
  if(!cen) return valor;
  const stack = cen._estado_vm.escopos;
  const idx_real = idx_escopo === 'global' ? 0 :
                   idx_escopo === 'local' ? (stack.length - 1) :
                   (typeof idx_escopo === 'number' ? idx_escopo : stack.length - 1);
  const id_existente = stack[idx_real] && stack[idx_real][nome_var];
  if(id_existente){
    const no_existente = v112_node_by_id(id_existente);
    if(no_existente && !no_existente._destruida){ _atualizar_var(no_existente, valor); }
    else { _criar_var(nome_var, valor, 'numero', idx_real); }
  } else {
    _criar_var(nome_var, valor, 'numero', idx_real);
  }
  _registrar_motor('M_atribuicao', true);
  return valor;
}

function motor_comparador(cond){
  if(!cond || typeof cond !== 'string') return false;
  cond = cond.trim();
  let m;
  m = cond.match(/^([a-zA-Z_]\\w*)_par$/i);
  if(m){ const v = _ler_valor(m[1]); _registrar_motor('M_comparador', true); return v % 2 === 0; }
  m = cond.match(/^([a-zA-Z_]\\w*)_impar$/i);
  if(m){ const v = _ler_valor(m[1]); _registrar_motor('M_comparador', true); return v % 2 !== 0; }
  m = cond.match(/^([a-zA-Z_]\\w*)_zero$/i);
  if(m){ const v = _ler_valor(m[1]); _registrar_motor('M_comparador', true); return v === 0; }
  
  m = cond.match(/^(.+?)\\s*(menor_que|<)\\s*(.+)$/i);
  if(m){ _registrar_motor('M_comparador', true); return motor_aritmetico(m[1]) < motor_aritmetico(m[3]); }
  m = cond.match(/^(.+?)\\s*(maior_que|>)\\s*(.+)$/i);
  if(m){ _registrar_motor('M_comparador', true); return motor_aritmetico(m[1]) > motor_aritmetico(m[3]); }
  m = cond.match(/^(.+?)\\s*(igual_a|igual|==|=)\\s*(.+)$/i);
  if(m){ _registrar_motor('M_comparador', true); return motor_aritmetico(m[1]) === motor_aritmetico(m[3]); }
  m = cond.match(/^(.+?)\\s*(diferente|!=)\\s*(.+)$/i);
  if(m){ _registrar_motor('M_comparador', true); return motor_aritmetico(m[1]) !== motor_aritmetico(m[3]); }
  
  if(/\\s+e\\s+/i.test(cond)){
    const partes = cond.split(/\\s+e\\s+/i);
    const todos = partes.every(p => motor_comparador(p.trim()));
    _registrar_motor('M_comparador', true);
    return todos;
  }
  if(/\\s+ou\\s+/i.test(cond)){
    const partes = cond.split(/\\s+ou\\s+/i);
    const algum = partes.some(p => motor_comparador(p.trim()));
    _registrar_motor('M_comparador', true);
    return algum;
  }
  
  const no_var = _achar_var_no_escopo_ativo(cond);
  if(no_var){
    const v = no_var._valor;
    _registrar_motor('M_comparador', true);
    if(typeof v === 'boolean') return v;
    if(typeof v === 'string') return /^(true|verdadeiro|sim|ativo|ok)$/i.test(v.trim()) || (!isNaN(parseFloat(v)) && parseFloat(v) !== 0);
    if(typeof v === 'number') return v !== 0;
  }
  _registrar_motor('M_comparador', false);
  return false;
}

function motor_clock_tick(){
  const cen = _no_central();
  if(!cen) return 0;
  cen._ultimo_tick_global = (cen._ultimo_tick_global || 0) + 1;
  const no_clock = V112.subredes.M_clock && v112_node_by_id(V112.subredes.M_clock.id);
  if(no_clock){
    no_clock._tick_atual = cen._ultimo_tick_global;
    no_clock._ticks_totais = (no_clock._ticks_totais || 0) + 1;
  }
  _registrar_motor('M_clock', true);
  return cen._ultimo_tick_global;
}

function motor_clock_snapshot(operacao){
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return;
  const hist = cen._estado_vm.historico_ticks;
  if(!hist) return;
  const snap = {};
  const global_escopo = cen._estado_vm.escopos[0] || {};
  for(const [nome, id] of Object.entries(global_escopo)){
    const no = v112_node_by_id(id);
    if(no && !no._destruida) snap[nome] = no._valor;
  }
  hist.push({tick: cen._ultimo_tick_global, snapshot: snap, operacao: operacao || null});
  if(hist.length > 100) hist.shift();
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 5 — CONTROLADORES DE FLUXO
// ═══════════════════════════════════════════════════════════════════════════

function _split_inteligente_bloco(bloco_str){
  // Split por vírgula respeitando "se X então Y senão Z" como item único
  const partes = [];
  let buffer = '';
  let depth_then = 0;
  const tokens = bloco_str.split(/,\\s*/);
  for(let i = 0; i < tokens.length; i++){
    const p = tokens[i];
    if(/^se\\s/i.test(p) && /\\bentão\\b/i.test(p)){
      if(/\\bsenão\\b/i.test(p)){
        partes.push(p);
      } else {
        buffer = p;
        depth_then = 1;
      }
    } else if(depth_then === 1){
      buffer += ', ' + p;
      if(/\\bsenão\\b/i.test(p)){
        partes.push(buffer);
        buffer = '';
        depth_then = 0;
      } else if(/^[a-zA-Z_]\\w*\\s*=/.test(p)){
        buffer = buffer.replace(', ' + p, '');
        partes.push(buffer);
        partes.push(p);
        buffer = '';
        depth_then = 0;
      }
    } else {
      partes.push(p);
    }
  }
  if(buffer) partes.push(buffer);
  return partes.filter(p => p && p.trim().length > 0);
}

function executar_item(item){
  const it = item.trim();
  if(!it) return {abort: false};
  
  let m = it.match(/^se\\s+(.+?)\\s+então\\s+(.+?)\\s+senão\\s+(.+)$/i);
  if(m) return controlador_if(m[1].trim(), m[2].trim(), m[3].trim());
  
  m = it.match(/^se\\s+(.+?)\\s+então\\s+(.+)$/i);
  if(m) return controlador_if(m[1].trim(), m[2].trim(), null);
  
  m = it.match(/^executar\\s+([a-zA-Z_]\\w*)$/i);
  if(m) return executar_regra_por_nome(m[1]);
  
  m = it.match(/^chamar\\s+([a-zA-Z_]\\w*)$/i);
  if(m){ controlador_function_chamar(m[1]); return {abort: false}; }
  
  m = it.match(/^local\\s*:\\s*([a-zA-Z_]\\w*)\\s*=\\s*(.+)$/i);
  if(m){ motor_atribuicao_em_escopo(m[1], m[2], 'local'); return {abort: false}; }
  
  m = it.match(/^retorno\\s*=\\s*(.+)$/i);
  if(m){
    const cen = _no_central();
    if(cen && cen._estado_vm){
      cen._estado_vm.ultimo_retorno = motor_aritmetico(m[1]);
    }
    return {abort: false};
  }
  
  m = it.match(/^([a-zA-Z_]\\w*)\\s*=\\s*(.+)$/);
  if(m){ motor_atribuicao(m[1], m[2]); return {abort: false}; }
  
  if(/^erro/i.test(it)) return {abort: true, acao_disparada: it};
  
  return {abort: false};
}

function executar_bloco(bloco_str){
  const partes = _split_inteligente_bloco(bloco_str);
  let resultado_final = {abort: false, acao_disparada: null};
  for(const parte of partes){
    const r = executar_item(parte.trim());
    if(r && r.abort){ resultado_final = r; break; }
  }
  return resultado_final;
}

function controlador_loop(cond_str, bloco_str, nome_loop){
  const no_loop = V112.subredes.N_loop_controller && v112_node_by_id(V112.subredes.N_loop_controller.id);
  if(no_loop){
    no_loop._ativacoes = (no_loop._ativacoes || 0) + 1;
    if(!no_loop._loops_ativos) no_loop._loops_ativos = [];
    no_loop._loops_ativos.push({nome: nome_loop || '_anonimo', iniciado_tick: motor_clock_tick()});
    no_loop._loop_atual = no_loop._loops_ativos[no_loop._loops_ativos.length - 1];
  }
  motor_clock_snapshot('loop_inicio:' + (nome_loop || '_anonimo'));
  let iteracoes = 0, abortou = false, resultado_abort = null;
  // SAFETY: sem teto artificial mas com proteção extrema p/ não derrubar Node em testes
  const MAX_ABSOLUTO = 100000;
  while(motor_comparador(cond_str) && iteracoes < MAX_ABSOLUTO){
    const r = executar_bloco(bloco_str);
    motor_clock_tick();
    iteracoes++;
    if(r && r.abort){ abortou = true; resultado_abort = r; break; }
  }
  motor_clock_snapshot('loop_fim:' + (nome_loop || '_anonimo') + ':' + iteracoes + '_iter');
  if(no_loop){
    no_loop._loops_ativos.pop();
    no_loop._loop_atual = no_loop._loops_ativos[no_loop._loops_ativos.length - 1] || null;
    no_loop._sucessos = (no_loop._sucessos || 0) + (abortou ? 0 : 1);
  }
  const cen = _no_central();
  if(cen && cen._perfil_uso){
    cen._perfil_uso.loops_executados = (cen._perfil_uso.loops_executados || 0) + 1;
  }
  return {iteracoes, abortou, resultado_abort};
}

function controlador_if(cond_str, acao_a, acao_b){
  const no_if = V112.subredes.N_if_controller && v112_node_by_id(V112.subredes.N_if_controller.id);
  if(no_if){ no_if._ativacoes = (no_if._ativacoes || 0) + 1; }
  const cond_res = motor_comparador(cond_str);
  let resultado;
  if(cond_res) resultado = executar_item(acao_a);
  else if(acao_b) resultado = executar_item(acao_b);
  else resultado = {abort: false};
  if(no_if) no_if._sucessos = (no_if._sucessos || 0) + 1;
  return resultado;
}

function controlador_function_chamar(nome_funcao, valor_parametro){
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return null;
  const f = cen._estado_vm.funcoes[nome_funcao];
  if(!f) return null;
  const no_fn = V112.subredes.N_function_controller && v112_node_by_id(V112.subredes.N_function_controller.id);
  if(no_fn){ no_fn._ativacoes = (no_fn._ativacoes || 0) + 1; }
  
  cen._estado_vm.escopos.push({});
  if(no_fn){
    if(!no_fn._stack_escopos) no_fn._stack_escopos = ['global'];
    no_fn._stack_escopos.push('escopo_' + nome_funcao + '_' + Date.now());
  }
  motor_clock_snapshot('funcao_entrada:' + nome_funcao);
  
  if(f.param && valor_parametro !== undefined){
    _criar_var(f.param, valor_parametro, 'numero', cen._estado_vm.escopos.length - 1);
  }
  
  const items = f.corpo.split(',').map(s => s.trim()).filter(s => s);
  let abortou = false;
  for(const item of items){
    const r = executar_item(item);
    if(r && r.abort){ abortou = true; break; }
  }
  const retorno = cen._estado_vm.ultimo_retorno;
  
  // Marca vars locais como destruídas (mantém nós no grafo)
  const escopo_saindo = cen._estado_vm.escopos[cen._estado_vm.escopos.length - 1];
  for(const [nome, id_var] of Object.entries(escopo_saindo)){
    const no_var = v112_node_by_id(id_var);
    if(no_var){
      no_var._destruida = true;
      no_var._destruida_em_tick = cen._ultimo_tick_global;
      no_var.estado = 'destruida_pos_funcao';
    }
  }
  cen._estado_vm.escopos.pop();
  if(no_fn && no_fn._stack_escopos) no_fn._stack_escopos.pop();
  motor_clock_snapshot('funcao_saida:' + nome_funcao);
  if(no_fn) no_fn._sucessos = (no_fn._sucessos || 0) + 1;
  if(cen._perfil_uso){
    cen._perfil_uso.funcoes_executadas = (cen._perfil_uso.funcoes_executadas || 0) + 1;
  }
  return retorno;
}

function executar_regra_por_nome(nome){
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return {abort: false};
  const r = cen._estado_vm.regras[nome];
  if(!r) return {abort: false};
  
  if(r.tipo === 'loop') return controlador_loop(r.cond, r.bloco, nome);
  if(r.tipo === 'composta') return executar_regra_composta(nome, r);
  if(r.tipo === 'condicional'){
    if(motor_comparador(r.cond)){
      if(/erro/i.test(r.acao)){
        return {abort: true, acao_disparada: r.acao, motivo: 'cond ' + r.cond + ' verdadeira'};
      }
      return {abort: false, acao_disparada: r.acao};
    }
    return {abort: false};
  }
  return {abort: false};
}

function executar_regra_composta(nome, r){
  const cen = _no_central();
  if(!cen) return {abort: false};
  const trace = [];
  for(const passo of r.passos){
    if(cen._estado_vm.regras[passo]){
      const res = executar_regra_por_nome(passo);
      trace.push({passo, res});
      if(res && (res.abort || res.abortou_em)){
        const motivo = res.acao_disparada || res.motivo || 'abortado';
        const onde = res.abortou_em || passo;
        return {abortou_em: onde, motivo, trace, abort: true};
      }
      continue;
    }
    if(cen._estado_vm.funcoes[passo]){
      controlador_function_chamar(passo);
      trace.push({passo, executou: 'funcao'});
      continue;
    }
    trace.push({passo, executou: 'opaco'});
  }
  return {concluido: true, trace, abort: false};
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 6 — PARSERS
// ═══════════════════════════════════════════════════════════════════════════

function parse_estado(input){
  const m = input.match(/^\\s*estado\\s*:\\s*(.+)$/i);
  if(!m) return null;
  let corpo = m[1];
  const part_exec = corpo.match(/^(.+?)\\.\\s*(execute.+)$/i);
  if(part_exec){ corpo = part_exec[1]; }
  
  const cen = _no_central();
  if(cen && cen._estado_vm){
    const global = cen._estado_vm.escopos[0] || {};
    for(const [nome, id_var] of Object.entries(global)){
      const no_var = v112_node_by_id(id_var);
      if(no_var){
        no_var._destruida = true;
        no_var._destruida_em_tick = cen._ultimo_tick_global;
        no_var.estado = 'destruida_pos_reset_estado';
      }
    }
    cen._estado_vm.escopos = [{}];
    cen._estado_vm.ultimo_retorno = null;
  }
  
  const atribs = corpo.split(',').map(s => s.trim()).filter(s => s);
  for(const a of atribs){
    const ma = a.match(/^([a-zA-Z_]\\w*)\\s*=\\s*(.+)$/);
    if(ma){
      const nome = ma[1];
      let v = ma[2].trim();
      const num = parseFloat(v);
      if(!isNaN(num) && /^-?[0-9.]+$/.test(v)){
        _criar_var(nome, num, 'numero', 0);
      } else {
        _criar_var(nome, v, 'texto', 0);
      }
    }
  }
  return {tratou: true, estado_carregado: true};
}

function parse_global(input){
  const m = input.match(/^\\s*global\\s*:\\s*([a-zA-Z_]\\w*)\\s*=\\s*(.+)$/i);
  if(!m) return null;
  const nome = m[1];
  const v = motor_aritmetico(m[2]);
  const existente = _achar_var_global(nome);
  if(existente){ _atualizar_var(existente, v); }
  else { _criar_var(nome, v, 'numero', 0); }
  return {tratou: true, global_definido: nome};
}

function parse_regra_loop(input){
  const m = input.match(/^\\s*regra(?:\\s+([a-zA-Z_]\\w*))?\\s*:\\s*enquanto\\s+(.+?)\\s+faça\\s*\\[(.+)\\]\\s*$/i);
  if(!m) return null;
  const nome = m[1] || '_default_loop';
  const cond = m[2].trim();
  const bloco = m[3].trim();
  const cen = _no_central();
  if(cen && cen._estado_vm){
    cen._estado_vm.regras[nome] = {tipo: 'loop', cond, bloco};
    cen._estado_vm._regra_loop = {nome, cond, bloco};
  }
  return {tratou: true, regra_loop: nome};
}

function parse_regra_simples(input){
  const m = input.match(/^\\s*(?:regra\\s+)?([a-zA-Z_]\\w*)\\s*:\\s*se\\s+(.+?)\\s+então\\s+(.+)$/i);
  if(!m) return null;
  const nome = m[1];
  const cen = _no_central();
  if(cen && cen._estado_vm){
    cen._estado_vm.regras[nome] = {tipo: 'condicional', cond: m[2].trim(), acao: m[3].trim()};
  }
  return {tratou: true, regra: nome};
}

function parse_regra_composta(input){
  const m = input.match(/^\\s*regra\\s+([a-zA-Z_]\\w*)\\s*:\\s*primeiro\\s+(.+)$/i);
  if(!m) return null;
  const nome = m[1];
  const corpo = m[2];
  const passos = corpo.split(/,\\s*depois\\s+/i).map(s => s.trim()).filter(s => s);
  const cen = _no_central();
  if(cen && cen._estado_vm){
    cen._estado_vm.regras[nome] = {tipo: 'composta', passos};
  }
  return {tratou: true, regra_composta: nome};
}

function parse_funcao(input){
  const m = input.match(/^\\s*função\\s+([a-zA-Z_]\\w*)(?:\\s+parametro\\s+([a-zA-Z_]\\w*))?\\s*:\\s*\\[(.+)\\]\\s*$/i);
  if(!m) return null;
  const nome = m[1];
  const param = m[2] || null;
  const corpo = m[3];
  const cen = _no_central();
  if(cen && cen._estado_vm){
    cen._estado_vm.funcoes[nome] = {corpo, param};
  }
  return {tratou: true, funcao: nome};
}

function parse_causa(input){
  let m = input.match(/^\\s*([a-zA-Z_]\\w*)\\s+se\\s+(.+?)\\s+causa\\s+([a-zA-Z_]\\w*)\\s*$/i);
  let origem, destino, cond = null;
  if(m){ origem = m[1]; cond = m[2].trim(); destino = m[3]; }
  else {
    m = input.match(/^\\s*([a-zA-Z_]\\w*)\\s+causa\\s+([a-zA-Z_]\\w*)\\s*$/i);
    if(!m) return null;
    origem = m[1]; destino = m[2];
  }
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return null;
  if(!cen._estado_vm.causal_reverso[destino]) cen._estado_vm.causal_reverso[destino] = [];
  cen._estado_vm.causal_reverso[destino].push({origem, cond});
  if(!cen._estado_vm.causal_direto[origem]) cen._estado_vm.causal_direto[origem] = [];
  cen._estado_vm.causal_direto[origem].push({destino, cond});
  return {tratou: true, causal: origem + '→' + destino};
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 8 — DEBUGGER REVERSO (BFS abdutivo)
// ═══════════════════════════════════════════════════════════════════════════

function _rastrear_origem(destino){
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return null;
  const no_dbg = V112.subredes.N_debugger_reverso && v112_node_by_id(V112.subredes.N_debugger_reverso.id);
  if(no_dbg){ no_dbg._ativacoes = (no_dbg._ativacoes || 0) + 1; no_dbg._ultimo_destino = destino; }
  
  const causal_rev = cen._estado_vm.causal_reverso;
  const visitados = new Set();
  let atual = destino, raiz = destino;
  const trace = [destino];
  const MAX = 100;
  let n = 0;
  while(n < MAX){
    n++;
    const preds = causal_rev[atual] || [];
    if(preds.length === 0) break;
    let escolhido = null;
    for(const p of preds){
      if(!p.cond){ escolhido = p; break; }
      const cond_partes = p.cond.split(/\\s+e\\s+/i);
      let alguma_falsa_explicita = false;
      for(const cp of cond_partes){
        const cp_trim = cp.trim();
        const no_var = _achar_var_no_escopo_ativo(cp_trim);
        if(!no_var) continue;  // abdução: var indefinida = assume true
        const ok = motor_comparador(cp_trim);
        if(!ok){ alguma_falsa_explicita = true; break; }
      }
      if(alguma_falsa_explicita) continue;
      escolhido = p;
      break;
    }
    if(!escolhido) break;
    if(visitados.has(escolhido.origem)) break;
    visitados.add(escolhido.origem);
    trace.unshift(escolhido.origem);
    atual = escolhido.origem;
    raiz = escolhido.origem;
  }
  if(no_dbg){
    no_dbg._ultima_raiz = raiz;
    no_dbg._ultimo_trace = trace;
    no_dbg._sucessos = (no_dbg._sucessos || 0) + 1;
  }
  if(cen._perfil_uso){
    cen._perfil_uso.debugs_reversos = (cen._perfil_uso.debugs_reversos || 0) + 1;
  }
  return {raiz, trace, profundidade: n};
}

function _rastrear_direto(destino){
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return null;
  const preds = cen._estado_vm.causal_reverso[destino] || [];
  if(preds.length === 0) return null;
  return preds[0].origem;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 7 — DESPACHOS DE PERGUNTA
// ═══════════════════════════════════════════════════════════════════════════

function pergunta_executar_e_mostrar(input){
  let m = input.match(/execute\\s+regra\\s+([a-zA-Z_]\\w*)\\s+e\\s+mostre\\s+valor\\s+de\\s+([a-zA-Z_]\\w*)/i);
  if(m){
    const nome_regra = m[1], nome_var = m[2];
    const cen = _no_central();
    if(cen && cen._estado_vm.regras[nome_regra]){
      const r = cen._estado_vm.regras[nome_regra];
      if(r.tipo === 'loop') controlador_loop(r.cond, r.bloco, nome_regra);
      else if(r.tipo === 'composta') executar_regra_por_nome(nome_regra);
    }
    const no_var = _achar_var_no_escopo_ativo(nome_var);
    if(no_var) return 'valor de ' + nome_var + ' = ' + no_var._valor;
    return null;
  }
  m = input.match(/execute\\s+e\\s+mostre\\s+valor\\s+de\\s+([a-zA-Z_]\\w*)/i);
  if(m){
    const cen = _no_central();
    if(cen && cen._estado_vm._regra_loop){
      controlador_loop(cen._estado_vm._regra_loop.cond, cen._estado_vm._regra_loop.bloco, cen._estado_vm._regra_loop.nome);
    }
    const no_var = _achar_var_no_escopo_ativo(m[1]);
    if(no_var) return 'valor de ' + m[1] + ' = ' + no_var._valor;
  }
  return null;
}

function pergunta_execute_funcao(input){
  let m = input.match(/execute\\s+função\\s+([a-zA-Z_]\\w*)/i);
  if(!m) return null;
  const nome = m[1];
  let param_val = undefined;
  const mp = input.match(/com\\s+([a-zA-Z_]\\w*)\\s*=\\s*([0-9.\\-]+)/i);
  if(mp) param_val = parseFloat(mp[2]);
  const ret = controlador_function_chamar(nome, param_val);
  let mq = input.match(/qual\\s+o\\s+retorno/i);
  if(mq) return 'retorno = ' + (ret !== null && ret !== undefined ? ret : 'indefinido');
  mq = input.match(/qual\\s+o\\s+valor\\s+(?:global\\s+)?de\\s+([a-zA-Z_]\\w*)/i);
  if(mq){
    const no_var = _achar_var_no_escopo_ativo(mq[1]);
    if(no_var) return 'valor de ' + mq[1] + ' = ' + no_var._valor;
  }
  return null;
}

function pergunta_onde_comecou(input){
  let m = input.match(/estado\\s+atual\\s+é\\s+([a-zA-Z_]\\w*)/i);
  let destino = null;
  if(m) destino = m[1];
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return null;
  if(destino){ cen._estado_vm.ultimo_destino_consulta = destino; }
  else { destino = cen._estado_vm.ultimo_destino_consulta; }
  if(/quem\\s+causou\\s+diretamente/i.test(input)){
    if(!destino) return null;
    const d = _rastrear_direto(destino);
    if(d) return 'causou diretamente: ' + d;
    return null;
  }
  if(/onde\\s+começou/i.test(input)){
    if(!destino) return null;
    const r = _rastrear_origem(destino);
    if(r && r.raiz !== destino) return 'começou em: ' + r.raiz + ' (trace: ' + r.trace.join(' → ') + ')';
    if(r) return 'começou em: ' + r.raiz;
    return null;
  }
  if(destino && m) return 'destino registrado: ' + destino;
  return null;
}

function pergunta_valor_de(input){
  const m = input.match(/qual\\s+o\\s+valor\\s+(?:global\\s+)?de\\s+([a-zA-Z_]\\w*)/i);
  if(!m) return null;
  const no_var = _achar_var_no_escopo_ativo(m[1]);
  if(no_var) return 'valor de ' + m[1] + ' = ' + no_var._valor;
  return null;
}

function pergunta_retorno(input){
  if(!/qual\\s+o\\s+retorno/i.test(input)) return null;
  const cen = _no_central();
  if(cen && cen._estado_vm.ultimo_retorno !== null && cen._estado_vm.ultimo_retorno !== undefined){
    return 'retorno = ' + cen._estado_vm.ultimo_retorno;
  }
  return null;
}

function pergunta_execute_regra(input){
  if(/execute\\s+regra\\s+[a-zA-Z_]\\w*\\s+e\\s+mostre/i.test(input)) return null;
  let m = input.match(/execute\\s+regra\\s+([a-zA-Z_]\\w*)/i);
  let nome = null;
  if(m){ nome = m[1]; }
  else {
    m = input.match(/execute\\s+([a-zA-Z_]\\w*)/i);
    if(!m) return null;
    nome = m[1];
    if(nome === 'regra' || nome === 'função') return null;
  }
  const cen = _no_central();
  if(!cen || !cen._estado_vm.regras[nome]) return null;
  const r = cen._estado_vm.regras[nome];
  if(r.tipo === 'loop'){
    controlador_loop(r.cond, r.bloco, nome);
    return 'loop ' + nome + ' executado';
  }
  const res = executar_regra_por_nome(nome);
  if(res && res.abortou_em){
    return 'erro: regra abortou em ' + res.abortou_em + ' (' + res.motivo + '). passos posteriores não executados.';
  }
  if(res && res.concluido){
    return 'sucesso: regra concluida, ' + (res.trace ? res.trace.length : 0) + ' passos processados, confirmado. comprovante ok.';
  }
  if(res && res.abort){
    return 'erro: ' + (res.acao_disparada || 'abortou');
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 3 — DETECTORES
// ═══════════════════════════════════════════════════════════════════════════

const VOCAB_TURING = {
  'enquanto': 0.20, 'faça': 0.15, 'repita': 0.20, 'até': 0.10,
  'se': 0.05, 'então': 0.15, 'senão': 0.15, 'caso': 0.10,
  'função': 0.20, 'local': 0.15, 'global': 0.15, 'retorno': 0.20, 'chamar': 0.15, 'parametro': 0.15,
  'estado': 0.15, 'variável': 0.10, 'var': 0.10,
  'regra': 0.20, 'primeiro': 0.10, 'depois': 0.10, 'executar': 0.40, 'execute': 0.40,
  'causa': 0.30, 'provoca': 0.20, 'gera': 0.10, 'dispara': 0.20,
  'mostre': 0.20,
  'onde começou': 0.30, 'quem causou': 0.30, 'qual o valor': 0.20, 'qual o retorno': 0.25, 'estado atual': 0.20,
  'menor_que': 0.20, 'maior_que': 0.20, 'igual_a': 0.15, 'diferente': 0.10
};

const VOCAB_TURING_EXTENSAO = {
  'traduzir pseudo': 0.30, 'complexidade de': 0.30, 'executar pseudo': 0.30, 'tem bug em': 0.30, 'pseudo': 0.10,
  'afastamento': 0.20, 'registrar afastamento': 0.30, 'vincular': 0.15, 'dia útil': 0.20, 'dias úteis': 0.20
};

function _detector_simbolos(input){
  if(typeof input !== 'string' || input.length === 0) return {peso: 0, marcadores: []};
  let peso = 0;
  const marcadores = [];
  const txt = input;
  const matches_atrib = txt.match(/(?<![=<>!:])=(?!=)/g);
  if(matches_atrib && matches_atrib.length > 0){
    const n = matches_atrib.length;
    const contrib = Math.min(0.30, n * 0.15);
    peso += contrib;
    marcadores.push('atribuicao_x' + n);
  }
  if(/\\[[^\\]]+\\]/.test(txt)){ peso += 0.15; marcadores.push('colchetes'); }
  if(/\\{[^\\}]+\\}/.test(txt)){ peso += 0.10; marcadores.push('chaves'); }
  if(/[<>]\\s*[a-zA-Z0-9_]/.test(txt) && !/<[a-zA-Z]+>/.test(txt)){ peso += 0.10; marcadores.push('comparador_arit'); }
  if(/\\([a-zA-Z0-9_\\s+\\-*/.,]+\\)/.test(txt)){ peso += 0.05; marcadores.push('parenteses'); }
  if(/;\\s*[a-zA-Z]/.test(txt)){ peso += 0.10; marcadores.push('ponto_virgula'); }
  if(/(->|→)/.test(txt)){ peso += 0.10; marcadores.push('seta'); }
  if(/[a-zA-Z_]\\w*\\s*=\\s*[^,]+,\\s*[a-zA-Z_]\\w*\\s*=/.test(txt)){ peso += 0.10; marcadores.push('multi_atrib'); }
  peso = Math.min(1.0, peso);
  return {peso, marcadores};
}

function _detector_palavras_chave(input){
  if(typeof input !== 'string' || input.length === 0) return {peso: 0, marcadores: []};
  let peso = 0;
  const marcadores = [];
  const lower = input.toLowerCase();
  const vocab = Object.assign({}, VOCAB_TURING, VOCAB_TURING_EXTENSAO);
  for(const [palavra, p] of Object.entries(vocab)){
    if(palavra.includes(' ')){
      if(lower.includes(palavra)){
        peso += p;
        marcadores.push(palavra);
      }
    } else {
      const re = new RegExp('\\\\b' + palavra.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + '\\\\b', 'i');
      if(re.test(lower)){
        peso += p;
        marcadores.push(palavra);
      }
    }
  }
  peso = Math.min(1.0, peso);
  return {peso, marcadores};
}

function _detector_estrutura(input){
  if(typeof input !== 'string' || input.length === 0) return {peso: 0, marcadores: []};
  let peso = 0;
  const marcadores = [];
  const txt = input;
  if(/\\b[a-zA-Z_]\\w*\\s*=\\s*-?\\d+(\\.\\d+)?\\b/.test(txt)){ peso += 0.30; marcadores.push('atrib_num'); }
  if(/\\b[a-zA-Z_]\\w*\\s*=\\s*[a-zA-Z_0-9]+\\s*[+\\-*/]\\s*[a-zA-Z_0-9]+/.test(txt)){ peso += 0.30; marcadores.push('atrib_expr'); }
  const colons = txt.match(/^\\s*\\w+\\s*:|\\.\\s*\\w+\\s*:/g);
  if(colons && colons.length >= 1){ peso += 0.20; marcadores.push('declaracoes'); }
  const partes_ponto = txt.split(/\\.\\s+/).filter(p => p.trim().length > 0);
  if(partes_ponto.length >= 2 && !/\\d+\\.\\d+/.test(txt)){ peso += 0.15; marcadores.push('multi_frase'); }
  if(/\\b[a-zA-Z_]\\w*\\s+(se\\s+.+?\\s+)?causa\\s+[a-zA-Z_]\\w*/.test(txt)){ peso += 0.30; marcadores.push('causal'); }
  if(/\\bregra\\s+\\w+\\s*:\\s*primeiro\\b/i.test(txt)){ peso += 0.30; marcadores.push('decomposicao'); }
  peso = Math.min(1.0, peso);
  return {peso, marcadores};
}

function _calcular_limiar_dinamico(){
  const cen = _no_central();
  if(!cen || !cen._estado_vm) return 0.5;
  const vm = cen._estado_vm;
  const tem_contexto = (
    (vm.regras && Object.keys(vm.regras).length > 0) ||
    (vm.funcoes && Object.keys(vm.funcoes).length > 0) ||
    (vm.escopos && vm.escopos[0] && Object.keys(vm.escopos[0]).length > 0) ||
    (vm.causal_reverso && Object.keys(vm.causal_reverso).length > 0)
  );
  return tem_contexto ? 0.40 : 0.50;
}

function _avaliar_detectores(input){
  const r1 = _detector_simbolos(input);
  const r2 = _detector_palavras_chave(input);
  const r3 = _detector_estrutura(input);
  const no_s = V112.subredes.N_detector_simbolos && v112_node_by_id(V112.subredes.N_detector_simbolos.id);
  const no_p = V112.subredes.N_detector_palavras_chave && v112_node_by_id(V112.subredes.N_detector_palavras_chave.id);
  const no_e = V112.subredes.N_detector_estrutura && v112_node_by_id(V112.subredes.N_detector_estrutura.id);
  if(no_s){ no_s._peso_emitido = r1.peso; no_s._ultimos_marcadores = r1.marcadores; }
  if(no_p){ no_p._peso_emitido = r2.peso; no_p._ultimos_marcadores = r2.marcadores; }
  if(no_e){ no_e._peso_emitido = r3.peso; no_e._ultimos_marcadores = r3.marcadores; }
  const peso_total = Math.min(1.0, r1.peso + r2.peso + r3.peso);
  const cen = _no_central();
  if(cen){
    cen._acumulador_ativacao = peso_total;
    cen._ultimos_pesos = {simbolos: r1.peso, palavras: r2.peso, estrutura: r3.peso};
  }
  const limiar = _calcular_limiar_dinamico();
  return {peso_total, detalhes: {simbolos: r1, palavras: r2, estrutura: r3}, deve_acordar: peso_total >= limiar, limiar};
}

// ═══════════════════════════════════════════════════════════════════════════
// INIBIÇÃO LATERAL
// ═══════════════════════════════════════════════════════════════════════════

function _ativar_inibicao_lateral(){
  const no_gaba = V112.subredes.N_gaba_lateral && v112_node_by_id(V112.subredes.N_gaba_lateral.id);
  if(no_gaba){
    no_gaba._ativo = true;
    no_gaba.estado = 'inibindo';
    no_gaba._ativacoes = (no_gaba._ativacoes || 0) + 1;
  }
  const b_gaba = V112.subredes.B_gaba && v112_node_by_id(V112.subredes.B_gaba.id);
  if(b_gaba) b_gaba._inibindo_por_cortex = true;
  V112._cortex_ativo = true;
}

function _desativar_inibicao_lateral(){
  const no_gaba = V112.subredes.N_gaba_lateral && v112_node_by_id(V112.subredes.N_gaba_lateral.id);
  if(no_gaba){
    no_gaba._ativo = false;
    no_gaba.estado = 'dormindo';
  }
  const b_gaba = V112.subredes.B_gaba && v112_node_by_id(V112.subredes.B_gaba.id);
  if(b_gaba) b_gaba._inibindo_por_cortex = false;
  V112._cortex_ativo = false;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 9 — DESPACHO HÍBRIDO + CONSULTA INTERNA
// ═══════════════════════════════════════════════════════════════════════════

let _v112_processar_pre_v15 = null;  // capturado no hook install

function _consulta_interna(input){
  if(typeof _v112_processar_pre_v15 !== 'function') return null;
  try { return _v112_processar_pre_v15(input); } catch(e){ return null; }
}

function _eh_pseudo_codigo(input){
  return /\\b(traduzir\\s+pseudo|complexidade\\s+de|executar\\s+pseudo|tem\\s+bug\\s+em)\\b/i.test(input);
}

function _eh_afastamentos(input){
  const tem_afast = /\\bafastamento\\b/i.test(input);
  const tem_combo = /\\b(vincular|tipo)\\s+\\w+\\s+(com|é)\\b/i.test(input) && /\\b(usuario|user|funcionario|colaborador)\\b/i.test(input);
  return tem_afast || tem_combo;
}

function _registrar_despacho_hibrido(tipo){
  const cen = _no_central();
  if(!cen) return;
  if(!cen._despachos_hibridos) cen._despachos_hibridos = {};
  cen._despachos_hibridos[tipo] = (cen._despachos_hibridos[tipo] || 0) + 1;
}

function _despachar_pseudo(input){
  const m_exec = input.match(/^\\s*executar\\s+pseudo\\s*:\\s*(.+)$/i);
  if(m_exec){
    const codigo = m_exec[1].trim();
    const m_loop = codigo.match(/^enquanto\\s+(.+?)\\s+faça\\s*\\[?(.+?)\\]?$/i);
    if(m_loop){
      parse_regra_loop('regra: enquanto ' + m_loop[1] + ' faça [' + m_loop[2] + ']');
      const cen = _no_central();
      if(cen && cen._estado_vm._regra_loop){
        controlador_loop(cen._estado_vm._regra_loop.cond, cen._estado_vm._regra_loop.bloco, cen._estado_vm._regra_loop.nome);
        return {resposta: 'pseudo-código executado', turing: true};
      }
    }
  }
  return _consulta_interna(input);
}

function _despachar_afastamentos(input){
  return _consulta_interna(input);
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESSAMENTO TURING (orquestra parsers + despachos)
// ═══════════════════════════════════════════════════════════════════════════

function _processar_input_turing(input){
  // Despacho híbrido primeiro
  if(_eh_pseudo_codigo(input)){
    const resp = _despachar_pseudo(input);
    if(resp && resp.resposta){
      _registrar_despacho_hibrido('pseudo');
      return resp;
    }
  }
  if(_eh_afastamentos(input)){
    const resp = _despachar_afastamentos(input);
    if(resp && resp.resposta){
      _registrar_despacho_hibrido('afastamentos');
      return resp;
    }
  }
  
  // Split por "." que não é decimal
  let partes_input;
  if(input.includes('.') && !/\\s*\\d+\\s*\\.\\s*\\d+/.test(input)){
    partes_input = input.split(/\\s*\\.\\s+/).map(s => s.trim()).filter(s => s);
  } else {
    partes_input = [input];
  }
  
  let resp_final = null;
  let alguma_tratada = false;
  
  for(const parte of partes_input){
    let resultado = null;
    resultado = resultado || parse_estado(parte);
    resultado = resultado || parse_global(parte);
    resultado = resultado || parse_regra_loop(parte);
    resultado = resultado || parse_regra_composta(parte);
    resultado = resultado || parse_regra_simples(parte);
    resultado = resultado || parse_funcao(parte);
    resultado = resultado || parse_causa(parte);
    
    if(resultado && resultado.tratou){ alguma_tratada = true; continue; }
    
    let resp = null;
    resp = resp || pergunta_executar_e_mostrar(parte);
    resp = resp || pergunta_execute_funcao(parte);
    resp = resp || pergunta_onde_comecou(parte);
    resp = resp || pergunta_execute_regra(parte);
    resp = resp || pergunta_valor_de(parte);
    resp = resp || pergunta_retorno(parte);
    if(resp){ resp_final = resp; alguma_tratada = true; }
  }
  
  if(resp_final) return {resposta: resp_final, turing: true};
  if(alguma_tratada) return {resposta: 'ok (turing)', turing: true};
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 7 — HOOK em v112_processar
// ═══════════════════════════════════════════════════════════════════════════

function _instalar_hook_v112_processar(){
  if(window._v15_hook_instalado){
    console.log('[v15_cortex_logico] hook já instalado, pulando');
    return;
  }
  _v112_processar_pre_v15 = window.v112_processar;
  
  window.v112_processar = function(input, ...args){
    if(typeof input !== 'string'){
      return _v112_processar_pre_v15.apply(this, [input, ...args]);
    }
    const cen = _no_central();
    if(!cen){
      return _v112_processar_pre_v15.apply(this, [input, ...args]);
    }
    const det = _avaliar_detectores(input);
    if(!det.deve_acordar){
      return _v112_processar_pre_v15.apply(this, [input, ...args]);
    }
    // ACORDA
    cen.estado = 'desperto';
    cen._total_ativacoes = (cen._total_ativacoes || 0) + 1;
    cen._ultimo_input_turing = input;
    cen.ativacoes = (cen.ativacoes || 0) + 1;
    _ativar_inibicao_lateral();
    
    let resp_final;
    try {
      resp_final = _processar_input_turing(input);
    } catch(e){
      _desativar_inibicao_lateral();
      cen.estado = 'dormindo';
      cen._total_falhas = (cen._total_falhas || 0) + 1;
      if(cen._perfil_uso){ cen._perfil_uso.fallbacks_para_normal = (cen._perfil_uso.fallbacks_para_normal || 0) + 1; }
      return _v112_processar_pre_v15.apply(this, [input, ...args]);
    }
    _desativar_inibicao_lateral();
    cen.estado = 'dormindo';
    
    if(resp_final && resp_final.resposta){
      cen._total_sucessos = (cen._total_sucessos || 0) + 1;
      cen.sucessos = (cen.sucessos || 0) + 1;
      return resp_final;
    }
    if(cen._perfil_uso){ cen._perfil_uso.fallbacks_para_normal = (cen._perfil_uso.fallbacks_para_normal || 0) + 1; }
    return _v112_processar_pre_v15.apply(this, [input, ...args]);
  };
  
  window._v15_hook_instalado = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTE 10 — COMANDOS NL
// ═══════════════════════════════════════════════════════════════════════════

function _registrar_comandos_nl(){
  if(typeof v112_comando_criar_no !== 'function') return;
  
  const cmds = [
    {regex: '^status\\\\s+c[oó]rtex$', handler: 'h_cortex_status', desc: 'Status do córtex'},
    {regex: '^c[oó]rtex\\\\s+info$', handler: 'h_cortex_info', desc: 'Info detalhada do córtex'},
    {regex: '^listar\\\\s+(?:vari[áa]veis|vars?)$', handler: 'h_cortex_vars', desc: 'Lista vars do escopo ativo'},
    {regex: '^listar\\\\s+regras$', handler: 'h_cortex_regras', desc: 'Lista regras declaradas'},
    {regex: '^listar\\\\s+fun[çc][oõ]es$', handler: 'h_cortex_funcoes', desc: 'Lista funções'},
    {regex: '^listar\\\\s+causal$', handler: 'h_cortex_causal', desc: 'Mostra grafo causal'},
    {regex: '^c[oó]rtex\\\\s+resetar$', handler: 'h_cortex_reset', desc: 'Reset da VM'},
    {regex: '^c[oó]rtex\\\\s+dormir$', handler: 'h_cortex_dormir', desc: 'Força córtex a dormir'},
    {regex: '^c[oó]rtex\\\\s+acordar$', handler: 'h_cortex_acordar', desc: 'Força córtex a acordar'}
  ];
  for(const c of cmds){
    try {
      v112_comando_criar_no(c.regex, c.handler, {prioridade: 85, descricao: c.desc, categoria: 'cortex'});
    } catch(e){}
  }
}

if(typeof window !== 'undefined'){
  window.V112_HANDLERS = window.V112_HANDLERS || {};
  
  window.V112_HANDLERS.h_cortex_status = function(m, ctx){
    const cen = _no_central();
    if(!cen) return {resposta_direta: 'B_cortex_computacional ausente', tratou: true};
    const linhas = [
      'B_cortex_computacional (Córtex Computacional V15):',
      '  estado:              ' + (cen.estado || 'dormindo'),
      '  ativações totais:    ' + (cen._total_ativacoes || 0),
      '  sucessos totais:     ' + (cen._total_sucessos || 0),
      '  falhas totais:       ' + (cen._total_falhas || 0),
      '  acordou agora:       ' + (V112._cortex_ativo ? 'sim' : 'não'),
      '  vars no grafo:       ' + V112.nodes.filter(n => n._eh_variavel && !n._destruida).length,
      '  regras declaradas:   ' + Object.keys(cen._estado_vm.regras || {}).length,
      '  funções declaradas:  ' + Object.keys(cen._estado_vm.funcoes || {}).length
    ];
    return {resposta_direta: linhas.join('\\n'), tratou: true};
  };
  
  window.V112_HANDLERS.h_cortex_info = function(m, ctx){
    const cen = _no_central();
    if(!cen) return {resposta_direta: 'córtex ausente', tratou: true};
    const apps = cen._aplicacoes_acopladas || [];
    const linhas = [
      'Córtex Computacional V15',
      'Localização: H_MAT (lado matemático)',
      'Coordenadas: ' + JSON.stringify(cen.pos),
      'Nós-órgão: 13 estruturais',
      'Aplicações acopladas: ' + apps.length
    ];
    for(const app of apps){
      linhas.push('  • ' + app.nome + ' (' + (app.ativo ? 'ativo' : 'inativo') + ')');
    }
    return {resposta_direta: linhas.join('\\n'), tratou: true};
  };
  
  window.V112_HANDLERS.h_cortex_vars = function(m, ctx){
    const cen = _no_central();
    if(!cen) return {resposta_direta: 'córtex ausente', tratou: true};
    const stack = cen._estado_vm.escopos || [{}];
    const topo = stack[stack.length - 1];
    const linhas = [];
    for(const [nome, id] of Object.entries(topo)){
      const no = v112_node_by_id(id);
      if(no && !no._destruida) linhas.push('  ' + nome + ' = ' + no._valor + ' (' + no._id_escopo + ')');
    }
    if(linhas.length === 0) return {resposta_direta: 'nenhuma variável no escopo ativo', tratou: true};
    return {resposta_direta: 'variáveis no escopo ativo:\\n' + linhas.join('\\n'), tratou: true};
  };
  
  window.V112_HANDLERS.h_cortex_regras = function(m, ctx){
    const cen = _no_central();
    if(!cen) return {resposta_direta: 'córtex ausente', tratou: true};
    const regras = cen._estado_vm.regras || {};
    if(Object.keys(regras).length === 0) return {resposta_direta: 'nenhuma regra declarada', tratou: true};
    const linhas = ['regras declaradas:'];
    for(const [nome, r] of Object.entries(regras)) linhas.push('  ' + nome + ' (tipo: ' + r.tipo + ')');
    return {resposta_direta: linhas.join('\\n'), tratou: true};
  };
  
  window.V112_HANDLERS.h_cortex_funcoes = function(m, ctx){
    const cen = _no_central();
    if(!cen) return {resposta_direta: 'córtex ausente', tratou: true};
    const fns = cen._estado_vm.funcoes || {};
    if(Object.keys(fns).length === 0) return {resposta_direta: 'nenhuma função declarada', tratou: true};
    const linhas = ['funções declaradas:'];
    for(const [nome, f] of Object.entries(fns)) linhas.push('  ' + nome + (f.param ? ' (param: ' + f.param + ')' : ''));
    return {resposta_direta: linhas.join('\\n'), tratou: true};
  };
  
  window.V112_HANDLERS.h_cortex_causal = function(m, ctx){
    const cen = _no_central();
    if(!cen) return {resposta_direta: 'córtex ausente', tratou: true};
    const arestas = [];
    for(const [destino, preds] of Object.entries(cen._estado_vm.causal_reverso || {})){
      for(const p of preds){
        arestas.push(p.origem + (p.cond ? ' [se ' + p.cond + ']' : '') + ' → ' + destino);
      }
    }
    if(arestas.length === 0) return {resposta_direta: 'grafo causal vazio', tratou: true};
    return {resposta_direta: 'grafo causal:\\n  ' + arestas.join('\\n  '), tratou: true};
  };
  
  window.V112_HANDLERS.h_cortex_reset = function(m, ctx){
    _reset_vm_total();
    return {resposta_direta: 'córtex resetado', tratou: true};
  };
  
  window.V112_HANDLERS.h_cortex_dormir = function(m, ctx){
    const cen = _no_central();
    if(cen){ cen.estado = 'dormindo'; _desativar_inibicao_lateral(); }
    return {resposta_direta: 'córtex forçado a dormir', tratou: true};
  };
  
  window.V112_HANDLERS.h_cortex_acordar = function(m, ctx){
    const cen = _no_central();
    if(cen){ cen.estado = 'desperto'; _ativar_inibicao_lateral(); }
    return {resposta_direta: 'córtex forçado a acordar', tratou: true};
  };
}

function _reset_vm_total(){
  const cen = _no_central();
  if(!cen) return;
  for(const escopo of cen._estado_vm.escopos){
    for(const [nome, id] of Object.entries(escopo)){
      const no = v112_node_by_id(id);
      if(no){ no._destruida = true; no.estado = 'destruida_pos_reset_total'; }
    }
  }
  cen._estado_vm = {
    escopos: [{}], regras: {}, funcoes: {},
    causal_reverso: {}, causal_direto: {},
    ultimo_retorno: null, ultimo_destino_consulta: null,
    passos_loop: 0, execucoes: 0,
    historico_ticks: [],
    subredes_referenciadas: cen._estado_vm.subredes_referenciadas || [],
    _regra_loop: null
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÕES EXPOSTAS GLOBALMENTE
// ═══════════════════════════════════════════════════════════════════════════

if(typeof window !== 'undefined'){
  window.v15_detectar = _avaliar_detectores;
  window.v15_estado_vm = function(){ const cen = _no_central(); return cen ? cen._estado_vm : null; };
  window.v15_listar_vars_escopo_ativo = function(){
    const cen = _no_central(); if(!cen) return [];
    const stack = cen._estado_vm.escopos || [{}];
    const topo = stack[stack.length - 1];
    const out = [];
    for(const [nome, id] of Object.entries(topo)){
      const no = v112_node_by_id(id);
      if(no && !no._destruida) out.push({nome, valor: no._valor, escopo: no._id_escopo});
    }
    return out;
  };
  window.v15_listar_vars_no_grafo = function(){
    return V112.nodes.filter(n => n._eh_variavel).map(n => ({
      id: n.id, nome: n._nome, valor: n._valor, escopo: n._id_escopo, destruida: !!n._destruida
    }));
  };
  window.v15_listar_regras = function(){
    const cen = _no_central(); if(!cen) return [];
    return Object.entries(cen._estado_vm.regras).map(([nome, r]) => ({nome, tipo: r.tipo, detalhes: r}));
  };
  window.v15_listar_funcoes = function(){
    const cen = _no_central(); if(!cen) return [];
    return Object.entries(cen._estado_vm.funcoes).map(([nome, f]) => ({nome, param: f.param, corpo: f.corpo}));
  };
  window.v15_listar_causal = function(){
    const cen = _no_central(); if(!cen) return {};
    return {reverso: cen._estado_vm.causal_reverso, direto: cen._estado_vm.causal_direto};
  };
  window.v15_listar_aplicacoes = function(){ const cen = _no_central(); return cen ? cen._aplicacoes_acopladas || [] : []; };
  window.v15_listar_nos_cortex = function(){
    return V112.nodes.filter(n => n._eh_estrutural_cortex).map(n => ({
      id: n.id, text: n.text, estado: n.estado,
      ativacoes: n._ativacoes || n.ativacoes || 0,
      sucessos: n._sucessos || n.sucessos || 0
    }));
  };
  window.v15_status_hook = function(){
    const cen = _no_central();
    return {
      instalado: window._v15_hook_instalado || false,
      cortex_ativo_agora: V112._cortex_ativo || false,
      total_ativacoes: cen ? (cen._total_ativacoes || 0) : 0,
      total_sucessos: cen ? (cen._total_sucessos || 0) : 0,
      total_falhas: cen ? (cen._total_falhas || 0) : 0,
      fallbacks_para_normal: cen && cen._perfil_uso ? (cen._perfil_uso.fallbacks_para_normal || 0) : 0
    };
  };
  window.v15_status_detectores = function(){
    return {
      simbolos: V112.subredes.N_detector_simbolos ? v112_node_by_id(V112.subredes.N_detector_simbolos.id)._peso_emitido : null,
      palavras: V112.subredes.N_detector_palavras_chave ? v112_node_by_id(V112.subredes.N_detector_palavras_chave.id)._peso_emitido : null,
      estrutura: V112.subredes.N_detector_estrutura ? v112_node_by_id(V112.subredes.N_detector_estrutura.id)._peso_emitido : null,
      limiar_atual: _calcular_limiar_dinamico()
    };
  };
  window.v15_status_motores = function(){
    const out = {};
    for(const m of ['M_atribuicao', 'M_aritmetico', 'M_comparador', 'M_clock']){
      if(V112.subredes[m]){
        const no = v112_node_by_id(V112.subredes[m].id);
        out[m] = {ativacoes: no._ativacoes_motor || 0, sucessos: no._sucessos_motor || 0, estado: no.estado};
      }
    }
    return out;
  };
  window.v15_status_controladores = function(){
    const out = {};
    for(const c of ['N_loop_controller', 'N_if_controller', 'N_function_controller']){
      if(V112.subredes[c]){
        const no = v112_node_by_id(V112.subredes[c].id);
        out[c] = {ativacoes: no._ativacoes || 0, sucessos: no._sucessos || 0};
      }
    }
    return out;
  };
  window.v15_status_debugger = function(){
    const no = V112.subredes.N_debugger_reverso && v112_node_by_id(V112.subredes.N_debugger_reverso.id);
    if(!no) return null;
    return {ativacoes: no._ativacoes || 0, sucessos: no._sucessos || 0, ultimo_destino: no._ultimo_destino, ultima_raiz: no._ultima_raiz, ultimo_trace: no._ultimo_trace};
  };
  window.v15_status_integracao = function(){
    return {
      cortex_ativo_agora: V112._cortex_ativo || false,
      hook_instalado: window._v15_hook_instalado || false,
      nos_cortex: V112.nodes.filter(n => n._eh_estrutural_cortex).length,
      vars_no_grafo: V112.nodes.filter(n => n._eh_variavel).length,
      vars_destruidas: V112.nodes.filter(n => n._eh_variavel && n._destruida).length
    };
  };
  window.v15_motor_atribuicao = motor_atribuicao;
  window.v15_motor_aritmetico = motor_aritmetico;
  window.v15_motor_comparador = motor_comparador;
  window.v15_motor_clock_tick = motor_clock_tick;
  window.v15_executar_bloco = executar_bloco;
  window.v15_executar_item = executar_item;
  window.v15_controlador_loop = controlador_loop;
  window.v15_controlador_if = controlador_if;
  window.v15_chamar_funcao = controlador_function_chamar;
  window.v15_executar_regra = executar_regra_por_nome;
  window.v15_debug_reverso = _rastrear_origem;
  window.v15_debug_direto = _rastrear_direto;
  window.v15_reset_total = _reset_vm_total;
  window.v15_forcar_normal = function(input){
    if(_v112_processar_pre_v15) return _v112_processar_pre_v15(input);
    return null;
  };
  window.v15_ler_var = function(nome){
    const no = _achar_var_no_escopo_ativo(nome);
    return no ? no._valor : undefined;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO FINAL
// ═══════════════════════════════════════════════════════════════════════════

function v15_init_completo(){
  v15_init_anatomia();
  _inicializar_estado_vm();
  _inicializar_perfil_uso();
  _marcar_nos_como_estruturais();
  _registrar_aplicacoes_acopladas();
  _registrar_comandos_nl();
  _instalar_hook_v112_processar();
  
  const apps_str = [];
  if(V112.subredes.B_pseudo) apps_str.push('v151 acoplado');
  if(V112.subredes.B_calendario) apps_str.push('v152 acoplado');
  console.log('[v15_cortex_logico] córtex computacional instalado em H_MAT [+250,+20,+100]');
  console.log('[v15_cortex_logico] 13 nós-órgão + estado_vm persistente + ' + apps_str.join(' + ') + (apps_str.length ? ' + ' : '') + '4 auto-mods integrados');
}

v15_init_completo();

})();
`});
