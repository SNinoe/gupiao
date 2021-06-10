(function() {
	var footBarMethods = {
		showNewMsgTips: showNewMsgTips,
		hideNewMsgTips: hideNewMsgTips,
		showTools: showTools,
		showVoiceBar: showVoiceBar,
		contentTextEnter: contentTextEnter,
		focusInputText: focusInputText,
		restartLive: restartLive,
		finishLive: finishLive,
		onContentInputBlur: onContentInputBlur,
		onShowDiscussAndWrite: onShowDiscussAndWrite,
		hideToolBar: hideToolBar
	};

	function showNewMsgTips(liveNum) {
		var tipSelector = '.lr-newmesTip';
		var numSelector = '.lr-newmesTip .lr-newmes-btn';
		var preNum = parseInt($(numSelector).text());
		$(numSelector).text(''+(preNum+1));
		if(!$(tipSelector).hasClass('show')){
			$(tipSelector).addClass('show');
		}
	}
	function hideNewMsgTips() {
		var tipSelector = '.lr-newmesTip';
		var numSelector = '.lr-newmesTip .lr-newmes-btn';
		if($(tipSelector).hasClass('show')){
			$(tipSelector).removeClass('show');
		}
		$(numSelector).text('0');
	}

	function hideToolBar(e) {
		var _this = this;
		if(_this.liveTeachStatus != ''){
			e.preventDefault();
		}
		if(_this.recordStatus == _this.READY){
			_this.liveTeachStatus = '';
		}
	}

	function showTools() {
		var _this = this;
		_this.liveTeachStatus == 'toolController' ? _this.liveTeachStatus = '' : _this.liveTeachStatus = 'toolController';
		_this.$nextTick(function () {
			_this.scrollContentBottom();
		});
	}
	function showVoiceBar() {
		var _this = this;
		_this.liveTeachStatus = 'recordType';
		_this.$nextTick(function () {
			_this.scrollContentBottom();
		});
	}
	function focusInputText() {
		var _this = this;
		_this.liveTeachStatus = 'inputting';
		_this.$nextTick(function () {
			_this.scrollContentBottom();
			_this.fixScrollInput();
		});
	}
	function onContentInputBlur() {
		setTimeout(function () {
			var vue = App.ctrls.livePlay.getVue();
			if(vue.liveTeachStatus == 'inputting'){
				vue.liveTeachStatus = '';
			}
		}, 100);
	}
	function onShowDiscussAndWrite() {
		var vue = App.ctrls.livePlay.getVue();
		vue.discussionModel = true;
		vue.$nextTick(function () {
			$('#discuss-text-area').focus();
		});
	}
	function contentTextEnter(event) {
		if(event.keyCode == 13 && event.ctrlKey){
			if(this.contentText.length > 0){
				this.contentText += "\r\n";
			}
		}else if(event.keyCode == 13&& !event.ctrlKey){
			this.sendContentText(this.contentText);
			this.contentText = '';
			event.preventDefault();
		}
	}
	function restartLive() {
		var url = '/live_/restart_live';
		var _this = this;
		App.confirm('提示', '是否要重新开始直播？', function() {
			App.api(url, {
				'live_id': _this.liveInfo.id
			}, function(rspData) {
				_this.liveInfo.finished = 0;
				App.hideLoading();
				App.alertResult(true, '已重新开始直播');
			}, function() {
				App.hideLoading();
			})
		});
	}
	function finishLive() {
		var url = '/live_/finish_live';
		var _this = this;
		App.confirm('提示', '是否要结束直播？', function() {
			App.api(url, {
				'live_id': _this.liveInfo.id
			}, function(rspData) {
				_this.liveInfo.finished = 1;
				App.hideLoading();
				App.alertResult(true, '已结束直播');
			}, function() {
				App.hideLoading();
			})
		});
	}

	// App.addCtrl('livePlayFootBar', {
	// 	footBarMethods: footBarMethods
	// });
})();