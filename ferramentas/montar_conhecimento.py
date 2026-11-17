# -*- coding: utf-8 -*-
"""Monta o CONHECIMENTO COMPACTADO do LAB: cada base vira pedaços pequenos (.tsv.gz) em ordem alfabética, com um índice.

Ferramenta de desenvolvimento do LAB (Claude, 16/11/2026, a pedido do autor). Não é aprendizado do cérebro.

Ideia (mesma do Nerael: guardar uma vez e ler só o pedaço que precisa): o navegador baixa só o índice (poucos KB)
e, quando a conversa pergunta "o que é X?", baixa só o pedaço onde X está (~100 KB), descompacta e responde.
Assim a Wikipédia inteira cabe até no celular: nada vai para a memória sem ser pedido.

Uso:
    python -X utf8 montar_conhecimento.py [wiki] [dic] [ent] [gram]     (sem nome = todas as que tiverem fonte pronta)
Fontes (E:\\NERAEL_BASES_DADOS\\lab_v15\\): wiki\\parte_*.tsv.gz, dicionario.tsv.gz, entidades.tsv.gz, gramatica.tsv.gz
Destino: <LAB>\\conhecimento\\<base>\\NNNN.tsv.gz + <LAB>\\conhecimento\\<base>\\indice.json

Formato de cada linha de pedaço: chave<TAB>titulo<TAB>texto[<TAB>extra]. A chave é o título em minúsculas, sem acento e
sem o "(desambiguação)" entre parênteses; o índice guarda a 1ª chave de cada pedaço."""
import gzip
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

FONTES = Path(r'E:\NERAEL_BASES_DADOS\lab_v15')
LAB = Path(__file__).resolve().parents[1]
DESTINO = LAB / 'conhecimento'
ALVO_BYTES = 360_000        # texto por pedaço antes de compactar (~110 KB compactado)


def chave(t):
    t = re.sub(r'\s*\([^)]*\)\s*$', '', t)          # "Mercúrio (planeta)" -> "Mercúrio"
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    t = re.sub(r'[^a-z0-9]+', ' ', t).strip()
    return t


def linhas_wiki():
    for arq in sorted((FONTES / 'wiki').glob('parte_*.tsv.gz')):
        with gzip.open(arq, 'rt', encoding='utf-8') as g:
            for l in g:
                titulo, _, texto = l.rstrip('\n').partition('\t')
                if titulo and texto:
                    yield chave(titulo), titulo, texto, ''


def linhas_dic():
    with gzip.open(FONTES / 'dicionario.tsv.gz', 'rt', encoding='utf-8') as g:
        for l in g:
            p = l.rstrip('\n').split('\t')
            if len(p) >= 3:
                yield chave(p[0]), p[0], p[2], p[1]


def linhas_ent():
    with gzip.open(FONTES / 'entidades.tsv.gz', 'rt', encoding='utf-8') as g:
        for l in g:
            p = l.rstrip('\n').split('\t')
            if len(p) >= 3 and p[2]:
                extra = ' '.join(x for x in p[3:5] if x)
                yield chave(p[0]), p[0], p[2], extra


def linhas_gram():
    with gzip.open(FONTES / 'gramatica.tsv.gz', 'rt', encoding='utf-8') as g:
        for l in g:
            p = l.rstrip('\n').split('\t')
            if len(p) >= 3 and p[2]:
                yield chave(p[0]), p[0], p[2], (p[3] if len(p) > 3 else '')


BASES = {
    'wiki': ('Wikipédia em português (resumo de cada artigo)', linhas_wiki, lambda: (FONTES / 'wiki' / 'FIM.json').exists() or any((FONTES / 'wiki').glob('parte_*.tsv.gz'))),
    'dic': ('Novo Dicionário da Língua Portuguesa — Cândido de Figueiredo, 1913 (domínio público)', linhas_dic, lambda: (FONTES / 'dicionario.tsv.gz').exists()),
    'ent': ('Livro de Entidades (conceitos, definições e regras)', linhas_ent, lambda: (FONTES / 'entidades.tsv.gz').exists()),
    'gram': ('Regras da língua portuguesa', linhas_gram, lambda: (FONTES / 'gramatica.tsv.gz').exists()),
}


def montar(base):
    nome, gerador, pronto = BASES[base]
    if not pronto():
        print(f'{base}: sem fonte pronta, pulei', flush=True)
        return None
    t0 = time.time()
    itens = [x for x in gerador() if x[0]]
    itens.sort(key=lambda x: (x[0], x[1]))
    pasta = DESTINO / base
    tmp = DESTINO / (base + '.montando')
    if tmp.exists():
        for a in tmp.iterdir():
            a.unlink()
    tmp.mkdir(parents=True, exist_ok=True)
    indice, buf, tam, n = [], [], 0, 0

    def fechar():
        nonlocal buf, tam, n
        if not buf:
            return
        n += 1
        arq = tmp / f'{n:04d}.tsv.gz'
        dados = ('\n'.join(buf) + '\n').encode('utf-8')
        with open(arq, 'wb') as f:
            f.write(gzip.compress(dados, compresslevel=9, mtime=0))
        indice.append([buf[0].split('\t', 1)[0], f'{n:04d}.tsv.gz'])
        buf, tam = [], 0

    ultima = None
    for k, titulo, texto, extra in itens:
        linha = '\t'.join(x.replace('\t', ' ').replace('\n', ' ') for x in (k, titulo, texto, extra)).rstrip('\t')
        # só corta o pedaço entre chaves diferentes (a mesma chave fica toda no mesmo pedaço)
        if tam >= ALVO_BYTES and k != ultima:
            fechar()
        buf.append(linha)
        tam += len(linha.encode('utf-8')) + 1
        ultima = k
    fechar()
    total_gz = sum(a.stat().st_size for a in tmp.glob('*.tsv.gz'))
    meta = {'base': base, 'nome': nome, 'verbetes': len(itens), 'pedacos': n, 'bytes_compactados': total_gz,
            'formato': 'chave<TAB>titulo<TAB>texto[<TAB>extra], gzip', 'montado': time.strftime('%Y-%m-%d %H:%M'),
            'indice': indice}
    (tmp / 'indice.json').write_text(json.dumps(meta, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    # troca a pasta antiga pela nova de uma vez (quem estiver usando o LAB não vê pasta pela metade)
    velha = DESTINO / (base + '.velha')
    if velha.exists():
        for a in velha.iterdir():
            a.unlink()
        velha.rmdir()
    if pasta.exists():
        os.replace(pasta, velha)
    os.replace(tmp, pasta)
    if velha.exists():
        for a in velha.iterdir():
            a.unlink()
        velha.rmdir()
    print(f'{base}: {len(itens)} verbetes, {n} pedaços, {total_gz / 1e6:.1f} MB compactados, {time.time() - t0:.0f}s', flush=True)
    return meta


def main():
    pedidas = [a for a in sys.argv[1:] if a in BASES] or list(BASES)
    DESTINO.mkdir(exist_ok=True)
    resumo = {}
    for b in pedidas:
        m = montar(b)
        if m:
            resumo[b] = {k: m[k] for k in ('nome', 'verbetes', 'pedacos', 'bytes_compactados', 'montado')}
    # catálogo geral (o LAB lê para saber quais bases existem)
    cat_arq = DESTINO / 'catalogo.json'
    cat = json.loads(cat_arq.read_text(encoding='utf-8')) if cat_arq.exists() else {}
    cat.update(resumo)
    cat_arq.write_text(json.dumps(cat, ensure_ascii=False, indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()
