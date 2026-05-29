#!/usr/bin/env node
/* patch_motor_cortex.js — insere o NEREAL_PATCH_MOTOR_CORTEX_V1 no engine.
   Uso:
     node patch_motor_cortex.js --status   arch_neural_v15_final.js
     node patch_motor_cortex.js --dry-run  arch_neural_v15_final.js
     node patch_motor_cortex.js --apply    arch_neural_v15_final.js
     node patch_motor_cortex.js --rollback arch_neural_v15_final.js
   All-or-nothing: valida sintaxe (node --check) ANTES e DEPOIS; se quebrar, restaura backup.
   Bloco lido de motor_cortex_v1.js (mesma pasta do patch). */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SENT_INI = 'NEREAL_PATCH_MOTOR_CORTEX_V1';
const SENT_FIM = 'FIM NEREAL_PATCH_MOTOR_CORTEX_V1';
const args = process.argv.slice(2);
const mode = (args.find(a => a.startsWith('--')) || '--status').replace('--','');
const alvo = args.find(a => !a.startsWith('--')) || 'arch_neural_v15_final.js';
const blocoPath = path.join(__dirname, 'motor_cortex_v1.js');

function check(file){ try { execSync('node --check ' + JSON.stringify(file), {stdio:'pipe'}); return true; } catch(e){ return false; } }
function tem(src){ return src.indexOf(SENT_INI) !== -1; }
function ts(){ const d=new Date(); return d.toISOString().replace(/[-:T]/g,'').slice(0,14); }

if(!fs.existsSync(alvo)){ console.error('alvo nao existe: ' + alvo); process.exit(1); }
let src = fs.readFileSync(alvo, 'utf8');

if(mode === 'status'){
  console.log('alvo: ' + alvo);
  console.log('patch aplicado: ' + (tem(src) ? 'SIM' : 'nao'));
  console.log('sintaxe atual: ' + (check(alvo) ? 'ok' : 'QUEBRADA'));
  process.exit(0);
}

if(mode === 'rollback'){
  if(!tem(src)){ console.log('nada a reverter (patch nao esta aplicado).'); process.exit(0); }
  const re = new RegExp('\\n?\\/\\* [\\u2550]+ ' + SENT_INI + '[\\s\\S]*?' + SENT_FIM + ' [\\u2550]+\\*\\/\\n?');
  const novo = src.replace(re, '\n');
  if(novo === src || tem(novo)){ console.error('rollback: nao consegui localizar o bloco limpo. Restaure um .bak manualmente.'); process.exit(1); }
  const bak = alvo + '.bak_vmotor_' + ts();
  fs.writeFileSync(bak, src);
  fs.writeFileSync(alvo, novo);
  if(!check(alvo)){ fs.writeFileSync(alvo, src); console.error('rollback quebrou sintaxe -> restaurado. Abortado.'); process.exit(1); }
  console.log('rollback OK. backup do estado anterior: ' + bak);
  process.exit(0);
}

// apply / dry-run
if(tem(src)){ console.log('JA aplicado (sentinela presente). Nada a fazer.'); process.exit(0); }
if(!fs.existsSync(blocoPath)){ console.error('bloco nao encontrado: ' + blocoPath); process.exit(1); }
if(!check(alvo)){ console.error('ABORT: o engine ja esta com sintaxe quebrada ANTES do patch.'); process.exit(1); }

const bloco = fs.readFileSync(blocoPath, 'utf8');
const novo = src.replace(/\s*$/, '') + '\n\n' + bloco + '\n';

if(mode === 'dry-run'){
  console.log('[dry-run] inseriria ' + bloco.split('\n').length + ' linhas no fim de ' + alvo);
  console.log('[dry-run] sentinela: ' + SENT_INI);
  console.log('[dry-run] nada foi escrito.');
  process.exit(0);
}

// apply real
const bak = alvo + '.bak_vmotor_' + ts();
fs.writeFileSync(bak, src);
fs.writeFileSync(alvo, novo);
if(!check(alvo)){
  fs.writeFileSync(alvo, src);           // restaura
  console.error('APPLY quebrou sintaxe -> RESTAURADO. backup intacto: ' + bak);
  process.exit(1);
}
console.log('APPLY OK. backup: ' + bak);
console.log('sintaxe pos-patch: ok');
process.exit(0);
