# -*- coding: utf-8 -*-
"""Lê o "Livro de Entidades" (texto) e separa as fichas ENT-xxxx: conceito, família, definição, regras, variações,
armadilha e evidência mínima.

Ferramenta de desenvolvimento do LAB (Claude, 16/11/2026, a pedido do autor).
Saídas (E:\\NERAEL_BASES_DADOS\\lab_v15\\):
  entidades.tsv.gz    "conceito<TAB>familia<TAB>definicao<TAB>regras<TAB>armadilha" (1 linha por conceito, fichas juntadas)
  entidades_frases.txt  frases curtas (definições, regras, variações) sem repetição, para ensinar ao grafo.
Os exemplos com mensagens [m01 | ...] (nomes de pessoas inventados pelo livro) NÃO entram nas frases de ensino."""
import gzip
import re
from collections import OrderedDict
from pathlib import Path

ORIGEM = Path(r'E:\NERAEL_MAPA_RECONEXAO\material\livros_tec\_consumo\livro_entidades.txt')
SAIDA = Path(r'E:\NERAEL_BASES_DADOS\lab_v15')
SECOES = ('Definição', 'Regras', 'Exemplo correto', 'Exemplo errado e por quê', 'Variações de redação',
          'Caso para resolver', 'Resposta esperada com citação', 'Armadilha comum', 'Evidência mínima')
RUIDO = re.compile(r'^(\[|Contexto:|Exercício|Resposta|Passo a passo|Caso \d|Exemplo \d|A m\d|Por quê|Ignorados|Data atual|Pedido|Pergunta:|Tarefa:)')
GUARDA = {'Definição': 'def', 'Regras': 'reg', 'Variações de redação': 'var', 'Armadilha comum': 'arm',
          'Evidência mínima': 'evi'}


def main():
    linhas = ORIGEM.read_text(encoding='utf-8').splitlines()
    fichas, atual, secao = [], None, None
    for l in linhas:
        l = l.strip()
        m = re.match(r'^(ENT-\d{4}) — (.+)$', l)
        if m:
            if atual:
                fichas.append(atual)
            atual = {'id': m.group(1), 'titulo': m.group(2), 'familia': '', 'conceito': m.group(2),
                     'def': [], 'reg': [], 'var': [], 'arm': [], 'evi': []}
            secao = None
            continue
        if atual is None or not l:
            continue
        if l.startswith('Família:'):
            atual['familia'] = l.split(':', 1)[1].strip().rstrip('.')
            continue
        if l.startswith('Conceito:'):
            atual['conceito'] = l.split(':', 1)[1].strip().rstrip('.')
            continue
        if l in SECOES:
            secao = GUARDA.get(l)
            continue
        if l.startswith('ID:'):
            continue
        if secao and not RUIDO.match(l) and len(l) <= 220:
            atual[secao].append(l)
    if atual:
        fichas.append(atual)
    conceitos = OrderedDict()
    frases = OrderedDict()
    for f in fichas:
        c = conceitos.setdefault(f['conceito'], {'familia': f['familia'], 'def': OrderedDict(), 'reg': OrderedDict(),
                                                  'arm': OrderedDict()})
        for k in ('def', 'reg', 'arm'):
            for x in f[k]:
                c[k][x] = 1
        for k in ('def', 'reg', 'var', 'arm', 'evi'):
            for x in f[k]:
                if x.endswith('.') and 15 <= len(x) <= 160 and not re.search(r'[A-Z]{3}-\d{3}|\[m\d|^Passo \d', x):
                    frases[x] = 1
    with gzip.open(SAIDA / 'entidades.tsv.gz', 'wt', encoding='utf-8') as g:
        for nome, c in conceitos.items():
            g.write('\t'.join([nome, c['familia'], ' '.join(c['def']), ' '.join(list(c['reg'])[:6]),
                               ' '.join(list(c['arm'])[:2])]).replace('\n', ' ') + '\n')
    (SAIDA / 'entidades_frases.txt').write_text('\n'.join(frases) + '\n', encoding='utf-8')
    print(f'{len(fichas)} fichas, {len(conceitos)} conceitos, {len(frases)} frases de ensino', flush=True)


if __name__ == '__main__':
    main()
