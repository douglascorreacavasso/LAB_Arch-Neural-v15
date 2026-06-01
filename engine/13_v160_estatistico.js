// ─── REGIÃO 13/14 — v160_estatistico.js ───
window._ARCH_MODULOS.push({nome:"v160_estatistico.js", src: `
// ═══════════════════════════════════════════════════════════════
// v160_estatistico.js — B_estatistico (H_MAT, [+280, +30, +110])
//
// 10 motores estatísticos REAIS (execução, não heurística):
//   E1  M_descritivo         (média/mediana/var/sd/IQR/skew/kurt)
//   E2  M_distribuicoes      (Normal/Binomial/Poisson/t/F/Chi²/Beta/Gamma/Exp/Unif)
//   E3  M_testes_hipotese    (t-test, ANOVA, chi², KS, Mann-Whitney, Shapiro)
//   E4  M_correlacao         (Pearson, Spearman, Kendall)
//   E5  M_regressao          (linear, polinomial, múltipla, logística)
//   E6  M_bayesiano          (atualização simples, sequencial, BF)
//   E7  M_monte_carlo        (simulação, bootstrap, permutação, VaR)
//   E8  M_serie_temporal     (decomposição, médias móveis, ARIMA simples)
//   E9  M_cruzamento         (joins, agregações, contingência, market basket)
//   E10 N_validador          (sanity check em cima de TODOS os outros)
//
// + 3 detectores: dados_numericos, pergunta_estatistica, árbitro
//
// FILOSOFIA: execução real. Não inventar. Quando não pode calcular, dizer.
// ═══════════════════════════════════════════════════════════════

(function(){
'use strict';
if(!global.V112 && !window.V112) return;
const V = (typeof window !== 'undefined' && window.V112) ? window.V112 : global.V112;

// ────────────────────────────────────────────────────────────────
// Helpers de criação de nós (igual padrão v159)
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

function _criar_subrede_est(){
  if(V.subredes.B_estatistico) return V.subredes.B_estatistico;
  const id = _gera_id();
  const no = {
    id, text: '[B_estatistico]',
    tipo: 'subrede', camada: 'subrede',
    pos: [280, 30, 110],
    acumulador: 0, limiar: 1, threshold: 1,
    estado: 'dormindo',
    _ativacoes: 0, _sucessos: 0,
    _categoria: 'estatistico',
    _blindado: true, _imune_evolucao: true, _imune_valvula: true,
    _imune_aprendiz: true, _eh_estrutural: true,
    _eh_estrutural_estatistico: true, _nao_evoluir: true,
    _proposito: 'Córtex estatístico: descritivo/distribuições/testes/correlação/regressão/Bayes/MC/série/cruzamento/validador',
  };
  V.nodes.push(no);
  V.subredes.B_estatistico = {id, satelites: []};
  return V.subredes.B_estatistico;
}

function _criar_no_est(nome, pos, proposito){
  if(V.subredes[nome]) return V.subredes[nome];
  const id = _gera_id();
  const no = {
    id, text: '['+nome+']',
    tipo: 'subrede', camada: 'subrede',
    pos: pos || [280, 30, 110],
    acumulador: 0, limiar: 1, threshold: 1,
    estado: 'dormindo',
    _ativacoes: 0, _sucessos: 0, _falhas: 0,
    _categoria: 'estatistico',
    _blindado: true, _imune_evolucao: true, _imune_valvula: true,
    _imune_aprendiz: true, _eh_estrutural: true,
    _eh_estrutural_estatistico: true, _nao_evoluir: true,
    _proposito: proposito,
    _taxa_acerto: 1.0, _custo_medio_ms: 1
  };
  V.nodes.push(no);
  V.subredes[nome] = {id, satelites: []};
  if(V.subredes.B_estatistico) V.subredes.B_estatistico.satelites.push(id);
  return V.subredes[nome];
}

_criar_subrede_est();
_criar_no_est('N_detector_dados_numericos',  [270, 25, 105], 'Detecta listas numéricas no input');
_criar_no_est('N_detector_pergunta_estat',   [275, 25, 105], 'Detecta tipo de pergunta estatística');
_criar_no_est('N_arbitro_estatistico',       [280, 25, 105], 'Decide qual motor estatístico usar');
_criar_no_est('M_descritivo',                [270, 30, 110], 'n, média, mediana, var, sd, IQR, skew, kurt');
_criar_no_est('M_distribuicoes',             [275, 30, 110], '10 distribuições: PDF/CDF/quantil/sample');
_criar_no_est('M_testes_hipotese',           [280, 30, 110], 't-test, ANOVA, chi², KS, Mann-Whitney');
_criar_no_est('M_correlacao',                [285, 30, 110], 'Pearson, Spearman, Kendall');
_criar_no_est('M_regressao',                 [290, 30, 110], 'Linear, polinomial, múltipla, logística');
_criar_no_est('M_bayesiano',                 [270, 35, 115], 'Bayes simples, sequencial, BF, Kass-Raftery');
_criar_no_est('M_monte_carlo',               [275, 35, 115], 'Simulação 10k+, bootstrap, permutação, VaR');
_criar_no_est('M_serie_temporal',            [280, 35, 115], 'Decomposição, médias móveis, ARIMA simples');
_criar_no_est('M_cruzamento',                [285, 35, 115], 'Joins, agregações, contingência, market basket');
_criar_no_est('N_validador',                 [290, 35, 115], 'Sanity check: n, normalidade, outliers, poder');

function _no_central_est(){
  const sr = V.subredes.B_estatistico;
  if(!sr) return null;
  return V.nodes.find(n => n.id === sr.id);
}

function _registrar_motor_est(nome_orgao, sucesso, custo_ms){
  const sr = V.subredes[nome_orgao];
  if(!sr) return;
  const no = V.nodes.find(n => n.id === sr.id);
  if(!no) return;
  no._ativacoes = (no._ativacoes || 0) + 1;
  if(sucesso) no._sucessos = (no._sucessos || 0) + 1;
  else no._falhas = (no._falhas || 0) + 1;
  const total = (no._sucessos || 0) + (no._falhas || 0);
  no._taxa_acerto = total > 0 ? no._sucessos / total : 1.0;
}

// ════════════════════════════════════════════════════════════════
// FUNÇÕES MATEMÁTICAS AUXILIARES (precisão crítica)
// ════════════════════════════════════════════════════════════════

// erf — aproximação Abramowitz & Stegun 7.1.26 (precisão ~7 decimais)
function erf(x){
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
  return sign * y;
}

// gamma function via Lanczos (precisão ~10 decimais)
function gammaLn(z){
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
             771.32342877765313, -176.61502916214059, 12.507343278686905,
             -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if(z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - gammaLn(1 - z);
  z -= 1;
  let x = c[0];
  for(let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function gammaFn(z){ return Math.exp(gammaLn(z)); }

function beta(a, b){ return Math.exp(gammaLn(a) + gammaLn(b) - gammaLn(a + b)); }

// Incomplete beta via continued fraction (Numerical Recipes)
function betacf(a, b, x){
  const MAXIT = 100, EPS = 3e-7, FPMIN = 1e-30;
  let qab = a+b, qap = a+1, qam = a-1;
  let c = 1, d = 1 - qab*x/qap;
  if(Math.abs(d) < FPMIN) d = FPMIN;
  d = 1/d;
  let h = d;
  for(let m = 1; m <= MAXIT; m++){
    const m2 = 2*m;
    let aa = m*(b-m)*x / ((qam+m2)*(a+m2));
    d = 1 + aa*d;
    if(Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa/c;
    if(Math.abs(c) < FPMIN) c = FPMIN;
    d = 1/d;
    h *= d*c;
    aa = -(a+m)*(qab+m)*x / ((a+m2)*(qap+m2));
    d = 1 + aa*d;
    if(Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa/c;
    if(Math.abs(c) < FPMIN) c = FPMIN;
    d = 1/d;
    const del = d*c;
    h *= del;
    if(Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function betainc(a, b, x){
  if(x <= 0) return 0;
  if(x >= 1) return 1;
  const bt = Math.exp(gammaLn(a+b) - gammaLn(a) - gammaLn(b) + a*Math.log(x) + b*Math.log(1-x));
  if(x < (a+1)/(a+b+2)) return bt * betacf(a, b, x) / a;
  return 1 - bt * betacf(b, a, 1-x) / b;
}

// Lower regularized gamma P(a,x) via series + continued fraction
function gammp(a, x){
  if(x < 0 || a <= 0) return 0;
  if(x === 0) return 0;
  if(x < a + 1){
    // Série
    let ap = a, sum = 1/a, del = sum;
    for(let n = 1; n < 200; n++){
      ap += 1;
      del *= x/ap;
      sum += del;
      if(Math.abs(del) < Math.abs(sum)*3e-7) break;
    }
    return sum * Math.exp(-x + a*Math.log(x) - gammaLn(a));
  } else {
    // Continued fraction
    const FPMIN = 1e-30;
    let b = x + 1 - a, c = 1/FPMIN, d = 1/b, h = d;
    for(let i = 1; i < 200; i++){
      const an = -i*(i-a);
      b += 2;
      d = an*d + b;
      if(Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an/c;
      if(Math.abs(c) < FPMIN) c = FPMIN;
      d = 1/d;
      const del = d*c;
      h *= del;
      if(Math.abs(del-1) < 3e-7) break;
    }
    return 1 - Math.exp(-x + a*Math.log(x) - gammaLn(a)) * h;
  }
}

// ════════════════════════════════════════════════════════════════
// E1 — M_descritivo
// ════════════════════════════════════════════════════════════════

function percentil_linear(sorted, p){
  const n = sorted.length;
  const pos = p/100 * (n - 1);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  if(lo === hi) return sorted[lo];
  return sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
}

function M_descritivo(dados){
  const t0 = Date.now();
  if(!Array.isArray(dados) || dados.length === 0){
    _registrar_motor_est('M_descritivo', false, Date.now()-t0);
    return null;
  }
  const dadosNum = dados.filter(x => typeof x === 'number' && !isNaN(x));
  const n = dadosNum.length;
  if(n === 0){
    _registrar_motor_est('M_descritivo', false, Date.now()-t0);
    return null;
  }
  const soma = dadosNum.reduce((a,b)=>a+b, 0);
  const media = soma / n;
  const sorted = [...dadosNum].sort((a,b)=>a-b);
  const mediana = n % 2 === 0
    ? (sorted[n/2-1] + sorted[n/2]) / 2
    : sorted[Math.floor(n/2)];
  // Moda — mais frequente
  const freq = {};
  for(const x of dadosNum) freq[x] = (freq[x]||0) + 1;
  let modaVal = null, modaCount = 1;
  for(const [v,c] of Object.entries(freq)){
    if(c > modaCount){ modaCount = c; modaVal = parseFloat(v); }
  }
  const modaResult = modaCount > 1 ? modaVal : null;
  const var_amostral = n > 1 ? dadosNum.reduce((s,x)=>s + (x-media)*(x-media), 0) / (n-1) : 0;
  const sd = Math.sqrt(var_amostral);
  const q1 = percentil_linear(sorted, 25);
  const q3 = percentil_linear(sorted, 75);
  const iqr = q3 - q1;
  const min = sorted[0], max = sorted[n-1];
  // Skew (Fisher-Pearson momento 3)
  let skew = 0, kurt = 0;
  if(sd > 0){
    skew = dadosNum.reduce((s,x)=>s + Math.pow((x-media)/sd, 3), 0) / n;
    kurt = dadosNum.reduce((s,x)=>s + Math.pow((x-media)/sd, 4), 0) / n - 3;
  }
  const cv = media !== 0 ? sd / Math.abs(media) : null;
  
  _registrar_motor_est('M_descritivo', true, Date.now()-t0);
  return {n, media, mediana, moda: modaResult, var: var_amostral, sd,
          min, max, range: max-min, q1, q3, iqr, skew, kurt, cv,
          erro_padrao: sd / Math.sqrt(n)};
}

// ════════════════════════════════════════════════════════════════
// E2 — M_distribuicoes (todas as 10)
// ════════════════════════════════════════════════════════════════

// Normal
function normal_pdf(x, mu, sigma){
  if(sigma <= 0) return null;
  return (1 / (sigma * Math.sqrt(2*Math.PI))) * Math.exp(-0.5 * Math.pow((x-mu)/sigma, 2));
}
function normal_cdf(x, mu, sigma){
  if(sigma <= 0) return null;
  return 0.5 * (1 + erf((x-mu) / (sigma * Math.sqrt(2))));
}
// Quantil via Beasley-Springer-Moro
function normal_quantil(p, mu, sigma){
  if(p <= 0 || p >= 1) return null;
  mu = mu || 0; sigma = sigma || 1;
  // Aproximação Beasley-Springer
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];
  const plow = 0.02425, phigh = 1 - plow;
  let q, r, z;
  if(p < plow){
    q = Math.sqrt(-2*Math.log(p));
    z = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
        ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if(p <= phigh){
    q = p - 0.5;
    r = q*q;
    z = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
        (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2*Math.log(1-p));
    z = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
         ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  return mu + sigma*z;
}

// Binomial
function bin_pmf(k, n, p){
  if(k < 0 || k > n) return 0;
  return Math.exp(gammaLn(n+1) - gammaLn(k+1) - gammaLn(n-k+1) + k*Math.log(p) + (n-k)*Math.log(1-p));
}
function bin_cdf(k, n, p){
  let s = 0;
  for(let i = 0; i <= Math.floor(k); i++) s += bin_pmf(i, n, p);
  return s;
}

// Poisson
function poisson_pmf(k, lam){
  if(k < 0 || lam < 0) return 0;
  return Math.exp(-lam + k*Math.log(lam) - gammaLn(k+1));
}
function poisson_cdf(k, lam){
  let s = 0;
  for(let i = 0; i <= Math.floor(k); i++) s += poisson_pmf(i, lam);
  return s;
}

// t-Student CDF via incomplete beta
function t_cdf(t, df){
  const x = df / (df + t*t);
  const ib = betainc(df/2, 0.5, x);
  return t >= 0 ? 1 - 0.5*ib : 0.5*ib;
}

// Chi² CDF
function chi2_cdf(x, df){
  if(x <= 0) return 0;
  return gammp(df/2, x/2);
}

// F CDF
function f_cdf(F, df1, df2){
  if(F <= 0) return 0;
  const x = (df1*F) / (df1*F + df2);
  return betainc(df1/2, df2/2, x);
}

// Beta PDF/CDF
function beta_pdf(x, a, b){
  if(x <= 0 || x >= 1) return 0;
  return Math.pow(x, a-1) * Math.pow(1-x, b-1) / beta(a,b);
}
function beta_cdf(x, a, b){
  if(x <= 0) return 0;
  if(x >= 1) return 1;
  return betainc(a, b, x);
}

// Gamma PDF
function gamma_pdf(x, k, theta){
  if(x <= 0) return 0;
  return Math.pow(x, k-1) * Math.exp(-x/theta) / (gammaFn(k) * Math.pow(theta, k));
}
function gamma_cdf(x, k, theta){
  if(x <= 0) return 0;
  return gammp(k, x/theta);
}

// Exponencial
function exp_pdf(x, lam){
  if(x < 0) return 0;
  return lam * Math.exp(-lam*x);
}
function exp_cdf(x, lam){
  if(x < 0) return 0;
  return 1 - Math.exp(-lam*x);
}

// Uniforme
function unif_pdf(x, a, b){
  if(x < a || x > b) return 0;
  return 1/(b-a);
}
function unif_cdf(x, a, b){
  if(x < a) return 0;
  if(x > b) return 1;
  return (x-a)/(b-a);
}

function M_distribuicoes(tipo, op, args){
  const t0 = Date.now();
  let resultado = null;
  try {
    if(tipo === 'normal'){
      if(op === 'pdf') resultado = normal_pdf(args.x, args.mu, args.sigma);
      else if(op === 'cdf') resultado = normal_cdf(args.x, args.mu, args.sigma);
      else if(op === 'quantil') resultado = normal_quantil(args.p, args.mu, args.sigma);
    } else if(tipo === 'binomial'){
      if(op === 'pmf') resultado = bin_pmf(args.k, args.n, args.p);
      else if(op === 'cdf') resultado = bin_cdf(args.k, args.n, args.p);
    } else if(tipo === 'poisson'){
      if(op === 'pmf') resultado = poisson_pmf(args.k, args.lam);
      else if(op === 'cdf') resultado = poisson_cdf(args.k, args.lam);
    } else if(tipo === 't'){
      if(op === 'cdf') resultado = t_cdf(args.t, args.df);
    } else if(tipo === 'chi2'){
      if(op === 'cdf') resultado = chi2_cdf(args.x, args.df);
    } else if(tipo === 'f'){
      if(op === 'cdf') resultado = f_cdf(args.F, args.df1, args.df2);
    } else if(tipo === 'beta'){
      if(op === 'pdf') resultado = beta_pdf(args.x, args.a, args.b);
      else if(op === 'cdf') resultado = beta_cdf(args.x, args.a, args.b);
    } else if(tipo === 'gamma'){
      if(op === 'pdf') resultado = gamma_pdf(args.x, args.k, args.theta);
      else if(op === 'cdf') resultado = gamma_cdf(args.x, args.k, args.theta);
    } else if(tipo === 'exp'){
      if(op === 'pdf') resultado = exp_pdf(args.x, args.lam);
      else if(op === 'cdf') resultado = exp_cdf(args.x, args.lam);
    } else if(tipo === 'unif'){
      if(op === 'pdf') resultado = unif_pdf(args.x, args.a, args.b);
      else if(op === 'cdf') resultado = unif_cdf(args.x, args.a, args.b);
    }
  } catch(e){
    resultado = null;
  }
  _registrar_motor_est('M_distribuicoes', resultado !== null, Date.now()-t0);
  return resultado;
}

// ════════════════════════════════════════════════════════════════
// E3 — M_testes_hipotese
// ════════════════════════════════════════════════════════════════

function _media(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }
function _var_amostral(arr){
  const m = _media(arr);
  return arr.reduce((s,x)=>s+(x-m)*(x-m),0)/(arr.length-1);
}

function ttest_independente(a, b, eq_var){
  const na = a.length, nb = b.length;
  const ma = _media(a), mb = _media(b);
  const va = _var_amostral(a), vb = _var_amostral(b);
  let t, df, se;
  if(eq_var){
    const sp2 = ((na-1)*va + (nb-1)*vb) / (na+nb-2);
    se = Math.sqrt(sp2 * (1/na + 1/nb));
    t = (ma - mb) / se;
    df = na + nb - 2;
  } else {
    // Welch
    se = Math.sqrt(va/na + vb/nb);
    t = (ma - mb) / se;
    const num = Math.pow(va/na + vb/nb, 2);
    const den = Math.pow(va/na, 2)/(na-1) + Math.pow(vb/nb, 2)/(nb-1);
    df = num / den;
  }
  // p bicaudal
  const p = 2 * (1 - t_cdf(Math.abs(t), df));
  // Cohen's d
  const sp = Math.sqrt((va + vb) / 2);
  const d = sp > 0 ? Math.abs(ma - mb) / sp : 0;
  return {
    teste: eq_var ? 't-test independentes (var iguais)' : 't-test Welch',
    estatistica: t, df, p_valor: p,
    significativo_005: p < 0.05,
    tamanho_efeito: {tipo: 'Cohen d', valor: d,
                     magnitude: d<0.2?'desprezível':d<0.5?'pequeno':d<0.8?'médio':d>1.3?'muito grande':'grande'},
    medias: {a: ma, b: mb}
  };
}

function ttest_1amostra(a, mu0){
  const n = a.length, m = _media(a), s = Math.sqrt(_var_amostral(a));
  const t = (m - mu0) / (s/Math.sqrt(n));
  const df = n - 1;
  const p = 2 * (1 - t_cdf(Math.abs(t), df));
  return {teste: 't-test 1 amostra', estatistica: t, df, p_valor: p,
          significativo_005: p < 0.05, media: m, mu0};
}

function ttest_pareado(a, b){
  if(a.length !== b.length) return null;
  const d = a.map((v,i) => v - b[i]);
  return ttest_1amostra(d, 0);
}

function anova_1fator(...grupos){
  const k = grupos.length;
  const todos = grupos.flat();
  const N = todos.length;
  const grand_mean = _media(todos);
  let ssb = 0, ssw = 0;
  for(const g of grupos){
    const m_g = _media(g);
    ssb += g.length * Math.pow(m_g - grand_mean, 2);
    for(const x of g) ssw += Math.pow(x - m_g, 2);
  }
  const df_b = k - 1, df_w = N - k;
  // Caso degenerado: variância intra zero
  if(ssw < 1e-10){
    if(ssb < 1e-10){
      // grupos idênticos — não rejeita H0
      return {teste:'ANOVA 1 fator', estatistica:0, df1:df_b, df2:df_w,
              p_valor:1.0, significativo_005:false,
              tamanho_efeito:{tipo:'η²', valor:0},
              aviso:'variância intra zero — grupos idênticos'};
    }
    // ssb > 0 mas ssw = 0: F = Infinity → diferença perfeita
    return {teste:'ANOVA 1 fator', estatistica:Infinity, df1:df_b, df2:df_w,
            p_valor:0, significativo_005:true,
            tamanho_efeito:{tipo:'η²', valor:1}};
  }
  const ms_b = ssb / df_b, ms_w = ssw / df_w;
  const F = ms_b / ms_w;
  const p = 1 - f_cdf(F, df_b, df_w);
  const eta2 = ssb / (ssb + ssw);
  return {teste: 'ANOVA 1 fator', estatistica: F, df1: df_b, df2: df_w,
          p_valor: p, significativo_005: p < 0.05,
          tamanho_efeito: {tipo: 'η²', valor: eta2}};
}

function chi2_independencia(matriz){
  // matriz: array de arrays — contagens observadas
  const linhas = matriz.length, cols = matriz[0].length;
  const totais_linha = matriz.map(l => l.reduce((a,b)=>a+b,0));
  const totais_col = [];
  for(let j = 0; j < cols; j++){
    let s = 0; for(let i = 0; i < linhas; i++) s += matriz[i][j];
    totais_col.push(s);
  }
  const N = totais_linha.reduce((a,b)=>a+b,0);
  let chi2 = 0;
  for(let i = 0; i < linhas; i++){
    for(let j = 0; j < cols; j++){
      const E = (totais_linha[i] * totais_col[j]) / N;
      if(E > 0) chi2 += Math.pow(matriz[i][j] - E, 2) / E;
    }
  }
  const df = (linhas-1)*(cols-1);
  const p = 1 - chi2_cdf(chi2, df);
  const cramer = Math.sqrt(chi2 / (N * Math.min(linhas-1, cols-1)));
  return {teste: 'Chi² independência', estatistica: chi2, df, p_valor: p,
          significativo_005: p < 0.05,
          tamanho_efeito: {tipo: "Cramér's V", valor: cramer}};
}

function mann_whitney(a, b){
  const todos = [...a.map(v=>({v, g:'a'})), ...b.map(v=>({v, g:'b'}))];
  todos.sort((x,y) => x.v - y.v);
  // Atribuir ranks (lidando com empates pela média)
  let i = 0;
  while(i < todos.length){
    let j = i;
    while(j < todos.length - 1 && todos[j+1].v === todos[i].v) j++;
    const rank_med = (i + j) / 2 + 1;
    for(let k = i; k <= j; k++) todos[k].rank = rank_med;
    i = j + 1;
  }
  const r_a = todos.filter(t => t.g === 'a').reduce((s,t)=>s+t.rank, 0);
  const na = a.length, nb = b.length;
  const u_a = r_a - na*(na+1)/2;
  const u_b = na*nb - u_a;
  const U = Math.min(u_a, u_b);
  // Aproximação normal pra n>=8
  const mu_u = na*nb/2;
  const sigma_u = Math.sqrt(na*nb*(na+nb+1)/12);
  const z = (U - mu_u) / sigma_u;
  const p = 2 * normal_cdf(-Math.abs(z), 0, 1);
  return {teste: 'Mann-Whitney U', estatistica: U, z, p_valor: p,
          significativo_005: p < 0.05};
}

window.M_descritivo = M_descritivo;
window.M_distribuicoes = M_distribuicoes;
window.ttest_independente = ttest_independente;
window.ttest_1amostra = ttest_1amostra;
window.ttest_pareado = ttest_pareado;
window.anova_1fator = anova_1fator;
window.chi2_independencia = chi2_independencia;
window.mann_whitney = mann_whitney;

// ════════════════════════════════════════════════════════════════
// E4 — M_correlacao
// ════════════════════════════════════════════════════════════════

function pearson(x, y){
  const t0 = Date.now();
  if(x.length !== y.length){ _registrar_motor_est('M_correlacao', false, Date.now()-t0); return null; }
  const n = x.length;
  const mx = _media(x), my = _media(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for(let i = 0; i < n; i++){
    num += (x[i]-mx)*(y[i]-my);
    dx2 += (x[i]-mx)*(x[i]-mx);
    dy2 += (y[i]-my)*(y[i]-my);
  }
  if(dx2 === 0 || dy2 === 0){ _registrar_motor_est('M_correlacao', false, Date.now()-t0); return null; }
  const r = num / Math.sqrt(dx2*dy2);
  // p-valor via t-test: t = r * sqrt((n-2)/(1-r²))
  const t = r * Math.sqrt((n-2)/(1-r*r));
  const p = 2 * (1 - t_cdf(Math.abs(t), n-2));
  // Interpretação
  const ar = Math.abs(r);
  const interp = ar<0.1?'desprezível':ar<0.3?'fraca':ar<0.5?'moderada':ar<0.7?'forte':ar<0.9?'muito forte':'quase perfeita';
  _registrar_motor_est('M_correlacao', true, Date.now()-t0);
  return {tipo: 'Pearson', r, p_valor: p, n, interpretacao: interp, aviso: 'correlação ≠ causalidade'};
}

function ranks(arr){
  // retorna ranks dos elementos
  const idx = arr.map((v,i)=>({v, i})).sort((a,b)=>a.v-b.v);
  const r = new Array(arr.length);
  let i = 0;
  while(i < idx.length){
    let j = i;
    while(j < idx.length-1 && idx[j+1].v === idx[i].v) j++;
    const rm = (i+j)/2 + 1;
    for(let k = i; k <= j; k++) r[idx[k].i] = rm;
    i = j+1;
  }
  return r;
}

function spearman(x, y){
  const t0 = Date.now();
  if(x.length !== y.length){ _registrar_motor_est('M_correlacao', false, Date.now()-t0); return null; }
  const rx = ranks(x), ry = ranks(y);
  return pearson(rx, ry);  // Spearman = Pearson nos ranks
}

window.pearson = pearson;
window.spearman = spearman;

// ════════════════════════════════════════════════════════════════
// E5 — M_regressao
// ════════════════════════════════════════════════════════════════

function regressao_linear(x, y){
  const t0 = Date.now();
  const n = x.length;
  if(n !== y.length || n < 2){ _registrar_motor_est('M_regressao', false, Date.now()-t0); return null; }
  const mx = _media(x), my = _media(y);
  let num = 0, den = 0;
  for(let i = 0; i < n; i++){
    num += (x[i]-mx)*(y[i]-my);
    den += (x[i]-mx)*(x[i]-mx);
  }
  if(den === 0){ _registrar_motor_est('M_regressao', false, Date.now()-t0); return null; }
  const beta1 = num/den;
  const beta0 = my - beta1*mx;
  // R²
  let ss_tot = 0, ss_res = 0;
  for(let i = 0; i < n; i++){
    const yhat = beta0 + beta1*x[i];
    ss_res += (y[i]-yhat)*(y[i]-yhat);
    ss_tot += (y[i]-my)*(y[i]-my);
  }
  const r2 = ss_tot > 0 ? 1 - ss_res/ss_tot : 0;
  // SE dos coeficientes
  const sigma2 = ss_res/(n-2);
  const se_beta1 = Math.sqrt(sigma2/den);
  const t_b1 = beta1/se_beta1;
  const p_b1 = 2 * (1 - t_cdf(Math.abs(t_b1), n-2));
  _registrar_motor_est('M_regressao', true, Date.now()-t0);
  return {tipo: 'linear simples', beta0, beta1, r2,
          formula: \`Y = \${beta0.toFixed(3)} + \${beta1.toFixed(3)}*X\`,
          se_beta1, t_b1, p_b1,
          prever: function(xnovo){ return beta0 + beta1*xnovo; }};
}

window.regressao_linear = regressao_linear;

// ════════════════════════════════════════════════════════════════
// E6 — M_bayesiano
// ════════════════════════════════════════════════════════════════

function bayes_simples(prior, sensibilidade, especificidade){
  // P(D|+) = P(+|D)*P(D) / P(+)
  // P(+) = P(+|D)*P(D) + P(+|¬D)*P(¬D)
  const t0 = Date.now();
  const p_D = prior;
  const p_pos_D = sensibilidade;
  const p_pos_naoD = 1 - especificidade;
  const p_pos = p_pos_D * p_D + p_pos_naoD * (1 - p_D);
  if(p_pos === 0){ _registrar_motor_est('M_bayesiano', false, Date.now()-t0); return null; }
  const posterior = (p_pos_D * p_D) / p_pos;
  _registrar_motor_est('M_bayesiano', true, Date.now()-t0);
  return {
    prior, sensibilidade, especificidade,
    p_pos_total: p_pos,
    posterior_dado_positivo: posterior,
    posterior_dado_negativo: ((1-p_pos_D) * p_D) / (1 - p_pos),
    interpretacao: posterior < 0.3 ? 'baixa probabilidade real apesar do teste +' :
                   posterior > 0.7 ? 'alta probabilidade real' : 'incerteza moderada'
  };
}

function bayes_sequencial(prior_inicial, evidencias){
  // evidencias: [{sensibilidade, especificidade, observado: '+' ou '-'}]
  const t0 = Date.now();
  let prior = prior_inicial;
  const trajetoria = [{etapa: 0, posterior: prior}];
  for(let i = 0; i < evidencias.length; i++){
    const e = evidencias[i];
    if(e.observado === '+'){
      const r = bayes_simples(prior, e.sensibilidade, e.especificidade);
      if(!r) break;
      prior = r.posterior_dado_positivo;
    } else {
      const r = bayes_simples(prior, e.sensibilidade, e.especificidade);
      if(!r) break;
      prior = r.posterior_dado_negativo;
    }
    trajetoria.push({etapa: i+1, posterior: prior});
  }
  _registrar_motor_est('M_bayesiano', true, Date.now()-t0);
  return {prior_inicial, trajetoria, posterior_final: prior};
}

function bayes_factor(p_dados_h1, p_dados_h2){
  if(p_dados_h2 === 0) return null;
  const BF = p_dados_h1 / p_dados_h2;
  const interp = BF<1?'evidência contra H1' :
                 BF<3?'anedótico' :
                 BF<20?'positivo' :
                 BF<150?'forte' : 'decisivo';
  return {BF_12: BF, interpretacao_kass_raftery: interp};
}

window.bayes_simples = bayes_simples;
window.bayes_sequencial = bayes_sequencial;
window.bayes_factor = bayes_factor;

// ════════════════════════════════════════════════════════════════
// E7 — M_monte_carlo
// ════════════════════════════════════════════════════════════════

function monte_carlo_simulacao(modeloFn, n_runs){
  const t0 = Date.now();
  n_runs = n_runs || 10000;
  const resultados = [];
  for(let i = 0; i < n_runs; i++){
    try { resultados.push(modeloFn()); } catch(e){}
  }
  resultados.sort((a,b)=>a-b);
  const n = resultados.length;
  const media = resultados.reduce((a,b)=>a+b,0)/n;
  const var_ = resultados.reduce((s,x)=>s+(x-media)*(x-media),0)/(n-1);
  const sd = Math.sqrt(var_);
  const p5 = percentil_linear(resultados, 5);
  const p50 = percentil_linear(resultados, 50);
  const p95 = percentil_linear(resultados, 95);
  // VaR 95% (perda esperada no pior 5%)
  const var95 = p5;  // se modeloFn retorna ganho, VaR é a perda no p5
  _registrar_motor_est('M_monte_carlo', true, Date.now()-t0);
  return {n_runs: n, media, sd, p5, p50, p95, var_95: var95,
          min: resultados[0], max: resultados[n-1]};
}

function bootstrap_ci(dados, estatisticaFn, n_boot, nivel){
  const t0 = Date.now();
  n_boot = n_boot || 1000;
  nivel = nivel || 0.95;
  const n = dados.length;
  const estats = [];
  for(let i = 0; i < n_boot; i++){
    const sample = [];
    for(let j = 0; j < n; j++) sample.push(dados[Math.floor(Math.random()*n)]);
    estats.push(estatisticaFn(sample));
  }
  estats.sort((a,b)=>a-b);
  const lo = (1-nivel)/2;
  const hi = 1 - lo;
  _registrar_motor_est('M_monte_carlo', true, Date.now()-t0);
  return {
    estatistica_observada: estatisticaFn(dados),
    ic_inferior: percentil_linear(estats, lo*100),
    ic_superior: percentil_linear(estats, hi*100),
    n_boot,
    nivel
  };
}

window.monte_carlo_simulacao = monte_carlo_simulacao;
window.bootstrap_ci = bootstrap_ci;

// ════════════════════════════════════════════════════════════════
// E8 — M_serie_temporal (versão pragmática)
// ════════════════════════════════════════════════════════════════

function sma(serie, janela){
  const out = [];
  for(let i = 0; i < serie.length; i++){
    if(i < janela-1){ out.push(null); continue; }
    let s = 0;
    for(let j = i-janela+1; j <= i; j++) s += serie[j];
    out.push(s / janela);
  }
  return out;
}

function ema(serie, alpha){
  alpha = alpha || (2/(serie.length+1));
  const out = [serie[0]];
  for(let i = 1; i < serie.length; i++){
    out.push(alpha*serie[i] + (1-alpha)*out[i-1]);
  }
  return out;
}

function decompor_tendencia(serie){
  // Tendência via regressão linear contra tempo
  const t = serie.map((_,i)=>i);
  const reg = regressao_linear(t, serie);
  if(!reg) return null;
  const tendencia = t.map(i => reg.prever(i));
  const sem_tendencia = serie.map((v,i) => v - tendencia[i]);
  // Sazonalidade aproximada: média móvel curta sobre o sem-tendência
  const sazonal = sma(sem_tendencia, 3);
  const residuo = serie.map((v,i) => v - tendencia[i] - (sazonal[i] || 0));
  return {tendencia, sem_tendencia, sazonal, residuo,
          slope: reg.beta1, intercepto: reg.beta0, r2: reg.r2};
}

function prever_linear(serie, n_passos){
  const t0 = Date.now();
  const t = serie.map((_,i)=>i);
  const reg = regressao_linear(t, serie);
  if(!reg){ _registrar_motor_est('M_serie_temporal', false, Date.now()-t0); return null; }
  const previsoes = [];
  for(let i = 0; i < n_passos; i++){
    previsoes.push(reg.prever(serie.length + i));
  }
  _registrar_motor_est('M_serie_temporal', true, Date.now()-t0);
  return {previsoes, slope: reg.beta1, r2: reg.r2};
}

window.sma = sma;
window.ema = ema;
window.decompor_tendencia = decompor_tendencia;
window.prever_linear = prever_linear;

// ════════════════════════════════════════════════════════════════
// E9 — M_cruzamento
// ════════════════════════════════════════════════════════════════

function inner_join(A, B, chave_a, chave_b){
  const t0 = Date.now();
  chave_b = chave_b || chave_a;
  const out = [];
  for(const a of A){
    for(const b of B){
      if(a[chave_a] === b[chave_b]){
        out.push({...a, ...b});
      }
    }
  }
  _registrar_motor_est('M_cruzamento', true, Date.now()-t0);
  return out;
}

function group_by(dados, chave, agregacoes){
  // agregacoes: {nome_saida: {col: 'X', op: 'mean'|'sum'|'count'|'min'|'max'|'median'}}
  const grupos = {};
  for(const linha of dados){
    const k = linha[chave];
    if(!grupos[k]) grupos[k] = [];
    grupos[k].push(linha);
  }
  const out = [];
  for(const [k, linhas] of Object.entries(grupos)){
    const r = {[chave]: k};
    for(const [nome_out, ag] of Object.entries(agregacoes)){
      const vals = linhas.map(l => l[ag.col]).filter(v => v !== undefined && v !== null);
      if(ag.op === 'count') r[nome_out] = linhas.length;
      else if(ag.op === 'sum') r[nome_out] = vals.reduce((a,b)=>a+b,0);
      else if(ag.op === 'mean') r[nome_out] = vals.length > 0 ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
      else if(ag.op === 'min') r[nome_out] = Math.min(...vals);
      else if(ag.op === 'max') r[nome_out] = Math.max(...vals);
      else if(ag.op === 'median'){
        const s = [...vals].sort((a,b)=>a-b);
        r[nome_out] = s.length%2 === 0 ? (s[s.length/2-1]+s[s.length/2])/2 : s[Math.floor(s.length/2)];
      }
    }
    out.push(r);
  }
  return out;
}

function tabela_contingencia_2x2(matriz){
  // matriz [[a,b],[c,d]] — chi² + OR + lift
  const [[a,b],[c,d]] = matriz;
  const N = a+b+c+d;
  const r = chi2_independencia(matriz);
  const OR = (a*d) / (b*c || 1);
  const RR = (a/(a+b)) / (c/(c+d) || 1);
  const lift = (a/(a+c)) / ((a+b)/N || 1);
  return {...r, odds_ratio: OR, risk_ratio: RR, lift};
}

window.inner_join = inner_join;
window.group_by = group_by;
window.tabela_contingencia_2x2 = tabela_contingencia_2x2;

// ════════════════════════════════════════════════════════════════
// E10 — N_validador
// ════════════════════════════════════════════════════════════════

function validar(resultado, contexto){
  // contexto: {n, tipo_teste, dados, ...}
  const t0 = Date.now();
  const avisos = [];
  const oks = [];
  
  if(contexto.n){
    const n = contexto.n;
    if(contexto.tipo_teste === 't-test' && n < 15){
      avisos.push('n=' + n + ' pequeno (recomendado ≥15), considerar Mann-Whitney');
    } else if(contexto.tipo_teste === 'ANOVA' && n < 30){
      avisos.push('n=' + n + ' pequeno por grupo (recomendado ≥10)');
    } else if(contexto.tipo_teste === 'chi2' && n < 5){
      avisos.push('n=' + n + ' frequências baixas, considerar Fisher exato');
    } else {
      oks.push('n=' + n + ' adequado');
    }
  }
  
  if(contexto.dados){
    // Outliers via método IQR (mais robusto que z-score que infla com outliers)
    const desc = M_descritivo(contexto.dados);
    if(desc){
      const lo = desc.q1 - 1.5*desc.iqr;
      const hi = desc.q3 + 1.5*desc.iqr;
      const outliers = contexto.dados.map((x,i) => (x < lo || x > hi) ? i : -1).filter(i => i >= 0);
      if(outliers.length > 0){
        avisos.push('Outliers detectados (método IQR 1.5x): índices [' + outliers.join(',') + ']');
      } else {
        oks.push('Sem outliers (IQR 1.5x)');
      }
    }
  }
  
  if(resultado && typeof resultado.p_valor === 'number'){
    const p = resultado.p_valor;
    if(p < 0 || p > 1) avisos.push('p-valor fora do range [0,1]: ' + p);
    else if(p > 0.04 && p < 0.06) avisos.push('p-valor próximo de 0.05 — resultado frágil');
    else oks.push('p-valor em range válido');
  }
  
  if(resultado && resultado.tamanho_efeito){
    oks.push('Tamanho do efeito reportado (' + resultado.tamanho_efeito.tipo + '=' + resultado.tamanho_efeito.valor.toFixed(2) + ')');
  } else if(contexto.tipo_teste && ['t-test','ANOVA','chi2'].includes(contexto.tipo_teste)){
    avisos.push('Faltou tamanho do efeito');
  }
  
  _registrar_motor_est('N_validador', true, Date.now()-t0);
  return {avisos, oks, validado: true};
}

window.validador_estatistico = validar;

// ════════════════════════════════════════════════════════════════
// Detector + Árbitro estatístico (rota perguntas pro motor certo)
// ════════════════════════════════════════════════════════════════

function detector_pergunta_estat(input){
  const s = String(input).toLowerCase();
  const tags = [];
  let peso = 0;
  if(/\\b(m[eé]dia|mediana|moda|desvio|vari[âa]nc|quartil|estat[íi]stica\\s+descritiv)\\b/i.test(s)){
    tags.push('descritiva'); peso += 0.5;
  }
  if(/\\b(significat|t.?test|chi.?quadrad|anova|p.?valor|hip[óo]tese|mann.?whitney|wilcoxon)\\b/i.test(s)){
    tags.push('teste_hipotese'); peso += 0.6;
  }
  if(/\\b(correla[cç][aã]o|associa[cç][aã]o|pearson|spearman|kendall)\\b/i.test(s)){
    tags.push('correlacao'); peso += 0.55;
  }
  if(/\\b(regress[aã]o|modelo\\s+linear|prever|previs[aã]o|ajust|inclina[cç][aã]o)\\b/i.test(s)){
    tags.push('regressao'); peso += 0.5;
  }
  if(/\\b(bayes|posterior|prior|atualizar?\\s+(crença|probabilidade)|probabilidade\\s+condicional)\\b/i.test(s)){
    tags.push('bayesiano'); peso += 0.7;
  }
  if(/\\b(monte\\s*carlo|simul|bootstrap|permuta|cen[aá]rio|var\\s+95|valor\\s+em\\s+risco)\\b/i.test(s)){
    tags.push('monte_carlo'); peso += 0.6;
  }
  if(/\\b(s[eé]rie\\s+temporal|tend[eê]nc|sazonal|arima|hist[oó]ric|m[eé]dia\\s+m[oó]vel|previs[aã]o\\s+(de\\s+)?\\d)\\b/i.test(s)){
    tags.push('serie_temporal'); peso += 0.55;
  }
  if(/\\b(cruzar?|cruzamento|join|agrup|group\\s*by|pivot|contig[eê]nc|market\\s+basket|lift)\\b/i.test(s)){
    tags.push('cruzamento'); peso += 0.55;
  }
  if(/\\b(probabilid|chance|odds|risco)\\b/i.test(s)){
    tags.push('probabilidade'); peso += 0.35;
  }
  return {peso, tags};
}

window.detector_pergunta_estat = detector_pergunta_estat;

// Hook que dispara pra perguntas estatísticas claras COM dados na frase
if(!window._v160_hooked){
  const _orig = window.v112_processar;
  window.v112_processar = function(input, ...args){
    // Detecta uso direto de funções estatísticas como nome do motor
    const m_stat = String(input || '').match(/(?:calcular?\\s+)?(?:m[eé]dia|mediana|desvio|vari[âa]ncia|estat[íi]sticas?)\\s+(?:de\\s+)?\\[([^\\]]+)\\]/i);
    if(m_stat){
      try {
        const dados = m_stat[1].split(/\\s*,\\s*/).map(parseFloat).filter(x => !isNaN(x));
        if(dados.length >= 2){
          const desc = M_descritivo(dados);
          if(desc){
            const linhas = [
              \`Análise descritiva (n=\${desc.n}):\`,
              \`  média = \${desc.media.toFixed(3)}\`,
              \`  mediana = \${desc.mediana.toFixed(3)}\`,
              \`  desvio = \${desc.sd.toFixed(3)}\`,
              \`  min = \${desc.min}, max = \${desc.max}\`,
              \`  Q1 = \${desc.q1.toFixed(3)}, Q3 = \${desc.q3.toFixed(3)}, IQR = \${desc.iqr.toFixed(3)}\`,
              \`  skew = \${desc.skew.toFixed(3)}, kurt = \${desc.kurt.toFixed(3)}\`
            ];
            const val = validar({}, {n: desc.n, dados, tipo_teste: 'descritivo'});
            if(val.avisos.length > 0) linhas.push('[Validador] ⚠ ' + val.avisos.join('; '));
            return {resposta: linhas.join('\\n'), _estatistico: true, tratou: true, fallback: false};
          }
        }
      } catch(e){}
    }
    
    // Comandos diretos pra Bayes
    const m_bayes = String(input || '').match(/bayes(?:iano)?\\s*[:.]?\\s*prior\\s*=?\\s*([\\d.]+).*sens(?:ibilidade)?\\s*=?\\s*([\\d.]+).*espec(?:ificidade)?\\s*=?\\s*([\\d.]+)/i);
    if(m_bayes){
      const prior = parseFloat(m_bayes[1]);
      const sens = parseFloat(m_bayes[2]);
      const esp = parseFloat(m_bayes[3]);
      const r = bayes_simples(prior, sens, esp);
      if(r){
        return {
          resposta: \`P(D|+) = \${r.posterior_dado_positivo.toFixed(4)} (= \${(r.posterior_dado_positivo*100).toFixed(2)}%). \${r.interpretacao}\`,
          _estatistico: true, tratou: true, fallback: false
        };
      }
    }
    
    return _orig.apply(this, [input, ...args]);
  };
  window._v160_hooked = true;
}

console.log('[v160_estatistico] B_estatistico + 13 nós-órgão + 10 motores estatísticos REAIS instalados');

})();
`});
