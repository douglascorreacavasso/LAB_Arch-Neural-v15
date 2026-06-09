// ═══════════════════════════════════════════════════════════════════
// ARCH-NEURAL V15.1 FINAL — Cérebro completo num único arquivo
//
// Autor: Douglas Corrêa Cavasso
// Data: 2026-05-27
// Licença: MIT
//
// FILOSOFIA: o cérebro é UMA coisa só. Anatomia + fisiologia + órgãos
// + reflexos + córtex Turing + córtex cognitivo + córtex estatístico
// + cérebro serializado — TUDO num arquivo. Não tem "código fora",
// não tem "cérebro num JSON e código num JS". É uma estrutura única.
//
// ─── 14 REGIÕES EMPILHADAS ───
//
//  01. v112_core              — Estrutura do grafo
//  02. v112_brain             — Motor de execução
//  03. v151_logica_prog       — Lógica/programação
//  04. v152_afastamentos      — RH/calendário
//  05. v153_auto_mod          — Aprendiz emergencial
//  06. v154_aprendiz_meta     — Meta-aprendiz
//  07. v155_valvula_escape    — Válvula de escape
//  08. v156_evolucao          — Evolução biológica
//  09. v158_reflexos_sociais  — Reflexos sociais
//  10. v15_cortex_logico      — Córtex Turing
//  11. v159_cortex_cognitivo  — Córtex cognitivo (base)
//  12. v159b_motores          — 6 motores cognitivos
//  13. v160_estatistico       — 10 motores estatísticos
//  14. CEREBRO_DATA           — JSON do cérebro embutido (anatomia salva)
//
// USO:
//   global.window = global;  // (apenas Node.js)
//   require('./arch_neural_v15_final.js');
//   arch_neural_init();   // importa cérebro embutido + ativa todos os módulos
//   console.log(v112_processar('média de [1,2,3,4,5]').resposta);
//
// ═══════════════════════════════════════════════════════════════════


// ═══ REGIÃO 01/14 — v112_core ═══

// ============================================================================
// V11.2 CORE — Anatomia neural completa (Parte 1)
// ============================================================================
// CAMADAS (eixo Z):
//   +200  Sensorial    500 receptores → onde input nasce
//   +100  Hipocampo    400 nós + EVENTOS cronológicos
//      0  Córtex       400 nós → memória longo prazo
//   -200  Motora       300 nós → emissores
// Paralelo: 50 nós Amígdala (estrutura, ainda sem comportamento - Parte 2)
//
// REGRAS HONESTAS:
//   1. Só ifs físicos (threshold, idade, peso)
//   2. Zero listas de palavras
//   3. NADA é deletado — só dorme (peso baixo)
//   4. Frases preservam ordem cronológica via nó-evento
//   5. Acumula múltiplos atributos
// ============================================================================

'use strict';

