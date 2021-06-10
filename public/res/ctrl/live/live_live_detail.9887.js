/**
 * Created by huanghongwei on 2017/7/18.
 */

(function() {
    var vue = null;
    var freeInviteType = null;
    $(document).ready(function () {
        freeInviteType = App.utils.urlParam('fit');
        vue = App.vue({
            el: '#app',
            data: $.extend({
                hideToTop: '',
                introArticleToggle: false,
                showToggleBtn: true,
                showRightToggle: false,
                showTopToolbar: false,
                moreControllerModel: false,
                documentScrollTop: 0,
                // handleZoneOffsetTop: document.getElementById('handle-wrapper').offsetTop,
                urlAlterShow: false,
                showKfQrcode: false,
                packGiftModel: false,
                showShareDlg: false,
                checkPackGiftModel: false,
                toSeriesGiftDlg: false,
                choosePayShow: null,
                choosePayType: 'live',
                urlQrCodeModel: false,
                fixedSale: false,     // 分销侧边

                //---- 数据
                seriesObjects: [],
                seriesLiveMoney: 0,
                liveId: null,
                saleLinkId: null,
                detailInfo: {},
                liveInfo: null,
                seriesInfo: {},
                liveAccount: {},
                freeUrl: null,
                isSubscribe: true,
                currentGiftNum: 2,
                pageId: null,
                showInviteCode: null,
                kfImage: ''
            }, vueGiftData),
            created: function() {
                this.$nextTick(initPageData);
            },
            methods: $.extend({
                // topToolbar: function() {
                //     this.documentScrollTop = document.documentElement.scrollTop;
                //     this.handleZoneOffsetTop = document.getElementById('handle-wrapper').offsetTop;
                //     this.documentScrollTop >= this.handleZoneOffsetTop + 140 ? this.showTopToolbar = true : this.showTopToolbar = false;
                // },
                fixedSaleSlider: function() {
                    $(window).scrollTop() >= 69 ? this.fixedSale = true : this.fixedSale = false;
                },
                sendNotifyNew: sendNotifyNew,
                optLiveStatus: optLiveStatus,
                genFreeUrl: genFreeUrl,
                subscribeAccount: subscribeAccount,
                buy: buy,
                // buyGift: buyGift,
                showUrlQrCode: showUrlQrCode,
                reviewBigImage: reviewBigImage
            }, vueGiftMethods),
            mounted: function() {
                // window.addEventListener('scroll', this.topToolbar);
                window.addEventListener('scroll', this.fixedSaleSlider);
            }
        });
    });

    function showUrlQrCode(url) {
        $("#url-qr-code").html('');
        $("#url-qr-code").qrcode({
            render: "canvas",
            width: 180,
            height: 180,
            text: url
        });
        var canvas = $('#url-qr-code canvas')[0];
        var base64 = canvas.toDataURL('image/jpeg', 1);
        $('.share-qrcode-zone img').attr('src', base64);
        vue.urlQrCodeModel = true;
    }

    //发送新课通知
    function sendNotifyNew(e) {
        App.showLoading('...');
        App.api('/live_/info/check_notify', {'object_id': vue.liveInfo.id, 'object_type': 10}, function (checkRsp) {
            App.hideLoading(true);
            var desc = '一共可推送3次，每次时间间隔需要大于24小时，推送对象是在有讲关注了本直播间的用户。';
            App.confirm('还剩'+checkRsp.left_count+'次推送机会', desc, function () {
                if(!checkRsp.result){
                    return
                }
                App.showLoading('发送中...');
                App.api('/live_/info/send_notify', {'object_id': vue.liveInfo.id, 'object_type': 10}, function(sendRsp) {
                    App.hideLoading(true);
                    App.alertResult(true, '已发送');
                }, function() {
                    App.hideLoading(true);
                })
            }, (!checkRsp.result));
        }, function () {
            App.hideLoading(true);
        });
    }

    function optLiveStatus(optType) {
        var url = '';
        var desc = '';
        var callback = null;
        switch (optType) {
            case 'top':
                url = '/live_/info/top_live';
                desc = '置顶';
                callback = function() {
                    vue.liveInfo.top_show = 1;
                };
                break;
            case 'un_top':
                url = '/live_/info/untop_live';
                desc = '取消置顶';
                callback = function() {
                    vue.liveInfo.top_show = 0;
                };
                break;
            case 'on':
                url = '/live_/info/on_live';
                desc = '重新上架';
                callback = function() {
                    vue.liveInfo.index_show = 1;
                };
                break;
            case 'off':
                url = '/live_/info/off_live';
                desc = '下架';
                callback = function() {
                    vue.liveInfo.index_show = 0;
                };
                break;
            case 'open':
                url = '/live_/restart_live';
                desc = '重新开始直播';
                callback = function() {
                    vue.liveInfo.finished = 0;
                };
                break;
            case 'close':
                url = '/live_/finish_live';
                desc = '结束直播';
                callback = function() {
                    vue.liveInfo.finished = 1;
                };
                break;
            default:
                App.alertResult(false, '错误的操作类型');
                return;
        }
        App.confirm('提示', '是否要' + desc + '课程『' + vue.liveInfo.name + '』？', function() {
            App.api(url, {
                'live_id': vue.liveId
            }, function(rspData) {
                callback();
                App.hideLoading();
                App.alertResult(true, '已' + desc);
            }, function() {
                App.hideLoading();
            })
        });
    }

    //获取直播免费链接
    function genFreeUrl(e) {
        App.api('/live_/user/normal_ticket?id=' + vue.liveId, function(rspData) {
            vue.freeUrl = rspData['ticket_url'];
        });
    }

    //关注直播间
    function subscribeAccount(e) {
        App.api('/live_/user/subscribe_account?acc_id=' + vue.liveInfo.account_id, function(rspData) {
            vue.isSubscribe = true;
            App.alertResult(true, '已关注');
        });
    }

    //购买
    function buy(buyType) {
        var buyUrl = null;
        switch (buyType) {
            case 'live':
                buyUrl = '/live_/money/buy_ticket?live_id=' + vue.liveId;
                break;
            case 'series':
                buyUrl = '/live_/money/buy_series?series_id=' + vue.seriesInfo.id;
                break;
            default:
                App.alertResult(false, '错误的购买类型');
                return
        }
        if (!!buyUrl) {
            if (!!vue.saleLinkId) {
                buyUrl = buyUrl + '&salelink_id=' + vue.saleLinkId
            }
            if(!!vue.pageId){
                buyUrl = buyUrl + '&page_id=' + vue.pageId
            }
        }
        App.ctrls.wxPayTools.scanConfig({
            qrCodeImgSelector: '.purchase_qrcode_img',
            moneySelector: '.purchase_qrcode_money',
            payDialogSelector: '#pay_dialog',
            checkUrl: '/live_/keepalive/wait_paid'
        });
        App.ctrls.wxPayTools.weixinPay({
            buyUrl: buyUrl,
            wishScan: true,
            success: function() {
                refreshPage(true);
            }
        });
    }

    function resetKfImage(isAfterPay) {
        if(!!vue.detailInfo.isPermission){
            vue.kfImage = vue.liveAccount.after_sale_image || vue.liveAccount.pre_sale_image;
            if(isAfterPay && vue.liveAccount.after_sale_image){
                vue.showKfQrcode = true;
            }
        }else {
            vue.kfImage = vue.liveAccount.pre_sale_image;
        }
    }

    function refreshPage(isAfterPay) {
        var userUrl = '/live_/user/detail_user?id=' + vue.liveId;
        if (!!vue.saleLinkId) {
            userUrl = userUrl + '&salelink_id=' + vue.saleLinkId;
        }
        App.loadUserData(userUrl, function() {
            if(freeInviteType == 'live'){
                vue.showInviteCode = App.data.live_invite_code ? App.data.live_invite_code : null;
            }else if(freeInviteType == 'wekuo'){
                vue.showInviteCode = App.data.wekuo_invite_code ? App.data.wekuo_invite_code : null;
            }
            console.log('vue.showInviteCode:', vue.showInviteCode);
            console.log('App.data.live_invite_code:', App.data.live_invite_code);
            console.log('freeInviteType:', freeInviteType);
            if(vue.showInviteCode){
                compressFreeCode();
            }
            App.api('/live_/user/room_detail?id=' + vue.liveId, function(rspData) {
                vue.liveAccount = rspData.belong_account;
                vue.liveInfo = App.data.user_live.live_data;
                vue.isSubscribe = App.data.user_live.subscribe;
                vue.detailInfo.isPermission = App.data.user_live.is_permission;
                vue.detailInfo.isAccountAdmin = App.data.user_live.is_account_admin;
                vue.detailInfo.hasSeries = (!!vue.liveInfo.series_id);
                if (vue.detailInfo.hasSeries) {
                    App.api('/live_/info/series_base_info?id=' + vue.liveInfo.series_id, function(rspData) {
                        vue.seriesInfo = rspData;
                    });
                    App.api('/live_/series/series_live_list?ser_id=' + vue.liveInfo.series_id+'&limit=100', function (rspData) {
                        var totalMoney = 0;
                        vue.seriesObjects = [];
                        for(var i=0; i<rspData.items.length; i++){
                            var oneObject = rspData.items[i];
                            if(oneObject.index_show){
                                if(oneObject.join_alone){
                                    totalMoney = totalMoney + oneObject.price;
                                }
                                vue.seriesObjects.push(oneObject);
                            }
                        }
                        vue.seriesLiveMoney = totalMoney;
                    })
                }
                if(vue.liveInfo.intro && vue.liveInfo.intro.length > 0){
                    App.http(vue.liveInfo.intro, null, function(content) {
                        var introTag = '#live-article';
                        $(introTag).html(content);
                        var introTagHeight = $(introTag).height();
                        vue.showToggleBtn = introTagHeight > 200;
                        vue.showRightToggle = introTagHeight > $(window).height() - 50;
                    });
                }
                if(!vue.detailInfo.isPermission){
                    //初始化购买统计
                    App.api('log/init_page_purchase?object_type=201&object_id=' + vue.liveId, function(rspData) {
                        vue.pageId = rspData.page_id;
                    });
                }
                Vue.nextTick(autoPlayTopic);
                initJsSDK();
                resetKfImage(isAfterPay);
            }, null, {
                enableCache: true
            });
        });
    }

    function reviewBigImage(event) {
        var urlSrc = $(event.target).attr('ori-src');
        wx.previewImage({
            current: urlSrc,
            urls: [urlSrc]
        });
    }

    function initJsSDK() {
        var app_id = App.data.appId;
        var jsApiList = ['chooseWXPay', 'previewImage'];
        var shareSetting = {
            title: vue.liveInfo.name, // 分享标题
            desc: '主讲嘉宾：'+vue.liveInfo.teacher_name+'，有讲等你来听课！', // 分享描述
            imgUrl: vue.liveInfo.cover_image
        };
        if(!!App.ctrls.wxJssdk){
            App.ctrls.wxJssdk.initJssdk(app_id, jsApiList, null, shareSetting);
        }
    }

    function initPageData() {
        // console.log('window.history:', window.history);
        // console.log('window.history.state:', window.history.state);
        //
        // var curUrl = window.location.href;
        // window.history.replaceState(null, null, '/live/home');
        // window.history.pushState("","",curUrl);
        // window.onpopstate = function(){
        //     window.location.href = '/live/home';
        // };

        vue.liveId = parseInt($('#live-id-value').val());
        vue.saleLinkId = parseInt($('#sale-link-id-value').val());
        refreshPage();
        App.api('/live_/info/add_view_count?ot=10&oi='+vue.liveId);
    }

    function compressFreeCode(){
        var bgImg = new Image();
        bgImg.setAttribute('crossOrigin', 'anonymous');
        bgImg.src = $('#free-scan-bg').val();
        bgImg.onload = function () {
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = bgImg.width;
            canvas.height = bgImg.height;
            context.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height);

            //二维码
            var codeImg = new Image();
            codeImg.setAttribute('crossOrigin', 'anonymous');
            codeImg.src = vue.showInviteCode;
            codeImg.onload = function () {
                context.drawImage(codeImg, 430, 116, 270, 270);

                //logo
                var logoImg = new Image();
                logoImg.setAttribute('crossOrigin', 'anonymous');
                logoImg.src = freeInviteType == 'live' ? $('#live-logo-url').val() : $('#wekuo-logo-url').val();
                logoImg.onload = function () {
                    context.drawImage(logoImg, 430+110, 116+110, 50, 50);
                    var base64Data = canvas.toDataURL('image/jpeg', 0.9);
                    repeatSetImg(base64Data);
                }
            };
        };
        function repeatSetImg(base64){
            if($('#free-scan-code').find('img').length <= 0){
                $('#free-scan-code').html('<img src="'+base64+'">');
                setTimeout(repeatSetImg, 50, base64);
            }
        }
    }

    function autoPlayTopic() {
        function timer(opj){
            $(opj).find('ul').animate({
                marginTop : "-24px"  
                },500,function(){  
                $(this).css({marginTop : "0"}).find("li:first").appendTo(this);  
            })
        }
        var num = $('.info-topic-list-wrapper').find('li').length;
        if(num > 1){
           var time=setInterval(timer, 3500, ".info-topic-list-wrapper");
        }
    }
})();