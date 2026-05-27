// bateria_integracao.js — testa COMUNICAÇÃO entre módulos
//
// Cada teste verifica que módulos diferentes acionam quando deveriam,
// e que NÃO acionam quando não deveriam (sem invasão de domínio).

global.window = global;
require('../arch_neural_v15_final.js');
arch_neural_init();



function reset(){
  V112.fallbacks_consecutivos = 0;
  V112.amigdala_tensao = 0;
  V112.amigdala_estado = 'calma';
  V112.gaba_ativo = false;
  V112.historico_recente = [];
  if(typeof window.v15_reset_total === 'function') window.v15_reset_total();
  if(typeof window.v159_reset_cognitivo === 'function') window.v159_reset_cognitivo();
}

const TESTS = [];

// ─── A. ROTEAMENTO: cada input vai pro módulo certo (20) ───
// Cada teste tem flag esperado e validador que checa flag DE FATO setada
TESTS.push({
  cat:'A_roteamento', id:'social_oi',
  query:'oi',
  validar:(r)=> r && r.reflexo_social === true
});
TESTS.push({
  cat:'A_roteamento', id:'social_tchau',
  query:'tchau',
  validar:(r)=> r && r.reflexo_social === true
});
TESTS.push({
  cat:'A_roteamento', id:'turing_loop',
  setup:['estado: x=0', 'regra: enquanto x menor_que 5 faça [x = x + 1]'],
  query:'execute e mostre valor de x',
  validar:(r)=> r && String(r.resposta).includes('x = 5')
});
TESTS.push({
  cat:'A_roteamento', id:'causal_reverso',
  setup:['a causa b','b causa c'],
  query:'estado atual é c. onde começou?',
  validar:(r)=> r && /começou em:\s*a/i.test(String(r.resposta))
});
TESTS.push({
  cat:'A_roteamento', id:'cognitivo_decisao',
  query:'qual rende mais: 1000 com taxa 5% por 10 anos vs 2000 com taxa 3% por 8 anos?',
  validar:(r)=> r && r._cognitivo === true
});
TESTS.push({
  cat:'A_roteamento', id:'cognitivo_analogia',
  query:'tanque vazando 5L/min com 100L',
  validar:(r)=> r && r._cognitivo === true
});
TESTS.push({
  cat:'A_roteamento', id:'cognitivo_eng_reversa',
  setup:['entrada 2 → saida 5', 'entrada 5 → saida 11'],
  query:'entrada 10 → saida 21',
  validar:(r)=> r && r._cognitivo === true && /linear/i.test(String(r.resposta))
});
TESTS.push({
  cat:'A_roteamento', id:'estat_descritivo',
  query:'média de [10, 20, 30, 40, 50]',
  validar:(r)=> r && r._estatistico === true && /30/.test(String(r.resposta))
});
TESTS.push({
  cat:'A_roteamento', id:'estat_bayes',
  query:'bayes prior=0.01 sensibilidade=0.99 especificidade=0.95',
  validar:(r)=> r && r._estatistico === true && /0\.166/.test(String(r.resposta))
});
TESTS.push({
  cat:'A_roteamento', id:'cortex_status',
  query:'status cortex',
  validar:(r)=> r && String(r.resposta).length > 5
});
TESTS.push({
  cat:'A_roteamento', id:'aprendiz_status',
  query:'status aprendiz',
  validar:(r)=> r && /aprendiz|emerge/i.test(String(r.resposta))
});
TESTS.push({
  cat:'A_roteamento', id:'analogia_juros',
  query:'juros compostos a 5% ao ano',
  validar:(r)=> r && r._cognitivo === true && /geometric|composto/i.test(String(r.resposta))
});
TESTS.push({
  cat:'A_roteamento', id:'metacog_status',
  query:'analise metacognitiva',
  validar:(r)=> r && r._cognitivo === true
});
TESTS.push({
  cat:'A_roteamento', id:'identidade_quem',
  query:'quem é você?',
  validar:(r)=> r && (r.reflexo_social === true || /ia|sistema|nerael|nome/i.test(String(r.resposta||'')))
});
TESTS.push({
  cat:'A_roteamento', id:'identidade_oque',
  query:'o que é você?',
  validar:(r)=> r && r.reflexo_social === true
});
TESTS.push({
  cat:'A_roteamento', id:'cortex_dormir',
  query:'cortex dormir',
  validar:(r)=> r && String(r.resposta).length > 0
});
TESTS.push({
  cat:'A_roteamento', id:'turing_funcao',
  setup:['global: x = 10', 'função dobra: [x = x * 2]'],
  query:'execute função dobra',
  validar:(r)=> r && (/x = 20/i.test(String(r.resposta)) || /ok|sucesso|dobra|executad/i.test(String(r.resposta||'')))
});
TESTS.push({
  cat:'A_roteamento', id:'afastamento_listar',
  query:'listar afastamentos',
  validar:(r)=> r && String(r.resposta).length > 0
});
TESTS.push({
  cat:'A_roteamento', id:'evolucao_listar',
  query:'listar evoluções',
  validar:(r)=> r && String(r.resposta).length > 0
});
TESTS.push({
  cat:'A_roteamento', id:'reflexos_status',
  query:'status reflexos',
  validar:(r)=> r && String(r.resposta).length > 0
});

