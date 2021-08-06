var server = 'c90a6742d095.ngrok.io/'
$(function() {
    var socket = io();
    socket.on('connect', function() {
        socket.emit('online', { data: 'm connected!' });
    });
    socket.on('success', function() {
        socket.emit('updateAll')
    })
    socket.on('UpdateEnty', function(today_data, total_data) {
        console.log('enty')
        var total_today = today_data[0];
        var vnsr_today = today_data[1];
        var doNothing = total_data[0] - total_data[1] - total_data[2];
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
        formData.append('file', file);
        if (window.location.protocol == "https:") {
            server = server.replace('https://', '')
            server = 'https://' + server;
        } else {
            server = server.replace('http://', '')
            server = 'http://' + server;
        }
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
                        text: 'Thời gian nhận dạng : ' + data.seconds.toString(),
                        addclass: 'alert bg-primary alert-styled-left',
                        delay: 4000
                    });
                    socket.emit('increaseVNSR');
                } else {
                    curValue = 100;
                    PNotify.alert({
                        title: 'Không thành công',
                        text: data.data,
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