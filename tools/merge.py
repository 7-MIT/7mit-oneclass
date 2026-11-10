#!/usr/bin/env python3
"""Sekali jalan: gabungkan index.html Portal Siswa, Guru, Pengurus menjadi satu sumber src/oneclass.src.html.
Bagian yang sama ditulis sekali; bagian yang berbeda dibungkus blok per peran:
    @@oc[student]   ...teks siswa...
    @@oc[guru]      ...teks guru...
    @@oc[pengurus]  ...teks pengurus...
    @@oc[/]
tools/build.py membaca blok itu dan menghasilkan satu berkas per peran."""
import difflib, sys
SRC = {'student': sys.argv[1], 'guru': sys.argv[2], 'pengurus': sys.argv[3]}
OUT = sys.argv[4]
L = {k: open(v, encoding='utf8').read().split('\n') for k, v in SRC.items()}
P = L['pengurus']
def ops(v): return [o for o in difflib.SequenceMatcher(None, P, L[v], autojunk=False).get_opcodes()]
OP = {'student': ops('student'), 'guru': ops('guru')}
iv = []
for v, o in OP.items():
    for tag, i1, i2, j1, j2 in o:
        if tag != 'equal': iv.append((i1, i2))
iv.sort()
groups = []
for a, b in iv:
    if groups and a <= groups[-1][1]:
        groups[-1][1] = max(groups[-1][1], b)
    else:
        groups.append([a, b])
def before(o, a):
    c = []
    for tag, i1, i2, j1, j2 in o:
        if tag == 'equal':
            if i1 <= a <= i2: c.append(j1 + a - i1)
        elif i1 == a: c.append(j1)
        elif i1 < a < i2: raise SystemExit('boundary inside change')
        elif i2 == a: c.append(j2)
    return min(c)
def after(o, b):
    c = []
    for tag, i1, i2, j1, j2 in o:
        if tag == 'equal':
            if i1 <= b <= i2: c.append(j1 + b - i1)
        elif i2 == b: c.append(j2)
        elif i1 < b < i2: raise SystemExit('boundary inside change')
        elif i1 == b: c.append(j1)
    return max(c)
out = []; pos = 0; nblocks = 0
for a, b in groups:
    out += P[pos:a]
    t = {'pengurus': P[a:b]}
    for v in ('student', 'guru'):
        t[v] = L[v][before(OP[v], a):after(OP[v], b)]
    # kelompokkan varian bersama yang teksnya sama
    seen = []
    for v in ('student', 'guru', 'pengurus'):
        for g in seen:
            if g[1] == t[v]: g[0].append(v); break
        else: seen.append([[v], t[v]])
    for vs, txt in seen:
        out.append('@@oc[' + ','.join(vs) + ']'); out += txt
    out.append('@@oc[/]'); nblocks += 1
    pos = b
out += P[pos:]
assert not any(l.startswith('@@oc') for l in P + L['student'] + L['guru'])
open(OUT, 'w', encoding='utf8').write('\n'.join(out))
print('blok per-peran:', nblocks, 'baris:', len(out))
