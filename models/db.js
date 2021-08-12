const mysql = require('mysql');
var config = require('../config/config.json')
var conn = mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
});

function connect() {
    conn.connect(function(err) {
        if (err) throw err.stack;
        console.log('Connection success');
    });
}

function end() {
    conn.end(function(err) {
        if (err) throw err.stack;
        console.log('End connection success');
    });
}
async function querry(sql) {
    return new Promise((resolve, reject) => {
        conn.query(sql, (error, results, fields) => {
            if (error) {
                console.log(error)
                reject(error);
            }
            resolve(results);
        });
    });
};

module.exports = {
    end,
    connect,
    querry
}