var express = require('express');
var bodyParser = require('body-parser');;
var jsonParser = bodyParser.json();
var app =  express();
var client = require('./db/connection');
var cookieParser = require('cookie-parser');
app.use(jsonParser);
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs');
// app.use(express.static('public'));
const PORT = process.env.PORT || 5000;

// endpoint section
const apiRoutes = require('./routes');

app.use('/', apiRoutes);


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))

client.connect();
