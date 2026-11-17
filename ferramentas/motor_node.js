// motor_node.js — carrega o motor do LAB (engine/01..14) dentro do Node, sem navegador.
// Ferramenta de desenvolvimento (Claude, 16/11/2026, a pedido do autor). Usada para treinar o
// "cérebro já ensinado" fora do navegador e para testes automáticos. Não muda nada do motor.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.resolve(__dirname, '..');

function carregarMotor(opcoes){
  opcoes = opcoes || {};
  // o motor foi escrito para o navegador: window = o próprio global
  globalThis.window = globalThis;
  if(!globalThis.localStorage){
    const mem = {};
    globalThis.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); },
                                removeItem: k => { delete mem[k]; }, clear: () => { for(const k in mem) delete mem[k]; },
                                get length(){ return Object.keys(mem).length; } };
  }
  if(!globalThis.navigator) globalThis.navigator = { userAgent: 'node', hardwareConcurrency: 4 };
  const silencio = opcoes.silencio !== false;
  const logOrig = console.log;
  if(silencio) console.log = function(){};
  try {
    const arqs = fs.readdirSync(path.join(RAIZ, 'engine')).filter(f => /^\d\d_.*\.js$/.test(f)).sort();
    for(const a of arqs){
      vm.runInThisContext(fs.readFileSync(path.join(RAIZ, 'engine', a), 'utf8'), { filename: a });
    }
    const r = globalThis.arch_neural_init(opcoes.cerebro || undefined);
    if(typeof globalThis.v112_prog_init === 'function'){ try { globalThis.v112_prog_init(); } catch(e){} }
    return r;
  } finally {
    console.log = logOrig;
  }
}

module.exports = { carregarMotor, RAIZ };
