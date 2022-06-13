const verifyToken = require('../auth/verify');
const verifyKey = require('../auth/newVerify');

const jwt = require('jsonwebtoken');
const express = require('express');
const {nanoid} = require('nanoid');
// const pool = require('../db');
// semua var pool ubah je client
// const db = require('../db');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const axios = require('axios');
const moment = require('moment');
const client = require('../db/connection.js');
const config = require('../config');


router.use(jsonParser);

router.get('/', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile('/app/html/index.html');
});

router.get('/register', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile('/app/html/register.html');
});

router.get('/login', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile('/app/html/login.html');
});

router.get('/kantin', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile('/app/html/metakantin.html');
});

// nampilin semua pengguna
// all json
router.get('/api/profile', verifyToken, (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.role === 'admin') {
      client.query('SELECT * FROM mk_pengguna', (error, result) => {
        if (result.rowCount > 0) {
          res.setHeader('Content-Type', 'application/json');
          res.status(200);
          return res.json({
            status: 200,
            message: 'Semua user',
            data: result.rows,
          });
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res.json({
          status: 400,
          message: 'Belum ada yang mendaftar',
          data: [],
        });
      });
    } else {
      client.query(
          'SELECT * FROM mk_pengguna WHERE uid = $1',
          [req.uid],
          (error, result) => {
            // console.log(result);
            if (result.rowCount > 0) {
              const myname = result.rows[0].name;
              const myemail = result.rows[0].email;
              const mypass = result.rows[0].pass;
              const myrole = result.rows[0].role;
              const mycash = result.rows[0].cash;
              const myuid = result.rows[0].uid;
              res.setHeader('Content-Type', 'application/json');
              res.status(200);
              return res.json({
                status: 200,
                message: 'User data',
                data: {
                  name: myname,
                  pass: mypass,
                  email: myemail,
                  role: myrole,
                  cash: mycash,
                  uid: myuid,
                },
              });
            }
            res.setHeader('Content-Type', 'application/json');
            res.status(400);
            return res.json({
              status: 400,
              message: 'Tidak ada user',
            });
          },
      );
    }
  } catch (error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res.json({
      status: 500,
      message: 'Server error',
    });
  }

  // res.json({test: "Selamat Datang!"});
});
// Daftar pengguna
router.post('/api/profile', async (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!req.body.name || req.body.name.length < 3) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .json(
              {
                status: 400,
                message: 'Nama harus lebih dari 3 huruf',
              },
          );
    }
    if (!req.body.pass || req.body.pass.length < 3) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .json(
              {
                status: 400,
                message: 'Password harus lebih dari 3 huruf',
              },
          );
    }
    if (!req.body.email || !req.body.email.includes('@')) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .json(
              {
                status: 400,
                message: 'Email tidak valid',
              },
          );
    }

    client.query(
        'SELECT EXISTS (SELECT name FROM mk_pengguna WHERE name = $1)',
        [req.body.name],
        (error, result) => {
          if (result.rows[0].exists === true) {
            res.setHeader('Content-Type', 'application/json');
            res.status(400);
            return res
                .json(
                    {
                      status: 400,
                      message: 'Name telah terdaftar',
                    },
                );
          }
          const uid = nanoid(16);
          client.query(
              'INSERT INTO MK_pengguna(uid, name, pass, email, role, cash) VALUES ($1, $2, $3, $4, \'user\', 10000)',
              [uid, req.body.name, req.body.pass, req.body.email],
              (error, result) => {
                if (result.rowCount !== 0) {
                  res.setHeader('Content-Type', 'application/json');
                  res.status(200);
                  return res
                      .json(
                          {
                            status: 200,
                            message: 'Pendaftaran berhasil',
                          },
                      );
                }
              },
          );
        },
    );
  } catch (error) {
    // console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .json(
            {
              status: 500,
              message: 'Server error',
            },
        );
  }
});
// login
router.post('/api/login', async (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!req.body.pass || req.body.pass.length < 3) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .json(
              {
                status: 400,
                message: 'Password harus lebih dari 3 huruf',
              },
          );
    }
    if (!req.body.email || !req.body.email.includes('@')) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .json(
              {
                status: 400,
                message: 'Email tidak valid',
              },
          );
    }

    client.query(
        'SELECT * FROM mk_pengguna WHERE email = $1 AND pass = $2',
        [req.body.email, req.body.pass],
        (error, result) => {
          if (result.rowCount > 0) {
          // console.log(result.rows[0])
            const myid = result.rows[0].id;
            const myname = result.rows[0].name;
            const myemail = result.rows[0].email;
            const myrole = result.rows[0].role;
            const mycash = result.rows[0].cash;
            const myuid = result.rows[0].uid;
            const token = jwt.sign(
                {
                  id: myid,
                  name: myname,
                  email: myemail,
                  role: myrole,
                  cash: mycash,
                  uid: myuid,
                },
                config.secret,
                {expiresIn: 86400},
            );
            res.setHeader('Content-Type', 'application/json');
            res.status(200);
            return res
                .json(
                    {
                      status: 200,
                      jwt: token,
                    },
                );
          }
          res.setHeader('Content-Type', 'application/json');
          res.status(400);
          return res
              .json(
                  {
                    status: 400,
                    message: 'User tidak ada, password salah atau belum mendaftar',
                  },
              );
        },
    );
  } catch (error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .json(
            {
              status: 500,
              message: 'Server error',
            },
        );
  }
});

