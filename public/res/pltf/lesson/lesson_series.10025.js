App.debug('开始lesson_series.js');
//微信端自动登录
//App.ensureXsrfToken();
if (App.utils.isWeixin()) {
    App.ensureLogin();
}

(function() {
    var seriesId = App.utils.urlParam('id');
    var sellerId = App.utils.urlParam('seller_id');
    var appId = App.utils.urlParam('_app_id');
    var seriesData = {};
    var ordering = false;
    var pageId = 0;
    var voucherId = App.utils.urlParam('voucher_id');
    var isSalelink = App.utils.startsWith(seriesId, 'salelink-');
    var submittingComment = false;

    //自动打开目录
    var tab = '';
    if (location.hash == '#menu')
        tab = 'menu';

    var vue = App.vue({
        data: {
            series: {
                rcmd_series_list: {}
            },
            lessons: {
                items: []
            },
            showCommission: false,
            tab: tab,
            isShowVouchers: false,
            vouchers: {items: [], ready:false},
            currentVoucher: {},
            //selectVoucherIds: [],
            //discountMoney: 0,
            showVouchersBtn: false, //!isSalelink,
            vouchersCount: 0,
            learningList: [],
            introShow: true,
            showToggleBtn: true,
            comment: '',
            comments: {items: []},
            commentModel: false,
            isWekuoApp: App.isWekuoApp(),
            isIAP: false,
            chooseIAP: false,
            updateApp: false,
            vipInfo: {},
            showBuyVip: true,
            withVip: false,
            discounted: false,
            voucherValid: parseInt($('#__voucher_valid').val()),
            secKillData: __secKillData,
            salesSelectType: null,
            SALE_TYPE_SEC_KILL: 1,
            SALE_TYPE_VIP: 2,
            vipBuyPrice: parseFloat($('#__vip_price').val()),
            seriesId: seriesId,
            phoneNumber: '',
            verifyCode: '',
            sendDownNums: 60,
        },
        methods: {
            playLesson: playLesson,
            gotoSellerUrl: gotoSellerUrl,
            buyNow: buyNow,
            showVouchers: showVouchers,
            selectVoucher: selectVoucher,
            savePhone: savePhone,
            closePhoneDialog: closePhoneDialog,
            submitComment: submitComment,
            countOrderPrice: countOrderPrice,
            doOrderPurchaseAction: doOrderPurchaseAction,
            sendVerifyCode: sendVerifyCode,
            bindPhone: bindPhone,
        },
        filters: {
            durationStr: function(duration) {
                return Math.floor(duration / 60) + "'" + duration % 60 + '"';
            },
        },
        created: function () {
            this.$nextTick(function () {
                _countLeftTime();
            })
        }
    });

    if (App.utils.startsWith(seriesId, 'salelink-')) {
        vue.showBuyVip = App.utils.urlParam('show_buy_vip') || false;
    }

    function ensurePublish(callback) {
        if (seriesData.state != 2) {
            App.confirm('警告', '课程尚未发布，只用于预览和审核，不能购买和播放视频！');
            return false;
        }
        if (callback)
            callback();
        return true;
    }

    /* APP购买 */
    function weixinAppPay(buyUrl, finishCallback) {
        App.debug('app支付');
        if (ordering)
            return;
        ordering = true;
        if (!finishCallback)
            finishCallback = finishPurchase;
        App.api(buyUrl + '&trade_type=app', function(rspData) {
            ordering = false;
            App.postMessage({
                event: 'weixin-pay',
                data: rspData,
            });
            waitPaid(rspData.purchase_id, finishCallback);
        });
    }

    /* APP购买 */
    function iapAppPay(buyUrl, seriesId, finishCallback) {
        App.debug('app IAP 支付');
        console.log(buyUrl);
        console.log(seriesId);
        if (ordering)
            return;
        ordering = true;
        if (!finishCallback)
            finishCallback = finishPurchase;
        App.api(buyUrl + '&trade_type=app', function(rspData) {
            ordering = false;
            rspData['series_id'] = seriesId
            App.showLoading('支付进行中 ...');
            setTimeout(function() {
                App.hideLoading();
            },3*60*1000);
            App.postMessage({
                event: 'iap-pay',
                data: rspData,
            });
            //waitPaid(rspData.purchase_id, finishCallback);
        });
    }

    /* 公众号js支付 */
    function weixinJsPay(buyUrl, finishCallback) {
        if(!!appId){
            buyUrl = App.utils.addParam(buyUrl, '_app_id', appId);
        }
        App.debug('weixinJsPay');
        if (!finishCallback)
            finishCallback = finishPurchase;
        if (ordering)
            return;
        ordering = true;
        App.showLoading('下单中...');
        App.api(buyUrl + '&trade_type=jsapi', function(rspData) {
            App.debug('paying');
            App.hideLoading();
            ordering = false;
            var payData = {
                timestamp: rspData.timeStamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
                nonceStr: rspData.nonceStr, // 支付签名随机串，不长于 32 位
                package: rspData.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                signType: rspData.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
                paySign: rspData.sign, // 支付签名
                success: function (res) {
                    finishCallback();
                },
                fail: function(res) {
                    weixinScanPay(buyUrl, finishCallback);
                }
            };
            wx.chooseWXPay(payData);
        }, function () {
            App.hideLoading();
        });
    };

    /* 扫码支付 */
    function weixinScanPay(buyUrl, finishCallback) {
        if(!!appId){
            buyUrl = App.utils.addParam(buyUrl, '_app_id', appId);
        }
        App.debug('weixinScanPay');
        if (!finishCallback)
            finishCallback = finishPurchase;
        if (ordering)
            return;
        ordering = true;
        App.api(buyUrl, function(rspData) {
            App.debug('paying');
            ordering = false;
            $('.purchase_qrcode_img').attr('src', 'data:image/png;base64,' + rspData.qrcode);
            $('.purchase_qrcode_money').html(rspData.money);
            if (App.utils.isPC())
                $('#pay_dialog').modal({backdrop: 'static'}, 'show');
            else
                $('#pay_dialog').show();
            $('.packGiftDia').hide();
            waitPaid(rspData.purchase_id, finishCallback);
        });
    };

    function waitPaid(purchaseId, finishCallback) {
        App.api('/lesson/wait_purchase?purchase_id=' + purchaseId, function(rspData) {
            console.log(rspData);
            if (rspData.finished) {
                finishCallback();

                //完成购买统计
                //if (pageId) {
                //    App.api('log/finish_page_purchase?page_id=' + pageId + '&purchase_id=' + purchaseId, function(rspData) {
                //    });
                //}
            }
            else {
                setTimeout(
                    function() {
                        waitPaid(purchaseId, finishCallback)
                    },
                    1000
                );
            }
        });
    }

    function finishPurchase() {
        seriesData.is_paid = true;
        if (App.utils.isPC())
            $('#pay_dialog').modal('hide');
        else
            $('#pay_dialog').hide();
        App.alertResult(true, '购买成功', function() {
            update();
            //去抽奖
            // App.api('lesson/prize/chance_count', function(rspData) {
            //     if (rspData.result > 0) {
            //         App.confirm('', '恭喜你得到一次抽奖机会！', function() {
            //             location.href = '/lesson/sales_20180104?_source=purchase&mod=lottery';
            //         }, false, '去抽奖');
            //     }
            // });
        });
        $('.buy_dialog').fadeOut(400);


    }
    // 购买 END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    //立即购买
    function buyNow() {
        App.debug('buyNow');
        if(vue.secKillData && vue.secKillData.leftTimeData){
            $('#new-buy-dialog').fadeIn(400);
        }else{
            $('.buy_dialog').fadeIn(400);
        }

        _initVouchers();
    }

    function updateWxLayout() {
        if (App.utils.isPC())
            return;
		$('.dialog_shade').on('click', function(event) {
			$('.buy_dialog').fadeOut(400);
		});
    }

    function goPlay(lesson) {
        function _jumpPage(_url, directJump) {
            if (App.utils.isPC() && !directJump){
                window.open(_url);
            }else{
                location.href = _url;
            }
        }
        if(seriesData.training_id && seriesData.learn_url){
            //训练营是否开放
            App.api('/punch/training/can_join_training', {'training_id': seriesData.training_id}, function (rspData) {
                if(rspData.can){
                    _jumpPage(seriesData.learn_url, true);
                }else {
                    _jumpPage(lesson.home_url, true);
                }
            })
        }else {
            _jumpPage(lesson.home_url);
        }
    }

    function playLesson(lesson) {
        if (!lesson)
            lesson = vue.lessons.items[0];
        if (!ensurePublish())
            return;
        if (!seriesData.is_paid && !lesson.is_free) {
            App.getPrivileges(function(privileges) {
                if (privileges.indexOf('system') > -1 || privileges.indexOf('lesson') > -1)
                    goPlay(lesson);
                else
                    App.alertResult(false, '请先购买');
            });
        }
        else goPlay(lesson);
    }

    //提交订单
    function commitPurchase() {
        if (!ensurePublish())
            return;
        var buyUrl = '/lesson/buy?series_id=' + seriesId;
        if(vue.salesSelectType == vue.SALE_TYPE_SEC_KILL){
            buyUrl = App.utils.addParam(buyUrl, 'sec_kill', '1');
        }
        if (sellerId)
            buyUrl += '&seller_id=' + sellerId;
        if (seriesData.is_vip)
            buyUrl += '&is_vip=1';
        if (pageId)
            buyUrl += '&page_id=' + pageId;
        //if (vue.selectVoucherIds && vue.selectVoucherIds.length > 0)
        //    buyUrl += '&voucher_ids=' + vue.selectVoucherIds.join(',');
        if (vue.currentVoucher && vue.currentVoucher.id)
            buyUrl += '&voucher_ids=' + vue.currentVoucher.id;
        // var moneyText = $('.out-of-pocket').text();
        // if (moneyText && Number && Number.parseFloat) {
        //     var finalMoney = Number.parseFloat(moneyText.match(/[\d\.]+/)[0]);
        //     buyUrl += '&client_money=' + finalMoney;
        // }
        buyUrl += '&client_money=' + countOrderPrice();

        if (vue.withVip) {
            App.api('lesson/vip/buy?trade_type=bind', null, function(rspData) {
                console.log(rspData)
                buyUrl += '&pay_id=' + rspData.purchase_id;
                finishBuyUrl(buyUrl)
            });
        }
        else
            finishBuyUrl(buyUrl)

        function finishBuyUrl() {
            if (App.utils.isWeixin() && App.utils.isMobile())
                weixinJsPay(buyUrl);
            else if (App.isWekuoApp()){
                if (vue.chooseIAP)
                    iapAppPay(buyUrl, seriesId);
                else
                    weixinAppPay(buyUrl);
            }
            else
                weixinScanPay(buyUrl);
        }


    }


    //填写电话号码
    function savePhone() {
        App.debug('保存电话号码');
        var phone = $('#phone_input').val();
        if (!(/^[0-9]{6,11}$/.test(phone))) {
            App.alertResult(false, '请填写电话号码');
            $('#phone_input').trigger('focus');
            return
        }
        else {
            App.api('/user/update', {'no_verify_phone':phone}, function() {
                closePhoneDialog();
            })
        }
    }
    function closePhoneDialog() {
        if (App.utils.isPC())
            $('#paidtel_dialog').modal('hide');
        else
            $('#paidtel_dialog').fadeOut();

        //提醒关注唯库
        if (seriesData.is_paid && !App.isWekuoApp()) {
            App.api('user/check_subscribe?_app_id=' + App.options.lessonAppId, function(rspData) {
                if (! rspData.result) {
                    if (App.utils.isPC()) {
                        $('#follow-wk-dialog').modal('show');
                    }
                    else {
                        $('#follow-wk-dialog').show();
                    }
                }
            });
        }
    }
    
    setTimeout(function() {
        var phone = $('#phone_input').val();
        if (!phone)
            closePhoneDialog();
    }, 10000);

    function doOrderPurchaseAction() {
        // mos单科弹窗处理
        if (seriesId == 74 || seriesId == 73 || seriesId == 72) {
            $('#tip-mos-dialog').show();
        } else {
            App.catchErr(commitPurchase);
        }
    }

    function bindEvents() {
        //购买
        $('.buy_btn').off('click').on('click', function(){
            doOrderPurchaseAction();
        });

        // mos单科弹窗处理
        $('#single-pay').off('click').on('click', commitPurchase);
        $('#ckeck-all-mos').off('click').on('click', function() {
            $('#tip-mos-dialog').hide();
            window.location.href = 'http://www.wekuo.com/l/s/75-90779?_source=singlemos';
        })

        //收藏课程
        $('#favor_btn').on('click', function(e){
            var dataFavor = $(this).attr('data-favor');
            console.log(dataFavor);
            var _url = '/lesson/favorseries';
            if(dataFavor)
                _url = '/lesson/unfavorseries';
            App.api(_url, {'id': seriesId}, function(rspData){
                update();
            });
        });

        // 页面效果
        //$('body').on('click', '.keep_play', function(event) {
        //    $('.fm_catalogue_list .play_btn').eq(0).click();
        //});
        $('.homepage-notice').off('click').on('click', function(e) {
            $('.check-notice-dia').stop().fadeIn(400);
        })
        $('body').on('click', '.dialog-ft-close', function(e) {
            $(this).parents('.dialog').hide();
        });

        //赠送好友
        initGiftEvents();

        //进入社群
        $('.fm-circle-zone').off('click').on('click', function() {
            if (seriesData.is_paid) {
                location.href = seriesData.circle.home_url;
            }
            else {
                App.confirm('', '要先购买才能进入社群哦~', function() {
                    buyNow();
                });
            }

        });

        // 更多推荐课程
        mornLesson();

        $('.in-main').on('click', '.contact-service', function(e) {
            $('.contactSerDia').show();
        });
        $('.contactSerDia .dialog-close').on('click', function(e) {
            $('.contactSerDia').hide();
        })

    }

    function renderSeries() {
        if (seriesData.is_paid && !seriesData.phone) {
            if (App.utils.isPC())
                $('#paidtel_dialog').modal('show');
            else
                $('#paidtel_dialog').fadeIn();
        }

        vue.series = seriesData;
        vue.series.ready = true;
        vue.showCommission = !App.isWekuoApp() && seriesData.commission && seriesData.article_url && (!isSalelink || seriesData.is_paid || App.utils.urlParam('show_commission'));
        //设置标题
        //App.setTitle(seriesData.name);
        //App.render('.sticky_btn', seriesData);
        //App.render('.lesson_feature', seriesData);
        //App.render('.series-sec', seriesData);
        //App.render('.buy_dialog .content', seriesData);
        //App.render('#total-money', seriesData);
        //载入简介
        if (seriesData.intro && App.utils.startsWith(seriesData.intro, 'http://' + App.options.qiniuDomain)) {
            App.http(seriesData.intro, function(rspText) {
                var lazyImageHtml = App.ctrls.lazyImage.processHtml(rspText);
                $('.lesson_about').html(lazyImageHtml);

                var introHeight = $('#intro-content').height() < $('#intro-content-zone').height();
                if(introHeight) {
                    vue.introShow = true;
                    vue.showToggleBtn = true;
                }
            });
        }
        else {
            $('.lesson_about').html(seriesData.intro);
            var introHeight = $('#intro-content').height() < $('#intro-content-zone').height();
            if(introHeight) {
                vue.introShow = true;
                vue.showToggleBtn = true;
            }
        }

        if(vue.series.is_paid) {
            vue.introShow = false;
        }

        // 公告弹窗
        if ( seriesData.notice ) {
            $('.check-notice-dia .notice-main').html(seriesData.notice);
        }

        // 页面显示购买弹窗
        if (location.hash == '#showBuy') {
            buyNow();
        }
    }
    function update()  {
        //显示课程信息
        App.debug('update#');
        App.apiGet('/lesson/series/detail?id=' + seriesId, function(rspData) {
            App.debug('detail#');
            vue.discounted = rspData.discounted;
            seriesData = rspData;
            seriesData.showRcmdSeries = rspData.rcmd_series_list && rspData.rcmd_series_list.items.length > 0 && rspData.rcmd_series_words;
            //renderSeries();
            //App.ensureXsrfToken();

            //秒杀价不要超过渠道价
            if (vue.secKillData && seriesData.price < vue.secKillData.kill_price) {
                vue.secKillData = {};
                vue.salesSelectType = null;
                __secKillData = {};
            }

            //用户信息
            var url = '/lesson/series/user_view_data?id=' + seriesId;
            if (location.pathname.indexOf('/cjkb/') > 0)
                url = '/lesson/cjkb/user_view_data?id=' + seriesId;
            App.api(url, function(rspData2) {
                App.debug('user_view_data# ' + JSON.stringify(rspData2));

                //要求微信登录
                if (App.utils.isWeixin() && rspData2.need_login && App.loginUrl()) {
                    location.href = App.loginUrl()
                }

                for (key in rspData2) {
                    seriesData[key] = rspData2[key];
                    vue.series[key] = rspData2[key];
                }
                if (rspData2.is_vip) {
                    App.api('user/vip_info', function(vipInfo) {
                        vue.vipInfo = vipInfo
                    });
                    vue.showBuyVip = true;
                    vue.salesSelectType = vue.SALE_TYPE_VIP;
                }

                //读心术->训练营专价
	            if (seriesData.id == 80 && !seriesData.is_paid && seriesId != 'salelink-117251') {
    	            App.api('lesson/is_paid?series_id=66', function(rspData) {
    	                if (rspData.result) {
    	                    location.href = '/l/s/80-117251?show_commission=1';
    	                }
    	            });
	            }

                ensurePublish();
                renderSeries();
                updateComments();

                if (window.location.hash.substr(1) == 'buy')
                    _initVouchers();

                //学习列表
                if (rspData2.is_paid && !vue.learningList.length) {
                    App.api('lesson/series/learning_list?id=' + seriesId, function(rspData) {
                        vue.learningList = rspData.result;
                    });
                }

                //初始化购买统计
                if (!vue.series.is_paid && !pageId) {
                    App.api('log/init_page_purchase?object_type=1&object_id=' + seriesId, function(rspData) {
                        pageId = rspData.page_id;
                    });
                }

                //电话号码
                vue.phoneNumber = rspData2.phone || rspData2.no_verify_phone;

                setTimeout(bindEvents, 100);
                setTimeout(updateWxLayout, 100);

                //设置分享到朋友圈
                if (App.utils.isWeixin()) {
                    wx.ready(function(){
                        var shareOptions = {
                            title: seriesData.name,
                            link: location.href,
                            imgUrl: seriesData.cover_image,
                            desc: seriesData.summary,
                        };
                        wx.onMenuShareTimeline(shareOptions);
                        wx.onMenuShareAppMessage(shareOptions);
                    });
                }
                App.debug('user_view_data# DONE');
            });

            //获取课时列表
            App.apiGet('lesson/series/lessons?series_id=' + seriesData.id, function(rspData) {
                vue.lessons = rspData;
            });

            //使用优惠券
            if (voucherId)
                _initVouchers();
        }, null, {enableCache: true});
    }
    update();

    // 软文分销直接显示支付弹窗
    function checkSellBuy() {
        if (App.utils.isPC())
            return;
        var isBuy, isPaid;
        window.location.hash.substr(1) == 'buy' ? isBuy = true : isBuy = false;
        if (isBuy) {
            //App.ensureXsrfToken();
            //_initVouchers(true);
            App.api('/lesson/is_paid?series_id=' + seriesId, function(rspData) {
                isPaid = !rspData.result;
                if (isBuy && isPaid) {
                    $('.buy_dialog').show();
                }
            })
        };
    }
    checkSellBuy();

    // 更多推荐课程
    function mornLesson() {
        var url = '/lesson/recommend_series';
        App.api(url, function (rspData) {
            for (var i = rspData.items.length - 1; i >= 0; i--) {
                if (rspData.items[i].id == seriesId) {
                    rspData.items.splice(i,1);
                }
            }
            //App.render('#series-remd-lesson', rspData);
        }, null, {enableCache:true})
    }

    // 赠送好友 BEGIN ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function initGiftEvents() {
        $('#show-gift-btn').on('click', function(e){
            $('.packGiftDia').stop().fadeIn(400);
        });
        $('.dialog-bg').on('click', function(e){
            $(this).parents('.dialog').hide();
        });

        $('#add-count-btn').off('click').on('click', function (e) {
            var countSelector = '.income .income-number';
            var preNum = parseInt($(countSelector).val());
            var curNum = Math.max(0, preNum+1);
            if( curNum > 99999 )
                curNum = 99999;
            $(countSelector).val(curNum);
            var totalMoney = curNum*seriesData.price;
            $('#total-money').text('￥ '+totalMoney.toFixed(2));
            checkBuyCount(curNum);
        });
        $('#sub-count-btn').off('click').on('click', function (e) {
            var countSelector = '.income .income-number';
            var preNum = parseInt($(countSelector).val());
            var curNum = Math.max(0, preNum-1);
            var totalMoney = curNum*seriesData.price;
            $('#total-money').text('￥ '+totalMoney.toFixed(2));
            $(countSelector).val(curNum);
            checkBuyCount(curNum);
        });
        $('#toll-number').off('input propertychange').on('input propertychange', function(e){
            var countSelector = '.income .income-number';
            var buyCount = parseInt($(countSelector).val());
            var textLength = $(countSelector).val().length;
            checkBuyCount(buyCount);
            if(buyCount > 99999) {
                buyCount = 99999;
                $(countSelector).val(buyCount);
            }
            else if (!buyCount) {
                buyCount = 0;
                $(countSelector).val(buyCount);
            }
            $(this).css('width', (textLength + 1) * 11 + 'px' );
            var curNum = Math.max(0, buyCount);
            var totalMoney = curNum*seriesData.price;
            $('#total-money').text('￥ '+totalMoney.toFixed(2));
        });
        $('#buy-gift-btn').off('click').on('click', function (e) {
            $('#buy-gift-btn').attr('disabled', true);
            var buyCount = $('.income .income-number').val();
            var totalMoney = Number.parseFloat($('#total-money').text().match(/[\d\.]+/)[0]);
            var buyUrl = 'lesson/buy?series_id=' + seriesId + '&object_type=ticket_collection&count=' + buyCount + '&client_money=' + totalMoney;
            setTimeout(function() {
                $('#buy-gift-btn').removeAttr('disabled');
            }, 1000);
            function callback() {
                if (App.utils.isPC())
                    $('#pay_dialog').modal('hide');
                else
                    $('#pay_dialog').hide();
                App.alertResult(true, '购买成功', update);
                $('.buy_dialog').fadeOut(400);
                $('#buy_ticket').hide();
                $('body').removeClass('show-modal');

                $('.packGiftDia').hide();
                $('.checkPackGiftDia').show();
            }

            if (App.utils.isWeixin() && App.utils.isMobile())
                weixinJsPay(buyUrl, callback);
            else
                weixinScanPay(buyUrl, callback);
        });
        function checkBuyCount(num) {
            if (num == 1) {
                $('.rwdlgifts-btns li').removeClass('on');
                $('.rwdlgifts-btns a[data-value="1"]').parent('li').addClass('on');
            }
            else if (num == 2) {
                $('.rwdlgifts-btns li').removeClass('on');
                $('.rwdlgifts-btns a[data-value="2"]').parent('li').addClass('on');
            }
            else if (num == 5) {
                $('.rwdlgifts-btns li').removeClass('on');
                $('.rwdlgifts-btns a[data-value="5"]').parent('li').addClass('on');
            }
            else if (num == 10) {
                $('.rwdlgifts-btns li').removeClass('on');
                $('.rwdlgifts-btns a[data-value="10"]').parent('li').addClass('on');
            }
            else if (num == 20) {
                $('.rwdlgifts-btns li').removeClass('on');
                $('.rwdlgifts-btns a[data-value="20"]').parent('li').addClass('on');
            }
            else if (num == 50) {
                $('.rwdlgifts-btns li').removeClass('on');
                $('.rwdlgifts-btns a[data-value="50"]').parent('li').addClass('on');
            }
            else {
                $('.rwdlgifts-btns li').removeClass('on');
            }
        }
        giveGiftsDia();
    }

    function giveGiftsDia() {
        $('#total-money').text('￥ '+ (2*seriesData.price.toFixed(2)) );
        $('#rwdl-gifts-nums li a').off('click').on('click' ,function(e) {
            e.preventDefault();
            $(this).parent('li').addClass('on').siblings('li').removeClass('on');
            var countSelector = '.income .income-number';
            var curNum = $(this).attr('data-value');
            $(countSelector).val(curNum);
            // console.log(curNum);
            var totalMoney = curNum*seriesData.price;
            $('#total-money').text('￥ '+totalMoney.toFixed(2));
        })
    }

    //课程分销
    function gotoSellerUrl() {
        if (vue.series.friend_discount) {
            window.location.href = 'http://' + __sellerDomain + '/lesson/sale?series_id=' + vue.series.id + '&_source=lesson_series';
        } else {
            App.api('/lesson/sale_url?series_id=' + seriesId, function(rspData) {
                window.location.href = rspData.article_url;
            }); 
        }
        
    }

    //显示优惠券
    function showVouchers() {
        _initVouchers();
        vue.isShowVouchers = true;
    }

    // 初始化优惠券信息
    function _initVouchers(forceShow) {
        //if (isSalelink) {
        //    vue.vouchers.ready = true;
        //    return;
        //}
        if (!vue.vouchers.ready && !vue.discounted && vue.voucherValid && (vue.series.enable_voucher || forceShow)) {
            App.api('lesson/voucher/query?valid=1&series_id=' + seriesId, function(rspData) {
                vue.vouchers = rspData;
                vue.vouchersCount = rspData.count;
                vue.vouchers.ready = true;
                vue.showVouchersBtn = rspData.items.length > 0;
                //if (voucherId) {
                    $(rspData.items).each(function(i, voucher) {
                        //if (voucher.id == voucherId)
                        selectVoucher(voucher);
                    });
                //}
            });
        }
    }

    //选择优惠券
    function selectVoucher(voucher) {
        if ((!voucher) || vue.currentVoucher.id == voucher.id) {
            vue.currentVoucher = {};
        }else {
            vue.currentVoucher = voucher;
            //vue.selectVoucherIds.push(voucher.id);
            //vue.discountMoney += voucher.discount_money;
            //vue.selectVoucherIds = [voucher.id];
            //if (voucher.discount_money > 0)
            //    vue.discountMoney = voucher.discount_money;
            //else if (voucher.discount_ratio)
            //    vue.discountRatio = voucher.discount_ratio;
        }
        //console.log(vue.selectVoucherIds);
    }
    // 赠送好友结束 END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    //限时优惠倒计时
    var secKillTimeout = null;
    function _countLeftTime() {
        if(!vue.secKillData){
            return
        }
        if(SecKillCountTools){
            Vue.set(vue.secKillData, 'leftTimeData', SecKillCountTools.leftTimeStr(vue.secKillData.finish_time));
        }else {
            console.log('not SecKillCountTools');
        }
        if (!!secKillTimeout){
            window.clearTimeout(secKillTimeout);
        }
        secKillTimeout = setTimeout(_countLeftTime, 100);
        if(vue.secKillData && vue.secKillData.leftTimeData && vue.salesSelectType == null){
            vue.salesSelectType = vue.SALE_TYPE_SEC_KILL;
        }
    }
    function countOrderPrice() {
        if(!vue){
            return
        }
        if(vue.salesSelectType == vue.SALE_TYPE_SEC_KILL){
            // 限时秒杀
            return vue.secKillData.kill_price;
        }else if(vue.discounted){
            // <!-- 特价 -->
            return vue.series.price
        }else if(vue.vipInfo.id && !vue.series.is_seller && vue.series.vip_price && vue.currentVoucher.discount_ratio){
            // <!-- vip、折扣券 -->
            return Math.floor(vue.series.vip_price * vue.currentVoucher.discount_ratio);
        }else if(vue.vipInfo.id && !vue.series.is_seller && vue.series.vip_price){
            // <!-- vip -->
            return vue.series.vip_price - (vue.currentVoucher.discount_money || 0);
        }else if(vue.withVip && vue.currentVoucher.discount_ratio){
            // <!-- 课程 + vip + 折扣券 -->
            return vue.vipBuyPrice + Math.floor(vue.series.vip_price * vue.currentVoucher.discount_ratio);
        }else if(vue.withVip){
            // <!-- 课程 + vip + 现金券 -->
            return vue.vipBuyPrice + vue.series.vip_price - (vue.currentVoucher.discount_money || 0);
        }else if(vue.currentVoucher.discount_ratio){
            // <!-- 折扣券 -->
            return Math.floor(vue.series.price * vue.currentVoucher.discount_ratio);
        }else{
            // <!-- 其他 -->
            return vue.series.price - (vue.currentVoucher.discount_money || 0);
        }
    }

    //发表评论
    function submitComment() {
        if (submittingComment)
            return;
        submittingComment = true;
        App.api('lesson/comment/add?series_id=' + seriesId, {content: vue.comment}, function(rspData) {
            submittingComment = false;
            vue.comment = '';
            App.alertResult(true, '已发表');
            //updateComments(true);
            vue.commentModel = false;
        })
    }

    //显示评论
    function updateComments(refresh) {
        var url = 'lesson/comment/nopaid_query';
        var options = {refresh: refresh, method:'GET'};
        if (vue.series.is_paid)
            url = 'lesson/comment/query';
        url += '?series_id=' + vue.series.id;
        if (App.utils.isPC()) {
            App.api(url, function(rspData) {
                vue.comments = rspData;
            })
        }
        else {
            App.ctrls.scrollLoader.start({
                url: url,
                loading: '#loading-comments',
                handler: function(rspData) {
                    if(rspData && rspData.items.length) {
                        vue.comments.items = vue.comments.items.concat(rspData.items);
                    }
                }
            });
        }
    }


	function checkIAP(){
        App.api('lesson/check_IAP', function(rspData) {
			if (App.utils.isIos() && vue.isWekuoApp && rspData.status){
				vue.isIAP = true;
				vue.chooseIAP = true;
            }
		});
	}
	checkIAP();

	//提醒安卓 app 1.0用户升级
	if (App.utils.isAndroid() && navigator.userAgent.indexOf(' Wekuo/1.0') > 0) {
        vue.updateApp = true;
	}

	//发送手机验证码
	function sendVerifyCode() {
        var sendClock = null;
        if(vue.sendDownNums < 60) {
            return
        }
	    App.api('user/send_verify_code?phone=' + vue.phoneNumber, function(rspData) {
	        App.alertResult(true, '发送成功');
            sendClock = setInterval(doLoop, 1000);
	    });
        function doLoop(){
            vue.sendDownNums--;
            if(vue.sendDownNums <= 0){
                clearInterval(sendClock); //清除js定时器
                vue.sendDownNums = 60; //重置时间
            }
        }
	}

    //绑定手机号码
	function bindPhone() {
	    var url = 'user/bind_phone?phone=' + encodeURIComponent(vue.phoneNumber) + '&code=' + encodeURIComponent(vue.verifyCode);
	    App.api(url, function(rspData) {
	        App.alertResult(true, '绑定成功');
	        closePhoneDialog();
	    });
	}


})();
App.debug('完成lesson_series.js');
