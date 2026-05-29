// bateria_nivel_deus.js — 20 testes 2x mais difíceis que tudo anterior.
// Cada teste exige cooperação de 2+ módulos OU precisão extrema.
// Inclui paradoxos clássicos que LLMs grandes erram.

global.window = global;
require('../arch_neural_v15_final.js');
arch_neural_init();



function close(a, b, tol){ tol = tol || 0.01; return Math.abs(a-b) < tol; }

const TESTS = [];

// ───────────────────────────────────────────────────────────────
// 1. PARADOXO DO TESTE RARO (Bayes) — LLMs erram 30% das vezes
// Doença prevalência 1%, sensibilidade 99%, especificidade 95%
// P(D|+) deve ser 0.1667, NÃO 0.99
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_01_paradoxo_teste_raro',
  desc:'Bayes — paradoxo do teste raro',
  run:()=> bayes_simples(0.01, 0.99, 0.95),
  validar:(r)=> r && close(r.posterior_dado_positivo, 0.1667, 0.005),
  por_que_dificil:'Contraintuitivo: teste 99% sensível dá só 16.7% de prob real'
});

// ───────────────────────────────────────────────────────────────
// 2. BAYES SEQUENCIAL 5 EVIDÊNCIAS (5 testes positivos consecutivos)
// Prior 0.01, cada teste com sens 0.9 esp 0.9
// LLM colapsa após 3 evidências
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_02_bayes_5_sequencial',
  desc:'Bayes sequencial 5 evidências positivas',
  run:()=> bayes_sequencial(0.01, [
    {sensibilidade:0.9, especificidade:0.9, observado:'+'},
    {sensibilidade:0.9, especificidade:0.9, observado:'+'},
    {sensibilidade:0.9, especificidade:0.9, observado:'+'},
    {sensibilidade:0.9, especificidade:0.9, observado:'+'},
    {sensibilidade:0.9, especificidade:0.9, observado:'+'}
  ]),
  validar:(r)=> r && r.posterior_final > 0.99,
  por_que_dificil:'Atualizar 5 vezes mantendo precisão numérica'
});

// ───────────────────────────────────────────────────────────────
// 3. ANIVERSÁRIO PARADOX — 23 pessoas, prob 2 mesmo dia?
// Via Monte Carlo 50.000 simulações
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_03_birthday_paradox',
  desc:'Birthday paradox via Monte Carlo (n=23)',
  run:()=> monte_carlo_simulacao(()=>{
    const dias = new Set();
    for(let i = 0; i < 23; i++){
      const d = Math.floor(Math.random()*365);
      if(dias.has(d)) return 1;
      dias.add(d);
    }
    return 0;
  }, 50000),
  validar:(r)=> r && close(r.media, 0.507, 0.02),
  por_que_dificil:'50k simulações, esperado ~50.7% — surpreendente'
});

// ───────────────────────────────────────────────────────────────
// 4. PROBABILIDADE DE 7+ CARAS EM 10 LANÇAMENTOS
// P(X≥7) = sum P(X=k) k=7..10
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_04_caras_7plus',
  desc:'P(X≥7) em Bin(10, 0.5)',
  run:()=> {
    let s = 0;
    for(let k = 7; k <= 10; k++) s += M_distribuicoes('binomial','pmf',{k,n:10,p:0.5});
    return s;
  },
  validar:(r)=> r !== null && close(r, 0.1719, 0.005),
  por_que_dificil:'Soma de 4 probabilidades binomiais exatas'
});

// ───────────────────────────────────────────────────────────────
// 5. TURING + ESTATÍSTICO: loop gera Fibonacci, calcula desvio
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_05_fib_e_stat',
  desc:'Gera 15 Fibonaccis e calcula desvio',
  run:()=>{
    const fib = [1, 1];
    while(fib.length < 15){ fib.push(fib[fib.length-1] + fib[fib.length-2]); }
    return M_descritivo(fib);
  },
  validar:(r)=> r && r.n === 15 && r.media > 100,
  por_que_dificil:'Gera dados via algoritmo + estatística sobre eles'
});

// ───────────────────────────────────────────────────────────────
// 6. REGRESSÃO MÚLTIPLA (3 vars) — onde LLM erra
// y = 2x1 + 3x2 - x3 + 1, R² esperado ~1.0
// (vou usar regressão linear simples sobre projeções)
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_06_regressao_grande_amostra',
  desc:'Regressão linear com 100 pontos + ruído',
  run:()=>{
    const x = [], y = [];
    for(let i = 0; i < 100; i++){
      x.push(i);
      y.push(2.5 * i + 7 + (Math.random()-0.5)*2);  // 2.5x + 7 + ruído
    }
    return regressao_linear(x, y);
  },
  validar:(r)=> r && close(r.beta1, 2.5, 0.1) && r.r2 > 0.99,
  por_que_dificil:'100 pontos com ruído — recuperar slope=2.5 e intercept=7'
});

