/**
 * Created by huanghongwei on 2017/7/12.
 */
(function() {
    var portraitBase64 = null;
    var RESEND_TIME = 60;

    var vue = App.vue({
        el: '#app',
        data: {
            accountInfo: {},
            alterModelInfo: {
                alterContent: ''
            },
            showAlterModel: false,
            amendAvatarKey: null,
            showMain: null,
            showCreateModel: false,
            createInfo: {},
            adminListModel: false,
            adminUids: [],
            ownerUid: {},
            isOwner: false,
        },
        created: function() {
            Vue.nextTick(initPage);
        },
        methods: {
            alterInfo: alterInfo,
            cancleAlter: cancleAlter,
            confirmAlter: confirmAlter,
            chooseAvatar: chooseAvatar,
            confirmAvatar: confirmAvatar,
            hideAvatarDlg: hideAvatarDlg,
            submitAlterAccount: submitAlterAccount,
            confirmCreate: confirmCreate,
            genVerifyCode: genVerifyCode,
            removeAdminUid: removeAdminUid,
            inviteAdmin: inviteAdmin
        }
    });

    function alterInfo(title, content, alterType, isDisabled) {
        if(!title) {
            return false;
        }
        vue.alterModelInfo.title = title;
        vue.alterModelInfo.content = content;
        vue.alterModelInfo.alterType = alterType;
        vue.alterModelInfo.isDisabled = isDisabled;
        vue.showAlterModel = true;
    }

    function cancleAlter() {
        vue.showAlterModel = false;
        vue.alterModelInfo.title = '';
        vue.alterModelInfo.content = '';
        vue.alterModelInfo.isDisabled = '';
        vue.alterModelInfo.alterContent = '';
    }

    function confirmAlter(type, content) {
        if(!content && type != 'accountUrl') {
            App.alertResult(false, '请输入有效资料！');
            return false;
        }
        switch(type) {
            case 'name':
                vue.accountInfo.name = content;
                vue.cancleAlter();
                break;
            case 'intro':
                vue.accountInfo.intro = content;
                vue.cancleAlter();
                break;
            default:
                vue.cancleAlter();
        }
    }

    function chooseAvatar() {
        App.ctrls.imageInput.chooseImage({
            compressed: true,
            success:function (base64Data, size){
                portraitBase64 = base64Data;
                $('#cover-image').attr('src', 'data:image;base64,'+portraitBase64);
            }
        });
    }

    function confirmAvatar() {
        if(!portraitBase64) {
            App.alertResult(false, '请选择新头像');
            return false;
        }
        App.showLoading('上传中...');
        var prefix = 'live_account/'+vue.accountInfo.id;
        App.api('/live_/info/upload_image', {'base64': portraitBase64, 'prefix':prefix}, function (rspData) {
            vue.accountInfo[vue.amendAvatarKey] = rspData;
            portraitBase64 = null;
            App.hideLoading();
            vue.amendAvatarKey = null;
        }, function () {
            App.hideLoading();
            App.alertResult(false, '上传失败');
        })
    }
    function hideAvatarDlg() {
        $('#cover-image').attr('src', '');
        portraitBase64 = null;
        vue.amendAvatarKey = null;
    }

    function submitAlterAccount() {
        var submitData = {
            'id': vue.accountInfo.id,
            'name': vue.accountInfo.name,
            'intro': vue.accountInfo.intro,
            'cover_image': vue.accountInfo.cover_image
        };
        if((!!vue.accountInfo.after_sale_image) && vue.accountInfo.after_sale_image.length > 0){
            submitData.after_sale_image = vue.accountInfo.after_sale_image;
        }
        if((!!vue.accountInfo.pre_sale_image) && vue.accountInfo.pre_sale_image.length > 0){
            submitData.pre_sale_image = vue.accountInfo.pre_sale_image;
        }
        App.showLoading('保存中...');
        App.api('/live_/user/edit_account', submitData, function () {
            App.hideLoading();
            App.alertSuccess('保存成功');
        }, function () {
            App.hideLoading();
            App.alertResult(false, '保存失败！');
        });
    }

    function confirmCreate() {
        console.log('confirmCreate...:', vue.createInfo);
        if(!vue.createInfo.verifyCode){
            App.alertResult(false, '请输入验证码');
            return
        }
        App.api('/live_/user/create_account', {'phone': vue.createInfo.telephone, 'code': vue.createInfo.verifyCode}, function (rspData) {
            window.location.href = '/live/account/home?id='+rspData.id;
        });
    }

    function genVerifyCode() {
        var pattern = /(^0{0,1}1[3|4|5|6|7|8|9][0-9]{9}$)/;
        if(!pattern.test(vue.createInfo.telephone)){
            App.alertResult(false, '请输入正确的手机号');
        }else{
            //发送验证码
            var url = '/user/send_verify_code?phone=' + vue.createInfo.telephone;
            App.api(url, function() {
                App.alertResult(true, '验证码已发送');
                    $('.send-cord-btn').attr('disabled', true).text('已发送');
                    setTimeout(function() {
                        $('.send-cord-btn').removeAttr('disabled').text('获取验证码');
                    }, RESEND_TIME*1000);
            });
        }
    }

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

    function inviteAdmin(e) {
        App.confirm('提示', '即将跳转到邀请直播间管理员页面，在此之前请先保存您对直播间做的修改', function () {
            window.location.href='/live/admin_invite';
        })
    }

    function initPage() {
        App.api('/live_/user/account_admins', function(rspData){
            if(!!rspData.account_data) {
                vue.showMain = 'edit';
                vue.accountInfo = rspData.account_data;
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
                vue.isOwner = rspData.account_data.owner_uid == App.user_id;
            }else {
                vue.showMain = 'create';
            }
        });
    }
})();
