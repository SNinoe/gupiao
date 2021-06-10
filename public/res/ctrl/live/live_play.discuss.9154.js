/**
 * Created by huanghongwei on 2017/8/5.
 */

var PlayDiscuss = (function() {

    var DISCUSS_TYPES = {
        TEXT: 1,
        IMAGE: 3
    };

    var vueMethods = {
        initDiscussItems: initDiscussItems,
        resetDeletedDiscuss: resetDeletedDiscuss,
        appendDiscuss: appendDiscuss,
        prependDiscuss: prependDiscuss,
        loadMoreDiscuss: loadMoreDiscuss,
        scrollDiscussBottom: scrollToBottom,
        onEnterDiscussDialog: onEnterDiscussDialog,
        showReplyDialog: showReplyDialog,

        onDiscussMsg: onDiscussMsg,
        onDeleteDiscuss: onDeleteDiscuss,

        doForbidUser: doForbidUser,
        doDeleteDiscuss: doDeleteDiscuss,
        doSendDiscussText: doSendDiscussText,
        doDiscussTextEnter: doDiscussTextEnter,
        doSelectDiscussImg: doSelectDiscussImg,
        doReplyTextEnter: doReplyTextEnter,
        doSendReplyText: doSendReplyText,
        doFocusDiscussInput: doFocusDiscussInput,
        doBlurDiscussInput: doBlurDiscussInput,
        doFocusReplyInput: doFocusReplyInput
    };
    var vueData = {
        DISCUSS_TYPES: DISCUSS_TYPES,
        maxDiscussNum: null,
        minDiscussNum: null,
        discussList: [],
        loopDiscussAmount: 0,
        loopDiscussLimit: 10,
        discussText: '',
        isDiscussTextAreaFocus: false,
        replyDiscuss: null,
        replyDiscussText: ''
    };

    var initDiscussNum = null;
    var deletedDiscussNums = [];

    //初始化
    function initDiscussItems() {
        if(initDiscussNum != null){
            return; //已经初始化过了
        }

        var vue = App.ctrls.livePlay.getVue();
        initDiscussNum = vue.liveInfo.discuss_num;
        vue.maxDiscussNum = initDiscussNum;
        _fetchSmaller(initDiscussNum);
    }
    function _fetchSmaller(num) {
        // console.log('_fetchSmaller:', num);
        if(num < 1){
            return;
        }
        var vue = App.ctrls.livePlay.getVue();
        _fetchOne(num, function (_oneData) {
            if(_oneData && (!_oneData.deleted) && (!_isDeleted(num))){
                vue.loopDiscussAmount += 1;
            }
            if(vue.minDiscussNum == null || vue.minDiscussNum > num){
                vue.minDiscussNum = num;
            }
            if(1 < vue.minDiscussNum){
                if(vue.loopDiscussLimit > vue.loopDiscussAmount){
                    _fetchSmaller(num-1);
                }
            }
        })
    }
    function _fetchBigger(num) {
        var vue = App.ctrls.livePlay.getVue();
        if(num > vue.liveInfo.discuss_num){
            return;
        }
        _fetchOne(num, function (_oneData) {
            if(_oneData && (!_oneData.deleted) && (!_isDeleted(num))){
                vue.loopDiscussAmount += 1;
            }
            if(vue.maxDiscussNum == null || vue.maxDiscussNum < num){
                vue.maxDiscussNum = num;
            }
            if(vue.liveInfo.discuss_num > vue.maxDiscussNum){
                if(vue.loopDiscussLimit > vue.loopDiscussAmount){
                    _fetchBigger(num+1);
                }
            }
        });
    }
    function _fetchOne(num, callback) {
        var vue = App.ctrls.livePlay.getVue();
        function __fetchFinish(_oneData) {
            if(vue.liveInfo.discuss_img && (!!_oneData) && _oneData.type == DISCUSS_TYPES.IMAGE){
                vue.$nextTick(function () {
                    if(!App.utils.isWeixin()){
                        vue.initPhotoSwipeFromDOM('.my-gallery');
                    }
                });
            }
            if(callback){
                callback(_oneData);
            }
        }

        function __onGotOneDiscuss(_discussData) {
            if (_discussData.deleted) {
                return
            }
            if(!_discussData.type){
                _discussData.type = DISCUSS_TYPES.TEXT;
            }
            //获取用户信息
            function __onGotUser(_user) {
                _discussData.user = _user;
                //渲染进入界面
                var elFilter = '.one-discuss-item[data-id="'+ _discussData.id +'"]';
                if($(elFilter).length > 0){
                    console.log('repeat:', _discussData);
                }else if(!_finishWaiting(_discussData)){
                    if(num >= initDiscussNum){
                        vue.appendDiscuss(_discussData);
                    }else {
                        vue.prependDiscuss(_discussData);
                    }
                }
                __fetchFinish(_discussData);
            }
            if(_discussData.user){
                __onGotUser(_discussData.user);
            }else {
                App.api('user/summary?id=' + _discussData.user_id, __onGotUser, null, {enableCache:true});
            }
        }

        if(_isDeleted(num)){
            return __fetchFinish();
        }else {
            var liveId = vue.liveInfo.id;
            var fileKey = 'live-data/' + liveId + '/discuss-' + num;
            var url = App.utils.ossUrl(fileKey);
            if (liveId < 10){
                url = App.utils.qiniuUrl(fileKey);     //对老版本的直播做兼容
            }
            App.http(url, null, function (rspData) {
                __onGotOneDiscuss(eval('(' + rspData + ')'));
            });
        }
    }

    function appendDiscuss(_data, forceBottom) {
        var vue = App.ctrls.livePlay.getVue();
        if(_data.type == DISCUSS_TYPES.IMAGE){
            _data.viewSize = _countImgSize(_data.img_size);
        }
        vue.discussList.push(_data);
        if(_isAtBottom() || forceBottom){
            vue.$nextTick(function () {
                scrollToBottom();
            });
        }
    }
    function prependDiscuss(_data) {
        var vue = App.ctrls.livePlay.getVue();
        if(_data.type == DISCUSS_TYPES.IMAGE){
            _data.viewSize = _countImgSize(_data.img_size);
        }
        var container = $('#discuss-room')[0];
        var oldHeight = container.scrollHeight;
        var oldScrollTop = container.scrollTop;
        vue.discussList.unshift(_data);
        vue.$nextTick(function () {
            container.scrollTop = container.scrollHeight - oldHeight + oldScrollTop;
        });
    }

    function _countImgSize(serSize) {
        var maxWidth = $('#temp-img-container')[0].offsetWidth;
        if((!maxWidth) || (!serSize)){
            return {'width': 'auto', 'height': 'auto'};
        }
        var maxHeight = 120;
        var wRatio = serSize.width/maxWidth;
        var hRatio = serSize.height/maxHeight;
        if(wRatio > 1 || hRatio > 1){
            var ratio = Math.max(wRatio, hRatio);
            return {'width': ''+(serSize.width / ratio)+'px', 'height': ''+(serSize.height / ratio)+'px'};
        }else {
            return {'width': ''+serSize.width+'px', 'height': ''+serSize.height+'px'};
        }
    }

    function resetDeletedDiscuss() {
        var vue = App.ctrls.livePlay.getVue();
        modify_datas = vue.liveInfo.modify_datas;
        var deletedNums = modify_datas['delete_discuss_nums'];
        if(deletedNums){
            for(var i=0; i<deletedNums.length; i++){
                vue.onDeleteDiscuss(deletedNums[i]);
            }
        }
        deletedDiscussNums = (!!deletedNums) ? deletedNums : [];
    }
    function _isDeleted(num){
        return deletedDiscussNums.indexOf(num) >= 0;
    }

    function loadMoreDiscuss() {
        var vue = App.ctrls.livePlay.getVue();
        vue.loopDiscussAmount = 0;
        _fetchSmaller(vue.minDiscussNum-1);
    }

    function scrollToBottom() {
        var container = $('#discuss-room')[0];
        $(container).animate(
            {scrollTop: scrollTop = container.scrollHeight - container.clientHeight},
            300
        );
    }
    function _isAtBottom() {
        var dpr = window.devicePixelRatio;
        if(!dpr) dpr = 1.0;
        var container = $('#discuss-room')[0];
        return container.scrollTop + container.clientHeight >= (container.scrollHeight-10*dpr);
    }

    var firstEnterDiscuss = true;
    function onEnterDiscussDialog() {
        if(firstEnterDiscuss){
            var container = $('#discuss-room')[0];
            container.scrollTop = container.scrollHeight - container.clientHeight;
        }
        firstEnterDiscuss = false;
    }

    //---- 服务器事件 ----//
    function onDiscussMsg(discussNum) {
        var vue = App.ctrls.livePlay.getVue();
        _fetchOne(discussNum, function () {
            Vue.set(vue.liveInfo, 'discuss_num', Math.max(discussNum, vue.liveInfo.discuss_num));
            vue.maxDiscussNum = Math.max(vue.maxDiscussNum, discussNum);
        });
        // if((!!vue.maxDiscussNum) && (vue.maxDiscussNum >= vue.liveInfo.discuss_num) && (vue.maxDiscussNum < discussNum)){
        //     //旧消息加载完以后，才开始拉新消息
        //     Vue.set(vue.liveInfo, 'discuss_num', Math.max(discussNum, vue.liveInfo.discuss_num));
        //     _fetchBigger(vue.maxDiscussNum+1);
        // }else {
        //     Vue.set(vue.liveInfo, 'discuss_num', Math.max(discussNum, vue.liveInfo.discuss_num));
        // }
    }

    function onDeleteDiscuss(discussNum) {
        var vue = App.ctrls.livePlay.getVue();
        var index = parseInt($('.one-discuss-item[data-num="'+discussNum+'"]').attr('data-index'));
        if((!index && index != 0)){
            return
        }
        vue.discussList.splice(index, 1);
        deletedDiscussNums.push(discussNum);
    }

    //---------------------- 上面是数据渲染部分 ------------------------------//
    //----------------------------------------------------------------------//
    //----------------------------------------------------------------------//
    //---------------------- 下面是服务器请求部分 -----------------------------//

    function doForbidUser(userId, nickname) {
        var vue = App.ctrls.livePlay.getVue();
        App.confirm('', '确定禁止' + nickname + '发言吗？', function() {
            App.api('/live_publish/publish/forbid_speak?live_id=' + vue.liveInfo.id + '&user_id=' + userId, function(rspData) {
                App.alertSuccess('操作成功');
            });
        });
    }
    function doDeleteDiscuss(disId) {
        var vue = App.ctrls.livePlay.getVue();
        var content = $('.one-discuss-item[data-id="'+disId+'"]').attr('data-content');
        App.confirm('', '确定删除这条讨论：' + content, function() {
            App.api('/live_publish/publish/delete_discuss?live_id=' + vue.liveInfo.id + '&discuss_id=' + disId, function(rspData) {
                $('.one-discuss-item[data-id="'+disId+'"]').hide();
                App.alertSuccess('操作成功');
            });
        });
    }

    function doSendDiscussText() {
        var vue = App.ctrls.livePlay.getVue();
        var textContent = vue.discussText;
        textContent = textContent.replace(/\n|\r\n/g,"<br/>");
        if (textContent.replace( /^\s*/, '').length <= 0){
            return
        }
        if(textContent.length > 120){
            App.alertResult(false, '消息超长');
            return
        }
        result = _doSend(DISCUSS_TYPES.TEXT, {'content': textContent, 'is_question': $('#lrsend-ask3').is(':checked')});
        if (result){
            vue.discussText = '';
        }else {
            setTimeout(function () {
                $('#discuss-text-area').focus();
            }, 110)
        }
    }

    var lastSendTime = null;
    function _doSend(type, data) {
        if(lastSendTime != null && (new Date()) - lastSendTime < 5*1000){
            App.alertResult(false, '发送讨论不能太频繁哦~');
            return
        }
        lastSendTime = new Date();

        var vue = App.ctrls.livePlay.getVue();
        var sendData = $.extend({'type': type}, data);
        sendData.wait_id = _renderWaiting(sendData);

        App.api('/live_/publish_discuss?live_id=' + vue.liveInfo.id, sendData, function(rspData) {
            lastSendTime = new Date();
            if(rspData.code && rspData.code < 0){
                App.alertResult(false, rspData.desc);
            }
        });
        return true;
    }
    //预渲染
    function _renderWaiting(_data) {
        var data = $.extend(true, {}, _data);
        var vue = App.ctrls.livePlay.getVue();

        data.id = Math.random().toString(36).substr(2);
        data.user = App.data.user;
        data.create_time = _getNowFormatDate();
        data.isPrepare = true;
        if(data.type == DISCUSS_TYPES.IMAGE){
            data.content = 'data:image;base64,'+data.img_data;
        }
        vue.appendDiscuss(data, true);
        return data.id;
    }
    //替代预渲染数据
    function _finishWaiting(newData) {
        var clientId = newData.wait_id;
        var index = parseInt($('.one-discuss-item[data-id="'+ clientId +'"]').attr('data-index'));
        if((!index) && index != 0){
            return
        }

        var vue = App.ctrls.livePlay.getVue();
        var item = vue.discussList[index];
        if(!!newData){
            item.id = newData.id;
            item.live_num = newData.live_num;
            item.isPrepare = false;
            item.isError = false;
        }else {
            item.isError = true;
        }
        vue.discussList.splice(index, 1, item);
        return true;
    }
    // 获取当前时间
    function _getNowFormatDate() {
        var date = new Date();
        var seperator1 = "-";
        var seperator2 = ":";
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        return (month + seperator1 + strDate + " " + date.getHours() + seperator2 + date.getMinutes());
    }

    function doSendReplyText() {
        var vue = App.ctrls.livePlay.getVue();
        if(!vue.replyDiscuss){
            return App.alertResult(false, '您要回复的要论不存在...');
        }
        function _onSuccess() {
            App.alertSuccess('已成功回复并添加到主屏');
            vue.replyDiscuss = null;
        }
        vue.sendContentText(vue.replyDiscussText, _onSuccess);
        vue.replyDiscussText = '';
    }

    //----------------------------------------------------------------------//
    //---------------------- 下面是前端交互部分 -----------------------------//
    function doDiscussTextEnter(event) {
        var vue = App.ctrls.livePlay.getVue();
		if(event.keyCode == 13 && event.ctrlKey){
			if(vue.discussText.length > 0){
				vue.discussText += "\r\n";
			}
		}else if(event.keyCode == 13&& !event.ctrlKey){
			vue.doSendDiscussText();
            event.preventDefault();
		}
	}

	function doSelectDiscussImg(event) {
        App.ctrls.imageInput.chooseImage({
            compressed: true,
            success:function (base64Data, size){
                var _data = {
                    'img_size': size,
                    'img_data': base64Data,
                    'upload_type': 'input_image'
                };
                _doSend(DISCUSS_TYPES.IMAGE, _data);
            }
        });
    }

    function doReplyTextEnter() {
        var vue = App.ctrls.livePlay.getVue();
		if(event.keyCode == 13 && event.ctrlKey){
			if(vue.replyDiscussText.length > 0){
				vue.replyDiscussText += "\r\n";
			}
		}else if(event.keyCode == 13&& !event.ctrlKey){
			vue.doSendReplyText();
            event.preventDefault();
		}
    }

    function showReplyDialog(discussData, event) {
        var vue = App.ctrls.livePlay.getVue();
        vue.replyDiscuss = discussData;
        vue.$nextTick(function () {
            $('#reply-discuss-input').focus();
        })
    }

    function doFocusDiscussInput() {
        var vue = App.ctrls.livePlay.getVue();
        vue.isDiscussTextAreaFocus = true;
        vue.scrollDiscussBottom();
        vue.fixScrollInput();
        $('.lr-goPlay-room').addClass('show');
    }

    function doBlurDiscussInput() {
        setTimeout(function () {
            var vue = App.ctrls.livePlay.getVue();
            vue.isDiscussTextAreaFocus = false;
            $('.lr-goPlay-room').removeClass('show');
        }, 100);
    }

    function doFocusReplyInput() {
        var vue = App.ctrls.livePlay.getVue();
        vue.liveTeachStatus = 'inputting';
        vue.$nextTick(function () {
            vue.fixScrollInput();
        })
    }

    return {
        vueMethods: vueMethods,
        vueData: vueData
    }
})();
