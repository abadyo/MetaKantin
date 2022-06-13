const express = require('express');
const bodyParser = require('body-parser');

const jsonParser = bodyParser.json();
const app = express();
const cookieParser = require('cookie-parser');
const client = require('./db/connection');
const cors = require('cors');

app.use(jsonParser);
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cors({origin: '*'}));

app.use(function(req, res, next) {
  // // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});
// app.use(express.static('public'));
const PORT = process.env.PORT || 5000;

// endpoint section
const apiRoutes = require('./routes');

app.use('/', apiRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

client.connect();