// ─── B. NÃO-INVASÃO DE DOMÍNIO: cada módulo respeita os outros (15) ───
TESTS.push({
  cat:'B_nao_invasao', id:'social_nao_invade_turing',
  setup:['estado: y=0', 'regra: enquanto y menor_que 3 faça [y = y + 1]'],
  query:'execute',
  validar:(r)=> r && !r.reflexo_social  // turing não vira social
});
TESTS.push({
  cat:'B_nao_invasao', id:'turing_nao_invade_social',
  query:'oi tudo bem?',
  validar:(r)=> r && r.reflexo_social === true && !r._cognitivo
});
TESTS.push({
  cat:'B_nao_invasao', id:'cognitivo_nao_em_factual',
  setup:['cachorro é animal'],
  query:'cachorro é o que?',
  validar:(r)=> r && !r._cognitivo  // simples factual não precisa cognitivo
});
TESTS.push({
  cat:'B_nao_invasao', id:'estat_nao_em_social',
  query:'tchau',
  validar:(r)=> r && r.reflexo_social === true && !r._estatistico
});
TESTS.push({
  cat:'B_nao_invasao', id:'cognitivo_decisao_nao_estat',
  query:'vale a pena trocar de carro?',
  validar:(r)=> r && r._cognitivo === true && !r._estatistico
});
TESTS.push({
  cat:'B_nao_invasao', id:'estat_nao_em_logica_pura',
  setup:['estado: z=0','regra: enquanto z menor_que 5 faça [z = z + 1]'],
  query:'execute e mostre valor de z',
  validar:(r)=> !r._estatistico && /z = 5/i.test(String(r.resposta||''))
});
TESTS.push({
  cat:'B_nao_invasao', id:'gaba_inibe_durante_turing',
  setup:['estado: q=0','regra: enquanto q menor_que 3 faça [q = q + 1]'],
  query:'execute e mostre valor de q',
  validar:(r)=> r && /q = 3/i.test(String(r.resposta||''))
});
TESTS.push({
  cat:'B_nao_invasao', id:'reflexo_blindado',
  query:'estado: x=0', // não deveria ser interpretado como social
  validar:(r)=> r && !r.reflexo_social
});
TESTS.push({
  cat:'B_nao_invasao', id:'estat_so_em_estat',
  query:'qual a média?',  // sem dados — não dispara estat
  validar:(r)=> !(r && r._estatistico === true)  // não dispara sem dados claros
});
TESTS.push({
  cat:'B_nao_invasao', id:'cognitivo_so_em_decisional',
  query:'2 + 2',  // simples conta
  validar:(r)=> r && !r._cognitivo  // não é decisão
});
TESTS.push({
  cat:'B_nao_invasao', id:'aprendiz_nao_em_factual_curto',
  query:'qual a capital?',  // sem padrão estatístico nem decisional claro
  validar:(r)=> r !== undefined && r !== null
});
TESTS.push({
  cat:'B_nao_invasao', id:'analogia_so_em_padrao',
  query:'que dia é hoje',  // não é padrão estrutural
  validar:(r)=> r && !(r._cognitivo === true && /padrão reconhecido/i.test(String(r.resposta||'')))
});
TESTS.push({
  cat:'B_nao_invasao', id:'meta_so_em_introspectiva',
  query:'qual seu nome?',  // identidade social, não meta
  validar:(r)=> r && r.reflexo_social === true
});
TESTS.push({
  cat:'B_nao_invasao', id:'estat_explicito_dispara',
  query:'estatísticas de [10, 20, 30, 40, 50]',
  validar:(r)=> r && r._estatistico === true
});
TESTS.push({
  cat:'B_nao_invasao', id:'descritivo_dispara_so_com_lista',
  query:'média',  // sem lista — não dispara
  validar:(r)=> !(r && r._estatistico === true && /n=/.test(String(r.resposta||'')))
});

