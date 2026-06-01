/* ════════════════════════════════════════════════════════════════
   motor_receitas.js — O ALFABETO + INTERPRETADOR.

   A ideia (do Douglas):
   - Mantém os 142 handlers fixos (não mexe neles).
   - ADICIONA um alfabeto de ~20 primitivas atômicas (as "letras").
   - ADICIONA 5 letras ESPECIAIS (meta-operações poderosas).
   - Um único handler novo (h_executar_receita) interpreta RECEITAS
     montadas com essas letras.
   - O cérebro pode então MONTAR comportamento novo (não-programado)
     combinando letras — em vez de só apontar pra handler fixo.

   Carregue depois do arch_neural:
     <script src="arch_neural_v15_final.js"></script>
     <script src="shared/motor_receitas.js"></script>

   Uma RECEITA é uma árvore JSON de instruções:
     ["SEQ",
        ["VAR","w",["WIDTH"]],
        ["VAR","n",["DIV",["GET","w"],2]],
        ["LOOP",["GET","n"], ["TXT","-"]] ]

   Roda via: window.RECEITAS.exec(receita, {input:"..."}) → {out, frames}
   Ou registra como comando-nó e o cérebro chama via v112_processar.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ──────────────────────────────────────────────────────────────
  //  O ALFABETO — cada "letra" é uma operação atômica.
  //  avaliar(instr, ctx) avalia recursivamente.
  // ──────────────────────────────────────────────────────────────

  function ehInstr(x){ return Array.isArray(x) && typeof x[0] === 'string'; }

  function avaliar(instr, ctx){
    // valor literal (número, string, bool) passa direto
    if(!ehInstr(instr)) return instr;

    var op = instr[0];
    var A = instr.slice(1);

    switch(op){

      // ═══ LETRAS NORMAIS (alfabeto base) ═══

      // SEQ: executa cada passo em ordem, retorna o último valor
      case 'SEQ': {
        var r = '';
        for(var i=0;i<A.length;i++) r = avaliar(A[i], ctx);
        return r;
      }

      // TXT(s): emite texto literal no buffer
      case 'TXT': {
        var s = String(avaliar(A[0], ctx));
        ctx.out += s;
        return s;
      }

      // REP(ch, n): repete caractere n vezes (emite)
      case 'REP': {
        var ch = String(avaliar(A[0], ctx));
        var n = Math.max(0, Math.floor(Number(avaliar(A[1], ctx)) || 0));
        n = Math.min(n, 5000); // trava de segurança
        var s = ch.repeat(n);
        ctx.out += s;
        return s;
      }

      // NL(): quebra de linha
      case 'NL': { ctx.out += '\n'; return '\n'; }

      // LOOP(n, corpo): executa corpo n vezes
      case 'LOOP': {
        var n = Math.max(0, Math.floor(Number(avaliar(A[0], ctx)) || 0));
        n = Math.min(n, 5000); // trava anti-loop-infinito
        var last = '';
        for(var k=0;k<n;k++){ ctx._i = k; last = avaliar(A[1], ctx); }
        return last;
      }

      // VAR(nome, valor): guarda variável
      case 'VAR': {
        var nome = A[0];
        var val = avaliar(A[1], ctx);
        ctx.vars[nome] = val;
        return val;
      }

      // GET(nome): lê variável (ou _i = índice do loop atual)
      case 'GET': {
        var nome = A[0];
        if(nome === '_i') return ctx._i || 0;
        return ctx.vars[nome];
      }

      // aritmética
      case 'ADD': return Number(avaliar(A[0],ctx)) + Number(avaliar(A[1],ctx));
      case 'SUB': return Number(avaliar(A[0],ctx)) - Number(avaliar(A[1],ctx));
      case 'MUL': return Number(avaliar(A[0],ctx)) * Number(avaliar(A[1],ctx));
      case 'DIV': { var d=Number(avaliar(A[1],ctx)); return d===0?0:Math.floor(Number(avaliar(A[0],ctx))/d); }
      case 'MOD': { var d=Number(avaliar(A[1],ctx)); return d===0?0:Number(avaliar(A[0],ctx))%d; }

      // texto
      case 'CONCAT': return String(avaliar(A[0],ctx)) + String(avaliar(A[1],ctx));
      case 'UPPER': return String(avaliar(A[0],ctx)).toUpperCase();
      case 'LOWER': return String(avaliar(A[0],ctx)).toLowerCase();
      case 'REVERSE': return String(avaliar(A[0],ctx)).split('').reverse().join('');
      case 'SLICE': return String(avaliar(A[0],ctx)).slice(Number(avaliar(A[1],ctx)), A[2]!=null?Number(avaliar(A[2],ctx)):undefined);
      case 'LEN': { var v=avaliar(A[0],ctx); return (v&&v.length!=null)?v.length:0; }

      // comparação / lógica
      case 'EQ': return avaliar(A[0],ctx) == avaliar(A[1],ctx);
      case 'GT': return Number(avaliar(A[0],ctx)) > Number(avaliar(A[1],ctx));
      case 'LT': return Number(avaliar(A[0],ctx)) < Number(avaliar(A[1],ctx));
      case 'NOT': return !avaliar(A[0],ctx);

      // IF(cond, entao, senao)
      case 'IF': {
        if(avaliar(A[0],ctx)) return avaliar(A[1],ctx);
        else return A[2]!=null ? avaliar(A[2],ctx) : '';
      }

      // ambiente / entrada
      case 'INPUT': return ctx.input || '';

      // WIDTH(): mede a área de chat (auto-detecção real, igual o desenho_simbolos)
      case 'WIDTH': {
        try {
          var el = (typeof document!=='undefined') && (document.getElementById('chat-content') || document.querySelector('.ph-chat-content') || document.getElementById('chat') || document.getElementById('msgs'));
          if(el && el.clientWidth){ return Math.max(8, Math.floor((el.clientWidth*0.80-24)/6.2)); }
        } catch(e){}
        return 26; // medida aprendida (fallback sem DOM)
      }

      // LIST(a,b,c...): cria lista com os args avaliados
      case 'LIST': return A.map(function(x){ return avaliar(x, ctx); });

      // MATCH(s, regex): testa padrão, retorna bool
      case 'MATCH': {
        try { return new RegExp(String(avaliar(A[1],ctx)),'i').test(String(avaliar(A[0],ctx))); }
        catch(e){ return false; }
      }

      // NODE(txt): busca um nó pelo texto, retorna {id,text} ou null
      case 'NODE': {
        if(!window.V112 || !window.V112.nodes) return null;
        var t = String(avaliar(A[0],ctx)).toLowerCase();
        var n = window.V112.nodes.find(function(x){ return (x.text||'').toLowerCase() === t; });
        return n ? {id:n.id, text:n.text} : null;
      }

      // NEIGHBORS(txt): textos dos nós vizinhos de um nó (lista de strings)
      case 'NEIGHBORS': {
        if(!window.V112 || !window.V112.nodes || !window.V112.edges) return [];
        var t = String(avaliar(A[0],ctx)).toLowerCase();
        var no = window.V112.nodes.find(function(x){ return (x.text||'').toLowerCase() === t; });
        if(!no) return [];
        var ids = {};
        for(var e=0;e<window.V112.edges.length;e++){
          var ed = window.V112.edges[e];
          if(ed.from === no.id) ids[ed.to] = 1;
          else if(ed.to === no.id) ids[ed.from] = 1;
        }
        var res = [];
        for(var nn=0; nn<window.V112.nodes.length; nn++){
          var cand = window.V112.nodes[nn];
          if(ids[cand.id] && cand.text) res.push(cand.text);
        }
        return res.slice(0, 50);
      }

      // JOIN(lista, sep): junta lista de strings
      case 'JOIN': {
        var lst = avaliar(A[0], ctx);
        var sep = A[1]!=null ? String(avaliar(A[1],ctx)) : '';
        if(!Array.isArray(lst)) return String(lst);
        return lst.map(String).join(sep);
      }

      // EACH(lista, corpo): pra cada item da lista, _item disponível, executa corpo
      case 'EACH': {
        var lst = avaliar(A[0], ctx);
        if(!Array.isArray(lst)) return '';
        var last='';
        for(var ii=0; ii<lst.length && ii<200; ii++){
          ctx.vars._item = lst[ii]; ctx._i = ii;
          last = avaliar(A[1], ctx);
        }
        return last;
      }

      // ═══ AS 5 LETRAS ESPECIAIS (meta-operações poderosas) ═══

      // ★1 SELF(campo): lê estado interno do próprio cérebro
      //   campos: 'tensao','estado','nos','arestas','subredes'
      case 'SELF': {
        var campo = A[0];
        var V = window.V112 || {};
        if(campo==='tensao') return V.amigdala_tensao||0;
        if(campo==='estado') return V.amigdala_estado||'?';
        if(campo==='nos') return (V.nodes||[]).length;
        if(campo==='arestas') return (V.edges||[]).length;
        if(campo==='subredes') return Object.keys(V.subredes||{}).length;
        return null;
      }

      // ★2 FRAME(conteudo): marca um QUADRO de animação (pro flipbook temporal)
      //   o que tiver no buffer vira um quadro e zera pro próximo
      case 'FRAME': {
        var c = avaliar(A[0], ctx);
        ctx.frames.push(ctx.out);  // empurra o buffer atual como quadro
        ctx.out = '';              // zera pro próximo quadro
        return c;
      }

      // ★3 LEARN(texto): cria/reforça um nó no grafo (auto-modifica a memória)
      case 'LEARN': {
        var txt = String(avaliar(A[0], ctx));
        try {
          if(window.v112_processar){ window.v112_processar(txt); }
          ctx._aprendeu = (ctx._aprendeu||0)+1;
        } catch(e){}
        return txt;
      }

      // ★4 RECIPE(nome, receita): CRIA uma receita nova e salva num nó (meta!)
      //   receita que escreve receita — persiste no grafo
      case 'RECIPE': {
        var nome = String(avaliar(A[0], ctx));
        var corpo = A[1]; // NÃO avalia — guarda a árvore literal
        window.RECEITAS._salvar(nome, corpo);
        return nome;
      }

      // ★5 CALL(nome, input): executa OUTRA receita salva pelo nome (composição/recursão)
      case 'CALL': {
        var nome = String(avaliar(A[0], ctx));
        var inp = A[1]!=null ? String(avaliar(A[1],ctx)) : ctx.input;
        var rec = window.RECEITAS._buscar(nome);
        if(!rec){ ctx.out += '[receita "'+nome+'" não existe]'; return ''; }
        // profundidade pra evitar recursão infinita
        ctx._depth = (ctx._depth||0)+1;
        if(ctx._depth > 12){ ctx.out += '[recursão profunda demais]'; return ''; }
        var r = avaliar(rec, ctx); // mesmo ctx → escreve no mesmo buffer
        ctx._depth--;
        return r;
      }

      default:
        // letra desconhecida — ignora com marca
        return '[?'+op+']';
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  API pública
  // ──────────────────────────────────────────────────────────────
  var _receitasSalvas = {}; // nome → árvore (em runtime; persiste via nó também)

  window.RECEITAS = {
    // executa uma receita, retorna {out, frames, aprendeu}
    exec: function(receita, opts){
      opts = opts || {};
      var ctx = { out:'', frames:[], vars:{}, input:opts.input||'', _i:0, _depth:0 };
      try { avaliar(receita, ctx); }
      catch(e){ ctx.out += '\n[erro receita: '+e.message+']'; }
      // se sobrou buffer e havia frames, fecha o último quadro
      if(ctx.frames.length && ctx.out){ ctx.frames.push(ctx.out); ctx.out=''; }
      return { out: ctx.out, frames: ctx.frames, aprendeu: ctx._aprendeu||0 };
    },

    // salva receita em runtime + num nó do grafo (persiste no export)
    _salvar: function(nome, arvore){
      _receitasSalvas[nome] = arvore;
      try {
        if(window.V112 && window.V112.nodes){
          var txt = '_receita_' + nome;
          var existe = window.V112.nodes.find(function(n){ return n.text===txt; });
          var payload = JSON.stringify(arvore);
          if(existe){ existe._receita = payload; }
          else {
            var id = 'n_' + (window.V112._next_node_id != null ? window.V112._next_node_id++ : window.V112.nodes.length);
            window.V112.nodes.push({ id:id, text:txt, tipo:'receita', _receita:payload, mass:1, camada:'receita', pos:[0,0,0] });
          }
        }
      } catch(e){}
      return nome;
    },

    // busca receita: runtime primeiro, depois nó do grafo
    _buscar: function(nome){
      if(_receitasSalvas[nome]) return _receitasSalvas[nome];
      try {
        var txt = '_receita_' + nome;
        var no = (window.V112.nodes||[]).find(function(n){ return n.text===txt; });
        if(no && no._receita){ var a = JSON.parse(no._receita); _receitasSalvas[nome]=a; return a; }
      } catch(e){}
      return null;
    },

    // lista receitas salvas
    listar: function(){
      var r = Object.keys(_receitasSalvas);
      try {
        (window.V112.nodes||[]).forEach(function(n){
          if(n.tipo==='receita' && n.text){ var nm=n.text.replace('_receita_',''); if(r.indexOf(nm)<0) r.push(nm); }
        });
      } catch(e){}
      return r;
    },

    // o avaliador exposto (pra debug)
    _avaliar: avaliar,

    // lista das letras do alfabeto
    alfabeto: ['SEQ','TXT','REP','NL','LOOP','VAR','GET','ADD','SUB','MUL','DIV','MOD',
               'CONCAT','UPPER','LOWER','REVERSE','SLICE','LEN','EQ','GT','LT','NOT','IF',
               'INPUT','WIDTH','LIST','MATCH','NODE','NEIGHBORS','JOIN','EACH'],
    especiais: ['SELF','FRAME','LEARN','RECIPE','CALL'],
  };

  // ──────────────────────────────────────────────────────────────
  //  HANDLER interpretador — registra no V112 (igual desenho_simbolos)
  //  Um comando-nó aponta pra cá; o nó carrega a receita em _receita.
  // ──────────────────────────────────────────────────────────────
  if(window.v112_registrar_handler){
    window.v112_registrar_handler('h_executar_receita', function(m, input){
      // ATENÇÃO: aqui 'm' é o RESULTADO do regex match (não o nó-comando).
      // Então achamos o nó-comando que casou com este input, pra pegar a receita.
      var receita = null;
      try {
        var cmds = (window.V112.nodes||[]).filter(function(n){
          return n.tipo==='comando' && n._handler_nome==='h_executar_receita' && n._receita;
        });
        // ordena por prioridade desc (igual o engine faz)
        cmds.sort(function(a,b){ return (b._prioridade||0)-(a._prioridade||0); });
        for(var i=0;i<cmds.length;i++){
          try {
            var rx = new RegExp(cmds[i]._padrao_str, cmds[i]._padrao_flags||'i');
            if(rx.test(String(input))){ receita = JSON.parse(cmds[i]._receita); break; }
          } catch(e){}
        }
      } catch(e){}
      if(!receita){ return { resposta_direta: '[receita não encontrada pra esse comando]' }; }
      var r = window.RECEITAS.exec(receita, { input: String(input) });
      if(r.frames && r.frames.length > 1){
        return { resposta_direta: r.frames.join('\n— — —\n'), desenho:'receita_frames', frames:r.frames };
      }
      return { resposta_direta: r.out || '(receita vazia)' };
    });
    try { console.log('[motor_receitas] handler h_executar_receita registrado'); } catch(e){}
  } else {
    try { console.warn('[motor_receitas] arch_neural não carregado — handler não registrado'); } catch(e){}
  }

  try {
    console.log('[motor_receitas] carregado — alfabeto: ' + window.RECEITAS.alfabeto.length + ' letras + ' + window.RECEITAS.especiais.length + ' especiais');
  } catch(e){}
})();
