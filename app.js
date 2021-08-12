var request = require('request');
var fs = require('fs');
const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const path = require('path');
var bodyParser = require("body-parser");
const logger = require('./log/winston');
var config = require('./config/config.json')
var storage_path = config.storage
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
const { stringify } = require('querystring');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, storage_path);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
var upload = multer({
    storage: storage
});
app.post('/recording', upload.single('audio_file'), async function (req, res) {
    try {
        const file = req.file
        if (!file) {
            const error = new Error('Please upload a file')
            res.send(JSON.stringify({ status: 400, msg: "Please upload a file" }));
            logger.error("Please upload a file'");
            return;
        }
        if (req.body.meta == undefined) {
            const error = new Error('Please upload a file')
            res.send(JSON.stringify({ status: 400, msg: "Missed meta parameter" }));
            logger.error("Missed meta parameter");
            return;
        }
        var meta = req.body.meta;
        var jsonData = JSON.parse(meta);

        let info_sql = `INSERT INTO information (uuid, fullname, subject_age, subject_cough_type, subject_gender, subject_health_status, note, datetime) VALUES ( '${jsonData.uuid}', '${jsonData.fullname}',${jsonData.subject_age}, '${jsonData.subject_cough_type}', '${jsonData.subject_gender}', '${jsonData.subject_health_status}', '${jsonData.note}', now())`;
        rows = await model.rawQuery(info_sql);
        var options = {
            'method': 'POST',
            'url': 'https://engine-staging03.aicovidvn.org/api/predict/',
            'headers': {
                'accept': 'application/json',
                'Authorization': 'Bearer 6135fac40749744efe4a58c2012794f9123e97030b3c988db55e24412d0bd39e',
                'Content-Type': 'multipart/form-data'
            },
            formData: {
                'meta': meta,
                'audio_file': {
                    'value': fs.createReadStream(file.path),
                    'options': {
                        'filename': file.filename,
                        'contentType': null
                    }
                }
            }
        };
        request(options, function (error, response) {
            if (error) {
                rows = model.rawQuery(`UPDATE information SET response = '${stringify(error)}' WHERE uuid = '${jsonData.uuid}';`);
                logger.error(error)
                return res.send(JSON.stringify({ status: 400, msg: stringify(error) }));
            }
            rows = model.rawQuery(`UPDATE information SET response = '${response.body}' WHERE uuid = '${jsonData.uuid}';`);
            console.log(response.body);
            if (response.statusCode != 200) {
                return res.send(JSON.stringify({ status: 200, msg: response.body }));
            }
            return res.send(JSON.stringify({ status: 200, msg: "Predict success" }));
        });

    } catch (error) {
        logger.error(error);
    }

});
app.get('/', async function (req, res) {
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
    } finally { }
    if (sql_check == false) {
        rows = 0;
        dataToday = [1, 0];
        dataIncre = [1, 0];
        dataTotal = [1, 0]
    } else {
        if (rows.length == 0) {
            dataToday = [1, 0];
            dataIncre = [1, 0];
            sqlIn = `INSERT INTO visitor ( visit ,  predict ,     date ) VALUES ( 1, 0, '${year}-${month}-${date}')`;
            await model.rawQuery(sqlIn);
        } else {
            dataToday = [rows[0].visit + 1, rows[0].predict]
            var updateCurrent = `UPDATE visitor  SET  visit  = ${rows[0].visit + 1} where id  = ${rows[0].id}`
            var ress = await model.rawQuery(updateCurrent);
            date_ob.setDate(date_ob.getDate() - 1)
            // 
            var yes_rows = await model.selectDate(date_ob.getDate(), date_ob.getMonth() + 1, date_ob.getFullYear());
            if (yes_rows.length == 0) {
                dataIncre = dataToday
            } else {
                dataIncre = [dataToday[0] - yes_rows[0].visit, dataToday[1] - yes_rows[0].predict]
            }
        }
        var total_row = await model.getTotal();
        if (total_row.length == 0) {
            dataTotal = [1, 0]
        } else {
            dataTotal = [total_row[0].visit, total_row[0].predict]
        }
    }
    res.render('index', { today: dataToday, increase: dataIncre, total: dataTotal })
})
io.on('connection', async function (socket) {
    var sId = socket.id;
    socket.on('increaseVNSR', async function () {
        try {
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
                let sql = `INSERT INTO visitor (visit,predict,date) VALUES (1, 1, '${year}-${month}-${date}')`
                let ress = await model.rawQuery(sql);
                today = [1, 0]
            } else {
                let today_id = rows[0].id;
                let toDay_total = rows[0].visit;
                let toDay_predict = rows[0].predict + 1;
                let sql = `UPDATE visitor SET predict = ${toDay_predict} WHERE id = ${today_id}`
                let ress = await model.rawQuery(sql)
                today = [toDay_total, toDay_predict]
            }
            // Lấy total
            var tt_row = await model.getTotal()
            if (tt_row.length == 0) {
                total = [1, 1];
            } else {
                total = [tt_row[0].visit, tt_row[0].predict]
            }
            await socket.emit('UpdateEnty', today, total)
        } catch {

        }
    })
});

// START
http.listen(port, function () {
    console.log("Server running at port " + port);
});