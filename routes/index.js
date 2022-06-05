const verifyToken = require('../auth/verify');
const verifyKey = require('../auth/newVerify');
const jwt = require('jsonwebtoken');
// const {v4: uuidv4} = require('uuid');
const express = require('express');
const {nanoid} = require('nanoid');
// const pool = require('../db');
// semua var pool ubah je client
// const db = require('../db');
const router = express.Router();
// const path = require('path');

const bodyParser = require('body-parser');
// const {exit} = require('process');
const jsonParser = bodyParser.json();

// const url = require('url');
const axios = require('axios');
// const https = require('https');

const moment = require('moment');
const client = require('../db/connection.js');
const config = require('../config');
// const { NULL } = require('mysql/lib/protocol/constants/types');
// const { dirname } = require('path');

router.use(jsonParser);

router.get('/', (req, res, next) => {
  res.render('/app/html/');
});

router.get('/register', (req, res, next) => {
  res.sendFile('/app/html/register.html');
});

router.get('/login', (req, res, next) => {
  res.sendFile('/app/html/login.html');
});

router.get('/kantin', (req, res, next) => {
  res.sendFile('/app/html/kantin.html');
});

// nampilin semua pengguna
router.get('/api/profile', verifyToken, (req, res, next) => {
  try {
    if (req.role === 'admin') {
      client.query('SELECT * FROM mk_pengguna', (error, result) => {
        if (result.rows !== undefined) {
          res.setHeader('Content-Type', 'application/json');
          res.status(200);
          return res
              .send(
                  JSON.stringify(
                      {
                        status: 200,
                        message: 'Semua user',
                        data: result.rows,
                      },
                      null,
                      3,
                  ),
              );
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res
            .send(
                JSON.stringify(
                    {
                      status: 400,
                      message: 'Belum ada user yang mendaftar',
                    },
                    null,
                    3,
                ),
            );
      });
    } else {
      client.query(
          'SELECT * FROM mk_pengguna WHERE uid = $1',
          [req.uid],
          (error, result) => {
            console.log(result);
            if (result.rows[0] !== undefined) {
              const myname = result.rows[0].name;
              const myemail = result.rows[0].email;
              const mypass = result.rows[0].pass;
              const myrole = result.rows[0].role;
              const mycash = result.rows[0].cash;
              const myuid = result.rows[0].uid;
              res.setHeader('Content-Type', 'application/json');
              res.status(200);
              return res
                  .send(
                      JSON.stringify(
                          {
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
                          },
                          null,
                          3,
                      ),
                  );
            }
            res.setHeader('Content-Type', 'application/json');
            res.status(400);
            return res
                .send(
                    JSON.stringify(
                        {
                          status: 400,
                          message: 'Tidak ada user',
                        },
                        null,
                        3,
                    ),
                );
          },
      );
    }
  } catch (error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .send(
            JSON.stringify(
                {
                  status: 500,
                  message: 'Server error',
                },
                null,
                3,
            ),
        );
  }

  // res.json({test: "Selamat Datang!"});
});

// Daftar pengguna
router.post('/api/profile', async (req, res, next) => {
  try {
    if (!req.body.name || req.body.name.length < 3) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .send(
              JSON.stringify(
                  {
                    status: 400,
                    message: 'Nama harus lebih dari 3 huruf',
                  },
                  null,
                  3,
              ),
          );
    }
    if (!req.body.pass || req.body.pass.length < 3) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .send(
              JSON.stringify(
                  {
                    status: 400,
                    message: 'Password harus lebih dari 3 huruf',
                  },
                  null,
                  3,
              ),
          );
    }
    if (!req.body.email || !req.body.email.includes('@')) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .send(
              JSON.stringify(
                  {
                    status: 400,
                    message: 'Email tidak valid',
                  },
                  null,
                  3,
              ),
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
                .send(
                    JSON.stringify(
                        {
                          status: 400,
                          message: 'Name telah terdaftar',
                        },
                        null,
                        3,
                    ),
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
                      .send(
                          JSON.stringify(
                              {
                                status: 200,
                                message: 'Pendaftaran berhasil',
                              },
                              null,
                              3,
                          ),
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
        .send(
            JSON.stringify(
                {
                  status: 500,
                  message: 'Server error',
                },
                null,
                3,
            ),
        );
  }
});

// login
router.post('/api/login', async (req, res, next) => {
  try {
    if (!req.body.pass || req.body.pass.length < 3) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .send(
              JSON.stringify(
                  {
                    status: 400,
                    message: 'Password harus lebih dari 3 huruf',
                  },
                  null,
                  3,
              ),
          );
    }
    if (!req.body.email || !req.body.email.includes('@')) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .send(
              JSON.stringify(
                  {
                    status: 400,
                    message: 'Email tidak valid',
                  },
                  null,
                  3,
              ),
          );
    }

    client.query(
        'SELECT * FROM mk_pengguna WHERE email = $1 AND pass = $2',
        [req.body.email, req.body.pass],
        (error, result) => {
          if (result.rows[0] !== undefined) {
          // console.log(result.rows[0])
            const myname = result.rows[0].name;
            const myemail = result.rows[0].email;
            const myrole = result.rows[0].role;
            const mycash = result.rows[0].cash;
            const myuid = result.rows[0].uid;
            const token = jwt.sign(
                {
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
                .send(
                    JSON.stringify(
                        {
                          status: 200,
                          jwt: token,
                        },
                        null,
                        3,
                    ),
                );
          }
          res.setHeader('Content-Type', 'application/json');
          res.status(400);
          return res
              .send(
                  JSON.stringify(
                      {
                        status: 400,
                        message: 'User tidak ada, password salah atau belum mendaftar',
                      },
                      null,
                      3,
                  ),
              );
        },
    );
  } catch (error) {
    // console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .send(
            JSON.stringify(
                {
                  status: 500,
                  message: 'Server error',
                },
                null,
                3,
            ),
        );
  }
});

// topup
router.put('/api/profile/:user', verifyToken, async (req, res, next) => {
  try {
    if (req.body.jumlah < 1000) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      return res
          .send(
              JSON.stringify(
                  {
                    status: 400,
                    message: 'Topup harus di atas 1000',
                  },
                  null,
                  3,
              ),
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
                .send(
                    JSON.stringify(
                        {
                          status: 200,
                          message: 'Topup berhasil',
                        },
                        null,
                        3,
                    ),
                );
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.status(400);
            return res
                .send(
                    JSON.stringify(
                        {
                          status: 400,
                          message: 'Gagal topup',
                        },
                        null,
                        3,
                    ),
                );
          }
        },
    );
  } catch (error) {
    conslo/log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .send(
            JSON.stringify(
                {
                  status: 500,
                  message: 'Server error',
                },
                null,
                3,
            ),
        );
  }
});

