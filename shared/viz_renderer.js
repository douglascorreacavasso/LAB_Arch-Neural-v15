/* ════════════════════════════════════════════════════════════════
   viz_renderer.js — renderizador 3D compartilhado mobile + desktop

   Expõe:
     window.VIZ.ESTILOS         → lista de 13 estilos prontos
     window.VIZ.FORMAS_NUCLEO   → 21 formas
     window.VIZ.TIPOS_EDGE      → 22 tipos de conexão
     window.VIZ.desenhar(opts)  → desenha 1 frame
     window.VIZ.aplicarPaletaCerebro(cfg, paleta) → muda cores

   Padrões FIXOS aplicados a todo estilo:
     glow=0, edgeAlpha=70, size=70, zoom=80
     velocidade=3 (lento) ou 10 (dinâmico)
     scanlines=false, grid=false

   Pulse direction: sempre em direção à COROA (nó com maior Y)
   ════════════════════════════════════════════════════════════════ */

(function(){
  'use strict';
  if(window.VIZ) return;

  // ─── HELPERS DE COR ──────────────────────────────────────────
  function hexToRgb(hex){
    const m = hex.replace('#','');
    return [parseInt(m.slice(0,2),16), parseInt(m.slice(2,4),16), parseInt(m.slice(4,6),16)];
  }
  function rgba(hex, a){
    const [r,g,b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ─── PROJEÇÃO 3D ─────────────────────────────────────────────
  function project(pos, anguloY, anguloX){
    let x = pos[0], y = pos[1], z = pos[2];
    if(anguloY){
      const c = Math.cos(anguloY), s = Math.sin(anguloY);
      const nx = x*c - z*s;
      const nz = x*s + z*c;
      x = nx; z = nz;
    }
    if(anguloX){
      const c = Math.cos(anguloX), s = Math.sin(anguloX);
      const ny = y*c - z*s;
      const nz = y*s + z*c;
      y = ny; z = nz;
    }
    const scaleZ = 1 / (1 + z * 0.001);
    return [x, y, z, scaleZ];
  }

  // ─── COR POR CAMADA ──────────────────────────────────────────
  // Aplica paleta de 3 cores (primary/secondary/accent) por camada
  function corPorCamada(n, cores){
    const principais = ['self_core', 'subrede', 'hipocampo', 'amigdala'];
    const sec = ['cortex', 'sensorial', 'talamo', 'subrede_sat'];
    const ac = ['motora', 'broca', 'nucleos_acao', 'gaba', 'hemisferio'];
    if(principais.indexOf(n.camada) !== -1) return cores.primary;
    if(sec.indexOf(n.camada) !== -1) return cores.secondary;
    if(ac.indexOf(n.camada) !== -1) return cores.accent;
    return cores.secondary;
  }

  // Modo "original" (criança) usa cores reais por camada
  function corPorCamadaOriginal(n){
    if(n.camada === 'self_core') return '#fbbf24';
    if(n.camada === 'sensorial') return '#5eead4';
    if(n.camada === 'talamo')    return '#06b6d4';
    if(n.camada === 'hipocampo') return '#ec4899';
    if(n.camada === 'cortex')    return '#a78bfa';
    if(n.camada === 'amigdala')  return '#ef4444';
    if(n.camada === 'gaba')      return '#fbbf24';
    if(n.camada === 'nucleos_acao') return '#84cc16';
    if(n.camada === 'motora')    return '#fb923c';
    if(n.camada === 'broca')     return '#f97316';
    if(n.camada === 'gramatica') return '#22c55e';
    if(n.camada === 'hemisferio') return '#f59e0b';
    if(n.camada === 'subrede' || n.camada === 'subrede_sat'){
      const txt = n.text || '';
      if(/B_(planejamento|objetivo|prioridade|controle_exec)/.test(txt)) return '#fcd34d';
      if(/B_(identidade|simulacao|autobiografia)/.test(txt)) return '#5eead4';
      if(/B_atencao/.test(txt)) return '#fafafa';
      return '#a78bfa';
    }
    return '#7d8b96';
  }

  // ─── PALETAS DO CÉREBRO (substituem as 3 cores) ──────────────
  const PALETAS_CEREBRO = {
    padrao:    { primary: '#5eead4', secondary: '#a78bfa', accent: '#fbbf24' },
    arcoiris:  { primary: '#ec4899', secondary: '#06b6d4', accent: '#fbbf24' },
    frio:      { primary: '#5eead4', secondary: '#06b6d4', accent: '#67e8f9' },
    quente:    { primary: '#fb923c', secondary: '#ef4444', accent: '#fbbf24' },
    neon:      { primary: '#ec4899', secondary: '#a78bfa', accent: '#5eead4' },
    terra:     { primary: '#a3e635', secondary: '#84cc16', accent: '#ca8a04' },
    pastel:    { primary: '#c4b5fd', secondary: '#67e8f9', accent: '#fcd34d' },
    mono_azul: { primary: '#06b6d4', secondary: '#5eead4', accent: '#67e8f9' },
    mono_verde:{ primary: '#22c55e', secondary: '#84cc16', accent: '#a3e635' },
    mono_roxo: { primary: '#a78bfa', secondary: '#c4b5fd', accent: '#ec4899' }
  };

  function aplicarPaletaCerebro(cfg, paletaNome){
    const p = PALETAS_CEREBRO[paletaNome] || PALETAS_CEREBRO.padrao;
    cfg.cores = Object.assign({}, p);
    return cfg;
  }

  // ─── ESTILOS PRONTOS (13 + padrões fixos) ────────────────────
  // size=70, glow=0, edgeAlpha=70, zoom=80 em todos
  function E(nome, desc, nucleo, edge, cores, speed, particulas){
    return {
      nome: nome, desc: desc,
      nucleo: nucleo, edge: edge,
      cores: cores,
      size: 70, glow: 0, edgeAlpha: 70, zoom: 80,
      speed: speed || 10,
      particulas: !!particulas,
      scanlines: false, grid: false,
      rotacao: true
    };
  }

  const ESTILOS = [
    E('Padrão',
      'limpo, leve, mobile atual',
      'circle', 'line',
      { primary: '#5eead4', secondary: '#a78bfa', accent: '#5eead4' },
      3, false),

    E('Original',
      'cores por camada, pulse, criança',
      'circle', 'line_grad',
      { primary: '#fbbf24', secondary: '#a78bfa', accent: '#fb923c' },
      10, false),

    E('Cristal',
      'hexágonos perfeitos angulares + linhas magnéticas curvadas',
      'hex', 'magnetic_lines',
      { primary: '#e0e7ff', secondary: '#c4b5fd', accent: '#67e8f9' },
      3, false),

    E('Glifo',
      'glifos rúnicos + circuitos em L',
      'glyph', 'circuit',
      { primary: '#fbbf24', secondary: '#ef4444', accent: '#22c55e' },
      3, false),

    E('Cosmos Atômico',
      'átomos com órbitas elípticas + partículas viajando',
      'atom', 'particles',
      { primary: '#67e8f9', secondary: '#a78bfa', accent: '#fbbf24' },
      10, true),

    E('Sabre Laizer',
      'núcleo+anel + laser reto brilhante',
      'halo', 'laser',
      { primary: '#5eead4', secondary: '#a78bfa', accent: '#ffffff' },
      10, false),

    E('Bio-Celular',
      'células com membrana + fios trançados',
      'cell', 'rope',
      { primary: '#22c55e', secondary: '#5eead4', accent: '#fbbf24' },
      3, false),

    E('X',
      'pétalas + linhas vibrando energia',
      'petal', 'energy',
      { primary: '#fb923c', secondary: '#ef4444', accent: '#fbbf24' },
      10, true),

    E('Estrelas Neurais',
      'estrelas 5 pontas + pulso disparado (em direção à coroa)',
      'star', 'pulse',
      { primary: '#fbbf24', secondary: '#fb923c', accent: '#ffffff' },
      10, false),

    E('+',
      'cruzes + fumaça paralela',
      'cross', 'smoke',
      { primary: '#22c55e', secondary: '#15803d', accent: '#a3e635' },
      3, true),

    E('Gema Holográfica',
      'estrelas 8 pontas + pontilhada animada',
      'star8', 'dotted',
      { primary: '#5eead4', secondary: '#a78bfa', accent: '#67e8f9' },
      10, true),

    E('Cyberpunk Neon',
      'quadrados nítidos + dash longo animado',
      'square', 'dash',
      { primary: '#ec4899', secondary: '#06b6d4', accent: '#fbbf24' },
      10, false),

    E('Triângulo Trino',
      'triângulos + linha gradiente',
      'triangle', 'line_grad',
      { primary: '#ec4899', secondary: '#06b6d4', accent: '#fbbf24' },
      3, false),
  ];

  // ─── FORMAS DE NÚCLEO (21) ───────────────────────────────────
  const FORMAS_NUCLEO = [
    'circle','hex','triangle','star','star8','diamond','square','ring','halo',
    'plasma_ball','drop','cross','petal','gem','atom','glyph','cell','orb',
    'toroidal','dual_star','vortex'
  ];

  function desenharNucleo(ctx, x, y, size, cor, forma, scaleZ, cfg, frame){
    ctx.fillStyle = cor;
    ctx.strokeStyle = cor;
    if(cfg.glow > 0){
      ctx.shadowColor = cor;
      ctx.shadowBlur = cfg.glow;
    }
    ctx.globalAlpha = Math.min(0.95, 0.5 + scaleZ * 0.5);

    switch(forma){
      case 'circle':
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fill();
        break;
      case 'hex':      polygon(ctx, x, y, size*1.1, 6, 0, true); break;
      case 'triangle': polygon(ctx, x, y, size*1.2, 3, 0, true); break;
      case 'square':   polygon(ctx, x, y, size, 4, Math.PI/4, true); break;
      case 'diamond':  polygon(ctx, x, y, size*1.15, 4, 0, true); break;
      case 'star':     starShape(ctx, x, y, size*1.4, size*0.6, 5, -Math.PI/2, true); break;
      case 'star8':    starShape(ctx, x, y, size*1.3, size*0.7, 8, 0, true); break;
      case 'ring':
        ctx.lineWidth = Math.max(1.5, size*0.4);
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.stroke();
        break;
      case 'halo':
        ctx.beginPath(); ctx.arc(x, y, size*0.6, 0, Math.PI*2); ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.globalAlpha *= 0.6;
        ctx.beginPath(); ctx.arc(x, y, size*1.4, 0, Math.PI*2); ctx.stroke();
        break;
      case 'plasma_ball': {
        const pg = ctx.createRadialGradient(x, y, 0, x, y, size*1.6);
        pg.addColorStop(0, '#ffffff');
        pg.addColorStop(0.2, cor);
        pg.addColorStop(0.7, rgba(cor, 0.3));
        pg.addColorStop(1, rgba(cor, 0));
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(x, y, size*1.6, 0, Math.PI*2); ctx.fill();
        // filamentos
        ctx.strokeStyle = rgba(cfg.cores.secondary, 0.7);
        ctx.lineWidth = 0.6;
        for(let k = 0; k < 6; k++){
          const ang = k * Math.PI/3 + frame*0.01;
          ctx.beginPath();
          ctx.moveTo(x, y);
          for(let s = 1; s <= 3; s++){
            const r = size * s * 0.4;
            const jit = Math.sin(frame*0.05 + k*1.3 + s) * size*0.25;
            ctx.lineTo(x + Math.cos(ang + jit*0.1) * r, y + Math.sin(ang + jit*0.1) * r);
          }
          ctx.stroke();
        }
        break;
      }
      case 'drop':
        ctx.beginPath();
        ctx.moveTo(x, y - size*1.6);
        ctx.bezierCurveTo(x + size*1.1, y - size*0.6, x + size, y + size, x, y + size);
        ctx.bezierCurveTo(x - size, y + size, x - size*1.1, y - size*0.6, x, y - size*1.6);
        ctx.fill();
        break;
      case 'cross': {
        const t = size*0.35;
        ctx.fillRect(x-size, y-t, size*2, t*2);
        ctx.fillRect(x-t, y-size, t*2, size*2);
        break;
      }
      case 'petal':
        for(let i = 0; i < 4; i++){
          const ang = i * Math.PI/2;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(ang)*size*0.5, y + Math.sin(ang)*size*0.5,
                      size*0.8, size*0.4, ang, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.beginPath(); ctx.arc(x, y, size*0.35, 0, Math.PI*2); ctx.fill();
        break;
      case 'gem':
        ctx.beginPath();
        ctx.moveTo(x, y - size*1.4);
        ctx.lineTo(x + size, y - size*0.4);
        ctx.lineTo(x + size*0.7, y + size*1.2);
        ctx.lineTo(x - size*0.7, y + size*1.2);
        ctx.lineTo(x - size, y - size*0.4);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha *= 0.7;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        break;
      case 'atom':
        ctx.beginPath(); ctx.arc(x, y, size*0.5, 0, Math.PI*2); ctx.fill();
        ctx.lineWidth = 0.8;
        ctx.globalAlpha *= 0.55;
        for(let i = 0; i < 3; i++){
          const rot = i * Math.PI/3 + frame*0.01;
          ctx.beginPath();
          ctx.ellipse(x, y, size*1.7, size*0.55, rot, 0, Math.PI*2);
          ctx.stroke();
        }
        break;
      case 'glyph':
        ctx.lineWidth = Math.max(1.4, size*0.3);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - size, y - size*0.3); ctx.lineTo(x + size*0.5, y - size*0.3);
        ctx.moveTo(x - size*0.5, y + size*0.3); ctx.lineTo(x + size, y + size*0.3);
        ctx.moveTo(x - size*0.2, y - size); ctx.lineTo(x + size*0.2, y + size);
        ctx.stroke();
        break;
      case 'cell':
        ctx.globalAlpha *= 0.35;
        ctx.beginPath(); ctx.arc(x, y, size*1.4, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha *= 2.5;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(x, y, size*1.4, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, size*0.55, 0, Math.PI*2); ctx.fill();
        break;
      case 'orb':
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fill();
        const og = ctx.createRadialGradient(x - size*0.3, y - size*0.3, 0, x, y, size);
        og.addColorStop(0, 'rgba(255,255,255,0.55)');
        og.addColorStop(0.4, 'rgba(255,255,255,0)');
        ctx.fillStyle = og;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fill();
        break;
      case 'toroidal':
        ctx.strokeStyle = cor;
        ctx.lineWidth = Math.max(1, size*0.18);
        ctx.beginPath();
        ctx.ellipse(x, y, size*1.5, size*0.55, 0, 0, Math.PI*2);
        ctx.stroke();
        const tg = ctx.createRadialGradient(x, y, 0, x, y, size*0.7);
        tg.addColorStop(0, '#ffffff');
        tg.addColorStop(0.5, cor);
        tg.addColorStop(1, rgba(cor, 0));
        ctx.fillStyle = tg;
        ctx.beginPath(); ctx.arc(x, y, size*0.7, 0, Math.PI*2); ctx.fill();
        break;
      case 'dual_star': {
        const dx = size*0.7;
        const gA = ctx.createRadialGradient(x-dx, y, 0, x-dx, y, size);
        gA.addColorStop(0, '#ffffff');
        gA.addColorStop(0.4, cor);
        gA.addColorStop(1, rgba(cor, 0));
        ctx.fillStyle = gA;
        ctx.beginPath(); ctx.arc(x-dx, y, size, 0, Math.PI*2); ctx.fill();
        const gB = ctx.createRadialGradient(x+dx, y, 0, x+dx, y, size*0.9);
        gB.addColorStop(0, '#ffffff');
        gB.addColorStop(0.4, cfg.cores.secondary);
        gB.addColorStop(1, rgba(cfg.cores.secondary, 0));
        ctx.fillStyle = gB;
        ctx.beginPath(); ctx.arc(x+dx, y, size*0.9, 0, Math.PI*2); ctx.fill();
        break;
      }
      case 'vortex':
        ctx.strokeStyle = cor;
        ctx.lineWidth = Math.max(0.8, size*0.15);
        ctx.lineCap = 'round';
        ctx.beginPath();
        const turns = 2.5, steps = 30;
        for(let s = 0; s <= steps; s++){
          const t2 = s / steps;
          const ang = t2 * turns * Math.PI*2 + frame*0.03;
          const r = size * 1.3 * t2;
          const xp = x + Math.cos(ang) * r;
          const yp = y + Math.sin(ang) * r;
          if(s === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
        }
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(x, y, size*0.25, 0, Math.PI*2); ctx.fill();
        break;
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function polygon(ctx, cx, cy, r, sides, rot, fill){
    ctx.beginPath();
    for(let i = 0; i < sides; i++){
      const a = rot + (i/sides) * Math.PI*2 - Math.PI/2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if(fill) ctx.fill(); else ctx.stroke();
  }

  function starShape(ctx, cx, cy, rOut, rIn, points, rot, fill){
    ctx.beginPath();
    for(let i = 0; i < points*2; i++){
      const r = i % 2 === 0 ? rOut : rIn;
      const a = rot + (i / (points*2)) * Math.PI*2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if(fill) ctx.fill(); else ctx.stroke();
  }

  // ─── TIPOS DE CONEXÃO (22) ───────────────────────────────────
  const TIPOS_EDGE = [
    'line','line_grad','lightning','wave','curve','dotted','particles',
    'dipole','dna','rope','laser','smoke','pulse','ribbon','energy',
    'dash','aurora','circuit','plasma_arc','fractal_swirl','magnetic_lines',
    'spark_chain'
  ];

  // pulseDir: +1 = de from→to; -1 = de to→from. Determinado por Y dos nós.
  function desenharEdge(ctx, x1, y1, x2, y2, tipo, alpha, i, cfg, frame, pulseDir){
    const cor = cfg.cores.primary;
    const cor2 = cfg.cores.secondary;
    const cor3 = cfg.cores.accent;
    ctx.lineWidth = 0.6;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 0;

    // Para pulse: se pulseDir = -1, invertemos os pontos
    let ax = x1, ay = y1, bx = x2, by = y2;
    if(tipo === 'pulse' && pulseDir < 0){
      ax = x2; ay = y2; bx = x1; by = y1;
    }

    switch(tipo){
      case 'line':
        ctx.strokeStyle = rgba(cor, alpha*0.5);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        break;
      case 'line_grad': {
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, rgba(cor, alpha*0.6));
        g.addColorStop(1, rgba(cor2, alpha*0.6));
        ctx.strokeStyle = g;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        break;
      }
      case 'lightning': {
        const segs = 4;
        const dx = (x2-x1)/segs, dy = (y2-y1)/segs;
        const dl = Math.sqrt(dx*dx+dy*dy) || 1;
        const ortho = [-dy/dl, dx/dl];
        ctx.strokeStyle = rgba(cor, alpha*0.8);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for(let k = 1; k <= segs; k++){
          const jitter = Math.sin(frame*0.1 + i*0.3 + k) * 6;
          ctx.lineTo(x1 + dx*k + ortho[0]*jitter, y1 + dy*k + ortho[1]*jitter);
        }
        ctx.stroke();
        break;
      }
      case 'wave': {
        ctx.strokeStyle = rgba(cor, alpha*0.6);
        const distW = Math.sqrt((x2-x1)**2 + (y2-y1)**2) || 1;
        const nSegs = Math.max(8, Math.floor(distW/8));
        const owx = (x2-x1)/distW, owy = (y2-y1)/distW;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        for(let k = 1; k <= nSegs; k++){
          const tw = k/nSegs;
          const wav = Math.sin(k*0.5 + frame*0.05 + i*0.2) * 3;
          ctx.lineTo(x1 + (x2-x1)*tw + (-owy)*wav, y1 + (y2-y1)*tw + (owx)*wav);
        }
        ctx.stroke();
        break;
      }
      case 'curve': {
        ctx.strokeStyle = rgba(cor, alpha*0.6);
        const cmx = (x1+x2)/2 + (y2-y1)*0.2;
        const cmy = (y1+y2)/2 - (x2-x1)*0.2;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cmx, cmy, x2, y2);
        ctx.stroke();
        break;
      }
      case 'dotted': {
        const ddist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const nd = Math.floor(ddist/6);
        const offset = (frame * 0.06) % 1;
        ctx.fillStyle = rgba(cor, alpha*0.7);
        for(let k = 0; k < nd; k++){
          const tt = (k + offset) / nd;
          if(tt > 1) continue;
          ctx.beginPath(); ctx.arc(x1 + (x2-x1)*tt, y1 + (y2-y1)*tt, 1, 0, Math.PI*2); ctx.fill();
        }
        break;
      }
      case 'particles': {
        const pp = ((frame * 0.02 + i*0.13) % 1);
        ctx.fillStyle = cor2;
        ctx.beginPath(); ctx.arc(x1 + (x2-x1)*pp, y1 + (y2-y1)*pp, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = rgba(cor, alpha*0.15);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        break;
      }
      case 'dipole': {
        const ddx2 = x2-x1, ddy2 = y2-y1;
        const dlen2 = Math.sqrt(ddx2*ddx2+ddy2*ddy2) || 1;
        const dort = [-ddy2/dlen2, ddx2/dlen2];
        for(let side = 0; side < 2; side++){
          const sign = side === 0 ? 1 : -1;
          const bulge = dlen2 * 0.5 * sign;
          const cm1x = (x1+x2)/2 + dort[0]*bulge;
          const cm1y = (y1+y2)/2 + dort[1]*bulge;
          ctx.strokeStyle = rgba(side === 0 ? cor : cor2, alpha*0.7);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cm1x, cm1y, x2, y2);
          ctx.stroke();
        }
        ctx.lineWidth = 0.6;
        break;
      }
      case 'magnetic_lines': {
        const mdx = x2-x1, mdy = y2-y1;
        const mlen = Math.sqrt(mdx*mdx+mdy*mdy) || 1;
        const mort = [-mdy/mlen, mdx/mlen];
        for(let s = -2; s <= 2; s++){
          const bulge = s * mlen * 0.18;
          const cmxM = (x1+x2)/2 + mort[0]*bulge;
          const cmyM = (y1+y2)/2 + mort[1]*bulge;
          ctx.strokeStyle = rgba(cor, alpha*0.45 - Math.abs(s)*0.05);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cmxM, cmyM, x2, y2);
          ctx.stroke();
        }
        break;
      }
      case 'dna': {
        const adx = x2-x1, ady = y2-y1;
        const alen = Math.sqrt(adx*adx+ady*ady) || 1;
        const aort = [-ady/alen, adx/alen];
        const dsegs = Math.max(8, Math.floor(alen/10));
        for(let line = 0; line < 2; line++){
          ctx.strokeStyle = rgba(line === 0 ? cor : cor2, alpha*0.7);
          ctx.beginPath();
          const phase = line * Math.PI;
          for(let k = 0; k <= dsegs; k++){
            const tt = k/dsegs;
            const wav = Math.sin(tt*Math.PI*4 + phase + frame*0.04) * 4;
            const xp = x1 + adx*tt + aort[0]*wav;
            const yp = y1 + ady*tt + aort[1]*wav;
            if(k === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
          }
          ctx.stroke();
        }
        break;
      }
      case 'rope': {
        const rdx = x2-x1, rdy = y2-y1;
        const rlen = Math.sqrt(rdx*rdx+rdy*rdy) || 1;
        const rort = [-rdy/rlen, rdx/rlen];
        const rsegs = Math.max(6, Math.floor(rlen/8));
        ctx.strokeStyle = rgba(cor, alpha*0.6);
        for(let line = 0; line < 2; line++){
          ctx.beginPath();
          const phase = line * Math.PI;
          for(let k = 0; k <= rsegs; k++){
            const tt = k/rsegs;
            const wav = Math.sin(tt*Math.PI*3 + phase + i*0.1) * 2.5;
            const xp = x1 + rdx*tt + rort[0]*wav;
            const yp = y1 + rdy*tt + rort[1]*wav;
            if(k === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
          }
          ctx.stroke();
        }
        break;
      }
      case 'laser':
        ctx.strokeStyle = rgba(cor, alpha*0.35);
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        break;
      case 'smoke': {
        const sdx = x2-x1, sdy = y2-y1;
        const slen = Math.sqrt(sdx*sdx+sdy*sdy) || 1;
        const sort = [-sdy/slen, sdx/slen];
        for(let s = -2; s <= 2; s++){
          const off = s * 1.5;
          ctx.strokeStyle = rgba(cor, alpha*0.18 * (1 - Math.abs(s)/3));
          ctx.beginPath();
          ctx.moveTo(x1 + sort[0]*off, y1 + sort[1]*off);
          ctx.lineTo(x2 + sort[0]*off, y2 + sort[1]*off);
          ctx.stroke();
        }
        break;
      }
      case 'pulse': {
        // Linha base fraca + bolinha brilhante viajando de ax→bx (já invertido se pulseDir<0)
        ctx.strokeStyle = rgba(cor, alpha*0.2);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        const pT = ((frame*0.015 + i*0.07) % 1);
        const px = ax + (bx-ax)*pT;
        const py = ay + (by-ay)*pT;
        ctx.fillStyle = cor3;
        if(cfg.glow > 0){
          ctx.shadowColor = cor3;
          ctx.shadowBlur = 6;
        }
        ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }
      case 'ribbon': {
        const bdx = x2-x1, bdy = y2-y1;
        const blen = Math.sqrt(bdx*bdx+bdy*bdy) || 1;
        const bort = [-bdy/blen, bdx/blen];
        const w = 2.5;
        ctx.fillStyle = rgba(cor, alpha*0.3);
        ctx.beginPath();
        ctx.moveTo(x1 + bort[0]*w, y1 + bort[1]*w);
        ctx.lineTo(x2 + bort[0]*w, y2 + bort[1]*w);
        ctx.lineTo(x2 - bort[0]*w, y2 - bort[1]*w);
        ctx.lineTo(x1 - bort[0]*w, y1 - bort[1]*w);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'energy': {
        const edx = x2-x1, edy = y2-y1;
        const elen = Math.sqrt(edx*edx+edy*edy) || 1;
        const eort = [-edy/elen, edx/elen];
        const esegs = Math.max(10, Math.floor(elen/4));
        ctx.strokeStyle = rgba(cor, alpha*0.7);
        ctx.beginPath();
        for(let k = 0; k <= esegs; k++){
          const tt = k/esegs;
          const wav = (Math.sin(k*2 + frame*0.3 + i*0.4) + Math.sin(k*4 + frame*0.2)) * 1.2;
          const xp = x1 + edx*tt + eort[0]*wav;
          const yp = y1 + edy*tt + eort[1]*wav;
          if(k === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
        }
        ctx.stroke();
        break;
      }
      case 'dash':
        ctx.strokeStyle = rgba(cor, alpha*0.7);
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -frame * 0.5;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'aurora': {
        const audx = x2-x1, audy = y2-y1;
        const aulen = Math.sqrt(audx*audx+audy*audy) || 1;
        const auort = [-audy/aulen, audx/aulen];
        const ausegs = Math.max(10, Math.floor(aulen/8));
        for(let layer = 0; layer < 2; layer++){
          ctx.strokeStyle = rgba(layer === 0 ? cor : cor2, alpha*0.45);
          ctx.lineWidth = 2 - layer*0.5;
          ctx.beginPath();
          for(let k = 0; k <= ausegs; k++){
            const tt = k/ausegs;
            const wav = Math.sin(tt*Math.PI*3 + frame*0.04 + layer*Math.PI/2) * (4 + layer);
            const xp = x1 + audx*tt + auort[0]*wav;
            const yp = y1 + audy*tt + auort[1]*wav;
            if(k === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
          }
          ctx.stroke();
        }
        ctx.lineWidth = 0.6;
        break;
      }
      case 'circuit':
        ctx.strokeStyle = rgba(cor, alpha*0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.fillStyle = rgba(cor, alpha);
        ctx.beginPath(); ctx.arc(x2, y1, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.lineWidth = 0.6;
        break;
      case 'plasma_arc': {
        const pdx = x2-x1, pdy = y2-y1;
        const plen = Math.sqrt(pdx*pdx+pdy*pdy) || 1;
        const port = [-pdy/plen, pdx/plen];
        const psegs = Math.max(12, Math.floor(plen/5));
        ctx.strokeStyle = rgba(cor, alpha*0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let k = 0; k <= psegs; k++){
          const tt = k/psegs;
          const jit = (Math.sin(k*1.7 + frame*0.2 + i*0.3) + Math.sin(k*3.1 + frame*0.15)*0.5) * 2.5;
          const xp = x1 + pdx*tt + port[0]*jit;
          const yp = y1 + pdy*tt + port[1]*jit;
          if(k === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
        }
        ctx.stroke();
        ctx.strokeStyle = rgba(cor2, alpha*0.4);
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.lineWidth = 0.6;
        break;
      }
      case 'fractal_swirl': {
        const fdx = x2-x1, fdy = y2-y1;
        const flen = Math.sqrt(fdx*fdx+fdy*fdy) || 1;
        const fort = [-fdy/flen, fdx/flen];
        for(let layer = 0; layer < 4; layer++){
          const bulge = Math.sin(frame*0.02 + i*0.1 + layer) * flen * 0.4;
          const cmxF = (x1+x2)/2 + fort[0]*bulge;
          const cmyF = (y1+y2)/2 + fort[1]*bulge;
          ctx.strokeStyle = rgba(layer % 2 === 0 ? cor : cor2, alpha*0.18);
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cmxF, cmyF, x2, y2);
          ctx.stroke();
        }
        ctx.lineWidth = 0.6;
        break;
      }
      case 'spark_chain': {
        // Pequenas faíscas em corrente, viajando
        const cdist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const ns = Math.max(5, Math.floor(cdist/10));
        for(let k = 0; k < ns; k++){
          const tt = ((k + frame*0.02) % ns) / ns;
          const cx0 = x1 + (x2-x1)*tt;
          const cy0 = y1 + (y2-y1)*tt;
          ctx.fillStyle = rgba(k % 2 === 0 ? cor : cor3, alpha*0.8);
          ctx.beginPath(); ctx.arc(cx0, cy0, 1.2, 0, Math.PI*2); ctx.fill();
        }
        break;
      }
    }
  }

  // ─── PARTÍCULAS DE FUNDO ─────────────────────────────────────
  function updateParticles(particles, cx, cy, W, H, cfg, frame, ctx){
    if(!cfg.particulas) return;
    if(frame % 2 === 0 && particles.length < 60){
      particles.push({
        x: cx + (Math.random()-0.5)*W*0.7,
        y: cy + (Math.random()-0.5)*H*0.7,
        vx: (Math.random()-0.5)*0.3,
        vy: -0.2 - Math.random()*0.5,
        life: 100 + Math.random()*120, age: 0,
        cor: Math.random() < 0.6 ? cfg.cores.primary : cfg.cores.secondary,
        s: 0.5 + Math.random()*1.5
      });
    }
    for(let i = particles.length - 1; i >= 0; i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.age++;
      if(p.age > p.life){ particles.splice(i, 1); continue; }
      ctx.fillStyle = p.cor;
      ctx.globalAlpha = (1 - p.age/p.life) * 0.6;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ─── DESENHO PRINCIPAL ───────────────────────────────────────
  /**
   * @param {Object} opts:
   *   canvas: <canvas>
   *   cerebro: { nodes, edges } (V112 brain)
   *   cfg: estilo (de ESTILOS, clonável e editável)
   *   frame: int (incrementa ao longo do tempo)
   *   anguloY, anguloX: ângulos de rotação
   *   panX, panY: offset
   *   particles: array (estado entre frames)
   *   modoOriginal: bool — se true, usa cores REAIS por camada (criança)
   */
  function desenhar(opts){
    const canvas = opts.canvas;
    const cerebro = opts.cerebro;
    const cfg = opts.cfg;
    const frame = opts.frame || 0;
    const anguloY = opts.anguloY || 0;
    const anguloX = opts.anguloX || 0;
    const panX = opts.panX || 0;
    const panY = opts.panY || 0;
    const particles = opts.particles || [];
    const modoOriginal = !!opts.modoOriginal;
    const zoomMult = (opts.zoomMult != null) ? opts.zoomMult : 1.0;  // multiplicador do usuário (pinça/scroll)

    if(!canvas || !cerebro || !cerebro.nodes) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if(canvas.width !== Math.floor(rect.width * dpr)){
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width, H = rect.height;

    // Fundo
    ctx.fillStyle = '#06080f';
    ctx.fillRect(0, 0, W, H);

    const cx = W/2 + panX, cy = H/2 + panY;
    const zoom = (cfg.zoom / 100) * zoomMult;  // ← agora respeita zoom do usuário
    const baseScale = Math.min(W, H) * 0.0024 * zoom;

    // Glow ambiente suave
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.45);
    grad.addColorStop(0, rgba(cfg.cores.primary, 0.10));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Map id->node
    const nodeById = new Map();
    for(const n of cerebro.nodes) nodeById.set(n.id, n);

    // ─── EDGES ─────────────────────────────────────────────
    const edgeAlpha = cfg.edgeAlpha / 100;
    const maxEdges = Math.min(400, cerebro.edges.length);
    const stepE = Math.ceil(cerebro.edges.length / maxEdges);
    for(let i = 0; i < cerebro.edges.length; i += stepE){
      const e = cerebro.edges[i];
      const nA = nodeById.get(e.from);
      const nB = nodeById.get(e.to);
      if(!nA || !nB || !nA.pos || !nB.pos) continue;
      const pA = project(nA.pos, anguloY, anguloX);
      const pB = project(nB.pos, anguloY, anguloX);
      // Direção pulso: do nó com Y MENOR → para o nó com Y MAIOR (coroa)
      // (Y > 0 = topo do cérebro = coroa, baseado em cerebro_V15.json)
      const pulseDir = (nA.pos[1] <= nB.pos[1]) ? 1 : -1;
      desenharEdge(
        ctx,
        cx + pA[0]*baseScale, cy + pA[2]*baseScale,
        cx + pB[0]*baseScale, cy + pB[2]*baseScale,
        cfg.edge, edgeAlpha, i, cfg, frame, pulseDir
      );
    }

    // ─── NÓS depth-sorted ──────────────────────────────────
    const tamMult = cfg.size / 100;
    const ordenado = cerebro.nodes.slice().sort((a, b) => {
      if(!a.pos || !b.pos) return 0;
      return project(b.pos, anguloY, anguloX)[2] - project(a.pos, anguloY, anguloX)[2];
    });

    for(const n of ordenado){
      if(!n.pos) continue;
      const p = project(n.pos, anguloY, anguloX);
      const x = cx + p[0]*baseScale;
      const y = cy + p[2]*baseScale;
      const scaleZ = p[3];

      let size = 2.2 * scaleZ;
      if(n.camada === 'self_core') size = 14 * scaleZ * (1 + Math.sin(frame*cfg.speed*0.008)*0.2);
      else if(n.camada === 'hipocampo') size = 5 * scaleZ;
      else if(n.camada === 'motora') size = 3.2 * scaleZ;
      else if(n.camada === 'amigdala') size = 3 * scaleZ;
      else if(n.camada === 'subrede') size = 7 * scaleZ;
      else if(n.camada === 'subrede_sat') size = 5 * scaleZ;
      else if(n.camada === 'sensorial') size = 4 * scaleZ;
      else if(n.camada === 'cortex') size = 2.5 * scaleZ;
      else if(n.camada === 'hemisferio') size = 10 * scaleZ;

      if(n.text && n.mass && n.camada !== 'self_core'){
        size *= Math.min(2.5, 0.8 + n.mass * 0.15);
      }
      size = Math.max(1.5, size) * tamMult;

      const cor = modoOriginal ? corPorCamadaOriginal(n) : corPorCamada(n, cfg.cores);
      desenharNucleo(ctx, x, y, size, cor, cfg.nucleo, scaleZ, cfg, frame);
    }

    // ─── PARTÍCULAS ────────────────────────────────────────
    updateParticles(particles, cx, cy, W, H, cfg, frame, ctx);
  }

  // ─── RENDER DE SWATCH PEQUENO PARA O MENU ⚛ ──────────────────
  function renderSwatch(canvasEl, estilo){
    const ctx = canvasEl.getContext('2d');
    const W = canvasEl.width, H = canvasEl.height;
    ctx.fillStyle = '#06080f';
    ctx.fillRect(0, 0, W, H);
    const gg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.min(W,H)*0.6);
    gg.addColorStop(0, rgba(estilo.cores.primary, 0.35));
    gg.addColorStop(1, 'transparent');
    ctx.fillStyle = gg;
    ctx.fillRect(0, 0, W, H);

    // 3 pontos + 3 edges no estilo correto, escala pequena
    const fakeCfg = Object.assign({}, estilo);
    const cx = W/2, cy = H*0.45;
    const r = Math.min(W,H)*0.32;
    const pts = [
      [cx, cy - r*0.8],
      [cx - r*0.85, cy + r*0.45],
      [cx + r*0.85, cy + r*0.45]
    ];
    desenharEdge(ctx, pts[0][0], pts[0][1], pts[1][0], pts[1][1], estilo.edge, 0.7, 0, fakeCfg, 0, 1);
    desenharEdge(ctx, pts[0][0], pts[0][1], pts[2][0], pts[2][1], estilo.edge, 0.7, 1, fakeCfg, 0, 1);
    desenharEdge(ctx, pts[1][0], pts[1][1], pts[2][0], pts[2][1], estilo.edge, 0.7, 2, fakeCfg, 0, 1);
    const sNuc = Math.min(W,H)*0.11;
    desenharNucleo(ctx, pts[0][0], pts[0][1], sNuc, estilo.cores.primary, estilo.nucleo, 1, fakeCfg, 0);
    desenharNucleo(ctx, pts[1][0], pts[1][1], sNuc*0.85, estilo.cores.secondary, estilo.nucleo, 1, fakeCfg, 0);
    desenharNucleo(ctx, pts[2][0], pts[2][1], sNuc*0.85, estilo.cores.accent, estilo.nucleo, 1, fakeCfg, 0);
  }

  // ─── EXPORT ──────────────────────────────────────────────────
  window.VIZ = {
    ESTILOS: ESTILOS,
    FORMAS_NUCLEO: FORMAS_NUCLEO,
    TIPOS_EDGE: TIPOS_EDGE,
    PALETAS_CEREBRO: PALETAS_CEREBRO,
    desenhar: desenhar,
    renderSwatch: renderSwatch,
    aplicarPaletaCerebro: aplicarPaletaCerebro,
    clonarEstilo: function(i){ return JSON.parse(JSON.stringify(ESTILOS[i])); },
  };
})();
