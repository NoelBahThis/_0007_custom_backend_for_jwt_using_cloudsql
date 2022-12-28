const mysql = require('mysql');

const db = mysql.createConnection({
    host:'35.220.229.212',
    user:'noel',
    database:'kerajaan_sabah',
    password:'qwe123'
});

module.exports = db;