
var SecKillCountTools = (function() {

    function leftTimeStr(finishTimeStr) {
        var now = new Date();
        var finishTime = new Date(Date.parse(finishTimeStr.replace(/-/g, "/")));
        if (finishTime < now){
            return null;
        }

        var hourCount = parseInt((finishTime-now)/(3600*1000));
        var leftMinAmount = (finishTime-now)%(3600*1000);

        var minCount = parseInt(leftMinAmount/(60*1000));
        var leftSecAmount = leftMinAmount%(60*1000);

        var secCount = parseInt(leftSecAmount/(1000));
        var leftMSecAmount = leftSecAmount%1000;

        var mSecCount = parseInt(leftMSecAmount/100);
        return {
            hourCount: hourCount,
            minCount: minCount,
            secCount: secCount,
            mSecCount: mSecCount
        }
    }

    return {
        leftTimeStr: leftTimeStr
    }
})();