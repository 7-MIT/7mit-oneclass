#!/usr/bin/env python3
"""Ganti palet biru/slate portal lama menjadi palet design.7mit (marun, krem, abu hangat) secara sistematis.
Dipanggil oleh build.py untuk setiap ruang kerja. Kontras dijaga: terang tetap terang, gelap tetap gelap."""
import colorsys, re

# Jangkar eksplisit (warna kunci portal lama -> token design.7mit)
ANCHOR = {
 '#2563eb': '#7a1424',  # maroon (aksen utama)
 '#1d4ed8': '#5f0f1c',  # maroon-hover
 '#1e40af': '#4a0d17',
 '#3b82f6': '#8b1731',
 '#22a6e8': '#a01d2d',  # banner-1 (aksen kedua)
 '#0ea5e9': '#a01d2d',
 '#38bdf8': '#e9b8a0',  # peach: aksen terang untuk latar gelap
 '#60a5fa': '#ffb59a',  # focus-ring dark
 '#93c5fd': '#f6d7c4',  # banner-label
 '#bfdbfe': '#f3e3d6',  # maroon-soft light
 '#dbeafe': '#f3e3d6',
 '#eff6ff': '#f9efe8',
 '#eef2ff': '#f9efe8',
 '#4f46e5': '#8b1731', '#6366f1': '#a01d2d', '#7c3aed': '#8b1731', '#6d28d9': '#7a1424', '#818cf8': '#e9b8a0', '#a78bfa': '#e9b8a0',
 '#111827': '#2a0a10', '#0f172a': '#2a0a10', '#172033': '#2a0a10', '#17233a': '#2a0a10', '#020617': '#1f060b', '#1e293b': '#3d2a2f',
 '#64748b': '#6f6467', '#667085': '#6f6467', '#475569': '#5a4e52', '#334155': '#3d2a2f', '#94a3b8': '#a8999d',
 '#cbd5e1': '#d9ccc6', '#e2e8f0': '#eadfd8', '#e3e8f0': '#eadfd8', '#dbe3ec': '#eadfd8', '#dce4ed': '#eadfd8',
 '#f8fafc': '#f7f2ec', '#f1f5f9': '#f3ede6', '#f3f6fb': '#fbf8f4',
 # gelap (tema Marun)
 '#07101f': '#3a0a12', '#0d192b': '#4a0e18', '#111f33': '#55101b', '#17263c': '#631622', '#101e31': '#3f0b14',
 '#edf4ff': '#fff4ee', '#9fb0c8': '#e8c9bd',
}
RGB = [  # (r,g,b lama) -> (r,g,b baru)
 ('37,99,235', '122,20,36'), ('34,166,232', '160,29,45'), ('56,189,248', '233,184,160'), ('99,102,241', '160,29,45'),
 ('79,70,229', '139,23,49'), ('124,58,237', '139,23,49'), ('15,23,42', '42,10,16'), ('17,24,39', '42,10,16'),
 ('148,163,184', '168,153,157'), ('15,29,49', '58,10,18'), ('2,8,23', '31,6,11'), ('120,130,160', '168,153,157'),
 ('129,140,248', '233,184,160'), ('59,130,246', '139,23,49'), ('30,41,59', '61,42,47'),
]

def hexrgb(h): h = h.lstrip('#'); return [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
def tohex(r, g, b): return '#%02x%02x%02x' % tuple(max(0, min(255, round(v * 255))) for v in (r, g, b))

def generic(hexv):
    r, g, b = hexrgb(hexv)
    h, l, s = colorsys.rgb_to_hls(r, g, b); deg = h * 360
    if not (190 <= deg <= 292) or s < 0.07: return hexv       # bukan keluarga biru/slate/ungu: biarkan (hijau, merah, kuning tetap)
    if s >= 0.45 and 0.25 <= l <= 0.7:                          # biru/ungu merek
        return tohex(*colorsys.hls_to_rgb(352/360, l * 0.58 if l <= 0.6 else min(0.78, l), 0.7))
    if l >= 0.88: return tohex(*colorsys.hls_to_rgb(24/360, l, 0.30))     # tint sangat terang -> krem hangat
    if l >= 0.35: return tohex(*colorsys.hls_to_rgb(8/360, l, 0.10))      # abu menengah -> abu hangat
    return tohex(*colorsys.hls_to_rgb(352/360, min(0.3, l * 1.15), 0.55))  # gelap/navy -> marun gelap

def map_hex(m):
    v = m.group(0).lower()
    return ANCHOR.get(v) or generic(v)

HEX6 = re.compile(r'#[0-9a-fA-F]{6}\b')
def retheme(text):
    text = HEX6.sub(map_hex, text)
    for old, new in RGB:
        text = re.sub(r'(?<![\d.])' + re.escape(old).replace(',', r'\s*,\s*') + r'(?![\d])', new, text)
    return text
