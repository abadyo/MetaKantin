var verifyToken = require('../auth/verify');
const jwt = require("jsonwebtoken");
var config = require('../config');
const { v4: uuidv4 } = require('uuid');
var express = require('express');
var pool = require('../db');
// semua var pool ubah je client
var client = require('../db/connection.js');
var db = require('../db');
const router = express.Router();
const path = require('path');

var bodyParser = require('body-parser');
const { exit } = require('process');
var jsonParser = bodyParser.json()

// var moment = require('moment');
// const { NULL } = require('mysql/lib/protocol/constants/types');
// const { dirname } = require('path');

router.use(jsonParser);

router.get('/', (req, res, next) => {
    res.render('/app/html/')
});

router.get('/register', (req, res, next) => {
    res.sendFile('/app/html/register.html')
});

// // nampilin semua pengguna
// router.get('/api/users', verifyToken,(req, res, next) => {
//     if(req.role == 'administrator') {
//         client.query('SELECT * FROM MK_pengguna', (error, result)=>{
//             if(error) throw error;
//             res.send(result)
//         });
//     } else {
//         res.send({message: "You dont have permisiion"});
//     }
//     // res.json({test: "Selamat Datang!"});
// });

// router.put('/api/user/:NRP', verifyToken,(req, res, next) => {
//     if(req.body.username == null || req.body.password == null) {
//         res.send({message: 'Username dan password harus ada!'}).status(200)
//     }
//     if(req.role == 'administrator') {
//         client.query('UPDATE MK_pengguna SET username = ?, password = ? WHERE NRP = ?', [req.body.username, req.body.password, req.params.NRP],  (error, result)=>{
//             if(error) throw error;
//             res.send({message: 'Username dan password berhasil diubah'}).status(200)
//         });
//     } else {
//         client.query('UPDATE MK_pengguna SET username = ?, password = ? WHERE NRP = ?', [req.body.username, req.body.password, req.NRP],  (error, result)=>{
//             if(error) throw error;
//             res.send({message: 'Username dan password berhasil diubah'}).status(200) 
//         });
//     }
//     // res.json({test: "Selamat Datang!"});
// });


// // nampilin id tertentu
router.get('/api/users/:NRP', verifyToken, async(req, res, next) => {
    try {
        if(req.role == 'administrator') {
            client.query('SELECT * FROM MK_pengguna WHERE NRP = $1', [req.params.NRP], (error, result)=>{
                res.json(result.rows);
            });
        } else {
            client.query('SELECT * FROM MK_pengguna WHERE NRP = $1', [req.NRP], (error, result)=>{
                res.json(result.rows);
            });
        }
    } catch(error) {
        res.send(error).status(404)
    }
    client.end
});

// // tambah user
router.post('/api/register', (req, res, next) => {
    try {
        if(!req.body.username || req.body.username.length < 3){
            res.status(400).send("Input username must be valid or > 3 character!");
        };
        if(!req.body.password || req.body.password.length < 3){
            res.status(400).send("Input password must be valid or > 3 character!");
        };
        if(!req.body.NRP || req.body.NRP.length < 3){
            res.status(400).send("Input NRP must be valid or > 3 character!");
        };
    
        client.query('SELECT EXISTS (SELECT username FROM MK_pengguna WHERE username = $1)', [req.body.username], (error1, result1) => {
            if(result1.rows[0]["exists"] === true) {
                res.render("/app/html/res/res.ejs", {message: "Username exist"});
                
            }
            else {
                client.query('SELECT EXISTS (SELECT NRP FROM MK_pengguna WHERE NRP = $1)', [req.body.NRP], (error2, result2) => {
                    if(result2.rows[0]["exists"] === true) res.status(400).send(`<p>NRP ${req.body.NRP} already exist</p>`);
                    else {
                        client.query(`INSERT INTO MK_pengguna(username, password, NRP, email, cash, role) VALUES ($1, $2, $3, $4, 0, 'user')`, [req.body.username, req.body.password, req.body.NRP, req.body.email], (error, result)=>{
                            res.send(`Akun anda berhasil dibuat1 Selamat datang, ${req.body.username}`);
                        });
                    }
                });
            }
        });
    } catch(error) {
        res.status(404).send(error);
    }


});

