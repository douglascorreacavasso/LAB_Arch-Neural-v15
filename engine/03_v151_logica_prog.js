// ═══ REGIÕES 03-13 — módulos do cérebro armazenados como strings ═══
// (serão ativados via arch_neural_init() APÓS importar o cérebro)
window._ARCH_MODULOS = [];

// ─── REGIÃO 03/14 — v151_logica_prog.js ───
window._ARCH_MODULOS.push({nome:"v151_logica_prog.js", src: `
// ═══════════════════════════════════════════════════════════════
// LAB 13.21 / v151 — LÓGICA DE PROGRAMAÇÃO
// Append-only: roda DEPOIS de v112_brain.js. Não modifica nada existente.
// 5 sub-redes EXPERIMENTAL + 7 handlers + 7 comandos-nós.
// ═══════════════════════════════════════════════════════════════

(function(){
'use strict';

// Compat node/browser
const G = typeof window !== 'undefined' ? window : global;

// ────────────────────────────────────────────────────────────────
// 1. CRIAÇÃO DAS 5 SUB-REDES (idempotente)
// ────────────────────────────────────────────────────────────────
const V151_SUBREDES_INIT = {
  B_pseudo:          { pos:[ 150,   0,  60], cor: 'verde_neon',     proposito: 'PSEUDO: parser PT-BR de pseudocódigo → AST' },
  B_executar_codigo: { pos:[ 150,  30,  60], cor: 'amarelo_neon',   proposito: 'EXECUTAR: interpretador stack-based AST → resultado' },
  B_traducao:        { pos:[ 150, -30,  60], cor: 'roxo_neon',      proposito: 'TRADUÇÃO: AST → C / Java / Python' },
  B_complexidade:    { pos:[ 180,   0,  60], cor: 'azul_neon',      proposito: 'COMPLEXIDADE: análise estática Big-O' },
  B_bug_detect:      { pos:[ 120,   0,  60], cor: 'vermelho_neon',  proposito: 'BUG-DETECT: loop infinito, div/0, recursão sem base' },
};

function v112_prog_criar_subredes(){
  if(!G.V112 || !G.V112.subredes) return 0;
  let criadas = 0;

  for(const [nome, info] of Object.entries(V151_SUBREDES_INIT)){
    if(G.V112.subredes[nome]) continue; // idempotente

    // Núcleo central — segue padrão do v112_seed
    if(typeof G.v112_node !== 'function') continue;
    const central = G.v112_node({
      text: '[' + nome + ']',
      camada: 'subrede',
      mass: 8,
      threshold: 10,
      pos: info.pos,
      _blindado: true,
      _subrede: true,
      _proposito: info.proposito,
      _padroes: new Set(),
      _ativacoes: 0,
      _sucessos: 0,
      _falhas: 0,
    });
    G.V112.subredes[nome] = { id: central.id, satelites: [] };

    // 8 satélites em círculo
    for(let i = 0; i < 8; i++){
      const ang = (i / 8) * Math.PI * 2;
      const sat = G.v112_node({
        text: '',
        camada: 'subrede_sat',
        mass: 2,
        threshold: 8,
        pos: [info.pos[0] + Math.cos(ang) * 8, info.pos[1] + Math.sin(ang) * 8, info.pos[2]],
        _subrede_pai: nome,
      });
      G.V112.subredes[nome].satelites.push(sat.id);
      if(typeof G.v112_edge === 'function'){
        G.v112_edge(central.id, sat.id, 0.6, { tipo: 'subrede_interna' });
        G.v112_edge(sat.id, central.id, 0.6, { tipo: 'subrede_interna' });
      }
    }

    // Conecta ao Self-Core
    if(G.V112.self_core_id && typeof G.v112_edge === 'function'){
      G.v112_edge(G.V112.self_core_id, central.id, 0.4, { tipo: 'subrede_link' });
      G.v112_edge(central.id, G.V112.self_core_id, 0.4, { tipo: 'subrede_link' });
    }

    criadas++;
  }

  return criadas;
}
G.v112_prog_criar_subredes = v112_prog_criar_subredes;

// ────────────────────────────────────────────────────────────────
// 2. PARSER (B_pseudo) — texto → AST
// ────────────────────────────────────────────────────────────────
//
// Sintaxe aceita (resumo):
//   X = 5                   /  X recebe 5
//   se COND então CORPO    /  se COND: CORPO  (com senao/senão/else)
//   enquanto COND: CORPO   /  while COND: CORPO
//   para i de A até B: CORPO  /  for i in A..B: CORPO
//   função NOME(args): CORPO   (funcao/func/def)
//   retorna EXPR  (return/devolve)
//   imprime EXPR  (print(EXPR)/mostra EXPR)
//   NOME(args)
//
// Separador: ';' ou nova linha.
// Bloco aninhado: detectado por palavras-chave seguintes — varremos até
// encontrar o token que marca fim de bloco. Usamos algoritmo recursivo
// simples: cada construtor consome até o próximo ';' ou ')' de fechamento,
// e blocos delimitados por keyword ... fim-implícito-pela-próxima-keyword.

// Sinônimos:
const SIN_FUNC    = ['função','funcao','func','def'];
const SIN_RET     = ['retorna','return','devolve'];
const SIN_PRINT   = ['imprime','print','mostra'];
const SIN_IF      = ['se','if'];
const SIN_THEN    = ['então','entao','then'];
const SIN_ELSE    = ['senão','senao','else'];
const SIN_WHILE   = ['enquanto','while'];
const SIN_FOR     = ['para','for'];
const SIN_FOR_DE  = ['de','in'];
const SIN_FOR_ATE = ['até','ate','to'];
const SIN_RECEBE  = ['recebe','='];

function _norm_kw(s){
  return String(s||'').toLowerCase().trim();
}

// Tokeniza linha em "statements" separados por ';' respeitando parênteses
function _split_stmts(src){
  const out = [];
  let buf = '';
  let depth = 0;
  for(let i = 0; i < src.length; i++){
    const c = src[i];
    if(c === '(') depth++;
    else if(c === ')') depth--;
    if((c === ';' || c === '\\n') && depth <= 0){
      if(buf.trim()) out.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
  }
  if(buf.trim()) out.push(buf.trim());
  return out;
}

// Split de args respeitando parênteses internos
function _split_args(s){
  const out = [];
  let buf = '';
  let depth = 0;
  for(let i = 0; i < s.length; i++){
    const c = s[i];
    if(c === '(') depth++;
    else if(c === ')') depth--;
    if(c === ',' && depth === 0){
      if(buf.trim()) out.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
  }
  if(buf.trim()) out.push(buf.trim());
  return out;
}

// Tenta começar com qualquer das palavras (case-insensitive, word boundary)
function _comeca_com(s, palavras){
  const low = s.toLowerCase().trimStart();
  for(const p of palavras){
    // word boundary próprio (não pode confundir 'se' com 'sentido')
    if(low === p) return { match: p, resto: '' };
    if(low.startsWith(p + ' ') || low.startsWith(p + '(') || low.startsWith(p + ':') || low.startsWith(p + '\\t')){
      // calcula índice no original (case-original)
      const idx_low = s.toLowerCase().indexOf(p);
      const resto_inicio = idx_low + p.length;
      return { match: p, resto: s.substring(resto_inicio) };
    }
  }
  return null;
}

// Encontra primeiro topo-nível índice de uma keyword (qualquer da lista)
function _achar_kw_topo(s, palavras){
  let depth = 0;
  const low = s.toLowerCase();
  for(let i = 0; i < s.length; i++){
    if(s[i] === '(') { depth++; continue; }
    if(s[i] === ')') { depth--; continue; }
    if(depth !== 0) continue;
    for(const p of palavras){
      // word boundary: tem espaço antes (ou início) e espaço/símbolo depois
      const antes_ok = (i === 0) || /[\\s\\):]/.test(s[i-1]);
      if(!antes_ok) continue;
      if(low.substr(i, p.length) === p){
        const depois = s[i + p.length];
        if(depois === undefined || /[\\s\\(:]/.test(depois)){
          return { idx: i, kw: p, len: p.length };
        }
      }
    }
  }
  return null;
}

// Parser de expressão simples — gera AST de expr
// Suporta: literais, vars, chamadas f(args), ops aritméticos, comparações
function _parse_expr(s){
  s = String(s).trim();
  // Remove parênteses externos redundantes
  while(s.startsWith('(') && s.endsWith(')')){
    let d = 0, fecha_no_fim = true;
    for(let i = 0; i < s.length - 1; i++){
      if(s[i] === '(') d++;
      else if(s[i] === ')') d--;
      if(d === 0){ fecha_no_fim = false; break; }
    }
    if(fecha_no_fim) s = s.slice(1, -1).trim();
    else break;
  }
  if(!s) return { erro: 'expressão vazia' };

  // Procura operador binário de menor precedência (topo-nível)
  // Precedências (menor = avalia depois):
  //   1: ||  2: &&  3: == != <= >= < >  4: + -  5: * / %  6: **
  const niveis = [
    ['||'],
    ['&&'],
    ['==', '!=', '<=', '>=', '<', '>'],
    ['+', '-'],
    ['*', '/', '%'],
    ['**'],
  ];

  for(const ops of niveis){
    // Varre da direita pra esquerda → associatividade esquerda (exceto **)
    const r2l = (ops[0] === '**');
    let depth = 0;
    const range = r2l ? [...Array(s.length).keys()] : [...Array(s.length).keys()].reverse();
    for(const i of range){
      const c = s[i];
      if(c === '(') depth += r2l ? 1 : -1;
      else if(c === ')') depth += r2l ? -1 : 1;
      if(depth !== 0) continue;
      for(const op of ops){
        if(s.substr(i, op.length) === op){
          // Garante que não é '**' quando procura '*'
          if(op === '*' && s.substr(i, 2) === '**') continue;
          if(op === '=' && (s[i-1] === '=' || s[i-1] === '<' || s[i-1] === '>' || s[i-1] === '!')) continue;
          if(op === '<' && s[i+1] === '=') continue;
          if(op === '>' && s[i+1] === '=') continue;
          // Verifica que é binário (tem coisa antes e depois)
          const esq = s.substring(0, i).trim();
          const dir = s.substring(i + op.length).trim();
          if(!esq || !dir) continue;
          // Negativo unário no início
          if((op === '-' || op === '+') && (i === 0 || /[+\\-*/%<>=!&|(,]/.test(s.substring(0, i).trim().slice(-1)))){
            continue; // não é binário, é unário ou parte de literal
          }
          return {
            tipo: 'binop',
            op: op,
            esq: _parse_expr(esq),
            dir: _parse_expr(dir),
          };
        }
      }
    }
  }

  // Negativo unário
  if(s.startsWith('-')){
    return { tipo: 'unop', op: '-', operando: _parse_expr(s.slice(1)) };
  }
  if(s.startsWith('+')){
    return _parse_expr(s.slice(1));
  }

  // Literal numérico
  if(/^-?\\d+(\\.\\d+)?$/.test(s)){
    return { tipo: 'num', valor: parseFloat(s) };
  }

  // Chamada de função: NOME(args)
  const m_call = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\\s*\\((.*)\\)$/);
  if(m_call){
    // Confirma que o ')' final fecha o '(' inicial (não tem '),' no meio top-level)
    const args_str = m_call[2];
    let d = 0, ok = true;
    for(const c of args_str){
      if(c === '(') d++;
      else if(c === ')') { d--; if(d < 0) { ok = false; break; } }
    }
    if(ok && d === 0){
      const args = args_str.trim() === '' ? [] : _split_args(args_str).map(_parse_expr);
      return { tipo: 'chamada', nome: m_call[1], args: args };
    }
  }

  // Variável (identificador)
  if(/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)){
    return { tipo: 'var', nome: s };
  }

  return { erro: 'expressão não reconhecida: ' + s };
}

// Parser de statement único — recebe string já trim'ada
function _parse_stmt(stmt){
  if(!stmt || !stmt.trim()) return null;
  const s = stmt.trim();

  // FUNÇÃO: "função NOME(args): CORPO"
  const m_func = _comeca_com(s, SIN_FUNC);
  if(m_func){
    const resto = m_func.resto.trim();
    const m = resto.match(/^([A-Za-z_][A-Za-z0-9_]*)\\s*\\(([^)]*)\\)\\s*:?\\s*(.*)$/);
    if(!m) return { erro: 'função mal formada: ' + s };
    const nome = m[1];
    const params = m[2].trim() === '' ? [] : m[2].split(',').map(x => x.trim());
    const corpo_src = m[3].trim();
    const corpo = _parse_bloco(corpo_src);
    return { tipo: 'funcao', nome, params, corpo };
  }

  // RETORNA
  const m_ret = _comeca_com(s, SIN_RET);
  if(m_ret){
    const expr_str = m_ret.resto.trim();
    return { tipo: 'retorna', expr: expr_str ? _parse_expr(expr_str) : null };
  }

  // IMPRIME / PRINT
  const m_pr = _comeca_com(s, SIN_PRINT);
  if(m_pr){
    let expr_str = m_pr.resto.trim();
    // print(X) → tira parênteses externos
    if(expr_str.startsWith('(') && expr_str.endsWith(')')){
      expr_str = expr_str.slice(1, -1).trim();
    }
    return { tipo: 'imprime', expr: _parse_expr(expr_str) };
  }

  // SE
  const m_if = _comeca_com(s, SIN_IF);
  if(m_if){
    let resto = m_if.resto.trim();
    // cond pode terminar em "então" ou ":"
    const idx_then = _achar_kw_topo(resto, SIN_THEN);
    let cond_str, depois;
    if(idx_then){
      cond_str = resto.substring(0, idx_then.idx).trim();
      depois = resto.substring(idx_then.idx + idx_then.len).trim();
    } else {
      const idx_dp = resto.indexOf(':');
      if(idx_dp === -1) return { erro: 'se sem então/:' };
      cond_str = resto.substring(0, idx_dp).trim();
      depois = resto.substring(idx_dp + 1).trim();
    }
    // Procura senão/senao/else topo-nível
    const idx_else = _achar_kw_topo(depois, SIN_ELSE);
    let entao_src, senao_src;
    if(idx_else){
      entao_src = depois.substring(0, idx_else.idx).trim();
      senao_src = depois.substring(idx_else.idx + idx_else.len).trim();
    } else {
      entao_src = depois;
      senao_src = '';
    }
    return {
      tipo: 'se',
      cond: _parse_expr(cond_str),
      entao: _parse_bloco(entao_src),
      senao: senao_src ? _parse_bloco(senao_src) : [],
    };
  }

  // ENQUANTO
  const m_wh = _comeca_com(s, SIN_WHILE);
  if(m_wh){
    const resto = m_wh.resto.trim();
    const idx_dp = resto.indexOf(':');
    if(idx_dp === -1) return { erro: 'enquanto sem :' };
    const cond_str = resto.substring(0, idx_dp).trim();
    const corpo_src = resto.substring(idx_dp + 1).trim();
    return {
      tipo: 'enquanto',
      cond: _parse_expr(cond_str),
      corpo: _parse_bloco(corpo_src),
    };
  }

  // PARA i de A até B: CORPO   OU   para i in A..B: CORPO
  const m_for = _comeca_com(s, SIN_FOR);
  if(m_for){
    const resto = m_for.resto.trim();
    // Tenta padrão "para VAR de A até B: corpo"
    // Achar 'de'/'in' topo-nível
    const idx_de = _achar_kw_topo(resto, SIN_FOR_DE);
    if(!idx_de) return { erro: 'para sem de/in' };
    const var_nome = resto.substring(0, idx_de.idx).trim();
    let resto2 = resto.substring(idx_de.idx + idx_de.len).trim();

    let de_str, ate_str, corpo_src;
    // Tenta "A..B:"
    const idx_dotdot = resto2.indexOf('..');
    const idx_ate = _achar_kw_topo(resto2, SIN_FOR_ATE);
    if(idx_ate){
      de_str = resto2.substring(0, idx_ate.idx).trim();
      const apos = resto2.substring(idx_ate.idx + idx_ate.len).trim();
      const idx_dp = apos.indexOf(':');
      if(idx_dp === -1) return { erro: 'para sem :' };
      ate_str = apos.substring(0, idx_dp).trim();
      corpo_src = apos.substring(idx_dp + 1).trim();
    } else if(idx_dotdot !== -1){
      de_str = resto2.substring(0, idx_dotdot).trim();
      const apos = resto2.substring(idx_dotdot + 2);
      const idx_dp = apos.indexOf(':');
      if(idx_dp === -1) return { erro: 'para sem :' };
      ate_str = apos.substring(0, idx_dp).trim();
      corpo_src = apos.substring(idx_dp + 1).trim();
    } else {
      return { erro: 'para sem até/..' };
    }

    return {
      tipo: 'para',
      var: var_nome,
      de: _parse_expr(de_str),
      ate: _parse_expr(ate_str),
      corpo: _parse_bloco(corpo_src),
    };
  }

  // ATRIBUIÇÃO: "X = expr" ou "X recebe expr"
  // "recebe" como palavra
  const m_rec = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\\s+recebe\\s+(.+)$/i);
  if(m_rec){
    return { tipo: 'atribuir', var: m_rec[1], expr: _parse_expr(m_rec[2]) };
  }
  // "=" mas não "==", "<=" etc
  // Procura primeiro '=' topo-nível que não seja parte de comparador
  let depth = 0;
  for(let i = 0; i < s.length; i++){
    const c = s[i];
    if(c === '(') depth++;
    else if(c === ')') depth--;
    if(depth !== 0) continue;
    if(c === '=' && s[i+1] !== '=' && s[i-1] !== '=' && s[i-1] !== '<' && s[i-1] !== '>' && s[i-1] !== '!'){
      const esq = s.substring(0, i).trim();
      const dir = s.substring(i + 1).trim();
      // esq tem que ser identificador
      if(/^[A-Za-z_][A-Za-z0-9_]*$/.test(esq) && dir){
        return { tipo: 'atribuir', var: esq, expr: _parse_expr(dir) };
      }
      break; // se não é identificador, não tenta como atribuição
    }
  }

  // Chamada de função sozinha: "f(args)"
  const m_call = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\\s*\\(([^)]*(?:\\([^)]*\\)[^)]*)*)\\)\\s*$/);
  if(m_call){
    return { tipo: 'expr_stmt', expr: _parse_expr(s) };
  }

  // Expressão pura no topo (ex: "fatorial(5)" como última linha)
  const ex = _parse_expr(s);
  if(!ex.erro) return { tipo: 'expr_stmt', expr: ex };

  return { erro: 'statement não reconhecido: ' + s };
}

function _parse_bloco(src){
  if(!src || !src.trim()) return [];
  const stmts = _split_stmts(src);
  const out = [];
  for(const s of stmts){
    const parsed = _parse_stmt(s);
    if(parsed) out.push(parsed);
  }
  return out;
}

function v112_prog_parsear(src){
  if(!src || typeof src !== 'string') return { erro: 'fonte vazia' };
  try {
    const corpo = _parse_bloco(src);
    // verifica se algum stmt deu erro
    for(const c of corpo){
      if(c && c.erro) return { erro: c.erro };
    }
    return { tipo: 'programa', corpo };
  } catch(e){
    return { erro: 'parser exception: ' + e.message };
  }
}
G.v112_prog_parsear = v112_prog_parsear;

// ────────────────────────────────────────────────────────────────
// 3. INTERPRETADOR (B_executar_codigo)
// ────────────────────────────────────────────────────────────────
function v112_prog_executar(ast, opcoes){
  opcoes = opcoes || {};
  const MAX_PASSOS = opcoes.max_passos || 10000;
  const MAX_FRAMES = opcoes.max_frames || 500;
  const TRACE = !!opcoes.trace;

  const estado = {
    funcoes: {}, // nome → {params, corpo}
    pilha: [{}], // pilha de frames (cada frame é objeto {var: val})
    passos: 0,
    saida: [],
    trace: [],
    erro: null,
    max_passos: MAX_PASSOS,
    max_frames: MAX_FRAMES,
    rastrear: TRACE,
  };

  if(!ast || ast.erro) return { erro: ast ? ast.erro : 'ast nulo', passos: 0, saida: [], escopo_final: {}, resultado: undefined, trace: [] };
  if(ast.tipo !== 'programa') return { erro: 'esperava programa, veio ' + ast.tipo, passos: 0, saida: [], escopo_final: {}, resultado: undefined, trace: [] };

  let resultado = undefined;
  try {
    for(const stmt of ast.corpo){
      const r = _exec_stmt(stmt, estado);
      if(estado.erro) break;
      if(r && r.tipo === 'retorno_topo'){
        resultado = r.valor;
      } else if(r !== undefined){
        resultado = r;
      }
    }
  } catch(e){
    estado.erro = 'exceção: ' + e.message;
  }

  // Achata escopo final (frame raiz)
  const escopo_final = {};
  if(estado.pilha[0]){
    for(const [k,v] of Object.entries(estado.pilha[0])){
      escopo_final[k] = v;
    }
  }

  return {
    resultado,
    escopo_final,
    saida: estado.saida,
    passos: estado.passos,
    erro: estado.erro,
    trace: estado.trace,
  };
}
G.v112_prog_executar = v112_prog_executar;

function _frame_lookup(estado, nome){
  // Procura da pilha mais recente pra raiz
  for(let i = estado.pilha.length - 1; i >= 0; i--){
    if(Object.prototype.hasOwnProperty.call(estado.pilha[i], nome)){
      return { frame: estado.pilha[i], escopo_idx: i };
    }
  }
  return null;
}

function _frame_set(estado, nome, valor){
  // Atualiza no escopo onde existe, ou cria no frame mais interno
  const found = _frame_lookup(estado, nome);
  if(found) found.frame[nome] = valor;
  else estado.pilha[estado.pilha.length - 1][nome] = valor;
}

function _frame_get(estado, nome){
  const found = _frame_lookup(estado, nome);
  return found ? found.frame[nome] : undefined;
}

function _exec_stmt(stmt, estado){
  if(!stmt || estado.erro) return undefined;
  if(stmt.erro){ estado.erro = stmt.erro; return undefined; }

  estado.passos++;
  if(estado.passos > estado.max_passos){
    estado.erro = 'limite de passos excedido (' + estado.max_passos + ') — possível loop infinito';
    return undefined;
  }
  if(estado.rastrear) estado.trace.push({ tipo: stmt.tipo, passo: estado.passos });

  switch(stmt.tipo){
    case 'atribuir': {
      const val = _eval_expr(stmt.expr, estado);
      if(estado.erro) return undefined;
      _frame_set(estado, stmt.var, val);
      return undefined;
    }
    case 'imprime': {
      const val = _eval_expr(stmt.expr, estado);
      if(estado.erro) return undefined;
      estado.saida.push(String(val));
      return undefined;
    }
    case 'se': {
      const c = _eval_expr(stmt.cond, estado);
      if(estado.erro) return undefined;
      const bloco = _eh_truthy(c) ? stmt.entao : stmt.senao;
      for(const s of (bloco || [])){
        const r = _exec_stmt(s, estado);
        if(estado.erro) return undefined;
        if(r && r.tipo === 'retorno') return r;
      }
      return undefined;
    }
    case 'enquanto': {
      while(true){
        const c = _eval_expr(stmt.cond, estado);
        if(estado.erro) return undefined;
        if(!_eh_truthy(c)) break;
        for(const s of stmt.corpo){
          const r = _exec_stmt(s, estado);
          if(estado.erro) return undefined;
          if(r && r.tipo === 'retorno') return r;
        }
        if(estado.erro) return undefined;
      }
      return undefined;
    }
    case 'para': {
      const ini = _eval_expr(stmt.de, estado);
      const fim = _eval_expr(stmt.ate, estado);
      if(estado.erro) return undefined;
      for(let i = Number(ini); i <= Number(fim); i++){
        _frame_set(estado, stmt.var, i);
        for(const s of stmt.corpo){
          const r = _exec_stmt(s, estado);
          if(estado.erro) return undefined;
          if(r && r.tipo === 'retorno') return r;
        }
        if(estado.erro) return undefined;
      }
      return undefined;
    }
    case 'funcao': {
      estado.funcoes[stmt.nome] = { params: stmt.params, corpo: stmt.corpo };
      return undefined;
    }
    case 'retorna': {
      const val = stmt.expr ? _eval_expr(stmt.expr, estado) : undefined;
      if(estado.erro) return undefined;
      return { tipo: 'retorno', valor: val };
    }
    case 'expr_stmt': {
      const v = _eval_expr(stmt.expr, estado);
      if(estado.erro) return undefined;
      return { tipo: 'retorno_topo', valor: v };
    }
    default:
      estado.erro = 'stmt tipo desconhecido: ' + stmt.tipo;
      return undefined;
  }
}

function _eh_truthy(v){
  if(v === undefined || v === null) return false;
  if(typeof v === 'number') return v !== 0;
  if(typeof v === 'boolean') return v;
  return !!v;
}

function _eval_expr(expr, estado){
  if(!expr) return undefined;
  if(expr.erro){ estado.erro = expr.erro; return undefined; }
  estado.passos++;
  if(estado.passos > estado.max_passos){
    estado.erro = 'limite de passos excedido — possível loop infinito';
    return undefined;
  }

  switch(expr.tipo){
    case 'num': return expr.valor;
    case 'var': {
      const v = _frame_get(estado, expr.nome);
      if(v === undefined){
        estado.erro = 'variável não definida: ' + expr.nome;
        return undefined;
      }
      return v;
    }
    case 'unop': {
      const v = _eval_expr(expr.operando, estado);
      if(estado.erro) return undefined;
      if(expr.op === '-') return -Number(v);
      if(expr.op === '+') return +Number(v);
      estado.erro = 'unop desconhecido: ' + expr.op;
      return undefined;
    }
    case 'binop': {
      const a = _eval_expr(expr.esq, estado);
      if(estado.erro) return undefined;
      const b = _eval_expr(expr.dir, estado);
      if(estado.erro) return undefined;
      const na = Number(a), nb = Number(b);
      switch(expr.op){
        case '+': return na + nb;
        case '-': return na - nb;
        case '*': return na * nb;
        case '/':
          if(nb === 0){ estado.erro = 'divisão por zero'; return undefined; }
          return na / nb;
        case '%':
          if(nb === 0){ estado.erro = 'divisão por zero (mod)'; return undefined; }
          return na % nb;
        case '**': return Math.pow(na, nb);
        case '==': return na === nb ? 1 : 0;
        case '!=': return na !== nb ? 1 : 0;
        case '<':  return na <  nb ? 1 : 0;
        case '>':  return na >  nb ? 1 : 0;
        case '<=': return na <= nb ? 1 : 0;
        case '>=': return na >= nb ? 1 : 0;
        case '&&': return (_eh_truthy(a) && _eh_truthy(b)) ? 1 : 0;
        case '||': return (_eh_truthy(a) || _eh_truthy(b)) ? 1 : 0;
        default:
          estado.erro = 'op desconhecido: ' + expr.op;
          return undefined;
      }
    }
    case 'chamada': {
      const fn = estado.funcoes[expr.nome];
      if(!fn){
        estado.erro = 'função não definida: ' + expr.nome;
        return undefined;
      }
      if(estado.pilha.length >= estado.max_frames){
        estado.erro = 'pilha estourada (' + estado.max_frames + ' frames) — recursão sem base?';
        return undefined;
      }
      const args_val = [];
      for(const a of expr.args){
        const v = _eval_expr(a, estado);
        if(estado.erro) return undefined;
        args_val.push(v);
      }
      const frame = {};
      for(let i = 0; i < fn.params.length; i++){
        frame[fn.params[i]] = args_val[i];
      }
      estado.pilha.push(frame);
      let ret_val = undefined;
      for(const s of fn.corpo){
        const r = _exec_stmt(s, estado);
        if(estado.erro) break;
        if(r && r.tipo === 'retorno'){ ret_val = r.valor; break; }
      }
      estado.pilha.pop();
      return ret_val;
    }
    default:
      estado.erro = 'expr tipo desconhecido: ' + expr.tipo;
      return undefined;
  }
}

// ────────────────────────────────────────────────────────────────
// 4. TRADUÇÃO (B_traducao) — AST → C / Java / Python
// ────────────────────────────────────────────────────────────────
function v112_prog_traduzir(ast, alvo){
  if(!ast || ast.erro) return { erro: ast ? ast.erro : 'ast nulo' };
  const a = String(alvo||'').toLowerCase();
  if(a !== 'c' && a !== 'java' && a !== 'python') return { erro: 'alvo inválido: ' + alvo + ' (use c/java/python)' };

  const limitacoes = [];
  const ind = a === 'python' ? '    ' : '  ';
  const emitter = a === 'python' ? _emit_python : (a === 'c' ? _emit_c : _emit_java);

  const corpo_src = (ast.corpo || []).map(s => emitter(s, ind, '', limitacoes)).join('\\n');

  let codigo = corpo_src;
  if(a === 'c' || a === 'java'){
    // Limitações comuns
    if(limitacoes.length > 0){
      codigo += '\\n// limitações: ' + limitacoes.join('; ');
    }
  } else if(a === 'python' && limitacoes.length > 0){
    codigo += '\\n# limitações: ' + limitacoes.join('; ');
  }

  return { codigo, alvo: a, limitacoes };
}
G.v112_prog_traduzir = v112_prog_traduzir;

function _emit_expr_geral(expr, top){
  if(!expr) return '';
  if(expr.erro) return '/* erro: ' + expr.erro + ' */';
  switch(expr.tipo){
    case 'num': return String(expr.valor);
    case 'var': return expr.nome;
    case 'unop': return '(' + expr.op + _emit_expr_geral(expr.operando, false) + ')';
    case 'binop': {
      const op = expr.op === '**' ? '**' : expr.op;
      const s = _emit_expr_geral(expr.esq, false) + ' ' + op + ' ' + _emit_expr_geral(expr.dir, false);
      return top ? s : '(' + s + ')';
    }
    case 'chamada': return expr.nome + '(' + expr.args.map(a => _emit_expr_geral(a, true)).join(', ') + ')';
    default: return '/* expr ' + expr.tipo + ' */';
  }
}

function _emit_expr_c_like(expr, top){
  // Igual ao geral mas substitui ** por pow(a,b) (C/Java não têm **)
  // top=true → não envolve em parênteses externos
  if(!expr) return '';
  if(expr.erro) return '/* erro */';
  if(expr.tipo === 'binop' && expr.op === '**'){
    return 'pow(' + _emit_expr_c_like(expr.esq, true) + ', ' + _emit_expr_c_like(expr.dir, true) + ')';
  }
  if(expr.tipo === 'binop'){
    const s = _emit_expr_c_like(expr.esq, false) + ' ' + expr.op + ' ' + _emit_expr_c_like(expr.dir, false);
    return top ? s : '(' + s + ')';
  }
  if(expr.tipo === 'unop') return '(' + expr.op + _emit_expr_c_like(expr.operando, false) + ')';
  if(expr.tipo === 'num') return String(expr.valor);
  if(expr.tipo === 'var') return expr.nome;
  if(expr.tipo === 'chamada') return expr.nome + '(' + expr.args.map(a => _emit_expr_c_like(a, true)).join(', ') + ')';
  return '/* */';
}

function _emit_c(stmt, ind, pref, lims){
  if(!stmt) return '';
  switch(stmt.tipo){
    case 'atribuir': return pref + 'int ' + stmt.var + ' = ' + _emit_expr_c_like(stmt.expr, true) + ';';
    case 'imprime': return pref + 'printf("%d\\\\n", ' + _emit_expr_c_like(stmt.expr, true) + ');';
    case 'retorna': return pref + 'return ' + (stmt.expr ? _emit_expr_c_like(stmt.expr, true) : '') + ';';
    case 'se': {
      const cond = _emit_expr_c_like(stmt.cond, true);
      const e = stmt.entao.map(s => _emit_c(s, ind, pref + ind, lims)).join('\\n');
      let out = pref + 'if (' + cond + ') {\\n' + e + '\\n' + pref + '}';
      if(stmt.senao && stmt.senao.length){
        const sn = stmt.senao.map(s => _emit_c(s, ind, pref + ind, lims)).join('\\n');
        out += ' else {\\n' + sn + '\\n' + pref + '}';
      }
      return out;
    }
    case 'enquanto': {
      const cond = _emit_expr_c_like(stmt.cond, true);
      const c = stmt.corpo.map(s => _emit_c(s, ind, pref + ind, lims)).join('\\n');
      return pref + 'while (' + cond + ') {\\n' + c + '\\n' + pref + '}';
    }
    case 'para': {
      const de = _emit_expr_c_like(stmt.de, true);
      const ate = _emit_expr_c_like(stmt.ate, true);
      const c = stmt.corpo.map(s => _emit_c(s, ind, pref + ind, lims)).join('\\n');
      return pref + 'for (int ' + stmt.var + ' = ' + de + '; ' + stmt.var + ' <= ' + ate + '; ' + stmt.var + '++) {\\n' + c + '\\n' + pref + '}';
    }
    case 'funcao': {
      if(!lims.includes('tipos assumidos int (sem inferência)')) lims.push('tipos assumidos int (sem inferência)');
      const params = stmt.params.map(p => 'int ' + p).join(', ');
      const c = stmt.corpo.map(s => _emit_c(s, ind, pref + ind, lims)).join('\\n');
      return pref + 'int ' + stmt.nome + '(' + params + ') {\\n' + c + '\\n' + pref + '}';
    }
    case 'expr_stmt': return pref + _emit_expr_c_like(stmt.expr, true) + ';';
    default: return pref + '/* tipo ' + stmt.tipo + ' não suportado */';
  }
}

function _emit_java(stmt, ind, pref, lims){
  if(!stmt) return '';
  switch(stmt.tipo){
    case 'atribuir': return pref + 'int ' + stmt.var + ' = ' + _emit_expr_c_like(stmt.expr, true) + ';';
    case 'imprime': return pref + 'System.out.println(' + _emit_expr_c_like(stmt.expr, true) + ');';
    case 'retorna': return pref + 'return ' + (stmt.expr ? _emit_expr_c_like(stmt.expr, true) : '') + ';';
    case 'se': {
      const cond = _emit_expr_c_like(stmt.cond, true);
      const e = stmt.entao.map(s => _emit_java(s, ind, pref + ind, lims)).join('\\n');
      let out = pref + 'if (' + cond + ') {\\n' + e + '\\n' + pref + '}';
      if(stmt.senao && stmt.senao.length){
        const sn = stmt.senao.map(s => _emit_java(s, ind, pref + ind, lims)).join('\\n');
        out += ' else {\\n' + sn + '\\n' + pref + '}';
      }
      return out;
    }
    case 'enquanto': {
      const cond = _emit_expr_c_like(stmt.cond, true);
      const c = stmt.corpo.map(s => _emit_java(s, ind, pref + ind, lims)).join('\\n');
      return pref + 'while (' + cond + ') {\\n' + c + '\\n' + pref + '}';
    }
    case 'para': {
      const de = _emit_expr_c_like(stmt.de, true);
      const ate = _emit_expr_c_like(stmt.ate, true);
      const c = stmt.corpo.map(s => _emit_java(s, ind, pref + ind, lims)).join('\\n');
      return pref + 'for (int ' + stmt.var + ' = ' + de + '; ' + stmt.var + ' <= ' + ate + '; ' + stmt.var + '++) {\\n' + c + '\\n' + pref + '}';
    }
    case 'funcao': {
      if(!lims.includes('tipos assumidos int (sem inferência)')) lims.push('tipos assumidos int (sem inferência)');
      const params = stmt.params.map(p => 'int ' + p).join(', ');
      const c = stmt.corpo.map(s => _emit_java(s, ind, pref + ind, lims)).join('\\n');
      return pref + 'static int ' + stmt.nome + '(' + params + ') {\\n' + c + '\\n' + pref + '}';
    }
    case 'expr_stmt': return pref + _emit_expr_c_like(stmt.expr, true) + ';';
    default: return pref + '/* tipo ' + stmt.tipo + ' não suportado */';
  }
}

function _emit_python(stmt, ind, pref, lims){
  if(!stmt) return '';
  switch(stmt.tipo){
    case 'atribuir': return pref + stmt.var + ' = ' + _emit_expr_geral(stmt.expr, true);
    case 'imprime': return pref + 'print(' + _emit_expr_geral(stmt.expr, true) + ')';
    case 'retorna': return pref + 'return' + (stmt.expr ? ' ' + _emit_expr_geral(stmt.expr, true) : '');
    case 'se': {
      const cond = _emit_expr_geral(stmt.cond, true);
      const e = stmt.entao.map(s => _emit_python(s, ind, pref + ind, lims)).join('\\n');
      let out = pref + 'if ' + cond + ':\\n' + (e || pref + ind + 'pass');
      if(stmt.senao && stmt.senao.length){
        const sn = stmt.senao.map(s => _emit_python(s, ind, pref + ind, lims)).join('\\n');
        out += '\\n' + pref + 'else:\\n' + sn;
      }
      return out;
    }
    case 'enquanto': {
      const cond = _emit_expr_geral(stmt.cond, true);
      const c = stmt.corpo.map(s => _emit_python(s, ind, pref + ind, lims)).join('\\n');
      return pref + 'while ' + cond + ':\\n' + (c || pref + ind + 'pass');
    }
    case 'para': {
      const de = _emit_expr_geral(stmt.de, true);
      const ate = _emit_expr_geral(stmt.ate, true);
      const c = stmt.corpo.map(s => _emit_python(s, ind, pref + ind, lims)).join('\\n');
      // Python range é exclusivo no fim — para "até B" inclusivo, range(de, ate+1)
      let ate_inc;
      if(/^\\d+$/.test(ate)) ate_inc = String(Number(ate) + 1);
      else ate_inc = '(' + ate + ') + 1';
      return pref + 'for ' + stmt.var + ' in range(' + de + ', ' + ate_inc + '):\\n' + (c || pref + ind + 'pass');
    }
    case 'funcao': {
      const params = stmt.params.join(', ');
      const c = stmt.corpo.map(s => _emit_python(s, ind, pref + ind, lims)).join('\\n');
      return pref + 'def ' + stmt.nome + '(' + params + '):\\n' + (c || pref + ind + 'pass');
    }
    case 'expr_stmt': return pref + _emit_expr_geral(stmt.expr, true);
    default: return pref + '# tipo ' + stmt.tipo + ' não suportado';
  }
}

// ────────────────────────────────────────────────────────────────
// 5. COMPLEXIDADE (B_complexidade)
// ────────────────────────────────────────────────────────────────
function v112_prog_complexidade(ast){
  if(!ast || ast.erro) return { erro: ast ? ast.erro : 'ast nulo' };

  // Heurísticas:
  // - varremos o corpo; cada loop multiplica;
  // - funções recursivas analisadas separadamente.
  const funcoes = {};
  for(const s of (ast.corpo || [])){
    if(s.tipo === 'funcao') funcoes[s.nome] = s;
  }

  const recursoes = _analisar_recursoes(funcoes);
  const big_o_loops = _analisar_loops(ast.corpo);

  // Combina: se há recursão linear/dupla, ela tipicamente domina sobre loops simples
  // Mas se programa só chama função, complexidade = recursão chamada
  let dominante = big_o_loops;

  // Se programa termina com chamada de função recursiva, complexidade = recursiva
  const ultimo = ast.corpo[ast.corpo.length - 1];
  if(ultimo && ultimo.tipo === 'expr_stmt' && ultimo.expr && ultimo.expr.tipo === 'chamada'){
    const fn_nome = ultimo.expr.nome;
    if(recursoes[fn_nome]) dominante = recursoes[fn_nome];
  }
  // Considera só a primeira função recursiva se complexidade dos loops é O(1)
  if(big_o_loops.nivel === 'O(1)'){
    for(const k of Object.keys(recursoes)){
      dominante = recursoes[k];
      break;
    }
  }

  return {
    complexidade: dominante.nivel,
    justificativa: dominante.justificativa,
    loops: big_o_loops,
    recursoes,
  };
}
G.v112_prog_complexidade = v112_prog_complexidade;

// Analisa profundidade máxima de loops aninhados em N
function _analisar_loops(corpo){
  const r = _loops_profundidade(corpo, 0);
  const nivel = _nivel_para_big_o(r.nivel, r.is_log);
  let justif;
  if(r.nivel === 0) justif = 'sem loops nem recursão detectada';
  else if(r.is_log) justif = 'loop dividindo variável (i = i/2 ou i = i*2) → logarítmico';
  else if(r.nivel === 1) justif = '1 loop sobre n';
  else justif = r.nivel + ' loops aninhados sobre n';
  return { nivel, justificativa: justif };
}

function _loops_profundidade(corpo, atual){
  if(!corpo || !Array.isArray(corpo)) return { nivel: atual, is_log: false };
  let max = atual;
  let is_log = false;
  for(const s of corpo){
    if(!s) continue;
    if(s.tipo === 'enquanto' || s.tipo === 'para'){
      // Detectar i = i/2 ou i = i*2 dentro do corpo
      const corpo_int = s.corpo || [];
      const log_local = corpo_int.some(c =>
        c && c.tipo === 'atribuir' && c.expr && c.expr.tipo === 'binop' &&
        (c.expr.op === '/' || c.expr.op === '*') &&
        c.expr.esq && c.expr.esq.tipo === 'var' && c.expr.esq.nome === c.var &&
        c.expr.dir && c.expr.dir.tipo === 'num' && (c.expr.dir.valor === 2)
      );
      const sub = _loops_profundidade(s.corpo, atual + 1);
      if(sub.nivel > max) max = sub.nivel;
      if(log_local && atual === 0) is_log = true;
      if(sub.is_log) is_log = true;
    } else if(s.tipo === 'se'){
      const a = _loops_profundidade(s.entao, atual);
      const b = _loops_profundidade(s.senao, atual);
      if(a.nivel > max) max = a.nivel;
      if(b.nivel > max) max = b.nivel;
      if(a.is_log || b.is_log) is_log = true;
    } else if(s.tipo === 'funcao'){
      // Função em si não conta como loop (só se chamada)
      // mas escaneia corpo pra detectar loops internos
      const sub = _loops_profundidade(s.corpo, atual);
      if(sub.nivel > max) max = sub.nivel;
      if(sub.is_log) is_log = true;
    }
  }
  return { nivel: max, is_log };
}

function _nivel_para_big_o(n, is_log){
  if(n === 0) return 'O(1)';
  if(is_log && n === 1) return 'O(log n)';
  if(n === 1) return 'O(n)';
  if(n === 2) return 'O(n²)';
  if(n === 3) return 'O(n³)';
  return 'O(n^' + n + ')';
}

function _analisar_recursoes(funcoes){
  const r = {};
  for(const [nome, fn] of Object.entries(funcoes)){
    const chamadas = _contar_auto_chamadas(fn.corpo, nome);
    if(chamadas === 0) continue;
    if(chamadas === 1) r[nome] = { nivel: 'O(n)', justificativa: 'recursão linear (' + nome + ' se chama 1x)' };
    else if(chamadas >= 2) r[nome] = { nivel: 'O(2^n)', justificativa: 'recursão dupla (' + nome + ' se chama ' + chamadas + 'x — explosão exponencial)' };
  }
  return r;
}

function _contar_auto_chamadas(corpo, nome){
  let total = 0;
  if(!corpo) return 0;
  for(const s of corpo){
    if(!s) continue;
    total += _contar_chamadas_em_expr(s.expr, nome);
    total += _contar_chamadas_em_expr(s.cond, nome);
    if(s.entao) total += _contar_auto_chamadas(s.entao, nome);
    if(s.senao) total += _contar_auto_chamadas(s.senao, nome);
    if(s.corpo) total += _contar_auto_chamadas(s.corpo, nome);
  }
  return total;
}

function _contar_chamadas_em_expr(expr, nome){
  if(!expr) return 0;
  let t = 0;
  if(expr.tipo === 'chamada' && expr.nome === nome) t = 1;
  if(expr.esq) t += _contar_chamadas_em_expr(expr.esq, nome);
  if(expr.dir) t += _contar_chamadas_em_expr(expr.dir, nome);
  if(expr.operando) t += _contar_chamadas_em_expr(expr.operando, nome);
  if(expr.args){
    for(const a of expr.args) t += _contar_chamadas_em_expr(a, nome);
  }
  return t;
}

// ────────────────────────────────────────────────────────────────
// 6. BUG DETECT (B_bug_detect)
// ────────────────────────────────────────────────────────────────
function v112_prog_bug_detect(ast){
  if(!ast || ast.erro) return { erro: ast ? ast.erro : 'ast nulo' };
  const bugs = [];

  // 1. Loops infinitos
  _detectar_loops_infinitos(ast.corpo, bugs);

  // 2. Divisão por zero (estática + dinâmica simples)
  _detectar_div_zero(ast.corpo, bugs, {});

  // 3. Recursão sem caso base
  for(const s of ast.corpo){
    if(s && s.tipo === 'funcao'){
      _detectar_recursao_sem_base(s, bugs);
    }
  }

  // 4. Função sem return (warning)
  for(const s of ast.corpo){
    if(s && s.tipo === 'funcao'){
      const tem_ret = _tem_return(s.corpo);
      if(!tem_ret){
        bugs.push({ tipo: 'warning', subtipo: 'funcao_sem_return', descricao: 'função ' + s.nome + ' não tem comando retorna' });
      }
    }
  }

  return { bugs };
}
G.v112_prog_bug_detect = v112_prog_bug_detect;

function _coletar_vars_expr(expr, out){
  if(!expr) return;
  if(expr.tipo === 'var') out.add(expr.nome);
  if(expr.esq) _coletar_vars_expr(expr.esq, out);
  if(expr.dir) _coletar_vars_expr(expr.dir, out);
  if(expr.operando) _coletar_vars_expr(expr.operando, out);
  if(expr.args) for(const a of expr.args) _coletar_vars_expr(a, out);
}

function _detectar_loops_infinitos(corpo, bugs){
  if(!corpo) return;
  for(const s of corpo){
    if(!s) continue;
    if(s.tipo === 'enquanto'){
      // Vars usadas na cond
      const vars_cond = new Set();
      _coletar_vars_expr(s.cond, vars_cond);

      // Se cond é literal verdade sempre (binop com 2 num), só checa se sempre dá true
      if(vars_cond.size === 0){
        // pode ser true/1 → loop infinito clássico (não detectamos isso aqui — geralmente intencional)
      } else {
        // Procura atribuições no corpo que alterem alguma var da cond
        const altera = {};
        for(const v of vars_cond) altera[v] = { encontrou: false, direcao: null };

        for(const c of s.corpo){
          if(c && c.tipo === 'atribuir' && altera[c.var]){
            altera[c.var].encontrou = true;
            // direção: se expr é "var + N" → incrementa; "var - N" → decrementa
            altera[c.var].direcao = _detectar_direcao(c.expr, c.var);
          }
        }

        // 1) Nenhuma var é alterada
        const nenhuma_alterada = Object.values(altera).every(x => !x.encontrou);
        if(nenhuma_alterada){
          bugs.push({
            tipo: 'erro',
            subtipo: 'loop_infinito',
            descricao: 'loop "enquanto" não modifica nenhuma variável da condição',
          });
        } else {
          // 2) Direção errada?
          // cond do tipo "x > N" → quer decrementar; cond "x < N" → quer incrementar
          if(s.cond && s.cond.tipo === 'binop'){
            const op = s.cond.op;
            // var na esquerda?
            let var_da_cond = null;
            if(s.cond.esq && s.cond.esq.tipo === 'var') var_da_cond = s.cond.esq.nome;
            if(var_da_cond && altera[var_da_cond] && altera[var_da_cond].encontrou){
              const dir = altera[var_da_cond].direcao;
              const errado = (
                (op === '>' || op === '>=') && dir === 'incrementa'
              ) || (
                (op === '<' || op === '<=') && dir === 'decrementa'
              );
              if(errado){
                bugs.push({
                  tipo: 'erro',
                  subtipo: 'loop_infinito',
                  descricao: 'loop "enquanto ' + var_da_cond + ' ' + op + ' ...": variável vai na direção errada (' + dir + ')',
                });
              }
            }
          }
        }
      }
      _detectar_loops_infinitos(s.corpo, bugs);
    } else if(s.tipo === 'se'){
      _detectar_loops_infinitos(s.entao, bugs);
      _detectar_loops_infinitos(s.senao, bugs);
    } else if(s.tipo === 'para' || s.tipo === 'funcao'){
      _detectar_loops_infinitos(s.corpo, bugs);
    }
  }
}

function _detectar_direcao(expr, var_alvo){
  // expr = "var + N" → incrementa
  // expr = "var - N" → decrementa
  if(!expr || expr.tipo !== 'binop') return null;
  if(expr.esq && expr.esq.tipo === 'var' && expr.esq.nome === var_alvo){
    if(expr.op === '+') return 'incrementa';
    if(expr.op === '-') return 'decrementa';
    if(expr.op === '*' && expr.dir && expr.dir.tipo === 'num' && expr.dir.valor > 1) return 'incrementa';
    if(expr.op === '/' && expr.dir && expr.dir.tipo === 'num' && expr.dir.valor > 1) return 'decrementa';
  }
  return null;
}

function _detectar_div_zero(corpo, bugs, env){
  if(!corpo) return;
  for(const s of corpo){
    if(!s) continue;
    // Atualiza env com últimas atribuições (literal só)
    if(s.tipo === 'atribuir'){
      if(s.expr && s.expr.tipo === 'num') env[s.var] = s.expr.valor;
      else env[s.var] = '?';
      _verificar_div_zero_expr(s.expr, bugs, env);
    } else if(s.tipo === 'imprime' || s.tipo === 'expr_stmt' || s.tipo === 'retorna'){
      _verificar_div_zero_expr(s.expr, bugs, env);
    } else if(s.tipo === 'se'){
      _verificar_div_zero_expr(s.cond, bugs, env);
      _detectar_div_zero(s.entao, bugs, Object.assign({}, env));
      _detectar_div_zero(s.senao, bugs, Object.assign({}, env));
    } else if(s.tipo === 'enquanto'){
      _verificar_div_zero_expr(s.cond, bugs, env);
      _detectar_div_zero(s.corpo, bugs, Object.assign({}, env));
    } else if(s.tipo === 'para'){
      _detectar_div_zero(s.corpo, bugs, Object.assign({}, env));
    } else if(s.tipo === 'funcao'){
      _detectar_div_zero(s.corpo, bugs, {});
    }
  }
}

function _verificar_div_zero_expr(expr, bugs, env){
  if(!expr) return;
  if(expr.tipo === 'binop' && (expr.op === '/' || expr.op === '%')){
    if(expr.dir && expr.dir.tipo === 'num' && expr.dir.valor === 0){
      bugs.push({ tipo: 'erro', subtipo: 'div_zero', descricao: 'divisão por zero literal' });
    } else if(expr.dir && expr.dir.tipo === 'var' && env[expr.dir.nome] === 0){
      bugs.push({ tipo: 'erro', subtipo: 'div_zero', descricao: 'divisão por variável ' + expr.dir.nome + ' cuja última atribuição visível é 0' });
    }
  }
  if(expr.esq) _verificar_div_zero_expr(expr.esq, bugs, env);
  if(expr.dir) _verificar_div_zero_expr(expr.dir, bugs, env);
  if(expr.operando) _verificar_div_zero_expr(expr.operando, bugs, env);
  if(expr.args) for(const a of expr.args) _verificar_div_zero_expr(a, bugs, env);
}

function _detectar_recursao_sem_base(fn, bugs){
  // Verifica se existe chamada recursiva sem nenhum "retorna" condicional ANTES dela
  const nome = fn.nome;
  const tem_chamada = _contar_auto_chamadas(fn.corpo, nome) > 0;
  if(!tem_chamada) return;

  // Procura por algum caminho condicional com retorno que NÃO chama recursivamente
  const tem_base = _tem_caso_base(fn.corpo, nome);

  if(!tem_base){
    bugs.push({
      tipo: 'erro',
      subtipo: 'recursao_sem_base',
      descricao: 'função ' + nome + ' se chama recursivamente sem caso base detectável',
    });
  }
}

function _tem_caso_base(corpo, nome_fn){
  // Caso base = existe um "se ... retorna" onde o retorno NÃO contém chamada recursiva
  if(!corpo) return false;
  for(const s of corpo){
    if(!s) continue;
    if(s.tipo === 'se'){
      // Verifica entao e senao
      for(const ramo of [s.entao, s.senao]){
        if(!ramo) continue;
        for(const inner of ramo){
          if(!inner) continue;
          if(inner.tipo === 'retorna' && _contar_chamadas_em_expr(inner.expr, nome_fn) === 0){
            return true;
          }
        }
      }
      // recursivo: pode haver caso base aninhado
      if(_tem_caso_base(s.entao, nome_fn)) return true;
      if(_tem_caso_base(s.senao, nome_fn)) return true;
    }
    if(s.tipo === 'retorna'){
      // retorno top-level sem chamada
      if(_contar_chamadas_em_expr(s.expr, nome_fn) === 0) return true;
    }
  }
  return false;
}

function _tem_return(corpo){
  if(!corpo) return false;
  for(const s of corpo){
    if(!s) continue;
    if(s.tipo === 'retorna') return true;
    if(s.tipo === 'se'){
      if(_tem_return(s.entao)) return true;
      if(_tem_return(s.senao)) return true;
    }
    if((s.tipo === 'enquanto' || s.tipo === 'para') && _tem_return(s.corpo)) return true;
  }
  return false;
}

// ────────────────────────────────────────────────────────────────
// 7. HANDLERS (prefixo h_prog_*)
// ────────────────────────────────────────────────────────────────
function v112_prog_registrar_handlers(){
  if(typeof G.v112_registrar_handler !== 'function') return 0;
  let n = 0;

  G.v112_registrar_handler('h_prog_executar', (m, input) => {
    const src = m[1];
    if(!src) return null;
    const ast = v112_prog_parsear(src);
    if(ast.erro) return { resposta_direta: 'erro de parse: ' + ast.erro, prog_executar: true };
    const r = v112_prog_executar(ast);
    let resp = '';
    if(r.erro) resp = 'erro: ' + r.erro;
    else {
      const partes = [];
      if(r.resultado !== undefined) partes.push('resultado = ' + r.resultado);
      if(r.saida && r.saida.length) partes.push('saída: [' + r.saida.join(', ') + ']');
      const vars = Object.keys(r.escopo_final);
      if(vars.length) partes.push('vars: ' + vars.map(k => k + '=' + r.escopo_final[k]).join(', '));
      partes.push(r.passos + ' passos');
      resp = partes.join(' | ');
    }
    return { resposta_direta: resp, prog_executar: true };
  }); n++;

  G.v112_registrar_handler('h_prog_parsear', (m, input) => {
    const src = m[1];
    if(!src) return null;
    const ast = v112_prog_parsear(src);
    if(ast.erro) return { resposta_direta: 'erro de parse: ' + ast.erro, prog_parsear: true };
    const tipos = (ast.corpo || []).map(c => c.tipo).join(', ');
    return { resposta_direta: 'AST ok: ' + ast.corpo.length + ' stmts [' + tipos + ']', prog_parsear: true };
  }); n++;

  G.v112_registrar_handler('h_prog_traduzir', (m, input) => {
    const alvo = m[1];
    const src = m[2];
    if(!src || !alvo) return null;
    const ast = v112_prog_parsear(src);
    if(ast.erro) return { resposta_direta: 'erro de parse: ' + ast.erro, prog_traduzir: true };
    const r = v112_prog_traduzir(ast, alvo);
    if(r.erro) return { resposta_direta: 'erro: ' + r.erro, prog_traduzir: true };
    return { resposta_direta: '[' + r.alvo + ']\\n' + r.codigo, prog_traduzir: true };
  }); n++;

  G.v112_registrar_handler('h_prog_complexidade', (m, input) => {
    const src = m[1];
    if(!src) return null;
    const ast = v112_prog_parsear(src);
    if(ast.erro) return { resposta_direta: 'erro de parse: ' + ast.erro, prog_complexidade: true };
    const r = v112_prog_complexidade(ast);
    if(r.erro) return { resposta_direta: 'erro: ' + r.erro, prog_complexidade: true };
    return { resposta_direta: r.complexidade + ' — ' + r.justificativa, prog_complexidade: true };
  }); n++;

  G.v112_registrar_handler('h_prog_bug_detect', (m, input) => {
    const src = m[1];
    if(!src) return null;
    const ast = v112_prog_parsear(src);
    if(ast.erro) return { resposta_direta: 'erro de parse: ' + ast.erro, prog_bug_detect: true };
    const r = v112_prog_bug_detect(ast);
    if(r.erro) return { resposta_direta: 'erro: ' + r.erro, prog_bug_detect: true };
    if(r.bugs.length === 0) return { resposta_direta: 'nenhum bug detectado (análise estática limitada)', prog_bug_detect: true };
    const desc = r.bugs.map(b => '[' + b.tipo + '/' + b.subtipo + '] ' + b.descricao).join(' | ');
    return { resposta_direta: r.bugs.length + ' problema(s): ' + desc, prog_bug_detect: true };
  }); n++;

  G.v112_registrar_handler('h_prog_fatorial', (m, input) => {
    const n_arg = parseInt(m[1]);
    if(isNaN(n_arg) || n_arg < 0) return null;
    const src = 'função fatorial(n): se n <= 1: retorna 1 senão retorna n * fatorial(n-1); fatorial(' + n_arg + ')';
    const ast = v112_prog_parsear(src);
    if(ast.erro) return { resposta_direta: 'erro: ' + ast.erro, prog_fatorial: true };
    const r = v112_prog_executar(ast);
    if(r.erro) return { resposta_direta: 'erro: ' + r.erro, prog_fatorial: true };
    return { resposta_direta: 'fatorial(' + n_arg + ') = ' + r.resultado + ' (' + r.passos + ' passos)', prog_fatorial: true };
  }); n++;

  G.v112_registrar_handler('h_prog_fibonacci', (m, input) => {
    const n_arg = parseInt(m[1]);
    if(isNaN(n_arg) || n_arg < 0) return null;
    if(n_arg > 25) return { resposta_direta: 'fibonacci(' + n_arg + ') ignorado — explosão exponencial (limite 25)', prog_fibonacci: true };
    const src = 'função fib(n): se n <= 1: retorna n senão retorna fib(n-1) + fib(n-2); fib(' + n_arg + ')';
    const ast = v112_prog_parsear(src);
    if(ast.erro) return { resposta_direta: 'erro: ' + ast.erro, prog_fibonacci: true };
    // n=25 precisa ~1.5M passos no evaluator ingênuo (cada chamada conta como vários passos)
    const r = v112_prog_executar(ast, { max_passos: 5000000 });
    if(r.erro) return { resposta_direta: 'erro: ' + r.erro, prog_fibonacci: true };
    return { resposta_direta: 'fibonacci(' + n_arg + ') = ' + r.resultado + ' (' + r.passos + ' passos)', prog_fibonacci: true };
  }); n++;

  return n;
}
G.v112_prog_registrar_handlers = v112_prog_registrar_handlers;

// ────────────────────────────────────────────────────────────────
// 8. COMANDOS-NÓS (idempotente)
// ────────────────────────────────────────────────────────────────
const V151_COMANDOS = [
  ['^executa[r]?\\\\s+pseudo:?\\\\s*(.+)$',             'h_prog_executar',     70, 'Executa pseudocódigo PT-BR'],
  ['^parseia[r]?\\\\s+pseudo:?\\\\s*(.+)$',             'h_prog_parsear',      70, 'Parseia pseudocódigo PT-BR → AST'],
  ['^traduz(?:ir|a)?\\\\s+(c|java|python):?\\\\s*(.+)$', 'h_prog_traduzir',     75, 'Traduz pseudocódigo para C/Java/Python'],
  ['^complexidade\\\\s+(?:de\\\\s+)?(.+)$',             'h_prog_complexidade', 70, 'Análise Big-O estática'],
  ['^bug[s]?\\\\s+(?:em|de)?\\\\s*(.+)$',               'h_prog_bug_detect',   70, 'Detecta loop infinito, div/0, recursão sem base'],
  ['^calcul[ae]?\\\\s+fatorial\\\\s+(?:de\\\\s+)?(\\\\d+)$', 'h_prog_fatorial',     80, 'Atalho: fatorial via interpretador'],
  ['^fibonacci\\\\s+(\\\\d+)$',                          'h_prog_fibonacci',    80, 'Atalho: fibonacci via interpretador'],
];

function v112_prog_criar_comandos(){
  if(typeof G.v112_comando_criar_no !== 'function') return 0;
  if(typeof G.v112_comandos_listar !== 'function') return 0;

  const existentes = G.v112_comandos_listar();
  const por_handler = new Set(existentes.map(c => c._handler_nome));

  let criados = 0;
  for(const [padrao, handler, prio, desc] of V151_COMANDOS){
    if(por_handler.has(handler)) continue; // idempotente
    G.v112_comando_criar_no(padrao, handler, { prioridade: prio, descricao: desc, categoria: 'prog' });
    criados++;
  }
  return criados;
}
G.v112_prog_criar_comandos = v112_prog_criar_comandos;

// ────────────────────────────────────────────────────────────────
// 9. ORQUESTRADOR
// ────────────────────────────────────────────────────────────────
function v112_prog_init(){
  const subs   = v112_prog_criar_subredes();
  const hands  = v112_prog_registrar_handlers();
  const cmds   = v112_prog_criar_comandos();
  if(typeof console !== 'undefined' && console.log){
    console.log('[v151_logica_prog] init: subs=' + subs + ' handlers=' + hands + ' comandos=' + cmds);
  }
  return { subs, hands, cmds };
}
G.v112_prog_init = v112_prog_init;

// Auto-inicia se V112 já existe (carregamento direto no browser).
// Pulado se o ambiente sinalizar V112_PROG_SKIP_AUTOINIT (ex: gera_v151 chama init manualmente).
if(G.V112 && G.V112.subredes && !G.V112_PROG_SKIP_AUTOINIT){
  try { v112_prog_init(); } catch(e){ console.log('[v151] auto-init falhou: ' + e.message); }
}

// Patch v112_importar — se o usuário carregar um cérebro via file input,
// rodamos init depois pra garantir que handlers/comandos novos sigam disponíveis
// (handlers globais são perdidos? não, são objetos JS; mas comandos podem ter sido
// re-vinculados pelo brain antigo. Idempotente: se já existem, init = no-op).
if(G.v112_importar && !G._v112_importar_v151_patched){
  const _orig_importar = G.v112_importar;
  G.v112_importar = function(){
    const r = _orig_importar.apply(this, arguments);
    try { v112_prog_init(); } catch(e){ /* silencioso */ }
    return r;
  };
  G._v112_importar_v151_patched = true;
}

})();
`});
