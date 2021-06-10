/**
 * Created by huanghongwei on 2017/3/1.
 */
(function() {

    var APP_IDS = {
        'live': 3,
        'wekuo': 2,
        'circle': 5,
        'punch': 4
    };

    var configApiList = [
        'onMenuShareAppMessage',
        'onMenuShareTimeline',
        'onMenuShareQQ',
        'onMenuShareWeibo',
        'onMenuShareQZone',
        'hideMenuItems',
        'chooseWXPay',
        'previewImage',
        'uploadImage',
        'startRecord',
        'stopRecord',
        'uploadVoice',
        'onVoiceRecordEnd',
        'playVoice',
        'stopVoice',
        'onVoicePlayEnd',
        'downloadVoice'
    ];
    var pageTitles = document.title;
    var liveDefaultSetting = {'imgUrl': 'https://alcdn.wekuo.com/live-local/108.png'};
    var wekuoDefaultSetting = {'imgUrl': 'https://alcdn.wekuo.com/live-local/wk_logo.jpg'};
    var circleDefaultSetting = {'imgUrl': 'https://alcdn.wekuo.com/live-local/shequn.jpeg'};
    var punchDefaultSetting = {'imgUrl': 'http://alcdn.wekuo.com/live-local/plan.jpeg'};

    if(!!pageTitles){
        liveDefaultSetting.title = pageTitles;
        liveDefaultSetting.desc = '有讲，语音微课必备神器，学习是最有潜力的投资';
        wekuoDefaultSetting.title = pageTitles;
        wekuoDefaultSetting.desc = '唯库，轻松高效学习，百万年轻人学习聚集地';
        circleDefaultSetting.title = pageTitles;
        circleDefaultSetting.desc = '轻社群，拉近你我距离，更了解彼此';
        punchDefaultSetting.title = pageTitles;
        punchDefaultSetting.desc = '计划控，你的自我管理工具，计划助手';
    }else {
        liveDefaultSetting.title = '有讲丨每天有讲，每天可听...';
        liveDefaultSetting.desc = '语音微课必备神器，学习是最有潜力的投资';
        wekuoDefaultSetting.title = '唯库丨年轻人技能学习神器';
        wekuoDefaultSetting.desc = '轻松高效学习，百万年轻人学习聚集地';
        circleDefaultSetting.title = '轻社群丨链接你我';
        circleDefaultSetting.desc = '拉近你我距离，更了解彼此';
        punchDefaultSetting.title = '计划控 | 计划助手';
        punchDefaultSetting.desc = '你的自我管理工具，计划助手';
    }

    var signRspData = null;
    var isLoadingSign = false;
    var globalReadyFuncs = [];
    var globalSetting = {};

    function setShare(wx_app_id, shareSetting) {
        var defaultSetting = null;

        if(parseInt(wx_app_id) == APP_IDS.live){
            defaultSetting = liveDefaultSetting;
        }else if(parseInt(wx_app_id) == APP_IDS.wekuo){
            defaultSetting = wekuoDefaultSetting;
        }else if(parseInt(wx_app_id) == APP_IDS.circle){
            defaultSetting = circleDefaultSetting;
        }else if(parseInt(wx_app_id) == APP_IDS.punch){
            defaultSetting = punchDefaultSetting;
        }

        if(!shareSetting){
            shareSetting = defaultSetting;
        }else if(defaultSetting){
            shareSetting = $.extend(defaultSetting, shareSetting);
        }

        if(!!shareSetting){
            console.log('setShare...');
            wx.onMenuShareAppMessage(shareSetting);
            wx.onMenuShareTimeline(shareSetting);
            wx.onMenuShareQQ(shareSetting);
            wx.onMenuShareWeibo(shareSetting);
            wx.onMenuShareQZone(shareSetting);
        }
    }

    function initJssdk(wx_app_id, jsApiList, readyRunFunc, shareSetting) {
        console.log('initJssdk:', App.utils.isWeixin(), wx_app_id);
        console.log('shareSetting:', shareSetting);
        App.debug('wx_app_id:'+wx_app_id);
        if(!App.utils.isWeixin()){
            return
        }

        for(var i=0; i<jsApiList.length; i++){
            if(configApiList.indexOf(jsApiList[i]) < 0){
                configApiList.push(jsApiList[i]);
            }
        }
        if(!!shareSetting){
            globalSetting = $.extend(globalSetting, shareSetting);
        }

        if(!signRspData && !isLoadingSign){
            isLoadingSign = true;

            if(!!readyRunFunc){
                globalReadyFuncs.push(readyRunFunc);
            }

            App.api('/weixin/jssdk_sign?wxappid='+wx_app_id+'&url=' + encodeURIComponent(location.href), function(rspData) {
                signRspData = rspData;

                wx.config({
                    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: signRspData.app_id, // 必填，公众号的唯一标识
                    timestamp: signRspData.timestamp, // 必填，生成签名的时间戳
                    nonceStr: signRspData.nonce, // 必填，生成签名的随机串
                    signature: signRspData.sign, // 必填，签名，见附录1
                    jsApiList: configApiList
                });
                wx.ready(function(){
                    console.log('wx.ready...');
                    isLoadingSign = false;
                    setShare(wx_app_id, globalSetting);
                    for(var i=0; i<globalReadyFuncs.length; i++){
                        _func = globalReadyFuncs[i];
                        _func();
                    }
                    globalReadyFuncs = [];
                });


            }, function () {
                isLoadingSign = false;
            }, {enableCache: true});
        }else if(isLoadingSign){
            if(!!readyRunFunc){
                globalReadyFuncs.push(readyRunFunc);
            }
        }else {
            if(!!readyRunFunc){
                readyRunFunc();
            }
            setShare(wx_app_id, globalSetting);
        }
    }
    App.ctrls.wxJssdk = {
        initJssdk: initJssdk,
        init: initJssdk,
        APP_IDS: APP_IDS
    };

})();