// topup history
router.get('/api/history/topup', verifyToken, async (req, res, next) => {
  try {
    client.query('SELECT uid, name, jumlah, waktu, tanggal FROM mk_histori_topup WHERE uid = $1', [req.uid], (error, result) => {
      if (result.rows[0] !== undefined) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        return res
            .send(
                JSON.stringify(
                    {
                      status: 200,
                      message: 'Histori topup',
                      data: result.rows,
                    },
                    null,
                    3,
                ),
            );
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res
            .send(
                JSON.stringify(
                    {
                      status: 400,
                      message: 'User ini belum pernah melakukan topup',
                    },
                    null,
                    3,
                ),
            );
      }
    });
  } catch (error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .send(
            JSON.stringify(
                {
                  status: 500,
                  message: 'Server error',
                },
                null,
                3,
            ),
        );
  }
});

// bayar menggunakan metamoney
router.put('/api/pay', verifyToken, async (req, res, next) => {
  try {
    const {jumlah} = req.body;
    client.query('SELECT jumlah FROM mk_pengguna WHERE uid = $1', [req.uid], (error, result) => {
      if (result.rows[0] !== undefined) {
        if (result.rows[0]['cash'] < jumlah) {
          res.setHeader('Content-Type', 'application/json');
          res.status(400);
          return res
              .send(
                  JSON.stringify(
                      {
                        status: 400,
                        message: 'Maaf, uang anda tidak mencukupi, silakan topup.',
                      },
                      null,
                      3,
                  ),
              );
        }
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res
            .send(
                JSON.stringify(
                    {
                      status: 400,
                      message: 'User tidak ditemukan',
                    },
                    null,
                    3,
                ),
            );
      }
    });
    client.end;

    client.query('UPDATE mk_pengguna SET cash = cash - $1 WHERE uid = $2', [jumlah, req.uid], (error, result) => {
      if (result.rowCount > 0) {
        const todayDate = moment(new Date()).format('YYYY-MM-DD');
        const todayTime = moment(new Date()).format('HH:mm:ss');
        client.query(
            'INSERT INTO mk_histori_bayar(uid, name, jumlah, waktu, tanggal) VALUES($1, $2, $3, $4, $5)',
            [req.uid, req.name, req.body.jumlah, todayTime, todayDate],
        );
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        return res
            .send(
                JSON.stringify(
                    {
                      status: 200,
                      message: 'Pembayaran berhasil',
                    },
                    null,
                    3,
                ),
            );
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.status(400);
        return res
            .send(
                JSON.stringify(
                    {
                      status: 400,
                      message: 'Gagal bayar',
                    },
                    null,
                    3,
                ),
            );
      }
    });
  } catch (error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500);
    return res
        .send(
            JSON.stringify(
                {
                  status: 500,
                  message: 'Server error',
                },
                null,
                3,
            ),
        );
  }
});

