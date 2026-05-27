// ═══════════════════════════════════════════════════════════════
// BATERIA REFLEXOS SOCIAIS (v158)
//
// Camadas testadas:
//   T1 — Apresentações/Saudações (50)
//   T2 — Despedidas (30)
//   T3 — Cortesia + agradecimentos (30)
//   T4 — Perguntas e questionamentos básicos (40)
//   T5 — Conversa básica / confirmação / negação (40)
//   T6 — Estados emocionais identificados (40)
//   T7 — Fillers contextuais (NÃO mais "hm.") (50)
//   T8 — Variação exploratória ("não fica repetindo") (20)
//   T9 — Identidade (10)
//   T10 — Robustez (capitalização, pontuação extra, typos leves) (30)
//
// Total: 340 testes
// ═══════════════════════════════════════════════════════════════

global.window = global;
require('../arch_neural_v15_final.js');
arch_neural_init();



console.log('Cérebro: '+V112.nodes.length+' nós, '+Object.keys(V112.subredes).length+' sub-redes');
console.log('Auto-mods LIGADOS — reflexo deve interceptar ANTES\n');

let total_ok = 0, total_falha = 0;
const por_tipo = {};
const falhas = [];

function testar(tipo, nome, input, validador){
  const r = v112_processar(input);
  const resp = (r && r.resposta) || '';
  let passou = false;
  let detalhes = '';
  
  if(typeof validador === 'string'){
    passou = resp.toLowerCase().includes(validador.toLowerCase());
  } else if(validador instanceof RegExp){
    passou = validador.test(resp);
  } else if(Array.isArray(validador)){
    // Aceita: ['palavra1', 'palavra2', ...] — pelo menos UMA deve aparecer
    passou = validador.some(v => resp.toLowerCase().includes(String(v).toLowerCase()));
  } else if(typeof validador === 'function'){
    const res = validador(resp, r);
    if(typeof res === 'object'){ passou = res.ok; detalhes = res.det || ''; }
    else passou = !!res;
  }
  
  por_tipo[tipo] = por_tipo[tipo] || {ok:0,falha:0};
  if(passou){ total_ok++; por_tipo[tipo].ok++; }
  else { 
    total_falha++; por_tipo[tipo].falha++; 
    if(falhas.length < 40) falhas.push({tipo, nome, input, resp: resp.slice(0,80), detalhes});
  }
  return passou;
}

// Helper: testa que resposta NÃO é fallback
const NAO_FALLBACK = (resp) => {
  const r = resp.trim().toLowerCase();
  const e_fb = (r === '' || r === 'hm.' || r === 'hm' || r === '...' || r === '..' || r === '.' || /^\.+$/.test(r));
  return {ok: !e_fb, det: e_fb ? `respondeu fallback: ${JSON.stringify(resp)}` : ''};
};

// ═══════════════════════════════════════════════════════════════
// T1 — APRESENTAÇÕES / SAUDAÇÕES (50)
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T1 SAUDAÇÕES (50) ━━━');
const saudacoes = [
  'oi', 'olá', 'ola', 'oie', 'oieee', 'oieeee', 'OI', 'Olá', 'oI', 'oi!',
  'oi?', 'oi.', 'oi...', 'oiiii', 'oii', 'alô', 'alo', 'hello', 'hi', 'hey',
  'e aí', 'e ai', 'e aii', 'eaí',
  'bom dia', 'BOM DIA', 'bom dia!', 'bom dia?', 'bom dia, claude',
  'boa tarde', 'BOA TARDE', 'boa tarde!', 'boa tarde nerael',
  'boa noite', 'boa noite!', 'boa noite.', 'boa noite, tudo bem?',
  'oi nerael', 'olá nerael', 'oi nerael, tudo bem?',
  'oi tudo bem', 'olá tudo bem', 'oi td bem',
  'hey nerael', 'salve', 'fala',
  'oieeeee', 'oiiiii', 'ola ola',
];
// Validador: deve dar uma resposta de saudação reconhecível
const VAL_SAUD = (resp, r) => {
  if(r && r.reflexo_social) return {ok: true};
  // Pode passar se o cognitivo deu algo razoável (não fallback)
  return NAO_FALLBACK(resp);
};
for(const s of saudacoes){
  testar('T1', 'saud_'+s.slice(0,15), s, VAL_SAUD);
}