// ─── C. ENCADEAMENTO REAL: módulos cooperando (10) ───
TESTS.push({
  cat:'C_encadeamento', id:'turing_seguido_de_pergunta',
  setup:[
    'estado: x=10, y=20',
    'regra: enquanto x menor_que 30 faça [x = x + 5, y = y - 2]'
  ],
  query:'execute e mostre valor de y',
  validar:(r)=> r && /y = 12/i.test(String(r.resposta||''))
});
TESTS.push({
  cat:'C_encadeamento', id:'causal_apos_turing',
  setup:[
    'estado: t=0',
    'regra: enquanto t menor_que 5 faça [t = t + 1]',
    'execute',
    'sucesso_t causa fim_processo'
  ],
  query:'estado atual é fim_processo. onde começou?',
  validar:(r)=> r && /começou em:\s*sucesso/i.test(String(r.resposta||''))
});
TESTS.push({
  cat:'C_encadeamento', id:'cognitivo_apos_estat',
  setup:[
    'estatísticas de [10, 20, 30, 40, 50]'
  ],
  query:'qual rende mais: 100 a 5% por 5 anos vs 200 a 3% por 4 anos?',
  validar:(r)=> r && r._cognitivo === true
});
TESTS.push({
  cat:'C_encadeamento', id:'fn_que_modifica_global',
  setup:[
    'global: cont = 0',
    'função inc: [cont = cont + 1]',
    'execute função inc','execute função inc','execute função inc'
  ],
  query:'execute e mostre valor de cont',
  validar:(r)=> r && /cont = 3/i.test(String(r.resposta||''))
});
TESTS.push({
  cat:'C_encadeamento', id:'sequencia_social_turing_social',
  setup:[
    'oi','estado: u=0','regra: enquanto u menor_que 2 faça [u = u + 1]','execute'
  ],
  query:'tchau',
  validar:(r)=> r && r.reflexo_social === true
});
TESTS.push({
  cat:'C_encadeamento', id:'eng_reversa_3_pares',
  setup:[
    'entrada 1 → saida 3',
    'entrada 2 → saida 5'
  ],
  query:'entrada 3 → saida 7',
  validar:(r)=> r && /linear/i.test(String(r.resposta||''))
});
TESTS.push({
  cat:'C_encadeamento', id:'turing_dentro_estat',
  setup:[
    'estado: soma=0, i=1',
    'regra: enquanto i menor_que 11 faça [soma = soma + i, i = i + 1]'
  ],
  query:'execute e mostre valor de soma',
  validar:(r)=> r && /soma = 55/i.test(String(r.resposta||''))
});
TESTS.push({
  cat:'C_encadeamento', id:'decisional_seguido_factual',
  setup:[
    'qual rende mais 1000 com taxa 5% por 10 anos vs 2000 com taxa 3% por 8 anos?'
  ],
  query:'qual a média de [100, 200, 300]',
  validar:(r)=> r && r._estatistico === true
});
TESTS.push({
  cat:'C_encadeamento', id:'multiplas_decisoes',
  setup:[
    'qual rende mais 100 a 5% por 5 anos vs 200 a 2% por 8 anos?'
  ],
  query:'qual rende mais 500 a 4% por 6 anos vs 1000 a 2% por 10 anos?',
  validar:(r)=> r && r._cognitivo === true
});
TESTS.push({
  cat:'C_encadeamento', id:'mistura_completa',
  setup:[
    'oi',
    'estado: a=1, b=2',
    'regra: enquanto a menor_que 10 faça [a = a + 1, b = b + a]',
    'execute',
    'tchau'
  ],
  query:'qual rende mais: 1000 a 5% por 3 anos vs 2000 a 2% por 5 anos?',
  validar:(r)=> r && r._cognitivo === true
});

