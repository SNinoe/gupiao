(function () {
    var vue = null;
    var liveId = null;
    var saleLinkId = null;
    var sseConnection = null;
    var waitingMsg = false;
    var serMsgIndex = 0;
    var identity = null;
    // var testStudent = App.utils.urlParam('ts');
    var normalTicketStr = null;
    var sseConnectUrl = null;
    var waitMsgUrl = null;
    var userAuthUrl = null;
    var CODE_WELCOME = 2;
    var CODE_CONTENT_NUM = 3;
    var CODE_DISCUSS_NUM = 4;
    var CODE_DELETE_DISCUSS = 5;
    var CODE_FORBID_SPEAK = 6;
    var CODE_REWARD = 7;
    var CODE_FORBID_DISCUSS = 8;
    var CODE_DELETE_CONTENT = 9;
    var CODE_LEARNER_COUNT = 10;
    var CODE_SET_TEACHER = 11;
    var CODE_ADD_ADMIN = 12;
    var CODE_DELETE_ADMIN = 13;
    var CODE_TRANSCODE_VIDEO = 14;
    var REWARD_SHOW = 15;
    var CODE_REFRESH_PAGE = 99;
    var IDENTITY_ADMIN = 1;
    var IDENTITY_TEACHER = 2;
    var IDENTITY_ASSISTENT = 3;
    var sseErrorTime = null;
    var checkSseCloseTimeout = null;

    function connectSse() {
        function _doConnect() {
            if (!!identity) {
                sseConnectUrl = App.utils.addParam(sseConnectUrl, 'identity', identity);
            }
            sseConnection = new EventSource(sseConnectUrl);
            sseConnection.onmessage = function (e) {
                onMessage(e.data);
            };
            sseConnection.onopen = function (e) {
                console.log('sse onopen:', e);
                sseErrorTime = null;
            };
            sseConnection.onerror = function (e) {
                console.log('sse onerror:', e);
                console.log('sse onerror, data:', e.data);
                sseErrorTime = new Date();
            };
            sseConnection.onclose = function (e) {
                console.log('sse onclose');
            };
            sseConnection.addEventListener("connect_close", function (e) {
                console.log('sse connect_close listen');
                sseConnection.close();
            });
            sseConnection.addEventListener("login", function (e) {
                console.log('sse login listen');
                sseConnection.close();
                console.log('App.options.login_url:', App.options.login_url);
                window.location.href = App.options.login_url;
            });
        }

        if (!!sseConnection) {
            sseConnection.close();
        }
        _doConnect();
        function _checkSseClose() {
            checkSseCloseTimeout = setTimeout(function () {
                if (!!sseErrorTime) {
                    console.log('deltaSseTime:', new Date() - sseErrorTime);
                    if (new Date() - sseErrorTime > 10 * 1000) {
                        if (!!sseConnection) {
                            sseConnection.close();
                        }
                        _doConnect();
                    }
                }
                if (vue.maxContentNum < vue.liveInfo.content_num) {
                    vue.onContentMsg(parseInt(vue.liveInfo.content_num));
                }
                if (vue.maxDiscussNum < vue.liveInfo.discuss_num) {
                    vue.onDiscussMsg(parseInt(vue.liveInfo.discuss_num));
                }
                _checkSseClose();
            }, 5 * 1000);
        }

        _checkSseClose();
    }

    function loopOssData() {
        function _onFetch(oneContent) {
            vue.totalLiveData[oneContent.live_num] = oneContent;
            onMessage({code: CODE_CONTENT_NUM, data: oneContent.live_num});
            setTimeout(_doLoopFetch, 500);
        }

        function _doLoopFetch() {
            if (vue.liveInfo.finished || !vue.isPermission) {
                App.debug('vue.liveInfo.finished:' + vue.liveInfo.finished);
                App.debug('vue.isPermission:' + vue.isPermission);
                return
            }
            var myDate = new Date();
            var startDate = new Date(vue.liveInfo.start_time.replace(/-/g, '/'));
            if (myDate < startDate) {
                return setTimeout(_doLoopFetch, 15 * 1000);
            }
            var _fileKey = 'live-data/' + vue.liveInfo.id + '/' + (vue.liveInfo.content_num + 1);
            var fetchUrl = App.utils.ossUrl(_fileKey);
            App.http(fetchUrl, null, function (content) {
                _onFetch(eval('(' + content + ')'))
            }, function (status) {
                console.log('_doLoopFetch alcdn status:', status);
                setTimeout(_doLoopFetch, 30 * 1000);
            });
        }

        App.api(userAuthUrl, function (rspData) {
            if (!!rspData.login_data) {
                App.data = rspData.login_data;
            }
            if (!!rspData.xsrfToken) {
                App.data.xsrfToken = rspData.xsrfToken;
            }
            initPageData(rspData.live);
            vue.$nextTick(_doLoopFetch);
        });
    }

    function connectLive() {
        if (!!window.EventSource) {
            connectSse();
        } else {
            loopOssData();
        }
    }

    function onMessage(data) {
        var msgData = null;
        try {
            msgData = eval('(' + data + ')');
        } catch (err) {
            msgData = data;
        }
        if (msgData.code == CODE_WELCOME) {
            if (!!msgData.data.login_data) {
                App.data = msgData.data.login_data;
            }
            if (!!msgData.data.xsrfToken) {
                App.data.xsrfToken = msgData.data.xsrfToken;
            }
            initPageData(msgData.data.live);
        }
        else if (msgData.code == CODE_CONTENT_NUM) {
            vue.onContentMsg(parseInt(msgData.data));
        }
        else if (msgData.code == CODE_DISCUSS_NUM) {
            vue.onDiscussMsg(parseInt(msgData.data));
        }
        else if (msgData.code == CODE_DELETE_DISCUSS) {
            vue.onDeleteDiscuss(msgData.data.discuss.live_num);
        }
        else if (msgData.code == CODE_FORBID_SPEAK) {
            Vue.set(vue.liveInfo, 'forbid_speak_userids', msgData.data.user_ids);
        }
        else if (msgData.code == CODE_FORBID_DISCUSS) {
            vue.appendContent({'content': msgData.data.value == 1 ? '禁止讨论' : '允许讨论', 'type': vue.CONTENT_TYPES.SYS});
            Vue.set(vue.liveInfo, 'forbid_discuss', msgData.data.value);
            if (vue.isContentAtBottom()) {
                vue.$nextTick(function () {
                    vue.scrollContentBottom();
                });
            }
        }
        else if (msgData.code == CODE_DELETE_CONTENT) {
            vue.onDeleteContent(parseInt(msgData.data.content_id), msgData.data.user);
        }
        else if (msgData.code == CODE_LEARNER_COUNT) {
            var amount = parseInt(msgData.data);
            Vue.set(vue.liveInfo, 'learner_count', amount);
        }
        else if (msgData.code == CODE_SET_TEACHER) {
            Vue.set(vue.liveInfo, 'teacher', msgData.data);
            Vue.set(vue.liveInfo, 'teacher_uid', msgData.data.id);
        }
        else if (msgData.code == CODE_ADD_ADMIN) {
            var tempList = vue.liveInfo.admin_uids;
            tempList.push(msgData.data);
            Vue.set(vue.liveInfo, 'admin_uids', tempList);
        }
        else if (msgData.code == CODE_DELETE_ADMIN) {
            var preAdminUids = vue.liveInfo.admin_uids;
            var _index = preAdminUids.indexOf(msgData.data);
            if (_index >= 0) {
                preAdminUids.splice(_index, 1);
            }
            Vue.set(vue.liveInfo, 'admin_uids', preAdminUids);
        }
        else if (REWARD_SHOW == msgData.code) {
            var isShow = parseInt(msgData.data);
            Vue.set(vue.liveInfo, 'show_reward', isShow);
            if (!isShow) {
                App.alertSuccess('弹幕显示打赏');
                $('.content-reward-one-item').hide();
            } else {
                $('.content-reward-one-item').show();
            }
        }
    }

    function _preInitPage(initData, callback) {
        function __checkTotalNeedRes() {
            console.log('__checkTotalNeedRes...');
            if (isManagerPage) {
                if (!App.ctrls.livePlayMaterial) {
                    setTimeout(__checkTotalNeedRes, 100);
                    return
                }
            }
            callback();
        }

        App.debug('_preInitPage');
        var isTeacherPage = initData.live_info.teacher_uid == App.data.user.id;
        var isAssistPage = initData.live_info.assis_uids.indexOf(App.data.user.id) >= 0;
        var isAdminPage = initData.live_info.admin_uids.indexOf(App.data.user.id) >= 0;
        var isManagerPage = (isTeacherPage || isAssistPage || isAdminPage) && (!testStudent);
        var optionContentsEle = '#option-content-tpls';

        function __addJsPath(jsPath) {
            $(optionContentsEle).after('<script type="text/javascript" src="' + jsPath + '"></script>');
        }

        if (isManagerPage) {
            $(optionContentsEle).after($('#option-tpl-materials').html());
            __addJsPath($('#material-js-path').val());
        }
        $('#option-tpl-materials').html('');
        if (isManagerPage || initData.live_info.discuss_img) {
            __addJsPath($('#image-input-js-path').val());
            __addJsPath($('#exif-js-path').val());
        }
        if (isManagerPage) {
            __addJsPath($('#chunk-upload-js-path').val());
        }
        __checkTotalNeedRes();
    }

    function initPageData(initData) {
        var isUserSubscribe = (App.data && App.data.wx_app_user && App.data.wx_app_user.subscribe);
        var willForceSubscribeCode = (normalTicketStr && initData.is_permission && !isUserSubscribe);
        if (initData.live_info.allow_video && !willForceSubscribeCode) {
            window.location.href = '/lv/r/' + initData.live_info.id;
            App.debug('allow video, old page');
            return
        }
        if (!vue) {
            _preInitPage(initData, __doInitVue);
            function __doInitVue() {
                var vueInitData = $.extend({
                    userIdentity: 'normal',
                    liveTeachStatus: '',
                    discussStatus: '',
                    recordType: 2,
                    controlByType: 1,
                    controlTouch: {},
                    discussionModel: false,
                    rewardTeachModel: false,
                    rewardOtherModel: false,
                    rewardOtherConfirm: false,
                    rewardTeacherModel: false,
                    discusBarrage: !initData.live_info.finished,
                    forbidDiscus: true,
                    urlAlterShow: false,
                    urlQrCodeModel: false,
                    scrolling: null,
                    showQrCode: false,
                    choosePayShow: null,
                    choosePayType: 'live',
                    hasNotJsSdk: true,
                    forceSubscribeCode: willForceSubscribeCode,
                    isWx: App.utils.isWeixin(),
                    contentText: '',
                    saleLinkId: saleLinkId,
                    serverInitContentNum: parseInt(initData.live_info.content_num),
                    liveInfo: initData.live_info,
                    isPermission: initData.is_permission,
                    accountInfo: initData.account_info,
                    isSubscribe: initData.subscribe_account,
                    seriesInfo: initData.series_info,
                    seriesObjects: null,
                    seriesLiveMoney: 0,
                    myUserId: App.data.user.id,
                    totalLiveData: null,
                    isShowOptDlg: false,
                    beRewardUsers: {},
                    beRewardUserIds: [],
                    selectRewardUId: null,
                }, PlayContent.vueData, PlayVoice.vueData, PlayDiscuss.vueData, vueGiftData, (App.ctrls.livePlayMaterial ? App.ctrls.livePlayMaterial.materialData : {}));
                App.debug('vueInitData');
                var vueInitMethods = $.extend({
                    overscroll: function (el) {
                        if (!el) {
                            return
                        }
                        el.addEventListener('touchstart', function () {
                            var top = el.scrollTop, totalScroll = el.scrollHeight,
                                currentScroll = top + el.offsetHeight;
                            if (top === 0) {
                                el.scrollTop = 1
                            } else if (currentScroll === totalScroll) {
                                el.scrollTop = top - 1
                            }
                        });
                        el.addEventListener('touchmove', function (evt) {
                            if (el.offsetHeight < el.scrollHeight || el.offsetWidth < el.scrollWidth)
                                evt._isScroller = true
                        });
                    },
                    controlTouchStart: function (event) {
                        this.controlTouch.startX = event.changedTouches[0].clientX;
                    },
                    controlTouchMove: function (event) {
                        this.controlTouch.moveX = event.changedTouches[0].clientX;
                    },
                    controlTouchEnd: function (event, name) {
                        this.controlTouch.distanceX = this.controlTouch.moveX - this.controlTouch.startX;
                        this.controlTouch.absX = Math.abs(this.controlTouch.distanceX);
                        if (this.controlTouch.absX > 50) {
                            this.controlTouch.distanceX > 0 ? this[name] = 1 : this[name] = 2;
                        }
                    },
                    initPhotoSwipeFromDOM: PhotoSwipeTools.initPhotoSwipe,
                    isMobile: App.utils.isMobile,
                    isWeixin: App.utils.isWeixin,
                    showUrlQrCode: showUrlQrCode,
                    isUserAdmin: function (userId) {
                        return (this.liveInfo.admin_uids.indexOf(userId) >= 0 && !testStudent)
                    },
                    isUserTeacher: function (userId) {
                        return (this.liveInfo.teacher_uid == userId && !testStudent)
                    },
                    isUserAssist: function (userId) {
                        return (this.liveInfo.assis_uids.indexOf(userId) >= 0 && !testStudent)
                    },
                    isUserManager: function (userId) {
                        return this.isUserAdmin(userId) || this.isUserTeacher(userId) || this.isUserAssist(userId)
                    },
                    isMeAdmin: function () {
                        return this.isUserAdmin(App.data.user.id);
                    },
                    isMeTeacher: function () {
                        return this.isUserTeacher(App.data.user.id);
                    },
                    isMeAssist: function () {
                        return this.isUserAssist(App.data.user.id);
                    },
                    isMeManager: function () {
                        return this.isUserManager(App.data.user.id);
                    },
                    isMsgFull: function () {
                        return !(this.isPermission || this.isMeManager());
                    },
                    sendNotify: sendNotify,
                    subscribeOpt: subscribeOpt,
                    fixScrollInput: fixScrollInput,
                    initSeriesLives: initSeriesLives,
                    buyLive: buyLive,
                    rewardOpt: rewardOpt,
                    setRewordShow: setRewordShow,
                    enterCheckStatus: App.ctrls.livePlayDialogs.enterCheckStatus,
                    examineOtherConfirm: examineOtherConfirm,
                    otherRewardOpt: otherRewardOpt,
                    appendBeRewardUser: appendBeRewardUser,
                    changeRewardAdopt: changeRewardAdopt
                }, PlayVoice.vueMethods, PlayContent.vueMethods, App.ctrls.livePlayFootBar.footBarMethods, PlayDiscuss.vueMethods, vueGiftMethods, (App.ctrls.livePlayMaterial ? App.ctrls.livePlayMaterial.materialMethods : {}));
                App.debug('vueInitMethods');
                vue = App.vue({
                    el: '#app', data: vueInitData, methods: vueInitMethods, created: function () {
                        App.debug('vue created');
                        this.$nextTick(function () {
                            vue.overscroll(vue.$refs.scrollingMain);
                            vue.overscroll(vue.$refs.discussScrollMain);
                            $('#page-loading').hide();
                            if (!vue.forceSubscribeCode) {
                                _initJsSdk();
                                vue.enterCheckStatus();
                                afterResetLiveData();
                            }
                        });
                    }
                });
            }
        } else {
            vue.liveInfo = initData.live_info;
            vue.isPermission = initData.is_permission;
            vue.accountInfo = initData.account_info;
            vue.isSubscribe = initData.subscribe_account;
            vue.seriesInfo = initData.series_info;
            vue.discusBarrage = !initData.live_info.finished;
            $('#page-loading').hide();
            vue.$nextTick(function () {
                afterResetLiveData();
            });
        }
        isShowVip(initData.account_info);
    }

    function appendBeRewardUser(_appendUserInfo) {
        if (!_appendUserInfo.id || _appendUserInfo.id < 0) {
            return
        }
        function _doAppendList(userInfo) {
            if (vue.beRewardUserIds.indexOf(userInfo.id) < 0) {
                vue.beRewardUserIds.push(userInfo.id);
                identityStr = vue.identityStr(userInfo.id);
                userInfo.identityStr = identityStr ? identityStr : '参与人';
                vue.beRewardUsers[userInfo.id] = userInfo;
            }
        }

        _doAppendList(_appendUserInfo);
        if (!vue.selectRewardUId) {
            var localUser = _localSelectRewardUser();
            if (localUser) {
                _doAppendList(localUser);
                vue.selectRewardUId = localUser.id;
            } else if (vue.beRewardUserIds.length > 0) {
                vue.selectRewardUId = vue.beRewardUserIds[0];
            }
        }
    }

    function changeRewardAdopt(selectUserId) {
        vue.selectRewardUId = selectUserId;
        vue.rewardTeacherModel = false;
        localStorage['livePlay.selectRewardUser.' + vue.liveInfo.id] = JSON.stringify(vue.beRewardUsers[selectUserId]);
    }

    function _localSelectRewardUser() {
        var _userInfo = localStorage.getItem('livePlay.selectRewardUser.' + vue.liveInfo.id);
        if (!!_userInfo) {
            _userInfo = JSON.parse(_userInfo);
        }
        return _userInfo
    }

    function afterResetLiveData() {
        vue.initDeletedContents();
        if (vue.isPermission) {
            vue.resetDeletedDiscuss();
            vue.initDiscussItems();
            if (vue.liveInfo.subscribe_image_url && willShowQrCode()) {
                $('#subscribe-code-dlg').show();
                setEverShowSubscribe();
            }
        }
        setPageTitle(vue.liveInfo.name);
        if (!!vue.liveInfo.teacher) {
            appendBeRewardUser(vue.liveInfo.teacher)
        }
    }

    function willShowQrCode() {
        var isUserSubscribe = (App.data && App.data.wx_app_user && App.data.wx_app_user.subscribe);
        var localData = localStorage['everShowSubscribeCode.' + vue.liveInfo.id];
        if (!localData) {
            return !isUserSubscribe;
        }
        localData = JSON.parse(localData);
        return (!isUserSubscribe) && !(localData.amount >= 2 && (new Date(localData.expire_time)) > (new Date()));
    }

    function setEverShowSubscribe() {
        var localData = localStorage['everShowSubscribeCode.' + vue.liveInfo.id];
        if (localData) {
            localData = JSON.parse(localData);
            localData.amount = (new Date(localData.expire_time)) < (new Date()) ? 1 : localData.amount + 1;
        } else {
            localData = {'amount': 1}
        }
        localData.expire_time = (new Date()).getTime() + 12 * 60 * 60 * 1000;
        localStorage['everShowSubscribeCode.' + vue.liveInfo.id] = JSON.stringify(localData);
    }

    function fixScrollInput() {
        var tempTime = new Date();

        function _resetScrollTop() {
            document.body.scrollTop = document.body.scrollHeight;
            if (((new Date()) - tempTime) < 1000) {
                setTimeout(_resetScrollTop, 150);
            }
        }

        setTimeout(_resetScrollTop, 100);
    }

    function initSeriesLives() {
        if (vue.seriesObjects == null && !!vue.liveInfo.series_id) {
            App.api('/live_/series/series_live_list?ser_id=' + vue.liveInfo.series_id + '&limit=100', function (rspData) {
                vue.seriesObjects = [];
                var totalMoney = 0;
                for (var i = 0; i < rspData.items.length; i++) {
                    var oneObject = rspData.items[i];
                    if (oneObject.index_show) {
                        if (oneObject.join_alone) {
                            totalMoney = totalMoney + oneObject.price;
                        }
                        vue.seriesObjects.push(oneObject);
                    }
                }
                vue.seriesLiveMoney = totalMoney;
            })
        }
    }

    function buyLive(buyType) {
        var buyUrl = null;
        switch (buyType) {
            case'live':
                buyUrl = '/live_/money/buy_ticket?live_id=' + vue.liveInfo.id;
                break;
            case'series':
                buyUrl = '/live_/money/buy_series?series_id=' + vue.liveInfo.series_id;
                break;
            default:
                App.alertResult(false, '错误的购买类型');
                return
        }
        if (!!buyUrl) {
            if (!!saleLinkId) {
                buyUrl = buyUrl + '&salelink_id=' + saleLinkId;
            }
        }
        App.ctrls.wxPayTools.scanConfig({
            qrCodeImgSelector: '.purchase_qrcode_img',
            moneySelector: '.purchase_qrcode_money',
            payDialogSelector: '#pay_dialog',
            checkUrl: '/live_/keepalive/wait_paid'
        });
        App.ctrls.wxPayTools.weixinPay({
            buyUrl: buyUrl, wishScan: true, success: function () {
                connectLive();
            }
        });
    }

    function rewardOpt(money, e) {
        if (isNaN(money)) {
            return App.alertResult(false, '打赏金额只能是数字');
        }
        money = parseFloat(money);
        if (money <= 0) {
            return App.alertResult(false, '打赏金额需要大于0');
        }
        var vue = App.ctrls.livePlay.getVue();
        var buyUrl = '/live_/money/order_reward?live_id=' + vue.liveInfo.id + '&money=' + money;
        buyUrl = App.utils.addParam(buyUrl, 'adopt_user_id', vue.selectRewardUId);
        App.ctrls.wxPayTools.scanConfig({
            qrCodeImgSelector: '.purchase_qrcode_img',
            moneySelector: '.purchase_qrcode_money',
            payDialogSelector: '#pay_dialog',
            checkUrl: '/live_/keepalive/wait_paid'
        });
        App.ctrls.wxPayTools.weixinPay({
            buyUrl: buyUrl, wishScan: true, success: function () {
                vue.rewardTeachModel = false;
                $('#reward-othnum').val('');
                vue.rewardOtherConfirm = false;
            }
        });
    }

    function showUrlQrCode(url) {
        $("#url-qr-code").html('');
        $("#url-qr-code").qrcode({render: "canvas", width: 180, height: 180, text: url});
        var canvas = $('#url-qr-code canvas')[0];
        var base64 = canvas.toDataURL('image/jpeg', 1);
        $('.share-qrcode-zone img').attr('src', base64);
        vue.urlQrCodeModel = true;
    }

    function sendNotify() {
        App.showLoading('...');
        App.api('/live_/info/check_notify', {'object_id': vue.liveInfo.id, 'object_type': 10}, function (checkRsp) {
            App.hideLoading(true);
            var desc = '一共可推送3次，每次时间间隔需要大于24小时，推送对象是在有讲关注了本直播间的用户。';
            App.confirm('还剩' + checkRsp.left_count + '次推送机会', desc, function () {
                if (!checkRsp.result) {
                    return
                }
                App.showLoading('发送中...');
                App.api('/live_/info/send_notify', {
                    'object_id': vue.liveInfo.id,
                    'object_type': 10
                }, function (sendRsp) {
                    App.hideLoading(true);
                    App.alertResult(true, '已发送');
                }, function () {
                    App.hideLoading(true);
                })
            }, (!checkRsp.result));
        }, function () {
            App.hideLoading(true);
        });
    }

    function subscribeOpt(e) {
        App.api('/live_/user/subscribe_account?acc_id=' + vue.accountInfo.id, function (rspData) {
            vue.isSubscribe = true;
            App.alertResult(true, '已关注');
        });
    }

    function setRewordShow(isShow) {
        var warnDesc = '关闭以后，只会在直播右边弹出短时间内的打赏，确定吗？';
        if (isShow) {
            warnDesc = '打开以后，直播过程中所有打赏将跟老师的消息一起显示在直播里面，确定吗？'
        }
        App.confirm('提示', warnDesc, function () {
            App.showLoading('提交中...');
            App.api('/live_/set_reward_show?is_show=' + parseInt(isShow) + '&live_id=' + vue.liveInfo.id, function (rspData) {
                App.hideLoading(true);
                App.alertSuccess('已提交');
                vue.isShowOptDlg = false;
            }, function (err) {
                App.debug('set_reward_show, err:' + err);
                App.hideLoading(true);
            })
        });
    }

    function _initJsSdk() {
        if (!!App.ctrls.wxJssdk) {
            var jssdkApiList = ['chooseWXPay', 'previewImage', 'startRecord', 'stopRecord', 'uploadVoice', 'onVoiceRecordEnd'];
            App.ctrls.wxJssdk.initJssdk(3, jssdkApiList, function () {
                vue.readyVoiceJsSdk();
            }, {
                title: vue.liveInfo.name,
                desc: '主讲嘉宾：' + vue.liveInfo.teacher_name + '，有讲等你来听课~',
                imgUrl: vue.liveInfo.cover_image
            });
        }
    }

    function setPageTitle(title) {
        var $body = $('body');
        var faviconUrl = $('#favicon').attr('href');
        document.title = title;
        var $iframe = $('<iframe style="display: none" src="' + faviconUrl + '"></iframe>');
        $iframe.on('load', function () {
            setTimeout(function () {
                $iframe.off('load').remove();
            }, 0);
        }).appendTo($body);
    }

    function isShowVip(accountInfo) {
        var isInside = [1, 2, 4, 5, 6, 11].indexOf(accountInfo.id) >= 0;
        if (!isInside) {
            return
        }
        App.api('user/vip_info', function (rspData) {
            if (!rspData.id) {
                $('#room-vip-card').show()
            }
        });
    }

    function examineOtherConfirm() {
        var opt = $('#reward-othnum').val();
        opt && opt.length ? vue.rewardOtherConfirm = true : vue.rewardOtherConfirm = false;
    }

    function otherRewardOpt(e) {
        if (!vue.rewardOtherConfirm) {
            return
        }
        rewardOpt($('#reward-othnum').val(), e);
    }

    $(document).ready(function () {
        App.debug('document.ready...');
        liveId = parseInt($('#live-id-value').val());
        saleLinkId = parseInt($('#sale-link-id-value').val());
        identity = App.utils.urlParam('identity');
        normalTicketStr = App.utils.urlParam('tc');
        var addConnectArgs = {id: liveId};
        if (normalTicketStr) {
            var temp = normalTicketStr.split('-');
            if (temp.length == 3) {
                addConnectArgs.ntid = temp[2];
                addConnectArgs.ntc = temp[1];
            }
        }
        sseConnectUrl = App.utils.buildUrl('/live_/sse_connect/liveroom', addConnectArgs);
        waitMsgUrl = App.utils.buildUrl('/live_/keepalive/wait_msg', addConnectArgs);
        userAuthUrl = App.utils.buildUrl('/live_/user/play_auth', addConnectArgs);
        connectLive();
        if (App.ctrls.liveLearnRecord) {
            App.debug('begin init learn record...');
            App.ctrls.liveLearnRecord.init(liveId, 10);
        } else {
            App.debug('empty learn record...');
        }
    });
    // App.ctrls.livePlay = {
    //     getVue: function () {
    //         return vue;
    //     }
    // };
})();