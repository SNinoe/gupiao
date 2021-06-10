var PlayVoice = (function () {
    var playingContId = null;
    var errorAudiosContIds = [];
    var startX, startWidth, x, aboveX, preShowAudioTime, dragAudioTime = 0;
    var dragging = false;
    var dragIntervals = {};
    var historyDuration = null;
    var READY = 1;
    var CLICK_ING = 2;
    var CLICK_FINISH = 3;
    var PRESS_OUT = 101;
    var PRESS_ON = 102;
    var vueMethods = {
        playVoice: playVoice,
        clickVoiceBar: clickVoiceBar,
        onNewVoice: onNewVoice,
        onLoadedVoice: onLoadedVoice,
        onPlayVoice: onPlayVoice,
        onPauseVoice: onPauseVoice,
        onEndVoice: onEndVoice,
        onErrorVoice: onErrorVoice,
        onStalledVoice: onStalledVoice,
        onDragTouchStart: onDragTouchStart,
        onDragTouchMove: onDragTouchMove,
        onDragTouchEnd: onDragTouchEnd,
        onDeleteVoice: onDeleteVoice,
        isRead: _isRead,
        jumpToCurrent: _jumpToCurrent,
        checkCurrentInEye: _checkCurrentInEye,
        getHistoryContNum: getHistoryContNum,
        readyVoiceJsSdk: readyVoiceJsSdk,
        onPressRecord: onPressRecord,
        movePressRecord: movePressRecord,
        endPressRecord: endPressRecord,
        clickBeginRecord: clickBeginRecord,
        clickStopRecord: clickStopRecord,
        clickCancelSend: clickCancelSend,
        clickSendRecord: clickSendRecord,
        loadHistoryDuration: loadHistoryDuration
    };
    var vueData = {
        READY: READY,
        CLICK_ING: CLICK_ING,
        CLICK_FINISH: CLICK_FINISH,
        PRESS_OUT: PRESS_OUT,
        PRESS_ON: PRESS_ON,
        recordStatus: READY,
        recordSeconds: 0
    };
    var recordVoiceId = null;
    var recordTimeout = null;

    function readyVoiceJsSdk() {
        var vue = App.ctrls.livePlay.getVue();
        var initRecordFinish = false;
        if (vue.isMeManager()) {
            try {
                wx.startRecord();
                console.log('begin record');
                function stopInitRecord() {
                    if (initRecordFinish) {
                        return
                    }
                    wx.stopRecord({
                        success: function (res) {
                            initRecordFinish = true;
                            vue.hasNotJsSdk = false;
                        }
                    });
                    setTimeout(stopInitRecord, 500);
                }

                setTimeout(stopInitRecord, 1000);
            } catch (err) {
                console.log('err:', err);
            }
            recordEvents();
        }
    }

    function _startRecord() {
        if (playingContId) {
            _stopPlay(playingContId);
        }
        console.log('_startRecord');
        recordVoiceId = null;
        var vue = App.ctrls.livePlay.getVue();
        vue.recordSeconds = 0;
        _clearRecordTimeout();
        function _doStart() {
            startWxRecord(function () {
                App.hideLoading(true);
                var vue = App.ctrls.livePlay.getVue();
                if ([CLICK_ING, PRESS_ON, PRESS_OUT].indexOf(vue.recordStatus) < 0) {
                    App.debug('vue.recordStatus err:' + vue.recordStatus);
                    wx.stopRecord();
                    return
                }
                vue.recordSeconds = 0;
                function _countSeconds() {
                    vue.recordSeconds += 1;
                    _clearRecordTimeout();
                    if (vue.recordSeconds < 60) {
                        recordTimeout = setTimeout(_countSeconds, 1000);
                    }
                }

                _clearRecordTimeout();
                recordTimeout = setTimeout(_countSeconds, 1000);
                if (navigator.vibrate) {
                    navigator.vibrate(80);
                } else if (navigator.webkitVibrate) {
                    navigator.webkitVibrate(80);
                }
            });
        }

        _doStart();
    }

    function startWxRecord(onSuccess, onCancel) {
        wx.startRecord({
            success: function () {
                onSuccess();
            }, cancel: function () {
                onCancel();
            }
        });
        wx.onVoiceRecordEnd({
            complete: function (res) {
                App.alertSuccess('已自动发送并继续为您录音...');
                var vue = App.ctrls.livePlay.getVue();
                if (vue.recordSeconds > 2) {
                    _doSendOpt(res.localId, Math.min(60, vue.recordSeconds));
                }
                _startRecord();
            }
        });
    }

    function _clearRecordTimeout() {
        if (!!recordTimeout) {
            window.clearTimeout(recordTimeout);
            recordTimeout = null;
        }
    }

    function _stopRecord(callback) {
        console.log('_stopRecord');
        var vue = App.ctrls.livePlay.getVue();
        var voiceLength = vue.recordSeconds;
        _clearRecordTimeout();
        App.hideLoading(true);
        var stopComplete = false;
        var catchRecord = (voiceLength > 1);
        if (catchRecord) {
        } else if (voiceLength != 0) {
            App.alertResult(false, '说话时间太短', null, true);
        }
        wx.stopRecord({
            success: function (res) {
                console.log('stopRecord success');
                recordVoiceId = (catchRecord && res.localId) ? res.localId : null;
                if (callback) {
                    callback(catchRecord ? voiceLength : null);
                }
            }, fail: function (desc) {
                console.log('stopRecord fail:', desc);
                if (catchRecord) {
                    App.alertResult(false, "录音失败", null, false);
                }
                if (callback) {
                    callback();
                }
            }, complete: function () {
                console.log('stopRecord complete');
                stopComplete = true;
                if (catchRecord) {
                    App.hideLoading(true);
                }
            }
        });
        setTimeout(function () {
            if (catchRecord && !stopComplete) {
                App.hideLoading(true);
                App.alertResult(false, "网络超时", null, false);
                if (callback) {
                    callback();
                }
            }
        }, 5 * 1000);
    }

    function clickBeginRecord(e) {
        var vue = App.ctrls.livePlay.getVue();
        vue.recordStatus = CLICK_ING;
        _startRecord();
    }

    function clickStopRecord(e) {
        var vue = App.ctrls.livePlay.getVue();
        _stopRecord(function (voiceLength) {
            if (!!voiceLength) {
                vue.recordStatus = CLICK_FINISH;
                vue.$nextTick(function () {
                    $('#send-click-btn').attr('data-length', voiceLength);
                });
            } else {
                vue.recordStatus = READY;
            }
        });
    }

    function clickSendRecord(e) {
        var vue = App.ctrls.livePlay.getVue();
        vue.recordStatus = READY;
        _doSendOpt(recordVoiceId, parseInt($('.send_rec').attr('data-length')));
    }

    function clickCancelSend(e) {
        var vue = App.ctrls.livePlay.getVue();
        recordVoiceId = null;
        vue.recordStatus = READY;
    }

    function onPressRecord(e) {
        console.log('onPressRecord');
        var vue = App.ctrls.livePlay.getVue();
        if (vue.recordStatus != PRESS_ON) {
            vue.recordStatus = PRESS_ON;
            _startRecord();
        }
        return false;
    }

    function movePressRecord(e) {
        var vue = App.ctrls.livePlay.getVue();
        var touch = e.touches[0];
        var target = $('.room-footer-bar')[0].offsetTop + $('.room-footer-bar .tool-bar').height();
        if (touch.pageY <= target) {
            vue.recordStatus = PRESS_OUT;
        } else {
            vue.recordStatus = PRESS_ON;
        }
        return false;
    }

    function endPressRecord(e) {
        var vue = App.ctrls.livePlay.getVue();
        var __onStopRecord = null;
        if (vue.recordStatus == PRESS_ON) {
            __onStopRecord = function (voiceLen) {
                if (!!voiceLen) {
                    _doSendOpt(recordVoiceId, voiceLen);
                }
            };
        }
        _stopRecord(__onStopRecord);
        vue.recordSeconds = 0;
        vue.recordStatus = READY;
        return false;
    }

    function _doSendOpt(recId, length) {
        var vue = App.ctrls.livePlay.getVue();
        if (!vue.matVoiceRecordShow) {
            vue.sendVoice(recId, length);
        } else {
            vue.sendMatRecordVoice(recId, length);
        }
    }

    function recordEvents() {
    }

    var deleteVoiceContIds = [];

    function clickVoiceBar(contId) {
        console.log('clickVoiceBar:', contId);
        var selector = '.voice-main[data-id="' + contId + '"] .voice-audio';
        if ($(selector)[0].paused) {
            $('.live-main .voice-audio').each(function (index, event) {
                try {
                    _doPauseVoice(this);
                    var _tempCId = parseInt($(this).parents('.voice-main').attr('data-id'));
                    if (_tempCId != contId) {
                        _setCurrentTime(_tempCId, 0);
                        _setStatus(_tempCId, 'end');
                    }
                } catch (err) {
                    console.log('voiceObjStart, err:', err);
                }
            });
            playingContId = null;
            var _tempIndex = errorAudiosContIds.indexOf(contId);
            if (_tempIndex >= 0) {
                errorAudiosContIds.splice(_tempIndex, 1);
            }
            _loopPlay(contId);
        } else {
            _stopPlay(contId);
        }
    }

    function onNewVoice(contNum) {
        var vue = App.ctrls.livePlay.getVue();
        if (vue.serverInitContentNum >= contNum || vue.isMeManager()) {
            return
        }
        if (!playingContId) {
            vue.$nextTick(function () {
                playVoice(contNum);
            });
        } else {
            var nextVoiceItems = $('.one-content-item[data-id="' + playingContId + '"]').nextAll('.one-content-item[data-type="' + vue.CONTENT_TYPES.VOICE + '"]');
            if (nextVoiceItems.length <= 0) {
                vue.$nextTick(function () {
                    _preloadVoice(contNum);
                });
            }
        }
    }

    function onDeleteVoice(contId) {
        deleteVoiceContIds.push(contId);
        if (contId == playingContId) {
            _doPauseVoice($('.voice-main[data-id="' + contId + '"] .voice-audio')[0]);
            playingContId = null;
            var vue = App.ctrls.livePlay.getVue();
            var nextVoiceItems = $('.one-content-item[data-id="' + contId + '"]').nextAll('.one-content-item[data-type="' + vue.CONTENT_TYPES.VOICE + '"]');
            if (nextVoiceItems.length > 0) {
                var willPlayContId = parseInt($(nextVoiceItems[0]).attr('data-id'));
                vue.$nextTick(function () {
                    _loopPlay(willPlayContId);
                });
            }
        }
    }

    function playVoice(contNum) {
        var contId = $('.one-content-item[data-num="' + contNum + '"]').attr('data-id');
        if (contId) {
            contId = parseInt(contId);
            _loopPlay(contId);
        }
    }

    function onLoadedVoice(e) {
        var _contId = parseInt($(e.currentTarget).parents('.voice-main').attr('data-id'));
        _doPauseVoice(e.currentTarget);
        _setLoaded(_contId);
        _setStatus(_contId, 'end');
        if (!_isDirectPlay(_contId)) {
            return
        }
        if (!playingContId || playingContId == _contId) {
            e.currentTarget.volume = 1;
            _loopPlay(_contId);
        }
        console.log('onLoadedVoice');
    }

    function onPlayVoice(e) {
        var _contId = parseInt($(e.currentTarget).parents('.voice-main').attr('data-id'));
        if (playingContId) {
            if (playingContId != _contId) {
                _doPauseVoice(e.currentTarget);
            }
            return
        }
        if (_isLoaded(_contId)) {
            var contNum = parseInt($(e.currentTarget).parents('.voice-main').attr('data-num'));
            e.currentTarget.volume = 1;
            playingContId = _contId;
            $(e.currentTarget).removeAttr('do-pause');
            _setStatus(_contId, 'play');
            _setRead(contNum);
            _jumpToCurrent();
            _checkCurrentInEye();
            _setHistoryContNum(contNum);
            _checkLoadNextVoice(contNum);
            if (historyDuration && _contId == historyDuration.contId) {
                e.currentTarget.currentTime = historyDuration.currentTime;
            }
            historyDuration = null;
        }
        console.log('onPlayVoice');
    }

    function onPauseVoice(e) {
        var voiceObj = e.currentTarget;
        if ((voiceObj.ended || (voiceObj.duration - voiceObj.currentTime) < 1.0) || !!$(voiceObj).attr('do-pause')) {
            var _contId = parseInt($(voiceObj).parents('.voice-main').attr('data-id'));
            _setStatus(_contId, 'pause');
        } else {
            console.log('replay:', voiceObj.duration - voiceObj.currentTime);
            voiceObj.play();
        }
        console.log('onPauseVoice');
    }

    function onEndVoice(e) {
        var _contId = parseInt($(e.currentTarget).parents('.voice-main').attr('data-id'));
        _setStatus(_contId, 'end');
        _setCurrentTime(_contId, 0);
        if (playingContId == _contId) {
            playingContId = null;
        }
        if (!dragging) {
            _checkAndPlayNext(_contId);
        }
        _checkCurrentInEye();
        console.log('onEndVoice');
    }

    function onErrorVoice(e) {
        App.debug('发生错误');
        App.alertResult(false, "网络出错，请稍后重试或重新进入页面", null, false);
        var _contId = parseInt($(e.currentTarget).parents('.voice-main').attr('data-id'));
        if (errorAudiosContIds.indexOf(_contId) < 0) {
            errorAudiosContIds.push(_contId);
        }
        _setStatus(_contId, 'error');
        $(e.currentTarget).attr('src', _resetQiniuUrlVersion($(e.currentTarget).attr('src')));
        var willPlayNext = _checkAndPlayNext(_contId);
        if (!willPlayNext) {
            _loopPlay(_contId);
        }
        console.log('onErrorVoice');
    }

    function onStalledVoice(e) {
        var _contId = parseInt($(e.currentTarget).parents('.voice-main').attr('data-id'));
        App.debug("stalled:" + _contId);
        if (!_isLoaded(_contId)) {
            App.alertResult(false, "网速不稳定，请点击语音条或重新进入页面", null, false);
        }
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

    function onDragTouchStart(e) {
        var _this = e.currentTarget;
        var _contId = parseInt($(_this).parents('.voice-main').attr('data-id'));
        if (_contId != playingContId)
            return;
        var speed = $(_this).parents('.voice-speed')[0];
        var playTime = $(_this).find('.playTime')[0];
        var fullWidth = $(_this).parents('.progressBar')[0].offsetWidth;
        var duration = _getDuration(_contId);
        var curRatio = parseFloat(('' + speed.style.width).replace('%', '')) * 0.01;
        var touch = e.touches[0];
        startX = touch.pageX;
        startWidth = fullWidth * curRatio;
        dragAudioTime = duration * curRatio;
        preShowAudioTime = Math.ceil(dragAudioTime);
        $(playTime).find('var').text(preShowAudioTime);
        $(playTime).show();
        dragging = true;
        _pauseDrag(_contId);
    }

    function onDragTouchMove(e) {
        var _this = e.currentTarget;
        var _contId = parseInt($(_this).parents('.voice-main').attr('data-id'));
        if (_contId != playingContId)
            return;
        var speed = $(_this).parents('.voice-speed')[0];
        var playTime = $(_this).find('.playTime')[0];
        var touch = e.touches[0];
        x = touch.pageX - startX;
        var curWidth = startWidth + x;
        if (curWidth < 0)
            return;
        var fullWidth = $(_this).parents('.progressBar')[0].offsetWidth;
        if (curWidth > fullWidth)
            return;
        speed.style.width = '' + (curWidth / fullWidth * 100) + '%';
        var duration = _getDuration(_contId);
        var curAudioTime = curWidth / fullWidth * duration;
        dragAudioTime = curAudioTime;
        speed.style.left = aboveX + x + "px";
        if (preShowAudioTime != Math.ceil(curAudioTime)) {
            preShowAudioTime = Math.ceil(curAudioTime);
            $(playTime).find('var').text(preShowAudioTime);
        }
    }

    function onDragTouchEnd(e) {
        var _this = e.currentTarget;
        var _contId = parseInt($(_this).parents('.voice-main').attr('data-id'));
        var playTime = $(_this).find('.playTime')[0];
        if (_contId != playingContId)
            return;
        _setCurrentTime(_contId, dragAudioTime);
        dragging = false;
        _beginDrag(_contId);
        $(playTime).hide();
    }

    function _loopPlay(contId, isFromLoop) {
        if (deleteVoiceContIds.indexOf(parseInt(contId)) >= 0) {
            return
        }
        var mainEl = '.voice-main[data-id="' + contId + '"]';
        var selector = '.voice-main[data-id="' + contId + '"] .voice-audio';
        _setDirectPlay(contId);
        if (_isLoaded(contId)) {
            if (!isFromLoop) {
                return $(selector)[0].play();
            }
            return
        }
        var _preTime = $(mainEl).attr('data-load-time');
        _preTime = (!!_preTime) ? parseInt(_preTime) : 0;
        if (_preTime > 20 * 1000) {
            _setStatus(contId, 'error');
            _checkAndPlayNext(contId);
            return;
        }
        var _waitTime = 2 * 1000;
        $(mainEl).attr('data-load-time', _preTime + _waitTime);
        _setStatus(contId, 'load');
        if (App.utils.isIos() && (typeof WeixinJSBridge) == "object" && (typeof WeixinJSBridge.invoke) == "function") {
            WeixinJSBridge.invoke('getNetworkType', {}, function (res) {
                $(selector)[0].play();
            });
        } else {
            $(selector)[0].play();
        }
        setTimeout(_loopPlay, _waitTime, contId, true);
    }

    function _stopPlay(contId) {
        var selector = '.voice-main[data-id="' + contId + '"] .voice-audio';
        _doPauseVoice($(selector)[0]);
    }

    function _doPauseVoice(voiceObject) {
        $(voiceObject).attr('do-pause', '1');
        voiceObject.pause();
    }

    function _setStatus(contId, status) {
        var startEl = '.voice-main[data-id="' + contId + '"] .voice-content-start';
        var pauseEl = '.voice-main[data-id="' + contId + '"] .voice-content-pause';
        var loadEl = '.voice-main[data-id="' + contId + '"] .voice-content-loading';
        var errorEl = '.voice-main[data-id="' + contId + '"] .reload-btn';
        var processEl = '.voice-main[data-id="' + contId + '"] .progressBar';
        $(startEl).hide();
        $(pauseEl).hide();
        $(loadEl).hide();
        $(errorEl).hide();
        $(processEl).hide();
        _pauseDrag(contId);
        if (status == 'play') {
            $(pauseEl).show();
            $(processEl).show();
            _beginDrag(contId);
        } else if (status == 'pause') {
            $(startEl).show();
            if (playingContId == contId) {
                $(processEl).show();
            }
        } else if (status == 'load') {
            $(loadEl).show();
        } else if (status == 'error') {
            $(errorEl).show();
        } else if (status == 'end') {
            $(startEl).show();
        }
    }

    function _beginDrag(contId) {
        var duration = _getDuration(contId);

        function checkDrag() {
            var widthRadio = 1;
            try {
                var selector = '.voice-main[data-id="' + contId + '"] .voice-audio';
                if (!$(selector)[0]) {
                    _pauseDrag(contId);
                    return
                }
                widthRadio = Math.min($(selector)[0].currentTime / duration, 1);
            } catch (err) {
                console.log('widthRadio, err:', err);
            }
            $('.voice-main[data-id="' + contId + '"] .voice-speed')[0].style.width = widthRadio * 100 + "%";
            if (dragIntervals[contId]) {
                setTimeout(checkDrag, 50);
            }
        }

        dragIntervals[contId] = setTimeout(checkDrag, 50);
    }

    function _pauseDrag(contId) {
        window.clearTimeout(dragIntervals[contId]);
        delete dragIntervals[contId];
    }

    function _getDuration(contId) {
        var selector = '.voice-main[data-id="' + contId + '"] .voice-audio';
        var duration = $(selector).attr('ser-duration');
        if (!duration)
            duration = $(selector)[0].duration; else
            duration = parseFloat(duration);
        return duration;
    }

    function _setCurrentTime(contId, curTime) {
        var selector = '.voice-main[data-id="' + contId + '"] .voice-audio';
        try {
            $(selector)[0].currentTime = curTime;
        } catch (err) {
            console.log('setAudioCurrentTime, err:', err);
        }
    }

    function _setLoaded(contId) {
        $('.voice-main[data-id="' + contId + '"]').attr('data-loaded', '1');
    }

    function _isLoaded(contId) {
        return $('.voice-main[data-id="' + contId + '"]').attr('data-loaded') ? true : false;
    }

    function _checkAndPlayNext(contId) {
        var willPlay = false;
        var vue = App.ctrls.livePlay.getVue();
        var nextVoiceItems = $('.one-content-item[data-id="' + contId + '"]').nextAll('.one-content-item[data-type="' + vue.CONTENT_TYPES.VOICE + '"]');
        if (nextVoiceItems.length > 0) {
            willPlay = true;
            var willPlayContId = parseInt($(nextVoiceItems[0]).attr('data-id'));
            _loopPlay(willPlayContId);
        }
        return willPlay;
    }

    function _setRead(liveNum) {
        var vue = App.ctrls.livePlay.getVue();
        localStorage['' + vue.liveInfo.id + '.liveContent.' + liveNum + '.isRead'] = 1;
        $('.voice-main[data-num="' + liveNum + '"] .not-listened').hide();
    }

    function _isRead(liveNum) {
        var vue = App.ctrls.livePlay.getVue();
        return localStorage['' + vue.liveInfo.id + '.liveContent.' + liveNum + '.isRead'];
    }

    function _checkCurrentInEye() {
        if (playingContId) {
            var container = $('.scrolling-main')[0];
            var curScrollTop = $(container).scrollTop();
            var singleMsgObj = $('.one-content-item[data-id="' + playingContId + '"]')[0];
            if (singleMsgObj && (singleMsgObj.offsetTop > curScrollTop + container.clientHeight || singleMsgObj.offsetTop < curScrollTop)) {
                $('.lr-goPlay').addClass('show');
            } else {
                $('.lr-goPlay').removeClass('show');
            }
        } else {
            $('.lr-goPlay').removeClass('show');
        }
    }

    var firstJumpToCurrent = true;

    function _jumpToCurrent() {
        if (playingContId) {
            var singleMsgObj = $('.one-content-item[data-id="' + playingContId + '"]')[0];
            var container = $('.scrolling-main')[0];
            var newTop = singleMsgObj.offsetTop - container.clientHeight * 0.5;
            if (!firstJumpToCurrent) {
                $(container).animate({scrollTop: scrollTop = newTop}, 300);
            }
        } else {
            $('.lr-goPlay').removeClass('show');
        }
        firstJumpToCurrent = false;
    }

    function _setHistoryContNum(contNum) {
        var vue = App.ctrls.livePlay.getVue();
        localStorage['historyListenContNum.' + vue.liveInfo.id] = contNum;
    }

    function getHistoryContNum() {
        var vue = App.ctrls.livePlay.getVue();
        var contNum = localStorage['historyListenContNum.' + vue.liveInfo.id];
        if (!!contNum) {
            contNum = parseInt(contNum);
        }
        return contNum;
    }

    function _checkLoadNextVoice(contNum) {
        var vue = App.ctrls.livePlay.getVue();
        var nextVoiceItems = $('.one-content-item[data-num="' + contNum + '"]').nextAll('.one-content-item[data-type="' + vue.CONTENT_TYPES.VOICE + '"]');
        if (nextVoiceItems.length > 0) {
            var nextNum = parseInt($(nextVoiceItems[0]).attr('data-num'));
            _preloadVoice(nextNum);
        } else {
            vue.fetchContentMoreNew();
        }
    }

    function _preloadVoice(contNum) {
        App.debug('preloadVoice:' + contNum);
        function doLoad(_contNum) {
            var contId = parseInt($('.one-content-item[data-num="' + _contNum + '"]').attr('data-id'));
            if (_isDirectPlay(contId)) {
                return
            }
            if (_isLoaded(contId)) {
                return
            }
            var selector = '.voice-main[data-id="' + contId + '"] .voice-audio';
            if (App.utils.isIos() && (typeof WeixinJSBridge) == "object" && (typeof WeixinJSBridge.invoke) == "function") {
                WeixinJSBridge.invoke('getNetworkType', {}, function (res) {
                    $(selector)[0].load();
                });
            } else {
                $(selector)[0].load();
            }
            setTimeout(doLoad, 2000, _contNum);
        }

        doLoad(contNum);
    }

    function _setDirectPlay(contId) {
        $('.voice-main[data-id="' + contId + '"]').attr('data-direct-play', '1');
    }

    function _isDirectPlay(contId) {
        return $('.voice-main[data-id="' + contId + '"]').attr('data-direct-play') ? true : false;
    }

    function loadHistoryDuration() {
        var vue = App.ctrls.livePlay.getVue();
        historyDuration = localStorage['historyListenDuration.' + vue.liveInfo.id];
        if (!!historyDuration) {
            historyDuration = JSON.parse(historyDuration);
        }
    }

    function _loopSetHistoryDuration() {
        if (!!playingContId) {
            var selector = '.voice-main[data-id="' + playingContId + '"] .voice-audio';
            if ($(selector).length > 0 && $(selector)[0].currentTime) {
                var vue = App.ctrls.livePlay.getVue();
                var tempData = JSON.stringify({
                    'contId': parseInt(playingContId),
                    'currentTime': parseInt($(selector)[0].currentTime)
                });
                localStorage['historyListenDuration.' + vue.liveInfo.id] = tempData;
            }
        }
        setTimeout(_loopSetHistoryDuration, 1500);
    }

    setTimeout(_loopSetHistoryDuration, 1500);
    return {vueMethods: vueMethods, vueData: vueData}
})();