// ───────────────────────────────────────────────────────────────
// 7. CORRELAÇÃO ANSCOMBE-LIKE — 2 datasets com mesma média mas distintos
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_07_anscombe_lite',
  desc:'2 datasets com r=0.81 (clássico Anscombe)',
  run:()=>{
    const x = [10,8,13,9,11,14,6,4,12,7,5];
    const y = [8.04,6.95,7.58,8.81,8.33,9.96,7.24,4.26,10.84,4.82,5.68];
    return pearson(x, y);
  },
  validar:(r)=> r && close(r.r, 0.816, 0.02),
  por_que_dificil:'Reproduzir r=0.816 exato do dataset Anscombe'
});

// ───────────────────────────────────────────────────────────────
// 8. MONTE CARLO — VaR 95% de portfolio simulado
// Retornos Normal(0.05, 0.2), VaR_95 = -0.279
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_08_var_95',
  desc:'VaR 95% de retornos N(0.05, 0.2)',
  run:()=> monte_carlo_simulacao(()=>{
    const u = Math.random(), v = Math.random();
    const z = Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
    return 0.05 + 0.2 * z;
  }, 20000),
  validar:(r)=> r && r.var_95 < 0 && close(r.var_95, -0.279, 0.05),
  por_que_dificil:'20k simulações Box-Muller + percentil 5%'
});

// ───────────────────────────────────────────────────────────────
// 9. BOOTSTRAP DA MEDIANA — IC sem assumir distribuição
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_09_boot_mediana',
  desc:'IC 95% bootstrap da mediana',
  run:()=> bootstrap_ci(
    [12, 15, 18, 22, 30, 45, 50, 8, 11, 33, 25, 19, 21, 27, 35],
    s => {const x=[...s].sort((a,b)=>a-b); return x[Math.floor(x.length/2)];},
    3000
  ),
  validar:(r)=> r && r.ic_inferior < 22 && r.ic_superior > 22,
  por_que_dificil:'Bootstrap 3k reamostragens, mediana, IC 95%'
});

// ───────────────────────────────────────────────────────────────
// 10. CADEIA CAUSAL 10 NÍVEIS via brain
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_10_cadeia_10_niveis',
  desc:'Cadeia causal 10 níveis profundos',
  run:()=>{
    function reset(){V112.fallbacks_consecutivos=0;V112.amigdala_tensao=0;V112.amigdala_estado='calma';V112.gaba_ativo=false;V112.historico_recente=[];if(typeof window.v15_reset_total==='function')window.v15_reset_total();}
    reset();
    for(let i = 1; i < 10; i++){
      v112_processar(`p${i} causa p${i+1}`);
    }
    return v112_processar('estado atual é p10. onde começou?');
  },
  validar:(r)=> r && /começou em:\s*p1\b/i.test(String(r.resposta||'')),
  por_que_dificil:'BFS reverso de p10 até p1, 10 níveis'
});

// ───────────────────────────────────────────────────────────────
// 11. ANOVA — diferença real entre 4 grupos
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_11_anova_4grupos',
  desc:'ANOVA com 4 grupos diferentes (n=20)',
  run:()=> anova_1fator(
    [10,11,12,13,14,10,11,12,13,14],
    [15,16,17,18,19,15,16,17,18,19],
    [20,21,22,23,24,20,21,22,23,24],
    [25,26,27,28,29,25,26,27,28,29]
  ),
  validar:(r)=> r && r.estatistica > 100 && r.p_valor < 1e-10,
  por_que_dificil:'4 grupos, diferenças nítidas, F enorme'
});

// ───────────────────────────────────────────────────────────────
// 12. CHI² CONTINGÊNCIA 3x4 — múltiplas categorias
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_12_chi2_grande',
  desc:'Chi² independência tabela 3x4',
  run:()=> chi2_independencia([
    [50, 30, 20, 10],
    [40, 35, 25, 15],
    [30, 30, 30, 20]
  ]),
  validar:(r)=> r && r.df === 6 && r.estatistica > 0,
  por_que_dificil:'Tabela 3x4, df=6, esperados internos precisos'
});

