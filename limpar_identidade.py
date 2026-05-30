#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
limpar_identidade.py  —  ARCH-NEURAL
Extrai a identidade de teste ("douglas" e "nerael") dos cerebros, SEM corromper o grafo.
A IA passa a comecar SEM saber: quem e o user, quem e o criador, e qual e o proprio nome.
Tudo isso ela aprende quando voce ensinar (isso e codigo, nao dado — continua funcionando).

O que faz, pra CADA alvo (douglas, nerael):
  - remove o no-palavra cujo texto e o alvo (+ arestas dele, por id)
  - limpa o alvo das memorias internas dos nos-modulo (B_bidir, B_autobiografia,
    B_introspector, hipocampo) SEM remover os nos
  - limpa o alvo de todas as estruturas-indice de topo (freq_global, vizinhos_unicos,
    sensorial, valencia_palavras, orbitantes, eventos, etc.)
Alem disso zera self_core: criador=[], user=[], nome=[], genero=[].
Mantem: sou=[ia,sistema], sistema_nome=arch-neural, leis, modos, e TODO o resto do treino.
Uso: python limpar_identidade.py [arquivo.json ...]   (padrao: V15 e V15.1)
"""
import json, sys, os, shutil
ALVOS = ["douglas", "nerael"]
CAMPOS_REGISTRO = ('"tokens"','"_texto_completo"','"texto_completo"','"input"','"exemplos"')
def tem_alvo(txt):
    t = txt.lower()
    return any(a in t for a in ALVOS)
def scrub(obj):
    if isinstance(obj, dict):
        novo = {}
        for k, v in obj.items():
            if isinstance(k, str) and k.lower() in ALVOS: continue
            if isinstance(v, str) and tem_alvo(v): novo[k] = ""
            else: novo[k] = scrub(v)
        return novo
    if isinstance(obj, list):
        out = []
        for it in obj:
            if isinstance(it, str) and tem_alvo(it): continue
            if isinstance(it, dict):
                blob = json.dumps(it, ensure_ascii=False).lower()
                if tem_alvo(blob) and any(c in blob for c in CAMPOS_REGISTRO): continue
            out.append(scrub(it))
        return out
    return obj
def ntext(n):
    return str(n.get("text") or n.get("texto") or n.get("palavra") or n.get("label") or "").lower()
def limpar(arquivo):
    if not os.path.exists(arquivo):
        print(f"  . pulando (nao existe): {arquivo}"); return
    print(f"\n=== {arquivo} ===")
    with open(arquivo, encoding="utf-8") as f: j = json.load(f)
    bak = arquivo + ".bak_identidade"
    if not os.path.exists(bak):
        shutil.copy2(arquivo, bak); print(f"  backup: {bak}")
    n0, e0, ev0 = len(j.get("nodes", [])), len(j.get("edges", [])), len(j.get("eventos", []))
    ids_remover = set(n.get("id") for n in j.get("nodes", []) if isinstance(n, dict) and ntext(n) in ALVOS)
    print(f"  nos-palavra removidos: {sorted(ids_remover) or '(nenhum)'}")
    nodes_limpos = [scrub(n) for n in j.get("nodes", []) if n.get("id") not in ids_remover]
    edges_limpas = [e for e in j.get("edges", []) if e.get("from") not in ids_remover and e.get("to") not in ids_remover]
    for key in list(j.keys()):
        if key in ("nodes", "edges"): continue
        j[key] = scrub(j[key])
    j["nodes"] = nodes_limpos
    j["edges"] = edges_limpas
    j.setdefault("self_core", {})
    for campo in ("criador", "user", "nome", "genero"):
        j["self_core"][campo] = []
    ids = set(n.get("id") for n in j["nodes"])
    orf = [e.get("id") for e in j["edges"] if e.get("from") not in ids or e.get("to") not in ids]
    if orf:
        print(f"  ABORTADO: {len(orf)} arestas orfas - nada salvo. (backup intacto)"); return
    blob = json.dumps(j, ensure_ascii=False).lower()
    print(f"  nos {n0}->{len(j['nodes'])} | arestas {e0}->{len(j['edges'])} | eventos {ev0}->{len(j['eventos'])}")
    print(f"  integridade: OK (0 arestas orfas)")
    for a in ALVOS: print(f"  ocorrencias de '{a}': {blob.count(a)}")
    with open(arquivo, "w", encoding="utf-8") as f: json.dump(j, f, ensure_ascii=False)
    print("  salvo OK")
if __name__ == "__main__":
    for a in (sys.argv[1:] or ["cerebro_V15.json", "cerebro_V15.1.json"]): limpar(a)
    print("\nPronto. Recarregue o app (Ctrl+Shift+R). A IA comeca sem nome e sem saber o user,")
    print("e aprende os dois quando voce ensinar.")