window.V112 = {
  _next_node_id: 1,
  _next_edge_id: 1,
  _next_evento_id: 1,
  turn: 0,
  nodes: [],
  edges: [],

  // ═══ CAMADAS ANCORADAS (12 estruturas — Lab 12 adiciona Self-Core) ═══
  self_core_id: null,  // ID do nó Self-Core (centro 0,0,0) — NOVO LAB 12
  sensorial: [],       // 500 slots pra palavras (Z=+200)
  talamo: [],          // 20 nós roteador (Z=+150)
  hipocampo: [],       // 400 nós + eventos (Z=+100)
  cortex: [],          // 400 nós massa cinzenta (Z=0)
  amigdala: [],        // 50 nós emocionais (Z=0 offset)
  gaba: [],            // 10 nós inibitórios
  nucleos_acao: [],    // 30 nós ignição STDP (Z=-50) — CRESCE conforme demanda
  motora: [],          // 200 nós motores (Z=-150)
  broca: [],           // 100 nós Broca saída (Z=-200)

  // Eventos cronológicos (Hipocampo)
  eventos: [],

  // Estatísticas
  freq_global: {},
  vizinhos_unicos: {},
  total_turnos: 0,

  // ═══ SELF-CORE: DNA + IDENTIDADE EMERGENTE (Lab 12) ═══
  self_core: {
    // Mínimo absoluto (DNA imutável)
    sou: ['ia', 'sistema'],
    sistema_nome: 'arch-neural',   // nome do sistema (fixo)
    criador: ['douglas corrêa cavasso'],
    
    // User-Shell (mutável — você ensina)
    nome: [],            // nome próprio da IA (você define)
    genero: [],          // gênero da IA (você define)
    user: [],            // quem está falando agora
    
    // Leis fundamentais (DNA)
    leis: [
      'responder honesto',
      'preservar identidade',
      'não contradizer dna'
    ],
    
    // Modo de ativação (3 versões pra testar)
    // 'estreita' = só ativa com palavras específicas (eu, sou, nome, etc)
    // 'media'    = ativa com palavras de identidade OU palavras orbitando
    // 'larga'    = sempre tem ativação baixa (sempre presente)
    modo_ativacao: 'media',
    
    // Variação 3 (gravidade):
    // 'manual' = só ativa quando palavra-chave aparece
    // 'emergente' = ativa quando palavra é vizinha de muitos nós orbitando
    modo_gravidade: 'emergente',
    
    // Conjuntos que crescem por uso (orbitantes do Self-Core)
    orbitantes: {},      // texto_palavra → contador de proximidade
  },

  // ═══ ESTADO EMOCIONAL (Amígdala viva) ═══
  amigdala_tensao: 0,
  amigdala_estado: 'calma',
  gaba_ativo: false,
  historico_recente: [],
  fallbacks_consecutivos: 0,
  valencia_palavras: {},

  // ═══ BUFFER DE LOGS (últimos 200 turnos) ═══
  logs: [],

  _last: {
    tokens: [], ativados: [], resposta: '',
    pesos_calculados: {},
    evento_criado: null,
  },

  _sleep_active: false,
  _last_activity: Date.now(),
};

// =============================================================
// CONSTRUTORES
// =============================================================
function v112_node(opts){
  opts = opts || {};
  const n = {
    id: opts.id || ('n_' + V112._next_node_id++),
    text: opts.text || '',
    camada: opts.camada || 'livre',
    mass: opts.mass || 1.0,
    acumulador: 0,
    threshold: opts.threshold || 50,
    pos: opts.pos || [0, 0, 0],
    slot_id: opts.slot_id || null,
    _criado_turno: V112.turn,
    _dormindo: false,
    // Valência emocional acumulada (Amígdala)
    _valencia_neg: 0,
    _valencia_pos: 0,
    // PRÉ-BASE v11.5 (Items 2 e 5)
    _palavra_tipo: opts._palavra_tipo || (opts.text ? 'conceito' : null),
    _contextos_vistos: new Set(),
    _disparos: 0,
  };
  // PRÉ-BASE v12 Sessão 5: copia QUALQUER prop customizada (começa com _)
  for(const k of Object.keys(opts)){
    if(k.startsWith('_') && !(k in n)){
      n[k] = opts[k];
    }
  }
  V112.nodes.push(n);
  if(V112._node_cache) V112._node_cache.set(n.id, n);
  V112._node_cache_size = V112.nodes.length;
  return n;
}

function v112_edge(from, to, peso, opts){
  opts = opts || {};
  // Se já existe, engrossa
  const existente = V112.edges.find(e => e.from === from && e.to === to && e.tipo === (opts.tipo || 'normal'));
  if(existente){
    // Mielinizadas têm cap de peso 50
    if(existente.tipo === 'mielinizada'){
      existente.peso = Math.min(50, existente.peso + (peso || 1) * 0.1);
    } else {
      existente.peso += (peso || 1);
    }
    existente.hebb_count++;
    existente._last_used = V112.turn;
    existente._dormindo = false;
    return existente;
  }
  const e = {
    id: 'e_' + V112._next_edge_id++,
    from, to,
    peso: peso || 1,
    hebb_count: 1,
    tipo: opts.tipo || 'normal',  // 'normal' | 'cronologica' | 'temporal_seq' | 'mielinizada' | 'anatomica'
    ordem: opts.ordem || null,
    _criado_turno: V112.turn,
    _last_used: V112.turn,
    _dormindo: false,
    _valencia: V112.amigdala_estado || 'calma',  // marca emoção do momento
  };
  V112.edges.push(e);
  // Invalida adjacência
  V112._edges_idx_from = null;
  V112._edges_idx_to = null;
  return e;
}