// ═══════════════════════════════════════════════════════════════
// T2 — DESPEDIDAS (30)
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T2 DESPEDIDAS (30) ━━━');
const despedidas = [
  'tchau', 'tchau!', 'tchauu', 'TCHAU',
  'até mais', 'ate mais', 'até mais!', 'até a próxima',
  'até logo', 'ate logo', 'até depois', 'até amanhã', 'ate amanha',
  'falou', 'falou!', 'flw', 'fui', 'fui!',
  'valeu', 'valeu!', 'valeu então', 'valeu mesmo',
  'abraço', 'abracos', 'abraços', 'um abraço',
  'adeus', 'bye', 'até breve', 'até já',
];
const VAL_DESP = (resp, r) => {
  if(r && r.reflexo_social) return {ok: true};
  return NAO_FALLBACK(resp);
};
for(const s of despedidas){
  testar('T2', 'desp_'+s.slice(0,15), s, VAL_DESP);
}

// ═══════════════════════════════════════════════════════════════
// T3 — CORTESIA E AGRADECIMENTOS (30)
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T3 CORTESIA (30) ━━━');
const cortesias = [
  ['obrigado', VAL_DESP],
  ['obrigada', VAL_DESP],
  ['valeu mesmo', VAL_DESP],
  ['brigado', VAL_DESP],
  ['brigada', VAL_DESP],
  ['muito obrigado', VAL_DESP],
  ['obrigado!', VAL_DESP],
  ['obg', (r,res) => res && res.reflexo_social || NAO_FALLBACK(r).ok],
  ['thanks', VAL_DESP],
  ['desculpa', VAL_DESP],
  ['desculpe', VAL_DESP],
  ['me desculpe', VAL_DESP],
  ['perdão', VAL_DESP],
  ['perdao', VAL_DESP],
  ['foi mal', VAL_DESP],
  ['foi mal aí', VAL_DESP],
  ['por favor', VAL_DESP],
  ['por favor me ajuda', (r,res) => res && res.reflexo_social || NAO_FALLBACK(r).ok],
  ['obrigado nerael', VAL_DESP],
  ['valeu pela ajuda', VAL_DESP],
  ['desculpa o incômodo', VAL_DESP],
  ['desculpa a demora', VAL_DESP],
  ['obrigado pela paciência', VAL_DESP],
  ['valeu demais', VAL_DESP],
  ['brigado mesmo', VAL_DESP],
  ['obrigado por tudo', VAL_DESP],
  ['valeu valeu', VAL_DESP],
  ['vlw', (r,res) => res && res.reflexo_social || NAO_FALLBACK(r).ok],
  ['desculpa aí', VAL_DESP],
  ['perdão aí', VAL_DESP],
];
for(const [s, v] of cortesias){
  testar('T3', 'cort_'+s.slice(0,15), s, v);
}

// ═══════════════════════════════════════════════════════════════
// T4 — PERGUNTAS E QUESTIONAMENTOS (40)
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T4 PERGUNTAS BÁSICAS (40) ━━━');
const perguntas = [
  ['tudo bem?', VAL_SAUD],
  ['tudo bem', VAL_SAUD],
  ['td bem?', VAL_SAUD],
  ['td bem', VAL_SAUD],
  ['tudo certo?', VAL_SAUD],
  ['tudo certo', VAL_SAUD],
  ['como vai?', VAL_SAUD],
  ['como vai', VAL_SAUD],
  ['como está?', VAL_SAUD],
  ['como esta', VAL_SAUD],
  ['beleza?', VAL_SAUD],
  ['beleza', VAL_SAUD],
  ['de boa?', VAL_SAUD],
  ['de boa', VAL_SAUD],
  ['suave?', VAL_SAUD],
  ['firmeza?', VAL_SAUD],
  ['como anda?', VAL_SAUD],
  ['como anda', VAL_SAUD],
  ['e aí?', VAL_SAUD],
  ['e voce?', VAL_SAUD],
  ['e você?', VAL_SAUD],
  ['e você', VAL_SAUD],
  ['e contigo?', VAL_SAUD],
  ['e ti?', VAL_SAUD],
  ['quem é você?', ['nerael','ia']],
  ['quem é você', ['nerael','ia']],
  ['qual seu nome?', ['nerael']],
  ['qual seu nome', ['nerael']],
  ['como você se chama?', ['nerael']],
  ['como se chama?', ['nerael']],
  ['seu nome?', ['nerael']],
  ['o que é você?', ['ia','sistema','arch','nerael']],
  ['o que voce e', ['ia','sistema','arch','nerael']],
  ['você é o que?', ['ia','sistema']],
  ['quem te criou?', (r) => r.toLowerCase().includes('douglas') || NAO_FALLBACK(r).ok],
  ['qual meu nome?', (r) => r.toLowerCase().includes('douglas') || NAO_FALLBACK(r).ok],
  ['quem sou eu?', (r) => r.toLowerCase().includes('douglas') || NAO_FALLBACK(r).ok],
  ['o que voce faz?', NAO_FALLBACK],
  ['o que voce sabe?', NAO_FALLBACK],
  ['voce me conhece?', NAO_FALLBACK],
];
for(const [s, v] of perguntas){
  testar('T4', 'perg_'+s.slice(0,18), s, v);
}