// beli barang
// router.post('/api/buy')

// router.get('/kantin/:kode', verifyToken, (req, res, next) => {
//   try {
//     client.query('SELECT * FROM mk_kantin WHERE kode = $1;', [req.params.kode], (error, result) => {
//       res.render('/app/html/kantinView.ejs', {
//         nama: result.rows[0]['nama'],
//         lokasi: result.rows[0]['lokasi'],
//         kode: result.rows[0]['kode'],
//       });
//       res.status(4);
//     });
//   } catch (error) {
//     res.send(error).status(404);
//   }

//   client.end;
// });

// router.post('/api/Meta', (req, res, next) => {
//   try {
//     client.query('SELECT username, nrp, cash FROM mk_pengguna WHERE username = $1 AND password = $2;', [req.body.username, req.body.password], (error, result) => {
//       if (result.rowCount > 0) {
//         if (result.rows[0]['cash'] > req.body.biaya) {
//           const todayDate = moment(new Date()).format('YYYY-MM-DD');
//           const todayTime = moment(new Date()).format('HH:mm:ss');
//           client.query(' INSERT INTO mk_histori_pay(username, tanggal, waktu, biaya) VALUES ($1, $2, $3, $4)', [req.body.username, todayDate, todayTime, req.body.biaya]);
//           res.setHeader('Content-Type', 'application/json');
//           return res.send(JSON.stringify({
//             status: 20,
//             message: 'success',
//             biaya: req.body.biaya,
//           }, null, 3)).status(200);
//         } else {
//           res.setHeader('Content-Type', 'application/json');
//           return res.send(JSON.stringify({
//             status: 22,
//             message: 'insufficient money',
//             biaya: req.body.biaya,
//           }, null, 3)).status(400);
//         }
//       } else {
//         res.setHeader('Content-Type', 'application/json');
//         return res.send(JSON.stringify({
//           status: 21,
//           message: 'user doesnt exist',
//           biaya: req.body.biaya,
//         }, null, 3)).status(404);
//       }
//     });
//   } catch (error) {
//     res.setHeader('Content-Type', 'application/json');
//     return res.send(JSON.stringify({
//       status: 19,
//       message: 'transaction failed',
//       biaya: req.body.biaya,
//     }, null, 3)).status(400);
//   }
//   client.end;
// });

// router.post('/api/transaction', (req, res, next) => {
//   try {
//     client.query('SELECT kode, cash, metode, tanggal, waktu FROM mk_histori_bayar WHERE nrp = (SELECT nrp FROM mk_pengguna WHERE username = $1 AND password = $2 LIMIT 1);', [req.body.username, req.body.password], (error, result) => {
//       res.send(result.rows);
//     });
//   } catch (error) {
//     res.send(error).status(404);
//   }

//   client.end;
// });

// // router.post('/api/transfer', verifyToken,(req, res, next) => {
// //     client.query('SELECT * FROM MK_pengguna WHERE NRP= ?', req.NRP, (error1, result1) => {
// //         // console.log(result1[0].NRP);
// //         // console.log(req.body.NRP);
// //         if(error1) throw error1;
// //         if(result1[0].NRP == req.body.NRP) {

// //             res.status(400).send('You cant send to yourself');
// //         }
// //         else {
// //             if(req.body.jumlah > result1[0].cash) res.status(400).send('You dont have that much money')
// //             else {
// //                 client.query('UPDATE MK_pengguna SET cash = cash - ? WHERE NRP = ?', [req.body.jumlah, req.NRP], (error2, result2)=>{
// //                     if(error2) throw error2;
// //                 });

