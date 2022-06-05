const mysql = require('mysql');

const config = {
  host: 'ec2-52-73-155-171.compute-1.amazonaws.com',
  user: 'yihisgdbwznouw',
  password: 'bdb0a511e8c3e1c41249793414bee4aff1b8b7db0996daf2634d0c82c0cdc0b1',
  database: 'denfrlojvp0okh',
};

const pool = mysql.createPool(config);

module.exports = pool;
