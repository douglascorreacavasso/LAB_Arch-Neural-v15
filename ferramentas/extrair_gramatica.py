# -*- coding: utf-8 -*-
"""Extrai as REGRAS DA LÍNGUA PORTUGUESA do livro "Português" da Wikilivros (pt.wikibooks.org, licença CC BY-SA),
a partir do dump oficial da Wikimedia (ptwikibooks-latest-pages-articles.xml.bz2, baixado em 16/11/2026 a pedido do
autor do LAB para E:\\NERAEL_BASES_DADOS\\wikilivros_pt\\).

Ferramenta de desenvolvimento do LAB (Claude, 16/11/2026). Não é aprendizado do cérebro.

Saídas (E:\\NERAEL_BASES_DADOS\\lab_v15\\):
  gramatica.tsv.gz   "tema<TAB>capitulo<TAB>resumo<TAB>mais_regras"  (1 linha por página do livro: Crase, Concordância verbal...)
  gramatica_frases.txt  frases curtas de regra (para o pacote "Ensinar Regras do Português")
Ficam de fora: escolas literárias, exercícios, capa, página de imprimir e de contato."""
import bz2
import gzip
import html
import re
import xml.etree.ElementTree as ET
from collections import OrderedDict
from pathlib import Path

ORIGEM = Path(r'E:\NERAEL_BASES_DADOS\wikilivros_pt\ptwikibooks-latest-pages-articles.xml.bz2')
SAIDA = Path(r'E:\NERAEL_BASES_DADOS\lab_v15')
FORA = re.compile(r'(?i)/(Escolas literárias|Exercícios|Capa|Imprimir|Fale conosco|Elementos narrativos|Gramática e Literatura|'
                  r'Introdução|Índice|Bibliografia|Autores|Lista de morfemas)')
NS_FORA = re.compile(r'^\s*(?:Ficheiro|Arquivo|Imagem|File|Image|Categoria|Category|Predefinição|Template|w|wikt|:?[a-z]{2}):', re.I)


def _aninhado(t, abre, fecha):
    pad = re.compile(re.escape(abre) + r'(?:(?!' + re.escape(abre) + r')(?!' + re.escape(fecha) + r').)*' + re.escape(fecha), re.S)
    for _ in range(40):
        t2 = pad.sub('', t)
        if t2 == t:
            break
        t = t2
    return t


def limpar(t):
    t = re.sub(r'<!--.*?-->', '', t, flags=re.S)
    t = re.sub(r'<ref[^>]*/>', '', t, flags=re.I)
    t = re.sub(r'<ref[^>]*>.*?</ref>', '', t, flags=re.I | re.S)
    t = _aninhado(t, '{{', '}}')
    t = _aninhado(t, '{|', '|}')
    for _ in range(5):
        t2 = re.sub(r'\[\[([^\[\]]*)\]\]', lambda m: '' if NS_FORA.match(m.group(1)) else m.group(1).split('|')[-1], t)
        if t2 == t:
            break
        t = t2
    t = re.sub(r'\[(?:https?|ftp)://[^\s\]]+\s*([^\]]*)\]', r'\1', t)
    t = re.sub(r'<br\s*/?>', ' ', t, flags=re.I)
    t = re.sub(r'<[^>]+>', '', t)
    t = t.replace("'''", '').replace("''", '')
    return html.unescape(t).replace('\xa0', ' ')


def frases_de(texto):
    """Linhas de lista viram frases; parágrafos são cortados em frases."""
    out = []
    for linha in texto.split('\n'):
        l = linha.strip()
        if not l or l.startswith('=') or l.startswith('|') or l.startswith('!'):
            continue
        l = re.sub(r'^[*#:;]+\s*', '', l)
        l = re.sub(r'\s+', ' ', l).strip()
        if len(l) < 12:
            continue
        for f in re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"“])', l):
            f = f.strip()
            if 15 <= len(f) <= 220 and len(re.findall(r'[A-Za-zÀ-ÿ]+', f)) >= 4:
                out.append(f if f[-1] in '.!?:' else f + '.')
    return out


def main():
    ns, paginas = '', []
    for _ev, el in ET.iterparse(bz2.open(ORIGEM), events=('end',)):
        tag = el.tag.rsplit('}', 1)[-1]
        if not ns and '}' in el.tag:
            ns = el.tag.split('}')[0] + '}'
        if tag != 'page':
            continue
        titulo = el.findtext(ns + 'title') or ''
        texto = el.findtext(ns + 'revision/' + ns + 'text') or ''
        redir = el.find(ns + 'redirect') is not None
        el.clear()
        if titulo.startswith('Português/') and not redir and not FORA.search(titulo) and len(texto) > 300:
            paginas.append((titulo, texto))
    linhas, todas = [], OrderedDict()
    for titulo, texto in sorted(paginas):
        partes = titulo.split('/')
        tema = partes[-1].strip()
        capitulo = partes[1] if len(partes) > 2 else ''
        fr = frases_de(limpar(texto))
        if not fr:
            continue
        resumo = ' '.join(fr[:3])[:600]
        mais = ' '.join(fr[3:10])[:900]
        linhas.append('\t'.join([tema, capitulo or '-', resumo, mais]))
        for f in fr:
            # frase de regra: fala de uso/escrita/flexão (não lista de exemplos soltos)
            if re.search(r'(?i)\b(usa-se|emprega-se|escreve-se|deve|devem|quando|sempre|nunca|não se|concorda|'
                         r'recebe|leva|exige|indica|chama-se|é chamad|são chamad|denomina|classific|flexion|'
                         r'regra|acentua|plural|singular|feminino|masculino|verbo|sujeito|predicado|oração)\b', f) \
                    and not re.search(r'(?i)exercício|clique|veja também|wikilivros|wikip', f):
                todas[f] = 1
    SAIDA.mkdir(parents=True, exist_ok=True)
    with gzip.open(SAIDA / 'gramatica.tsv.gz', 'wt', encoding='utf-8') as g:
        g.write('\n'.join(linhas) + '\n')
    (SAIDA / 'gramatica_frases.txt').write_text('\n'.join(todas) + '\n', encoding='utf-8')
    print(f'{len(paginas)} páginas do livro Português, {len(linhas)} temas, {len(todas)} frases de regra', flush=True)


if __name__ == '__main__':
    main()