// //                 client.query('UPDATE MK_pengguna SET cash = cash + ? WHERE NRP = ?', [req.body.jumlah, req.body.NRP], (error3, result3)=>{
// //                     if(error3) throw error3;
// //                     if(result3.affectedRows == 0) {
// //                         res.status(400).send(`Failed, NRP ${req.body.NRP} doesnt exist`)
// //                     } else {
// //                         res.send(`Transfer Rp.${req.body.jumlah} ke NRP ${req.body.NRP} berhasil`);
// //                     }
// //                 });
// //                 var today_date = moment(new Date()).format('YYYY-MM-DD');
// //                 var today_time = moment(new Date()).format('HH:mm:ss');
// //                 client.query('INSERT INTO mk_histori_transfer VALUES (NULL, ?, ?, ?, ?, ?, ?)', [req.NRP, req.body.NRP, req.body.jumlah, today_date, today_time, req.body.message], (error4, result4) => {
// //                     if(error4) throw error4;
// //                 });
// //             }
// //         }
// //     });

// // });

// router.post('/api/pay', verifyToken, (req, res, next) => {
//   try {
//     if (req.body.emoney == 'metamoney') {
//       client.query('SELECT username, cash FROM mk_pengguna WHERE username = $1 AND password = $2', [req.username, req.body.password], (error1, result1) => {
//         if (result1.rowCount > 0) {
//           if (result1.rows[0]['cash'] > req.body.harga) {
//             client.query('UPDATE mk_pengguna SET cash = cash - $1 WHERE username = $2', [req.body.harga, req.username], (error2, result2) => {
//               if (result2.rowCount != 0) {
//                 client.query(' UPDATE mk_kantin SET cash = cash + $1 WHERE kode = $2', [req.body.harga, req.body.kode]);
//                 const todayDate = moment(new Date()).format('YYYY-MM-DD');
//                 const todayTime = moment(new Date()).format('HH:mm:ss');
//                 client.query(' INSERT INTO mk_histori_bayar(nrp, kode, cash, metode, tanggal, waktu) VALUES ($1, $2, $3, $4, $5, $6)', [req.nrp, req.body.kode, req.body.harga, req.body.emoney, todayDate, todayTime]);
//                 res.setHeader('Content-Type', 'application/json');
//                 return res.send(JSON.stringify({
//                   message: 'Transaksi berhasil',
//                 }, null, 3));
//               } else {
//                 res.setHeader('Content-Type', 'application/json');
//                 return res.send(JSON.stringify({
//                   message: 'Transaksi gagal',
//                 }, null, 3));
//               }
//             });
//           } else {
//             res.setHeader('Content-Type', 'application/json');
//             return res.send(JSON.stringify({
//               message: 'Uang kamu tidak cukup',
//             }, null, 3));
//           }
//         } else {
//           res.setHeader('Content-Type', 'application/json');
//           return res.send(JSON.stringify({
//             message: 'Wrong password',
//           }, null, 3));
//         }
//       });
//     } else if (req.body.emoney == 'harpay') {
//       axios
//           .post('https://harpay-api.herokuapp.com/auth/login', {
//             email: req.body.email,
//             password: req.body.password,
//           })
//           .then((ress) => {
//             return res.send(ress.data);
//           })
//           .catch((error) => {
//             console.error(error);
//             return res.send('Terjadi error');
//           });
//     } else {
//       res.setHeader('Content-Type', 'application/json');
//       return res.send(JSON.stringify({
//         message: 'hello',
//       }, null, 3));
//     }
//   } catch (error) {
//     return res.send(error).status(404);
//   }
//   client.end;
// });

// // router.post('/api/topup', verifyToken,(req, res, next) => {
// //     // console.log(moment(new Date()).format('YYYY-MM-DD'))
// //     // console.log(moment(new Date()).format('HH:mm:ss'))
// //     if(req.body.jumlah <=10000) {
// //         res.status(400).send('Jumlah topup harus lebih dari Rp.10.000');
// //     } else {
// //         client.query('UPDATE MK_pengguna SET cash = cash + ? WHERE NRP = ?', [req.body.jumlah, req.NRP], (error, result)=>{
// //             if(error) throw error;
// //             if(result.affectedRows != 0) res.status(200).send(`Topup sebanyak Rp.${req.body.jumlah} berhasil dilakukan`);
// //             else res.status(400).send('Terjadi kesalahan.');
// //         });
// //     }
// // });

// // router.get('/api/history/transfers/', verifyToken,(req, res, next) => {
// //     if(req.role == 'administrator') {
// //         client.query('SELECT * FROM MK_histori_transfer', (error, result)=>{
// //             if(error) throw error;
// //             res.send(result)
// //         });
// //     } else {
// //         res.send({message: "You dont have permisiion"});
// //     }
// // });

