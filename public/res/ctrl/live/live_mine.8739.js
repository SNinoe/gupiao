/**
 * Created by huanghongwei on 2017/7/11.
 */

(function() {
    var vue = App.vue({
        el: '#app',
        data: {
            a: 1,
            hideToTop: true,
            userData: {},
            isVip: false,
        },
        methods: {
            logout: function () {
                App.utils.delCookie(App.options.loginCookieName);
                window.location.reload();
            }
        },
        created: function(){
            Vue.nextTick(initPage);
        }
    });

    function initPage() {
        if(!App.data.user){
            App.loadUserData('/live_/user/load_live_user', function () {
                vue.userData = App.data.user;
            });
        }else{
            vue.userData = App.data.user;
        }
    }

    App.api('user/vip_info', function(rspData) {
        vue.isVip = rspData.id ? true: false;
    });
})();
