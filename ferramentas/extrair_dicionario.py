# -*- coding: utf-8 -*-
"""Extrai os verbetes do "Novo Dicionário da Língua Portuguesa" (Cândido de Figueiredo, 1913, domínio público via
Projeto Gutenberg) a partir das páginas já lidas do PDF (jsonl, uma página por linha).

Ferramenta de desenvolvimento do LAB (Claude, 16/11/2026, a pedido do autor). O PDF tem os acentos como sinais soltos
("n˜ ao", "´ e", "¸ c"); aqui eles voltam a ser letras acentuadas.

Uso:  python -X utf8 extrair_dicionario.py [--saida ARQ]
Saída: ARQ (.tsv.gz) com "palavra<TAB>classe<TAB>definição" por verbete."""
import gzip
import json
import re
import sys
import unicodedata
from pathlib import Path

ORIGEM = Path(r'E:\NERAEL_VISUAL43_DEV\integration_v1\PUC47_DUAL_20261025\PROFESSORES_700_GATE\BOOK_CORPUS'
              r'\pt_DICIONARIO-acf31020fd2b217d.jsonl')
SAIDA = Path(r'E:\NERAEL_BASES_DADOS\lab_v15\dicionario.tsv.gz')

COMB = {'˜': '\u0303', '´': '\u0301', '`': '\u0300', 'ˆ': '\u0302', '¨': '\u0308', '¸': '\u0327'}
LIGA = {'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl', 'ı': 'i'}
RX_ACENTO = re.compile(r'([˜´`ˆ¨¸])\s?([A-Za-zı])')
CLASSES = (r'(?:m\.|f\.|adj\.|adv\.|v\.\s?t\.|v\.\s?i\.|v\.\s?p\.|v\.|loc\.|interj\.|prep\.|conj\.|pron\.|art\.|num\.|'
           r'pref\.|suf\.|el\.|n\.\s?p\.|m\.\s?pl\.|f\.\s?pl\.|m\.\s?e\s?f\.)')
# palavra (com acentos/hífen), número de acepção opcional, pronúncia opcional entre parênteses, classe
RX_VERBETE = re.compile(r'^([a-zà-ÿç][a-zà-ÿç\-]*?)(?:,\s?\d)?,?\s?(?:\([^)]{1,14}\)\s?)?(' + CLASSES + r')\s?(.*)$')


def consertar(t):
    for a, b in LIGA.items():
        t = t.replace(a, b)
    t = RX_ACENTO.sub(lambda m: m.group(2).replace('ı', 'i') + COMB[m.group(1)], t)
    return unicodedata.normalize('NFC', t)


def main():
    saida = Path(sys.argv[sys.argv.index('--saida') + 1]) if '--saida' in sys.argv else SAIDA
    linhas = []
    with open(ORIGEM, encoding='utf-8') as f:
        for l in f:
            p = json.loads(l)
            if p.get('page', 0) < 20:          # capa, prefácio e abreviaturas
                continue
            ls = consertar(p.get('text') or '').split('\n')
            linhas.extend(ls[1:])              # 1ª linha = cabeçalho da página ("1075 inconstitucional")
    verbetes, atual = [], None
    for l in linhas:
        l = l.strip()
        if not l:
            continue
        m = RX_VERBETE.match(l)
        if m and len(m.group(1)) >= 2:
            if atual:
                verbetes.append(atual)
            atual = [m.group(1), re.sub(r'\s', '', m.group(2)), m.group(3).strip()]
        elif atual:
            if atual[2].endswith('-'):
                atual[2] = atual[2][:-1] + l
            else:
                atual[2] += ' ' + l
    if atual:
        verbetes.append(atual)
    # palavras coladas pelo PDF ("pessôasou" = "pessôas ou"): só o caso seguro do "ou" grudado numa palavra
    # que existe (a palavra colada é rara e a da esquerda aparece 5+ vezes)
    from collections import Counter
    freq = Counter(w for _p, _c, d in verbetes for w in re.findall(r'[a-zà-ÿç]+', d.lower()))
    for _p, _c, _d in verbetes:
        freq[_p] += 3

    def descolar(m):
        w = m.group(0)
        esq = w[:-2]
        if len(esq) >= 3 and freq.get(w.lower(), 0) <= 2 and freq.get(esq.lower(), 0) >= 5:
            return esq + ' ou'
        return w
    vistos, saida_l = {}, []
    for pal, cl, df in verbetes:
        df = re.sub(r'[a-zà-ÿç]{5,}ou\b', descolar, df)
        df = re.sub(r':(?=[^\s\d])', ': ', df)
        df = re.sub(r'\s+', ' ', df).strip()
        df = re.sub(r'\s*\((?:De|Do|Da|Lat\.|Gr\.|Cp\.|Fr\.|Ingl\.|Ár\.|It\.|Cast\.)[^)]*\)\s*$', '', df)  # etimologia no fim
        if len(df) < 3:
            continue
        df = df[:400]
        chave = (pal, cl)
        if chave in vistos:
            continue
        vistos[chave] = 1
        saida_l.append(f'{pal}\t{cl}\t{df}')
    saida.parent.mkdir(parents=True, exist_ok=True)
    tmp = saida.with_suffix('.tmp')
    with gzip.open(tmp, 'wt', encoding='utf-8') as g:
        g.write('\n'.join(saida_l) + '\n')
    tmp.replace(saida)
    print(f'{len(saida_l)} verbetes em {saida}', flush=True)


if __name__ == '__main__':
    main()