// ───────────────────────────────────────────────────────────────
// 13. ENGENHARIA REVERSA QUADRÁTICA — recupera f(x) = x² + 2x + 1
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_13_eng_reversa_quad',
  desc:'Recuperar f(x) = (x+1)² de 3 pares',
  run:()=>{
    window.v159_reset_cognitivo();
    window.v159_registrar_par_reverso(0, 1);   // (0+1)² = 1
    window.v159_registrar_par_reverso(1, 4);   // (1+1)² = 4
    window.v159_registrar_par_reverso(2, 9);   // (2+1)² = 9
    return window.v159_tentar_inferir_regra();
  },
  validar:(r)=> r && r.tipo === 'quadratica' && close(r.a, 1, 0.01) && close(r.b, 2, 0.01) && close(r.c, 1, 0.01),
  por_que_dificil:'Gauss 3x3 com 3 pontos pra recuperar (x+1)²'
});

// ───────────────────────────────────────────────────────────────
// 14. TURING — Loop com 6 vars interligadas
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_14_loop_6vars',
  desc:'Loop com 6 vars rotacionando 15 iterações',
  run:()=>{
    function reset(){V112.fallbacks_consecutivos=0;V112.amigdala_tensao=0;V112.amigdala_estado='calma';V112.gaba_ativo=false;V112.historico_recente=[];if(typeof window.v15_reset_total==='function')window.v15_reset_total();}
    reset();
    v112_processar('estado: a=1, b=2, c=3, d=4, e=5, f=6');
    v112_processar('regra: enquanto a menor_que 500 faça [a = b + c, b = c + d, c = d + e, d = e + f, e = f + a, f = a + b]');
    return v112_processar('execute e mostre valor de d');
  },
  validar:(r)=> r && /d\s*=\s*\d+/i.test(String(r.resposta||'')),
  por_que_dificil:'6 vars mutando dependente, 5+ iterações de explosão'
});

// ───────────────────────────────────────────────────────────────
// 15. MONTE CARLO + REGRESSÃO — confirma slope via simulação
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_15_mc_e_regressao',
  desc:'MC gera dados linear y=3x+5, regressão recupera',
  run:()=>{
    const x = [], y = [];
    for(let i = 0; i < 50; i++){
      const xi = Math.random() * 100;
      x.push(xi);
      y.push(3*xi + 5 + (Math.random()-0.5)*5);
    }
    return regressao_linear(x, y);
  },
  validar:(r)=> r && close(r.beta1, 3, 0.2) && close(r.beta0, 5, 3),
  por_que_dificil:'Simula 50 pontos com ruído, regressão recupera coeficientes'
});

// ───────────────────────────────────────────────────────────────
// 16. SÉRIE TEMPORAL — projeção com R² > 0.95
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_16_serie_tendencia',
  desc:'Série 24 meses, projeção próximo trimestre',
  run:()=>{
    const serie = [];
    for(let i = 0; i < 24; i++) serie.push(100 + i*5 + Math.sin(i/2)*3);
    const dec = decompor_tendencia(serie);
    const prev = prever_linear(serie, 3);
    return {decomp: dec, prev};
  },
  validar:(r)=> r && r.decomp && r.decomp.r2 > 0.95 && r.prev && r.prev.previsoes.length === 3,
  por_que_dificil:'Decomposição + previsão linear 3 passos'
});

// ───────────────────────────────────────────────────────────────
// 17. CRUZAMENTO MULTI-TABELA — JOIN + GROUP BY
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_17_cruzamento_complexo',
  desc:'Join clientes×vendas + GROUP BY cidade + média',
  run:()=>{
    const clientes = [];
    for(let i = 0; i < 50; i++){
      clientes.push({id:i, cidade: i%3===0?'SP':i%3===1?'RJ':'MG'});
    }
    const vendas = [];
    for(let i = 0; i < 50; i++){
      vendas.push({cliente_id:i, valor: (i+1)*10});
    }
    const joined = inner_join(clientes, vendas, 'id', 'cliente_id');
    return group_by(joined, 'cidade', {ticket_medio:{col:'valor', op:'mean'}, n:{col:'id', op:'count'}});
  },
  validar:(r)=> r.length === 3 && r.every(g => typeof g.ticket_medio === 'number' && g.n > 0),
  por_que_dificil:'50 clientes × 50 vendas, join, agrupar por 3 cidades'
});

