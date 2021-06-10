/**
 * Created by huanghongwei on 2017/7/19.
 */

(function() {
    var vueInitData = {
        TYPE_SERIES: 6,
        TYPE_LIVE: 10,
        TYPE_FEATURED: 12,
        liveItems: [],
        liveHasMore: true,
        isLoadingAll: false,
        seriesItems: [],
        seriesHasMore: true,
        isLoadingSeries: false,
        featuredItems: [],
        featuredHasMore: true,
        isLoadingFeatured: false,
        ToTopBtn: false,
        hideToTop: false,
        ctlModelIndex: null,
        ctlModelItem: null,
        urlAlterShow: false,
        liveFreeUrl: '',
        seriesFreeUrl: '',
        documentScrollTop: 0,
        windowHeight: document.body.clientHeight,
        urlQrCodeModel: false,
        adminUids: [],
        ownerUid: {},
        accountInfo: {},
        isSubscribe: true,
        accountId: null,
        isAdmin: false,
        isOwner: false,
        freeUrlData: {},
        searchModel: false,
        searchKeyword: '',
        notifyState: false,
    };
    var vue = null;
    var scrollLoader = null;
    var pageStorage = {};
    var accountId = App.utils.urlParam('id');

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

    function scrollToTop() {
		$('html, body').animate({
			scrollTop: 0
		}, 500)
    }
    function showToTopBtn() {
		vue.documentScrollTop = document.body.scrollTop;
		vue.documentScrollTop >= vue.windowHeight ? vue.ToTopBtn = true : vue.ToTopBtn = false;
    }

    function subscribeOpt(e) {
        App.api('/live_/user/subscribe_account?acc_id='+vue.accountInfo.id, function(rspData){
            vue.isSubscribe = true;
            App.alertResult(true, '已关注');
        });
    }

    function cancleSubscribeOpt(e) {
        App.confirm('提示', '确定要取消关注直播间『'+vue.accountInfo.name+'』吗？取消关注以后将无法及时接收它的课程更新。', function () {
            App.api('/live_/user/unsubscribe_account?acc_id='+vue.accountInfo.id, function(rspData){
                vue.isSubscribe = false;
                App.alertResult(true, '已取消关注');
            });
        });
    }

    function genFreeUrl() {
        // var item = vue.liveItems[vue.ctlModelIndex];
        var item = vue.ctlModelItem;
        if(item.object_type != vue.TYPE_LIVE){
            return App.alertResult(false, '只有直播才能获取免费链接');
        }
        var liveId = item.id;
        App.api('/live_/user/normal_ticket?id='+liveId, function (rspData) {
            vue.liveFreeUrl = rspData['ticket_url'];
            vue.freeUrlData[liveId] = vue.liveFreeUrl;
        });
    }

    function genSeriesFreeUrl() {
        var item = vue.ctlModelItem;
        if(item.object_type != vue.TYPE_SERIES){
            return App.alertResult(false, '只能获取系列额免费链接');
        }
        App.api('/live_/series/free_url', {'series_id': item.id}, function (rspData) {
            vue.seriesFreeUrl = rspData['free_url'];
        });
    }

    function optOptions(optType) {
        // var optItem = vue.liveItems[vue.ctlModelIndex];
        var optItem = vue.ctlModelItem;
        if('notify' == optType){
            return sendNotify(optItem.id, optItem.object_type);
        }

        var data = {};
        if (optItem.object_type == vue.TYPE_SERIES){
            data.series_id = optItem.id;
        }else if (optItem.object_type == vue.TYPE_LIVE){
            data.live_id = optItem.id;
        }else{
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
                }else if (optItem.object_type == vue.TYPE_SERIES){
                    url = '/live_/info/on_series';
                }else if (optItem.object_type == vue.TYPE_FEATURED){
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
                }else if (optItem.object_type == vue.TYPE_SERIES){
                    url = '/live_/info/off_series';
                }else if (optItem.object_type == vue.TYPE_FEATURED){
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

    function loadMoreLives() {
        var limit = 10;
        var url = '/live_/info/account_lives?id='+accountId+'&limit='+limit+'&offset='+vue.liveItems.length;
        vue.isLoadingAll = true;
        App.api(url, function (rspData) {
            for(var i=0; i < rspData.items.length; i++){
                vue.liveItems.push(rspData.items[i]);
            }
            vue.liveHasMore = (rspData.items.length >= limit);
            vue.isLoadingAll = false;
        }, function () {
            vue.isLoadingAll = false;
        })
    }
    function loadMoreSeries(limit) {
        vue.isLoadingSeries = true;
        var url = '/live_/info/account_series?id='+accountId+'&limit='+limit+'&offset='+vue.seriesItems.length;
        App.api(url, function (rspData) {
            for(var i=0; i < rspData.items.length; i++){
                vue.seriesItems.push(rspData.items[i]);
            }
            vue.seriesHasMore = (rspData.items.length >= limit);
            vue.isLoadingSeries = false;
        }, function () {
            vue.isLoadingSeries = false;
        })
    }
    function loadMoreFeatures(limit) {
        vue.isLoadingFeatured = true;
        var url = '/live_/featured/account_features?id='+accountId+'&limit='+limit+'&offset='+vue.featuredItems.length;
        App.api(url, function (rspData) {
            for(var i=0; i < rspData.items.length; i++){
                vue.featuredItems.push(rspData.items[i]);
            }
            vue.featuredHasMore = (rspData.count > vue.featuredItems.length);
            vue.isLoadingFeatured = false;
        }, function () {
            vue.isLoadingFeatured = false;
        })
    }

    function initPageData() {
        vue.accountId = accountId;
        if(vue.liveItems.length <= 0){
            loadMoreLives();
        }
        if(vue.seriesItems.length <= 0){
            loadMoreSeries(3);
        }
        if(vue.featuredItems.length <= 0){
            loadMoreFeatures(3);
        }
        if(!pageStorage.storage){
            App.api('/live_/user/account_data?id='+vue.accountId, function(rspData){
                if(rspData.subscribe_data && rspData.subscribe_data.notify){
                    vue.notifyState = true
                } else {
                    vue.notifyState = false
                }
                
                vue.accountInfo = rspData.account_data;
                vue.isAdmin = rspData.admin_uids.indexOf(App.user_id) >= 0;
                vue.isOwner = rspData.account_data.owner_uid == App.user_id;

            });
            App.api('/live_/user/is_subscribe_account?acc_id='+vue.accountId, function (rspData) {
                vue.isSubscribe = rspData.result;
            });
            $('#page-loading').hide();
        }else{
            $('body').scrollTop(pageStorage.scrollTop);
            setTimeout(function () {
                $('#page-loading').hide();
            }, 300);
        }
    }
    
    function saveStorage(url, stayPage) {
        slResumeTools.jumpPage(url, vue.$data, scrollLoader, stayPage);
    }

    function genOptDlgTitle(item) {
        if(!vue){
            vue = this;
        }
        if(item.object_type == vue.TYPE_LIVE){
            return '直播课程：'+item.name
        }else if(item.object_type == vue.TYPE_SERIES){
            return '系列课程：'+item.name
        }else if(item.object_type == vue.TYPE_FEATURED){
            return '精品课程：'+item.name
        }else {
            return item.name;
        }
    }

    function formatSeconds(val) {
        var seconds = parseInt(val);// 秒
        var minutes = 0;// 分 
        var hours = 0;// 小时 

        if(seconds > 60) { 
            minutes = parseInt(seconds/60);
            seconds = parseInt(seconds%60);

            if(minutes > 60) { 
                hours = parseInt(minutes/60);
                minutes = parseInt(minutes%60);
            }
        }
        var result = ""+parseInt(seconds)+"秒";
        if(minutes > 0) {
            result = ""+parseInt(minutes)+"分"+result; 
        }
        if(hours > 0) { 
            result = ""+parseInt(hours)+"小时"+result; 
        }
        return result;
    }
    
    function genShopSalesUrl(objId, objType) {
        url = App.utils.addParam('/live/shop/sales', 'obj_id', btoa('sale_links-'+objId));
        return App.utils.addParam(url, 'obj_type', btoa('sale_links-'+objType))
    }

    function unNotify() {
        console.log(vue.notifyState)
        App.confirm('提示', '确定要关闭通知吗？关闭通知以后您在有讲将不再接收到『'+vue.accountInfo.name+'』发布的新课通知', function () {
            var url = '/live_/user/un_account_notify';
            App.api(url, {'account_id': accountId}, function (rspData) {
                vue.notifyState = false
            });
        });
    }

    function notify() {
        console.log(vue.notifyState)
        var url = '/live_/user/account_notify';
        App.api(url, {'account_id': accountId}, function (rspData) {
            vue.notifyState = true
        });
    }

    $(document).ready(function () {
        pageStorage = slResumeTools.resumePage(vueInitData, {});
        pageStorage.vue.accountId = accountId;
        vue = App.vue({
            el: '#app',
            data: pageStorage.vue,
            created: function() {
                this.$nextTick(initPageData);
            },
            methods: {
                beautyTimeStr: BeautyTools.beautyTimeStr,
                beautyPrice: BeautyTools.beautyPrice,
                countLeftHours: BeautyTools.countLeftHours,
                scrollToTop: scrollToTop,
                showToTopBtn: showToTopBtn,
                subscribeOpt: subscribeOpt,
                cancleSubscribeOpt: cancleSubscribeOpt,
                genFreeUrl: genFreeUrl,
                genSeriesFreeUrl: genSeriesFreeUrl,
                optOptions: optOptions,
                showUrlQrCode: showUrlQrCode,
                saveStorage: saveStorage,
                loadMoreLives: loadMoreLives,
                loadMoreSeries: loadMoreSeries,
                genOptDlgTitle: genOptDlgTitle,
                formatSeconds: formatSeconds,
                genShopSalesUrl: genShopSalesUrl,
                unNotify: unNotify,
                notify: notify,
                loadMoreFeatures: loadMoreFeatures
            },
            mounted: function() {
                window.addEventListener('scroll', this.showToTopBtn);
            }
        });
    });
})();
