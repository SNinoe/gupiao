/**
 * Created by huanghongwei on 2017/2/17.
 */

(function() {
    var wxScanConfig = null;
    var payOptions = null;
    var curPurchaseId = null;

    var loadingTimeout = null;
    function clearLoadingTimeout() {
        if(!loadingTimeout){
            clearTimeout(loadingTimeout);
        }
    }

    function weixinPay(options) {
        clearLoadingTimeout();
        App.showLoading('等待中...');
        loadingTimeout = setTimeout(function () {
            App.hideLoading();
        }, 15000);
        var buyUrl = options.buyUrl;
        var succesCallback = options.success;
        var failCallback = options.fail;
        var completeCallback = options.complete;
        var wishScan = options.wishScan;
        payOptions = {
            buyUrl: buyUrl,
            success: succesCallback,
            fail: failCallback,
            complete: completeCallback,
            wishScan: wishScan
        };
        console.log('succesCallback:', succesCallback);

        if (App.utils.isWeixin() && App.utils.isMobile()){
            function jsFail() {
                if(wishScan){
                    weixinScanPay(buyUrl);
                }
                else{
                    if(failCallback)
                        failCallback();
                    if(completeCallback)
                        completeCallback();
                }
            }
            weixinJsPay(buyUrl, succesCallback, jsFail);
        }
        else
            weixinScanPay(buyUrl);
    }

    function weixinJsPay(buyUrl, succesCallback, failCallback) {
        var url = buyUrl + '&trade_type=jsapi';
        App.api(url, function(rspData) {
            App.hideLoading(true);
            clearLoadingTimeout();
            //下单失败则使用扫码支付
            if (!rspData.package) {
                //alert(rspData.error_msg);
                failCallback();
                return;
            }
            // alert(JSON.stringify(rspData));
            var payData = {
                timestamp: rspData.timeStamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
                nonceStr: rspData.nonceStr, // 支付签名随机串，不长于 32 位
                package: rspData.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                signType: rspData.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
                paySign: rspData.sign, // 支付签名
                success: function (res) {
                    succesCallback();
                },
                fail: function(res) {
                    failCallback();
                }
            };
            wx.chooseWXPay(payData);
        }, function () {
            App.hideLoading(true);
        });
    }

    function weixinScanPay(buyUrl) {
        var qrCodeImgSelector = wxScanConfig.qrCodeImgSelector;     //'.purchase_qrcode_img'
        var moneySelector = wxScanConfig.moneySelector;             //'.purchase_qrcode_money'
        var payDialogSelector = wxScanConfig.payDialogSelector;     //'#pay_dialog'
        var checkUrl = wxScanConfig.checkUrl;

        console.log('weixinScanPay:', buyUrl);

        App.api(buyUrl, function(rspData) {
            App.hideLoading(true);
            clearLoadingTimeout();
            $(qrCodeImgSelector).attr('src', 'data:image/png;base64,' + rspData.qrcode);
            $(moneySelector).html(rspData.money);
            if (App.utils.isPC()){
                if (App.uri.indexOf('/live/') == 0) { //PC端 直播间打赏
                    $(payDialogSelector).show();
                }
                else {
                    $(payDialogSelector).modal({backdrop: 'static'}, 'show');
                }
            }
            else{
                $(payDialogSelector).show();
            }

            if(checkUrl){
                if(rspData.purchase_id){
                    curPurchaseId = rspData.purchase_id;
                }else{
                    curPurchaseId = null;
                }
                waitPaid(checkUrl, payOptions.success);
            }

            if(payOptions.complete)
                payOptions.complete();
        }, function () {
            App.hideLoading(true);
        });
    }

    function waitPaid(checkUrl, successCb) {
        if(!curPurchaseId){
            return;
        }
        var url = checkUrl;
        if(checkUrl.indexOf('?') < 0)
            url = checkUrl + '?purchase_id=' + curPurchaseId;
        else
            url = checkUrl + '&purchase_id=' + curPurchaseId;
        var payDialogSelector = wxScanConfig.payDialogSelector;
        App.api(url, function(rspData) {
            if(rspData.result){
                if (App.utils.isPC()){
                    if (App.uri.indexOf('/live/') == 0) { //PC端 直播间打赏
                        $(payDialogSelector).hide();
                    }else {
                        $(payDialogSelector).modal('hide');
                    }
                }
                else
                    $(payDialogSelector).hide();

                if(successCb)
                    successCb(rspData);
            }else {
                var isShow = $(payDialogSelector).is(":visible");
                if(isShow)
                    setTimeout(waitPaid, 500, checkUrl, successCb);
            }

        });
    }

    //配置扫码支付
    /*
    可配置的数据项包括：
        qrCodeImgSelector： 显示二维码的img标签选择器（必填）
        moneySelector：显示金钱数量的标签选择器（选填）
        payDialogSelector： 付款弹框的标签选择器（必填）
        checkUrl：轮询等待的请求URL（选填，填写则代表轮询判断）
     */
    function scanConfig(options) {
        wxScanConfig = options;
    }

    // App.addCtrl('wxPayTools', {
    //     scanConfig: scanConfig,
    //     weixinPay: weixinPay   //如果需要使用扫码支付，需要先调用scanConfig接口配置扫码支付配置项
    // });

})();