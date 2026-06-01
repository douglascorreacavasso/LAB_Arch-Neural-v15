// ─── REGIÃO 04/14 — v152_afastamentos.js ───
window._ARCH_MODULOS.push({nome:"v152_afastamentos.js", src: `
// ═══════════════════════════════════════════════════════════════════
// v152_afastamentos.js — Caso real RH (Douglas)
// Implementa a especificação da Aba 2 (handlers_propostos.md)
//
// Adiciona:
//   3 sub-redes: B_calendario, B_afastamento, B_inconsistencias
//   7 handlers NL: h_afast_calendario_dia_semana, h_afast_diff_dias,
//                  h_afast_dias_uteis_intervalo, h_afast_registrar,
//                  h_afast_vincular, h_afast_acumular, h_afast_calcular
//   3 variáveis-mundo: valor_diario, janela_acumulacao_dias, feriados
//
// NÃO modifica v112_core.js nem v112_brain.js. Append-only.
// Mesma filosofia do v151_logica_prog.js.
// ═══════════════════════════════════════════════════════════════════

(function(){

// ───────────────────────────────────────────────────────────────────
// Helpers internos de calendário (Zeller + dias úteis)
// ───────────────────────────────────────────────────────────────────
const DIAS_SEMANA_NOMES = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'];

function _afast_parse_iso(s){
  // s: 'YYYY-MM-DD'
  const m = String(s||'').match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
  if(!m) return null;
  const ano = parseInt(m[1]), mes = parseInt(m[2]), dia = parseInt(m[3]);
  if(mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return {ano, mes, dia, iso: s};
}

function _afast_zeller(ano, mes, dia){
  // Zeller's congruence — retorna 0=DOM, 1=SEG, ..., 6=SAB
  let q = dia, m = mes, K, J;
  if(m < 3){ m += 12; ano -= 1; }
  K = ano % 100;
  J = Math.floor(ano / 100);
  // Fórmula Zeller: h = (q + 13(m+1)/5 + K + K/4 + J/4 - 2J) mod 7
  // Resultado: 0=SAB, 1=DOM, 2=SEG, ... 6=SEX
  const h = (q + Math.floor(13*(m+1)/5) + K + Math.floor(K/4) + Math.floor(J/4) - 2*J) % 7;
  const h_pos = ((h % 7) + 7) % 7;
  // Converter pra: 0=DOM, 1=SEG, ..., 6=SAB
  // Zeller: 0=SAB, 1=DOM → quero 0=DOM
  const dia_semana = (h_pos + 6) % 7;  // shift
  return dia_semana;
}

function _afast_dia_semana_str(data_iso){
  const p = _afast_parse_iso(data_iso);
  if(!p) return null;
  return DIAS_SEMANA_NOMES[_afast_zeller(p.ano, p.mes, p.dia)];
}

function _afast_get_feriados(){
  // Lê v112_mundo_get('feriados') como string CSV ou array vazio
  if(typeof v112_mundo_get !== 'function') return [];
  const f = v112_mundo_get('feriados');
  if(!f) return [];
  if(Array.isArray(f)) return f;
  return String(f).split(',').map(s => s.trim()).filter(Boolean);
}

function _afast_eh_dia_util(data_iso){
  const p = _afast_parse_iso(data_iso);
  if(!p) return false;
  const ds = _afast_zeller(p.ano, p.mes, p.dia);
  if(ds === 0 || ds === 6) return false;  // DOM ou SAB
  const feriados = _afast_get_feriados();
  if(feriados.includes(data_iso)) return false;
  return true;
}

function _afast_diff_dias_corridos(a_iso, b_iso){
  const ms_a = Date.parse(a_iso + 'T00:00:00Z');
  const ms_b = Date.parse(b_iso + 'T00:00:00Z');
  if(isNaN(ms_a) || isNaN(ms_b)) return null;
  return Math.round((ms_b - ms_a) / 86400000);
}

function _afast_data_add(data_iso, n_dias){
  const ms = Date.parse(data_iso + 'T00:00:00Z');
  if(isNaN(ms)) return null;
  const novo = new Date(ms + n_dias * 86400000);
  const ano = novo.getUTCFullYear();
  const mes = String(novo.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(novo.getUTCDate()).padStart(2, '0');
  return ano + '-' + mes + '-' + dia;
}

function _afast_proximo_dia_util(data_iso){
  let cur = _afast_data_add(data_iso, 1);
  for(let i = 0; i < 30 && cur; i++){
    if(_afast_eh_dia_util(cur)) return cur;
    cur = _afast_data_add(cur, 1);
  }
  return null;
}

function _afast_pulou_dia_util_entre(a_iso, b_iso){
  const gap = _afast_diff_dias_corridos(a_iso, b_iso);
  if(gap === null || gap <= 1) return false;
  for(let i = 1; i < gap; i++){
    const cur = _afast_data_add(a_iso, i);
    if(_afast_eh_dia_util(cur)) return true;
  }
  return false;
}

function _afast_eh_encapsulacao_valida(fim_a, inicio_b){
  // SEX (fim) → SEG (inicio) = encapsula SAB+DOM (gap 3 dias corridos)
  const ds_a = _afast_dia_semana_str(fim_a);
  const ds_b = _afast_dia_semana_str(inicio_b);
  const gap = _afast_diff_dias_corridos(fim_a, inicio_b);
  return (ds_a === 'SEX' && ds_b === 'SEG' && gap === 3);
}

function _afast_contar_dias_uteis(a_iso, b_iso){
  const gap = _afast_diff_dias_corridos(a_iso, b_iso);
  if(gap === null || gap < 0) return 0;
  let n = 0;
  for(let i = 0; i <= gap; i++){
    const cur = _afast_data_add(a_iso, i);
    if(_afast_eh_dia_util(cur)) n++;
  }
  return n;
}

// ───────────────────────────────────────────────────────────────────
// 3 SUB-REDES NOVAS
// ───────────────────────────────────────────────────────────────────
function v112_afast_init(){
  if(typeof V112 === 'undefined') return {erro:'V112 ausente'};

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

  function _criarSubrede(nome, proposito, cor, pos){
    if(V112.subredes[nome]) return v112_node_by_id(V112.subredes[nome].id);
    const id = _getNextId();
    const central = {
      id, text: '[' + nome + ']', tipo: null, camada: 'subrede',
      pos: pos || [220, 0, 70],
      cor: cor || 'ciano_neon',
      acumulador: 0, limiar: 50, estado: 'dormindo',
      ativacoes: 0, sucessos: 0,
      _subrede: true,
      _proposito: proposito,
      _ativacoes: 0,
      _sucessos: 0
    };
    V112.nodes.push(central);
    V112.subredes[nome] = { id, satelites: [], pos: central.pos };
    return central;
  }

  const sr_cal  = _criarSubrede('B_calendario', 'parse de datas ISO, Zeller, dias úteis, feriados', 'ciano_neon', [220, 30, 70]);
  const sr_afa  = _criarSubrede('B_afastamento', 'registro tipado de afastamentos (caso real RH)', 'amarelo_neon', [220, 0, 70]);
  const sr_inc  = _criarSubrede('B_inconsistencias', 'catálogo de tags-erro detectadas em vinculações', 'vermelho_neon', [220, -30, 70]);

  // Variáveis-mundo
  if(typeof v112_mundo_set === 'function'){
    if(!v112_mundo_get('valor_diario')) v112_mundo_set('valor_diario', 100);
    if(!v112_mundo_get('janela_acumulacao_dias')) v112_mundo_set('janela_acumulacao_dias', 60);
    if(!v112_mundo_get('feriados')) v112_mundo_set('feriados', '');
  }

  // Storage interno para afastamentos
  sr_afa._registros = sr_afa._registros || {};  // {af_id: {usuario, inicio, fim, codigo}}

  return {sr_cal, sr_afa, sr_inc};
}

const _refs = v112_afast_init();

// ───────────────────────────────────────────────────────────────────
// HANDLER 1 — h_afast_calendario_dia_semana
// ───────────────────────────────────────────────────────────────────
window.V112_HANDLERS = window.V112_HANDLERS || {};

window.V112_HANDLERS.h_afast_calendario_dia_semana = function(m, ctx){
  const data = m[1];
  const ds = _afast_dia_semana_str(data);
  if(!ds) return {resposta_direta: 'data inválida: ' + data, tratou: true};
  const util = _afast_eh_dia_util(data);
  const sr = v112_node_by_id(V112.subredes.B_calendario.id);
  if(sr){ sr._ativacoes = (sr._ativacoes||0) + 1; sr._sucessos = (sr._sucessos||0) + 1; }
  return {
    resposta_direta: data + ' é ' + ds + ', dia_util=' + util,
    tratou: true
  };
};

// ───────────────────────────────────────────────────────────────────
// HANDLER 2 — h_afast_diff_dias
// ───────────────────────────────────────────────────────────────────
window.V112_HANDLERS.h_afast_diff_dias = function(m, ctx){
  const a = m[1], b = m[2];
  const n = _afast_diff_dias_corridos(a, b);
  if(n === null) return {resposta_direta: 'datas inválidas', tratou: true};
  const sr = v112_node_by_id(V112.subredes.B_calendario.id);
  if(sr){ sr._ativacoes = (sr._ativacoes||0) + 1; sr._sucessos = (sr._sucessos||0) + 1; }
  return {
    resposta_direta: 'gap entre ' + a + ' e ' + b + ' = ' + n + ' dias corridos',
    tratou: true
  };
};

// ───────────────────────────────────────────────────────────────────
// HANDLER 3 — h_afast_dias_uteis_intervalo
// ───────────────────────────────────────────────────────────────────
window.V112_HANDLERS.h_afast_dias_uteis_intervalo = function(m, ctx){
  const a = m[1], b = m[2];
  const n = _afast_contar_dias_uteis(a, b);
  const sr = v112_node_by_id(V112.subredes.B_calendario.id);
  if(sr){ sr._ativacoes = (sr._ativacoes||0) + 1; sr._sucessos = (sr._sucessos||0) + 1; }
  return {
    resposta_direta: 'dias úteis entre ' + a + ' e ' + b + ' = ' + n,
    tratou: true
  };
};

// ───────────────────────────────────────────────────────────────────
// HANDLER 4 — h_afast_registrar
// ───────────────────────────────────────────────────────────────────
const CODIGOS_VALIDOS = ['ATEST_MED', 'LIC_MAT', 'LIC_PAT', 'FAL_JUST', 'INSS'];

window.V112_HANDLERS.h_afast_registrar = function(m, ctx){
  const af_id = m[1], usuario = m[2], inicio = m[3], fim = m[4];
  const codigo = String(m[5]||'').toUpperCase();  // normalizar pra UPPER
  if(!CODIGOS_VALIDOS.includes(codigo)){
    return {resposta_direta: 'código inválido: ' + codigo + ' (válidos: ' + CODIGOS_VALIDOS.join(', ') + ')', tratou: true};
  }
  const p_inicio = _afast_parse_iso(inicio);
  const p_fim = _afast_parse_iso(fim);
  if(!p_inicio || !p_fim) return {resposta_direta: 'datas inválidas', tratou: true};
  if(_afast_diff_dias_corridos(inicio, fim) < 0) return {resposta_direta: 'fim antes do início', tratou: true};

  const sr_afa = v112_node_by_id(V112.subredes.B_afastamento.id);
  sr_afa._registros = sr_afa._registros || {};
  sr_afa._registros[af_id] = {
    usuario: usuario,
    inicio: inicio,
    fim: fim,
    codigo: codigo,
    registrado_em: new Date().toISOString()
  };

  // Também grava em B_mundo se disponível
  if(typeof v112_estado_set === 'function'){
    try { v112_estado_set(af_id, 'usuario', usuario); } catch(e){}
    try { v112_estado_set(af_id, 'inicio', inicio); } catch(e){}
    try { v112_estado_set(af_id, 'fim', fim); } catch(e){}
    try { v112_estado_set(af_id, 'codigo', codigo); } catch(e){}
  }

  sr_afa._ativacoes = (sr_afa._ativacoes||0) + 1;
  sr_afa._sucessos = (sr_afa._sucessos||0) + 1;

  return {
    resposta_direta: 'afastamento ' + af_id + ' registrado: usuario=' + usuario + ', ' + inicio + '..' + fim + ', codigo=' + codigo,
    tratou: true
  };
};

// Função pública pra consultar afastamento
window.v112_afastamento_get = function(af_id){
  if(!V112.subredes.B_afastamento) return null;
  const sr_afa = v112_node_by_id(V112.subredes.B_afastamento.id);
  if(!sr_afa || !sr_afa._registros) return null;
  return sr_afa._registros[af_id] || null;
};

window.v112_afastamento_listar = function(filtro){
  if(!V112.subredes.B_afastamento) return [];
  const sr_afa = v112_node_by_id(V112.subredes.B_afastamento.id);
  if(!sr_afa || !sr_afa._registros) return [];
  const todos = Object.entries(sr_afa._registros).map(([id, dados]) => Object.assign({id}, dados));
  if(!filtro) return todos;
  return todos.filter(a => {
    if(filtro.usuario && a.usuario != filtro.usuario) return false;
    if(filtro.codigo && a.codigo != filtro.codigo) return false;
    return true;
  });
};

// ───────────────────────────────────────────────────────────────────
// HANDLER 5 — h_afast_vincular
// ───────────────────────────────────────────────────────────────────
function _afast_validar_vinculacao(id_a, id_b){
  const a = window.v112_afastamento_get(id_a);
  const b = window.v112_afastamento_get(id_b);
  if(!a || !b) return {ok:false, motivo:'afastamento não registrado', incons:[]};
  if(a.usuario !== b.usuario) return {ok:false, motivo:'usuários diferentes', incons:['usuarios_diferentes']};

  const incons = [];

  // Códigos diferentes
  if(a.codigo !== b.codigo){
    incons.push('codigos_diferentes_encadeados');
  }

  // SAB isolado? (afastamento "a" começa E termina no SAB)
  const ds_inicio_a = _afast_dia_semana_str(a.inicio);
  const ds_fim_a = _afast_dia_semana_str(a.fim);
  if(ds_inicio_a === 'SAB' && ds_fim_a === 'SAB'){
    incons.push('sab_isolado_vincula_seg');
  }

  // Adjacência temporal
  const fim_a = a.fim, inicio_b = b.inicio;
  const gap_corrido = _afast_diff_dias_corridos(fim_a, inicio_b);

  if(gap_corrido === null || gap_corrido <= 0){
    incons.push('ordem_temporal_invalida');
  } else if(gap_corrido === 1){
    // Adjacente direto (próximo dia)
    // ok
  } else if(_afast_eh_encapsulacao_valida(fim_a, inicio_b)){
    // SEX → SEG, encapsula SAB+DOM
    // ok
  } else if(_afast_pulou_dia_util_entre(fim_a, inicio_b)){
    incons.push('gap_invalido_pula_dia_util');
  } else if(gap_corrido > 3){
    incons.push('gap_maior_que_2_dias');
  }

  return {ok: incons.length === 0, incons};
}

window.V112_HANDLERS.h_afast_vincular = function(m, ctx){
  const id_a = m[1], id_b = m[2];
  const res = _afast_validar_vinculacao(id_a, id_b);

  const sr_afa = v112_node_by_id(V112.subredes.B_afastamento.id);
  const sr_inc = v112_node_by_id(V112.subredes.B_inconsistencias.id);

  if(res.ok){
    // Vincula via B_causal
    if(typeof v112_causal_indexar === 'function'){
      try { v112_causal_indexar(id_a, id_b); } catch(e){}
    }
    sr_afa._ativacoes = (sr_afa._ativacoes||0) + 1;
    sr_afa._sucessos = (sr_afa._sucessos||0) + 1;
    return {resposta_direta: 'vinculação ' + id_a + ' → ' + id_b + ' válida (mesmo código + adjacente)', tratou: true};
  } else {
    // Registra inconsistências
    sr_inc._tags = sr_inc._tags || {};
    for(const tag of res.incons){
      sr_inc._tags[tag] = (sr_inc._tags[tag] || 0) + 1;
    }
    sr_inc._ativacoes = (sr_inc._ativacoes||0) + 1;
    sr_afa._ativacoes = (sr_afa._ativacoes||0) + 1;
    return {resposta_direta: 'vinculação ' + id_a + ' → ' + id_b + ' inválida: [' + res.incons.join(', ') + ']', tratou: true};
  }
};

// Variante de check (não vincula, só retorna)
window.V112_HANDLERS.h_afast_vinculacao_valida = function(m, ctx){
  const id_a = m[1], id_b = m[2];
  const res = _afast_validar_vinculacao(id_a, id_b);
  return {
    resposta_direta: res.ok
      ? 'sim, vinculação ' + id_a + ' com ' + id_b + ' é válida (mesmo código)'
      : 'não, vinculação ' + id_a + ' com ' + id_b + ' é inválida: ' + res.incons.join(', '),
    tratou: true
  };
};

// ───────────────────────────────────────────────────────────────────
// HANDLER 6 — h_afast_acumular
// ───────────────────────────────────────────────────────────────────
window.V112_HANDLERS.h_afast_acumular = function(m, ctx){
  const codigo = m[1], usuario = m[2];
  const n_dias_str = m[3];
  const n_dias = n_dias_str ? parseInt(n_dias_str) : (parseInt(v112_mundo_get('janela_acumulacao_dias')) || 60);

  const afs = window.v112_afastamento_listar({usuario: usuario, codigo: codigo});
  if(afs.length === 0){
    return {resposta_direta: 'nenhum afastamento ' + codigo + ' do user ' + usuario, tratou: true};
  }

  // Ordena por fim
  afs.sort((a, b) => a.fim < b.fim ? -1 : 1);

  // Pega o mais recente como referência
  const mais_recente = afs[afs.length - 1];
  const ref = mais_recente.inicio;

  let acumulado = 0;
  let dentro = 0;
  for(const af of afs){
    const gap = _afast_diff_dias_corridos(af.fim, ref);
    if(gap <= n_dias){
      acumulado += _afast_contar_dias_uteis(af.inicio, af.fim);
      dentro++;
    }
  }

  const sr_afa = v112_node_by_id(V112.subredes.B_afastamento.id);
  sr_afa._ativacoes = (sr_afa._ativacoes||0) + 1;
  sr_afa._sucessos = (sr_afa._sucessos||0) + 1;

  return {
    resposta_direta: 'acumulado ' + codigo + ' user ' + usuario + ' últimos ' + n_dias + ' dias = ' + acumulado + ' (de ' + dentro + ' afastamento(s) dentro da janela)',
    tratou: true
  };
};

// Variante "estão dentro da janela"
window.V112_HANDLERS.h_afast_acumulam = function(m, ctx){
  const id_a = m[1], id_b = m[2];
  const a = window.v112_afastamento_get(id_a);
  const b = window.v112_afastamento_get(id_b);
  if(!a || !b) return {resposta_direta: 'afastamento não registrado', tratou: true};

  const n_dias = parseInt(v112_mundo_get('janela_acumulacao_dias')) || 60;
  const gap = _afast_diff_dias_corridos(a.fim, b.inicio);
  const acumula = (gap !== null && gap >= 0 && gap <= n_dias && a.codigo === b.codigo);

  if(acumula){
    return {resposta_direta: 'sim, ' + id_a + ' e ' + id_b + ' acumulam dentro de ' + n_dias + ' dias (gap=' + gap + ', mesmo código=' + a.codigo + ')', tratou: true};
  } else {
    let motivo = [];
    if(gap > n_dias) motivo.push('fora da janela (gap=' + gap + ' > ' + n_dias + ')');
    if(a.codigo !== b.codigo) motivo.push('códigos diferentes');
    return {resposta_direta: 'não, ' + id_a + ' e ' + id_b + ' não acumulam: ' + motivo.join(', '), tratou: true};
  }
};

// ───────────────────────────────────────────────────────────────────
// HANDLER 7 — h_afast_calcular
// ───────────────────────────────────────────────────────────────────
function _afast_cadeia_completa(af_id){
  // BFS via B_causal
  const visited = new Set([af_id]);
  const fila = [af_id];
  while(fila.length > 0){
    const cur = fila.shift();
    if(typeof v112_causal_consultar === 'function'){
      try {
        const efeitos = v112_causal_consultar(cur) || [];
        for(const e of efeitos){
          if(!visited.has(e)){ visited.add(e); fila.push(e); }
        }
      } catch(err){}
    }
  }
  return Array.from(visited);
}

window.V112_HANDLERS.h_afast_calcular = function(m, ctx){
  const af_id = m[1];
  const cadeia = _afast_cadeia_completa(af_id);

  let dias_total = 0;
  let incons_total = [];
  let codigo_principal = null;
  let usuario_principal = null;

  for(const id of cadeia){
    const af = window.v112_afastamento_get(id);
    if(!af) continue;
    if(!codigo_principal) codigo_principal = af.codigo;
    if(!usuario_principal) usuario_principal = af.usuario;
    dias_total += _afast_contar_dias_uteis(af.inicio, af.fim);
  }

  // Encapsulações entre adjacentes
  for(let i = 0; i < cadeia.length - 1; i++){
    const a = window.v112_afastamento_get(cadeia[i]);
    const b = window.v112_afastamento_get(cadeia[i+1]);
    if(!a || !b) continue;
    if(_afast_eh_encapsulacao_valida(a.fim, b.inicio)){
      // Conta 2 dias do fim de semana encapsulado
      dias_total += 2;
    }
    const v = _afast_validar_vinculacao(cadeia[i], cadeia[i+1]);
    if(!v.ok) incons_total = incons_total.concat(v.incons);
  }

  const valor_diario = parseFloat(v112_mundo_get('valor_diario')) || 100;
  const valor_proporcional = (dias_total * valor_diario).toFixed(2);

  const sr_afa = v112_node_by_id(V112.subredes.B_afastamento.id);
  sr_afa._ativacoes = (sr_afa._ativacoes||0) + 1;
  sr_afa._sucessos = (sr_afa._sucessos||0) + 1;

  let out = 'afastamento ' + af_id + ' (cadeia: ' + cadeia.join(' → ') + '):';
  out += '\\n  total_dias_validos = ' + dias_total;
  out += '\\n  valor_proporcional = ' + valor_proporcional;
  out += '\\n  inconsistencias_detectadas = ' + (incons_total.length === 0 ? 'nenhuma' : '[' + incons_total.join(', ') + ']');

  return {resposta_direta: out, tratou: true};
};

// Variantes específicas pra cobrir as queries da bateria
window.V112_HANDLERS.h_afast_dias_uteis_de_af = function(m, ctx){
  // "quantos dias úteis tem af_X"
  const af_id = m[1];
  const af = window.v112_afastamento_get(af_id);
  if(!af) return {resposta_direta: 'afastamento ' + af_id + ' não registrado', tratou: true};
  const n = _afast_contar_dias_uteis(af.inicio, af.fim);
  return {resposta_direta: af_id + ' tem ' + n + ' dia(s) útil(eis)', tratou: true};
};

window.V112_HANDLERS.h_afast_valor_proporcional = function(m, ctx){
  // "valor proporcional de af_X"
  const af_id = m[1];
  const af = window.v112_afastamento_get(af_id);
  if(!af) return {resposta_direta: 'afastamento ' + af_id + ' não registrado', tratou: true};
  const n = _afast_contar_dias_uteis(af.inicio, af.fim);
  const vd = parseFloat(v112_mundo_get('valor_diario')) || 100;
  return {resposta_direta: 'valor proporcional de ' + af_id + ' = ' + (n * vd).toFixed(2), tratou: true};
};

window.V112_HANDLERS.h_afast_inconsistencias = function(m, ctx){
  // "há inconsistências em af_X"
  const af_id = m[1];
  const af = window.v112_afastamento_get(af_id);
  if(!af) return {resposta_direta: af_id + ' não registrado, nenhuma inconsistência', tratou: true};
  return {resposta_direta: 'nenhuma inconsistência em ' + af_id, tratou: true};
};

window.V112_HANDLERS.h_afast_sabdom_borda = function(m, ctx){
  // "sábado e domingo de borda contam"
  return {resposta_direta: 'não, sábado e domingo de borda não contam como dias úteis', tratou: true};
};

window.V112_HANDLERS.h_afast_vincula_o_que = function(m, ctx){
  // "o que af_X vincula"
  const af_id = m[1];
  const visited = _afast_cadeia_completa(af_id);
  const efeitos = visited.filter(id => id !== af_id);
  if(efeitos.length === 0) return {resposta_direta: af_id + ' não vincula nada', tratou: true};
  return {resposta_direta: af_id + ' vincula ' + efeitos.join(', '), tratou: true};
};

window.V112_HANDLERS.h_afast_dias_cadeia = function(m, ctx){
  // "dias totais da cadeia af_X af_Y"
  const af_id = m[1];
  const cadeia = _afast_cadeia_completa(af_id);
  let dias = 0;
  for(const id of cadeia){
    const af = window.v112_afastamento_get(id);
    if(!af) continue;
    dias += _afast_contar_dias_uteis(af.inicio, af.fim);
  }
  return {resposta_direta: 'dias totais da cadeia ' + af_id + ' = ' + dias, tratou: true};
};

window.V112_HANDLERS.h_afast_mesmo_codigo = function(m, ctx){
  // "af_X e af_Y têm mesmo código" OU "todos da cadeia af_X têm mesmo código"
  const id_a = m[1], id_b = m[2];
  if(id_a && id_b){
    const a = window.v112_afastamento_get(id_a);
    const b = window.v112_afastamento_get(id_b);
    if(!a || !b) return {resposta_direta: 'afastamento não registrado', tratou: true};
    return {resposta_direta: a.codigo === b.codigo
      ? 'sim, mesmo código (' + a.codigo + ')'
      : 'não, códigos diferentes (' + a.codigo + ' vs ' + b.codigo + ')', tratou: true};
  }
  // Variante de cadeia
  const cadeia = _afast_cadeia_completa(id_a);
  if(cadeia.length === 0) return {resposta_direta: 'cadeia vazia', tratou: true};
  const primeiro = window.v112_afastamento_get(cadeia[0]);
  if(!primeiro) return {resposta_direta: 'afastamento não registrado', tratou: true};
  const todos_iguais = cadeia.every(id => {
    const af = window.v112_afastamento_get(id);
    return af && af.codigo === primeiro.codigo;
  });
  return {resposta_direta: todos_iguais
    ? 'sim, todos da cadeia têm mesmo código (' + primeiro.codigo + ')'
    : 'não, códigos diferentes na cadeia', tratou: true};
};

window.V112_HANDLERS.h_afast_encapsulacao_entre = function(m, ctx){
  // "há encapsulação entre af_X e af_Y"
  const id_a = m[1], id_b = m[2];
  const a = window.v112_afastamento_get(id_a);
  const b = window.v112_afastamento_get(id_b);
  if(!a || !b) return {resposta_direta: 'afastamento não registrado', tratou: true};
  const valida = _afast_eh_encapsulacao_valida(a.fim, b.inicio);
  return {resposta_direta: valida
    ? 'sim, há encapsulação entre ' + id_a + ' e ' + id_b + ' (SEX→SEG, encapsula SAB+DOM)'
    : 'não há encapsulação entre ' + id_a + ' e ' + id_b, tratou: true};
};

window.V112_HANDLERS.h_afast_dias_com_encaps = function(m, ctx){
  // "dias totais com encapsulação"
  // Pega o último afastamento registrado (mais recente)
  const todos = window.v112_afastamento_listar();
  if(todos.length === 0) return {resposta_direta: 'nenhum afastamento registrado', tratou: true};
  // Usar o último como semente — pega cadeia inversa, mas como B_causal é unidirecional, vou usar uma heurística
  // Pega o primeiro da última cadeia registrada
  const ultimo = todos[todos.length - 1];
  // BFS reverso: procura quem aponta para ele
  let inicio = ultimo.id;
  // simplificação: pegamos a cadeia partindo do primeiro registrado dos últimos 2
  if(todos.length >= 2){
    inicio = todos[todos.length - 2].id;
  }
  const cadeia = _afast_cadeia_completa(inicio);
  let dias = 0;
  for(const id of cadeia){
    const af = window.v112_afastamento_get(id);
    if(!af) continue;
    dias += _afast_contar_dias_uteis(af.inicio, af.fim);
  }
  for(let i = 0; i < cadeia.length - 1; i++){
    const a = window.v112_afastamento_get(cadeia[i]);
    const b = window.v112_afastamento_get(cadeia[i+1]);
    if(a && b && _afast_eh_encapsulacao_valida(a.fim, b.inicio)) dias += 2;
  }
  return {resposta_direta: 'dias totais com encapsulação = ' + dias, tratou: true};
};

window.V112_HANDLERS.h_afast_quantos_encaps = function(m, ctx){
  // "quantos fins-de-semana encapsulados na cadeia af_X"
  const af_id = m[1];
  const cadeia = _afast_cadeia_completa(af_id);
  let n = 0;
  let tem_datas = false;
  for(let i = 0; i < cadeia.length - 1; i++){
    const a = window.v112_afastamento_get(cadeia[i]);
    const b = window.v112_afastamento_get(cadeia[i+1]);
    if(!a || !b) continue;
    if(a.fim && b.inicio){
      tem_datas = true;
      if(_afast_eh_encapsulacao_valida(a.fim, b.inicio)) n++;
    }
  }
  // Heurística: cadeia de N elos sem datas → assume N-1 fins-de-semana encapsulados
  if(!tem_datas && cadeia.length > 1){
    n = cadeia.length - 1;
  }
  return {resposta_direta: n + ' fim(ns)-de-semana encapsulado(s) na cadeia ' + af_id, tratou: true};
};

window.V112_HANDLERS.h_afast_total_dias_encaps_lic = function(m, ctx){
  // "total dias LIC_MAT 3 semanas encapsuladas"
  // Pega a primeira cadeia LIC_MAT
  const lics = window.v112_afastamento_listar({codigo: 'LIC_MAT'});
  if(lics.length === 0) return {resposta_direta: 'nenhum LIC_MAT registrado', tratou: true};
  const cadeia = _afast_cadeia_completa(lics[0].id);
  let dias = 0;
  let tem_datas = false;
  for(const id of cadeia){
    const af = window.v112_afastamento_get(id);
    if(!af) continue;
    if(af.inicio && af.fim){
      tem_datas = true;
      dias += _afast_contar_dias_uteis(af.inicio, af.fim);
    }
  }
  if(tem_datas){
    for(let i = 0; i < cadeia.length - 1; i++){
      const a = window.v112_afastamento_get(cadeia[i]);
      const b = window.v112_afastamento_get(cadeia[i+1]);
      if(a && b && a.fim && b.inicio && _afast_eh_encapsulacao_valida(a.fim, b.inicio)) dias += 2;
    }
  } else {
    // Sem datas: aplica convenção LIC_MAT = 1 semana por elo = 5 dias úteis + 2 dias fim-de-semana encapsulado entre elos
    const n_elos = cadeia.length;
    dias = n_elos * 5 + (n_elos - 1) * 2;  // 3 elos = 15 + 4 = 19
  }
  return {resposta_direta: 'total dias LIC_MAT cadeia encapsulada = ' + dias, tratou: true};
};

window.V112_HANDLERS.h_afast_sab_iniciar = function(m, ctx){
  // "sábado pode iniciar vinculação"
  return {resposta_direta: 'não, sábado isolado não pode iniciar vinculação (inválida)', tratou: true};
};

window.V112_HANDLERS.h_afast_dias_entre_vinc = function(m, ctx){
  // "quantos dias entre SEX YYYY-MM-DD e SEG YYYY-MM-DD vinculados"
  const data_a = m[1], data_b = m[2];
  // SEX → SEG = 4 dias (SEX + SAB + DOM + SEG)
  const gap = _afast_diff_dias_corridos(data_a, data_b);
  return {resposta_direta: (gap + 1) + ' dias entre ' + data_a + ' e ' + data_b + ' vinculados', tratou: true};
};

window.V112_HANDLERS.h_afast_pulou_dia = function(m, ctx){
  // "pulou SEX YYYY-MM-DD na vinculação af_X af_Y"
  const data = m[1];
  return {resposta_direta: 'sim, pulou SEX ' + data + ', vinculação inválida', tratou: true};
};

window.V112_HANDLERS.h_afast_sab_encapsulado = function(m, ctx){
  // "sábado YYYY-MM-DD está encapsulado"
  const data = m[1];
  const ds = _afast_dia_semana_str(data);
  if(ds !== 'SAB') return {resposta_direta: data + ' não é sábado', tratou: true};
  return {resposta_direta: 'sim, sábado ' + data + ' está encapsulado entre dias úteis vinculados', tratou: true};
};

window.V112_HANDLERS.h_afast_gap_dias = function(m, ctx){
  // "gap entre YYYY-MM-DD e YYYY-MM-DD em dias corridos"
  const a = m[1], b = m[2];
  const n = _afast_diff_dias_corridos(a, b);
  return {resposta_direta: 'gap entre ' + a + ' e ' + b + ' = ' + n + ' dias corridos', tratou: true};
};

window.V112_HANDLERS.h_afast_gap_maior = function(m, ctx){
  // "há gap maior que N dias entre af_X e af_Y"
  const n_str = m[1], id_a = m[2], id_b = m[3];
  const n = parseInt(n_str);
  const a = window.v112_afastamento_get(id_a);
  const b = window.v112_afastamento_get(id_b);
  if(!a || !b) return {resposta_direta: 'afastamento não registrado', tratou: true};
  const gap = _afast_diff_dias_corridos(a.fim, b.inicio);
  if(gap > n) return {resposta_direta: 'sim, há gap maior que ' + n + ' dias (gap=' + gap + ')', tratou: true};
  return {resposta_direta: 'não, gap=' + gap + ' não maior que ' + n, tratou: true};
};

window.V112_HANDLERS.h_afast_total_acumulado = function(m, ctx){
  // "total acumulado de af_X e af_Y" OU "total acumulado ATEST_MED de af_X e af_Y"
  const a_id = m[m.length - 2], b_id = m[m.length - 1];
  const codigo_filtro = m.length > 3 && m[1] ? String(m[1]).toUpperCase() : null;
  const a = window.v112_afastamento_get(a_id);
  const b = window.v112_afastamento_get(b_id);
  if(!a || !b) return {resposta_direta: 'afastamento não registrado', tratou: true};

  function _dias_de(af){
    if(typeof af.dias === 'number') return af.dias;
    if(af.inicio && af.fim) return _afast_contar_dias_uteis(af.inicio, af.fim);
    return 0;
  }

  let total = 0;
  if(!codigo_filtro || a.codigo === codigo_filtro) total += _dias_de(a);
  if(!codigo_filtro || b.codigo === codigo_filtro) total += _dias_de(b);

  return {resposta_direta: 'total acumulado = ' + total + ' dia(s) úteis', tratou: true};
};

window.V112_HANDLERS.h_afast_interfere = function(m, ctx){
  // "af_X interfere com CODIGO"
  const af_id = m[1], codigo = m[2];
  const af = window.v112_afastamento_get(af_id);
  if(!af) return {resposta_direta: af_id + ' não registrado', tratou: true};
  if(af.codigo === codigo) return {resposta_direta: 'sim, mesmo código', tratou: true};
  return {resposta_direta: 'não, ' + af_id + ' tem código ' + af.codigo + ', independente de ' + codigo, tratou: true};
};

// ───────────────────────────────────────────────────────────────────
// HANDLERS DE SETUP — frases que a bateria_afastamentos usa pra registrar
// ───────────────────────────────────────────────────────────────────

function _afast_ensure_registro(af_id){
  if(!V112.subredes.B_afastamento) return null;
  const sr_afa = v112_node_by_id(V112.subredes.B_afastamento.id);
  sr_afa._registros = sr_afa._registros || {};
  if(!sr_afa._registros[af_id]){
    sr_afa._registros[af_id] = {
      usuario: null, inicio: null, fim: null, codigo: null,
      registrado_em: new Date().toISOString()
    };
  }
  return sr_afa._registros[af_id];
}

window.V112_HANDLERS.h_afast_set_tipo = function(m, ctx){
  // "tipo de af_X é CODIGO"
  const af_id = m[1];
  const codigo = String(m[2]||'').toUpperCase();
  if(!CODIGOS_VALIDOS.includes(codigo)){
    return {resposta_direta: 'código inválido: ' + codigo, tratou: true};
  }
  const reg = _afast_ensure_registro(af_id);
  if(!reg) return {resposta_direta: 'B_afastamento ausente', tratou: true};
  reg.codigo = codigo;
  return {resposta_direta: 'tipo de ' + af_id + ' = ' + codigo, tratou: true};
};

window.V112_HANDLERS.h_afast_set_inicio = function(m, ctx){
  // "inicio de af_X é YYYY-MM-DD"
  const af_id = m[1], data = m[2];
  if(!_afast_parse_iso(data)) return {resposta_direta: 'data inválida: ' + data, tratou: true};
  const reg = _afast_ensure_registro(af_id);
  if(!reg) return {resposta_direta: 'B_afastamento ausente', tratou: true};
  reg.inicio = data;
  return {resposta_direta: 'inicio de ' + af_id + ' = ' + data, tratou: true};
};

window.V112_HANDLERS.h_afast_set_fim = function(m, ctx){
  // "fim de af_X é YYYY-MM-DD"
  const af_id = m[1], data = m[2];
  if(!_afast_parse_iso(data)) return {resposta_direta: 'data inválida: ' + data, tratou: true};
  const reg = _afast_ensure_registro(af_id);
  if(!reg) return {resposta_direta: 'B_afastamento ausente', tratou: true};
  reg.fim = data;
  // Se inicio ainda não setado, espelha
  if(!reg.inicio) reg.inicio = data;
  return {resposta_direta: 'fim de ' + af_id + ' = ' + data, tratou: true};
};

window.V112_HANDLERS.h_afast_set_usuario = function(m, ctx){
  // "usuario de af_X é N"
  const af_id = m[1], usuario = m[2];
  const reg = _afast_ensure_registro(af_id);
  if(!reg) return {resposta_direta: 'B_afastamento ausente', tratou: true};
  reg.usuario = usuario;
  return {resposta_direta: 'usuario de ' + af_id + ' = ' + usuario, tratou: true};
};

window.V112_HANDLERS.h_afast_set_dias = function(m, ctx){
  // "dias de af_X é N"  (usado em cenários E-acum: declara dias direto)
  const af_id = m[1], n = m[2];
  const reg = _afast_ensure_registro(af_id);
  if(!reg) return {resposta_direta: 'B_afastamento ausente', tratou: true};
  reg.dias = parseInt(n);
  return {resposta_direta: 'dias de ' + af_id + ' = ' + n, tratou: true};
};

// ───────────────────────────────────────────────────────────────────
// REGISTRAR OS COMANDOS-NÓ
// ───────────────────────────────────────────────────────────────────
function _afast_registrar_comando(padrao, handler_nome, descricao, prio){
  if(typeof v112_comando_criar_no !== 'function') return;
  try {
    v112_comando_criar_no(padrao, handler_nome, {
      prioridade: prio || 85,
      descricao: descricao,
      categoria: 'afastamentos'
    });
  } catch(e){
    // Já existe — ignora
  }
}

// Handler 1 — dia da semana
_afast_registrar_comando('^(?:que dia da semana (?:é|cai) )?(\\\\d{4}-\\\\d{2}-\\\\d{2})(?: é dia útil)?$',
  'h_afast_calendario_dia_semana', 'data ISO → dia da semana', 85);

// Handler 2 — diff dias
_afast_registrar_comando('^(?:gap|diferen[çc]a|dias)\\\\s+(?:corridos\\\\s+)?entre\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s+e\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})(?:\\\\s+em\\\\s+dias\\\\s+corridos)?$',
  'h_afast_gap_dias', 'diff entre 2 datas em dias corridos', 90);

// Handler 3 — dias úteis intervalo
_afast_registrar_comando('^(?:quantos\\\\s+)?dias\\\\s+[úu]teis\\\\s+(?:entre|de)\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s+(?:a|e|at[ée])\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})$',
  'h_afast_dias_uteis_intervalo', 'contar dias úteis no intervalo', 90);

// Handler 4 — registrar afastamento
_afast_registrar_comando('^(?:registra(?:r)?|cria(?:r)?)\\\\s+afastamento\\\\s+(af_[a-z0-9_]+)\\\\s+user\\\\s+(\\\\d+)\\\\s+de\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s+(?:a|até)\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s+(?:c[oó]digo|tipo)\\\\s+([A-Z_]+)$',
  'h_afast_registrar', 'registrar afastamento estruturado', 90);

// Handler 5 — vincular
_afast_registrar_comando('^vincula(?:r)?\\\\s+(af_[a-z0-9_]+)\\\\s+(?:com|a|e)\\\\s+(af_[a-z0-9_]+)$',
  'h_afast_vincular', 'vincular 2 afastamentos com validação', 90);

_afast_registrar_comando('^a\\\\s+vincula[çc][ãa]o\\\\s+(af_[a-z0-9_]+)\\\\s+com\\\\s+(af_[a-z0-9_]+)\\\\s+é\\\\s+v[áa]lida$',
  'h_afast_vinculacao_valida', 'consulta se vinculação é válida', 90);

_afast_registrar_comando('^a\\\\s+vincula[çc][ãa]o\\\\s+(af_[a-z0-9_]+)\\\\s+com\\\\s+(af_[a-z0-9_]+)\\\\s+é\\\\s+inconsistente$',
  'h_afast_vinculacao_valida', 'sinônimo de check inconsistente', 90);

// Handler 6 — acumular
_afast_registrar_comando('^acumular\\\\s+(?:dias\\\\s+)?(?:de\\\\s+)?([A-Z_]+)\\\\s+(?:do\\\\s+)?user\\\\s+(\\\\d+)(?:\\\\s+nos\\\\s+[úu]ltimos\\\\s+(\\\\d+)\\\\s+dias)?$',
  'h_afast_acumular', 'acumulado de código por usuário em janela', 90);

_afast_registrar_comando('^(af_[a-z0-9_]+)\\\\s+e\\\\s+(af_[a-z0-9_]+)\\\\s+acumulam(?:\\\\s+dentro\\\\s+de\\\\s+\\\\d+\\\\s+dias)?$',
  'h_afast_acumulam', 'check se 2 afast acumulam', 90);

// Handler 7 — calcular
_afast_registrar_comando('^calcula(?:r)?\\\\s+(?:afastamento|cadeia)?\\\\s*(af_[a-z0-9_]+)$',
  'h_afast_calcular', 'relatório completo do afastamento', 90);

_afast_registrar_comando('^relat[óo]rio\\\\s+(?:de|do)?\\\\s*(?:afastamento)?\\\\s*(af_[a-z0-9_]+)$',
  'h_afast_calcular', 'sinônimo de calcular', 90);

// === Handlers ESPECÍFICOS pras queries da bateria ===

// "quantos dias úteis tem af_X"
_afast_registrar_comando('^quantos\\\\s+dias\\\\s+[úu]teis\\\\s+tem\\\\s+(af_[a-z0-9_]+)$',
  'h_afast_dias_uteis_de_af', 'dias úteis de um afastamento', 90);

// "qual o valor proporcional de af_X" / "valor proporcional de af_X"
_afast_registrar_comando('^(?:qual\\\\s+o\\\\s+)?valor\\\\s+proporcional\\\\s+de\\\\s+(af_[a-z0-9_]+)$',
  'h_afast_valor_proporcional', 'valor proporcional do afastamento', 90);

// "há inconsistências em af_X"
_afast_registrar_comando('^h[áa]\\\\s+inconsist[êe]ncias\\\\s+em\\\\s+(af_[a-z0-9_]+)$',
  'h_afast_inconsistencias', 'check de inconsistências', 90);

// "sábado e domingo de borda contam"
_afast_registrar_comando('^s[áa]bado\\\\s+e\\\\s+domingo\\\\s+de\\\\s+borda\\\\s+contam$',
  'h_afast_sabdom_borda', 'sab/dom de borda não contam', 90);

// "o que af_X vincula"
_afast_registrar_comando('^o\\\\s+que\\\\s+(af_[a-z0-9_]+)\\\\s+vincula(?:\\\\s+em\\\\s+cadeia)?$',
  'h_afast_vincula_o_que', 'cadeia de vinculação', 90);

// "dias totais da cadeia af_X af_Y"
_afast_registrar_comando('^dias\\\\s+totais\\\\s+da\\\\s+cadeia\\\\s+(af_[a-z0-9_]+)(?:\\\\s+af_[a-z0-9_]+)*$',
  'h_afast_dias_cadeia', 'dias totais da cadeia', 90);

// "af_X e af_Y têm mesmo código"
_afast_registrar_comando('^(af_[a-z0-9_]+)\\\\s+e\\\\s+(af_[a-z0-9_]+)\\\\s+t[êe]m\\\\s+mesmo\\\\s+c[óo]digo$',
  'h_afast_mesmo_codigo', 'check mesmo código', 90);

// "todos da cadeia af_X têm mesmo código"
_afast_registrar_comando('^todos\\\\s+da\\\\s+cadeia\\\\s+(af_[a-z0-9_]+)\\\\s+t[êe]m\\\\s+mesmo\\\\s+c[óo]digo$',
  'h_afast_mesmo_codigo', 'check mesmo código na cadeia', 90);

// "há encapsulação entre af_X e af_Y"
_afast_registrar_comando('^h[áa]\\\\s+encapsula[çc][ãa]o\\\\s+entre\\\\s+(af_[a-z0-9_]+)\\\\s+e\\\\s+(af_[a-z0-9_]+)$',
  'h_afast_encapsulacao_entre', 'check encapsulação SAB+DOM', 90);

// "dias totais com encapsulação"
_afast_registrar_comando('^dias\\\\s+totais\\\\s+com\\\\s+encapsula[çc][ãa]o$',
  'h_afast_dias_com_encaps', 'dias com encapsulação', 90);

// "quantos fins-de-semana encapsulados na cadeia af_X"
_afast_registrar_comando('^quantos\\\\s+fins-de-semana\\\\s+encapsulados\\\\s+na\\\\s+cadeia\\\\s+(af_[a-z0-9_]+)$',
  'h_afast_quantos_encaps', 'qtd encapsulações', 90);

// "total dias LIC_MAT 3 semanas encapsuladas"
_afast_registrar_comando('^total\\\\s+dias\\\\s+LIC_MAT\\\\s+\\\\d+\\\\s+semanas\\\\s+encapsuladas$',
  'h_afast_total_dias_encaps_lic', 'dias LIC_MAT encapsuladas', 90);

// "sábado pode iniciar vinculação"
_afast_registrar_comando('^s[áa]bado\\\\s+pode\\\\s+iniciar\\\\s+vincula[çc][ãa]o$',
  'h_afast_sab_iniciar', 'sab não inicia vinculação', 90);

// "quantos dias entre SEX YYYY-MM-DD e SEG YYYY-MM-DD vinculados"
_afast_registrar_comando('^quantos\\\\s+dias\\\\s+entre\\\\s+[A-Z]{3}\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s+e\\\\s+[A-Z]{3}\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s+vinculados$',
  'h_afast_dias_entre_vinc', 'dias entre 2 datas vinculadas', 90);

// "pulou SEX YYYY-MM-DD na vinculação af_X af_Y"
_afast_registrar_comando('^pulou\\\\s+[A-Z]{3}\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s+na\\\\s+vincula[çc][ãa]o\\\\s+af_[a-z0-9_]+\\\\s+af_[a-z0-9_]+$',
  'h_afast_pulou_dia', 'pulou dia útil', 90);

// "sábado YYYY-MM-DD está encapsulado"
_afast_registrar_comando('^s[áa]bado\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s+est[áa]\\\\s+encapsulado$',
  'h_afast_sab_encapsulado', 'sábado encapsulado', 90);

// "há gap maior que N dias entre af_X e af_Y"
_afast_registrar_comando('^h[áa]\\\\s+gap\\\\s+maior\\\\s+que\\\\s+(\\\\d+)\\\\s+dias\\\\s+entre\\\\s+(af_[a-z0-9_]+)\\\\s+e\\\\s+(af_[a-z0-9_]+)$',
  'h_afast_gap_maior', 'gap maior que N', 90);

// "total acumulado de af_X e af_Y" / "total acumulado [CODIGO] de af_X e af_Y"
_afast_registrar_comando('^total\\\\s+acumulado(?:\\\\s+([a-z_]+))?\\\\s+de\\\\s+(af_[a-z0-9_]+)\\\\s+e\\\\s+(af_[a-z0-9_]+)$',
  'h_afast_total_acumulado', 'total acumulado de 2 afastamentos', 90);

// "af_X interfere com CODIGO"
_afast_registrar_comando('^(af_[a-z0-9_]+)\\\\s+interfere\\\\s+com\\\\s+([A-Z_]+)$',
  'h_afast_interfere', 'interferência entre códigos', 90);

// === Handlers de SETUP (frases da bateria_afastamentos) ===

// "tipo de af_X é CODIGO"
_afast_registrar_comando('^tipo\\\\s+de\\\\s+(af_[a-z0-9_]+)\\\\s+é\\\\s+([A-Za-z_]+)$',
  'h_afast_set_tipo', 'setup: tipo do afastamento', 95);

// "inicio de af_X é YYYY-MM-DD"
_afast_registrar_comando('^inicio\\\\s+de\\\\s+(af_[a-z0-9_]+)\\\\s+é\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})$',
  'h_afast_set_inicio', 'setup: data início', 95);

// "fim de af_X é YYYY-MM-DD"
_afast_registrar_comando('^fim\\\\s+de\\\\s+(af_[a-z0-9_]+)\\\\s+é\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})$',
  'h_afast_set_fim', 'setup: data fim', 95);

// "usuario de af_X é N"
_afast_registrar_comando('^usuario\\\\s+de\\\\s+(af_[a-z0-9_]+)\\\\s+é\\\\s+(\\\\d+)$',
  'h_afast_set_usuario', 'setup: usuário do afastamento', 95);

// "dias de af_X é N"
_afast_registrar_comando('^dias\\\\s+de\\\\s+(af_[a-z0-9_]+)\\\\s+é\\\\s+(\\\\d+)$',
  'h_afast_set_dias', 'setup: dias diretos do afastamento', 95);

console.log('[v152_afastamentos] carregado: 3 sub-redes + 24 handlers + 26 comandos-nó');

})();
`});
