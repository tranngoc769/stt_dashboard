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
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
});
var upload = multer({
    storage: storage
});
app.post('/recording', upload.single('file'), async function(req, res) {
    const file = req.file
    if (!file) {
        const error = new Error('Please upload a file')
        res.send(JSON.stringify({ status: 400, msg: "Please upload a file" }));
        return;
    }
    res.send(JSON.stringify({ status: 200, msg: "Upload file success" }));
});
app.get('/', async function(req, res) {
    console.log("GET /")
    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear()
    var rows = [];
    var sql_check = false;
    var dataToday = []
    var dataIncre = []
    var dataTotal = []
    try {
        rows = await model.selectDate(date, month, year);
        sql_check = true;
    } catch (e) {
        console.log(e);
    } finally {}
    if (sql_check == false) {
        rows = 0;
        dataToday = [1, 0, 0];
        dataIncre = [1, 0, 0];
        dataTotal = [1, 0, 0]
    } else {
        if (rows.length == 0) {
            dataToday = [1, 0, 0];
            dataIncre = [1, 0, 0];
            sqlIn = `INSERT INTO visitor ( visit ,  vnsr ,     date ) VALUES ( 1, 0, '${year}-${month}-${date}')`;
            await model.updateVisit(sqlIn);
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
    }
    res.render('index', { today: dataToday, increase: dataIncre, total: dataTotal })
})
io.on('connection', async function(socket) {
    var sId = socket.id;
    socket.on('increaseVNSR', async function() {
        try {
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
                let sql = `INSERT INTO visitor (visit,vnsr,date) VALUES (1, 1, '${year}-${month}-${date}')`
                let ress = await model.updateVisit(sql);
                today = [1, 0]
            } else {
                let today_id = rows[0].id;
                let toDay_total = rows[0].visit;
                let toDay_vnsr = rows[0].vnsr + 1;
                let sql = `UPDATE visitor SET  vnsr  = ${toDay_vnsr} WHERE id = ${today_id}`
                let ress = await model.updateVisit(sql)
                today = [toDay_total, toDay_vnsr]
            }
            // Lấy total
            var tt_row = await model.getTotal()
            if (tt_row.length == 0) {
                total = [1, 1];
            } else {
                total = [tt_row[0].visit, tt_row[0].vnsr]
            }
            await socket.emit('UpdateEnty', today, total)
            console.log("Finish")
        } catch {

        }
    })
});

// START
http.listen(port, function() {
    console.log("Server running at port " + port);
});