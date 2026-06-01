(function(){
 if(typeof window==="undefined"||typeof window.v112_processar!=="function"){try{console.warn("[bateria estatistica] engine ausente");}catch(e){}return;}
// bateria_estatistica.js — 150 testes contra B_estatistico




const TESTS = [];
function close(a, b, tol){ tol = tol || 0.01; return Math.abs(a-b) < tol; }

// ════ E1 Descritivo (30) ════
const dados_e1 = [
  {d:[1,2,3,4,5], media:3, mediana:3, sd_amos:Math.sqrt(2.5)},
  {d:[10,20,30,40,50], media:30, mediana:30, sd_amos:Math.sqrt(250)},
  {d:[1,1,1,1,1], media:1, mediana:1, sd_amos:0},
  {d:[2,4,4,4,5,5,7,9], media:5, mediana:4.5, sd_amos:2},
  {d:[100], media:100, mediana:100, sd_amos:0},  // n=1, var=0
  {d:[-5,0,5], media:0, mediana:0, sd_amos:5},
  {d:[12,15,18,22,30,45,50,8,11,33], media:24.4, mediana:20},
  {d:[1.5,2.5,3.5,4.5], media:3, mediana:3, sd_amos:Math.sqrt(1.6666666666666667)},
  {d:[0,0,1,1,2,2,3,3], media:1.5, mediana:1.5},
  {d:[7,7,7,8,9,10], media:8, mediana:7.5}
];
for(let i = 0; i < dados_e1.length; i++){
  const c = dados_e1[i];
  TESTS.push({
    motor:'E1', id:'desc_'+i,
    run:()=> M_descritivo(c.d),
    valida:(r)=> r && close(r.media, c.media, 0.01) && close(r.mediana, c.mediana, 0.01)
  });
}
// Mais 20 com aleatórios mas reproducíveis
for(let i = 0; i < 20; i++){
  const N = 5 + i;
  const d = []; let s = 0;
  for(let j = 1; j <= N; j++){ d.push(j); s += j; }
  const m_esperada = s / N;
  TESTS.push({
    motor:'E1', id:'desc_seq_'+i,
    run:()=> M_descritivo(d),
    valida:(r)=> r && close(r.media, m_esperada, 0.001) && r.n === N
  });
}

// ════ E2 Distribuições (30) ════
// Normal CDF
const normal_cases = [
  {x:0, esp:0.5}, {x:1.0, esp:0.8413}, {x:1.96, esp:0.975}, {x:-1.96, esp:0.025},
  {x:2.58, esp:0.9951}, {x:-2.0, esp:0.0228}, {x:3.0, esp:0.9987}
];
for(let i = 0; i < normal_cases.length; i++){
  const c = normal_cases[i];
  TESTS.push({
    motor:'E2', id:'normal_'+i,
    run:()=> M_distribuicoes('normal','cdf',{x:c.x, mu:0, sigma:1}),
    valida:(r)=> r !== null && close(r, c.esp, 0.005)
  });
}
// Binomial
const bin_cases = [
  {n:10, p:0.5, k:5, esp:0.2461},
  {n:10, p:0.5, k:7, esp:0.1172},
  {n:10, p:0.5, k:0, esp:0.000977},
  {n:10, p:0.5, k:10, esp:0.000977},
  {n:20, p:0.3, k:6, esp:0.1916},
  {n:15, p:0.2, k:3, esp:0.2501}
];
for(let i = 0; i < bin_cases.length; i++){
  const c = bin_cases[i];
  TESTS.push({
    motor:'E2', id:'bin_'+i,
    run:()=> M_distribuicoes('binomial','pmf',{k:c.k, n:c.n, p:c.p}),
    valida:(r)=> r !== null && close(r, c.esp, 0.005)
  });
}
// Poisson
const poi_cases = [
  {lam:3, k:2, esp:0.2240}, {lam:5, k:5, esp:0.1755},
  {lam:1, k:0, esp:0.3679}, {lam:10, k:10, esp:0.1251}
];
for(let i = 0; i < poi_cases.length; i++){
  const c = poi_cases[i];
  TESTS.push({
    motor:'E2', id:'poi_'+i,
    run:()=> M_distribuicoes('poisson','pmf',{k:c.k, lam:c.lam}),
    valida:(r)=> r !== null && close(r, c.esp, 0.005)
  });
}
// t-Student CDF (df=8, t=2.306 ~ p=0.975)
TESTS.push({motor:'E2', id:'t_df8_975', run:()=> M_distribuicoes('t','cdf',{t:2.306, df:8}), valida:(r)=>close(r, 0.975, 0.01)});
TESTS.push({motor:'E2', id:'t_df30_95', run:()=> M_distribuicoes('t','cdf',{t:1.697, df:30}), valida:(r)=>close(r, 0.95, 0.01)});
TESTS.push({motor:'E2', id:'t_inf', run:()=> M_distribuicoes('t','cdf',{t:1.96, df:1000}), valida:(r)=>close(r, 0.975, 0.01)});
// Chi² CDF
TESTS.push({motor:'E2', id:'chi2_df1', run:()=> M_distribuicoes('chi2','cdf',{x:3.841, df:1}), valida:(r)=>close(r, 0.95, 0.01)});
TESTS.push({motor:'E2', id:'chi2_df5', run:()=> M_distribuicoes('chi2','cdf',{x:11.07, df:5}), valida:(r)=>close(r, 0.95, 0.01)});
TESTS.push({motor:'E2', id:'chi2_df10', run:()=> M_distribuicoes('chi2','cdf',{x:18.31, df:10}), valida:(r)=>close(r, 0.95, 0.01)});
// Exponencial
TESTS.push({motor:'E2', id:'exp_05', run:()=> M_distribuicoes('exp','cdf',{x:0.5, lam:1}), valida:(r)=>close(r, 0.3935, 0.005)});
TESTS.push({motor:'E2', id:'exp_2', run:()=> M_distribuicoes('exp','cdf',{x:2, lam:1}), valida:(r)=>close(r, 0.8647, 0.005)});
// Uniforme
TESTS.push({motor:'E2', id:'unif_meio', run:()=> M_distribuicoes('unif','cdf',{x:5, a:0, b:10}), valida:(r)=>close(r, 0.5, 0.001)});
// Quantil normal
TESTS.push({motor:'E2', id:'qnorm_975', run:()=> M_distribuicoes('normal','quantil',{p:0.975, mu:0, sigma:1}), valida:(r)=>close(r, 1.96, 0.01)});

// ════ E3 Testes hipótese (20) ════
TESTS.push({
  motor:'E3', id:'tt_classico',
  run:()=> ttest_independente([23,25,27,24,26],[30,32,29,31,33], true),
  valida:(r)=> r && close(Math.abs(r.estatistica), 6.0, 0.1) && r.p_valor < 0.001
});
TESTS.push({
  motor:'E3', id:'tt_iguais',
  run:()=> ttest_independente([1,2,3,4,5],[1,2,3,4,5], true),
  valida:(r)=> r && Math.abs(r.estatistica) < 0.01 && r.p_valor > 0.9
});
TESTS.push({
  motor:'E3', id:'tt_1amostra',
  run:()=> ttest_1amostra([10,12,11,13,9,10,11,12], 10),
  valida:(r)=> r && r.estatistica > 0 && r.p_valor < 0.2
});
TESTS.push({
  motor:'E3', id:'anova_3grupos',
  run:()=> anova_1fator([1,2,3,4,5], [3,4,5,6,7], [5,6,7,8,9]),
  valida:(r)=> r && r.estatistica > 1 && r.p_valor < 0.01
});
TESTS.push({
  motor:'E3', id:'chi2_22',
  run:()=> chi2_independencia([[10,20],[30,40]]),
  valida:(r)=> r && r.df === 1 && r.estatistica >= 0
});
TESTS.push({
  motor:'E3', id:'chi2_indep',
  run:()=> chi2_independencia([[120,380],[80,420]]),
  valida:(r)=> r && close(r.estatistica, 10.0, 0.5) && r.p_valor < 0.01
});
TESTS.push({
  motor:'E3', id:'mw_diferente',
  run:()=> mann_whitney([1,2,3,4,5,6,7,8,9,10], [11,12,13,14,15,16,17,18,19,20]),
  valida:(r)=> r && r.p_valor < 0.01
});
TESTS.push({
  motor:'E3', id:'tt_pareado',
  run:()=> ttest_pareado([5,6,7,8,9], [4,5,6,7,8]),
  valida:(r)=> r && r.p_valor < 0.01
});
TESTS.push({
  motor:'E3', id:'tt_welch',
  run:()=> ttest_independente([1,2,3], [10,11,12,13,14,15,16,17,18,19,20], false),
  valida:(r)=> r && r.p_valor < 0.01
});
TESTS.push({
  motor:'E3', id:'chi2_3x3',
  run:()=> chi2_independencia([[10,20,30],[15,25,35],[20,30,40]]),
  valida:(r)=> r && r.df === 4
});
TESTS.push({
  motor:'E3', id:'anova_iguais',
  run:()=> anova_1fator([5,5,5], [5,5,5], [5,5,5]),
  valida:(r)=> r && r.p_valor > 0.5  // grupos iguais — não rejeita H0
});
TESTS.push({
  motor:'E3', id:'mw_iguais',
  run:()=> mann_whitney([1,2,3,4,5], [1,2,3,4,5]),
  valida:(r)=> r && r.p_valor > 0.5
});
// Mais 8 testes variados
for(let i = 0; i < 8; i++){
  const a = [1+i, 2+i, 3+i, 4+i, 5+i];
  const b = [10+i, 11+i, 12+i, 13+i, 14+i];
  TESTS.push({
    motor:'E3', id:'tt_var_'+i,
    run:()=> ttest_independente(a,b, true),
    valida:(r)=> r && r.p_valor < 0.001  // sempre diferente
  });
}

// ════ E4 Correlação (15) ════
TESTS.push({motor:'E4', id:'pearson_perf', run:()=> pearson([1,2,3,4,5],[2,4,6,8,10]), valida:(r)=> r && close(r.r, 1.0, 0.001)});
TESTS.push({motor:'E4', id:'pearson_neg', run:()=> pearson([1,2,3,4,5],[10,8,6,4,2]), valida:(r)=> r && close(r.r, -1.0, 0.001)});
TESTS.push({motor:'E4', id:'pearson_zero', run:()=> pearson([1,2,3,4,5,4,3,2,1],[1,1,1,1,1,1,1,1,1]), valida:(r)=> r === null || Math.abs(r.r) < 0.001});
TESTS.push({motor:'E4', id:'pearson_forte', run:()=> pearson([1,2,3,4,5,6,7,8,9,10],[2.1,3.9,6.2,7.8,10.1,12.1,13.9,16.1,17.9,20.2]), valida:(r)=> r && r.r > 0.99});
TESTS.push({motor:'E4', id:'spearman_perf', run:()=> spearman([1,2,3,4,5],[10,20,30,40,50]), valida:(r)=> r && close(r.r, 1.0, 0.001)});
TESTS.push({motor:'E4', id:'spearman_mono', run:()=> spearman([1,2,3,4,5],[1,4,9,16,25]), valida:(r)=> r && close(r.r, 1.0, 0.001)});  // monotônica não-linear
// 9 aleatórias positivas fortes
for(let i = 0; i < 9; i++){
  const x = [1,2,3,4,5,6,7,8,9,10];
  const y = x.map(v => v*2 + Math.sin(i+v)*0.1);  // ruído pequeno
  TESTS.push({motor:'E4', id:'pear_n_'+i, run:()=> pearson(x,y), valida:(r)=> r && r.r > 0.95});
}

// ════ E5 Regressão (15) ════
TESTS.push({
  motor:'E5', id:'reg_classico',
  run:()=> regressao_linear([5,8,12,15,18,22,25], [100,150,200,240,280,340,380]),
  valida:(r)=> r && close(r.beta1, 14.0, 1) && r.r2 > 0.99
});
TESTS.push({
  motor:'E5', id:'reg_horizontal',
  run:()=> regressao_linear([1,2,3,4,5], [5,5,5,5,5]),
  valida:(r)=> r && close(r.beta1, 0, 0.001) && close(r.beta0, 5, 0.001)
});
TESTS.push({
  motor:'E5', id:'reg_identidade',
  run:()=> regressao_linear([1,2,3,4,5], [1,2,3,4,5]),
  valida:(r)=> r && close(r.beta1, 1.0, 0.001) && close(r.beta0, 0, 0.001)
});
TESTS.push({
  motor:'E5', id:'reg_negativa',
  run:()=> regressao_linear([1,2,3,4,5], [10,8,6,4,2]),
  valida:(r)=> r && close(r.beta1, -2, 0.001)
});
// 11 variações
for(let i = 0; i < 11; i++){
  const a = 1 + i*0.5, b = i*2;
  const x = [1,2,3,4,5,6,7,8,9,10];
  const y = x.map(v => a*v + b);
  TESTS.push({
    motor:'E5', id:'reg_par_'+i,
    run:()=> regressao_linear(x, y),
    valida:(r)=> r && close(r.beta1, a, 0.01) && close(r.beta0, b, 0.01)
  });
}

// ════ E6 Bayes (15) ════
TESTS.push({
  motor:'E6', id:'bayes_classico',
  run:()=> bayes_simples(0.01, 0.99, 0.95),
  valida:(r)=> r && close(r.posterior_dado_positivo, 0.1667, 0.005)
});
TESTS.push({
  motor:'E6', id:'bayes_alta_prev',
  run:()=> bayes_simples(0.5, 0.9, 0.9),
  valida:(r)=> r && close(r.posterior_dado_positivo, 0.9, 0.01)
});
TESTS.push({
  motor:'E6', id:'bayes_baixa_sens',
  run:()=> bayes_simples(0.1, 0.5, 0.5),
  valida:(r)=> r && close(r.posterior_dado_positivo, 0.1, 0.01)
});
TESTS.push({
  motor:'E6', id:'bayes_seq_2etapas',
  run:()=> bayes_sequencial(0.01, [
    {sensibilidade:0.99, especificidade:0.95, observado:'+'},
    {sensibilidade:0.99, especificidade:0.95, observado:'+'}
  ]),
  valida:(r)=> r && r.posterior_final > 0.7  // 2 testes + sobem prob a >70%
});
TESTS.push({
  motor:'E6', id:'bayes_seq_neg_anula',
  run:()=> bayes_sequencial(0.5, [
    {sensibilidade:0.9, especificidade:0.9, observado:'+'},
    {sensibilidade:0.9, especificidade:0.9, observado:'-'}
  ]),
  valida:(r)=> r && close(r.posterior_final, 0.5, 0.1)  // + e - se cancelam
});
TESTS.push({
  motor:'E6', id:'bayes_factor_forte',
  run:()=> bayes_factor(0.9, 0.01),
  valida:(r)=> r && r.BF_12 > 20  // forte
});
// 9 variações Bayes simples
const priors = [0.001, 0.005, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7];
for(let i = 0; i < 9; i++){
  const p = priors[i];
  TESTS.push({
    motor:'E6', id:'bayes_var_'+i,
    run:()=> bayes_simples(p, 0.9, 0.9),
    valida:(r)=> {
      if(!r) return false;
      const expected = (0.9*p) / (0.9*p + 0.1*(1-p));
      return close(r.posterior_dado_positivo, expected, 0.001);
    }
  });
}

// ════ E7 Monte Carlo (10) ════
for(let i = 0; i < 5; i++){
  TESTS.push({
    motor:'E7', id:'mc_uniform_'+i,
    run:()=> monte_carlo_simulacao(() => Math.random()*100, 5000),
    valida:(r)=> r && close(r.media, 50, 3)  // CLT
  });
}
TESTS.push({
  motor:'E7', id:'mc_lancamento_moeda',
  run:()=> monte_carlo_simulacao(() => Math.random() < 0.5 ? 1 : 0, 10000),
  valida:(r)=> close(r.media, 0.5, 0.02)
});
TESTS.push({
  motor:'E7', id:'mc_var_ganho',
  run:()=> monte_carlo_simulacao(() => 0.6 < Math.random() ? -100 : 50, 10000),
  valida:(r)=> r && r.media > -50 && r.media < 50
});
TESTS.push({
  motor:'E7', id:'boot_media',
  run:()=> bootstrap_ci([1,2,3,4,5,6,7,8,9,10], (s)=> s.reduce((a,b)=>a+b,0)/s.length, 1000),
  valida:(r)=> r && r.ic_inferior < 5.5 && r.ic_superior > 5.5
});
TESTS.push({
  motor:'E7', id:'boot_mediana',
  run:()=> bootstrap_ci([1,2,3,4,5,6,7,8,9,10], (s)=> {const x=[...s].sort((a,b)=>a-b);return x[Math.floor(x.length/2)];}, 1000),
  valida:(r)=> r && r.ic_inferior <= 6 && r.ic_superior >= 4
});
TESTS.push({
  motor:'E7', id:'mc_normal_aprox',
  run:()=> {
    const fn = () => {
      // Box-Muller
      const u = Math.random(), v = Math.random();
      return Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
    };
    return monte_carlo_simulacao(fn, 5000);
  },
  valida:(r)=> r && close(r.media, 0, 0.1) && close(r.sd, 1, 0.1)
});

// ════ E8 Série Temporal (10) ════
TESTS.push({
  motor:'E8', id:'sma_simples',
  run:()=> sma([1,2,3,4,5,6,7,8,9,10], 3),
  valida:(r)=> r[2] === 2 && r[9] === 9
});
TESTS.push({
  motor:'E8', id:'ema_simples',
  run:()=> ema([10,10,10,10,10], 0.5),
  valida:(r)=> close(r[r.length-1], 10, 0.01)
});
TESTS.push({
  motor:'E8', id:'prev_linear_crescente',
  run:()=> prever_linear([10,20,30,40,50], 3),
  valida:(r)=> r && close(r.previsoes[0], 60, 1) && close(r.previsoes[2], 80, 1)
});
TESTS.push({
  motor:'E8', id:'prev_linear_decresc',
  run:()=> prever_linear([100,90,80,70,60], 2),
  valida:(r)=> r && close(r.previsoes[0], 50, 1)
});
TESTS.push({
  motor:'E8', id:'decompor',
  run:()=> decompor_tendencia([100,110,120,130,140,150,160,170,180,190]),
  valida:(r)=> r && close(r.slope, 10, 0.5) && r.r2 > 0.99
});
TESTS.push({
  motor:'E8', id:'sma_janela_grande',
  run:()=> sma([1,2,3,4,5,6,7,8,9,10], 5),
  valida:(r)=> r[4] === 3 && r[9] === 8
});
TESTS.push({
  motor:'E8', id:'prev_horizontal',
  run:()=> prever_linear([50,50,50,50,50], 3),
  valida:(r)=> r && close(r.previsoes[0], 50, 0.001)
});
// 3 variações
for(let i = 0; i < 3; i++){
  const slope = 5 + i*5;
  const serie = [];
  for(let j = 0; j < 10; j++) serie.push(j*slope + 100);
  TESTS.push({
    motor:'E8', id:'prev_var_'+i,
    run:()=> prever_linear(serie, 1),
    valida:(r)=> r && close(r.previsoes[0], 10*slope + 100, 1)
  });
}

// ════ E9 Cruzamento (10) ════
TESTS.push({
  motor:'E9', id:'join_simples',
  run:()=> inner_join(
    [{id:1, nome:'a'}, {id:2, nome:'b'}],
    [{id:1, valor:100}, {id:2, valor:200}],
    'id'),
  valida:(r)=> r.length === 2 && r[0].nome === 'a' && r[0].valor === 100
});
TESTS.push({
  motor:'E9', id:'join_vazio',
  run:()=> inner_join(
    [{id:1, nome:'a'}],
    [{id:99, valor:100}],
    'id'),
  valida:(r)=> r.length === 0
});
TESTS.push({
  motor:'E9', id:'group_sum',
  run:()=> group_by([
    {cat:'A', val:10},{cat:'A', val:20},{cat:'B', val:5}
  ], 'cat', {total:{col:'val', op:'sum'}}),
  valida:(r)=> {
    const A = r.find(x => x.cat==='A'), B = r.find(x => x.cat==='B');
    return A && A.total === 30 && B && B.total === 5;
  }
});
TESTS.push({
  motor:'E9', id:'group_mean',
  run:()=> group_by([
    {grupo:'x', n:1},{grupo:'x', n:3},{grupo:'x', n:5}
  ], 'grupo', {m:{col:'n', op:'mean'}}),
  valida:(r)=> r[0] && close(r[0].m, 3, 0.001)
});
TESTS.push({
  motor:'E9', id:'group_count',
  run:()=> group_by([
    {g:'a'},{g:'a'},{g:'a'},{g:'b'},{g:'b'}
  ], 'g', {c:{col:'g', op:'count'}}),
  valida:(r)=> {
    const a = r.find(x=>x.g==='a'), b = r.find(x=>x.g==='b');
    return a && a.c === 3 && b && b.c === 2;
  }
});
TESTS.push({
  motor:'E9', id:'cont_22_classico',
  run:()=> tabela_contingencia_2x2([[120,380],[80,420]]),
  valida:(r)=> r && close(r.estatistica, 10.0, 0.5) && r.p_valor < 0.01
});
TESTS.push({
  motor:'E9', id:'cont_22_independente',
  run:()=> tabela_contingencia_2x2([[50,50],[50,50]]),
  valida:(r)=> r && r.estatistica < 0.001 && r.p_valor > 0.5
});
// 3 variações
for(let i = 0; i < 3; i++){
  TESTS.push({
    motor:'E9', id:'cont_var_'+i,
    run:()=> tabela_contingencia_2x2([[100+i*10, 200], [50, 150+i*10]]),
    valida:(r)=> r && r.estatistica >= 0 && r.p_valor >= 0 && r.p_valor <= 1
  });
}

// ════ E10 Validador (5) ════
TESTS.push({
  motor:'E10', id:'val_n_pequeno',
  run:()=> validador_estatistico({}, {n:5, tipo_teste:'t-test'}),
  valida:(r)=> r.avisos.some(a => /pequeno/i.test(a))
});
TESTS.push({
  motor:'E10', id:'val_n_ok',
  run:()=> validador_estatistico({}, {n:30, tipo_teste:'t-test'}),
  valida:(r)=> r.oks.length > 0
});
TESTS.push({
  motor:'E10', id:'val_p_marginal',
  run:()=> validador_estatistico({p_valor:0.048}, {n:50, tipo_teste:'t-test'}),
  valida:(r)=> r.avisos.some(a => /próximo|0\.05|frágil/i.test(a))
});
TESTS.push({
  motor:'E10', id:'val_outlier',
  run:()=> validador_estatistico({}, {n:10, dados:[1,2,3,4,5,6,7,8,9,100], tipo_teste:'descritivo'}),
  valida:(r)=> r.avisos.some(a => /outlier/i.test(a))
});
TESTS.push({
  motor:'E10', id:'val_p_invalido',
  run:()=> validador_estatistico({p_valor:1.5}, {n:30, tipo_teste:'t-test'}),
  valida:(r)=> r.avisos.some(a => /fora.*range|inv[áa]lid/i.test(a))
});

window.BATERIAS_REGISTRO=window.BATERIAS_REGISTRO||[];
window.BATERIAS_REGISTRO.push({nome:"estatistica",run:function(){
// ════════════════ EXECUÇÃO ════════════════
console.log('═══════════════════════════════════════════════════════════════');
console.log('BATERIA ESTATÍSTICA — ' + TESTS.length + ' testes');
console.log('═══════════════════════════════════════════════════════════════');

const por_motor = {};
const falhas = [];
const t0 = Date.now();

for(const t of TESTS){
  let r, passou;
  try {
    r = t.run();
    passou = t.valida(r);
  } catch(e){
    passou = false; r = '[ERRO] ' + e.message;
  }
  if(!por_motor[t.motor]) por_motor[t.motor] = {ok:0, total:0};
  por_motor[t.motor].total++;
  if(passou){
    por_motor[t.motor].ok++;
  } else {
    falhas.push({motor:t.motor, id:t.id, resp: typeof r === 'object' ? JSON.stringify(r).substring(0,100) : String(r).substring(0,100)});
  }
}

const dt = ((Date.now()-t0)/1000).toFixed(1);
console.log('\n--- Resultado por motor ---');
const nomes = {E1:'M_descritivo',E2:'M_distribuicoes',E3:'M_testes_hipotese',E4:'M_correlacao',
               E5:'M_regressao',E6:'M_bayesiano',E7:'M_monte_carlo',E8:'M_serie_temporal',
               E9:'M_cruzamento',E10:'N_validador'};
let total_ok = 0, total = 0;
for(const [m, s] of Object.entries(por_motor)){
  console.log('  ' + m.padEnd(4) + ' ' + (nomes[m]||'').padEnd(20) + ' ' + s.ok + '/' + s.total + ' = ' + (s.ok/s.total*100).toFixed(1) + '%');
  total_ok += s.ok; total += s.total;
}
console.log('\nTOTAL: ' + total_ok + '/' + total + ' = ' + (total_ok/total*100).toFixed(1) + '%');
console.log('Tempo: ' + dt + 's');

if(falhas.length > 0){
  console.log('\n--- FALHAS (até 15) ---');
  for(const f of falhas.slice(0, 15)){
    console.log('  [' + f.motor + '] ' + f.id);
    console.log('     resp: ' + f.resp);
  }
}

  return {nome:"estatistica",ok:total_ok,total:total,falhas:(typeof falhas!=="undefined"?falhas:[])};
}});
})();
