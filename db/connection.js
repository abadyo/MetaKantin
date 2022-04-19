const {Client} = require('pg')

const client = new Client({
    host: "ec2-52-73-155-171.compute-1.amazonaws.com",
    user: "yihisgdbwznouw",
    port: 5432,
    password: "bdb0a511e8c3e1c41249793414bee4aff1b8b7db0996daf2634d0c82c0cdc0b1",
    database: "denfrlojvp0okh"
})

module.exports = client