// topup
router.put('/api/profile/:user', verifyToken, async (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.body.jumlah < 1000) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .json(
              {
                status: 400,
                message: 'Topup harus di atas 1000',
              },
          );
    }

    const {user} = req.params;
    client.query(
        'UPDATE mk_pengguna SET cash = cash + $1 WHERE uid = $2',
        [req.body.jumlah, req.uid],
        (error, result) => {
          if (result.rowCount > 0) {
            const todayDate = moment(new Date()).format('YYYY-MM-DD');
            const todayTime = moment(new Date()).format('HH:mm:ss');
            client.query(
                'INSERT INTO mk_histori_topup(uid, name, jumlah, waktu, tanggal) VALUES($1, $2, $3, $4, $5)',
                [user, req.name, req.body.jumlah, todayTime, todayDate],
            );
            res.setHeader('Content-Type', 'application/json');
            res.status(200);
            return res
                .json(
                    {
                      status: 200,
                      message: 'Topup berhasil',
                    },
                );
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.status(400);
            return res
                .json(
                    {
                      status: 400,
                      message: 'Gagal topup',
                    },
                );
          }
        },
    );
  } catch (error) {
    conslo/log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .json(
            {
              status: 500,
              message: 'Server error',
            },
        );
  }
});
// topup history
router.get('/api/history/topup', verifyToken, async (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    client.query('SELECT uid, name, jumlah, waktu, tanggal FROM mk_histori_topup WHERE uid = $1', [req.uid], (error, result) => {
      if (result.rowCount > 0) {
        res.status(200);
        return res
            .json(
                {
                  status: 200,
                  message: 'Histori topup',
                  data: result.rows,
                },
            );
      } else {
        res.status(400);
        return res
            .json(
                {
                  status: 400,
                  message: 'User ini belum pernah melakukan topup',
                  data: [],
                },
            );
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    return res
        .json(
            {
              status: 500,
              message: 'Server error',
            },
        );
  }
});

// menampilkan menu toko
router.get('/api/foods', async (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    client.query('SELECT nama, kategori, harga, fuid FROM mk_makanan', (error, result) => {
      if (result.rowCount > 0) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        return res.json({
          status: 200,
          message: 'List makanan',
          data: result.rows,
        });
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res.json({
          status: 400,
          message: 'Tidak ada kantin',
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .json(
            {
              status: 500,
              message: 'Server error',
            },
        );
  }
});
router.get('/api/foods/:category', async (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const {category} = req.params;
    client.query('SELECT * FROM mk_makanan WHERE kategori = $1;', [category], (error, result) => {
      if (result.rowCount > 0) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        return res.json({
          status: 200,
          message: 'List makanan berdasarkan kategori',
          data: result.rows,
        });
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res.json({
          status: 400,
          message: 'Tidak ada makanan dengan kategori itu',
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .json(
            {
              status: 500,
              message: 'Server error',
            },
        );
  }
});
router.get('/api/foods/buy/:uid', (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const {uid} = req.params;
    client.query('SELECT nama, kategori, harga, fuid FROM mk_makanan WHERE fuid = $1', [uid], (errror, result) => {
      if (result.rowCount > 0) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        return res
            .json(
                {
                  status: 200,
                  message: 'Deskripsi makanan',
                  data: result.rows[0],
                },
            );
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res
            .json(
                {
                  status: 400,
                  message: 'Makanan tidak ditemukan',
                },
            );
      }
    });
  } catch (error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .json(
            {
              status: 500,
              message: 'Server error',
            },
        );
  }
});
// membeli makanan
// router.post('/api/pembelian')

// bayar menggunakan metamoney
router.put('/api/pay', verifyToken, (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const jumlah = req.body.jumlah;
    if (jumlah <= 0) {
      res.status(400);
      return res.json({
        status: 400,
        message: 'Tidak boleh bernilai 0 atau negatif',
      });
    };
    console.log(jumlah);
    client.query('SELECT cash FROM mk_pengguna WHERE uid = $1', [req.uid], (error, result) => {
      if (result.rowCount > 0) {
        if (result.rows[0]['cash'] < jumlah) {
          res.status(400);
          return res.json({
            status: 400,
            message: 'Uang anda tidak cukup',
          });
        } else {
          client.query('UPDATE mk_pengguna SET cash = cash - $1 WHERE uid = $2', [jumlah, req.uid], (error, result) => {
            if (result.rowCount > 0) {
              const todayDate = moment(new Date()).format('YYYY-MM-DD');
              const todayTime = moment(new Date()).format('HH:mm:ss');
              // console.log(req.uid, req.name, jumlah, todayDate, todayTime);
              client.query(
                  "INSERT INTO mk_histori_bayar(uid, name, jumlah, waktu, tanggal, metode) VALUES($1, $2, $3, $4, $5, 'metamoney')",
                  [req.uid, req.name, jumlah, todayTime, todayDate],
              );
              res.setHeader('Content-Type', 'application/json');
              res.status(200);
              return res
                  .json(
                      {
                        status: 200,
                        message: 'Pembayaran berhasil',
                      },
                  );
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.status(400);
              return res
                  .json(
                      {
                        status: 400,
                        message: 'Gagal bayar',
                      },
                  );
            }
          });
        }
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res.json({
          status: 400,
          message: 'User tidak ditemukan',
        });
      }
    });
    client.end;
  } catch (error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .json(
            {
              status: 500,
              message: 'Server error',
            },
        );
  }
});
// api pilih emoney langsung bayar
router.post('/api/transaksi', verifyToken, async (req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const {fuid, wallet, harga} = req.body;
    client.query('SELECT * FROM mk_makanan WHERE fuid = $1', [fuid], (error, result) => {
      // console.log(result.rows);
      if (result.rowCount <= 0) {
        res.status(400);
        return res.json({
          status: 400,
          message: 'Makanan tidak ditemukan',
        });
      } else {
        if (wallet === 'metamoney') {
          const token = req.headers.authorization;
          const config = {
            headers: {Authorization: token},
          };
          const payload = {
            jumlah: harga,
          };
          axios
              .put('https://met4kantin.herokuapp.com/api/pay', payload, config)
              .then((ress) => {
                // return res.send(ress.data);
                // kalau pembayaran berhasil
                if (ress.data.status === 200) {
                  return res.json({
                    status: 200,
                    message: 'Pembayaran metamoney berhasil',
                  });
                  // lakukan query disini
                }
              })
              .catch((error) => {
                res.setHeader('Content-Type', 'application/json');
                res.status(400);
                return res.send(error.response.data);
              });
        } else if (wallet === 'otakupay') {
          axios
              .post('https://opay-v2.herokuapp.com/auth/login', {
                username: 'abad',
                password: 'abadabad',
              })
              .then((ress) => {
                otakupayToken = ress.data.token;
                console.log(otakupayToken);
                const config = {
                  headers: {Authorization: `Bearer ${otakupayToken}`},
                };
                const payload = {
                  price: harga,
                };
                axios
                    .post('https://opay-v2.herokuapp.com/user/payment', payload, config)
                    .then((riss) => {
                      // res.send(riss.data);
                      // kalau pembarana berhasil
                      if (riss.data.msg === 'Payment Success') {
                        const todayDate = moment(new Date()).format('YYYY-MM-DD');
                        const todayTime = moment(new Date()).format('HH:mm:ss');
                        // console.log(req.uid, req.name, jumlah, todayDate, todayTime);
                        client.query(
                            "INSERT INTO mk_histori_bayar(uid, name, jumlah, waktu, tanggal, metode) VALUES($1, $2, $3, $4, $5, 'otakupay')",
                            [req.uid, req.name, harga, todayTime, todayDate],
                        );
                        res.status(200);
                        return res.json({
                          status: 200,
                          message: 'Pembayaran otakupay berhasil',
                        });
                        // lakukan query disini
                      }
                    })
                    .catch((error) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.status(400);
                      return res.send(error.response.data);
                    });
                // res.cookie('harpay', ress.data.token);
                // return res.send(ress.data);
              })
              .catch((error) => {
                res.setHeader('Content-Type', 'application/json');
                res.status(400);
                return res.send(error.response.data);
              });
        } else if (wallet === 'ecia') {
          // dapatin jwt
          axios
              .post('https://api-ecia.herokuapp.com/api/login', {
                email: 'abad@mail.com',
                pass: 'abadabad',
              })
              .then((ress) => {
                // dapatin info
                aciaToken = ress.data.token;
                const config = {
                  headers: {Authorization: `Bearer ${aciaToken}`},
                };
                axios
                    .get('https://api-ecia.herokuapp.com/api/profile', config)
                    .then((rass) => {
                      // return res.send(rass.data);
                      // lakukan pembelian barang
                      const idEcia = rass.data.id_user;
                      const walletEcia = rass.data.nomor_wallet;
                      const payloadBeli = {
                        id_user: idEcia,
                        nama_barang: result.rows[0]['nama'],
                        harga: harga,
                        nomor_wallet: walletEcia,
                      };
                      axios
                          .post('https://api-ecia.herokuapp.com/api/pembelian', payloadBeli, config)
                          .then((riss) => {
                            // return res.send(riss.data);
                            // melakukan pembayaran akhir dari pembayaran sebelumnya
                            const idBarang = riss.data.id_pemesanan;
                            const payloadBayar = {
                              jumlah: harga,
                              nomor_wallet_client: walletEcia,
                              referensi: idBarang,
                            };
                            axios
                                .post('https://api-ecia.herokuapp.com/api/transaksi', payloadBayar, config)
                                .then((ross) => {
                                  // final
                                  // return res.send(ross);
                                  if (ross.data.status == 200) {
                                    const todayDate = moment(new Date()).format('YYYY-MM-DD');
                                    const todayTime = moment(new Date()).format('HH:mm:ss');
                                    // console.log(req.uid, req.name, jumlah, todayDate, todayTime);
                                    client.query(
                                        "INSERT INTO mk_histori_bayar(uid, name, jumlah, waktu, tanggal, metode) VALUES($1, $2, $3, $4, $5, 'ecia')",
                                        [req.uid, req.name, harga, todayTime, todayDate],
                                    );
                                    res.status(200);
                                    return res.json({
                                      status: 200,
                                      message: 'Pembayaran ecia berhasil',
                                    });
                                  }
                                })
                                .catch((error) => {
                                  // res.setHeader('Content-Type', 'application/json');
                                  // res.status(400);
                                  // return res.send(error.response.data);
                                  console.log(error);
                                });
                          })
                          .catch((error) => {
                            // res.setHeader('Content-Type', 'application/json');
                            // res.status(400);
                            // return res.send(error.response.data);
                            console.log(error);
                          });
                    })
                    .catch((error) => {
                      // res.setHeader('Content-Type', 'application/json');
                      // res.status(400);
                      // return res.send(error.response.data);
                      console.log(error);
                    });
              })
              .catch((error) => {
                // res.setHeader('Content-Type', 'application/json');
                // res.status(400);
                // return res.send(error.response.data);
                console.log(error);
              });
        } else {
          res.status(400);
          return res.json({
            status: 400,
            message: 'Emoney tidak tersedia',
          });
        }
      };
    });

    // console.log('harga luar fungsi: ' + harga);
  } catch (error) {
    console.log(error);
    res.status(500);
    return res
        .json(
            {
              status: 500,
              message: 'Server error',
            },
        );
  }
});
// tampilkan histori bayar emoney
router.get('/api/history/pays', verifyToken, async (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    client.query('SELECT * FROM mk_histori_bayar WHERE uid = $1', [req.uid], (error, result) => {
      if (result.rowCount > 0) {
        res.status(200);
        res.json({
          status: 200,
          message: 'List histori bayar menggunakan emoney',
          data: result.rows,
        });
      } else {
        res.status(200);
        return res.json({
          status: 200,
          message: 'Belum melakukan pembayaran sama sekali',
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    return res.json({
      status: 500,
      message: 'Server error',
    });
  }
});

// transfer
router.post('/api/transfer', verifyToken, async (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const {tujuan, jumlah} = req.body;
    let pesan = req.body.pesan;
    client.query('SELECT * FROM mk_pengguna WHERE uid = $1', [tujuan], (error, result) => {
      // cek apakah pengguna ada
      if (result.rowCount <= 0) {
        res.status(400);
        return res.json({
          status: 400,
          message: 'Alamat yang kamu kirim tidak ditemukan',
        });
      } else {
        // cek apakah uang cukup
        if (req.cash < jumlah) {
          res.status(400);
          return res.json({
            status: 400,
            message: 'Uang Anda tidak cukup',
          });
        } else {
          if (pesan === undefined) {
            pesan = "Transfer ke kamu";
          };
          // kurangi uang pengguna
          client.query('UPDATE mk_pengguna SET cash = cash - $1 WHERE uid = $2', [jumlah, req.uid]);
          // tambah rekening tujuan
          client.query('UPDATE mk_pengguna SET cash = cash + $1 WHERE uid = $2', [jumlah, tujuan]);
          // masukkan proses ke histori transfer
          const todayDate = moment(new Date()).format('YYYY-MM-DD');
          const todayTime = moment(new Date()).format('HH:mm:ss');
          client.query('INSERT INTO mk_histori_transfer(asal, tujuan, jumlah, waktu, tanggal, pesan) VALUES($1, $2, $3, $4, $5, $6)', [req.uid, tujuan, jumlah, todayTime, todayDate, pesan], (error1, result1) => {
            if (result1.rowCount <= 0) {
              res.status(400);
              return res.json({
                status: 400,
                message: 'Gagal melakukan transfer',
              });
            } else {
              res.status(200);
              return res.json({
                status: 200,
                message: 'Berhasil melakukan transfer',
              });
            }
          });
        }
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    return res.json({
      status: 500,
      message: 'Server error',
    });
  }
});
// history transfer keluar
router.get('/api/history/transfer/out', verifyToken, async (req, res, next) => {
  try {
    client.query('SELECT * FROM mk_histori_transfer WHERE asal = $1', [req.uid], (error, result) => {
      if (result.rowCount <= 0) {
        res.status(200);
        return res.json({
          status: 200,
          message: 'Belum pernah melakukan transfer',
          data: [],
        });
      } else {
        res.status(200);
        return res.json({
          status: 200,
          message: 'List Transfer keluar',
          data: result.rows,
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    return res.json({
      status: 500,
      message: 'Server error',
    });
  }
});
// history transfer masuk
router.get('/api/history/transfer/in', verifyToken, async (req, res, next) => {
  try {
    client.query('SELECT * FROM mk_histori_transfer WHERE tujuan = $1', [req.uid], (error, result) => {
      if (result.rowCount <= 0) {
        res.status(200);
        return res.json({
          status: 200,
          message: 'Belum pernah ditransfer',
          data: [],
        });
      } else {
        res.status(200);
        return res.json({
          status: 200,
          message: 'List Transfer masuk',
          data: result.rows,
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    return res.json({
      status: 500,
      message: 'Server error',
    });
  }
});

router.post('/tes', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  axios
      .post('https://met4kantin.herokuapp.com/api/login', {
        email: req.body.email,
        pass: req.body.pass,
      })
      .then((ress) => {
        if (ress.data.status == 200) {
          res.setHeader('Content-Type', 'application/json');
          res.status(200);
          return res.json({
            message: 'pengguna ditemukan',
          });
        };
      })
      .catch((error) => {
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res.send(error.response.data);
      });
});

router.post('/tess', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  axios
      .get('https://met4kantin.herokuapp.com/api/pembelian', {
        headers: {
          'authorization': req.headers.authorization,
        },
      })
      .then((ress) => {
        res.cookie('harpay', 'cookieValue');
        return res.send(ress.data);
      })
      .catch((error) => {
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res.send(error.response.data);
      });
});

module.exports = router;
