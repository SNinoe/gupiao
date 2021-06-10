/**
 * Created by huanghongwei on 2017/7/11.
 */

(function() {
    var vue = App.vue({
        el: '#app',
        data: {
            a: '1',
            answerOrderModel: false,    // 有答收益弹窗
            showWithdrawModel: false,    // 申请提现弹窗
            showWekuoQrcode: false,
            maxWithdraw: 0,
            currentWithdraw: '',
            purchaseList: [
                {
                    name: 111,
                    income: 1
                },
                {
                    name: 112,
                    income: 1
                }
            ],
            userMoneyData: {},
            //打赏列表数据
            rewardOverview: {},
            rewardPurchaseList: [],
            rewardPurchaseHasMore: true,
            rewardOrderModel: false,    // 打赏收益弹窗
            //分销列表数据
            saleOverview: {},
            salePurchaseList: [],
            salePurchaseHasMore: true,
            sellerOrderModel: false,    // 分销收益弹窗
            //提现列表数据
            withdrawList: [],
            showWithdrawList: false,    // 提现记录弹窗
            withdrawHasMore: true
        },
        created: function() {
            this.$nextTick(function() {
                initPage();
            })
        },
        methods: {
            afterEnter: function() {
                this.$refs.formNum.focus();
            },
            showRewardDlg: showRewardDlg,
            showSaleDlg: showSaleDlg,
            showWithdrawListDlg: showWithdrawListDlg,
            withdrawOpt: withdrawOpt
        }
    });


    function initPage() {
        App.api('/live_/money/user_money', function (rspData) {
            vue.userMoneyData = rspData;
            vue.maxWithdraw = rspData.money;
        });
    }

    function showRewardDlg() {
        //1、列表数据
        vue.rewardPurchaseList = [];
        vue.rewardPurchaseHasMore = true;
        App.ctrls.scrollLoader.start({
            url: '/live_/money/reward_query',
            limit: 10,
            scroller: '#reward-purchases-list',
			container: '#reward-purchase-dlg',
            handler: function(rspData) {
				if(rspData){
					vue.rewardPurchaseList = vue.rewardPurchaseList.concat(rspData.items);
				}
				vue.rewardPurchaseHasMore = (!!rspData && vue.rewardPurchaseList.length < rspData.count);
            }
        });
        //2、汇总数据
        App.api('/live_/money/deposit_overview?type=reward', function (rspData) {
            vue.rewardOverview = rspData;
        });
        vue.rewardOrderModel = true;
    }

    function showSaleDlg() {
        //1、列表数据
        vue.salePurchaseList = [];
        vue.salePurchaseHasMore = true;
        App.ctrls.scrollLoader.start({
            url: '/live_/money/sale_query',
            limit: 10,
            scroller: '#sale-purchases-list',
			container: '#sale-purchase-dlg',
            handler: function(rspData) {
				if(rspData){
					vue.salePurchaseList = vue.salePurchaseList.concat(rspData.items);
				}
				vue.salePurchaseHasMore = (!!rspData && vue.salePurchaseList.length < rspData.count);
            }
        });
        //2、汇总数据
        App.api('/live_/money/deposit_overview?type=sale', function (rspData) {
            vue.saleOverview = rspData;
        });
        vue.sellerOrderModel = true;
    }

    function showWithdrawListDlg() {
        vue.withdrawList = [];
        vue.withdrawHasMore = true;
        App.ctrls.scrollLoader.start({
            url: '/money/user_draw_apls?bank_type=2',
            limit: 10,
            scroller: '#withdraw-list',
			container: '#withdraw-list-dlg',
            handler: function(rspData) {
                console.log('rspData:', rspData);
				if(rspData){
					vue.withdrawList = vue.withdrawList.concat(rspData.items);
				}
				vue.withdrawHasMore = (!!rspData && vue.withdrawList.length < rspData.count);
            }
        });
        vue.showWithdrawList = true;
    }

    function withdrawOpt(e) {
        function doSubmit() {
            if(vue.currentWithdraw.length <= 0){
                App.alertResult(false, '请输入提现金额');
                return
            }
            if(parseInt(vue.currentWithdraw) < parseFloat(vue.currentWithdraw)){
                return App.alertResult(false, '提现金额必须是整数');
            }
            if (parseFloat(vue.currentWithdraw) < 1.0){
                App.alertResult(false, '提现金额不能低于1元');
                return
            }
            if (parseFloat(vue.currentWithdraw) > 2000.0){
                App.alertResult(false, '提现金额不能超出2000元');
                return
            }
            App.showWaitPost('#withdraw-btn');
            vue.showWithdrawModel = false;
            App.api('/money/live_withdraw', {'money': vue.currentWithdraw}, function (rspData) {
                App.hideWaitPost('#withdraw-btn');
                App.alertSuccess('已提交审核，请耐心等候');
                initPage();
            }, function () {
                App.hideWaitPost('#withdraw-btn');
            });
        }

        App.api('/live_/user/is_subscribe_wekuo', function (resultData) {
            if(resultData.result){
                doSubmit();
            } else {
                vue.showWekuoQrcode = true;
            }
        });
    }
})();
