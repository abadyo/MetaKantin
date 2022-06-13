const jwt = require('jsonwebtoken');
const config = require('../config');
// const cookieParser = require('cookie-parser');

function verifyToken(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.headers.authorization === undefined) {
    res.status(400);
    return res.json({
      status: 400,
      message: 'Tidak ada token',
    });
  }
  let token = req.headers.authorization;

  if (!token) {
    res.status(400);
    return res.json({
      status: 400,
      message: 'Tidak ada token',
    });
  }

  token = token.replace(/^Bearer\s+/, '');
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      res.status(400);
      return res.json({
        status: 400,
        message: 'Gagal autentikasi',
      });
    }

    // if everything good, save to request for use in other routes
    req.id = decoded.id;
    req.name = decoded.name;
    req.email = decoded.email;
    req.role = decoded.role;
    req.cash = decoded.cash;
    req.uid = decoded.uid;
    next();
  });
}

module.exports = verifyToken;
