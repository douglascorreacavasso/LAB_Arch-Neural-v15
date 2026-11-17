// treinar_cerebro_ensinado.js — gera o "cérebro já ensinado" do LAB, fora do navegador (Node).
//
// Ferramenta de desenvolvimento (Claude, 16/11/2026, a pedido do autor). Quem aprende é o próprio motor do LAB
// (v112_processar), frase por frase, igual ao botão ENSINAR; esta ferramenta só entrega as frases e grava o resultado.
//
// Parte do cérebro completo (cerebro_V15.json, já com os 7.000 do ensino progressivo) e ensina o NÚCLEO de cada base:
//   - Livro de Entidades: definições e regras (frases curtas, sem os exemplos com nomes inventados);
//   - Regras do português: as regras (se a fonte existir);
//   - Dicionário: a 1ª acepção das palavras que o cérebro já usa (as mais frequentes);
//   - Wikipédia: a 1ª frase dos artigos cujo título é uma palavra que o cérebro já usa.
// O resto de cada base (123 mil verbetes, 1 milhão de artigos) fica no conhecimento compactado e é consultado
// na conversa — no navegador, ensinar tudo frase por frase levaria dias e o arquivo não caberia no celular.
//
// Uso: node treinar_cerebro_ensinado.js [--max-dic 300] [--max-wiki 250] [--saida ARQ.json]
// Retoma: grava um ponto de parada a cada 200 frases (ARQ.parcial.json + ARQ.pos.json).
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { carregarMotor, RAIZ } = require('./motor_node.js');

const FONTES = 'E:\\NERAEL_BASES_DADOS\\lab_v15';
function opt(n, p){ const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : p; }
const MAX_DIC = parseInt(opt('--max-dic', '300'), 10);
const MAX_WIKI = parseInt(opt('--max-wiki', '250'), 10);
const SAIDA = opt('--saida', path.join(FONTES, 'cerebro_V15_ensinado.json'));
const POS = SAIDA.replace(/\.json$/, '.pos.json');
const PARCIAL = SAIDA.replace(/\.json$/, '.parcial.json');