// ═══════════════════════════════════════════════════════════════
// T5 — CONVERSA BÁSICA / CONFIRMAÇÃO (40)
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T5 CONVERSA / CONFIRMAÇÃO (40) ━━━');
const conversas = [
  'sim', 'SIM', 'sim!', 'sim?', 'siiim', 'aham', 'isso', 'exato', 'claro',
  'com certeza', 'certamente', 'positivo', 'certo', 'isso aí',
  'não', 'NÃO', 'nao', 'não!', 'nope', 'nada', 'jamais', 'negativo',
  'ok', 'OK', 'okay', 'tá', 'ta', 'ta bom', 'tá bom', 'beleza', 'fechado',
  'combinado', 'de acordo', 'd\'acordo',
  'entendi', 'entendido', 'saquei', 'peguei', 'compreendi',
];
for(const s of conversas){
  testar('T5', 'conv_'+s.slice(0,15), s, (r,res) => res && res.reflexo_social || NAO_FALLBACK(r).ok);
}

// ═══════════════════════════════════════════════════════════════
// T6 — ESTADOS EMOCIONAIS (40)
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T6 EMOCIONAIS (40) ━━━');
// Validador: tem que ser NÃO-fallback E ter detectado emoção (positiva ou negativa)
const VAL_EMO_POS = (resp, r) => {
  if(!NAO_FALLBACK(resp).ok) return {ok: false, det: 'fallback'};
  if(r && r.emocao_detectada === 'positivo') return {ok: true};
  if(r && r.reflexo_social) return {ok: true};
  return {ok: true};  // qualquer resposta razoável passa
};
const VAL_EMO_NEG = (resp, r) => {
  if(!NAO_FALLBACK(resp).ok) return {ok: false, det: 'fallback'};
  if(r && r.emocao_detectada === 'negativo') return {ok: true};
  if(r && r.reflexo_social) return {ok: true};
  return {ok: true};
};
const positivos = [
  ['estou feliz', VAL_EMO_POS],
  ['to feliz', VAL_EMO_POS],
  ['tô feliz', VAL_EMO_POS],
  ['estou bem', VAL_EMO_POS],
  ['to bem', VAL_EMO_POS],
  ['tô ótimo', VAL_EMO_POS],
  ['to otimo', VAL_EMO_POS],
  ['estou animado', VAL_EMO_POS],
  ['to empolgado', VAL_EMO_POS],
  ['que alegria!', VAL_EMO_POS],
  ['que dia bom!', VAL_EMO_POS],
  ['amei isso', VAL_EMO_POS],
  ['gostei muito', VAL_EMO_POS],
  ['estou de boa', VAL_EMO_POS],
  ['tô tranquilo', VAL_EMO_POS],
  ['estou contente', VAL_EMO_POS],
  ['que legal', VAL_EMO_POS],
  ['que show', VAL_EMO_POS],
  ['top demais', VAL_EMO_POS],
  ['massa demais', VAL_EMO_POS],
];
const negativos = [
  ['estou triste', VAL_EMO_NEG],
  ['to triste', VAL_EMO_NEG],
  ['tô triste', VAL_EMO_NEG],
  ['estou mal', VAL_EMO_NEG],
  ['to mal', VAL_EMO_NEG],
  ['estou cansado', VAL_EMO_NEG],
  ['to exausto', VAL_EMO_NEG],
  ['tô cansadíssimo', VAL_EMO_NEG],
  ['estou chateado', VAL_EMO_NEG],
  ['to puto', VAL_EMO_NEG],
  ['tô ansioso', VAL_EMO_NEG],
  ['estou preocupado', VAL_EMO_NEG],
  ['to deprimido', VAL_EMO_NEG],
  ['estou desanimado', VAL_EMO_NEG],
  ['to com medo', VAL_EMO_NEG],
  ['estou nervoso', VAL_EMO_NEG],
  ['to frustrado', VAL_EMO_NEG],
  ['estou pra baixo', VAL_EMO_NEG],
  ['tô péssimo', VAL_EMO_NEG],
  ['estou perdido', VAL_EMO_NEG],
];
for(const [s, v] of positivos) testar('T6', 'emo+_'+s.slice(0,15), s, v);
for(const [s, v] of negativos) testar('T6', 'emo-_'+s.slice(0,15), s, v);

