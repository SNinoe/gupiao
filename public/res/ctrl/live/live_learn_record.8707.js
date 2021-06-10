/**
 * Created by huanghongwei on 2017/11/9.
 */

(function() {
    var learnData = null;
    var keyPrefix = 'live_learn_record_';

    var tickSeconds = 30;           //每次前端检查时间
    var expireSeconds = 3*60;       //每次学习关闭页面这么久以后，算另一次学习
    var submitSeconds = 60*5 + Math.random()*60*10;   //5~15分钟提交一次（随机，避免同时请求过多请求）
    var minValidSeconds = 2*60;     //学习时间大于这个数的时候，才统计上一次失效以后的时长

    // // --- 以下是测试数据 ---
    // var tickSeconds = 5;           //每次前端检查时间
    // var expireSeconds = 60;       //每次学习关闭页面这么久以后，算另一次学习
    // var submitSeconds = 20;   //3~5分钟提交一次（随机，避免同时请求过多请求）
    // var minValidSeconds = 30;     //学习时间大于这个数的时候，才统计上一次失效以后的时长

    function init(objectId, objectType) {
        var _key = keyPrefix+objectType+'_'+objectId;
        learnData = localStorage.getItem(_key);
        if(!learnData){
            learnData = {};
        }else {
            learnData = JSON.parse(learnData);
        }
        learnData.objectId = objectId;
        learnData.objectType = objectType;
        setTimeout(tickCount, tickSeconds*1000);
    }
    
    function tickCount() {
        if((!learnData.learnId) || ((new Date().getTime()) - learnData.lastValidTime) > expireSeconds*1000){
            //learnId 表示某一次学习的id
            if((!!learnData.learnId) && learnData.keepSeconds > minValidSeconds){
                //提交统计上一次的学习
                submitToServer(learnData.learnId, learnData.objectId, learnData.objectType, learnData.keepSeconds);
            }
            learnData.learnId = parseInt(new Date().getTime());
            learnData.keepSeconds = 0;
        }
        if(!learnData.keepSeconds){
            learnData.keepSeconds = 0;
        }
        learnData.keepSeconds += tickSeconds;
        learnData.lastValidTime = new Date().getTime();

        //检查是否需要上传到服务器
        if(submitSeconds < learnData.keepSeconds){
            submitToServer(learnData.learnId, learnData.objectId, learnData.objectType, learnData.keepSeconds);
            learnData.keepSeconds = 0;
        }

        var _key = keyPrefix+learnData.objectType+'_'+learnData.objectId;
        localStorage.setItem(_key, JSON.stringify(learnData));
        setTimeout(tickCount, tickSeconds*1000);
    }

    function submitToServer(learnId, objectId, objectType, keepSeconds) {
        var serverData = {
            'learn_id': learnId,
            'keep_seconds': keepSeconds,
            'object_id': objectId,
            'object_type': objectType
        };
        App.api('/chart/data/live_learn_record', serverData);
    }

    App.ctrls.liveLearnRecord = {
        init: init
    };
})();