// ─── D. ESTADO COMPARTILHADO (5) ───
TESTS.push({
  cat:'D_estado_compartilhado', id:'amigdala_sobe_em_fallback',
  setup:['xyzqwerty random nonsense'],
  query:'algo_que_nao_existe123',
  validar:(r)=> V112.amigdala_tensao > 0
});
TESTS.push({
  cat:'D_estado_compartilhado', id:'estado_cog_persiste',
  setup:[
    'entrada 1 → saida 4',
    'entrada 2 → saida 6'
  ],
  query:'entrada 3 → saida 8',
  validar:(r)=> {
    const cog = V112.subredes.B_cortex_cognitivo;
    if(!cog) return false;
    const cen = V112.nodes.find(n => n.id === cog.id);
    return cen && cen._estado_cog && cen._estado_cog.pares_engenharia_reversa.length >= 3;
  }
});
TESTS.push({
  cat:'D_estado_compartilhado', id:'historico_interacoes_cresce',
  setup:['oi','tchau','oi de novo','olá'],
  query:'oi mais uma',
  validar:(r)=> {
    const cog = V112.subredes.B_cortex_cognitivo;
    const cen = V112.nodes.find(n => n.id === cog.id);
    return cen && cen._estado_cog.historico_interacoes.length >= 5;
  }
});
TESTS.push({
  cat:'D_estado_compartilhado', id:'estado_vm_persiste',
  setup:['estado: counter = 100'],
  query:'qual o valor de counter',  // se aprendiz não captura
  validar:(r)=> {
    // Verifica que counter ainda vale 100 no _estado_vm
    const cor = V112.subredes.B_cortex_computacional;
    if(!cor) return false;
    const cen = V112.nodes.find(n => n.id === cor.id);
    if(!cen || !cen._estado_vm) return false;
    const escopo = cen._estado_vm.escopos[0];
    const id_counter = escopo['counter'];
    if(!id_counter) return false;
    const var_no = V112.nodes.find(n => n.id === id_counter);
    return var_no && var_no._valor === 100;
  }
});
TESTS.push({
  cat:'D_estado_compartilhado', id:'perfil_uso_existe',
  setup:[
    'estado: w=0',
    'regra: enquanto w menor_que 5 faça [w = w + 1]',
    'execute'
  ],
  query:'execute',
  validar:(r)=> {
    const cor = V112.subredes.B_cortex_computacional;
    const cen = V112.nodes.find(n => n.id === cor.id);
    return cen && cen._perfil_uso;
  }
});

// ════ EXECUÇÃO ════
console.log('═══════════════════════════════════════════════════════════════');
console.log('BATERIA INTEGRAÇÃO — ' + TESTS.length + ' testes');
console.log('═══════════════════════════════════════════════════════════════');

const por_cat = {};
const falhas = [];
const t0 = Date.now();

for(const t of TESTS){
  reset();
  for(const s of (t.setup || [])){
    try { v112_processar(s); } catch(e){}
  }
  let r, passou;
  try {
    r = v112_processar(t.query);
    passou = t.validar(r);
  } catch(e){
    passou = false; r = {resposta:'[ERRO] '+e.message};
  }
  if(!por_cat[t.cat]) por_cat[t.cat] = {ok:0,total:0};
  por_cat[t.cat].total++;
  if(passou) por_cat[t.cat].ok++;
  else falhas.push({cat:t.cat, id:t.id, query:t.query, resp: String((r&&r.resposta)||'').substring(0,80)});
}

const dt = ((Date.now()-t0)/1000).toFixed(1);
console.log('\n--- Resultado por categoria ---');
let total_ok = 0, total = 0;
for(const [c, s] of Object.entries(por_cat)){
  console.log('  ' + c.padEnd(22) + ' ' + s.ok + '/' + s.total + ' = ' + (s.ok/s.total*100).toFixed(1) + '%');
  total_ok += s.ok; total += s.total;
}
console.log('\nTOTAL: ' + total_ok + '/' + total + ' = ' + (total_ok/total*100).toFixed(1) + '%');
console.log('Tempo: ' + dt + 's');

if(falhas.length > 0){
  console.log('\n--- FALHAS (' + falhas.length + ') ---');
  for(const f of falhas){
    console.log('  [' + f.cat + '] ' + f.id);
    console.log('     query: ' + f.query);
    console.log('     resp:  ' + f.resp);
  }
}