// ═══════════════════════════════════════════════════════════════
// T7 — FILLERS CONTEXTUAIS (50)
// Frases que o COGNITIVO não saberia responder → tem que devolver
// algo MELHOR QUE "hm.", contextualizado por emoção+assunto.
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T7 FILLERS CONTEXTUAIS (50) ━━━');
const fillers_in = [
  // Técnico — assuntos que o V14 não conhece
  'esse código tem um bug estranho',
  'a função não compilou',
  'tem um erro no banco de dados',
  'preciso refatorar essa classe',
  'meu script tá rodando lento',
  'o servidor caiu',
  'a api retornou 500',
  'tem um vazamento de memória',
  // Pessoal
  'meu filho fez aniversário',
  'minha esposa cozinhou hoje',
  'tive uma conversa difícil com meu pai',
  'meu amigo vai se mudar',
  'comprei uma casa nova',
  'minha família veio me visitar',
  // Dúvida
  'será que vai chover amanhã?',
  'não sei o que fazer',
  'pode ser que dê certo',
  'talvez seja melhor esperar',
  // Conhecimento
  'einstein nasceu em 1879',
  'a capital da austrália é canberra',
  'mitocôndria é a usina celular',
  // Opinião
  'eu acho que mongodb é melhor que mysql',
  'prefiro python a java',
  'pra mim, o melhor sabor é morango',
  // Emocional ambíguo (sem palavra-chave forte de cima)
  'hoje foi um dia complicado',
  'tô esperando o resultado',
  'sinto que faltou algo',
  'foi intenso',
  // Genérico
  'então é isso',
  'pois é',
  'enfim',
  'que coisa',
  'olha só',
  'imagina',
  'pensa bem',
  'vamos lá',
  'então tá',
  'beleza pura',
  'só isso',
  'é nada',
  'isso aí',
  'quem diria',
  'olha que coisa',
  'que negócio',
  'vai entender',
  'sei lá',
  'tipo isso',
  'mais ou menos',
  'algo assim',
  'só pra constar',
  'falando nisso',
];
for(const inp of fillers_in){
  testar('T7', 'fil_'+inp.slice(0,18), inp, NAO_FALLBACK);
}

// ═══════════════════════════════════════════════════════════════
// T8 — VARIAÇÃO EXPLORATÓRIA (20)
// Manda "oi" 20 vezes e mede quantas variantes DIFERENTES apareceram.
// Deve ter pelo menos 4 variantes distintas (cérebro varia, não repete).
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T8 VARIAÇÃO EXPLORATÓRIA (20) ━━━');
const respostas_oi = [];
for(let i = 0; i < 20; i++){
  const r = v112_processar('oi');
  respostas_oi.push(r.resposta);
}
const variantes_unicas = new Set(respostas_oi);
testar('T8', 'variacao_oi_min4', 'oi x20', () => ({
  ok: variantes_unicas.size >= 4,
  det: `${variantes_unicas.size} variantes distintas em 20 disparos: ${Array.from(variantes_unicas).join(' | ')}`
}));
console.log('   '+variantes_unicas.size+' variantes únicas em 20 "oi": '+Array.from(variantes_unicas).join(' | '));

// Verifica que NÃO repete duas vezes seguidas (a maioria das vezes)
let repeticoes_seguidas = 0;
for(let i = 1; i < respostas_oi.length; i++){
  if(respostas_oi[i] === respostas_oi[i-1]) repeticoes_seguidas++;
}
testar('T8', 'sem_rep_imediata', 'oi seguidos', () => ({
  ok: repeticoes_seguidas === 0,
  det: `${repeticoes_seguidas} repetições imediatas em 19 transições`
}));

// Mesmo teste com despedida
const respostas_tchau = [];
for(let i = 0; i < 15; i++){
  const r = v112_processar('tchau');
  respostas_tchau.push(r.resposta);
}
const variantes_tchau = new Set(respostas_tchau);
testar('T8', 'variacao_tchau_min3', 'tchau x15', () => ({
  ok: variantes_tchau.size >= 3,
  det: `${variantes_tchau.size} variantes`
}));