router.post('/api/login', async(req, res, next) => {
    try {
        if(!req.body.username || req.body.username.length < 3){
            res.status(400).send("Input username must be valid or > 3 character!");
        };
        if(!req.body.password || req.body.password.length < 3){
            res.status(400).send("Input password must be valid or > 3 character!");
        };
    
        client.query('SELECT * FROM mk_pengguna WHERE username = $1 AND password = $2', [req.body.username, req.body.password], (error, result) =>{
            if(result.rows) {
                var token = jwt.sign({username: req.body.username, role: result.rows[0]["role"], NRP: result.rows[0]["NRP"]}, config.secret, {expiresIn: 86400});
                res.send({message: "success", token: token});
            }
            else res.send({message:"no record found"});
        });
    } catch(error) {
        res.status(404).send(error);
    }
    client.end;
});

// router.post('/api/transfer', verifyToken,(req, res, next) => {
//     client.query('SELECT * FROM MK_pengguna WHERE NRP= ?', req.NRP, (error1, result1) => {
//         // console.log(result1[0].NRP);
//         // console.log(req.body.NRP);
//         if(error1) throw error1;
//         if(result1[0].NRP == req.body.NRP) {

//             res.status(400).send('You cant send to yourself');
//         }
//         else {
//             if(req.body.jumlah > result1[0].cash) res.status(400).send('You dont have that much money')
//             else {
//                 client.query('UPDATE MK_pengguna SET cash = cash - ? WHERE NRP = ?', [req.body.jumlah, req.NRP], (error2, result2)=>{
//                     if(error2) throw error2;
//                 });

//                 client.query('UPDATE MK_pengguna SET cash = cash + ? WHERE NRP = ?', [req.body.jumlah, req.body.NRP], (error3, result3)=>{
//                     if(error3) throw error3;
//                     if(result3.affectedRows == 0) {
//                         res.status(400).send(`Failed, NRP ${req.body.NRP} doesnt exist`)
//                     } else {
//                         res.send(`Transfer Rp.${req.body.jumlah} ke NRP ${req.body.NRP} berhasil`);   
//                     }
//                 });
//                 var today_date = moment(new Date()).format('YYYY-MM-DD');
//                 var today_time = moment(new Date()).format('HH:mm:ss');
//                 client.query('INSERT INTO mk_histori_transfer VALUES (NULL, ?, ?, ?, ?, ?, ?)', [req.NRP, req.body.NRP, req.body.jumlah, today_date, today_time, req.body.message], (error4, result4) => {
//                     if(error4) throw error4;
//                 });
//             }
//         }
//     }); 

// }); 

// router.post('/api/pay', verifyToken,(req, res, next) => {
//     client.query('SELECT * FROM MK_pengguna WHERE NRP= ?', req.NRP, (error1, result1) => {
//         // console.log(result1[0].NRP);
//         // console.log(req.body.NRP);
//         if(error1) throw error1;
//         if(req.body.jumlah > result1[0].cash) res.status(400).send('You dont have that much money')
//         else {
//             client.query('UPDATE MK_pengguna SET cash = cash - ? WHERE NRP = ?', [req.body.jumlah, req.NRP], (error, result)=>{
//                 if(error) throw error;
//             });

//             client.query('UPDATE mk_kantin SET cash = cash + ? WHERE paycode = ?', [req.body.jumlah, req.body.paycode], (error, result)=>{
//                 if(error) throw error;
//                 if(result.affectedRows == 0) {
//                     res.status(400).send(`Failed, NRP ${req.body.paycode} doesnt exist`)
//                 } else {
//                     res.send(`Bayar Rp.${req.body.jumlah} ke kantin ${req.body.paycode} berhasil`);   
//                 }
//             });
//             var today_date = moment(new Date()).format('YYYY-MM-DD');
//             var today_time = moment(new Date()).format('HH:mm:ss');
//             client.query('INSERT INTO mk_histori_bayar VALUES (NULL, ?, ?, ?, ?, ?)', [req.NRP, req.body.paycode, req.body.jumlah, today_date, today_time], (error4, result4) => {
//                 if(error4) throw error4;
//             });
//         }
//     }); 
// }); 

