# OneClass.7MIT

Satu portal untuk siswa, guru, dan pengurus 7 MIT. Menggantikan tiga portal terpisah
(`Portal-Siswa`, `Portal-Guru`, `Portal-Pengurus`), memakai akun dan peran di **server.7mit**,
sistem desain **design.7mit**, dan lapisan pemeriksaan **TrustLayer** (trustlayer.7mit.org).

## Cara kerja

| Alamat | Isi |
| --- | --- |
| `/` | Halaman masuk OneClass (akun.7mit atau Google). Jika satu username punya beberapa akun, pengguna memilih peran. |
| `/app/student/`, `/app/guru/`, `/app/pengurus/` | Ruang kerja sesuai tipe akun dari server. Akun siswa tidak bisa membuka ruang kerja lain: sesi tipe lain dikembalikan ke `/`. |
| `/auth/callback` | Callback Sign in with Google. |
| `/trustlayer/` | Laporan TrustLayer untuk pengelola (Presiden, Wakil Presiden, Service Account, Akun Resmi). |
| `/invoice/[nomor-struk]` | Invoice publik (hanya pembayaran yang sudah lunas). |

Server tetap yang menegakkan izin. Antarmuka hanya menampilkan sesuai peran.

## Satu sumber kode

Kode ruang kerja ada di **satu berkas**, `src/oneclass.src.html`. Bagian yang berbeda antarperan dibungkus blok:

```
@@oc[student]      …teks siswa…
@@oc[guru]         …teks guru…
@@oc[pengurus]     …teks pengurus…
@@oc[/]
```

`tools/build.py` membaca blok itu dan menulis satu berkas per peran ke `public/app/<peran>/index.html`,
lalu menambahkan penjaga sesi, penanda mode, dan klien TrustLayer. Hasil build ikut di-commit,
jadi Cloudflare tidak butuh langkah build.

```
python3 tools/build.py        # bangun ulang public/app/*, public/assets/*, halaman masuk/callback/trustlayer
python3 tools/design_css.py   # hanya CSS design.7mit (dipanggil build.py)
```

`tools/merge.py` dipakai sekali untuk menggabungkan tiga portal lama menjadi sumber ini. Hasil build per peran
terbukti identik dengan berkas portal asalnya sebelum tambalan OneClass diterapkan.

## TrustLayer (server.7mit)

Tabel: `kelas7mit_trustlayer_rules`, `_events`, `_runs`, `_config`, `_endpoints` (kolom biasa, tanpa JSON).
Fungsi server: `trustlayer-api` (edge function). Empat fungsi sesuai rancangan:

1. **Hak akses**: antarmuka melaporkan apa yang ditampilkan; server membandingkan dengan matriks aturan (peran + milik sendiri/orang lain) memakai akun sebenarnya, bukan klaim klien.
2. **Konsistensi data**: nama akun vs daftar siswa, username ganda satu tipe, nama dan status tagihan iuran vs pembayaran.
3. **Konfigurasi**: versi aplikasi (`app_version` di tabel config), mode vs tipe akun, tipe akun yang dikenal, kesehatan tiap edge function.
4. **Pencatatan**: lima jenis catatan (berhasil, akses tak sesuai, beda data, beda konfigurasi, koneksi gagal) dengan status terbuka/selesai.

Mengubah aturan: ubah baris di `kelas7mit_trustlayer_rules`. Menaikkan versi aplikasi: ubah `APP_VERSION` di `tools/build.py` **dan** baris `app_version` di `kelas7mit_trustlayer_config`.

## Deploy

Cloudflare Workers (aset + `worker.js`): `npx wrangler deploy`. `worker.js` memaksa HTTPS, memasang HSTS, dan menyajikan `/invoice/*`.
Daftarkan `https://<domain-oneclass>/auth/callback` di Supabase → Authentication → URL Configuration → Redirect URLs agar Sign in with Google berfungsi.
