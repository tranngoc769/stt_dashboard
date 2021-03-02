var server = 'http://adeaaa8e173c.ngrok.io/'
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
    $('#nhandangfpt').on('click', function() {
        if (window.location.protocol == "https:") {
            server = 'https://adeaaa8e173c.ngrok.io/';
        }
        var path = $(this).attr('path')
        $("button[id='nhandangfpt']").attr("disabled", true)
        $("#suggest").css("display", "none")
        $.ajax({
            type: "POST",
            url: server + "fpt",
            data: { 'path': path },
            success: function(data) {
                data = JSON.parse(data)
                console.log("LOG_INFO : FPT response")
                console.log(data)
                curValue = 100;
                $(".trumbowyg-editor")[2].innerHTML = data.msg
                if (data.status == 200) {
                    $("#suggest").css("display", "block")
                    document.getElementById('suggest').scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    PNotify.alert({
                        title: 'Thành công',
                        text: 'Xử lý và lưu thông tin thành công',
                        addclass: 'alert bg-primary alert-styled-left',
                        delay: 4000
                    });
                    console.log('Emit FPT');
                    socket.emit('increaseFPT')
                } else {
                    PNotify.alert({
                        title: 'Không thành công',
                        text: 'sadsda',
                        addclass: 'alert bg-primary alert-styled-left',
                        delay: 4000
                    });
                }
                // $("button[id='nhandangfpt']").attr("disabled", false)
            },
            error: function(e) {
                curValue = 100;
                // $("button[id='nhandangfpt']").attr("disabled", false)
                console.log("LOG_ERRO : FPT response")
                console.log(e)
                PNotify.alert({
                    title: 'Lỗi',
                    text: 'Không thể kết nối đến server',
                    addclass: 'alert bg-primary alert-styled-left',
                    delay: 4000
                });
            }
        });
        var curValue = 1;
        var progress;
        var loader = PNotify.notice({
            title: 'Request FPT',
            text: '<div class="progress ">\n' +
                '  <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></' + 'div>\n' +
                '</' + 'div>',
            textTrusted: true,
            icon: 'fas fa-cog fa-spin',
            hide: false,
            modules: {
                Buttons: {
                    closer: false,
                    sticker: false
                },
                History: {
                    history: false
                },
                Callbacks: {
                    beforeOpen: function(notice) {
                        progress = $(notice.refs.elem).find('div.progress-bar');
                        progress.width(curValue + '%').attr('aria-valuenow', curValue);
                        // Pretend to do something.
                        var plus = 2;
                        var timer = setInterval(function() {
                            if (curValue === 30) {
                                plus = 3;
                                loader.update({
                                    title: 'Loading audio',
                                    icon: 'fas fa-circle-notch fa-spin'
                                });
                            }
                            if (curValue === 51) {
                                plus = 4.0;
                                loader.update({
                                    title: 'Requesting API',
                                    icon: 'fas fa-file-audio'
                                });
                            }
                            if (curValue > 85 & curValue < 95) {
                                plus = 0;
                            }
                            if (curValue >= 100 && curValue < 115) {
                                plus = 2;
                                loader.update({
                                    title: 'Finish',
                                    icon: 'fas fa-check-double'
                                });
                            }
                            if (curValue > 115) {
                                // Clean up the interval.
                                loader.close();
                                window.clearInterval(timer);
                                return;
                            }
                            curValue += plus;
                            progress.width(curValue + '%').attr('aria-valuenow', curValue);
                        }, 65);
                    }
                }
            }
        });
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
                title: 'Chưa ghi âm hoặc chọn file',
                text: 'Ghi âm, kéo thả hoặc chọn file từ thiết bị',
                delay: 2000

            });
            return;
        }

        var form = $('form')[0];
        var formData = new FormData(form);
        var curValue = 1;
        var progress;
        var model = $("#models")[0].value;
        var modelName = $("#models option:selected").text();
        var isChecked = $("#expected")[0].checked;
        var targetString = $(".trumbowyg-editor")[1].innerText;

        if (!isChecked) {
            targetString = "";
        }
        console.log({
            "Model": modelName,
            "TargetString": targetString
        })
        formData.append('file', file);
        formData.append('model', model);
        formData.append('targetString', targetString);
        console.log('LOG_INFO : Request to VNSR API');
        if (window.location.protocol == "https:") {
            server = 'https://adeaaa8e173c.ngrok.io/';
        }
        $.ajax({
            type: "POST",
            enctype: 'multipart/form-data',
            url: server + "transcribe",
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            success: function(data) {
                console.log("LOG_INFO : VNSR response")
                console.log(data)
                curValue = 100;
                $(".trumbowyg-editor")[0].innerHTML = data.data
                $("#ketquaLabel").text("Kết quả : " + modelName)
                $("#ketquadoichieulabel").text("Đánh giá WER " + data.wer + ", CER = " + data.cer)
                if (data.status == 200) {
                    // $("#nhandangfpt").css("display", "block")
                    // $("#nhandangfpt").attr('path', data.path)
                    document.getElementById('result-block').scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    PNotify.alert({
                        title: 'Thành công',
                        text: 'Thời gian nhận dạng : ' + data.seconds.toString(),
                        addclass: 'alert bg-primary alert-styled-left',
                        delay: 4000
                    });
                    console.log('Emit VNSR')
                    socket.emit('increaseVNSR');
                    // $.ajax({
                    //     type: "POST",
                    //     url: "/increaseVNSR",
                    //     success: function(data) {
                    //         console.log("LOG_INFO : Update number visit VNSR success");
                    //     },
                    //     error: function(e) {
                    //         console.log("LOG_INFO : Update number visit VNSR failed ");
                    //         console.log(e)
                    //     }
                    // });
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
                console.log("LOG_ERRO : VNSR response")
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
            // Make a loader.
        var loader = PNotify.notice({
            title: 'Speech recognizing',
            text: '<div class="progress ">\n' +
                '  <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></' + 'div>\n' +
                '</' + 'div>',
            textTrusted: true,
            icon: 'fas fa-cog fa-spin',
            hide: false,
            modules: {
                Buttons: {
                    closer: false,
                    sticker: false
                },
                History: {
                    history: false
                },
                Callbacks: {
                    beforeOpen: function(notice) {
                        progress = $(notice.refs.elem).find('div.progress-bar');
                        progress.width(curValue + '%').attr('aria-valuenow', curValue);
                        // Pretend to do something.
                        var plus = 1;
                        var timer = setInterval(function() {
                            if (curValue === 20) {
                                plus = 0.5;
                                loader.update({
                                    title: 'Loading audio',
                                    icon: 'fas fa-circle-notch fa-spin'
                                });
                            }
                            if (curValue === 30) {
                                plus = 2.0;
                                loader.update({
                                    title: 'Transcript audio to text',
                                    icon: 'fas fa-file-audio'
                                });
                            }

                            if (curValue > 60) {
                                plus = 1;
                                // loader.update({
                                //     title: 'Using language model',
                                //     icon: 'fas fa-file-contract'
                                // });
                            }
                            if (curValue > 90 & curValue < 92) {
                                plus = 0;
                            }
                            if (curValue >= 100 && curValue < 115) {
                                plus = 1;
                                loader.update({
                                    title: 'Finish',
                                    icon: 'fas fa-check-double'
                                });
                            }
                            if (curValue > 115) {
                                // Clean up the interval.
                                loader.close();
                                window.clearInterval(timer);

                                return;
                            }
                            curValue += plus;
                            progress.width(curValue + '%').attr('aria-valuenow', curValue);
                        }, 65);
                    }
                }
            }
        });
        // fakeLoad();
    });
    $("#expected").on('click', function() {
        var isChecked = $(this)[0].checked;
        if (isChecked) {
            // hiện
            $("#result-block-div").addClass("col-lg-6");
            $("#compare-block-div").removeClass("myhide");
        } else {
            // ẩn
            $("#result-block-div").removeClass("col-lg-6");
            $("#compare-block-div").addClass("myhide");
        }
    });
});