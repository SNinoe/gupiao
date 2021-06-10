/**
 * Created by huanghongwei on 2017/4/10.
 */

(function() {
    var vue = App.vue({
        el: '#app',
        data: {
            hasAccount: false,
            adminUids: [],
            ownerUid: {},
        },
        created: function() {
            Vue.nextTick(initPage);
        },
        methods: {
            removeAdminUid: removeAdminUid,
        }
    })

    function removeAdminUid(id, name) {

        App.confirm('警告', '确定要将『'+ name +'』从活动号管理员中移除吗？', function() {
            console.log('remove admin:', id);
            App.showLoading('');
            App.api('/live_/user/delete_account_admin', {'admin_uid': id}, function (rspData) {
                App.hideLoading();
                App.alertSuccess('已成功移除');
                for (var i = vue.adminUids.length - 1; i >= 0; i--) {
                    var item = vue.adminUids[i];
                    if(item.id == id) {
                        vue.adminUids.splice(i, 1);
                    }
                }
            }, function () {
                App.hideLoading();
            })
        })
    }

    function initPage() {
        App.api('/live_/user/account_admins', function(rspData){
            if(!!rspData.account_data) {
                vue.hasAccount = true;
                var owner_uid = rspData['owner_uid'];
                App.api('user/summary?id=' + owner_uid, function (user) {
                    vue.ownerUid = user;
                }, null, {enableCache:true});
                var admin_uids = rspData['admin_uids'];
                if(admin_uids.length <= 0){
                    $('.administrator-box').hide();
                }
                for(var i=0; i < admin_uids.length; i++){
                    App.api('user/summary?id=' + admin_uids[i], function (user) {
                        vue.adminUids =  vue.adminUids.concat(user);
                    }, null, {enableCache:true});
                }
            }else {
                window.location = '/live/account/edit'
            }
        });
    }

})();