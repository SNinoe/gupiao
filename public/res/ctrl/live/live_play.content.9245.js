var PlayContent = (function () {
    var TYPE_TEXT = 1;
    var TYPE_VOICE = 2;
    var TYPE_IMG = 3;
    var TYPE_REWARD = 4;
    var TYPE_VIDEO = 5;
    var TYPE_SYS = 99;
    var CONTENT_TYPES = {
        TEXT: TYPE_TEXT,
        VOICE: TYPE_VOICE,
        IMAGE: TYPE_IMG,
        REWARD: TYPE_REWARD,
        VIDEO: TYPE_VIDEO,
        SYS: TYPE_SYS
    };
    var FETCH_NEW = 'new';
    var FETCH_FIRST = 'first';
    var FETCH_HISTORY = 'history';
    var initContentNum = null;
    var loopFetchAmount = 0;
    var onceLoopLimit = 50;
    var fetchBiggerFinish = true;
    var fetchSmallerFinish = true;
    var fetchTotalCallback = null;
    var initFetchCallback = null;
    var deletedContentNums = [];
    var vueMethods = {
        beginFetchContents: beginFetchContents,
        initDeletedContents: initDeletedContents,
        fetchContentMoreNew: fetchContentMoreNew,
        appendContent: appendContent,
        prependContent: prependContent,
        deleteContent: deleteContent,
        resendContent: resendContent,
        sendContentText: sendText,
        selectContentImg: selectImage,
        sendMaterial: sendMaterial,
        sendVoice: sendVoice,
        forbidDiscuss: forbidDiscuss,
        enableDiscuss: enableDiscuss,
        onContentMsg: onContentMsg,
        onDeleteContent: onDeleteContent,
        onScrollContent: onScrollContent,
        scrollContentBottom: scrollToBottom,
        scrollContentTop: scrollToTop,
        scrollContentUp: scrollUp,
        previewOriImg: previewOriImg,
        identityStr: identityStr,
        isContentAtBottom: isContentAtBottom
    };
    var vueData = {
        CONTENT_TYPES: CONTENT_TYPES,
        FETCH_NEW: FETCH_NEW,
        FETCH_FIRST: FETCH_FIRST,
        FETCH_HISTORY: FETCH_HISTORY,
        contents: [],
        popRewards: [],
        maxContentNum: null,
        minContentNum: null
    };

    function beginFetchContents(fetchType, showLoading, historyNum) {
        var vue = App.ctrls.livePlay.getVue();

        function __onLoadTotal() {
            if (!!fetchType) {
                _initContents(fetchType, historyNum);
            }
        }

        if (vue.totalLiveData == null) {
            if (showLoading) {
                App.showLoading('加载中...');
            }
            _fetchTotalContents(__onLoadTotal);
        } else {
            __onLoadTotal();
        }
    }

    function _fetchTotalContents(callback) {
        if (fetchTotalCallback != null) {
            if (!!callback) {
                fetchTotalCallback = callback;
            }
            return
        }
        fetchTotalCallback = callback;
        var vue = App.ctrls.livePlay.getVue();
        var url = vue.liveInfo.total_url;

        function _onFetch(_totalContents) {
            vue.totalLiveData = !!_totalContents ? _totalContents : {};
            App.hideLoading();
            fetchTotalCallback();
        }

        if (!!url) {
            App.http(url, null, function (rspData) {
                rspData = eval('(' + rspData + ')');
                if (rspData && rspData.datas) {
                    return _onFetch(rspData.datas);
                }
                return _onFetch();
            }, function (status) {
                console.log('_fetchTotalContents, url, status:', url, status);
                return _onFetch();
            });
        } else {
            return _onFetch();
        }
    }

    function onContentMsg(num) {
        var vue = App.ctrls.livePlay.getVue();
        if ((!!vue.maxContentNum) && (vue.maxContentNum >= vue.liveInfo.content_num) && (vue.maxContentNum < num)) {
            Vue.set(vue.liveInfo, 'content_num', Math.max(num, vue.liveInfo.content_num));
            _fetchBigger(vue.maxContentNum + 1);
        } else {
            Vue.set(vue.liveInfo, 'content_num', Math.max(num, vue.liveInfo.content_num));
        }
    }

    function onDeleteContent(contId, user) {
        var vue = App.ctrls.livePlay.getVue();
        var index = parseInt($('.one-content-item[data-id="' + contId + '"]').attr('data-index'));
        if (!index) {
            return
        }
        var item = vue.contents[index];
        if (item.id == contId) {
            vue.contents.splice(index, 1);
            deletedContentNums.push(item.live_num);
        }
        var nickname = !user ? '' : (user.id == vue.myUserId ? '您' : user.nickname);
        vue.appendContent({'content': nickname + '撤回了一条消息', 'type': TYPE_SYS});
        vue.onDeleteVoice(contId);
    }

    function appendContent(data) {
        var vue = App.ctrls.livePlay.getVue();
        data = _countViewSize(data);
        if (data.type == TYPE_TEXT) {
            data.content = App.utils.replaceUrl(data.content);
        } else if (TYPE_REWARD == data.type) {
            console.log('reward data.content:', data.content);
            if (data.content) {
                var _tempData = JSON.parse(data.content);
                data.adopt_user = _tempData.adopt_user;
            }
            if (!data.adopt_user) {
                data.adopt_user = vue.liveInfo.teacher ? vue.liveInfo.teacher : {'nickname': vue.liveInfo.teacher_name};
            }
            console.log('reward adopt_user:', data.adopt_user);
        }
        vue.contents.push(data);
    }

    function prependContent(data) {
        var vue = App.ctrls.livePlay.getVue();
        var container = $('.scrolling-main')[0];
        var oldHeight = container.scrollHeight;
        var oldScrollTop = container.scrollTop;
        data = _countViewSize(data);
        if (data.type == TYPE_TEXT) {
            data.content = App.utils.replaceUrl(data.content);
        } else if (TYPE_REWARD == data.type) {
            if (data.content) {
                var _tempData = JSON.parse(data.content);
                data.adopt_user = _tempData.adopt_user;
            }
            if (!data.adopt_user) {
                data.adopt_user = vue.liveInfo.teacher ? vue.liveInfo.teacher : {'nickname': vue.liveInfo.teacher_name};
            }
        }
        vue.contents.unshift(data);
        vue.$nextTick(function () {
            container.scrollTop = container.scrollHeight - oldHeight + oldScrollTop;
        });
    }

    function _countViewSize(data) {
        var vue = App.ctrls.livePlay.getVue();
        if (data.type == TYPE_IMG) {
            var maxW = 0.8 * $('#temp-one-item')[0].offsetWidth;
            data.viewWidth = Math.min(maxW, data.img_size.width);
            data.viewHeight = data.viewWidth / data.img_size.width * data.img_size.height;
        }
        if (!!data.discuss_data) {
            if (data.discuss_data.type == vue.DISCUSS_TYPES.IMAGE) {
                if (!!data.discuss_data.img_size) {
                    if (typeof(data.discuss_data.img_size) == 'string') {
                        data.discuss_data.img_size = JSON.parse(data.discuss_data.img_size);
                    }
                    var ratio = Math.min($('#temp-reply-img')[0].offsetWidth, data.discuss_data.img_size.width) / data.discuss_data.img_size.width;
                    data.replyImgHeight = '' + (ratio * data.discuss_data.img_size.height) + 'px';
                } else {
                    data.replyImgHeight = 'auto';
                }
            }
        }
        return data;
    }

    function fetchContentMoreNew() {
        var vue = App.ctrls.livePlay.getVue();
        if (vue.maxContentNum < vue.liveInfo.content_num && !vue.isMsgFull()) {
            loopFetchAmount = 0;
            if (fetchBiggerFinish) {
                _fetchBigger(vue.maxContentNum + 1);
            }
        }
    }

    function fetchContentMoreOld() {
        var vue = App.ctrls.livePlay.getVue();
        if (vue.minContentNum > 1 && !vue.isMsgFull()) {
            loopFetchAmount = 0;
            if (fetchSmallerFinish) {
                _fetchSmaller(vue.minContentNum - 1);
            }
        }
    }

    function initDeletedContents() {
        var vue = App.ctrls.livePlay.getVue();
        modify_datas = vue.liveInfo.modify_datas;
        var tmpDeletedLiveNums = modify_datas['delete_live_nums'];
        if (tmpDeletedLiveNums) {
            for (var i = 0; i < tmpDeletedLiveNums.length; i++) {
                var liveNum = tmpDeletedLiveNums[i];
                var contId = $('.one-content-item[data-num="' + liveNum + '"]').attr('data-id');
                if (!!contId) {
                    onDeleteContent(parseInt(contId), null);
                }
            }
        }
        deletedContentNums = (!!tmpDeletedLiveNums) ? tmpDeletedLiveNums : [];
    }

    function _initContents(initType, beginNum) {
        if (initContentNum != null) {
            return
        }
        var vue = App.ctrls.livePlay.getVue();
        loopFetchAmount = 0;
        if (initType == FETCH_FIRST) {
            vue.maxContentNum = vue.minContentNum = initContentNum = 1;
            _fetchBigger(1);
        } else if (initType == FETCH_HISTORY) {
            var historyNum = beginNum;
            vue.maxContentNum = vue.minContentNum = initContentNum = beginNum;
            initFetchCallback = function () {
                vue.$nextTick(function () {
                    vue.loadHistoryDuration();
                    vue.playVoice(historyNum);
                    initFetchCallback = null;
                    _fetchSmaller(initContentNum - 1);
                });
            };
            _fetchBigger(beginNum);
        } else if (initType == FETCH_NEW) {
            vue.maxContentNum = vue.minContentNum = initContentNum = parseInt(vue.liveInfo.content_num);
            _fetchSmaller(initContentNum);
        }
        if (!initContentNum) {
            initContentNum = beginNum;
        }
    }

    function _fetchBigger(num) {
        function _biggerFinish() {
            fetchBiggerFinish = true;
            if (!!initFetchCallback) {
                initFetchCallback();
                initFetchCallback = null;
            }
        }

        var vue = App.ctrls.livePlay.getVue();
        if (num > vue.liveInfo.content_num || vue.isMsgFull()) {
            return _biggerFinish();
        }
        fetchBiggerFinish = false;
        _fetchOne(num, function (_oneData) {
            if (!!_oneData) {
                _checkRealTimeMsg(num);
            }
            if (_oneData && _oneData.type == TYPE_VOICE) {
                vue.onNewVoice(num);
            }
            loopFetchAmount += 1;
            if (vue.maxContentNum == null || vue.maxContentNum < num) {
                vue.maxContentNum = num;
            }
            if (vue.liveInfo.content_num > vue.maxContentNum) {
                if (onceLoopLimit > loopFetchAmount) {
                    _fetchBigger(num + 1);
                } else {
                    vue.$nextTick(function () {
                        if (isContentAtTop()) {
                            loopFetchAmount = 0;
                            _fetchBigger(num + 1);
                        }
                    })
                }
            }
            if (vue.liveInfo.content_num <= vue.maxContentNum || onceLoopLimit <= loopFetchAmount) {
                _biggerFinish();
            }
        });
    }

    function _fetchSmaller(num) {
        function _smallerFinish() {
            fetchSmallerFinish = true;
            if (!!initFetchCallback) {
                initFetchCallback();
                initFetchCallback = null;
            }
        }

        var vue = App.ctrls.livePlay.getVue();
        if (num < 1 || vue.isMsgFull()) {
            return _smallerFinish();
        }
        fetchSmallerFinish = false;
        _fetchOne(num, function (_oneData) {
            loopFetchAmount += 1;
            if (vue.minContentNum == null || vue.minContentNum > num) {
                vue.minContentNum = num;
            }
            if (1 < vue.minContentNum) {
                if (onceLoopLimit > loopFetchAmount) {
                    _fetchSmaller(num - 1);
                } else {
                    vue.$nextTick(function () {
                        if (isContentAtTop()) {
                            loopFetchAmount = 0;
                            _fetchSmaller(num - 1);
                        }
                    })
                }
            }
            if (1 >= vue.minContentNum || onceLoopLimit <= loopFetchAmount) {
                _smallerFinish();
            }
        });
    }

    var retryContentNums = {};

    function _fetchOne(num, callback) {
        var vue = App.ctrls.livePlay.getVue();

        function _fetchFinish(_oneData) {
            if (callback) {
                callback(_oneData);
            }
            vue.$nextTick(function () {
                if (onceLoopLimit <= loopFetchAmount && (!_isPageFull())) {
                    loopFetchAmount = 0;
                    if (num > initContentNum) {
                        _fetchBigger(vue.maxContentNum + 1);
                    } else if (num < initContentNum) {
                        _fetchSmaller(vue.minContentNum - 1);
                    } else if (initContentNum == 1) {
                        _fetchBigger(vue.maxContentNum + 1);
                    } else {
                        _fetchSmaller(vue.minContentNum - 1);
                    }
                }
                if (!!_oneData && !App.utils.isWeixin()) {
                    var isReplyImg = (!!_oneData.discuss_data) && (_oneData.discuss_data.type == vue.DISCUSS_TYPES.IMAGE);
                    if (_oneData.type == TYPE_IMG || isReplyImg) {
                        vue.initPhotoSwipeFromDOM('.my-gallery');
                    }
                }
            });
        }

        if (_isDeleted(num)) {
            return _fetchFinish();
        } else {
            function __onGotOneContent(_data) {
                delete retryContentNums[num];
                if (_data.deleted) {
                    return _fetchFinish();
                }
                if (_isFinishReward(_data)) {
                    return _fetchFinish();
                }
                if ((!!_data.discuss_data) && !_data.discuss_data.type) {
                    _data.discuss_data.type = vue.DISCUSS_TYPES.TEXT;
                }
                function __onGotUser(_user) {
                    if ([TYPE_TEXT, TYPE_IMG, TYPE_VOICE].indexOf(_data.type) >= 0) {
                        vue.appendBeRewardUser(_user);
                    }
                    _data.user = _user;
                    if (_data.type == TYPE_REWARD && !vue.liveInfo.show_reward) {
                        if (num > vue.serverInitContentNum) {
                            _addRewardPop(_data);
                        }
                        _fetchFinish();
                    } else {
                        var elFilter = '.one-content-item[data-id="' + _data.id + '"]';
                        if ($(elFilter).length <= 0) {
                            if (num >= initContentNum) {
                                vue.appendContent(_data);
                            } else {
                                vue.prependContent(_data);
                            }
                        }
                        _fetchFinish(_data);
                    }
                }

                if (_data.user) {
                    __onGotUser(_data.user);
                } else {
                    App.api('user/summary?id=' + _data.user_id, __onGotUser, null, {enableCache: true});
                }
            }

            if (vue.totalLiveData && vue.totalLiveData[num]) {
                __onGotOneContent(vue.totalLiveData[num]);
            } else {
                var liveId = vue.liveInfo.id;
                var fileKey = 'live-data/' + liveId + '/' + num;
                var url = App.utils.ossUrl(fileKey);
                if (liveId < 10) {
                    url = App.utils.qiniuUrl(fileKey);
                }
                var version = localStorage['' + liveId + '.liveContent.' + num + '.version'];
                if (version) {
                    url = url + '?v=' + version;
                }
                if (retryContentNums[num]) {
                    url = _resetQiniuUrlVersion(url);
                }
                App.http(url, null, function (content) {
                    content = eval('(' + content + ')');
                    __onGotOneContent(content);
                }, function (status) {
                    App.debug('http fetchContent错误: ' + status);
                    _fetchFinish();
                    if (!retryContentNums[num]) {
                        retryContentNums[num] = 0;
                    }
                    retryContentNums[num] += 1;
                    if (retryContentNums[num] > 2) {
                        delete retryContentNums[num];
                        return;
                    }
                    setTimeout(function () {
                        _fetchOne(num);
                    }, 1500);
                });
            }
        }
    }

    function _isDeleted(num) {
        return deletedContentNums.indexOf(num) >= 0;
    }

    function _isFinishReward(contentData) {
        var vue = App.ctrls.livePlay.getVue();
        return vue.liveInfo.finished && contentData.type == TYPE_REWARD;
    }

    function identityStr(userId) {
        if (this.isUserTeacher(userId)) {
            return '嘉宾';
        } else if (this.isUserAssist(userId)) {
            return '联席嘉宾';
        } else if (this.isUserAdmin(userId)) {
            return '主持人';
        }
        return null;
    }

    function _isPageFull() {
        return $('.live-main')[0].offsetHeight >= $('.scrolling-main')[0].offsetHeight;
    }

    function _checkRealTimeMsg(liveNum) {
        var vue = App.ctrls.livePlay.getVue();
        if (liveNum > vue.serverInitContentNum) {
            if (isContentAtBottom()) {
                vue.$nextTick(function () {
                    scrollToBottom();
                });
            } else {
                vue.showNewMsgTips(liveNum);
            }
        }
    }

    function scrollToBottom() {
        var container = $('.scrolling-main')[0];
        $(container).animate({scrollTop: scrollTop = container.scrollHeight - container.clientHeight}, 300);
    }

    function scrollToTop() {
        var container = $('.scrolling-main')[0];
        $(container).animate({scrollTop: scrollTop = 0}, 300);
    }

    function scrollUp(distance) {
        var container = $('.scrolling-main')[0];
        var newScrollTop = container.scrollTop() + distance;
        $(container).animate({scrollTop: scrollTop = newScrollTop}, 300);
    }

    function isContentAtBottom() {
        var dpr = window.devicePixelRatio;
        if (!dpr) dpr = 1.0;
        var container = $('.scrolling-main')[0];
        return container.scrollTop + container.clientHeight >= (container.scrollHeight - 15 * dpr);
    }

    function isContentAtTop() {
        var vue = App.ctrls.livePlay.getVue();
        return (vue.$refs.scrollingMain.scrollTop == 0);
    }

    var tempBtnTimeout = null;

    function onScrollContent(e) {
        var vue = App.ctrls.livePlay.getVue();

        function _checkScrollBtn() {
            vue.scrolling = 1;
            if (!!tempBtnTimeout) {
                window.clearTimeout(tempBtnTimeout);
            }
            tempBtnTimeout = setTimeout(function () {
                vue.scrolling = null;
            }, 2300);
        }

        _checkScrollBtn();
        var isBottom = isContentAtBottom();
        if (isBottom) {
            this.hideNewMsgTips();
            fetchContentMoreNew();
        }
        if (e.currentTarget.scrollTop == 0) {
            fetchContentMoreOld();
        }
        vue.checkCurrentInEye();
    }

    function previewOriImg(oriSrc, e) {
        var urls = [];
        $('.live-main .one-content-img').each(function (i, e1) {
            urls.push($(e1).attr('ori-src'))
        });
        wx.previewImage({current: oriSrc, urls: urls});
    }

    function _renderWaiting(_data) {
        var data = $.extend(true, {}, _data);
        var vue = App.ctrls.livePlay.getVue();
        if (data.type == TYPE_IMG) {
            if (data.upload_type == 'input_image') {
                data.content = 'data:image;base64,' + data.image_data;
            } else if (data.upload_type == 'material') {
                var matId = data.mat_id;
                var matIndex = $('#images-material-list .item[data-id="' + matId + '"]').attr('data-index');
                var matInfo = vue.imgMaterials[parseInt(matIndex)];
                data.content = matInfo.img_src;
                data.img_size = {'width': matInfo.data.img_size.width, 'height': matInfo.data.img_size.height}
            }
        } else if (TYPE_VOICE == data.type) {
            if (data.upload_type == 'material') {
                var voiceMatIndex = $('#voice-material-list .item[data-id="' + data.mat_id + '"]').attr('data-index');
                var voiceMatInfo = vue.voiceMaterials[parseInt(voiceMatIndex)];
                data.content = voiceMatInfo.content;
                data.length = voiceMatInfo.data.length;
            }
        }
        data.id = Math.random().toString(36).substr(2);
        data.isPrepare = true;
        data.user = App.data.user;
        vue.appendContent(data);
        vue.$nextTick(function () {
            vue.scrollContentBottom();
        });
        return data.id;
    }

    function _finishWaiting(clientContId, newData) {
        var vue = App.ctrls.livePlay.getVue();

        function _removeExist() {
            var _filter = '.one-content-item[data-id="' + newData.id + '"]';
            if ($(_filter).length > 0) {
                var _index = parseInt($(_filter).attr('data-index'));
                vue.contents.splice(_index, 1);
            }
        }

        _removeExist();
        vue.$nextTick(function () {
            var index = parseInt($('.one-content-item[data-id="' + clientContId + '"]').attr('data-index'));
            var contentData = vue.contents[index];
            console.log('clientContId, index, contentData:', clientContId, index, contentData);
            if (!!newData) {
                contentData.id = newData.id;
                contentData.isPrepare = false;
                contentData.live_num = newData.live_num;
                if (contentData.type == TYPE_VOICE) {
                    contentData.content = newData.content;
                }
                contentData.isError = false;
            } else {
                contentData.isError = true;
            }
            vue.contents.splice(index, 1, contentData);
        });
    }

    function resendContent(clientContId) {
        var vue = App.ctrls.livePlay.getVue();
        var index = parseInt($('.one-content-item[data-id="' + clientContId + '"]').attr('data-index'));
        var contentData = vue.contents[index];
        var reqData = $.extend(true, {}, contentData);
        delete reqData.id;
        delete reqData.isPrepare;
        delete reqData.user;
        delete reqData.isError;
        if (reqData.type == TYPE_IMG) {
            delete reqData.content;
            _doSend();
        } else if (reqData.type == TYPE_VOICE) {
            if (!reqData.media_id) {
                wx.uploadVoice({
                    localId: reqData.localId, isShowProgressTips: 1, success: function (res) {
                        reqData.media_id = res.seriesId;
                        _doSend();
                    }, fail: function (resMsg) {
                        App.alertResult(false, '上传微信服务器失败');
                        data.isError = true;
                    }
                });
            } else {
                _doSend();
            }
        } else {
            _doSend();
        }
        function _doSend() {
            console.log('resend, reqData:', reqData);
            App.api('/live_publish/publish/publish_content?live_id=' + vue.liveInfo.id, reqData, function (rspData) {
                console.log('发送成功');
                _finishWaiting(clientContId, rspData);
            }, function () {
                _finishWaiting(clientContId);
            });
        }
    }

    function _sendContent(data, onSuccess) {
        var vue = App.ctrls.livePlay.getVue();
        var liveId = vue.liveInfo.id;
        var clientContId = _renderWaiting(data);
        var reqData = $.extend({}, data);
        if (!!reqData.discuss_data) {
            delete reqData.discuss_data
        }
        App.api('/live_publish/publish/publish_content?live_id=' + liveId, reqData, function (rspData) {
            console.log('发送成功');
            _finishWaiting(clientContId, rspData);
            if (!!onSuccess) {
                onSuccess();
            }
        }, function () {
            _finishWaiting(clientContId);
        });
    }

    function sendText(contentText, onSuccess) {
        contentText = contentText.replace(/\n|\r\n/g, "<br/>");
        if (contentText.replace(/^\s*/, '').length <= 0) {
            return
        }
        var _data = {'type': TYPE_TEXT, 'content': contentText};
        var vue = App.ctrls.livePlay.getVue();
        if (!!vue.replyDiscuss) {
            _data.reply_discuss_id = vue.replyDiscuss.id;
            _data.discuss_data = vue.replyDiscuss;
        }
        _sendContent(_data, onSuccess);
    }

    function selectImage() {
        App.ctrls.imageInput.chooseImage({
            compressed: true, success: function (base64Data, size) {
                var _data = {
                    'type': TYPE_IMG,
                    'img_size': size,
                    'image_data': base64Data,
                    'upload_type': 'input_image'
                };
                _sendContent(_data);
                App.ctrls.livePlay.getVue().scrollContentBottom();
            }
        });
    }

    function sendMaterial(matId, contentType, onDoSend) {
        var vue = App.ctrls.livePlay.getVue();
        App.confirm('提示', '确定要发送本素材吗？', function () {
            var _data = {mat_id: matId, type: contentType, material: true, upload_type: 'material'};
            _sendContent(_data);
            onDoSend();
            Vue.nextTick(function () {
                vue.scrollContentBottom();
            });
        });
    }

    function sendVoice(localId, voiceLen) {
        var vue = App.ctrls.livePlay.getVue();
        var data = {'type': TYPE_VOICE, 'length': voiceLen, 'upload_type': 'wx_voice', 'localId': localId};
        var onSuccess = null;
        if (!!vue.replyDiscuss) {
            data.reply_discuss_id = vue.replyDiscuss.id;
            data.discuss_data = vue.replyDiscuss;
            onSuccess = function () {
                App.alertSuccess('已回复本讨论并添加到主屏');
                vue.replyDiscuss = null;
            }
        }
        wx.uploadVoice({
            localId: localId, isShowProgressTips: 1, success: function (res) {
                data.media_id = res.serverId;
                _sendContent(data, onSuccess);
            }, fail: function (resMsg) {
                App.alertResult(false, '微信网络出错');
                data.isError = true;
                _renderWaiting(data);
            }
        });
    }

    function forbidDiscuss() {
        var vue = App.ctrls.livePlay.getVue();
        App.api('/live_publish/publish/forbid_discuss?live_id=' + vue.liveInfo.id, function (rspData) {
            vue.liveInfo.forbid_discuss = 1;
        });
    }

    function enableDiscuss() {
        var vue = App.ctrls.livePlay.getVue();
        App.api('/live_publish/publish/enable_discuss?live_id=' + vue.liveInfo.id, function (rspData) {
            vue.liveInfo.forbid_discuss = 0;
        });
    }

    function deleteContent(contId, index, e) {
        var vue = App.ctrls.livePlay.getVue();
        App.confirm('警告', '确定删除这条内容吗？', function () {
            if (parseInt(contId)) {
                App.api('/live_publish/publish/delete_content?live_id=' + vue.liveInfo.id + '&content_id=' + contId, function (rspData) {
                    onDeleteContent(contId, App.data.user);
                    App.alertSuccess('操作成功');
                });
            } else {
                onDeleteContent(contId, App.data.user);
            }
        });
    }

    function _resetQiniuUrlVersion(preUrl) {
        var argIndex = preUrl.indexOf('?v=');
        var curSrc = preUrl;
        if (argIndex > 0) {
            curSrc = preUrl.slice(0, argIndex);
        }
        curSrc = curSrc + '?v=' + Math.random().toString(36).substr(2);
        return curSrc;
    }

    var rewardPopUpdateTime = null;
    var checkRewardTimeout = null;

    function _checkPopRewards() {
        var vue = App.ctrls.livePlay.getVue();
        if (vue.liveInfo.finished) {
            return
        }
        var _now = new Date();
        if (vue.liveInfo.show_reward || !rewardPopUpdateTime) {
            vue.popRewards = [];
        } else if (20 * 1000 <= parseInt(_now - rewardPopUpdateTime)) {
            vue.popRewards = [];
        }
        if (checkRewardTimeout) {
            clearTimeout(checkRewardTimeout);
        }
        checkRewardTimeout = setTimeout(_checkPopRewards, 5000);
    }

    checkRewardTimeout = setTimeout(_checkPopRewards, 5000);
    function _addRewardPop(oneContent) {
        var vue = App.ctrls.livePlay.getVue();
        if (vue.liveInfo.finished) {
            return
        }
        if (!vue.liveInfo.show_reward) {
            vue.popRewards.push(oneContent);
            vue.popRewards = vue.popRewards.slice(Math.max(0, vue.popRewards.length - 3), vue.popRewards.length);
            rewardPopUpdateTime = new Date();
            _checkPopRewards();
        }
    }

    return {vueMethods: vueMethods, vueData: vueData}
})();