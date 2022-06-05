function verifyKey(req, res, next) {
  const head = req.headers.authorization;
  if (!head) {
    return res.status(403)
        .send({auth: false, message: 'No API KEY provided.'});
  }
  req.tes = head;
  next();
}

module.exports = verifyKey;
