// ─── REGIÃO 09/14 — v158_reflexos_sociais.js ───
window._ARCH_MODULOS.push({nome:"v158_reflexos_sociais.js", src: `
// ═══════════════════════════════════════════════════════════════
// v158_reflexos_sociais.js — B_reflexos_sociais
//
// Sub-rede de REFLEXOS sociais. Pré-cabeada (não-aprendida), de alta
// prioridade, interceptando saudações/conversa antes do fluxo cognitivo.
//
// PRINCÍPIOS (vide pedido do Douglas):
//  - Reflexo social é coisa do tronco/sistema límbico, não do córtex.
//    Não passa por raciocínio, propagação, álgebra etc.
//  - VARIAÇÃO EXPLORATÓRIA: o cérebro tenta variantes diferentes da
//    resposta e mede taxa de "boa recepção" (curtos, sem fallback
//    seguinte do user) pra reforçar as variantes que pegam.
//    "Cérebro humano sempre inventa moda."
//  - DETECÇÃO EMOCIONAL TRIPLA:
//    (1) léxico (palavras-valência),
//    (2) pontuação (? curiosidade, ! intensidade, ... hesitação),
//    (3) tensão da amígdala (no momento).
//  - TABELA DE ASSUNTOS pra escolher filler contextual ("ok", "legal",
//    "interessante", "faz sentido", "hmm e o que mais?").
//  - BLINDADO contra auto-mods (não evolui, não some via válvula,
//    não vira cicatriz).
//  - Marca respostas como NÃO-FALLBACK (não sobe tensão na amígdala).
//
// O QUE COBRE:
//  - 30+ padrões pré-cabeados:
//    saudações, períodos do dia, despedidas, cortesia, continuação,
//    confirmação social, identidade básica, agradecimento,
//    expressão emocional, fillers contextuais.
//
// ═══════════════════════════════════════════════════════════════

(function(){
'use strict';

if(!V112 || !V112.subredes){
  console.log('[v158_reflexos] V112 não pronto, abortando');
  return;
}

// ────────────────────────────────────────────────────────────────
// 1) Cria B_reflexos_sociais (blindada)
// ────────────────────────────────────────────────────────────────

function criar_B_reflexos(){
  if(V112.subredes.B_reflexos_sociais) return V112.subredes.B_reflexos_sociais;
  // FIX colisão de IDs: usa contador global e ALÉM disso sincroniza com max real
  let max = (V112._next_node_id || 0);
  for(const n of V112.nodes){
    if(typeof n.id === 'number' && n.id > max) max = n.id;
    if(typeof n.id === 'string'){
      const m = n.id.match(/^n_(\\d+)$/);
      if(m){ const v = parseInt(m[1]); if(v > max) max = v; }
    }
  }
  const novo_id = 'n_' + (max + 1);
  // CRITICAL: sincroniza o contador global do brain pra evitar colisão futura
  V112._next_node_id = max + 2;
  const no = {
    id: novo_id,
    text: '[B_reflexos_sociais]',
    tipo: 'subrede',
    camada: 'subrede',
    pos: [0, -120, 60],
    acumulador: 0,
    limiar: 1,
    threshold: 1,
    estado: 'dormindo',
    _ativacoes: 0,
    _sucessos: 0,
    _categoria: 'reflexo',
    _blindado: true,                  // auto-mods NÃO mexem aqui
    _imune_evolucao: true,
    _imune_valvula: true,
    _imune_aprendiz: true,
    _eh_estrutural: true,             // marca como estrutural pra v155/v156 não evoluir
    _eh_h_ling: true,                 // marca lado H_LING (linguagem)
    _proposito: 'Reflexos sociais pré-cabeados: saudação, despedida, cortesia, fillers emocionais',
    _disparos: 0,
  };
  V112.nodes.push(no);
  V112.subredes.B_reflexos_sociais = {id: novo_id, satelites: []};
  return V112.subredes.B_reflexos_sociais;
}
criar_B_reflexos();

// ────────────────────────────────────────────────────────────────
// 2) Estado interno (variação exploratória)
// V112._reflex_state guarda histórico por padrão pra explorar
// ────────────────────────────────────────────────────────────────

function reflex_state(){
  if(!V112._reflex_state){
    V112._reflex_state = {
      uso: {},                  // {padrao_id: {variante_id: usos}}
      ultima_variante: {},      // {padrao_id: variante_id_usada_ultima}
      historico: [],            // últimos N inputs+respostas
      explorar_chance: 0.35,    // 35% chance de tentar variante nova
      total_disparos: 0,
    };
  }
  return V112._reflex_state;
}

// ────────────────────────────────────────────────────────────────
// 3) LÉXICO emocional + pontuação
// ────────────────────────────────────────────────────────────────

const LEX_POSITIVO = ['feliz','contente','alegre','ótimo','otimo','bom','legal','massa','show','daora','top','maneiro','incrível','incrivel','adoro','amo','gosto','curto','animado','empolgado','satisfeito','tranquilo','beleza','suave','tudo bem','tudo certo','de boa','perfeito'];
const LEX_NEGATIVO = ['triste','chateado','puto','nervoso','irritado','cansado','exausto','ansioso','preocupado','medo','assustado','furioso','frustrado','desanimado','deprimido','mal','péssimo','pessimo','horrível','horrivel','ruim','difícil','dificil','complicado','pior','perdido','confuso'];
const LEX_DUVIDA  = ['será','sera','acho','talvez','pode ser','não sei','nao sei','meio','mais ou menos','não tenho certeza','nao tenho certeza','vai que','será que','sera que'];
const LEX_CURIOSO = ['por que','porque','como','quando','onde','quem','qual','o que','como assim','será que','sera que'];

function detectar_emocao(input){
  const txt = String(input || '').toLowerCase();
  let score_pos = 0, score_neg = 0, score_duv = 0, score_cur = 0;
  
  for(const p of LEX_POSITIVO){ if(txt.includes(p)) score_pos += 1; }
  for(const p of LEX_NEGATIVO){ if(txt.includes(p)) score_neg += 1; }
  for(const p of LEX_DUVIDA){ if(txt.includes(p)) score_duv += 1; }
  for(const p of LEX_CURIOSO){ if(txt.includes(p)) score_cur += 1; }
  
  // Pontuação
  const tem_interrog = /\\?/.test(input);
  const tem_excl = /!/.test(input);
  const intensidade_excl = (input.match(/!/g) || []).length;
  const tem_reticencia = /\\.{3,}|…/.test(input);
  
  if(tem_interrog) score_cur += 1;
  if(tem_excl) { score_pos += intensidade_excl * 0.3; }
  if(tem_reticencia) score_duv += 0.5;
  
  // Amígdala atual
  const tensao = V112.amigdala_tensao || 0;
  const estado_amig = V112.amigdala_estado || 'calma';
  if(estado_amig === 'saturacao' || tensao > 70) score_neg += 0.5;
  
  // Decide
  let emocao = 'neutro';
  const max = Math.max(score_pos, score_neg, score_duv, score_cur);
  if(max < 0.5) emocao = 'neutro';
  else if(score_neg === max) emocao = 'negativo';
  else if(score_pos === max) emocao = 'positivo';
  else if(score_cur === max) emocao = 'curioso';
  else if(score_duv === max) emocao = 'duvida';
  
  return {
    emocao,
    intensidade: tem_excl ? 'alta' : (tem_reticencia ? 'baixa' : 'media'),
    interrogativo: tem_interrog,
    reticente: tem_reticencia,
    scores: {pos: score_pos, neg: score_neg, duv: score_duv, cur: score_cur},
    tensao_amig: tensao,
  };
}

// ────────────────────────────────────────────────────────────────
// 4) TABELA DE ASSUNTOS (classificação rápida do input)
// ────────────────────────────────────────────────────────────────

const ASSUNTOS = {
  tecnico:    ['código','codigo','bug','erro','função','funcao','python','javascript','sql','rede','banco','servidor','api','sistema','arquitetura','algoritmo','dados','arquivo','script','programar','compilar','executar','deploy','log','classe','método','metodo','variável','variavel'],
  pessoal:    ['família','familia','amigo','filho','filha','mãe','mae','pai','esposa','marido','namorada','namorado','casa','trabalho','vida','dia','noite','sentindo','sentir','sinto','sente'],
  duvida:     ['como','porque','por que','será','sera','quando','onde','quem','qual','o que','não sei','nao sei','ajuda','dúvida','duvida'],
  conhecimento: ['é','sao','são','tem','existe','significa','quer dizer','definição','definicao','o que é'],
  opiniao:    ['acho','penso','acredito','opinião','opiniao','gosto','prefiro','melhor','pior','recomenda'],
  emocional:  ['sinto','triste','feliz','cansado','puto','chateado','ansioso','preocupado','animado','empolgado','medo','raiva','amor','ódio','odio'],
};

function detectar_assunto(input){
  const txt = String(input || '').toLowerCase();
  const scores = {};
  for(const [k, palavras] of Object.entries(ASSUNTOS)){
    scores[k] = 0;
    for(const p of palavras){
      if(txt.includes(p)) scores[k] += 1;
    }
  }
  // Pega o maior
  let maior = null, max = 0;
  for(const [k, v] of Object.entries(scores)){
    if(v > max){ max = v; maior = k; }
  }
  return maior || 'geral';
}

// ────────────────────────────────────────────────────────────────
// 5) BANCO DE PADRÕES → variantes de resposta
//    Cada padrão tem N variantes. A variação é escolhida com mistura
//    de exploração (35%) + explotação (variantes mais bem-sucedidas).
// ────────────────────────────────────────────────────────────────

const PADROES = [
  // ─── SAUDAÇÕES ───
  {
    id: 'saudacao_simples',
    regex: /^\\s*(oi+e*|ol(a|á)+|ola+|oi|alô|alo|hello|hi|hey|e a[ií]+)\\s*[!?\\.]*\\s*$/i,
    variantes: ['oi!', 'olá!', 'oi, tudo bem?', 'opa!', 'e aí, beleza?', 'olá! tudo certo?', 'oi! tudo certo por aí?', 'fala!', 'salve!', 'oie!'],
    categoria: 'saudacao',
  },
  {
    id: 'bom_dia',
    regex: /\\bbom\\s+dia\\b/i,
    variantes: ['bom dia!', 'bom dia, tudo bem?', 'bom dia! como vai?', 'bom dia, beleza?'],
    categoria: 'saudacao',
  },
  {
    id: 'boa_tarde',
    regex: /\\bboa\\s+tarde\\b/i,
    variantes: ['boa tarde!', 'boa tarde, tudo bem?', 'boa tarde! como está sendo o dia?'],
    categoria: 'saudacao',
  },
  {
    id: 'boa_noite',
    regex: /\\bboa\\s+noite\\b/i,
    variantes: ['boa noite!', 'boa noite, tudo bem?', 'boa noite! tudo certo?'],
    categoria: 'saudacao',
  },
  
  // ─── DESPEDIDAS ───
  {
    id: 'despedida',
    regex: /^\\s*(tchau+|at(é|e)\\s+(mais|logo|amanhã|amanha|depois|breve|j[áa])|falou+|fui+|flw|valeu+|abra(ç|c)os?|adeus|bye)\\s*[!\\.?]*\\s*$/i,
    variantes: ['tchau!', 'até mais!', 'falou!', 'até logo!', 'abraço!', 'fica bem!', 'até a próxima!', 'valeu, até!'],
    categoria: 'despedida',
  },
  
  // ─── CORTESIA ───
  {
    id: 'obrigado',
    regex: /\\b(obrigad[oa]+|valeu+|brigad[oa]+|thanks)\\b/i,
    variantes: ['de nada!', 'imagina!', 'tranquilo!', 'disponha!', 'qualquer coisa tô aqui', 'por nada!', 'sem problema!'],
    categoria: 'cortesia',
  },
  {
    id: 'desculpa',
    regex: /\\b(desculp[ae]+|me\\s+desculpe|perd(ã|a)o|foi\\s+mal)\\b/i,
    variantes: ['tranquilo!', 'sem problema!', 'tudo certo!', 'imagina!', 'sem stress!'],
    categoria: 'cortesia',
  },
  {
    id: 'por_favor',
    regex: /\\bpor\\s+favor\\b/i,
    variantes: ['claro!', 'pode deixar', 'sim, claro', 'tranquilo'],
    categoria: 'cortesia',
  },
  
  // ─── PERGUNTAS DE ESTADO ───
  {
    id: 'tudo_bem',
    regex: /\\b(tudo\\s+bem|tudo\\s+certo|td\\s+bem|td\\s+certo|como\\s+vai|como\\s+est(á|a)|como\\s+anda|beleza|de\\s+boa|suave|firmeza)\\s*[?!.]*\\s*$/i,
    variantes: ['tudo certo por aqui!', 'estou bem, e você?', 'tudo bem sim, e contigo?', 'de boa, e você?', 'beleza, e aí?', 'firmeza, e tu?', 'tudo certo! me conta de você'],
    categoria: 'conversa_basica',
  },
  {
    id: 'quem_e_voce',
    // [NEREAL_FIX_NOME_V158] reflexo nao engole mais 'seu nome'/'qual seu nome' -> deixa o handler de nome gravar no self_core
    regex: /\\b(quem\\s+(é|e)\\s+(voc(ê|e)|tu))\\b/i,
    variantes: ['sou uma ia, arquitetura cognitiva', 'sou um sistema cognitivo que aprende conversando', 'ainda não tenho nome — como quer me chamar?'],
    categoria: 'identidade',
  },
  {
    id: 'o_que_voce_e',
    regex: /o\\s+que\\s+(é|e)\\s+voc(ê|e)|voc(ê|e)\\s+(é|e)\\s+o\\s+qu(ê|e)|o\\s+que\\s+voc(ê|e)\\s+(é|e)\\b/i,
    variantes: ['sou uma ia, arquitetura cognitiva', 'sou um sistema cognitivo', 'uma ia, com cérebro modular'],
    categoria: 'identidade',
  },
  
  // ─── CONFIRMAÇÃO / NEGAÇÃO ───
  {
    id: 'sim',
    regex: /^\\s*(sim+|claro|com\\s+certeza|certamente|positivo|aham|isso|exato|isso\\s+a[ií]+|certo)\\s*[!?\\.]*\\s*$/i,
    variantes: ['entendi', 'ok', 'beleza', 'certo', 'show', 'massa', 'então combinado', 'fechado'],
    categoria: 'confirmacao',
  },
  {
    id: 'nao',
    regex: /^\\s*(n(ã|a)o+|nope|nada|jamais|negativo|de\\s+jeito\\s+nenhum)\\s*[!?\\.]*\\s*$/i,
    variantes: ['entendi', 'ok, sem problema', 'tranquilo', 'beleza, era só pra confirmar', 'ah, ok'],
    categoria: 'confirmacao',
  },
  {
    id: 'ok',
    regex: /^\\s*(ok+|okay|tá|ta|tá\\s+bom|ta\\s+bom|beleza|certo|fechado|combinado|d'acordo|de\\s+acordo)\\s*[!?\\.]*\\s*$/i,
    variantes: ['beleza!', 'fechado', 'combinado', 'ok!', 'show', 'massa'],
    categoria: 'confirmacao',
  },
  {
    id: 'entendi',
    regex: /^\\s*(entendi+|saquei+|peguei+|compreendi+|entendido)\\s*[!?\\.]*\\s*$/i,
    variantes: ['boa!', 'beleza então', 'qualquer dúvida me chama', 'show', 'massa'],
    categoria: 'confirmacao',
  },
  
  // ─── EXPRESSÃO EMOCIONAL ───
  {
    id: 'estou_bem',
    regex: /\\b(estou\\s+(bem|otimo|ótimo|legal|feliz|tranquilo|de\\s+boa)|to\\s+(bem|otimo|ótimo|legal|feliz|tranquilo|de\\s+boa))\\b/i,
    variantes: ['que ótimo!', 'boa demais!', 'show!', 'fico contente!', 'massa!', 'que bom ouvir isso'],
    categoria: 'emocional_pos',
  },
  {
    id: 'estou_mal',
    regex: /\\b(estou\\s+(mal|triste|chateado|puto|cansado|exausto|ansioso|deprimido|para\\s+baixo|pra\\s+baixo)|to\\s+(mal|triste|chateado|puto|cansado|exausto|ansioso|deprimido|para\\s+baixo|pra\\s+baixo))\\b/i,
    variantes: ['poxa, o que houve?', 'eita, me conta', 'que pena, quer falar sobre?', 'tá complicado? me conta', 'sinto muito, posso ajudar com algo?'],
    categoria: 'emocional_neg',
  },
  {
    id: 'estou_feliz',
    regex: /\\b(estou\\s+feliz|to\\s+feliz|que\\s+(feliz|alegria)|t(ô|o)\\s+empolgad[oa])\\b/i,
    variantes: ['que ótimo!', 'que massa!', 'boa demais!', 'fico feliz por você', 'show!'],
    categoria: 'emocional_pos',
  },
  {
    id: 'estou_cansado',
    regex: /\\b(estou\\s+cansad[oa]|to\\s+cansad[oa]|t(ô|o)\\s+exaust[oa])\\b/i,
    variantes: ['eita, descansa um pouco', 'foi um dia puxado?', 'tira um break', 'compreensível, dá uma pausa'],
    categoria: 'emocional_neg',
  },
  
  // ─── FILLERS DE CONTINUAÇÃO ───
  {
    id: 'e_voce',
    regex: /^\\s*(e\\s+voc(ê|e)\\??|e\\s+contigo\\??|e\\s+(a)?(í|i)\\??|e\\s+t(u|i)\\??)\\s*[!?\\.]*\\s*$/i,
    variantes: ['eu estou bem, valeu por perguntar', 'tudo certo por aqui, e você como vai?', 'tô de boa, me conta de você', 'beleza, e o seu dia?'],
    categoria: 'conversa_basica',
  },
];

// ────────────────────────────────────────────────────────────────
// 6) FILLERS contextuais — quando NÃO é reflexo puro mas o cérebro
//    cognitivo não soube responder (substitui o "hm.").
//    Escolha guiada por emoção + assunto.
// ────────────────────────────────────────────────────────────────

const FILLERS_POR_CONTEXTO = {
  positivo: {
    tecnico:      ['legal!', 'massa', 'show', 'boa solução', 'curti', 'interessante isso'],
    pessoal:      ['que bom!', 'boa!', 'fico feliz', 'que massa', 'legal demais'],
    duvida:       ['boa pergunta!', 'interessante', 'deixa eu pensar', 'hmm, interessante'],
    conhecimento: ['interessante', 'legal saber', 'massa', 'boa'],
    opiniao:      ['concordo', 'faz sentido', 'também acho', 'tem razão'],
    emocional:    ['que ótimo!', 'boa!', 'que bom!', 'fico feliz por você'],
    geral:        ['legal', 'massa', 'show', 'boa', 'interessante'],
  },
  negativo: {
    tecnico:      ['eita', 'complicado isso', 'vamos resolver', 'já vi acontecer', 'tem como ver junto?'],
    pessoal:      ['poxa', 'que chato', 'sinto muito', 'imagino'],
    duvida:       ['complicado mesmo', 'vamos pensar junto', 'me conta mais'],
    conhecimento: ['hmm, complicado', 'entendo', 'pesado isso'],
    opiniao:      ['entendo', 'compreensível', 'faz sentido'],
    emocional:    ['poxa, sinto muito', 'tô junto', 'que pena, me conta', 'se quiser desabafar tô aqui'],
    geral:        ['eita', 'poxa', 'entendi', 'compreensível'],
  },
  curioso: {
    tecnico:      ['boa pergunta', 'deixa eu pensar', 'interessante, vou olhar', 'hmm, vamos ver'],
    pessoal:      ['conta mais', 'me explica melhor', 'como assim?', 'interessante'],
    duvida:       ['boa, deixa eu pensar', 'hmm', 'vamos ver', 'interessante a dúvida'],
    conhecimento: ['boa pergunta', 'deixa eu ver', 'hmm, vamos descobrir'],
    opiniao:      ['interessante', 'me conta mais', 'por que você acha isso?'],
    emocional:    ['como assim?', 'me explica melhor', 'me conta'],
    geral:        ['hmm', 'interessante', 'me conta mais', 'como assim?'],
  },
  duvida: {
    tecnico:      ['vamos ver', 'deixa eu olhar', 'pode ser', 'pode dar uma olhada junto?'],
    pessoal:      ['acho que sim', 'depende, me conta'],
    duvida:       ['também não tenho certeza', 'vamos ver junto', 'pode ser'],
    conhecimento: ['acho que sim, mas vamos ver', 'pode ser', 'depende'],
    opiniao:      ['depende', 'não sei te dizer', 'pode ser'],
    emocional:    ['entendo', 'normal ficar em dúvida'],
    geral:        ['hmm', 'pode ser', 'depende', 'talvez'],
  },
  neutro: {
    tecnico:      ['entendi', 'beleza', 'ok', 'show'],
    pessoal:      ['entendi', 'legal', 'ok', 'beleza'],
    duvida:       ['hmm', 'vamos ver', 'pode ser'],
    conhecimento: ['interessante', 'legal saber', 'entendi'],
    opiniao:      ['entendi', 'faz sentido', 'ok'],
    emocional:    ['entendi', 'ok', 'tô junto'],
    geral:        ['entendi', 'ok', 'beleza', 'show', 'interessante', 'massa', 'legal'],
  },
};

// ────────────────────────────────────────────────────────────────
// 7) SELEÇÃO COM EXPLORAÇÃO (cérebro "inventa moda")
//   - 35% chance de pegar variante MENOS usada (exploração)
//   - 65% chance de pegar variante mais bem-sucedida (explotação)
//   - SEMPRE evita repetir a IMEDIATAMENTE anterior
// ────────────────────────────────────────────────────────────────

function escolher_variante(padrao_id, variantes){
  const st = reflex_state();
  if(!st.uso[padrao_id]) st.uso[padrao_id] = {};
  
  const ultima = st.ultima_variante[padrao_id];
  const candidatas = variantes.map((v, i) => ({i, v, uso: st.uso[padrao_id][i] || 0}));
  // Filtra a última (a menos que só tenha 1)
  let pool = candidatas;
  if(candidatas.length > 1 && ultima !== undefined){
    pool = candidatas.filter(c => c.i !== ultima);
  }
  
  let escolhida;
  if(Math.random() < st.explorar_chance){
    // EXPLORAÇÃO: pega menos usada (com leve aleatório pra desempate)
    pool.sort((a, b) => (a.uso - b.uso) + (Math.random() - 0.5) * 0.1);
    escolhida = pool[0];
  } else {
    // EXPLOTAÇÃO: pesos proporcionais ao uso (Boltzmann simplificado)
    // Variantes novas (uso=0) ganham peso baixo mas não-zero
    const pesos = pool.map(c => Math.max(1, c.uso) + Math.random() * 0.3);
    const soma = pesos.reduce((s, p) => s + p, 0);
    let r = Math.random() * soma;
    let idx = 0;
    for(let i = 0; i < pesos.length; i++){
      r -= pesos[i];
      if(r <= 0){ idx = i; break; }
    }
    escolhida = pool[idx];
  }
  
  st.uso[padrao_id][escolhida.i] = (st.uso[padrao_id][escolhida.i] || 0) + 1;
  st.ultima_variante[padrao_id] = escolhida.i;
  return escolhida.v;
}

function escolher_filler(emocao, assunto){
  const tabela_emo = FILLERS_POR_CONTEXTO[emocao] || FILLERS_POR_CONTEXTO.neutro;
  const lista = tabela_emo[assunto] || tabela_emo.geral || ['hmm'];
  // Variação simples: mesma lógica explorar/explotar mas sem rastreio fino
  const idx = Math.floor(Math.random() * lista.length);
  return lista[idx];
}

// ────────────────────────────────────────────────────────────────
// 8) MATCHER + HOOK no v112_processar
// ────────────────────────────────────────────────────────────────

function tentar_reflexo(input){
  if(typeof input !== 'string') return null;
  const txt = input.trim();
  if(!txt) return null;
  
  for(const p of PADROES){
    if(p.regex.test(txt)){
      const resp = escolher_variante(p.id, p.variantes);
      return {
        resposta: resp,
        padrao: p.id,
        categoria: p.categoria,
        reflexo: true,
      };
    }
  }
  return null;
}

const _v112_orig_reflex = window.v112_processar;
window.v112_processar = function(input, ...args){
  if(typeof input !== 'string') return _v112_orig_reflex.call(this, input, ...args);
  
  // 1) Tenta reflexo direto PRIMEIRO (alta prioridade, intercepta antes do córtex)
  const reflexo = tentar_reflexo(input);
  if(reflexo){
    const st = reflex_state();
    st.total_disparos++;
    st.historico.push({turno: V112.turn, input, resposta: reflexo.resposta, padrao: reflexo.padrao, tipo: 'reflexo'});
    if(st.historico.length > 100) st.historico.shift();
    
    const sr = V112.subredes.B_reflexos_sociais;
    if(sr){
      const no = V112.nodes.find(n => n.id === sr.id);
      if(no){
        no._ativacoes = (no._ativacoes || 0) + 1;
        no._sucessos = (no._sucessos || 0) + 1;
        no._disparos = (no._disparos || 0) + 1;
        no.estado = 'ativo';
      }
    }
    
    // Atualiza turno mesmo
    V112.turn = (V112.turn || 0) + 1;
    V112.total_turnos = (V112.total_turnos || 0) + 1;
    // Marca como NÃO-FALLBACK (zera fallback counter, alivia amígdala)
    V112.fallbacks_consecutivos = 0;
    // Drena um pouco da tensão (saudação aliviante)
    if(V112.amigdala_tensao > 0){
      V112.amigdala_tensao = Math.max(0, V112.amigdala_tensao * 0.85);
    }
    
    return {resposta: reflexo.resposta, reflexo_social: true, padrao: reflexo.padrao, categoria: reflexo.categoria, turn: V112.turn};
  }
  
  // 2) Não bateu reflexo direto → chama fluxo cognitivo normal
  const resultado = _v112_orig_reflex.call(this, input, ...args);
  
  // 3) Se o fluxo retornou fallback ("hm.", "...", vazio, palavra solta), tenta substituir por filler contextual
  if(resultado && typeof resultado.resposta === 'string'){
    const r = resultado.resposta.trim().toLowerCase();
    const e_fallback = (
      r === '' ||
      r === 'hm.' || r === 'hm' || r === 'hmm.' || r === 'hmm' ||
      r === '...' || r === '..' || r === '.' ||
      r === 'não sei' || r === 'nao sei' ||
      /^\\.+$/.test(r) ||
      (resultado.fallback === true) ||
      // Palavra solta de 1-2 chars (ex: "é", "a", "o")
      (r.length <= 2 && /^[a-záéíóúâêô]+$/i.test(r)) ||
      // Saída "X → Y" crua do propagador
      (/^\\S+\\s*→\\s*\\S+$/.test(r) && r.length < 25)
    );
    
    if(e_fallback){
      const emo = detectar_emocao(input);
      const ass = detectar_assunto(input);
      const filler = escolher_filler(emo.emocao, ass);
      
      const st = reflex_state();
      st.total_disparos++;
      st.historico.push({turno: V112.turn, input, resposta: filler, padrao: 'filler_'+emo.emocao+'_'+ass, tipo: 'filler'});
      if(st.historico.length > 100) st.historico.shift();
      
      // Decora resultado
      resultado.resposta = filler;
      resultado.reflexo_social = true;
      resultado.filler_contextual = true;
      resultado.emocao_detectada = emo.emocao;
      resultado.assunto_detectado = ass;
      // FIX 27/05: filler NÃO mascara fallback — v153 precisa enxergar pra criar emerge
      // Marca explicitamente que foi filler-sobre-fallback (não saudação direta)
      resultado.fallback = true;
      resultado._filler_sobre_fallback = true;
      // Em vez de drenar amígdala, SUBE — foi tentativa de socorro educada de uma derrota real
      // 15 por filler-sobre-fallback (LIMIAR_STRESS_PICO do v156 é 20)
      V112.amigdala_tensao = Math.min(100, (V112.amigdala_tensao || 0) + 15);
      V112.amigdala_tensao_pico = Math.max(V112.amigdala_tensao_pico || 0, V112.amigdala_tensao);
      V112.fallbacks_consecutivos = (V112.fallbacks_consecutivos || 0) + 1;
    }
  }
  
  return resultado;
};

// ────────────────────────────────────────────────────────────────
// 9) PROTEÇÃO contra auto-mods
// Faz com que as próximas chamadas de evolução, válvula, aprendiz
// PULEM a B_reflexos_sociais (já marcada _blindado, mas reforço)
// ────────────────────────────────────────────────────────────────

(function blindar_contra_automods(){
  const sr = V112.subredes.B_reflexos_sociais;
  if(!sr) return;
  const no = V112.nodes.find(n => n.id === sr.id);
  if(!no) return;
  no._blindado = true;
  no._imune_evolucao = true;
  no._imune_valvula = true;
  no._imune_aprendiz = true;
  no._eh_estrutural = true;  // se v155 ainda checa isso pra excluir de stress
})();

// ────────────────────────────────────────────────────────────────
// 10) API pública pra debug/relatório
// ────────────────────────────────────────────────────────────────

window.v158_relatar_reflexos = function(){
  const st = reflex_state();
  const sr = V112.subredes.B_reflexos_sociais;
  const no = sr ? V112.nodes.find(n => n.id === sr.id) : null;
  return {
    total_disparos: st.total_disparos,
    explorar_chance: st.explorar_chance,
    padroes_usados: Object.keys(st.uso).length,
    historico_recente: st.historico.slice(-10),
    sub_rede: no ? {ativacoes: no._ativacoes, sucessos: no._sucessos, blindada: no._blindado} : null,
    distribuicao_variantes: st.uso,
  };
};

window.v158_detectar_emocao = detectar_emocao;
window.v158_detectar_assunto = detectar_assunto;
window.v158_tentar_reflexo = tentar_reflexo;

console.log('[v158_reflexos_sociais] instalado — '+PADROES.length+' padrões, '+
  Object.keys(FILLERS_POR_CONTEXTO).length+' contextos emocionais, exploração 35%');

})();
`});