// // router.get('/api/history/transfers/:NRP', verifyToken, (req, res, next) => {
// //     if(req.role == 'administrator') {
// //         client.query('SELECT * FROM MK_histori_transfer WHERE NRP = ?', req.params.NRP, (error, result)=>{
// //             if(error) throw error;
// //             res.json(result);
// //         });
// //     } else {
// //         client.query('SELECT NRP_tujuan, cash, tanggal, pukul, message FROM MK_histori_transfer WHERE NRP = ?', req.NRP, (error, result)=>{
// //             if(error) throw error;
// //             res.json(result);
// //         });
// //     }
// // });

// // router.get('/api/history/pays/', verifyToken,(req, res, next) => {
// //     if(req.role == 'administrator') {
// //         client.query('SELECT MK_kantin.kantin, MK_histori_bayar.cash, MK_histori_bayar.tanggal, MK_histori_bayar.pukul FROM MK_histori_bayar JOIN MK_kantin ON MK_kantin.paycode = MK_histori_bayar.paycode', (error, result)=>{
// //             if(error) throw error;
// //             res.send(result)
// //         });
// //     } else {
// //         res.send({message: "You dont have permisiion"});
// //     }
// // });

// // router.get('/api/history/pays/:NRP', verifyToken, (req, res, next) => {
// //     if(req.role == 'administrator') {
// //         client.query('SELECT MK_kantin.kantin, MK_histori_bayar.cash, MK_histori_bayar.tanggal, MK_histori_bayar.pukul FROM MK_histori_bayar JOIN MK_kantin ON MK_kantin.paycode = MK_histori_bayar.paycode WHERE NRP = ?', req.params.NRP, (error, result)=>{
// //             if(error) throw error;
// //             res.json(result);
// //         });
// //     } else {
// //         client.query('SELECT MK_kantin.kantin, MK_histori_bayar.cash, MK_histori_bayar.tanggal, MK_histori_bayar.pukul FROM MK_histori_bayar JOIN MK_kantin ON MK_kantin.paycode = MK_histori_bayar.paycode WHERE NRP = ?', req.NRP, (error, result)=>{
// //             if(error) throw error;
// //             res.json(result);
// //         });
// //     }
// // });

// router.get('/api/key', verifyKey, (req, res, next) => {
//   return res.send(req.tes);
//   // client.end;
// });

// router.get('/api/userss', (req, res, next) => {
//   client.query('SELECT * FROM MK_pengguna;', (error, result) => {
//     try {
//       if (error) throw error;
//       res.send(result.rows);
//     } catch (error) {
//       res.status(404).send('Failed');
//     }
//   });
//   client.end;
// });

// // router.post('/api/loginn', (req, res, next) => {
// //   try {
// //     client.query('SELECT * FROM MK_pengguna WHERE username = $1;', [req.body.username], (error, result) => {
// //       res.send(result.rows);
// //     });
// //   } catch (error) {
// //     res.send(error).status(404);
// //   }

// //   client.end;
// // });

// router.get('/api/kantin', (req, res, next) => {
//   try {
//     client.query('SELECT * FROM mk_kantin;', (error, result) => {
//       res.send(result.rows);
//     });
//   } catch (error) {
//     res.send(error).status(404);
//   }

//   client.end;
// });

// router.get('/tes', (req, res, next) => {
//   axios
//       .get('https://met4kantin.herokuapp.com/api/login')
//       .then((ress) => {
//         res.send(ress.data);
//       })
//       .catch((error) => {
//         console.error(error);
//       });
// });

router.get('/tes', (req, res, next) => {
  axios
      .post('https://met4kantin.herokuapp.com/api/login', {
        email: 'ab@mail.com',
        pass: 'abyan',
      })
      .then((ress) => {
        res.setHeader('Content-Type', 'application/json');
        return res
            .send(
                JSON.stringify(
                    {
                      // status: 200,
                      tes: 'berhasil axios',
                    },
                    null,
                    3,
                ),
            )
            .status(200);
      })
      .catch((error) => {
        console.error(error);
      });
});

// // function cobaAPI() {
// //     // axios.get('https://example.com/todos').then(ress => {
// //     //     return ress
// //     // }).catch(error => {
// //     //     console.log(error)
// //     // })
// //     const options = {
// //         hostname: 'https://wizard-world-api.herokuapp.com/Wizards',
// //         path: '/',
// //         method: 'GET',
// //     };
// //     const req = https.request(options, res => {
// //         return res
// //     });
// //     req.on('error', error => {
// //         console.error(error);
// //     });
// // };

module.exports = router;