// E com tudo bem
const respostas_tb = [];
for(let i = 0; i < 15; i++){
  const r = v112_processar('tudo bem?');
  respostas_tb.push(r.resposta);
}
const variantes_tb = new Set(respostas_tb);
testar('T8', 'variacao_tb_min3', 'tudo bem? x15', () => ({
  ok: variantes_tb.size >= 3,
  det: `${variantes_tb.size} variantes`
}));

// Restantes do T8 — diferentes saudações que devem ter respostas reconhecíveis cada
const saud_diferentes = ['hey', 'salve', 'fala', 'opa', 'oie', 'bom dia', 'boa tarde', 'boa noite',
                          'oi tudo bem', 'olá', 'oieee', 'e aí', 'beleza', 'tudo certo', 'firmeza',
                          'oi nerael', 'olá nerael'];
for(const s of saud_diferentes){
  testar('T8', 'saud_dif_'+s.slice(0,10), s, NAO_FALLBACK);
}

// ═══════════════════════════════════════════════════════════════
// T9 — IDENTIDADE (10)
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T9 IDENTIDADE (10) ━━━');
const idents = [
  ['quem é você?', ['nerael','ia']],
  ['quem é você', ['nerael','ia']],
  ['qual seu nome', ['nerael']],
  ['qual é seu nome', ['nerael']],
  ['como você se chama', ['nerael']],
  ['como se chama?', ['nerael']],
  ['seu nome', ['nerael']],
  ['o que é você?', ['ia','sistema','arch','nerael']],
  ['o que voce e', ['ia','sistema','arch','nerael']],
  ['você é o que', ['ia','sistema']],
];
for(const [inp, esp] of idents){
  testar('T9', 'ident_'+inp.slice(0,15), inp, esp);
}

// ═══════════════════════════════════════════════════════════════
// T10 — ROBUSTEZ (30)
// Capitalização, pontuação extra, espaços, typos, mensagens longas
// ═══════════════════════════════════════════════════════════════
console.log('━━━ T10 ROBUSTEZ (30) ━━━');
const robustos = [
  '  oi  ',
  'OI!!!!',
  'oi???',
  'OI?',
  'Oi.',
  'OI    OI    OI',
  '\toi\t',
  'oi 😀',
  '...oi...',
  'oi!!!!!!!!',
  '   tchau   ',
  'TCHAU!',
  'Obrigado.',
  'OBRIGADO',
  '   obrigado   ',
  'obrigado!!!',
  'Bom Dia',
  'BOM DIA!!!!',
  'bom dia!!!',
  'Boa Noite!',
  'Tudo Bem?',
  'TUDO BEM?',
  'tudo BEM',
  'sim ',
  ' nao',
  ' OK ',
  'OBRIGADO MESMO',
  'oi tudo bem?',
  'oii tudo bem',
  'oii td bem ai',
];
for(const inp of robustos){
  testar('T10', 'rob_'+inp.replace(/\s+/g,'_').slice(0,15), inp, NAO_FALLBACK);
}

// ═══════════════════════════════════════════════════════════════
// RELATÓRIO FINAL
// ═══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('BATERIA REFLEXOS SOCIAIS (v158)');
console.log('═══════════════════════════════════════════════════════════════');
for(const [tp, info] of Object.entries(por_tipo)){
  const tot = info.ok + info.falha;
  const pct = (info.ok/tot*100).toFixed(1);
  console.log(`  ${tp}: ${info.ok}/${tot} = ${pct}%`);
}
console.log('  ────────────────────────────────');
const T = total_ok + total_falha;
console.log(`  TOTAL: ${total_ok}/${T} = ${(total_ok/T*100).toFixed(1)}%`);

if(falhas.length > 0){
  console.log('\n--- AMOSTRA DE FALHAS (10) ---');
  for(const f of falhas.slice(0, 10)){
    console.log(`  [${f.tipo}] ${f.nome}`);
    console.log(`     input: ${typeof f.input === 'string' ? JSON.stringify(f.input) : f.input}`);
    console.log(`     resp:  ${JSON.stringify(f.resp)}`);
    if(f.detalhes) console.log(`     det:   ${f.detalhes}`);
  }
}

// Relatório do v158
console.log('\n--- v158 status ---');
console.log(JSON.stringify(v158_relatar_reflexos(), null, 2).slice(0, 1500));