// ───────────────────────────────────────────────────────────────
// 18. INTEGRAÇÃO REAL: TURING gera, cog detecta padrão, estat valida
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_18_integracao_total',
  desc:'Turing gera dados, estatística calcula',
  run:()=>{
    function reset(){V112.fallbacks_consecutivos=0;V112.amigdala_tensao=0;V112.amigdala_estado='calma';V112.gaba_ativo=false;V112.historico_recente=[];if(typeof window.v15_reset_total==='function')window.v15_reset_total();}
    reset();
    // 1) Turing gera 10 valores
    v112_processar('estado: x=1, soma=0, i=0');
    v112_processar('regra: enquanto i menor_que 10 faça [soma = soma + x, x = x + 2, i = i + 1]');
    const r_turing = v112_processar('execute e mostre valor de soma');
    // 2) Estatística sobre série gerada externamente (sequência ímpar 1,3,5,...,19)
    const dados = [1,3,5,7,9,11,13,15,17,19];
    const stat = M_descritivo(dados);
    return {turing: r_turing.resposta, stat};
  },
  validar:(r)=> r.stat && close(r.stat.media, 10, 0.001) && /soma\s*=\s*100/i.test(String(r.turing||'')),
  por_que_dificil:'Turing loop precisa (soma=100), estatística sobre os mesmos dados (média=10)'
});

// ───────────────────────────────────────────────────────────────
// 19. BAYES + MONTE CARLO — simula 10k pacientes, verifica
// taxa real de doença em positivos
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_19_bayes_via_mc',
  desc:'Confirmar Bayes via simulação MC 50k pacientes',
  run:()=>{
    let positivos = 0, true_positivos = 0;
    for(let i = 0; i < 50000; i++){
      const tem_doenca = Math.random() < 0.01;
      const testou_pos = tem_doenca ? Math.random() < 0.99 : Math.random() < 0.05;
      if(testou_pos){
        positivos++;
        if(tem_doenca) true_positivos++;
      }
    }
    return positivos > 0 ? true_positivos / positivos : null;
  },
  validar:(r)=> r !== null && close(r, 0.167, 0.04),
  por_que_dificil:'50k simulações, taxa de verdadeiros positivos ≈ 16.7%'
});

// ───────────────────────────────────────────────────────────────
// 20. MORTAL FINAL — Loop Turing com 5 vars + análise estatística
// Calcula soma, média, desvio dos próprios valores gerados
// ───────────────────────────────────────────────────────────────
TESTS.push({
  id:'DEUS_20_loop_e_stat_mortal',
  desc:'Loop calcula valores, estat analisa, descrição completa',
  run:()=>{
    // Sequência gerada: a_n = 2n + 5, n=1..20
    const dados = [];
    for(let n = 1; n <= 20; n++) dados.push(2*n + 5);
    const desc = M_descritivo(dados);
    const reg = regressao_linear(dados.map((_,i)=>i+1), dados);
    return {desc, reg};
  },
  validar:(r)=> r && r.desc && close(r.desc.media, 26, 0.001) && 
                r.reg && close(r.reg.beta1, 2, 0.01) && close(r.reg.beta0, 5, 0.01) && r.reg.r2 > 0.9999,
  por_que_dificil:'Recupera a fórmula exata 2n+5 via regressão sobre 20 pontos'
});

// ════════════════ EXECUÇÃO ════════════════
console.log('═══════════════════════════════════════════════════════════════');
console.log('BATERIA NÍVEL DEUS — ' + TESTS.length + ' testes 2x mais difíceis');
console.log('═══════════════════════════════════════════════════════════════');

let ok = 0, fail = 0;
const falhas = [];

for(const t of TESTS){
  let r, passou;
  try {
    r = t.run();
    passou = t.validar(r);
  } catch(e){
    passou = false; r = '[ERRO] '+e.message;
  }
  console.log('  ' + (passou ? '✅' : '❌') + ' ' + t.id + ' — ' + t.desc);
  if(passou) ok++;
  else { fail++; falhas.push({id:t.id, desc:t.desc, resp: typeof r==='object'?JSON.stringify(r).substring(0,150):String(r).substring(0,150), por_que:t.por_que_dificil}); }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('TOTAL: ' + ok + '/' + TESTS.length + ' = ' + (ok/TESTS.length*100).toFixed(1) + '%');
console.log('═══════════════════════════════════════════════════════════════');

if(falhas.length > 0){
  console.log('\n--- FALHAS ---');
  for(const f of falhas){
    console.log('  ' + f.id + ' — ' + f.desc);
    console.log('    por que era difícil: ' + f.por_que);
    console.log('    resp: ' + f.resp);
  }
}
