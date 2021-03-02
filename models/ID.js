const mysql = require('mysql');
var connection = require('../models/db');

module.exports = {
    getTotal: async() => {
        var sql = "Select SUM(visit) as visit,SUM(vnsr) as vnsr FROM visitor";
        const rows = await connection.querry(sql);
        return rows;
    },
    selectDate: async(date, month, year) => {
        var sql = `Select * from visitor where date='${year}-${month}-${date}'`;
        const rows = await connection.querry(sql);
        return rows;
    },
    updateVisit: async(sql) => {
        try {
            const rows = await connection.querry(sql);
            return true;
        } catch {
            return false;
        }
    },
    deleteID: async(id) => {
        var sql = `DELETE FROM IDtab WHERE id = "${id}"`;
        try {
            await connection.querry(sql);
            return true;
        } catch (ex) {
            console.log(ex);
            return false;
        }
    },
    insertID: async(id) => {
        var sql = `INSERT INTO IDtab (id) VALUES ("${id}")`;
        try {
            await connection.querry(sql);

            return true;
        } catch (ex) {
            console.log(ex);
            return false;
        }
    },

}