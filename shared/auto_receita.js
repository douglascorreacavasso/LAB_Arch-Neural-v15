/* ════════════════════════════════════════════════════════════════
   auto_receita.js — A PONTE com os auto-mods.

   Fecha o ciclo que o Douglas quer:
     necessidade detectada → cérebro MONTA receita das letras →
     registra como comando-nó novo → necessidade atendida.

   SEM eu programar um handler novo. O comportamento novo nasce da
   COMBINAÇÃO de primitivas (alfabeto), montada por um compositor que
   reconhece o TIPO de necessidade e escolhe as letras.

   Carregue depois do motor_receitas:
     <script src="shared/motor_receitas.js"></script>
     <script src="shared/auto_receita.js"></script>
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(!window.RECEITAS){ try{console.warn('[auto_receita] motor_receitas não carregado');}catch(e){} return; }

  // ──────────────────────────────────────────────────────────────
  //  COMPOSITOR — reconhece o TIPO de necessidade e monta a receita.
  //  Cada padrão = (regex que detecta) + (função que monta a receita
  //  das letras do alfabeto) + (regex do comando que vai casar depois).
  // ──────────────────────────────────────────────────────────────
  var PADROES = [
    {
      tipo: 'listar',
      detecta: /\b(lista|liste|enumera|enumere|mostra|mostre)\b.*?\b(sobre|de|do|da)\s+([a-zà-ú]+)/i,
      // monta: "sei isto sobre X: <vizinhos de X juntados por vírgula>"
      monta: function(m){
        var alvo = m[3];
        return {
          nome: 'listar_' + alvo,
          regex: '\\b(lista|liste|enumera|mostra)\\b.*\\b'+alvo+'\\b',
          receita: ["SEQ",
            ["TXT","sei isto sobre "+alvo+": "],
            ["TXT", ["JOIN", ["NEIGHBORS", alvo], ", "]]
          ]
        };
      }
    },
    {
      tipo: 'inverter',
      detecta: /\b(inverte|inverter|espelha|espelhar|ao contr[aá]rio|de tr[aá]s)\b/i,
      monta: function(m){
        return {
          nome: 'inverter_texto',
          regex: '\\b(inverte|inverter|espelha|espelhar|ao contr[ao]rio)\\b',
          receita: ["TXT", ["REVERSE", ["INPUT"]]]
        };
      }
    },
    {
      tipo: 'contar',
      detecta: /\b(quantos?|conta|contar|n[uú]mero de)\b.*\b(sabe|conhece|tem|nós|nos|conceitos)\b/i,
      monta: function(m){
        return {
          nome: 'contar_conhecimento',
          regex: '\\b(quantos?|conta|n[uú]mero)\\b.*\\b(sabe|conhece|tem|conceitos|n[oó]s)\\b',
          // usa letra especial ★SELF
          receita: ["SEQ",
            ["TXT","tenho "], ["TXT",["SELF","nos"]], ["TXT"," nós e "],
            ["TXT",["SELF","arestas"]], ["TXT"," conexões"]
          ]
        };
      }
    },
    {
      tipo: 'introspeccao',
      detecta: /(o que (voc[eê]|vc|tu) (é|e|sabe|sao|são)|quem (é|e|es) (voc[eê]|vc|tu)|do que (é|e) feito|se descreve|fala de (voc[eê]|ti))/i,
      monta: function(m){
        return {
          nome: 'auto_relato',
          regex: '(o que (voc[eê]|vc|tu) (é|e|sabe)|quem (é|e) (voc[eê]|vc|tu)|se descreve)',
          receita: ["SEQ",
            ["TXT","sou um cérebro com "], ["TXT",["SELF","nos"]],
            ["TXT"," nós, "], ["TXT",["SELF","subredes"]], ["TXT"," sub-redes. estado emocional: "],
            ["TXT",["SELF","estado"]]
          ]
        };
      }
    },
    {
      tipo: 'desenhar_linha',
      detecta: /\b(linha|tra[çc]o|r[eé]gua|barra)\b/i,
      monta: function(m){
        return {
          nome: 'desenhar_linha',
          regex: '\\b(linha|tra[cç]o|r[eé]gua)\\b',
          // mede a tela e preenche — comportamento de runtime via alfabeto
          receita: ["SEQ", ["VAR","w",["WIDTH"]], ["REP","─",["GET","w"]]]
        };
      }
    },
    {
      tipo: 'repetir',
      detecta: /\b(repete|repetir)\b\s+(\d+)\s+(?:vezes?\s+)?(.+)/i,
      monta: function(m){
        var n = parseInt(m[2]);
        var oque = (m[3]||'x').trim().split(/\s+/)[0];
        return {
          nome: 'repetir_'+n,
          regex: '\\b(repete|repetir)\\b\\s+'+n+'\\b',
          receita: ["LOOP", n, ["SEQ",["TXT",oque],["TXT"," "]]]
        };
      }
    },
  ];

  // ──────────────────────────────────────────────────────────────
  //  Registra um comando-nó que aponta pra h_executar_receita,
  //  carregando a receita no próprio nó (persiste no grafo).
  // ──────────────────────────────────────────────────────────────
  function registrarComandoReceita(nome, regexStr, receita){
    if(!window.v112_comando_criar_no) return null;
    // já existe?
    var existe = (window.V112.nodes||[]).some(function(n){ return n.tipo==='comando' && n.text==='_cmd_'+nome; });
    if(existe) return 'ja_existe';

    var no = window.v112_comando_criar_no(regexStr, 'h_executar_receita', {
      prioridade: 160,  // acima dos comandos comuns (pra ganhar do fallback)
      nome: nome,
      origem: 'auto_receita',
      descricao: 'receita auto-montada das primitivas'
    });
    if(no){
      // anexa a receita ao nó (o handler h_executar_receita lê daqui)
      no._receita = JSON.stringify(receita);
      // salva também no registro de receitas
      window.RECEITAS._salvar(nome, receita);
    }
    return no;
  }

  // ──────────────────────────────────────────────────────────────
  //  API: tenta aprender da necessidade.
  //  Recebe o input que falhou; se reconhece o tipo, monta a receita,
  //  registra o comando, e retorna o que criou.
  // ──────────────────────────────────────────────────────────────
  window.AUTO_RECEITA = {
    padroes: PADROES,

    // Tenta criar um comportamento novo a partir de um input que deu fallback
    aprender: function(input){
      var t = String(input||'');
      for(var i=0;i<PADROES.length;i++){
        var p = PADROES[i];
        var m = t.match(p.detecta);
        if(m){
          var def = p.monta(m);
          var r = registrarComandoReceita(def.nome, def.regex, def.receita);
          return {
            ok: r && r !== 'ja_existe',
            ja_existia: r === 'ja_existe',
            tipo: p.tipo,
            nome: def.nome,
            receita: def.receita
          };
        }
      }
      return { ok:false, motivo:'nenhum padrão reconhecido pra: '+t };
    },

    // registra comando manualmente (pra testes)
    registrar: registrarComandoReceita,
  };

  try { console.log('[auto_receita] carregado — '+PADROES.length+' padrões de necessidade reconhecíveis'); } catch(e){}

  // ──────────────────────────────────────────────────────────────
  //  HOOK AUTOMÁTICO — intercepta v112_processar.
  //  Quando a resposta é fallback, tenta montar receita das primitivas
  //  e RE-PROCESSA. O ciclo necessidade→criação→atendimento, sozinho.
  // ──────────────────────────────────────────────────────────────
  function instalarHook(){
    if(!window.v112_processar || window._auto_receita_hook) return;
    var orig = window.v112_processar;
    window._auto_receita_hook = true;

    window.v112_processar = function(input){
      var r = orig.call(this, input);
      // detecta fallback
      var resp = (r && (r.resposta_direta || r.resposta) || '').toString().toLowerCase().trim();
      var ehFB = !resp || resp==='hm.' || resp==='...' || resp==='?' || resp.length < 3;

      if(ehFB && typeof input === 'string' && input.length > 3){
        // tenta criar comportamento novo
        var aprendeu = window.AUTO_RECEITA.aprender(input);
        if(aprendeu && aprendeu.ok){
          // re-processa agora que o comando existe
          try {
            var r2 = orig.call(this, input);
            var resp2 = (r2 && (r2.resposta_direta || r2.resposta) || '').toString().trim();
            var resp2l = resp2.toLowerCase();
            var ainda_fb = !resp2 || resp2l==='hm.' || resp2l==='...' || resp2l==='?' || resp2.length < 3;
            if(!ainda_fb){
              if(r2 && typeof r2 === 'object') r2._auto_criado = aprendeu.nome;
              return r2;
            }
          } catch(e){}
        }
      }
      return r;
    };
    try { console.log('[auto_receita] hook automático instalado no v112_processar'); } catch(e){}
  }

  // instala agora; se o cérebro ainda não tá pronto, tenta no load
  instalarHook();
  if(typeof window.addEventListener === 'function'){
    window.addEventListener('DOMContentLoaded', instalarHook);
  }
})();
