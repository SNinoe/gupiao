/**
 * Created by huanghongwei on 2017/7/3.
 */
(function() {
    var serverCardOptions = [];
    var cardOptions = {
        0: {
            headY: 337,
            headRadius: 55,
            headBorder: 8,
            headBorderStyle: '#fff',

            nameY: 500,
            nameLineHeight: 36,
            nameStyle: '#fff',
            nameFont: 'normal 26px "Noto Sans CJK SC","Source Han Sans CN"',

            titleY: 650,
            titleLineHeight: 64,
            titleMaxWidth: 560,
            titleStyle: '#fffae2',
            titleFont: 'bold 40px "Noto Sans CJK SC","Source Han Sans CN"',

            teacherY: 835,
            teacherStyle: '#fffae2',
            teacherFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            startY: 1250,
            startStyle: '#fff',
            startFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            codeY: 1005,
            codeX: 177,
            codeWidth: 166,
        },
        1: {
            headY: 150,
            headRadius: 55,
            headBorder: 8,
            headBorderStyle: '#cd2b3c',

            nameY: 310,
            nameLineHeight: 36,
            nameStyle: '#404040',
            nameFont: 'normal 26px "Noto Sans CJK SC","Source Han Sans CN"',

            titleY: 472,
            titleLineHeight: 64,
            titleMaxWidth: 560,
            titleStyle: '#cd2b3c',
            titleFont: 'bold 40px "Noto Sans CJK SC","Source Han Sans CN"',

            teacherY: 660,
            teacherStyle: '#d0434e',
            teacherFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            startY: 395,
            startStyle: '#404040',
            startFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            codeY: 705,
            codeX: 177,
            codeWidth: 166,
        },
        2: {
            headY: 236,
            headRadius: 55,
            headBorder: 8,
            headBorderStyle: '#fff',

            nameY: 392,
            nameLineHeight: 36,
            nameStyle: '#404040',
            nameFont: 'normal 26px "Noto Sans CJK SC","Source Han Sans CN"',

            titleY: 530,
            titleLineHeight: 64,
            titleMaxWidth: 560,
            titleStyle: '#fff',
            titleFont: 'bold 40px "Noto Sans CJK SC","Source Han Sans CN"',

            teacherY: 1027,
            teacherStyle: '#9f2e28',
            teacherFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            startY: 1257,
            startStyle: '#fff',
            startFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            codeY: 1055,
            codeX: 175,
            codeWidth: 166,
        },
        3: {
            headY: 30,
            headRadius: 55,
            headBorder: 8,
            headBorderStyle: 'white',

            nameY: 180,
            nameLineHeight: 36,
            nameStyle: '#404040',
            nameFont: 'normal 26px "Noto Sans CJK SC","Source Han Sans CN"',

            titleY: 350,
            titleLineHeight: 64,
            titleMaxWidth: 560,
            titleStyle: '#bd4e55',
            titleFont: 'bold 40px "Noto Sans CJK SC","Source Han Sans CN"',

            teacherY: 560,
            teacherStyle: '#f1938b',
            teacherFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            startY: 862,
            startStyle: '#f1938b',
            startFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            codeY: 575,
            codeWidth: 210,
        },
        4: {
            headY: 253,
            headRadius: 55,
            headBorder: 8,
            headBorderStyle: 'white',

            nameY: 402,
            nameLineHeight: 36,
            nameStyle: '#404040',
            nameFont: 'normal 26px "Noto Sans CJK SC","Source Han Sans CN"',

            titleY: 681,
            titleLineHeight: 64,
            titleMaxWidth: 560,
            titleStyle: '#bd4e55',
            titleFont: 'bold 40px "Noto Sans CJK SC","Source Han Sans CN"',

            teacherY: 869,
            teacherStyle: '#f1938b',
            teacherFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            startY: 1220,
            startStyle: '#f1938b',
            startFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            codeY: 931,
            codeWidth: 210,
        },
        5: {
            headY: 300,
            headRadius: 55,
            headBorder: 8,
            headBorderStyle: 'white',

            nameY: 470,
            nameLineHeight: 36,
            nameStyle: '#404040',
            nameFont: 'normal 26px "Noto Sans CJK SC","Source Han Sans CN"',

            titleY: 680,
            titleLineHeight: 64,
            titleMaxWidth: 560,
            titleStyle: '#bd4e55',
            titleFont: 'bold 40px "Noto Sans CJK SC","Source Han Sans CN"',

            teacherY: 890,
            teacherStyle: '#f1938b',
            teacherFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            startY: 1225,
            startStyle: '#f1938b',
            startFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            codeY: 924,
            codeWidth: 210,
        },
        6: {
            headY: 345,
            headRadius: 55,
            headBorder: 8,
            headBorderStyle: 'white',

            nameY: 515,
            nameLineHeight: 36,
            nameStyle: '#492326',
            nameFont: 'normal 26px "Noto Sans CJK SC","Source Han Sans CN"',

            titleY: 700,
            titleLineHeight: 64,
            titleMaxWidth: 560,
            titleStyle: '#162042',
            titleFont: 'bold 40px "Noto Sans CJK SC","Source Han Sans CN"',

            teacherY: 892,
            teacherStyle: '#fff',
            teacherFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            startY: 950,
            startStyle: '#fff',
            startFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            codeY: 1100,
            codeWidth: 210,
        },
        7: {
            headY: 410,
            headRadius: 55,
            headBorder: 8,
            headBorderStyle: 'white',

            nameY: 576,
            nameLineHeight: 36,
            nameStyle: '#999',
            nameFont: 'normal 26px "Noto Sans CJK SC","Source Han Sans CN"',

            titleY: 784,
            titleLineHeight: 64,
            titleMaxWidth: 560,
            titleStyle: '#fdf004',
            titleFont: 'bold 40px "Noto Sans CJK SC","Source Han Sans CN"',

            teacherY: 973,
            teacherStyle: '#fff',
            teacherFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            startY: 1280,
            startStyle: '#fff',
            startFont: 'normal 30px "Noto Sans CJK SC","Source Han Sans CN"',

            codeY: 1010,
            codeWidth: 210,
        },
    };

    function genStartTimeStr(startTime) {
        var startDate = new Date(startTime.replace(/-/g, '/'));
        var result = ''+(startDate.getMonth()+1)+'月'+startDate.getDate()+'日';
        var weekDay = startDate.getDay();
        var weekStr = null;
        switch(weekDay)
        {
        case 0:weekStr="周日";break;
        case 1:weekStr="周一";break;
        case 2:weekStr="周二";break;
        case 3:weekStr="周三";break;
        case 4:weekStr="周四";break;
        case 5:weekStr="周五";break;
        case 6:weekStr="周六";break;
        default:weekStr=null
        }
        if (!!weekStr){
            result = result + '（' + weekStr + '）'
        }
        result = result + startDate.getHours() + ':' + startDate.getMinutes();
        result = result + '准时开课';
        return result;
    }

    function makeCard(bgNumber) {
        if(serverCardOptions.length > bgNumber){
            return makeServerCard(serverCardOptions[bgNumber]);
        }else {
            return makeLocalCard(bgNumber-serverCardOptions.length);
        }
    }
    function makeServerCard(option) {
        App.debug('makeServerCard');
        var inviteImage = new Image();
		inviteImage.setAttribute('crossOrigin', 'anonymous');
		inviteImage.src = option.card_bg;
		inviteImage.onload = function () {
			var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
			canvas.width = inviteImage.width;
            canvas.height = inviteImage.height;
            context.drawImage(inviteImage, 0, 0, inviteImage.width, inviteImage.height);

			//分享者昵称
			context.fillStyle = option.user_name_color;
            context.font = 'normal 26px "Noto Sans CJK SC","Source Han Sans CN"';
            context.textAlign = 'center';
            context.fillText(App.data.user.nickname, parseFloat(option.user_name_x), parseFloat(option.user_name_y));

			//分享者头像
			var portraitY = parseFloat(option.portrait_y);
			var portraitX = parseFloat(option.portrait_x);
			var portraitWidth = parseFloat(option.portrait_width);
			var portraitRadius = portraitWidth*0.5;
			var portraitBorder = 6;
            context.arc(portraitX, portraitY, portraitRadius+portraitBorder, 0, 2*Math.PI);
            context.fillStyle = 'white';
            context.fill();
            var headImg = new Image();
            headImg.setAttribute('crossOrigin', 'anonymous');
            headImg.src = App.data.user.portrait;
            headImg.onload = function () {
                context.save();
                context.beginPath();
                context.arc(portraitX, portraitY, portraitRadius, 0, 2*Math.PI);
                context.clip();
                context.drawImage(headImg, portraitX-portraitRadius, portraitY-portraitRadius, portraitRadius*2, portraitRadius*2);
                context.restore();

				var codeWidth = parseFloat(option.code_width);
				var codeX = parseFloat(option.code_x);
				var codeY = parseFloat(option.code_y);
                var codeImg = new Image();
                if(App.utils.startsWith(vue.qrCodeUrl, 'http')){
                    codeImg.setAttribute('crossOrigin', 'anonymous');
                }
				codeImg.src = vue.qrCodeUrl;
                // App.debug('temp:'+vue.qrCodeUrl);
				codeImg.onload = function () {
					context.drawImage(codeImg, codeX-0.5*codeWidth, codeY-0.5*codeWidth, codeWidth, codeWidth);
					var base64 = canvas.toDataURL('image/jpeg', 0.9);
                    $('#review-img').attr('src', base64);
                    $('#review-img-wrap').attr('href', base64).show();
				};
            };
		};
    }
    function makeLocalCard(bgNumber) {
        App.debug('makeLocalCard:'+bgNumber);
        var option = cardOptions[bgNumber];

        var name = App.data.user.nickname;
        var nameDesc = '向你推荐一个很棒的课程';
        var title = vue.objectInfo.name;
        var teacherName = vue.objectInfo.teacher_name;
        var startDesc = vue.objectInfo.start_time ? genStartTimeStr(vue.objectInfo.start_time) : '『有讲』好课推荐，你也快来听吧~';

        var cardImage = new Image();
        cardImage.setAttribute('crossOrigin', 'anonymous');
        cardImage.src = $('#bg-img-'+bgNumber).attr('src');
        cardImage.onload = function () {
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = cardImage.width;
            canvas.height = cardImage.height;
            context.drawImage(cardImage, 0, 0, cardImage.width, cardImage.height);

            //名称相关
            context.fillStyle = option.nameStyle;
            context.font = option.nameFont;
            context.textAlign = 'center';
            context.fillText(name, canvas.width*0.5, option.nameY);
            context.fillText(nameDesc, canvas.width*0.5, option.nameY+option.nameLineHeight);

            //标题相关
            context.fillStyle = option.titleStyle;
            context.font = option.titleFont;
            context.textAlign = 'center';

            while (context.measureText(title).width > 2*option.titleMaxWidth){
                if (title.slice(-3) == '...'){
                    title = title.slice(0, -4) + '...';
                }else {
                    title = title.substring(0, title.length-1) + '...';
                }
            }
            if(context.measureText(title).width > option.titleMaxWidth){
                var index = parseInt(title.length*0.5);
                title1 = title.substring(0, index);
                title2 = title.substring(index, title.length);
                context.fillText(title1, canvas.width*0.5, option.titleY);
                context.fillText(title2, canvas.width*0.5, option.titleY+option.titleLineHeight);
            }else {
                context.fillText(title, canvas.width*0.5, option.titleY+0.5*option.titleLineHeight);
            }

            if(!!teacherName){
                context.fillStyle = option.teacherStyle;
                context.font = option.teacherFont;
                context.textAlign = 'center';
                context.fillText('分享嘉宾：'+teacherName, canvas.width*0.5, option.teacherY);
            }

            if(!!startDesc){
                context.fillStyle = option.startStyle;
                context.font = option.startFont;
                context.textAlign = 'center';
                context.fillText(startDesc, canvas.width*0.5, option.startY);
            }

            //分享者头像
            context.arc(0.5*cardImage.width, option.headY+option.headRadius, option.headRadius+option.headBorder, 0, 2*Math.PI);
            context.fillStyle = option.headBorderStyle;
            context.fill();
            //var headImg = document.getElementById("head-img");
            var headImg = new Image();
            headImg.setAttribute('crossOrigin', 'anonymous');
            headImg.src = App.data.user.portrait;
            headImg.onload = function () {
                context.save();
                context.beginPath();
                context.arc(0.5*cardImage.width, option.headY+option.headRadius, option.headRadius, 0, 2*Math.PI);
                context.clip();
                context.drawImage(headImg, 0.5*cardImage.width-option.headRadius, option.headY, option.headRadius*2, option.headRadius*2);
                context.restore();

                var codeImg = new Image();
                if(App.utils.startsWith(vue.qrCodeUrl, 'http')){
                    codeImg.setAttribute('crossOrigin', 'anonymous');
                }
                codeImg.src = vue.qrCodeUrl;
                codeImg.onload = function () {
                    var codeX = option && option.codeX ? option.codeX : 0.5*(cardImage.width-option.codeWidth);
                    context.drawImage(codeImg, codeX, option.codeY, option.codeWidth, option.codeWidth);

                    var base64 = canvas.toDataURL('image/jpeg', 0.9);
                    $('#review-img').attr('src', base64);
                    $('#review-img-wrap').attr('href', base64).show();
                };
            };
        };
    }

    //----------------------------------------------------------------------------//
    function genQrCodeUrl(saleUrl, callback) {
        $("#url-qr-code").html('');
        $("#url-qr-code").qrcode({
            render: "canvas",
            width: 190,
            height: 190,
            text: saleUrl
        });
        var codeCanvas = $('#url-qr-code canvas')[0];
        var codeSrc = codeCanvas.toDataURL('image/jpeg', 1);

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        context.fillStyle = '#FFF';
        context.fillRect(0, 0, 200, 200);
        var codeImg = new Image();
        codeImg.src = codeSrc;
        codeImg.onload = function () {
            context.drawImage(codeImg, 10, 10, 180, 180);
            var src = canvas.toDataURL('image/jpeg', 1);
            callback(src);
        }
    }
    
    function initMakeCard() {
        var objectId = App.utils.urlParam('obj_id');
        var objectType = App.utils.urlParam('obj_type');

        if(!objectId){
            objectId = btoa('live_sale-'+App.utils.urlParam('live_id'));
            objectType = btoa('live_sale-10');
        }

        var saleUrl = '/live_/sale/gen_user_sale?obj_type='+objectType+'&obj_id='+objectId;
        App.api(saleUrl, function (rspData) {
            if(!!rspData.code_url){
                vue.qrCodeUrl = rspData.code_url;
            }else {
                vue.saleUrl = rspData.sale_url;
                vue.$nextTick(initClipboard);
                genQrCodeUrl(rspData.sale_url, function (src) {
                    vue.qrCodeUrl = src;
                });
            }
            var infoUrl = '/live_/sale/object_info?obj_type='+objectType+'&obj_id='+objectId;
            App.api(infoUrl, function(objectData){
                vue.objectInfo = objectData;
                $('#local-card-icons input').each(function (e) {
                    vue.cardIcons.push($(this).val());
                });
                var saleCardsUrl = '/live_/sale/user_sale_cards?obj_type='+objectType+'&obj_id='+objectId+'&limit=15';
                App.api(saleCardsUrl, function (rspData) {
                    serverCardOptions = rspData.items;
                    if(serverCardOptions.length > 0){
                        for(var i=serverCardOptions.length; i > 0; i--){
                            vue.cardIcons.splice(0, 0, serverCardOptions[i-1].card_bg);
                        }
                        vue.currentIndex = parseInt(serverCardOptions.length*Math.random());
                    }
                    vue.$nextTick(function () {
                        makeCard(vue.currentIndex);
                        initBscroll();
                    });
                });
                _initJsSdk();
            });
        });
    }

    function initBscroll() {
        var listScroll = new BScroll(vue.$refs.cardListWrapper, {
            scrollX: true,
            scrollY: false,
            click: true
        });
        var listItems = vue.$refs.cardListWrapper.getElementsByClassName('item');
        var lastItem = listItems[(listItems.length - 1)];
        var firstItem = listItems[vue.currentIndex-1];
        listScroll.scrollToElement(lastItem, 500);
        setTimeout(function() {
            listScroll.scrollToElement(firstItem, 500);
        }, 1500);
    }

    function initClipboard() {
        var clipboard = new Clipboard('#copy-url-btn');

        clipboard.on('success', function(e) {
            console.log(e);
            App.alertSuccess("已复制到剪切板");
        });
    }

    function selectCard(index, event) {
        if(!event._constructed) {
            return false;
        }
        vue.currentIndex = index;
        makeCard(index);
    }

    function _initJsSdk() {
        if(!!App.ctrls.wxJssdk){
            App.ctrls.wxJssdk.initJssdk(3, [], null, {
                title: vue.objectInfo.name, // 分享标题
                desc: '学习是最好的投资，'+App.data.user.nickname+'邀请你一起来『有讲』学习~', // 分享描述
                imgUrl: vue.objectInfo.cover_image,
                link: vue.saleUrl
            });
        }
    }

    var vue = null;
    $(document).ready(function () {
        vue = App.vue({
            el: '#app',
            data: {
                hintModel: false,
                qrCodeUrl: '',
                objectInfo: {},
                shareQrModel: false,
                currentIndex: parseInt(5*Math.random()),
                cardIcons: [],
                saleUrl: ''
            },
            created: function() {
                this.$nextTick(function() {
                    initMakeCard();
                })
            },
            methods: {
                selectCard: selectCard
            }
        });
    });

})();