function v112_node_by_id(id){
  if(!V112._node_cache || V112._node_cache_size !== V112.nodes.length){
    V112._node_cache = new Map();
    for(const n of V112.nodes) V112._node_cache.set(n.id, n);
    V112._node_cache_size = V112.nodes.length;
  }
  return V112._node_cache.get(id);
}
function v112_node_by_text(t){
  if(!t) return null;
  const tn = String(t).toLowerCase();
  return V112.nodes.find(n => (n.text||'').toLowerCase() === tn && n.camada === 'sensorial');
}

// Adjacência indexada O(1) — só rebuild quando muda
function v112_arestas_saindo(no_id){
  if(!V112._edges_idx_from || V112._edges_idx_from_size !== V112.edges.length){
    V112._edges_idx_from = new Map();
    for(const e of V112.edges){
      if(!V112._edges_idx_from.has(e.from)) V112._edges_idx_from.set(e.from, []);
      V112._edges_idx_from.get(e.from).push(e);
    }
    V112._edges_idx_from_size = V112.edges.length;
  }
  return V112._edges_idx_from.get(no_id) || [];
}
function v112_arestas_chegando(no_id){
  if(!V112._edges_idx_to || V112._edges_idx_to_size !== V112.edges.length){
    V112._edges_idx_to = new Map();
    for(const e of V112.edges){
      if(!V112._edges_idx_to.has(e.to)) V112._edges_idx_to.set(e.to, []);
      V112._edges_idx_to.get(e.to).push(e);
    }
    V112._edges_idx_to_size = V112.edges.length;
  }
  return V112._edges_idx_to.get(no_id) || [];
}

