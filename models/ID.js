const mysql = require('mysql');
var connection = require('../models/db');

module.exports = {
    getTotal: async() => {
        var sql = "Select SUM(visit) as visit,SUM(predict) as predict FROM visitor";
        const rows = await connection.querry(sql);
        return rows;
    },
    selectDate: async(date, month, year) => {
        var sql = `Select * from visitor where date='${year}-${month}-${date}'`;
        const rows = await connection.querry(sql);
        return rows;
    },
    rawQuery: async(sql) => {
        try {
            const rows = await connection.querry(sql);
            return true;
        } catch {
            return false;
        }
    },

}