const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const path = require('path');
var bodyParser = require("body-parser");
// INIT
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
var model = require('./models/ID')
    // VIEWS ENGINE
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));
/* @@END VIEWS ENGINE */
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.get('/', async function(req, res) {
    console.log("GET /")
    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear()
    var rows = await model.selectDate(date, month, year);
    var dataToday = []
    var dataIncre = []
    var dataTotal = []
    if (rows.length < 0) {
        dataToday = [1, 0, 0];
        dataIncre = [1, 0, 0];
    } else {
        dataToday = [rows[0].visit + 1, rows[0].vnsr, rows[0].fpt]
        var updateCurrent = `UPDATE visitor  SET  visit  = ${rows[0].visit+1} where id  = ${rows[0].id}`
        var ress = await model.updateVisit(updateCurrent);
        date_ob.setDate(date_ob.getDate() - 1)
            // 
        var yes_rows = await model.selectDate(date_ob.getDate(), date_ob.getMonth() + 1, date_ob.getFullYear());
        if (yes_rows.length == 0) {
            dataIncre = dataToday
        } else {
            dataIncre = [dataToday[0] - yes_rows[0].visit, dataToday[1] - yes_rows[0].vnsr, dataToday[2] - yes_rows[0].fpt]
        }
    }
    var total_row = await model.getTotal();
    if (total_row.length == 0) {
        dataTotal = [1, 0, 0]
    } else {
        dataTotal = [total_row[0].visit, total_row[0].vnsr, total_row[0].fpt]
    }
    res.render('index', { today: dataToday, increase: dataIncre, total: dataTotal })
})
io.on('connection', async function(socket) {
    var sId = socket.id;
    socket.on('increaseVNSR', async function() {
        console.log("Increase VNSR")
        let ts = Date.now();
        let date_ob = new Date(ts);
        let date = date_ob.getDate();
        let month = date_ob.getMonth() + 1;
        let year = date_ob.getFullYear()
        var rows = await model.selectDate(date, month, year);
        var total = []
        var today = []
            // Lấy dữ liệu theo ngày
        if (rows.length == 0) {
            let sql = `INSERT INTO visitor (visit,vnsr, fpt,date) VALUES (1, 1, 0, '${date}-${month}-${year}')`
            let ress = await model.updateVisit(sql);
            today = [1, 0, 0]
        } else {
            let today_id = rows[0].id;
            let toDay_total = rows[0].visit;
            let toDay_vnsr = rows[0].vnsr + 1;
            let toDay_fpt = rows[0].fpt;
            let sql = `UPDATE visitor SET  vnsr  = ${toDay_vnsr} WHERE id = ${today_id}`
            let ress = await model.updateVisit(sql)
            today = [toDay_total, toDay_vnsr, toDay_fpt]
        }
        // Lấy total
        var tt_row = await model.getTotal()
        if (tt_row.length == 0) {
            total = [1, 1, 0];
        } else {
            total = [tt_row[0].visit, tt_row[0].vnsr, tt_row[0].fpt]
        }
        await socket.emit('UpdateEnty', today, total)
        console.log("Finish")
    })
});

// START
http.listen(port, function() {
    console.log("Server running at port " + port);
});