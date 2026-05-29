#!/usr/bin/env node
/* patch_fusao.js — insere NEREAL_PATCH_FUSAO_QUASE_IDENTICOS_V1 no engine.
   Uso: node patch_fusao.js [--status|--dry-run|--apply|--rollback] arch_neural_v15_final.js
   Valida sintaxe (node --check) ANTES e DEPOIS; se quebrar, restaura backup.
   Bloco lido de fusao_quase_identicos.js (mesma pasta). */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SENT_INI = 'NEREAL_PATCH_FUSAO_QUASE_IDENTICOS_V1';
const SENT_FIM = 'FIM NEREAL_PATCH_FUSAO_QUASE_IDENTICOS_V1';
const args = process.argv.slice(2);
const mode = (args.find(a => a.startsWith('--')) || '--status').replace('--','');
const alvo = args.find(a => !a.startsWith('--')) || 'arch_neural_v15_final.js';
const blocoPath = path.join(__dirname, 'fusao_quase_identicos.js');

function check(f){ try{ execSync('node --check ' + JSON.stringify(f), {stdio:'pipe'}); return true; }catch(e){ return false; } }
function tem(s){ return s.indexOf(SENT_INI) !== -1; }
function ts(){ return new Date().toISOString().replace(/[-:T]/g,'').slice(0,14); }

if(!fs.existsSync(alvo)){ console.error('alvo nao existe: ' + alvo); process.exit(1); }
let src = fs.readFileSync(alvo, 'utf8');

if(mode === 'status'){
  console.log('alvo: ' + alvo);
  console.log('patch aplicado: ' + (tem(src) ? 'SIM' : 'nao'));
  console.log('sintaxe atual: ' + (check(alvo) ? 'ok' : 'QUEBRADA'));
  process.exit(0);
}
if(mode === 'rollback'){
  if(!tem(src)){ console.log('nada a reverter.'); process.exit(0); }
  const re = new RegExp('\\n?\\/\\* [\\u2550]+ ' + SENT_INI + '[\\s\\S]*?' + SENT_FIM + '[\\s\\S]*?\\*\\/\\n?');
  const novo = src.replace(re, '\n');
  if(novo === src || tem(novo)){ console.error('rollback: bloco nao localizado. Restaure um .bak manualmente.'); process.exit(1); }
  const bak = alvo + '.bak_vfusao_' + ts();
  fs.writeFileSync(bak, src); fs.writeFileSync(alvo, novo);
  if(!check(alvo)){ fs.writeFileSync(alvo, src); console.error('rollback quebrou sintaxe -> restaurado.'); process.exit(1); }
  console.log('rollback OK. backup: ' + bak);
  process.exit(0);
}
if(tem(src)){ console.log('JA aplicado.'); process.exit(0); }
if(!fs.existsSync(blocoPath)){ console.error('bloco nao encontrado: ' + blocoPath); process.exit(1); }
if(!check(alvo)){ console.error('ABORT: engine ja com sintaxe quebrada antes do patch.'); process.exit(1); }

const bloco = fs.readFileSync(blocoPath, 'utf8');
const novo = src.replace(/\s*$/, '') + '\n\n' + bloco + '\n';
if(mode === 'dry-run'){ console.log('[dry-run] inseriria ' + bloco.split('\n').length + ' linhas. Sentinela: ' + SENT_INI); process.exit(0); }

const bak = alvo + '.bak_vfusao_' + ts();
fs.writeFileSync(bak, src); fs.writeFileSync(alvo, novo);
if(!check(alvo)){ fs.writeFileSync(alvo, src); console.error('APPLY quebrou sintaxe -> RESTAURADO. backup: ' + bak); process.exit(1); }
console.log('APPLY OK. backup: ' + bak); console.log('sintaxe pos-patch: ok');
process.exit(0);
