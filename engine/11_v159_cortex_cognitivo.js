// ─── REGIÃO 11/14 — v159_cortex_cognitivo.js ───
window._ARCH_MODULOS.push({nome:"v159_cortex_cognitivo.js", src: `
// ═══════════════════════════════════════════════════════════════
// v159_cortex_cognitivo.js — B_cortex_cognitivo (H_MAT)
//
// Junto do B_cortex_computacional. Lado matemático/lógico.
// 8 nós-órgão estruturais + tabelas novas em _estado_vm.
//
// MOTORES:
//   M1 N_gerador_hipoteses    — gera 2-4 alternativas antes de agir
//   M2 N_simulador_mental     — executa hipóteses sobre snapshot, sem alterar real
//   M3 N_busca_analogia       — 8 padrões estruturais
//   M4 N_engenheiro_reverso   — infere regra de pares input/output
//   M5 N_metacognicao         — lê _perfil_uso, autotreina motores fracos
//   M6 N_observador_estrutural— bigrams/trigrams de interação
//   N_curiosidade_ativa       — explora idle
//   N_arbitro                 — orquestra: decide qual motor usar
//
// TODOS BLINDADOS: _eh_estrutural=true, _imune_evolucao=true, etc.
//
// FILOSOFIA:
//   "Antes de executar, pensa. Antes de pensar, vê se já viu algo parecido."
//   "Tudo dentro do córtex existente — extensão orgânica, não módulo pendurado."
// ═══════════════════════════════════════════════════════════════

(function(){
'use strict';
if(!global.V112 && !window.V112) return;

const V = (typeof window !== 'undefined' && window.V112) ? window.V112 : global.V112;

// ────────────────────────────────────────────────────────────────
// 0) Geração de ID sincronizada (lição do v15 — não colidir com brain)
// ────────────────────────────────────────────────────────────────
function _gera_id(){
  let max = (V._next_node_id || 0);
  for(const n of V.nodes){
    if(typeof n.id === 'number' && n.id > max) max = n.id;
    if(typeof n.id === 'string'){
      const m = n.id.match(/^n_(\\d+)$/);
      if(m){ const v = parseInt(m[1]); if(v > max) max = v; }
    }
  }
  V._next_node_id = max + 2;
  return 'n_' + (max + 1);
}

// ────────────────────────────────────────────────────────────────
// 1) Sub-rede B_cortex_cognitivo + 8 nós-órgão
// ────────────────────────────────────────────────────────────────

function _criar_subrede_cortex_cognitivo(){
  if(V.subredes.B_cortex_cognitivo) return V.subredes.B_cortex_cognitivo;
  const id = _gera_id();
  const no = {
    id, text: '[B_cortex_cognitivo]',
    tipo: 'subrede', camada: 'subrede',
    pos: [250, 60, 100],         // H_MAT, acima do B_cortex_computacional
    acumulador: 0, limiar: 1, threshold: 1,
    estado: 'dormindo',
    _ativacoes: 0, _sucessos: 0,
    _categoria: 'cognitivo',
    _blindado: true,
    _imune_evolucao: true,
    _imune_valvula: true,
    _imune_aprendiz: true,
    _eh_estrutural: true,
    _eh_estrutural_cortex_cognitivo: true,
    _nao_evoluir: true,
    _proposito: 'Córtex cognitivo: hipóteses, simulação, analogia, eng. reversa, metacognição, observação',
  };
  V.nodes.push(no);
  V.subredes.B_cortex_cognitivo = {id, satelites: []};
  return V.subredes.B_cortex_cognitivo;
}

function _criar_no_orgao(nome, pos, proposito, categoria){
  if(V.subredes[nome]) return V.subredes[nome];
  const id = _gera_id();
  const no = {
    id, text: '['+nome+']',
    tipo: 'subrede', camada: 'subrede',
    pos: pos || [250, 60, 100],
    acumulador: 0, limiar: 1, threshold: 1,
    estado: 'dormindo',
    _ativacoes: 0, _sucessos: 0, _falhas: 0,
    _categoria: categoria || 'cognitivo',
    _blindado: true,
    _imune_evolucao: true,
    _imune_valvula: true,
    _imune_aprendiz: true,
    _eh_estrutural: true,
    _eh_estrutural_cortex_cognitivo: true,
    _nao_evoluir: true,
    _proposito: proposito,
    _taxa_acerto: 1.0,
    _custo_medio_ms: 1
  };
  V.nodes.push(no);
  V.subredes[nome] = {id, satelites: []};
  // Marca como satélite da B_cortex_cognitivo
  if(V.subredes.B_cortex_cognitivo){
    V.subredes.B_cortex_cognitivo.satelites.push(id);
  }
  return V.subredes[nome];
}

_criar_subrede_cortex_cognitivo();

// 8 nós-órgão (cada um com posição própria perto do córtex cognitivo)
_criar_no_orgao('N_gerador_hipoteses',     [240, 50, 95],  'Gera 2-4 hipóteses alternativas antes de executar', 'cognitivo');
_criar_no_orgao('N_simulador_mental',      [245, 55, 95],  'Executa hipóteses sobre snapshot isolado de _estado_vm', 'cognitivo');
_criar_no_orgao('N_busca_analogia',        [250, 60, 95],  'Busca padrões estruturais similares no grafo (8 padrões)', 'cognitivo');
_criar_no_orgao('N_engenheiro_reverso',    [255, 65, 95],  'Infere regra (linear/quadrática/estrutural) de pares input→output', 'cognitivo');
_criar_no_orgao('N_metacognicao',          [260, 70, 95],  'Lê _perfil_uso, identifica motor fraco, autotreina', 'cognitivo');
_criar_no_orgao('N_observador_estrutural', [240, 60, 105], 'Bigrams/trigrams de interação, antecipação proativa', 'cognitivo');
_criar_no_orgao('N_curiosidade_ativa',     [245, 65, 105], 'Em idle, explora grafo e forma perguntas', 'cognitivo');
_criar_no_orgao('N_arbitro',               [250, 70, 105], 'Decide qual motor cognitivo usar (custo/benefício)', 'cognitivo');

// ────────────────────────────────────────────────────────────────
// 2) Tabelas novas em _estado_vm
// ────────────────────────────────────────────────────────────────

function _no_central_cognitivo(){
  const sr = V.subredes.B_cortex_cognitivo;
  if(!sr) return null;
  return V.nodes.find(n => n.id === sr.id);
}

function _no_orgao(nome){
  const sr = V.subredes[nome];
  if(!sr) return null;
  return V.nodes.find(n => n.id === sr.id);
}

function _inicializar_estado_cognitivo(){
  const cen = _no_central_cognitivo();
  if(!cen) return;
  if(!cen._estado_cog){
    cen._estado_cog = {
      hipoteses_em_execucao: [],
      hipoteses_historico: [],
      regras_inferidas: [],
      analogias_validadas: [],
      padroes_tacitos: {},        // bigrams/trigrams
      perfil_metacognicao: {
        ultima_analise_turno: 0,
        intervalos_analise: 50,
        motores_fracos: [],
        autotreinos_realizados: 0
      },
      pares_engenharia_reversa: [],
      historico_interacoes: [],   // pra observador estrutural
      total_hipoteses_geradas: 0,
      total_simulacoes: 0,
      total_analogias_acertadas: 0,
      total_regras_inferidas: 0
    };
  }
}
_inicializar_estado_cognitivo();

// ────────────────────────────────────────────────────────────────
// 3) Helpers compartilhados
// ────────────────────────────────────────────────────────────────

function _registrar_motor_cog(nome_orgao, sucesso, custo_ms){
  const no = _no_orgao(nome_orgao);
  if(!no) return;
  no._ativacoes = (no._ativacoes || 0) + 1;
  if(sucesso) no._sucessos = (no._sucessos || 0) + 1;
  else no._falhas = (no._falhas || 0) + 1;
  const total = (no._sucessos || 0) + (no._falhas || 0);
  no._taxa_acerto = total > 0 ? no._sucessos / total : 1.0;
  if(typeof custo_ms === 'number'){
    no._custo_medio_ms = ((no._custo_medio_ms || 1) * 0.9) + (custo_ms * 0.1);
  }
}

// ────────────────────────────────────────────────────────────────
// 4) PARTE 2 (motores) carregada SEPARADA via v159b
// ────────────────────────────────────────────────────────────────

window.v159_cortex_cognitivo_base_pronto = true;
console.log('[v159_cortex_cognitivo] base instalada: B_cortex_cognitivo + 8 nós-órgão + tabelas em _estado_cog');

})();
`});
