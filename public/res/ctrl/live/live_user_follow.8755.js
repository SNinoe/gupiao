/**
 * Created by huanghongwei on 2017/4/6.
 */

(function() {
    var vue = App.vue({
        el: '#app',
        data: {
            accountList: [],
            accountHasMorn: true,
            hideToTop: false,
            isVip: false,
        },
        created: function() {
            this.loadPageDatas();
        },
        methods: {
            loadPageDatas: loadPageDatas,
        }
    })
    function loadPageDatas() {
        App.ctrls.scrollLoader.start({
            url: '/live_/user/subscribe_account_list',
            limit: 10,
            handler: function(rspData) {
                if(rspData) {
                    vue.accountList = vue.accountList.concat(rspData.items);
                }
                if(!rspData || rspData.count == 0) {
                    $('#not-account-list').show();
                }
            },
            finishCallback: function() {
                vue.accountHasMorn = false;
            }
        });
    }

    App.api('user/vip_info', function(rspData) {
        vue.isVip = rspData.id ? true : false;
    });

})();