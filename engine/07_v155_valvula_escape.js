// ─── REGIÃO 07/14 — v155_valvula_escape.js ───
window._ARCH_MODULOS.push({nome:"v155_valvula_escape.js", src: `
// ═══════════════════════════════════════════════════════════════════
// v155_valvula_escape.js — Auto-mod TIPO 3
//
// METÁFORA:
//   Cérebro acumula stress quando energia entra e não sai:
//   - Sub-rede ativa mas não resolve (energia represada)
//   - 2 sub-redes contraditórias no mesmo turno
//   - Sobrecarga (sub-rede ativada N vezes em poucos turnos)
//   - Loop sem resolução (mesma query, mesma resposta ruim)
//
//   Quando stress global passa do limiar de pânico, B_valvula_escape
//   ACORDA em modo desespero e cria B_valvula_NNN — sub-rede de escape
//   que combina:
//     A) 5 estratégias do v154 pra capturar padrão imediato
//     B) Crescimento orgânico — aprende NOVAS regras a cada query que cai nela
//
//   Sucesso = stress baixa. Falha = válvula descartada, tenta outra.
//
// NÃO modifica v112_core/v112_brain. Append-only.
// ═══════════════════════════════════════════════════════════════════

(function(){

if(typeof V112 === 'undefined') return;
if(typeof window === 'undefined') var window = global;

// ───────────────────────────────────────────────────────────────────
// SUB-REDES "ESTRUTURAIS" — não contam pra stress (processamento interno)
// Elas ativam sempre mas não somam sucesso (não são pra resolver queries)
// ───────────────────────────────────────────────────────────────────
const SUBREDES_ESTRUTURAIS = new Set([
  'B_prioridade', 'B_atencao', 'B_iterador', 'B_propagacao',
  'B_compositor', 'B_introspector', 'B_estado', 'B_mundo',
  'B_planejamento', 'B_objetivo', 'B_curiosidade',
  'B_metacontexto', 'B_contexto', 'B_amigdala', 'B_hipocampo',
  'B_dopamina', 'B_serotonina', 'B_gaba',
  'B_aprendiz_emergencial', 'B_aprendiz_meta', 'B_valvula_escape',
  'B_gerador_comandos'
]);

function _eh_estrutural(nome){
  if(SUBREDES_ESTRUTURAIS.has(nome)) return true;
  // Válvulas próprias não contam pra stress
  if(nome.startsWith('B_valvula_')) return true;
  if(nome.startsWith('B_emerge_')) return true;
  if(nome.startsWith('B_aux_')) return true;
  return false;
}
const STRESS = {
  // Pesos pra cada fonte de stress
  PESO_ATIVOU_SEM_RESOLVER: 1.5,
  PESO_CONTRADICAO: 3.0,
  PESO_SOBRECARGA: 1.0,
  PESO_LOOP_SEM_RESOLUCAO: 2.5,

  // Drenagem natural
  DECAY_POR_SUCESSO: 0.7,   // multiplica stress por 0.7 quando há sucesso
  DECAY_POR_TURNO: 0.97,    // decai 3% por turno sem ativação

  // Limiares
  LIMIAR_PANICO: 50,        // stress global pra ativar válvula
  LIMIAR_SUB_SATURADA: 20,  // stress individual pra considerar saturada
  LIMIAR_ATIVACOES_RAPIDAS: 5,  // ativações em últimos 10 turnos = sobrecarga

  // Janela
  JANELA_TURNOS: 10,

  // Válvulas
  MAX_VALVULAS_ATIVAS: 3,
  VALVULA_PROVA_SUCESSOS: 3,    // sucessos pra promover
  VALVULA_PROVA_FALHAS: 5       // falhas pra descartar
};

// ───────────────────────────────────────────────────────────────────
// STOPWORDS (reuso do v154)
// ───────────────────────────────────────────────────────────────────
const STOPWORDS_PT = new Set([
  'o','a','os','as','um','uma','de','do','da','dos','das',
  'em','no','na','para','com','sem','por','sobre',
  'que','é','são','foi','tem','e','ou','mas','não','sim',
  'meu','sua','eu','ele','ela','se','muito'
]);

// ───────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────
function _safe_str(s){
  return (s === null || s === undefined) ? '' : String(s).trim();
}

function _tokenizar(s){
  return _safe_str(s).toLowerCase()
    .replace(/[?!.,;:()\\[\\]{}'"]/g, ' ')
    .split(/\\s+/)
    .filter(t => t.length > 0);
}

function _tokens_conteudo(s){
  return _tokenizar(s).filter(t => !STOPWORDS_PT.has(t));
}

function _jaccard(a, b){
  const sa = new Set(a), sb = new Set(b);
  if(sa.size === 0 && sb.size === 0) return 1;
  let i = 0;
  for(const x of sa) if(sb.has(x)) i++;
  return i / (sa.size + sb.size - i);
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
// ESTADO INTERNO
// ───────────────────────────────────────────────────────────────────
const ESCAPE = {
  // Histórico de queries pra detectar loops
  hist_queries: [],
  HIST_MAX: 20,

  // Ativações por sub-rede no último período (pra detectar sobrecarga)
  // {nome_sr: [turnos_ativacoes]}
  ativacoes_janela: {},

  // Turno atual
  turno: 0,

  // Válvulas em prova
  valvulas_prova: {},  // {nome: {regex, sucessos, falhas, criada_em}}

  // Estatísticas globais
  total_valvulas_criadas: 0,
  total_valvulas_promovidas: 0,
  total_valvulas_descartadas: 0,
  total_panicos: 0,

  // Estado da válvula principal
  acordada: false,
  ultimo_panico: null
};

// ───────────────────────────────────────────────────────────────────
// SUB-REDE B_valvula_escape (a central)
// ───────────────────────────────────────────────────────────────────
function v155_init(){
  let central;
  if(V112.subredes.B_valvula_escape){
    central = v112_node_by_id(V112.subredes.B_valvula_escape.id);
  } else {
    const id = _getNextId();
    central = {
      id, text: '[B_valvula_escape]',
      tipo: null, camada: 'subrede',
      pos: [280, -20, 95],
      cor: 'vermelho_quente',
      acumulador: 0, limiar: 50, estado: 'dormindo',
      ativacoes: 0, sucessos: 0,
      _subrede: true,
      _proposito: 'Auto-mod tipo 3: sistema de escape pra stress acumulado do cérebro'
    };
    V112.nodes.push(central);
    V112.subredes.B_valvula_escape = {id, satelites:[], pos: central.pos};
  }

  // Defensiva
  if(central._stress_global === undefined) central._stress_global = 0;
  if(central._panicos_total === undefined) central._panicos_total = 0;
  if(central._valvulas_criadas === undefined) central._valvulas_criadas = 0;
  if(central._valvulas_promovidas === undefined) central._valvulas_promovidas = 0;
  if(central._valvulas_descartadas === undefined) central._valvulas_descartadas = 0;
  if(central._acordada === undefined) central._acordada = false;
  if(central._hist === undefined) central._hist = [];

  return central;
}

function _no_central(){
  if(!V112.subredes.B_valvula_escape) return null;
  return v112_node_by_id(V112.subredes.B_valvula_escape.id);
}

v155_init();

// ───────────────────────────────────────────────────────────────────
// MEDIDA DE STRESS POR SUB-REDE
// ───────────────────────────────────────────────────────────────────
function _adicionar_stress(nome_sr, quantidade, motivo){
  if(!V112.subredes[nome_sr]) return;
  const no = v112_node_by_id(V112.subredes[nome_sr].id);
  if(!no) return;

  no._stress = (no._stress || 0) + quantidade;
  no._stress_ultimo_motivo = motivo;
  no._stress_ultimo_turno = ESCAPE.turno;
}

function _drenar_stress(nome_sr, fator){
  if(!V112.subredes[nome_sr]) return;
  const no = v112_node_by_id(V112.subredes[nome_sr].id);
  if(!no) return;
  no._stress = (no._stress || 0) * fator;
  if(no._stress < 0.1) no._stress = 0;
}

function _stress_global(){
  let total = 0;
  for(const nome of Object.keys(V112.subredes)){
    if(_eh_estrutural(nome)) continue;
    const no = v112_node_by_id(V112.subredes[nome].id);
    if(no && typeof no._stress === 'number'){
      total += no._stress;
    }
  }
  // Também o stress do próprio nó central da válvula (loops sem dono)
  const cen = _no_central();
  if(cen && typeof cen._stress === 'number') total += cen._stress;
  return total;
}

function _sub_mais_stressada(){
  let max_stress = 0;
  let nome_max = null;
  for(const nome of Object.keys(V112.subredes)){
    if(_eh_estrutural(nome)) continue;
    const no = v112_node_by_id(V112.subredes[nome].id);
    if(no && typeof no._stress === 'number' && no._stress > max_stress){
      max_stress = no._stress;
      nome_max = nome;
    }
  }
  return {nome: nome_max, stress: max_stress};
}

// ───────────────────────────────────────────────────────────────────
// DETECÇÃO DE FONTES DE STRESS
// ───────────────────────────────────────────────────────────────────
function _detectar_e_aplicar_stress(input, resultado){
  ESCAPE.turno++;
  const resp = _safe_str(resultado && resultado.resposta).toLowerCase();
  const eh_fallback = !resp || resp === 'hm.' || resp === '...' ||
                      resp.length <= 2 || resp.includes('não entendi');

  // 1. ATIVOU SEM RESOLVER — só pra sub-redes NÃO-estruturais
  for(const nome of Object.keys(V112.subredes)){
    if(_eh_estrutural(nome)) continue;  // skip estruturais
    const no = v112_node_by_id(V112.subredes[nome].id);
    if(!no) continue;
    const atv = no._ativacoes || 0;
    const suc = no._sucessos || 0;
    const atv_ant = no._ativacoes_anterior || 0;
    const suc_ant = no._sucessos_anterior || 0;

    if(atv > atv_ant){
      if(suc === suc_ant){
        _adicionar_stress(nome, STRESS.PESO_ATIVOU_SEM_RESOLVER, 'ativou sem resolver');
      } else {
        _drenar_stress(nome, STRESS.DECAY_POR_SUCESSO);
      }

      ESCAPE.ativacoes_janela[nome] = ESCAPE.ativacoes_janela[nome] || [];
      ESCAPE.ativacoes_janela[nome].push(ESCAPE.turno);
      ESCAPE.ativacoes_janela[nome] = ESCAPE.ativacoes_janela[nome]
        .filter(t => t > ESCAPE.turno - STRESS.JANELA_TURNOS);

      if(ESCAPE.ativacoes_janela[nome].length >= STRESS.LIMIAR_ATIVACOES_RAPIDAS){
        _adicionar_stress(nome, STRESS.PESO_SOBRECARGA, 'sobrecarga');
      }
    }

    no._ativacoes_anterior = atv;
    no._sucessos_anterior = suc;
  }

  // 2. CONTRADIÇÃO — pula estruturais
  const ativas_neste_turno = [];
  for(const nome of Object.keys(V112.subredes)){
    if(_eh_estrutural(nome)) continue;
    const no = v112_node_by_id(V112.subredes[nome].id);
    if(no && no._ativacoes_anterior !== undefined &&
       (no._ativacoes||0) > (no._ativacoes_anterior - 1 || 0)){
      ativas_neste_turno.push(nome);
    }
  }
  if(ativas_neste_turno.length >= 3 && (resp.includes(' ou ') || resp.includes('mas '))){
    for(const nome of ativas_neste_turno.slice(0, 2)){
      _adicionar_stress(nome, STRESS.PESO_CONTRADICAO, 'contradição');
    }
  }

  // 3. LOOP
  ESCAPE.hist_queries.push({query: input, resp, fallback: eh_fallback, turno: ESCAPE.turno});
  if(ESCAPE.hist_queries.length > ESCAPE.HIST_MAX){
    ESCAPE.hist_queries.shift();
  }
  if(eh_fallback){
    const tok_atual = _tokenizar(input);
    const similares = ESCAPE.hist_queries.slice(-6, -1).filter(h => {
      return h.fallback && _jaccard(_tokenizar(h.query), tok_atual) >= 0.7;
    });
    if(similares.length >= 2){
      for(const nome of ativas_neste_turno){
        _adicionar_stress(nome, STRESS.PESO_LOOP_SEM_RESOLUCAO, 'loop sem resolução');
      }
      if(ativas_neste_turno.length === 0){
        const cen = _no_central();
        if(cen) cen._stress = (cen._stress||0) + STRESS.PESO_LOOP_SEM_RESOLUCAO;
      }
    }
  }

  // 4. DECAY NATURAL POR TURNO — só pra não-estruturais
  if(ESCAPE.turno % 5 === 0){
    for(const nome of Object.keys(V112.subredes)){
      if(_eh_estrutural(nome)) continue;
      _drenar_stress(nome, STRESS.DECAY_POR_TURNO);
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// 5 ESTRATÉGIAS DE EXTRAÇÃO (versão simplificada do v154)
// ───────────────────────────────────────────────────────────────────
function _estrat_posicional(queries){
  try {
    const toks = queries.map(_tokenizar);
    const lmin = Math.min(...toks.map(t => t.length));
    const lmax = Math.max(...toks.map(t => t.length));
    if(lmax - lmin > 2 || lmin === 0) return null;
    const tpl = [];
    let vars = 0;
    for(let i = 0; i < lmin; i++){
      const col = toks.map(t => t[i]);
      if(col.every(x => x === col[0])) tpl.push(col[0]);
      else { tpl.push('(\\\\S+)'); vars++; }
    }
    if(vars === 0 || vars === tpl.length) return null;
    return {regex_str: '^' + tpl.join('\\\\s+') + '\\\\s*[?!.]*$', estrategia: 'posicional', template: tpl.join(' ')};
  } catch(e){ return null; }
}

function _estrat_ancora_prefixo(queries){
  try {
    const toks = queries.map(_tokenizar);
    if(toks.some(t => t.length === 0)) return null;
    const pref = [];
    const lmin = Math.min(...toks.map(t => t.length));
    for(let i = 0; i < lmin; i++){
      const col = toks.map(t => t[i]);
      if(col.every(x => x === col[0])) pref.push(col[0]);
      else break;
    }
    if(pref.length < 1) return null;
    return {regex_str: '^' + pref.join('\\\\s+') + '\\\\s+(.+?)\\\\s*[?!.]*$', estrategia: 'ancora_prefixo', template: pref.join(' ') + ' (.+)'};
  } catch(e){ return null; }
}

function _estrat_ancora_sufixo(queries){
  try {
    const toks = queries.map(_tokenizar);
    if(toks.some(t => t.length === 0)) return null;
    const suf_inv = [];
    const lmin = Math.min(...toks.map(t => t.length));
    for(let i = 0; i < lmin; i++){
      const col = toks.map(t => t[t.length-1-i]);
      if(col.every(x => x === col[0])) suf_inv.push(col[0]);
      else break;
    }
    if(suf_inv.length < 1) return null;
    const suf = suf_inv.reverse();
    return {regex_str: '^(.+?)\\\\s+' + suf.join('\\\\s+') + '\\\\s*[?!.]*$', estrategia: 'ancora_sufixo', template: '(.+) ' + suf.join(' ')};
  } catch(e){ return null; }
}

function _estrat_bag_of_words(queries){
  try {
    const bags = queries.map(_tokens_conteudo);
    if(bags.some(b => b.length === 0)) return null;
    let comuns = new Set(bags[0]);
    for(let i = 1; i < bags.length; i++){
      const s = new Set(bags[i]);
      comuns = new Set([...comuns].filter(x => s.has(x)));
    }
    if(comuns.size === 0) return null;
    const ancs = [...comuns];
    const la = ancs.map(a => '(?=.*\\\\b' + a.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + '\\\\b)').join('');
    return {regex_str: '^' + la + '.*$', estrategia: 'bag_of_words', template: '[bag]: ' + ancs.join('&')};
  } catch(e){ return null; }
}

function _estrat_palavra_unica_chave(queries){
  // Estratégia simples: pega a palavra de conteúdo mais frequente
  try {
    const tokens_all = queries.flatMap(_tokens_conteudo);
    const freq = {};
    for(const t of tokens_all){ freq[t] = (freq[t]||0) + 1; }
    const palavra_top = Object.entries(freq).sort((a,b) => b[1] - a[1])[0];
    if(!palavra_top || palavra_top[1] < queries.length) return null;
    const p = palavra_top[0].replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
    return {regex_str: '^.*\\\\b' + p + '\\\\b.*$', estrategia: 'palavra_chave', template: '*' + palavra_top[0] + '*'};
  } catch(e){ return null; }
}

const ESTRATEGIAS = [
  _estrat_posicional,
  _estrat_ancora_prefixo,
  _estrat_ancora_sufixo,
  _estrat_bag_of_words,
  _estrat_palavra_unica_chave
];

// ───────────────────────────────────────────────────────────────────
// CRIAR VÁLVULA DE ESCAPE
// ───────────────────────────────────────────────────────────────────
function _criar_valvula(stress_origem){
  // Limite de válvulas simultaneas
  const ativas = Object.keys(ESCAPE.valvulas_prova).length;
  if(ativas >= STRESS.MAX_VALVULAS_ATIVAS) return null;

  ESCAPE.total_valvulas_criadas++;
  const numero = ESCAPE.total_valvulas_criadas;
  const nome = 'B_valvula_' + String(numero).padStart(3, '0');

  // Pegar últimas queries que foram fallback ou stress-geradoras
  const queries_stress = ESCAPE.hist_queries.slice(-5).map(h => h.query);

  // Tentar 5 estratégias pra criar regex
  let template_winner = null;
  if(queries_stress.length >= 3){
    for(const estrat of ESTRATEGIAS){
      try {
        const r = estrat(queries_stress.slice(-3));
        if(r){
          // Validar
          const re = new RegExp(r.regex_str, 'i');
          if(queries_stress.slice(-3).every(q => re.test(q))){
            template_winner = r;
            break;
          }
        }
      } catch(e){}
    }
  }

  // Se nenhuma estratégia funcionou → modo B (orgânico): cria vazia
  const eh_organica = !template_winner;

  const id = _getNextId();
  const central = {
    id, text: '[' + nome + ']',
    tipo: null, camada: 'subrede',
    pos: [300 + (numero*7)%50, (numero*11)%40, 100],
    cor: 'laranja_brilhante',
    acumulador: 0, limiar: 50,
    estado: eh_organica ? 'organica_vazia' : 'experimental_escape',
    ativacoes: 0, sucessos: 0,
    _subrede: true,
    _proposito: 'VÁLVULA DE ESCAPE: criada por B_valvula_escape pra drenar stress',
    _criada_em: new Date().toISOString(),
    _criador: 'B_valvula_escape',
    _stress_origem: stress_origem,
    _ativacoes: 0, _sucessos: 0,
    _regras_aprendidas: [],  // pra crescimento orgânico
    _organica: eh_organica
  };

  if(template_winner){
    central._regex_str = template_winner.regex_str;
    central._estrategia = template_winner.estrategia;
    central._template = template_winner.template;
    central._queries_origem = queries_stress.slice(-3);
  }

  V112.nodes.push(central);
  V112.subredes[nome] = {id, satelites:[], pos: central.pos};

  // Registrar handler
  const handler_nome = 'h_valvula_' + numero;
  window.V112_HANDLERS = window.V112_HANDLERS || {};
  window.V112_HANDLERS[handler_nome] = function(m, ctx){
    // [NEREAL_VALVULA_NAO_ENGOLE_IDENTIDADE_V1] a valvula de escape NUNCA intercepta
    // pergunta de identidade/self-core (nome/genero/sexo/criador/quem-e-voce) — mesmo
    // sob repeticao/stress, a identidade tem que responder de verdade. Self-Core domina.
    var _txt = String(ctx || '').toLowerCase();
    if(/\b(g[eê]nero|sexo|nome|criador)\b/.test(_txt)
       || /\bquem\s+(é|eh|sou)\b/.test(_txt)
       || /\bo\s+que\s+(você|voce|eu|tu)\s+(é|eh|sou)\b/.test(_txt)){
      return null;
    }
    const no_v = v112_node_by_id(id);
    if(no_v){
      no_v._ativacoes = (no_v._ativacoes||0) + 1;
      no_v._sucessos = (no_v._sucessos||0) + 1;
    }
    // Drenar stress da sub-rede origem
    if(stress_origem && stress_origem.nome){
      _drenar_stress(stress_origem.nome, 0.5);
    }
    return {
      resposta_direta: '[válvula ' + nome + ' drenou stress] padrão capturado: ' +
                       (template_winner ? template_winner.template : 'orgânico (aprendendo)'),
      tratou: true,
      _valvula: nome
    };
  };

  // Se tem regex, registra comando-nó
  if(template_winner && typeof v112_comando_criar_no === 'function'){
    try {
      v112_comando_criar_no(template_winner.regex_str, handler_nome, {
        prioridade: 65,  // baixa pra não atrapalhar
        descricao: 'válvula de escape #' + numero + ' (' + template_winner.estrategia + ')',
        categoria: 'valvula'
      });
    } catch(e){}
  }

  // Registrar em prova
  ESCAPE.valvulas_prova[nome] = {
    nome,
    id_central: id,
    regex_str: template_winner ? template_winner.regex_str : null,
    organica: eh_organica,
    sucessos: 0,
    falhas: 0,
    criada_em_turno: ESCAPE.turno,
    stress_origem
  };

  // Atualizar nó central da válvula-escape
  const cen = _no_central();
  if(cen){
    cen._valvulas_criadas = (cen._valvulas_criadas||0) + 1;
    cen._ativacoes = (cen._ativacoes||0) + 1;
  }

  return central;
}

// ───────────────────────────────────────────────────────────────────
// CRESCIMENTO ORGÂNICO — válvula aprende regra nova de cada query
// ───────────────────────────────────────────────────────────────────
function _valvula_aprender_organica(nome_valvula, query, resposta_anterior_ruim){
  const id = V112.subredes[nome_valvula] && V112.subredes[nome_valvula].id;
  if(!id) return;
  const no = v112_node_by_id(id);
  if(!no || !no._organica) return;

  // Adiciona a query como nova "regra" — futuras queries similares ficam cobertas
  no._regras_aprendidas = no._regras_aprendidas || [];
  no._regras_aprendidas.push({
    query, resposta_ruim: resposta_anterior_ruim, turno: ESCAPE.turno
  });

  // Quando acumular 3 regras similares, vira regex
  if(no._regras_aprendidas.length >= 3){
    const queries_3 = no._regras_aprendidas.slice(-3).map(r => r.query);
    for(const estrat of ESTRATEGIAS){
      try {
        const r = estrat(queries_3);
        if(r){
          const re = new RegExp(r.regex_str, 'i');
          if(queries_3.every(q => re.test(q))){
            // PROMOVEU de orgânica pra estruturada
            no._regex_str = r.regex_str;
            no._estrategia = r.estrategia;
            no._template = r.template;
            no._organica = false;
            no.estado = 'estruturada';

            // Registrar comando-nó
            const num = parseInt(nome_valvula.replace(/\\D/g, ''));
            const handler_nome = 'h_valvula_' + num;
            if(typeof v112_comando_criar_no === 'function'){
              try {
                v112_comando_criar_no(r.regex_str, handler_nome, {
                  prioridade: 65,
                  descricao: 'válvula orgânica → estruturada #' + num,
                  categoria: 'valvula'
                });
              } catch(e){}
            }
            return;
          }
        }
      } catch(e){}
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// AVALIAR VÁLVULAS EM PROVA
// ───────────────────────────────────────────────────────────────────
function _avaliar_valvulas(){
  for(const [nome, v] of Object.entries(ESCAPE.valvulas_prova)){
    const no = v112_node_by_id(v.id_central);
    if(!no) continue;

    v.sucessos = no._sucessos || 0;
    const turnos_vida = ESCAPE.turno - v.criada_em_turno;
    v.falhas = turnos_vida - v.sucessos;

    // Promover se sucessos consecutivos
    if(v.sucessos >= STRESS.VALVULA_PROVA_SUCESSOS){
      no.estado = 'promovida';
      no._promovida_em = new Date().toISOString();
      ESCAPE.total_valvulas_promovidas++;
      const cen = _no_central();
      if(cen) cen._valvulas_promovidas = (cen._valvulas_promovidas||0) + 1;
      delete ESCAPE.valvulas_prova[nome];
    }
    // Descartar se muita falha
    else if(v.falhas >= STRESS.VALVULA_PROVA_FALHAS && turnos_vida > 10){
      // NÃO DELETA: marca como descartada (preserva integridade do hipocampo/edges)
      no.estado = 'descartada';
      no._descartada_em = new Date().toISOString();
      // Remove da lista ativa de sub-redes mas mantém o nó
      delete V112.subredes[nome];
      // Desativa handler
      const num = parseInt(nome.replace(/\\D/g, ''));
      if(window.V112_HANDLERS && window.V112_HANDLERS['h_valvula_' + num]){
        // Substitui por um stub que não tenta nada (libera memória do regex)
        window.V112_HANDLERS['h_valvula_' + num] = function(){
          return {resposta_direta: '', tratou: false};
        };
      }
      ESCAPE.total_valvulas_descartadas++;
      const cen = _no_central();
      if(cen) cen._valvulas_descartadas = (cen._valvulas_descartadas||0) + 1;
      delete ESCAPE.valvulas_prova[nome];
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// HOOK NO PROCESSAR
// ───────────────────────────────────────────────────────────────────
const _orig_processar = window.v112_processar;
if(typeof _orig_processar === 'function' && !window._v155_hooked){
  window.v112_processar = function(input, ...args){
    const resultado = _orig_processar.apply(this, [input, ...args]);

    try {
      // Atualizar stress
      _detectar_e_aplicar_stress(input, resultado);

      // Calcular stress global
      const sg = _stress_global();
      const cen = _no_central();
      if(cen){
        cen._stress_global = sg;
        cen._hist = cen._hist || [];
        cen._hist.push({turno: ESCAPE.turno, stress: sg, query: String(input).substring(0,60)});
        if(cen._hist.length > 30) cen._hist.shift();
      }

      // Pânico?
      if(sg >= STRESS.LIMIAR_PANICO){
        if(!ESCAPE.acordada){
          ESCAPE.acordada = true;
          if(cen){
            cen._acordada = true;
            cen.estado = 'acordada_panico';
            cen._acordou_em = new Date().toISOString();
          }
          ESCAPE.total_panicos++;
          ESCAPE.ultimo_panico = ESCAPE.turno;
        }

        // Identifica onde concentra
        const origem = _sub_mais_stressada();
        if(origem.stress >= STRESS.LIMIAR_SUB_SATURADA){
          // Cria válvula nova pra drenar
          _criar_valvula(origem);
        }
      } else {
        // Stress baixou — sub-rede pode voltar a dormir
        if(ESCAPE.acordada && sg < STRESS.LIMIAR_PANICO * 0.5){
          ESCAPE.acordada = false;
          if(cen){
            cen._acordada = false;
            cen.estado = 'dormindo';
          }
        }
      }

      // Avaliar válvulas em prova
      if(ESCAPE.turno % 5 === 0){
        _avaliar_valvulas();
      }
    } catch(e){}

    return resultado;
  };
  window._v155_hooked = true;
}

// ───────────────────────────────────────────────────────────────────
// HANDLERS NL
// ───────────────────────────────────────────────────────────────────
window.V112_HANDLERS = window.V112_HANDLERS || {};

window.V112_HANDLERS.h_escape_status = function(m, ctx){
  const cen = _no_central();
  if(!cen) return {resposta_direta:'B_valvula_escape ausente', tratou:true};
  const sg = _stress_global();
  const origem = _sub_mais_stressada();
  const linhas = [
    'B_valvula_escape (sistema de escape):',
    '  estado:               ' + (cen._acordada ? 'ACORDADA (pânico)' : 'dormindo'),
    '  stress global:        ' + sg.toFixed(1) + ' / limiar=' + STRESS.LIMIAR_PANICO,
    '  pânicos totais:       ' + (ESCAPE.total_panicos),
    '  válvulas criadas:     ' + (cen._valvulas_criadas||0),
    '  válvulas promovidas:  ' + (cen._valvulas_promovidas||0),
    '  válvulas descartadas: ' + (cen._valvulas_descartadas||0),
    '  válvulas em prova:    ' + Object.keys(ESCAPE.valvulas_prova).length,
    '  sub mais stressada:   ' + (origem.nome ? origem.nome + ' (stress=' + origem.stress.toFixed(1) + ')' : 'nenhuma')
  ];
  return {resposta_direta: linhas.join('\\n'), tratou: true};
};

window.V112_HANDLERS.h_escape_listar = function(m, ctx){
  const valvulas = V112.nodes.filter(n => (n.text||'').startsWith('[B_valvula_') && (n.text||'') !== '[B_valvula_escape]');
  if(valvulas.length === 0) return {resposta_direta:'nenhuma válvula criada', tratou:true};
  const linhas = ['válvulas de escape:'];
  for(const v of valvulas){
    linhas.push('  ' + v.text + ' estado=' + v.estado + ' estrat=' + (v._estrategia||'orgânica') + ' suc=' + (v._sucessos||0));
  }
  return {resposta_direta: linhas.join('\\n'), tratou: true};
};

window.V112_HANDLERS.h_escape_stress_sub = function(m, ctx){
  // "stress da sub_rede X" — m[1] vem em lowercase
  let nome = m[1];
  // Tentar match case-insensitive contra sub-redes existentes
  const nome_real = Object.keys(V112.subredes).find(n => n.toLowerCase() === nome.toLowerCase());
  if(!nome_real){
    return {resposta_direta: 'sub-rede ' + nome + ' não existe', tratou:true};
  }
  const no = v112_node_by_id(V112.subredes[nome_real].id);
  return {resposta_direta: 'stress de ' + nome_real + ' = ' + ((no._stress||0).toFixed(2)) +
                          ' (motivo último: ' + (no._stress_ultimo_motivo||'-') + ')', tratou:true};
};

if(typeof v112_comando_criar_no === 'function'){
  try {
    v112_comando_criar_no('^status\\\\s+escape$', 'h_escape_status', {prioridade:85, descricao:'status do sistema de escape', categoria:'escape'});
    v112_comando_criar_no('^(?:listar\\\\s+)?v[áa]lvulas$', 'h_escape_listar', {prioridade:85, descricao:'listar válvulas', categoria:'escape'});
    v112_comando_criar_no('^stress\\\\s+(?:da\\\\s+)?(b_[a-z_0-9]+)$', 'h_escape_stress_sub', {prioridade:85, descricao:'stress de sub-rede', categoria:'escape'});
  } catch(e){}
}

// ───────────────────────────────────────────────────────────────────
// API DEBUG
// ───────────────────────────────────────────────────────────────────
window.v112_escape_status = function(){
  const cen = _no_central();
  if(!cen) return {erro:'ausente'};
  return {
    acordada: ESCAPE.acordada,
    stress_global: _stress_global(),
    panicos_total: ESCAPE.total_panicos,
    valvulas_criadas: cen._valvulas_criadas||0,
    valvulas_promovidas: cen._valvulas_promovidas||0,
    valvulas_descartadas: cen._valvulas_descartadas||0,
    valvulas_em_prova: Object.keys(ESCAPE.valvulas_prova).length,
    turno: ESCAPE.turno,
    sub_mais_stressada: _sub_mais_stressada()
  };
};

window.v112_escape_forcar_stress = function(nome_sr, quantidade){
  _adicionar_stress(nome_sr, quantidade || 30, 'forçado_teste');
};

console.log('[v155_valvula_escape] carregado: B_valvula_escape (auto-mod tipo 3 — sistema de escape)');

})();
`});
