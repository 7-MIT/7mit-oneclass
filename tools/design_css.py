#!/usr/bin/env python3
"""Hasilkan public/assets/design.7mit.css dari design/tokens.json + design/bundle.css (sistem desain design.7mit)."""
import json, re
t = json.load(open('design/tokens.json'))
themes = [x['id'] for x in t['color']['themes']]
def val(v, th): return v if isinstance(v, str) else v.get(th, v[themes[0]])
def col(v, th):
    x = val(v, th); m = re.fullmatch(r'\{(.+)\}', x); return 'var(--%s)' % m.group(1) if m else x
def block(th):
    return ''.join('--%s:%s;' % (c['name'], col(c['value'], th)) for c in t['color']['tokens']) + \
           ''.join('--%s:%s;' % (c['name'], val(c['value'], th)) for c in t['shadow']['tokens'])
light, dark = themes[0], themes[1]
css = '/* design.7mit — dihasilkan dari design/tokens.json (tools/design_css.py). Jangan diedit langsung. */\n'
css += ':root,[data-theme="%s"]{color-scheme:light;%s}\n' % (light, block(light))
css += '@media (prefers-color-scheme: dark){:root:not([data-theme="%s"]){color-scheme:dark;%s}}\n' % (light, block(dark))
css += '[data-theme="%s"]{color-scheme:dark;%s}\n' % (dark, block(dark))
css += ':root{%s--font-display:%s;--font-sans:%s;}\n' % (
    ''.join('--%s:%s;' % (c['name'], c['value']) for f in ('spacing', 'radius') for c in t[f]['tokens']),
    t['type']['families']['display'], t['type']['families']['sans'])
bundle = open('design/bundle.css').read()
imp = re.match(r'@import url\([^)]*\);\s*', bundle)
css = (imp.group(0) if imp else '') + css + bundle[imp.end():] if imp else css + bundle
open('public/assets/design.7mit.css', 'w').write(css)
print('design.7mit.css', len(css))
