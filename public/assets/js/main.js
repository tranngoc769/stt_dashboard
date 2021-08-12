const  ACCESS_TOKEN = "6135fac40749744efe4a58c2012794f9123e97030b3c988db55e24412d0bd39e"
var API_SERVER = 'https://engine-staging03.aicovidvn.org';
var PARTNER = "tel4vn";
function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = (performance && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

var getUserInformation = function(){
    let data = {};
    let uuid = generateUUID();
    let formData = $("#information").serializeArray();
    formData.forEach(element => {
        data[element.name] = element.value;
    });
    if (data.fullname == "" || data.subject_age == ""){
        return false
    }
    data['uuid'] = PARTNER + "_" + uuid;
    return data;
}
$(function() {
    var socket = io();
    socket.on('connect', function() {
        socket.emit('online', { data: 'm connected!' });
    });
    socket.on('success', function() {
        socket.emit('updateAll')
    })
    socket.on('UpdateEnty', function(today_data, total_data) {
        var total_today = today_data[0];
        var vnsr_today = today_data[1];
        var doNothing = total_data[0] - total_data[1];
        $("#total_visit")[0].innerHTML = total_data[0];
        $("#total_visit_vnsr")[0].innerHTML = total_data[1];
        chart.updateSeries([total_data[1], doNothing])
        var todayH4 = $(".display-4.d-inline-block");
        var cur_td_visit = total_today - parseInt(todayH4[0].textContent);
        var cur_td_vnsr = vnsr_today - parseInt(todayH4[1].textContent);
        todayH4[0].textContent = total_today;
        todayH4[1].textContent = vnsr_today;
        var yesterdayH5 = $(".today");
        var incre1 = parseInt(yesterdayH5[0].textContent) + cur_td_visit;
        var incre2 = parseInt(yesterdayH5[1].textContent) + cur_td_vnsr;
        var yesterdayArrow = $(".mr-2.ml-1");
        yesterdayH5[0].textContent = incre1
        if (incre1 >= 0) {
            yesterdayArrow[0].className = "mr-2 ml-1 feather icon-arrow-up"
        }
        yesterdayH5[1].textContent = incre2
        if (incre2 >= 0) {
            yesterdayArrow[1].className = "mr-2 ml-1 feather icon-arrow-up"
        }
    });
    $('img[name="download_record"]').on('click', function() {
        console.log(player.recordedData);
        var blob = player.recordedData;
        if (blob != undefined) {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = blob.name;
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } else {
            var ero = PNotify.error({
                title: 'Chưa ghi âm',
                text: 'Thực hiện ghi âm',
                delay: 2000
            });
        }
    });
    $('button[name="pnotify-progress"]').on('click', function() {
        // $("#suggest").css("display", "none")
        // $("#nhandangfpt").css("display", "none")
        var file;
        var mask = $(this).attr("mask");
        if (mask != "recording") {
            file = $("#wavfileUpload")[0].files[0];
        } else {
            var blob = player.recordedData;
            if (blob != undefined) {
                file = new File([blob], blob.name, { lastModified: blob.lastModified });
            }
        }
        if (file == undefined || file == null) {
            var ero = PNotify.error({
                title: 'Chưa ghi âm',
                text: 'Ghi âm',
                delay: 2000

            });
            return;
        }

        var form = $('form')[0];
        var formData = new FormData(form);
        var curValue = 1;
        var progress;
        let meta = getUserInformation();
        if (meta == false){
            PNotify.alert({
                title: 'Không thành công',
                text: "Vui lòng nhập đầy đủ thông tin",
                addclass: 'alert bg-primary alert-styled-left',
                delay: 4000
            });
            return;
        }
        console.log(meta);
        formData.append("meta", JSON.stringify(meta));
        formData.append('audio_file', file);
        PNotify.info({
            title: 'Đang gửi kết quả',
            text: "Vui lòng chờ",
            addclass: 'alert bg-primary alert-styled-left',
            delay: 1000
        });
        $.ajax({
            type: "POST",
            enctype: 'multipart/form-data',
            url: "/recording",
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            success: function(resp) {
                data = JSON.parse(resp)
                curValue = 100;
                if (data.status == 200) {
                    PNotify.alert({
                        title: 'Thành công',
                        text: 'Đã gửi dữ liệu dự đoán',
                        addclass: 'alert bg-primary alert-styled-left',
                        delay: 4000
                    });
                    socket.emit('increaseVNSR');
                } else {
                    curValue = 100;
                    PNotify.alert({
                        title: 'Không thành công',
                        text: data.msg,
                        addclass: 'alert bg-primary alert-styled-left',
                        delay: 4000
                    });
                }
                $("button[name='pnotify-progress']").attr("disabled", false)
            },
            error: function(e) {
                $("button[name='pnotify-progress']").attr("disabled", false)
                console.log(e)
                PNotify.alert({
                    title: 'Lỗi',
                    text: 'Không thể kết nối đến server',
                    addclass: 'alert bg-primary alert-styled-left',
                    delay: 4000
                });
            }
        });
        $("button[name='pnotify-progress']").attr("disabled", true)
    });
});