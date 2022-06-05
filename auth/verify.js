const jwt = require('jsonwebtoken');
const config = require('../config');
// const cookieParser = require('cookie-parser');

function verifyToken(req, res, next) {
  let token = req.headers.authorization;

  if (!token) {
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify({
      status: 400,
      message: 'Tidak ada token',
    }, null, 3)).status(400);
  }

  token = token.replace(/^Bearer\s+/, '');
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.stringify({
        status: 400,
        message: 'Gagal autentikasi',
        data: result.rows,
      }, null, 3)).status(400);
    }

    // if everything good, save to request for use in other routes
    req.name = decoded.name;
    req.email = decoded.email;
    req.role = decoded.role;
    req.cash = decoded.cash;
    req.uid = decoded.uid;
    next();
  });
}

module.exports = verifyToken;
