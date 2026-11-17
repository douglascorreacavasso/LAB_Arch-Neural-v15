# -*- coding: utf-8 -*-
"""Formato HIPERCOMPACTADO do cérebro do LAB (LAB-CMP-1): mesma ideia do Nerael (cada símbolo guardado uma vez,
ligações em colunas de números), aplicada ao JSON do LAB.

Ferramenta de desenvolvimento (Claude, 16/11/2026, a pedido do autor). Infraestrutura, não aprendizado do cérebro.

O cérebro do LAB é um JSON com listas de objetos (nós, arestas, eventos...). Cada objeto repete os nomes dos campos e
os mesmos textos ("from": "n_123", "tipo": "normal" ...). No LAB-CMP-1:
  - cada lista de objetos vira COLUNAS (um nome de campo por coluna, não por objeto);
  - textos repetidos viram um dicionário (o texto 1 vez) + números de posição;
  - "e_1, e_2, e_3..." vira prefixo + diferenças (1, 1, 1...);
  - coluna com o mesmo valor em todas as linhas vira um valor só; verdadeiro/falso vira "0101...".
É SEM PERDA: desmontar devolve exatamente o mesmo JSON (conferido byte a byte em --conferir).
Na memória do navegador o cérebro continua no formato de sempre (o motor não muda); o compacto é para guardar e baixar.

Uso:
  python -X utf8 cerebro_compacto.py compactar ENTRADA.json SAIDA.lab.json
  python -X utf8 cerebro_compacto.py conferir  ENTRADA.json SAIDA.lab.json
"""
import json
import re
import sys

FORMATO = 'LAB-CMP-1'
RX_PREF = re.compile(r'^(.*?)(0|[1-9][0-9]{0,14})$')


def _id(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':'))


def codificar_coluna(vals):
    n = len(vals)
    ids = [_id(v) for v in vals]
    if n and all(i == ids[0] for i in ids):
        return {'c': vals[0]}
    if all(isinstance(v, bool) for v in vals):
        return {'b': ''.join('1' if v else '0' for v in vals)}
    if all(isinstance(v, str) for v in vals):
        ms = [RX_PREF.match(v) for v in vals]
        if all(ms) and len({m.group(1) for m in ms}) == 1:
            nums = [int(m.group(2)) for m in ms]
            return {'p': ms[0].group(1), 'dn': [nums[0]] + [nums[i] - nums[i - 1] for i in range(1, n)]}
    unicos = {}
    for i in ids:
        if i not in unicos:
            unicos[i] = len(unicos)
    if len(unicos) <= max(1, n // 2):
        ordem = [None] * len(unicos)
        for v, i in zip(vals, ids):
            ordem[unicos[i]] = v
        return {'d': ordem, 'i': [unicos[i] for i in ids]}
    if all(type(v) is int for v in vals) and n > 1:
        return {'dv': [vals[0]] + [vals[i] - vals[i - 1] for i in range(1, n)]}
    return {'v': vals}


def decodificar_coluna(c, n):
    if 'c' in c:
        return [json.loads(_id(c['c'])) for _ in range(n)]   # cópias independentes (listas/dicts)
    if 'b' in c:
        return [ch == '1' for ch in c['b']]
    if 'p' in c:
        out, x = [], 0
        for k, d in enumerate(c['dn']):
            x = d if k == 0 else x + d
            out.append(c['p'] + str(x))
        return out
    if 'd' in c:
        return [json.loads(_id(c['d'][i])) for i in c['i']]
    if 'dv' in c:
        out, x = [], 0
        for k, d in enumerate(c['dv']):
            x = d if k == 0 else x + d
            out.append(x)
        return out
    return list(c['v'])


def eh_tabela(v):
    return isinstance(v, list) and len(v) >= 8 and all(isinstance(x, dict) for x in v)


def compactar_tabela(lista):
    esquemas, por_esq, linha_esq = {}, [], []
    for obj in lista:
        k = tuple(obj.keys())
        if k not in esquemas:
            esquemas[k] = len(esquemas)
            por_esq.append([])
        e = esquemas[k]
        linha_esq.append(e)
        por_esq[e].append(obj)
    lista_esq = [list(k) for k in esquemas]
    colunas = []
    for e, chaves in enumerate(lista_esq):
        objs = por_esq[e]
        colunas.append({ch: codificar_coluna([o[ch] for o in objs]) for ch in chaves})
    return {'n': len(lista), 'esquemas': lista_esq, 'esq': codificar_coluna(linha_esq), 'colunas': colunas}


def descompactar_tabela(t):
    esq = decodificar_coluna(t['esq'], t['n'])
    conta = [0] * len(t['esquemas'])
    for e in esq:
        conta[e] += 1
    cols = []
    for e, chaves in enumerate(t['esquemas']):
        cols.append({ch: decodificar_coluna(t['colunas'][e][ch], conta[e]) for ch in chaves})
    pos = [0] * len(t['esquemas'])
    out = []
    for e in esq:
        i = pos[e]
        pos[e] += 1
        out.append({ch: cols[e][ch][i] for ch in t['esquemas'][e]})
    return out


def compactar(cerebro):
    corpo = {}
    for k, v in cerebro.items():
        corpo[k] = {'tabela': compactar_tabela(v)} if eh_tabela(v) else {'valor': v}
    return {'formato': FORMATO, 'chaves': list(cerebro.keys()), 'corpo': corpo}


def descompactar(c):
    if c.get('formato') != FORMATO:
        return c
    out = {}
    for k in c['chaves']:
        p = c['corpo'][k]
        out[k] = descompactar_tabela(p['tabela']) if 'tabela' in p else p['valor']
    return out


def main():
    acao, ent, sai = sys.argv[1], sys.argv[2], sys.argv[3]
    original_txt = open(ent, encoding='utf-8').read()
    original = json.loads(original_txt)
    if acao == 'compactar':
        comp = compactar(original)
        txt = json.dumps(comp, ensure_ascii=False, separators=(',', ':'))
        open(sai, 'w', encoding='utf-8', newline='').write(txt)
        print(f'{ent}: {len(original_txt.encode()) / 1e6:.1f} MB -> {sai}: {len(txt.encode()) / 1e6:.1f} MB', flush=True)
    comp = json.load(open(sai, encoding='utf-8'))
    volta = descompactar(comp)
    igual = _id(volta) == _id(original)
    print('conferência sem perda:', 'IGUAL' if igual else 'DIFERENTE', flush=True)
    if not igual:
        sys.exit(1)


if __name__ == '__main__':
    main()
