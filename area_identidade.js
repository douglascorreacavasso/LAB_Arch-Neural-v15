/* ===========================================================================
   area_identidade.js  —  Area especializada do Nerael
   Entende a nuancia de NOME e ENSINO:
     - distingue "meu nome" (do usuario) de "seu nome" (do Nerael)
     - DIZ que nao sabe quando nao sabe (nao chuta)
     - reconhece quando esta sendo corrigido
   COLE NO FIM do arch_neural_v15_final.js
   No-comando: _handler_nome:'h_identidade_nome'
   =========================================================================== */
(function () {
  if (typeof window === "undefined") window = this;
  if (!window.__IDENT__) window.__IDENT__ = { user: null, self: null };

  function seedSelf() {
    // tenta puxar o nome do self_core, se o engine expoe o cerebro num global
    if (window.__IDENT__.self) return;
    try {
      var sc = (window.cerebro && window.cerebro.self_core) ||
               (window.REDE && window.REDE.self_core) ||
               window.self_core || null;
      if (sc && sc.nome && sc.nome.length) window.__IDENT__.self = String(sc.nome[0]);
    } catch (e) {}
  }

  function limpaNome(s) {
    return String(s || "").replace(/[^a-zà-ÿ0-9 ]/gi, "").trim().split(/\s+/)[0] || "";
  }

  function h_identidade_nome(m, input) {
    seedSelf();
    var t = String(input || (m && m.input) || (m && m[0]) || "").toLowerCase().trim();
    var I = window.__IDENT__;

    // 1) correcao (prioridade alta — ele errou e o usuario aponta)
    if (/\b(errado|ta errado|tá errado|n(a|ã)o (e|é) isso|n(a|ã)o foi isso|certo mas errado)\b/.test(t)) {
      return "entendi que errei. me corrige: e o TEU nome ou o MEU? e qual e o certo?";
    }
    // 2) usuario ensina o comportamento "se nao sabe, diga que nao sabe"
    if (/se (voce|vc|tu).{0,8}n(a|ã)o (sabe|souber).{0,25}(diga|dizer|fala|diz)/.test(t)) {
      return "combinado: quando eu nao souber um nome, eu digo que nao sei.";
    }
    // 3) ENSINA o nome DELE  ("seu nome e X" / "te chamo de X")
    var mSelf = t.match(/(?:seu nome (?:e|eh|é)|teu nome (?:e|eh|é)|(?:voce|vc) se chama|te chamo de)\s+([a-zà-ÿ0-9]+)/);
    if (mSelf) { I.self = limpaNome(mSelf[1]); return "ok, pode me chamar de " + I.self + "."; }
    // 4) ENSINA o nome DO USUARIO ("meu nome e X" / "me chamo X" / "eu sou o X")
    var mUser = t.match(/(?:meu nome (?:e|eh|é)|me chamo|eu sou (?:o |a )?|sou (?:o |a ))\s*([a-zà-ÿ0-9]+)/);
    if (mUser && /meu nome|me chamo|eu sou|sou /.test(t)) {
      var nome = limpaNome(mUser[1]);
      if (nome && nome.length > 1) { I.user = nome; return "anotei, teu nome e " + I.user + "."; }
    }
    // 5) PERGUNTA o nome do usuario
    if (/(qual.{0,8}(o )?meu nome|^meu nome\s*\??$|quem sou eu)/.test(t)) {
      return I.user ? ("teu nome e " + I.user + ".") : "eu nao sei qual e o teu nome — me diz?";
    }
    // 6) PERGUNTA o nome dele
    if (/(qual.{0,8}(o )?seu nome|^seu nome\s*\??$|quem (e|é|eh|es) (voce|vc)|como (voce|vc) se chama)/.test(t)) {
      return I.self ? ("meu nome e " + I.self + ".") : "ainda nao tenho nome — como quer me chamar?";
    }
    return null; // nao e sobre nome -> deixa o engine responder normal
  }

  if (typeof V112_HANDLERS !== "undefined") V112_HANDLERS["h_identidade_nome"] = h_identidade_nome;
  else { window.V112_HANDLERS = window.V112_HANDLERS || {}; window.V112_HANDLERS["h_identidade_nome"] = h_identidade_nome; }
  window.h_identidade_nome = h_identidade_nome;

  // HOOK: roda a identidade ANTES do v112_processar (garante o nome, vence a identidade embutida)
  try {
    if (typeof v112_processar === "function" && !v112_processar.__ident_hooked) {
      var _orig = v112_processar;
      v112_processar = function (input) {
        try {
          var r = h_identidade_nome(null, input);
          if (r !== null && r !== undefined) return { resposta: r, _area: "identidade" };
        } catch (e) {}
        return _orig.apply(this, arguments);
      };
      v112_processar.__ident_hooked = true;
      if (typeof window !== "undefined") window.v112_processar = v112_processar;
    }
  } catch (e) {}
})();
