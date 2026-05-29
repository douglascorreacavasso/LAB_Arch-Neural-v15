#!/usr/bin/env node
/* patch_render_guard.js — adiciona shared/render_guard.js DEPOIS do viz_renderer
   nos HTML. Uso (sem args = mexe em index.html e mobile.html):
     node patch_render_guard.js --status
     node patch_render_guard.js --dry-run
     node patch_render_guard.js --apply
     node patch_render_guard.js --rollback
   Ou passe arquivos: node patch_render_guard.js --apply index.html mobile.html
   Backup .bak_vguard_<ts> por arquivo. Idempotente (sentinela). */
'use strict';
const fs = require('fs');

const SENT = 'NEREAL_PATCH_RENDER_GUARD_V1';
const TAG = '<!-- ' + SENT + ' --><script src="shared/render_guard.js"></script><!-- FIM ' + SENT + ' -->';
const VIZ = /(<script[^>]*src="shared\/viz_renderer\.js"[^>]*>\s*<\/script>)/i;

const args = process.argv.slice(2);
const mode = (args.find(a => a.startsWith('--')) || '--status').replace('--','');
let alvos = args.filter(a => !a.startsWith('--'));
if(alvos.length === 0) alvos = ['index.html', 'mobile.html'];

function ts(){ return new Date().toISOString().replace(/[-:T]/g,'').slice(0,14); }

function umArquivo(alvo){
  if(!fs.existsSync(alvo)){ console.log('  ' + alvo + ': nao existe (pulado)'); return; }
  let src = fs.readFileSync(alvo, 'utf8');
  const aplicado = src.indexOf(SENT) !== -1;

  if(mode === 'status'){ console.log('  ' + alvo + ': ' + (aplicado ? 'APLICADO' : 'nao aplicado')); return; }

  if(mode === 'rollback'){
    if(!aplicado){ console.log('  ' + alvo + ': nada a reverter'); return; }
    const re = new RegExp('\\n?\\s*<!-- ' + SENT + ' -->.*?<!-- FIM ' + SENT + ' -->', 's');
    const novo = src.replace(re, '');
    if(novo === src){ console.log('  ' + alvo + ': bloco nao localizado (revertа manual)'); return; }
    fs.writeFileSync(alvo + '.bak_vguard_' + ts(), src);
    fs.writeFileSync(alvo, novo);
    console.log('  ' + alvo + ': revertido');
    return;
  }

  // apply / dry-run
  if(aplicado){ console.log('  ' + alvo + ': JA aplicado'); return; }
  if(!VIZ.test(src)){ console.log('  ' + alvo + ': NAO achei o <script> do viz_renderer — abortado neste arquivo'); return; }

  const novo = src.replace(VIZ, '$1\n  ' + TAG);
  if(mode === 'dry-run'){ console.log('  ' + alvo + ': inseriria o guard logo apos o viz_renderer'); return; }

  fs.writeFileSync(alvo + '.bak_vguard_' + ts(), src);
  fs.writeFileSync(alvo, novo);
  const ok = fs.readFileSync(alvo,'utf8').indexOf(SENT) !== -1;
  console.log('  ' + alvo + ': ' + (ok ? 'APLICADO (backup salvo)' : 'FALHOU'));
}

console.log('[patch_render_guard --' + mode + ']');
alvos.forEach(umArquivo);
