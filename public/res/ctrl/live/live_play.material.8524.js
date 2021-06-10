(function() {
	var imgMatScroll = null;
	var voiceMatScroll = null;

	var materialData = {
		libImagesModel: false,
		imgMaterials: [],

		libVoiceModel: false,
		voiceMaterials: [],
		matVoiceRecordShow: false,
		editRemarkVoiceId: null,

		libVideoModel: false,

		materialsModel: false,
		selectMaterialMod: 'images',
		selectMaterialInfo: null,
	};
	var materialMethods = {
		showImgMaterials: showImgMaterials,
		uploadImgMaterial: uploadImgMaterial,
		showVoiceMaterials: showVoiceMaterials,
		voiceMatFileChange: voiceMatFileChange,
		updateMatRemark: updateMatRemark,
		delMaterial: delMaterial,
		doSendImgMaterial: doSendImgMaterial,
		doSendVoiceMaterial: doSendVoiceMaterial,
		onClickVoiceMat: onClickVoiceMat,
        showMatVoiceRecordBar: showMatVoiceRecordBar,
        hideMatVoiceRecordBar: hideMatVoiceRecordBar,
        sendMatRecordVoice: sendMatRecordVoice
	};

	function showImgMaterials() {
		var vue = this;
		if(!imgMatScroll){
            imgMatScroll = App.ctrls.scrollLoader.start({
                url: '/live_/material_list?live_id='+vue.liveInfo.id+'&type=1',
                limit: 10,
                scroller: '#material-image-room',
                handler: function(rspData) {
                    if(!!rspData){
                        for(var i = 0; i < rspData.items.length; i++){
                            var oneData = rspData.items[i];
                            oneData.img_src = oneData.content;
                            vue.imgMaterials.push(oneData);
                        }
                    }
                }
            });
		}
		vue.libImagesModel = true;
	}

	function uploadImgMaterial() {
		var vue = this;
        var tempIndex = vue.imgMaterials.length;
		App.ctrls.imageInput.chooseImage({
			compressed: true,
			success: function (imageBase64, size) {
				//先渲染，上传成功再反馈
				var tempSrc = 'data:image;base64,'+imageBase64;
				var tempId = Math.random().toString(36).substr(2);
//				var tempIndex = vue.imgMaterials.length;
				vue.imgMaterials.push({'img_src': tempSrc, 'id':tempId, 'isTemp':true});

				//滑动到最低部
				var container = $('#material-image-room')[0];
				$(container).animate(
					{scrollTop: scrollTop = container.scrollHeight - container.clientHeight},
					300
				);
				//上传
				var _data = {
					'imageBase64': imageBase64,
					'size': size
				};
				App.api('/live_/upload_material_images?live_id='+vue.liveInfo.id, data=_data, function (rspData) {
					rspData.img_src = rspData.content;
					Vue.set(vue.imgMaterials, tempIndex, rspData);
				})
			}
		});
	}

	function delMaterial(materialList, delIndex, delMatId){
		var vue = this;
		App.confirm('提示', '确定要删除本素材吗？', function () {
			App.api('/live_/delete_material?live_id='+vue.liveInfo.id+'&mat_id='+delMatId, function (rspData) {
				materialList.splice(delIndex, 1);
				App.alertSuccess('已删除');
			})
		});
	}

	function doSendImgMaterial(matId, matIndex) {
		var vue = this;
		this.sendMaterial(matId, vue.CONTENT_TYPES.IMAGE, function () {
			vue.libImagesModel = false;
			var matData = vue.imgMaterials[matIndex];
			matData.sended = 1;
			vue.imgMaterials.splice(matIndex, 1, matData);
		});
	}
	function doSendVoiceMaterial(matId, matIndex) {
		var vue = this;
		this.sendMaterial(matId, vue.CONTENT_TYPES.VOICE, function () {
			vue.libVoiceModel = false;
			var matData = vue.voiceMaterials[matIndex];
			matData.sended = 1;
			vue.voiceMaterials.splice(matIndex, 1, matData);
		});
	}


	//--------- 语音素材库相关 -------//
	function showVoiceMaterials() {
		var vue = this;
		if(!voiceMatScroll){
            voiceMatScroll = App.ctrls.scrollLoader.start({
                url: '/live_/material_list?live_id='+vue.liveInfo.id+'&type=2',
                limit: 10,
                scroller: '#voice-material-list',
                handler: function(rspData) {
                    if(!!rspData){
                        for(var i = 0; i < rspData.items.length; i++){
                            vue.voiceMaterials.push(rspData.items[i]);
                        }
                    }
                }
            });
		}
		vue.libVoiceModel = true;
	}

	function voiceMatFileChange() {
		var vue = this;

		var file = event.target.files[0];
        var localUrl = URL.createObjectURL(file);
		$('#upload-audio').attr('src', localUrl);
		var audio = $('#upload-audio')[0];
		$(audio).off('loadeddata').on('loadeddata', function () {
			if(this.duration > 120){
				App.alertResult(false, '录音时间不能超过2分钟');
				return
			}
			_beginUpload(this.duration);
		});

		function _beginUpload(duration) {
			App.ctrls.chunkUpload.start({
				onceValid: true,
				file: file,
				onFinish: function(fileHash) {
					console.log('上传完成');
					var voiceData = {'file_hash': fileHash, 'live_id': vue.liveInfo.id, 'length': duration, 'voice_type': 'file'};
					App.api('/live_/upload_material_voice', voiceData, function (rspData) {
						vue.voiceMaterials.push(rspData);
						App.hideLoading(true);
						App.alertSuccess('上传成功！');
					}, function (status) {
						if(status != 504){
							App.hideLoading(true);
							App.alertResult(false, '服务器出错...');
						}
					});
				},
				onProgress: function(status) {
					console.log(status);
					App.showLoading('正在上传(' + Math.round(status.current * 100 / status.total) + '%)');
				}
			});
		}
	}

	function updateMatRemark(val) {
		var vue = this;
		var url = '/live_/edit_material?live_id='+this.liveInfo.id+'&mat_id='+this.editRemarkVoiceId;
		App.showLoading('提交中...');
		App.api(url, {'remark': val}, function () {
			$('.remark-main[data-id="'+vue.editRemarkVoiceId+'"]').text(val);
			App.hideLoading();
			vue.editRemarkVoiceId = null;
		}, function () {
			App.hideLoading(true);
		})
	}

	//- 上传录音的语音素材到服务器
    function sendMatRecordVoice(recId, length, replaceIndex) {
        var vue = App.ctrls.livePlay.getVue();
        var voiceData = {'localId': recId, 'length': length, 'voice_type': 'wx', 'live_id': vue.liveInfo.id};
		voiceData.id = Math.random().toString(36).substr(2);
        function _on_uploadVoice(mediaId){
            voiceData.media_id = mediaId;
            App.api('/live_/upload_material_voice', voiceData, function (rspData) {
                voiceData = $.extend(voiceData, rspData);
                _addToList(true);
                App.alertSuccess('上传成功！');
            }, function (status) {
                if(status != 504){
                    App.alertResult(false, '服务器出错...');
                }
                _addToList(false);
            });
        }

        function _addToList(result) {
            voiceData.isError = !result;
            if(!voiceData.data){
                voiceData.data = {};
            }
            if(!voiceData.data.length){
                voiceData.data.length = voiceData.length;
            }
            console.log('voiceData:', voiceData);
			if(!!replaceIndex){
				vue.voiceMaterials.splice(replaceIndex, 1, voiceData);
			}else {
				vue.voiceMaterials.push(voiceData);
				vue.$nextTick(_scrollMatVoiceBottom);
			}
            App.hideLoading(true);
        }

        wx.uploadVoice({
            localId: recId, // 需要上传的音频的本地ID，由stopRecord接口获得
            isShowProgressTips: 1, // 默认为1，显示进度提示
            success: function (res) {
                _on_uploadVoice(res.serverId);
            },
            fail: function (resMsg) {
                _addToList(false);
                App.alertResult(false, '微信网络出错');
            }
        });
    }

	function onClickVoiceMat(matId) {
		matId = parseInt(matId);
		var audioObject = $('.material-voice-audio[data-id="'+matId+'"]')[0];
		var isPlaying = !audioObject.paused;
		if(isPlaying){
			audioObject.pause();
			audioObject.currentTime = 0;
			$('.one-voice-mat[data-id="'+matId+'"] .voice-content-start').show();
			$('.one-voice-mat[data-id="'+matId+'"] .voice-content-pause').hide();
		}else {
			$('#voice-material-list .material-voice-audio').each(function (index, event) {
                try {
					var tempMatId = parseInt($(this).attr('data-id'));
					if(tempMatId != matId){
						this.currentTime = 0;
						this.pause();
						$('.one-voice-mat[data-id="'+tempMatId+'"] .voice-content-start').show();
						$('.one-voice-mat[data-id="'+tempMatId+'"] .voice-content-pause').hide();
					}
                }catch (err){
                    console.log('voiceObjStart, err:', err);
                }
            });
			audioObject.play();
			$('.one-voice-mat[data-id="'+matId+'"] .voice-content-start').hide();
			$('.one-voice-mat[data-id="'+matId+'"] .voice-content-pause').show();
		}
	}

	function showMatVoiceRecordBar() {
        var vue = this;
        vue.matVoiceRecordShow = true;
        vue.$nextTick(_scrollMatVoiceBottom);
    }
    function _scrollMatVoiceBottom() {
        var container = $('#lrml-body-lib-voice')[0];
        $(container).animate(
            {scrollTop: scrollTop = container.scrollHeight - container.clientHeight},
            300
        );
    }
    function hideMatVoiceRecordBar(e) {
        var vue = this;
        if(!!vue.matVoiceRecordShow){
            e.preventDefault();
        }
        vue.matVoiceRecordShow = false;
    }

    console.log('------livePlayMaterial----');
    App.addCtrl('livePlayMaterial', {
        materialMethods: materialMethods,
        materialData: materialData
    });
})();