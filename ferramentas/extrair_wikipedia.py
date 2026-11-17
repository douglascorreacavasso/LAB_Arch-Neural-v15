# -*- coding: utf-8 -*-
"""Extrai da Wikipédia em português (dump .xml.bz2) o RESUMO de cada artigo: título + até 2 frases do começo.

Ferramenta de desenvolvimento do LAB (escrita pelo Claude em 16/11/2026, a pedido do autor). Não é aprendizado do cérebro.
Reaproveita a limpeza de wikitexto que já existe no projeto Nerael (FORJA/BASES_LEITURA_V1/preparar_bases.py), para
não ter duas limpezas diferentes da mesma base.

Uso (lento: lê os ~12 GB descompactados; roda como trabalho pesado do executor, um processo só, pouca RAM):
    python -X utf8 extrair_wikipedia.py [--limite-artigos N] [--saida PASTA]

Saída: PASTA/parte_00001.tsv.gz ... (uma linha por artigo: "titulo<TAB>resumo"), ESTADO.json (retomada) e FIM.json.
Retoma sozinho de onde parou (pula as páginas já vistas)."""
import bz2
import gzip
import json
import os
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

FORJA_BASES = Path(r'C:\Users\Douglas\Downloads\ARCH-NEURAL 3D-MNLS v3\FORJA\BASES_LEITURA_V1')
sys.path.insert(0, str(FORJA_BASES))
import preparar_bases as PB  # noqa: E402  (limpar_wikitexto, frases_resumo, REDIR, DESAMBIG)

ORIGEM = Path(r'E:\NERAEL_BASES_DADOS\wikipedia_pt\ptwiki-latest-pages-articles.xml.bz2')
POR_PARTE = 50_000
MAX_CHARS = 240


def opt(nome, padrao=None):
    if nome in sys.argv:
        i = sys.argv.index(nome)
        return sys.argv[i + 1] if i + 1 < len(sys.argv) else padrao
    return padrao


def gravar_json(arq, dados):
    tmp = arq.with_suffix('.tmp')
    tmp.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding='utf-8')
    os.replace(tmp, arq)


def main():
    saida = Path(opt('--saida', r'E:\NERAEL_BASES_DADOS\lab_v15\wiki'))
    limite = int(opt('--limite-artigos', '0') or 0)
    saida.mkdir(parents=True, exist_ok=True)
    fim = saida / 'FIM.json'
    if fim.exists():
        print('já terminado:', fim, flush=True)
        return
    est_arq = saida / 'ESTADO.json'
    est = json.loads(est_arq.read_text(encoding='utf-8')) if est_arq.exists() else {'paginas': 0, 'partes': 0, 'artigos': 0}
    pular, parte, artigos = est['paginas'], est['partes'], est['artigos']
    buf, vistas, t0 = [], 0, time.time()
    print(f'retomando depois de {pular} páginas; {parte} partes; {artigos} artigos', flush=True)

    def fechar():
        nonlocal parte, buf
        if not buf:
            return
        parte += 1
        arq = saida / f'parte_{parte:05d}.tsv.gz'
        tmp = arq.with_suffix('.tmp')
        with gzip.open(tmp, 'wt', encoding='utf-8', compresslevel=6) as g:
            g.write('\n'.join(buf) + '\n')
        os.replace(tmp, arq)
        buf = []
        gravar_json(est_arq, {'paginas': vistas, 'partes': parte, 'artigos': artigos,
                              'atualizado': time.strftime('%Y-%m-%d %H:%M:%S')})
        print(f'parte {parte}: {artigos} artigos, {vistas} páginas, {time.time() - t0:.0f}s', flush=True)

    ns = ''
    with bz2.open(ORIGEM, 'rb') as f:
        for _ev, el in ET.iterparse(f, events=('end',)):
            tag = el.tag.rsplit('}', 1)[-1]
            if not ns and '}' in el.tag:
                ns = el.tag.split('}')[0] + '}'
            if tag != 'page':
                continue
            vistas += 1
            if vistas <= pular:
                el.clear()
                continue
            titulo = (el.findtext(f'{ns}title') or '').strip()
            nsp = el.findtext(f'{ns}ns') or '0'
            redir = el.find(f'{ns}redirect') is not None
            texto = el.findtext(f'{ns}revision/{ns}text') or ''
            el.clear()
            if nsp != '0' or redir or PB.REDIR.match(texto) or PB.DESAMBIG.search(texto) or not titulo:
                continue
            fr = PB.frases_resumo(titulo, texto, maximo=2)
            if not fr:
                continue
            resumo = fr[0] if len(fr) == 1 or len(fr[0]) + len(fr[1]) + 1 > MAX_CHARS else fr[0] + ' ' + fr[1]
            resumo = resumo[:MAX_CHARS].replace('\t', ' ').replace('\n', ' ')
            buf.append(titulo.replace('\t', ' ') + '\t' + resumo)
            artigos += 1
            if len(buf) >= POR_PARTE:
                fechar()
            if limite and artigos >= limite:
                break
    fechar()
    if not limite:
        gravar_json(fim, {'artigos': artigos, 'paginas': vistas, 'partes': parte, 'segundos': round(time.time() - t0)})
        print(f'TERMINOU: {artigos} artigos em {parte} partes', flush=True)
    else:
        print(f'teste: {artigos} artigos', flush=True)


if __name__ == '__main__':
    main()