function lerTsvGz(arq){
  if(!fs.existsSync(arq)) return [];
  // os .tsv.gz e .txt gravados pelo Python no Windows têm fim de linha \r\n
  return zlib.gunzipSync(fs.readFileSync(arq)).toString('utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t'));
}
function chave(t){
  return String(t).replace(/\s*\([^)]*\)\s*$/, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function primeiraFrase(t, max){
  const m = String(t).match(/^(.{8,}?[.;])(\s|$)/);
  let f = m ? m[1] : String(t);
  if(f.length > max) f = f.slice(0, max).replace(/\s+\S*$/, '') + '.';
  return f;
}

function montarFrases(cerebroBase){
  const lotes = [];
  // 1. Livro de Entidades: definições + regras (curtas)
  const ent = lerTsvGz(path.join(FONTES, 'entidades.tsv.gz'));
  const entFr = [];
  for(const p of ent){
    for(const campo of [p[2], p[3]]){
      for(const f of String(campo || '').split(/(?<=\.)\s+/)){
        if(f.length >= 15 && f.length <= 160 && !/[A-Z]{3}-\d{3}|\[m\d/.test(f)) entFr.push(f);
      }
    }
  }
  lotes.push(['entidades', [...new Set(entFr)]]);
  // 2. Regras do português (se existir a fonte)
  // (livro "Português" da Wikilivros, CC BY-SA — ferramentas/extrair_gramatica.py)
  const arqGram = path.join(FONTES, 'gramatica_frases.txt');
  const gramFr = fs.existsSync(arqGram) ? fs.readFileSync(arqGram, 'utf8').split(/\r?\n/)
    .filter(f => f.length >= 20 && f.length <= 170 && /\.$/.test(f) && !/^(Exemplo|Ex\.|Obs)|→|"|“/.test(f)) : [];
  lotes.push(['gramatica', gramFr.slice(0, parseInt(opt('--max-gram', '350'), 10))]);
  // palavras que o cérebro já usa, da mais usada para a menos usada
  const freq = cerebroBase.freq_global || {};
  const palavras = Object.keys(freq).filter(w => /^[a-zà-ÿç]{3,}$/.test(w)).sort((a, b) => freq[b] - freq[a]);
  // 3. Dicionário: 1ª acepção
  const dic = new Map();
  for(const p of lerTsvGz(path.join(FONTES, 'dicionario.tsv.gz'))) if(!dic.has(chave(p[0]))) dic.set(chave(p[0]), p);
  const dicFr = [];
  const FUNCAO = new Set(('que para com uma uns umas por pelo pela pelos pelas sem sob sobre entre mais menos muito muita ' +
    'isso isto aquilo esse essa este esta aquele aquela meu minha seu sua teu tua nosso nossa dele dela eles elas ' +
    'como quando onde porque pois mas ainda tambem também então entao depois antes sempre nunca aqui ali qual quem ' +
    'tem ter ser estar foi era são sao está esta vai vou faz fazer pode posso tudo nada algo cada outro outra mesmo').split(' '));
  for(const w of palavras){
    if(FUNCAO.has(w) || w.length < 4) continue;          // palavras de ligação não viram definição
    const p = dic.get(chave(w)); if(!p) continue;
    const d = primeiraFrase(p[2].split(':')[0].trim() + '.', 120).replace(/^\*\s*/, '').replace(/\.\.$/, '.');
    if(d.length < 6 || /^(O mesmo que|Pl\.|Fem\.|Ant\.|Prov\.)/.test(d)) continue;
    dicFr.push(w + ' é ' + d.charAt(0).toLowerCase() + d.slice(1));
    if(dicFr.length >= MAX_DIC) break;
  }
  lotes.push(['dicionario', dicFr]);
  // 4. Wikipédia: 1ª frase dos artigos com título = palavra que o cérebro usa
  const wiki = new Map();
  const pastaW = path.join(FONTES, 'wiki');
  if(fs.existsSync(pastaW)){
    const alvo = new Set(palavras.map(chave));
    for(const a of fs.readdirSync(pastaW).filter(f => /^parte_\d+\.tsv\.gz$/.test(f)).sort()){
      for(const p of lerTsvGz(path.join(pastaW, a))){
        const k = chave(p[0]);
        // título tem de ser a própria palavra (sem ".com", "Nao (robô)" etc.)
        if(alvo.has(k) && !wiki.has(k) && !/\(/.test(p[0]) && /^[A-Za-zÀ-ÿ]/.test(p[0]) && p[0].toLowerCase() === k.replace(/ /g, ' ') ||
           alvo.has(k) && !wiki.has(k) && !/\(/.test(p[0]) && /^[A-ZÀ-Ý][a-zà-ÿ]+$/.test(p[0])) wiki.set(k, p[1]);
      }
    }
  }
  const wikiFr = [];
  for(const w of palavras){
    if(FUNCAO.has(w) || w.length < 4) continue;
    const t = wiki.get(chave(w)); if(!t) continue;
    wikiFr.push(primeiraFrase(t, 170));
    if(wikiFr.length >= MAX_WIKI) break;
  }
  lotes.push(['wikipedia', wikiFr]);
  // frase que começa com "você/eu/meu/seu/tu..." mexe na identidade do cérebro (self-core: "você é X" vira "eu sou X")
  const IDENT = /^\s*(voc[eê]|vc|eu|meu|minha|seu|sua|teu|tua|tu|n[oó]s)\b/i;
  return lotes.map(([n, f]) => [n, f.filter(x => !IDENT.test(x))]);
}

function main(){
  const t0 = Date.now();
  let pos = fs.existsSync(POS) ? JSON.parse(fs.readFileSync(POS, 'utf8')) : null;
  const base = JSON.parse(fs.readFileSync(pos && fs.existsSync(PARCIAL) ? PARCIAL : path.join(RAIZ, 'cerebro_V15.json'), 'utf8'));
  const lotes = pos ? pos.lotes : montarFrases(base);
  if(!pos) pos = { lotes, feitas: 0 };
  carregarMotor({ cerebro: base });
  const todas = lotes.flatMap(([nome, frases]) => frases.map(f => [nome, f]));
  const logOrig = console.log;
  logOrig(`frases: ${lotes.map(([n, f]) => n + ' ' + f.length).join(', ')} — total ${todas.length}; já feitas ${pos.feitas}`);
  let ultimo = Date.now();
  for(let i = pos.feitas; i < todas.length; i++){
    console.log = function(){};
    try { globalThis.v112_processar(todas[i][1]); } catch(e){ /* frase com erro não para o lote */ }
    console.log = logOrig;
    pos.feitas = i + 1;
    if(pos.feitas % 200 === 0 || pos.feitas === todas.length){
      fs.writeFileSync(PARCIAL + '.tmp', JSON.stringify(globalThis.v112_exportar()));
      fs.renameSync(PARCIAL + '.tmp', PARCIAL);
      fs.writeFileSync(POS, JSON.stringify(pos));
      logOrig(`${pos.feitas}/${todas.length} (${todas[i][0]}) — ${globalThis.V112.nodes.length} nós, ${globalThis.V112.edges.length} arestas, ${((Date.now() - ultimo) / 1000).toFixed(0)} s`);
      ultimo = Date.now();
    }
  }
  const final = globalThis.v112_exportar();
  // identidade limpa: o cérebro ensinado não chega sabendo o nome de nenhum visitante
  if(final.self_core) final.self_core.user = [];
  fs.writeFileSync(SAIDA + '.tmp', JSON.stringify(final));
  fs.renameSync(SAIDA + '.tmp', SAIDA);
  fs.writeFileSync(SAIDA.replace(/\.json$/, '.resumo.json'), JSON.stringify({
    lotes: lotes.map(([n, f]) => ({ base: n, frases: f.length })), nos: final.nodes.length, arestas: final.edges.length,
    segundos: Math.round((Date.now() - t0) / 1000), gerado: new Date().toISOString() }, null, 1));
  try { fs.unlinkSync(POS); fs.unlinkSync(PARCIAL); } catch(e){}
  logOrig(`TERMINOU: ${final.nodes.length} nós, ${final.edges.length} arestas em ${SAIDA}`);
}

// Pacotes do botão ENSINAR (modo "desde o básico"): as mesmas frases-núcleo, em treinos/treino_<base>.json
const ARQ_PACOTE = { entidades: 'treino_entidades.json', gramatica: 'treino_gramatica.json',
                     dicionario: 'treino_dicionario.json', wikipedia: 'treino_wikipedia.json' };
const DESC_PACOTE = {
  entidades: 'Definições e regras do Livro de Entidades (sem os exemplos com nomes inventados).',
  gramatica: 'Regras da língua portuguesa.',
  dicionario: '1ª acepção, no Novo Dicionário de Cândido de Figueiredo (1913, domínio público), das palavras que o cérebro mais usa.',
  wikipedia: '1ª frase dos artigos da Wikipédia em português cujo título é uma palavra que o cérebro usa.'
};
function exportarPacotes(lotes){
  for(const [nome, frases] of lotes){
    const arq = path.join(RAIZ, 'treinos', ARQ_PACOTE[nome]);
    if(!frases.length){ console.log('pacote ' + nome + ': sem frases (fonte ausente), não gravado'); continue; }
    fs.writeFileSync(arq, JSON.stringify({ nome: 'Pacote ' + nome, total: frases.length, descricao: DESC_PACOTE[nome],
      gerado_por: 'ferramentas/treinar_cerebro_ensinado.js', frases }, null, 1));
    console.log('pacote ' + nome + ': ' + frases.length + ' frases em ' + arq);
  }
}

const _base = () => JSON.parse(fs.readFileSync(path.join(RAIZ, 'cerebro_V15.json'), 'utf8'));
if(process.argv.includes('--contar')){ for(const [n, f] of montarFrases(_base())) console.log(n, f.length, '|', f.slice(0, 3).join(' | ')); }
else if(process.argv.includes('--exportar-pacotes')){ exportarPacotes(montarFrases(_base())); }
else { exportarPacotes(montarFrases(_base())); main(); }
