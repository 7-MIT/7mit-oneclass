#!/usr/bin/env python3
"""Bangun OneClass.7MIT: satu sumber (src/oneclass.src.html) -> ruang kerja per peran + halaman masuk, callback, TrustLayer.
Jalankan dari akar repo:  python3 tools/build.py"""
import os, re, shutil, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
APP_VERSION = '1.0.0'
MODES = {'student': 'Siswa', 'guru': 'Guru', 'pengurus': 'Pengurus'}

def build_mode(src, mode):
    out, active = [], True
    for line in src.split('\n'):
        if line.startswith('@@oc['):
            tag = line[5:line.index(']')]
            if tag == '/': active = True
            else: active = mode in tag.split(',')
            continue
        if active: out.append(line)
    return '\n'.join(out)

def sub1(pattern, repl, text, what, flags=0):
    new, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1: sys.exit('Tambalan gagal (%s) untuk pola: %s' % (what, pattern))
    return new

def patch(html, mode):
    label = MODES[mode]
    # 1. alamat rumah = halaman masuk OneClass di domain yang sama
    html = sub1(r'const PORTAL_HOME_URL="https://[a-z]+\.7mit\.org";', 'const PORTAL_HOME_URL=location.origin+"/";', html, 'PORTAL_HOME_URL')
    # 2. tanpa sesi / sesi tak sesuai: kembali ke halaman masuk OneClass (bukan gerbang lama)
    html = sub1(r'function showPortalLoginPage\(\)\{', 'function showPortalLoginPage(){\n    try{location.replace("/")}catch(error){}', html, 'showPortalLoginPage')
    # 2b. jalur /app/<peran>/ dipertahankan (aplikasi lama menimpa alamat menjadi "/")
    html = sub1(r'history\.replaceState\(\{\.\.\.\(history\.state\|\|\{\}\),account\},"","/"\)', 'history.replaceState({...(history.state||{}),account},"",location.pathname)', html, 'replaceState account')
    html = sub1(r'try\{if\(portalPathNoSlash\(\)!=="/"\)history\.replaceState\(history\.state\|\|\{\},"","/"\)\}catch\(error\)\{\}', '/* OneClass: jalur ruang kerja dipertahankan */', html, 'replaceState path')
    # 3. judul
    html = sub1(r'<title>[^<]*</title>', '<title>OneClass.7MIT · %s</title>' % label, html, 'title')
    # 4. penjaga awal + penanda mode (sebelum skrip lain berjalan)
    guard = ('<script>window.K7_ONECLASS={mode:"%s",version:"%s"};(function(){try{var v=JSON.parse(localStorage.getItem("kelas7mit_persistent_account_session_v1")||"null");'
             'var ok=v&&/^[0-9a-f-]{36}$/i.test(String(v.token||""))&&v.profile&&v.profile.account_type==="%s";'
             'if(!ok){location.replace("/");}}catch(e){location.replace("/")}})();</script>') % (mode, APP_VERSION, mode)
    html = sub1(r'(<meta charset="utf-8">)', lambda m: m.group(1) + '\n' + guard, html, 'meta charset', re.I)
    # 5. TrustLayer: konfigurasi, sesi bersama, dan klien pemeriksa
    tail = ('<script src="/assets/config.js"></script>\n<script src="/assets/oneclass-session.js"></script>\n'
            '<script src="/trustlayer/client.js" defer></script>\n')
    i = html.rindex('</body>')
    return html[:i] + tail + html[i:]

def main():
    src = open('src/oneclass.src.html', encoding='utf8').read()
    anon = None
    for mode in MODES:
        html = build_mode(src, mode)
        if anon is None:
            anon = re.search(r'SUPABASE_ANON_KEY="([^"]+)"', html).group(1)
            url = re.search(r'SUPABASE_URL="([^"]+)"', html)
            supa = url.group(1) if url else 'https://lajzrempjyoqkubkumhb.supabase.co'
        out = patch(html, mode)
        d = 'public/app/%s' % mode
        os.makedirs(d, exist_ok=True)
        open(d + '/index.html', 'w', encoding='utf8').write(out)
        print('app/%s' % mode, len(out))
    os.makedirs('public/assets', exist_ok=True)
    open('public/assets/config.js', 'w', encoding='utf8').write(
        'window.ONECLASS_CONFIG={appVersion:"%s",supabaseUrl:"%s",functionsUrl:"%s/functions/v1",anonKey:"%s"};\n' % (APP_VERSION, supa, supa, anon))
    for src_page, dst in (('shell.html', 'public/index.html'), ('callback.html', 'public/auth/callback/index.html'), ('trustlayer.html', 'public/trustlayer/index.html')):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile('src/pages/' + src_page, dst)
    os.system('python3 tools/design_css.py')

if __name__ == '__main__':
    main()
