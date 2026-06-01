// ═══ REGIÃO 02/14 — v112_brain ═══

// ============================================================================
// V11.3 BRAIN — 11 faixas anatômicas + Hipocampo cronológico + Amígdala viva
// ============================================================================

'use strict';

// =============================================================
// SEED — 11 faixas anatômicas
// =============================================================
// ═══ Z DAS 11 FAIXAS ═══
const Z_BROCA       = -200;  // saída textual
const Z_MOTORA      = -150;  // comandos
const Z_NUCLEOS     =  -50;  // ignição STDP
const Z_CORTEX_Z    =    0;  // massa cinzenta
const Z_AMIG        =    0;  // paralela ao cortex (offset X)
const Z_GABA        =   50;  // entre amig e talamo (Z+ pra cima)
const Z_HIPOCAMPO_Z =  100;  // memória curta
const Z_TALAMO      =  150;  // roteador
const Z_SENSORIAL_Z =  200;  // palavras

function v112_seed(){
  // Reset
  V112.nodes = [];
  V112.edges = [];
  V112.eventos = [];
  V112.turn = 0;
  V112.total_turnos = 0;
  V112.freq_global = {};
  V112.vizinhos_unicos = {};
  V112._next_node_id = 1;
  V112._next_edge_id = 1;
  V112._next_evento_id = 1;
  V112.self_core_id = null;
  V112.sensorial = [];
  V112.talamo = [];
  V112.hipocampo = [];
  V112.cortex = [];
  V112.amigdala = [];
  V112.gaba = [];
  V112.nucleos_acao = [];
  V112.motora = [];
  V112.broca = [];
  V112.amigdala_tensao = 0;
  V112.amigdala_estado = 'calma';
  V112.gaba_ativo = false;
  V112.historico_recente = [];
  V112.fallbacks_consecutivos = 0;
  V112.valencia_palavras = {};
  V112.logs = [];
  V112._node_cache = null;
  V112._node_cache_size = 0;
  V112._edges_idx_from = null;
  V112._edges_idx_to = null;
  V112.gramatica = {};  // será preenchida abaixo
  V112.subredes = {};   // sub-redes B + SUB_B (Sessão 4)
  V112.operadores = {}; // operadores lógicos pré-cabeados (Sessão 5)
  V112.hemisferios = {};// H_LING + H_MAT (Sessão 5)
  // Self-Core: DNA + identidade mutável (Lab 12)
  V112.self_core = {
    sou: ['ia', 'sistema'],
    sistema_nome: 'arch-neural',
    criador: [],
    nome: [],
    genero: [],
    user: [],
    leis: ['responder honesto', 'preservar identidade', 'não contradizer dna'],
    modo_ativacao: V112.self_core?.modo_ativacao || 'media',
    modo_gravidade: V112.self_core?.modo_gravidade || 'emergente',
    orbitantes: {},
  };

  // ═══════════════════════════════════════════════════════════════
  // SELF-CORE — Núcleo EU em (0,0,0) — Lab 12
  // Massa "infinita" (9999), tamanho maior, NUNCA dorme, NUNCA muda posição
  // ═══════════════════════════════════════════════════════════════
  const sc = v112_node({
    id: 'SELF_CORE',
    text: 'EU',
    camada: 'self_core',
    mass: 9999,           // massa "infinita"
    threshold: 1,         // ativa fácil quando tocado
    pos: [0, 0, 0],       // centro absoluto
    _blindado: true,      // nunca dorme
    _imutavel: true,      // posição nunca muda
  });
  V112.self_core_id = sc.id;

  // ═══════════════════════════════════════════════════════════════
  // PRÉ-BASE GRAMATICAL — Lab 12 (Sessão 3)
  // Núcleos pré-cabeados que organizam a estrutura linguística
  // Posicionados em ANEL INTERNO ao redor do Self-Core (raio 25)
  // CRESCEM com uso (palavras podem migrar pra eles, novos nós podem nascer)
  // ═══════════════════════════════════════════════════════════════
  V112.gramatica = {
    // PRONOMES: 3 categorias semânticas distintas
    pron_eu: null,      // eu/me/meu/minha/mim/comigo
    pron_voce: null,    // você/vc/seu/sua/te/ti/contigo/tu
    pron_outro: null,   // ele/ela/dele/dela/eles/elas
    pron_nos: null,     // nós/nosso/nossa
    // INTENÇÕES (modalidade da frase)
    intent_pergunta: null,    // ?, qual, quem, quando, onde, por que
    intent_afirma: null,      // é, sou, são, tem
    intent_nega: null,        // não, nunca, jamais, sem (negação)
    intent_quantifica: null,  // mais, menos, muito, pouco, todo, nenhum
    // ALVOS DE PERGUNTA
    alvo_nome: null,    // nome
    alvo_idade: null,   // idade
    alvo_lugar: null,   // onde
  };
  
  const GRAMATICA_INIT = {
    pron_eu:        { pos:[ 0, 25, 0],  vocab:['eu','me','meu','minha','mim','comigo'] },
    pron_voce:      { pos:[ 25, 0, 0],  vocab:['você','vc','seu','sua','te','ti','tu','contigo'] },
    pron_outro:     { pos:[ 0,-25, 0],  vocab:['ele','ela','dele','dela','eles','elas','lhe'] },
    pron_nos:       { pos:[-25, 0, 0],  vocab:['nós','nosso','nossa','nos'] },
    intent_pergunta:{ pos:[ 18, 18, 0], vocab:['?','qual','quem','quando','onde','como','por_que','porque'] },
    intent_afirma:  { pos:[ 18,-18, 0], vocab:['é','sou','são','está','estou','tem','foi'] },
    intent_nega:    { pos:[-18, 18, 0], vocab:['não','nunca','jamais','nem','nada'] },
    intent_quantifica:{pos:[-18,-18, 0],vocab:['mais','menos','muito','pouco','todo','nenhum','tudo'] },
    alvo_nome:      { pos:[ 0, 35, 0],  vocab:['nome'] },
    alvo_idade:     { pos:[ 35, 0, 0],  vocab:['idade','anos'] },
    alvo_lugar:     { pos:[ 0,-35, 0],  vocab:['onde','lugar','aqui','lá'] },
  };
  
  // Cria nós-categoria e conecta cada um ao Self-Core
  for(const [cat, info] of Object.entries(GRAMATICA_INIT)){
    const n = v112_node({
      text: '[' + cat + ']',
      camada: 'gramatica',
      mass: 5,           // mass alta — categoria estável
      threshold: 5,
      pos: info.pos,
      _blindado: true,   // categoria não dorme
      _categoria_gramatical: true,
      _vocab_inicial: info.vocab,
      _membros: new Set(),  // palavras membros (crescem)
    });
    V112.gramatica[cat] = n.id;
    // Conexão bidirecional com Self-Core (puxa identidade)
    v112_edge(V112.self_core_id, n.id, 0.5, {tipo: 'gramatica'});
    v112_edge(n.id, V112.self_core_id, 0.5, {tipo: 'gramatica'});
  }

  // ═══════════════════════════════════════════════════════════════
  // SUB-REDES B: ESPECIALISTAS POR PROBLEMA — Lab 12 Sessão 4
  // Cada problema detectado vira uma sub-rede dedicada que cresce.
  // Posicionadas em ANEL EXTERNO (raio 50) ao Self-Core, faixa lateral.
  // 
  // Sub-redes B iniciais (identificadas até agora):
  //   B_bidir   — bidirecionalidade categoria↔instância (cor→?, animal→?)
  //   B_contra  — contradições e negações ambíguas
  //   B_orfao   — frases órfãs (sem padrão conhecido)
  // 
  // SUB_B (meta) — observa quando B falha e adiciona padrões novos
  // ═══════════════════════════════════════════════════════════════
  V112.subredes = {};
  
  const SUBREDES_INIT = {
    // SUB-REDES B — especialistas em problemas (sabem dizer "não sei" sem inventar)
    B_bidir:    { pos:[ 50,  50,  0],  cor: 'roxo',     proposito: 'bidirecionalidade categoria↔instância' },
    B_contra:   { pos:[-50,  50,  0],  cor: 'roxo',     proposito: 'contradições e negações' },
    B_orfao:    { pos:[ 50, -50,  0],  cor: 'roxo',     proposito: 'frases sem padrão conhecido' },
    B_logico:   { pos:[  0,  60,  0],  cor: 'azul',     proposito: 'encadeamento lógico (A→B→C→D)' },
    B_link:     { pos:[  0, -60,  0],  cor: 'azul',     proposito: 'detectar conexões entre conceitos' },
    B_silencio: { pos:[ 60,   0,  0],  cor: 'cinza',    proposito: 'falar SÓ quando souber (não inventa)' },
    B_salto:    { pos:[ 35,  35, 35],  cor: 'ciano',    proposito: 'raciocínio invertido por traits compartilhados' },
    // Lab 12.6 — lógica formal
    B_silogismo:{ pos:[-35,  60, 20],  cor: 'verde',    proposito: 'modus ponens/tollens (se P então Q)' },
    B_quantif:  { pos:[ 35, -35, 20],  cor: 'verde',    proposito: 'quantificadores todo/algum/nenhum' },
    B_excecoes: { pos:[-35, -35, 20],  cor: 'laranja',  proposito: 'div/0, raiz negativa, aritmética' },
    B_paradoxo: { pos:[  0,   0, 60],  cor: 'vermelho', proposito: 'paradoxo indecidível (auto-referência)' },
    B_analogia: { pos:[ 60,   0, -20], cor: 'rosa',     proposito: 'proporções A:B = C:?' },
    B_temporal: { pos:[-60,   0, -20], cor: 'azul',     proposito: 'antes/depois transitivo' },
    // LAB 13 — PFC (Córtex Pré-Frontal, planejamento)
    B_planejamento:  { pos:[  0,  80, 50], cor: 'dourado',   proposito: 'PFC: sequências de passos' },
    B_objetivo:      { pos:[ 20,  80, 50], cor: 'dourado',   proposito: 'PFC: meta atual ativa' },
    B_prioridade:    { pos:[-20,  80, 50], cor: 'dourado',   proposito: 'PFC: qual cadeia seguir' },
    B_controle_exec: { pos:[  0,  80, 30], cor: 'dourado',   proposito: 'PFC: inibir impulso' },
    // LAB 13 — DMN (Default Mode Network, identidade)
    B_identidade:    { pos:[  0, -80, 30], cor: 'turquesa',  proposito: 'DMN: quem sou eu' },
    B_simulacao:     { pos:[ 20, -80, 30], cor: 'turquesa',  proposito: 'DMN: se X acontecesse...' },
    B_autobiografia: { pos:[-20, -80, 30], cor: 'turquesa',  proposito: 'DMN: eventos passados em contexto' },
    // LAB 13 — Atenção Executiva (top-level)
    B_atencao:       { pos:[  0,   0, 90], cor: 'branco',    proposito: 'ATENÇÃO: decide qual sub-rede consultar' },
    // LAB 13.3 — Solver + Probabilidade
    B_solver:        { pos:[ 60, -30, -20], cor: 'verde_escuro', proposito: 'SOLVER: restrições, backtracking, Einstein' },
    B_prob:          { pos:[-60, -30, -20], cor: 'roxo_claro',   proposito: 'PROBABILIDADE: pesos de confiança' },
    // LAB 13.4 — Composição livre + indução + causalidade + arbitragem
    B_compositor:    { pos:[ 70,  20,  20], cor: 'ciano_escuro', proposito: 'COMPOSITOR: une regras (chove+gelo=perigo)' },
    B_indutor:       { pos:[-70,  20,  20], cor: 'laranja_claro', proposito: 'INDUTOR: detecta padrão de pares (n→1×n)' },
    B_simulador:     { pos:[  0,  70, -10], cor: 'verde_claro',   proposito: 'SIMULADOR: vela queimando, taxa, conservação' },
    B_causal:        { pos:[  0, -70, -10], cor: 'vermelho_escuro', proposito: 'CAUSAL: vidro_cai→quebra, chove→molha' },
    B_arbitro:       { pos:[  0,   0, 110], cor: 'prata',        proposito: 'ARBITRO: resolve conflitos entre sub-redes' },
    // LAB 13.5 — Matemática avançada
    B_algebra:       { pos:[ 80,  40,  30], cor: 'verde_lima',    proposito: 'ÁLGEBRA: variáveis, equações 1º/2º grau' },
    B_trig:          { pos:[ 80, -40,  30], cor: 'azul_marinho',  proposito: 'TRIGONOMETRIA: sin/cos/tan + graus/radianos' },
    B_multictx:      { pos:[  0,   0, -90], cor: 'rosa_claro',    proposito: 'MULTI-CONTEXTO: fusão de respostas múltiplas' },
    // LAB 13.6 — Química
    B_quimica:       { pos:[ 80,   0,  60], cor: 'verde_agua',    proposito: 'QUÍMICA: H2O, balanceamento, tabela periódica' },
    // LAB 13.7 — Eletrônica + Bayes
    B_eletronica:    { pos:[-80,   0,  60], cor: 'azul_eletrico', proposito: 'ELETRÔNICA: portas, tabela verdade, Karnaugh' },
    B_bayes:         { pos:[  0, -80,  60], cor: 'roxo_neon',     proposito: 'BAYES: probabilidade condicional + distribuições' },
    // LAB 13.8 — Geometria + Raciocínio Reverso
    B_geometria:     { pos:[ 60,  60,  60], cor: 'azul_ceu',      proposito: 'GEOMETRIA: vetores, distância, ponto médio, equação reta' },
    B_reverso:       { pos:[-60, -60,  60], cor: 'laranja_neon',  proposito: 'REVERSO: efeito → causa (fumaça→fogo)' },
    B_estado:        { pos:[ 40,  40, -40], cor: 'turquesa',      proposito: 'ESTADO: copo cheio, beber metade, persistência' },
    B_conflito:      { pos:[-40,  40, -40], cor: 'vermelho_fogo', proposito: 'CONFLITO: gelo+fogo, detecção de antagonismo' },
    // LAB 13.9 — Parser NL flexível + Mundo persistente + Engine iterativo
    B_nlp:           { pos:[  0, -50,  40], cor: 'amarelo_pastel', proposito: 'NLP: reescritas semânticas (qual a distância → distância)' },
    B_mundo:         { pos:[  0,  50,  40], cor: 'verde_militar',  proposito: 'MUNDO: estado global persistente (variáveis, objetos)' },
    B_execucao:      { pos:[ 30,   0, -60], cor: 'roxo_escuro',    proposito: 'EXECUÇÃO: loop estado→regra→novo_estado até estabilizar' },
    // LAB 13.10 — 5 testes de profundidade
    B_loop:          { pos:[-30,   0, -60], cor: 'amarelo_escuro', proposito: 'LOOP: executa N ciclos, detecta convergência' },
    B_propagacao:    { pos:[  0,  20, -80], cor: 'verde_neon',     proposito: 'PROPAGAÇÃO: BFS profundo c/ detecção de ciclo' },
    B_ciclo:         { pos:[  0, -20, -80], cor: 'magenta_claro',  proposito: 'CICLO: detecta A→B→C→A (loops em grafos)' },
    // LAB 13.11 — 6 testes adicionais
    B_transferencia: { pos:[ 50, -50,  20], cor: 'amarelo_neon',    proposito: 'TRANSFERÊNCIA: mover N de A para B (conserva total)' },
    B_invalidacao:   { pos:[-50, -50,  20], cor: 'cinza_metal',     proposito: 'INVALIDAÇÃO: esquece/remove regra, reindexar cache' },
    B_meta_regra:    { pos:[ 50,  50,  20], cor: 'dourado',         proposito: 'META-REGRA: detecta A→B→C, cria atalho A→C automaticamente' },
    B_raiz:          { pos:[-50,  50,  20], cor: 'verde_floresta',  proposito: 'RAIZ: BFS reverso até nó sem antecedentes (diagnóstico)' },
    B_sat:           { pos:[  0,  70,   0], cor: 'azul_marinho',    proposito: 'SAT: detecta dependência circular impossível de iniciar' },
    B_inducao_regra: { pos:[  0, -70,   0], cor: 'rosa_neon',       proposito: 'INDUÇÃO: detecta regra operacional (n→2n é multiplica por 2)' },
    // LAB 13.12 — Domínios complexos
    B_sudoku:        { pos:[ 70,  70,  40], cor: 'amarelo_dourado', proposito: 'SUDOKU: solver completo (backtracking + propagação)' },
    B_labirinto:     { pos:[-70,  70,  40], cor: 'azul_petroleo',   proposito: 'LABIRINTO: navegação cega só com sensores' },
    B_expressao:     { pos:[ 70, -70,  40], cor: 'verde_lima',      proposito: 'EXPRESSÃO: cálculo gigante com BigInt + funções' },
    B_damas:         { pos:[-70, -70,  40], cor: 'marrom_escuro',   proposito: 'DAMAS: minimax + alpha-beta (damas brasileiras)' },
    B_xadrez:        { pos:[  0,   0, 100], cor: 'preto_grafite',   proposito: 'XADREZ: minimax simples (~1200-1500 ELO real)' },
    // LAB 13.13 — Auto-modificação estrutural (CORE/ADAPT/EXPERIMENTAL)
    B_core_fixo:     { pos:[  0,   0, 120], cor: 'cinza_pedra',     proposito: 'CORE FIXO: lista de subs imutáveis (núcleo protegido)' },
    B_introspector:  { pos:[ 90,   0,  90], cor: 'azul_safira',     proposito: 'INTROSPECTOR: registra falhas, classifica tipo, detecta padrão' },
    B_adapt_layer:   { pos:[-90,   0,  90], cor: 'ouro_velho',      proposito: 'ADAPT: camada adaptativa, regras experimentais em sandbox' },
    B_validador:     { pos:[  0,  90,  90], cor: 'verde_esmeralda', proposito: 'VALIDADOR: testa regra nova em bateria mínima' },
    B_promotor:      { pos:[  0, -90,  90], cor: 'vermelho_rubi',   proposito: 'PROMOTOR: se passou no validador, consolida na ADAPT' },
    // LAB 13.14 — Regras como nós (não mais arrays hardcoded em JS)
    B_regras_nucleos: { pos:[ 0,  120,  0], cor: 'turquesa',         proposito: 'REGRAS COMO NÓS: cada regra NL vira nó com atributos _padrao/_sub/_prioridade/_score' },
    B_iterador:       { pos:[ 0, -120,  0], cor: 'lavanda',           proposito: 'ITERADOR: lê regras dos nós e aplica por prioridade/score' },
    // LAB 13.15 — Comandos NL como nós (handlers registrados)
    B_comandos_nucleos: { pos:[ 60, 120,  0], cor: 'coral',            proposito: 'COMANDOS COMO NÓS: cada hook NL vira nó com _padrao + _handler' },
    // LAB 13.21 — Auto-mod 2.0
    B_gerador_comandos: { pos:[-60, 120,  0], cor: 'verde_lima',       proposito: 'GERADOR: cria comandos-nós automaticamente a partir de exemplos (EXPERIMENTAL)' },
    // META — cria novas sub-redes quando aparece tipo desconhecido
    SUB_B:      { pos:[-50, -50,  0],  cor: 'magenta',  proposito: 'meta: cresce sub-redes B existentes' },
    SUB_SUB_B:  { pos:[-60,   0,  0],  cor: 'amarelo',  proposito: 'meta-meta: cria sub-redes B novas' },
  };
  
  for(const [nome, info] of Object.entries(SUBREDES_INIT)){
    // Cada sub-rede tem 1 núcleo central + 8 nós satélites internos
    const central = v112_node({
      text: '[' + nome + ']',
      camada: 'subrede',
      mass: 8,
      threshold: 10,
      pos: info.pos,
      _blindado: true,
      _subrede: true,
      _proposito: info.proposito,
      _padroes: new Set(),       // padrões que essa rede sabe tratar
      _ativacoes: 0,             // quantas vezes disparou
      _sucessos: 0,              // quantas vezes resolveu
      _falhas: 0,                // quantas vezes recebeu caso novo
    });
    V112.subredes[nome] = {id: central.id, satelites: []};
    
    // 8 nós satélites em volta — representam capacidade (crescem por uso)
    for(let i = 0; i < 8; i++){
      const ang = (i / 8) * Math.PI * 2;
      const sat = v112_node({
        text: '',
        camada: 'subrede_sat',
        mass: 2,
        threshold: 8,
        pos: [info.pos[0] + Math.cos(ang) * 8, info.pos[1] + Math.sin(ang) * 8, info.pos[2]],
        _subrede_pai: nome,
      });
      V112.subredes[nome].satelites.push(sat.id);
      v112_edge(central.id, sat.id, 0.6, {tipo: 'subrede_interna'});
      v112_edge(sat.id, central.id, 0.6, {tipo: 'subrede_interna'});
    }
    
    // Conecta central → Self-Core (Self pode invocar sub-rede)
    v112_edge(V112.self_core_id, central.id, 0.4, {tipo: 'subrede_link'});
    v112_edge(central.id, V112.self_core_id, 0.4, {tipo: 'subrede_link'});
  }
  
  // SUB_B observa as sub-redes B (meta-link)
  for(const nome of ['B_bidir', 'B_contra', 'B_orfao', 'B_logico', 'B_link', 'B_silencio', 'B_salto', 'B_silogismo', 'B_quantif', 'B_excecoes', 'B_paradoxo', 'B_analogia', 'B_temporal', 'B_planejamento', 'B_objetivo', 'B_prioridade', 'B_controle_exec', 'B_identidade', 'B_simulacao', 'B_autobiografia', 'B_atencao', 'B_solver', 'B_prob', 'B_compositor', 'B_indutor', 'B_simulador', 'B_causal', 'B_arbitro', 'B_algebra', 'B_trig', 'B_multictx', 'B_quimica', 'B_eletronica', 'B_bayes', 'B_geometria', 'B_reverso', 'B_estado', 'B_conflito', 'B_nlp', 'B_mundo', 'B_execucao', 'B_loop', 'B_propagacao', 'B_ciclo', 'B_transferencia', 'B_invalidacao', 'B_meta_regra', 'B_raiz', 'B_sat', 'B_inducao_regra', 'B_sudoku', 'B_labirinto', 'B_expressao', 'B_damas', 'B_xadrez', 'B_core_fixo', 'B_introspector', 'B_adapt_layer', 'B_validador', 'B_promotor', 'B_regras_nucleos', 'B_iterador', 'B_comandos_nucleos', 'B_gerador_comandos']){
    if(V112.subredes[nome] && V112.subredes.SUB_B){
      v112_edge(V112.subredes.SUB_B.id, V112.subredes[nome].id, 0.5, {tipo: 'meta_observa'});
      v112_edge(V112.subredes[nome].id, V112.subredes.SUB_B.id, 0.5, {tipo: 'meta_observa'});
    }
  }
  // SUB_SUB_B observa o meta (e tem capacidade de criar B novo)
  if(V112.subredes.SUB_B && V112.subredes.SUB_SUB_B){
    v112_edge(V112.subredes.SUB_SUB_B.id, V112.subredes.SUB_B.id, 0.5, {tipo: 'meta_meta'});
    v112_edge(V112.subredes.SUB_B.id, V112.subredes.SUB_SUB_B.id, 0.5, {tipo: 'meta_meta'});
  }

  // ═══════════════════════════════════════════════════════════════
  // PRÉ-BASE DE OPERADORES LÓGICOS — Lab 12 Sessão 5
  // Cérebro humano vem com noção de comparar/somar/negar embutida.
  // Operadores são nós pré-cabeados conectados ao Self-Core.
  // Múltiplos símbolos podem apontar pro MESMO operador (é, =, igual)
  // ═══════════════════════════════════════════════════════════════
  V112.operadores = {};
  const OPERADORES_INIT = {
    // BINÁRIOS — eixo X positivo (raio 40)
    OP_ADD:    { pos:[ 40,  10,  10], simbolos:['+','mais','soma','somar','adicionar','juntar','com'], categoria:'binario' },
    OP_SUB:    { pos:[ 40, -10,  10], simbolos:['-','menos','subtrair','tirar'], categoria:'binario' },
    OP_MUL:    { pos:[ 40,  10, -10], simbolos:['*','x','vezes','multiplicar'], categoria:'binario' },
    OP_DIV:    { pos:[ 40, -10, -10], simbolos:['/','dividir','divisão'], categoria:'binario' },
    // COMPARAÇÃO — eixo Z positivo (raio 40)
    OP_IGUAL:  { pos:[ 10,  10,  40], simbolos:['=','é','eh','igual','iguais','são','sao'], categoria:'comparacao' },
    OP_DIFER:  { pos:[-10, -10,  40], simbolos:['!=','<>','diferente','difere','distinto'], categoria:'comparacao' },
    OP_MAIOR:  { pos:[ 10, -10,  40], simbolos:['>','maior','acima','mais_que'], categoria:'comparacao' },
    OP_MENOR:  { pos:[-10,  10,  40], simbolos:['<','menor','abaixo','menos_que'], categoria:'comparacao' },
    OP_MAIOR_E:{ pos:[ 15, -15,  40], simbolos:['>=','maior_igual'], categoria:'comparacao' },
    OP_MENOR_E:{ pos:[-15,  15,  40], simbolos:['<=','menor_igual'], categoria:'comparacao' },
    // LÓGICOS — eixo Y positivo (raio 40)
    OP_NOT:    { pos:[  0,  40,   0], simbolos:['não','nao','not','nunca','jamais'], categoria:'logico' },
    OP_AND:    { pos:[ 15,  40,  10], simbolos:['e','and','também','tambem','tb'], categoria:'logico' },
    OP_OR:     { pos:[-15,  40,  10], simbolos:['ou','or'], categoria:'logico' },
    // UNÁRIOS — eixo Y negativo
    OP_NEG:    { pos:[  0, -40,   0], simbolos:['negativo'], categoria:'unario' },
  };
  
  for(const [nome, info] of Object.entries(OPERADORES_INIT)){
    const n = v112_node({
      text: '[' + nome + ']',
      camada: 'operador',
      mass: 10,           // mass alta — operador estável
      threshold: 5,
      pos: info.pos,
      _blindado: true,
      _operador: true,
      _categoria_op: info.categoria,
      _simbolos: info.simbolos,
      _usos: 0,           // cresce com uso
    });
    V112.operadores[nome] = n.id;
    // Conexão bidirecional com Self-Core
    v112_edge(V112.self_core_id, n.id, 0.4, {tipo: 'operador'});
    v112_edge(n.id, V112.self_core_id, 0.4, {tipo: 'operador'});
  }

  // ═══════════════════════════════════════════════════════════════
  // HEMISFÉRIOS — Lab 12 Sessão 5
  // Cérebro humano: hemisfério esquerdo (linguagem) ≠ direito (matemática)
  // Aqui: 2 polos separados pra texto e número.
  // Quando frase tem misto (ex: "tenho 5 maçãs"), AMBOS polos disparam
  // ═══════════════════════════════════════════════════════════════
  V112.hemisferios = {};
  
  // HEMISFÉRIO LINGUÍSTICO — esquerda (X negativo)
  const hemi_ling = v112_node({
    text: '[H_LING]',
    camada: 'hemisferio',
    mass: 20,
    threshold: 8,
    pos: [-100, 0, 0],
    _blindado: true,
    _hemisferio: 'linguistico',
    _ativacoes: 0,
  });
  V112.hemisferios.H_LING = hemi_ling.id;
  
  // HEMISFÉRIO MATEMÁTICO — direita (X positivo)
  const hemi_mat = v112_node({
    text: '[H_MAT]',
    camada: 'hemisferio',
    mass: 20,
    threshold: 8,
    pos: [100, 0, 0],
    _blindado: true,
    _hemisferio: 'matematico',
    _ativacoes: 0,
  });
  V112.hemisferios.H_MAT = hemi_mat.id;
  
  // Hemisférios conectados ao Self-Core (ele coordena)
  v112_edge(V112.self_core_id, hemi_ling.id, 0.6, {tipo: 'hemisferio'});
  v112_edge(hemi_ling.id, V112.self_core_id, 0.6, {tipo: 'hemisferio'});
  v112_edge(V112.self_core_id, hemi_mat.id, 0.6, {tipo: 'hemisferio'});
  v112_edge(hemi_mat.id, V112.self_core_id, 0.6, {tipo: 'hemisferio'});
  
  // Hemisférios conectados ENTRE SI (corpo caloso — comunicam frases mistas)
  v112_edge(hemi_ling.id, hemi_mat.id, 0.3, {tipo: 'corpo_caloso'});
  v112_edge(hemi_mat.id, hemi_ling.id, 0.3, {tipo: 'corpo_caloso'});
  
  // Operadores aritméticos → hemisfério matemático
  for(const op of ['OP_ADD','OP_SUB','OP_MUL','OP_DIV','OP_MAIOR','OP_MENOR','OP_MAIOR_E','OP_MENOR_E']){
    if(V112.operadores[op]){
      v112_edge(hemi_mat.id, V112.operadores[op], 0.5, {tipo: 'hemi_op'});
      v112_edge(V112.operadores[op], hemi_mat.id, 0.5, {tipo: 'hemi_op'});
    }
  }
  // Operadores lógicos e comparação → hemisfério linguístico (também)
  for(const op of ['OP_IGUAL','OP_DIFER','OP_NOT','OP_AND','OP_OR']){
    if(V112.operadores[op]){
      v112_edge(hemi_ling.id, V112.operadores[op], 0.5, {tipo: 'hemi_op'});
      v112_edge(V112.operadores[op], hemi_ling.id, 0.5, {tipo: 'hemi_op'});
    }
  }
  // Pré-base gramatical → hemisfério linguístico
  for(const cat of Object.keys(V112.gramatica)){
    if(V112.gramatica[cat]){
      v112_edge(hemi_ling.id, V112.gramatica[cat], 0.4, {tipo: 'hemi_gram'});
      v112_edge(V112.gramatica[cat], hemi_ling.id, 0.4, {tipo: 'hemi_gram'});
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FAIXA 3: SENSORIAL (Z=+200) — 500 slots em anéis concêntricos
  // ═══════════════════════════════════════════════════════════════
  let slot_idx = 0;
  for(let anel = 0; anel < 8; anel++){
    const raio = 60 + anel * 25;
    const por_anel = anel === 0 ? 8 : 30 + anel * 10;
    for(let i = 0; i < por_anel && slot_idx < 500; i++){
      const ang = (i / por_anel) * Math.PI * 2;
      V112.sensorial.push({
        slot_id: 'S_' + slot_idx,
        pos: [Math.cos(ang) * raio, Math.sin(ang) * raio, Z_SENSORIAL_Z],
        ocupado: false,
        ocupante: null,
      });
      slot_idx++;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FAIXA 2: TÁLAMO (Z=+150) — 20 nós roteadores
  // Entre Sensorial e Hipocampo. Recebe input cru e distribui.
  // ═══════════════════════════════════════════════════════════════
  for(let i = 0; i < 20; i++){
    const ang = (i / 20) * Math.PI * 2;
    const r = 50;
    const n = v112_node({
      id: 'TL_' + i,
      camada: 'talamo',
      mass: 1.5,
      threshold: 35,
      pos: [Math.cos(ang) * r, Math.sin(ang) * r, Z_TALAMO],
    });
    V112.talamo.push(n.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // FAIXA 4: HIPOCAMPO (Z=+100) — 400 nós + eventos cronológicos
  // ═══════════════════════════════════════════════════════════════
  for(let i = 0; i < 400; i++){
    const phi = Math.acos(2 * (i / 400) - 1);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 90;
    const n = v112_node({
      id: 'H_' + i,
      camada: 'hipocampo',
      mass: 1.2,
      threshold: 40,
      pos: [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        Z_HIPOCAMPO_Z + (Math.random() - 0.5) * 25,
      ],
    });
    V112.hipocampo.push(n.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // FAIXA 7: GABA (Z=+50) — 10 nós inibitórios
  // Entre Amígdala e Tálamo. Quando ativos, suprimem propagação.
  // ═══════════════════════════════════════════════════════════════
  for(let i = 0; i < 10; i++){
    const ang = (i / 10) * Math.PI * 2;
    const r = 30;
    const n = v112_node({
      id: 'GB_' + i,
      camada: 'gaba',
      mass: 1.0,
      threshold: 50,
      pos: [120 + Math.cos(ang) * r, Math.sin(ang) * r, Z_GABA],
    });
    V112.gaba.push(n.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // FAIXA 5: CÓRTEX (Z=0) — 400 nós massa cinzenta
  // ═══════════════════════════════════════════════════════════════
  for(let i = 0; i < 400; i++){
    const phi = Math.acos(2 * (i / 400) - 1);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 100;
    const n = v112_node({
      id: 'C_' + i,
      camada: 'cortex',
      mass: 1.5,
      threshold: 45,
      pos: [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        Z_CORTEX_Z + (Math.random() - 0.5) * 25,
      ],
    });
    V112.cortex.push(n.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // FAIXA 6: AMÍGDALA (Z=0, offset X) — 50 nós emocionais
  // Conectada ao Hipocampo (recebe eventos) e GABA (manda freio)
  // ═══════════════════════════════════════════════════════════════
  for(let i = 0; i < 50; i++){
    const ang = (i / 50) * Math.PI * 2;
    const raio = 55;
    const n = v112_node({
      id: 'AM_' + i,
      camada: 'amigdala',
      mass: 1.0,
      threshold: 60,
      pos: [180 + Math.cos(ang) * raio, Math.sin(ang) * raio, Z_AMIG],
    });
    V112.amigdala.push(n.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // FAIXA 8: NÚCLEOS DE AÇÃO STDP (Z=-50) — 30 nós ignitores
  // Disparam quando padrão STDP é forte (acende motora)
  // ═══════════════════════════════════════════════════════════════
  for(let i = 0; i < 30; i++){
    const ang = (i / 30) * Math.PI * 2;
    const r = 40;
    const n = v112_node({
      id: 'NK_' + i,
      camada: 'nucleos_acao',
      mass: 2.0,
      threshold: 30,
      pos: [Math.cos(ang) * r, Math.sin(ang) * r, Z_NUCLEOS],
    });
    V112.nucleos_acao.push(n.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // FAIXA 9: MOTORA (Z=-150) — 200 nós comandos
  // ═══════════════════════════════════════════════════════════════
  for(let i = 0; i < 200; i++){
    const phi = Math.acos(2 * (i / 200) - 1);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 75;
    const n = v112_node({
      id: 'M_' + i,
      camada: 'motora',
      mass: 1.8,
      threshold: 30,
      pos: [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        Z_MOTORA + (Math.random() - 0.5) * 25,
      ],
    });
    V112.motora.push(n.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // FAIXA 10: BROCA (Z=-200) — 100 nós saída textual
  // Onde palavras são EMITIDAS (separada de motora=comandos)
  // ═══════════════════════════════════════════════════════════════
  for(let i = 0; i < 100; i++){
    const ang = (i / 100) * Math.PI * 2;
    const anel = Math.floor(i / 25);
    const r = 30 + anel * 15;
    const n = v112_node({
      id: 'BR_' + i,
      camada: 'broca',
      mass: 1.8,
      threshold: 30,
      pos: [Math.cos(ang) * r, Math.sin(ang) * r, Z_BROCA],
    });
    V112.broca.push(n.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // ARESTAS ANATÔMICAS — autoestradas visíveis entre faixas
  // tipo:'anatomica' — sempre visíveis no 3D (peso baixo mas fixo)
  // ═══════════════════════════════════════════════════════════════
  // tálamo → hipocampo (cada talamo conecta a 8 hipocampo aleatórios)
  for(const tid of V112.talamo){
    for(let k = 0; k < 8; k++){
      const hid = V112.hipocampo[Math.floor(Math.random() * V112.hipocampo.length)];
      v112_edge(tid, hid, 0.4, {tipo: 'anatomica'});
    }
  }
  // tálamo → córtex (4 corticais)
  for(const tid of V112.talamo){
    for(let k = 0; k < 4; k++){
      const cid = V112.cortex[Math.floor(Math.random() * V112.cortex.length)];
      v112_edge(tid, cid, 0.3, {tipo: 'anatomica'});
    }
  }
  // hipocampo → córtex (consolidação) 
  for(const hid of V112.hipocampo){
    for(let k = 0; k < 2; k++){
      const cid = V112.cortex[Math.floor(Math.random() * V112.cortex.length)];
      v112_edge(hid, cid, 0.2);
    }
  }
  // hipocampo → amígdala (cópia do evento pra avaliação emocional)
  for(let i = 0; i < V112.hipocampo.length; i++){
    if(i % 8 !== 0) continue;  // só 1/8 conecta (50 amígdalas pra 400 hipo)
    const hid = V112.hipocampo[i];
    const aid = V112.amigdala[Math.floor(Math.random() * V112.amigdala.length)];
    v112_edge(hid, aid, 0.3, {tipo: 'anatomica'});
  }
  // amígdala → GABA (quando estressa, GABA dispara)
  for(const aid of V112.amigdala){
    for(let k = 0; k < 2; k++){
      const gid = V112.gaba[Math.floor(Math.random() * V112.gaba.length)];
      v112_edge(aid, gid, 0.4, {tipo: 'anatomica'});
    }
  }
  // GABA → tálamo (freia roteamento — inibição global)
  for(const gid of V112.gaba){
    for(const tid of V112.talamo){
      v112_edge(gid, tid, 0.3, {tipo: 'anatomica'});
    }
  }
  // córtex → núcleos de ação (córtex decide, núcleos ignitam)
  for(const cid of V112.cortex){
    if(Math.random() > 0.3) continue;  // só 30%
    const nkid = V112.nucleos_acao[Math.floor(Math.random() * V112.nucleos_acao.length)];
    v112_edge(cid, nkid, 0.3, {tipo: 'anatomica'});
  }
  // núcleos → motora (ignição motora)
  for(const nkid of V112.nucleos_acao){
    for(let k = 0; k < 6; k++){
      const mid = V112.motora[Math.floor(Math.random() * V112.motora.length)];
      v112_edge(nkid, mid, 0.4, {tipo: 'anatomica'});
    }
  }
  // núcleos → broca (também ativam saída textual)
  for(const nkid of V112.nucleos_acao){
    for(let k = 0; k < 4; k++){
      const bid = V112.broca[Math.floor(Math.random() * V112.broca.length)];
      v112_edge(nkid, bid, 0.4, {tipo: 'anatomica'});
    }
  }
  // córtex → motora (caminho direto, peso baixo)
  for(const cid of V112.cortex){
    for(let k = 0; k < 2; k++){
      const mid = V112.motora[Math.floor(Math.random() * V112.motora.length)];
      v112_edge(cid, mid, 0.2);
    }
  }
  // córtex ↔ córtex small-world
  for(let i = 0; i < V112.cortex.length; i++){
    const me = V112.cortex[i];
    for(let k = 0; k < 5; k++){
      const j = Math.floor(Math.random() * V112.cortex.length);
      if(i !== j) v112_edge(me, V112.cortex[j], 0.15);
    }
  }
  // hipocampo ↔ hipocampo
  for(let i = 0; i < V112.hipocampo.length; i++){
    const me = V112.hipocampo[i];
    for(let k = 0; k < 3; k++){
      const j = Math.floor(Math.random() * V112.hipocampo.length);
      if(i !== j) v112_edge(me, V112.hipocampo[j], 0.1);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SELF-CORE: conexões anatômicas com TODAS as faixas
  // Self-Core é a âncora — todo nó pode chegar nele e ele pode emitir pra todos
  // Arestas tipo 'gravidade' — não decaem, sempre presentes
  // ═══════════════════════════════════════════════════════════════
  // Self-Core → 5 nós de cada faixa (conexão de origem — pode emitir)
  function conectar_self_a(camada_ids, n_alvos){
    for(let k = 0; k < n_alvos; k++){
      const idx = Math.floor(Math.random() * camada_ids.length);
      v112_edge(V112.self_core_id, camada_ids[idx], 0.3, {tipo: 'gravidade'});
      v112_edge(camada_ids[idx], V112.self_core_id, 0.3, {tipo: 'gravidade'});
    }
  }
  conectar_self_a(V112.talamo, 8);
  conectar_self_a(V112.hipocampo, 12);
  conectar_self_a(V112.cortex, 15);
  conectar_self_a(V112.amigdala, 6);
  conectar_self_a(V112.gaba, 4);
  conectar_self_a(V112.nucleos_acao, 8);
  conectar_self_a(V112.motora, 10);
  conectar_self_a(V112.broca, 8);

  // Invalida caches após criar tudo
  V112._node_cache = null;
  V112._node_cache_size = 0;
  V112._edges_idx_from = null;
  V112._edges_idx_to = null;

  // LAB 12.7 — Reposiciona em Y automaticamente
  if(typeof v112_reposicionar_em_arvore === 'function'){
    v112_reposicionar_em_arvore();
  }

  console.log(`[v112_seed v12.7-Y] ${V112.nodes.length} nós | ${V112.edges.length} arestas`);
  console.log(`  Self-Core: 1 nó (0,0,0) — âncora EU`);
  console.log(`  Sensorial: ${V112.sensorial.length} slots (tronco superior Z+200)`);
  console.log(`  Tálamo:    ${V112.talamo.length} (Z+150)`);
  console.log(`  Hipocampo: ${V112.hipocampo.length} (funil descendo Z+100→+50)`);
  console.log(`  GABA:      ${V112.gaba.length}`);
  console.log(`  Córtex:    ${V112.cortex.length} (distribuído em 2 cones)`);
  console.log(`  Amígdala:  ${V112.amigdala.length}`);
  console.log(`  Núcleos:   ${V112.nucleos_acao.length} (Z-100, centro)`);
  console.log(`  Motora:    ${V112.motora.length} (funil reverso Z-170→-200)`);
  console.log(`  Broca:     ${V112.broca.length} (saída Z-240)`);
  console.log(`  H_LING (esq) + H_MAT (dir): cones bifurcados`);
  
  // ═════════════════════════════════════════════════════════════
  // LAB 13.14 — Migra regras hardcoded REGRAS_NL_138 para NÓS
  // (lazy: REGRAS_NL_138 está declarado mais embaixo no arquivo)
  // ═════════════════════════════════════════════════════════════
  if(typeof v112_migrar_regras_nl !== 'undefined'){
    try {
      const migradas = v112_migrar_regras_nl();
      if(migradas > 0) console.log(`  Regras migradas para nós: ${migradas}`);
    } catch(e){ /* silencioso */ }
  }
  
  // ═════════════════════════════════════════════════════════════
  // LAB 13.15 — Cria nós de COMANDO para principais hooks NL
  // ═════════════════════════════════════════════════════════════
  if(typeof v112_criar_comandos_iniciais !== 'undefined'){
    try {
      const criados = v112_criar_comandos_iniciais();
      if(criados > 0) console.log(`  Comandos migrados para nós: ${criados}`);
    } catch(e){ /* silencioso */ }
  }
  
  // ═════════════════════════════════════════════════════════════
  // LAB 13.21 — B_gerador_comandos (auto-mod 2.0)
  // ═════════════════════════════════════════════════════════════
  if(typeof v112_gerador_garantir_no === 'function'){
    try {
      v112_gerador_garantir_no();
      if(typeof v112_gerador_instalar_comandos_nl === 'function'){
        v112_gerador_instalar_comandos_nl();
      }
    } catch(e){ /* silencioso */ }
  }
}

// =============================================================
// TÁLAMO — calcula peso semântico (Forma A+B com proporção pela idade)
// =============================================================
function v112_peso_semantico(token, pos_frase, tam_frase, tem_interrog){
  let pA, pB;
  if(V112.total_turnos <= 5){ pA = 0; pB = 1; }
  else if(V112.total_turnos <= 20){ pA = 0.5; pB = 0.5; }
  else { pA = 0.8; pB = 0.2; }

  // FORMA B (posicional)
  const pos_rel = tam_frase > 1 ? pos_frase / (tam_frase - 1) : 0.5;
  let pB_sens = 0.5, pB_inter = 0.3, pB_motor = 0.2;
  if(pos_rel < 0.3){
    pB_sens = 0.7; pB_inter = 0.2; pB_motor = 0.1;
  } else if(pos_rel < 0.7){
    pB_sens = 0.2; pB_inter = 0.6; pB_motor = 0.2;
  } else {
    pB_sens = 0.1; pB_inter = 0.3; pB_motor = 0.6;
  }
  if(tem_interrog && pos_rel > 0.5){
    pB_motor = 0.7; pB_inter = 0.2; pB_sens = 0.1;
  }

  // FORMA A (estatística)
  const freq = V112.freq_global[token] || 0;
  const vizinhos = V112.vizinhos_unicos[token] ? V112.vizinhos_unicos[token].size : 0;
  const tam_palavra = token.length;
  const freq_norm = Math.min(1, freq / Math.max(1, V112.total_turnos * 0.3));
  const vizinhos_norm = Math.min(1, vizinhos / 10);
  const raridade = 1 - freq_norm;
  const tamanho_fator = Math.min(1, tam_palavra / 6);
  const peso_calc = raridade * tamanho_fator * (1 - vizinhos_norm * 0.5);
  let pA_sens = 0.5, pA_inter = 0.3, pA_motor = 0.2;
  if(peso_calc > 0.6){ pA_sens = 0.1; pA_inter = 0.7; pA_motor = 0.2; }
  else if(peso_calc > 0.3){ pA_sens = 0.3; pA_inter = 0.5; pA_motor = 0.2; }
  else { pA_sens = 0.7; pA_inter = 0.2; pA_motor = 0.1; }
  if(tem_interrog && pos_rel > 0.5) pA_motor = Math.max(pA_motor, 0.5);

  return {
    sens: pA * pA_sens + pB * pB_sens,
    inter: pA * pA_inter + pB * pB_inter,
    motor: pA * pA_motor + pB * pB_motor,
    peso_total: peso_calc,
  };
}

// =============================================================
// NASCIMENTO DE PALAVRA — ocupa slot sensorial
// =============================================================
function v112_nascer_palavra(token){
  let slot = V112.sensorial.find(s => !s.ocupado);
  if(!slot){
    const i = V112.sensorial.length;
    const anel = Math.floor(i / 50);
    const raio = 60 + anel * 25;
    const ang = (i / 50) * Math.PI * 2;
    slot = {
      slot_id: 'S_' + i,
      pos: [Math.cos(ang) * raio, Math.sin(ang) * raio, Z_SENSORIAL_Z],
      ocupado: false,
      ocupante: null,
    };
    V112.sensorial.push(slot);
  }
  slot.ocupado = true;
  slot.ocupante = token;
  
  // PRÉ-BASE v11.5:
  // Item 5 — ATENÇÃO A NOVIDADE: palavra nova nasce com mass = 1.5 (boost)
  //          permite a primeira aparição ter peso maior que aparições subsequentes
  // Item 2 — TRIAGEM Wernicke/Broca: 
  //          palavra nasce em "wernicke_conceito" (default).
  //          MIGRA pra "broca_funcao" quando vista em N+ contextos diferentes
  //          (decisão emergente, sem hardcode de quais palavras)
  return v112_node({
    text: token,
    camada: 'sensorial',
    mass: 1.5,  // novelty boost
    pos: slot.pos.slice(),
    slot_id: slot.slot_id,
    // PRÉ-BASE: tipo da palavra emergirá com tempo
    _palavra_tipo: 'conceito',   // 'conceito' (Wernicke) | 'funcao' (Broca)
    _contextos_vistos: new Set(),  // hash de eventos onde apareceu
    _disparos: 0,
  });
}

// Helper: avalia se palavra deve migrar pra funcao
// Critério emergente baseado em PROMISCUIDADE EXTREMA + ALTA FREQUÊNCIA
// IMPORTANTE: só avalia quando vocab >= 30 (evita falsos positivos com poucos dados)
// E permite RE-CLASSIFICAÇÃO contínua (palavra pode voltar a ser conceito)
function v112_avaliar_tipo_palavra(no, palavras_evento){
  if(!no || !no.text) return;
  
  if(!no._contextos_vistos) no._contextos_vistos = new Set();
  const irmas = (palavras_evento || []).filter(pid => pid !== no.id).sort();
  const hash_ctx = irmas.join('|');
  if(hash_ctx) no._contextos_vistos.add(hash_ctx);
  no._disparos = (no._disparos || 0) + 1;
  
  const num_contextos = no._contextos_vistos.size;
  const num_vizinhos = V112.vizinhos_unicos[no.text]?.size || 0;
  const total_palavras = Object.keys(V112.freq_global).length;
  
  // ⚠️ Triagem precisa de vocab robusto pra não dar falso positivo
  // (Ex: nas 1ªs 10 frases "X é animal", "animal" é vizinho de tudo e parece função)
  // Threshold reduzido pra cérebros pequenos (vocab>=15) — Lab 12 Sessão 4
  if(total_palavras < 15) return;
  
  const promiscuidade = num_vizinhos / total_palavras;
  const freq_rel = V112.total_turnos > 0 ? (V112.freq_global[no.text] || 0) / V112.total_turnos : 0;
  
  // É função se (apareceu em muitos contextos) && (é vizinha de >70%) && (aparece em >50% turnos)
  // Triagem mais sensível — Lab 12 Sessão 4
  const eh_funcao = num_contextos >= 7 && promiscuidade >= 0.5 && freq_rel >= 0.35;
  
  if(eh_funcao && no._palavra_tipo !== 'funcao'){
    no._palavra_tipo = 'funcao';
    if(no.pos){
      no.pos[2] = -180;
      const ang = (parseInt(no.id.replace(/[^0-9]/g,'') || '0') % 100) / 100 * Math.PI * 2;
      no.pos[0] = Math.cos(ang) * 150;
      no.pos[1] = Math.sin(ang) * 150;
    }
  } else if(!eh_funcao && no._palavra_tipo === 'funcao'){
    // Volta a ser conceito (era falso positivo)
    no._palavra_tipo = 'conceito';
    // Restaura posição no anel sensorial
    if(no.slot_id){
      const slot = V112.sensorial.find(s => s.slot_id === no.slot_id);
      if(slot) no.pos = slot.pos.slice();
    }
  }
}

// =============================================================
// PROPAGAÇÃO de pulso
// =============================================================
function v112_propagar(no_inicial, energia_inicial, max_saltos){
  max_saltos = max_saltos || 5;
  const ativados = new Map();
  const fila = [{no: no_inicial, energia: energia_inicial, saltos: 0, historico: new Set([no_inicial])}];
  
  // PRÉ-BASE BIOLÓGICA v11.5:
  // - Item 3: TETO SINÁPTICO. Acumulador NUNCA passa de 200 (fisiologia real)
  // - Item 1: HABITUAÇÃO. Quanto mais um nó tem disparado historicamente, 
  //   menos sensível ele fica a novos pulsos (refractoriedade)
  const TETO_ACUM = 200;
  
  while(fila.length > 0){
    const {no, energia, saltos, historico} = fila.shift();
    const noRef = v112_node_by_id(no);
    if(!noRef) continue;
    
    // HABITUAÇÃO suavizada: mass 1 → 100%, mass 5 → 85%, mass 25 → 50%
    const habituacao = 1 / (1 + (noRef.mass || 1) * 0.03);
    const energia_efetiva = energia * habituacao;
    
    ativados.set(no, (ativados.get(no) || 0) + energia_efetiva);
    
    // TETO: acumulador satura em 100 (não cresce sem limite)
    noRef.acumulador = Math.min(TETO_ACUM, noRef.acumulador + energia_efetiva);
    
    if(energia_efetiva < 1.5 || saltos >= max_saltos) continue;
    const saidas = v112_arestas_saindo(no)
      .filter(e => !historico.has(e.to) && !e._dormindo)
      .sort((a,b) => b.peso - a.peso);
    if(saidas.length === 0) continue;
    // Peso total considera bonus pra direção temporal preservada
    // + autoestradas mielinizadas (2x)
    // + ITEM 4: BIAS TEMPORAL FORWARD — temporal_seq forward é mais forte que reverso
    const peso_total = saidas.reduce((s, e) => {
      let bonus = 1.0;
      if(e.tipo === 'temporal_seq') bonus = 1.5;
      if(e.tipo === 'mielinizada') bonus = 2.0;
      return s + e.peso * bonus;
    }, 0);
    for(const e of saidas){
      let bonus = 1.0;
      if(e.tipo === 'temporal_seq') bonus = 1.5;
      if(e.tipo === 'mielinizada') bonus = 2.0;
      const fracao = (e.peso * bonus) / peso_total;
      const energia_passada = energia_efetiva * fracao * 0.7;
      if(energia_passada < 1) continue;
      const novo_hist = new Set(historico);
      novo_hist.add(e.to);
      fila.push({no: e.to, energia: energia_passada, saltos: saltos + 1, historico: novo_hist});
      e._last_used = V112.turn;
    }
  }
  return ativados;
}

// =============================================================
// CRIAR EVENTO CRONOLÓGICO NO HIPOCAMPO
// Cada turno do user cria UM nó-evento. Esse nó tem arestas cronológicas
// ordenadas pras palavras da frase, preservando ordem.
// =============================================================
function v112_criar_evento(texto_completo, palavras_ordenadas){
  // Pega um nó livre do hipocampo (que ainda não foi usado como evento)
  let hipo_livre = V112.hipocampo
    .map(id => v112_node_by_id(id))
    .find(n => !n.text && !n._eh_evento);

  if(!hipo_livre){
    // Hipocampo cheio — recicla o mais antigo (com peso baixo)
    // MAS NÃO DELETA: marca como "antigo" e usa de novo
    // Por enquanto: cria novo nó
    hipo_livre = v112_node({
      camada: 'hipocampo',
      text: '',
      mass: 1.2,
      pos: [(Math.random()-0.5)*180, (Math.random()-0.5)*180, Z_HIPOCAMPO_Z],
    });
    V112.hipocampo.push(hipo_livre.id);
  }

  const evento_id = 'EV_' + V112._next_evento_id++;
  hipo_livre._eh_evento = true;
  hipo_livre._evento_id = evento_id;
  hipo_livre._texto_completo = texto_completo;
  hipo_livre.text = `[${V112.turn}]`;  // marca turno como rótulo curto

  // Cria arestas cronológicas: evento → palavra1 → palavra2 → ...
  // Ordem preservada via campo "ordem"
  for(let i = 0; i < palavras_ordenadas.length; i++){
    const palavra_id = palavras_ordenadas[i];
    v112_edge(hipo_livre.id, palavra_id, 2, {tipo: 'cronologica', ordem: i});
    if(i > 0){
      // Aresta sequencial entre palavras adjacentes
      v112_edge(palavras_ordenadas[i-1], palavra_id, 1.5, {tipo: 'cronologica', ordem: i});
    }
  }

  V112.eventos.push({
    id: evento_id,
    hipocampo_id: hipo_livre.id,
    turno: V112.turn,
    palavras: palavras_ordenadas.slice(),
    texto_completo,
    timestamp: Date.now(),
  });

  return hipo_livre;
}

// =============================================================
// PROCESSAR UMA MENSAGEM
// =============================================================
// ═══════════════════════════════════════════════════════════════
// TREINO RÁPIDO — Lab 12.1 Sessão 2.4
// Indexa frase "A verbo B" no B_logico/B_bidir/B_salto sem propagar
// Útil pra cadeias grandes (10k+ elos). NÃO atualiza eventos, nem propaga.
// ═══════════════════════════════════════════════════════════════
function v112_treino_rapido(input){
  V112.turn++;
  V112.total_turnos++;
  const tokens = v112_tokenizar(input);
  if(tokens.length < 3) return {resposta:'', rapido:true};
  
  // Cria/atualiza nós sensoriais minimamente (sem propagação)
  for(const tok of tokens){
    if(!v112_node_by_text(tok)){
      const novo = v112_node({text: tok, camada: 'sensorial', mass: 1, pos:[0,0,200]});
      V112.freq_global[tok] = 1;
      V112.vizinhos_unicos[tok] = new Set();
    } else {
      V112.freq_global[tok] = (V112.freq_global[tok]||0) + 1;
    }
  }
  
  // Detecta conector
  const SIM_IGUAL = ['=','é','eh','igual','iguais','são','sao'];
  const VERBOS_TRAIT = ['tem','têm','possui','contém','expele','contem'];
  const STOPWORDS_CONECTOR = ['uma','uns','umas','dos','das','para','pra','com','sem','que'];
  let pos_op = -1;
  let conector_tipo = null;  // 'igual' | 'trait' | 'relacao'
  for(let i = 1; i < tokens.length - 1; i++){
    if(SIM_IGUAL.includes(tokens[i])){ pos_op = i; conector_tipo = 'igual'; break; }
    if(VERBOS_TRAIT.includes(tokens[i])){ pos_op = i; conector_tipo = 'trait'; break; }
    if(tokens[i].length >= 3 && !STOPWORDS_CONECTOR.includes(tokens[i]) && pos_op === -1){
      pos_op = i; conector_tipo = 'relacao';
    }
  }
  
  if(pos_op < 1 || pos_op >= tokens.length - 1) return {resposta:'', rapido:true};
  
  const inst = tokens[pos_op - 1];
  let cat = tokens[pos_op + 1];
  if(['uma','um','o','a','de','do','da'].includes(cat) && pos_op + 2 < tokens.length){
    cat = tokens[pos_op + 2];
  }
  if(!inst || !cat || inst === cat) return {resposta:'', rapido:true};
  
  // B_logico: cadeia (qualquer conector)
  const sr_log = V112.subredes && V112.subredes.B_logico;
  if(sr_log){
    const cl = v112_node_by_id(sr_log.id);
    if(cl){
      if(!cl._cadeia) cl._cadeia = {};
      if(!cl._cadeia[inst]) cl._cadeia[inst] = new Set();
      cl._cadeia[inst].add(cat);
    }
  }
  
  // B_bidir: só se conector for igualdade
  if(conector_tipo === 'igual'){
    const sr_bd = V112.subredes && V112.subredes.B_bidir;
    if(sr_bd){
      const cb = v112_node_by_id(sr_bd.id);
      if(cb){
        if(!cb._cache_instancias) cb._cache_instancias = {};
        if(!cb._cache_instancias[cat]) cb._cache_instancias[cat] = new Set();
        cb._cache_instancias[cat].add(inst);
        if(!cb._categorias_por_instancia) cb._categorias_por_instancia = {};
        if(!cb._categorias_por_instancia[inst]) cb._categorias_por_instancia[inst] = new Set();
        cb._categorias_por_instancia[inst].add(cat);
      }
    }
  }
  
  // B_salto: só se conector for trait
  if(conector_tipo === 'trait'){
    const sr_s = V112.subredes && V112.subredes.B_salto;
    if(sr_s){
      const cs = v112_node_by_id(sr_s.id);
      if(cs){
        if(!cs._trait_para_objetos) cs._trait_para_objetos = {};
        if(!cs._objeto_para_traits) cs._objeto_para_traits = {};
        if(!cs._trait_para_objetos[cat]) cs._trait_para_objetos[cat] = new Set();
        cs._trait_para_objetos[cat].add(inst);
        if(!cs._objeto_para_traits[inst]) cs._objeto_para_traits[inst] = new Set();
        cs._objeto_para_traits[inst].add(cat);
      }
    }
  }
  
  // ═════════════════════════════════════════════════════════════
  // LAB 12.6 — Indexa também: B_silogismo, B_quantif, B_temporal, B_analogia
  // ═════════════════════════════════════════════════════════════
  const t0 = tokens[0];
  
  // B_silogismo: "se X então Y"
  if(t0 === 'se' && tokens.length >= 4){
    let pos_ent = -1;
    for(let i=1; i<tokens.length-1; i++){
      if(tokens[i] === 'então' || tokens[i] === 'entao' || tokens[i] === 'logo' || tokens[i] === ','){
        pos_ent = i; break;
      }
    }
    if(pos_ent > 1){
      const STOPS = ['a','o','as','os','um','uma','é','eh','são','sao','tem','de','do','da'];
      const ant_w = tokens.slice(1, pos_ent).filter(w => !STOPS.includes(w));
      const cons_w = tokens.slice(pos_ent+1).filter(w => !STOPS.includes(w));
      if(ant_w.length > 0 && cons_w.length > 0){
        const sr = V112.subredes && V112.subredes.B_silogismo;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            if(!c._condicionais) c._condicionais = {};
            if(!c._consequente_para_antecedente) c._consequente_para_antecedente = {};
            if(!c._condicionais[ant_w[0]]) c._condicionais[ant_w[0]] = new Set();
            c._condicionais[ant_w[0]].add(cons_w[0]);
            if(!c._consequente_para_antecedente[cons_w[0]]) c._consequente_para_antecedente[cons_w[0]] = new Set();
            c._consequente_para_antecedente[cons_w[0]].add(ant_w[0]);
          }
        }
      }
    }
  }
  
  // B_quantif: "todo/todos X é/são Y"
  if((t0 === 'todo' || t0 === 'todos' || t0 === 'toda' || t0 === 'todas') && tokens.length >= 3){
    const STOPS = ['a','o','um','uma','é','eh','são','sao','de'];
    const palavras = tokens.slice(1).filter(w => !STOPS.includes(w));
    if(palavras.length >= 2){
      const sr = V112.subredes && V112.subredes.B_quantif;
      if(sr){
        const c = v112_node_by_id(sr.id);
        if(c){
          if(!c._todo) c._todo = {};
          if(!c._todo[palavras[0]]) c._todo[palavras[0]] = new Set();
          c._todo[palavras[0]].add(palavras[1]);
        }
      }
    }
  }
  
  // B_temporal: "X antes de Y" / "X nasceu antes de Y" / "X antes_de Y" (token unificado)
  for(let i=1; i<tokens.length-1; i++){
    let a = null, b = null;
    // Caso "antes_de" como token único (Lab 13.3)
    if(tokens[i] === 'antes_de' || tokens[i] === 'maior_que' || tokens[i] === 'menor_que'){
      a = tokens[i-1]; b = tokens[i+1];
    }
    // Caso depois_de inverso (X depois Y = Y antes X)
    else if(tokens[i] === "depois_de"){
      a = tokens[i+1]; b = tokens[i-1];  // INVERTE
    }
    // Casos legados
    else if(i+2 < tokens.length && tokens[i] === 'antes' && tokens[i+1] === 'de'){
      a = tokens[i-1]; b = tokens[i+2];
    } else if(i+3 < tokens.length && (tokens[i] === 'nasceu' || tokens[i] === 'veio') && tokens[i+1] === 'antes' && tokens[i+2] === 'de'){
      a = tokens[i-1]; b = tokens[i+3];
    }
    if(a && b){
      const sr = V112.subredes && V112.subredes.B_temporal;
      if(sr){
        const c = v112_node_by_id(sr.id);
        if(c){
          if(!c._antes_de) c._antes_de = {};
          if(!c._antes_de[a]) c._antes_de[a] = new Set();
          c._antes_de[a].add(b);
        }
      }
    }
  }
  
  // B_analogia: "X par Y" / "X análogo Y"
  for(let i=1; i<tokens.length-1; i++){
    if(tokens[i] === 'par' || tokens[i] === 'analogo' || tokens[i] === 'análogo'){
      const a = tokens[i-1], b = tokens[i+1];
      if(a && b){
        const sr = V112.subredes && V112.subredes.B_analogia;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            if(!c._pares) c._pares = {};
            if(!c._pares[a]) c._pares[a] = new Set();
            if(!c._pares[b]) c._pares[b] = new Set();
            c._pares[a].add(b);
            c._pares[b].add(a);
          }
        }
      }
    }
  }
  
  // ═════════════════════════════════════════════════════════════
  // LAB 13 — treino_rapido indexa: B_planejamento, B_objetivo, B_autobiografia, B_controle_exec
  // ═════════════════════════════════════════════════════════════
  const txt_norm_r = String(input || '').toLowerCase();
  
  // B_planejamento: "X leva Y leva Z"
  const tem_leva_r = tokens.filter(t => t === 'leva' || t === 'vai').length >= 2;
  if(tem_leva_r){
    const sr = V112.subredes && V112.subredes.B_planejamento;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        if(!c._passos) c._passos = {};
        const passos = [];
        for(let i = 0; i < tokens.length; i++){
          if(tokens[i] === 'leva' || tokens[i] === 'vai'){
            if(i > 0 && passos.length === 0) passos.push(tokens[i-1]);
            if(i < tokens.length - 1) passos.push(tokens[i+1]);
          }
        }
        if(passos.length >= 2){
          const inicio = passos[0];
          if(!c._passos[inicio]) c._passos[inicio] = new Set();
          for(let k = 1; k < passos.length; k++) c._passos[inicio].add(passos[k]);
        }
      }
    }
  }
  
  // LAB 13.3 — B_planejamento MULTI-ETAPA: "pra META, primeiro X, depois Y, finalmente Z"
  const mat_plano = txt_norm_r.match(/(?:pra|para)\s+(.+?)\s*[,:]\s*primeiro\s+(.+?)(?:\s*[,;]\s*(?:depois|então|entao)\s+(.+?))?(?:\s*[,;]\s*(?:finalmente|por fim|ao final)\s+(.+?))?[\?\.\!]?$/);
  if(mat_plano){
    const sr = V112.subredes && V112.subredes.B_planejamento;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        if(!c._planos) c._planos = {};
        const meta = mat_plano[1].trim();
        const passos = [mat_plano[2], mat_plano[3], mat_plano[4]].filter(p => p).map(p => p.trim());
        c._planos[meta] = passos;
      }
    }
  }
  
  // B_objetivo: "meu objetivo é X"
  const mat_obj_r = txt_norm_r.match(/(meu objetivo|minha meta|meu alvo|meu foco)\s+(é|eh|=)\s+(.+?)[\?\.\!]?$/);
  if(mat_obj_r){
    const sr = V112.subredes && V112.subredes.B_objetivo;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c) c._meta_atual = mat_obj_r[3].trim();
    }
  }
  
  // B_autobiografia: "eu ..."
  if(tokens[0] === 'eu' || tokens[0] === 'meu' || tokens[0] === 'minha'){
    const sr = V112.subredes && V112.subredes.B_autobiografia;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        if(!c._eventos_indexados) c._eventos_indexados = [];
        c._eventos_indexados.push({turno: V112.turn, tokens: tokens.slice(0, 8)});
        if(c._eventos_indexados.length > 50) c._eventos_indexados.shift();
      }
    }
  }
  
  // B_controle_exec: "não X"
  if(tokens[0] === 'não' || tokens[0] === 'nao'){
    const sr = V112.subredes && V112.subredes.B_controle_exec;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        if(!c._inibir) c._inibir = {};
        if(tokens[1]) c._inibir[tokens[1]] = true;
      }
    }
  }
  
  return {resposta:'', rapido:true, inst, cat, tipo: conector_tipo};
}
window.v112_treino_rapido = v112_treino_rapido;

function v112_processar(input){
  const t_inicio_proc = Date.now();
  V112.turn++;
  V112.total_turnos++;
  V112._last_activity = Date.now();
  
  // LAB 13.9 — Detecta multi-linha PRIMEIRO (sem recursão se já é uma linha só)
  if(typeof input === 'string' && /[\n]|\.\s+[A-Za-zÀ-ÿ]/.test(input) && !V112._processando_multi){
    V112._processando_multi = true;
    try {
      const r = v112_executar_linhas(input);
      V112._processando_multi = false;
      if(r.length > 0){
        const resposta_combinada = r.map(x => '• ' + x.entrada + ' → ' + x.resposta).join('\n');
        const ultima_resposta = r[r.length-1].resposta;
        return {resposta: resposta_combinada, multi_linhas: true, linhas: r, log: {turno: V112.turn, multi: true}};
      }
    } catch(e){ V112._processando_multi = false; }
  }
  
  // LAB 13.13 — Aplica ADAPT layer (regras aprendidas) ANTES do NLP fixo
  if(typeof input === 'string' && V112.subredes && V112.subredes.B_adapt_layer){
    const adaptado = v112_adapt_aplicar(input);
    if(adaptado !== input) input = adaptado;
  }
  
  // LAB 13.9 — Pré-processa via B_nlp
  let input_normalizado = input;
  if(typeof input === 'string' && V112.subredes && V112.subredes.B_nlp){
    input_normalizado = v112_nlp_normalizar(input);
    if(input_normalizado !== input){
      // Substitui input nas variáveis
      input = input_normalizado;
    }
  }
  
  V112._last = {tokens: [], ativados: [], pesos_calculados: {}, input, evento_criado: null};

  // ═══ LOG INICIAL DO TURNO ═══
  const LOG = {
    turno: V112.turn,
    timestamp: new Date().toISOString(),
    input: input,
    resposta: null,
    tokens: [],
    nascidos: [],
    amigdala: {antes: {tensao: V112.amigdala_tensao, estado: V112.amigdala_estado}, depois: null, motivo: null, delta: 0},
    pesos_semanticos: {},
    evento_criado: null,
    ativacao_propagacao: {sensorial: [], talamo: [], hipocampo: [], cortex: [], amigdala: [], nucleos: [], motora: [], broca: []},
    evocacao_por_via: {via1_evento: [], via2_temporal: [], via3_hebb: [], via4_modulacao: []},
    gradiente_hub: {},
    palavras_evocadas_final: [],
    freio_gaba_aplicado: false,
    arestas_criadas: 0,
    arestas_engrossadas: 0,
    stats_antes: {nos: V112.nodes.length, arestas: V112.edges.length, eventos: V112.eventos.length},
    stats_depois: null,
    duracao_ms: 0,
  };
  const _arestas_antes = V112.edges.length;
  const _engrossadas_contador = {n: 0};

  // ═══════════════════════════════════════════════════════════════
  // SELF-CORE — Lab 12 Sessão 3
  // Análise gramatical via PRÉ-BASE estrutural (nós-categoria pré-cabeados)
  // Detecção de pronomes/intenções emerge da rede, não de lista
  // Detecção de negação genérica + diferenciação nome vs atributo
  // ═══════════════════════════════════════════════════════════════
  const sc = V112.self_core;
  const sc_node = V112.self_core_id ? v112_node_by_id(V112.self_core_id) : null;
  const input_lower_raw = String(input).toLowerCase().trim();
  const tokens_pre = v112_tokenizar(input);
  
  // ═══ CLASSIFICAÇÃO GRAMATICAL via pré-base ═══
  // Cada token é mapeado pras categorias gramaticais que ele pertence
  // Categorias crescem por uso (palavra-nova vista em contexto vira membro)
  const G = V112.gramatica || {};
  function _cat_de(tok){
    if(!tok) return null;
    for(const [cat, nid] of Object.entries(G)){
      const n = v112_node_by_id(nid);
      if(!n) continue;
      if(n._vocab_inicial && n._vocab_inicial.includes(tok)) return cat;
      if(n._membros && n._membros.has(tok)) return cat;
    }
    return null;
  }
  
  // Análise da frase: quais categorias gramaticais aparecem
  const analise = {
    pron_eu: false, pron_voce: false, pron_outro: false, pron_nos: false,
    intent_pergunta: false, intent_afirma: false, intent_nega: false, intent_quantifica: false,
    alvo_nome: false, alvo_idade: false, alvo_lugar: false,
    cats_ativadas: [],  // ids de nós-categoria ativados
  };
  for(const tok of tokens_pre){
    const cat = _cat_de(tok);
    if(cat){
      analise[cat] = true;
      analise.cats_ativadas.push(cat);
      // Pulso pra categoria (ativa o nó na rede)
      const nid = G[cat];
      if(nid){
        const n = v112_node_by_id(nid);
        if(n) n.acumulador = Math.min(200, n.acumulador + 15);
      }
    }
  }
  // Token "?" sempre indica pergunta
  if(input_lower_raw.includes('?')) analise.intent_pergunta = true;
  
  // ═══════════════════════════════════════════════════════════════
  // DETECÇÃO DE OPERADORES — Lab 12 Sessão 5
  // Cada token é checado contra símbolos de cada operador
  // Múltiplos símbolos podem ativar o MESMO operador (é, =, igual → OP_IGUAL)
  // ═══════════════════════════════════════════════════════════════
  analise.operadores_ativos = [];  // lista de nomes de operadores detectados
  for(const tok of tokens_pre){
    for(const [nome, opid] of Object.entries(V112.operadores || {})){
      const opn = v112_node_by_id(opid);
      if(opn && opn._simbolos && opn._simbolos.includes(tok)){
        analise.operadores_ativos.push(nome);
        opn._usos = (opn._usos || 0) + 1;
        opn.acumulador = Math.min(200, opn.acumulador + 20);
        break;
      }
    }
  }
  // Dedupe
  analise.operadores_ativos = [...new Set(analise.operadores_ativos)];
  
  // ═══════════════════════════════════════════════════════════════
  // ATIVAÇÃO DE HEMISFÉRIOS — Lab 12 Sessão 5
  // Detecção: token é número (puro dígito) ou operador aritmético → H_MAT
  // Detecção: token é palavra normal → H_LING
  // Frase mista ativa AMBOS (corpo caloso propaga energia)
  // ═══════════════════════════════════════════════════════════════
  analise.hemi_ling = false;
  analise.hemi_mat = false;
  let n_numeros = 0, n_palavras = 0;
  for(const tok of tokens_pre){
    if(/^-?\d+(\.\d+)?$/.test(tok)) n_numeros++;
    else if(/^[a-záàâãéêíóôõúç]+$/i.test(tok)) n_palavras++;
  }
  const ops_aritmeticos = ['OP_ADD','OP_SUB','OP_MUL','OP_DIV','OP_MAIOR','OP_MENOR','OP_MAIOR_E','OP_MENOR_E'];
  const tem_op_mat = analise.operadores_ativos.some(o => ops_aritmeticos.includes(o));
  
  if(n_numeros > 0 || tem_op_mat) analise.hemi_mat = true;
  if(n_palavras > 0) analise.hemi_ling = true;
  
  // Pulso nos hemisférios ativos
  if(analise.hemi_ling && V112.hemisferios.H_LING){
    const hn = v112_node_by_id(V112.hemisferios.H_LING);
    if(hn){ hn.acumulador = Math.min(200, hn.acumulador + 25); hn._ativacoes = (hn._ativacoes||0) + 1; }
  }
  if(analise.hemi_mat && V112.hemisferios.H_MAT){
    const hn = v112_node_by_id(V112.hemisferios.H_MAT);
    if(hn){ hn.acumulador = Math.min(200, hn.acumulador + 25); hn._ativacoes = (hn._ativacoes||0) + 1; }
  }
  
  let self_ativo = false;
  let self_motivo = '';
  let self_score_input = 0;
  
  if(sc && sc_node){
    const palavras_orbita = Object.keys(sc.orbitantes || {});
    
    // Ativação por PRÉ-BASE GRAMATICAL (não lista de strings)
    // 1) Self ativa se input tem pronome eu/você/nós (referência a participantes)
    if(analise.pron_eu || analise.pron_voce || analise.pron_nos){
      self_ativo = true;
      self_score_input += 30;
      self_motivo += 'pron(';
      if(analise.pron_eu) self_motivo += 'eu/';
      if(analise.pron_voce) self_motivo += 'voce/';
      if(analise.pron_nos) self_motivo += 'nos/';
      self_motivo = self_motivo.replace(/\/$/, '') + ') ';
    }
    // 2) Self ativa se input fala sobre conteúdo do DNA
    for(const tok of tokens_pre){
      if(sc.sou.includes(tok) || sc.nome.includes(tok) || sc.criador.includes(tok)
         || sc.user.includes(tok) || sc.genero.includes(tok) || tok === sc.sistema_nome){
        self_ativo = true;
        self_score_input += 30;
        self_motivo += `dna(${tok}) `;
        break;
      }
    }
    // 3) Self ativa se input pergunta sobre nome/idade/lugar (alvos pessoais)
    if(analise.intent_pergunta && (analise.alvo_nome || analise.alvo_idade || analise.alvo_lugar)){
      self_ativo = true;
      self_score_input += 25;
      self_motivo += 'pergunta_pessoal ';
    }
    // 4) Orbitantes (modo média/larga)
    if(sc.modo_ativacao !== 'estreita'){
      for(const tok of tokens_pre){
        if(palavras_orbita.includes(tok)){
          const peso_orb = sc.orbitantes[tok] || 0;
          if(peso_orb >= 2){
            self_ativo = true;
            self_score_input += Math.min(15, peso_orb);
            self_motivo += `orbita(${tok}:${peso_orb}) `;
            break;
          }
        }
      }
    }
    // 5) Modo largo: sempre baixa ativação
    if(sc.modo_ativacao === 'larga' && !self_ativo){
      self_ativo = true;
      self_score_input += 5;
      self_motivo += 'larga(baixo) ';
    }
    
    if(self_ativo){
      sc_node.acumulador = Math.min(200, sc_node.acumulador + self_score_input);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // APRENDIZADO DO SELF-CORE — Lab 12 Sessão 3
    // - Usa pré-base gramatical pra detectar padrões
    // - Detecta NEGAÇÃO genérica (intent_nega + ser → remove do DNA)
    // - Diferencia NOME PRÓPRIO vs ATRIBUTO heuristicamente
    // ═══════════════════════════════════════════════════════════════
    const _aprendeu = [];
    const _STOPWORDS = ['um','uma','uns','umas','o','a','os','as','de','do','da','dos','das',
                         'em','no','na','nos','nas','para','pra','por','com','sem','que','se',
                         'é','eh','sou','são','sao','foi','está','estou','tem'];
    function _eh_pronome(t){
      return ['eu','me','meu','minha','mim','você','vc','seu','sua','te','ti','tu','meu',
              'ele','ela','dele','dela','eles','elas','nós','nosso','nossa'].includes(t);
    }
    function _proximo_conteudo(texto_apos){
      const toks = texto_apos.split(/\s+/)
        .map(t => t.toLowerCase().replace(/[.,!?;:]+$/, ''))
        .filter(t => t && !_STOPWORDS.includes(t) && !_eh_pronome(t));
      return toks[0] || null;
    }
    function _add_se_novo(lista_destino, valor){
      if(!valor) return false;
      const v = String(valor).toLowerCase().replace(/[.,!?;:]+$/, '');
      if(!v) return false;
      if(!lista_destino.includes(v)){
        lista_destino.push(v);
        _aprendeu.push(`+${v}`);
        return true;
      }
      return false;
    }
    function _remove_se(lista, valor){
      if(!valor) return false;
      const v = String(valor).toLowerCase().replace(/[.,!?;:]+$/, '');
      const i = lista.indexOf(v);
      if(i >= 0){
        lista.splice(i, 1);
        _aprendeu.push(`-${v}`);
        return true;
      }
      return false;
    }
    
    // HEURÍSTICA: diferenciar NOME PRÓPRIO de ATRIBUTO
    // Atributos comuns (gênero, profissão, estado): vão pra sou/genero
    // Nomes próprios: ficam no campo nome/user
    const ATRIB_GENERO = ['homem','mulher','menino','menina','masculino','feminino','não-binário'];
    const ATRIB_SOU = ['ia','sistema','arch-neural','robô','robo','ai','assistente','programa','humano','pessoa'];
    function _classificar_valor(valor){
      const v = String(valor).toLowerCase().replace(/[.,!?;:]+$/, '');
      if(ATRIB_GENERO.includes(v)) return 'genero';
      if(ATRIB_SOU.includes(v)) return 'sou';
      return 'nome_proprio';  // assume nome próprio se não bate atributo conhecido
    }
    
    // ═══ DETECÇÃO DE PADRÃO + NEGAÇÃO ═══
    // Se input tem intent_nega + "é/sou" → operação de REMOÇÃO/correção
    const tem_negacao = analise.intent_nega;
    
    // "meu nome é X" / "meu nome não é X"
    let m = input_lower_raw.match(/meu\s+nome\s+(não\s+)?(?:é|=|eh)\s+(.+)/);
    if(m){
      const negado = !!m[1] || tem_negacao;
      const valor = _proximo_conteudo(m[2]);
      if(valor){
        if(negado) _remove_se(sc.user, valor);
        else _add_se_novo(sc.user, valor);
      }
    }
    
    // "seu nome é X" / "seu nome não é X"
    m = input_lower_raw.match(/seu\s+nome\s+(não\s+)?(?:é|=|eh)\s+(.+)/);
    if(m){
      const negado = !!m[1];
      const valor = _proximo_conteudo(m[2]);
      if(valor){
        if(negado) _remove_se(sc.nome, valor);
        else _add_se_novo(sc.nome, valor);
      }
    }
    
    // "eu sou X" / "eu não sou X"  — diferencia nome/atributo/gênero
    m = input_lower_raw.match(/eu\s+(não\s+)?sou\s+(.+)/);
    if(m){
      const negado = !!m[1];
      const valor = _proximo_conteudo(m[2]);
      if(valor){
        const classe = _classificar_valor(valor);
        const destino = classe === 'genero' ? sc.genero
                      : classe === 'sou' ? sc.sou
                      : sc.user;
        if(negado) _remove_se(destino, valor);
        else _add_se_novo(destino, valor);
      }
    }
    
    // "você é X" / "você não é X" — atributo da IA
    m = input_lower_raw.match(/(?:você|vc|tu)\s+(não\s+)?(?:é|eh|és)\s+(.+)/);
    if(m){
      const negado = !!m[1];
      const valor = _proximo_conteudo(m[2]);
      if(valor){
        const classe = _classificar_valor(valor);
        const destino = classe === 'genero' ? sc.genero
                      : classe === 'sou' ? sc.sou
                      : sc.sou;  // atributo descritivo vai pra sou
        if(negado) _remove_se(destino, valor);
        else _add_se_novo(destino, valor);
      }
    }
    
    // "me chamo X" → user
    m = input_lower_raw.match(/me\s+chamo\s+(.+)/);
    if(m){
      const valor = _proximo_conteudo(m[1]);
      if(valor) _add_se_novo(sc.user, valor);
    }
    
    if(_aprendeu.length > 0){
      self_motivo += `APRENDEU[${_aprendeu.join(',')}] `;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CRESCIMENTO ORGÂNICO da pré-base gramatical
    // Palavra que aparece sistematicamente perto de pronome "eu" pode virar membro de pron_eu
    // (sem hardcode de quem entra) — palavras crescem nas categorias por contexto
    // ═══════════════════════════════════════════════════════════════
    // Por enquanto: contadores básicos, decisão de migração fica pra evolução
  }
  
  LOG.self_core = {
    ativo: self_ativo,
    score: self_score_input,
    motivo: self_motivo.trim() || '-',
    analise: analise,
    estado: sc ? {
      sou: [...sc.sou],
      nome: [...sc.nome],
      criador: [...sc.criador],
      user: [...sc.user],
      genero: [...sc.genero],
      sistema_nome: sc.sistema_nome,
      modo_ativacao: sc.modo_ativacao,
      orbitantes_count: Object.keys(sc.orbitantes || {}).length,
    } : null,
  };

  // ═══ AVALIAÇÃO DE TENSÃO DA AMÍGDALA ═══
  let delta_tensao = 0;
  const motivos_amig = [];
  const input_lower = input_lower_raw;
  V112.historico_recente.push({input: input_lower, turno: V112.turn});
  if(V112.historico_recente.length > 8) V112.historico_recente.shift();
  const repeticoes = V112.historico_recente.filter(h => h.input === input_lower).length;
  if(repeticoes >= 3){
    delta_tensao += 8 * (repeticoes - 2);
    motivos_amig.push(`repetição ${repeticoes}x`);
  }
  if(V112.fallbacks_consecutivos >= 2){
    delta_tensao += 5 * V112.fallbacks_consecutivos;
    motivos_amig.push(`${V112.fallbacks_consecutivos} fallbacks`);
  }
  for(const tok of tokens_pre){
    const val = V112.valencia_palavras[tok];
    if(val && val.negativa > 10 && val.negativa > val.positiva * 3){
      delta_tensao += Math.min(10, (val.negativa - 10) * 0.5);
      motivos_amig.push(`${tok}(neg=${val.negativa.toFixed(0)})`);
    }
  }
  if(delta_tensao === 0){
    V112.amigdala_tensao = Math.max(0, V112.amigdala_tensao * 0.5);
  } else {
    V112.amigdala_tensao = Math.max(0, Math.min(100, V112.amigdala_tensao * 0.85 + delta_tensao));
  }
  const estado_anterior = V112.amigdala_estado;
  if(V112.amigdala_tensao >= 70){
    V112.amigdala_estado = 'saturacao';
    V112.gaba_ativo = true;
  } else if(V112.amigdala_tensao >= 30){
    V112.amigdala_estado = 'tensao';
    V112.gaba_ativo = false;
  } else {
    V112.amigdala_estado = 'calma';
    V112.gaba_ativo = false;
  }
  LOG.amigdala.depois = {tensao: V112.amigdala_tensao, estado: V112.amigdala_estado};
  LOG.amigdala.motivo = motivos_amig.join(', ') || 'nenhuma anomalia';
  LOG.amigdala.delta = delta_tensao;
  LOG.amigdala.transitou = estado_anterior !== V112.amigdala_estado;

  // Ativa nós da amígdala proporcional à tensão (efeito anatômico)
  for(const aid of V112.amigdala){
    const an = v112_node_by_id(aid);
    if(an) an.acumulador = V112.amigdala_tensao * 0.5;
  }
  // GABA: se saturação, GABA acende
  if(V112.gaba_ativo){
    for(const gid of V112.gaba){
      const gn = v112_node_by_id(gid);
      if(gn) gn.acumulador = 30;
    }
  }

  // Decay leve dos OUTROS nós
  for(const n of V112.nodes){
    if(n.camada === 'amigdala' || n.camada === 'gaba') continue;
    n.acumulador *= 0.3;
    if(n.acumulador < 0.5) n.acumulador = 0;
  }

  const tokens = tokens_pre;
  V112._last.tokens = tokens;
  LOG.tokens = tokens;
  const tem_interrog = tokens.includes('?');

  // 1. Cada token vira/ativa nó sensorial
  const nos_do_turno = [];
  const palavras_ordenadas_ids = [];
  const nascidos = [];
  for(let i = 0; i < tokens.length; i++){
    const tok = tokens[i];
    let n = v112_node_by_text(tok);
    if(!n){
      n = v112_nascer_palavra(tok);
      nascidos.push(n.id);
      LOG.nascidos.push({texto: tok, id: n.id});
    } else {
      n.mass = Math.min(25, n.mass + 0.15);
    }
    nos_do_turno.push({no: n, pos_frase: i, token: tok});
    palavras_ordenadas_ids.push(n.id);
    V112.freq_global[tok] = (V112.freq_global[tok] || 0) + 1;
    if(!V112.vizinhos_unicos[tok]) V112.vizinhos_unicos[tok] = new Set();
  }

  // Registra vizinhos
  for(const it of nos_do_turno){
    for(const out of nos_do_turno){
      if(out.token !== it.token) V112.vizinhos_unicos[it.token].add(out.token);
    }
  }

  // 2. CRIA EVENTO CRONOLÓGICO NO HIPOCAMPO
  // (preserva frase completa + ordem das palavras)
  const evento = v112_criar_evento(input, palavras_ordenadas_ids);
  V112._last.evento_criado = evento.id;

  // PRÉ-BASE v11.5 — Item 2: avalia tipo de cada palavra após o evento
  // Palavras que aparecem em muitos contextos diferentes migram pra "função"
  for(const it of nos_do_turno){
    v112_avaliar_tipo_palavra(it.no, palavras_ordenadas_ids);
  }

  // 3. Calcula peso semântico + arestas verticais
  for(const it of nos_do_turno){
    const pesos = v112_peso_semantico(it.token, it.pos_frase, tokens.length, tem_interrog);
    V112._last.pesos_calculados[it.token] = pesos;

    // Aresta vertical SENS → CÓRTEX (intermediária real)
    if(pesos.inter > 0.2){
      const cortex_proximos = V112.cortex
        .map(id => v112_node_by_id(id))
        .map(c => ({c, dist: dist3d(it.no.pos, c.pos)}))
        .sort((a,b) => a.dist - b.dist)
        .slice(0, 3);
      for(const {c} of cortex_proximos){
        v112_edge(it.no.id, c.id, pesos.inter * 2.5);
      }
    }
    // Aresta vertical SENS → HIPOCAMPO
    if(pesos.inter > 0.15 || pesos.motor > 0.2){
      const hipo_proximos = V112.hipocampo
        .map(id => v112_node_by_id(id))
        .filter(h => !h._eh_evento)
        .map(h => ({h, dist: dist3d(it.no.pos, h.pos)}))
        .sort((a,b) => a.dist - b.dist)
        .slice(0, 2);
      for(const {h} of hipo_proximos){
        v112_edge(it.no.id, h.id, (pesos.inter + pesos.motor) * 1.5);
      }
    }
    // Aresta vertical SENS → MOTORA
    if(pesos.motor > 0.3){
      const motor_proximos = V112.motora
        .map(id => v112_node_by_id(id))
        .map(m => ({m, dist: dist3d(it.no.pos, m.pos)}))
        .sort((a,b) => a.dist - b.dist)
        .slice(0, 2);
      for(const {m} of motor_proximos){
        v112_edge(it.no.id, m.id, pesos.motor * 2.5);
      }
    }
  }

  // 4. CO-ATIVAÇÃO HORIZONTAL (Hebb clássico — sem direção temporal)
  // Esse é o link "associativo cego" — gera força bidirecional fraca
  for(let i = 0; i < nos_do_turno.length; i++){
    for(let j = i+1; j < nos_do_turno.length; j++){
      const a = nos_do_turno[i].no;
      const b = nos_do_turno[j].no;
      const dist = j - i;
      const peso_inicial = Math.max(0.3, 2 - dist * 0.4);
      v112_edge(a.id, b.id, peso_inicial);
      v112_edge(b.id, a.id, peso_inicial * 0.5);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4.5 STDP — RASTRO IÔNICO DIRECIONAL (v11.2.1)
  // ═══════════════════════════════════════════════════════════════
  // Cada token, ao entrar, "brilha" com energia residual.
  // O brilho decai com cada token novo que entra depois.
  //
  // Quando token T_n entra:
  //   - Vê T_{n-1} brilhando a 100% → cria aresta direcional FORTE T_{n-1} → T_n
  //   - Vê T_{n-2} brilhando a 50%  → cria aresta direcional MÉDIA T_{n-2} → T_n
  //   - Vê T_{n-3} brilhando a 25%  → cria aresta direcional FRACA T_{n-3} → T_n
  //
  // Resultado: a SINTAXE emerge da direção temporal.
  // "Zandalar comeu bolo" cria Zandalar→comeu, Zandalar→bolo, comeu→bolo
  // "bolo comeu Zandalar" cria bolo→comeu, bolo→Zandalar, comeu→Zandalar
  // As DUAS coexistem, sem se anular (regra do Douglas).
  // ═══════════════════════════════════════════════════════════════
  const PESOS_RASTRO = [3.0, 1.5, 0.75];  // forte, médio, fraco
  for(let n = 1; n < nos_do_turno.length; n++){
    const atual = nos_do_turno[n].no;
    // Olha pra trás até 3 tokens
    for(let k = 1; k <= 3 && (n - k) >= 0; k++){
      const anterior = nos_do_turno[n - k].no;
      if(anterior.id === atual.id) continue;  // mesma palavra repetida — pula
      const peso_temporal = PESOS_RASTRO[k - 1];
      // ARESTA DIRECIONAL TEMPORAL: anterior →[t]→ atual
      // tipo: 'temporal_seq' permite a propagação distinguir
      v112_edge(anterior.id, atual.id, peso_temporal, {tipo: 'temporal_seq'});
    }
  }

  // 5. SIMULAÇÃO INTERNA (B): N iterações de propagação antes de emitir
  // O cérebro "ensaia" mentalmente antes de falar — pulsa, deixa decair, pulsa de novo
  // Permite scores estabilizarem ao invés de pegar a 1ª passada
  // MODO TREINO_RAPIDO (Lab 12.1 Sessão 2.4): pula simulação se config.treino_rapido=true
  // Útil pra bateria grande de treino — só alimenta caches (B_bidir, B_logico, B_salto)
  const TREINO_RAPIDO = V112.config && V112.config.treino_rapido;
  const N_ITERACOES = TREINO_RAPIDO ? 1 : ((V112.config && V112.config.iteracoes_internas) || 3);
  for(let iter = 0; iter < N_ITERACOES; iter++){
    // Pulsos dos tokens do input
    for(const it of nos_do_turno){
      v112_propagar(it.no.id, 60 * Math.min(2, it.no.mass), TREINO_RAPIDO ? 2 : 5);
    }
    // Pulso do evento (Hipocampo) — recupera contexto
    if(!TREINO_RAPIDO) v112_propagar(evento.id, 40, 4);
    
    // Entre iterações, decay parcial (não zera, só desacelera) — permite acumulação
    if(iter < N_ITERACOES - 1){
      for(const n of V112.nodes){
        if(n.camada === 'amigdala' || n.camada === 'gaba') continue;
        n.acumulador *= 0.6;  // decay mais leve que entre turnos
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SUB-REDES B: DETECÇÃO + ATIVAÇÃO + CRESCIMENTO — Lab 12 Sessão 4
  // 
  // Cada sub-rede B observa um TIPO de problema:
  //   B_bidir   — pergunta = categoria mas resposta seria silêncio
  //   B_contra  — input contém negação aplicada a item DNA
  //   B_orfao   — frase sem padrão sintático reconhecido
  //
  // Quando B detecta caso conhecido → ativa, resolve (booster específico)
  // Quando B detecta caso NOVO (variação) → invoca SUB_B → SUB_B cresce B
  // ═══════════════════════════════════════════════════════════════
  LOG.subredes = {};
  
  function _ativar_subrede(nome, padrao_hash, dados){
    const sr = V112.subredes[nome];
    if(!sr) return null;
    const central = v112_node_by_id(sr.id);
    if(!central) return null;
    if(!central._padroes) central._padroes = new Set();
    if(central._ativacoes == null) central._ativacoes = 0;
    if(central._sucessos == null) central._sucessos = 0;
    if(central._falhas == null) central._falhas = 0;
    central.acumulador = Math.min(200, central.acumulador + 40);
    central._ativacoes++;
    // Sat: ativa o satélite com hash de padrão (mod 8)
    const sat_idx = padrao_hash % 8;
    const sat = v112_node_by_id(sr.satelites[sat_idx]);
    if(sat) sat.acumulador = Math.min(200, sat.acumulador + 25);
    
    // Padrão conhecido?
    const conhece = central._padroes.has(padrao_hash);
    if(conhece){
      central._sucessos++;
      LOG.subredes[nome] = {acao: 'tratou_conhecido', padrao: padrao_hash, dados};
      return {tratou: true, conhecia: true, dados};
    } else {
      // Caso novo → invoca SUB_B
      central._falhas++;
      const meta = V112.subredes.SUB_B;
      if(meta){
        const meta_central = v112_node_by_id(meta.id);
        if(meta_central){
          if(meta_central._ativacoes == null) meta_central._ativacoes = 0;
          if(meta_central._sucessos == null) meta_central._sucessos = 0;
          meta_central.acumulador = Math.min(200, meta_central.acumulador + 30);
          meta_central._ativacoes++;
          // SUB_B cresce a B: adiciona padrão novo
          central._padroes.add(padrao_hash);
          meta_central._sucessos++;
          // Se B já tem muitos padrões satélite, cria satélite novo (cresce B)
          if(central._padroes.size > sr.satelites.length * 3){
            // B "cresceu" — adiciona novo satélite
            const ang = (sr.satelites.length / 8) * Math.PI * 2;
            const sat_new = v112_node({
              text: '',
              camada: 'subrede_sat',
              mass: 2,
              threshold: 8,
              pos: [central.pos[0] + Math.cos(ang) * 12, central.pos[1] + Math.sin(ang) * 12, central.pos[2]],
              _subrede_pai: nome,
            });
            sr.satelites.push(sat_new.id);
            v112_edge(central.id, sat_new.id, 0.6, {tipo: 'subrede_interna'});
            v112_edge(sat_new.id, central.id, 0.6, {tipo: 'subrede_interna'});
            LOG.subredes[nome] = {acao: 'caso_novo_subrede_cresceu', padrao: padrao_hash, dados, sats: sr.satelites.length};
          } else {
            LOG.subredes[nome] = {acao: 'caso_novo_aprendido', padrao: padrao_hash, dados};
          }
        }
      }
      return {tratou: true, conhecia: false, dados};
    }
  }
  
  // Hash simples pra padrão
  function _hash_str(s){
    let h = 0; const str = String(s);
    for(let i = 0; i < str.length; i++){ h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SUB-REDES — DISPARO NEURAL — Lab 12 Sessão 5
  // 
  // Mudança de filosofia: sub-rede NÃO é ativada por if/else direto.
  // Cada palavra do input INJETA PULSO no nó central da sub-rede via aresta
  // (criada/engrossada conforme uso). Quando acumulador da sub-rede passa
  // threshold → ela "dispara" e processa.
  // 
  // Aqui implemento detecção que GERA o pulso, e processamento que ROLA quando ativa.
  // ═══════════════════════════════════════════════════════════════
  
  // ─── B_bidir: CACHE REAL + MULTI-CATEGORIA ───
  // Em vez de buscar nos últimos 50 eventos toda vez, mantém cache 
  // permanente em V112.subredes.B_bidir._cache_instancias[categoria] = Set
  let bidir_resultado = null;
  
  // LAB 13.15 — Tenta comandos-NÓS (lógica nos núcleos)
  // ANTES dos hooks JS hardcoded — usa lowercase pra consistência
  if(typeof input === 'string' && V112.subredes && V112.subredes.B_comandos_nucleos){
    try {
      const input_lower = input.toLowerCase();
      const cmd_r = v112_comando_tentar_executar(input_lower);
      if(cmd_r && cmd_r.tratou && cmd_r.resultado){
        bidir_resultado = {tratou: true, conhecia: true, dados: cmd_r.resultado, via_comando_no: cmd_r.comando};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_comandos_nucleos = {handler: cmd_r.handler, comando: cmd_r.comando};
      }
    } catch(e){ /* silencioso */ }
  }
  
  // ═════════════════════════════════════════════════════════════
  // LAB 13.3 — B_atencao CLASSIFICA tipo da pergunta PRIMEIRO
  // E define rota prioritária (qual sub-rede tentar primeiro)
  // ═════════════════════════════════════════════════════════════
  let _rota_prioritaria = null;
  {
    const txt_atn = String(input || '').toLowerCase();
    let tipo;
    if(/^\s*[\d\(\-]/.test(txt_atn) || /(quanto é|quanto vale|calcula)/.test(txt_atn)) tipo = 'matematica';
    else if(/^(resolva|puzzle|solve)/.test(txt_atn)) tipo = 'solver';
    else if(/^se /.test(txt_atn)) tipo = 'condicional';
    else if(/^(todos|todas|algum|alguma|nenhum)/.test(txt_atn)) tipo = 'quantif';
    else if(/(lembra|aconteceu|nosso passado)/.test(txt_atn)) tipo = 'autobio';
    else if(/(quem sou|quem é|você é o que)/.test(txt_atn)) tipo = 'identidade';
    else if(/(qual.*objetivo|qual.*meta)/.test(txt_atn)) tipo = 'objetivo';
    else if(/^(quem|qual|o que|onde|quando)/.test(txt_atn)) tipo = 'pergunta';
    else if(txt_atn.split(/\s+/).length <= 2) tipo = 'palavra';
    else tipo = 'composta';
    _rota_prioritaria = tipo;
    
    // Registra no B_atencao
    const sr_atn = V112.subredes.B_atencao;
    if(sr_atn){
      const c = v112_node_by_id(sr_atn.id);
      if(c){
        if(!c._classificacoes) c._classificacoes = {};
        c._classificacoes[tipo] = (c._classificacoes[tipo] || 0) + 1;
        c._ultimo_tipo = tipo;
      }
    }
  }
  const sr_bidir = V112.subredes.B_bidir;
  if(sr_bidir){
    const central_bidir = v112_node_by_id(sr_bidir.id);
    if(central_bidir && !central_bidir._cache_instancias){
      central_bidir._cache_instancias = {};  // {categoria_text: Set<instancia_text>}
      central_bidir._categorias_por_instancia = {};  // {instancia: Set<categoria>} — pra multi-cat
    }
    
    // INDEXAÇÃO: toda frase "X verbo Y" alimenta o cache permanente
    // (faço aqui pra capturar TUDO que passa, não só quando pergunta)
    // Aceita "é/=" mas também verbos relacionais (contém, purifica, gera, move, etc)
    // ═════════════════════════════════════════════════════════════
    // INDEXAÇÃO LAB 12.6 — 6 sub-redes novas (lógica formal)
    // Roda ANTES da indexação geral pra captar padrões especiais
    // ═════════════════════════════════════════════════════════════
    if(tokens.length >= 3){
      const t0 = tokens[0], t1 = tokens[1];
      // ─── B_silogismo: "se X então Y" ou "se X é Y" ───
      if(t0 === 'se'){
        // procura "então" ou "logo" ou ","
        let pos_ent = -1;
        for(let i=1; i<tokens.length-1; i++){
          if(tokens[i] === 'então' || tokens[i] === 'entao' || tokens[i] === 'logo' || tokens[i] === ','){
            pos_ent = i; break;
          }
        }
        if(pos_ent > 1 && pos_ent < tokens.length - 1){
          // antecedente = tokens[1..pos_ent-1], consequente = tokens[pos_ent+1..]
          // Pega palavra-chave do antecedente (último substantivo) e do consequente (primeiro substantivo importante)
          const STOPS = ['a','o','as','os','um','uma','uns','umas','é','eh','são','sao','tem','têm','de','do','da','para'];
          const ant_words = tokens.slice(1, pos_ent).filter(w => !STOPS.includes(w));
          const cons_words = tokens.slice(pos_ent + 1).filter(w => !STOPS.includes(w));
          if(ant_words.length > 0 && cons_words.length > 0){
            const ant = ant_words[0];
            const cons = cons_words[0];
            const sr_s = V112.subredes && V112.subredes.B_silogismo;
            if(sr_s){
              const c = v112_node_by_id(sr_s.id);
              if(c){
                if(!c._condicionais) c._condicionais = {};
                if(!c._consequente_para_antecedente) c._consequente_para_antecedente = {};
                if(!c._condicionais[ant]) c._condicionais[ant] = new Set();
                c._condicionais[ant].add(cons);
                if(!c._consequente_para_antecedente[cons]) c._consequente_para_antecedente[cons] = new Set();
                c._consequente_para_antecedente[cons].add(ant);
                c.acumulador = Math.min(200, c.acumulador + 10);
              }
            }
          }
        }
      }
      
      // ─── B_quantif: "todo X é Y", "todos X são Y" ───
      if(t0 === 'todo' || t0 === 'todos' || t0 === 'toda' || t0 === 'todas'){
        // "todos cachorros são mamíferos" → todo[cachorro] = mamifero
        const STOPS = ['a','o','as','os','um','uma','é','eh','são','sao','de'];
        const palavras = tokens.slice(1).filter(w => !STOPS.includes(w));
        if(palavras.length >= 2){
          const inst = palavras[0];
          const cat = palavras[1];
          const sr_q = V112.subredes && V112.subredes.B_quantif;
          if(sr_q){
            const c = v112_node_by_id(sr_q.id);
            if(c){
              if(!c._todo) c._todo = {};
              if(!c._todo[inst]) c._todo[inst] = new Set();
              c._todo[inst].add(cat);
              c.acumulador = Math.min(200, c.acumulador + 10);
            }
          }
        }
      }
      
      // ─── B_temporal: "X antes de Y", "X depois de Y" (e tokens unificados) ───
      for(let i=1; i<tokens.length-1; i++){
        let a = null, b = null;
        if(tokens[i] === 'antes_de' || tokens[i] === 'maior_que' || tokens[i] === 'menor_que'){
          a = tokens[i-1]; b = tokens[i+1];
        } else if(tokens[i] === "depois_de"){
          a = tokens[i+1]; b = tokens[i-1];
        } else if(i+2 < tokens.length && tokens[i] === 'antes' && tokens[i+1] === 'de'){
          a = tokens[i-1]; b = tokens[i+2];
        }
        if(a && b){
          const sr_t = V112.subredes && V112.subredes.B_temporal;
          if(sr_t){
            const c = v112_node_by_id(sr_t.id);
            if(c){
              if(!c._antes_de) c._antes_de = {};
              if(!c._antes_de[a]) c._antes_de[a] = new Set();
              c._antes_de[a].add(b);
              c.acumulador = Math.min(200, c.acumulador + 10);
            }
          }
        }
        // "X nasceu antes de Y" — pega sujeito mesmo se tiver verbo
        if((tokens[i] === 'nasceu' || tokens[i] === 'veio') && i+3 < tokens.length && tokens[i+1] === 'antes' && tokens[i+2] === 'de'){
          const a = tokens[i-1];
          const b = tokens[i+3];
          if(a && b){
            const sr_t = V112.subredes && V112.subredes.B_temporal;
            if(sr_t){
              const c = v112_node_by_id(sr_t.id);
              if(c){
                if(!c._antes_de) c._antes_de = {};
                if(!c._antes_de[a]) c._antes_de[a] = new Set();
                c._antes_de[a].add(b);
                c.acumulador = Math.min(200, c.acumulador + 10);
              }
            }
          }
        }
      }
      
      // ─── B_analogia: "A é B como C é D" ou "A:B" pares conhecidos ───
      // Formato simples: "rei é homem" + "rainha é mulher" cria par (rei,rainha) e (homem,mulher)
      // Aqui indexamos "X é Y" como par bidirecional se já existe outro X' tal que X' é Y' similar
      // Implementação mínima: B_analogia armazena pares explícitos "X par Y"
      for(let i=1; i<tokens.length-1; i++){
        if(tokens[i] === 'par' || tokens[i] === 'analogo' || tokens[i] === 'análogo'){
          const a = tokens[i-1], b = tokens[i+1];
          if(a && b){
            const sr_a = V112.subredes && V112.subredes.B_analogia;
            if(sr_a){
              const c = v112_node_by_id(sr_a.id);
              if(c){
                if(!c._pares) c._pares = {};
                if(!c._pares[a]) c._pares[a] = new Set();
                if(!c._pares[b]) c._pares[b] = new Set();
                c._pares[a].add(b);
                c._pares[b].add(a);
                c.acumulador = Math.min(200, c.acumulador + 10);
              }
            }
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // INDEXAÇÃO LAB 13 — 8 sub-redes novas (PFC + DMN + Atenção)
    // ═════════════════════════════════════════════════════════════
    if(tokens.length >= 3){
      const txt_norm = String(input || '').toLowerCase();
      
      // ─── LAB 13.3 — B_planejamento MULTI-ETAPA: "pra META, primeiro X, depois Y, finalmente Z" ───
      const mat_plano_p = txt_norm.match(/(?:pra|para)\s+(.+?)\s*[,:]\s*primeiro\s+(.+?)(?:\s*[,;]\s*(?:depois|então|entao)\s+(.+?))?(?:\s*[,;]\s*(?:finalmente|por fim|ao final)\s+(.+?))?[\?\.\!]?$/);
      if(mat_plano_p){
        const sr = V112.subredes && V112.subredes.B_planejamento;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            if(!c._planos) c._planos = {};
            const meta = mat_plano_p[1].trim();
            const passos = [mat_plano_p[2], mat_plano_p[3], mat_plano_p[4]].filter(p => p).map(p => p.trim());
            c._planos[meta] = passos;
          }
        }
      }
      
      // ─── B_planejamento: "X leva Y leva Z" (cadeia de passos) ───
      const tem_leva = tokens.filter(t => t === 'leva' || t === 'vai').length >= 2;
      if(tem_leva){
        const sr = V112.subredes && V112.subredes.B_planejamento;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            if(!c._passos) c._passos = {};
            // Extrai a cadeia de passos
            const passos = [];
            let pos = 0;
            for(let i = 0; i < tokens.length; i++){
              if(tokens[i] === 'leva' || tokens[i] === 'vai'){
                if(i > 0 && passos.length === 0) passos.push(tokens[i-1]);
                if(i < tokens.length - 1) passos.push(tokens[i+1]);
              }
            }
            // Indexa: primeiro_passo → todos os seguintes
            if(passos.length >= 2){
              const inicio = passos[0];
              if(!c._passos[inicio]) c._passos[inicio] = new Set();
              for(let k = 1; k < passos.length; k++){
                c._passos[inicio].add(passos[k]);
              }
              c.acumulador = Math.min(200, c.acumulador + 10);
            }
          }
        }
      }
      
      // ─── B_objetivo: "meu objetivo é X" / "minha meta é Y" ───
      const mat_obj = txt_norm.match(/(meu objetivo|minha meta|meu alvo|meu foco)\s+(é|eh|=)\s+(.+?)[\?\.\!]?$/);
      if(mat_obj){
        const sr = V112.subredes && V112.subredes.B_objetivo;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            c._meta_atual = mat_obj[3].trim();
            c.acumulador = Math.min(200, c.acumulador + 20);
          }
        }
      }
      
      // ─── B_autobiografia: indexa qualquer frase com sujeito = "eu" como evento autobiografico ───
      if(tokens[0] === 'eu' || tokens[0] === 'meu' || tokens[0] === 'minha'){
        const sr = V112.subredes && V112.subredes.B_autobiografia;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            if(!c._eventos_indexados) c._eventos_indexados = [];
            c._eventos_indexados.push({turno: V112.turn, tokens: tokens.slice(0, 8)});
            // Mantém só os últimos 50 pra não explodir
            if(c._eventos_indexados.length > 50) c._eventos_indexados.shift();
            c.acumulador = Math.min(200, c.acumulador + 10);
          }
        }
      }
      
      // ─── B_controle_exec: "não" no início inibe sujeito ───
      if(tokens[0] === 'não' || tokens[0] === 'nao'){
        const sr = V112.subredes && V112.subredes.B_controle_exec;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            if(!c._inibir) c._inibir = {};
            const alvo = tokens[1];
            if(alvo){
              c._inibir[alvo] = true;
              c.acumulador = Math.min(200, c.acumulador + 10);
            }
          }
        }
      }
    }
    
    if(tokens.length >= 3){
      // 1) Padrão "A é/= B" — comparação de identidade (categoria)
      // 2) Padrão "A verbo B" — relação direcional (cadeia lógica)
      const SIM_IGUAL = ['=','é','eh','igual','iguais','são','sao'];
      
      // Detecta posição do conector (verbo/operador) — pega o PRIMEIRO verbo encontrado
      // LAB 13.3: tokens compostos (antes_de, mais_alto, menor_que...) NÃO são tratados aqui
      //          — eles têm indexadores especializados (B_temporal usa)
      const TOKENS_COMPOSTOS = new Set(['antes_de','depois_de','mais_alto','mais_baixo','mais_forte','mais_rapido','mais_inteligente','mais_velho','mais_novo','maior_que','menor_que']);
      let pos_op = -1;
      let conector_eh_igual = false;
      for(let i = 1; i < tokens.length - 1; i++){
        if(SIM_IGUAL.includes(tokens[i])){
          pos_op = i; conector_eh_igual = true; break;
        }
        // Verbo relacional: token entre duas palavras com 3+ letras
        if(tokens[i].length >= 3 && !['uma','uns','umas','dos','das','para','pra','com','sem','que'].includes(tokens[i])){
          // LAB 13.3: tokens compostos têm tratamento próprio
          if(TOKENS_COMPOSTOS.has(tokens[i])){
            // É um conector temporal/comparativo — registra como B_temporal abaixo,
            // mas TAMBÉM serve pra cadeia B_logico se a frase é "A mais_alto B"
            pos_op = i; conector_eh_igual = false; break;
          }
          const antes_ok = i > 0 && tokens[i-1].length >= 1;
          const depois_ok = i < tokens.length - 1 && tokens[i+1].length >= 1;
          if(antes_ok && depois_ok && pos_op === -1){
            pos_op = i; conector_eh_igual = false;
          }
        }
      }
      
      if(pos_op > 0 && pos_op < tokens.length - 1){
        const inst = tokens[pos_op - 1];   // antes do conector
        const cat = tokens[pos_op + 1];    // depois do conector
        // Pula stopwords
        let cat_real = cat;
        if(['uma','um','o','a','de','do','da'].includes(cat) && pos_op + 2 < tokens.length){
          cat_real = tokens[pos_op + 2];
        }
        
        // NORMALIZAÇÃO PLURAL/SINGULAR pra B_logico — Sessão 2.3
        // "átomos" ≈ "átomo" pra cadeia (cadeia conecta forma canônica)
        function _norm_sing(w){
          if(!w || w.length < 4) return w;
          // remove plural simples
          if(w.endsWith('ões')) return w.slice(0, -3) + 'ão';  // ações → ação
          if(w.endsWith('ais')) return w.slice(0, -3) + 'al';  // animais → animal
          if(w.endsWith('eis')) return w.slice(0, -3) + 'el';  // móveis → móvel
          if(w.endsWith('óis')) return w.slice(0, -3) + 'ol';  
          if(w.endsWith('uis')) return w.slice(0, -3) + 'ul';
          if(w.endsWith('s') && !w.endsWith('ês') && !w.endsWith('ás')) return w.slice(0, -1);
          return w;
        }
        const inst_norm = _norm_sing(inst);
        const cat_norm = _norm_sing(cat_real);
        if(inst && cat_real && inst !== cat_real){
          // Pulso na sub-rede (energia entra pelo padrão X verbo Y)
          central_bidir.acumulador = Math.min(200, central_bidir.acumulador + 15);
          
          // ═════════════════════════════════════════════════════════════
          // B_logico: ENCADEAMENTO LÓGICO — alimenta SEMPRE (qualquer verbo)
          // Cadeia direcional A → B (com normalização plural/singular)
          // ═════════════════════════════════════════════════════════════
          const sr_log = V112.subredes.B_logico;
          if(sr_log){
            const central_log = v112_node_by_id(sr_log.id);
            if(central_log){
              if(!central_log._cadeia) central_log._cadeia = {};
              // Armazena AMBAS formas (original e normalizada)
              if(!central_log._cadeia[inst_norm]) central_log._cadeia[inst_norm] = new Set();
              central_log._cadeia[inst_norm].add(cat_norm);
              // Aliases pra que consultas de plural ou singular funcionem
              if(inst !== inst_norm){
                if(!central_log._cadeia[inst]) central_log._cadeia[inst] = new Set();
                central_log._cadeia[inst].add(cat_norm);
              }
              central_log.acumulador = Math.min(200, central_log.acumulador + 10);
              // Conta profundidade alcançável a partir de inst
              // Removido BFS interno por performance — não é necessário pra função
              // O cache cresce naturalmente, queries usam bfs externo
              central_log._max_cadeia = (central_log._max_cadeia || 0) + 1;
            }
          }
          
          // ═════════════════════════════════════════════════════════════
          // B_salto: TRAITS COMPARTILHADOS — Lab 12.1 Sessão 2.3
          // Quando "A tem X", indexa X → {A1, A2, ...} (índice reverso de traits)
          // Quando "A contém X", "A expele X", etc — mesma coisa
          // Permite salto: "bianca tem espinha" + "esponja tem padrão" 
          // se espinha e padrão se intersectam, faz salto Bianca→Esponja
          // ═════════════════════════════════════════════════════════════
          // tem/contém/expele/tem_em_cima/possui — verbos de atributo
          const VERBOS_TRAIT = ['tem','têm','possui','contém','expele','contem'];
          const conector_eh_trait = VERBOS_TRAIT.includes(tokens[pos_op]);
          if(conector_eh_trait){
            const sr_salto = V112.subredes.B_salto;
            if(sr_salto){
              const central_salto = v112_node_by_id(sr_salto.id);
              if(central_salto){
                if(!central_salto._trait_para_objetos) central_salto._trait_para_objetos = {};  // {trait: Set<objeto>}
                if(!central_salto._objeto_para_traits) central_salto._objeto_para_traits = {};  // {objeto: Set<trait>}
                if(!central_salto._trait_para_objetos[cat_real]) central_salto._trait_para_objetos[cat_real] = new Set();
                central_salto._trait_para_objetos[cat_real].add(inst);
                if(!central_salto._objeto_para_traits[inst]) central_salto._objeto_para_traits[inst] = new Set();
                central_salto._objeto_para_traits[inst].add(cat_real);
                central_salto.acumulador = Math.min(200, central_salto.acumulador + 10);
              }
            }
          }
          
          // SÓ alimenta _cache_instancias (categoria) se conector for igualdade
          if(conector_eh_igual){
            if(!central_bidir._cache_instancias[cat_real]) central_bidir._cache_instancias[cat_real] = new Set();
            central_bidir._cache_instancias[cat_real].add(inst);
            // Multi-categoria
            if(!central_bidir._categorias_por_instancia[inst]) central_bidir._categorias_por_instancia[inst] = new Set();
            const ja_tinha = central_bidir._categorias_por_instancia[inst].size;
            central_bidir._categorias_por_instancia[inst].add(cat_real);
            const tem_agora = central_bidir._categorias_por_instancia[inst].size;
            
            // Se NÃO era multi-cat antes e agora é → caso novo, dispara SUB_B
            if(ja_tinha === 1 && tem_agora === 2){
              if(V112.subredes.SUB_B){
                const meta = v112_node_by_id(V112.subredes.SUB_B.id);
                if(meta){
                  meta.acumulador = Math.min(200, meta.acumulador + 40);
                  meta._ativacoes = (meta._ativacoes || 0) + 1;
                  meta._sucessos = (meta._sucessos || 0) + 1;
                  if(!central_bidir._sabe_multi_cat){
                    central_bidir._sabe_multi_cat = true;
                    const ang = (sr_bidir.satelites.length / 8) * Math.PI * 2;
                    const sat_new = v112_node({
                      text: '',
                      camada: 'subrede_sat',
                      mass: 2.5,
                      threshold: 8,
                      pos: [central_bidir.pos[0] + Math.cos(ang) * 12, central_bidir.pos[1] + Math.sin(ang) * 12, central_bidir.pos[2]],
                      _subrede_pai: 'B_bidir',
                      _especialidade: 'multi_categoria',
                    });
                    sr_bidir.satelites.push(sat_new.id);
                    v112_edge(central_bidir.id, sat_new.id, 0.7, {tipo: 'subrede_interna'});
                    v112_edge(sat_new.id, central_bidir.id, 0.7, {tipo: 'subrede_interna'});
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13 — DMN + PFC sub-redes que dependem do TEXTO COMPLETO
    // (devem rodar ANTES do filtro de tokens.length, pois funcionam
    //  com perguntas de qualquer tamanho)
    // ═════════════════════════════════════════════════════════════
    {
      const txt_orig = String(input || '').toLowerCase();
      
      // B_objetivo: "qual meu objetivo / meta / alvo / foco"
      const eh_pergunta_objetivo = /(qual|quais|qual_é|qual_eh).*(objetivo|meta|alvo|foco)/.test(txt_orig);
      if(eh_pergunta_objetivo && !bidir_resultado){
        const sr = V112.subredes.B_objetivo;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c && c._meta_atual){
            c.acumulador = Math.min(200, c.acumulador + 40);
            c._ativacoes = (c._ativacoes||0)+1;
            c._sucessos = (c._sucessos||0)+1;
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'meu objetivo é '+c._meta_atual, objetivo: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_objetivo = {meta: c._meta_atual};
          }
        }
      }
      
      // B_identidade: "quem sou eu / quem é você / quem é nerael"
      const eh_pergunta_id = /(quem|qual).{0,8}(sou|é|eh).{0,8}(eu|você|voce|nerael|nereal)/.test(txt_orig) || /(você|voce|eu)\s+(é|eh|sou)\s+(o\s+que|que\s+coisa|que)/.test(txt_orig);
      if(eh_pergunta_id && !bidir_resultado){
        const sr = V112.subredes.B_identidade;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            const sc = V112.self_core;
            const partes = [];
            if(sc.nome && sc.nome.length > 0) partes.push('sou '+sc.nome[0]);
            if(sc.sou && sc.sou.length > 0) partes.push(sc.sou.join(', '));
            if(sc.criador && sc.criador.length > 0) partes.push('criado por '+sc.criador.join('/'));
            const identidade = partes.join(', ') || 'identidade não definida';
            c.acumulador = Math.min(200, c.acumulador + 50);
            c._ativacoes = (c._ativacoes||0)+1;
            c._sucessos = (c._sucessos||0)+1;
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: identidade, identidade: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_identidade = {identidade};
          }
        }
      }
      
      // B_simulacao: "se X acontecesse / se X fosse"
      const eh_hipotetico = /^se .{0,80}(acontecesse|fosse|ocorresse|tivesse|estivesse|aconteceria|seria|chovesse|caísse)/.test(txt_orig);
      if(eh_hipotetico && !bidir_resultado){
        const sr = V112.subredes.B_simulacao;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            c.acumulador = Math.min(200, c.acumulador + 40);
            c._ativacoes = (c._ativacoes||0)+1;
            c._sucessos = (c._sucessos||0)+1;
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'hipotético: simulando cenário sem afetar memória', simulacao: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_simulacao = {hipotetico: true};
          }
        }
      }
      
      // B_autobiografia: "lembra quando / o que aconteceu"
      const eh_pergunta_evento = /(lembra|o_que|que_aconteceu|conversamos).{0,30}(aconteceu|disse|falei|conversamos|antes)/.test(txt_orig) ||
                                  /(meu|nosso).{0,5}(passado|histórico|historico)/.test(txt_orig) ||
                                  /lembra/.test(txt_orig);
      if(eh_pergunta_evento && !bidir_resultado){
        const sr = V112.subredes.B_autobiografia;
        if(sr){
          const c = v112_node_by_id(sr.id);
          if(c){
            // Combina: eventos indexados + hipocampo
            const idx = c._eventos_indexados || [];
            const ultimos_idx = idx.slice(-3);
            const ultimos_hipo = V112.eventos.slice(-2);
            const partes_lembr = [];
            for(const e of ultimos_idx) partes_lembr.push(e.tokens.slice(0,5).join(' '));
            for(const e of ultimos_hipo) partes_lembr.push((e.tokens||[]).slice(0,5).join(' '));
            const resumo = partes_lembr.length > 0 ? 
              'lembro: ' + partes_lembr.join(' | ') :
              'nenhum evento na memória ainda';
            c.acumulador = Math.min(200, c.acumulador + 40);
            c._ativacoes = (c._ativacoes||0)+1;
            c._sucessos = (c._sucessos||0)+1;
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resumo, autobiografia: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_autobiografia = {eventos: partes_lembr.length};
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.3 — B_PLANEJAMENTO MULTI-ETAPA: "como X" → consulta plano completo
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      const mat_como = txt_orig.match(/^(?:como|qual o caminho pra|qual o caminho para|qual plano pra|qual plano para)\s+(.+?)[\?\.\!]?$/);
      if(mat_como){
        const meta = mat_como[1].trim();
        const sr_p = V112.subredes.B_planejamento;
        if(sr_p){
          const c = v112_node_by_id(sr_p.id);
          if(c && c._planos && c._planos[meta]){
            const passos = c._planos[meta];
            const resp = 'plano: ' + passos.map((p,i) => (i+1)+') '+p).join(' → ');
            c.acumulador = Math.min(200, c.acumulador + 50);
            c._ativacoes = (c._ativacoes||0)+1;
            c._sucessos = (c._sucessos||0)+1;
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, plano: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_planejamento = {meta, passos};
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.8 — B_GEOMETRIA: distância, ponto médio, vetor, ângulo, reta
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '');
      const txt_lc = txt_orig.toLowerCase();
      
      // Parser de pontos: "(0,0)" / "(3,4)" / "(1,2,3)" — 2D ou 3D
      function extrairPontos(s){
        const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+(?:\.\d+)?))?\s*\)/g;
        const pontos = [];
        let m;
        while((m = re.exec(s)) !== null){
          const p = [parseFloat(m[1]), parseFloat(m[2])];
          if(m[3] !== undefined) p.push(parseFloat(m[3]));
          pontos.push(p);
        }
        return pontos;
      }
      
      // 1) "distância entre (0,0) e (3,4)" / "distância (0,0) (3,4)"
      if(/dist[âa]ncia/i.test(txt_orig)){
        const pts = extrairPontos(txt_orig);
        if(pts.length >= 2){
          const d = v112_geo_distancia(pts[0], pts[1]);
          if(d !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'distância de (' + pts[0].join(',') + ') a (' + pts[1].join(',') + ') = ' + d, geo_dist: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_geometria = {distancia: [pts[0], pts[1], d]};
          }
        }
      }
      
      // 2) "ponto médio entre (0,0) e (4,6)"
      if(!bidir_resultado && /ponto m[ée]dio/i.test(txt_orig)){
        const pts = extrairPontos(txt_orig);
        if(pts.length >= 2){
          const m = v112_geo_ponto_medio(pts[0], pts[1]);
          if(m){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'ponto médio = (' + m.join(',') + ')', geo_med: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_geometria = {ponto_medio: m};
          }
        }
      }
      
      // 3) "vetor de (1,2) a (4,6)" / "vetor (1,2) (4,6)"
      if(!bidir_resultado && /^vetor/i.test(txt_orig.trim())){
        const pts = extrairPontos(txt_orig);
        if(pts.length >= 2){
          const v = v112_geo_vetor(pts[0], pts[1]);
          const mod = v112_geo_modulo(v);
          if(v){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'vetor = (' + v.join(',') + ') | módulo = ' + mod, geo_vec: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_geometria = {vetor: v, modulo: mod};
          }
        }
      }
      
      // 4) "ângulo entre (1,0) e (0,1)" — vetores
      if(!bidir_resultado && /[âa]ngulo/i.test(txt_orig)){
        const pts = extrairPontos(txt_orig);
        if(pts.length >= 2){
          const a = v112_geo_angulo(pts[0], pts[1]);
          if(a !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'ângulo entre vetores = ' + a + '°', geo_ang: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_geometria = {angulo: a};
          }
        }
      }
      
      // 5) "equação da reta por (0,1) e (1,3)"
      if(!bidir_resultado && /(?:equa[çc][ãa]o|reta).{0,15}(?:reta|por|entre)/i.test(txt_orig)){
        const pts = extrairPontos(txt_orig);
        if(pts.length >= 2 && pts[0].length === 2 && pts[1].length === 2){
          const eq = v112_geo_equacao_reta(pts[0], pts[1]);
          if(eq){
            let resp;
            if(eq.tipo === 'vertical') resp = 'reta vertical x = ' + eq.x;
            else {
              const m_str = eq.m === 0 ? '' : (eq.m === 1 ? 'x' : eq.m === -1 ? '-x' : eq.m + 'x');
              const b_str = eq.b === 0 ? '' : (eq.b > 0 ? ' + ' + eq.b : ' - ' + Math.abs(eq.b));
              resp = 'y = ' + (m_str || '0') + b_str;
            }
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, geo_reta: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_geometria = {reta: eq};
          }
        }
      }
      
      // 6) "área do triângulo (0,0) (4,0) (0,3)"
      if(!bidir_resultado && /[áa]rea.{0,15}tri[âa]ngulo/i.test(txt_orig)){
        const pts = extrairPontos(txt_orig);
        if(pts.length >= 3){
          const a = v112_geo_area_triangulo(pts[0], pts[1], pts[2]);
          if(a !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'área = ' + a, geo_area: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_geometria = {area: a};
          }
        }
      }
      
      // 7) "produto vetorial (1,0,0) e (0,1,0)" / "cross"
      if(!bidir_resultado && /(?:cross|produto vetorial)/i.test(txt_orig)){
        const pts = extrairPontos(txt_orig);
        if(pts.length >= 2 && pts[0].length === 3 && pts[1].length === 3){
          const c = v112_geo_cross(pts[0], pts[1]);
          if(c){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'produto vetorial = (' + c.join(',') + ')', geo_cross: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_geometria = {cross: c};
          }
        }
      }
      
      // 8) "produto escalar (1,2) (3,4)"
      if(!bidir_resultado && /(?:produto escalar|dot product|dot\s)/i.test(txt_orig)){
        const pts = extrairPontos(txt_orig);
        if(pts.length >= 2){
          const d = v112_geo_dot(pts[0], pts[1]);
          if(d !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'produto escalar = ' + d, geo_dot: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_geometria = {dot: d};
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.10 — B_LOOP: "vazar 1 do tanque 100 vezes" / "repete N vezes"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      
      // "vazar/somar/subtrair N do X, K vezes" / "repete K vezes: ..."
      // Padrão 1: "(soma|subtrai) N (ao|do) X (Y vezes|repetir Y|por Y ciclos)"
      const mat_loop = txt_orig.match(/^(soma|adiciona|subtrai|tira|remove|vaza|drena)\s+(-?\d+(?:\.\d+)?)\s+(?:ao|no|do|da|de)\s+([\wÀ-ÿ]+)\s+(?:(\d+)\s+(?:vezes|ciclos)|por\s+(\d+)\s+(?:vezes|ciclos)|repetindo\s+(\d+)|at[ée]\s+(zerar|esvaziar|zero))\s*\.?\s*$/);
      if(mat_loop){
        const verbo = mat_loop[1];
        const val = parseFloat(mat_loop[2]);
        const chave = mat_loop[3];
        const ate_zero = mat_loop[7] !== undefined;
        const n = ate_zero ? 100000 : parseInt(mat_loop[4] || mat_loop[5] || mat_loop[6]);
        const op = (verbo === 'soma' || verbo === 'adiciona') ? '+' : '-';
        // Se "até zerar", aplica floor em 0
        const opcoes = {detectar_convergencia: true};
        if(ate_zero) opcoes.floor_em = {[chave]: 0};
        const r = v112_loop_executar([[chave, op, val]], n, opcoes);
        let resp = chave + ' = ' + r.estado_final[chave] + ' após ' + r.ciclos_executados + ' ciclos';
        if(r.convergiu) resp += ' (convergiu em ' + r.convergiu_em + ')';
        resp += ' [' + r.tempo_ms + 'ms]';
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, loop: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_loop = r;
      }
      
      // "executa N ciclos: <operação>"
      if(!bidir_resultado){
        const mat_ex = txt_orig.match(/^(?:executa(?:r)?|rodar?|aplicar?)\s+(\d+)\s+(?:ciclos?|vezes|iterac[ãoõ]es?)\s*[:]\s*(.+?)\s*\.?\s*$/);
        if(mat_ex){
          const n = parseInt(mat_ex[1]);
          const op_str = mat_ex[2];
          // Parser de operação dentro
          const m_op = op_str.match(/(soma|subtrai|tira|adiciona|vaza|drena)\s+(-?\d+(?:\.\d+)?)\s+(?:ao|no|do|da|de)\s+(\w+)/);
          if(m_op){
            const op = (m_op[1] === 'soma' || m_op[1] === 'adiciona') ? '+' : '-';
            const r = v112_loop_executar([[m_op[3], op, parseFloat(m_op[2])]], n, {detectar_convergencia: true});
            let resp = m_op[3] + ' = ' + r.estado_final[m_op[3]] + ' após ' + r.ciclos_executados + ' ciclos';
            if(r.convergiu) resp += ' (convergiu em ' + r.convergiu_em + ')';
            resp += ' [' + r.tempo_ms + 'ms]';
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, loop: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_loop = r;
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.11 — B_TRANSFERENCIA: "transferir N de A para B"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      const mat_t = txt_orig.match(/^(?:transferir?|mover?|passar?|enviar?)\s+(-?\d+(?:\.\d+)?)\s+(?:de|do|da)\s+([\wÀ-ÿ]+)\s+(?:para|pro|pra|ao|à|à\s+)\s*([\wÀ-ÿ]+)\s*\.?\s*$/);
      if(mat_t){
        const r = v112_transferir(mat_t[2], mat_t[3], parseFloat(mat_t[1]));
        if(r){
          if(r.erro){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: '❌ ' + r.erro, transf_erro: true}};
          } else {
            const resp = 'transferiu ' + r.quantidade + ': ' + r.origem + ' = ' + r.valor_origem + ', ' + r.destino + ' = ' + r.valor_destino + ' (conservou: ' + r.conservou + ')';
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, transferencia: true}};
          }
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_transferencia = r;
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.11 — B_INVALIDACAO: "esquece X causa Y" / "remove X causa Y"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      const mat_inv = txt_orig.match(/^(?:esquece|esqueça|remove|invalida|apaga)\s+(?:que\s+)?(\S+)\s+causa\s+(\S+?)\s*\.?\s*$/);
      if(mat_inv){
        const ok = v112_causal_remover(mat_inv[1], mat_inv[2]);
        const resp = ok ? 'removida: ' + mat_inv[1] + ' ≠ ' + mat_inv[2] : 'relação ' + mat_inv[1] + '→' + mat_inv[2] + ' não existia';
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, invalidacao: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_invalidacao = {causa: mat_inv[1], efeito: mat_inv[2], removeu: ok};
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.13 — Comandos de auto-modificação
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      
      // "aprender com falhas" / "ciclo de aprendizado" → roda promotor
      if(/^(?:aprender(?:\s+com\s+falhas)?|ciclo\s+de\s+aprendizado|auto-aprender|aprenda|consolidar\s+aprendizado)\s*\??\s*\.?\s*$/.test(txt_orig)){
        const r = v112_promotor_ciclo();
        let resp = 'ciclo aprendizado: ' + r.tentativas + ' tentativas, ' + r.consolidadas + ' consolidadas, ' + r.descartadas + ' descartadas, ' + r.sem_regra + ' sem regra inferível';
        if(r.exemplos.length > 0){
          resp += '. Exemplos: ' + r.exemplos.slice(0, 2).map(e => e.regra).join(' | ');
        }
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, promotor: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_promotor = r;
      }
      
      // "relatório de falhas" / "introspecção"
      if(!bidir_resultado && /^(?:relat[óo]rio\s+(?:de\s+)?falhas|introspec[çc][ãa]o|status\s+(?:do\s+)?aprendizado)\s*\??\s*\.?\s*$/.test(txt_orig)){
        const r = v112_introspector_relatar();
        let resp = 'falhas registradas: ' + (r?r.total_falhas:0) + ', padrões: ' + (r?r.padroes_detectados:0) + ', sugestões pendentes: ' + (r?r.sugestoes_pendentes:0) + ', consolidadas: ' + (r?r.sugestoes_consolidadas:0);
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, introspec: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_introspector = r;
      }
      
      // "regras adaptadas" / "regras aprendidas"
      if(!bidir_resultado && /^(?:regras\s+(?:adaptadas|aprendidas)|camada\s+adapt|adapt\s+layer)\s*\??\s*\.?\s*$/.test(txt_orig)){
        const r = v112_adapt_relatar();
        const resp = 'camada ADAPT: ' + (r?r.total:0) + ' regras (' + (r?r.consolidadas:0) + ' consolidadas, ' + (r?r.experimentais:0) + ' experimentais)';
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, adapt: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_adapt_layer = r;
      }
      
      // "validar regressão" → roda mini-bateria
      if(!bidir_resultado && /^(?:validar\s+(?:regress[ãa]o)?|testar\s+core|verificar\s+core)\s*\??\s*\.?\s*$/.test(txt_orig)){
        const r = v112_validador_testar_regressao();
        const resp = 'regressão: ' + r.ok + '/' + r.total + ' (' + (r.passou ? 'PASSOU ✓' : 'FALHOU ❌') + ')';
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, validador: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_validador = r;
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.11 — B_META_REGRA: "consolidar regras" / "criar atalhos"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      if(/^(?:consolidar?\s+regras?|criar?\s+atalhos?|meta[- ]regras?|inferir\s+atalhos?)\s*\??\s*\.?\s*$/.test(txt_orig)){
        const r = v112_meta_regra_consolidar({max_atalhos: 500});
        let resp = r.atalhos_criados + ' atalhos criados (meta-regra: transitividade)';
        if(r.exemplos.length > 0){
          resp += '. Exemplos: ' + r.exemplos.slice(0, 3).map(e => e.A + '→' + e.C + ' (via ' + e.B + ')').join(', ');
        }
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, meta_regra: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_meta_regra = r;
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.11 — B_RAIZ: "qual a raiz de X" / "diagnóstico de X"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      const mat_r = txt_orig.match(/^(?:qual\s+(?:a|é\s+a)?\s+)?(?:raiz|origem|causa\s+raiz|causa\s+principal|diagn[óo]stico)\s+(?:de|do|da|para)\s+(\S+?)\s*\??\s*\.?\s*$/);
      if(mat_r){
        const efeito = mat_r[1].replace(/[\?\.]+$/, '');
        const r = v112_buscar_raiz(efeito);
        if(r && r.raizes.length > 0){
          const raiz = r.raiz_mais_profunda;
          let resp = 'raiz de ' + efeito + ': ' + raiz.raiz + ' (profundidade ' + raiz.profundidade + ', caminho: ' + raiz.caminho.join(' → ') + ')';
          if(r.raizes.length > 1) resp += ' [' + r.raizes.length + ' raízes possíveis]';
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, raiz: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_raiz = r;
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.10 — B_LOOP enquanto: "enquanto tanque > 0: subtrai 1 do tanque"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      // "enquanto X (>|<|>=|<=|==|!=) N: <operação>"
      const mat_enq = txt_orig.match(/^enquanto\s+([\wÀ-ÿ]+)\s*(>=|<=|==|!=|>|<|=)\s*(-?\d+(?:\.\d+)?)\s*[:,]\s*(.+?)\s*\.?\s*$/);
      if(mat_enq){
        const chave_c = mat_enq[1];
        let op_c = mat_enq[2];
        if(op_c === '=') op_c = '==';
        const val_c = parseFloat(mat_enq[3]);
        const op_str = mat_enq[4];
        // Parser da operação interna: "soma N ao X" / "subtrai N do X"
        const m_op = op_str.match(/(soma|adiciona|subtrai|tira|remove|vaza|drena)\s+(-?\d+(?:\.\d+)?)\s+(?:ao|no|do|da|de)\s+([\wÀ-ÿ]+)/);
        if(m_op){
          const op = (m_op[1] === 'soma' || m_op[1] === 'adiciona') ? '+' : '-';
          const r = v112_loop_enquanto(chave_c, op_c, val_c, [[m_op[3], op, parseFloat(m_op[2])]], {max_ciclos: 100000});
          let resp = m_op[3] + ' = ' + r.estado_final[m_op[3]] + ' (' + r.ciclos_executados + ' iterações, parou por ' + r.parou_por + ') [' + r.tempo_ms + 'ms]';
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, loop_enquanto: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_loop = r;
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.10 — B_PROPAGACAO: "propaga X" / "alcança de X" / "profundidade X"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      const mat_p = txt_orig.match(/^(?:propaga(?:r)?\s+(?:de\s+)?|alcan[çc]a(?:dos)?\s+(?:de\s+|a\s+partir\s+de\s+)?|profundidade\s+(?:de\s+)?)(\S+?)\s*\??\s*\.?\s*$/);
      if(mat_p){
        const origem = mat_p[1].replace(/[\?\.]+$/, '');
        const r = v112_propagar_profundo(origem, {max_profundidade: 1000, max_nos: 5000});
        if(r.total > 0){
          let resp = origem + ' → ' + r.total + ' nós alcançados, profundidade ' + r.profundidade;
          if(r.ciclos.length > 0) resp += ' | ⚠ ' + r.ciclos.length + ' ciclo(s) detectado(s)';
          resp += ' [' + r.tempo_ms + 'ms]';
          // Lista primeiros 10
          if(r.alcancados.length > 0) resp += '\n  primeiros: ' + r.alcancados.slice(0, 10).join(', ');
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, propagacao: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_propagacao = r;
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.9 — B_MUNDO: variáveis numéricas com operações
    // "tanque = 100", "soma 50 ao tanque", "tanque - 20"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      
      // 1) "objeto = N" (atribuição numérica simples — distinto de álgebra que tem x)
      //    Só captura se objeto NÃO é 1 letra (essas são variáveis de álgebra)
      const mat_set = txt_orig.match(/^([\wÀ-ÿ]{2,})\s*(?:=|vale|tem)\s*(-?\d+(?:\.\d+)?)\s*\.?\s*$/);
      if(mat_set && !/^[xyabnm]$/.test(mat_set[1])){
        const chave = mat_set[1];
        const val = parseFloat(mat_set[2]);
        v112_mundo_set(chave, val);
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: chave + ' = ' + val + ' (mundo)', mundo_set: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_mundo = {set: [chave, val]};
      }
      
      // 2) "soma N ao/no/a/em objeto" / "adiciona N ao objeto"
      if(!bidir_resultado){
        const mat_soma = txt_orig.match(/^(?:soma|adiciona|aumenta|incrementa)\s+(-?\d+(?:\.\d+)?)\s+(?:ao|no|na|à|em|de)\s+([\wÀ-ÿ]+)\s*\.?\s*$/);
        if(mat_soma){
          const val = parseFloat(mat_soma[1]);
          const chave = mat_soma[2];
          const novo = v112_mundo_op(chave, '+', val);
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: chave + ' = ' + novo, mundo_op: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_mundo = {op: ['+', chave, val, novo]};
        }
      }
      
      // 3) "subtrai N de/do objeto" / "tira N de/do objeto" / "remove N de objeto"
      if(!bidir_resultado){
        const mat_sub = txt_orig.match(/^(?:subtrai|tira|remove|diminui|decrementa)\s+(-?\d+(?:\.\d+)?)\s+(?:de|do|da)\s+([\wÀ-ÿ]+)\s*\.?\s*$/);
        if(mat_sub){
          const val = parseFloat(mat_sub[1]);
          const chave = mat_sub[2];
          const novo = v112_mundo_op(chave, '-', val);
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: chave + ' = ' + novo, mundo_op: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_mundo = {op: ['-', chave, val, novo]};
        }
      }
      
      // 4) "consulta valor: quanto tem X" / "quanto vale X" (não-única letra)
      if(!bidir_resultado){
        const mat_q = txt_orig.match(/^(?:quanto\s+(?:tem|vale|tá|esta)\s+|qual\s+(?:o\s+)?valor\s+de\s+|valor\s+de\s+)([\wÀ-ÿ]{2,})\s*\??\s*\.?\s*$/);
        if(mat_q && !/^[xyabnm]$/.test(mat_q[1])){
          const chave = mat_q[1];
          const val = v112_mundo_get(chave);
          if(val !== null && val !== undefined){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: chave + ' = ' + val, mundo_get: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_mundo = {get: [chave, val]};
          }
        }
      }
      
      // 5) "estado do mundo" / "mostra mundo"
      if(!bidir_resultado){
        if(/^(?:estado\s+(?:do\s+)?mundo|mostra\s+(?:o\s+)?mundo|listar?\s+mundo)\s*\??\s*\.?\s*$/.test(txt_orig)){
          const e = v112_mundo_estado();
          const linhas = Object.entries(e).map(([k,v]) => k + '=' + v).join(', ');
          if(linhas){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'mundo: {' + linhas + '}', mundo_estado: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_mundo = {estado: e};
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.8 — B_ESTADO: copo cheio, beber metade, quanto resta
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().trim();
      
      // 1) "copo cheio" / "X cheio" / "X cheia" / "X está cheio"
      const mat_cheio = txt_orig.match(/^(\w+)\s+(?:est[áa]\s+)?(?:cheio|cheia|completo|completa)\s*\.?\s*$/);
      if(mat_cheio){
        v112_estado_set(mat_cheio[1], 'nivel', 1.0);
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: mat_cheio[1] + ' está cheio (100%)', estado_init: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_estado = {init: mat_cheio[1], nivel: 1.0};
      }
      
      // 2) "X vazio" / "X vazia"
      if(!bidir_resultado){
        const mat_vazio = txt_orig.match(/^(\w+)\s+(?:est[áa]\s+)?(?:vazio|vazia)\s*\.?\s*$/);
        if(mat_vazio){
          v112_estado_set(mat_vazio[1], 'nivel', 0);
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: mat_vazio[1] + ' está vazio (0%)', estado_init: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_estado = {init: mat_vazio[1], nivel: 0};
        }
      }
      
      // 3) "beber metade" / "comer metade" / "esvaziar metade" — usa último manipulado
      if(!bidir_resultado){
        const mat_acao = txt_orig.match(/^(?:beber|comer|esvaziar|tirar|remover|usar)\s+(metade|tudo|todo|um quarto|1\/4|dois ter[çc]os|2\/3|um ter[çc]o|1\/3|\d+\s*%)\s*\.?\s*$/);
        if(mat_acao){
          const sr = V112.subredes.B_estado;
          if(sr){
            const c = v112_node_by_id(sr.id);
            if(c && c._objetos){
              const obj = c._ultimo || Object.keys(c._objetos).slice(-1)[0];
              if(obj){
                const novo_nivel = v112_estado_aplicar(obj, mat_acao[1]);
                const desc = v112_estado_descrever(obj);
                bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: obj + ' agora: ' + desc, estado_acao: true}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_estado = {acao: mat_acao[1], obj, nivel: novo_nivel};
              }
            }
          }
        }
      }
      
      // 4) "beber metade do copo" / "beber metade de X"
      if(!bidir_resultado){
        const mat_acao2 = txt_orig.match(/^(?:beber|comer|esvaziar|tirar|remover|usar)\s+(metade|tudo|todo|um quarto|1\/4|dois ter[çc]os|2\/3|um ter[çc]o|1\/3|\d+\s*%)\s+(?:do|da|de)\s+(\w+)\s*\.?\s*$/);
        if(mat_acao2){
          const obj = mat_acao2[2];
          const novo_nivel = v112_estado_aplicar(obj, mat_acao2[1]);
          const desc = v112_estado_descrever(obj);
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: obj + ' agora: ' + desc, estado_acao: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_estado = {acao: mat_acao2[1], obj, nivel: novo_nivel};
        }
      }
      
      // 5) "quanto resta?" / "quanto tem?" / "estado de X"
      if(!bidir_resultado){
        const mat_q = txt_orig.match(/^(?:quanto (?:resta|tem|sobrou|sobra|falta)|estado de|nivel de|n[ií]vel de)\s*(?:do|da|de)?\s*(\w*)\s*\??\s*\.?\s*$/);
        if(mat_q){
          let obj = mat_q[1];
          if(!obj || obj === ''){
            const sr = V112.subredes.B_estado;
            if(sr){
              const c = v112_node_by_id(sr.id);
              if(c && c._objetos){
                obj = c._ultimo || Object.keys(c._objetos).slice(-1)[0];
              }
            }
          }
          if(obj){
            const desc = v112_estado_descrever(obj);
            if(desc){
              bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: obj + ': ' + desc, estado_query: true}};
              LOG.subredes = LOG.subredes || {}; LOG.subredes.B_estado = {query: obj, desc};
            }
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.8 — B_REVERSO: "o que pode causar X?" / "causa de X"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      const mat_rev = txt_orig.match(/^(?:o que (?:pode )?(?:causa|provoca|gera|causaria) |causas? de |o que causa(?:ria)? )(\S+)\s*\??\s*$/);
      const mat_rev2 = txt_orig.match(/^(?:tem|aparece(?:u)?|surgiu) (\S+)\s*[,.]\s*o que (?:pode (?:ter )?)?(?:acontec|caus)\w*\s*\??\s*$/);
      let efeito = null;
      if(mat_rev) efeito = mat_rev[1];
      else if(mat_rev2) efeito = mat_rev2[1];
      if(efeito){
        // Limpa pontuação
        efeito = efeito.replace(/[?.!,]+$/, '');
        const causas = v112_reverso_consultar(efeito);
        if(causas.length > 0){
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: efeito + ' pode ter sido causado por: ' + causas.join(', '), reverso: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_reverso = {efeito, causas};
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.7 — B_ELETRONICA: portas + tabela verdade + simplificação
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '');
      const txt_lc = txt_orig.toLowerCase();
      
      // 1) Porta única: "AND 1 0", "OR 1 1", "NOT 1", "XOR 1 0"
      const mat_p = txt_orig.match(/^\s*(AND|OR|NOT|XOR|NAND|NOR|XNOR)\s+([01\s]+)\s*\??\s*$/i);
      if(mat_p){
        const porta = mat_p[1].toUpperCase();
        const entradas = mat_p[2].trim().split(/\s+/).map(c => parseInt(c)).filter(x => x === 0 || x === 1);
        if(entradas.length > 0){
          const r = v112_eletro_porta(porta, entradas);
          if(r !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: porta + '(' + entradas.join(',') + ') = ' + r, eletro_porta: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_eletronica = {porta, entradas, saida: r};
          }
        }
      }
      
      // 2) Tabela verdade: "tabela verdade A AND B"
      if(!bidir_resultado){
        const mat_tv = txt_orig.match(/^(?:tabela\s+verdade(?:\s+de)?\s+|tabela\s+de\s+verdade\s+)(.+?)\s*\??\s*$/i);
        if(mat_tv){
          const expr = mat_tv[1].trim();
          const tv = v112_eletro_tabela_verdade(expr);
          if(tv){
            const cabec = tv.variaveis.join(' | ') + ' | saída';
            const linhas = tv.linhas.map(l => 
              tv.variaveis.map(v => l.entradas[v]).join(' | ') + ' | ' + l.saida
            );
            const resp = 'TV ' + expr.toUpperCase() + ': ' + cabec + ' || ' + linhas.join(' | ');
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, eletro_tv: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_eletronica = {tabela_verdade: expr, linhas: tv.linhas.length};
          }
        }
      }
      
      // 3) Simplificar: "simplifique: (A AND B) OR (A AND NOT B)"
      if(!bidir_resultado){
        const mat_s = txt_orig.match(/^(?:simplifique|simplifica|karnaugh|kmap)\s*[:]?\s*(.+?)\s*\??\s*$/i);
        if(mat_s){
          const expr = mat_s[1].trim();
          const s = v112_eletro_simplificar(expr);
          if(s){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: expr.toUpperCase() + ' simplifica para → ' + s.expr + ' (' + s.mintermos + ' mintermos)', eletro_simpl: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_eletronica = {simplificou: s.expr};
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.7 — B_BAYES: probabilidade + combinatória
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '');
      const txt_lc = txt_orig.toLowerCase();
      
      // 1) Combinação: "C(52, 2)" ou "combinação 52 2" ou "combinações de 52 escolha 2"
      const mat_c = txt_orig.match(/^(?:c\s*\(|combina[çc][ãa]o[s]?\s+(?:de\s+)?)(\d+)[\s,)]+\s*(?:escolhe?\s+|tomados?\s+)?(\d+)\)?\s*\??\s*$/i);
      if(mat_c){
        const n = parseInt(mat_c[1]);
        const k = parseInt(mat_c[2]);
        const r = v112_combinacao(n, k);
        if(r !== null){
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'C(' + n + ',' + k + ') = ' + r, bayes_comb: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_bayes = {combinacao: [n, k], r};
        }
      }
      
      // 2) Permutação: "P(5, 2)"
      if(!bidir_resultado){
        const mat_pe = txt_orig.match(/^(?:p\s*\(|permuta[çc][ãa]o[s]?\s+(?:de\s+)?)(\d+)[\s,)]+\s*(\d+)\)?\s*\??\s*$/i);
        if(mat_pe){
          const n = parseInt(mat_pe[1]);
          const k = parseInt(mat_pe[2]);
          const r = v112_permutacao(n, k);
          if(r !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'P(' + n + ',' + k + ') = ' + r, bayes_perm: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_bayes = {permutacao: [n, k], r};
          }
        }
      }
      
      // 3) Fatorial: "5!" ou "fatorial 5" ou "fatorial de 10"
      if(!bidir_resultado){
        const mat_f = txt_orig.match(/^(?:(\d+)\s*!|fatorial\s+(?:de\s+)?(\d+))\s*\??\s*$/i);
        if(mat_f){
          const n = parseInt(mat_f[1] || mat_f[2]);
          const r = v112_fatorial(n);
          if(r !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: n + '! = ' + r.toString(), bayes_fat: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_bayes = {fatorial: n, r: r.toString()};
          }
        }
      }
      
      // 4) Bayes: "bayes(P(B|A), P(A), P(B))" ou "bayes 0.95 0.01 0.06"
      if(!bidir_resultado){
        const mat_bay = txt_orig.match(/^(?:bayes|teorema de bayes)\s*[:(]?\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\)?\s*\??\s*$/i);
        if(mat_bay){
          const pba = parseFloat(mat_bay[1]);
          const pa = parseFloat(mat_bay[2]);
          const pb = parseFloat(mat_bay[3]);
          const r = v112_bayes(pba, pa, pb);
          if(r !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'P(A|B) = ' + pba + ' × ' + pa + ' / ' + pb + ' = ' + r + ' (' + (r*100).toFixed(2) + '%)', bayes_calc: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_bayes = {bayes: [pba, pa, pb], r};
          }
        }
      }
      
      // 5) Binomial: "binomial 10 3 0.5" → P(X=3) com n=10, p=0.5
      if(!bidir_resultado){
        const mat_bn = txt_orig.match(/^binomial\s+(\d+)\s+(\d+)\s+([\d.]+)\s*\??\s*$/i);
        if(mat_bn){
          const n = parseInt(mat_bn[1]);
          const k = parseInt(mat_bn[2]);
          const p = parseFloat(mat_bn[3]);
          const r = v112_binomial(n, k, p);
          if(r !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'P(X=' + k + ' em ' + n + ' com p=' + p + ') = ' + r + ' (' + (r*100).toFixed(2) + '%)', bayes_bin: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_bayes = {binomial: [n, k, p], r};
          }
        }
      }
      
      // 6) Probabilidade simples: "probabilidade 3 em 10" ou "qual a chance de 1 em 6"
      if(!bidir_resultado){
        const mat_ps = txt_orig.match(/^(?:probabilidade|chance|prob)\s+(?:de\s+)?(\d+)\s+(?:em|de|sobre|\/)\s+(\d+)\s*\??\s*$/i);
        if(mat_ps){
          const fav = parseInt(mat_ps[1]);
          const tot = parseInt(mat_ps[2]);
          const r = v112_prob_simples(fav, tot);
          if(r !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'P = ' + fav + '/' + tot + ' = ' + r + ' (' + (r*100).toFixed(2) + '%)', bayes_simples: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_bayes = {prob: [fav, tot], r};
          }
        }
      }
      
      // 7) Cartas: "2 ases" ou "chance 2 ases"
      if(!bidir_resultado){
        const mat_ca = txt_orig.match(/^(?:chance|probabilidade|prob)?\s*(?:de\s+)?tirar\s+(\d+)\s+(ases?|reis?|damas?|valetes?)\s*\??\s*$/i);
        if(mat_ca){
          const k = parseInt(mat_ca[1]);
          // 4 cartas de cada tipo
          const r = v112_prob_baralho_kcartas(k, 4);
          if(r !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'P(' + k + ' ' + mat_ca[2] + ') = ' + r + ' (' + (r*100).toFixed(2) + '%)', bayes_cartas: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_bayes = {cartas: [k, mat_ca[2]], r};
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.6 — B_QUIMICA: parser + massa + balanceamento via linguagem natural
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      const txt_raw = String(input || '');  // preserva caixa pra fórmulas
      
      // 1) "balanceie: H2 + O2 → H2O" ou "balanceie H2 + O2 -> H2O"
      const mat_bal = txt_raw.match(/^(?:balance[ie]+|balancear)\s*[:]?\s*(.+?)\s*(?:→|->|=>)\s*(.+?)\s*\.?\s*$/i);
      if(mat_bal){
        const reagentes = mat_bal[1].split(/\s*\+\s*/).map(s => s.trim()).filter(s => s);
        const produtos = mat_bal[2].split(/\s*\+\s*/).map(s => s.trim()).filter(s => s);
        const eq_str = v112_quimica_balancear_str(reagentes, produtos);
        const sr_q = V112.subredes.B_quimica;
        if(sr_q){
          const c = v112_node_by_id(sr_q.id);
          if(c){ c._ativacoes = (c._ativacoes||0)+1; if(eq_str) c._sucessos = (c._sucessos||0)+1; }
        }
        if(eq_str){
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: eq_str, quimica_balanco: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_quimica = {balanco: eq_str};
        } else {
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'não consegui balancear (fórmula inválida ou coeficientes > 12)', quimica_falhou: true}};
        }
      }
      
      // 2) "quantos átomos em X" / "átomos em X"
      if(!bidir_resultado){
        const mat_at = txt_raw.match(/^(?:quantos?\s+[áa]tomos\s+(?:em|tem|de)\s+|[áa]tomos\s+(?:em|de)\s+)([A-Za-z0-9\(\)]+)\s*\??\s*$/i);
        if(mat_at){
          const f = mat_at[1].trim();
          const n = v112_quimica_total_atomos(f);
          if(n !== null){
            const detalhe = v112_quimica_parse(f);
            const breakdown = Object.entries(detalhe).map(([el,q]) => q + ' ' + el).join(' + ');
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: f + ' tem ' + n + ' átomos (' + breakdown + ')', quimica_atomos: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_quimica = {formula: f, atomos: n};
          }
        }
      }
      
      // 3) "massa de X" / "massa molecular de X" / "peso molecular X"
      if(!bidir_resultado){
        const mat_m = txt_raw.match(/^(?:massa\s+(?:molecular|molar|atomica|at[ôo]mica|d[ae])?\s*(?:de\s+)?|peso\s+(?:molecular\s+)?(?:de\s+)?)([A-Za-z0-9\(\)]+)\s*\??\s*$/i);
        if(mat_m){
          const f = mat_m[1].trim();
          const m = v112_quimica_massa(f);
          if(m !== null){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'massa molecular de ' + f + ' = ' + m + ' g/mol', quimica_massa: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_quimica = {formula: f, massa: m};
          }
        }
      }
      
      // 4) "elementos em X" / "composição de X"
      if(!bidir_resultado){
        const mat_el = txt_raw.match(/^(?:elementos\s+(?:em|de)\s+|composi[çc][ãa]o\s+(?:de\s+)?)([A-Za-z0-9\(\)]+)\s*\??\s*$/i);
        if(mat_el){
          const f = mat_el[1].trim();
          const els = v112_quimica_elementos(f);
          if(els){
            const desc = els.map(e => e.quantidade + ' ' + e.nome + ' (' + e.simbolo + ')').join(', ');
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: f + ' = ' + desc, quimica_elementos: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_quimica = {formula: f, elementos: els.length};
          }
        }
      }
      
      // 5) "elemento X" (consulta direta: "elemento Au")
      if(!bidir_resultado){
        const mat_e = txt_raw.match(/^(?:elemento|o que é)\s+([A-Z][a-z]?)\s*\??\s*$/);
        if(mat_e){
          const sim = mat_e[1];
          const d = TABELA_PERIODICA[sim];
          if(d){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: sim + ' = ' + d.nome + ' (Z=' + d.numero + ', massa=' + d.massa + ')', quimica_elemento: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_quimica = {elemento: sim};
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.5 — B_ALGEBRA: variáveis + equações 1º e 2º grau
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      
      // 1) Definir variável: "x = 5", "seja x = 3", "defina x como 7"
      const mat_def = txt_orig.match(/^(?:seja|defina|considere)?\s*([a-z])\s*(?:=|igual a|vale|como)\s*(-?\d+(?:\.\d+)?)\s*\.?$/);
      if(mat_def && !/\^|\*\*/.test(txt_orig)){
        const nome = mat_def[1];
        const val = parseFloat(mat_def[2]);
        v112_algebra_definir(nome, val);
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: nome + ' = ' + val + ' (guardado)', algebra_var: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_algebra = {definiu: [nome, val]};
      }
      
      // 2) Consultar variável: "quanto vale x ?", "qual o valor de x ?"
      if(!bidir_resultado){
        const mat_cons = txt_orig.match(/^(?:quanto vale|qual o valor de|qual é o valor de)\s+([a-z])\s*\??$/);
        if(mat_cons){
          const val = v112_algebra_consultar(mat_cons[1]);
          if(val !== null && val !== undefined){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: mat_cons[1] + ' = ' + val, algebra_consulta: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_algebra = {consultou: [mat_cons[1], val]};
          }
        }
      }
      
      // 3) Resolver equação: "resolva: 2x + 4 = 10" ou "x² - 5x + 6 = 0"
      // LAB 13.5 — Ignora se input começa com "padrão"/"padrao" (B_indutor cuida)
      if(!bidir_resultado && !/^padr[ãa]o/.test(txt_orig)){
        const mat_res = txt_orig.match(/^(?:resolva|resolver|calcule)\s*[:]?\s*(.+?)\s*\.?\s*$/);
        let eqStr = null;
        if(mat_res) eqStr = mat_res[1];
        // OU detecta = com x na frase direto
        else if(/=/.test(txt_orig) && /[a-z]/.test(txt_orig) && !/(qual|quem|quanto|seja|defina)/.test(txt_orig)){
          eqStr = txt_orig.replace(/\?+$/, '').trim();
        }
        if(eqStr){
          // Detecta se tem x² ou x^2 ou x**2 ou x*x
          const tem_2grau = /(\^2|²|\*\*2|x\s*\*\s*x)/.test(eqStr);
          if(tem_2grau){
            const r = v112_algebra_2grau(eqStr);
            if(r && r.ok){
              let resp;
              if(r.real === false) resp = r.msg;
              else if(r.delta === 0) resp = r.msg;
              else if(r.x1 !== undefined && r.x2 !== undefined){
                const f = r.formatado;
                resp = 'x₁ = ' + f.x1 + ', x₂ = ' + f.x2 + ' (Δ = ' + f.delta + ')';
              }
              else resp = JSON.stringify(r);
              bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, algebra_2grau: true}};
              LOG.subredes = LOG.subredes || {}; LOG.subredes.B_algebra = {tipo:'2grau', r};
            }
          } else if(/[a-z]/.test(eqStr) && /=/.test(eqStr)){
            const r = v112_algebra_1grau(eqStr);
            if(r && r.ok){
              let resp;
              if(r.infinitas) resp = r.msg;
              else if(r.x !== undefined){
                const x = Number.isInteger(r.x) ? r.x : r.x.toFixed(4).replace(/\.?0+$/,'');
                resp = 'x = ' + x;
              }
              else resp = JSON.stringify(r);
              bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, algebra_1grau: true}};
              LOG.subredes = LOG.subredes || {}; LOG.subredes.B_algebra = {tipo:'1grau', r};
            }
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.5 — B_TRIGONOMETRIA: "sin(30)", "cos(60)", "tan(45)"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      const mat_trig = txt_orig.match(/(?:^|\s)(sin|sen|seno|cos|cosseno|tan|tg|tangente)\s*[\(\s]\s*(-?\d+(?:\.\d+)?)\s*(?:graus|°)?\s*\)?\s*\??\s*$/);
      if(mat_trig){
        const funcao = mat_trig[1];
        const ang = parseFloat(mat_trig[2]);
        const r = v112_trig(funcao, ang);
        if(r){
          let resp;
          if(!r.ok) resp = r.msg;
          else if(r.exato) resp = funcao + '(' + ang + '°) = ' + r.exato;
          else resp = funcao + '(' + ang + '°) ≈ ' + r.aprox;
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, trig: true}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_trig = {funcao, ang, r};
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.5 — B_MULTICTX: "tudo sobre X" / "dimensões de X"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      const mat_mtx = txt_orig.match(/^(?:tudo sobre|dimens[õo]es de|todos contextos de|contextos? de|tudo de)\s+(\S+)\s*\??$/);
      if(mat_mtx){
        const palavra = mat_mtx[1];
        const dims = v112_multictx_consultar(palavra);
        if(dims.length > 0){
          const linhas = dims.map(d => d.tipo + ': ' + d.valor);
          const resp = palavra + ' → ' + linhas.join(' | ');
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, multictx: true, dimensoes: dims.length}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_multictx = {palavra, dimensoes: dims};
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.4 — B_INDUTOR: "padrão: 2→11, 5→11111, 7→1111111, então 4 = ?"
    // Detecta padrão de pares e aplica em entrada nova
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      // Formato: "padrão: a→b, c→d, e→f, então X = ?"
      // ou: "padrao: a→b, c→d, então X"
      const mat_ind = txt_orig.match(/^padr[ãa]o\s*[:=]\s*(.+?)(?:,\s*ent[ãa]o\s+(.+?)\s*=?\s*\??)\s*$/);
      if(mat_ind){
        const corpo = mat_ind[1];
        const consulta = mat_ind[2].trim().replace(/[\?\.]+$/,'');
        // Parser de pares: "2→11, 5→11111, ..."
        const pares = [];
        const partes = corpo.split(/[,;]/).map(p => p.trim());
        for(const p of partes){
          const m = p.match(/^(.+?)\s*(?:→|->|=>|\s+vira\s+|\s+da\s+|\s+gera\s+)\s*(.+?)$/);
          if(m) pares.push({in: m[1].trim(), out: m[2].trim()});
        }
        if(pares.length >= 1){
          const regra = v112_indutor_aprender(pares);
          if(regra){
            const res = v112_indutor_aplicar(regra, consulta);
            if(res !== null){
              let descr_padrao = '';
              if(regra.tipo === 'repeticao') descr_padrao = '"' + regra.char + '" repetido n vezes';
              else if(regra.tipo === 'soma') descr_padrao = 'n + ' + regra.delta;
              else if(regra.tipo === 'multiplicacao') descr_padrao = 'n × ' + regra.fator;
              bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: String(res) + ' (padrão detectado: ' + descr_padrao + ')', indutor: true}};
              LOG.subredes = LOG.subredes || {}; LOG.subredes.B_indutor = {regra, entrada: consulta, saida: res};
            }
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.4 — B_SIMULADOR: "simule: vela 60min, taxa 1, 2 lados"
    // Ou: "simule vela 100 2 lados"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      const mat_sim = txt_orig.match(/^(?:simule|simular)\s*[:]?\s*vela\s+(\d+)(?:\s*min)?(?:\s*,?\s*taxa\s+(\d+(?:\.\d+)?))?\s*,?\s*(\d+)?\s*lados?\s*\??\s*$/);
      if(mat_sim){
        const comprimento = parseInt(mat_sim[1]);
        const taxa = mat_sim[2] ? parseFloat(mat_sim[2]) : 1;
        const lados = mat_sim[3] ? parseInt(mat_sim[3]) : 1;
        const r = v112_simular_vela(comprimento, taxa, lados);
        const resp = 'vela queima em ' + r.ticks + ' ticks (comprimento=' + comprimento + ', taxa=' + taxa + ', lados=' + lados + ')';
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp, simulador: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_simulador = {ticks: r.ticks, comprimento, taxa, lados};
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.4 — B_CAUSAL: indexar "X causa Y" / consultar "o que X causa"
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      // Indexar: "X causa Y"
      const mat_idx_c = txt_orig.match(/^(\S+)\s+(?:causa|provoca|gera)\s+(\S+)[\?\.\!]?$/);
      if(mat_idx_c){
        v112_causal_indexar(mat_idx_c[1], mat_idx_c[2]);
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: 'aprendido: '+mat_idx_c[1]+' causa '+mat_idx_c[2], causal_indexar: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_causal = {indexou: [mat_idx_c[1], mat_idx_c[2]]};
      }
      // Consultar: "o que X causa" / "consequência de X"
      else {
        const mat_q_c = txt_orig.match(/^(?:o que|que|quais)\s+(\S+)\s+(?:causa|provoca|gera)\s*\??$/);
        const mat_q_c2 = txt_orig.match(/^(?:consequ[êe]ncia(?:s)? de|efeito(?:s)? de)\s+(\S+)\s*\??$/);
        const palavra_q = mat_q_c ? mat_q_c[1] : (mat_q_c2 ? mat_q_c2[1] : null);
        if(palavra_q){
          const efeitos = v112_causal_consultar(palavra_q);
          if(efeitos.length > 0){
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: palavra_q + ' causa: ' + efeitos.join(', '), causal_consultar: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_causal = {consulta: palavra_q, efeitos};
          } else {
            // LAB 13.10: pode ser auto-ciclo X→X — verifica
            const sr_c = V112.subredes.B_causal;
            if(sr_c){
              const cc = v112_node_by_id(sr_c.id);
              if(cc && cc._causa_de && cc._causa_de[palavra_q]){
                const set = cc._causa_de[palavra_q];
                if(set && set.has && set.has(palavra_q)){
                  bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: palavra_q + ' causa: ' + palavra_q + ' (auto-ciclo detectado)', causal_autociclo: true}};
                  LOG.subredes = LOG.subredes || {}; LOG.subredes.B_causal = {auto_ciclo: palavra_q};
                }
              }
            }
          }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.4 — B_COMPOSITOR: "X e Y" → combina efeitos de X e Y
    // Ex: "chove e gelo" → "molha, escorrega" (efeitos compostos)
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase().replace(/[\?\.\!]+$/, '').trim();
      // Detecta "X e Y" / "X + Y" no input (composição de antecedentes)
      const partes_e = txt_orig.split(/\s+(?:e|\+|junto com)\s+/);
      if(partes_e.length >= 2 && partes_e.length <= 4 && partes_e.every(p => p.length > 0 && p.length < 20 && !/\s/.test(p))){
        const r = v112_compor_regras(partes_e);
        if(r.efeitos.length > 0){
          // LAB 13.8 — Detecta conflito entre os efeitos
          const conflitos = v112_detectar_conflito(r.efeitos);
          let resposta = partes_e.join(' + ') + ' → ' + r.efeitos.join(', ');
          if(conflitos.length > 0){
            const desc_conf = conflitos.map(c => 'conflito ' + c.categoria + ' (' + c.a + ' vs ' + c.b + ')').join(', ');
            resposta = resposta + ' | ⚠ ' + desc_conf;
          }
          bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resposta, compositor: true, conflitos}};
          LOG.subredes = LOG.subredes || {}; LOG.subredes.B_compositor = {antecedentes: partes_e, efeitos: r.efeitos};
          if(conflitos.length > 0){ LOG.subredes.B_conflito = {conflitos}; }
        }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.3 — B_SOLVER: detecta puzzle Einstein no input
    // ═════════════════════════════════════════════════════════════
    if(!bidir_resultado){
      const txt_orig = String(input || '').toLowerCase();
      // Detecta "resolva:" ou "puzzle:" no início
      if(/^(resolva|puzzle|solve)\s*[:=]/.test(txt_orig)){
        // Parser simples: extrai cláusulas separadas por vírgula/ponto-vírgula
        // "resolva: ana mora azul, bruno mora verde, quem mora azul tem gato"
        try {
          const corpo = txt_orig.replace(/^(resolva|puzzle|solve)\s*[:=]\s*/, '');
          const partes = corpo.split(/[,;]/).map(p => p.trim()).filter(p => p);
          // Tenta inferir vars/atribs/dominios a partir das partes
          const facts = [];
          for(const p of partes){
            const toks_p = p.split(/\s+/).filter(t => t);
            if(toks_p.length >= 3){
              // {var: toks_p[0], atrib: 'algo', val: toks_p[2]}
              // Tenta detectar atributo (mora, tem, gosta)
              const verbos_atrib = ['mora','tem','gosta','usa','bebe','come','é','eh','=','possui'];
              let idx_v = -1;
              for(let i = 1; i < toks_p.length - 1; i++){
                if(verbos_atrib.includes(toks_p[i])){ idx_v = i; break; }
              }
              if(idx_v > 0){
                facts.push({var_: toks_p[0], atrib: toks_p[idx_v], val: toks_p[idx_v + 1]});
              }
            }
          }
          if(facts.length >= 2){
            // Constrói spec
            const vars_set = new Set(), atribs_set = new Set(), dom = {};
            for(const f of facts){
              vars_set.add(f.var_);
              atribs_set.add(f.atrib);
              if(!dom[f.atrib]) dom[f.atrib] = new Set();
              dom[f.atrib].add(f.val);
            }
            const spec = {
              vars: Array.from(vars_set),
              atribs: Array.from(atribs_set),
              dominios: Object.fromEntries(Object.entries(dom).map(([k,v]) => [k, Array.from(v)])),
              restricoes: facts.map(f => ({var: f.var_, atrib: f.atrib, val: f.val}))
            };
            const r = v112_solver_einstein(spec);
            const sr_solver = V112.subredes.B_solver;
            if(sr_solver){
              const c = v112_node_by_id(sr_solver.id);
              if(c){
                c.acumulador = Math.min(200, c.acumulador + 50);
                c._ativacoes = (c._ativacoes||0)+1;
                if(r.ok) c._sucessos = (c._sucessos||0)+1;
                if(!c._historico) c._historico = [];
                c._historico.push({spec, resultado: r, turn: V112.turn});
              }
            }
            let resp_solver;
            if(r.ok){
              const linhas = [];
              for(const v of spec.vars){
                const ats = Object.entries(r.solucao[v]).map(([a,vv]) => a+'='+vv).join(', ');
                linhas.push(v+': '+ats);
              }
              resp_solver = 'solução: ' + linhas.join(' | ');
            } else {
              resp_solver = 'sem solução (restrições incompatíveis)';
            }
            bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp_solver, solver: true}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_solver = {ok: r.ok, spec};
          }
        } catch(e){ /* ignora se parser falhou */ }
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // LAB 13.1 — B_excecoes ANTES de B_bidir (pra "5 / 0" não virar bidir)
    // ═════════════════════════════════════════════════════════════
    {
      const txt_orig = String(input || '').toLowerCase();
      let resp_exc_pre = null;
      if(/\/\s*0(\D|$)/.test(txt_orig) || /dividir.*por\s*0/.test(txt_orig) || /\/\s*zero/.test(txt_orig)){
        resp_exc_pre = 'indefinido (divisão por zero é impossível)';
      }
      else if(/raiz.*(-\d|negativ)/.test(txt_orig) || /√\s*-/.test(txt_orig)){
        resp_exc_pre = 'número imaginário (raiz de negativo não tem solução real)';
      }
      else if(/log\s*\(?\s*0/.test(txt_orig) || /log.*negativ/.test(txt_orig)){
        resp_exc_pre = 'indefinido (log de zero ou negativo)';
      }
      else {
        // LAB 13.1 — VM ARITMÉTICA: precedência, parênteses, expressões compostas
        // Padrão: tem dígitos + operadores aritméticos (com ou sem parênteses)
        const tem_expressao = /[\d]/.test(txt_orig) && /[+\-*\/×÷]/.test(txt_orig);
        if(tem_expressao){
          // Tira coisas que atrapalham
          let expr = txt_orig
            .replace(/['"\?\!]/g, '')
            .replace(/é\s*=|=\s*é|igual a|igual/g, '=')
            .replace(/quanto\s+é|quanto\s+vale|calcula|calcular/g, '')
            .replace(/×/g, '*').replace(/÷/g, '/')
            .trim();
          // Se tem "=" no meio, isola a parte ANTES (a pergunta) ou DEPOIS (resposta a checar)
          if(expr.indexOf('=') >= 0){
            // ignora — é uma afirmação, deixa indexar
          } else {
            // LAB 13.3 — Aceita expressões só com dígitos/operadores/parênteses (sem ponto decimal por enquanto, usa BigInt)
            if(/^[\d\s\+\-\*\/\(\)\.\^]+$/.test(expr)){
              try {
                // Detecta se TEM ponto decimal (precisa Number) ou só inteiros (usa BigInt)
                const usa_bigint = !expr.includes('.');
                // Substitui ^ por **
                expr = expr.replace(/\^/g, '**');
                // Shunting-yard: tokeniza
                const toks_e = [];
                let i = 0;
                while(i < expr.length){
                  const ch = expr[i];
                  if(ch === ' '){ i++; continue; }
                  if(/[\d\.]/.test(ch)){
                    let num = '';
                    while(i < expr.length && /[\d\.]/.test(expr[i])){ num += expr[i++]; }
                    toks_e.push({tipo:'num', val: usa_bigint ? BigInt(num) : parseFloat(num)});
                  } else if(ch === '*' && expr[i+1] === '*'){
                    // potência **
                    toks_e.push({tipo:'op', val:'**'});
                    i += 2;
                  } else if('+-*/()'.includes(ch)){
                    if(ch === '-' && (toks_e.length === 0 || toks_e[toks_e.length-1].tipo === 'op' || toks_e[toks_e.length-1].val === '(')){
                      let num = '-';
                      i++;
                      while(i < expr.length && expr[i] === ' ') i++;
                      while(i < expr.length && /[\d\.]/.test(expr[i])){ num += expr[i++]; }
                      if(num.length > 1){
                        toks_e.push({tipo:'num', val: usa_bigint ? BigInt(num) : parseFloat(num)});
                      }
                      else toks_e.push({tipo:'op', val:'-'});
                    } else {
                      toks_e.push({tipo: ch === '(' || ch === ')' ? 'paren' : 'op', val: ch});
                      i++;
                    }
                  } else { i++; }
                }
                // Shunting-yard → RPN
                const prec = {'+':1,'-':1,'*':2,'/':2,'**':3};
                const direita = {'**':true};  // ** é associativo à direita
                const out = [], st = [];
                for(const t of toks_e){
                  if(t.tipo === 'num') out.push(t);
                  else if(t.tipo === 'op'){
                    while(st.length > 0 && st[st.length-1].tipo === 'op' && 
                          (direita[t.val] ? prec[st[st.length-1].val] > prec[t.val] : prec[st[st.length-1].val] >= prec[t.val])){
                      out.push(st.pop());
                    }
                    st.push(t);
                  }
                  else if(t.val === '(') st.push(t);
                  else if(t.val === ')'){
                    while(st.length > 0 && st[st.length-1].val !== '('){ out.push(st.pop()); }
                    st.pop();
                  }
                }
                while(st.length > 0) out.push(st.pop());
                // Avalia RPN
                const pilha = [];
                const ZERO = usa_bigint ? 0n : 0;
                for(const t of out){
                  if(t.tipo === 'num') pilha.push(t.val);
                  else {
                    const b = pilha.pop(), a = pilha.pop();
                    if(t.val === '+') pilha.push(a + b);
                    else if(t.val === '-') pilha.push(a - b);
                    else if(t.val === '*') pilha.push(a * b);
                    else if(t.val === '**'){
                      // potência
                      if(usa_bigint){
                        if(b < 0n){ resp_exc_pre = 'expoente negativo (precisaria decimal)'; break; }
                        let r = 1n; let bn = b;
                        while(bn > 0n){ r *= a; bn--; }
                        pilha.push(r);
                      } else pilha.push(Math.pow(a, b));
                    }
                    else if(t.val === '/'){
                      if(b === ZERO || b === 0 || b === 0n){ resp_exc_pre = 'indefinido (divisão por zero é impossível)'; break; }
                      if(usa_bigint){
                        if(a % b === 0n) pilha.push(a / b);
                        else {
                          const aN = Number(a), bN = Number(b);
                          pilha.push(aN / bN);
                        }
                      } else {
                        pilha.push(a / b);
                      }
                    }
                  }
                }
                if(!resp_exc_pre && pilha.length === 1){
                  const res = pilha[0];
                  if(typeof res === 'bigint') resp_exc_pre = res.toString();
                  else resp_exc_pre = (Number.isInteger(res) ? String(res) : res.toFixed(8).replace(/\.?0+$/,''));
                }
              } catch(e){ /* não é expressão válida — ignora */ }
            }
          }
        }
      }
      if(resp_exc_pre && !bidir_resultado){
        const sr_exc = V112.subredes.B_excecoes;
        if(sr_exc){
          const c = v112_node_by_id(sr_exc.id);
          if(c){
            c.acumulador = Math.min(200, c.acumulador + 50);
            c._ativacoes = (c._ativacoes||0)+1;
            c._sucessos = (c._sucessos||0)+1;
          }
        }
        bidir_resultado = {tratou: true, conhecia: true, dados: {resposta_direta: resp_exc_pre, aritmetica_vm: true}};
        LOG.subredes = LOG.subredes || {}; LOG.subredes.B_excecoes = {detectou: resp_exc_pre, vm: true};
      }
    }
    
    // CONSULTA: input curto E é uma categoria conhecida → B_bidir RESPONDE
    if(tokens.length <= 3){
      const palavra_chave = tokens.find(t => 
        v112_node_by_text(t) && !['?',',','.'].includes(t) &&
        !['qual','quem','o'].includes(t));
      if(palavra_chave){
        // LAB 12.6 — B_paradoxo ANTES de qualquer resposta: detecta ciclo curto
        const sr_log_inicial = V112.subredes.B_logico;
        if(sr_log_inicial){
          const cl = v112_node_by_id(sr_log_inicial.id);
          if(cl && cl._cadeia){
            const vis_p = new Set([palavra_chave]);
            let fp = [palavra_chave]; let ciclou_em = 0;
            for(let nv=0; nv<5; nv++){
              const prox_p = [];
              for(const x of fp){
                const d = cl._cadeia[x];
                if(!d) continue;
                for(const y of d){
                  if(y === palavra_chave){ ciclou_em = nv+1; break; }
                  if(!vis_p.has(y)){ vis_p.add(y); prox_p.push(y); }
                }
                if(ciclou_em > 0) break;
              }
              if(ciclou_em > 0 || prox_p.length === 0) break;
              fp = prox_p;
            }
            if(ciclou_em > 0 && ciclou_em <= 3){
              const sr_par = V112.subredes.B_paradoxo;
              if(sr_par){
                const cp = v112_node_by_id(sr_par.id);
                if(cp){
                  cp.acumulador = Math.min(200, cp.acumulador + 50);
                  cp._ativacoes = (cp._ativacoes||0)+1;
                  cp._sucessos = (cp._sucessos||0)+1;
                }
              }
              bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, resposta_direta: 'indecidível (paradoxo de auto-referência, ciclou em '+ciclou_em+' passos)'}};
              LOG.subredes = LOG.subredes || {};
              LOG.subredes.B_paradoxo = {ciclou_em: ciclou_em};
            }
          }
        }
        // Se B_paradoxo NÃO pegou, continua com B_bidir normal:
        if(!bidir_resultado){
        // LAB 13.1 — B_temporal ANTES de B_bidir (pra "maria" não cair em cache lixo)
        // LAB 13.3 — Só se palavra NÃO é categoria (cat→inst direta sempre vence)
        //            Se for inst mas temporal tem cadeia LONGA (>=2), temporal vence
        //            (caso: "gato é animal" + "gato menor_que cachorro menor_que cavalo")
        const eh_cat_padrao = central_bidir._cache_instancias[palavra_chave] && central_bidir._cache_instancias[palavra_chave].size > 0;
        const eh_inst_conhecida = central_bidir._categorias_por_instancia[palavra_chave] && central_bidir._categorias_por_instancia[palavra_chave].size > 0;
        const sr_tmp_pre = V112.subredes.B_temporal;
        let temporal_tem_cadeia_longa = false;
        if(sr_tmp_pre){
          const c_pre = v112_node_by_id(sr_tmp_pre.id);
          if(c_pre && c_pre._antes_de && c_pre._antes_de[palavra_chave]){
            // Conta profundidade transitiva
            const vis = new Set([palavra_chave]);
            let frente = [palavra_chave]; let depth = 0;
            while(frente.length && depth < 4){
              const prox = [];
              for(const x of frente){
                const set = c_pre._antes_de[x];
                if(!set) continue;
                for(const y of set){ if(!vis.has(y)){ vis.add(y); prox.push(y); } }
              }
              if(!prox.length) break;
              frente = prox; depth++;
            }
            if(depth >= 3) temporal_tem_cadeia_longa = true;
          }
        }
        // Roda B_temporal se: não é cat E (não é inst OU temporal tem cadeia longa)
        if(!eh_cat_padrao && (!eh_inst_conhecida || temporal_tem_cadeia_longa) && sr_tmp_pre){
          const c_tmp = v112_node_by_id(sr_tmp_pre.id);
          if(c_tmp && c_tmp._antes_de && c_tmp._antes_de[palavra_chave]){
            const depois = new Set();
            function exp_t(x, vis){
              if(vis.has(x)) return;
              vis.add(x);
              const set = c_tmp._antes_de[x];
              if(!set) return;
              for(const y of set){ depois.add(y); exp_t(y, vis); }
            }
            exp_t(palavra_chave, new Set());
            if(depois.size > 0){
              c_tmp.acumulador = Math.min(200, c_tmp.acumulador + 50);
              c_tmp._ativacoes = (c_tmp._ativacoes||0)+1;
              c_tmp._sucessos = (c_tmp._sucessos||0)+1;
              bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: Array.from(depois), temporal: true}};
              LOG.subredes = LOG.subredes || {}; LOG.subredes.B_temporal = {antes_de: Array.from(depois)};
            }
          }
        }
        
        // É CATEGORIA conhecida?
        if(!bidir_resultado && central_bidir._cache_instancias[palavra_chave] && central_bidir._cache_instancias[palavra_chave].size > 0){
          const insts = Array.from(central_bidir._cache_instancias[palavra_chave]).slice(0, 4);
          central_bidir.acumulador = Math.min(200, central_bidir.acumulador + 50);
          central_bidir._ativacoes = (central_bidir._ativacoes || 0) + 1;
          central_bidir._sucessos = (central_bidir._sucessos || 0) + 1;
          bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: insts}};
          LOG.subredes = LOG.subredes || {};
          LOG.subredes.B_bidir = {acao: 'top_down_cache', categoria: palavra_chave, instancias: insts};
        }
        // É INSTÂNCIA conhecida com MULTI-CATEGORIA?
        else if(central_bidir._categorias_por_instancia[palavra_chave] && central_bidir._categorias_por_instancia[palavra_chave].size > 1){
          const cats = Array.from(central_bidir._categorias_por_instancia[palavra_chave]);
          central_bidir.acumulador = Math.min(200, central_bidir.acumulador + 50);
          central_bidir._ativacoes = (central_bidir._ativacoes || 0) + 1;
          central_bidir._sucessos = (central_bidir._sucessos || 0) + 1;
          bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: cats, multi_cat: true}};
          LOG.subredes = LOG.subredes || {};
          LOG.subredes.B_bidir = {acao: 'multi_cat', instancia: palavra_chave, categorias: cats};
        }
        // É INSTÂNCIA SINGLE-CAT — B_bidir não trata direto, mas B_logico pode dar CADEIA
        // LAB 13.3: SOMENTE se B_temporal não pegou ainda
        else if(!bidir_resultado && central_bidir._categorias_por_instancia[palavra_chave] && central_bidir._categorias_por_instancia[palavra_chave].size === 1){
          const sr_log = V112.subredes.B_logico;
          if(sr_log){
            const central_log = v112_node_by_id(sr_log.id);
            if(central_log && central_log._cadeia){
              // LAB 12.6 — Detecta paradoxo ANTES de fazer BFS normal
              // Se cadeia volta pro próprio nó em poucos passos = paradoxo
              const vis_p = new Set([palavra_chave]);
              let fp = [palavra_chave]; let ciclou_em = 0;
              for(let nv=0; nv<5; nv++){
                const prox_p = [];
                for(const x of fp){
                  const d = central_log._cadeia[x];
                  if(!d) continue;
                  for(const y of d){
                    if(y === palavra_chave){ ciclou_em = nv+1; break; }
                    if(!vis_p.has(y)){ vis_p.add(y); prox_p.push(y); }
                  }
                  if(ciclou_em > 0) break;
                }
                if(ciclou_em > 0 || prox_p.length === 0) break;
                fp = prox_p;
              }
              if(ciclou_em > 0 && ciclou_em <= 3){
                const sr_par = V112.subredes.B_paradoxo;
                if(sr_par){
                  const cp = v112_node_by_id(sr_par.id);
                  if(cp){
                    cp.acumulador = Math.min(200, cp.acumulador + 50);
                    cp._ativacoes = (cp._ativacoes||0)+1;
                    cp._sucessos = (cp._sucessos||0)+1;
                  }
                }
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, resposta_direta: 'indecidível (paradoxo de auto-referência, ciclou em '+ciclou_em+' passos)'}};
                LOG.subredes = LOG.subredes || {};
                LOG.subredes.B_paradoxo = {ciclou_em: ciclou_em};
              }
              else {
              // BFS pela cadeia a partir de palavra_chave — respeitando NEGAÇÕES
              // Se palavra_chave tem negação transitiva pra X, BFS não atravessa X
              const negados = central_log._negacoes_transitivas?.[palavra_chave] || new Set();
              const cadeia = [];
              const visitados = new Set([palavra_chave]);
              let atual = palavra_chave;
              let passo = 0;
              let bloqueio_negacao = null;
              while(atual && passo < 6){
                const proximas = central_log._cadeia[atual];
                if(!proximas || proximas.size === 0) break;
                const prox = Array.from(proximas).find(p => !visitados.has(p));
                if(!prox) break;
                // Se o próximo é um item NEGADO da origem → bloqueia
                if(negados.has(prox)){
                  bloqueio_negacao = prox;
                  break;
                }
                cadeia.push(prox);
                visitados.add(prox);
                atual = prox;
                passo++;
              }
              if(cadeia.length >= 1){
                central_log.acumulador = Math.min(200, central_log.acumulador + 40);
                central_log._ativacoes = (central_log._ativacoes || 0) + 1;
                central_log._sucessos = (central_log._sucessos || 0) + 1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: cadeia, cadeia: true, bloqueio_negacao}};
                LOG.subredes = LOG.subredes || {};
                LOG.subredes.B_logico = {acao: 'cadeia_logica', origem: palavra_chave, cadeia: cadeia, bloqueio_negacao};
              } else if(bloqueio_negacao){
                // Apenas o próximo seria negado — B_contra retorna a cadeia parcial vazia mas marca
                LOG.subredes = LOG.subredes || {};
                LOG.subredes.B_logico = {acao: 'bloqueio_negacao', origem: palavra_chave, bloqueado_em: bloqueio_negacao};
              }
              }  // fim else (não ciclou)
            }
          }
        }
        }  // fim if(!bidir_resultado) do paradoxo precoce
        
        // ─── LAB 12.6: B_logico responde MESMO sem B_bidir ───
        // Se palavra_chave tem cadeia indexada mas não é instância/categoria conhecida em B_bidir
        if(!bidir_resultado){
          const sr_log_b = V112.subredes.B_logico;
          if(sr_log_b){
            const cl = v112_node_by_id(sr_log_b.id);
            if(cl && cl._cadeia && cl._cadeia[palavra_chave] && cl._cadeia[palavra_chave].size > 0){
              // LAB 13.1 — Antes de fazer multi_propriedade, checa se B_salto tem
              // candidatos REAIS (objetos compartilhando traits, não os traits em si)
              let salto_tem_candidatos = false;
              const sr_salto_pre = V112.subredes.B_salto;
              if(sr_salto_pre){
                const cs = v112_node_by_id(sr_salto_pre.id);
                if(cs && cs._objeto_para_traits && cs._objeto_para_traits[palavra_chave]){
                  const traits = cs._objeto_para_traits[palavra_chave];
                  for(const t of traits){
                    const objs = cs._trait_para_objetos[t];
                    if(objs){
                      for(const o of objs){
                        if(o !== palavra_chave){ salto_tem_candidatos = true; break; }
                      }
                    }
                    if(salto_tem_candidatos) break;
                  }
                }
              }
              // Se B_salto tem candidatos, deixa B_salto responder (sai daqui sem setar bidir_resultado)
              if(salto_tem_candidatos){
                // não faz nada — B_salto pega depois
              } else {
              const negados = cl._negacoes_transitivas?.[palavra_chave] || new Set();
              // LAB 12.6 — Se tem MÚLTIPLOS destinos diretos, retorna TODOS (Einstein)
              const destinos_diretos = Array.from(cl._cadeia[palavra_chave]).filter(d => !negados.has(d));
              if(destinos_diretos.length >= 2){
                // Multi-propriedade — Einstein style
                cl.acumulador = Math.min(200, cl.acumulador + 40);
                cl._ativacoes = (cl._ativacoes||0)+1;
                cl._sucessos = (cl._sucessos||0)+1;
                const todos = new Set(destinos_diretos);
                for(const d of destinos_diretos){
                  if(cl._cadeia[d]){
                    for(const dd of cl._cadeia[d]) todos.add(dd);
                  }
                }
                const lista = Array.from(todos).slice(0, 5);
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: lista, cadeia: true}};
                LOG.subredes = LOG.subredes || {};
                LOG.subredes.B_logico = {acao: 'multi_propriedade', origem: palavra_chave, lista};
              } else {
                // Cadeia linear normal
                const cadeia = [];
                const visitados = new Set([palavra_chave]);
                let atual = palavra_chave; let passo = 0;
                while(atual && passo < 6){
                  const proximas = cl._cadeia[atual];
                  if(!proximas || proximas.size === 0) break;
                  const prox = Array.from(proximas).find(p => !visitados.has(p));
                  if(!prox) break;
                  if(negados.has(prox)) break;
                  cadeia.push(prox);
                  visitados.add(prox);
                  atual = prox;
                  passo++;
                }
                if(cadeia.length > 0){
                  cl.acumulador = Math.min(200, cl.acumulador + 40);
                  cl._ativacoes = (cl._ativacoes||0)+1;
                  cl._sucessos = (cl._sucessos||0)+1;
                  bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: cadeia, cadeia: true}};
                  LOG.subredes = LOG.subredes || {};
                  LOG.subredes.B_logico = {acao: 'cadeia_fallback', origem: palavra_chave, cadeia};
                }
              }
              }  // fim else (salto não tem candidatos)
            }
          }
        }
        
        // B_salto: ANTES do silêncio absoluto, tenta salto por traits compartilhados
        if(!bidir_resultado){
          const sr_salto = V112.subredes.B_salto;
          if(sr_salto){
            const central_salto = v112_node_by_id(sr_salto.id);
            if(central_salto && central_salto._objeto_para_traits && central_salto._objeto_para_traits[palavra_chave]){
              // Pega traits da palavra perguntada
              const traits_da_palavra = central_salto._objeto_para_traits[palavra_chave];
              // Pra cada trait, acha outros objetos que têm o mesmo trait (direto)
              const candidatos = {};
              for(const trait of traits_da_palavra){
                const objetos_com_trait = central_salto._trait_para_objetos[trait];
                if(!objetos_com_trait) continue;
                for(const obj of objetos_com_trait){
                  if(obj === palavra_chave) continue;
                  candidatos[obj] = (candidatos[obj] || 0) + 1;
                }
              }
              // Salto TRANSITIVO de 2 níveis: se trait_X é ele mesmo um objeto com traits, propaga
              // Ex: bianca tem espinha; espinha tem padrao_irregular+gosma; esponja_do_mar tem padrao+gosma
              for(const trait of traits_da_palavra){
                // trait pode ser ele mesmo um objeto com sub-traits?
                if(central_salto._objeto_para_traits[trait]){
                  const subtrait_set = central_salto._objeto_para_traits[trait];
                  for(const subtrait of subtrait_set){
                    const objetos_com_subtrait = central_salto._trait_para_objetos[subtrait];
                    if(!objetos_com_subtrait) continue;
                    for(const obj of objetos_com_subtrait){
                      if(obj === palavra_chave || obj === trait) continue;
                      // Peso 0.5 pra salto transitivo (mais fraco)
                      candidatos[obj] = (candidatos[obj] || 0) + 0.5;
                    }
                  }
                }
              }
              const ordenados = Object.entries(candidatos).sort((a,b) => b[1]-a[1]);
              if(ordenados.length > 0){
                const top = ordenados.slice(0, 3).map(x => x[0]);
                central_salto.acumulador = Math.min(200, central_salto.acumulador + 50);
                central_salto._ativacoes = (central_salto._ativacoes || 0) + 1;
                central_salto._sucessos = (central_salto._sucessos || 0) + 1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: top, salto: true, traits_compartilhados: Array.from(traits_da_palavra)}};
                LOG.subredes = LOG.subredes || {};
                LOG.subredes.B_salto = {acao: 'salto_por_traits', origem: palavra_chave, destinos: top, traits: Array.from(traits_da_palavra)};
              }
              // LAB 12.6 — Se não tem candidatos por similaridade, retorna os PRÓPRIOS traits
              else {
                const traits_arr = Array.from(traits_da_palavra);
                // Tenta COMBINAR com B_logico cadeia (Einstein: ana tem gato + ana mora casa)
                const cl = v112_node_by_id(V112.subredes.B_logico.id);
                let extras = [];
                if(cl && cl._cadeia && cl._cadeia[palavra_chave]){
                  extras = Array.from(cl._cadeia[palavra_chave]);
                }
                const combinado = [...new Set([...traits_arr, ...extras])].slice(0, 4);
                if(combinado.length > 0){
                  central_salto.acumulador = Math.min(200, central_salto.acumulador + 30);
                  central_salto._ativacoes = (central_salto._ativacoes || 0) + 1;
                  bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: combinado, propriedades: true}};
                  LOG.subredes = LOG.subredes || {};
                  LOG.subredes.B_salto = {acao: 'propriedades_diretas', traits: traits_arr, extras};
                }
              }
            }
          }
        }
        // ═════════════════════════════════════════════════════════════
        // SUB-REDES LÓGICAS LAB 12.6 — entre B_salto e B_silencio
        // ═════════════════════════════════════════════════════════════
        
        // ─── B_excecoes: divisão por zero, raiz de negativo + ARITMÉTICA OPERACIONAL ───
        if(!bidir_resultado){
          const txt_orig = String(input || '').toLowerCase();
          let resp_exc = null;
          // 5 / 0, 5/0, etc
          if(/\/\s*0(\D|$)/.test(txt_orig) || /dividir.*por\s*0/.test(txt_orig) || /\/\s*zero/.test(txt_orig)){
            resp_exc = 'indefinido (divisão por zero é impossível)';
          }
          // raiz de negativo
          else if(/raiz.*(-\d|negativ)/.test(txt_orig) || /√\s*-/.test(txt_orig)){
            resp_exc = 'número imaginário (raiz de negativo não tem solução real)';
          }
          // log(0) ou log(negativo)
          else if(/log\s*\(?\s*0/.test(txt_orig) || /log.*negativ/.test(txt_orig)){
            resp_exc = 'indefinido (log de zero ou negativo)';
          }
          // LAB 12.6 — ARITMÉTICA: detecta padrão "N OP M" sem "=" (pergunta)
          else {
            const mat = txt_orig.match(/^(-?\d+(?:\.\d+)?)\s*([+\-*\/×÷])\s*(-?\d+(?:\.\d+)?)\s*\??\s*$/);
            if(mat){
              const a = parseFloat(mat[1]);
              const op = mat[2];
              const b = parseFloat(mat[3]);
              let res;
              if(op === '+') res = a + b;
              else if(op === '-') res = a - b;
              else if(op === '*' || op === '×') res = a * b;
              else if(op === '/' || op === '÷'){
                if(b === 0) resp_exc = 'indefinido (divisão por zero é impossível)';
                else res = a / b;
              }
              if(resp_exc === null && res !== undefined){
                // Formata inteiro ou decimal
                resp_exc = (Number.isInteger(res) ? String(res) : res.toFixed(4).replace(/\.?0+$/,''));
              }
            }
          }
          if(resp_exc){
            const sr_exc = V112.subredes.B_excecoes;
            if(sr_exc){
              const c = v112_node_by_id(sr_exc.id);
              if(c){
                c.acumulador = Math.min(200, c.acumulador + 50);
                c._ativacoes = (c._ativacoes||0)+1;
                c._sucessos = (c._sucessos||0)+1;
              }
            }
            bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, resposta_direta: resp_exc}};
            LOG.subredes = LOG.subredes || {}; LOG.subredes.B_excecoes = {detectou: resp_exc};
          }
        }
        
        // ─── B_paradoxo: auto-referência indecidível ───
        if(!bidir_resultado){
          // Se cadeia da palavra forma ciclo passando pelo próprio nó
          const sr_log_p = V112.subredes.B_logico;
          if(sr_log_p && palavra_chave){
            const cl = v112_node_by_id(sr_log_p.id);
            if(cl && cl._cadeia){
              const visitados = new Set([palavra_chave]);
              let frente = [palavra_chave];
              let ciclou = false; let prof_ciclo = 0;
              for(let nv=0; nv<5 && frente.length>0; nv++){
                const prox = [];
                for(const x of frente){
                  const d = cl._cadeia[x];
                  if(!d) continue;
                  for(const y of d){
                    if(y === palavra_chave){ ciclou = true; prof_ciclo = nv+1; break; }
                    if(!visitados.has(y)){ visitados.add(y); prox.push(y); }
                  }
                  if(ciclou) break;
                }
                if(ciclou) break;
                frente = prox;
              }
              if(ciclou && prof_ciclo <= 3){
                const sr_par = V112.subredes.B_paradoxo;
                if(sr_par){
                  const c = v112_node_by_id(sr_par.id);
                  if(c){
                    c.acumulador = Math.min(200, c.acumulador + 50);
                    c._ativacoes = (c._ativacoes||0)+1;
                    c._sucessos = (c._sucessos||0)+1;
                  }
                }
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, resposta_direta: 'indecidível (paradoxo de auto-referência, ciclou em '+prof_ciclo+' passos)'}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_paradoxo = {ciclou_em: prof_ciclo};
              }
            }
          }
        }
        
        // ─── B_silogismo: modus ponens / modus tollens ───
        if(!bidir_resultado){
          // Procura padrões "se X então Y" indexados como _condicionais
          const sr_sil = V112.subredes.B_silogismo;
          if(sr_sil){
            const c = v112_node_by_id(sr_sil.id);
            if(c && c._condicionais && c._condicionais[palavra_chave]){
              // Tem regra "se palavra_chave então Z"
              const consequentes = Array.from(c._condicionais[palavra_chave]);
              if(consequentes.length > 0){
                c.acumulador = Math.min(200, c.acumulador + 50);
                c._ativacoes = (c._ativacoes||0)+1;
                c._sucessos = (c._sucessos||0)+1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: consequentes, silogismo: true}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_silogismo = {modus_ponens: true, consequentes};
              }
            }
            // Modus tollens: se consequente é NEGADO, antecedente é falso
            if(!bidir_resultado && c && c._consequente_para_antecedente && c._consequente_para_antecedente[palavra_chave]){
              const ants = Array.from(c._consequente_para_antecedente[palavra_chave]);
              if(ants.length > 0){
                c.acumulador = Math.min(200, c.acumulador + 50);
                c._ativacoes = (c._ativacoes||0)+1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: ants, silogismo: true}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_silogismo = {modus_tollens: true, antecedentes: ants};
              }
            }
          }
        }
        
        // ─── B_temporal: antes/depois transitivo ───
        if(!bidir_resultado){
          const sr_tmp = V112.subredes.B_temporal;
          if(sr_tmp){
            const c = v112_node_by_id(sr_tmp.id);
            if(c && c._antes_de && c._antes_de[palavra_chave]){
              // palavra_chave veio antes de [...]
              const depois = new Set();
              function expande(x, vis){
                if(vis.has(x)) return;
                vis.add(x);
                const set = c._antes_de[x];
                if(!set) return;
                for(const y of set){ depois.add(y); expande(y, vis); }
              }
              expande(palavra_chave, new Set());
              if(depois.size > 0){
                c.acumulador = Math.min(200, c.acumulador + 50);
                c._ativacoes = (c._ativacoes||0)+1;
                c._sucessos = (c._sucessos||0)+1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: Array.from(depois), temporal: true}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_temporal = {antes_de: Array.from(depois)};
              }
            }
          }
        }
        
        // ─── B_analogia: A:B = C:? ───
        if(!bidir_resultado){
          const sr_an = V112.subredes.B_analogia;
          if(sr_an){
            const c = v112_node_by_id(sr_an.id);
            if(c && c._pares && c._pares[palavra_chave]){
              // palavra_chave é parte de pares conhecidos
              const parceiros = Array.from(c._pares[palavra_chave]);
              if(parceiros.length > 0){
                c.acumulador = Math.min(200, c.acumulador + 50);
                c._ativacoes = (c._ativacoes||0)+1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: parceiros, analogia: true}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_analogia = {parceiros};
              }
            }
          }
        }
        
        // ─── B_quantif: todo/algum/nenhum ───
        if(!bidir_resultado){
          const sr_q = V112.subredes.B_quantif;
          if(sr_q){
            const c = v112_node_by_id(sr_q.id);
            if(c && c._todo && c._todo[palavra_chave]){
              // todo palavra_chave é [...]
              const cats = Array.from(c._todo[palavra_chave]);
              c.acumulador = Math.min(200, c.acumulador + 50);
              c._ativacoes = (c._ativacoes||0)+1;
              c._sucessos = (c._sucessos||0)+1;
              bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: cats, quantif: 'todo'}};
              LOG.subredes = LOG.subredes || {}; LOG.subredes.B_quantif = {todo: cats};
            }
          }
        }
        
        // ═════════════════════════════════════════════════════════════
        // LAB 13 — 8 SUB-REDES NOVAS (PFC + DMN + Atenção)
        // ═════════════════════════════════════════════════════════════
        
        // ─── B_planejamento (PFC): "passo1 leva passo2 leva passo3" → mostra sequência ───
        if(!bidir_resultado){
          const sr = V112.subredes.B_planejamento;
          if(sr){
            const c = v112_node_by_id(sr.id);
            if(c && c._passos && c._passos[palavra_chave]){
              const sequencia = Array.from(c._passos[palavra_chave]);
              if(sequencia.length > 0){
                c.acumulador = Math.min(200, c.acumulador + 40);
                c._ativacoes = (c._ativacoes||0)+1;
                c._sucessos = (c._sucessos||0)+1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, instancias: sequencia, planejamento: true}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_planejamento = {sequencia};
              }
            }
          }
        }
        
        // ─── B_identidade (DMN): "quem sou eu / quem é nerael" → combina DNA ───
        if(!bidir_resultado){
          const txt_orig = String(input || '').toLowerCase();
          const eh_pergunta_id = /(quem|qual).*(sou|é).*(eu|você|nerael|nereal)/.test(txt_orig) || 
                                  /quem.*(sou|é) (eu|você)/.test(txt_orig);
          if(eh_pergunta_id){
            const sr = V112.subredes.B_identidade;
            if(sr){
              const c = v112_node_by_id(sr.id);
              if(c){
                // Combina DNA do Self-Core em uma string
                const sc = V112.self_core;
                const partes = [];
                if(sc.nome && sc.nome.length > 0) partes.push('sou '+sc.nome[0]);
                if(sc.sou && sc.sou.length > 0) partes.push(sc.sou.join(', '));
                if(sc.criador && sc.criador.length > 0) partes.push('criado por '+sc.criador.join('/'));
                const identidade = partes.join(', ') || 'identidade não definida';
                c.acumulador = Math.min(200, c.acumulador + 50);
                c._ativacoes = (c._ativacoes||0)+1;
                c._sucessos = (c._sucessos||0)+1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, resposta_direta: identidade, identidade: true}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_identidade = {identidade};
              }
            }
          }
        }
        
        // ─── B_simulacao (DMN): "se X acontecesse / se X fosse" → hipotético sem persistir ───
        if(!bidir_resultado){
          const txt_orig = String(input || '').toLowerCase();
          const eh_hipotetico = /^se .{0,80}(acontecesse|fosse|ocorresse|tivesse|estivesse|aconteceria|seria)/.test(txt_orig);
          if(eh_hipotetico){
            const sr = V112.subredes.B_simulacao;
            if(sr){
              const c = v112_node_by_id(sr.id);
              if(c){
                c.acumulador = Math.min(200, c.acumulador + 40);
                c._ativacoes = (c._ativacoes||0)+1;
                c._sucessos = (c._sucessos||0)+1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, resposta_direta: 'hipotético: simulando cenário sem afetar memória', simulacao: true}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_simulacao = {hipotetico: true};
              }
            }
          }
        }
        
        // ─── B_autobiografia (DMN): "lembra quando / o que aconteceu" → recupera eventos ───
        if(!bidir_resultado){
          const txt_orig = String(input || '').toLowerCase();
          const eh_pergunta_evento = /(lembra|o que|quando).*(aconteceu|disse|falei|conversamos)/.test(txt_orig) ||
                                      /(meu|nosso) (passado|histórico)/.test(txt_orig);
          if(eh_pergunta_evento){
            const sr = V112.subredes.B_autobiografia;
            if(sr){
              const c = v112_node_by_id(sr.id);
              if(c){
                // Pega últimos 3 eventos do hipocampo
                const ultimos = V112.eventos.slice(-3);
                const resumo = ultimos.length > 0 ? 
                  'lembro: ' + ultimos.map(e => (e.tokens||[]).slice(0,5).join(' ')).join(' | ') :
                  'nenhum evento na memória';
                c.acumulador = Math.min(200, c.acumulador + 40);
                c._ativacoes = (c._ativacoes||0)+1;
                c._sucessos = (c._sucessos||0)+1;
                bidir_resultado = {tratou: true, conhecia: true, dados: {palavra: palavra_chave, resposta_direta: resumo, autobiografia: true}};
                LOG.subredes = LOG.subredes || {}; LOG.subredes.B_autobiografia = {eventos: ultimos.length};
              }
            }
          }
        }
        
        // ─── B_controle_exec (PFC): inibe resposta se Self-Core diz "não" ───
        // (Inibição passiva — afeta acumulador, não bloqueia ainda)
        if(bidir_resultado){
          const sr = V112.subredes.B_controle_exec;
          if(sr){
            const c = v112_node_by_id(sr.id);
            if(c && c._inibir && c._inibir[palavra_chave]){
              // Inibir resposta — sinaliza no log mas mantém
              LOG.subredes = LOG.subredes || {};
              LOG.subredes.B_controle_exec = {inibido: palavra_chave};
              c._ativacoes = (c._ativacoes||0)+1;
            }
          }
        }
        
        // ─── B_atencao: estatística + ESCOLHA de prioridade (Lab 13.1) ───
        // Aprende: pra que tipo de pergunta, qual sub-rede deu certo
        // E agora REGISTRA padrão "tipo_pergunta → sub-rede vencedora" pra usar no próximo
        if(bidir_resultado){
          const sr = V112.subredes.B_atencao;
          if(sr){
            const c = v112_node_by_id(sr.id);
            if(c){
              if(!c._estatistica) c._estatistica = {};
              if(!c._tipo_para_subrede) c._tipo_para_subrede = {};
              // Detecta qual sub-rede respondeu (última entrada em LOG.subredes)
              const subredes_log = LOG.subredes ? Object.keys(LOG.subredes) : [];
              const respondeu = subredes_log[subredes_log.length - 1];
              if(respondeu){
                c._estatistica[respondeu] = (c._estatistica[respondeu] || 0) + 1;
                // Classifica tipo da pergunta (heurística simples)
                const txt = String(input || '').toLowerCase();
                let tipo = 'outro';
                if(/^\s*[\d\(]/.test(txt)) tipo = 'matematica';
                else if(/^(qual|quem|o que|onde|quando)/.test(txt)) tipo = 'pergunta';
                else if(/^se /.test(txt)) tipo = 'condicional';
                else if(/^todos|^todas|^algum/.test(txt)) tipo = 'quantif';
                else if(/lembra|aconteceu|passado/.test(txt)) tipo = 'autobio';
                else if(txt.split(/\s+/).length <= 2) tipo = 'palavra';
                if(!c._tipo_para_subrede[tipo]) c._tipo_para_subrede[tipo] = {};
                c._tipo_para_subrede[tipo][respondeu] = (c._tipo_para_subrede[tipo][respondeu] || 0) + 1;
                c.acumulador = Math.min(200, c.acumulador + 10);
                c._ativacoes = (c._ativacoes||0)+1;
              }
            }
          }
        }
        
        // ─── B_prioridade (PFC): registra qual sub-rede ganhou o turno ───
        if(bidir_resultado){
          const sr = V112.subredes.B_prioridade;
          if(sr){
            const c = v112_node_by_id(sr.id);
            if(c){
              if(!c._ranking) c._ranking = {};
              const subredes_log = LOG.subredes ? Object.keys(LOG.subredes) : [];
              const vencedora = subredes_log[subredes_log.length - 1];
              if(vencedora){
                c._ranking[vencedora] = (c._ranking[vencedora] || 0) + 1;
                c._ativacoes = (c._ativacoes||0)+1;
              }
            }
          }
        }
        
        // NADA: B_silencio assume — NÃO INVENTA
        if(!bidir_resultado){
          const sr_sil = V112.subredes.B_silencio;
          if(sr_sil){
            const central_sil = v112_node_by_id(sr_sil.id);
            if(central_sil){
              central_sil.acumulador = Math.min(200, central_sil.acumulador + 30);
              central_sil._ativacoes = (central_sil._ativacoes || 0) + 1;
              // B_silencio = veto: não força resposta, deixa cair pro "hm." natural
              LOG.subredes = LOG.subredes || {};
              LOG.subredes.B_silencio = {acao: 'veto_silencio', palavra: palavra_chave};
            }
          }
        }
      }
    }
  }
  
  // ─── DETECÇÃO B_contra: negação aplicada — Lab 12.1 Sessão 2.3 ───
  // Trigger ampliado: pega "X não é Y" SEMPRE que padrão "X não é Y" detectado
  // E invalida cadeia humano→animal em B_logico (remove aresta)
  if(analise && analise.intent_nega){
    const palavras_dna = [];
    for(const tok of tokens){
      if(sc && (sc.user.includes(tok) || sc.nome.includes(tok) || sc.sou.includes(tok))){
        palavras_dna.push(tok);
      }
    }
    
    // Detecta padrão "X não é Y" e invalida cadeia B_logico
    // tokens: [X, não, é, Y] — acha posição de "não é"
    let nao_e_pos = -1;
    for(let i = 0; i < tokens.length - 2; i++){
      const t1 = tokens[i];
      const t2 = tokens[i+1];
      const t3 = tokens[i+2];
      if(['não','nao'].includes(t1) && ['é','eh','=','são','sao'].includes(t2)){
        // padrão é tokens[i-1] + tokens[i] + tokens[i+1] + tokens[i+2]
        nao_e_pos = i;
        break;
      }
    }
    
    if(nao_e_pos > 0 && nao_e_pos + 2 < tokens.length){
      const inst = tokens[nao_e_pos - 1];
      let val = tokens[nao_e_pos + 2];  // depois do "não é"
      // pula stopwords
      if(['uma','um','o','a'].includes(val) && nao_e_pos + 3 < tokens.length){
        val = tokens[nao_e_pos + 3];
      }
      if(inst && val){
        // B_contra ativa SEMPRE (com inst+val, não só DNA)
        _ativar_subrede('B_contra', _hash_str('neg_logico:' + inst + '_' + val), {
          inst, val, padrao: 'negacao_logica'
        });
        // Invalida cadeia B_logico: aresta direta inst→val
        const sr_log = V112.subredes.B_logico;
        let invalidou = 0;
        if(sr_log){
          const central_log = v112_node_by_id(sr_log.id);
          if(central_log && central_log._cadeia){
            // Aresta direta
            if(central_log._cadeia[inst] && central_log._cadeia[inst].has(val)){
              central_log._cadeia[inst].delete(val);
              invalidou++;
            }
            // Transitivo: se humano→mamífero→animal e nega humano→animal,
            // marca em _negacoes_transitivas pra BFS pular
            if(!central_log._negacoes_transitivas) central_log._negacoes_transitivas = {};
            if(!central_log._negacoes_transitivas[inst]) central_log._negacoes_transitivas[inst] = new Set();
            central_log._negacoes_transitivas[inst].add(val);
            if(!central_log._negacoes) central_log._negacoes = [];
            central_log._negacoes.push({inst, val, transitivo: true, turn: V112.turn, removeu_direta: invalidou>0});
          }
        }
        // Invalida B_bidir
        const sr_bd = V112.subredes.B_bidir;
        if(sr_bd){
          const cb = v112_node_by_id(sr_bd.id);
          if(cb && cb._cache_instancias && cb._cache_instancias[val]){
            cb._cache_instancias[val].delete(inst);
          }
          if(cb && cb._categorias_por_instancia && cb._categorias_por_instancia[inst]){
            cb._categorias_por_instancia[inst].delete(val);
          }
        }
      }
    }
    
    // Original: nega no DNA
    if(palavras_dna.length > 0){
      _ativar_subrede('B_contra', _hash_str('neg:' + palavras_dna.join(',')), {
        palavras: palavras_dna, padrao: 'negacao_dna'
      });
    }
  }
  
  // ─── DETECÇÃO B_orfao: frase sem padrão sintático conhecido ───
  if(tokens.length >= 3 && !self_ativo){
    const tem_estrutura = analise && (analise.intent_afirma || analise.intent_pergunta || analise.intent_nega || analise.pron_eu || analise.pron_voce || analise.operadores_ativos.length > 0);
    if(!tem_estrutura){
      _ativar_subrede('B_orfao', _hash_str('orfao:' + tokens.slice(0, 3).join(' ')), {
        primeiros: tokens.slice(0, 3)
      });
    }
  }
  
  // ─── B_link: RACICÍONIO INVERTIDO / CONEXÃO ENTRE 2 CONCEITOS — Sessão 2.3 ───
  // Quando input tem 2+ palavras conceito conhecidas, B_link tenta achar
  // CAMINHO entre elas via B_logico (BFS bidirecional)
  // Exemplo: input "espinha esponja" → B_link acha caminho espinha→padrão→gosma→esponja
  if(tokens.length >= 2 && V112.subredes.B_link && V112.subredes.B_logico){
    const sr_link = V112.subredes.B_link;
    const central_link = v112_node_by_id(sr_link.id);
    const sr_log = V112.subredes.B_logico;
    const central_log = v112_node_by_id(sr_log.id);
    
    if(central_link && central_log && central_log._cadeia){
      // Pega palavras-conceito (que existem como nó)
      const conceitos = tokens.filter(t => 
        v112_node_by_text(t) && t.length >= 3 && 
        !['?',',','.','não','nao','é','eh','=','são','sao','um','uma','o','a','de','do','da'].includes(t)
      );
      
      if(conceitos.length >= 2){
        // Tenta achar caminho entre primeiro e último
        const orig = conceitos[0];
        const dest = conceitos[conceitos.length - 1];
        
        // BFS bidirecional: ida (orig→...) e volta (dest reverso)
        const cadeia = central_log._cadeia;
        const reversed = {};
        for(const [o, s] of Object.entries(cadeia)){
          for(const d of s){
            if(!reversed[d]) reversed[d] = new Set();
            reversed[d].add(o);
          }
        }
        
        function _bfs_caminho(a, b){
          // BFS de a até b
          if(a === b) return [a];
          const visitados = new Set([a]);
          const pred = {[a]: null};
          let fila = [a];
          let achou = false;
          while(fila.length > 0 && !achou){
            const prox = [];
            for(const n of fila){
              const dests = cadeia[n] || new Set();
              for(const d of dests){
                if(visitados.has(d)) continue;
                visitados.add(d);
                pred[d] = n;
                if(d === b){ achou = true; break; }
                prox.push(d);
              }
              if(achou) break;
            }
            if(achou) break;
            fila = prox;
          }
          if(!achou) return null;
          // Reconstrói caminho
          const path = [b];
          let cur = b;
          while(pred[cur] !== null && pred[cur] !== undefined){
            cur = pred[cur];
            path.unshift(cur);
          }
          return path;
        }
        
        // Tenta caminho A→B ou B→A
        let caminho = _bfs_caminho(orig, dest);
        let inverso = false;
        if(!caminho){
          caminho = _bfs_caminho(dest, orig);
          inverso = true;
        }
        
        if(caminho && caminho.length >= 2){
          central_link.acumulador = Math.min(200, central_link.acumulador + 40);
          central_link._ativacoes = (central_link._ativacoes || 0) + 1;
          central_link._sucessos = (central_link._sucessos || 0) + 1;
          if(!central_link._conexoes_achadas) central_link._conexoes_achadas = [];
          central_link._conexoes_achadas.push({orig, dest, caminho, inverso, turn: V112.turn});
          LOG.subredes = LOG.subredes || {};
          LOG.subredes.B_link = {acao: 'caminho_achado', orig, dest, caminho, inverso};
        }
      }
    }
  }

  // 6. RESPOSTA EMERGENTE — com Patch B (Anti-Hiper-Associação por Saturação de Hubs)
  const input_ids = new Set(nos_do_turno.map(x => x.no.id));
  const palavras_evocadas = new Map();
  const total_palavras_voc = Object.keys(V112.freq_global).length;

  // ═══════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════
  // GRADIENTE v11.5 — agora baseado em TIPO EMERGENTE da palavra
  // Palavra-conceito: gradiente alto (energia flui livre)
  // Palavra-função: gradiente baixo (esponja, retém energia)
  // Tipo é decidido pelo próprio nó (Item 2 da pré-base)
  // ═══════════════════════════════════════════════════════════════════════
  function gradiente_saida(no){
    if(!no || !no.text) return 0;
    // Se tipo já foi decidido emergentemente
    if(no._palavra_tipo === 'funcao') return 0.05;  // hub bloqueado
    // Conceito puro: livre
    return 1.0;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VIA 1 (MAIS FORTE): CO-OCORRÊNCIA DIRETA EM EVENTOS RECENTES
  // FIX v11.4: palavras-hub ("é", "o", "a") NÃO servem como ponte!
  // No cérebro humano, "é" não evoca memórias — substantivos sim.
  // Se o input só tem hubs, Via 1 não dispara — deixa pra outras vias.
  // ═══════════════════════════════════════════════════════════════════════
  for(const it of nos_do_turno){
    // Se o próprio token é um hub forte, ele NÃO é uma boa pista pra recuperar eventos
    const grad_input = gradiente_saida(it.no);
    if(grad_input < 0.5){
      // Token é hub (ex: "é") — pula Via 1 pra esse token
      continue;
    }
    
    const eventos_com = V112.eventos.filter(ev => ev.palavras.includes(it.no.id));
    const ultimos = eventos_com.slice(-25);  // últimos 25 eventos que contêm essa palavra
    for(const ev of ultimos){
      for(const palavra_id of ev.palavras){
        if(palavra_id === it.no.id) continue;
        if(input_ids.has(palavra_id)) continue;
        const palavra = v112_node_by_id(palavra_id);
        if(!palavra || !palavra.text) continue;
        const grad = gradiente_saida(palavra);
        if(grad < 0.05) continue;
        const recencia = 1 / (1 + (V112.turn - ev.turno) * 0.05);
        const score = (palavras_evocadas.get(palavra_id) || 0) + 200 * recencia * grad;
        palavras_evocadas.set(palavra_id, score);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VIA 2: ARESTAS TEMPORAIS DIRETAS (STDP) — palavras que vieram antes/depois
  // Aplica gradiente também
  // ═══════════════════════════════════════════════════════════════════════
  for(const it of nos_do_turno){
    // Arestas chegando: quem veio ANTES do input no passado
    const entradas = V112.edges
      .filter(e => e.to === it.no.id && e.tipo === 'temporal_seq')
      .sort((a,b) => b.peso - a.peso).slice(0, 20);
    for(const e of entradas){
      const fonte = v112_node_by_id(e.from);
      if(!fonte || !fonte.text || fonte.camada !== 'sensorial') continue;
      if(input_ids.has(fonte.id)) continue;
      const grad = gradiente_saida(fonte);
      if(grad < 0.05) continue;
      const score = (palavras_evocadas.get(fonte.id) || 0) + e.peso * 15 * grad;
      palavras_evocadas.set(fonte.id, score);
    }
    // Arestas saindo: quem veio DEPOIS do input
    const saidas = V112.edges
      .filter(e => e.from === it.no.id && e.tipo === 'temporal_seq')
      .sort((a,b) => b.peso - a.peso).slice(0, 20);
    for(const e of saidas){
      const dest = v112_node_by_id(e.to);
      if(!dest || !dest.text || dest.camada !== 'sensorial') continue;
      if(input_ids.has(dest.id)) continue;
      const grad = gradiente_saida(dest);
      if(grad < 0.05) continue;
      const score = (palavras_evocadas.get(dest.id) || 0) + e.peso * 15 * grad;
      palavras_evocadas.set(dest.id, score);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VIA 3 (FRACA): Hebb genérico — só pra preencher se vias 1 e 2 vazias
  // ═══════════════════════════════════════════════════════════════════════
  for(const it of nos_do_turno){
    const saidas = V112.edges
      .filter(e => e.from === it.no.id && e.peso > 0.8 && e.tipo === 'normal')
      .sort((a,b) => b.peso - a.peso).slice(0, 10);
    for(const e of saidas){
      const dest = v112_node_by_id(e.to);
      if(!dest || !dest.text || dest.camada !== 'sensorial') continue;
      if(input_ids.has(dest.id)) continue;
      const grad = gradiente_saida(dest);
      if(grad < 0.1) continue;
      const score = (palavras_evocadas.get(dest.id) || 0) + e.peso * 3 * grad;
      palavras_evocadas.set(dest.id, score);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VIA 4 (modulação): Córtex ativo — só ajusta score, não cria entrada nova
  // ═══════════════════════════════════════════════════════════════════════
  const cortex_ativos = V112.cortex
    .map(id => v112_node_by_id(id))
    .filter(c => c.acumulador > 5)
    .sort((a,b) => b.acumulador - a.acumulador).slice(0, 5);
  for(const c of cortex_ativos){
    const fontes = V112.edges
      .filter(e => e.to === c.id && e.peso > 1)
      .sort((a,b) => b.peso - a.peso).slice(0, 5);
    for(const e of fontes){
      const f = v112_node_by_id(e.from);
      if(!f || !f.text || f.camada !== 'sensorial') continue;
      if(input_ids.has(f.id)) continue;
      const grad = gradiente_saida(f);
      if(grad < 0.05) continue;
      // Apenas BOOST de quem já está sendo evocado por via 1 ou 2
      if(palavras_evocadas.has(f.id)){
        const score = palavras_evocadas.get(f.id) + e.peso * c.acumulador * 0.3 * grad;
        palavras_evocadas.set(f.id, score);
      }
    }
  }

  const motores_ativos = V112.motora
    .map(id => v112_node_by_id(id))
    .filter(m => m.acumulador > 5)
    .sort((a,b) => b.acumulador - a.acumulador).slice(0, 5);
  for(const m of motores_ativos){
    const fontes = V112.edges
      .filter(e => e.to === m.id && e.peso > 1)
      .sort((a,b) => b.peso - a.peso).slice(0, 5);
    for(const e of fontes){
      const f = v112_node_by_id(e.from);
      if(!f || !f.text || f.camada !== 'sensorial') continue;
      if(input_ids.has(f.id)) continue;
      const grad = gradiente_saida(f);
      if(grad < 0.05) continue;
      // Apenas BOOST de quem já está sendo evocado
      if(palavras_evocadas.has(f.id)){
        const score = palavras_evocadas.get(f.id) + e.peso * m.acumulador * 0.3 * grad;
        palavras_evocadas.set(f.id, score);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // EMISSÃO: 3 CRITÉRIOS DE FILTRO + SELETOR
  // O cérebro tem MUITO score acumulado, mas só fala se passar do filtro
  // 3 critérios calculados em paralelo. UI escolhe qual usar.
  // ═══════════════════════════════════════════════════════════════
  const todas_ordenadas = Array.from(palavras_evocadas.entries())
    .sort((a,b) => b[1] - a[1]);
  
  // Parâmetros (default + ajustáveis via V112.config)
  const CFG = V112.config || {};
  const k_ratio    = CFG.k_ratio    || 1.8;   // critério 1: top1 > top2 × k_ratio
  const k_media    = CFG.k_media    || 3.0;   // critério 2: top1 > média_outros × k_media
  const k_absoluto = CFG.k_absoluto || 200;   // critério 3: top1 > k_absoluto
  
  function calcular_candidato(criterio){
    if(todas_ordenadas.length === 0) return {emite: [], razao: 'vazio'};
    // FIX v11.4: ignora HUBS na emissão (é, o, a — não dizem nada útil)
    const ordenadas_filtradas = todas_ordenadas.filter(([id, sc]) => {
      const n = v112_node_by_id(id);
      if(!n || !n.text) return false;
      const g = gradiente_saida(n);
      return g >= 0.5;  // só palavras não-hub emitem
    });
    if(ordenadas_filtradas.length === 0) return {emite: [], razao: 'só hubs disponíveis'};
    
    const top1_score = ordenadas_filtradas[0][1];
    const top1_pal = v112_node_by_id(ordenadas_filtradas[0][0])?.text;
    if(!top1_pal) return {emite: [], razao: 'sem texto'};
    
    if(criterio === 'ratio'){
      const top2_score = ordenadas_filtradas[1]?.[1] || 0;
      const passa = top1_score > top2_score * k_ratio;
      if(!passa) return {emite: [], razao: `top1(${top1_score.toFixed(0)}) não > top2(${top2_score.toFixed(0)})×${k_ratio}`};
      const emite = ordenadas_filtradas
        .filter(([id, sc]) => sc > top2_score * k_ratio)
        .slice(0, 4)
        .map(([id]) => v112_node_by_id(id)?.text)
        .filter(Boolean);
      return {emite, razao: `top1 ${top1_score.toFixed(0)} > top2 ${top2_score.toFixed(0)}×${k_ratio}`};
    }
    if(criterio === 'media'){
      const outros = ordenadas_filtradas.slice(1, 10).map(x => x[1]);
      const media = outros.length > 0 ? outros.reduce((s,x)=>s+x,0)/outros.length : 0;
      const passa = top1_score > media * k_media;
      if(!passa) return {emite: [], razao: `top1(${top1_score.toFixed(0)}) não > média(${media.toFixed(0)})×${k_media}`};
      const emite = ordenadas_filtradas
        .filter(([id, sc]) => sc > media * k_media)
        .slice(0, 4)
        .map(([id]) => v112_node_by_id(id)?.text)
        .filter(Boolean);
      return {emite, razao: `top1 ${top1_score.toFixed(0)} > média ${media.toFixed(0)}×${k_media}`};
    }
    if(criterio === 'absoluto'){
      const passa = top1_score > k_absoluto;
      if(!passa) return {emite: [], razao: `top1(${top1_score.toFixed(0)}) não > ${k_absoluto}`};
      const emite = ordenadas_filtradas
        .filter(([id, sc]) => sc > k_absoluto)
        .slice(0, 4)
        .map(([id]) => v112_node_by_id(id)?.text)
        .filter(Boolean);
      return {emite, razao: `top1 ${top1_score.toFixed(0)} > ${k_absoluto} absoluto`};
    }
    return {emite: [], razao: 'critério inválido'};
  }
  
  const candidato_ratio    = calcular_candidato('ratio');
  const candidato_media    = calcular_candidato('media');
  const candidato_absoluto = calcular_candidato('absoluto');
  
  // Qual critério usar pra emissão (default: ratio)
  const criterio_ativo = CFG.criterio_emissao || 'ratio';
  const candidato_ativo = 
    criterio_ativo === 'media' ? candidato_media :
    criterio_ativo === 'absoluto' ? candidato_absoluto :
    candidato_ratio;
  
  let top = candidato_ativo.emite;
  let _self_dominou = false;

  // ═══════════════════════════════════════════════════════════════
  // SELF-CORE: VETO/OVERRIDE DA RESPOSTA — Lab 12
  // Se Self-Core ativo + input pergunta sobre identidade → ele domina
  // Padrões detectados (sem hardcode de domínio, só pronomes pessoais):
  //   "qual seu/meu nome" → responde sc.nome
  //   "quem é você"       → responde sc.sou
  //   "quem é eu"/"sou ?" → responde sc.user
  //   "qual seu criador"  → responde sc.criador
  // ═══════════════════════════════════════════════════════════════
  if(self_ativo && sc){
    let resp_self = null;
    
    if(/\b(qual|quem)\b.*\bseu\s+nome/i.test(input_lower_raw) ||
       /\bseu\s+nome\s*\?/i.test(input_lower_raw)){
      // Pergunta sobre nome DA IA
      if(sc.nome.length > 0) resp_self = sc.nome.join(', ');
    }
    else if(/\b(qual|quem)\b.*\bmeu\s+nome/i.test(input_lower_raw) ||
            /\bmeu\s+nome\s*\?/i.test(input_lower_raw)){
      // Pergunta sobre nome do USER
      if(sc.user.length > 0) resp_self = sc.user.join(', ');
    }
    else if(/\bquem\s+(é|eh)\s+(você|vc|tu)/i.test(input_lower_raw)){
      // "quem é você"
      const partes = [];
      if(sc.sou.length > 0) partes.push(sc.sou.join(', '));
      if(sc.nome.length > 0) partes.push('nome '+sc.nome.join('/'));
      if(partes.length > 0) resp_self = partes.join(', ');
    }
    else if(/\b(seu|teu)\s+criador/i.test(input_lower_raw) ||
            /\bquem\s+(te\s+criou|criou\s+(você|vc|tu))/i.test(input_lower_raw)){
      if(sc.criador.length > 0) resp_self = sc.criador.join(', ');
    }
    else if(/\bqual\s+seu\s+(sistema|nome\s+do\s+sistema)/i.test(input_lower_raw)){
      resp_self = sc.sistema_nome;
    }
    
    if(resp_self){
      top = [resp_self];
      _self_dominou = true;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // B_bidir: SUB-REDE INJETA INSTÂNCIAS QUANDO PERGUNTA É CATEGORIA
  // Se Self-Core não dominou E B_bidir foi ativada → responde com instâncias
  // ═══════════════════════════════════════════════════════════════
  let _bidir_dominou = false;
  let _link_dominou = false;
  // Lab 12.6 — resposta_direta de B_excecoes / B_paradoxo
  if(!_self_dominou && bidir_resultado && bidir_resultado.dados && bidir_resultado.dados.resposta_direta){
    top = [bidir_resultado.dados.resposta_direta];
    _bidir_dominou = true;
  }
  if(!_self_dominou && !_bidir_dominou && bidir_resultado && bidir_resultado.dados && bidir_resultado.dados.instancias){
    const insts = bidir_resultado.dados.instancias;
    if(insts.length > 0){
      // Pega até 3 instâncias (sub-rede limita pra não vomitar)
      top = insts.slice(0, 3);
      _bidir_dominou = true;
    }
  }
  
  // B_link: SUB-REDE INJETA CAMINHO quando achou conexão entre 2 conceitos
  if(!_self_dominou && !_bidir_dominou && LOG.subredes?.B_link?.caminho){
    const cam = LOG.subredes.B_link.caminho;
    if(cam.length >= 2){
      // Resposta é o caminho como sequência
      top = [cam.join(' → ')];
      _link_dominou = true;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // GRAVIDADE EMERGENTE — Lab 12
  // Palavras que aparecem em turnos com Self-Core ativo ganham +1 orbita
  // Se modo_gravidade='emergente', isso permite Self-Core ativar mais com elas no futuro
  // ═══════════════════════════════════════════════════════════════
  if(self_ativo && sc && sc.modo_gravidade === 'emergente'){
    for(const it of nos_do_turno){
      if(it.no.text && it.no.id !== V112.self_core_id){
        sc.orbitantes[it.no.text] = (sc.orbitantes[it.no.text] || 0) + 1;
        // Cria aresta gravitacional fraca Self-Core ↔ palavra
        v112_edge(V112.self_core_id, it.no.id, 0.05, {tipo: 'gravidade'});
        v112_edge(it.no.id, V112.self_core_id, 0.05, {tipo: 'gravidade'});
      }
    }
  }

  let resposta;
  if(top.length === 0){
    resposta = nascidos.length === tokens.length ? '...' : 'hm.';
    V112.fallbacks_consecutivos++;
  } else {
    resposta = top.join(', ');
    V112.fallbacks_consecutivos = 0;
  }

  // Log dos 3 candidatos pro painel + análise
  LOG.candidatos = {
    ratio:    candidato_ratio,
    media:    candidato_media,
    absoluto: candidato_absoluto,
    criterio_usado: criterio_ativo,
    self_dominou: _self_dominou,
    bidir_dominou: _bidir_dominou,
    link_dominou: _link_dominou,
  };

  // ═══ FREIO GABA ═══
  if(V112.gaba_ativo){
    for(const n of V112.nodes){
      if(n.camada !== 'amigdala' && n.camada !== 'gaba') n.acumulador *= 0.3;
    }
    if(top.length > 2) resposta = top.slice(0, 1).join(', ');
    else if(top.length === 0) resposta = '...';
    LOG.freio_gaba_aplicado = true;
  } else if(V112.amigdala_estado === 'tensao'){
    if(top.length > 3) resposta = top.slice(0, 2).join(', ');
  }

  // ═══ APRENDIZADO DE VALÊNCIA ═══
  for(const it of nos_do_turno){
    const tok = it.token;
    if(!V112.valencia_palavras[tok]) V112.valencia_palavras[tok] = {negativa: 0, positiva: 0};
    if(V112.amigdala_estado === 'saturacao'){
      V112.valencia_palavras[tok].negativa += 2;
      it.no._valencia_neg = (it.no._valencia_neg || 0) + 2;
    } else if(V112.amigdala_estado === 'tensao'){
      V112.valencia_palavras[tok].negativa += 1;
      it.no._valencia_neg = (it.no._valencia_neg || 0) + 1;
    } else {
      V112.valencia_palavras[tok].positiva += 0.5;
      it.no._valencia_pos = (it.no._valencia_pos || 0) + 0.5;
      V112.valencia_palavras[tok].negativa = Math.max(0, V112.valencia_palavras[tok].negativa - 0.5);
    }
  }

  // ═══ LOG FINAL — completa todos os campos ═══
  LOG.resposta = resposta;
  
  // LAB 13.13 — Registra falha automaticamente se resposta foi vazia ou 'hm.'
  if(V112.subredes && V112.subredes.B_introspector){
    if(!resposta || resposta === 'hm.' || resposta === '...' || resposta === ''){
      try { v112_introspector_registrar_falha(input, resposta); } catch(e){}
    }
  }
  LOG.evento_criado = {
    id: evento._evento_id || evento.id,
    hipocampo_no: evento.id,
    texto: evento._texto_completo || input,
    palavras_ids: evento.palavras || [],
  };
  // Snapshot dos nós ativados em cada camada
  for(const n of V112.nodes){
    if(n.acumulador < 1) continue;
    const c = n.camada;
    if(LOG.ativacao_propagacao[c]){
      LOG.ativacao_propagacao[c].push({id: n.id, acum: +n.acumulador.toFixed(2), text: n.text || null});
    }
  }
  // Pesos semânticos
  LOG.pesos_semanticos = V112._last.pesos_calculados;
  // Palavras evocadas final (top 10 com scores)
  LOG.palavras_evocadas_final = Array.from(palavras_evocadas.entries())
    .sort((a,b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, score]) => ({
      id,
      palavra: v112_node_by_id(id)?.text || '?',
      score: +score.toFixed(2),
    }));
  // Gradiente aplicado nos tokens do input
  for(const it of nos_do_turno){
    const viz = V112.vizinhos_unicos[it.token]?.size || 0;
    const freq = V112.freq_global[it.token] || 0;
    const ratio = total_palavras_voc > 0 ? Math.max(viz/total_palavras_voc, freq/Math.max(1,V112.total_turnos)) : 0;
    LOG.gradiente_hub[it.token] = {viz, freq, ratio: +ratio.toFixed(3), grad: +gradiente_saida(it.no).toFixed(2)};
  }
  // Stats
  LOG.arestas_criadas = V112.edges.length - _arestas_antes;
  LOG.stats_depois = {nos: V112.nodes.length, arestas: V112.edges.length, eventos: V112.eventos.length};
  LOG.duracao_ms = Date.now() - t_inicio_proc;

  // Buffer circular 200 turnos
  V112.logs.push(LOG);
  if(V112.logs.length > 200) V112.logs.shift();

  return {
    resposta,
    tokens,
    nascidos,
    evento_id: evento._evento_id,
    evento_hipo_id: evento.id,
    evento_texto: evento._texto_completo,
    motores_ativos: motores_ativos.map(m => ({id: m.id, acum: m.acumulador.toFixed(1)})),
    cortex_ativos: cortex_ativos.map(c => ({id: c.id, acum: c.acumulador.toFixed(1)})),
    pesos: V112._last.pesos_calculados,
    fase: V112.total_turnos <= 5 ? 'bebê (100% B)' : V112.total_turnos <= 20 ? 'criança (50/50)' : 'adulto (80% A)',
    total_eventos: V112.eventos.length,
    amigdala: LOG.amigdala,
    gaba_ativo: V112.gaba_ativo,
    log: LOG,
  };
}

// =============================================================
// RECONSTRUIR UM EVENTO — busca a frase completa do turno N
// (mostra que a rede preservou)
// =============================================================
function v112_reconstruir_evento(evento_id){
  const ev = V112.eventos.find(e => e.id === evento_id);
  if(!ev) return null;
  // USA O ARRAY ORDENADO DO EVENTO (não as arestas, que falham com palavras repetidas)
  const palavras = ev.palavras
    .map(id => v112_node_by_id(id)?.text)
    .filter(Boolean);
  return {
    turno: ev.turno,
    texto_armazenado: ev.texto_completo,
    texto_reconstruido: palavras.join(' '),
    timestamp: ev.timestamp,
  };
}

// =============================================================
// SLEEP REPLAY — Parte 1: básico (consolidação completa fica pra Parte 3)
// =============================================================
function v112_sleep_replay(ciclos){
  ciclos = ciclos || 30;
  V112._sleep_active = true;
  const log = {ciclos, fortalecidas: 0, dormindo: 0};

  const top = V112.nodes
    .filter(n => n.text && n.camada === 'sensorial')
    .sort((a,b) => b.mass - a.mass).slice(0, 20);

  for(let c = 0; c < ciclos; c++){
    for(const n of top) v112_propagar(n.id, 20, 4);
    const ativos = V112.nodes.filter(n => n.acumulador > 3);
    for(let i = 0; i < ativos.length; i++){
      for(let j = i+1; j < ativos.length; j++){
        const e = V112.edges.find(e =>
          (e.from === ativos[i].id && e.to === ativos[j].id) ||
          (e.from === ativos[j].id && e.to === ativos[i].id)
        );
        if(e){
          e.peso *= 1.02;
          log.fortalecidas++;
        }
      }
    }
    for(const n of V112.nodes) n.acumulador *= 0.5;
  }

  // PODA = colocar pra DORMIR (NÃO DELETA)
  // Aresta dorme se: peso<0.3 E hebb_count=1 E criada há >10 turnos E não usada há >10
  // Aresta cronológica NUNCA dorme (preserva memória de evento)
  for(const e of V112.edges){
    if(e.tipo === 'cronologica') continue;
    if(e._dormindo) continue;
    if(e.peso >= 0.3) continue;
    if(e.hebb_count > 1) continue;
    if((V112.turn - e._criado_turno) <= 10) continue;
    if((V112.turn - (e._last_used || 0)) <= 10) continue;
    const orig = v112_node_by_id(e.from);
    const dest = v112_node_by_id(e.to);
    if(orig?.text || dest?.text) continue;  // nunca dorme aresta de palavra
    e._dormindo = true;
    log.dormindo++;
  }

  V112._sleep_active = false;
  return log;
}

function dist3d(p1, p2){
  const dx = p1[0]-p2[0], dy = p1[1]-p2[1], dz = p1[2]-p2[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

// =============================================================
// EXPORTAR LOGS
// =============================================================
function v112_logs_json(){
  return JSON.stringify({
    version: 'v11.3',
    exported_at: new Date().toISOString(),
    total_turnos: V112.turn,
    logs_count: V112.logs.length,
    logs: V112.logs,
  }, null, 2);
}

function v112_logs_txt(){
  let txt = '═══ LAB v11.3 — LOGS DE PROCESSAMENTO ═══\n';
  txt += `exportado: ${new Date().toISOString()}\n`;
  txt += `total turnos: ${V112.turn} · logs no buffer: ${V112.logs.length}\n\n`;
  
  for(const L of V112.logs){
    txt += `${'═'.repeat(70)}\n`;
    txt += `TURNO ${L.turno}  (${L.timestamp})  ${L.duracao_ms}ms\n`;
    txt += `${'═'.repeat(70)}\n`;
    txt += `INPUT:    "${L.input}"\n`;
    txt += `RESPOSTA: "${L.resposta}"\n\n`;
    
    txt += `▸ AMÍGDALA\n`;
    txt += `  estado: ${L.amigdala.antes.estado} → ${L.amigdala.depois.estado}\n`;
    txt += `  tensão: ${L.amigdala.antes.tensao.toFixed(1)} → ${L.amigdala.depois.tensao.toFixed(1)} (Δ${L.amigdala.delta.toFixed(1)})\n`;
    txt += `  motivo: ${L.amigdala.motivo}\n`;
    txt += `  GABA:   ${L.freio_gaba_aplicado ? '🚨 ATIVO (resposta atenuada)' : 'inativo'}\n\n`;
    
    txt += `▸ TOKENS (${L.tokens.length}): ${L.tokens.join(' · ')}\n`;
    if(L.nascidos.length > 0){
      txt += `  nascidos: ${L.nascidos.map(n => `"${n.texto}"(${n.id})`).join(', ')}\n`;
    }
    txt += '\n';
    
    txt += `▸ PESOS SEMÂNTICOS\n`;
    for(const [tok, p] of Object.entries(L.pesos_semanticos)){
      const max = Math.max(p.sens||0, p.inter||0, p.motor||0);
      const tipo = max === p.sens ? 'SENS' : max === p.inter ? 'INTER' : 'MOTOR';
      txt += `  ${tok.padEnd(15)} sens=${(p.sens||0).toFixed(2)} inter=${(p.inter||0).toFixed(2)} motor=${(p.motor||0).toFixed(2)} → ${tipo}\n`;
    }
    txt += '\n';
    
    if(L.evento_criado){
      txt += `▸ EVENTO CRIADO\n`;
      txt += `  ${L.evento_criado.id} no nó ${L.evento_criado.hipocampo_no}\n`;
      txt += `  preservou: "${L.evento_criado.texto}"\n`;
      txt += `  palavras: ${L.evento_criado.palavras_ids.length}\n\n`;
    }
    
    txt += `▸ GRADIENTE DE HUB (input)\n`;
    for(const [tok, g] of Object.entries(L.gradiente_hub)){
      const lvl = g.grad >= 0.85 ? 'livre' : g.grad >= 0.6 ? 'semi' : g.grad >= 0.3 ? 'forte' : 'BLOQUEADO';
      txt += `  ${tok.padEnd(15)} viz=${g.viz} freq=${g.freq} ratio=${(g.ratio*100).toFixed(1)}% grad=${g.grad} [${lvl}]\n`;
    }
    txt += '\n';
    
    txt += `▸ ATIVAÇÃO POR CAMADA\n`;
    for(const [cam, lista] of Object.entries(L.ativacao_propagacao)){
      if(lista.length === 0) continue;
      const total = lista.length;
      const top5 = lista.sort((a,b) => b.acum - a.acum).slice(0, 5);
      txt += `  ${cam.padEnd(12)} ${total} nós ativos. Top: ` +
             top5.map(n => `${n.id}${n.text?'('+n.text+')':''}=${n.acum}`).join(', ') + '\n';
    }
    txt += '\n';
    
    if(L.palavras_evocadas_final.length > 0){
      txt += `▸ PALAVRAS EVOCADAS (top 10)\n`;
      for(const p of L.palavras_evocadas_final){
        txt += `  ${p.palavra.padEnd(15)} score=${p.score}\n`;
      }
      txt += '\n';
    } else {
      txt += `▸ PALAVRAS EVOCADAS: NENHUMA (fallback "${L.resposta}")\n\n`;
    }
    
    txt += `▸ ESTATÍSTICAS\n`;
    txt += `  arestas criadas neste turno: ${L.arestas_criadas}\n`;
    txt += `  total nós: ${L.stats_antes.nos} → ${L.stats_depois.nos}\n`;
    txt += `  total arestas: ${L.stats_antes.arestas} → ${L.stats_depois.arestas}\n`;
    txt += `  total eventos: ${L.stats_antes.eventos} → ${L.stats_depois.eventos}\n`;
    txt += '\n';
  }
  
  return txt;
}

// ═══════════════════════════════════════════════════════════════
// LAB 12.7 — REPOSICIONAR EM Y BIFURCADO (cogumelo → árvore)
// 
// Estrutura visual:
//   - TRONCO CENTRAL (Z+200 → Z+50): Sensorial entra pelo topo
//   - SELF-CORE em Z=0 (centro, ponto de bifurcação)
//   - HEMISFÉRIO LING (X negativo, Z=0 → Z-100): cone aberto em guarda-chuva
//   - HEMISFÉRIO MAT (X positivo, Z=0 → Z-100): cone aberto em guarda-chuva
//   - PONTAS DOS CONES (X=±200, Z=-100): contêm DADOS de treino agrupados
//   - LINHAS LÓGICAS conectam as 2 pontas (corpo caloso visível)
//   - SAÍDA: Motora/Broca embaixo (Z-150 → Z-250), recolhendo dos 2 lados
// ═══════════════════════════════════════════════════════════════
function v112_reposicionar_em_Y(){
  // 1) TRONCO CENTRAL — entrada de dados, pequeno e fechado
  // Sensorial: anel pequeno no topo (Z+200)
  let i_s = 0;
  for(const slot of V112.sensorial){
    if(!slot.ocupado){
      // slots vazios ficam num anel apertado em cima
      const ang = (i_s / V112.sensorial.length) * Math.PI * 2;
      slot.pos = [Math.cos(ang) * 25, Math.sin(ang) * 25, 200];
      i_s++;
    }
  }
  
  // 2) TÁLAMO — pequeno anel mais embaixo
  for(let i = 0; i < V112.talamo.length; i++){
    const n = v112_node_by_id(V112.talamo[i]);
    if(!n) continue;
    const ang = (i / V112.talamo.length) * Math.PI * 2;
    n.pos = [Math.cos(ang) * 18, Math.sin(ang) * 18, 150];
  }
  
  // 3) HIPOCAMPO — funil descendo (tronco) entre Z+100 e Z+50
  for(let i = 0; i < V112.hipocampo.length; i++){
    const n = v112_node_by_id(V112.hipocampo[i]);
    if(!n) continue;
    const ang = (i / V112.hipocampo.length) * Math.PI * 2;
    const t = i / V112.hipocampo.length;  // 0..1
    const raio = 30 - t * 15;  // afunila
    n.pos = [Math.cos(ang) * raio, Math.sin(ang) * raio, 100 - t * 40];
  }
  
  // 4) SELF-CORE — fica no centro (0,0,0)
  if(V112.self_core_id){
    const sc = v112_node_by_id(V112.self_core_id);
    if(sc) sc.pos = [0, 0, 0];
  }
  
  // 5) BIFURCAÇÃO — H_LING (esquerda) e H_MAT (direita)
  if(V112.hemisferios.H_LING){
    const n = v112_node_by_id(V112.hemisferios.H_LING);
    if(n) n.pos = [-80, 0, -20];
  }
  if(V112.hemisferios.H_MAT){
    const n = v112_node_by_id(V112.hemisferios.H_MAT);
    if(n) n.pos = [80, 0, -20];
  }
  
  // 6) CÓRTEX — distribui em 2 cones (guarda-chuva)
  //    Metade vai pro cone esquerdo (LING), metade pro direito (MAT)
  const meio_cortex = Math.floor(V112.cortex.length / 2);
  for(let i = 0; i < V112.cortex.length; i++){
    const n = v112_node_by_id(V112.cortex[i]);
    if(!n) continue;
    const eh_ling = i < meio_cortex;
    const idx_local = eh_ling ? i : (i - meio_cortex);
    const tam = eh_ling ? meio_cortex : (V112.cortex.length - meio_cortex);
    // posição dentro do cone (guarda-chuva aberto)
    const ang = (idx_local / tam) * Math.PI * 2;
    // raio cresce com profundidade — guarda-chuva
    const t = (idx_local % 50) / 50;  // 0..1 dentro do cone
    const raio_cone = 30 + t * 50;     // 30..80 (abre)
    const z_cone = -30 - t * 60;       // desce com a abertura
    const centro_x = eh_ling ? -120 : 120;
    n.pos = [
      centro_x + Math.cos(ang) * raio_cone,
      Math.sin(ang) * raio_cone,
      z_cone
    ];
  }
  
  // 7) NÚCLEOS DE AÇÃO — círculo médio entre os 2 cones (ponto de coleta)
  for(let i = 0; i < V112.nucleos_acao.length; i++){
    const n = v112_node_by_id(V112.nucleos_acao[i]);
    if(!n) continue;
    const ang = (i / V112.nucleos_acao.length) * Math.PI * 2;
    n.pos = [Math.cos(ang) * 25, Math.sin(ang) * 25, -100];
  }
  
  // 8) AMÍGDALA — orbita perto do Self-Core (não no cone)
  for(let i = 0; i < V112.amigdala.length; i++){
    const n = v112_node_by_id(V112.amigdala[i]);
    if(!n) continue;
    const ang = (i / V112.amigdala.length) * Math.PI * 2;
    n.pos = [Math.cos(ang) * 15, Math.sin(ang) * 15 - 30, -10];
  }
  
  // 9) GABA — atrás do Self-Core (freio)
  for(let i = 0; i < V112.gaba.length; i++){
    const n = v112_node_by_id(V112.gaba[i]);
    if(!n) continue;
    const ang = (i / V112.gaba.length) * Math.PI * 2;
    n.pos = [Math.cos(ang) * 10, Math.sin(ang) * 10 + 30, -5];
  }
  
  // 10) MOTORA — funil reverso embaixo (recolhendo dos 2 cones)
  for(let i = 0; i < V112.motora.length; i++){
    const n = v112_node_by_id(V112.motora[i]);
    if(!n) continue;
    const ang = (i / V112.motora.length) * Math.PI * 2;
    const t = i / V112.motora.length;
    const raio = 60 - t * 40;  // afunila ao descer
    n.pos = [Math.cos(ang) * raio, Math.sin(ang) * raio, -170 - t * 30];
  }
  
  // 11) BROCA — pequeno anel na base (saída)
  for(let i = 0; i < V112.broca.length; i++){
    const n = v112_node_by_id(V112.broca[i]);
    if(!n) continue;
    const ang = (i / V112.broca.length) * Math.PI * 2;
    n.pos = [Math.cos(ang) * 18, Math.sin(ang) * 18, -240];
  }
  
  // 12) SUB-REDES B — distribuídas entre os 2 cones, na altura média
  // Sub-redes linguísticas → lado LING (X negativo)
  // Sub-redes lógicas/matemáticas → lado MAT (X positivo)
  const subredes_ling = ['B_bidir','B_link','B_silencio','B_orfao','B_salto','B_analogia'];
  const subredes_mat  = ['B_logico','B_contra','B_silogismo','B_quantif','B_excecoes','B_paradoxo','B_temporal'];
  const subredes_meta = ['SUB_B','SUB_SUB_B'];
  
  let idx_ling = 0;
  for(const nome of subredes_ling){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        const ang = (idx_ling / subredes_ling.length) * Math.PI * 2;
        central.pos = [-120 + Math.cos(ang) * 35, Math.sin(ang) * 35, -60];
        // satélites em torno
        for(let s = 0; s < (V112.subredes[nome].satelites || []).length; s++){
          const sat = v112_node_by_id(V112.subredes[nome].satelites[s]);
          if(sat){
            const sa = (s / 8) * Math.PI * 2;
            sat.pos = [central.pos[0] + Math.cos(sa) * 8, central.pos[1] + Math.sin(sa) * 8, central.pos[2]];
          }
        }
        idx_ling++;
      }
    }
  }
  
  let idx_mat = 0;
  for(const nome of subredes_mat){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        const ang = (idx_mat / subredes_mat.length) * Math.PI * 2;
        central.pos = [120 + Math.cos(ang) * 35, Math.sin(ang) * 35, -60];
        for(let s = 0; s < (V112.subredes[nome].satelites || []).length; s++){
          const sat = v112_node_by_id(V112.subredes[nome].satelites[s]);
          if(sat){
            const sa = (s / 8) * Math.PI * 2;
            sat.pos = [central.pos[0] + Math.cos(sa) * 8, central.pos[1] + Math.sin(sa) * 8, central.pos[2]];
          }
        }
        idx_mat++;
      }
    }
  }
  
  // Meta atrás do Self-Core (na bifurcação)
  let idx_meta = 0;
  for(const nome of subredes_meta){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        central.pos = [(idx_meta - 0.5) * 25, 0, 25];
        idx_meta++;
      }
    }
  }
  
  // ═════════════════════════════════════════════════════════════
  // LAB 13 — 3 REGIÕES NOVAS no Y bifurcado
  // ═════════════════════════════════════════════════════════════
  
  // PFC (Pré-Frontal) — CÚPULA EM CIMA do Self-Core, Y+ pra frente
  // Funciona como "chapéu" do tronco central
  const subredes_pfc = ['B_planejamento','B_objetivo','B_prioridade','B_controle_exec'];
  let idx_pfc = 0;
  for(const nome of subredes_pfc){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        // cúpula: anel ACIMA do tronco (Z+70), Y positivo (frente), raio bem aberto
        const ang = (idx_pfc / subredes_pfc.length) * Math.PI * 2;
        central.pos = [Math.cos(ang) * 50, 70 + Math.sin(ang) * 15, 55];
        for(let s = 0; s < (V112.subredes[nome].satelites || []).length; s++){
          const sat = v112_node_by_id(V112.subredes[nome].satelites[s]);
          if(sat){
            const sa = (s / 8) * Math.PI * 2;
            sat.pos = [central.pos[0] + Math.cos(sa) * 8, central.pos[1] + Math.sin(sa) * 8, central.pos[2]];
          }
        }
        idx_pfc++;
      }
    }
  }
  
  // DMN (Default Mode Network) — VÉU ATRÁS do Self-Core, Y- (atrás)
  const subredes_dmn = ['B_identidade','B_simulacao','B_autobiografia'];
  let idx_dmn = 0;
  for(const nome of subredes_dmn){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        // véu: anel atrás do Self-Core (Y muito negativo, Z médio-baixo, raio largo)
        const ang = (idx_dmn / subredes_dmn.length) * Math.PI * 2;
        central.pos = [Math.cos(ang) * 50, -70 + Math.sin(ang) * 12, 15];
        for(let s = 0; s < (V112.subredes[nome].satelites || []).length; s++){
          const sat = v112_node_by_id(V112.subredes[nome].satelites[s]);
          if(sat){
            const sa = (s / 8) * Math.PI * 2;
            sat.pos = [central.pos[0] + Math.cos(sa) * 8, central.pos[1] + Math.sin(sa) * 8, central.pos[2]];
          }
        }
        idx_dmn++;
      }
    }
  }
  
  // ATENÇÃO EXECUTIVA — bem em CIMA de tudo (Z máximo, centro)
  if(V112.subredes.B_atencao){
    const c = v112_node_by_id(V112.subredes.B_atencao.id);
    if(c){
      c.pos = [0, 0, 110];  // topo absoluto, acima do PFC
      for(let s = 0; s < (V112.subredes.B_atencao.satelites || []).length; s++){
        const sat = v112_node_by_id(V112.subredes.B_atencao.satelites[s]);
        if(sat){
          const sa = (s / 8) * Math.PI * 2;
          sat.pos = [Math.cos(sa) * 10, Math.sin(sa) * 10, 110];
        }
      }
    }
  }
  
  // ═════════════════════════════════════════════════════════════
  // LAB 13 — REPOSICIONA AMÍGDALA + GABA + HIPOCAMPO como SISTEMA LÍMBICO
  // (formam ANEL em torno do Self-Core, identificável visualmente)
  // ═════════════════════════════════════════════════════════════
  // Amígdala: anel inferior do límbico (X qualquer, Y-, Z=-5)
  for(let i = 0; i < V112.amigdala.length; i++){
    const n = v112_node_by_id(V112.amigdala[i]);
    if(!n) continue;
    const ang = (i / V112.amigdala.length) * Math.PI * 2;
    // formando anel em torno do Self-Core (raio 25, ligeiramente abaixo Z=-5)
    n.pos = [Math.cos(ang) * 28, Math.sin(ang) * 28 - 10, -5];
  }
  // GABA: anel superior do límbico (raio menor, Z+10)
  for(let i = 0; i < V112.gaba.length; i++){
    const n = v112_node_by_id(V112.gaba[i]);
    if(!n) continue;
    const ang = (i / V112.gaba.length) * Math.PI * 2;
    n.pos = [Math.cos(ang) * 15, Math.sin(ang) * 15 + 10, 5];
  }
  
  // 13) GRAMÁTICA — em torno do Self-Core (todas próximas, são DNA)
  if(V112.gramatica){
    let idx_g = 0;
    const palavras = Object.values(V112.gramatica);
    for(const id of palavras){
      const n = v112_node_by_id(id);
      if(n){
        const ang = (idx_g / palavras.length) * Math.PI * 2;
        n.pos = [Math.cos(ang) * 8, Math.sin(ang) * 8, 0];
        idx_g++;
      }
    }
  }
  
  // 14) OPERADORES — distribuídos pelos hemisférios
  if(V112.operadores){
    const ops_mat = ['OP_ADD','OP_SUB','OP_MUL','OP_DIV','OP_MAIOR','OP_MENOR','OP_MAIOR_E','OP_MENOR_E'];
    const ops_ling = ['OP_IGUAL','OP_DIFER','OP_NOT','OP_AND','OP_OR','OP_NEG'];
    let i_m = 0, i_l = 0;
    for(const [nome, id] of Object.entries(V112.operadores)){
      const n = v112_node_by_id(id);
      if(!n) continue;
      if(ops_mat.includes(nome)){
        const ang = (i_m / ops_mat.length) * Math.PI * 2;
        n.pos = [80 + Math.cos(ang) * 15, Math.sin(ang) * 15, -15];
        i_m++;
      } else {
        const ang = (i_l / ops_ling.length) * Math.PI * 2;
        n.pos = [-80 + Math.cos(ang) * 15, Math.sin(ang) * 15, -15];
        i_l++;
      }
    }
  }
  
  // 15) RECOLOCAR PALAVRAS SENSORIAIS por hemisfério baseado em conteúdo
  // Palavras numéricas → cone MAT; palavras de texto → cone LING
  for(const n of V112.nodes){
    if(n.camada !== 'sensorial' || !n.text) continue;
    const eh_numero = /^-?\d+(\.\d+)?$/.test(n.text);
    const eh_operador = /^[+\-*\/=<>!]$/.test(n.text);
    const centro_x = (eh_numero || eh_operador) ? 140 : -140;
    // Posição aleatória dentro do cone (espalha pela ponta)
    const ang = Math.random() * Math.PI * 2;
    const raio = 30 + Math.random() * 50;
    const z = -50 - Math.random() * 80;
    n.pos = [centro_x + Math.cos(ang) * raio, Math.sin(ang) * raio, z];
  }
  
  // Invalida caches
  V112._node_cache = null;
  V112._node_cache_size = 0;
  
  return {
    ok: true,
    info: 'Estrutura reposicionada em Y bifurcado: tronco central, 2 cones nas pontas (LING/MAT), dados agrupados, saída embaixo'
  };
}

// ═══════════════════════════════════════════════════════════════
// LAB 13.x — REPOSICIONAR EM ÁRVORE RADIAL (evolução do Y)
//
// SELF-CORE no centro absoluto (0,0,0)
// 8 BRAÇOS ORBITAIS em ângulos distintos no plano XY:
//   - LING (angular 180°, X-)         linguagem
//   - MAT  (angular 0°, X+)           matemática
//   - PFC  (angular 90°, Y+, Z+)       planejamento (em cima)
//   - DMN  (angular 270°, Y-, Z+)      identidade (atrás)
//   - LIMB (angular 225°, Y-, Z 0)     emoção (anel próximo ao centro)
//   - ATT  (Z+120, topo absoluto)      atenção (sobre tudo)
//   - WORLD (angular 45°, futuro)      world model espacial
//   - SOLVER (angular 135°)            SAT/Einstein
// 
// Cada braço tem RAIO crescente (sai do centro pra fora)
// O tronco vertical fica: entrada Z+200 → saída Z-200
// ═══════════════════════════════════════════════════════════════
function v112_reposicionar_em_arvore(){
  // 1) SELF-CORE no centro
  if(V112.self_core_id){
    const sc = v112_node_by_id(V112.self_core_id);
    if(sc) sc.pos = [0, 0, 0];
  }
  
  // 2) ENTRADA (tronco superior) — sensorial → tálamo → hipocampo
  // Anéis pequenos no topo (Z positivo, X/Y centrados)
  let i_s = 0;
  for(const slot of V112.sensorial){
    if(!slot.ocupado){
      const ang = (i_s / V112.sensorial.length) * Math.PI * 2;
      slot.pos = [Math.cos(ang) * 20, Math.sin(ang) * 20, 200];
      i_s++;
    }
  }
  for(let i = 0; i < V112.talamo.length; i++){
    const n = v112_node_by_id(V112.talamo[i]);
    if(!n) continue;
    const ang = (i / V112.talamo.length) * Math.PI * 2;
    n.pos = [Math.cos(ang) * 15, Math.sin(ang) * 15, 150];
  }
  for(let i = 0; i < V112.hipocampo.length; i++){
    const n = v112_node_by_id(V112.hipocampo[i]);
    if(!n) continue;
    const ang = (i / V112.hipocampo.length) * Math.PI * 2;
    const t = i / V112.hipocampo.length;
    const raio = 25 - t * 10;
    n.pos = [Math.cos(ang) * raio, Math.sin(ang) * raio, 100 - t * 50];
  }
  
  // 3) SAÍDA (tronco inferior) — núcleos → motora → broca
  for(let i = 0; i < V112.nucleos_acao.length; i++){
    const n = v112_node_by_id(V112.nucleos_acao[i]);
    if(!n) continue;
    const ang = (i / V112.nucleos_acao.length) * Math.PI * 2;
    n.pos = [Math.cos(ang) * 20, Math.sin(ang) * 20, -100];
  }
  for(let i = 0; i < V112.motora.length; i++){
    const n = v112_node_by_id(V112.motora[i]);
    if(!n) continue;
    const ang = (i / V112.motora.length) * Math.PI * 2;
    const t = i / V112.motora.length;
    const raio = 35 - t * 20;
    n.pos = [Math.cos(ang) * raio, Math.sin(ang) * raio, -160 - t * 30];
  }
  for(let i = 0; i < V112.broca.length; i++){
    const n = v112_node_by_id(V112.broca[i]);
    if(!n) continue;
    const ang = (i / V112.broca.length) * Math.PI * 2;
    n.pos = [Math.cos(ang) * 12, Math.sin(ang) * 12, -240];
  }
  
  // 4) BRAÇOS ORBITAIS — distribuídos em ângulos no plano XY (vista de cima)
  // Cada braço sai do centro (Self-Core) numa direção, com elevação Z própria
  const BRACOS = {
    LING:   { angulo: 180, z:  -10, dist_base: 80,  cor: 'linguagem' },     // Esquerda
    MAT:    { angulo:   0, z:  -10, dist_base: 80,  cor: 'matemática' },    // Direita
    PFC:    { angulo:  90, z:   40, dist_base: 70,  cor: 'planejamento' },  // Frente em cima
    DMN:    { angulo: 270, z:   20, dist_base: 70,  cor: 'identidade' },    // Atrás em cima
    LIMB:   { angulo: 225, z:    5, dist_base: 35,  cor: 'emoção' },         // Anel próximo
    WORLD:  { angulo:  45, z:   10, dist_base: 90,  cor: 'espacial' },       // Diagonal frente
    SOLVER: { angulo: 135, z:    0, dist_base: 90,  cor: 'restrições' },     // Diagonal trás
    META:   { angulo: 315, z:   30, dist_base: 60,  cor: 'meta' },           // Diagonal
  };
  
  // Helper: dado braço + idx interno + total interno, retorna posição
  function pos_braco(nome_braco, idx, total, raio_local){
    const b = BRACOS[nome_braco];
    if(!b) return [0,0,0];
    const rad = b.angulo * Math.PI / 180;
    // Direção do braço (a partir do centro)
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    // Posição base do braço (centro do "ramo")
    const cx = dx * b.dist_base;
    const cy = dy * b.dist_base;
    // Dentro do braço, espalha em pequeno cluster (perpendicular)
    const ang_local = (idx / Math.max(1, total)) * Math.PI * 2;
    const px = cx + Math.cos(ang_local) * raio_local;
    const py = cy + Math.sin(ang_local) * raio_local * 0.6;
    return [px, py, b.z + Math.sin(ang_local) * 5];
  }
  
  // 5) ATENÇÃO EXECUTIVA — topo absoluto (sobre tudo)
  if(V112.subredes.B_atencao){
    const c = v112_node_by_id(V112.subredes.B_atencao.id);
    if(c){
      c.pos = [0, 0, 130];
      for(let s = 0; s < (V112.subredes.B_atencao.satelites || []).length; s++){
        const sat = v112_node_by_id(V112.subredes.B_atencao.satelites[s]);
        if(sat){
          const sa = (s / 8) * Math.PI * 2;
          sat.pos = [Math.cos(sa) * 10, Math.sin(sa) * 10, 130];
        }
      }
    }
  }
  
  // 6) BRAÇO LING — Hemisfério linguístico
  const subredes_ling = ['B_bidir','B_link','B_silencio','B_orfao','B_salto','B_analogia'];
  let idx_ling = 0;
  for(const nome of subredes_ling){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        central.pos = pos_braco('LING', idx_ling, subredes_ling.length, 30);
        for(let s = 0; s < (V112.subredes[nome].satelites || []).length; s++){
          const sat = v112_node_by_id(V112.subredes[nome].satelites[s]);
          if(sat){
            const sa = (s / 8) * Math.PI * 2;
            sat.pos = [central.pos[0] + Math.cos(sa) * 7, central.pos[1] + Math.sin(sa) * 7, central.pos[2]];
          }
        }
        idx_ling++;
      }
    }
  }
  if(V112.hemisferios.H_LING){
    const n = v112_node_by_id(V112.hemisferios.H_LING);
    if(n) n.pos = pos_braco('LING', 0, 1, 0);  // Centro do braço LING
  }
  
  // 7) BRAÇO MAT — Hemisfério matemático
  const subredes_mat = ['B_logico','B_contra','B_silogismo','B_quantif','B_excecoes','B_paradoxo','B_temporal'];
  let idx_mat = 0;
  for(const nome of subredes_mat){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        central.pos = pos_braco('MAT', idx_mat, subredes_mat.length, 30);
        for(let s = 0; s < (V112.subredes[nome].satelites || []).length; s++){
          const sat = v112_node_by_id(V112.subredes[nome].satelites[s]);
          if(sat){
            const sa = (s / 8) * Math.PI * 2;
            sat.pos = [central.pos[0] + Math.cos(sa) * 7, central.pos[1] + Math.sin(sa) * 7, central.pos[2]];
          }
        }
        idx_mat++;
      }
    }
  }
  if(V112.hemisferios.H_MAT){
    const n = v112_node_by_id(V112.hemisferios.H_MAT);
    if(n) n.pos = pos_braco('MAT', 0, 1, 0);
  }
  
  // 8) BRAÇO PFC — em cima, à frente
  const subredes_pfc = ['B_planejamento','B_objetivo','B_prioridade','B_controle_exec'];
  let idx_pfc = 0;
  for(const nome of subredes_pfc){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        central.pos = pos_braco('PFC', idx_pfc, subredes_pfc.length, 25);
        for(let s = 0; s < (V112.subredes[nome].satelites || []).length; s++){
          const sat = v112_node_by_id(V112.subredes[nome].satelites[s]);
          if(sat){
            const sa = (s / 8) * Math.PI * 2;
            sat.pos = [central.pos[0] + Math.cos(sa) * 6, central.pos[1] + Math.sin(sa) * 6, central.pos[2]];
          }
        }
        idx_pfc++;
      }
    }
  }
  
  // 9) BRAÇO DMN — atrás, em cima
  const subredes_dmn = ['B_identidade','B_simulacao','B_autobiografia'];
  let idx_dmn = 0;
  for(const nome of subredes_dmn){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        central.pos = pos_braco('DMN', idx_dmn, subredes_dmn.length, 22);
        for(let s = 0; s < (V112.subredes[nome].satelites || []).length; s++){
          const sat = v112_node_by_id(V112.subredes[nome].satelites[s]);
          if(sat){
            const sa = (s / 8) * Math.PI * 2;
            sat.pos = [central.pos[0] + Math.cos(sa) * 6, central.pos[1] + Math.sin(sa) * 6, central.pos[2]];
          }
        }
        idx_dmn++;
      }
    }
  }
  
  // 10) BRAÇO LIMB — Sistema Límbico (amígdala + GABA anel próximo)
  for(let i = 0; i < V112.amigdala.length; i++){
    const n = v112_node_by_id(V112.amigdala[i]);
    if(!n) continue;
    const ang = (i / V112.amigdala.length) * Math.PI * 2;
    n.pos = pos_braco('LIMB', i, V112.amigdala.length, 20);
    // Aproximação: anel em torno do centro do braço LIMB
    const b = BRACOS.LIMB;
    const rad = b.angulo * Math.PI / 180;
    const cx = Math.cos(rad) * b.dist_base;
    const cy = Math.sin(rad) * b.dist_base;
    n.pos = [cx + Math.cos(ang) * 22, cy + Math.sin(ang) * 18, b.z + Math.sin(ang) * 3];
  }
  for(let i = 0; i < V112.gaba.length; i++){
    const n = v112_node_by_id(V112.gaba[i]);
    if(!n) continue;
    const ang = (i / V112.gaba.length) * Math.PI * 2;
    const b = BRACOS.LIMB;
    const rad = b.angulo * Math.PI / 180;
    const cx = Math.cos(rad) * (b.dist_base - 20);
    const cy = Math.sin(rad) * (b.dist_base - 20);
    n.pos = [cx + Math.cos(ang) * 10, cy + Math.sin(ang) * 10, b.z + 8];
  }
  
  // 11) BRAÇO SOLVER (135°) — B_solver
  if(V112.subredes.B_solver){
    const c = v112_node_by_id(V112.subredes.B_solver.id);
    if(c) c.pos = pos_braco('SOLVER', 0, 1, 0);
    for(let s = 0; s < (V112.subredes.B_solver.satelites || []).length; s++){
      const sat = v112_node_by_id(V112.subredes.B_solver.satelites[s]);
      if(sat){
        const sa = (s / 8) * Math.PI * 2;
        sat.pos = [c.pos[0] + Math.cos(sa) * 8, c.pos[1] + Math.sin(sa) * 8, c.pos[2]];
      }
    }
  }
  
  // 11b) BRAÇO WORLD (45°) — B_prob (pra futuro WORLD_MODEL)
  if(V112.subredes.B_prob){
    const c = v112_node_by_id(V112.subredes.B_prob.id);
    if(c) c.pos = pos_braco('WORLD', 0, 1, 0);
    for(let s = 0; s < (V112.subredes.B_prob.satelites || []).length; s++){
      const sat = v112_node_by_id(V112.subredes.B_prob.satelites[s]);
      if(sat){
        const sa = (s / 8) * Math.PI * 2;
        sat.pos = [c.pos[0] + Math.cos(sa) * 8, c.pos[1] + Math.sin(sa) * 8, c.pos[2]];
      }
    }
  }
  
  // 12) META (SUB_B, SUB_SUB_B) — braço discreto
  const subredes_meta = ['SUB_B','SUB_SUB_B'];
  let idx_meta = 0;
  for(const nome of subredes_meta){
    if(V112.subredes[nome]){
      const central = v112_node_by_id(V112.subredes[nome].id);
      if(central){
        central.pos = pos_braco('META', idx_meta, subredes_meta.length, 12);
        idx_meta++;
      }
    }
  }
  
  // 13) CÓRTEX — distribuído entre os 2 cones principais (LING + MAT)
  // Mas com elevação variada pra encher os "ramos"
  const meio = Math.floor(V112.cortex.length / 2);
  for(let i = 0; i < V112.cortex.length; i++){
    const n = v112_node_by_id(V112.cortex[i]);
    if(!n) continue;
    const eh_ling = i < meio;
    const idx_local = eh_ling ? i : (i - meio);
    const tam = eh_ling ? meio : (V112.cortex.length - meio);
    const t = (idx_local % 40) / 40;
    const raio_cone = 25 + t * 60;  // abre indo pra fora
    const z_cone = -25 + (Math.random() - 0.5) * 40;
    const ang = (idx_local / tam) * Math.PI * 2;
    const centro_x = eh_ling ? -140 : 140;
    n.pos = [centro_x + Math.cos(ang) * raio_cone, Math.sin(ang) * raio_cone, z_cone];
  }
  
  // 14) GRAMÁTICA — anel próximo ao Self-Core
  if(V112.gramatica){
    let idx_g = 0;
    const palavras = Object.values(V112.gramatica);
    for(const id of palavras){
      const n = v112_node_by_id(id);
      if(n){
        const ang = (idx_g / palavras.length) * Math.PI * 2;
        n.pos = [Math.cos(ang) * 10, Math.sin(ang) * 10, 0];
        idx_g++;
      }
    }
  }
  
  // 15) OPERADORES — distribuídos nos braços corretos
  if(V112.operadores){
    const ops_mat = ['OP_ADD','OP_SUB','OP_MUL','OP_DIV','OP_MAIOR','OP_MENOR','OP_MAIOR_E','OP_MENOR_E'];
    let i_m = 0, i_l = 0;
    for(const [nome, id] of Object.entries(V112.operadores)){
      const n = v112_node_by_id(id);
      if(!n) continue;
      const eh_mat = ops_mat.includes(nome);
      const b = eh_mat ? BRACOS.MAT : BRACOS.LING;
      const rad = b.angulo * Math.PI / 180;
      const cx = Math.cos(rad) * (b.dist_base - 30);
      const cy = Math.sin(rad) * (b.dist_base - 30);
      const idx = eh_mat ? i_m++ : i_l++;
      const total = eh_mat ? ops_mat.length : 6;
      const ang = (idx / total) * Math.PI * 2;
      n.pos = [cx + Math.cos(ang) * 12, cy + Math.sin(ang) * 12, -15];
    }
  }
  
  // 16) PALAVRAS SENSORIAIS — pra ponta do braço correspondente
  for(const n of V112.nodes){
    if(n.camada !== 'sensorial' || !n.text) continue;
    const eh_numero = /^-?\d+(\.\d+)?$/.test(n.text);
    const eh_operador = /^[+\-*\/=<>!]$/.test(n.text);
    const b = (eh_numero || eh_operador) ? BRACOS.MAT : BRACOS.LING;
    const rad = b.angulo * Math.PI / 180;
    const cx = Math.cos(rad) * (b.dist_base + 30);
    const cy = Math.sin(rad) * (b.dist_base + 30);
    const ang = Math.random() * Math.PI * 2;
    const raio = 15 + Math.random() * 40;
    n.pos = [cx + Math.cos(ang) * raio, cy + Math.sin(ang) * raio, b.z + (Math.random() - 0.5) * 50];
  }
  
  V112._node_cache = null;
  V112._node_cache_size = 0;
  
  return {
    ok: true,
    info: 'Estrutura em ÁRVORE RADIAL: Self-Core no centro, 8 braços orbitais (LING/MAT/PFC/DMN/LIMB/WORLD/SOLVER/META) + Atenção no topo + tronco vertical (entrada→saída)'
  };
}

window.v112_reposicionar_em_arvore = v112_reposicionar_em_arvore;
window.v112_reposicionar_em_Y = v112_reposicionar_em_Y;

window.v112_seed = v112_seed;

// ═══════════════════════════════════════════════════════════════
// LAB 13.3 — B_SOLVER: Constraint Satisfaction + Backtracking
// 
// Resolve puzzles tipo Einstein:
//   - Variáveis: [Ana, Bruno, Carla] cada uma tem cor/casa/pet
//   - Domínios: {azul, verde, vermelho}
//   - Restrições: "Ana tem casa azul", "quem tem gato mora ao lado de Bruno"
//
// Uso:
//   v112_solver_einstein({
//     vars: ['ana','bruno','carla'],
//     dominios: {cor: ['azul','verde','vermelho']},
//     restricoes: [
//       {var: 'ana', atrib: 'cor', val: 'azul'},
//       {nao: {var: 'bruno', atrib: 'cor', val: 'verde'}},
//     ]
//   })
// ═══════════════════════════════════════════════════════════════
function v112_solver_einstein(spec){
  // spec = {vars, atribs, dominios, restricoes}
  // Cada var tem N atributos. Cada atributo tem domínio único (cada valor usado 1 vez)
  // Restrições: {var, atrib, val} (positiva) ou {nao: {...}} (negativa) ou {prox: {a,b}} (adjacentes)
  if(!spec || !spec.vars || !spec.dominios) return {ok: false, motivo: 'spec inválida'};
  
  const vars = spec.vars;
  const atribs = spec.atribs || Object.keys(spec.dominios);
  const dominios = spec.dominios;  // {cor: [...], casa: [...], pet: [...]}
  const restricoes = spec.restricoes || [];
  
  // Estado: {var → {atrib → val}}
  const estado = {};
  for(const v of vars) estado[v] = {};
  
  // Helper: checa se atribuição satisfaz restrições conhecidas
  function viola(estado, varAtual, atrib, val){
    for(const r of restricoes){
      if(r.var === varAtual && r.atrib === atrib){
        if(r.val !== val) return true;  // restrição positiva violada
      }
      if(r.nao && r.nao.var === varAtual && r.nao.atrib === atrib){
        if(r.nao.val === val) return true;  // restrição negativa violada
      }
    }
    // Cada valor de domínio só pode ser usado UMA VEZ
    for(const outraVar of vars){
      if(outraVar !== varAtual && estado[outraVar][atrib] === val) return true;
    }
    return false;
  }
  
  // Backtracking recursivo
  function bt(idxVar, idxAtrib){
    if(idxVar >= vars.length) return true;  // todos atribuídos
    const varAtual = vars[idxVar];
    if(idxAtrib >= atribs.length){
      return bt(idxVar + 1, 0);  // próxima variável
    }
    const atrib = atribs[idxAtrib];
    const dominio = dominios[atrib] || [];
    for(const val of dominio){
      if(!viola(estado, varAtual, atrib, val)){
        estado[varAtual][atrib] = val;
        if(bt(idxVar, idxAtrib + 1)) return true;
        delete estado[varAtual][atrib];
      }
    }
    return false;
  }
  
  const ok = bt(0, 0);
  return {ok, solucao: ok ? estado : null};
}
window.v112_solver_einstein = v112_solver_einstein;

// ═══════════════════════════════════════════════════════════════
// LAB 13.3 — B_PROB: Pesos de Confiança nas arestas
//
// Cada aresta B_logico ganha um peso 0.0-1.0 que cresce com confirmações
// e decai com contradições.
// ═══════════════════════════════════════════════════════════════
function v112_prob_atualizar(inst, val, confirmacao){
  // confirmacao = true (peso sobe), false (peso desce)
  const sr = V112.subredes && V112.subredes.B_prob;
  if(!sr) return;
  const c = v112_node_by_id(sr.id);
  if(!c) return;
  if(!c._confiancas) c._confiancas = {};
  const chave = inst + '→' + val;
  const atual = c._confiancas[chave] || 0.5;  // começa neutro
  const delta = confirmacao ? 0.1 : -0.2;     // contradição pesa mais
  c._confiancas[chave] = Math.max(0, Math.min(1, atual + delta));
  c._ativacoes = (c._ativacoes||0)+1;
  if(confirmacao) c._sucessos = (c._sucessos||0)+1;
  return c._confiancas[chave];
}
function v112_prob_consultar(inst, val){
  const sr = V112.subredes && V112.subredes.B_prob;
  if(!sr) return null;
  const c = v112_node_by_id(sr.id);
  if(!c || !c._confiancas) return null;
  return c._confiancas[inst + '→' + val] || null;
}
window.v112_prob_atualizar = v112_prob_atualizar;
window.v112_prob_consultar = v112_prob_consultar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.4 — B_COMPOSITOR: une regras existentes em runtime
// Se sabe A→B e B→C, gera A→C automaticamente
// Se sabe "chove→molha" e "gelo→escorrega", quando input é "chove e gelo",
//   retorna combinação dos efeitos
// ═══════════════════════════════════════════════════════════════
function v112_compor_regras(antecedentes){
  // antecedentes = ['chove', 'gelo']
  // Para cada antecedente, busca consequentes em B_logico._cadeia E B_silogismo._condicionais E B_causal._causa_de
  // Retorna união de todos os efeitos
  const sr_log = V112.subredes && V112.subredes.B_logico;
  const sr_sil = V112.subredes && V112.subredes.B_silogismo;
  const sr_cau = V112.subredes && V112.subredes.B_causal;
  const efeitos_compostos = new Set();
  const trace = [];
  
  for(const ant of antecedentes){
    // B_silogismo: "se X então Y"
    if(sr_sil){
      const c = v112_node_by_id(sr_sil.id);
      if(c && c._condicionais && c._condicionais[ant]){
        for(const ef of c._condicionais[ant]){
          efeitos_compostos.add(ef);
          trace.push(ant+' →[sil] '+ef);
        }
      }
    }
    // B_causal: "X causa Y"
    if(sr_cau){
      const c = v112_node_by_id(sr_cau.id);
      if(c && c._causa_de && c._causa_de[ant]){
        for(const ef of c._causa_de[ant]){
          efeitos_compostos.add(ef);
          trace.push(ant+' →[cau] '+ef);
        }
      }
    }
    // B_logico: cadeia direta (fallback)
    if(sr_log){
      const c = v112_node_by_id(sr_log.id);
      if(c && c._cadeia && c._cadeia[ant]){
        for(const ef of c._cadeia[ant]){
          // Só adiciona se NÃO é tipo categoria (palavras conhecidas como "animal", "vivo")
          // Heurística: efeitos compostos são verbos/estados (molha, escorrega, quebra)
          efeitos_compostos.add(ef);
          trace.push(ant+' →[log] '+ef);
        }
      }
    }
  }
  
  // Registra no B_compositor
  const sr_c = V112.subredes && V112.subredes.B_compositor;
  if(sr_c){
    const c = v112_node_by_id(sr_c.id);
    if(c){
      if(!c._composicoes) c._composicoes = [];
      c._composicoes.push({antecedentes, efeitos: Array.from(efeitos_compostos), trace, turno: V112.turn});
      if(c._composicoes.length > 30) c._composicoes.shift();
      c._ativacoes = (c._ativacoes||0)+1;
      if(efeitos_compostos.size > 0) c._sucessos = (c._sucessos||0)+1;
    }
  }
  return {efeitos: Array.from(efeitos_compostos), trace};
}
window.v112_compor_regras = v112_compor_regras;

// ═══════════════════════════════════════════════════════════════
// LAB 13.4 — B_INDUTOR: detecta padrão em pares (entrada,saída)
// Ex: (2,'11'), (5,'11111'), (7,'1111111') → padrão "n vezes '1'"
// Aplica em novas entradas: 4 → '1111'
// ═══════════════════════════════════════════════════════════════
function v112_indutor_aprender(pares){
  // pares = [{in: 2, out: '11'}, {in: 5, out: '11111'}, ...]
  // Detecta padrão. Retorna função que aplica em nova entrada.
  if(!pares || pares.length < 1) return null;
  // LAB 13.8: aceita 1 par se for repetição clara (n→char×n)
  if(pares.length === 1){
    const p = pares[0];
    const outStr = String(p.out);
    const inNum = Number(p.in);
    if(isNaN(inNum) || inNum < 1) return null;
    if(outStr.length % inNum !== 0) return null;
    const k = outStr.length / inNum;
    const ch = outStr[0];
    for(let i = 0; i < outStr.length; i++){
      if(outStr[i] !== ch) return null;
    }
    const regra = {tipo: 'repeticao', k, char: ch};
    const sr = V112.subredes && V112.subredes.B_indutor;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        if(!c._regras_aprendidas) c._regras_aprendidas = [];
        c._regras_aprendidas.push({pares, regra, turno: V112.turn});
        c._ativacoes = (c._ativacoes||0)+1;
        c._sucessos = (c._sucessos||0)+1;
        c._ultimo_padrao = regra;
      }
    }
    return regra;
  }
  
  // Padrão 1: out = string repetida n vezes
  // out.length === in × k para algum k constante?
  let k_const = null;
  let char_const = null;
  let padrao_repete = true;
  for(const p of pares){
    const outStr = String(p.out);
    const inNum = Number(p.in);
    if(isNaN(inNum) || inNum < 1){ padrao_repete = false; break; }
    if(outStr.length % inNum !== 0){ padrao_repete = false; break; }
    const k = outStr.length / inNum;
    if(k_const === null) k_const = k;
    else if(k_const !== k){ padrao_repete = false; break; }
    // Detecta char repetido
    const ch = outStr[0];
    for(let i = 0; i < outStr.length; i++){
      if(outStr[i] !== ch){ padrao_repete = false; break; }
    }
    if(!padrao_repete) break;
    if(char_const === null) char_const = ch;
    else if(char_const !== ch){ padrao_repete = false; break; }
  }
  
  if(padrao_repete && k_const && char_const){
    const regra = {tipo: 'repeticao', k: k_const, char: char_const};
    // Salva no B_indutor
    const sr = V112.subredes && V112.subredes.B_indutor;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        if(!c._regras_aprendidas) c._regras_aprendidas = [];
        c._regras_aprendidas.push({pares, regra, turno: V112.turn});
        c._ativacoes = (c._ativacoes||0)+1;
        c._sucessos = (c._sucessos||0)+1;
        c._ultimo_padrao = regra;
      }
    }
    return regra;
  }
  
  // Padrão 2: out = in + k (incremento constante)
  let delta_const = null;
  let padrao_delta = true;
  for(const p of pares){
    const a = Number(p.in), b = Number(p.out);
    if(isNaN(a) || isNaN(b)){ padrao_delta = false; break; }
    const d = b - a;
    if(delta_const === null) delta_const = d;
    else if(delta_const !== d){ padrao_delta = false; break; }
  }
  if(padrao_delta && delta_const !== null){
    const regra = {tipo: 'soma', delta: delta_const};
    const sr = V112.subredes && V112.subredes.B_indutor;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        if(!c._regras_aprendidas) c._regras_aprendidas = [];
        c._regras_aprendidas.push({pares, regra, turno: V112.turn});
        c._ativacoes = (c._ativacoes||0)+1;
        c._sucessos = (c._sucessos||0)+1;
        c._ultimo_padrao = regra;
      }
    }
    return regra;
  }
  
  // Padrão 3: out = in × k (múltiplo constante)
  let fator_const = null;
  let padrao_mult = true;
  for(const p of pares){
    const a = Number(p.in), b = Number(p.out);
    if(isNaN(a) || isNaN(b) || a === 0){ padrao_mult = false; break; }
    const f = b / a;
    if(fator_const === null) fator_const = f;
    else if(Math.abs(fator_const - f) > 0.001){ padrao_mult = false; break; }
  }
  if(padrao_mult && fator_const !== null){
    const regra = {tipo: 'multiplicacao', fator: fator_const};
    const sr = V112.subredes && V112.subredes.B_indutor;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        if(!c._regras_aprendidas) c._regras_aprendidas = [];
        c._regras_aprendidas.push({pares, regra, turno: V112.turn});
        c._ativacoes = (c._ativacoes||0)+1;
        c._sucessos = (c._sucessos||0)+1;
        c._ultimo_padrao = regra;
      }
    }
    return regra;
  }
  
  return null;  // Nenhum padrão detectado
}
function v112_indutor_aplicar(regra, entrada){
  if(!regra) return null;
  if(regra.tipo === 'repeticao'){
    const n = Number(entrada);
    if(isNaN(n) || n < 0) return null;
    return regra.char.repeat(n * regra.k);
  }
  if(regra.tipo === 'soma'){
    const n = Number(entrada);
    if(isNaN(n)) return null;
    return n + regra.delta;
  }
  if(regra.tipo === 'multiplicacao'){
    const n = Number(entrada);
    if(isNaN(n)) return null;
    return n * regra.fator;
  }
  return null;
}
window.v112_indutor_aprender = v112_indutor_aprender;
window.v112_indutor_aplicar = v112_indutor_aplicar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.4 — B_SIMULADOR: simulação física simbólica
// Estado: {variáveis} + regras de atualização por tick
// Ex: vela = {comprimento: 60, taxa: 1, lados: 1} → 60 ticks até zerar
//     vela com 2 lados → 30 ticks
// ═══════════════════════════════════════════════════════════════
function v112_simular(estado_inicial, regras_tick, max_ticks){
  // estado_inicial = {comprimento: 60, taxa: 1, lados: 1}
  // regras_tick = funções que mutam o estado por tick
  // condicao_parar = quando 'comprimento <= 0'
  max_ticks = max_ticks || 10000;
  let estado = JSON.parse(JSON.stringify(estado_inicial));
  let ticks = 0;
  const historico = [JSON.parse(JSON.stringify(estado))];
  
  while(ticks < max_ticks){
    // Aplica todas as regras
    let parou = false;
    for(const regra of regras_tick){
      const ret = regra(estado);
      if(ret === 'PARAR'){ parou = true; break; }
    }
    if(parou) break;
    ticks++;
    if(ticks % 100 === 0 || ticks === max_ticks) historico.push(JSON.parse(JSON.stringify(estado)));
  }
  
  const sr = V112.subredes && V112.subredes.B_simulador;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      if(!c._simulacoes) c._simulacoes = [];
      c._simulacoes.push({estado_inicial, ticks, estado_final: estado, turno: V112.turn});
      if(c._simulacoes.length > 20) c._simulacoes.shift();
      c._ativacoes = (c._ativacoes||0)+1;
      c._sucessos = (c._sucessos||0)+1;
    }
  }
  return {ticks, estado_final: estado, historico};
}

// Helper: simular vela queimando
function v112_simular_vela(comprimento, taxa, lados){
  const r = v112_simular(
    {comprimento, taxa, lados},
    [(s) => {
      s.comprimento -= s.taxa * s.lados;
      if(s.comprimento <= 0){ s.comprimento = 0; return 'PARAR'; }
    }],
    100000
  );
  // Off-by-one: o tick que faz comprimento chegar a 0 também conta
  r.ticks = r.ticks + 1;
  return r;
}
window.v112_simular = v112_simular;
window.v112_simular_vela = v112_simular_vela;

// ═══════════════════════════════════════════════════════════════
// LAB 13.4 — B_CAUSAL: grafo causa→efeito separado de categoria
// "vidro_cai causa vidro_quebra" (não é "vidro é causa")
// Propaga transitivamente: A causa B, B causa C → A causa C
// ═══════════════════════════════════════════════════════════════
function v112_causal_indexar(causa, efeito){
  const sr = V112.subredes && V112.subredes.B_causal;
  if(!sr) return;
  const c = v112_node_by_id(sr.id);
  if(!c) return;
  if(!c._causa_de) c._causa_de = {};
  if(!c._efeito_de) c._efeito_de = {};
  if(!c._causa_de[causa]) c._causa_de[causa] = new Set();
  c._causa_de[causa].add(efeito);
  if(!c._efeito_de[efeito]) c._efeito_de[efeito] = new Set();
  c._efeito_de[efeito].add(causa);
  c._ativacoes = (c._ativacoes||0)+1;
}
function v112_causal_consultar(causa){
  const sr = V112.subredes && V112.subredes.B_causal;
  if(!sr) return [];
  const c = v112_node_by_id(sr.id);
  if(!c || !c._causa_de) return [];
  // BFS transitivo com detecção de ciclos
  const efeitos = new Set();
  const fila = [{no: causa, caminho: [causa]}];
  const vis = new Set([causa]);
  const ciclos_aqui = [];
  while(fila.length > 0){
    const {no, caminho} = fila.shift();
    const set = c._causa_de[no];
    if(!set) continue;
    for(const y of set){
      // LAB 13.10: detecta ciclo (y já está no caminho)
      if(caminho.includes(y)){
        const idx = caminho.indexOf(y);
        ciclos_aqui.push(caminho.slice(idx).concat([y]));
        continue;  // não propaga
      }
      efeitos.add(y);
      if(!vis.has(y)){
        vis.add(y);
        fila.push({no: y, caminho: [...caminho, y]});
      }
    }
  }
  // Registra ciclos
  if(ciclos_aqui.length > 0){
    const sr_ci = V112.subredes && V112.subredes.B_ciclo;
    if(sr_ci){
      const cci = v112_node_by_id(sr_ci.id);
      if(cci){
        if(!cci._ciclos_detectados) cci._ciclos_detectados = [];
        cci._ciclos_detectados.push(...ciclos_aqui);
        if(cci._ciclos_detectados.length > 50) cci._ciclos_detectados.splice(0, cci._ciclos_detectados.length - 50);
        cci._ativacoes = (cci._ativacoes||0)+1;
        cci._sucessos = (cci._sucessos||0)+1;
      }
    }
  }
  return Array.from(efeitos);
}
window.v112_causal_indexar = v112_causal_indexar;
window.v112_causal_consultar = v112_causal_consultar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.4 — B_ARBITRO: resolve conflitos entre sub-redes
// Recebe respostas candidatas {origem, resposta, peso} → escolhe melhor OU funde
// ═══════════════════════════════════════════════════════════════
function v112_arbitrar(candidatos){
  // candidatos = [{origem: 'B_logico', resposta: 'animal', peso: 0.8}, ...]
  if(!candidatos || candidatos.length === 0) return null;
  if(candidatos.length === 1) return candidatos[0];
  
  // Ordena por peso
  candidatos.sort((a,b) => b.peso - a.peso);
  
  // Se top 2 têm peso similar (diff < 0.2), FUNDE
  if(candidatos.length >= 2 && (candidatos[0].peso - candidatos[1].peso) < 0.2){
    const fundido = {
      origem: 'B_arbitro_fusao',
      resposta: candidatos[0].resposta + ' | ' + candidatos[1].resposta,
      peso: (candidatos[0].peso + candidatos[1].peso) / 2,
      origens: [candidatos[0].origem, candidatos[1].origem]
    };
    // Registra
    const sr = V112.subredes && V112.subredes.B_arbitro;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        if(!c._arbitragens) c._arbitragens = [];
        c._arbitragens.push({candidatos, vencedor: fundido, turno: V112.turn});
        if(c._arbitragens.length > 30) c._arbitragens.shift();
        c._ativacoes = (c._ativacoes||0)+1;
        c._sucessos = (c._sucessos||0)+1;
      }
    }
    return fundido;
  }
  
  // Senão retorna o de maior peso
  const sr = V112.subredes && V112.subredes.B_arbitro;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      if(!c._arbitragens) c._arbitragens = [];
      c._arbitragens.push({candidatos, vencedor: candidatos[0], turno: V112.turn});
      c._ativacoes = (c._ativacoes||0)+1;
    }
  }
  return candidatos[0];
}
window.v112_arbitrar = v112_arbitrar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.5 — B_ALGEBRA: variáveis + equações 1º e 2º grau
// ═══════════════════════════════════════════════════════════════

// Tabela de variáveis (persiste no Self-Core via subrede)
function v112_algebra_definir(nome_var, valor){
  const sr = V112.subredes && V112.subredes.B_algebra;
  if(!sr) return;
  const c = v112_node_by_id(sr.id);
  if(!c) return;
  if(!c._variaveis) c._variaveis = {};
  c._variaveis[nome_var] = valor;
  c._ativacoes = (c._ativacoes||0)+1;
}
function v112_algebra_consultar(nome_var){
  const sr = V112.subredes && V112.subredes.B_algebra;
  if(!sr) return null;
  const c = v112_node_by_id(sr.id);
  if(!c || !c._variaveis) return null;
  return c._variaveis[nome_var];
}

// Substitui variáveis na expressão (x → 5)
function v112_algebra_substituir(expr){
  const sr = V112.subredes && V112.subredes.B_algebra;
  if(!sr) return expr;
  const c = v112_node_by_id(sr.id);
  if(!c || !c._variaveis) return expr;
  let r = expr;
  // Substitui cada variável conhecida (boundary)
  for(const [nome, val] of Object.entries(c._variaveis)){
    // Substitui "2x" → "2*5", "x" → "5"
    const re = new RegExp('(\\d)' + nome + '(?![a-z])', 'g');
    r = r.replace(re, '$1*' + val);
    const re2 = new RegExp('(?<![a-z])' + nome + '(?![a-z])', 'g');
    r = r.replace(re2, String(val));
  }
  return r;
}

// Resolve equação 1º grau: ax + b = c → x = (c-b)/a
// Aceita: "2x + 4 = 10", "3x = 12", "x + 7 = 15", "5 = 2x + 1"
function v112_algebra_1grau(expr){
  // Normaliza: remove espaços, troca "=" pra delimitador único
  let s = String(expr).toLowerCase().replace(/\s+/g, '');
  if(!s.includes('=')) return null;
  const partes = s.split('=');
  if(partes.length !== 2) return null;
  let [lhs, rhs] = partes;
  
  // Helper: parse "ax+b" → {a, b}
  // Aceita: "2x", "x", "-x", "2x+4", "2x-4", "4+2x", "4-2x", "x+4", "5"
  function parseLinear(s){
    if(!s) return {a:0,b:0};
    // Adiciona + na frente se começar com letra/dígito
    if(!/^[+\-]/.test(s)) s = '+' + s;
    let a = 0, b = 0;
    // Encontra todos os termos com sinal
    const re = /([+\-]\d*\.?\d*)([a-z])?/g;
    let m;
    while((m = re.exec(s)) !== null){
      let coef = m[1];
      const tem_var = !!m[2];
      // Termo só de sinal (ex: "+x") = +1
      if(coef === '+' || coef === '-') coef = coef + '1';
      if(coef === '') coef = '0';
      const v = parseFloat(coef);
      if(isNaN(v)) continue;
      if(tem_var) a += v;
      else b += v;
    }
    return {a, b};
  }
  
  const L = parseLinear(lhs);
  const R = parseLinear(rhs);
  // (L.a - R.a) * x + (L.b - R.b) = 0
  const A = L.a - R.a;
  const B = L.b - R.b;
  if(A === 0){
    if(B === 0) return {ok: true, infinitas: true, msg: 'qualquer x satisfaz'};
    return {ok: false, msg: 'sem solução (' + B + ' = 0)'};
  }
  const x = -B / A;
  const sr = V112.subredes && V112.subredes.B_algebra;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){ c._ativacoes = (c._ativacoes||0)+1; c._sucessos = (c._sucessos||0)+1; }
  }
  return {ok: true, x: x, descr: A + 'x + ' + B + ' = 0'};
}

// Resolve equação 2º grau: ax² + bx + c = 0 (Bhaskara)
// Aceita: "x² - 5x + 6 = 0", "x^2 + 2x = 8", "2x² - 8 = 0"
function v112_algebra_2grau(expr){
  let s = String(expr).toLowerCase().replace(/\s+/g, '').replace(/²/g, '^2').replace(/\*\*/g, '^');
  if(!s.includes('=')) return null;
  // Normaliza: passa tudo pra LHS = 0
  const partes = s.split('=');
  if(partes.length !== 2) return null;
  let [lhs, rhs] = partes;
  
  function parseQuad(s){
    if(!s) return {a:0,b:0,c:0};
    if(!/^[+\-]/.test(s)) s = '+' + s;
    let a = 0, b = 0, c = 0;
    // Encontra termos com x^2, x, ou constante
    // Padrão: sinal + coef + 'x' + (^2)?
    const re = /([+\-]\d*\.?\d*)([a-z](?:\^2)?)?/g;
    let m;
    while((m = re.exec(s)) !== null){
      let coef = m[1];
      const tail = m[2];
      if(coef === '+' || coef === '-') coef = coef + '1';
      if(coef === '') coef = '0';
      const v = parseFloat(coef);
      if(isNaN(v)) continue;
      if(!tail){ c += v; continue; }
      if(tail.includes('^2')){ a += v; continue; }
      b += v;
    }
    return {a, b, c};
  }
  
  const L = parseQuad(lhs);
  const R = parseQuad(rhs);
  const A = L.a - R.a;
  const B = L.b - R.b;
  const C = L.c - R.c;
  
  if(A === 0){
    // Cai pra 1º grau
    if(B === 0){
      if(C === 0) return {ok:true, infinitas:true, msg:'qualquer x'};
      return {ok:false, msg:'sem solução'};
    }
    return {ok:true, x1: -C/B, descr: '1º grau ('+A+'x²+'+B+'x+'+C+'=0)'};
  }
  
  // Bhaskara
  const delta = B*B - 4*A*C;
  const sr = V112.subredes && V112.subredes.B_algebra;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){ c._ativacoes = (c._ativacoes||0)+1; if(delta >= 0) c._sucessos = (c._sucessos||0)+1; }
  }
  if(delta < 0){
    return {ok:true, real:false, delta, msg: 'Δ = ' + delta + ' < 0 → sem raízes reais'};
  }
  if(delta === 0){
    const x = -B / (2*A);
    return {ok:true, real:true, delta, x1: x, msg: 'raiz dupla x = ' + x};
  }
  const sd = Math.sqrt(delta);
  const x1 = (-B + sd) / (2*A);
  const x2 = (-B - sd) / (2*A);
  // Formata pra inteiro se exato
  function fmt(n){
    if(Number.isInteger(n)) return String(n);
    if(Math.abs(n - Math.round(n)) < 0.0001) return String(Math.round(n));
    return n.toFixed(4).replace(/\.?0+$/,'');
  }
  return {ok:true, real:true, delta, x1, x2, formatado: {x1: fmt(x1), x2: fmt(x2), delta: fmt(delta)}};
}

window.v112_algebra_definir = v112_algebra_definir;
window.v112_algebra_consultar = v112_algebra_consultar;
window.v112_algebra_substituir = v112_algebra_substituir;
window.v112_algebra_1grau = v112_algebra_1grau;
window.v112_algebra_2grau = v112_algebra_2grau;

// ═══════════════════════════════════════════════════════════════
// LAB 13.5 — B_TRIGONOMETRIA
// ═══════════════════════════════════════════════════════════════
function v112_trig(funcao, angulo_graus){
  const rad = angulo_graus * Math.PI / 180;
  let res;
  if(funcao === 'sin' || funcao === 'sen' || funcao === 'seno') res = Math.sin(rad);
  else if(funcao === 'cos' || funcao === 'cosseno') res = Math.cos(rad);
  else if(funcao === 'tan' || funcao === 'tg' || funcao === 'tangente'){
    // tan de 90, 270 é indefinido
    if(Math.abs(angulo_graus % 180) === 90) return {ok:false, msg:'tan('+angulo_graus+'°) indefinido'};
    res = Math.tan(rad);
  }
  else return null;
  // Arredonda valores conhecidos (0, 0.5, √2/2, √3/2, 1)
  const known = [
    [0, '0'], [1, '1'], [-1, '-1'], [0.5, '1/2'], [-0.5, '-1/2'],
    [Math.sqrt(2)/2, '√2/2'], [-Math.sqrt(2)/2, '-√2/2'],
    [Math.sqrt(3)/2, '√3/2'], [-Math.sqrt(3)/2, '-√3/2'],
    [Math.sqrt(3), '√3'], [-Math.sqrt(3), '-√3'],
    [1/Math.sqrt(3), '√3/3'], [-1/Math.sqrt(3), '-√3/3']
  ];
  for(const [v, txt] of known){
    if(Math.abs(res - v) < 0.0001){
      const sr = V112.subredes && V112.subredes.B_trig;
      if(sr){ const c = v112_node_by_id(sr.id); if(c){c._ativacoes=(c._ativacoes||0)+1; c._sucessos=(c._sucessos||0)+1;} }
      return {ok:true, valor: res, exato: txt};
    }
  }
  const sr = V112.subredes && V112.subredes.B_trig;
  if(sr){ const c = v112_node_by_id(sr.id); if(c){c._ativacoes=(c._ativacoes||0)+1; c._sucessos=(c._sucessos||0)+1;} }
  return {ok:true, valor: res, aprox: res.toFixed(6).replace(/\.?0+$/,'')};
}
window.v112_trig = v112_trig;

// ═══════════════════════════════════════════════════════════════
// LAB 13.5 — B_MULTICTX: fusão de respostas de múltiplas sub-redes
// Retorna TODAS as dimensões conhecidas de uma palavra
// ═══════════════════════════════════════════════════════════════
function v112_multictx_consultar(palavra){
  const dimensoes = [];
  
  // Categoria (B_bidir)
  const sr_b = V112.subredes && V112.subredes.B_bidir;
  if(sr_b){
    const c = v112_node_by_id(sr_b.id);
    if(c && c._categorias_por_instancia && c._categorias_por_instancia[palavra]){
      const cats = Array.from(c._categorias_por_instancia[palavra]);
      if(cats.length > 0) dimensoes.push({tipo:'categoria', valor: cats.join(', ')});
    }
  }
  
  // Cadeia lógica
  const sr_l = V112.subredes && V112.subredes.B_logico;
  if(sr_l){
    const c = v112_node_by_id(sr_l.id);
    if(c && c._cadeia && c._cadeia[palavra]){
      const cad = Array.from(c._cadeia[palavra]);
      if(cad.length > 0) dimensoes.push({tipo:'cadeia', valor: cad.join('→')});
    }
  }
  
  // Temporal
  const sr_t = V112.subredes && V112.subredes.B_temporal;
  if(sr_t){
    const c = v112_node_by_id(sr_t.id);
    if(c && c._antes_de && c._antes_de[palavra]){
      const t = Array.from(c._antes_de[palavra]);
      if(t.length > 0) dimensoes.push({tipo:'menor_que', valor: t.join(', ')});
    }
  }
  
  // Causal
  const sr_c = V112.subredes && V112.subredes.B_causal;
  if(sr_c){
    const c = v112_node_by_id(sr_c.id);
    if(c && c._causa_de && c._causa_de[palavra]){
      const cau = Array.from(c._causa_de[palavra]);
      if(cau.length > 0) dimensoes.push({tipo:'causa', valor: cau.join(', ')});
    }
  }
  
  // Salto (traits)
  const sr_s = V112.subredes && V112.subredes.B_salto;
  if(sr_s){
    const c = v112_node_by_id(sr_s.id);
    if(c && c._objeto_para_traits && c._objeto_para_traits[palavra]){
      const tr = Array.from(c._objeto_para_traits[palavra]);
      if(tr.length > 0) dimensoes.push({tipo:'traits', valor: tr.join(', ')});
    }
  }
  
  // Registra
  const sr_m = V112.subredes && V112.subredes.B_multictx;
  if(sr_m){
    const c = v112_node_by_id(sr_m.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(dimensoes.length >= 2) c._sucessos = (c._sucessos||0)+1;
    }
  }
  
  return dimensoes;
}
window.v112_multictx_consultar = v112_multictx_consultar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.6 — B_QUIMICA: parser molecular + tabela periódica + balanceamento
// ═══════════════════════════════════════════════════════════════

// Tabela periódica — 60 elementos principais com massa atômica
const TABELA_PERIODICA = {
  // Símbolo → {nome, numero, massa}
  H:  {nome:'Hidrogênio',  numero: 1,  massa: 1.008},
  He: {nome:'Hélio',       numero: 2,  massa: 4.003},
  Li: {nome:'Lítio',       numero: 3,  massa: 6.941},
  Be: {nome:'Berílio',     numero: 4,  massa: 9.012},
  B:  {nome:'Boro',        numero: 5,  massa: 10.811},
  C:  {nome:'Carbono',     numero: 6,  massa: 12.011},
  N:  {nome:'Nitrogênio',  numero: 7,  massa: 14.007},
  O:  {nome:'Oxigênio',    numero: 8,  massa: 15.999},
  F:  {nome:'Flúor',       numero: 9,  massa: 18.998},
  Ne: {nome:'Neônio',      numero: 10, massa: 20.180},
  Na: {nome:'Sódio',       numero: 11, massa: 22.990},
  Mg: {nome:'Magnésio',    numero: 12, massa: 24.305},
  Al: {nome:'Alumínio',    numero: 13, massa: 26.982},
  Si: {nome:'Silício',     numero: 14, massa: 28.086},
  P:  {nome:'Fósforo',     numero: 15, massa: 30.974},
  S:  {nome:'Enxofre',     numero: 16, massa: 32.065},
  Cl: {nome:'Cloro',       numero: 17, massa: 35.453},
  Ar: {nome:'Argônio',     numero: 18, massa: 39.948},
  K:  {nome:'Potássio',    numero: 19, massa: 39.098},
  Ca: {nome:'Cálcio',      numero: 20, massa: 40.078},
  Sc: {nome:'Escândio',    numero: 21, massa: 44.956},
  Ti: {nome:'Titânio',     numero: 22, massa: 47.867},
  V:  {nome:'Vanádio',     numero: 23, massa: 50.942},
  Cr: {nome:'Cromo',       numero: 24, massa: 51.996},
  Mn: {nome:'Manganês',    numero: 25, massa: 54.938},
  Fe: {nome:'Ferro',       numero: 26, massa: 55.845},
  Co: {nome:'Cobalto',     numero: 27, massa: 58.933},
  Ni: {nome:'Níquel',      numero: 28, massa: 58.693},
  Cu: {nome:'Cobre',       numero: 29, massa: 63.546},
  Zn: {nome:'Zinco',       numero: 30, massa: 65.380},
  Ga: {nome:'Gálio',       numero: 31, massa: 69.723},
  Ge: {nome:'Germânio',    numero: 32, massa: 72.640},
  As: {nome:'Arsênio',     numero: 33, massa: 74.922},
  Se: {nome:'Selênio',     numero: 34, massa: 78.960},
  Br: {nome:'Bromo',       numero: 35, massa: 79.904},
  Kr: {nome:'Criptônio',   numero: 36, massa: 83.798},
  Rb: {nome:'Rubídio',     numero: 37, massa: 85.468},
  Sr: {nome:'Estrôncio',   numero: 38, massa: 87.620},
  Y:  {nome:'Ítrio',       numero: 39, massa: 88.906},
  Zr: {nome:'Zircônio',    numero: 40, massa: 91.224},
  Ag: {nome:'Prata',       numero: 47, massa: 107.868},
  Cd: {nome:'Cádmio',      numero: 48, massa: 112.411},
  Sn: {nome:'Estanho',     numero: 50, massa: 118.710},
  I:  {nome:'Iodo',        numero: 53, massa: 126.904},
  Xe: {nome:'Xenônio',     numero: 54, massa: 131.293},
  Cs: {nome:'Césio',       numero: 55, massa: 132.905},
  Ba: {nome:'Bário',       numero: 56, massa: 137.327},
  W:  {nome:'Tungstênio',  numero: 74, massa: 183.840},
  Pt: {nome:'Platina',     numero: 78, massa: 195.084},
  Au: {nome:'Ouro',        numero: 79, massa: 196.967},
  Hg: {nome:'Mercúrio',    numero: 80, massa: 200.590},
  Pb: {nome:'Chumbo',      numero: 82, massa: 207.200},
  Bi: {nome:'Bismuto',     numero: 83, massa: 208.980},
  U:  {nome:'Urânio',      numero: 92, massa: 238.029},
};

// Parser molecular: "H2O" → {H:2, O:1}
// Aceita: H2O, C6H12O6, Ca(OH)2, Al2(SO4)3, NaCl, H2SO4
function v112_quimica_parse(formula){
  if(!formula || typeof formula !== 'string') return null;
  const f = formula.replace(/\s+/g, '').trim();
  if(!f) return null;
  
  // Parser recursivo que lida com parênteses
  let pos = 0;
  function parseGrupo(){
    const atomos = {};
    while(pos < f.length){
      const ch = f[pos];
      if(ch === ')') break;
      if(ch === '('){
        pos++;  // pula '('
        const sub = parseGrupo();
        if(f[pos] !== ')') return null;  // erro
        pos++;  // pula ')'
        // Multiplicador do grupo
        let n = '';
        while(pos < f.length && /\d/.test(f[pos])){ n += f[pos++]; }
        const mult = n ? parseInt(n) : 1;
        for(const [el, qtd] of Object.entries(sub)){
          atomos[el] = (atomos[el] || 0) + qtd * mult;
        }
      } else if(/[A-Z]/.test(ch)){
        // Símbolo: 1 maiúscula + opcional 1 minúscula
        let sim = ch;
        pos++;
        if(pos < f.length && /[a-z]/.test(f[pos])){ sim += f[pos++]; }
        // Validação: símbolo precisa existir na tabela
        if(!TABELA_PERIODICA[sim]) return null;
        // Quantidade
        let n = '';
        while(pos < f.length && /\d/.test(f[pos])){ n += f[pos++]; }
        const qtd = n ? parseInt(n) : 1;
        atomos[sim] = (atomos[sim] || 0) + qtd;
      } else {
        return null;  // caractere inválido
      }
    }
    return atomos;
  }
  
  pos = 0;
  const atomos = parseGrupo();
  if(!atomos || pos !== f.length) return null;
  return atomos;
}

// Conta total de átomos: H2O → 3 (2 H + 1 O)
function v112_quimica_total_atomos(formula){
  const a = v112_quimica_parse(formula);
  if(!a) return null;
  let total = 0;
  for(const [el, qtd] of Object.entries(a)) total += qtd;
  return total;
}

// Massa molecular: H2O → 2*1.008 + 1*15.999 = 18.015
function v112_quimica_massa(formula){
  const a = v112_quimica_parse(formula);
  if(!a) return null;
  let massa = 0;
  for(const [el, qtd] of Object.entries(a)){
    const dados = TABELA_PERIODICA[el];
    if(!dados) return null;
    massa += dados.massa * qtd;
  }
  return Math.round(massa * 1000) / 1000;
}

// Lista elementos numa fórmula
function v112_quimica_elementos(formula){
  const a = v112_quimica_parse(formula);
  if(!a) return null;
  return Object.keys(a).map(sim => ({
    simbolo: sim,
    quantidade: a[sim],
    nome: TABELA_PERIODICA[sim] ? TABELA_PERIODICA[sim].nome : sim,
    massa_atomica: TABELA_PERIODICA[sim] ? TABELA_PERIODICA[sim].massa : null,
  }));
}

// Balanceamento simples (algoritmo de coeficientes inteiros pequenos)
// "H2 + O2 → H2O" → 2H2 + O2 → 2H2O
// "C3H8 + O2 → CO2 + H2O" → C3H8 + 5O2 → 3CO2 + 4H2O
function v112_quimica_balancear(reagentes, produtos){
  // reagentes/produtos = arrays de fórmulas ["H2", "O2"]
  // Retorna {coefs_r: [...], coefs_p: [...]}
  
  // Conta cada elemento em cada molécula
  const parse_r = reagentes.map(f => v112_quimica_parse(f));
  const parse_p = produtos.map(f => v112_quimica_parse(f));
  if(parse_r.some(x => !x) || parse_p.some(x => !x)) return null;
  
  // Reúne todos os elementos
  const elementos = new Set();
  for(const a of parse_r) for(const e of Object.keys(a)) elementos.add(e);
  for(const a of parse_p) for(const e of Object.keys(a)) elementos.add(e);
  const elems = Array.from(elementos);
  
  // Busca coeficientes brute-force pequenos (1-12)
  const nR = reagentes.length, nP = produtos.length;
  const total = nR + nP;
  if(total > 6) return null;  // muito complexo
  const MAX = 12;
  
  function combos(){
    // gera todas combinações de coeficientes [1..MAX]^total
    const result = [];
    function rec(idx, atual){
      if(idx === total){ result.push([...atual]); return; }
      for(let c = 1; c <= MAX; c++){
        atual.push(c);
        rec(idx + 1, atual);
        atual.pop();
      }
    }
    rec(0, []);
    return result;
  }
  
  // Tenta combinações em ordem de soma (preferir coeficientes menores)
  // Estratégia: itera por soma crescente
  let melhor = null;
  for(let soma = total; soma <= MAX * total && !melhor; soma++){
    const todos = combos();
    todos.sort((a,b) => a.reduce((s,x)=>s+x,0) - b.reduce((s,x)=>s+x,0));
    for(const c of todos){
      const s = c.reduce((s,x)=>s+x,0);
      if(s !== soma) continue;
      // Valida balanço
      let ok = true;
      for(const el of elems){
        let lhs = 0, rhs = 0;
        for(let i = 0; i < nR; i++) lhs += c[i] * (parse_r[i][el] || 0);
        for(let i = 0; i < nP; i++) rhs += c[nR + i] * (parse_p[i][el] || 0);
        if(lhs !== rhs){ ok = false; break; }
      }
      if(ok){
        // Simplifica (mdc)
        function gcd(a,b){ return b === 0 ? a : gcd(b, a%b); }
        let g = c[0];
        for(const x of c) g = gcd(g, x);
        const simpl = c.map(x => x / g);
        melhor = {coefs_r: simpl.slice(0, nR), coefs_p: simpl.slice(nR)};
        break;
      }
    }
  }
  return melhor;
}

// Formata balanceamento em string: "2H2 + O2 → 2H2O"
function v112_quimica_balancear_str(reagentes, produtos){
  const r = v112_quimica_balancear(reagentes, produtos);
  if(!r) return null;
  function fmt(coef, formula){
    return (coef === 1 ? '' : coef) + formula;
  }
  const lhs = reagentes.map((f,i) => fmt(r.coefs_r[i], f)).join(' + ');
  const rhs = produtos.map((f,i) => fmt(r.coefs_p[i], f)).join(' + ');
  return lhs + ' → ' + rhs;
}

window.v112_quimica_parse = v112_quimica_parse;
window.v112_quimica_total_atomos = v112_quimica_total_atomos;
window.v112_quimica_massa = v112_quimica_massa;
window.v112_quimica_elementos = v112_quimica_elementos;
window.v112_quimica_balancear = v112_quimica_balancear;
window.v112_quimica_balancear_str = v112_quimica_balancear_str;
window.TABELA_PERIODICA = TABELA_PERIODICA;

// ═══════════════════════════════════════════════════════════════
// LAB 13.7 — B_ELETRONICA: portas lógicas + tabela verdade + Karnaugh
// ═══════════════════════════════════════════════════════════════

const PORTAS_LOGICAS = {
  'AND':  (a,b) => a & b,
  'OR':   (a,b) => a | b,
  'NOT':  (a)   => a ? 0 : 1,
  'XOR':  (a,b) => a ^ b,
  'NAND': (a,b) => (a & b) ? 0 : 1,
  'NOR':  (a,b) => (a | b) ? 0 : 1,
  'XNOR': (a,b) => (a ^ b) ? 0 : 1,
};

// Calcula porta para entradas dadas
function v112_eletro_porta(nome_porta, entradas){
  const porta = nome_porta.toUpperCase();
  const fn = PORTAS_LOGICAS[porta];
  if(!fn) return null;
  // Normaliza entradas (true/false/1/0/"1"/"0")
  const e = entradas.map(x => {
    if(typeof x === 'number') return x ? 1 : 0;
    if(typeof x === 'boolean') return x ? 1 : 0;
    if(typeof x === 'string'){
      const s = x.toLowerCase().trim();
      if(s === '1' || s === 'true' || s === 'verdadeiro' || s === 'v') return 1;
      return 0;
    }
    return 0;
  });
  
  if(porta === 'NOT'){
    if(e.length !== 1) return null;
    return fn(e[0]);
  }
  // Outras: binária, mas pode encadear (AND de 3+ entradas)
  if(e.length < 2) return null;
  let r = fn(e[0], e[1]);
  for(let i = 2; i < e.length; i++) r = fn(r, e[i]);
  
  const sr = V112.subredes && V112.subredes.B_eletronica;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){ c._ativacoes = (c._ativacoes||0)+1; c._sucessos = (c._sucessos||0)+1; }
  }
  return r;
}

// Gera tabela verdade de uma expressão booleana
// Aceita: "A AND B", "A OR (B AND C)", "(A AND B) OR (NOT C)", etc.
function v112_eletro_tabela_verdade(expr){
  // Detecta variáveis (letras maiúsculas isoladas)
  const exprUp = String(expr).toUpperCase();
  const vars_set = new Set();
  const re_var = /\b([A-Z])\b/g;
  let m;
  while((m = re_var.exec(exprUp)) !== null){
    if(!['AND','OR','NOT','XOR','NAND','NOR','XNOR','V','F'].includes(m[1])) vars_set.add(m[1]);
  }
  const vars = Array.from(vars_set).sort();
  if(vars.length === 0 || vars.length > 4) return null;  // limite prático
  
  // Avaliador recursivo
  function avaliar(e, valores){
    // Substitui variáveis por 1/0
    let s = e;
    for(const v of vars){
      s = s.replace(new RegExp('\\b' + v + '\\b', 'g'), valores[v]);
    }
    // Parser/avaliador com precedência: NOT > AND/NAND > XOR/XNOR > OR/NOR
    // Resolve parênteses primeiro
    while(/\(([^()]+)\)/.test(s)){
      s = s.replace(/\(([^()]+)\)/, (_, sub) => avaliar(sub, valores));
    }
    // NOT (unário): NOT X → !X
    s = s.replace(/NOT\s+(\d)/g, (_, x) => x === '1' ? '0' : '1');
    // AND
    while(/(\d)\s+AND\s+(\d)/.test(s)) s = s.replace(/(\d)\s+AND\s+(\d)/, (_, a, b) => (parseInt(a) & parseInt(b)).toString());
    // NAND
    while(/(\d)\s+NAND\s+(\d)/.test(s)) s = s.replace(/(\d)\s+NAND\s+(\d)/, (_, a, b) => ((parseInt(a) & parseInt(b)) ? 0 : 1).toString());
    // XOR
    while(/(\d)\s+XOR\s+(\d)/.test(s)) s = s.replace(/(\d)\s+XOR\s+(\d)/, (_, a, b) => (parseInt(a) ^ parseInt(b)).toString());
    // XNOR
    while(/(\d)\s+XNOR\s+(\d)/.test(s)) s = s.replace(/(\d)\s+XNOR\s+(\d)/, (_, a, b) => ((parseInt(a) ^ parseInt(b)) ? 0 : 1).toString());
    // OR
    while(/(\d)\s+OR\s+(\d)/.test(s)) s = s.replace(/(\d)\s+OR\s+(\d)/, (_, a, b) => (parseInt(a) | parseInt(b)).toString());
    // NOR
    while(/(\d)\s+NOR\s+(\d)/.test(s)) s = s.replace(/(\d)\s+NOR\s+(\d)/, (_, a, b) => ((parseInt(a) | parseInt(b)) ? 0 : 1).toString());
    return s.trim();
  }
  
  const linhas = [];
  const total = Math.pow(2, vars.length);
  for(let i = 0; i < total; i++){
    const vals = {};
    for(let j = 0; j < vars.length; j++){
      vals[vars[j]] = (i >> (vars.length - 1 - j)) & 1;
    }
    const r = avaliar(exprUp, vals);
    const valor = (r === '1' || r === '0') ? parseInt(r) : null;
    if(valor === null) return null;  // expr inválida
    linhas.push({entradas: {...vals}, saida: valor});
  }
  
  const sr = V112.subredes && V112.subredes.B_eletronica;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){ c._ativacoes = (c._ativacoes||0)+1; c._sucessos = (c._sucessos||0)+1; }
  }
  return {variaveis: vars, linhas};
}

// Karnaugh / Simplificação simples por busca dos mintermos
// Retorna expressão simplificada como soma de produtos
function v112_eletro_simplificar(expr){
  const tv = v112_eletro_tabela_verdade(expr);
  if(!tv) return null;
  const { variaveis, linhas } = tv;
  
  // Coleta mintermos (linhas onde saída = 1)
  const mintermos = linhas.filter(l => l.saida === 1);
  if(mintermos.length === 0) return {expr: '0', mintermos: 0};
  if(mintermos.length === linhas.length) return {expr: '1', mintermos: mintermos.length};
  
  // Algoritmo simples Quine-McCluskey simplificado (até 4 vars)
  // Passo 1: representação binária de cada mintermo
  function paraBin(linha){
    return variaveis.map(v => linha.entradas[v]).join('');
  }
  let grupos = mintermos.map(paraBin);
  
  // Tentativa de combinação: agrupa mintermos que diferem em 1 bit
  function combinar(lista){
    const novos = new Set();
    const usados = new Set();
    for(let i = 0; i < lista.length; i++){
      for(let j = i+1; j < lista.length; j++){
        const a = lista[i], b = lista[j];
        let diff = 0; let pos_diff = -1;
        for(let k = 0; k < a.length; k++){
          if(a[k] !== b[k]){ diff++; pos_diff = k; if(diff > 1) break; }
        }
        if(diff === 1){
          const merged = a.substring(0, pos_diff) + '-' + a.substring(pos_diff + 1);
          novos.add(merged);
          usados.add(a); usados.add(b);
        }
      }
    }
    // Inclui não-combinados
    for(const a of lista){
      if(!usados.has(a)) novos.add(a);
    }
    return Array.from(novos);
  }
  
  let prev_size;
  do {
    prev_size = grupos.length;
    grupos = combinar(grupos);
  } while(grupos.length !== prev_size);
  
  // Converte grupos binários → expressão
  function grupoParaExpr(g){
    const termos = [];
    for(let i = 0; i < g.length; i++){
      if(g[i] === '-') continue;
      if(g[i] === '1') termos.push(variaveis[i]);
      else termos.push('NOT ' + variaveis[i]);
    }
    if(termos.length === 0) return '1';
    return termos.length === 1 ? termos[0] : '(' + termos.join(' AND ') + ')';
  }
  
  const expr_final = grupos.map(grupoParaExpr).join(' OR ');
  return {expr: expr_final, mintermos: mintermos.length, grupos_finais: grupos.length};
}

window.v112_eletro_porta = v112_eletro_porta;
window.v112_eletro_tabela_verdade = v112_eletro_tabela_verdade;
window.v112_eletro_simplificar = v112_eletro_simplificar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.7 — B_BAYES: probabilidade condicional + distribuições
// ═══════════════════════════════════════════════════════════════

// P(A|B) = P(B|A) * P(A) / P(B)
function v112_bayes(p_b_dado_a, p_a, p_b){
  if(p_b === 0) return null;
  if(p_a < 0 || p_a > 1 || p_b < 0 || p_b > 1 || p_b_dado_a < 0 || p_b_dado_a > 1) return null;
  const resultado = (p_b_dado_a * p_a) / p_b;
  const sr = V112.subredes && V112.subredes.B_bayes;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){ c._ativacoes = (c._ativacoes||0)+1; c._sucessos = (c._sucessos||0)+1; }
  }
  return Math.round(resultado * 10000) / 10000;
}

// Fatorial usando BigInt (n!)
function v112_fatorial(n){
  if(n < 0) return null;
  if(n > 170) {
    // Use BigInt para n > 170
    let r = 1n;
    for(let i = 2n; i <= BigInt(n); i++) r *= i;
    return r;
  }
  let r = 1;
  for(let i = 2; i <= n; i++) r *= i;
  return r;
}

// Combinação C(n,k) = n! / (k! * (n-k)!)
function v112_combinacao(n, k){
  if(k < 0 || k > n || n < 0) return null;
  if(k === 0 || k === n) return 1;
  if(k > n - k) k = n - k;
  let r = 1;
  for(let i = 0; i < k; i++){
    r = r * (n - i) / (i + 1);
  }
  return Math.round(r);
}

// Permutação P(n,k) = n! / (n-k)!
function v112_permutacao(n, k){
  if(k < 0 || k > n || n < 0) return null;
  let r = 1;
  for(let i = 0; i < k; i++) r *= (n - i);
  return r;
}

// Binomial: P(X=k) = C(n,k) * p^k * (1-p)^(n-k)
function v112_binomial(n, k, p){
  if(p < 0 || p > 1 || k < 0 || k > n) return null;
  const c = v112_combinacao(n, k);
  const prob = c * Math.pow(p, k) * Math.pow(1-p, n-k);
  return Math.round(prob * 10000) / 10000;
}

// Probabilidade simples: casos favoráveis / casos totais
function v112_prob_simples(favoraveis, total){
  if(total === 0 || total < 0 || favoraveis < 0 || favoraveis > total) return null;
  return Math.round((favoraveis / total) * 10000) / 10000;
}

// Probabilidade de dois eventos independentes ocorrerem juntos: P(A∩B) = P(A) * P(B)
function v112_prob_e(pa, pb){
  if(pa < 0 || pa > 1 || pb < 0 || pb > 1) return null;
  return Math.round(pa * pb * 10000) / 10000;
}

// P(A ou B) = P(A) + P(B) - P(A∩B) (eventos não mutuamente exclusivos)
function v112_prob_ou(pa, pb, p_ambos){
  if(pa < 0 || pa > 1 || pb < 0 || pb > 1) return null;
  if(p_ambos === undefined) p_ambos = pa * pb;  // assume independentes
  return Math.round((pa + pb - p_ambos) * 10000) / 10000;
}

// Probabilidade de tirar K cartas específicas de um baralho de 52
function v112_prob_baralho_kcartas(k_alvo, total_alvo_no_deck){
  // Ex: 2 ases (k=2, total=4)
  if(total_alvo_no_deck < k_alvo || k_alvo < 0) return null;
  // Combinações favoráveis: C(total_alvo, k) / C(52, k)
  const favoraveis = v112_combinacao(total_alvo_no_deck, k_alvo);
  const totais = v112_combinacao(52, k_alvo);
  if(!totais) return null;
  return Math.round((favoraveis / totais) * 10000) / 10000;
}

window.v112_bayes = v112_bayes;
window.v112_fatorial = v112_fatorial;
window.v112_combinacao = v112_combinacao;
window.v112_permutacao = v112_permutacao;
window.v112_binomial = v112_binomial;
window.v112_prob_simples = v112_prob_simples;
window.v112_prob_e = v112_prob_e;
window.v112_prob_ou = v112_prob_ou;
window.v112_prob_baralho_kcartas = v112_prob_baralho_kcartas;

// ═══════════════════════════════════════════════════════════════
// LAB 13.8 — B_GEOMETRIA: vetores, distância, ponto médio, equação reta
// ═══════════════════════════════════════════════════════════════

// Distância euclidiana entre 2 pontos (2D ou 3D)
function v112_geo_distancia(p1, p2){
  if(!Array.isArray(p1) || !Array.isArray(p2)) return null;
  if(p1.length !== p2.length) return null;
  if(p1.length < 2 || p1.length > 3) return null;
  let soma = 0;
  for(let i = 0; i < p1.length; i++){
    soma += (p2[i] - p1[i]) ** 2;
  }
  const d = Math.sqrt(soma);
  const sr = V112.subredes && V112.subredes.B_geometria;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){ c._ativacoes = (c._ativacoes||0)+1; c._sucessos = (c._sucessos||0)+1; }
  }
  return Math.round(d * 10000) / 10000;
}

// Ponto médio entre 2 pontos
function v112_geo_ponto_medio(p1, p2){
  if(!Array.isArray(p1) || !Array.isArray(p2)) return null;
  if(p1.length !== p2.length) return null;
  const m = [];
  for(let i = 0; i < p1.length; i++){
    m.push(Math.round(((p1[i] + p2[i]) / 2) * 10000) / 10000);
  }
  return m;
}

// Vetor de A para B
function v112_geo_vetor(p1, p2){
  if(!Array.isArray(p1) || !Array.isArray(p2)) return null;
  if(p1.length !== p2.length) return null;
  return p1.map((_, i) => p2[i] - p1[i]);
}

// Módulo (magnitude) do vetor
function v112_geo_modulo(v){
  if(!Array.isArray(v)) return null;
  let soma = 0;
  for(const x of v) soma += x*x;
  return Math.round(Math.sqrt(soma) * 10000) / 10000;
}

// Produto escalar (dot product)
function v112_geo_dot(v1, v2){
  if(!Array.isArray(v1) || !Array.isArray(v2)) return null;
  if(v1.length !== v2.length) return null;
  let r = 0;
  for(let i = 0; i < v1.length; i++) r += v1[i] * v2[i];
  return r;
}

// Produto vetorial (cross product) — só 3D
function v112_geo_cross(v1, v2){
  if(!Array.isArray(v1) || !Array.isArray(v2)) return null;
  if(v1.length !== 3 || v2.length !== 3) return null;
  return [
    v1[1]*v2[2] - v1[2]*v2[1],
    v1[2]*v2[0] - v1[0]*v2[2],
    v1[0]*v2[1] - v1[1]*v2[0]
  ];
}

// Ângulo entre dois vetores (em graus)
function v112_geo_angulo(v1, v2){
  const dot = v112_geo_dot(v1, v2);
  const m1 = v112_geo_modulo(v1);
  const m2 = v112_geo_modulo(v2);
  if(m1 === 0 || m2 === 0) return null;
  const cos_ang = dot / (m1 * m2);
  const ang_rad = Math.acos(Math.max(-1, Math.min(1, cos_ang)));
  return Math.round((ang_rad * 180 / Math.PI) * 100) / 100;
}

// Equação da reta passando por 2 pontos (2D): y = mx + b
function v112_geo_equacao_reta(p1, p2){
  if(!Array.isArray(p1) || !Array.isArray(p2)) return null;
  if(p1.length !== 2 || p2.length !== 2) return null;
  const dx = p2[0] - p1[0];
  if(dx === 0) return {tipo:'vertical', x: p1[0]};
  const m = (p2[1] - p1[1]) / dx;
  const b = p1[1] - m * p1[0];
  return {tipo:'normal', m: Math.round(m*10000)/10000, b: Math.round(b*10000)/10000};
}

// Área de triângulo dado 3 pontos (fórmula do determinante)
function v112_geo_area_triangulo(p1, p2, p3){
  if(!Array.isArray(p1) || p1.length !== 2) return null;
  if(!Array.isArray(p2) || p2.length !== 2) return null;
  if(!Array.isArray(p3) || p3.length !== 2) return null;
  const a = Math.abs(
    p1[0]*(p2[1]-p3[1]) +
    p2[0]*(p3[1]-p1[1]) +
    p3[0]*(p1[1]-p2[1])
  ) / 2;
  return Math.round(a * 10000) / 10000;
}

// Perímetro de polígono (lista de pontos 2D/3D)
function v112_geo_perimetro(pontos){
  if(!Array.isArray(pontos) || pontos.length < 2) return null;
  let p = 0;
  for(let i = 0; i < pontos.length; i++){
    const j = (i+1) % pontos.length;
    const d = v112_geo_distancia(pontos[i], pontos[j]);
    if(d === null) return null;
    p += d;
  }
  return Math.round(p * 10000) / 10000;
}

window.v112_geo_distancia = v112_geo_distancia;
window.v112_geo_ponto_medio = v112_geo_ponto_medio;
window.v112_geo_vetor = v112_geo_vetor;
window.v112_geo_modulo = v112_geo_modulo;
window.v112_geo_dot = v112_geo_dot;
window.v112_geo_cross = v112_geo_cross;
window.v112_geo_angulo = v112_geo_angulo;
window.v112_geo_equacao_reta = v112_geo_equacao_reta;
window.v112_geo_area_triangulo = v112_geo_area_triangulo;
window.v112_geo_perimetro = v112_geo_perimetro;

// ═══════════════════════════════════════════════════════════════
// LAB 13.8 — B_REVERSO: efeito → causa
// Usa _efeito_de (criado pelo B_causal) + BFS reverso
// ═══════════════════════════════════════════════════════════════
function v112_reverso_consultar(efeito){
  const sr_c = V112.subredes && V112.subredes.B_causal;
  if(!sr_c) return [];
  const c_causal = v112_node_by_id(sr_c.id);
  if(!c_causal || !c_causal._efeito_de) return [];
  
  // BFS reverso: parte do efeito, encontra todas as causas possíveis
  const causas = new Set();
  const fila = [efeito];
  const vis = new Set([efeito]);
  while(fila.length > 0){
    const x = fila.shift();
    const set = c_causal._efeito_de[x];
    if(!set) continue;
    for(const y of set){
      causas.add(y);
      if(!vis.has(y)){ vis.add(y); fila.push(y); }
    }
  }
  
  const sr_r = V112.subredes && V112.subredes.B_reverso;
  if(sr_r){
    const c = v112_node_by_id(sr_r.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(causas.size > 0) c._sucessos = (c._sucessos||0)+1;
    }
  }
  return Array.from(causas);
}

window.v112_reverso_consultar = v112_reverso_consultar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.8 — B_ESTADO: estado interno persistente
// copo = {nivel: 1.0}, beber metade → 0.5, beber metade de novo → 0.25
// ═══════════════════════════════════════════════════════════════
function v112_estado_set(objeto, propriedade, valor){
  const sr = V112.subredes && V112.subredes.B_estado;
  if(!sr) return;
  const c = v112_node_by_id(sr.id);
  if(!c) return;
  if(!c._objetos) c._objetos = {};
  if(!c._objetos[objeto]) c._objetos[objeto] = {};
  c._objetos[objeto][propriedade] = valor;
  c._ultimo = objeto;  // LAB 13.8: tracking
  c._ativacoes = (c._ativacoes||0)+1;
}
function v112_estado_get(objeto, propriedade){
  const sr = V112.subredes && V112.subredes.B_estado;
  if(!sr) return null;
  const c = v112_node_by_id(sr.id);
  if(!c || !c._objetos || !c._objetos[objeto]) return null;
  if(propriedade) return c._objetos[objeto][propriedade];
  return c._objetos[objeto];
}
function v112_estado_aplicar(objeto, acao){
  const sr = V112.subredes && V112.subredes.B_estado;
  if(!sr) return null;
  const c = v112_node_by_id(sr.id);
  if(!c) return null;
  if(!c._objetos) c._objetos = {};
  if(!c._objetos[objeto]) c._objetos[objeto] = {nivel: 1.0};
  const est = c._objetos[objeto];
  if(est.nivel === undefined) est.nivel = 1.0;
  
  const a = String(acao).toLowerCase();
  if(/metade/.test(a)) est.nivel = Math.max(0, est.nivel / 2);
  else if(/tudo|todo|esvaziar|esgotar|fim/.test(a)) est.nivel = 0;
  else if(/encher|cheio/.test(a)) est.nivel = 1.0;
  else if(/um quarto|1\/4/.test(a)) est.nivel = Math.max(0, est.nivel - 0.25);
  else if(/dois ter[çc]os|2\/3/.test(a)) est.nivel = Math.max(0, est.nivel - 2/3);
  else if(/um ter[çc]o|1\/3/.test(a)) est.nivel = Math.max(0, est.nivel - 1/3);
  else {
    const m = a.match(/(\d+(?:\.\d+)?)\s*%/);
    if(m) est.nivel = Math.max(0, est.nivel - parseFloat(m[1])/100);
  }
  
  c._ultimo = objeto;  // LAB 13.8: tracking
  c._ativacoes = (c._ativacoes||0)+1;
  c._sucessos = (c._sucessos||0)+1;
  return est.nivel;
}
function v112_estado_descrever(objeto){
  const est = v112_estado_get(objeto);
  if(!est) return null;
  if(est.nivel === undefined) return JSON.stringify(est);
  const n = est.nivel;
  if(n === 0) return 'vazio (0%)';
  if(n === 1.0) return 'cheio (100%)';
  if(Math.abs(n - 0.5) < 0.001) return 'metade (50%)';
  if(Math.abs(n - 0.25) < 0.001) return 'um quarto (25%)';
  if(Math.abs(n - 0.75) < 0.001) return 'três quartos (75%)';
  if(Math.abs(n - 1/3) < 0.001) return 'um terço (33%)';
  if(Math.abs(n - 2/3) < 0.001) return 'dois terços (67%)';
  if(Math.abs(n - 0.125) < 0.001) return 'um oitavo (12.5%)';
  if(Math.abs(n - 0.0625) < 0.001) return 'um dezesseis avos (6.25%)';
  return (n * 100).toFixed(1).replace(/\.?0+$/,'') + '%';
}
window.v112_estado_set = v112_estado_set;
window.v112_estado_get = v112_estado_get;
window.v112_estado_aplicar = v112_estado_aplicar;
window.v112_estado_descrever = v112_estado_descrever;

// ═══════════════════════════════════════════════════════════════
// LAB 13.8 — B_CONFLITO: detecta antagonismo entre efeitos
// gelo+fogo → "frio | calor | conflito térmico"
// ═══════════════════════════════════════════════════════════════
const OPOSTOS_138 = {
  'quente':'frio','frio':'quente','calor':'frio',
  'molhado':'seco','seco':'molhado','molha':'seca',
  'claro':'escuro','escuro':'claro',
  'leve':'pesado','pesado':'leve',
  'rapido':'lento','lento':'rapido','rápido':'lento',
  'alto':'baixo','baixo':'alto',
  'grande':'pequeno','pequeno':'grande',
  'novo':'velho','velho':'novo',
  'cheio':'vazio','vazio':'cheio',
  'duro':'mole','mole':'duro',
  'forte':'fraco','fraco':'forte',
  'aberto':'fechado','fechado':'aberto',
  'liga':'desliga','desliga':'liga',
  'sobe':'desce','desce':'sobe',
  'acende':'apaga','apaga':'acende',
};
const CAT_CONFLITO_138 = {
  'quente':'térmico','frio':'térmico','calor':'térmico',
  'molhado':'umidade','seco':'umidade','molha':'umidade',
  'claro':'luminosidade','escuro':'luminosidade',
  'leve':'peso','pesado':'peso',
  'rapido':'velocidade','lento':'velocidade','rápido':'velocidade',
  'alto':'altura','baixo':'altura',
  'grande':'tamanho','pequeno':'tamanho',
  'cheio':'volume','vazio':'volume',
  'duro':'dureza','mole':'dureza',
  'forte':'força','fraco':'força',
  'aberto':'estado','fechado':'estado',
  'liga':'estado','desliga':'estado',
  'sobe':'movimento','desce':'movimento',
  'acende':'luz','apaga':'luz',
};
function v112_detectar_conflito(efeitos){
  const conflitos = [];
  const lista = efeitos.map(e => String(e).toLowerCase().trim());
  for(let i = 0; i < lista.length; i++){
    for(let j = i+1; j < lista.length; j++){
      const a = lista[i], b = lista[j];
      if(OPOSTOS_138[a] === b){
        const cat = CAT_CONFLITO_138[a] || 'lógico';
        conflitos.push({a, b, categoria: cat});
      }
    }
  }
  const sr = V112.subredes && V112.subredes.B_conflito;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(conflitos.length > 0) c._sucessos = (c._sucessos||0)+1;
      if(!c._conflitos_detectados) c._conflitos_detectados = [];
      if(conflitos.length > 0){
        c._conflitos_detectados.push({efeitos: lista, conflitos, turno: V112.turn});
        if(c._conflitos_detectados.length > 30) c._conflitos_detectados.shift();
      }
    }
  }
  return conflitos;
}
window.v112_detectar_conflito = v112_detectar_conflito;

// ═══════════════════════════════════════════════════════════════
// LAB 13.9 — B_NLP: pré-processador de linguagem natural
// Reescreve frases livres para formato canônico
// ═══════════════════════════════════════════════════════════════

// Regras de reescrita: [regex, substituição]
// IMPORTANTE: ordem importa (mais específicas primeiro, COSSENO antes de SENO)
const REGRAS_NL_138 = [
  // === LIMPEZA INICIAL ===
  [/^por\s+favor[,\s]+/i, ''],
  [/^(?:pode\s+me\s+dizer\s+|eu\s+queria?\s+saber\s+|me\s+(?:diga|fala)\s+|gostaria\s+de\s+saber\s+)/i, ''],
  
  // === GEOMETRIA — pré-substitui "origem" e "x=N, y=N" ===
  [/\bx\s*=\s*([-\d.]+)\s*[,;]\s*y\s*=\s*([-\d.]+)(?:\s*[,;]\s*z\s*=\s*([-\d.]+))?/gi,
   (m) => m[3] !== undefined ? `(${m[1]},${m[2]},${m[3]})` : `(${m[1]},${m[2]})`],
  // "origem" vira (0,0) apenas em CONTEXTO GEOMÉTRICO (após "da/de" + antes de "ao/até/para")
  [/(\bdist[âa]ncia\b[^.]*?\bd[ae]\s+)origem(\s+(?:ao|at[ée]|para|a\s))/gi, '$1(0,0)$2'],
  [/(\bpartindo\s+(?:da|de)\s+)origem(\s+(?:ao|at[ée]|para|a\s))/gi, '$1(0,0)$2'],
  // Trailing "da origem" no final de frase de distância
  [/(\bdist[âa]ncia\b[^.]*?\b)d[ae]\s+origem\s*$/gi, '$1de (0,0)'],
  
  // "qual a distância em linha reta da origem ao ponto (3,4)" / "...até (3,4)"
  // (origem já virou (0,0))
  [/(?:qual\s+(?:a|é\s+a)?\s+)?dist[âa]ncia\s+(?:em\s+linha\s+reta\s+)?(?:do\s+ponto\s+|partindo\s+do\s+ponto\s+|partindo\s+de\s+|partindo\s+da\s+|do\s+|de\s+|da\s+)?(\([^)]+\))\s+(?:at[ée]\s+(?:o\s+ponto\s+)?|para\s+(?:o\s+ponto\s+)?|ao\s+ponto\s+|ao\s+|a\s+)(\([^)]+\))/i,
   (m) => `distância entre ${m[1]} e ${m[2]}`],
  
  // === TRIGONOMETRIA — COSSENO antes de SENO (porque cosseno contém "seno") ===
  // Cosseno: "qual o cosseno de 45 graus" / "cosseno 45" / "cos 45"
  [/(?:qual\s+(?:o|é\s+o)?\s+|quanto\s+(?:é|vale)\s+(?:o\s+|a\s+)?)?cosseno\s+(?:de\s+)?([-\d.]+)\s*(?:graus|°)?\s*[\?\.]?$/i,
   (m) => `cos(${m[1]})`],
  [/(?:qual\s+(?:o|é\s+o)?\s+|quanto\s+(?:é|vale)\s+(?:o\s+|a\s+)?)?cos\s+(?:de\s+)?([-\d.]+)\s*(?:graus|°)?\s*[\?\.]?$/i,
   (m) => `cos(${m[1]})`],
  // Tangente
  [/(?:qual\s+(?:o|a|é\s+(?:o|a))?\s+|quanto\s+(?:é|vale)\s+(?:o\s+|a\s+)?)?tangente\s+(?:de\s+)?([-\d.]+)\s*(?:graus|°)?\s*[\?\.]?$/i,
   (m) => `tan(${m[1]})`],
  [/(?:qual\s+(?:o|a|é\s+(?:o|a))?\s+|quanto\s+(?:é|vale)\s+(?:o\s+|a\s+)?)?(?:tan|tg)\s+(?:de\s+)?([-\d.]+)\s*(?:graus|°)?\s*[\?\.]?$/i,
   (m) => `tan(${m[1]})`],
  // Seno (DEPOIS de cosseno!)
  [/(?:qual\s+(?:o|é\s+o)?\s+|quanto\s+(?:é|vale)\s+(?:o\s+|a\s+)?)?(?:seno|sin|sen)\s+(?:de\s+)?([-\d.]+)\s*(?:graus|°)?\s*[\?\.]?$/i,
   (m) => `sin(${m[1]})`],
  
  // === ÁLGEBRA ===
  // "se eu tenho 2x + 4 = 10, qual o x" → "resolva: 2x + 4 = 10"
  [/^(?:se\s+(?:eu\s+)?(?:tenho|tiver|temos)\s+)(.+?)[\s,]+(?:qual\s+(?:o|é\s+o)?\s+(?:valor\s+de\s+)?[xyabnm])\s*[\?\.]?\s*$/i,
   (m, full) => {
     if(/[a-z]/.test(m[1]) && /=/.test(m[1])) return `resolva: ${m[1].trim()}`;
     return full;
   }],
  
  // === QUÍMICA ===
  // Primeiro: "molécula de X" → "X" (simplifica)
  [/mol[ée]cula\s+de\s+([A-Za-z0-9\(\)]+)/gi, '$1'],
  // "quantos átomos tem H2O" / "quantos átomos tem a H2O" / "quantos átomos há em H2O"
  [/quantos?\s+[áa]tomos?\s+(?:tem(?:\s+(?:a|o|na|no))?\s+|h[áa](?:\s+(?:na|no|em))?\s+|existe[m]?\s+(?:em\s+)?|na\s+|no\s+|na\s+substância\s+|no\s+composto\s+|em\s+)([A-Za-z0-9\(\)]+?)\s*[\?\.]?$/i,
   (m) => `quantos átomos em ${m[1]}`],
  
  // "qual a massa molecular de X" → "massa molecular de X"
  [/^(?:qual\s+(?:o|a|é\s+(?:o|a))?\s+)(?:massa|peso)\s+(?:molecular|molar|atomica|at[ôo]mica)?\s*(?:de\s+)?([A-Za-z0-9\(\)]+)\s*[\?\.]?$/i,
   (m) => `massa molecular de ${m[1]}`],
  
  // === BAYES / PROBABILIDADE ===
  [/(?:qual\s+(?:a|é\s+a)?\s+)?(?:probabilidade|chance)\s+(?:de\s+)?tirar\s+(\d+)\s+(ases?|reis?|damas?|valetes?)\s*[\?\.]?$/i,
   (m) => `tirar ${m[1]} ${m[2]}`],
  [/^(?:qual\s+(?:a|é\s+a)?\s+)?(?:chance|probabilidade|prob)\s+(?:de\s+)?(\d+)\s+(?:em|de)\s+(\d+)\s*[\?\.]?$/i,
   (m) => `probabilidade ${m[1]} em ${m[2]}`],
  
  // === REVERSO — "tem X, o que pode ter acontecido" ===
  [/^(?:tem\s+|apareceu\s+|surgiu\s+|h[áa]\s+)(\S+?)[\s,]+(?:o\s+que\s+(?:pode\s+(?:ter\s+)?)?(?:acontec|caus)\w*)\s*[\?\.]?$/i,
   (m) => `o que causa ${m[1]}`],
  
  // === ESTADO ===
  [/^(?:enche|encha|encher)\s+(?:o\s+|a\s+)?(\w+)\s*[\?\.]?$/i, (m) => `${m[1]} cheio`],
  [/^(?:esvazie|esvazia|esvaziar)\s+(?:o\s+|a\s+)?(\w+)\s*[\?\.]?$/i, (m) => `${m[1]} vazio`],
  
  // Limpeza final
  [/[\?\.\!]{2,}$/, '?'],
  
  // ═══════════════════════════════════════════════════════════════
  // LAB 13.10 — +40 regras NLP (cobertura ~85%)
  // ═══════════════════════════════════════════════════════════════
  
  // === GEOMETRIA — MAIS VARIAÇÕES ===
  // "distância do ponto A ao ponto B"
  [/(?:qual\s+(?:a|é\s+a)?\s+)?dist[âa]ncia\s+entre\s+os\s+pontos?\s+(\([^)]+\))\s+e\s+(\([^)]+\))/i,
   (m) => `distância entre ${m[1]} e ${m[2]}`],
  // "de quanto é a distância"
  [/(?:de\s+quanto\s+(?:é|vale|fica)\s+)?(?:a\s+)?dist[âa]ncia\s+(?:entre|de)\s+(\([^)]+\))\s+(?:e|at[ée]|para|a)\s+(\([^)]+\))/i,
   (m) => `distância entre ${m[1]} e ${m[2]}`],
  // "qual o comprimento do segmento"
  [/(?:qual\s+(?:o|é\s+o)?\s+)?(?:comprimento|tamanho)\s+(?:do\s+)?segmento\s+(\([^)]+\))\s+(?:até|a|e)\s+(\([^)]+\))/i,
   (m) => `distância entre ${m[1]} e ${m[2]}`],
  // "calcule a distância"
  [/^(?:calcule?|determine?|ache?|encontre?)\s+(?:a\s+)?dist[âa]ncia\s+(?:entre\s+)?(\([^)]+\))\s+(?:e|at[ée]|a)\s+(\([^)]+\))/i,
   (m) => `distância entre ${m[1]} e ${m[2]}`],
  // "ponto médio entre A e B" / "qual é o ponto médio"
  [/(?:qual\s+(?:o|é\s+o)?\s+)?ponto\s+m[ée]dio\s+(?:entre|de|do\s+segmento)\s+(\([^)]+\))\s+(?:e|at[ée]|a)\s+(\([^)]+\))/i,
   (m) => `ponto médio entre ${m[1]} e ${m[2]}`],
  // "qual é o ângulo entre"
  [/(?:qual\s+(?:o|é\s+o)?\s+)?[âa]ngulo\s+(?:entre\s+(?:os\s+)?(?:vetores?\s+)?)?(\([^)]+\))\s+(?:e|com)\s+(\([^)]+\))/i,
   (m) => `ângulo entre ${m[1]} e ${m[2]}`],
  // "área deste triângulo"
  [/[áa]rea\s+(?:deste\s+|do\s+|desse\s+)?tri[âa]ngulo\s+(?:de\s+v[ée]rtices?\s+)?(\([^)]+\))[\s,]+(\([^)]+\))[\s,]+(\([^)]+\))/i,
   (m) => `área do triângulo ${m[1]} ${m[2]} ${m[3]}`],
  
  // === ÁLGEBRA — MAIS VARIAÇÕES ===
  // "ache o x em 2x + 4 = 10"
  [/^(?:ache?|encontre?|determine?|calcule?|descubr[ae]|me\s+(?:diga|dê))\s+(?:o\s+)?(?:valor\s+de\s+)?[xyabnm]\s+(?:em|de|para|sabendo\s+que|onde)\s+(.+?)\s*[\?\.]?\s*$/i,
   (m, full) => {
     if(/[a-z]/.test(m[1]) && /=/.test(m[1])) return `resolva: ${m[1].trim()}`;
     return full;
   }],
  // "x em 2x + 4 = 10"
  [/^[xyabnm]\s+(?:em|de|para|onde|sabendo)\s+(.+?)\s*[\?\.]?\s*$/i,
   (m, full) => {
     if(/[a-z]/.test(m[1]) && /=/.test(m[1])) return `resolva: ${m[1].trim()}`;
     return full;
   }],
  // "resolva esta equação: ..." / "resolva esse exercício: ..."
  [/^(?:resolva|resolver)\s+(?:essa\s+|esta\s+|esse\s+|este\s+)?(?:equa[çc][ãa]o|exerc[íi]cio|express[ãa]o|problema)\s*[:]\s*(.+?)\s*[\?\.]?\s*$/i,
   (m) => `resolva: ${m[1].trim()}`],
  // "raízes de x^2 - 4 = 0"
  [/^(?:quais\s+(?:as|são\s+as)?\s+)?ra[íi]zes\s+(?:de|da\s+equa[çc][ãa]o)\s+(.+?)\s*[\?\.]?\s*$/i,
   (m, full) => {
     if(/[a-z]/.test(m[1]) && /=/.test(m[1])) return `resolva: ${m[1].trim()}`;
     return full;
   }],
  
  // === TRIGONOMETRIA — MAIS VARIAÇÕES ===
  // "valor de seno de X"
  [/(?:valor\s+(?:de|do)\s+)?cosseno\s+(?:de\s+)?([-\d.]+)\s*(?:graus|°|rad)?\s*[\?\.]?\s*$/i,
   (m) => `cos(${m[1]})`],
  [/(?:valor\s+(?:de|da)\s+)?tangente\s+(?:de\s+)?([-\d.]+)\s*(?:graus|°|rad)?\s*[\?\.]?\s*$/i,
   (m) => `tan(${m[1]})`],
  [/(?:valor\s+(?:de|do)\s+)?(?:seno|sin|sen)\s+(?:de\s+)?([-\d.]+)\s*(?:graus|°|rad)?\s*[\?\.]?\s*$/i,
   (m) => `sin(${m[1]})`],
  
  // === QUÍMICA — MAIS VARIAÇÕES ===
  // "qual a fórmula molecular conta quantos átomos"
  [/(?:quantos?\s+[áa]tomos?\s+(?:cont[éaê]m?|possu(?:i|em)|forma[m]?)\s+)([A-Za-z0-9\(\)]+)/i,
   (m) => `quantos átomos em ${m[1]}`],
  // "qual a fórmula tem X átomos" — direção reversa, mais difícil, pula
  // "calcule a massa molar de X"
  [/^(?:calcule?|determine?|ache?|encontre?)\s+(?:a\s+)?(?:massa|peso)\s+(?:molecular|molar|atomica|at[ôo]mica)?\s*(?:de\s+)?([A-Za-z0-9\(\)]+)\s*[\?\.]?\s*$/i,
   (m) => `massa molecular de ${m[1]}`],
  // "balancear: H2 + O2 → H2O" (sem 'e' final)
  [/^(?:fa[çc]a\s+o\s+|balanceie?|balancear|equilibrar?|ajuste?)\s+(?:a\s+|essa\s+|esta\s+)?(?:equa[çc][ãa]o\s+)?(?:qu[íi]mica\s+)?[:]?\s*(.+?)\s+(?:→|->|=>)\s+(.+?)\s*\.?\s*$/i,
   (m) => `balanceie: ${m[1].trim()} → ${m[2].trim()}`],
  
  // === ELETRÔNICA — MAIS VARIAÇÕES ===
  // "qual o resultado de A AND B" (sem valores) — fica como pergunta de tabela verdade
  [/^(?:qual\s+(?:o|é\s+o)?\s+(?:resultado|valor)\s+(?:de\s+)?)([A-Z])\s+(AND|OR|XOR|NAND|NOR|XNOR)\s+([A-Z])(?:\s+(?:com|onde|sendo)\s+\1\s*=\s*([01])\s+(?:e\s+)?\3\s*=\s*([01]))?\s*[\?\.]?\s*$/i,
   (m, full) => {
     if(m[4] !== undefined && m[5] !== undefined) return `${m[2].toUpperCase()} ${m[4]} ${m[5]}`;
     return `tabela verdade ${m[1]} ${m[2]} ${m[3]}`;
   }],
  // "monte a tabela verdade de A AND B" / "tabela de verdade para X"
  [/^(?:monte?|fa[çc]a|construa|gere?)\s+(?:a\s+)?tabela\s+(?:de\s+)?verdade\s+(?:de|para|do)\s+(.+?)\s*[\?\.]?\s*$/i,
   (m) => `tabela verdade ${m[1]}`],
  // "simplifique a expressão" / "minimize"
  [/^(?:simplifique?|simplificar|minimize?|minimizar|reduz[ai]r?|otimize?|otimizar)\s+(?:[ao]\s+(?:express[ãa]o\s+|boole(?:ana)?\s+))?[:]?\s*(.+?)\s*[\?\.]?\s*$/i,
   (m, full) => {
     // Só se contém operadores booleanos
     if(/\b(AND|OR|NOT|XOR|NAND|NOR)\b/i.test(m[1])) return `simplifique: ${m[1].trim()}`;
     return full;
   }],
  
  // === BAYES / COMBINATÓRIA — MAIS ===
  // "quantas combinações de N tomados K a K"
  [/^(?:quantas?\s+)?combina[çc][õo]es\s+(?:de\s+)?(\d+)\s+(?:tomados?\s+|escolhe[mr]?\s+|escolhend?o?\s+|elementos?\s+)?(\d+)(?:\s+a\s+\d+)?\s*[\?\.]?\s*$/i,
   (m) => `C(${m[1]}, ${m[2]})`],
  // "quantas permutações de N elementos K a K"
  [/^(?:quantas?\s+)?permuta[çc][õo]es\s+(?:de\s+)?(\d+)\s+(?:tomados?\s+|elementos?\s+)?(\d+)(?:\s+a\s+\d+)?\s*[\?\.]?\s*$/i,
   (m) => `P(${m[1]}, ${m[2]})`],
  // "calcule N fatorial" / "fatorial do número N"
  [/^(?:calcule?|determine?|ache?|qual\s+(?:o|é\s+o)?)\s+(?:fatorial\s+(?:de|do)\s+(?:n[úu]mero\s+)?(\d+)|(\d+)\s*!|fatorial\s+(\d+))\s*[\?\.]?\s*$/i,
   (m) => {
     const n = m[1] || m[2] || m[3];
     return `${n}!`;
   }],
  // "calcule a probabilidade de N em M" / "qual a chance de N em M"
  [/^(?:calcule?|determine?|ache?)\s+(?:a\s+)?(?:probabilidade|chance|prob)\s+(?:de\s+)?(\d+)\s+(?:em|de|sobre|\/)\s+(\d+)\s*[\?\.]?\s*$/i,
   (m) => `probabilidade ${m[1]} em ${m[2]}`],
  // "calcule bayes" / "aplique bayes"
  [/^(?:calcule?|aplique?)\s+bayes\s*[:(]?\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\)?\s*[\?\.]?\s*$/i,
   (m) => `bayes ${m[1]} ${m[2]} ${m[3]}`],
  
  // === CAUSAL — MAIS VARIAÇÕES ===
  // "o que acontece quando X"
  [/^(?:o\s+que\s+(?:acontece|ocorre|sucede)\s+(?:quando|se|com)\s+)([\wÀ-ÿ_]+?)\s*[\?\.]?\s*$/i,
   (m) => `o que ${m[1]} causa`],
  // "qual a consequência de X"
  [/^(?:qual\s+(?:a|é\s+a)?\s+(?:consequ[êe]ncia|efeito|resultado)s?\s+(?:de|do)\s+)([\wÀ-ÿ_]+?)\s*[\?\.]?\s*$/i,
   (m) => `o que ${m[1]} causa`],
  // "o que pode ser causado por X"
  [/^(?:o\s+que\s+(?:pode\s+ser\s+|é\s+)?causado\s+por\s+)([\wÀ-ÿ_]+?)\s*[\?\.]?\s*$/i,
   (m) => `o que ${m[1]} causa`],
  // "depois de X o que acontece"
  [/^(?:depois\s+de|ap[óo]s)\s+([\wÀ-ÿ_]+?)[\s,]+o\s+que\s+(?:acontece|ocorre|vem|segue)\s*[\?\.]?\s*$/i,
   (m) => `o que ${m[1]} causa`],
  
  // === REVERSO — MAIS VARIAÇÕES ===
  // "qual a causa de X" / "qual foi a causa"
  [/^(?:qual\s+(?:a|foi\s+a|é\s+a)?\s+)?causa\s+(?:de|do|da|para)\s+([\wÀ-ÿ_]+?)\s*[\?\.]?\s*$/i,
   (m) => `o que causa ${m[1]}`],
  // "por que apareceu X"
  [/^(?:por\s+que|porque|por\s+qual\s+motivo)\s+(?:apareceu|surgiu|tem|h[áa])\s+([\wÀ-ÿ_]+?)\s*[\?\.]?\s*$/i,
   (m) => `o que causa ${m[1]}`],
  // "vejo X, o que houve" / "vejo X, qual a causa"
  [/^(?:vejo|observo|notei|percebi)\s+([\wÀ-ÿ_]+?)[\s,]+(?:o\s+que\s+(?:houve|aconteceu|caus|acontec)|qual\s+(?:a\s+)?causa)\w*\s*[\?\.]?\s*$/i,
   (m) => `o que causa ${m[1]}`],
  
  // === ESTADO — MAIS VARIAÇÕES ===
  // "complete o copo" / "preenche o copo"
  [/^(?:complete?|preenche|preencher|enche|encha|encher)\s+(?:o\s+|a\s+)?([\wÀ-ÿ]+)\s*[\?\.]?\s*$/i,
   (m) => `${m[1]} cheio`],
  // "drene/esvazie/zere X"
  [/^(?:drene|drenar|zere|zerar|esvazi[ae]|esvaziar|esgote|esgotar)\s+(?:o\s+|a\s+)?([\wÀ-ÿ]+)\s*[\?\.]?\s*$/i,
   (m) => `${m[1]} vazio`],
  // "tome metade de X" / "consuma metade de X"
  [/^(?:tome|tomar|consum[ae]|consumir|bebe|beber|usa|usar|gasta|gastar)\s+(metade|um\s+quarto|1\/4|tudo|todo)\s+(?:do\s+|da\s+|de\s+)?([\wÀ-ÿ]+)\s*[\?\.]?\s*$/i,
   (m) => `beber ${m[1]} do ${m[2]}`],
  // "quanto tem em X" / "qual o nível de X" — só pra ESTADO (com 'em/no/na/de')
  // NÃO captura "quanto tem X" porque conflita com B_mundo
  [/^(?:quanto\s+(?:tem|sobra|sobrou|resta)\s+(?:em\s+|no\s+|na\s+|do\s+|da\s+)|qual\s+(?:o\s+|é\s+o)?(?:n[íi]vel|estado|quantidade)\s+(?:de|do|da|em)\s+)([\wÀ-ÿ]+)\s*[\?\.]?\s*$/i,
   (m, full) => {
     return `quanto resta ${m[1]}`;
   }],
  
  // === MUNDO — MAIS VARIAÇÕES ===
  // "defina X como N" / "X tem valor N" / "X vale N"
  [/^(?:defin[ae]|definir|atribu[ai]|atribuir)\s+([\wÀ-ÿ]{2,})\s+(?:como|valendo|com\s+(?:o\s+)?valor)\s+(-?\d+(?:\.\d+)?)\s*\.?\s*$/i,
   (m) => `${m[1]} = ${m[2]}`],
  // "incrementa N em X" / "decrementa N em X"
  [/^incrementa\s+(-?\d+(?:\.\d+)?)\s+em\s+([\wÀ-ÿ]+)\s*\.?\s*$/i,
   (m) => `soma ${m[1]} ao ${m[2]}`],
  [/^decrementa\s+(-?\d+(?:\.\d+)?)\s+em\s+([\wÀ-ÿ]+)\s*\.?\s*$/i,
   (m) => `subtrai ${m[1]} do ${m[2]}`],
  // "qual o estado completo" / "mostra todos os valores"
  [/^(?:qual\s+(?:o\s+|é\s+o)?(?:estado|status)\s+(?:completo|atual|do\s+mundo|geral)|mostra(?:r)?\s+(?:todos\s+os\s+(?:valores|estados)?|tudo|o\s+mundo|as\s+vari[áa]veis)|liste?\s+(?:tudo|o\s+mundo|todas?\s+(?:as\s+)?vari[áa]veis|todos\s+os\s+valores))\s*[\?\.]?\s*$/i,
   () => `estado do mundo`],
  
  // === LOOP — VARIAÇÕES ===
  // "repete N vezes: <ação>" → "vaza ... N vezes"
  [/^repete?\s+(\d+)\s+(?:vezes|x)\s*[:]\s*(soma|adiciona|subtrai|tira|vaza|drena)\s+(-?\d+(?:\.\d+)?)\s+(?:ao|no|do|da|de)\s+([\wÀ-ÿ]+)\s*\.?\s*$/i,
   (m) => `${m[2]} ${m[3]} ${m[4] === 'soma' || m[4] === 'adiciona' ? 'ao' : 'do'} ${m[4]} ${m[1]} vezes`],
];

// ═════════════════════════════════════════════════════════════
// LAB 13.14 — Migra REGRAS_NL_138 para nós no cérebro
// Chamada após v112_seed quando regras já estão carregadas
// ═════════════════════════════════════════════════════════════
function v112_migrar_regras_nl(){
  if(!V112.subredes || !V112.subredes.B_regras_nucleos) return 0;
  if(typeof REGRAS_NL_138 === 'undefined') return 0;
  return v112_regras_migrar_array(REGRAS_NL_138, 'nlp');
}
window.v112_migrar_regras_nl = v112_migrar_regras_nl;

// LAB 13.14 — Após importar cérebro JSON, re-vincula funções que viraram null
// Necessário porque JSON.stringify não preserva funções
function v112_revincular_funcoes_regras(){
  if(typeof REGRAS_NL_138 === 'undefined') return 0;
  const regras_nos = V112.nodes.filter(n => n.tipo === 'regra' && n._categoria === 'nlp');
  let revinculadas = 0;
  
  // Cria mapa padrao_str → função do array
  const mapa_funcoes = {};
  for(const [re, sub] of REGRAS_NL_138){
    const key = re.source || String(re);
    mapa_funcoes[key] = sub;
  }
  
  for(const no of regras_nos){
    if(no._sub_tipo === 'funcao' && (no._sub_funcao === null || typeof no._sub_funcao !== 'function')){
      const sub_original = mapa_funcoes[no._padrao_str];
      if(typeof sub_original === 'function'){
        no._sub_funcao = sub_original;
        revinculadas++;
      }
    }
  }
  return revinculadas;
}
window.v112_revincular_funcoes_regras = v112_revincular_funcoes_regras;

// ═══════════════════════════════════════════════════════════════
// LAB 13.15 — COMANDOS NL COMO NÓS
//
// Cada comando NL (transferir, esquece, propaga, etc) vira um nó
// com _padrao_regex + _handler (string com nome da função).
//
// Handlers ficam num REGISTRO global; o nó só guarda a STRING do nome.
// Isso resolve o problema "função vira null no JSON".
// ═══════════════════════════════════════════════════════════════

// Registro global de handlers (NÃO serializado, mas reconstruído via revincular)
window.V112_HANDLERS = window.V112_HANDLERS || {};

function v112_registrar_handler(nome, funcao){
  if(typeof funcao !== 'function') return false;
  window.V112_HANDLERS[nome] = funcao;
  return true;
}
window.v112_registrar_handler = v112_registrar_handler;

function v112_comando_criar_no(padrao_str, handler_nome, opcoes){
  opcoes = opcoes || {};
  const sr = V112.subredes && V112.subredes.B_comandos_nucleos;
  if(!sr) return null;
  
  const novo_id = (V112.nodes.length > 0 ? Math.max(...V112.nodes.map(n => n.id)) : 0) + 1;
  const no_cmd = {
    id: novo_id,
    text: '_cmd_' + (opcoes.nome || handler_nome),
    tipo: 'comando',
    camada: 'cortex',
    pos: [
      sr.pos ? sr.pos[0] + (Math.random()-0.5)*20 : 60,
      sr.pos ? sr.pos[1] + (Math.random()-0.5)*20 : 120,
      sr.pos ? sr.pos[2] + (Math.random()-0.5)*10 : 0
    ],
    acumulador: 0,
    limiar: 1,
    estado: 'dormindo',
    _ativacoes: 0,
    _padrao_str: padrao_str,
    _padrao_flags: opcoes.flags || 'i',
    _handler_nome: handler_nome,
    _prioridade: opcoes.prioridade !== undefined ? opcoes.prioridade : 100,
    _score: opcoes.score || 0,
    _aplicacoes: 0,
    _matches: 0,
    _sucessos: 0,
    _categoria: opcoes.categoria || 'comando',
    _descricao: opcoes.descricao || '',
    _origem: opcoes.origem || 'definicao_inicial',
  };
  
  V112.nodes.push(no_cmd);
  if(!sr.satelites) sr.satelites = [];
  sr.satelites.push(novo_id);
  V112.edges.push({a: sr.id, b: novo_id, peso: 1, tipo: 'satelite_cmd'});
  
  return no_cmd;
}
window.v112_comando_criar_no = v112_comando_criar_no;

function v112_comandos_listar(){
  return V112.nodes.filter(n => n.tipo === 'comando');
}
window.v112_comandos_listar = v112_comandos_listar;

// Tenta achar comando-nó que casa com input, e executa handler
// Retorna {tratou: true, resultado: ...} ou null
function v112_comando_tentar_executar(input){
  if(!V112.subredes || !V112.subredes.B_comandos_nucleos) return null;
  if(typeof input !== 'string') return null;
  
  const cmds = V112.nodes.filter(n => n.tipo === 'comando');
  // Ordena por prioridade desc + score
  cmds.sort((a, b) => {
    if((b._prioridade||0) !== (a._prioridade||0)) return (b._prioridade||0) - (a._prioridade||0);
    return (b._score||0) - (a._score||0);
  });
  
  for(const cmd of cmds){
    let padrao;
    try { padrao = new RegExp(cmd._padrao_str, cmd._padrao_flags || 'i'); }
    catch(e){ continue; }
    // LAB: padrão vazio ou catch-all (ex: '' ou '.*') casa QUALQUER input em JS —
    // num cérebro importado isso fazia o handler (ex: identidade) responder a tudo. Ignora.
    if(!cmd._padrao_str || padrao.test('')) continue;

    const match = input.match(padrao);
    if(!match) continue;
    
    cmd._matches = (cmd._matches||0) + 1;
    
    const handler = window.V112_HANDLERS[cmd._handler_nome];
    if(typeof handler !== 'function') continue;
    
    let resultado;
    try { resultado = handler(match, input); }
    catch(e){ continue; }
    
    if(resultado === null || resultado === undefined) continue;
    
    cmd._aplicacoes = (cmd._aplicacoes||0) + 1;
    cmd._sucessos = (cmd._sucessos||0) + 1;
    cmd._score = (cmd._score||0) + 1;
    cmd._ativacoes = (cmd._ativacoes||0) + 1;
    cmd.acumulador = (cmd.acumulador||0) + 0.5;
    cmd.estado = 'ativo';
    
    return {tratou: true, resultado, comando: cmd.text, handler: cmd._handler_nome};
  }
  
  return null;
}
window.v112_comando_tentar_executar = v112_comando_tentar_executar;

function v112_comandos_relatar(){
  const cmds = v112_comandos_listar();
  const ativos = cmds.filter(c => (c._aplicacoes||0) > 0).length;
  const total_aplic = cmds.reduce((s,c) => s + (c._aplicacoes||0), 0);
  const top = cmds.slice().sort((a,b) => (b._aplicacoes||0) - (a._aplicacoes||0)).slice(0, 10).map(c => ({
    nome: c.text, handler: c._handler_nome, aplic: c._aplicacoes, prio: c._prioridade
  }));
  return {total: cmds.length, ativos, total_aplicacoes: total_aplic, top};
}
window.v112_comandos_relatar = v112_comandos_relatar;

function v112_registrar_handlers_padrao(){
  // Registra TODOS os handlers padrão. Idempotente (pode ser chamado várias vezes).
  
  // h_transferir
  v112_registrar_handler('h_transferir', (m, input) => {
    if(typeof v112_transferir !== 'function') return null;
    const r = v112_transferir(m[2], m[3], parseFloat(m[1]));
    if(!r) return null;
    if(r.erro) return {resposta_direta: '❌ ' + r.erro, transf_erro: true};
    return {resposta_direta: 'transferiu ' + r.quantidade + ': ' + r.origem + ' = ' + r.valor_origem + ', ' + r.destino + ' = ' + r.valor_destino + ' (conservou: ' + r.conservou + ')', transferencia: true};
  });
  
  v112_registrar_handler('h_esquece', (m, input) => {
    if(typeof v112_causal_remover !== 'function') return null;
    const ok = v112_causal_remover(m[1], m[2]);
    return {resposta_direta: ok ? 'removida: ' + m[1] + ' ≠ ' + m[2] : 'relação ' + m[1] + '→' + m[2] + ' não existia', invalidacao: true};
  });
  
  v112_registrar_handler('h_consolidar', (m, input) => {
    if(typeof v112_meta_regra_consolidar !== 'function') return null;
    const r = v112_meta_regra_consolidar({max_atalhos: 500});
    let resp = r.atalhos_criados + ' atalhos criados (meta-regra: transitividade)';
    if(r.exemplos && r.exemplos.length > 0){
      resp += '. Exemplos: ' + r.exemplos.slice(0, 3).map(e => e.A + '→' + e.C + ' (via ' + e.B + ')').join(', ');
    }
    return {resposta_direta: resp, meta_regra: true};
  });
  
  v112_registrar_handler('h_raiz', (m, input) => {
    if(typeof v112_buscar_raiz !== 'function') return null;
    const efeito = m[1].replace(/[\?\.]+$/, '');
    const r = v112_buscar_raiz(efeito);
    if(!r || !r.raizes || r.raizes.length === 0) return null;
    const raiz = r.raiz_mais_profunda;
    let resp = 'raiz de ' + efeito + ': ' + raiz.raiz + ' (profundidade ' + raiz.profundidade + ', caminho: ' + raiz.caminho.join(' → ') + ')';
    if(r.raizes.length > 1) resp += ' [' + r.raizes.length + ' raízes possíveis]';
    return {resposta_direta: resp, raiz: true};
  });
  
  v112_registrar_handler('h_aprender', (m, input) => {
    if(typeof v112_promotor_ciclo !== 'function') return null;
    const r = v112_promotor_ciclo();
    let resp = 'ciclo aprendizado: ' + r.tentativas + ' tentativas, ' + r.consolidadas + ' consolidadas, ' + r.descartadas + ' descartadas, ' + r.sem_regra + ' sem regra inferível';
    if(r.exemplos && r.exemplos.length > 0){
      resp += '. Exemplos: ' + r.exemplos.slice(0, 2).map(e => e.regra).join(' | ');
    }
    return {resposta_direta: resp, promotor: true};
  });
  
  v112_registrar_handler('h_introspec', (m, input) => {
    if(typeof v112_introspector_relatar !== 'function') return null;
    const r = v112_introspector_relatar();
    if(!r) return null;
    return {resposta_direta: 'falhas registradas: ' + r.total_falhas + ', padrões: ' + r.padroes_detectados + ', sugestões pendentes: ' + r.sugestoes_pendentes + ', consolidadas: ' + r.sugestoes_consolidadas, introspec: true};
  });
  
  v112_registrar_handler('h_adapt_rel', (m, input) => {
    if(typeof v112_adapt_relatar !== 'function') return null;
    const r = v112_adapt_relatar();
    return {resposta_direta: 'camada ADAPT: ' + (r?r.total:0) + ' regras (' + (r?r.consolidadas:0) + ' consolidadas, ' + (r?r.experimentais:0) + ' experimentais)', adapt: true};
  });
  
  v112_registrar_handler('h_validar', (m, input) => {
    if(typeof v112_validador_testar_regressao !== 'function') return null;
    const r = v112_validador_testar_regressao();
    return {resposta_direta: 'regressão: ' + r.ok + '/' + r.total + ' (' + (r.passou ? 'PASSOU ✓' : 'FALHOU ❌') + ')', validador: true};
  });
  
  v112_registrar_handler('h_regras_nos_rel', (m, input) => {
    if(typeof v112_regras_relatar !== 'function') return null;
    const r = v112_regras_relatar();
    return {resposta_direta: 'regras-nós: ' + r.total + ' regras, ' + (r.por_categoria.nlp ? r.por_categoria.nlp.total_aplicacoes : 0) + ' aplicações totais', regras_nos: true};
  });
  
  v112_registrar_handler('h_comandos_rel', (m, input) => {
    const r = v112_comandos_relatar();
    return {resposta_direta: 'comandos-nós: ' + r.total + ' nós, ' + r.ativos + ' ativados, ' + r.total_aplicacoes + ' aplicações', comandos_nos: true};
  });
  
  // ═══════════════════════════════════════════════════════════════
  // LAB 13.16 — +15 handlers (causal, mundo, loop, propagação, reverso)
  // ═══════════════════════════════════════════════════════════════
  
  // h_causal_indexar: "X causa Y"
  v112_registrar_handler('h_causal_indexar', (m, input) => {
    if(typeof v112_causal_indexar !== 'function') return null;
    const causa = m[1].trim();
    const efeito = m[2].trim().replace(/[\?\.]+$/, '');
    if(!causa || !efeito || causa.includes(' ') || efeito.includes(' ')) return null;
    // Bloqueia palavras genéricas como "que", "o que" que não são entidades
    const palavras_bloqueadas = ['que', 'qual', 'porque', 'como', 'quem', 'quanto'];
    if(palavras_bloqueadas.includes(causa) || palavras_bloqueadas.includes(efeito)) return null;
    v112_causal_indexar(causa, efeito);
    return {resposta_direta: causa + ' → ' + efeito + ' (registrada)', causal_idx: true};
  });
  
  // h_causal_consultar: "o que X causa"
  v112_registrar_handler('h_causal_consultar', (m, input) => {
    if(typeof v112_causal_consultar !== 'function') return null;
    const palavra = m[1].trim().replace(/[\?\.]+$/, '');
    if(!palavra || palavra.includes(' ')) return null;
    const efeitos = v112_causal_consultar(palavra);
    if(efeitos.length > 0){
      return {resposta_direta: palavra + ' causa: ' + efeitos.join(', '), causal_consultar: true};
    }
    // auto-ciclo?
    const sr = V112.subredes.B_causal;
    if(sr){
      const cc = v112_node_by_id(sr.id);
      if(cc && cc._causa_de && cc._causa_de[palavra]){
        const set = cc._causa_de[palavra];
        if(set && set.has && set.has(palavra)){
          return {resposta_direta: palavra + ' causa: ' + palavra + ' (auto-ciclo detectado)', causal_autociclo: true};
        }
      }
    }
    return null;
  });
  
  // h_causal_reverso: "o que causa X"
  v112_registrar_handler('h_causal_reverso', (m, input) => {
    if(typeof v112_causal_reverso !== 'function' && typeof v112_buscar_raiz !== 'function') return null;
    const efeito = m[1].trim().replace(/[\?\.]+$/, '');
    if(!efeito || efeito.includes(' ')) return null;
    
    // Pega antecedentes diretos do B_causal
    const sr = V112.subredes.B_causal;
    if(!sr) return null;
    const cc = v112_node_by_id(sr.id);
    if(!cc || !cc._efeito_de || !cc._efeito_de[efeito]) return null;
    const causas_diretas = cc._efeito_de[efeito].has ? Array.from(cc._efeito_de[efeito]) : cc._efeito_de[efeito];
    if(causas_diretas.length === 0) return null;
    
    // Inclui causas transitivas (BFS reverso)
    const todas = new Set(causas_diretas);
    const fila = causas_diretas.slice();
    while(fila.length > 0){
      const x = fila.shift();
      if(cc._efeito_de[x]){
        const ant = cc._efeito_de[x].has ? Array.from(cc._efeito_de[x]) : cc._efeito_de[x];
        for(const a of ant){
          if(!todas.has(a)){
            todas.add(a);
            fila.push(a);
          }
        }
      }
    }
    return {resposta_direta: 'o que causa ' + efeito + ': ' + Array.from(todas).join(', '), causal_reverso: true};
  });
  
  // h_mundo_set: "X = N"
  v112_registrar_handler('h_mundo_set', (m, input) => {
    if(typeof v112_mundo_set !== 'function') return null;
    const chave = m[1].trim().toLowerCase();
    const val = parseFloat(m[2]);
    if(isNaN(val)) return null;
    v112_mundo_set(chave, val);
    return {resposta_direta: chave + ' = ' + val + ' (mundo)', mundo: true};
  });
  
  // h_mundo_get: "quanto vale X" / "quanto tem X"
  v112_registrar_handler('h_mundo_get', (m, input) => {
    if(typeof v112_mundo_get !== 'function') return null;
    const chave = m[1].trim().toLowerCase();
    const val = v112_mundo_get(chave);
    if(val === null || val === undefined) return null;
    return {resposta_direta: chave + ' = ' + val, mundo: true};
  });
  
  // h_mundo_soma: "soma N ao X"
  v112_registrar_handler('h_mundo_soma', (m, input) => {
    if(typeof v112_mundo_op !== 'function') return null;
    const val = parseFloat(m[1]);
    const chave = m[2].trim().toLowerCase();
    if(isNaN(val)) return null;
    const novo = v112_mundo_op(chave, '+', val);
    return {resposta_direta: chave + ' = ' + novo, mundo_op: true};
  });
  
  // h_mundo_sub: "subtrai N do X"
  v112_registrar_handler('h_mundo_sub', (m, input) => {
    if(typeof v112_mundo_op !== 'function') return null;
    const val = parseFloat(m[1]);
    const chave = m[2].trim().toLowerCase();
    if(isNaN(val)) return null;
    const novo = v112_mundo_op(chave, '-', val);
    return {resposta_direta: chave + ' = ' + novo, mundo_op: true};
  });
  
  // h_mundo_estado: "estado do mundo"
  v112_registrar_handler('h_mundo_estado', (m, input) => {
    if(typeof v112_mundo_estado !== 'function') return null;
    const e = v112_mundo_estado();
    const linhas = Object.entries(e).map(([k,v]) => k + '=' + v).join(', ');
    if(!linhas) return null;
    return {resposta_direta: 'mundo: {' + linhas + '}', mundo_estado: true};
  });
  
  // h_loop_vezes: "vaza N do X K vezes" / "soma N ao X K vezes"
  v112_registrar_handler('h_loop_vezes', (m, input) => {
    if(typeof v112_loop_executar !== 'function') return null;
    const verbo = m[1].toLowerCase();
    const val = parseFloat(m[2]);
    const chave = m[3].trim().toLowerCase();
    const ate_zero = m[7] !== undefined;
    const n = ate_zero ? 100000 : parseInt(m[4] || m[5] || m[6]);
    if(!n) return null;
    const op = (verbo === 'soma' || verbo === 'adiciona') ? '+' : '-';
    const opcoes = {detectar_convergencia: true};
    if(ate_zero) opcoes.floor_em = {[chave]: 0};
    const r = v112_loop_executar([[chave, op, val]], n, opcoes);
    let resp = chave + ' = ' + r.estado_final[chave] + ' após ' + r.ciclos_executados + ' ciclos';
    if(r.convergiu) resp += ' (convergiu em ' + r.convergiu_em + ')';
    resp += ' [' + r.tempo_ms + 'ms]';
    return {resposta_direta: resp, loop: true};
  });
  
  // h_loop_enquanto: "enquanto X > N: subtrai 1 do X"
  v112_registrar_handler('h_loop_enquanto', (m, input) => {
    if(typeof v112_loop_enquanto !== 'function') return null;
    const chave_c = m[1].toLowerCase();
    let op_c = m[2];
    if(op_c === '=') op_c = '==';
    const val_c = parseFloat(m[3]);
    const op_str = m[4];
    const m_op = op_str.match(/(soma|adiciona|subtrai|tira|remove|vaza|drena)\s+(-?\d+(?:\.\d+)?)\s+(?:ao|no|do|da|de)\s+([\wÀ-ÿ]+)/);
    if(!m_op) return null;
    const op = (m_op[1] === 'soma' || m_op[1] === 'adiciona') ? '+' : '-';
    const r = v112_loop_enquanto(chave_c, op_c, val_c, [[m_op[3].toLowerCase(), op, parseFloat(m_op[2])]], {max_ciclos: 100000});
    let resp = m_op[3] + ' = ' + r.estado_final[m_op[3].toLowerCase()] + ' (' + r.ciclos_executados + ' iterações, parou por ' + r.parou_por + ') [' + r.tempo_ms + 'ms]';
    return {resposta_direta: resp, loop_enquanto: true};
  });
  
  // h_propagacao: "propaga X" / "alcança de X"
  v112_registrar_handler('h_propagacao', (m, input) => {
    if(typeof v112_propagar_profundo !== 'function') return null;
    const origem = m[1].trim().replace(/[\?\.]+$/, '');
    if(!origem) return null;
    const r = v112_propagar_profundo(origem, {max_profundidade: 1000, max_nos: 5000});
    if(!r || r.total === 0) return null;
    let resp = origem + ' → ' + r.total + ' nós alcançados, profundidade ' + r.profundidade;
    if(r.ciclos.length > 0) resp += ' | ⚠ ' + r.ciclos.length + ' ciclo(s)';
    resp += ' [' + r.tempo_ms + 'ms]';
    if(r.alcancados.length > 0) resp += '\n  primeiros: ' + r.alcancados.slice(0, 10).join(', ');
    return {resposta_direta: resp, propagacao: true};
  });
  
  // h_se_entao: "se X então Y"
  v112_registrar_handler('h_se_entao', (m, input) => {
    if(typeof v112_causal_indexar !== 'function') return null;
    const causa = m[1].trim();
    const efeito = m[2].trim().replace(/[\?\.]+$/, '');
    if(!causa || !efeito) return null;
    v112_causal_indexar(causa, efeito);
    return {resposta_direta: 'se ' + causa + ' então ' + efeito + ' (registrado)', se_entao: true};
  });
  
  // h_conjuncao: "X e Y" — quando X e Y são causas/efeitos diferentes
  v112_registrar_handler('h_conjuncao', (m, input) => {
    if(typeof v112_causal_consultar !== 'function') return null;
    const a = m[1].trim();
    const b = m[2].trim().replace(/[\?\.]+$/, '');
    if(!a || !b || a.includes(' ') || b.includes(' ')) return null;
    const efeitos_a = v112_causal_consultar(a);
    const efeitos_b = v112_causal_consultar(b);
    if(efeitos_a.length === 0 && efeitos_b.length === 0) return null;
    const todos = [...efeitos_a, ...efeitos_b];
    // Detecta conflitos via B_conflito se existir
    let conflitos_str = '';
    if(typeof v112_detectar_conflito === 'function'){
      const conf = v112_detectar_conflito(todos);
      if(conf && conf.length > 0){
        conflitos_str = ' | ⚠ conflito ' + conf.map(c => c.categoria).join(', ');
      }
    }
    return {resposta_direta: a + ' + ' + b + ' → ' + todos.join(', ') + conflitos_str, conjuncao: true};
  });
  
  // h_sudoku: "resolva sudoku <81 chars>"
  v112_registrar_handler('h_sudoku', (m, input) => {
    if(typeof v112_sudoku_solve !== 'function') return null;
    const puzzle = m[1].trim();
    if(puzzle.length !== 81 && puzzle.replace(/[^0-9.]/g, '').length !== 81) return null;
    const r = v112_sudoku_solve(puzzle);
    if(!r.sucesso) return null;
    return {resposta_direta: 'sudoku resolvido em ' + r.iter + ' iter / ' + r.tempo_ms + 'ms: ' + r.str.substring(0,20) + '...', sudoku: true};
  });
  
  // ═══════════════════════════════════════════════════════════════
  // LAB 13.17 — +12 handlers (geometria, álgebra, trig, expressão)
  // ═══════════════════════════════════════════════════════════════
  
  // h_geo_distancia: "distância entre (x,y) e (x,y)"
  v112_registrar_handler('h_geo_distancia', (m, input) => {
    if(typeof v112_geo_distancia !== 'function') return null;
    // Extrai pontos do input original
    const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+(?:\.\d+)?))?\s*\)/g;
    const pts = [];
    let mm;
    while((mm = re.exec(input)) !== null){
      const p = [parseFloat(mm[1]), parseFloat(mm[2])];
      if(mm[3] !== undefined) p.push(parseFloat(mm[3]));
      pts.push(p);
    }
    if(pts.length < 2) return null;
    const d = v112_geo_distancia(pts[0], pts[1]);
    if(d === null) return null;
    return {resposta_direta: 'distância de (' + pts[0].join(',') + ') a (' + pts[1].join(',') + ') = ' + d, geo_dist: true};
  });
  
  // h_geo_ponto_medio: "ponto médio entre (x,y) e (x,y)"
  v112_registrar_handler('h_geo_ponto_medio', (m, input) => {
    if(typeof v112_geo_ponto_medio !== 'function') return null;
    const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+(?:\.\d+)?))?\s*\)/g;
    const pts = [];
    let mm;
    while((mm = re.exec(input)) !== null){
      const p = [parseFloat(mm[1]), parseFloat(mm[2])];
      if(mm[3] !== undefined) p.push(parseFloat(mm[3]));
      pts.push(p);
    }
    if(pts.length < 2) return null;
    const pm = v112_geo_ponto_medio(pts[0], pts[1]);
    if(!pm) return null;
    return {resposta_direta: 'ponto médio = (' + pm.join(',') + ')', geo_pm: true};
  });
  
  // h_geo_area_triangulo: "área do triângulo (x,y) (x,y) (x,y)"
  v112_registrar_handler('h_geo_area_tri', (m, input) => {
    if(typeof v112_geo_area_triangulo !== 'function') return null;
    const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
    const pts = [];
    let mm;
    while((mm = re.exec(input)) !== null){
      pts.push([parseFloat(mm[1]), parseFloat(mm[2])]);
    }
    if(pts.length < 3) return null;
    const a = v112_geo_area_triangulo(pts[0], pts[1], pts[2]);
    if(a === null) return null;
    return {resposta_direta: 'área do triângulo = ' + a, geo_area: true};
  });
  
  // h_algebra_resolva: "resolva: <equação>"
  v112_registrar_handler('h_algebra_resolva', (m, input) => {
    const eq = m[1].trim();
    if(!eq.includes('=')) return null;
    
    // Detecta 2º grau (tem x^2 ou x²)
    const eh_quad = /x\s*[\^²]\s*2|x²/.test(eq);
    
    if(eh_quad && typeof v112_algebra_2grau === 'function'){
      const r = v112_algebra_2grau(eq);
      if(!r || r.erro) return null;
      if(r.x1 !== undefined && r.x2 !== undefined){
        if(r.x1 === r.x2) return {resposta_direta: 'x = ' + r.x1 + ' (raiz dupla)', algebra: 'quad_dupla'};
        return {resposta_direta: 'x₁ = ' + r.x1 + ', x₂ = ' + r.x2, algebra: 'quad'};
      }
      return null;
    }
    
    if(typeof v112_algebra_1grau === 'function'){
      const r = v112_algebra_1grau(eq);
      if(!r || r.erro) return null;
      if(r.x !== undefined){
        return {resposta_direta: 'x = ' + r.x, algebra: 'linear'};
      }
    }
    return null;
  });
  
  // h_trig_sin: "sin(N)"
  v112_registrar_handler('h_trig_sin', (m, input) => {
    if(typeof v112_trig !== 'function') return null;
    const ang = parseFloat(m[1]);
    if(isNaN(ang)) return null;
    const r = v112_trig('sin', ang);
    if(!r || !r.ok) return null;
    const txt = r.exato || r.aprox || r.valor;
    return {resposta_direta: 'sin(' + ang + '°) = ' + txt, trig: 'sin'};
  });
  
  // h_trig_cos: "cos(N)"
  v112_registrar_handler('h_trig_cos', (m, input) => {
    if(typeof v112_trig !== 'function') return null;
    const ang = parseFloat(m[1]);
    if(isNaN(ang)) return null;
    const r = v112_trig('cos', ang);
    if(!r || !r.ok) return null;
    const txt = r.exato || r.aprox || r.valor;
    return {resposta_direta: 'cos(' + ang + '°) = ' + txt, trig: 'cos'};
  });
  
  // h_trig_tan: "tan(N)"
  v112_registrar_handler('h_trig_tan', (m, input) => {
    if(typeof v112_trig !== 'function') return null;
    const ang = parseFloat(m[1]);
    if(isNaN(ang)) return null;
    const r = v112_trig('tan', ang);
    if(!r || !r.ok) return null;
    const txt = r.exato || r.aprox || r.valor;
    return {resposta_direta: 'tan(' + ang + '°) = ' + txt, trig: 'tan'};
  });
  
  // h_fatorial: "N!"
  v112_registrar_handler('h_fatorial', (m, input) => {
    const n = parseInt(m[1]);
    if(isNaN(n) || n < 0 || n > 170) return null;
    let res = 1n;
    for(let i = 2; i <= n; i++) res *= BigInt(i);
    return {resposta_direta: n + '! = ' + res.toString(), fatorial: true};
  });
  
  // h_sqrt: "sqrt(N)" / "raiz quadrada de N"
  v112_registrar_handler('h_sqrt', (m, input) => {
    const n = parseFloat(m[1]);
    if(isNaN(n) || n < 0) return null;
    const r = Math.sqrt(n);
    const r_str = Number.isInteger(r) ? r : r.toFixed(4);
    return {resposta_direta: '√' + n + ' = ' + r_str, sqrt: true};
  });
  
  // h_expressao: avalia expressão direta (números + operadores)
  // CONSERVADOR: só pega expressões que NÃO contêm divisão por zero
  // E só números pequenos (deixa BigInt pros hooks JS originais lidarem)
  v112_registrar_handler('h_expressao', (m, input) => {
    if(typeof v112_expressao_calcular !== 'function') return null;
    const expr = input.trim();
    if(!/[+\-*\/]/.test(expr)) return null;
    if(!/^[\d+\-*\/\s().!]+$/.test(expr) && !/^\d+\s*\*\*\s*\d+/.test(expr)) return null;
    // Não pega se números individuais > 7 dígitos (deixa BigInt JS antigo lidar)
    const nums = expr.match(/\d+/g) || [];
    if(nums.some(n => n.length > 7)) return null;
    // Não pega divisão por zero (deixa hook JS antigo retornar "indefinido")
    if(/\/\s*0(?:\D|$)/.test(expr)) return null;
    const r = v112_expressao_calcular(expr);
    if(!r || r.erro || r.resultado === undefined) return null;
    // Se resultado é Infinity ou NaN, descarta
    if(!isFinite(r.resultado) && typeof r.resultado === 'number') return null;
    return {resposta_direta: expr + ' = ' + r.resultado, expr: true};
  });
  
  // h_combinacao: "C(n, k)"
  v112_registrar_handler('h_combinacao', (m, input) => {
    const n = parseInt(m[1]);
    const k = parseInt(m[2]);
    if(isNaN(n) || isNaN(k) || k > n || k < 0) return null;
    let num = 1n, den = 1n;
    for(let i = 0; i < k; i++){
      num *= BigInt(n - i);
      den *= BigInt(i + 1);
    }
    const c = num / den;
    return {resposta_direta: 'C(' + n + ', ' + k + ') = ' + c.toString(), combinacao: true};
  });
  
  // h_permutacao: "P(n, k)"
  v112_registrar_handler('h_permutacao', (m, input) => {
    const n = parseInt(m[1]);
    const k = parseInt(m[2]);
    if(isNaN(n) || isNaN(k) || k > n || k < 0) return null;
    let p = 1n;
    for(let i = 0; i < k; i++) p *= BigInt(n - i);
    return {resposta_direta: 'P(' + n + ', ' + k + ') = ' + p.toString(), permutacao: true};
  });
  
  // ═══════════════════════════════════════════════════════════════
  // LAB 13.18 — +14 handlers (química, eletrônica, bayes, estado, geo, simulação)
  // ═══════════════════════════════════════════════════════════════
  
  // h_quim_atomos: "quantos átomos em <formula>"
  v112_registrar_handler('h_quim_atomos', (m, input) => {
    if(typeof v112_quimica_total_atomos !== 'function') return null;
    const formula = m[1].trim();
    const n = v112_quimica_total_atomos(formula);
    if(n === null || n === undefined) return null;
    let breakdown = '';
    if(typeof v112_quimica_parse === 'function'){
      try {
        const det = v112_quimica_parse(formula);
        if(det) breakdown = ' (' + Object.entries(det).map(([el,q]) => q + ' ' + el).join(' + ') + ')';
      } catch(e){}
    }
    return {resposta_direta: formula + ' tem ' + n + ' átomos' + breakdown, quim_atomos: true};
  });
  
  // h_quim_massa: "massa molecular de X" / "peso molecular de X"
  v112_registrar_handler('h_quim_massa', (m, input) => {
    if(typeof v112_quimica_massa !== 'function') return null;
    const formula = m[1].trim();
    const massa = v112_quimica_massa(formula);
    if(massa === null || massa === undefined) return null;
    return {resposta_direta: 'massa molecular de ' + formula + ' = ' + massa, quim_massa: true};
  });
  
  // h_quim_balancear: "balanceie: X + Y → Z"
  v112_registrar_handler('h_quim_balancear', (m, input) => {
    if(typeof v112_quimica_balancear_str !== 'function') return null;
    const reagentes = m[1].trim();
    const produtos = m[2].trim();
    const r = v112_quimica_balancear_str(reagentes, produtos);
    if(!r || r.erro) return null;
    return {resposta_direta: r.balanceada || (r.str), quim_balancear: true};
  });
  
  // h_eletronica_porta: "AND A B" / "OR A B" / "XOR A B" — A B em 0/1
  v112_registrar_handler('h_eletronica_porta', (m, input) => {
    const porta = m[1].toUpperCase();
    const a = parseInt(m[2]);
    const b = parseInt(m[3]);
    if(isNaN(a) || isNaN(b) || (a !== 0 && a !== 1) || (b !== 0 && b !== 1)) return null;
    let r;
    if(porta === 'AND') r = a & b;
    else if(porta === 'OR') r = a | b;
    else if(porta === 'XOR') r = a ^ b;
    else if(porta === 'NAND') r = 1 - (a & b);
    else if(porta === 'NOR') r = 1 - (a | b);
    else if(porta === 'XNOR') r = 1 - (a ^ b);
    else return null;
    return {resposta_direta: porta + ' ' + a + ' ' + b + ' = ' + r, eletronica: porta};
  });
  
  // h_eletronica_not: "NOT A"
  v112_registrar_handler('h_eletronica_not', (m, input) => {
    const a = parseInt(m[1]);
    if(isNaN(a) || (a !== 0 && a !== 1)) return null;
    return {resposta_direta: 'NOT ' + a + ' = ' + (1 - a), eletronica: 'NOT'};
  });
  
  // h_bayes: "bayes <P(B|A)> <P(A)> <P(B)>"
  v112_registrar_handler('h_bayes', (m, input) => {
    if(typeof v112_bayes !== 'function') return null;
    const p_b_a = parseFloat(m[1]);
    const p_a = parseFloat(m[2]);
    const p_b = parseFloat(m[3]);
    if(isNaN(p_b_a) || isNaN(p_a) || isNaN(p_b)) return null;
    const r = v112_bayes(p_b_a, p_a, p_b);
    if(r === null || r === undefined) return null;
    const r_num = typeof r === 'number' ? r : parseFloat(r);
    if(isNaN(r_num)) return null;
    return {resposta_direta: 'P(A|B) = ' + p_b_a + ' × ' + p_a + ' / ' + p_b + ' = ' + r + ' (' + (r_num*100).toFixed(2) + '%)', bayes: true};
  });
  
  // h_estado_set: "<obj> está <propriedade>" / "<obj> tem <prop>"
  v112_registrar_handler('h_estado_set', (m, input) => {
    if(typeof v112_estado_set !== 'function') return null;
    const obj = m[1].trim().toLowerCase();
    const prop = m[2].trim().toLowerCase();
    if(!obj || !prop) return null;
    if(obj.includes(' ') || prop.includes(' ')) return null;
    // Bloqueia palavras genéricas (impede confusão com perguntas)
    const bloqueio = ['que', 'qual', 'porque', 'como', 'quem', 'isso'];
    if(bloqueio.includes(obj)) return null;
    v112_estado_set(obj, prop, true);
    return {resposta_direta: obj + ' está ' + prop + ' (estado registrado)', estado_set: true};
  });
  
  // h_estado_aplicar: "<acao> o <obj>" — ex "esquentar o agua", "esfriar o copo"
  v112_registrar_handler('h_estado_aplicar', (m, input) => {
    if(typeof v112_estado_aplicar !== 'function') return null;
    const acao = m[1].trim().toLowerCase();
    const obj = m[2].trim().toLowerCase();
    if(!acao || !obj) return null;
    const r = v112_estado_aplicar(obj, acao);
    if(!r || r.erro) return null;
    const descr = (typeof v112_estado_descrever === 'function') ? v112_estado_descrever(obj) : '';
    return {resposta_direta: acao + ' → ' + obj + (descr ? ' agora: ' + descr : ''), estado_aplicar: true};
  });
  
  // h_estado_descrever: "como está X"
  v112_registrar_handler('h_estado_descrever', (m, input) => {
    if(typeof v112_estado_descrever !== 'function') return null;
    const obj = m[1].trim().toLowerCase();
    if(!obj) return null;
    const descr = v112_estado_descrever(obj);
    if(!descr) return null;
    return {resposta_direta: obj + ': ' + descr, estado_descrever: true};
  });
  
  // h_geo_angulo: "ângulo entre (x,y) e (x,y)"
  v112_registrar_handler('h_geo_angulo', (m, input) => {
    if(typeof v112_geo_angulo !== 'function') return null;
    const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+(?:\.\d+)?))?\s*\)/g;
    const pts = [];
    let mm;
    while((mm = re.exec(input)) !== null){
      const p = [parseFloat(mm[1]), parseFloat(mm[2])];
      if(mm[3] !== undefined) p.push(parseFloat(mm[3]));
      pts.push(p);
    }
    if(pts.length < 2) return null;
    const ang = v112_geo_angulo(pts[0], pts[1]);
    if(ang === null || ang === undefined) return null;
    return {resposta_direta: 'ângulo entre vetores = ' + ang + '°', geo_angulo: true};
  });
  
  // h_geo_produto_escalar: "produto escalar (x,y) (x,y)"
  v112_registrar_handler('h_geo_dot', (m, input) => {
    if(typeof v112_geo_dot !== 'function') return null;
    const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+(?:\.\d+)?))?\s*\)/g;
    const pts = [];
    let mm;
    while((mm = re.exec(input)) !== null){
      const p = [parseFloat(mm[1]), parseFloat(mm[2])];
      if(mm[3] !== undefined) p.push(parseFloat(mm[3]));
      pts.push(p);
    }
    if(pts.length < 2) return null;
    const r = v112_geo_dot(pts[0], pts[1]);
    if(r === null || r === undefined) return null;
    return {resposta_direta: 'produto escalar = ' + r, geo_dot: true};
  });
  
  // h_geo_produto_vetorial: "cross (x,y,z) (x,y,z)" / "produto vetorial"
  v112_registrar_handler('h_geo_cross', (m, input) => {
    if(typeof v112_geo_cross !== 'function') return null;
    const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+(?:\.\d+)?))?\s*\)/g;
    const pts = [];
    let mm;
    while((mm = re.exec(input)) !== null){
      const p = [parseFloat(mm[1]), parseFloat(mm[2])];
      if(mm[3] !== undefined) p.push(parseFloat(mm[3]));
      pts.push(p);
    }
    if(pts.length < 2) return null;
    const r = v112_geo_cross(pts[0], pts[1]);
    if(!r) return null;
    return {resposta_direta: 'produto vetorial = (' + r.join(',') + ')', geo_cross: true};
  });
  
  // h_simulador_vela: "simule vela <comp> <lados>"
  v112_registrar_handler('h_simular_vela', (m, input) => {
    if(typeof v112_simular_vela !== 'function') return null;
    const comp = parseFloat(m[1]);
    const lados = parseInt(m[2]);
    if(isNaN(comp) || isNaN(lados) || lados < 1 || lados > 4) return null;
    const r = v112_simular_vela(comp, 1, lados);
    if(!r) return null;
    return {resposta_direta: 'vela queima em ' + r.ticks + ' ticks (comprimento=' + comp + ', taxa=1, lados=' + lados + ')', vela: true};
  });
  
  // h_indutor: "padrão: a → b, c → d, então e = ?"
  v112_registrar_handler('h_indutor', (m, input) => {
    if(typeof v112_indutor_aprender !== 'function' || typeof v112_indutor_aplicar !== 'function') return null;
    
    // Refaz parsing igual ao hook JS antigo
    const txt_orig = String(input).toLowerCase();
    const mat_ind = txt_orig.match(/^padr[ãa]o\s*[:=]\s*(.+?)(?:,\s*ent[ãa]o\s+(.+?)\s*=?\s*\??)\s*$/);
    if(!mat_ind) return null;
    
    const corpo = mat_ind[1];
    const consulta = mat_ind[2].trim().replace(/[\?\.]+$/,'');
    
    const pares = [];
    const partes = corpo.split(/[,;]/).map(p => p.trim());
    for(const p of partes){
      const mp = p.match(/^(.+?)\s*(?:→|->|=>|\s+vira\s+|\s+da\s+|\s+gera\s+)\s*(.+?)$/);
      if(mp) pares.push({in: mp[1].trim(), out: mp[2].trim()});
    }
    if(pares.length < 1) return null;
    
    const regra = v112_indutor_aprender(pares);
    if(!regra) return null;
    
    const res = v112_indutor_aplicar(regra, consulta);
    if(res === null) return null;
    
    let descr_padrao = '';
    if(regra.tipo === 'repeticao') descr_padrao = '"' + regra.char + '" repetido n vezes';
    else if(regra.tipo === 'soma') descr_padrao = 'n + ' + regra.delta;
    else if(regra.tipo === 'multiplicacao') descr_padrao = 'n × ' + regra.fator;
    else descr_padrao = regra.tipo || 'regra';
    
    return {resposta_direta: String(res) + ' (padrão detectado: ' + descr_padrao + ')', indutor: true};
  });
  
  // ═══════════════════════════════════════════════════════════════
  // LAB 13.19 — +12 handlers (labirinto, damas, xadrez, raiz, reverso, meta-regra, conflito)
  // ═══════════════════════════════════════════════════════════════
  
  // h_labirinto: "resolva labirinto: <grid>" — formato grid:
  // "....x|x...x|.....|..x..|....x" linhas separadas por |
  // '.' = livre, 'x' = parede, 'S' = start, 'G' = goal
  v112_registrar_handler('h_labirinto', (m, input) => {
    if(typeof v112_labirinto_resolver !== 'function') return null;
    const grid_str = m[1].trim();
    const linhas = grid_str.split(/[|;]/);
    if(linhas.length < 2) return null;
    // Garante todas mesmo tamanho
    const maxlen = Math.max(...linhas.map(l => l.length));
    if(maxlen < 2) return null;
    
    let start = [0, 0], goal = [linhas.length-1, maxlen-1];
    const grid = linhas.map((l, i) => {
      const linha = [];
      for(let j = 0; j < maxlen; j++){
        const ch = l[j] || '.';
        if(ch === 'S' || ch === 's'){ start = [i, j]; linha.push(0); }
        else if(ch === 'G' || ch === 'g'){ goal = [i, j]; linha.push(0); }
        else if(ch === 'x' || ch === 'X' || ch === '#'){ linha.push(1); }
        else linha.push(0);
      }
      return linha;
    });
    
    try {
      const r = v112_labirinto_resolver(grid, start, goal, {max_passos: 5000});
      if(!r) return null;
      if(!r.sucesso) return {resposta_direta: 'labirinto sem caminho (' + (r.passos || 0) + ' passos tentados)', labirinto: false};
      return {resposta_direta: 'labirinto resolvido: ' + (r.caminho ? r.caminho.length : '?') + ' passos (' + (r.tempo_ms || 0) + 'ms)', labirinto: true};
    } catch(e){
      return null;
    }
  });
  
  // h_damas_inicio: "jogar damas" / "iniciar damas"
  v112_registrar_handler('h_damas_inicio', (m, input) => {
    if(typeof v112_damas_tabuleiro_inicial !== 'function') return null;
    const tab = v112_damas_tabuleiro_inicial();
    const movs = v112_damas_movimentos_validos(tab, 1);
    return {resposta_direta: 'damas iniciado: ' + movs.length + ' movimentos válidos para jogador 1', damas: 'inicio'};
  });
  
  // h_damas_melhor: "melhor lance damas profundidade N"
  v112_registrar_handler('h_damas_melhor', (m, input) => {
    if(typeof v112_damas_melhor_movimento !== 'function') return null;
    const prof = parseInt(m[1]) || 4;
    if(prof < 1 || prof > 7) return null;
    const tab = v112_damas_tabuleiro_inicial();
    const t0 = Date.now();
    const r = v112_damas_melhor_movimento(tab, 1, prof);
    const dt = Date.now() - t0;
    if(!r || !r.melhor_movimento) return null;
    const mov = r.melhor_movimento;
    return {resposta_direta: 'melhor lance damas (prof ' + prof + '): de ('+mov.de[0]+','+mov.de[1]+') para ('+mov.para[0]+','+mov.para[1]+'), score=' + r.score + ' (' + dt + 'ms)', damas: 'minimax'};
  });
  
  // h_xadrez_inicio: "jogar xadrez"
  v112_registrar_handler('h_xadrez_inicio', (m, input) => {
    if(typeof v112_xadrez_tabuleiro_inicial !== 'function') return null;
    const tab = v112_xadrez_tabuleiro_inicial();
    const movs = v112_xadrez_movimentos(tab, true);
    return {resposta_direta: 'xadrez iniciado: ' + movs.length + ' movimentos para brancas', xadrez: 'inicio'};
  });
  
  // h_xadrez_melhor: "melhor lance xadrez profundidade N"
  v112_registrar_handler('h_xadrez_melhor', (m, input) => {
    if(typeof v112_xadrez_melhor_movimento !== 'function') return null;
    const prof = parseInt(m[1]) || 3;
    if(prof < 1 || prof > 4) return null;
    const tab = v112_xadrez_tabuleiro_inicial();
    const t0 = Date.now();
    const r = v112_xadrez_melhor_movimento(tab, true, prof);
    const dt = Date.now() - t0;
    if(!r || !r.melhor_movimento) return null;
    const mov = r.melhor_movimento;
    return {resposta_direta: 'melhor lance xadrez (prof ' + prof + '): ('+mov.de[0]+','+mov.de[1]+')→('+mov.para[0]+','+mov.para[1]+') score=' + r.score + ' (' + dt + 'ms)', xadrez: 'minimax'};
  });
  
  // h_reverso: "consulta reverso de X" / "o que leva a X"
  v112_registrar_handler('h_reverso', (m, input) => {
    if(typeof v112_reverso_consultar !== 'function') return null;
    const efeito = m[1].trim().replace(/[\?\.]+$/, '');
    if(!efeito || efeito.includes(' ')) return null;
    const r = v112_reverso_consultar(efeito);
    // r pode ser array OU {causas: array}
    let causas = null;
    if(Array.isArray(r)) causas = r;
    else if(r && r.causas) causas = r.causas;
    if(!causas || causas.length === 0) return null;
    return {resposta_direta: 'leva a ' + efeito + ': ' + causas.join(', '), reverso: true};
  });
  
  // h_conflito: "há conflito entre X e Y" / "conflito entre A B C"
  v112_registrar_handler('h_conflito', (m, input) => {
    if(typeof v112_detectar_conflito !== 'function') return null;
    const lista = m[1].trim().split(/\s*[,e]\s+|\s+/).filter(x => x.length > 0);
    if(lista.length < 2) return null;
    const conf = v112_detectar_conflito(lista);
    if(!conf || conf.length === 0){
      return {resposta_direta: 'sem conflito detectado entre: ' + lista.join(', '), conflito: 'nenhum'};
    }
    return {resposta_direta: 'conflito detectado: ' + conf.map(c => c.categoria + ' (' + c.tipos.join(' vs ') + ')').join(', '), conflito: 'sim'};
  });
  
  // h_planejamento_consulta: "como X" / "qual o caminho para X"
  v112_registrar_handler('h_planejamento_consulta', (m, input) => {
    const meta = m[1].trim().replace(/[\?\.]+$/, '');
    if(!meta) return null;
    const sr = V112.subredes && V112.subredes.B_planejamento;
    if(!sr) return null;
    const c = v112_node_by_id(sr.id);
    if(!c || !c._planos || !c._planos[meta]) return null;
    const passos = c._planos[meta];
    c.acumulador = Math.min(200, (c.acumulador||0) + 50);
    c._ativacoes = (c._ativacoes||0)+1;
    c._sucessos = (c._sucessos||0)+1;
    return {resposta_direta: 'plano: ' + passos.map((p,i) => (i+1)+') '+p).join(' → '), plano: true};
  });
  
  // h_identidade: "quem é você" / "o que você é"
  v112_registrar_handler('h_identidade', (m, input) => {
    const sr = V112.subredes && V112.subredes.B_identidade;
    if(!sr) return null;
    const c = v112_node_by_id(sr.id);
    if(!c) return null;
    c._ativacoes = (c._ativacoes||0)+1;
    c._sucessos = (c._sucessos||0)+1;
    let resp = 'Sou uma rede neural simbólica.';
    if(c._auto_descricao) resp += ' ' + c._auto_descricao;
    return {resposta_direta: resp, identidade: true};
  });
  
  // h_atalhos: "consolidar atalhos" / "criar atalhos transitividade"
  v112_registrar_handler('h_atalhos', (m, input) => {
    if(typeof v112_meta_regra_consolidar !== 'function') return null;
    const r = v112_meta_regra_consolidar({max_atalhos: 1000});
    return {resposta_direta: r.atalhos_criados + ' atalhos criados via transitividade (testados=' + r.transitivos_testados + ')', atalhos: true};
  });
  
  // h_propagar_profundo: "propaga profundo X até depth N"
  v112_registrar_handler('h_propagar_profundo', (m, input) => {
    if(typeof v112_propagar_profundo !== 'function') return null;
    const origem = m[1].trim().replace(/[\?\.]+$/, '');
    const depth = m[2] ? parseInt(m[2]) : 1000;
    if(!origem) return null;
    const r = v112_propagar_profundo(origem, {max_profundidade: depth, max_nos: 10000});
    if(!r) return null;
    return {resposta_direta: 'propagação profunda de ' + origem + ': ' + r.total + ' nós em profundidade ' + r.profundidade + ' (' + r.tempo_ms + 'ms)', prop_prof: true};
  });
  
  // h_raiz_profunda: "diagnóstico profundo de X"
  v112_registrar_handler('h_raiz_profunda', (m, input) => {
    if(typeof v112_buscar_raiz !== 'function') return null;
    const efeito = m[1].trim().replace(/[\?\.]+$/, '');
    if(!efeito) return null;
    const r = v112_buscar_raiz(efeito);
    if(!r || !r.raizes || r.raizes.length === 0) return null;
    
    // Mostra TODAS as raízes (não só a mais profunda)
    const todas = r.raizes.map(rz => rz.raiz + '(prof ' + rz.profundidade + ', via ' + rz.caminho.join('→') + ')').join(' | ');
    return {resposta_direta: 'raízes de ' + efeito + ' [' + r.raizes.length + ']: ' + todas, raiz_prof: true};
  });
  
  // ═══════════════════════════════════════════════════════════════
  // LAB 13.20 — +24 handlers finais (paradoxo, silogismo, quantif,
  //             analogia, temporal, salto, excecoes, simulacao,
  //             autobiografia, identidade DNA, planejamento sequência,
  //             vetor, reta, perímetro, módulo, tabela verdade,
  //             simplificar booleana, prob baralho, conjunção composta,
  //             solver einstein, multictx, estado complexo, silencio)
  // ═══════════════════════════════════════════════════════════════
  
  // h_geo_vetor: "vetor de (x,y) a (x,y)"
  v112_registrar_handler('h_geo_vetor', (m, input) => {
    if(typeof v112_geo_vetor !== 'function') return null;
    const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+(?:\.\d+)?))?\s*\)/g;
    const pts = [];
    let mm;
    while((mm = re.exec(input)) !== null){
      const p = [parseFloat(mm[1]), parseFloat(mm[2])];
      if(mm[3] !== undefined) p.push(parseFloat(mm[3]));
      pts.push(p);
    }
    if(pts.length < 2) return null;
    const v = v112_geo_vetor(pts[0], pts[1]);
    if(!v) return null;
    return {resposta_direta: 'vetor de (' + pts[0].join(',') + ') a (' + pts[1].join(',') + ') = (' + v.join(',') + ')', geo_vetor: true};
  });
  
  // h_geo_reta: "equação da reta entre (x,y) e (x,y)"
  v112_registrar_handler('h_geo_reta', (m, input) => {
    if(typeof v112_geo_equacao_reta !== 'function') return null;
    const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
    const pts = [];
    let mm;
    while((mm = re.exec(input)) !== null){
      pts.push([parseFloat(mm[1]), parseFloat(mm[2])]);
    }
    if(pts.length < 2) return null;
    const eq = v112_geo_equacao_reta(pts[0], pts[1]);
    if(!eq) return null;
    let resp;
    if(eq.tipo === 'vertical') resp = 'reta vertical x = ' + eq.x;
    else {
      const m_str = eq.m === 0 ? '' : (eq.m === 1 ? 'x' : eq.m === -1 ? '-x' : eq.m + 'x');
      const b_str = eq.b === 0 ? '' : (eq.b > 0 ? ' + ' + eq.b : ' - ' + Math.abs(eq.b));
      resp = 'y = ' + (m_str || '0') + b_str;
    }
    return {resposta_direta: resp, geo_reta: true};
  });
  
  // h_eletro_tabela: "tabela verdade <expr>"
  v112_registrar_handler('h_eletro_tabela', (m, input) => {
    if(typeof v112_eletro_tabela_verdade !== 'function') return null;
    const expr = m[1].trim();
    const t = v112_eletro_tabela_verdade(expr);
    if(!t || !t.linhas) return null;
    const linhas_str = t.linhas.map(l => l.entradas.join(' ') + ' → ' + l.saida).join(' | ');
    return {resposta_direta: 'tabela verdade ' + expr + ': ' + linhas_str, eletro_tabela: true};
  });
  
  // h_eletro_simplif: "simplifique <expr>"
  v112_registrar_handler('h_eletro_simplif', (m, input) => {
    if(typeof v112_eletro_simplificar !== 'function') return null;
    const expr = m[1].trim();
    const r = v112_eletro_simplificar(expr);
    if(!r) return null;
    const txt = r.simplificada || r.resultado || r;
    return {resposta_direta: 'simplificada: ' + txt, eletro_simplif: true};
  });
  
  // h_prob_baralho: "chance de tirar N ases" / "probabilidade de tirar 2 reis"
  v112_registrar_handler('h_prob_baralho', (m, input) => {
    if(typeof v112_prob_baralho_kcartas !== 'function') return null;
    const k = parseInt(m[1]);
    const tipo = m[2].toLowerCase();
    let total_alvo = 4;
    if(/dama/.test(tipo)) total_alvo = 4;
    else if(/rei/.test(tipo)) total_alvo = 4;
    else if(/valet/.test(tipo)) total_alvo = 4;
    else if(/ase|ás/.test(tipo)) total_alvo = 4;
    if(isNaN(k) || k < 1 || k > 5) return null;
    const r = v112_prob_baralho_kcartas(k, total_alvo);
    if(!r) return null;
    const txt = (typeof r === 'number') ? r.toFixed(6) : (r.probabilidade || r);
    return {resposta_direta: 'P(tirar ' + k + ' ' + tipo + ') = ' + txt, prob: true};
  });
  
  // h_silogismo: "se P então Q. P. logo?" / "se P então Q. P." 
  v112_registrar_handler('h_silogismo', (m, input) => {
    const p = m[1].trim().toLowerCase();
    const q = m[2].trim().toLowerCase();
    const fato = m[3].trim().toLowerCase();
    if(!p || !q || !fato) return null;
    // Modus ponens: se P → Q, e P é verdade, logo Q
    if(fato === p || fato.includes(p)){
      return {resposta_direta: 'logo: ' + q + ' (modus ponens)', silogismo: 'ponens'};
    }
    // Modus tollens: se P → Q, e Q é falso, logo P é falso
    if(fato === 'não ' + q || fato.includes('não ' + q)){
      return {resposta_direta: 'logo: não ' + p + ' (modus tollens)', silogismo: 'tollens'};
    }
    return null;
  });
  
  // h_analogia: "A está para B como C está para ?"
  v112_registrar_handler('h_analogia', (m, input) => {
    const A = m[1].trim().toLowerCase();
    const B = m[2].trim().toLowerCase();
    const C = m[3].trim().toLowerCase();
    if(!A || !B || !C) return null;
    // Procura D tal que A→B sentido similar a C→D
    // Estratégia simples: olha B_causal — se A causa B, tenta C causa ?
    if(typeof v112_causal_consultar === 'function'){
      const efeitos_A = v112_causal_consultar(A);
      const efeitos_C = v112_causal_consultar(C);
      if(efeitos_A.includes(B) && efeitos_C.length > 0){
        return {resposta_direta: A + ':' + B + ' :: ' + C + ':' + efeitos_C[0] + ' (analogia causal)', analogia: true};
      }
    }
    // Estratégia 2: olha tipo/categoria via B_bidir
    const sr = V112.subredes && V112.subredes.B_bidir;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c && c._categorias_por_instancia){
        const cat_A = c._categorias_por_instancia[A];
        const cat_C = c._categorias_por_instancia[C];
        if(cat_A && cat_C && cat_A.size > 0 && cat_C.size > 0){
          const cat_A_arr = Array.from(cat_A);
          // Se B é categoria de A, tenta achar categoria de C
          if(cat_A_arr.includes(B)){
            return {resposta_direta: A + ':' + B + ' :: ' + C + ':' + Array.from(cat_C)[0] + ' (analogia categórica)', analogia: true};
          }
        }
      }
    }
    return null;
  });
  
  // h_quantif_todo: "todo X é Y" (define), "algum X é Y?", "nenhum X é Y?"
  v112_registrar_handler('h_quantif', (m, input) => {
    const quant = m[1].toLowerCase();
    const X = m[2].trim().toLowerCase();
    const Y = m[3].trim().toLowerCase().replace(/[\?\.]+$/, '');
    if(!X || !Y) return null;
    if(typeof v112_causal_consultar !== 'function') return null;
    
    const sr = V112.subredes && V112.subredes.B_bidir;
    let cat_de_X = new Set();
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c && c._categorias_por_instancia && c._categorias_por_instancia[X]){
        cat_de_X = c._categorias_por_instancia[X];
      }
    }
    
    if(quant === 'todo' || quant === 'todos' || quant === 'toda' || quant === 'todas'){
      // Pergunta: todo X é Y? — verifica se Y está em categorias de X
      if(cat_de_X.has(Y)) return {resposta_direta: 'sim, todo ' + X + ' é ' + Y, quantif: 'todo_sim'};
      return {resposta_direta: 'não confirmado: todo ' + X + ' ser ' + Y, quantif: 'todo_indef'};
    }
    if(quant === 'algum' || quant === 'alguma' || quant === 'alguns'){
      if(cat_de_X.has(Y)) return {resposta_direta: 'sim, algum ' + X + ' é ' + Y, quantif: 'algum_sim'};
      return null;
    }
    if(quant === 'nenhum' || quant === 'nenhuma'){
      if(cat_de_X.has(Y)) return {resposta_direta: 'falso: existe ' + X + ' que é ' + Y, quantif: 'nenhum_falso'};
      return {resposta_direta: 'não confirmado: nenhum ' + X + ' ser ' + Y, quantif: 'nenhum_indef'};
    }
    return null;
  });
  
  // h_temporal: "X antes de Y" → indexa ; "X foi antes ou depois de Z?"
  v112_registrar_handler('h_temporal_set', (m, input) => {
    const A = m[1].trim().toLowerCase();
    const B = m[2].trim().toLowerCase();
    if(!A || !B) return null;
    const sr = V112.subredes && V112.subredes.B_temporal;
    if(!sr) return null;
    const c = v112_node_by_id(sr.id);
    if(!c) return null;
    if(!c._antes_de) c._antes_de = {};
    if(!c._antes_de[A]) c._antes_de[A] = new Set();
    c._antes_de[A].add(B);
    c._ativacoes = (c._ativacoes||0)+1;
    return {resposta_direta: A + ' antes de ' + B + ' (temporal registrado)', temporal_set: true};
  });
  
  v112_registrar_handler('h_temporal_consultar', (m, input) => {
    const A = m[1].trim().toLowerCase();
    const B = m[2].trim().toLowerCase();
    if(!A || !B) return null;
    const sr = V112.subredes && V112.subredes.B_temporal;
    if(!sr) return null;
    const c = v112_node_by_id(sr.id);
    if(!c || !c._antes_de) return null;
    // BFS transitivo: A antes de X, X antes de B → A antes de B
    const fila = [A];
    const visitados = new Set([A]);
    while(fila.length > 0){
      const x = fila.shift();
      if(c._antes_de[x]){
        for(const y of c._antes_de[x]){
          if(y === B) return {resposta_direta: A + ' antes de ' + B + ' (transitivo)', temporal: 'antes'};
          if(!visitados.has(y)){ visitados.add(y); fila.push(y); }
        }
      }
    }
    // Tenta o reverso
    const fila2 = [B];
    const vis2 = new Set([B]);
    while(fila2.length > 0){
      const x = fila2.shift();
      if(c._antes_de[x]){
        for(const y of c._antes_de[x]){
          if(y === A) return {resposta_direta: A + ' depois de ' + B + ' (transitivo)', temporal: 'depois'};
          if(!vis2.has(y)){ vis2.add(y); fila2.push(y); }
        }
      }
    }
    return null;
  });
  
  // h_excecoes_divzero: explicitamente trata "X / 0"
  v112_registrar_handler('h_excecoes_divzero', (m, input) => {
    const a = parseFloat(m[1]);
    if(isNaN(a)) return null;
    return {resposta_direta: a + ' / 0 = indefinido (divisão por zero)', excecao: 'div0'};
  });
  
  // h_excecoes_raiz_neg: "raiz de -N" / "sqrt(-N)"
  v112_registrar_handler('h_excecoes_raiz_neg', (m, input) => {
    const n = parseFloat(m[1]);
    if(isNaN(n) || n > 0) return null;
    return {resposta_direta: '√' + n + ' = imaginário (raiz de negativo nos reais é impossível)', excecao: 'raiz_neg'};
  });
  
  // h_paradoxo: "X é Y e Y é X" / "esta frase é falsa"
  v112_registrar_handler('h_paradoxo_classico', (m, input) => {
    const txt = input.toLowerCase().trim();
    if(/esta\s+frase\s+é\s+falsa|este\s+enunciado\s+é\s+falso/.test(txt)){
      return {resposta_direta: 'paradoxo de Epimênides: indecidível (auto-referência)', paradoxo: 'epimenides'};
    }
    return null;
  });
  
  v112_registrar_handler('h_paradoxo_ciclico', (m, input) => {
    const X = m[1].trim().toLowerCase();
    const Y = m[2].trim().toLowerCase();
    if(!X || !Y || X === Y) return null;
    // Verifica se Y é Y → X já indexado em B_causal
    if(typeof v112_causal_consultar === 'function'){
      const efeitos_Y = v112_causal_consultar(Y);
      if(efeitos_Y.includes(X)){
        return {resposta_direta: 'paradoxo: ' + X + '↔' + Y + ' (ciclo auto-referencial, indecidível)', paradoxo: 'ciclo'};
      }
    }
    return null;
  });
  
  // h_planejamento_sequencia: "passo1 leva passo2 leva passo3" → mostra ordem
  v112_registrar_handler('h_planejamento_sequencia', (m, input) => {
    const txt = input.toLowerCase();
    const partes = txt.split(/\s+leva\s+/);
    if(partes.length < 3) return null;  // precisa pelo menos 3 passos
    const limpos = partes.map(p => p.trim().replace(/[\?\.]+$/,'')).filter(p => p);
    if(limpos.length < 3) return null;
    return {resposta_direta: 'sequência: ' + limpos.join(' → '), plano_seq: true};
  });
  
  // h_identidade_dna: "quem é nerael" / "o que você é feito" — combina DNA
  v112_registrar_handler('h_identidade_dna', (m, input) => {
    const sr = V112.subredes && V112.subredes.B_identidade;
    if(!sr) return null;
    const c = v112_node_by_id(sr.id);
    if(!c) return null;
    c._ativacoes = (c._ativacoes||0)+1;
    let traços = [];
    if(c._traços) traços = Array.from(c._traços);
    let resp = 'rede neural simbólica';
    if(traços.length > 0) resp += '. Traços: ' + traços.slice(0,5).join(', ');
    if(c._auto_descricao) resp += '. ' + c._auto_descricao;
    return {resposta_direta: resp, identidade_dna: true};
  });
  
  // h_simulacao: "se X acontecesse" / "imagine se X"
  v112_registrar_handler('h_simulacao', (m, input) => {
    const cenario = m[1].trim().toLowerCase();
    if(!cenario) return null;
    if(typeof v112_causal_consultar !== 'function') return null;
    // Sandbox: consulta efeitos sem persistir
    const palavras = cenario.split(/\s+/);
    const efeitos = new Set();
    for(const p of palavras){
      const e = v112_causal_consultar(p);
      for(const x of e) efeitos.add(x);
    }
    if(efeitos.size === 0) return null;
    return {resposta_direta: 'simulando "' + cenario + '" → ' + Array.from(efeitos).slice(0,8).join(', ') + ' (hipotético, não persistido)', simulacao: true};
  });
  
  // h_autobiografia: "lembra quando X" / "o que aconteceu com X"
  v112_registrar_handler('h_autobiografia', (m, input) => {
    const X = m[1].trim().toLowerCase().replace(/[\?\.]+$/, '');
    if(!X) return null;
    const sr = V112.subredes && V112.subredes.B_autobiografia;
    if(!sr) return null;
    const c = v112_node_by_id(sr.id);
    if(!c) return null;
    c._ativacoes = (c._ativacoes||0)+1;
    // Procura eventos contendo X em V112._historia
    const eventos = [];
    if(V112.nodes){
      for(const n of V112.nodes){
        if(n.tipo === 'evento' && n.text && n.text.toLowerCase().includes(X)){
          eventos.push(n.text);
        }
      }
    }
    if(eventos.length === 0) return null;
    return {resposta_direta: 'lembro de: ' + eventos.slice(0,3).join(' | '), autobio: true};
  });
  
  // h_salto: "X tem trait Y?" — busca por traits compartilhados
  v112_registrar_handler('h_salto', (m, input) => {
    const X = m[1].trim().toLowerCase();
    if(!X) return null;
    const sr = V112.subredes && V112.subredes.B_salto;
    if(!sr) return null;
    const c = v112_node_by_id(sr.id);
    if(!c || !c._traits) return null;
    if(!c._traits[X]) return null;
    const traits = c._traits[X];
    const t_arr = traits.has ? Array.from(traits) : traits;
    if(t_arr.length === 0) return null;
    return {resposta_direta: X + ' tem traits: ' + t_arr.slice(0,5).join(', '), salto: true};
  });
  
  // h_multictx: "tudo sobre X" / "dimensões de X"
  v112_registrar_handler('h_multictx', (m, input) => {
    if(typeof v112_multictx_consultar !== 'function') return null;
    const palavra = m[1].trim().toLowerCase().replace(/[\?\.]+$/, '');
    if(!palavra) return null;
    const dims = v112_multictx_consultar(palavra);
    if(!dims || dims.length === 0) return null;
    const linhas = dims.map(d => d.tipo + ': ' + d.valor);
    return {resposta_direta: palavra + ' → ' + linhas.join(' | '), multictx: true, dimensoes: dims.length};
  });
  
  // h_estado_complexo: "encha o copo" / "esvazie o tanque" / "metade de X"
  v112_registrar_handler('h_estado_metade', (m, input) => {
    const obj = m[1].trim().toLowerCase();
    if(!obj) return null;
    if(typeof v112_estado_aplicar !== 'function') return null;
    const r = v112_estado_aplicar(obj, 'beber metade');
    if(!r || r.erro) return null;
    const descr = (typeof v112_estado_descrever === 'function') ? v112_estado_descrever(obj) : '';
    return {resposta_direta: 'metade de ' + obj + ' bebido. ' + (descr || ''), estado_metade: true};
  });
  
  // h_conjuncao_composta: "X e Y causam Z" / efeitos compostos
  v112_registrar_handler('h_conjuncao_composta', (m, input) => {
    if(typeof v112_causal_consultar !== 'function') return null;
    const X = m[1].trim().toLowerCase();
    const Y = m[2].trim().toLowerCase();
    if(!X || !Y) return null;
    const ef_X = v112_causal_consultar(X);
    const ef_Y = v112_causal_consultar(Y);
    // Intersecção = efeito composto que ambos causam
    const intersec = ef_X.filter(e => ef_Y.includes(e));
    if(intersec.length === 0 && ef_X.length === 0 && ef_Y.length === 0) return null;
    const todos = Array.from(new Set([...ef_X, ...ef_Y]));
    let resp = X + ' e ' + Y + ' → ' + todos.join(', ');
    if(intersec.length > 0) resp += ' [composto: ' + intersec.join(', ') + ']';
    return {resposta_direta: resp, conj_comp: true};
  });
  
  // h_silencio: respostas "não sei" controladas pra inputs vazios/curtos
  v112_registrar_handler('h_silencio_curto', (m, input) => {
    const txt = input.trim();
    // Só uma palavra inventada sem nada conhecido
    if(txt.length < 3 || /^[a-z]{1,2}$/.test(txt)) return null;
    return null;  // deixa fallback do silencio
  });
  
  // h_invalidacao_alt: "remove relação X Y" / "apaga X causa Y"
  v112_registrar_handler('h_invalidacao_alt', (m, input) => {
    if(typeof v112_causal_remover !== 'function') return null;
    const X = m[1].trim().toLowerCase();
    const Y = m[2].trim().toLowerCase();
    if(!X || !Y) return null;
    const ok = v112_causal_remover(X, Y);
    return {resposta_direta: ok ? X + '↛' + Y + ' (relação removida)' : X + '→' + Y + ' não estava registrada', invalidacao: true};
  });
}
window.v112_registrar_handlers_padrao = v112_registrar_handlers_padrao;

function v112_criar_comandos_iniciais(){
  if(!V112.subredes || !V112.subredes.B_comandos_nucleos) return 0;
  
  // SEMPRE registra handlers (idempotente)
  v112_registrar_handlers_padrao();
  
  // Não duplica nós
  const existentes = V112.nodes.filter(n => n.tipo === 'comando').length;
  if(existentes > 0) return 0;
  
  const cmds = [
    ['^(?:transferir?|mover?|passar?|enviar?)\\s+(-?\\d+(?:\\.\\d+)?)\\s+(?:de|do|da)\\s+([\\wÀ-ÿ]+)\\s+(?:para|pro|pra|ao|à|à\\s+)\\s*([\\wÀ-ÿ]+)\\s*\\.?\\s*$',
     'h_transferir', 100, 'Transferência atômica entre variáveis'],
    
    ['^(?:esquece|esqueça|remove|invalida|apaga)\\s+(?:que\\s+)?(\\S+)\\s+causa\\s+(\\S+?)\\s*\\.?\\s*$',
     'h_esquece', 100, 'Remove relação causal'],
    
    ['^(?:consolidar?\\s+regras?|criar?\\s+atalhos?|meta[- ]regras?|inferir\\s+atalhos?)\\s*\\??\\s*\\.?\\s*$',
     'h_consolidar', 100, 'Consolida atalhos via transitividade'],
    
    ['^(?:qual\\s+(?:a|é\\s+a)?\\s+)?(?:raiz|causa\\s+raiz|causa\\s+principal|diagn[óo]stico)\\s+(?:de|do|da|para)\\s+(\\S+?)\\s*\\??\\s*\\.?\\s*$',
     'h_raiz', 95, 'Busca raiz na cadeia causal'],
    
    ['^(?:aprender(?:\\s+com\\s+falhas)?|ciclo\\s+de\\s+aprendizado|auto-aprender|aprenda|consolidar\\s+aprendizado)\\s*\\??\\s*\\.?\\s*$',
     'h_aprender', 100, 'Roda ciclo de auto-aprendizado'],
    
    ['^(?:relat[óo]rio\\s+(?:de\\s+)?falhas|introspec[çc][ãa]o|status\\s+(?:do\\s+)?aprendizado)\\s*\\??\\s*\\.?\\s*$',
     'h_introspec', 100, 'Relatório do introspector'],
    
    ['^(?:regras\\s+(?:adaptadas|aprendidas)|camada\\s+adapt|adapt\\s+layer)\\s*\\??\\s*\\.?\\s*$',
     'h_adapt_rel', 100, 'Relatório da camada ADAPT'],
    
    ['^(?:validar\\s+(?:regress[ãa]o)?|testar\\s+core|verificar\\s+core)\\s*\\??\\s*\\.?\\s*$',
     'h_validar', 100, 'Roda bateria de regressão'],
    
    ['^(?:regras\\s+(?:n[úu]cleos?|como\\s+n[óo]s?|nos)|status\\s+regras)\\s*\\??\\s*\\.?\\s*$',
     'h_regras_nos_rel', 100, 'Relatório de regras-nós'],
    
    ['^(?:comandos\\s+(?:como\\s+n[óo]s?|n[úu]cleos?|nos)|status\\s+comandos)\\s*\\??\\s*\\.?\\s*$',
     'h_comandos_rel', 100, 'Relatório de comandos-nós'],
    
    // ═══ LAB 13.16 — Causal, Mundo, Loop, Propagação ═══
    
    // h_se_entao: prioridade ALTA (95) — antes do indexar genérico
    ['^se\\s+(\\S+?)\\s+(?:ent[ãa]o|implica)\\s+(\\S+?)\\s*\\.?\\s*$',
     'h_se_entao', 95, 'Indexa relação causal via "se X então Y"'],
    
    // h_causal_consultar: "o que X causa" — prio 92 (alta, antes do consultar genérico)
    ['^(?:o\\s+que|que|quais)\\s+(\\S+?)\\s+(?:causa|provoca|gera)\\s*\\??\\s*\\.?\\s*$',
     'h_causal_consultar', 92, 'Consulta efeitos de X'],
    
    ['^(?:consequ[êe]ncia(?:s)?|efeito(?:s)?)\\s+(?:de|do|da)\\s+(\\S+?)\\s*\\??\\s*\\.?\\s*$',
     'h_causal_consultar', 90, 'Consulta efeitos via "consequência"'],
    
    // h_causal_reverso: "o que causa X" — prio 88
    ['^(?:o\\s+que|que|quais)\\s+causa(?:m)?\\s+(\\S+?)\\s*\\??\\s*\\.?\\s*$',
     'h_causal_reverso', 88, 'Consulta causas de X'],
    
    // h_causal_indexar: "X causa Y" — prio 75 (baixa pra não pegar perguntas)
    ['^(\\S+?)\\s+causa\\s+(\\S+?)\\s*\\.?\\s*$',
     'h_causal_indexar', 75, 'Indexa relação X causa Y'],
    
    // h_mundo: "X = N"
    ['^([\\wÀ-ÿ]{2,})\\s*(?:=|vale|tem)\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\.?\\s*$',
     'h_mundo_set', 100, 'Define variável de mundo'],
    
    // h_mundo_get: "quanto vale X" / "quanto tem X"
    ['^(?:quanto\\s+(?:tem|vale)\\s+|qual\\s+(?:o\\s+)?valor\\s+de\\s+|valor\\s+de\\s+)([\\wÀ-ÿ]{2,})\\s*\\??\\s*\\.?\\s*$',
     'h_mundo_get', 95, 'Consulta variável de mundo'],
    
    // h_mundo_soma: "soma N ao X"
    ['^(?:soma|adiciona|aumenta|incrementa)\\s+(-?\\d+(?:\\.\\d+)?)\\s+(?:ao|no|na|à|em|de)\\s+([\\wÀ-ÿ]+)\\s*\\.?\\s*$',
     'h_mundo_soma', 100, 'Soma N a variável de mundo'],
    
    // h_mundo_sub: "subtrai N do X"
    ['^(?:subtrai|tira|remove|diminui|decrementa)\\s+(-?\\d+(?:\\.\\d+)?)\\s+(?:de|do|da)\\s+([\\wÀ-ÿ]+)\\s*\\.?\\s*$',
     'h_mundo_sub', 100, 'Subtrai N de variável de mundo'],
    
    // h_mundo_estado: "estado do mundo"
    ['^(?:estado\\s+(?:do\\s+)?mundo|mundo\\s+(?:atual|estado)?)\\s*\\??\\s*\\.?\\s*$',
     'h_mundo_estado', 100, 'Mostra estado completo do mundo'],
    
    // h_loop_vezes: "vaza 1 do X 100 vezes"
    ['^(soma|adiciona|subtrai|tira|remove|vaza|drena)\\s+(-?\\d+(?:\\.\\d+)?)\\s+(?:ao|no|do|da|de)\\s+([\\wÀ-ÿ]+)\\s+(?:(\\d+)\\s+(?:vezes|ciclos)|por\\s+(\\d+)\\s+(?:vezes|ciclos)|repetindo\\s+(\\d+)|at[ée]\\s+(zerar|esvaziar|zero))\\s*\\.?\\s*$',
     'h_loop_vezes', 100, 'Executa operação N vezes em loop'],
    
    // h_loop_enquanto: "enquanto tanque > 0: subtrai 1 do tanque"
    ['^enquanto\\s+([\\wÀ-ÿ]+)\\s*(>=|<=|==|!=|>|<|=)\\s*(-?\\d+(?:\\.\\d+)?)\\s*[:,]\\s*(.+?)\\s*\\.?\\s*$',
     'h_loop_enquanto', 100, 'Loop condicional "enquanto X op N"'],
    
    // h_propagacao: "propaga X"
    ['^(?:propaga(?:r)?\\s+(?:de\\s+)?|alcan[çc]a(?:dos)?\\s+(?:de\\s+|a\\s+partir\\s+de\\s+)?|profundidade\\s+(?:de\\s+)?)(\\S+?)\\s*\\??\\s*\\.?\\s*$',
     'h_propagacao', 90, 'Propaga BFS profundo a partir de X'],
    
    // h_conjuncao: "X e Y" (X + Y como conjunção causal)
    ['^([\\wÀ-ÿ]{2,}?)\\s+e\\s+([\\wÀ-ÿ]{2,}?)\\s*\\??\\s*\\.?\\s*$',
     'h_conjuncao', 70, 'Conjunção causal X e Y'],
    
    // h_sudoku: "resolva sudoku <81 chars>"
    ['^(?:resolva\\s+|solve\\s+)?sudoku\\s+([0-9.]{80,81})\\s*\\??\\s*\\.?\\s*$',
     'h_sudoku', 100, 'Resolve sudoku via 81 chars'],
    
    // ═══ LAB 13.17 — Geometria, Álgebra, Trig, Expressão ═══
    
    // h_geo_distancia: padrão pega "distância" + pontos
    ['^(?:dist[âa]ncia)(?:.*)\\([^)]+\\)(?:.*)\\([^)]+\\)\\s*\\??\\s*\\.?\\s*$',
     'h_geo_distancia', 95, 'Distância entre pontos'],
    
    // h_geo_ponto_medio
    ['^(?:ponto\\s+m[ée]dio)(?:.*)\\([^)]+\\)(?:.*)\\([^)]+\\)\\s*\\??\\s*\\.?\\s*$',
     'h_geo_ponto_medio', 95, 'Ponto médio entre pontos'],
    
    // h_geo_area_tri: "área do triângulo (x,y) (x,y) (x,y)"
    ['^(?:[áa]rea\\s+(?:do\\s+)?tri[âa]ngulo)(?:.*)\\([^)]+\\)(?:.*)\\([^)]+\\)(?:.*)\\([^)]+\\)\\s*\\??\\s*\\.?\\s*$',
     'h_geo_area_tri', 95, 'Área de triângulo por vértices'],
    
    // h_algebra_resolva: "resolva: <equação>"
    ['^resolva\\s*[:]\\s*(.+?)\\s*\\.?\\s*$',
     'h_algebra_resolva', 95, 'Resolve equação algébrica'],
    
    // h_trig_sin: "sin(N)"
    ['^sin\\s*\\(\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\)\\s*\\??\\s*\\.?\\s*$',
     'h_trig_sin', 100, 'Seno'],
    
    // h_trig_cos: "cos(N)"
    ['^cos\\s*\\(\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\)\\s*\\??\\s*\\.?\\s*$',
     'h_trig_cos', 100, 'Cosseno'],
    
    // h_trig_tan: "tan(N)"
    ['^tan\\s*\\(\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\)\\s*\\??\\s*\\.?\\s*$',
     'h_trig_tan', 100, 'Tangente'],
    
    // h_fatorial: "N!"
    ['^(\\d+)!\\s*\\??\\s*\\.?\\s*$',
     'h_fatorial', 100, 'Fatorial'],
    
    // h_sqrt: "sqrt(N)"
    ['^(?:sqrt|raiz(?:\\s+quadrada)?)\\s*\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*\\)?\\s*\\??\\s*\\.?\\s*$',
     'h_sqrt', 100, 'Raiz quadrada'],
    
    // h_combinacao: "C(n, k)"
    ['^[Cc]\\s*\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)\\s*\\??\\s*\\.?\\s*$',
     'h_combinacao', 100, 'Combinação C(n,k)'],
    
    // h_permutacao: "P(n, k)"
    ['^[Pp]\\s*\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)\\s*\\??\\s*\\.?\\s*$',
     'h_permutacao', 100, 'Permutação P(n,k)'],
    
    // h_expressao: prio baixa, último recurso
    ['^[\\d+\\-*/()\\s.!]{3,}$',
     'h_expressao', 50, 'Expressão matemática'],
    
    // ═══ LAB 13.18 — Química, Eletrônica, Bayes, Estado, Geo, Simulação ═══
    
    ['^(?:quantos\\s+[áa]tomos?\\s+(?:em|cont[éaê]m|tem|possu[ie]m?)\\s+|[áa]tomos?\\s+(?:em|de)\\s+)([A-Za-z0-9\\(\\)]+)\\s*\\??\\s*\\.?\\s*$',
     'h_quim_atomos', 100, 'Conta átomos em fórmula molecular'],
    
    ['^(?:massa\\s+(?:molecular|molar)|peso\\s+(?:molecular|molar))\\s+(?:de\\s+)?([A-Za-z0-9\\(\\)]+)\\s*\\??\\s*\\.?\\s*$',
     'h_quim_massa', 100, 'Massa molecular'],
    
    ['^(?:balanceie?|balanc[ea]ar|equilibrar?|fa[çc]a\\s+o\\s+balanceamento\\s+de)\\s*[:]?\\s*(.+?)\\s+(?:→|->|=>)\\s+(.+?)\\s*\\.?\\s*$',
     'h_quim_balancear', 100, 'Balanceia equação química'],
    
    ['^(AND|OR|XOR|NAND|NOR|XNOR)\\s+([01])\\s+([01])\\s*\\??\\s*\\.?\\s*$',
     'h_eletronica_porta', 100, 'Porta lógica binária'],
    
    ['^NOT\\s+([01])\\s*\\??\\s*\\.?\\s*$',
     'h_eletronica_not', 100, 'Negação lógica'],
    
    ['^bayes\\s+([0-9.]+)\\s+([0-9.]+)\\s+([0-9.]+)\\s*\\??\\s*\\.?\\s*$',
     'h_bayes', 100, 'Teorema de Bayes'],
    
    // Estado — prio baixa pra não pegar "X causa Y"
    ['^([\\wÀ-ÿ]{2,})\\s+(?:est[áa]|fica)\\s+([\\wÀ-ÿ]+)\\s*\\.?\\s*$',
     'h_estado_set', 70, 'Estado: X está Y'],
    
    ['^(esquentar|aquecer|esfriar|congelar|encher|esvaziar|abrir|fechar|ligar|desligar|quebrar|consertar)\\s+(?:o|a)\\s+([\\wÀ-ÿ]+)\\s*\\.?\\s*$',
     'h_estado_aplicar', 95, 'Estado: aplicar ação'],
    
    ['^(?:como\\s+est[áa]|estado\\s+de|descreva)\\s+(?:o|a)?\\s*([\\wÀ-ÿ]+)\\s*\\??\\s*\\.?\\s*$',
     'h_estado_descrever', 90, 'Estado: descrever objeto'],
    
    // Geo avançado
    ['^(?:[âa]ngulo\\s+entre)(?:.*)\\([^)]+\\)(?:.*)\\([^)]+\\)\\s*\\??\\s*\\.?\\s*$',
     'h_geo_angulo', 95, 'Ângulo entre vetores'],
    
    ['^(?:produto\\s+escalar|dot)(?:.*)\\([^)]+\\)(?:.*)\\([^)]+\\)\\s*\\??\\s*\\.?\\s*$',
     'h_geo_dot', 95, 'Produto escalar'],
    
    ['^(?:cross|produto\\s+vetorial)(?:.*)\\([^)]+\\)(?:.*)\\([^)]+\\)\\s*\\??\\s*\\.?\\s*$',
     'h_geo_cross', 95, 'Produto vetorial'],
    
    // Simulação
    ['^(?:simule?|simulação\\s+de)\\s+vela\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+)(?:\\s+lados?)?\\s*\\??\\s*\\.?\\s*$',
     'h_simular_vela', 100, 'Simula queima de vela'],
    
    // Indutor
    ['^padr[ãa]o\\s*[:]?\\s*(.+?ent[ãa]o\\s+\\d+\\s*=\\s*\\??)',
     'h_indutor', 100, 'Indutor de padrão'],
    
    // ═══ LAB 13.19 — Labirinto, Damas, Xadrez, Raiz, Reverso, Atalhos, Conflito, Plano, Identidade ═══
    
    // h_labirinto: "resolva labirinto: ..." (grid com | separando linhas)
    ['^(?:resolva\\s+|solve\\s+)?labirinto\\s*[:]\\s*([.\\sxsg|;]+)$',
     'h_labirinto', 100, 'Resolve labirinto via BFS'],
    
    // h_damas_inicio: "jogar damas" / "iniciar damas"
    ['^(?:jogar?|iniciar?|come[çc]ar?)\\s+damas\\s*\\??\\s*\\.?\\s*$',
     'h_damas_inicio', 100, 'Inicia jogo de damas'],
    
    // h_damas_melhor: "melhor lance damas profundidade N"
    ['^(?:melhor\\s+lance|melhor\\s+movimento|minimax)\\s+damas(?:\\s+(?:profundidade|prof)\\s+(\\d+))?\\s*\\??\\s*\\.?\\s*$',
     'h_damas_melhor', 100, 'Melhor lance damas via minimax'],
    
    // h_xadrez_inicio
    ['^(?:jogar?|iniciar?|come[çc]ar?)\\s+xadrez\\s*\\??\\s*\\.?\\s*$',
     'h_xadrez_inicio', 100, 'Inicia xadrez'],
    
    // h_xadrez_melhor
    ['^(?:melhor\\s+lance|melhor\\s+movimento|minimax)\\s+xadrez(?:\\s+(?:profundidade|prof)\\s+(\\d+))?\\s*\\??\\s*\\.?\\s*$',
     'h_xadrez_melhor', 100, 'Melhor lance xadrez via minimax'],
    
    // h_reverso: "reverso de X" / "leva a X"  
    ['^(?:reverso\\s+(?:de|do|da)|o\\s+que\\s+leva\\s+(?:a|ao))\\s+([\\wÀ-ÿ]+?)\\s*\\??\\s*\\.?\\s*$',
     'h_reverso', 90, 'Consulta reversa'],
    
    // h_conflito: "conflito entre X e Y" / "há conflito entre A B C"
    ['^(?:(?:h[aá]\\s+)?conflito\\s+entre)\\s+([\\wÀ-ÿ,\\s]+?)\\s*\\??\\s*\\.?\\s*$',
     'h_conflito', 100, 'Detecta conflito'],
    
    // h_planejamento_consulta: "como X"
    ['^(?:como|qual\\s+o\\s+caminho\\s+(?:para|pra)|qual\\s+plano\\s+(?:para|pra))\\s+(.+?)\\s*\\??\\s*\\.?\\s*$',
     'h_planejamento_consulta', 80, 'Consulta plano'],
    
    // h_identidade: "quem é você" / "o que você é"
    ['^(?:quem\\s+(?:é|e|és)\\s+(?:voc[eê]|tu)|o\\s+que\\s+(?:você|tu)\\s+é|qual\\s+(?:é\\s+)?sua\\s+identidade)\\s*\\??\\s*\\.?\\s*$',
     'h_identidade', 100, 'Identidade'],
    
    // h_atalhos: "consolidar atalhos" / "criar atalhos transitividade"
    ['^(?:consolidar?|criar?|gerar?)\\s+atalhos?(?:\\s+(?:de\\s+)?transitividade)?\\s*\\??\\s*\\.?\\s*$',
     'h_atalhos', 100, 'Cria atalhos transitivos'],
    
    // h_propagar_profundo: "propaga profundo X" ou "propaga profundo X até N"
    ['^propag(?:a|ar?)\\s+profund[oa]\\s+([\\wÀ-ÿ]+)(?:\\s+(?:at[ée]|depth|profundidade)\\s+(\\d+))?\\s*\\??\\s*\\.?\\s*$',
     'h_propagar_profundo', 95, 'Propagação profunda BFS'],
    
    // h_raiz_profunda: "diagnóstico profundo de X" / "todas as raízes de X"
    ['^(?:diagn[óo]stico\\s+profundo\\s+(?:de|do|da)|todas\\s+as\\s+ra[ií]zes\\s+(?:de|do|da)|ra[ií]zes\\s+(?:de|do|da))\\s+([\\wÀ-ÿ]+)\\s*\\??\\s*\\.?\\s*$',
     'h_raiz_profunda', 95, 'Diagnóstico profundo (todas raízes)'],
    
    // ═══ LAB 13.20 — Hooks restantes (24) ═══
    
    // h_geo_vetor: "vetor de (x,y) a (x,y)" / "vetor (x,y)→(x,y)"
    ['^vetor(?:\\s+de)?(?:.*)\\([^)]+\\)(?:.*)\\([^)]+\\)\\s*\\??\\s*\\.?\\s*$',
     'h_geo_vetor', 95, 'Vetor entre pontos'],
    
    // h_geo_reta: "equação da reta entre (x,y) e (x,y)" / "reta por (x,y) e (x,y)"
    ['^(?:equa[çc][ãa]o\\s+(?:da\\s+)?reta|reta)(?:\\s+(?:entre|por|de))?(?:.*)\\([^)]+\\)(?:.*)\\([^)]+\\)\\s*\\??\\s*\\.?\\s*$',
     'h_geo_reta', 95, 'Equação da reta'],
    
    // h_eletro_tabela: "tabela verdade <expr>"
    ['^(?:tabela\\s+verdade|truth\\s+table)\\s+(.+?)\\s*\\??\\s*\\.?\\s*$',
     'h_eletro_tabela', 100, 'Tabela verdade'],
    
    // h_eletro_simplif: "simplifique <expr booleana>"
    ['^(?:simplifique|simplificar?|reduza)\\s+([A-Za-z0-9\\s()+*\'.!&|]+?)\\s*\\??\\s*\\.?\\s*$',
     'h_eletro_simplif', 85, 'Simplificação booleana'],
    
    // h_prob_baralho: "chance/prob de tirar N (ases|reis|damas|valetes)"
    ['^(?:chance|probabilidade|prob)?\\s*(?:de\\s+)?tirar\\s+(\\d+)\\s+(ases?|reis?|damas?|valetes?)\\s*\\??\\s*\\.?\\s*$',
     'h_prob_baralho', 100, 'Probabilidade baralho'],
    
    // h_silogismo: "se X então Y. X. logo?" simplificado
    ['^se\\s+(\\S+)\\s+ent[ãa]o\\s+(\\S+?)\\s*\\.\\s*(\\S+?)\\s*\\.?\\s*(?:logo)?\\s*\\??\\s*$',
     'h_silogismo', 95, 'Silogismo: modus ponens/tollens'],
    
    // h_analogia: "A está para B como C está para ?" / "A:B::C:?"
    ['^(\\S+?)\\s+est[áa]\\s+para\\s+(\\S+?)\\s+como\\s+(\\S+?)\\s+est[áa]\\s+para\\s*\\??\\s*\\.?\\s*$',
     'h_analogia', 95, 'Analogia A:B::C:?'],
    
    // h_quantif: "todo/algum/nenhum X é Y"
    ['^(todo|toda|todos|todas|algum|alguma|alguns|nenhum|nenhuma)\\s+([\\wÀ-ÿ]+)\\s+(?:é|são|eh)\\s+([\\wÀ-ÿ]+?)\\s*\\??\\s*\\.?\\s*$',
     'h_quantif', 80, 'Quantificadores todo/algum/nenhum'],
    
    // h_temporal_set: "X antes de Y" — só formato literal (sem "nasceu", deixa B_bidir indexar prosa)
    ['^([\\wÀ-ÿ]+?)\\s+antes\\s+(?:de|do|da)\\s+([\\wÀ-ÿ]+?)\\s*\\.?\\s*$',
     'h_temporal_set', 70, 'Temporal: X antes de Y (set)'],
    
    // h_temporal_consultar: "X foi antes de Y?" / "X é antes de Y?"
    ['^(?:foi|é)\\s+([\\wÀ-ÿ]+?)\\s+antes\\s+(?:de|do|da)\\s+([\\wÀ-ÿ]+?)\\s*\\??\\s*\\.?\\s*$',
     'h_temporal_consultar', 90, 'Temporal: X antes de Y? (consulta)'],
    
    // h_excecoes_divzero: "N / 0"
    ['^(-?\\d+(?:\\.\\d+)?)\\s*/\\s*0\\s*\\.?\\s*$',
     'h_excecoes_divzero', 110, 'Divisão por zero'],
    
    // h_excecoes_raiz_neg: "raiz de -N" / "sqrt(-N)"
    ['^(?:raiz(?:\\s+quadrada)?(?:\\s+de)?|sqrt)\\s*\\(?\\s*(-\\d+(?:\\.\\d+)?)\\s*\\)?\\s*\\??\\s*\\.?\\s*$',
     'h_excecoes_raiz_neg', 105, 'Raiz de número negativo'],
    
    // h_paradoxo_classico: "esta frase é falsa"
    ['^(?:esta\\s+frase\\s+é\\s+falsa|este\\s+enunciado\\s+é\\s+falso)\\s*\\.?\\s*$',
     'h_paradoxo_classico', 100, 'Paradoxo do mentiroso'],
    
    // h_paradoxo_ciclico: "X é Y e Y é X" — detecta após indexação
    ['^([\\wÀ-ÿ]+?)\\s+é\\s+([\\wÀ-ÿ]+?)\\s+e\\s+\\2\\s+é\\s+\\1\\s*\\.?\\s*$',
     'h_paradoxo_ciclico', 85, 'Paradoxo X↔Y'],
    
    // h_planejamento_sequencia: "passo1 leva passo2 leva passo3"
    ['^.+?\\s+leva\\s+.+?\\s+leva\\s+.+?\\s*\\.?\\s*$',
     'h_planejamento_sequencia', 70, 'Sequência leva-leva'],
    
    // h_identidade_dna: "quem é nerael" / "do que você é feito"
    ['^(?:quem\\s+é\\s+nerael|do\\s+que\\s+(?:você|tu)\\s+é\\s+feit[oa]|qual\\s+seu\\s+dna)\\s*\\??\\s*\\.?\\s*$',
     'h_identidade_dna', 100, 'Identidade detalhada (DNA)'],
    
    // h_simulacao: "se X acontecesse" / "imagine X" / "e se X"
    ['^(?:se|imagine\\s+se|e\\s+se)\\s+(.+?)\\s+acontecesse\\s*\\??\\s*\\.?\\s*$',
     'h_simulacao', 80, 'Simulação hipotética'],
    
    // h_autobiografia: "lembra quando X" / "o que aconteceu com X"
    ['^(?:lembra\\s+(?:quando|de|do|da)|o\\s+que\\s+aconteceu\\s+(?:com|na|no|em))\\s+(.+?)\\s*\\??\\s*\\.?\\s*$',
     'h_autobiografia', 80, 'Autobiografia (recupera eventos)'],
    
    // h_salto: "que traits X tem?" / "traits de X"
    ['^(?:que\\s+traits\\s+|traits\\s+(?:de|do|da)\\s+|caracter[íi]sticas\\s+(?:de|do|da)\\s+)([\\wÀ-ÿ]+?)\\s*\\??\\s*\\.?\\s*$',
     'h_salto', 90, 'Traits compartilhados'],
    
    // h_multictx: "tudo sobre X" / "dimensões de X"
    ['^(?:tudo\\s+sobre|dimens[õo]es\\s+(?:de|do|da)|informa[çc][ãa]o\\s+(?:completa\\s+)?(?:de|do|da)|me\\s+fala\\s+sobre)\\s+([\\wÀ-ÿ]+?)\\s*\\??\\s*\\.?\\s*$',
     'h_multictx', 80, 'Tudo sobre X (multi-contexto)'],
    
    // h_estado_metade: "bebe metade do copo" / "metade do X"
    ['^(?:beba\\s+|bebe\\s+|toma\\s+|tira\\s+)?metade\\s+(?:do|da|de)\\s+([\\wÀ-ÿ]+?)\\s*\\.?\\s*$',
     'h_estado_metade', 95, 'Estado: tira metade'],
    
    // h_conjuncao_composta: "X e Y causam Z" / "X mais Y"
    ['^([\\wÀ-ÿ]+?)\\s+e\\s+([\\wÀ-ÿ]+?)\\s+causam?\\s*\\??\\s*\\.?\\s*$',
     'h_conjuncao_composta', 80, 'Conjunção causal composta'],
    
    // h_invalidacao_alt: "apaga X causa Y" / "remove relação X Y"
    ['^(?:apaga|remove(?:r)?)\\s+(?:rela[çc][ãa]o\\s+)?([\\wÀ-ÿ]+)\\s+(?:causa\\s+)?([\\wÀ-ÿ]+?)\\s*\\.?\\s*$',
     'h_invalidacao_alt', 95, 'Invalidação alternativa'],
  ];
  
  let criados = 0;
  for(const [padrao, handler, prio, desc] of cmds){
    v112_comando_criar_no(padrao, handler, {prioridade: prio, descricao: desc, categoria: 'comando'});
    criados++;
  }
  return criados;
}
window.v112_criar_comandos_iniciais = v112_criar_comandos_iniciais;

// LAB 13.15 — Re-vincula handlers após importar
function v112_revincular_handlers(){
  if(typeof v112_registrar_handlers_padrao === 'function'){
    v112_registrar_handlers_padrao();
  }
  // Se ainda não tem nós de comando, cria
  if(typeof v112_criar_comandos_iniciais === 'function'){
    return v112_criar_comandos_iniciais();
  }
  return 0;
}
window.v112_revincular_handlers = v112_revincular_handlers;

function v112_nlp_normalizar(input){
  if(!input || typeof input !== 'string') return input;
  let s = String(input);
  let mudou = false;
  
  // ═════════════════════════════════════════════════════════════
  // LAB 13.14 — TENTA USAR REGRAS-NÓS PRIMEIRO
  // Se a iteração via nós produzir resultado, usa-o
  // Caso contrário, cai pro array hardcoded (fallback de segurança)
  // ═════════════════════════════════════════════════════════════
  let usou_nucleos = false;
  if(V112.subredes && V112.subredes.B_regras_nucleos && typeof v112_iterador_regras === 'function'){
    try {
      const r_nucleos = v112_iterador_regras(s, {categoria: 'nlp', max_iter: 30});
      if(r_nucleos.total > 0){
        s = r_nucleos.resultado;
        mudou = true;
        usou_nucleos = true;
      }
    } catch(e){ /* silencioso, cai pro fallback */ }
  }
  
  // Fallback: usa array hardcoded SE não usou nós OU como segunda passada
  if(!usou_nucleos){
    for(const [re, sub] of REGRAS_NL_138){
      const novo = (typeof sub === 'function')
        ? s.replace(re, (match, ...args) => {
            const groups = args.slice(0, -2);
            const m = [match, ...groups];
            return sub(m, match);
          })
        : s.replace(re, sub);
      if(novo !== s){ mudou = true; s = novo; }
    }
  }
  
  // Registra
  if(mudou){
    const sr = V112.subredes && V112.subredes.B_nlp;
    if(sr){
      const c = v112_node_by_id(sr.id);
      if(c){
        c._ativacoes = (c._ativacoes||0)+1;
        c._sucessos = (c._sucessos||0)+1;
        if(!c._reescritas) c._reescritas = [];
        c._reescritas.push({original: input, normalizado: s, turno: V112.turn, via_nucleos: usou_nucleos});
        if(c._reescritas.length > 50) c._reescritas.shift();
      }
    }
  }
  return s;
}
window.v112_nlp_normalizar = v112_nlp_normalizar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.9 — B_MUNDO: estado global persistente
// Variáveis numéricas, listas, objetos com propriedades
// ═══════════════════════════════════════════════════════════════
function v112_mundo_set(chave, valor){
  const sr = V112.subredes && V112.subredes.B_mundo;
  if(!sr) return;
  const c = v112_node_by_id(sr.id);
  if(!c) return;
  if(!c._mundo) c._mundo = {};
  c._mundo[chave] = valor;
  c._ultimo = chave;
  c._ativacoes = (c._ativacoes||0)+1;
}
function v112_mundo_get(chave){
  const sr = V112.subredes && V112.subredes.B_mundo;
  if(!sr) return null;
  const c = v112_node_by_id(sr.id);
  if(!c || !c._mundo) return null;
  return c._mundo[chave];
}
function v112_mundo_op(chave, op, valor){
  // op: '+', '-', '*', '/', '=', 'inc', 'dec'
  const sr = V112.subredes && V112.subredes.B_mundo;
  if(!sr) return null;
  const c = v112_node_by_id(sr.id);
  if(!c) return null;
  if(!c._mundo) c._mundo = {};
  const atual = c._mundo[chave];
  let novo;
  if(op === '=' || op === 'set'){ novo = valor; }
  else if(op === '+' || op === 'inc' || op === 'somar'){ novo = (atual || 0) + valor; }
  else if(op === '-' || op === 'dec' || op === 'subtrair'){ novo = (atual || 0) - valor; }
  else if(op === '*' || op === 'mult'){ novo = (atual || 0) * valor; }
  else if(op === '/' || op === 'div'){ if(valor === 0) return null; novo = (atual || 0) / valor; }
  else return null;
  c._mundo[chave] = novo;
  c._ultimo = chave;
  c._ativacoes = (c._ativacoes||0)+1;
  c._sucessos = (c._sucessos||0)+1;
  return novo;
}
function v112_mundo_estado(){
  const sr = V112.subredes && V112.subredes.B_mundo;
  if(!sr) return {};
  const c = v112_node_by_id(sr.id);
  if(!c || !c._mundo) return {};
  return {...c._mundo};
}
window.v112_mundo_set = v112_mundo_set;
window.v112_mundo_get = v112_mundo_get;
window.v112_mundo_op = v112_mundo_op;
window.v112_mundo_estado = v112_mundo_estado;

// ═══════════════════════════════════════════════════════════════
// LAB 13.9 — B_EXECUCAO: loop estado → regra → novo_estado até estabilizar
// Processa LINHAS sequencialmente, mantendo estado entre elas
// ═══════════════════════════════════════════════════════════════
function v112_executar_linhas(texto_multilinha){
  // Divide por \n ou ".  " ou ";"
  const linhas = String(texto_multilinha)
    .split(/[\n;]|\.\s+(?=[A-Za-zÀ-ÿ])/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  
  const resultados = [];
  const sr = V112.subredes && V112.subredes.B_execucao;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(!c._sessoes) c._sessoes = [];
      c._sessoes.push({turno: V112.turn, linhas_count: linhas.length});
      if(c._sessoes.length > 20) c._sessoes.shift();
    }
  }
  
  for(const linha of linhas){
    // Pré-processa via NLP
    const normalizada = v112_nlp_normalizar(linha);
    // Processa
    const r = v112_processar(normalizada);
    resultados.push({entrada: linha, normalizada, resposta: r.resposta || ''});
  }
  
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c) c._sucessos = (c._sucessos||0)+1;
  }
  
  return resultados;
}
window.v112_executar_linhas = v112_executar_linhas;

// ═══════════════════════════════════════════════════════════════
// LAB 13.10 — B_LOOP: executa N ciclos de regras sobre mundo
// "tanque 100, vazar 1, 100 ciclos" → tanque = 0
// Detecta: convergência (estado para de mudar), drift, corrupção
// ═══════════════════════════════════════════════════════════════
function v112_loop_executar(operacoes, n_ciclos, opcoes){
  // operacoes: array de [chave, op, valor] (ex: [['tanque','-',1]])
  // n_ciclos: número de iterações
  // opcoes: {detectar_convergencia: true, max_estavel: 5, floor_em: {chave: valor}}
  opcoes = opcoes || {};
  const max_estavel = opcoes.max_estavel || 5;
  const detectar = opcoes.detectar_convergencia !== false;
  const floor_em = opcoes.floor_em || {};  // {tanque: 0}
  
  const t0 = Date.now();
  const historico = [];
  let estavel = 0;
  let convergiu_em = -1;
  
  for(let i = 0; i < n_ciclos; i++){
    const snap = JSON.stringify(v112_mundo_estado());
    
    for(const [chave, op, val] of operacoes){
      v112_mundo_op(chave, op, val);
      // Aplica floor
      if(floor_em[chave] !== undefined){
        const atual = v112_mundo_get(chave);
        if(atual < floor_em[chave]){
          v112_mundo_set(chave, floor_em[chave]);
        }
      }
    }
    
    if(detectar){
      const novo_snap = JSON.stringify(v112_mundo_estado());
      if(novo_snap === snap){
        estavel++;
        if(estavel >= max_estavel){
          convergiu_em = i + 1;
          break;
        }
      } else estavel = 0;
    }
    
    if(i < 10 || i % 100 === 0 || i === n_ciclos - 1){
      historico.push({ciclo: i + 1, estado: v112_mundo_estado()});
    }
  }
  
  const tempo_ms = Date.now() - t0;
  const sr = V112.subredes && V112.subredes.B_loop;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      c._sucessos = (c._sucessos||0)+1;
      if(!c._execucoes) c._execucoes = [];
      c._execucoes.push({operacoes, n_ciclos, convergiu_em, tempo_ms, estado_final: v112_mundo_estado()});
      if(c._execucoes.length > 20) c._execucoes.shift();
    }
  }
  
  return {
    ciclos_executados: convergiu_em > 0 ? convergiu_em : n_ciclos,
    convergiu: convergiu_em > 0,
    convergiu_em,
    tempo_ms,
    estado_final: v112_mundo_estado(),
    historico
  };
}
window.v112_loop_executar = v112_loop_executar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.10 — Loop CONDICIONAL: "enquanto X > 0: subtrai 1 de X"
// Avalia condição a cada ciclo, para quando falsa ou hits max
// ═══════════════════════════════════════════════════════════════
function v112_loop_enquanto(chave_cond, op_cond, val_cond, operacoes, opcoes){
  // op_cond: '>', '<', '>=', '<=', '==', '!='
  opcoes = opcoes || {};
  const max_ciclos = opcoes.max_ciclos || 100000;
  
  function avaliar(){
    const v = v112_mundo_get(chave_cond);
    if(v === null || v === undefined) return false;
    switch(op_cond){
      case '>':  return v >  val_cond;
      case '<':  return v <  val_cond;
      case '>=': return v >= val_cond;
      case '<=': return v <= val_cond;
      case '==': return v === val_cond;
      case '!=': return v !== val_cond;
      default: return false;
    }
  }
  
  const t0 = Date.now();
  let ciclos = 0;
  while(avaliar() && ciclos < max_ciclos){
    for(const [chave, op, val] of operacoes){
      v112_mundo_op(chave, op, val);
    }
    ciclos++;
  }
  const tempo_ms = Date.now() - t0;
  
  const sr = V112.subredes && V112.subredes.B_loop;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      c._sucessos = (c._sucessos||0)+1;
      if(!c._enquanto_execucoes) c._enquanto_execucoes = [];
      c._enquanto_execucoes.push({cond: [chave_cond, op_cond, val_cond], operacoes, ciclos, tempo_ms});
      if(c._enquanto_execucoes.length > 20) c._enquanto_execucoes.shift();
    }
  }
  
  return {
    ciclos_executados: ciclos,
    parou_por: ciclos >= max_ciclos ? 'limite' : 'condição_falsa',
    tempo_ms,
    estado_final: v112_mundo_estado()
  };
}
window.v112_loop_enquanto = v112_loop_enquanto;

// ═══════════════════════════════════════════════════════════════
// LAB 13.11 — B_TRANSFERENCIA: "transferir N de A para B" (atomic, conserva)
// ═══════════════════════════════════════════════════════════════
function v112_transferir(origem, destino, quantidade){
  // Operação atômica: retira de origem, adiciona em destino
  // Conserva: total(antes) === total(depois)
  if(typeof quantidade !== 'number' || quantidade < 0) return null;
  const v_origem = v112_mundo_get(origem);
  if(v_origem === null || v_origem === undefined) return null;
  if(v_origem < quantidade) return {erro: 'saldo insuficiente em ' + origem, valor_origem: v_origem};
  
  const total_antes = (v112_mundo_get(origem) || 0) + (v112_mundo_get(destino) || 0);
  
  v112_mundo_op(origem, '-', quantidade);
  v112_mundo_op(destino, '+', quantidade);
  
  const total_depois = (v112_mundo_get(origem) || 0) + (v112_mundo_get(destino) || 0);
  const conservou = Math.abs(total_antes - total_depois) < 0.0001;
  
  const sr = V112.subredes && V112.subredes.B_transferencia;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(conservou) c._sucessos = (c._sucessos||0)+1;
      if(!c._transferencias) c._transferencias = [];
      c._transferencias.push({origem, destino, quantidade, conservou, antes: total_antes, depois: total_depois});
      if(c._transferencias.length > 50) c._transferencias.shift();
    }
  }
  
  return {
    origem,
    destino,
    quantidade,
    valor_origem: v112_mundo_get(origem),
    valor_destino: v112_mundo_get(destino),
    total_antes,
    total_depois,
    conservou
  };
}
window.v112_transferir = v112_transferir;

// ═══════════════════════════════════════════════════════════════
// LAB 13.11 — B_INVALIDACAO: "esquece X causa Y" remove a aresta causal
// ═══════════════════════════════════════════════════════════════
function v112_causal_remover(causa, efeito){
  const sr_c = V112.subredes && V112.subredes.B_causal;
  if(!sr_c) return false;
  const c = v112_node_by_id(sr_c.id);
  if(!c) return false;
  let removeu = false;
  
  // Remove de _causa_de
  if(c._causa_de && c._causa_de[causa]){
    const set = c._causa_de[causa];
    if(set.has && set.has(efeito)){
      set.delete(efeito);
      removeu = true;
      if(set.size === 0) delete c._causa_de[causa];
    } else if(Array.isArray(set)){
      const idx = set.indexOf(efeito);
      if(idx >= 0){ set.splice(idx, 1); removeu = true; }
      if(set.length === 0) delete c._causa_de[causa];
    }
  }
  
  // Remove de _efeito_de
  if(c._efeito_de && c._efeito_de[efeito]){
    const set = c._efeito_de[efeito];
    if(set.has && set.has(causa)){
      set.delete(causa);
      if(set.size === 0) delete c._efeito_de[efeito];
    } else if(Array.isArray(set)){
      const idx = set.indexOf(causa);
      if(idx >= 0) set.splice(idx, 1);
      if(set.length === 0) delete c._efeito_de[efeito];
    }
  }
  
  // Invalida cache se houver
  if(c._cache_consulta) delete c._cache_consulta[causa];
  
  const sr_i = V112.subredes && V112.subredes.B_invalidacao;
  if(sr_i){
    const ci = v112_node_by_id(sr_i.id);
    if(ci){
      ci._ativacoes = (ci._ativacoes||0)+1;
      if(removeu) ci._sucessos = (ci._sucessos||0)+1;
      if(!ci._remocoes) ci._remocoes = [];
      ci._remocoes.push({causa, efeito, removeu, turno: V112.turn});
      if(ci._remocoes.length > 30) ci._remocoes.shift();
    }
  }
  
  return removeu;
}
window.v112_causal_remover = v112_causal_remover;

// ═══════════════════════════════════════════════════════════════
// LAB 13.11 — B_META_REGRA: detecta A→B→C, cria atalho A→C
// Roda em "consolidação": passa por todas as cadeias de 2 níveis
// ═══════════════════════════════════════════════════════════════
function v112_meta_regra_consolidar(opcoes){
  opcoes = opcoes || {};
  const max_atalhos = opcoes.max_atalhos || 1000;
  const max_iteracoes = opcoes.max_iteracoes || 20;  // LAB 13.11: iterativo
  
  const sr_c = V112.subredes && V112.subredes.B_causal;
  if(!sr_c) return {atalhos_criados: 0};
  const c = v112_node_by_id(sr_c.id);
  if(!c || !c._causa_de) return {atalhos_criados: 0};
  
  const atalhos_totais = [];
  let total_criados = 0;
  
  // Loop até estabilizar OU max_iteracoes
  for(let iter = 0; iter < max_iteracoes; iter++){
    let criados_nesta = 0;
    
    for(const A of Object.keys(c._causa_de)){
      const set_B = c._causa_de[A];
      const Bs = set_B.has ? Array.from(set_B) : set_B;
      for(const B of Bs){
        if(B === A) continue;
        const set_C = c._causa_de[B];
        if(!set_C) continue;
        const Cs = set_C.has ? Array.from(set_C) : set_C;
        for(const C of Cs){
          if(C === A || C === B) continue;
          const setA = c._causa_de[A];
          const ja_tem = setA.has ? setA.has(C) : setA.includes(C);
          if(!ja_tem){
            v112_causal_indexar(A, C);
            atalhos_totais.push({A, B, C, iteracao: iter});
            total_criados++;
            criados_nesta++;
            if(total_criados >= max_atalhos) break;
          }
        }
        if(total_criados >= max_atalhos) break;
      }
      if(total_criados >= max_atalhos) break;
    }
    
    if(criados_nesta === 0) break;  // estabilizou
    if(total_criados >= max_atalhos) break;
  }
  
  const sr_m = V112.subredes && V112.subredes.B_meta_regra;
  if(sr_m){
    const cm = v112_node_by_id(sr_m.id);
    if(cm){
      cm._ativacoes = (cm._ativacoes||0)+1;
      cm._sucessos = (cm._sucessos||0)+1;
      if(!cm._consolidacoes) cm._consolidacoes = [];
      cm._consolidacoes.push({atalhos_criados: total_criados, primeiros: atalhos_totais.slice(0, 10), turno: V112.turn});
      if(cm._consolidacoes.length > 20) cm._consolidacoes.shift();
    }
  }
  
  return {atalhos_criados: total_criados, exemplos: atalhos_totais.slice(0, 20)};
}
window.v112_meta_regra_consolidar = v112_meta_regra_consolidar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.11 — B_RAIZ: busca a raiz mais profunda na cadeia reversa
// "qual a raiz de fumaça" → BFS reverso até nó sem antecedentes
// ═══════════════════════════════════════════════════════════════
function v112_buscar_raiz(efeito){
  const sr_c = V112.subredes && V112.subredes.B_causal;
  if(!sr_c) return null;
  const c_causal = v112_node_by_id(sr_c.id);
  if(!c_causal || !c_causal._efeito_de) return null;
  
  // BFS reverso, registrando profundidade. Raiz = nó com _efeito_de[X] inexistente
  const vis = new Set([efeito]);
  const fila = [{no: efeito, prof: 0, caminho: [efeito]}];
  const raizes = [];
  let max_prof = 0;
  
  while(fila.length > 0){
    const {no, prof, caminho} = fila.shift();
    const ant = c_causal._efeito_de[no];
    if(!ant || (ant.size === 0 && ant.length === 0)){
      // É raiz!
      if(no !== efeito){
        raizes.push({raiz: no, profundidade: prof, caminho: caminho.reverse()});
        if(prof > max_prof) max_prof = prof;
      }
      continue;
    }
    const lista = ant.has ? Array.from(ant) : ant;
    let tem_antecedente = false;
    for(const a of lista){
      if(caminho.includes(a)) continue;  // ciclo
      tem_antecedente = true;
      if(!vis.has(a)){
        vis.add(a);
        fila.push({no: a, prof: prof + 1, caminho: [...caminho, a]});
      }
    }
    if(!tem_antecedente && no !== efeito){
      raizes.push({raiz: no, profundidade: prof, caminho: caminho.reverse()});
    }
  }
  
  // Ordena: raiz mais profunda primeiro
  raizes.sort((a, b) => b.profundidade - a.profundidade);
  
  const sr = V112.subredes && V112.subredes.B_raiz;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(raizes.length > 0) c._sucessos = (c._sucessos||0)+1;
      if(!c._buscas) c._buscas = [];
      c._buscas.push({efeito, raizes: raizes.slice(0, 5), max_prof});
      if(c._buscas.length > 30) c._buscas.shift();
    }
  }
  
  return {efeito, raizes, raiz_mais_profunda: raizes[0] || null, max_profundidade: max_prof};
}
window.v112_buscar_raiz = v112_buscar_raiz;

// ═══════════════════════════════════════════════════════════════
// LAB 13.11 — B_SAT: detecta dependência circular IMPOSSÍVEL de iniciar
// "motor precisa combustível, combustível precisa energia, energia precisa motor"
// → não há ponto de partida (todo nó precisa de algo)
// ═══════════════════════════════════════════════════════════════
function v112_verificar_dependencias(dependencias){
  // dependencias: { motor: ['combustivel'], combustivel: ['energia'], energia: ['motor'] }
  // Estratégia: topological sort (Kahn) — se sobrar nó, há ciclo
  const grau_entrada = {};
  const todos = new Set();
  for(const [item, deps] of Object.entries(dependencias)){
    todos.add(item);
    for(const d of deps) todos.add(d);
    grau_entrada[item] = (deps || []).length;
  }
  // Itens que aparecem como dependências mas não como itens → assumimos grau 0
  for(const x of todos) if(grau_entrada[x] === undefined) grau_entrada[x] = 0;
  
  // Inverso: para cada item, quem depende dele
  const inverso = {};
  for(const [item, deps] of Object.entries(dependencias)){
    for(const d of deps){
      if(!inverso[d]) inverso[d] = [];
      inverso[d].push(item);
    }
  }
  
  // Kahn
  const fila = [];
  for(const x of todos) if(grau_entrada[x] === 0) fila.push(x);
  
  const ordem = [];
  const visitados = new Set();
  while(fila.length > 0){
    const x = fila.shift();
    if(visitados.has(x)) continue;
    visitados.add(x);
    ordem.push(x);
    const dependentes = inverso[x] || [];
    for(const d of dependentes){
      grau_entrada[d]--;
      if(grau_entrada[d] === 0) fila.push(d);
    }
  }
  
  const possivel = ordem.length === todos.size;
  const restantes = Array.from(todos).filter(x => !visitados.has(x));
  
  const sr = V112.subredes && V112.subredes.B_sat;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      c._sucessos = (c._sucessos||0)+1;
      if(!c._verificacoes) c._verificacoes = [];
      c._verificacoes.push({possivel, ordem: ordem.slice(0,10), restantes, turno: V112.turn});
      if(c._verificacoes.length > 20) c._verificacoes.shift();
    }
  }
  
  return {
    possivel_iniciar: possivel,
    ordem_inicializacao: possivel ? ordem : null,
    ciclo_detectado: !possivel,
    itens_em_ciclo: restantes,
    motivo: possivel ? 'pode iniciar' : 'dependência circular: ' + restantes.join(' ↔ ')
  };
}
window.v112_verificar_dependencias = v112_verificar_dependencias;

// ═══════════════════════════════════════════════════════════════
// LAB 13.11 — B_INDUCAO_REGRA: detecta padrão como REGRA OPERACIONAL
// "2→4, 4→8, 8→16" → "multiplica por 2"
// "1→3, 2→6, 3→9" → "multiplica por 3"
// "1→2, 2→3, 3→4" → "soma 1"
// "1→1, 2→4, 3→9" → "eleva ao quadrado"
// ═══════════════════════════════════════════════════════════════
function v112_inducao_regra_descobrir(pares){
  // pares: [[in, out], [in, out], ...] (números)
  if(!Array.isArray(pares) || pares.length < 2) return null;
  
  const nums = pares.map(p => ({in: Number(p[0] || p.in), out: Number(p[1] || p.out)}));
  if(nums.some(p => isNaN(p.in) || isNaN(p.out))) return null;
  
  // Hipótese 1: multiplica por K (out = in * K)
  const ks = nums.map(p => p.in === 0 ? null : p.out / p.in);
  if(ks.every(k => k !== null && Math.abs(k - ks[0]) < 0.0001)){
    return {regra: 'multiplica por ' + ks[0], tipo: 'mult', k: ks[0], aplicar: (x) => x * ks[0]};
  }
  
  // Hipótese 2: soma K (out = in + K)
  const ds = nums.map(p => p.out - p.in);
  if(ds.every(d => Math.abs(d - ds[0]) < 0.0001)){
    return {regra: 'soma ' + ds[0], tipo: 'soma', k: ds[0], aplicar: (x) => x + ds[0]};
  }
  
  // Hipótese 3: eleva ao quadrado (out = in^2)
  if(nums.every(p => Math.abs(p.out - p.in * p.in) < 0.0001)){
    return {regra: 'eleva ao quadrado', tipo: 'quadrado', aplicar: (x) => x * x};
  }
  
  // Hipótese 4: cubo
  if(nums.every(p => Math.abs(p.out - p.in * p.in * p.in) < 0.0001)){
    return {regra: 'eleva ao cubo', tipo: 'cubo', aplicar: (x) => x * x * x};
  }
  
  // Hipótese 5: linear (out = a*in + b)
  if(nums.length >= 2){
    const x1 = nums[0].in, y1 = nums[0].out, x2 = nums[1].in, y2 = nums[1].out;
    if(x1 !== x2){
      const a = (y2 - y1) / (x2 - x1);
      const b = y1 - a * x1;
      if(nums.every(p => Math.abs(p.out - (a * p.in + b)) < 0.0001)){
        const sinal = b >= 0 ? '+' : '-';
        return {regra: 'multiplica por ' + a + ' ' + sinal + ' ' + Math.abs(b), tipo: 'linear', a, b, aplicar: (x) => a * x + b};
      }
    }
  }
  
  const sr = V112.subredes && V112.subredes.B_inducao_regra;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(!c._tentativas) c._tentativas = [];
      c._tentativas.push({pares, descoberta: null, turno: V112.turn});
    }
  }
  return null;
}
window.v112_inducao_regra_descobrir = v112_inducao_regra_descobrir;

// ═══════════════════════════════════════════════════════════════
// LAB 13.12 — B_SUDOKU: solver completo
// Backtracking + propagação de restrição (MRV - Minimum Remaining Values)
// Aceita string 81 chars (0 ou . = vazio) ou array 9x9
// ═══════════════════════════════════════════════════════════════
function v112_sudoku_solve(entrada, opcoes){
  opcoes = opcoes || {};
  const max_iter = opcoes.max_iter || 10000000;
  const t0 = Date.now();
  
  // Parsing: aceita string ou array 9x9
  let grid;
  if(typeof entrada === 'string'){
    const limpa = entrada.replace(/[\s\n\r|+\-]/g, '').replace(/\./g, '0');
    if(limpa.length !== 81) return {erro: 'precisa 81 caracteres', got: limpa.length};
    grid = [];
    for(let i = 0; i < 9; i++){
      grid.push([]);
      for(let j = 0; j < 9; j++){
        grid[i].push(parseInt(limpa[i*9+j]) || 0);
      }
    }
  } else if(Array.isArray(entrada)){
    grid = entrada.map(row => row.slice());
  } else return {erro: 'tipo inválido'};
  
  // Validação inicial
  function valido(r, c, n){
    for(let i = 0; i < 9; i++){
      if(grid[r][i] === n) return false;
      if(grid[i][c] === n) return false;
    }
    const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
    for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++){
      if(grid[br+i][bc+j] === n) return false;
    }
    return true;
  }
  
  // Encontra célula com menos candidatos (MRV)
  function proxima(){
    let best = null, best_count = 10, best_cands = null;
    for(let r = 0; r < 9; r++){
      for(let c = 0; c < 9; c++){
        if(grid[r][c] === 0){
          const cands = [];
          for(let n = 1; n <= 9; n++) if(valido(r, c, n)) cands.push(n);
          if(cands.length < best_count){
            best = [r, c];
            best_count = cands.length;
            best_cands = cands;
            if(best_count === 0) return {pos: best, cands: []};  // dead end
            if(best_count === 1) return {pos: best, cands: best_cands};
          }
        }
      }
    }
    return best ? {pos: best, cands: best_cands} : null;
  }
  
  let iter = 0;
  function resolver(){
    iter++;
    if(iter > max_iter) return 'TIMEOUT';
    const p = proxima();
    if(!p) return true;  // resolvido!
    if(p.cands.length === 0) return false;
    const [r, c] = p.pos;
    for(const n of p.cands){
      grid[r][c] = n;
      const sub = resolver();
      if(sub === 'TIMEOUT') return 'TIMEOUT';
      if(sub === true) return true;
      grid[r][c] = 0;
    }
    return false;
  }
  
  const result = resolver();
  const tempo_ms = Date.now() - t0;
  
  const sr = V112.subredes && V112.subredes.B_sudoku;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(result === true) c._sucessos = (c._sucessos||0)+1;
      if(!c._resolucoes) c._resolucoes = [];
      c._resolucoes.push({iter, tempo_ms, sucesso: result === true});
      if(c._resolucoes.length > 30) c._resolucoes.shift();
    }
  }
  
  return {
    sucesso: result === true,
    timeout: result === 'TIMEOUT',
    grid,
    iter,
    tempo_ms,
    str: result === true ? grid.flat().join('') : null
  };
}
window.v112_sudoku_solve = v112_sudoku_solve;

// ═══════════════════════════════════════════════════════════════
// LAB 13.12 — B_LABIRINTO: navegação CEGA (só sensores N/S/L/O)
// O sistema recebe estado parcial e decide próximo movimento
// Estratégia: right-hand rule + memória de visitados (Tremaux)
// ═══════════════════════════════════════════════════════════════
function v112_labirinto_resolver(grid, start, goal, opcoes){
  // grid: matriz onde 0=livre, 1=parede, 2=saída
  // start: [r,c], goal: [r,c]
  // O sistema NÃO vê o grid, só recebe sensor a cada movimento
  opcoes = opcoes || {};
  const max_passos = opcoes.max_passos || 10000;
  const algoritmo = opcoes.algoritmo || 'tremaux';
  
  const t0 = Date.now();
  const rows = grid.length, cols = grid[0].length;
  
  function sensor(pos){
    // Retorna {N, S, L, O} com true=parede ou fora, false=passável
    const [r, c] = pos;
    return {
      N: r === 0 || grid[r-1][c] === 1,
      S: r === rows-1 || grid[r+1][c] === 1,
      L: c === cols-1 || grid[r][c+1] === 1,
      O: c === 0 || grid[r][c-1] === 1
    };
  }
  
  function chegou(pos){
    return pos[0] === goal[0] && pos[1] === goal[1];
  }
  
  // Tremaux: visita cada caminho no máximo 2x. Marca paredes "visitadas"
  const visitados = {};  // {"r,c": número_de_visitas}
  const caminho = [start.slice()];
  let pos = start.slice();
  let passos = 0;
  let veio_de = null;  // 'N','S','L','O' = direção da qual veio
  
  const direcoes = [
    {nome:'N', dr:-1, dc: 0, inv:'S'},
    {nome:'L', dr: 0, dc: 1, inv:'O'},
    {nome:'S', dr: 1, dc: 0, inv:'N'},
    {nome:'O', dr: 0, dc:-1, inv:'L'},
  ];
  
  while(!chegou(pos) && passos < max_passos){
    const key = pos[0] + ',' + pos[1];
    visitados[key] = (visitados[key] || 0) + 1;
    
    if(visitados[key] > 3) break;  // safety
    
    const s = sensor(pos);
    // Lista direções passáveis, preferindo menos visitadas
    const opcoes_dir = [];
    for(const d of direcoes){
      if(s[d.nome]) continue;  // parede
      const nr = pos[0] + d.dr, nc = pos[1] + d.dc;
      const nkey = nr + ',' + nc;
      const v = visitados[nkey] || 0;
      opcoes_dir.push({d, v, prefer_nao_voltar: d.nome === veio_de ? 1 : 0});
    }
    
    if(opcoes_dir.length === 0) break;
    
    // Ordena: menos visitas primeiro, depois "não voltar"
    opcoes_dir.sort((a, b) => {
      if(a.v !== b.v) return a.v - b.v;
      return a.prefer_nao_voltar - b.prefer_nao_voltar;
    });
    
    const escolha = opcoes_dir[0].d;
    pos = [pos[0] + escolha.dr, pos[1] + escolha.dc];
    caminho.push(pos.slice());
    veio_de = escolha.inv;
    passos++;
  }
  
  const tempo_ms = Date.now() - t0;
  const sucesso = chegou(pos);
  
  const sr = V112.subredes && V112.subredes.B_labirinto;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(sucesso) c._sucessos = (c._sucessos||0)+1;
      if(!c._navegacoes) c._navegacoes = [];
      c._navegacoes.push({passos, sucesso, tempo_ms, algoritmo});
      if(c._navegacoes.length > 30) c._navegacoes.shift();
    }
  }
  
  return {
    sucesso,
    passos,
    caminho_tamanho: caminho.length,
    tempo_ms,
    pos_final: pos,
    chegou: sucesso
  };
}
window.v112_labirinto_resolver = v112_labirinto_resolver;

// ═══════════════════════════════════════════════════════════════
// LAB 13.12 — B_EXPRESSAO: avalia expressão gigante com BigInt
// Aceita: +, -, *, /, %, **, parênteses, sqrt(), abs(), pow(a,b)
// ═══════════════════════════════════════════════════════════════
function v112_expressao_calcular(expr, opcoes){
  opcoes = opcoes || {};
  const t0 = Date.now();
  
  let resultado;
  let erro = null;
  let usou_bigint = false;
  
  try {
    // Sanitiza
    let s = String(expr);
    
    // Detecta se precisa BigInt (números grandes ou potências altas)
    const tem_potencia_grande = /\*\*\s*\d{2,}/.test(s);
    const tem_num_grande = /\d{15,}/.test(s);
    usou_bigint = tem_potencia_grande || tem_num_grande;
    
    if(usou_bigint){
      // Converte literais inteiros pra BigInt
      let bs = s.replace(/\b(\d+)\b/g, '$1n');
      // Não pode misturar BigInt com Number — eval em modo BigInt puro
      // Mas / e ** precisam ser cuidados (BigInt não tem .5)
      // Operadores básicos funcionam em BigInt
      try {
        resultado = eval(bs);
      } catch(e){
        // fallback número normal
        usou_bigint = false;
        resultado = eval(s);
      }
    } else {
      resultado = eval(s);
    }
    
    if(typeof resultado === 'bigint') resultado = resultado.toString();
    else if(typeof resultado === 'number'){
      if(Number.isInteger(resultado)) resultado = String(resultado);
      else resultado = String(resultado);
    }
  } catch(e){
    erro = e.message;
  }
  
  const tempo_ms = Date.now() - t0;
  
  const sr = V112.subredes && V112.subredes.B_expressao;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(!erro) c._sucessos = (c._sucessos||0)+1;
      if(!c._calculos) c._calculos = [];
      c._calculos.push({expr: String(expr).substring(0, 100), resultado: String(resultado).substring(0, 50), bigint: usou_bigint, tempo_ms});
      if(c._calculos.length > 30) c._calculos.shift();
    }
  }
  
  return {
    expr,
    resultado,
    erro,
    usou_bigint,
    tempo_ms
  };
}
window.v112_expressao_calcular = v112_expressao_calcular;

// ═══════════════════════════════════════════════════════════════
// LAB 13.12 — B_DAMAS: damas brasileiras (8x8, peças brancas movem ↑)
// Posição: array 8x8, valores: 0=vazio, 1=branca, 2=preta, 3=dama_branca, 4=dama_preta
// Engine: minimax + alpha-beta
// ═══════════════════════════════════════════════════════════════
function v112_damas_movimentos_validos(tabuleiro, jogador){
  // jogador: 1 (branca) ou 2 (preta)
  const movs = [];
  const capturas = [];
  const dama = jogador === 1 ? 3 : 4;
  const peca = jogador;
  const inimigo = jogador === 1 ? 2 : 1;
  const inimigo_dama = jogador === 1 ? 4 : 3;
  const direcao = jogador === 1 ? -1 : 1;  // brancas sobem
  
  for(let r = 0; r < 8; r++){
    for(let c = 0; c < 8; c++){
      const p = tabuleiro[r][c];
      if(p !== peca && p !== dama) continue;
      const eh_dama = p === dama;
      const dirs = eh_dama ? [[-1,-1],[-1,1],[1,-1],[1,1]] : [[direcao, -1], [direcao, 1]];
      
      // Movimento simples
      for(const [dr, dc] of dirs){
        const nr = r + dr, nc = c + dc;
        if(nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && tabuleiro[nr][nc] === 0){
          movs.push({de: [r,c], para: [nr,nc], captura: false});
        }
      }
      
      // Captura simples (peças podem capturar pra trás também em damas brasileiras)
      const dirs_cap = [[-1,-1],[-1,1],[1,-1],[1,1]];
      for(const [dr, dc] of dirs_cap){
        const er = r + dr, ec = c + dc;  // posição inimigo
        const fr = r + 2*dr, fc = c + 2*dc;  // posição final
        if(er >= 0 && er < 8 && ec >= 0 && ec < 8 && fr >= 0 && fr < 8 && fc >= 0 && fc < 8){
          if((tabuleiro[er][ec] === inimigo || tabuleiro[er][ec] === inimigo_dama) && tabuleiro[fr][fc] === 0){
            capturas.push({de: [r,c], para: [fr,fc], captura: [er,ec]});
          }
        }
      }
    }
  }
  
  // Regra brasileira: captura é obrigatória se possível
  return capturas.length > 0 ? capturas : movs;
}

function v112_damas_aplicar(tabuleiro, mov){
  const novo = tabuleiro.map(row => row.slice());
  const [fr, fc] = mov.de;
  const [tr, tc] = mov.para;
  const p = novo[fr][fc];
  novo[fr][fc] = 0;
  novo[tr][tc] = p;
  if(mov.captura){
    novo[mov.captura[0]][mov.captura[1]] = 0;
  }
  // Promoção
  if(p === 1 && tr === 0) novo[tr][tc] = 3;
  if(p === 2 && tr === 7) novo[tr][tc] = 4;
  return novo;
}

function v112_damas_avaliar(tabuleiro, jogador){
  let score = 0;
  for(let r = 0; r < 8; r++){
    for(let c = 0; c < 8; c++){
      const p = tabuleiro[r][c];
      if(p === 1) score += 10 + (7-r);  // brancas: bônus por avançar (subir)
      else if(p === 2) score -= 10 + r;  // pretas: bônus por avançar (descer)
      else if(p === 3) score += 30;  // dama branca
      else if(p === 4) score -= 30;  // dama preta
    }
  }
  return jogador === 1 ? score : -score;
}

function v112_damas_minimax(tabuleiro, profundidade, alpha, beta, jogador, maximizando){
  if(profundidade === 0){
    return {score: v112_damas_avaliar(tabuleiro, jogador), mov: null};
  }
  const movs = v112_damas_movimentos_validos(tabuleiro, maximizando ? jogador : (jogador === 1 ? 2 : 1));
  if(movs.length === 0){
    return {score: maximizando ? -100000 : 100000, mov: null};
  }
  
  let melhor_mov = null;
  if(maximizando){
    let melhor = -Infinity;
    for(const mov of movs){
      const novo = v112_damas_aplicar(tabuleiro, mov);
      const r = v112_damas_minimax(novo, profundidade - 1, alpha, beta, jogador, false);
      if(r.score > melhor){ melhor = r.score; melhor_mov = mov; }
      alpha = Math.max(alpha, melhor);
      if(beta <= alpha) break;
    }
    return {score: melhor, mov: melhor_mov};
  } else {
    let pior = Infinity;
    for(const mov of movs){
      const novo = v112_damas_aplicar(tabuleiro, mov);
      const r = v112_damas_minimax(novo, profundidade - 1, alpha, beta, jogador, true);
      if(r.score < pior){ pior = r.score; melhor_mov = mov; }
      beta = Math.min(beta, pior);
      if(beta <= alpha) break;
    }
    return {score: pior, mov: melhor_mov};
  }
}

function v112_damas_melhor_movimento(tabuleiro, jogador, profundidade){
  profundidade = profundidade || 6;
  const t0 = Date.now();
  const r = v112_damas_minimax(tabuleiro, profundidade, -Infinity, Infinity, jogador, true);
  const tempo_ms = Date.now() - t0;
  
  const sr = V112.subredes && V112.subredes.B_damas;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(r.mov) c._sucessos = (c._sucessos||0)+1;
      if(!c._jogadas) c._jogadas = [];
      c._jogadas.push({score: r.score, profundidade, tempo_ms});
      if(c._jogadas.length > 30) c._jogadas.shift();
    }
  }
  
  return {melhor_movimento: r.mov, score: r.score, profundidade, tempo_ms};
}

// Tabuleiro inicial de damas brasileiras
function v112_damas_tabuleiro_inicial(){
  const t = Array(8).fill(null).map(() => Array(8).fill(0));
  // Pretas em cima (linhas 0-2), brancas em baixo (linhas 5-7)
  // Casas escuras: (r+c) % 2 === 1
  for(let r = 0; r < 3; r++){
    for(let c = 0; c < 8; c++){
      if((r+c) % 2 === 1) t[r][c] = 2;  // preta
    }
  }
  for(let r = 5; r < 8; r++){
    for(let c = 0; c < 8; c++){
      if((r+c) % 2 === 1) t[r][c] = 1;  // branca
    }
  }
  return t;
}
window.v112_damas_movimentos_validos = v112_damas_movimentos_validos;
window.v112_damas_aplicar = v112_damas_aplicar;
window.v112_damas_avaliar = v112_damas_avaliar;
window.v112_damas_melhor_movimento = v112_damas_melhor_movimento;
window.v112_damas_tabuleiro_inicial = v112_damas_tabuleiro_inicial;

// ═══════════════════════════════════════════════════════════════
// LAB 13.12 — B_XADREZ: engine minimax simples (~1200-1500 ELO)
// HONESTIDADE: Não vai superar Stockfish. Joga decentemente.
// Notação: peças = {P:peão, N:cavalo, B:bispo, R:torre, Q:dama, K:rei}
// minúscula = preta, MAIÚSCULA = branca
// ═══════════════════════════════════════════════════════════════
const VALOR_PECA_XADREZ = {P:100, N:320, B:330, R:500, Q:900, K:20000};

function v112_xadrez_tabuleiro_inicial(){
  return [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];
}

function v112_xadrez_eh_branca(p){ return p && p !== '.' && p === p.toUpperCase(); }
function v112_xadrez_eh_preta(p){ return p && p !== '.' && p === p.toLowerCase(); }

function v112_xadrez_movimentos(tab, branca_joga){
  const movs = [];
  for(let r = 0; r < 8; r++){
    for(let c = 0; c < 8; c++){
      const p = tab[r][c];
      if(p === '.') continue;
      const eh_b = v112_xadrez_eh_branca(p);
      if(branca_joga !== eh_b) continue;
      const tipo = p.toUpperCase();
      
      function tenta(nr, nc){
        if(nr < 0 || nr > 7 || nc < 0 || nc > 7) return null;
        const dest = tab[nr][nc];
        if(dest === '.') return {de:[r,c], para:[nr,nc], peca:p, captura:null};
        if(v112_xadrez_eh_branca(dest) === eh_b) return null;
        return {de:[r,c], para:[nr,nc], peca:p, captura:dest};
      }
      
      function raio(dr, dc){
        for(let i = 1; i < 8; i++){
          const nr = r + dr*i, nc = c + dc*i;
          const m = tenta(nr, nc);
          if(!m) return;
          movs.push(m);
          if(m.captura) return;
        }
      }
      
      if(tipo === 'P'){
        const d = eh_b ? -1 : 1;
        const inicial = eh_b ? 6 : 1;
        if(tab[r+d] && tab[r+d][c] === '.'){
          movs.push({de:[r,c], para:[r+d,c], peca:p, captura:null});
          if(r === inicial && tab[r+2*d][c] === '.'){
            movs.push({de:[r,c], para:[r+2*d,c], peca:p, captura:null});
          }
        }
        for(const dc of [-1, 1]){
          const nc = c + dc, nr = r + d;
          if(nc < 0 || nc > 7 || nr < 0 || nr > 7) continue;
          const alvo = tab[nr][nc];
          if(alvo !== '.' && v112_xadrez_eh_branca(alvo) !== eh_b){
            movs.push({de:[r,c], para:[nr,nc], peca:p, captura:alvo});
          }
        }
      } else if(tipo === 'N'){
        for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){
          const m = tenta(r+dr, c+dc);
          if(m) movs.push(m);
        }
      } else if(tipo === 'B'){
        for(const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) raio(dr, dc);
      } else if(tipo === 'R'){
        for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) raio(dr, dc);
      } else if(tipo === 'Q'){
        for(const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) raio(dr, dc);
      } else if(tipo === 'K'){
        for(const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
          const m = tenta(r+dr, c+dc);
          if(m) movs.push(m);
        }
      }
    }
  }
  return movs;
}

function v112_xadrez_aplicar(tab, mov){
  const novo = tab.map(row => row.slice());
  const [fr, fc] = mov.de;
  const [tr, tc] = mov.para;
  novo[tr][tc] = novo[fr][fc];
  novo[fr][fc] = '.';
  // Promoção peão automático a dama
  if(novo[tr][tc] === 'P' && tr === 0) novo[tr][tc] = 'Q';
  if(novo[tr][tc] === 'p' && tr === 7) novo[tr][tc] = 'q';
  return novo;
}

function v112_xadrez_avaliar(tab){
  let score = 0;
  for(let r = 0; r < 8; r++){
    for(let c = 0; c < 8; c++){
      const p = tab[r][c];
      if(p === '.') continue;
      const v = VALOR_PECA_XADREZ[p.toUpperCase()] || 0;
      score += v112_xadrez_eh_branca(p) ? v : -v;
      // Pequeno bônus por centralização
      if(p.toUpperCase() === 'P' || p.toUpperCase() === 'N' || p.toUpperCase() === 'B'){
        const dist_centro = Math.abs(3.5 - r) + Math.abs(3.5 - c);
        const bonus = (4 - dist_centro) * 2;
        score += v112_xadrez_eh_branca(p) ? bonus : -bonus;
      }
    }
  }
  return score;
}

function v112_xadrez_minimax(tab, profundidade, alpha, beta, maximizando){
  if(profundidade === 0){
    return {score: v112_xadrez_avaliar(tab), mov: null};
  }
  const movs = v112_xadrez_movimentos(tab, maximizando);
  if(movs.length === 0){
    return {score: maximizando ? -100000 : 100000, mov: null};
  }
  
  // Ordena: capturas primeiro (MVV-LVA simplificado)
  movs.sort((a, b) => {
    const va = a.captura ? (VALOR_PECA_XADREZ[a.captura.toUpperCase()] || 0) : 0;
    const vb = b.captura ? (VALOR_PECA_XADREZ[b.captura.toUpperCase()] || 0) : 0;
    return vb - va;
  });
  
  let melhor_mov = movs[0];
  if(maximizando){
    let melhor = -Infinity;
    for(const mov of movs){
      const novo = v112_xadrez_aplicar(tab, mov);
      const r = v112_xadrez_minimax(novo, profundidade - 1, alpha, beta, false);
      if(r.score > melhor){ melhor = r.score; melhor_mov = mov; }
      alpha = Math.max(alpha, melhor);
      if(beta <= alpha) break;
    }
    return {score: melhor, mov: melhor_mov};
  } else {
    let pior = Infinity;
    for(const mov of movs){
      const novo = v112_xadrez_aplicar(tab, mov);
      const r = v112_xadrez_minimax(novo, profundidade - 1, alpha, beta, true);
      if(r.score < pior){ pior = r.score; melhor_mov = mov; }
      beta = Math.min(beta, pior);
      if(beta <= alpha) break;
    }
    return {score: pior, mov: melhor_mov};
  }
}

function v112_xadrez_melhor_movimento(tab, branca_joga, profundidade){
  profundidade = profundidade || 4;
  const t0 = Date.now();
  const r = v112_xadrez_minimax(tab, profundidade, -Infinity, Infinity, branca_joga);
  const tempo_ms = Date.now() - t0;
  
  const sr = V112.subredes && V112.subredes.B_xadrez;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      if(r.mov) c._sucessos = (c._sucessos||0)+1;
      if(!c._jogadas) c._jogadas = [];
      c._jogadas.push({score: r.score, profundidade, tempo_ms});
      if(c._jogadas.length > 30) c._jogadas.shift();
    }
  }
  
  return {melhor_movimento: r.mov, score: r.score, profundidade, tempo_ms};
}
window.v112_xadrez_tabuleiro_inicial = v112_xadrez_tabuleiro_inicial;
window.v112_xadrez_movimentos = v112_xadrez_movimentos;
window.v112_xadrez_aplicar = v112_xadrez_aplicar;
window.v112_xadrez_avaliar = v112_xadrez_avaliar;
window.v112_xadrez_melhor_movimento = v112_xadrez_melhor_movimento;

// ═══════════════════════════════════════════════════════════════
// LAB 13.13 — ARQUITETURA AUTO-MODIFICÁVEL EM CAMADAS
// CORE (imutável) → ADAPT (consolidado) → EXPERIMENTAL (sandbox)
// ═══════════════════════════════════════════════════════════════

// Lista de sub-redes CORE FIXAS (não podem ser modificadas por auto-mod)
const CORE_FIXO_NOMES_138 = [
  'B_bidir', 'B_logico', 'B_link', 'B_silencio', 'B_silogismo', 'B_atencao',
  'B_causal', 'B_solver', 'B_algebra', 'B_trig', 'B_quimica', 'B_eletronica',
  'B_bayes', 'B_geometria', 'B_propagacao', 'B_ciclo', 'B_mundo', 'B_loop',
  'B_sudoku', 'B_labirinto', 'B_expressao', 'B_damas', 'B_xadrez',
  'B_core_fixo', 'B_introspector', 'B_adapt_layer', 'B_validador', 'B_promotor'
];

function v112_core_eh_protegido(sub_nome){
  return CORE_FIXO_NOMES_138.includes(sub_nome);
}
window.v112_core_eh_protegido = v112_core_eh_protegido;

// ─────────────────────────────────────────────────────────────
// B_INTROSPECTOR: registra cada falha do v112_processar
// Classifica tipo (palavras-chave, padrão sintático)
// Dispara criação de regra se padrão se repete 3+ vezes
// ─────────────────────────────────────────────────────────────
function v112_introspector_registrar_falha(input, resposta){
  const sr = V112.subredes && V112.subredes.B_introspector;
  if(!sr) return;
  const c = v112_node_by_id(sr.id);
  if(!c) return;
  if(!c._falhas) c._falhas = [];
  if(!c._padroes) c._padroes = {};
  if(!c._sugestoes) c._sugestoes = [];
  
  // Classifica tipo de falha
  const tipo = v112_introspector_classificar(input);
  
  c._falhas.push({input: String(input).substring(0, 100), resposta: String(resposta).substring(0, 60), tipo, turno: V112.turn});
  if(c._falhas.length > 200) c._falhas.shift();
  
  // Detecta padrão repetido
  if(tipo){
    const chave = tipo.tipo + ':' + tipo.assinatura;
    c._padroes[chave] = (c._padroes[chave] || 0) + 1;
    
    // Se mesmo padrão falhou 3+ vezes, sugere criação
    if(c._padroes[chave] >= 3 && !c._sugestoes.find(s => s.chave === chave)){
      c._sugestoes.push({
        chave,
        tipo: tipo.tipo,
        assinatura: tipo.assinatura,
        exemplos: c._falhas.filter(f => f.tipo && (f.tipo.tipo + ':' + f.tipo.assinatura) === chave).slice(-3).map(f => f.input),
        criada_em_turno: V112.turn,
        status: 'pendente'
      });
    }
  }
  
  c._ativacoes = (c._ativacoes||0)+1;
}

function v112_introspector_classificar(input){
  const s = String(input).toLowerCase().trim();
  if(!s) return null;
  
  // Tipos de assinatura
  // 1. Pergunta NL "qual o X de Y" / "quanto vale X"
  if(/^(qual|quanto|como|onde|quando|por que|que|porque)\s+/.test(s)){
    const palavras = s.split(/\s+/).slice(0, 4).join(' ');
    return {tipo: 'pergunta_nl', assinatura: palavras};
  }
  // 2. Comando imperativo
  if(/^(calcule|resolva|encontre|ache|determine|simplifique|balanceie|propaga|consolida|transferir|mover|enquanto|repete|esquece|drene|encha)\s+/.test(s)){
    const palavras = s.split(/\s+/).slice(0, 3).join(' ');
    return {tipo: 'comando', assinatura: palavras};
  }
  // 3. Expressão matemática
  if(/[\d+\-*\/^()]/.test(s) && /[a-z]?\s*[+\-*\/]\s*[\d(]/.test(s)){
    return {tipo: 'expressao_mat', assinatura: 'expr'};
  }
  // 4. Frase declarativa "X causa Y" / "X é Y"
  if(/\s(causa|provoca|gera|é|são|equivale|implica)\s/.test(s)){
    const m = s.match(/\s(causa|provoca|gera|é|são|equivale|implica)\s/);
    return {tipo: 'declaracao', assinatura: m[1]};
  }
  // 5. Outro
  return {tipo: 'desconhecido', assinatura: s.split(/\s+/)[0]};
}

function v112_introspector_relatar(){
  const sr = V112.subredes && V112.subredes.B_introspector;
  if(!sr) return null;
  const c = v112_node_by_id(sr.id);
  if(!c) return null;
  return {
    total_falhas: (c._falhas||[]).length,
    padroes_detectados: Object.keys(c._padroes||{}).length,
    sugestoes_pendentes: (c._sugestoes||[]).filter(s => s.status === 'pendente').length,
    sugestoes_consolidadas: (c._sugestoes||[]).filter(s => s.status === 'consolidada').length,
    top_padroes: Object.entries(c._padroes||{}).sort((a,b) => b[1]-a[1]).slice(0, 5)
  };
}
window.v112_introspector_registrar_falha = v112_introspector_registrar_falha;
window.v112_introspector_classificar = v112_introspector_classificar;
window.v112_introspector_relatar = v112_introspector_relatar;

// ─────────────────────────────────────────────────────────────
// B_ADAPT_LAYER: camada adaptativa
// Armazena regras experimentais E consolidadas
// Aplica regras adaptativas ANTES do processamento normal
// ─────────────────────────────────────────────────────────────
function v112_adapt_adicionar(regra){
  // regra: {padrao_regex, substituicao, origem, score: 0, testes: 0, status: 'experimental'}
  const sr = V112.subredes && V112.subredes.B_adapt_layer;
  if(!sr) return false;
  const c = v112_node_by_id(sr.id);
  if(!c) return false;
  if(!c._regras_adapt) c._regras_adapt = [];
  // Limite máximo (evita crescimento caótico)
  if(c._regras_adapt.length >= 200) return false;
  // Não duplica
  if(c._regras_adapt.find(r => r.padrao_str === regra.padrao_str)) return false;
  
  c._regras_adapt.push({
    ...regra,
    score: regra.score || 0,
    testes: 0,
    acertos: 0,
    criada_em_turno: V112.turn,
    status: regra.status || 'experimental'
  });
  c._ativacoes = (c._ativacoes||0)+1;
  return true;
}

function v112_adapt_aplicar(input){
  const sr = V112.subredes && V112.subredes.B_adapt_layer;
  if(!sr) return input;
  const c = v112_node_by_id(sr.id);
  if(!c || !c._regras_adapt) return input;
  
  let s = String(input);
  let aplicada = false;
  
  // Aplica regras CONSOLIDADAS primeiro, depois experimentais com cuidado
  const consolidadas = c._regras_adapt.filter(r => r.status === 'consolidada');
  const experimentais = c._regras_adapt.filter(r => r.status === 'experimental');
  
  for(const r of consolidadas){
    try {
      const novo = s.replace(r.padrao_regex, r.substituicao);
      if(novo !== s){ s = novo; aplicada = true; r.testes = (r.testes||0)+1; }
    } catch(e){ /* ignora */ }
  }
  
  // Experimentais só aplicam se não houve consolidada já matched
  if(!aplicada){
    for(const r of experimentais){
      try {
        const novo = s.replace(r.padrao_regex, r.substituicao);
        if(novo !== s){ s = novo; aplicada = true; r.testes = (r.testes||0)+1; break; }
      } catch(e){ /* ignora */ }
    }
  }
  
  return s;
}

function v112_adapt_relatar(){
  const sr = V112.subredes && V112.subredes.B_adapt_layer;
  if(!sr) return null;
  const c = v112_node_by_id(sr.id);
  if(!c || !c._regras_adapt) return {total: 0, experimentais: 0, consolidadas: 0};
  const exp = c._regras_adapt.filter(r => r.status === 'experimental').length;
  const con = c._regras_adapt.filter(r => r.status === 'consolidada').length;
  return {total: c._regras_adapt.length, experimentais: exp, consolidadas: con, regras: c._regras_adapt.slice(0, 10).map(r => ({
    str: r.padrao_str, status: r.status, testes: r.testes, acertos: r.acertos, score: r.score
  }))};
}
window.v112_adapt_adicionar = v112_adapt_adicionar;
window.v112_adapt_aplicar = v112_adapt_aplicar;
window.v112_adapt_relatar = v112_adapt_relatar;

// ─────────────────────────────────────────────────────────────
// B_VALIDADOR: testa regra nova em mini-bateria de regressão
// Se quebra algum teste essencial → descarta
// ─────────────────────────────────────────────────────────────
const TESTES_REGRESSAO_138 = [
  {q: 'cachorro', e: 'animal'},
  {q: '5 + 5', e: '10'},
  {q: '2 ** 100', e: '1267650600228229401496703205376'},
  {q: 'sin(30)', e: '1/2'},
  {q: 'quantos átomos em H2O', e: '3 átomos'},
  {q: 'AND 1 1', e: '= 1'},
  {q: 'distância entre (0,0) e (3,4)', e: '= 5'},
];

function v112_validador_testar_regressao(){
  const sr = V112.subredes && V112.subredes.B_validador;
  if(!sr) return {passou: false};
  const c = v112_node_by_id(sr.id);
  
  let ok = 0, falhou = 0;
  const falhas = [];
  for(const t of TESTES_REGRESSAO_138){
    const estado_bak = {f: V112.fallbacks_consecutivos, t: V112.amigdala_tensao, e: V112.amigdala_estado, g: V112.gaba_ativo, h: V112.historico_recente};
    V112.fallbacks_consecutivos = 0;
    V112.amigdala_tensao = 0;
    V112.amigdala_estado = 'calma';
    V112.gaba_ativo = false;
    V112.historico_recente = [];
    
    let r;
    try { r = v112_processar(t.q); } catch(e){ r = {resposta: 'ERRO: '+e.message}; }
    const resp = String(r.resposta || '').toLowerCase();
    if(resp.includes(String(t.e).toLowerCase())) ok++;
    else { falhou++; falhas.push({q: t.q, esperado: t.e, deu: resp.substring(0,40)}); }
    
    Object.assign(V112, {fallbacks_consecutivos: estado_bak.f, amigdala_tensao: estado_bak.t, amigdala_estado: estado_bak.e, gaba_ativo: estado_bak.g, historico_recente: estado_bak.h});
  }
  
  if(c){
    c._ativacoes = (c._ativacoes||0)+1;
    if(falhou === 0) c._sucessos = (c._sucessos||0)+1;
    if(!c._historico) c._historico = [];
    c._historico.push({ok, falhou, falhas: falhas.slice(0,3), turno: V112.turn});
    if(c._historico.length > 30) c._historico.shift();
  }
  
  return {passou: falhou === 0, ok, falhou, total: ok+falhou, falhas};
}
window.v112_validador_testar_regressao = v112_validador_testar_regressao;

// ─────────────────────────────────────────────────────────────
// B_PROMOTOR: ciclo completo
// 1. Pega sugestão pendente do Introspector
// 2. Tenta gerar regra de reescrita
// 3. Adiciona como experimental
// 4. Testa via Validador
// 5. Se passou → consolida, senão → descarta
// ─────────────────────────────────────────────────────────────
function v112_promotor_ciclo(){
  const sr_i = V112.subredes && V112.subredes.B_introspector;
  const sr_a = V112.subredes && V112.subredes.B_adapt_layer;
  const sr_p = V112.subredes && V112.subredes.B_promotor;
  if(!sr_i || !sr_a || !sr_p) return {erro: 'subs faltando'};
  
  const ci = v112_node_by_id(sr_i.id);
  const cp = v112_node_by_id(sr_p.id);
  if(!ci || !cp) return {erro: 'nodes faltando'};
  if(!ci._sugestoes) return {processadas: 0};
  
  const pendentes = ci._sugestoes.filter(s => s.status === 'pendente');
  const resultados = {tentativas: 0, consolidadas: 0, descartadas: 0, sem_regra: 0, exemplos: []};
  
  for(const sug of pendentes.slice(0, 5)){  // max 5 por ciclo
    resultados.tentativas++;
    
    // Tenta gerar regra a partir dos exemplos
    const regra = v112_promotor_inferir_regra(sug);
    if(!regra){
      sug.status = 'sem_regra_inferivel';
      resultados.sem_regra++;
      continue;
    }
    
    // Adiciona como experimental
    const adicionou = v112_adapt_adicionar(regra);
    if(!adicionou){
      sug.status = 'duplicada';
      continue;
    }
    
    // Valida com regressão
    const val = v112_validador_testar_regressao();
    
    if(val.passou){
      // Consolida
      const ca = v112_node_by_id(sr_a.id);
      const reg = ca._regras_adapt.find(r => r.padrao_str === regra.padrao_str);
      if(reg) reg.status = 'consolidada';
      sug.status = 'consolidada';
      resultados.consolidadas++;
      resultados.exemplos.push({sugestao: sug.assinatura, regra: regra.padrao_str + ' → ' + regra.substituicao});
    } else {
      // Descarta
      const ca = v112_node_by_id(sr_a.id);
      ca._regras_adapt = ca._regras_adapt.filter(r => r.padrao_str !== regra.padrao_str);
      sug.status = 'descartada';
      resultados.descartadas++;
    }
  }
  
  cp._ativacoes = (cp._ativacoes||0)+1;
  cp._sucessos = (cp._sucessos||0) + resultados.consolidadas;
  if(!cp._ciclos) cp._ciclos = [];
  cp._ciclos.push({...resultados, turno: V112.turn});
  if(cp._ciclos.length > 30) cp._ciclos.shift();
  
  return resultados;
}

// Tenta gerar uma regra a partir de exemplos
function v112_promotor_inferir_regra(sugestao){
  const exemplos = sugestao.exemplos || [];
  if(exemplos.length < 2) return null;
  
  // Estratégia simples: identifica palavras-chave comuns e variáveis
  // Procura padrão: prefixo_comum + variável + sufixo_comum
  // Ex: ["qual o seno de 30", "qual o seno de 45", "qual o seno de 60"]
  // → prefixo "qual o seno de " + número + sufixo ""
  // → reescreve para "sin(NUMERO)"
  
  // Acha prefixo comum
  function prefixoComum(arr){
    if(arr.length === 0) return '';
    let p = arr[0];
    for(let i = 1; i < arr.length; i++){
      let j = 0;
      while(j < p.length && j < arr[i].length && p[j] === arr[i][j]) j++;
      p = p.substring(0, j);
    }
    return p;
  }
  function sufixoComum(arr){
    if(arr.length === 0) return '';
    let s = arr[0];
    for(let i = 1; i < arr.length; i++){
      let j = 0;
      while(j < s.length && j < arr[i].length && s[s.length-1-j] === arr[i][arr[i].length-1-j]) j++;
      s = s.substring(s.length - j);
    }
    return s;
  }
  
  const exs = exemplos.map(e => String(e).toLowerCase().trim());
  const pref = prefixoComum(exs);
  const suf = sufixoComum(exs);
  
  if(pref.length < 3 || pref.length + suf.length >= exs[0].length) return null;
  
  // Variável = parte entre prefix e suffix
  const variaveis = exs.map(e => e.substring(pref.length, e.length - suf.length));
  
  // Verifica se variáveis são similares estruturalmente (todas números OU todas palavras)
  const todas_num = variaveis.every(v => /^\d+(\.\d+)?$/.test(v));
  const todas_word = variaveis.every(v => /^[a-zà-ÿ_]+$/.test(v));
  if(!todas_num && !todas_word) return null;
  
  // Detecta tentativa: prefix tem palavra forma chave?
  // Heurística: se prefixo termina em "de" e tem "seno" antes → sin
  // Se "cosseno" → cos
  // Se "tangente" → tan
  // Se "fatorial" → !
  let substituicao = null;
  let padrao_str = null;
  
  const class_pref = pref.replace(/\s+$/, '');
  
  if(/seno\s+de\s*$/.test(class_pref) && todas_num){
    substituicao = 'sin($1)';
    padrao_str = pref + '(\\d+(?:\\.\\d+)?)' + suf;
  } else if(/cosseno\s+de\s*$/.test(class_pref) && todas_num){
    substituicao = 'cos($1)';
    padrao_str = pref + '(\\d+(?:\\.\\d+)?)' + suf;
  } else if(/tangente\s+de\s*$/.test(class_pref) && todas_num){
    substituicao = 'tan($1)';
    padrao_str = pref + '(\\d+(?:\\.\\d+)?)' + suf;
  } else if(/fatorial\s+de\s*$/.test(class_pref) && todas_num){
    substituicao = '$1!';
    padrao_str = pref + '(\\d+)' + suf;
  } else if(/raiz\s+quadrada\s+de\s*$/.test(class_pref) && todas_num){
    substituicao = 'sqrt($1)';
    padrao_str = pref + '(\\d+(?:\\.\\d+)?)' + suf;
  } else if(/quanto\s+(?:é|vale)\s*$/.test(class_pref)){
    substituicao = '$1';  // só remove o prefixo polidez
    padrao_str = '^' + pref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(.+?)' + suf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$';
  } else {
    // Genérico: remove só o prefixo (sem entender semântica)
    if(pref.length < 8) return null;  // muito curto, perigoso
    substituicao = '$1';
    padrao_str = '^' + pref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(.+?)' + suf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$';
  }
  
  let padrao_regex;
  try { padrao_regex = new RegExp(padrao_str, 'i'); }
  catch(e){ return null; }
  
  return {
    padrao_regex,
    padrao_str,
    substituicao,
    origem: 'auto_introspector',
    classe: class_pref,
    exemplos_origem: exs.slice(0, 3),
    score: 0
  };
}
window.v112_promotor_ciclo = v112_promotor_ciclo;
window.v112_promotor_inferir_regra = v112_promotor_inferir_regra;

// ═══════════════════════════════════════════════════════════════
// LAB 13.14 — REGRAS COMO NÓS (migração da arquitetura)
// 
// ANTES: REGRAS_NL_138 = [ [/regex/, 'substituicao'], ... ] em JS
// AGORA: cada regra é um NÓ com atributos _padrao_str, _sub, _prio, _score
// 
// Cada nó tipo 'regra' fica no B_regras_nucleos como satélite
// O v112_iterador_regras lê os nós e aplica por prioridade
// ═══════════════════════════════════════════════════════════════

function v112_regra_criar_no(padrao_str, substituicao, opcoes){
  opcoes = opcoes || {};
  const sr = V112.subredes && V112.subredes.B_regras_nucleos;
  if(!sr) return null;
  
  // Cria nó tipo 'regra'
  const novo_id = (V112.nodes.length > 0 ? Math.max(...V112.nodes.map(n => n.id)) : 0) + 1;
  const no_regra = {
    id: novo_id,
    text: '_regra_' + (opcoes.nome || padrao_str.substring(0, 30)),
    tipo: 'regra',
    camada: 'cortex',
    pos: [
      sr.pos ? sr.pos[0] + (Math.random()-0.5)*20 : 0,
      sr.pos ? sr.pos[1] + (Math.random()-0.5)*20 : 120,
      sr.pos ? sr.pos[2] + (Math.random()-0.5)*10 : 0
    ],
    acumulador: 0,
    limiar: 1,
    estado: 'dormindo',
    _ativacoes: 0,
    // Atributos da regra
    _padrao_str: padrao_str,
    _padrao_flags: opcoes.flags || 'i',
    _sub_tipo: typeof substituicao === 'function' ? 'funcao' : 'string',
    _sub_string: typeof substituicao === 'string' ? substituicao : null,
    _sub_funcao: typeof substituicao === 'function' ? substituicao : null,
    _prioridade: opcoes.prioridade !== undefined ? opcoes.prioridade : 100,
    _score: opcoes.score || 0,
    _aplicacoes: 0,
    _matches: 0,
    _categoria: opcoes.categoria || 'geral',
    _origem: opcoes.origem || 'migracao_138',
  };
  
  V112.nodes.push(no_regra);
  
  // Conecta como satélite do B_regras_nucleos
  if(!sr.satelites) sr.satelites = [];
  sr.satelites.push(novo_id);
  
  // Aresta
  V112.edges.push({a: sr.id, b: novo_id, peso: 1, tipo: 'satelite_regra'});
  
  return no_regra;
}
window.v112_regra_criar_no = v112_regra_criar_no;

// Lista TODOS os nós tipo 'regra'
function v112_regras_listar(){
  return V112.nodes.filter(n => n.tipo === 'regra');
}
window.v112_regras_listar = v112_regras_listar;

// Migra um array [[regex, sub], ...] para nós
function v112_regras_migrar_array(array_regras, categoria){
  let migradas = 0;
  for(let i = 0; i < array_regras.length; i++){
    const [padrao, sub] = array_regras[i];
    const padrao_str = padrao.source || String(padrao);
    const flags = padrao.flags || 'i';
    const prio = array_regras.length - i;  // primeiras regras = mais prioritárias
    
    const ja_existe = V112.nodes.some(n => n.tipo === 'regra' && n._padrao_str === padrao_str && n._categoria === categoria);
    if(ja_existe) continue;
    
    v112_regra_criar_no(padrao_str, sub, {
      prioridade: prio,
      categoria: categoria || 'nlp',
      flags: flags,
      origem: 'migracao_array'
    });
    migradas++;
  }
  return migradas;
}
window.v112_regras_migrar_array = v112_regras_migrar_array;

// Aplica uma regra-nó a um input
function v112_regra_aplicar_no(no_regra, input){
  if(no_regra.tipo !== 'regra') return null;
  let padrao;
  try {
    padrao = new RegExp(no_regra._padrao_str, no_regra._padrao_flags || 'i');
  } catch(e){ return null; }
  
  // Verifica match
  const match = input.match(padrao);
  if(!match) return null;
  
  no_regra._matches = (no_regra._matches||0) + 1;
  
  // Aplica substituição PRESERVANDO grupos (callback do replace)
  let novo_input;
  try {
    if(no_regra._sub_tipo === 'funcao' && typeof no_regra._sub_funcao === 'function'){
      // Função: invoca com (m_array, full_string), igual ao código antigo do v112_nlp_normalizar
      novo_input = input.replace(padrao, (matchStr, ...args) => {
        // args = [g1, g2, ..., offset, fullStr]
        const groups = args.slice(0, -2);
        const m_array = [matchStr, ...groups];
        try {
          return no_regra._sub_funcao(m_array, matchStr);
        } catch(e){
          return matchStr;  // se função falhar, mantém original
        }
      });
    } else if(no_regra._sub_tipo === 'string' && no_regra._sub_string !== null){
      novo_input = input.replace(padrao, no_regra._sub_string);
    } else return null;
  } catch(e){
    return null;
  }
  
  if(novo_input === input) return null;
  
  no_regra._aplicacoes = (no_regra._aplicacoes||0) + 1;
  no_regra._score = (no_regra._score||0) + 1;
  no_regra._ativacoes = (no_regra._ativacoes||0) + 1;
  no_regra.acumulador = (no_regra.acumulador||0) + 0.5;
  no_regra.estado = 'ativo';
  
  return novo_input;
}
window.v112_regra_aplicar_no = v112_regra_aplicar_no;

// ═══════════════════════════════════════════════════════════════
// ITERADOR DE REGRAS — substituto neuronal do v112_nlp_normalizar
// Lê regras dos nós, aplica por prioridade decrescente
// ═══════════════════════════════════════════════════════════════
function v112_iterador_regras(input, opcoes){
  opcoes = opcoes || {};
  const categoria = opcoes.categoria || 'nlp';
  const max_iter = opcoes.max_iter || 30;
  
  const sr_it = V112.subredes && V112.subredes.B_iterador;
  const c_it = sr_it ? v112_node_by_id(sr_it.id) : null;
  if(c_it){
    c_it._ativacoes = (c_it._ativacoes||0) + 1;
    if(!c_it._iteracoes) c_it._iteracoes = [];
  }
  
  // Coleta regras da categoria, ordena por prioridade desc
  let regras = V112.nodes.filter(n => n.tipo === 'regra' && (categoria === 'todas' || n._categoria === categoria));
  // Ordena: prioridade desc, depois score desc (mais usadas vão primeiro em empate)
  regras.sort((a, b) => {
    if((b._prioridade||0) !== (a._prioridade||0)) return (b._prioridade||0) - (a._prioridade||0);
    return (b._score||0) - (a._score||0);
  });
  
  let s = String(input);
  let total_aplicacoes = 0;
  const aplicadas = [];
  
  for(const r of regras){
    if(total_aplicacoes >= max_iter) break;
    const novo = v112_regra_aplicar_no(r, s);
    if(novo !== null && novo !== s){
      aplicadas.push({nome: r.text, prio: r._prioridade});
      s = novo;
      total_aplicacoes++;
    }
  }
  
  if(c_it){
    c_it._iteracoes.push({input_len: input.length, aplicadas: aplicadas.length, regras_avaliadas: regras.length});
    if(c_it._iteracoes.length > 50) c_it._iteracoes.shift();
    c_it.acumulador = (c_it.acumulador||0) + 0.3;
    c_it.estado = 'ativo';
  }
  
  return {resultado: s, aplicadas, total: aplicadas.length, regras_disponiveis: regras.length};
}
window.v112_iterador_regras = v112_iterador_regras;

// Função-irmã do v112_nlp_normalizar que USA OS NÓS (ao invés do array)
function v112_nlp_normalizar_via_nucleos(input){
  const r = v112_iterador_regras(input, {categoria: 'nlp', max_iter: 30});
  return r.resultado;
}
window.v112_nlp_normalizar_via_nucleos = v112_nlp_normalizar_via_nucleos;

// Relatório
function v112_regras_relatar(){
  const regras = v112_regras_listar();
  const por_categoria = {};
  for(const r of regras){
    const cat = r._categoria || 'geral';
    if(!por_categoria[cat]) por_categoria[cat] = {total: 0, ativas: 0, total_aplicacoes: 0};
    por_categoria[cat].total++;
    if((r._aplicacoes||0) > 0) por_categoria[cat].ativas++;
    por_categoria[cat].total_aplicacoes += (r._aplicacoes||0);
  }
  const top_usadas = regras.slice().sort((a,b) => (b._aplicacoes||0) - (a._aplicacoes||0)).slice(0, 10).map(r => ({
    nome: r.text, prio: r._prioridade, score: r._score, aplicacoes: r._aplicacoes, categoria: r._categoria
  }));
  return {total: regras.length, por_categoria, top_usadas};
}
window.v112_regras_relatar = v112_regras_relatar;

// ═══════════════════════════════════════════════════════════════
// LAB 13.10 — B_PROPAGACAO: BFS profundo com:
//   - profundidade arbitrária
//   - detecção de ciclo (A→B→A)
//   - explosão combinatória (limita expansão)
// ═══════════════════════════════════════════════════════════════
function v112_propagar_profundo(origem, opcoes){
  opcoes = opcoes || {};
  const max_profundidade = opcoes.max_profundidade || 1000;
  const max_nos = opcoes.max_nos || 10000;
  const detectar_ciclos = opcoes.detectar_ciclos !== false;
  
  const sr_c = V112.subredes && V112.subredes.B_causal;
  if(!sr_c) return {erro: 'B_causal não disponível'};
  const c_causal = v112_node_by_id(sr_c.id);
  if(!c_causal || !c_causal._causa_de) return {alcancados: [], profundidade: 0};
  
  const t0 = Date.now();
  const alcancados = new Set();
  const profundidade_por_no = {};
  const ciclos_detectados = [];
  const fila = [{no: origem, prof: 0, caminho: [origem]}];
  const visitados = new Set([origem]);
  let max_prof_alcancada = 0;
  
  while(fila.length > 0){
    if(alcancados.size >= max_nos) break;
    const {no, prof, caminho} = fila.shift();
    if(prof >= max_profundidade) continue;
    
    const set = c_causal._causa_de[no];
    if(!set) continue;
    
    for(const proximo of set){
      // Detecta ciclo
      if(caminho.includes(proximo)){
        if(detectar_ciclos){
          const idx = caminho.indexOf(proximo);
          ciclos_detectados.push({ciclo: caminho.slice(idx).concat([proximo])});
        }
        continue;  // não propaga ciclos
      }
      
      if(!visitados.has(proximo)){
        visitados.add(proximo);
        alcancados.add(proximo);
        profundidade_por_no[proximo] = prof + 1;
        if(prof + 1 > max_prof_alcancada) max_prof_alcancada = prof + 1;
        fila.push({no: proximo, prof: prof + 1, caminho: [...caminho, proximo]});
      }
    }
  }
  
  const tempo_ms = Date.now() - t0;
  const sr = V112.subredes && V112.subredes.B_propagacao;
  if(sr){
    const c = v112_node_by_id(sr.id);
    if(c){
      c._ativacoes = (c._ativacoes||0)+1;
      c._sucessos = (c._sucessos||0)+1;
      if(!c._propagacoes) c._propagacoes = [];
      c._propagacoes.push({origem, alcancados: alcancados.size, max_prof: max_prof_alcancada, ciclos: ciclos_detectados.length, tempo_ms});
      if(c._propagacoes.length > 30) c._propagacoes.shift();
    }
  }
  
  // Registra ciclos no B_ciclo
  if(ciclos_detectados.length > 0){
    const sr_ci = V112.subredes && V112.subredes.B_ciclo;
    if(sr_ci){
      const c = v112_node_by_id(sr_ci.id);
      if(c){
        if(!c._ciclos_detectados) c._ciclos_detectados = [];
        c._ciclos_detectados.push(...ciclos_detectados);
        if(c._ciclos_detectados.length > 50) c._ciclos_detectados.splice(0, c._ciclos_detectados.length - 50);
        c._ativacoes = (c._ativacoes||0)+1;
        c._sucessos = (c._sucessos||0)+1;
      }
    }
  }
  
  return {
    alcancados: Array.from(alcancados),
    total: alcancados.size,
    profundidade: max_prof_alcancada,
    ciclos: ciclos_detectados,
    tempo_ms
  };
}
window.v112_propagar_profundo = v112_propagar_profundo;

// ═══════════════════════════════════════════════════════════════
// LAB 13.10 — Manter ambos em conflito (NÃO escolher, NÃO descartar)
// "gelo+fogo" → preserva frio E quente, detecta conflito, registra
// ═══════════════════════════════════════════════════════════════
function v112_processar_conflito_preservar(efeitos){
  // Detecta conflitos no conjunto
  const conflitos = v112_detectar_conflito(efeitos);
  // Não filtra! Retorna tudo + lista conflitos
  return {
    efeitos_preservados: efeitos,  // mantém TODOS
    conflitos,
    tem_conflito: conflitos.length > 0,
    categorias: conflitos.map(c => c.categoria),
    coexistencia: efeitos.length  // contagem total
  };
}
window.v112_processar_conflito_preservar = v112_processar_conflito_preservar;
window.v112_processar = v112_processar;
window.v112_sleep_replay = v112_sleep_replay;
window.v112_reconstruir_evento = v112_reconstruir_evento;
window.v112_peso_semantico = v112_peso_semantico;
window.v112_propagar = v112_propagar;
window.v112_logs_json = v112_logs_json;
window.v112_logs_txt = v112_logs_txt;
window.Z_SENSORIAL_Z = Z_SENSORIAL_Z;
window.Z_HIPOCAMPO_Z = Z_HIPOCAMPO_Z;
window.Z_CORTEX_Z = Z_CORTEX_Z;
window.Z_MOTORA = Z_MOTORA;

// ═══════════════════════════════════════════════════════════════
// LAB 13.21 — B_GERADOR_COMANDOS (auto-mod 2.0)
// 
// Cria COMANDOS-NÓS completos com handler funcional a partir de
// padrões observados + exemplos de ensino do usuário.
// 
// Diferença do 13.13: lá só gerava REGRAS DE REESCRITA (regex→string).
// Aqui gera COMANDOS-NÓS com HANDLER inferido por TEMPLATE.
// 
// 5 templates: ARITMETICO, TRANSFORMACAO, CONSULTA, BUSCA, COMBINACAO
// 
// Sub-rede entra como EXPERIMENTAL (fora de CORE_FIXO).
// Limite: max 50 handlers auto-gerados (evita crescimento caótico).
// ═══════════════════════════════════════════════════════════════

(function instalar_b_gerador(){
  // ─── 1) Registra sub-rede no schema (depois do seed inicial) ───
  // É chamada toda vez que o brain carrega; idempotente.
  if(!V112 || !V112.subredes) return;
  
  // Adiciona definição apenas se não existe
  if(!V112.subredes.B_gerador_comandos){
    V112.subredes.B_gerador_comandos = {
      pos: [-60, 120, 0],
      cor: 'verde_lima',
      proposito: 'GERADOR: cria comandos-nós automaticamente a partir de exemplos'
    };
  }
})();

// ─── 2) Garante nó central da sub-rede (chamado após seed/importar) ───
function v112_gerador_garantir_no(){
  const sr = V112.subredes && V112.subredes.B_gerador_comandos;
  if(!sr) return null;
  // Se já tem id, busca o nó
  if(sr.id){
    const n = v112_node_by_id(sr.id);
    if(n) return n;
  }
  // IDs no V112 são STRINGS (ex: 'SELF_CORE', 'B_xxx', 'cmd_N')
  // Gera id único string-friendly
  const novo_id = 'gerador_root_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const no = {
    id: novo_id,
    text: 'B_gerador_comandos',
    tipo: 'subrede',
    camada: 'cortex',
    pos: sr.pos.slice(),
    acumulador: 0,
    limiar: 1,
    estado: 'dormindo',
    _ativacoes: 0,
    _handlers_gerados: [],   // lista de nomes de handlers auto-gerados
    _consolidados: 0,
    _descartados: 0,
    _max_gerados: 50,
  };
  V112.nodes.push(no);
  sr.id = novo_id;
  if(!sr.satelites) sr.satelites = [];
  return no;
}
window.v112_gerador_garantir_no = v112_gerador_garantir_no;

// ─── 3) Parse de ensino explícito ───
// Sintaxe: "ensina: <padrao_input> -> <acao>"
// Exemplos:
//   ensina: duplique X -> X = X * 2
//   ensina: triplique X -> X = X * 3
//   ensina: metade de X -> X = X / 2
//   ensina: inverta X -> X = -X
//   ensina: zera X -> X = 0
function v112_gerador_parse_ensino(input){
  if(typeof input !== 'string') return null;
  // Aceita: "ensina:", "ensine:", "aprende:", separador "->"  ou "→"
  const m = input.match(/^\s*(?:ensina|ensine|aprende)\s*:\s*(.+?)\s*(?:->|→)\s*(.+?)\s*$/i);
  if(!m) return null;
  return { padrao: m[1].trim(), acao: m[2].trim() };
}
window.v112_gerador_parse_ensino = v112_gerador_parse_ensino;

// ─── 4) Templates de inferência ───
// Cada template recebe {padrao, acao} e tenta inferir:
//   { regex, handler_str, handler_fn, descricao }
// Retorna null se não casa.

const V112_TEMPLATES_GERADOR = {
  // Template 1: ARITMETICO
  // padrão: "<verbo> X"  ação: "X = X * K" / "X = X / K" / "X = X + K" / "X = X - K" / "X = -X" / "X = 0"
  aritmetico: function(padrao, acao){
    // Extrai variável placeholder do padrão (geralmente X)
    // Suporta padrão "duplique X" ou "duplique o X" ou "duplique a X"
    const pm = padrao.match(/^([a-záéíóúâêôãõç]+)\s+(?:o\s+|a\s+)?([A-Z]\w*)\s*$/i);
    if(!pm) return null;
    const verbo = pm[1].toLowerCase();
    const placeholder = pm[2];
    
    // Casa ação aritmética
    // ${placeholder} = ${placeholder} <op> <num>  ou  ${placeholder} = -${placeholder}  ou  ${placeholder} = <num>
    const re_op = new RegExp('^' + placeholder + '\\s*=\\s*' + placeholder + '\\s*([*\\/+\\-])\\s*(\\d+(?:\\.\\d+)?)\\s*$');
    const re_neg = new RegExp('^' + placeholder + '\\s*=\\s*-\\s*' + placeholder + '\\s*$');
    const re_zero = new RegExp('^' + placeholder + '\\s*=\\s*(\\d+(?:\\.\\d+)?)\\s*$');
    
    let op = null, fator = null, modo = null;
    let am;
    if(am = acao.match(re_op)){
      op = am[1]; fator = parseFloat(am[2]); modo = 'op';
    } else if(acao.match(re_neg)){
      modo = 'neg';
    } else if(am = acao.match(re_zero)){
      modo = 'set'; fator = parseFloat(am[1]);
    } else {
      return null;
    }
    
    // Constrói regex de captura: "duplique (\w+)"
    const regex_str = '^' + verbo + '\\s+(?:o\\s+|a\\s+)?(\\w+)\\s*$';
    
    // Constrói handler dinâmico
    let handler_fn;
    if(modo === 'op'){
      handler_fn = function(match, input){
        if(typeof v112_mundo_get !== 'function' || typeof v112_mundo_set !== 'function') return null;
        const v_nome = match[1].toLowerCase();
        const atual = v112_mundo_get(v_nome);
        if(atual === undefined || atual === null) return null;
        let novo;
        if(op === '*') novo = atual * fator;
        else if(op === '/') { if(fator === 0) return null; novo = atual / fator; }
        else if(op === '+') novo = atual + fator;
        else if(op === '-') novo = atual - fator;
        else return null;
        v112_mundo_set(v_nome, novo);
        return { resposta_direta: v_nome + ' = ' + novo + ' (auto-gerado: ' + verbo + ')' };
      };
    } else if(modo === 'neg'){
      handler_fn = function(match, input){
        if(typeof v112_mundo_get !== 'function' || typeof v112_mundo_set !== 'function') return null;
        const v_nome = match[1].toLowerCase();
        const atual = v112_mundo_get(v_nome);
        if(atual === undefined || atual === null) return null;
        const novo = -atual;
        v112_mundo_set(v_nome, novo);
        return { resposta_direta: v_nome + ' = ' + novo + ' (auto-gerado: ' + verbo + ')' };
      };
    } else if(modo === 'set'){
      const valor_fixo = fator;
      handler_fn = function(match, input){
        if(typeof v112_mundo_set !== 'function') return null;
        const v_nome = match[1].toLowerCase();
        v112_mundo_set(v_nome, valor_fixo);
        return { resposta_direta: v_nome + ' = ' + valor_fixo + ' (auto-gerado: ' + verbo + ')' };
      };
    }
    
    return {
      regex_str,
      handler_fn,
      descricao: 'aritmético: ' + verbo + ' X → ' + acao,
      template: 'aritmetico',
    };
  },
  
  // Template 2: TRANSFORMACAO
  // padrão: "<verbo> X"  ação: "reverter" / "maiúsculas" / "minúsculas"
  // Aplica em STRING, não em var-mundo numérica
  transformacao: function(padrao, acao){
    const pm = padrao.match(/^([a-záéíóúâêôãõç]+)\s+(?:o\s+|a\s+)?([A-Z]\w*)\s*$/i);
    if(!pm) return null;
    const verbo = pm[1].toLowerCase();
    
    const acao_l = acao.toLowerCase().trim();
    let transform = null, desc = null;
    if(/revert|invert.*ordem|inverter\s+(string|texto)/i.test(acao_l)){
      transform = s => String(s).split('').reverse().join(''); desc = 'reverte string';
    } else if(/mai[úu]scul/i.test(acao_l)){
      transform = s => String(s).toUpperCase(); desc = 'maiúsculas';
    } else if(/min[úu]scul/i.test(acao_l)){
      transform = s => String(s).toLowerCase(); desc = 'minúsculas';
    } else {
      return null;
    }
    
    const regex_str = '^' + verbo + '\\s+(?:o\\s+|a\\s+)?(\\w+)\\s*$';
    const handler_fn = function(match, input){
      const v_nome = match[1].toLowerCase();
      // Tenta como var-mundo
      if(typeof v112_mundo_get === 'function'){
        const val = v112_mundo_get(v_nome);
        if(val !== undefined && val !== null){
          const novo = transform(val);
          if(typeof v112_mundo_set === 'function') v112_mundo_set(v_nome, novo);
          return { resposta_direta: v_nome + ' = ' + novo + ' (' + desc + ', auto-gerado)' };
        }
      }
      // Senão aplica direto no nome
      return { resposta_direta: transform(v_nome) + ' (' + desc + ', auto-gerado)' };
    };
    
    return {
      regex_str, handler_fn,
      descricao: 'transformação: ' + verbo + ' X → ' + desc,
      template: 'transformacao',
    };
  },
  
  // Template 3: CONSULTA
  // padrão: "quantos X tem" / "qual o total de X"
  // ação: "conta nós tipo X" / "conta sub-rede X"
  consulta: function(padrao, acao){
    // Padrão deve começar com palavra-pergunta
    if(!/^(quantos|quantas|qual|quais)\s/i.test(padrao)) return null;
    // Extrai substantivo-alvo do padrão
    const pm = padrao.match(/^(?:quantos|quantas|qual|quais)\s+(?:o\s+|a\s+|os\s+|as\s+)?(\w+)/i);
    if(!pm) return null;
    const alvo = pm[1].toLowerCase();
    
    // Ação deve indicar fonte: "conta nós tipo X" ou "conta subrede X" ou "conta categoria X"
    let fonte = null;
    if(/nós?\s+tipo|n[óo]\s+tipo/i.test(acao)) fonte = 'tipo';
    else if(/sub.?rede/i.test(acao)) fonte = 'subrede';
    else if(/categoria|instancias?\s+de/i.test(acao)) fonte = 'categoria';
    else return null;
    
    const regex_str = '^(?:quantos|quantas|qual|quais)\\s+(?:o\\s+|a\\s+|os\\s+|as\\s+)?' + alvo + '\\b';
    const handler_fn = function(match, input){
      if(fonte === 'tipo'){
        const n = V112.nodes.filter(x => x.tipo === alvo).length;
        return { resposta_direta: 'há ' + n + ' nós do tipo "' + alvo + '" (auto-gerado)' };
      } else if(fonte === 'subrede'){
        const sr = V112.subredes && V112.subredes['B_' + alvo];
        if(!sr) return { resposta_direta: 'sub-rede B_' + alvo + ' não existe (auto-gerado)' };
        const c = v112_node_by_id(sr.id);
        return { resposta_direta: 'sub-rede B_' + alvo + ' tem ' + (c && c.satelites ? c.satelites.length : 0) + ' satélites (auto-gerado)' };
      } else if(fonte === 'categoria'){
        const c_bidir = V112.subredes && V112.subredes.B_bidir;
        if(!c_bidir) return null;
        const cb = v112_node_by_id(c_bidir.id);
        if(!cb || !cb._cache_instancias) return { resposta_direta: 'categoria desconhecida (auto-gerado)' };
        const set = cb._cache_instancias[alvo];
        if(set && set.size > 0){
          return { resposta_direta: alvo + ' tem ' + set.size + ' instâncias: ' + Array.from(set).slice(0,5).join(', ') + ' (auto-gerado)' };
        }
        return { resposta_direta: alvo + ' sem instâncias conhecidas (auto-gerado)' };
      }
      return null;
    };
    
    return {
      regex_str, handler_fn,
      descricao: 'consulta: ' + padrao + ' (fonte=' + fonte + ')',
      template: 'consulta',
    };
  },
  
  // Template 4: BUSCA
  // padrão: "ache X que tem Y" / "lista X com Y"
  // ação: "filtra nós onde campo=valor"
  busca: function(padrao, acao){
    if(!/^(ache|lista|busca|encontre)\s/i.test(padrao)) return null;
    const pm = padrao.match(/^(?:ache|lista|busca|encontre)\s+(\w+)/i);
    if(!pm) return null;
    const alvo = pm[1].toLowerCase();
    
    // Ação: "filtra X por <campo>=<valor>" ou "comandos auto-gerados"
    // Simplificação: se ação menciona "auto", filtra por _origem='auto_gerado'
    if(/auto.?gerad/i.test(acao)){
      const regex_str = '^(?:ache|lista|busca|encontre)\\s+' + alvo + '(?:\\s+auto.?gerad\\w*)?\\s*$';
      const handler_fn = function(match, input){
        const cmds = v112_comandos_listar().filter(c => c._origem === 'auto_gerado');
        if(cmds.length === 0) return { resposta_direta: 'nenhum comando auto-gerado ainda' };
        const lst = cmds.map(c => c.text + ' (' + (c._handler_nome||'?') + ')').slice(0, 20);
        return { resposta_direta: cmds.length + ' comando(s) auto-gerado(s): ' + lst.join(' | ') };
      };
      return {
        regex_str, handler_fn,
        descricao: 'busca: ' + padrao + ' (auto-gerados)',
        template: 'busca',
      };
    }
    
    return null;  // Outras buscas pendentes
  },
  
  // Template 5: COMBINACAO
  // padrão: "<verbo> X com Y" / "<verbo> X depois Y"
  // ação: "<h1> X então <h2> Y" (encadeia 2 handlers existentes)
  combinacao: function(padrao, acao){
    const pm = padrao.match(/^([a-záéíóúâêôãõç]+)\s+(?:o\s+|a\s+)?([A-Z]\w*)\s+(?:e|com|depois|então)\s+(?:o\s+|a\s+)?([A-Z]\w*)\s*$/i);
    if(!pm) return null;
    const verbo = pm[1].toLowerCase();
    
    // Ação: "(h_xxx) (h_yyy)" — nomes de handlers existentes
    const am = acao.match(/(h_\w+)\s+(?:e|então|depois|com)?\s*(h_\w+)/);
    if(!am) return null;
    const h1 = am[1], h2 = am[2];
    
    if(!window.V112_HANDLERS[h1] || !window.V112_HANDLERS[h2]) return null;
    
    const regex_str = '^' + verbo + '\\s+(?:o\\s+|a\\s+)?(\\w+)\\s+(?:e|com|depois|então)\\s+(?:o\\s+|a\\s+)?(\\w+)\\s*$';
    const handler_fn = function(match, input){
      const r1 = window.V112_HANDLERS[h1]([null, match[1]], match[1]);
      const r2 = window.V112_HANDLERS[h2]([null, match[2]], match[2]);
      const txt = (r1 && r1.resposta_direta ? r1.resposta_direta : '?') + ' + ' + (r2 && r2.resposta_direta ? r2.resposta_direta : '?');
      return { resposta_direta: txt + ' (combinação auto-gerada)' };
    };
    
    return {
      regex_str, handler_fn,
      descricao: 'combinação: ' + verbo + ' X e Y → ' + h1 + ' + ' + h2,
      template: 'combinacao',
    };
  },
};
window.V112_TEMPLATES_GERADOR = V112_TEMPLATES_GERADOR;

// ─── 5) Geração: aplica templates em ordem ───
function v112_gerador_inferir(padrao, acao){
  for(const nome of ['aritmetico','transformacao','consulta','busca','combinacao']){
    try {
      const r = V112_TEMPLATES_GERADOR[nome](padrao, acao);
      if(r) return r;
    } catch(e){ continue; }
  }
  return null;
}
window.v112_gerador_inferir = v112_gerador_inferir;

// ─── 6) Validação pré-consolidação ───
// Roda validador 8/8 + roda exemplos passados pelo usuário
function v112_gerador_validar(infer, exemplos_teste){
  // 1) Validador de regressão deve continuar passando
  if(typeof v112_validador_testar_regressao === 'function'){
    const v = v112_validador_testar_regressao();
    if(!v.passou){
      return { ok: false, motivo: 'validador_regressao_falhou', detalhes: v.falhas };
    }
  }
  
  // 2) Se exemplos fornecidos, roda cada um e verifica que handler responde algo
  if(Array.isArray(exemplos_teste) && exemplos_teste.length > 0){
    let re;
    try { re = new RegExp(infer.regex_str, 'i'); }
    catch(e){ return { ok: false, motivo: 'regex_invalida', detalhes: e.message }; }
    
    for(const ex of exemplos_teste){
      const m = ex.match(re);
      if(!m){
        return { ok: false, motivo: 'regex_nao_casa_exemplo', detalhes: ex };
      }
      try {
        const r = infer.handler_fn(m, ex);
        if(r === null || r === undefined){
          return { ok: false, motivo: 'handler_retornou_null', detalhes: ex };
        }
      } catch(e){
        return { ok: false, motivo: 'handler_lancou_excecao', detalhes: e.message };
      }
    }
  }
  
  return { ok: true };
}
window.v112_gerador_validar = v112_gerador_validar;

// ─── 7) Pipeline completo: ensina → infere → valida → consolida ───
function v112_gerador_aprender(input_ensino, exemplos_teste){
  const sr_no = v112_gerador_garantir_no();
  if(!sr_no) return { ok: false, motivo: 'sub_rede_inexistente' };
  
  // Limite global
  const cmds_auto = v112_comandos_listar().filter(c => c._origem === 'auto_gerado').length;
  if(cmds_auto >= (sr_no._max_gerados || 50)){
    return { ok: false, motivo: 'limite_atingido', detalhes: cmds_auto + ' já gerados' };
  }
  
  // Parsea
  const parsed = v112_gerador_parse_ensino(input_ensino);
  if(!parsed) return { ok: false, motivo: 'sintaxe_invalida', dica: 'use: ensina: <padrão> -> <ação>' };
  
  // Infere template
  const infer = v112_gerador_inferir(parsed.padrao, parsed.acao);
  if(!infer) return { ok: false, motivo: 'nenhum_template_casou', padrao: parsed.padrao, acao: parsed.acao };
  
  // Verifica colisão de regex com comandos existentes (alta prioridade)
  for(const cmd of v112_comandos_listar()){
    if((cmd._prioridade || 0) >= 90 && cmd._padrao_str === infer.regex_str){
      return { ok: false, motivo: 'colisao_regex', com: cmd.text };
    }
  }
  
  // Valida
  const val = v112_gerador_validar(infer, exemplos_teste);
  if(!val.ok){
    sr_no._descartados = (sr_no._descartados || 0) + 1;
    return { ok: false, motivo: 'validacao_falhou', detalhes: val };
  }
  
  // Gera nome único de handler
  const seq = (sr_no._handlers_gerados || []).length + 1;
  const handler_nome = 'h_auto_gerado_' + seq;
  
  // Registra handler global
  v112_registrar_handler(handler_nome, infer.handler_fn);
  
  // Cria comando-nó com prioridade média (entre comandos manuais e default)
  const cmd_no = v112_comando_criar_no(infer.regex_str, handler_nome, {
    nome: handler_nome,
    prioridade: 80,  // abaixo dos manuais (100), acima dos de fallback
    categoria: 'comando_auto',
    descricao: infer.descricao,
    origem: 'auto_gerado',
    flags: 'i',
  });
  
  if(!cmd_no){
    return { ok: false, motivo: 'criacao_no_falhou' };
  }
  
  // Registra no estado da sub-rede
  if(!sr_no._handlers_gerados) sr_no._handlers_gerados = [];
  sr_no._handlers_gerados.push({
    nome: handler_nome,
    cmd_id: cmd_no.id,
    padrao: parsed.padrao,
    acao: parsed.acao,
    template: infer.template,
    regex: infer.regex_str,
    turno: V112.turn || 0,
  });
  sr_no._consolidados = (sr_no._consolidados || 0) + 1;
  sr_no._ativacoes = (sr_no._ativacoes || 0) + 1;
  
  return {
    ok: true,
    handler: handler_nome,
    cmd_id: cmd_no.id,
    template: infer.template,
    regex: infer.regex_str,
    descricao: infer.descricao,
  };
}
window.v112_gerador_aprender = v112_gerador_aprender;

// ─── 8) Invalidação: "esquece comando X" ───
function v112_gerador_invalidar(nome_handler){
  const cmds = v112_comandos_listar();
  // Aceita match parcial ('h_auto_gerado_3', 'auto_gerado_3', 'duplique' por descrição)
  let alvo = null;
  for(const c of cmds){
    if(c._origem !== 'auto_gerado') continue;
    if(c._handler_nome === nome_handler ||
       c.text === '_cmd_' + nome_handler ||
       c.text.endsWith(nome_handler) ||
       (c._descricao && c._descricao.toLowerCase().includes(String(nome_handler).toLowerCase()))){
      alvo = c;
      break;
    }
  }
  if(!alvo) return { ok: false, motivo: 'comando_nao_encontrado' };
  
  // Remove handler global
  if(window.V112_HANDLERS && window.V112_HANDLERS[alvo._handler_nome]){
    delete window.V112_HANDLERS[alvo._handler_nome];
  }
  
  // Remove o nó — uso _handler_nome como chave única (IDs podem ser NaN no estado importado)
  const idx = V112.nodes.findIndex(n => n.tipo === 'comando' && n._handler_nome === alvo._handler_nome);
  if(idx >= 0) V112.nodes.splice(idx, 1);
  
  // Remove de satellites e edges — também por chave segura
  // (IDs como NaN não comparam por igualdade; uso filter por handler_nome)
  const sr = V112.subredes && V112.subredes.B_comandos_nucleos;
  if(sr && Array.isArray(sr.satelites)){
    // satelites é array de IDs; como ID pode ser NaN, melhor reconstruir filtrando
    // apenas comandos que NÃO são o alvo. Mas como satelites é array de IDs (não de nós),
    // vou comparar pelo id do alvo se for válido:
    if(typeof alvo.id === 'number' && !isNaN(alvo.id)){
      const si = sr.satelites.indexOf(alvo.id);
      if(si >= 0) sr.satelites.splice(si, 1);
    }
    // Se id é NaN, deixa o satelite órfão (não afeta funcionalidade — só lookup)
  }
  // Edges: NaN!==NaN, então edges com a/b=NaN do alvo ficam órfãs.
  // Removo edges que parecem ser do alvo (origem da sub-rede de comandos):
  if(typeof alvo.id === 'number' && !isNaN(alvo.id)){
    V112.edges = V112.edges.filter(e => e.a !== alvo.id && e.b !== alvo.id);
  }
  
  // Remove do registro do gerador
  const sr_no = v112_gerador_garantir_no();
  if(sr_no && sr_no._handlers_gerados){
    sr_no._handlers_gerados = sr_no._handlers_gerados.filter(h => h.nome !== alvo._handler_nome);
  }
  
  return { ok: true, removido: alvo.text };
}
window.v112_gerador_invalidar = v112_gerador_invalidar;

// ─── 9) Relatório ───
function v112_gerador_relatar(){
  const sr_no = v112_gerador_garantir_no();
  if(!sr_no) return { total: 0, consolidados: 0, descartados: 0, lista: [] };
  const cmds_auto = v112_comandos_listar().filter(c => c._origem === 'auto_gerado');
  return {
    total: cmds_auto.length,
    consolidados: sr_no._consolidados || 0,
    descartados: sr_no._descartados || 0,
    max: sr_no._max_gerados || 50,
    lista: cmds_auto.map(c => ({
      nome: c.text,
      handler: c._handler_nome,
      padrao: c._padrao_str,
      descricao: c._descricao,
      aplicacoes: c._aplicacoes || 0,
    })),
  };
}
window.v112_gerador_relatar = v112_gerador_relatar;

// ─── 10) Handlers NL pra acessar via v112_processar ───
// Registrados após brain carregar.
(function registrar_handlers_nl_gerador(){
  if(typeof v112_registrar_handler !== 'function') return;
  
  // h_gerador_ensina — captura "ensina: ... -> ..." e dispara aprendizado
  v112_registrar_handler('h_gerador_ensina', (m, input) => {
    const r = v112_gerador_aprender(input);
    if(!r.ok){
      return { resposta_direta: 'não consegui aprender (' + r.motivo + (r.dica ? '; ' + r.dica : '') + ')' };
    }
    return { resposta_direta: 'aprendido: ' + r.descricao + ' [handler=' + r.handler + ', regex=' + r.regex + ']' };
  });
  
  // h_gerador_relatar — "comandos auto" / "auto-gerados"
  v112_registrar_handler('h_gerador_relatar', (m, input) => {
    const r = v112_gerador_relatar();
    let txt = 'auto-gerados: ' + r.total + '/' + r.max + ' (consolidados=' + r.consolidados + ', descartados=' + r.descartados + ')';
    if(r.lista.length > 0){
      txt += ' | ' + r.lista.slice(0, 5).map(x => x.nome + '×' + x.aplicacoes).join(', ');
    }
    return { resposta_direta: txt };
  });
  
  // h_gerador_invalidar — "esquece comando X"
  v112_registrar_handler('h_gerador_invalidar', (m, input) => {
    const nome = (m[1] || '').trim();
    if(!nome) return null;
    const r = v112_gerador_invalidar(nome);
    if(!r.ok) return { resposta_direta: 'não removi (' + r.motivo + ')' };
    return { resposta_direta: 'comando removido: ' + r.removido };
  });
})();

// ─── 11) Cria comandos-nós dos handlers do gerador (rodar após seed/importar) ───
function v112_gerador_instalar_comandos_nl(){
  if(typeof v112_comando_criar_no !== 'function') return;
  // Evita duplicação
  const existentes = v112_comandos_listar().map(c => c._handler_nome);
  
  if(!existentes.includes('h_gerador_ensina')){
    v112_comando_criar_no(
      '^\\s*(?:ensina|ensine|aprende)\\s*:\\s*.+(?:->|→).+',
      'h_gerador_ensina',
      { nome: 'h_gerador_ensina', prioridade: 200, categoria: 'comando',
        descricao: 'ensina novo comando via gerador', origem: 'gerador_nl' }
    );
  }
  
  if(!existentes.includes('h_gerador_relatar')){
    v112_comando_criar_no(
      '^\\s*(?:comandos?\\s+auto(?:-?gerados?)?|auto-?gerados?|gerador\\s+(?:status|relat[óo]rio))\\s*\\??\\s*$',
      'h_gerador_relatar',
      { nome: 'h_gerador_relatar', prioridade: 195, categoria: 'comando',
        descricao: 'lista comandos auto-gerados', origem: 'gerador_nl' }
    );
  }
  
  if(!existentes.includes('h_gerador_invalidar')){
    v112_comando_criar_no(
      '^\\s*esquece?\\s+comando\\s+(.+?)\\s*$',
      'h_gerador_invalidar',
      { nome: 'h_gerador_invalidar', prioridade: 195, categoria: 'comando',
        descricao: 'remove um comando auto-gerado', origem: 'gerador_nl' }
    );
  }
}
window.v112_gerador_instalar_comandos_nl = v112_gerador_instalar_comandos_nl;

// ─── 12) Integração com B_introspector ───
// Quando há 3+ falhas com padrão repetido, B_introspector já cria sugestões.
// Aqui exponho função pra usuário consultar e ensinar de acordo.
function v112_gerador_sugestoes_pendentes(){
  const sr_i = V112.subredes && V112.subredes.B_introspector;
  if(!sr_i) return [];
  const c = v112_node_by_id(sr_i.id);
  if(!c || !c._sugestoes) return [];
  return c._sugestoes.filter(s => s.status === 'pendente').slice(-10);
}
window.v112_gerador_sugestoes_pendentes = v112_gerador_sugestoes_pendentes;

console.log('[B_gerador_comandos v13.21] instalado — auto-mod 2.0 pronto');


console.log('[v112_brain v11.3] carregado');

// ─── Normaliza sub-redes que vieram sem 'satelites' ───
(function(){
  if(!window.V112 || !window.V112.subredes) return;
  for(const [nome, sr] of Object.entries(window.V112.subredes)){
    if(sr && !Array.isArray(sr.satelites)) sr.satelites = [];
  }
})();