// =============================================================
// TOKENIZAR
// =============================================================
function v112_tokenizar(input){
  if(!input) return [];
  let txt = String(input).toLowerCase();
  // LAB 13.3 — Compreensão de frase composta:
  // "mais alto que" / "mais baixo que" / "maior que" / "menor que" viram um token só
  txt = txt
    .replace(/\bmais\s+alto\s+que\b/g, 'mais_alto')
    .replace(/\bmais\s+baixo\s+que\b/g, 'mais_baixo')
    .replace(/\bmais\s+forte\s+que\b/g, 'mais_forte')
    .replace(/\bmais\s+rápido\s+que\b/g, 'mais_rapido')
    .replace(/\bmais\s+rapido\s+que\b/g, 'mais_rapido')
    .replace(/\bmais\s+inteligente\s+que\b/g, 'mais_inteligente')
    .replace(/\bmais\s+velho\s+que\b/g, 'mais_velho')
    .replace(/\bmais\s+novo\s+que\b/g, 'mais_novo')
    .replace(/\bmaior\s+que\b/g, 'maior_que')
    .replace(/\bmenor\s+que\b/g, 'menor_que')
    .replace(/\bantes\s+de\b/g, 'antes_de')
    .replace(/\bdepois\s+de\b/g, 'depois_de');
  return txt
    .replace(/([?!.,;:=+*/])/g, ' $1 ')
    .replace(/\s-\s/g, ' - ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

// =============================================================
// EXPORT / IMPORT
// =============================================================
function v112_exportar(){
  // Helper: converte Sets em nós pra arrays (JSON não serializa Set)
  function clean_node(n){
    const out = {...n, acumulador: 0};
    for(const k of Object.keys(out)){
      const v = out[k];
      if(v instanceof Set){
        out[k] = Array.from(v);
      } else if(v && typeof v === 'object' && !Array.isArray(v)){
        // {chave: Set} → {chave: array}
        const novo = {};
        for(const [kk, vv] of Object.entries(v)){
          if(vv instanceof Set) novo[kk] = Array.from(vv);
          else novo[kk] = vv;
        }
        out[k] = novo;
      }
    }
    return out;
  }
  return {
    version: 'v12', self_core: V112.self_core,
    turn: V112.turn,
    nodes: V112.nodes.map(clean_node),
    edges: V112.edges,
    eventos: V112.eventos,
    freq_global: V112.freq_global,
    vizinhos_unicos: Object.fromEntries(
      Object.entries(V112.vizinhos_unicos).map(([k,v]) => [k, Array.from(v)])
    ),
    total_turnos: V112.total_turnos,
    // 12 estruturas
    self_core_id: V112.self_core_id,
    self_core: V112.self_core,
    sensorial: V112.sensorial,
    talamo: V112.talamo,
    hipocampo: V112.hipocampo,
    cortex: V112.cortex,
    amigdala: V112.amigdala,
    gaba: V112.gaba,
    nucleos_acao: V112.nucleos_acao,
    motora: V112.motora,
    broca: V112.broca,
    // emocional
    amigdala_tensao: V112.amigdala_tensao,
    amigdala_estado: V112.amigdala_estado,
    gaba_ativo: V112.gaba_ativo,
    valencia_palavras: V112.valencia_palavras,
    fallbacks_consecutivos: V112.fallbacks_consecutivos,
    _next_node_id: V112._next_node_id,
    _next_edge_id: V112._next_edge_id,
    _next_evento_id: V112._next_evento_id,
  };
}

function v112_importar(s){
  if(!s) return false;
  const ok_versoes = ['v11.2', 'v11.2.1', 'v11.3', 'v12'];
  if(!ok_versoes.includes(s.version)) return false;
  V112.turn = s.turn || 0;
  V112.nodes = s.nodes || [];
  V112.edges = s.edges || [];
  V112.eventos = s.eventos || [];
  V112.freq_global = s.freq_global || {};
  V112.vizinhos_unicos = {};
  for(const [k,v] of Object.entries(s.vizinhos_unicos || {})){
    V112.vizinhos_unicos[k] = new Set(v);
  }
  V112.total_turnos = s.total_turnos || 0;
  // Self-Core (default pra cérebros antigos)
  V112.self_core_id = s.self_core_id || null;
  V112.self_core = s.self_core || {
    sou: ['ia', 'sistema'],
    sistema_nome: 'arch-neural',
    criador: ['douglas corrêa cavasso'],
    nome: [],
    genero: [],
    user: [],
    leis: ['responder honesto', 'preservar identidade', 'não contradizer dna'],
    modo_ativacao: 'media',
    modo_gravidade: 'emergente',
    orbitantes: {},
  };
  // Camadas
  V112.sensorial = s.sensorial || [];
  V112.talamo = s.talamo || [];
  V112.hipocampo = s.hipocampo || [];
  V112.cortex = s.cortex || [];
  V112.amigdala = s.amigdala || [];
  V112.gaba = s.gaba || [];
  V112.nucleos_acao = s.nucleos_acao || [];
  V112.motora = s.motora || [];
  V112.broca = s.broca || [];
  // emocional
  V112.amigdala_tensao = s.amigdala_tensao || 0;
  V112.amigdala_estado = s.amigdala_estado || 'calma';
  V112.gaba_ativo = s.gaba_ativo || false;
  V112.valencia_palavras = s.valencia_palavras || {};
  V112.fallbacks_consecutivos = s.fallbacks_consecutivos || 0;
  V112.historico_recente = [];
  V112.logs = [];
  V112._next_node_id = s._next_node_id || 1;
  V112._next_edge_id = s._next_edge_id || 1;
  V112._next_evento_id = s._next_evento_id || 1;
  V112._node_cache = null;
  V112._node_cache_size = 0;
  V112._edges_idx_from = null;
  V112._edges_idx_to = null;
  for(const n of V112.nodes){
    n.acumulador = 0;
    // _contextos_vistos é Set, mas vira {} no JSON
    if(n._contextos_vistos && !(n._contextos_vistos instanceof Set)){
      n._contextos_vistos = new Set(
        Array.isArray(n._contextos_vistos) ? n._contextos_vistos : 
        (typeof n._contextos_vistos === 'object' ? Object.keys(n._contextos_vistos) : [])
      );
    }
    // Campos que SÃO Set direto
    for(const campo of ['_padroes','_membros']){
      if(n[campo] !== undefined && !(n[campo] instanceof Set)){
        n[campo] = new Set(
          Array.isArray(n[campo]) ? n[campo] : 
          (typeof n[campo] === 'object' ? Object.keys(n[campo]) : [])
        );
      }
    }
    // Campos que são {chave: Set}
    for(const campo of ['_cache_instancias','_categorias_por_instancia','_cadeia','_trait_para_objetos','_objeto_para_traits','_negacoes_transitivas','_condicionais','_consequente_para_antecedente','_todo','_antes_de','_pares','_passos','_causa_de','_efeito_de']){
      if(n[campo] && typeof n[campo] === 'object' && !Array.isArray(n[campo])){
        for(const [k,v] of Object.entries(n[campo])){
          if(!(v instanceof Set)){
            n[campo][k] = new Set(Array.isArray(v) ? v : (typeof v === 'object' ? Object.keys(v) : []));
          }
        }
      }
    }
  }
  
  // Reconstrói V112.subredes (índice de sub-redes) a partir dos nós camada=subrede
  V112.subredes = V112.subredes || {};
  for(const n of V112.nodes){
    if(n.camada === 'subrede' && n.text && n.text.startsWith('[') && n.text.endsWith(']')){
      const nome = n.text.slice(1, -1);
      if(!V112.subredes[nome]){
        V112.subredes[nome] = {id: n.id, satelites: []};
      }
    }
  }
  // Reconstrói satélites
  for(const n of V112.nodes){
    if(n.camada === 'subrede_sat' && n._subrede_pai){
      const sr = V112.subredes[n._subrede_pai];
      if(sr && !sr.satelites.includes(n.id)) sr.satelites.push(n.id);
    }
  }
  
  // Reconstrói V112.hemisferios (H_LING, H_MAT)
  V112.hemisferios = V112.hemisferios || {};
  for(const n of V112.nodes){
    if(n.camada === 'hemisferio' && n.text){
      V112.hemisferios[n.text] = {id: n.id};
    }
  }
  
  // LAB 13.2 — Reconstrói V112.gramatica e V112.operadores 
  // (sem isso, analise.intent_nega nunca dispara após importar)
  V112.gramatica = {};
  V112.operadores = {};
  for(const n of V112.nodes){
    if(n.camada === 'gramatica' && n.text){
      // text vem como '[intent_nega]' — remove brackets pra virar key
      const nome = n.text.replace(/^\[|\]$/g, '');
      V112.gramatica[nome] = n.id;
    }
    if(n.camada === 'operador' && n.text){
      const nome = n.text.replace(/^\[|\]$/g, '');
      V112.operadores[nome] = n.id;
    }
  }
  
  // LAB 12.7 — Reposiciona em Y automaticamente após importar
  if(typeof v112_reposicionar_em_arvore === 'function'){
    v112_reposicionar_em_arvore();
  }
  
  // LAB 13.14 — Re-vincula funções de regras-nós (JSON perde funções)
  if(typeof v112_revincular_funcoes_regras === 'function'){
    try {
      const n = v112_revincular_funcoes_regras();
      if(n > 0) console.log('[importar] ' + n + ' funções de regras-nós re-vinculadas');
    } catch(e){ /* silencioso */ }
  }
  
  // LAB 13.15 — Re-registra handlers globais + cria comando-nós se faltarem
  if(typeof v112_revincular_handlers === 'function'){
    try {
      const n = v112_revincular_handlers();
      if(n > 0) console.log('[importar] ' + n + ' comando-nós criados');
    } catch(e){ /* silencioso */ }
  }
  
  // LAB 13.21 — B_gerador_comandos
  if(typeof v112_gerador_garantir_no === 'function'){
    try {
      v112_gerador_garantir_no();
      if(typeof v112_gerador_instalar_comandos_nl === 'function'){
        v112_gerador_instalar_comandos_nl();
      }
    } catch(e){ /* silencioso */ }
  }
  
  return true;
}

// ═════════════════════════════════════════════════════════════════
// v112_importar_merge — junta cérebro carregado com o ATUAL
// Não substitui. Une nós, arestas, caches, DNA, sub-redes.
// ═════════════════════════════════════════════════════════════════
function v112_importar_merge(s){
  if(!s) return {ok: false, motivo: 'sem dados'};
  const ok_versoes = ['v11.2', 'v11.2.1', 'v11.3', 'v12'];
  if(!ok_versoes.includes(s.version)) return {ok: false, motivo: 'versão incompatível: ' + s.version};
  
  if(!V112.nodes || V112.nodes.length === 0){
    v112_importar(s);
    return {ok: true, modo: 'primeiro_carregamento'};
  }
  
  const stats = {nos_novos: 0, arestas_novas: 0, eventos: 0, dna_novo: 0};
  
  const map_id = {};
  const por_texto_atual = {};
  // NEREAL_FIX_MERGE_RAPIDO_V1: indices O(1) (Map) no lugar de V112.nodes.find — antes cada no
  // de entrada varria TODOS os nos atuais (O(N*M), quadratico) e travava o celular em cerebro
  // grande, parando a barra (~26%) pra sempre. Agora o merge e LINEAR (nao congela).
  const id2node = new Map();
  const byCamadaText = new Map();
  for(const n of V112.nodes){
    id2node.set(n.id, n);
    if(n.text){
      por_texto_atual[n.text] = n.id;
      const _k = n.camada + '~~' + n.text;
      if(!byCamadaText.has(_k)) byCamadaText.set(_k, n);
    }
  }

  for(const n_in of (s.nodes || [])){
    if(n_in.text && por_texto_atual[n_in.text]){
      map_id[n_in.id] = por_texto_atual[n_in.text];
      const n_atual = id2node.get(por_texto_atual[n_in.text]);
      if(n_atual){
        n_atual.mass = Math.min(20, (n_atual.mass || 1) + (n_in.mass || 1) * 0.3);
      }
    } else if(n_in.camada === 'self_core' || n_in.camada === 'gramatica' || 
              n_in.camada === 'operador' || n_in.camada === 'hemisferio' ||
              n_in.camada === 'subrede' || n_in.camada === 'subrede_sat'){
      const igual = byCamadaText.get(n_in.camada + '~~' + n_in.text);
      if(igual) map_id[n_in.id] = igual.id;
      else {
        const novo = {...n_in, id: 'n_' + V112._next_node_id++, acumulador: 0};
        V112.nodes.push(novo);
        id2node.set(novo.id, novo);
        if(novo.text){ const _k2 = novo.camada + '~~' + novo.text; if(!byCamadaText.has(_k2)) byCamadaText.set(_k2, novo); }
        map_id[n_in.id] = novo.id;
        stats.nos_novos++;
      }
    } else if(n_in.text){
      const novo = {...n_in, id: 'n_' + V112._next_node_id++, acumulador: 0};
      V112.nodes.push(novo);
      id2node.set(novo.id, novo);
      map_id[n_in.id] = novo.id;
      stats.nos_novos++;
      por_texto_atual[n_in.text] = novo.id;
      { const _k3 = novo.camada + '~~' + novo.text; if(!byCamadaText.has(_k3)) byCamadaText.set(_k3, novo); }
    } else {
      map_id[n_in.id] = null;
    }
  }
  
  // NEREAL_FIX_MERGE_RAPIDO_V1: indice O(1) no lugar de V112.edges.find (era O(E*E), quadratico)
  const _edgeKey = new Map();
  for(const ed of V112.edges){
    const _ek = ed.from + '~~' + ed.to + '~~' + (ed.tipo || 'normal');
    if(!_edgeKey.has(_ek)) _edgeKey.set(_ek, ed);
  }
  for(const e of (s.edges || [])){
    const from_new = map_id[e.from];
    const to_new = map_id[e.to];
    if(!from_new || !to_new) continue;

    const _ek = from_new + '~~' + to_new + '~~' + (e.tipo || 'normal');
    const existente = _edgeKey.get(_ek);
    if(existente){
      existente.peso = Math.min(50, (existente.peso || 0) + (e.peso || 0) * 0.5);
    } else {
      const _ne = {
        ...e,
        id: 'e_' + V112._next_edge_id++,
        from: from_new,
        to: to_new,
      };
      V112.edges.push(_ne);
      _edgeKey.set(_ek, _ne);
      stats.arestas_novas++;
    }
  }
  
  for(const [k, v] of Object.entries(s.freq_global || {})){
    V112.freq_global[k] = (V112.freq_global[k] || 0) + v;
  }
  for(const [k, v] of Object.entries(s.vizinhos_unicos || {})){
    if(!V112.vizinhos_unicos[k]) V112.vizinhos_unicos[k] = new Set();
    for(const x of v) V112.vizinhos_unicos[k].add(x);
  }
  
  for(const ev of (s.eventos || [])){
    V112.eventos.push({...ev, id: 'ev_' + V112._next_evento_id++});
    stats.eventos++;
  }
  
  if(s.self_core){
    const sc_atual = V112.self_core;
    for(const campo of ['sou','nome','genero','user','criador']){
      const incoming = s.self_core[campo] || [];
      for(const v of incoming){
        if(!sc_atual[campo].includes(v)){
          sc_atual[campo].push(v);
          stats.dna_novo++;
        }
      }
    }
    for(const [k, v] of Object.entries(s.self_core.orbitantes || {})){
      sc_atual.orbitantes[k] = (sc_atual.orbitantes[k] || 0) + v;
    }
  }
  
  // MERGE caches sub-redes
  function merge_sr(nome_sr, campos){
    if(!V112.subredes || !V112.subredes[nome_sr]) return;
    const node_atual = id2node.get(V112.subredes[nome_sr].id);
    if(!node_atual) return;
    const node_in = (s.nodes || []).find(x => x.camada === 'subrede' && x.text === '['+nome_sr+']');
    if(!node_in) return;
    for(const campo of campos){
      if(!node_in[campo]) continue;
      if(!node_atual[campo]) node_atual[campo] = {};
      for(const [k, v] of Object.entries(node_in[campo])){
        if(!node_atual[campo][k]) node_atual[campo][k] = new Set();
        if(!(node_atual[campo][k] instanceof Set)) node_atual[campo][k] = new Set(node_atual[campo][k] || []);
        const valores = (v instanceof Set) ? v : (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v) : []));
        for(const x of valores) node_atual[campo][k].add(x);
      }
    }
  }
  
  merge_sr('B_bidir', ['_cache_instancias', '_categorias_por_instancia']);
  merge_sr('B_logico', ['_cadeia']);
  merge_sr('B_salto', ['_trait_para_objetos', '_objeto_para_traits']);
  
  // Conserta nós: _contextos_vistos é Set, mas vira {} no JSON
  for(const n of V112.nodes){
    if(n._contextos_vistos && !(n._contextos_vistos instanceof Set)){
      n._contextos_vistos = new Set(
        Array.isArray(n._contextos_vistos) ? n._contextos_vistos : 
        (typeof n._contextos_vistos === 'object' ? Object.keys(n._contextos_vistos) : [])
      );
    }
  }
  
  V112._node_cache = null;
  V112._node_cache_size = 0;
  V112._edges_idx_from = null;
  V112._edges_idx_to = null;
  for(const n of V112.nodes) n.acumulador = 0;
  
  // LAB 13.14 — Re-vincula funções de regras-nós
  if(typeof v112_revincular_funcoes_regras === 'function'){
    try { v112_revincular_funcoes_regras(); } catch(e){}
  }
  
  return {ok: true, modo: 'merge', stats};
}

window.v112_node = v112_node;
window.v112_edge = v112_edge;
window.v112_node_by_id = v112_node_by_id;
window.v112_node_by_text = v112_node_by_text;
window.v112_arestas_saindo = v112_arestas_saindo;
window.v112_arestas_chegando = v112_arestas_chegando;
window.v112_tokenizar = v112_tokenizar;
window.v112_exportar = v112_exportar;
window.v112_importar = v112_importar;
window.v112_importar_merge = v112_importar_merge;

console.log('[v112_core] carregado');

// ─── Inicialização defensiva ───
window.V112 = window.V112 || {};
window.V112.subredes = window.V112.subredes || {};
window.V112.nodes = window.V112.nodes || [];
window.V112.edges = window.V112.edges || [];
window.V112._next_node_id = window.V112._next_node_id || 1;
window.V112._next_edge_id = window.V112._next_edge_id || 1;
window.V112_HANDLERS = window.V112_HANDLERS || {};
window.V112_PROG_SKIP_AUTOINIT = window.V112_PROG_SKIP_AUTOINIT !== undefined
  ? window.V112_PROG_SKIP_AUTOINIT : true;