// router.post('/api/topup', verifyToken,(req, res, next) => {
//     // console.log(moment(new Date()).format('YYYY-MM-DD'))
//     // console.log(moment(new Date()).format('HH:mm:ss'))
//     if(req.body.jumlah <=10000) {
//         res.status(400).send('Jumlah topup harus lebih dari Rp.10.000');
//     } else {
//         client.query('UPDATE MK_pengguna SET cash = cash + ? WHERE NRP = ?', [req.body.jumlah, req.NRP], (error, result)=>{
//             if(error) throw error;
//             if(result.affectedRows != 0) res.status(200).send(`Topup sebanyak Rp.${req.body.jumlah} berhasil dilakukan`);
//             else res.status(400).send('Terjadi kesalahan.');
//         });
//     }
// }); 

// router.get('/api/history/transfers/', verifyToken,(req, res, next) => {
//     if(req.role == 'administrator') {
//         client.query('SELECT * FROM MK_histori_transfer', (error, result)=>{
//             if(error) throw error;
//             res.send(result)
//         });
//     } else {
//         res.send({message: "You dont have permisiion"});
//     }
// });

// router.get('/api/history/transfers/:NRP', verifyToken, (req, res, next) => {
//     if(req.role == 'administrator') {
//         client.query('SELECT * FROM MK_histori_transfer WHERE NRP = ?', req.params.NRP, (error, result)=>{
//             if(error) throw error;
//             res.json(result);
//         });
//     } else {
//         client.query('SELECT NRP_tujuan, cash, tanggal, pukul, message FROM MK_histori_transfer WHERE NRP = ?', req.NRP, (error, result)=>{
//             if(error) throw error;
//             res.json(result);
//         });
//     }
// });

// router.get('/api/history/pays/', verifyToken,(req, res, next) => {
//     if(req.role == 'administrator') {
//         client.query('SELECT MK_kantin.kantin, MK_histori_bayar.cash, MK_histori_bayar.tanggal, MK_histori_bayar.pukul FROM MK_histori_bayar JOIN MK_kantin ON MK_kantin.paycode = MK_histori_bayar.paycode', (error, result)=>{
//             if(error) throw error;
//             res.send(result)
//         });
//     } else {
//         res.send({message: "You dont have permisiion"});
//     }
// });

// router.get('/api/history/pays/:NRP', verifyToken, (req, res, next) => {
//     if(req.role == 'administrator') {
//         client.query('SELECT MK_kantin.kantin, MK_histori_bayar.cash, MK_histori_bayar.tanggal, MK_histori_bayar.pukul FROM MK_histori_bayar JOIN MK_kantin ON MK_kantin.paycode = MK_histori_bayar.paycode WHERE NRP = ?', req.params.NRP, (error, result)=>{
//             if(error) throw error;
//             res.json(result);
//         });
//     } else {
//         client.query('SELECT MK_kantin.kantin, MK_histori_bayar.cash, MK_histori_bayar.tanggal, MK_histori_bayar.pukul FROM MK_histori_bayar JOIN MK_kantin ON MK_kantin.paycode = MK_histori_bayar.paycode WHERE NRP = ?', req.NRP, (error, result)=>{
//             if(error) throw error;
//             res.json(result);
//         });
//     }
// });

router.get('/api/userss', (req, res, next) => {
    client.query('SELECT EXISTS (SELECT * FROM MK_pengguna WHERE id = 1)', (error, result)=>{
        try {
            if(error) throw error;
        res.send(result.rows)
        } catch(error) {
            res.status(404).send('Failed')
        }
    });
    client.end;
});

router.post('/api/loginn', (req, res, next) => {
    try {
        client.query('SELECT * FROM MK_pengguna WHERE username = $1;', [req.body.username], (error, result)=>{
            res.send(result.rows)
        });
    } catch(error) {
        res.send(error).status(404)
    }
    
    client.end;
});

module.exports = router; 