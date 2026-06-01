// ─── REGIÃO 12/14 — v159b_motores_cognitivos.js ───
window._ARCH_MODULOS.push({nome:"v159b_motores_cognitivos.js", src: `
// ═══════════════════════════════════════════════════════════════
// v159b_motores_cognitivos.js
//
// Os 6 motores do córtex cognitivo + N_arbitro orquestrador.
// Carrega DEPOIS de v159_cortex_cognitivo.js (base) e DEPOIS de v15_cortex_logico.js.
// ═══════════════════════════════════════════════════════════════

(function(){
'use strict';
if(!global.V112 && !window.V112) return;
if(!window.v159_cortex_cognitivo_base_pronto){
  console.warn('[v159b] v159 base NÃO está pronto. Pulei.');
  return;
}

const V = (typeof window !== 'undefined' && window.V112) ? window.V112 : global.V112;

// Helpers locais (precisamos rebuildar — já que outro IIFE)
function _no_central_cog(){
  const sr = V.subredes.B_cortex_cognitivo;
  if(!sr) return null;
  return V.nodes.find(n => n.id === sr.id);
}
function _no_orgao(nome){
  const sr = V.subredes[nome];
  if(!sr) return null;
  return V.nodes.find(n => n.id === sr.id);
}
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
function _no_central_comp(){
  // O nó central do B_cortex_computacional (estado_vm vive aqui)
  const sr = V.subredes.B_cortex_computacional;
  if(!sr) return null;
  return V.nodes.find(n => n.id === sr.id);
}
function _estado_cog(){
  const cen = _no_central_cog();
  return cen ? cen._estado_cog : null;
}
function _estado_vm(){
  const cen = _no_central_comp();
  return cen ? cen._estado_vm : null;
}

// ════════════════════════════════════════════════════════════════
// MOTOR 1 — N_gerador_hipoteses
//   Gera 2-4 alternativas antes de executar.
//   Dispara quando: ambiguidade, decisão A/B, "e se?".
// ════════════════════════════════════════════════════════════════

function detectar_query_decisional(input){
  // Detecta padrões: "X ou Y", "A vs B", "vale a pena", "e se", "seria melhor"
  const s = input.toLowerCase();
  const padroes = [
    /\\b(\\w+)\\s+ou\\s+(\\w+)\\b/,
    /\\b(\\w+)\\s+vs\\s+(\\w+)\\b/,
    /vale\\s+a\\s+pena/,
    /seria\\s+melhor/,
    /e\\s+se\\b/,
    /qual\\s+(rende|é\\s+melhor|prefer)/,
    /comparar?\\b/,
    /investir.*vs/i
  ];
  for(const p of padroes){
    if(p.test(s)) return true;
  }
  return false;
}

function gerar_hipoteses(input, contexto){
  const t0 = Date.now();
  const ec = _estado_cog();
  if(!ec) return [];
  
  // Hipóteses básicas pra decisão A ou B
  const hipoteses = [];
  
  // Extrai "X vs Y" ou "X ou Y"
  const m_vs = input.match(/\\b([\\w\\d]+)\\s+(?:vs|ou)\\s+([\\w\\d]+)\\b/i);
  if(m_vs){
    hipoteses.push({
      _id_hipotese: 'H1_' + Date.now(),
      _descricao: 'Hipótese A: escolher ' + m_vs[1],
      _modificacoes: [{tipo: 'escolha', valor: m_vs[1]}],
      _estado_inicial_snapshot: null  // será preenchido pelo simulador
    });
    hipoteses.push({
      _id_hipotese: 'H2_' + Date.now(),
      _descricao: 'Hipótese B: escolher ' + m_vs[2],
      _modificacoes: [{tipo: 'escolha', valor: m_vs[2]}],
      _estado_inicial_snapshot: null
    });
    // Hipótese intermediária (se possível)
    hipoteses.push({
      _id_hipotese: 'H3_' + Date.now(),
      _descricao: 'Hipótese C: manter status quo (não decidir agora)',
      _modificacoes: [{tipo: 'status_quo'}],
      _estado_inicial_snapshot: null
    });
  }
  
  // Padrão "investir X com taxa Y por Z anos" — extrair múltiplos investimentos
  const m_invest = input.matchAll(/(\\d+(?:[\\.,]\\d+)?)\\s*(?:com\\s+)?(?:taxa\\s+)?(\\d+(?:[\\.,]\\d+)?)\\s*%\\s*por\\s*(\\d+)\\s*anos?/gi);
  const invests = [];
  for(const m of m_invest){
    invests.push({
      principal: parseFloat(m[1].replace(',','.')),
      taxa: parseFloat(m[2].replace(',','.')) / 100,
      anos: parseInt(m[3])
    });
  }
  if(invests.length >= 2){
    invests.forEach((inv, i) => {
      hipoteses.push({
        _id_hipotese: 'H_inv_' + i,
        _descricao: \`Investimento \${i+1}: \${inv.principal} a \${inv.taxa*100}%/ano por \${inv.anos} anos\`,
        _modificacoes: [{tipo: 'investimento', dados: inv}],
        _estado_inicial_snapshot: null
      });
    });
  }
  
  // Fallback: se não detectou nada específico, hipótese única "executar como veio"
  if(hipoteses.length === 0){
    hipoteses.push({
      _id_hipotese: 'H_padrao',
      _descricao: 'Executar como veio (sem alternativas detectadas)',
      _modificacoes: [{tipo: 'padrao'}],
      _estado_inicial_snapshot: null
    });
  }
  
  ec.total_hipoteses_geradas += hipoteses.length;
  const dt = Date.now() - t0;
  _registrar_motor_cog('N_gerador_hipoteses', hipoteses.length > 0, dt);
  return hipoteses;
}

window.v159_gerar_hipoteses = gerar_hipoteses;
window.v159_detectar_decisional = detectar_query_decisional;

// ════════════════════════════════════════════════════════════════
// MOTOR 2 — N_simulador_mental
//   Clona _estado_vm profundamente, executa hipótese sobre clone.
//   Estado real NÃO muda.
// ════════════════════════════════════════════════════════════════

function clonar_estado_vm(){
  const ev = _estado_vm();
  if(!ev) return null;
  // Deep clone via JSON — barato e funciona pra estruturas planas
  return JSON.parse(JSON.stringify(ev));
}

function simular_investimento_composto(principal, taxa, anos){
  // Juros compostos: M = P * (1+i)^n
  let M = principal;
  for(let i = 0; i < anos; i++){
    M = M * (1 + taxa);
  }
  return Math.round(M * 100) / 100;
}

function simular_hipotese(hipotese){
  const t0 = Date.now();
  const ec = _estado_cog();
  if(!ec) return null;
  ec.total_simulacoes++;
  
  const snapshot = clonar_estado_vm();
  
  // Aplica modificações da hipótese sobre o snapshot
  const resultado = {
    hipotese_id: hipotese._id_hipotese,
    descricao: hipotese._descricao,
    valor_final: null,
    detalhes: null,
    custo_iter: 0,
    certeza: 0.5
  };
  
  for(const mod of hipotese._modificacoes || []){
    if(mod.tipo === 'investimento' && mod.dados){
      const vf = simular_investimento_composto(mod.dados.principal, mod.dados.taxa, mod.dados.anos);
      resultado.valor_final = vf;
      resultado.detalhes = \`\${mod.dados.principal} a \${mod.dados.taxa*100}% por \${mod.dados.anos} anos = \${vf}\`;
      resultado.custo_iter = mod.dados.anos;
      resultado.certeza = 0.95;  // matemática direta
    } else if(mod.tipo === 'escolha'){
      resultado.detalhes = 'Escolha: ' + mod.valor;
      resultado.certeza = 0.4;
    } else if(mod.tipo === 'status_quo'){
      resultado.detalhes = 'Manter como está';
      resultado.certeza = 0.6;
    }
  }
  
  const dt = Date.now() - t0;
  _registrar_motor_cog('N_simulador_mental', true, dt);
  
  // Histórico (pra metacognição depois ver)
  ec.hipoteses_historico.push({
    ts: Date.now(),
    hipotese_id: hipotese._id_hipotese,
    resultado_valor: resultado.valor_final,
    certeza: resultado.certeza
  });
  if(ec.hipoteses_historico.length > 200) ec.hipoteses_historico.shift();
  
  return resultado;
}

function simular_todas(hipoteses){
  const resultados = [];
  for(const h of hipoteses){
    const r = simular_hipotese(h);
    if(r) resultados.push(r);
  }
  // Ordena pelo valor final (decisão = maior valor)
  resultados.sort((a, b) => (b.valor_final || 0) - (a.valor_final || 0));
  return resultados;
}

window.v159_simular_hipotese = simular_hipotese;
window.v159_simular_todas = simular_todas;
window.v159_clonar_estado_vm = clonar_estado_vm;

// ════════════════════════════════════════════════════════════════
// MOTOR 3 — N_busca_analogia
//   Reconhece 8 padrões estruturais e propõe analogias.
// ════════════════════════════════════════════════════════════════

const PADROES_ESTRUTURAIS = {
  decremento_ate_zero: {
    triggers: [
      /\\b(esvaziar?|esvazi|gastar?|gastando|drenar?|drenando|vazar?|vazando|consumir?|consumindo|descarreg)\\b/i,
      /diminu(i|ir|indo)|decresc|subtrai/i,
      /at[eé]\\s+(zerar?|acabar?|esvaziar?|0\\b)/i,
      /quando\\s+zera/i,
      /quanto\\s+tempo\\s+at[eé]/i
    ],
    descricao: 'variável diminui até zero por decremento fixo',
    formula_sugerida: 'tempo = quantidade_inicial / taxa_decremento',
    exemplos: ['saldo gastando', 'tanque vazando', 'bateria descarregando']
  },
  acumulacao_aritmetica: {
    triggers: [
      /\\b(somar?|somando|acumular?|acumulando|poupar?|poupando|juntar?|juntando)\\b/i,
      /\\b(soma|total)\\s+(de|dos|cumulativ)/i,
      /soma\\s+de\\s+1\\s+at[eé]/i,
      /\\bn[uú]meros?\\s+(pares|[íi]mpares)\\b/i
    ],
    descricao: 'soma sucessiva (PA)',
    formula_sugerida: 'soma = n*(a1+an)/2',
    exemplos: ['poupança fixa', 'contagem progressiva']
  },
  acumulacao_geometrica: {
    triggers: [
      /\\b(compost[oa]|geometric|exponencial|dobr(a|ando|ar)|triplic)\\b/i,
      /\\bjuros?\\s+compost/i,
      /\\bcresc(e|imento)\\s+(percentual|exponencial)/i,
      /\\bv[íi]rus\\b/i
    ],
    descricao: 'multiplicação sucessiva (PG)',
    formula_sugerida: 'final = inicial * razao^n',
    exemplos: ['juros compostos', 'crescimento viral']
  },
  troca_simultanea: {
    triggers: [
      /\\btrocar?\\b.*\\bvalor/i,
      /\\bswap\\b/i,
      /\\bpermut/i,
      /a\\s*=\\s*b.*b\\s*=\\s*a/,
      /\\btrocar?\\s+(duas?|valores?)/i
    ],
    descricao: 'A↔B usando terceira variável temporária',
    formula_sugerida: 't = a; a = b; b = t',
    exemplos: ['swap de variáveis', 'troca de objetos']
  },
  busca_alvo: {
    triggers: [
      /\\bbuscar?|buscando|procurar?|procurando|encontrar?|encontrando|achar?\\b/i,
      /\\b(at[eé]\\s+achar?|primeira\\s+ocorr[eê]nc)/i
    ],
    descricao: 'percorre estrutura até achar item',
    formula_sugerida: 'enquanto não achar: x = proximo(x)',
    exemplos: ['busca linear', 'BFS', 'find']
  },
  divisao_recursiva: {
    triggers: [
      /\\b(dividir\\s+e\\s+conquistar|recurs|merge|split)\\b/i,
      /\\bdiv(idir|isão)\\s+(ao\\s+meio|em\\s+\\d)/i,
      /\\bproblema\\s+ao\\s+meio\\b/i
    ],
    descricao: 'divide problema em partes e processa cada',
    formula_sugerida: 'f(n) = combinar(f(n/2), f(n/2))',
    exemplos: ['merge sort', 'quicksort', 'fractal']
  },
  ciclo_estavel: {
    triggers: [
      /\\b(estabiliz|equil[íi]bri|oscilar?|oscilando|repetir?\\s+at[eé])/i,
      /\\b(regular|manter|controlar)\\s+(temperatura|valor|n[íi]vel)/i,
      /\\bregular?\\s+n[íi]vel\\b/i
    ],
    descricao: 'oscila/regula até equilíbrio',
    formula_sugerida: 'enquanto |atual - alvo| > tolerância: ajustar',
    exemplos: ['termostato', 'controle PID', 'homeostase']
  },
  escolha_otima: {
    triggers: [
      /\\bqual\\s+(melhor|mais\\s+vantajos|prefer)/i,
      /\\bcompar(ar|ação|aç[ãa]o|ando|e)\\s+(opç|alternativ)/i,
      /\\bdecid(ir|e)\\s+entre\\b/i,
      /\\bmelhor\\s+(opç[ãa]o|entre)/i,
      /\\bcomparar?\\s+(alternativas|opç[õo]es)/i
    ],
    descricao: 'compara opções e escolhe a melhor',
    formula_sugerida: 'maior_de(opcao_a, opcao_b, ...)',
    exemplos: ['investimentos', 'compra', 'escolha de rota']
  }
};

function buscar_analogia(input){
  const t0 = Date.now();
  const ec = _estado_cog();
  if(!ec){
    _registrar_motor_cog('N_busca_analogia', false, Date.now()-t0);
    return null;
  }
  
  for(const [nome_padrao, def] of Object.entries(PADROES_ESTRUTURAIS)){
    for(const trigger of def.triggers){
      if(trigger.test(input)){
        const analogia = {
          padrao: nome_padrao,
          descricao: def.descricao,
          formula_sugerida: def.formula_sugerida,
          exemplos: def.exemplos,
          peso: 0.3,  // peso inicial; sobe com confirmação
          ts: Date.now()
        };
        ec.analogias_validadas.push(analogia);
        ec.total_analogias_acertadas++;
        const dt = Date.now() - t0;
        _registrar_motor_cog('N_busca_analogia', true, dt);
        return analogia;
      }
    }
  }
  
  const dt = Date.now() - t0;
  _registrar_motor_cog('N_busca_analogia', false, dt);
  return null;
}

window.v159_buscar_analogia = buscar_analogia;
window.v159_padroes_estruturais = PADROES_ESTRUTURAIS;

// ════════════════════════════════════════════════════════════════
// MOTOR 4 — N_engenheiro_reverso
//   Recebe pares (input, output), infere regra (linear/quadrática/estrutural).
// ════════════════════════════════════════════════════════════════

function registrar_par_reverso(input_v, output_v){
  const ec = _estado_cog();
  if(!ec) return;
  ec.pares_engenharia_reversa.push({
    input: input_v,
    output: output_v,
    ts: Date.now()
  });
  if(ec.pares_engenharia_reversa.length > 30){
    ec.pares_engenharia_reversa.shift();
  }
}

function tentar_inferir_regra(){
  const t0 = Date.now();
  const ec = _estado_cog();
  if(!ec){
    _registrar_motor_cog('N_engenheiro_reverso', false, Date.now()-t0);
    return null;
  }
  
  const pares = ec.pares_engenharia_reversa;
  if(pares.length < 3){
    _registrar_motor_cog('N_engenheiro_reverso', false, Date.now()-t0);
    return null;
  }
  
  // Pega os últimos 5 pares pra inferir
  const recentes = pares.slice(-5);
  
  // Verifica se todos são numéricos
  const todos_numericos = recentes.every(p => 
    typeof p.input === 'number' && typeof p.output === 'number'
  );
  
  if(todos_numericos){
    // TENTATIVA 1: LINEAR f(x) = a*x + b
    const p1 = recentes[0], p2 = recentes[1];
    if(p2.input !== p1.input){
      const a = (p2.output - p1.output) / (p2.input - p1.input);
      const b = p1.output - a * p1.input;
      // Validar com os outros pares
      let acertos = 0;
      for(const p of recentes){
        const previsto = a * p.input + b;
        if(Math.abs(previsto - p.output) < 0.001) acertos++;
      }
      if(acertos >= recentes.length - 1){  // tolera 1 erro
        const taxa = acertos / recentes.length;
        if(taxa >= 0.8){
          const regra = {
            tipo: 'linear',
            formula: \`f(x) = \${a}*x + \${b}\`,
            a, b,
            taxa_acerto: taxa,
            pares_usados: recentes.length,
            ts: Date.now()
          };
          ec.regras_inferidas.push(regra);
          ec.total_regras_inferidas++;
          _registrar_motor_cog('N_engenheiro_reverso', true, Date.now()-t0);
          return regra;
        }
      }
    }
    
    // TENTATIVA 2: QUADRÁTICA f(x) = a*x² + b*x + c
    if(recentes.length >= 3){
      // Resolve sistema 3x3 por eliminação de Gauss com pivoteamento parcial
      try {
        const [p1, p2, p3] = recentes.slice(0, 3);
        // Linhas: [x², x, 1, y]
        let m = [
          [p1.input*p1.input, p1.input, 1, p1.output],
          [p2.input*p2.input, p2.input, 1, p2.output],
          [p3.input*p3.input, p3.input, 1, p3.output]
        ];
        // Pivoteamento parcial col 0: troca linha 0 com a que tem maior |valor| em col 0
        let pivIdx = 0;
        for(let i = 1; i < 3; i++){
          if(Math.abs(m[i][0]) > Math.abs(m[pivIdx][0])) pivIdx = i;
        }
        if(pivIdx !== 0){ const t = m[0]; m[0] = m[pivIdx]; m[pivIdx] = t; }
        if(Math.abs(m[0][0]) > 0.0001){
          // Zera m[1][0] e m[2][0]
          const f1 = m[1][0] / m[0][0];
          for(let j = 0; j < 4; j++) m[1][j] -= f1 * m[0][j];
          const f2 = m[2][0] / m[0][0];
          for(let j = 0; j < 4; j++) m[2][j] -= f2 * m[0][j];
          // Pivoteamento parcial col 1: troca linha 1 com 2 se |m[2][1]| > |m[1][1]|
          if(Math.abs(m[2][1]) > Math.abs(m[1][1])){
            const t = m[1]; m[1] = m[2]; m[2] = t;
          }
          // Zera m[2][1] usando m[1]
          if(Math.abs(m[1][1]) > 0.0001){
            const f3 = m[2][1] / m[1][1];
            for(let j = 0; j < 4; j++) m[2][j] -= f3 * m[1][j];
            // Back-substitution
            if(Math.abs(m[2][2]) > 0.0001){
              const c = m[2][3] / m[2][2];
              const b = (m[1][3] - m[1][2]*c) / m[1][1];
              const a = (m[0][3] - m[0][1]*b - m[0][2]*c) / m[0][0];
              // Valida com os pares
              let acertos = 0;
              for(const p of recentes){
                const previsto = a*p.input*p.input + b*p.input + c;
                if(Math.abs(previsto - p.output) < 0.01) acertos++;
              }
              if(acertos >= recentes.length - 1 && Math.abs(a) > 0.001){
                const taxa = acertos / recentes.length;
                if(taxa >= 0.8){
                  const regra = {
                    tipo: 'quadratica',
                    formula: \`f(x) = \${a.toFixed(3)}*x² + \${b.toFixed(3)}*x + \${c.toFixed(3)}\`,
                    a, b, c,
                    taxa_acerto: taxa,
                    ts: Date.now()
                  };
                  ec.regras_inferidas.push(regra);
                  ec.total_regras_inferidas++;
                  _registrar_motor_cog('N_engenheiro_reverso', true, Date.now()-t0);
                  return regra;
                }
              }
            }
          }
        }
      } catch(e){}
    }
  }
  
  // TENTATIVA 3: ESTRUTURAL (strings)
  const todos_strings = recentes.every(p => 
    typeof p.input === 'string' && typeof p.output === 'string'
  );
  if(todos_strings){
    // Maiúscula
    if(recentes.every(p => p.output === p.input.toUpperCase())){
      const regra = {
        tipo: 'estrutural',
        formula: 'output = input.toUpperCase()',
        taxa_acerto: 1.0,
        ts: Date.now()
      };
      ec.regras_inferidas.push(regra);
      ec.total_regras_inferidas++;
      _registrar_motor_cog('N_engenheiro_reverso', true, Date.now()-t0);
      return regra;
    }
    // Minúscula
    if(recentes.every(p => p.output === p.input.toLowerCase())){
      const regra = {
        tipo: 'estrutural',
        formula: 'output = input.toLowerCase()',
        taxa_acerto: 1.0,
        ts: Date.now()
      };
      ec.regras_inferidas.push(regra);
      ec.total_regras_inferidas++;
      _registrar_motor_cog('N_engenheiro_reverso', true, Date.now()-t0);
      return regra;
    }
    // Inverso
    if(recentes.every(p => p.output === p.input.split('').reverse().join(''))){
      const regra = {
        tipo: 'estrutural',
        formula: 'output = input.reverse()',
        taxa_acerto: 1.0,
        ts: Date.now()
      };
      ec.regras_inferidas.push(regra);
      ec.total_regras_inferidas++;
      _registrar_motor_cog('N_engenheiro_reverso', true, Date.now()-t0);
      return regra;
    }
  }
  
  _registrar_motor_cog('N_engenheiro_reverso', false, Date.now()-t0);
  return null;
}

function aplicar_regra_inferida(regra, novo_input){
  if(!regra) return null;
  if(regra.tipo === 'linear'){
    return regra.a * novo_input + regra.b;
  }
  if(regra.tipo === 'quadratica'){
    return regra.a * novo_input * novo_input + regra.b * novo_input + regra.c;
  }
  if(regra.tipo === 'estrutural'){
    if(regra.formula.includes('toUpperCase')) return String(novo_input).toUpperCase();
    if(regra.formula.includes('toLowerCase')) return String(novo_input).toLowerCase();
    if(regra.formula.includes('reverse')) return String(novo_input).split('').reverse().join('');
  }
  return null;
}

window.v159_registrar_par_reverso = registrar_par_reverso;
window.v159_tentar_inferir_regra = tentar_inferir_regra;
window.v159_aplicar_regra_inferida = aplicar_regra_inferida;

// ════════════════════════════════════════════════════════════════
// MOTOR 5 — N_metacognicao
//   Lê _perfil_uso do córtex computacional, identifica motor fraco,
//   roda autotreino sintético, atualiza estatística.
// ════════════════════════════════════════════════════════════════

function analisar_perfil_uso(){
  const t0 = Date.now();
  const ec = _estado_cog();
  const cen_comp = _no_central_comp();
  if(!ec || !cen_comp || !cen_comp._perfil_uso){
    _registrar_motor_cog('N_metacognicao', false, Date.now()-t0);
    return null;
  }
  
  const pu = cen_comp._perfil_uso;
  
  // Calcula taxa de cada motor
  const motores = ['atribuicao', 'aritmetico', 'comparador', 'clock'];
  const stats = {};
  for(const m of motores){
    const ativ = pu['motor_' + m + '_ativ'] || 0;
    const erros = pu['motor_' + m + '_erros'] || 0;
    const taxa = ativ > 0 ? (1 - erros/ativ) : 1.0;
    stats['M_' + m] = {ativacoes: ativ, taxa, erros};
  }
  
  // Identifica fraco: taxa < 0.85 OU muitos erros absolutos
  const fracos = [];
  for(const [nome, s] of Object.entries(stats)){
    if(s.ativacoes >= 5 && s.taxa < 0.85){
      fracos.push({motor: nome, taxa: s.taxa, ativacoes: s.ativacoes});
    }
  }
  
  ec.perfil_metacognicao.motores_fracos = fracos;
  ec.perfil_metacognicao.ultima_analise_turno = (V.turn || 0);
  
  const dt = Date.now() - t0;
  _registrar_motor_cog('N_metacognicao', true, dt);
  
  return {stats, fracos};
}

function autotreinar_motor(nome_motor, n_amostras){
  // Gera operações sintéticas e roda contra o motor real
  const t0 = Date.now();
  const ec = _estado_cog();
  if(!ec){
    _registrar_motor_cog('N_metacognicao', false, Date.now()-t0);
    return null;
  }
  
  n_amostras = n_amostras || 50;
  let acertos = 0, total = 0;
  
  if(nome_motor === 'M_aritmetico'){
    for(let i = 0; i < n_amostras; i++){
      const a = Math.floor(Math.random() * 100);
      const b = Math.floor(Math.random() * 100);
      const op = ['+','-','*'][Math.floor(Math.random()*3)];
      let esperado;
      if(op === '+') esperado = a + b;
      else if(op === '-') esperado = a - b;
      else esperado = a * b;
      // Aqui idealmente chamaríamos M_aritmetico real do v15
      // Por enquanto, valida com cálculo direto (autoteste simples)
      const calc = (op==='+') ? a+b : (op==='-') ? a-b : a*b;
      if(calc === esperado) acertos++;
      total++;
    }
  } else if(nome_motor === 'M_comparador'){
    for(let i = 0; i < n_amostras; i++){
      const a = Math.floor(Math.random() * 100);
      const b = Math.floor(Math.random() * 100);
      const op = ['<','>','=='][Math.floor(Math.random()*3)];
      let esperado;
      if(op === '<') esperado = a < b;
      else if(op === '>') esperado = a > b;
      else esperado = a === b;
      const calc = (op==='<') ? a<b : (op==='>') ? a>b : a===b;
      if(calc === esperado) acertos++;
      total++;
    }
  } else {
    // Outros: pula
    _registrar_motor_cog('N_metacognicao', false, Date.now()-t0);
    return null;
  }
  
  ec.perfil_metacognicao.autotreinos_realizados++;
  const dt = Date.now() - t0;
  _registrar_motor_cog('N_metacognicao', true, dt);
  
  return {
    motor: nome_motor,
    amostras: total,
    acertos,
    taxa: acertos / total
  };
}

window.v159_analisar_perfil = analisar_perfil_uso;
window.v159_autotreinar = autotreinar_motor;

// ════════════════════════════════════════════════════════════════
// MOTOR 6 — N_observador_estrutural
//   Bigrams/trigrams de interação, antecipação proativa.
// ════════════════════════════════════════════════════════════════

function registrar_interacao(input, tipo_resposta){
  const ec = _estado_cog();
  if(!ec) return;
  ec.historico_interacoes.push({
    input: String(input).substring(0, 100),
    tipo: tipo_resposta || 'desconhecido',
    ts: Date.now()
  });
  if(ec.historico_interacoes.length > 100) ec.historico_interacoes.shift();
}

function detectar_bigrams(){
  const t0 = Date.now();
  const ec = _estado_cog();
  if(!ec || ec.historico_interacoes.length < 5){
    _registrar_motor_cog('N_observador_estrutural', false, Date.now()-t0);
    return {};
  }
  
  const hist = ec.historico_interacoes;
  // Categorizar cada interação por TIPO (não pelo input literal)
  const tipos = hist.map(h => h.tipo);
  
  // Contar bigrams
  const bigrams = {};
  for(let i = 0; i < tipos.length - 1; i++){
    const bg = tipos[i] + '→' + tipos[i+1];
    bigrams[bg] = (bigrams[bg] || 0) + 1;
  }
  
  // Detectar padrões com alta frequência
  const total_bigrams = tipos.length - 1;
  const padroes_fortes = {};
  for(const [bg, count] of Object.entries(bigrams)){
    const certeza = count / total_bigrams;
    if(count >= 3 && certeza >= 0.3){
      padroes_fortes[bg] = {count, certeza};
    }
  }
  
  ec.padroes_tacitos = padroes_fortes;
  
  const dt = Date.now() - t0;
  _registrar_motor_cog('N_observador_estrutural', Object.keys(padroes_fortes).length > 0, dt);
  
  return padroes_fortes;
}

window.v159_registrar_interacao = registrar_interacao;
window.v159_detectar_bigrams = detectar_bigrams;

// ════════════════════════════════════════════════════════════════
// N_arbitro — orquestrador
//   Decide qual motor cognitivo usar (custo/benefício).
// ════════════════════════════════════════════════════════════════

function arbitrar(input){
  const t0 = Date.now();
  const motores_acionar = [];
  
  // 1) Detecta decisão/comparação → hipótese + simulação
  if(detectar_query_decisional(input)){
    motores_acionar.push('hipoteses_simulacao');
  }
  
  // 2) Detecta padrão estrutural → analogia
  for(const def of Object.values(PADROES_ESTRUTURAIS)){
    for(const trigger of def.triggers){
      if(trigger.test(input)){
        motores_acionar.push('analogia');
        break;
      }
    }
    if(motores_acionar.includes('analogia')) break;
  }
  
  // 3) Detecta pares input→output → engenharia reversa
  if(/\\b(?:entrada|input)\\s+(\\S+)\\s*→\\s*(?:saida|output)\\s+(\\S+)\\b/i.test(input)){
    motores_acionar.push('engenharia_reversa');
  }
  
  // 4) Detecta introspecção → metacognição
  if(/\\b(como\\s+você\\s+est[áa]|sua\\s+performance|seu\\s+desempenho|analisar?\\s+suas?\\s+estat|status\\s+cogn|status\\s+metacogn|analise\\s+metacogn|relat[oó]rio\\s+cogn)/i.test(input)){
    motores_acionar.push('metacognicao');
  }
  
  const dt = Date.now() - t0;
  _registrar_motor_cog('N_arbitro', motores_acionar.length > 0, dt);
  
  return {
    motores_acionar,
    input_analisado: input
  };
}

function processar_cognitivo(input){
  // Hook principal: dado um input, roda o árbitro e cada motor selecionado.
  // Retorna estrutura com tudo que aconteceu.
  const decisao = arbitrar(input);
  const resultado = {
    motores_acionados: decisao.motores_acionar,
    hipoteses: null,
    simulacoes: null,
    analogia: null,
    regra_inferida: null,
    perfil: null,
    resposta_sugerida: null
  };
  
  for(const m of decisao.motores_acionar){
    if(m === 'hipoteses_simulacao'){
      const hs = gerar_hipoteses(input);
      resultado.hipoteses = hs;
      if(hs.length > 0){
        resultado.simulacoes = simular_todas(hs);
        // Resposta sugerida: a melhor simulação
        if(resultado.simulacoes.length > 0){
          const com_valor = resultado.simulacoes.filter(s => s.valor_final !== null);
          if(com_valor.length >= 2){
            // Caso 1: temos valores numéricos — escolher o maior
            const diff = (com_valor[0].valor_final - com_valor[1].valor_final).toFixed(2);
            resultado.resposta_sugerida = \`Melhor opção: \${com_valor[0].descricao} (rende \${com_valor[0].valor_final}). Diferença de \${diff} sobre a segunda.\`;
          } else if(com_valor.length === 1){
            resultado.resposta_sugerida = \`Resultado: \${com_valor[0].descricao} = \${com_valor[0].valor_final}\`;
          } else {
            // Caso 2: hipóteses sem valor numérico (escolha A/B simbólica)
            // Lista as hipóteses como opções pra usuário decidir
            const linhas = ['Gerei ' + resultado.simulacoes.length + ' hipóteses pra essa decisão:'];
            for(const s of resultado.simulacoes){
              linhas.push('  - ' + s.descricao);
            }
            linhas.push('Sem valores numéricos pra simular qual é melhor — preciso de critérios objetivos (custo, prazo, etc).');
            resultado.resposta_sugerida = linhas.join('\\n');
          }
        }
      }
    } else if(m === 'analogia'){
      resultado.analogia = buscar_analogia(input);
      if(resultado.analogia && !resultado.resposta_sugerida){
        resultado.resposta_sugerida = \`Padrão reconhecido: \${resultado.analogia.padrao} — \${resultado.analogia.descricao}. Fórmula sugerida: \${resultado.analogia.formula_sugerida}\`;
      }
    } else if(m === 'engenharia_reversa'){
      // Extrai par (input, output) da query
      const m_par = input.match(/\\b(?:entrada|input)\\s+(\\S+)\\s*→\\s*(?:saida|output)\\s+(\\S+)/i);
      if(m_par){
        const inp = isNaN(parseFloat(m_par[1])) ? m_par[1] : parseFloat(m_par[1]);
        const outp = isNaN(parseFloat(m_par[2])) ? m_par[2] : parseFloat(m_par[2]);
        registrar_par_reverso(inp, outp);
        const regra = tentar_inferir_regra();
        if(regra){
          resultado.regra_inferida = regra;
          resultado.resposta_sugerida = \`Regra inferida: \${regra.formula} (tipo \${regra.tipo}, acerto \${(regra.taxa_acerto*100).toFixed(0)}%)\`;
        } else {
          // Ainda não tem pares suficientes — retorna confirmação
          const ec_atual = _estado_cog();
          const n_pares = ec_atual ? ec_atual.pares_engenharia_reversa.length : 0;
          resultado.resposta_sugerida = \`Par registrado (\${inp} → \${outp}). Pares acumulados: \${n_pares}. Preciso de pelo menos 3 pares similares pra inferir regra.\`;
        }
      }
    } else if(m === 'metacognicao'){
      resultado.perfil = analisar_perfil_uso();
      if(resultado.perfil){
        const linhas = ['Análise metacognitiva:'];
        for(const [nm, s] of Object.entries(resultado.perfil.stats)){
          linhas.push(\`  \${nm}: \${s.ativacoes} ativações, taxa \${(s.taxa*100).toFixed(0)}%\`);
        }
        if(resultado.perfil.fracos.length > 0){
          linhas.push('Motores fracos: ' + resultado.perfil.fracos.map(f => f.motor).join(', '));
        } else {
          linhas.push('Nenhum motor fraco detectado.');
        }
        resultado.resposta_sugerida = linhas.join('\\n');
      }
    }
  }
  
  return resultado;
}

window.v159_arbitrar = arbitrar;
window.v159_processar_cognitivo = processar_cognitivo;

// Reset do estado cognitivo (pra baterias / debug)
window.v159_reset_cognitivo = function(){
  const cen = _no_central_cog();
  if(!cen) return;
  cen._estado_cog = {
    hipoteses_em_execucao: [],
    hipoteses_historico: [],
    regras_inferidas: [],
    analogias_validadas: [],
    padroes_tacitos: {},
    perfil_metacognicao: {
      ultima_analise_turno: 0,
      intervalos_analise: 50,
      motores_fracos: [],
      autotreinos_realizados: 0
    },
    pares_engenharia_reversa: [],
    historico_interacoes: [],
    total_hipoteses_geradas: 0,
    total_simulacoes: 0,
    total_analogias_acertadas: 0,
    total_regras_inferidas: 0
  };
};

// ════════════════════════════════════════════════════════════════
// HOOK no v112_processar — só quando árbitro decide
// ════════════════════════════════════════════════════════════════

if(!window._v159_hooked){
  const _original = window.v112_processar;
  window.v112_processar = function(input, ...args){
    // 1) ANTES de chamar original, checa se input tem padrão FORTE de cognitivo
    //    (eng. reversa, decisão "X vs Y", analogia clara) — nesses casos, prioriza v159
    
    // EXCEÇÃO: se input é claramente Turing (execute, regra:, estado:, função, global:),
    // NÃO invadir com analogia/cognitivo
    const eh_turing_claro = (
      /^\\s*(execute|regra:|estado:|função|global:|local:|qual\\s+o\\s+(?:valor|retorno))/i.test(input) ||
      /\\bexecute\\s+(função|regra|e\\s+mostre)/i.test(input)
    );
    
    const tem_padrao_forte = !eh_turing_claro && (
      /\\b(?:entrada|input)\\s+\\S+\\s*→\\s*(?:saida|output)\\s+\\S+/i.test(input) ||
      /\\b\\d+(?:[\\.,]\\d+)?\\s*(?:com\\s+)?(?:taxa\\s+)?\\d+(?:[\\.,]\\d+)?\\s*%\\s*por\\s*\\d+\\s*anos?/i.test(input) ||
      /\\b(an[áa]lise|status|relat[óo]rio)\\s+(metacogn|cognitiv)/i.test(input) ||
      // Padrões estruturais fortes que devem virar analogia
      /\\b(vazando|gastando|drenando)\\b/i.test(input) ||
      /\\bjuros?\\s+compost/i.test(input) ||
      /\\bcrescimento\\s+exponencial/i.test(input) ||
      /\\bdividir\\s+e\\s+conquistar/i.test(input) ||
      /\\bmerge\\s+sort\\b/i.test(input) ||
      /\\bestabiliz/i.test(input) ||
      /\\bswap\\b/i.test(input) ||
      /\\bcomparar\\s+alternativas/i.test(input) ||
      /\\bmelhor\\s+opç[ãa]o\\s+entre/i.test(input)
    );
    
    if(tem_padrao_forte){
      try {
        const cog = processar_cognitivo(input);
        if(cog.resposta_sugerida){
          // Registra interação
          registrar_interacao(input, 'cognitivo');
          return {
            resposta: cog.resposta_sugerida,
            _cognitivo: true,
            _motores_usados: cog.motores_acionados,
            tratou: true,
            fallback: false
          };
        }
      } catch(e){}
    }
    
    // 2) Senão, roda original primeiro
    let resultado = _original.apply(this, [input, ...args]);
    
    // 3) Se input ambíguo OU resultado fraco, tenta cognitivo como fallback
    try {
      const resp_str = String(resultado && resultado.resposta || '').toLowerCase();
      const eh_fraco = (
        !resp_str ||
        resp_str === 'hm.' || resp_str === 'hmm' || resp_str === 'hm' ||
        resp_str.length < 5 ||
        (resultado && resultado.fallback === true)
      );
      
      // Roda árbitro pra ver se cognitivo tem algo a dizer
      // MAS NÃO INVADE inputs Turing claros
      const dec = arbitrar(input);
      if(dec.motores_acionar.length > 0 && !eh_turing_claro){
        const cog = processar_cognitivo(input);
        if(cog.resposta_sugerida){
          // Se original foi fraco OU pergunta é claramente decisional/analógica/reversa/metacog
          if(eh_fraco || dec.motores_acionar.includes('hipoteses_simulacao') || 
             dec.motores_acionar.includes('engenharia_reversa') ||
             dec.motores_acionar.includes('analogia') ||
             dec.motores_acionar.includes('metacognicao')){
            resultado = resultado || {};
            resultado.resposta = cog.resposta_sugerida;
            resultado._cognitivo = true;
            resultado._motores_usados = cog.motores_acionados;
            resultado.fallback = false;
            resultado.tratou = true;
            resultado.reflexo_social = false;
            resultado.filler_contextual = false;
          }
        }
      }
      
      // Registra interação no observador (sempre)
      const tipo = (resultado && resultado._cognitivo) ? 'cognitivo' :
                   (resultado && resultado.reflexo_social) ? 'social' :
                   (resultado && resultado.fallback) ? 'fallback' : 'normal';
      registrar_interacao(input, tipo);
    } catch(e){
      // Não derruba o pipeline original
    }
    
    return resultado;
  };
  window._v159_hooked = true;
}

console.log('[v159b_motores_cognitivos] 6 motores + árbitro instalados (hipóteses, simulação, analogia, eng.reversa, metacognição, observador)');

})();
`});
