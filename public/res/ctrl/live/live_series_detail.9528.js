/**
 * Created by huanghongwei on 2017/7/19.
 */

(function() {
    var scrollLoader = null;

    var vue = App.vue({
        el: '#app',
        data: {
            hideToTop: '',
            introArticleToggle: false,
            showToggleBtn: true,
            showRightToggle: false,
            showTopToolbar: false,
            moreControllerModel: false,
            moreLiveControllerModel: false,
            documentScrollTop: 0,
            // handleZoneOffsetTop: document.getElementById('handle-wrapper').offsetTop,
            urlAlterShow: false,
            showKfQrcode: false,
            choosePayModel: false,
            choosePayType: 'series',
            urlAlterLiveShow: false,
            ctlOptIndex: null,
            urlQrCodeModel: false,
            fixedSale: false,     // 分销侧边

            //数据相关
            kfImage: '',
            seriesId: null,
            saleLinkId: null,
            salePrice: 0,
            seriesInfo: {},
            accountInfo: {},
            isSubscribe: true,
            isPermission: false,
            isAdmin: false,
            seriesObjects: [],
            liveIndex: 1,
            // 单节live
            liveInfo: {},
            detailInfo: {},
            freeUrl: '',
            TYPE_SERIES: 6,
            TYPE_LIVE: 10,
            TYPE_FEATURED: 12,
            TYPE_SORT_NAME: 23,
            freeUrlData: {},
            liveFreeUrl: '',
            seriesFreeUrl: '',
            isShowingCatalog: false,
            chooseCreateModel: false,
            creatdType: 'live'
        },
        created: function() {
            this.$nextTick(initPageData);
        },
        methods: {
            showCatalog: showCatalog,
            subscribeAccount: subscribeAccount,
            optSeries: optSeries,
            buy: buy,
            genFreeUrl: genFreeUrl,
            genSeriesFreeUrl: genSeriesFreeUrl,
            optOptions: optOptions,
            showUrlQrCode: showUrlQrCode,
            reviewBigImage: reviewBigImage,
            toTop: toTop,
            checkCatalogPosition: checkCatalogPosition,
            genShopSalesUrl: genShopSalesUrl,
            genCircleTopic: genCircleTopic,
            goToCircle: goToCircle,
            goToPunch: goToPunch
        },
        mounted: function() {
            // window.addEventListener('scroll', this.topToolbar);
            // window.addEventListener('scroll', function () {
            //     $(window).scrollTop() >= 69 ? this.fixedSale = true : this.fixedSale = false;
            //
            //     this.isShowingCatalog = $('html, body').scrollTop() + $(window).height() > $('#catalog')[0].offsetTop;
            //     console.log('----------------------------');
            //     console.log('object offsetTop:', $('#catalog')[0].offsetTop);
            //     console.log('html scrollTop:', $('html, body').scrollTop());
            //     console.log('window height:', $(window).height());
            //     console.log('this.isShowingCatalog:', this.isShowingCatalog);
            //     // $('#catalog')[0].offsetTop < $(window).height() + $('#catalog')[0];
            // });
        }
    });

    //获取直播免费链接
    function genSeriesFreeUrl(e) {
        App.api('/live_/series/free_url', {'series_id': vue.seriesId}, function(rspData) {
            vue.seriesFreeUrl = rspData['free_url'];
        });
    }

    function genCircleTopic(topic) {
        if(topic.content.content){
            return '' + topic.user.nickname +'：'+topic.content.content.slice(0, 50);
        }else if(topic.content.files){
            return '[文件]';
        }else {
            return '[图片]';
        }
    }
    function goToCircle() {
        if(!vue.isPermission){
            App.confirm('', '购买课程才能免费进入社群', function () {
                buy();
            }, false, '购买');
        }else {
            App.showLoading('进入中...');
            App.api('/live_/series/join_circle?series_id='+vue.seriesInfo.id, function (joinResult) {
                App.hideLoading(true);
                if(joinResult.result){
                    window.location.href = 'http://'+$('#__circle_host').val()+vue.seriesInfo.circle.home_url;
                }else {
                    App.alertResult(false, joinResult.msg);
                }
            }, function (err) {
                App.hideLoading(true);
                App.debug('join circle request err:'+err);
            })
        }
    }
    function goToPunch() {
        if(!vue.isPermission){
            App.confirm('', '购买课程才能免费加入打卡', function () {
                buy();
            }, false, '购买');
        }else {
            App.showLoading('进入中...');
            App.api('/live_/series/join_punch?series_id='+vue.seriesInfo.id, function (joinResult) {
                App.hideLoading(true);
                if(joinResult.result){
                    window.location.href = joinResult.url;
                }else {
                    App.alertResult(false, joinResult.msg);
                }
            }, function (err) {
                App.hideLoading(true);
                App.debug('join punch request err:'+err);
            })
        }
    }

    function genShopSalesUrl(objId, objType) {
        url = App.utils.addParam('/live/shop/sales', 'obj_id', btoa('sale_links-'+objId));
        return App.utils.addParam(url, 'obj_type', btoa('sale_links-'+objType))
    }

    function showCatalog(e) {
        $('html, body').animate({
            scrollTop: $('#catalog')[0].offsetTop
        }, 500);
    }
    function toTop(e) {
        $('html, body').animate({
			scrollTop: 0
		}, 500)
    }

    function showUrlQrCode(url){
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

    //关注直播间
    function subscribeAccount(e) {
        App.api('/live_/user/subscribe_account?acc_id=' + vue.accountInfo.id, function(rspData) {
            vue.isSubscribe = true;
            App.alertResult(true, '已关注');
        });
    }

    function optSeries(optType) {
        var confirmDesc = '';
        var url = '';
        var successDesc = '';
        var callback = null;
        switch (optType) {
            case 'top':
                confirmDesc = '确定要置顶系列课『' + vue.seriesInfo.name + '』吗？';
                successDesc = '已置顶';
                url = '/live_/info/top_series';
                callback = function() {
                    vue.seriesInfo.top_show = 1;
                };
                break;
            case 'un_top':
                confirmDesc = '确定要取消系列课『' + vue.seriesInfo.name + '』置顶吗？';
                successDesc = '已取消置顶';
                url = '/live_/info/untop_series';
                callback = function() {
                    vue.seriesInfo.top_show = 0;
                };
                break;
            case 'off':
                confirmDesc = '确定要下架系列课『' + vue.seriesInfo.name + '』吗？';
                successDesc = '已下架';
                url = '/live_/info/off_series';
                callback = function() {
                    vue.seriesInfo.index_show = 0;
                };
                break;
            case 'on':
                confirmDesc = '确定要重新上架系列课『' + vue.seriesInfo.name + '』吗？';
                successDesc = '已重新上架';
                url = '/live_/info/on_series';
                callback = function() {
                    vue.seriesInfo.index_show = 1;
                };
                break;
            default:
                App.alertResult(false, '错误的操作类型');
        }
        if (confirmDesc && successDesc && url && callback) {
            App.confirm('提示', confirmDesc, function() {
                App.api(url, {
                    'series_id': vue.seriesInfo.id
                }, function(rspData) {
                    callback();
                    App.hideLoading(true);
                    App.alertResult(true, successDesc);
                }, function() {
                    App.hideLoading();
                })
            });
        }
    }

    function optOptions(optType, optItem) {
        if('notify' == optType){
            return sendNotify(optItem.id, optItem.object_type);
        }
        var data = {};
        if (optItem.object_type == vue.TYPE_SERIES){
            data.series_id = optItem.id;
        }else if (optItem.object_type == vue.TYPE_LIVE){
            data.live_id = optItem.id;
        }else {
            data.id = optItem.id;
        }
        switch (optType){
            case 'open':
                url = '/live_/restart_live';
                desc = '确定要重新打开直播课程『'+optItem.name+'』吗？';
                callback = function () {
                    optItem.finished = 0;
                };
                break;
            case 'close':
                url = '/live_/finish_live';
                desc = '确定要结束直播课程『'+optItem.name+'』吗？';
                callback = function () {
                    optItem.finished = 1;
                };
                break;
            case 'top':
                url = optItem.object_type == vue.TYPE_LIVE ? '/live_/info/top_live' : '/live_/info/top_series';
                desc = '确定要置顶课程『' + optItem.name + '』吗？';
                callback = function () {
                    optItem.top_show=1;
                };
                break;
            case 'un_top':
                eleId = '#'+optItem.object_type+'_'+optItem.id+'_top_show';
                url = optItem.object_type == vue.TYPE_LIVE ? '/live_/info/untop_live' : '/live_/info/untop_series';
                desc = '确定要取消课程『' + optItem.name + '』置顶吗？';
                callback = function () {
                    optItem.top_show=0;
                };
                break;
            case 'on':
                if (optItem.object_type == vue.TYPE_LIVE){
                    url = '/live_/info/on_live';
                }else if(optItem.object_type == vue.TYPE_SERIES){
                    url = '/live_/info/on_series';
                }else if(optItem.object_type == vue.TYPE_FEATURED){
                    url = '/live_/featured/set_index_show?sv=1';
                }
                desc = '确定要重新上架课程『' + optItem.name + '』吗？';
                callback = function () {
                    optItem.index_show=1;
                };
                break;
            case 'off':
                if (optItem.object_type == vue.TYPE_LIVE){
                    url = '/live_/info/off_live';
                }else if(optItem.object_type == vue.TYPE_SERIES){
                    url = '/live_/info/off_series';
                }else if(optItem.object_type == vue.TYPE_FEATURED){
                    url = '/live_/featured/set_index_show?sv=0';
                }
                desc = '确定要下架课程『' + optItem.name + '』吗？';
                callback = function () {
                    optItem.index_show=0;
                };
                break;
            default:
                App.alertResult(false, '错误的操作类型');
                break;

        }
        App.confirm('提示', desc, function() {
            App.api(url, data, function (rspData) {
                callback();
                App.hideLoading();
                App.alertResult(true, '已完成');
                vue.$forceUpdate();
            }, function () {
                App.hideLoading();
            })
        });
    }

    function buy() {
        var buyUrl = '/live_/money/buy_series?series_id=' + vue.seriesInfo.id;
        if(!!vue.saleLinkId){
            buyUrl = App.utils.addParam(buyUrl, 'salelink_id', vue.saleLinkId);
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

    function sendNotify(objectId, objectType) {
        App.showLoading('...');
        App.api('/live_/info/check_notify', {'object_id': objectId, 'object_type': objectType}, function (checkRsp) {
            App.hideLoading(true);
            var preFix = '', desc = '';
            if (vue.TYPE_SERIES == objectType){
                preFix = '本周';
                desc = '系列课每周可推送2次，每次时间间隔需要大于24小时，一共可推送10次，推送对象是在有讲关注了本直播间的用户。';
            }else {
                desc = '一共可推送3次，每次时间间隔需要大于24小时，推送对象是在有讲关注了本直播间的用户。';
            }
            App.confirm(preFix+'还剩'+checkRsp.left_count+'次推送机会', desc, function () {
                if(!checkRsp.result){
                    return
                }
                App.showLoading('发送中...');
                App.api('/live_/info/send_notify', {'object_id': objectId, 'object_type': objectType}, function(sendRsp) {
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

    function resetKfImage(isAfterPay) {
        if(!!vue.isPermission){
            vue.kfImage = vue.accountInfo.after_sale_image || vue.accountInfo.pre_sale_image;
            if(isAfterPay && vue.accountInfo.after_sale_image){
                vue.showKfQrcode = true;
            }
        }else {
            vue.kfImage = vue.accountInfo.pre_sale_image;
        }
    }

    function refreshPage(isAfterPay) {
        App.api('/live_/series/series_detail_info?id=' + vue.seriesId, function(rspData) {
            vue.seriesInfo = rspData;
            // if(vue.salePrice > 0){
            //     vue.seriesInfo.price = vue.salePrice;
            // }
            if(vue.salePrice <= 0){
                vue.salePrice = vue.seriesInfo.price;
            }
            vue.accountInfo = rspData.account_data;
            vue.isAdmin = rspData.admin_uids.indexOf(App.user_id) >= 0;

            if(vue.seriesInfo.intro && vue.seriesInfo.intro.length > 0){
                App.http(vue.seriesInfo.intro, null, function(content) {
                    var introTag = '#live-article';
                    $(introTag).html(content);
                    var introTagHeight = $(introTag).height();
                    vue.showToggleBtn = introTagHeight > 200;
                    vue.showRightToggle = introTagHeight > $(window).height() - 50;
                });
            }

            App.api('/live_/user/is_subscribe_account?acc_id=' + vue.accountInfo.id, function(rspData) {
                vue.isSubscribe = rspData.result;
            });
            loadLives();
            shareSetting();
            resetKfImage(isAfterPay);
            Vue.nextTick(autoPlayTopic);
        });

        // var permissionUrl = '/live_/user/series_permission?series_id=' + vue.seriesId;
        var permissionUrl = '/live_/series/is_permission?series_id=' + vue.seriesId;
        if(!!vue.saleLinkId){
            permissionUrl = App.utils.addParam(permissionUrl, 'sale_link_id', vue.saleLinkId);
        }
        App.api(permissionUrl, function(rspData) {
            vue.isPermission = rspData.result;
            resetKfImage(isAfterPay);
        });
    }

    //获取直播免费链接
    function genFreeUrl(e) {
        var liveId = vue.seriesObjects[vue.ctlOptIndex].id;
        App.api('/live_/user/normal_ticket?id='+liveId, function (rspData) {
            vue.liveFreeUrl = rspData['ticket_url'];
            vue.freeUrlData[liveId] = vue.liveFreeUrl;
        });
    }

    function loadLives() {
        vue.liveIndex = 1;
        vue.seriesObjects = [];
        var url = '/live_/series/series_live_list?ser_id=' + vue.seriesId;
        if(vue.isAdmin){
            url = '/live_/series/bg_series_live_list?ser_id=' + vue.seriesId;
        }
        scrollLoader = App.ctrls.scrollLoader.start({
            url: url,
            limit: 100,
            handler: function(rspData) {
                if (!rspData || !rspData.items) {
                    return
                }
                vue.seriesObjects = vue.seriesObjects.concat(rspData.items);
            }
        });
    }

    function shareSetting() {
        if (App.utils.isWeixin() && !!vue.seriesInfo && wx) {
            shareOptions = {
                title: vue.seriesInfo.name, // 分享标题
                desc: '"'+vue.accountInfo.name+'"在有讲发布系列课程啦', // 分享描述
                imgUrl: vue.seriesInfo.cover_image
            };
            wx.onMenuShareAppMessage(shareOptions);
            wx.onMenuShareTimeline(shareOptions);
            wx.onMenuShareQQ(shareOptions);
            wx.onMenuShareWeibo(shareOptions);
            wx.onMenuShareQZone(shareOptions);
        }
    }

    function reviewBigImage(event) {
        var urlSrc = $(event.target).attr('ori-src');
        wx.previewImage({
            current: urlSrc,
            urls: [urlSrc]
        });
    }

    function initPageData() {
        vue.seriesId = parseInt($('#__series_id').val());
        var saleLinkId = $('#__sale_link_id').val();
        if((!!saleLinkId) && saleLinkId.length > 0){
            vue.saleLinkId = parseInt(saleLinkId);
        }
        var salePrice = parseFloat($('#__sale_price').val());
        if ((!!vue.saleLinkId) && salePrice > 0){
            vue.salePrice = salePrice;
        }
        if (App.utils.isMobile() && !!App.ctrls.wxJssdk) {
            var jsApiList = [
                'chooseWXPay',
                'onMenuShareAppMessage',
                'onMenuShareTimeline',
                'onMenuShareQQ',
                'onMenuShareWeibo',
                'onMenuShareQZone',
                'previewImage'
            ];
            App.ctrls.wxJssdk.initJssdk(3, jsApiList, shareSetting);
        }
        refreshPage();

        window.addEventListener('scroll', function () {
            vue.fixedSale = $(window).scrollTop() >= 69;
            vue.isShowingCatalog = $('html, body').scrollTop() + $(window).height() > $('#catalog')[0].offsetTop;
        });
        App.api('/live_/info/add_view_count?ot=6&oi='+vue.seriesId); //添加pv统计
    }

    function checkCatalogPosition() {
        vue.$nextTick(function () {
            vue.isShowingCatalog = $('html, body').scrollTop() + $(window).height() > $('#catalog')[0].offsetTop;
        })
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