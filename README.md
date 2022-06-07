# Dokuementasi API Met4Kantin

## Anggota Kelompok 8 - Pemrograman Integratif A

1. Rayhan Kurnia Alunantara Wijaya (5027201030)
2. Abadila Barasmana (5027201052)
3. Banabil Fawazaim Muhammad (5027201055)

> note: bila ada masalah, bisa pc abad di line/discord

## Fitur-Fitur Utama Met4Kantin

- Register
- Login
- Topup
- Pembayaran

## Base URL

`https://met4kantin.herokuapp.com/`
Method | End-Point | Autorisasi | Deskripsi
--- | --- | --- | ---
`GET` | /api/profile | YES | Mendapatkan data profil seorang user. jika yang mengakses adalah admin, maka mengakses semua data profil user
`POST` | /api/profile | NO | register akun
`POST` | /api/login | NO | Login Akun
`PUT` |  /api/profile/:user | YES | Top up ke user
`GET` | /api/history/topup | YES | Mendapatakan histori top up 
`PUT` | /api/pay | YES | Melakukan pembayaran

## Demonstrasi Penggunaan Endpoint

### Menampilkan profil user

Contoh

```
GET https://met4kantin.herokuapp.com/api/profile
Authorization: bearer token

```

Hasil

```json
{
  "status": 200,
  "message": 'User data',
  "data": {
    "name": "dummy",
    "pass": "dummybot",
    "email": "dummy@bot.com",
    "role": "bot",
    "cash": 404,
    "uid": "123ABCabc_ABC123",
  }
}
```

### Registrasi

Contoh

```
POST https://met4kantin.herokuapp.com/api/profile
Authorization: -

{
  "name":"dummy"
  "pass":"dummybot"
  "email":"dummy@bot.com"
}
```

Hasil

```json
{
  status: 200,
  message: 'Pendaftaran berhasil',
},
```

### Login

Contoh

```
POST https://met4kantin.herokuapp.com/api/login
Authorization: -

{
    "email": "dummy@bot.com",
    "pass": "dummybot"
}
```

Hasil

```json
{
    "status" : 200, 
    "jwt": TOKEN
}
```

### Top up User

Contoh

```
PUT https://met4kantin.herokuapp.com/api/profile/:user
Authorization: bearer token

{
  "jumlah": 690000
}
```

Hasil

```json
{
  status: 200,
  message: 'Topup berhasil',
}
```

### Mendapatkan Histori Top up

Contoh

```
GET https://met4kantin.herokuapp.com/api/history/topup

Authorization: bearer token
```

Hasil

```json
{
  status: 200,
  message: 'Histori topup',
  data: [{
     "uid": "123ABCabc_ABC123",
     "name": "dummy",
     "jumlah": 69000,
     "waktu": "23:23:23",
     "tanggal": "2022-6-5"
  }]
}
```
