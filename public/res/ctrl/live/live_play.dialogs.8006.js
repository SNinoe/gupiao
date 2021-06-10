(function() {
    function enterCheckStatus() {
        var vue = App.ctrls.livePlay.getVue();
        var historyContNum = vue.getHistoryContNum();
        vue.beginFetchContents();

        if(!vue.isPermission){
            //无权限，从第一条开始加载，并不自动播放
            return vue.beginFetchContents(vue.FETCH_FIRST, false);
        }

        if(vue.liveInfo.finished){
            if(!historyContNum){
                if(vue.liveInfo.subscribe_account){
                    vue.beginFetchContents(vue.FETCH_FIRST, true);
                }else {
                    $('#status-finish-dlg .dialog-cancel-btn').hide();
                    $('#status-finish-dlg .dialog-confirm-btn').text('开始回听');
                    $('#status-finish-dlg .dialog-confirm-btn').addClass('listen-first-btn2');
                    $('#status-finish-dlg').show();
                }
            }else {
                $('#status-finish-dlg .dialog-cancel-btn').text('回到第一条');
                $('#status-finish-dlg .dialog-cancel-btn').addClass('listen-first-btn2');
                $('#status-finish-dlg .dialog-confirm-btn').text('继续上次');
                $('#status-finish-dlg .dialog-confirm-btn').addClass('listen-memory-btn2');
                $('#status-finish-dlg').show();
            }
        }else {
            var beginTime = new Date(Date.parse(vue.liveInfo.start_time.replace(/-/g, "/")));
            var curTime = new Date();
            if(beginTime < curTime){
                if(vue.isMeManager()){
                    vue.beginFetchContents(vue.FETCH_NEW, true);
                }else if(!historyContNum){
                    //没有播放记录，选择第一条开始还是进入最后一条
                    $('#status-in-dlg .dialog-cancel-btn').text('从第一条开始');
                    $('#status-in-dlg .dialog-cancel-btn').addClass('listen-first-btn1');
                    $('#status-in-dlg .dialog-confirm-btn').text('最新直播');
                    $('#status-in-dlg .dialog-confirm-btn').addClass('listen-new-btn1');
                    $('#status-in-dlg').show();
                }else {
                    //进入记忆播放
                    vue.beginFetchContents(vue.FETCH_HISTORY, true, historyContNum);
                }
            }else {
                function setTimeCount() {
                    var now = new Date();

                    var dayCount = parseInt((beginTime-now)/(24*3600*1000));
                    var leftHourAmount = (beginTime-now)%(24*3600*1000);
                    $('#status-wait-dlg #day-count').text(dayCount);

                    var hourCount = parseInt(leftHourAmount/(3600*1000));
                    var leftMinAmount = leftHourAmount%(3600*1000);
                    $('#status-wait-dlg #hour-count').text(hourCount);

                    var minCount = parseInt(leftMinAmount/(60*1000));
                    var leftSecAmount = leftMinAmount%(60*1000);
                    $('#status-wait-dlg #min-count').text(minCount);

                    var secCount = parseInt(leftSecAmount/(1000));
                    $('#status-wait-dlg #sec-count').text(secCount);

                    setTimeout(function () {
                        if($('#status-wait-dlg').is(':visible')){
                            setTimeCount();
                        }
                    }, 1000);
                }
                setTimeCount();
                $('#status-wait-dlg').show();
                vue.beginFetchContents(vue.FETCH_NEW, false);
            }
        }
        welcomeEvents();
    }

    function welcomeEvents() {

        $('.follow-control').off('change').on('change', function (e) {
            var isSubscribe = $(e.target).is(':checked');
            if(!isSubscribe){
                App.api('/live_/user/unsubscribe_account?acc_id='+liveInfo.account_id);
            }else {
                App.api('/live_/user/subscribe_account?acc_id='+liveInfo.account_id);
            }
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        $('.dialog-btclose').off('click').on('click', function (e) {
            $('#status-wait-dlg').hide();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        $('.listen-first-btn1').off('click').on('click', function (e) {
            $('#status-in-dlg').hide();
            //进入第一条
            var vue = App.ctrls.livePlay.getVue();
            vue.beginFetchContents(vue.FETCH_FIRST, true);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        $('.listen-new-btn1').off('click').on('click', function (e) {
            $('#status-in-dlg').hide();
            //进入最新消息
            var vue = App.ctrls.livePlay.getVue();
            vue.beginFetchContents(vue.FETCH_NEW, true);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        $('.listen-memory-btn2').off('click').on('click', function (e) {
            $('#status-finish-dlg').hide();
            //进入记忆播放
            var vue = App.ctrls.livePlay.getVue();
            var historyContNum = vue.getHistoryContNum();
            vue.beginFetchContents(vue.FETCH_HISTORY, true, historyContNum);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        $('.listen-first-btn2').off('click').on('click', function (e) {
            $('#status-finish-dlg').hide();
            //进入记忆播放
            var vue = App.ctrls.livePlay.getVue();
            vue.beginFetchContents(vue.FETCH_FIRST, true);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        $('.listen-new-btn2').off('click').on('click', function (e) {
            $('#status-finish-dlg').hide();
            //进入记忆播放
            var vue = App.ctrls.livePlay.getVue();
            vue.beginFetchContents(vue.FETCH_NEW, true);
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    }

    // App.addCtrl('livePlayDialogs', {
    //     enterCheckStatus: enterCheckStatus
    // });
})();