/* 页面初始化 */
(function() {
    var hideNavbarTimeout = null;

    $(window).scroll(function(){
        if (App.utils.isAtBottom())
            $(window).trigger("_scroll_bottom");
        if (App.utils.isAtTop())
            $(window).trigger("_scroll_top");

        //滑动时显示导航栏
        /*
        $('#navbar').fadeIn();
        $('#navbar_placeholder').show();
        if (hideNavbarTimeout)
            clearTimeout(hideNavbarTimeout);
        hideNavbarTimeout = setTimeout(function() {
            $('#navbar').fadeOut();
            $('#navbar_placeholder').hide();
        }, 1000);
        */
    });

    $(function(){
        $.ajaxSetup({
            error: function(jqXHR, exception) {
                console.log(jqXHR);
                console.log(exception);
                App.confirm('程序出错了', jqXHR.status + " - " + jqXHR.statusText);
            }
        });
    });

    if (typeof Mustache !== 'undefined')
        Mustache.tags = ['[[', ']]'];
    //setTimeout(function() {
    //    $('#navbar').show();
    //}, 500);

    //ScrollLoader.reset();
})();

var App = (function() {
    function center(elem) {
        var $elem = elem;
        if (typeof(elem) == 'string')
            $elem = $(elem);
        $elem.css("position","fixed");
        $elem.css("left", (($(window).width() - $elem.outerWidth()) / 2) + "px");
        $elem.css("top", (($(window).height() - $elem.outerHeight()) / 2) + "px");
        //$elem.show();
        return $elem;
    };

    var rem = 18;
    var tplBackups = {};
    var ctrls = {};
    var data = {};
    var options = {};
    var cache = {};
    var privileges = null;
    var privilegeListeners = [];
    var utils = {
        short_date: function(date) {
            return date.substr(5, 11);
        },
        urlParam: function(name, url) {
            if (!url && App){
                if(App.uri){
                    url = App.uri;
                }else{
                    url = App.data.uri;
                }
            }
            if (!url)
                url = window.location.href;
            var regx = new RegExp('[\?&]' + name + '=([^&#]*)');
    	    var results = regx.exec(url);
    	    if (!results && data && data.uri)
    	        results = regx.exec(data.uri);
    	    if (results)
	            return decodeURIComponent(results[1]);
        },
        addParam: function(url, name, value) {
            if (url.indexOf('&' + name + '=') > 0)
                return url;
            if (url.indexOf('?' + name + '=') > 0)
                return url;
            if (url.indexOf('?') == -1)
                return url + '?' + name + '=' + encodeURIComponent(value);
            return url + '&' + name + '=' + encodeURIComponent(value);
        },
        isAtBottom: function() {
            var totalHeight = parseFloat($(window).height()) + parseFloat($(window).scrollTop());
            return $(document).height() <= totalHeight;
        },
        isAtTop: function() {
            return window.scrollY == 0;
        },
        isWeixin: function() {
            return navigator.userAgent.indexOf('MicroMessenger') >= 0;
        },
        isMobile: function() {
            var clientTexts = ['iPhone', 'iPad', 'Android', 'Mobile'];
            for (var i = 0; i < clientTexts.length; i ++) {
                if (navigator.userAgent.indexOf(clientTexts[i]) >= 0)
                    return true;
            }
            return false;
        },
        isIos: function() {
            var clientTexts = ['iPhone', 'iPad'];
            for (var i = 0; i < clientTexts.length; i ++) {
                if (navigator.userAgent.indexOf(clientTexts[i]) >= 0)
                    return true;
            }
            return false;
        },
        isIosApp: function() {
            if (utils.isIos() && navigator.userAgent.indexOf('CdbApp')>0)
                return true;
            return false;
        },
        isPC: function() {
            return !utils.isMobile();
        },
        isAndroid: function() {
            return navigator.userAgent.indexOf('Android') > 0;
        },
        isAndroidApp: function() {
            return typeof AndroidNative !== 'undefined';
        },
        buildUrl: function(url, args) {
            var result = url;
            for (var key in args) {
                var value = args[key];
                if (result.indexOf('?') == -1)
                    result += '?' + key + '=' + encodeURIComponent(value);
                else
                    result += '&' + key + '=' + encodeURIComponent(value);
            }
            return result;
        },
        addScript: function(src) {
            var script=document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.charset = 'utf-8';
            document.body.appendChild(script);
        },
        getCookie: function(name) {
            var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
            if (arr != null)
                return unescape(arr[2]);
            return null;

        },
        startsWith: function(str, text) {
            return str.substr(0, text.length) == text;
        },
        qiniuUrl: function(filePath) {
            if (filePath.substr(0, 1) != '/')
                filePath = '/' + filePath;
            //filePath = encodeURIComponent(filePath).replace(/%2F/g, '/');
            return 'http://' + App.options.qiniuDomain + filePath;
        },
        ossUrl: function (filePath) {
            if (filePath.substr(0, 1) != '/')
                filePath = '/' + filePath;
            return 'http://' + App.options.alcdnDomain + filePath;
        },
        replaceUrl: function (text) {
            var reg = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g;
            return text.replace(reg, '<a target="_blank" href="$1$2">$1$2</a>');
        },
        fixUrlSource: function (url, source) {
            if (url.indexOf('?') == -1){
                return url + '?_source=' + encodeURIComponent(source);
            }else {
                return url + '&_source=' + encodeURIComponent(source);
            }
        },
        simpleTime: function(timeStr) {
            var fields = timeStr.replace(/[-:]/g, ' ').split(' ');
		    var date = new Date();
		    date.setFullYear(fields[0]);
		    date.setMonth(fields[1] - 1);
		    date.setDate(fields[2]);
		    date.setHours(fields[3]);
		    date.setMinutes(fields[4]);
		    date.setSeconds(fields[5]);
		    var nowDate = new Date();
		    var seconds = (nowDate.getTime() - date.getTime()) / 1000;
		    if (seconds < 60)
		        return Math.max(Math.floor(seconds), 1) + '秒前';
		    else if (seconds < 3600)
		        return Math.floor(seconds / 60) + '分钟前';
		    else if (date.getFullYear() == nowDate.getFullYear() && date.getMonth() == nowDate.getMonth() && date.getDate() == nowDate.getDate())
		        return Math.floor(seconds / 3600) + '小时前';
		    else if (date.getFullYear() == nowDate.getFullYear())
		        return (date.getMonth() + 1) + '月' + date.getDate() + '日';
		    return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
		},
		simpleNumber: function(num) {
            if (num < 1000)
                return num;
            if (num < 10000) {
                var remainder = num % 1000 + '';
                while (remainder.length < 3)
                    remainder = '0' + remainder;
                return Math.floor(num / 1000) + ',' + remainder;
            }
            if (num < 100000)
                return (num / 10000).toFixed(1) + 'w';
            return Math.floor(num / 10000) + 'w';
		},
		simpleFileSize: function(fileSize) {
		    if (fileSize >= 100 * 1024 * 1024)
		        return (fileSize / 1024 / 1024).toFixed(0) + ' MB';
		    if (fileSize >= 10 * 1024 * 1024)
		        return (fileSize / 1024 / 1024).toFixed(1) + ' MB';
		    if (fileSize >= 1024 * 1024)
		        return (fileSize / 1024 / 1024).toFixed(2) + ' MB';
		    if (fileSize >= 1024)
		        return (fileSize / 1024).toFixed(0) + ' KB';
		    return fileSize;
		}
    };
    function isLogined() {
        return utils.getCookie(options.loginCookieName);
    };
    var enableDebug = utils.urlParam('debug');

    function init() {
        if (!document.body)
            return;
        var fontSize = window.getComputedStyle(document.body).fontSize;
        console.log('font size: ' + fontSize);
        if (fontSize && typeof(fontSize) == 'string' && fontSize.substr(fontSize.length - 2) == 'px') {
            fontSize = fontSize.substr(0, fontSize.length - 2);
            if (fontSize) {
                rem = parseFloat(fontSize);
                console.log('rem: ' + rem);
            }
        }
    }

    function getPixel(value) {
        if (! value)
            return 0;
        value = ''+value;
        var result = value;
        if (value.substr(value.length - 3) == 'rem')
            result = parseFloat(value.substr(0, value.length - 3)) * rem;
        else if (value.substr(value.length - 2) == 'px')
            result = parseFloat(value.substr(0, value.length - 2));
        return Math.floor(result);
    }

    function fixUrl(url) {
        //两个?
        var p1 = url.indexOf('?');
        var p2 = url.lastIndexOf('?');
        if (p1 > 0 && p2 > 0 && p1 != p2)
            url = url.substr(0, p2) + '&' + url.substr(p2 + 1);

        //没有?
        var p1 = url.indexOf('?');
        var p2 = url.indexOf('&');
        if (p1 == -1 && p2 > 0)
            url = url.substr(0, p2) + '?' + url.substr(p2 + 1);
        return url;
    }

    function resizeQiniu(url, width, height, ratio) {
        if (url.indexOf('?') > 0) {
            var ratioArg = App.utils.urlParam('ratio', url);
            if (ratioArg)
                ratio = ratioArg;
            url = url.substr(0, url.indexOf('?'));
        }
        if (width && ratio) {
            return url + '?imageView2/1/w/' + Math.floor(width) + '/h/' + Math.floor(width / ratio);
        }
        else if (width)
            return url + '?imageView2/2/w/' + Math.floor(width);
        return url;
    }
    function resizeOss(url, width, height, ratio) {
        if (url.indexOf('?') > 0) {
            var ratioArg = App.utils.urlParam('ratio', url);
            if (ratioArg)
                ratio = ratioArg;
            url = url.substr(0, url.indexOf('?'));
        }
        if (width && ratio) {
            // x-oss-process=image/resize,h_2200
            return url + '?x-oss-process=image/resize,w_' + Math.floor(width) + ',h_' + Math.floor(width / ratio);
        }
        else if (width)
            return url + '?x-oss-process=image/resize,w_' + Math.floor(width);
        return url;
    }
    function resize(url, width, height, ratio) {
        if (!url)
            return url;
        var qiniuPrefix = 'http://' + options.qiniuDomain;
        var ossPrefix = 'http://' + options.ossDomain;
        var alcdnPrefix = 'http://' + options.alcdnDomain;

        //不处理外链图片
        if (url.substr(0, 5) == 'http:' || (url.substr(0, 6) == 'https:')) {
            if (url.indexOf(qiniuPrefix) == -1 && url.indexOf(ossPrefix) == -1 && url.indexOf(alcdnPrefix) == -1)     //不是七牛或者oss的资源不处理
                return url;
        }
        //width = getPixel(width);
        //height = getPixel(height);
        url = fixUrl(url);
        if (!ratio && (url.indexOf('/user_portrait/') > 0 || url.indexOf('/subject_portrait/') > 0))
            ratio = 1;
        if (url.indexOf('/article_images/') > 0 || url.indexOf('/ueditor-upload/') > 0 || url.indexOf('/lesson_account_cover/') > 0)
            ratio = null;

        if (url.substr(0, qiniuPrefix.length) == qiniuPrefix) {
            return resizeQiniu(url, width, height, ratio);
        }else if (url.substr(0, ossPrefix.length) == ossPrefix) {
            return resizeOss(url, width, height, ratio);
        }else if (url.substr(0, alcdnPrefix.length) == alcdnPrefix) {
            return resizeOss(url, width, height, ratio);
        }
        return url;
    }

    function resetTpl(target) {
        var tplBackup = tplBackups[target];
        if (tplBackup && $(target).html() != tplBackup) {
            $(target).html('').removeAttr('_rendered');
        }
    }

    //动态加载js
    function require(names, callback) {
        if (!names || names.length == 0) {
            callback();
            return;
        }
        var moduleName = names.shift();
        var moduleConf = App.modules[moduleName];
        if (moduleConf.check()) {
            require(names, callback);
        }
        else {
            $.getScript(moduleConf.src, function() {
                require(names, callback);
            });
        }
    }

    function isRendered(target) {
        return $(target).attr('_rendered');
    }

    function ensureXsrfToken() {
        if (!App.data.xsrfToken) {
            var request = new XMLHttpRequest();
            request.open('GET', '/api/user/get_xsrf_token', false);
            request.send(null);
            if (request.status === 200) {
                App.data.xsrfToken = request.responseText;
            }
        }
    }

    function ensureLogin() {
        if (document.cookie.indexOf(App.options.loginCookieName + '=') == -1 && !utils.urlParam('_session')) {
            if (options.login_url)
                location.href = options.login_url;
        }
        App.api('user/check_login', function(rspData) {
            if (!rspData.result) {
                if (options.login_url) {
                    location.href = options.login_url;
                }
            }
        });
    }

    function logShare(type) {
        var url = 'log/share';
        if (type)
            url += '?type=' + type;
        App.api(url, function() {})
    }

    function ensureUnionId() {
        if (App.utils.isWeixin()) {
            App.api('weixin/require_unionid', function(rspData) {
                // alert(JSON.stringify(rspData));
                if (!rspData.result && rspData.login_url) {
                    location.href = rspData.login_url;
                }
            });
        }
    }

    function getPrivileges(callback) {
        if (callback) {
            if (privileges)
                callback(privileges);
            else {
                privilegeListeners.push(callback);
                if (privilegeListeners.length == 1) {
                    App.api('user/privileges', function (rspData) {
                        privileges = rspData.results;
                        $(privilegeListeners).each(function(i, callback) {
                            callback(privileges);
                        });
                    })
                }
            }
        }
    }

    function vue(options) {
        function updateResizeSrc(elem, binding) {
            if (typeof binding.value === 'undefined')
                return;
            var imgUrl = fixHttps(resizeImageUrl(elem, binding.value));
            // console.log('update ' + binding.name + ': url=' + imgUrl);
            if (imgUrl) {
                if (binding.name == 'resize-bgimg')
                    $(elem).css('background-image', 'url(' + imgUrl + ')');
                else
                    $(elem).attr('src', imgUrl);
            }
        };
        function ifPrivilege(elem, binding, vnode) {
            if (!privileges) {
                getPrivileges(function() {
                    vnode.context.$forceUpdate();
                });
                $(elem).hide();
            }
            else {
                if (privileges.indexOf('system') >= 0 || privileges.indexOf(binding.value) >= 0)
                    $(elem).show();
                else
                    $(elem).hide();
            }
        }
        if (!options.el)
            options.el = '.vue-main';
        options.delimiters = ['${', '}'];
        options.directives = options.directives || {};
        options.directives['resize-src'] = { //压缩图片
            update: updateResizeSrc,
            bind: updateResizeSrc,
            inserted: updateResizeSrc,
        };
        options.directives['resize-bgimg'] = { //压缩图片
            update: updateResizeSrc,
            bind: updateResizeSrc,
            inserted: updateResizeSrc,
        };
        options.directives['priv'] = { //压缩图片
            update: ifPrivilege,
            bind: ifPrivilege,
            inserted: ifPrivilege,
        };
        options.filters = options.filters || {};
        options.filters['add-param'] = function(url, name, value) {
            if (!url)
                return url;
            if (url.indexOf('?') == -1)
                return url + '?' + name + '=' + value;
            return url + '&' + name + '=' + value;
        };
        options.filters['simpleTime'] = function(timeStr) {
            return App.utils.simpleTime(timeStr);
    	};
        options.filters['simpleNumber'] = function(number) {
            return App.utils.simpleNumber(number);
    	};
        options.filters['simpleFileSize'] = function(fileSize) {
            return App.utils.simpleFileSize(fileSize);
    	};
        return new Vue(options);
    }

    function render(target, data, isAppend) {
        var source = '';
        var $target = target;
        if (typeof(target) == 'string')
            $target = $(target);
        if (!$target.get(0)) {
            console.log('找不到模板: ' + target.substr(0, 20));
            return;
        }
       // if (target.substr)
       //     console.log('render: tpl=' + target.substr(0, 20));

        var insertMode = undefined;
        var options = {};

        if (typeof(isAppend) == 'object') {
            options = isAppend;
            insertMode = options.insertMode;
        }
        else if (isAppend)
            insertMode = 'append';

        var isFirstElem = true;
        if (tplBackups[target]) {
            source = tplBackups[target];
            if ($target.html() != source)
                isFirstElem = false;
        }
        else {
            //载入模板内容
            source = $target.html();
            tplBackups[target] = source;
        }

        Mustache.parse(source);
        var html = Mustache.render(source, data);
        while (html.indexOf('[{[') >= 0) {
            html = html.replace('[{[', '[[').replace(']}]', ']]');
        }
        if (insertMode == 'append' && !isFirstElem)
            $target.append($(html));
        else if (insertMode == 'prepend' && !isFirstElem)
            $target.prepend($(html));
        else {
            if ($target.get(0).tagName == 'SCRIPT') {
                $newNode = $(html);
                if (target.substr(0, 1) == '.')
                    $newNode.addClass(target.substr(1));
                else if (target.substr(0, 1) == '#')
                    $newNode.attr('id', target.substr(1));
                $target.replaceWith($newNode).show();
            }
            else {
                $target.html(html).show();
            }
        }
        if (html.indexOf('resize-src') > 0 || html.indexOf('resize-bgimg') > 0)
            resizeImages($target);
        if (html.indexOf('render-src') > 0) {
            $target.find('[render-src]').each(function(i, elem) {
                $(elem).attr('src', $(elem).attr('render-src')).removeAttr('render-src');
            })
        }
        if ($target.is(':hidden'))
            $target.show();
        $target.attr('_rendered', '1');
    };

    function getImageSize(elem) {
        var parent = $(elem).parent();
        var width = $(elem).css('width');
        var height = $(elem).css('height');
        if (!width)
            width = $(elem).css('background-width');
        if (!height)
            height = $(elem).css('background-height');
        if (!width || width == '0px')
            width = $(elem).css('max-width');
        if (!height || height == '0px')
            height = $(elem).css('max-height');
        if (!width)
            width = $(parent).width() + 'px';
        if (!height)
            height = $(parent).height() + 'px';
        width = getPixel(width);
        height = getPixel(height);
        if (width && height) {
            return {width: width, height: height};
        }
        if (width)
            return {width: width, height: 9999};
    };

    function alertResult(success, text, callback, immediately) {
        if($('.success-dialog').is(':visible'))
            $('.success-dialog').hide();
        $('.success-dialog .text').html(text);
        if (success)
            $('.success-dialog .icon').addClass('success-icon').removeClass('error-icon').removeClass('loading-icon');
        else
            $('.success-dialog .icon').addClass('error-icon').removeClass('success-icon').removeClass('loading-icon');
        if(!!immediately){
            center('.success-dialog').show();
        }else {
            center('.success-dialog').fadeIn();
        }
        setTimeout(function() {
            $('.success-dialog').fadeOut();
            setTimeout(callback, 1000);
        }, 1000);
        $('.success-dialog').off('touchstart').on('touchstart', function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        })
    };

    function showLoading(text) {
        $('.success-dialog .text').html(text);
        $('.success-dialog .icon').addClass('loading-icon').removeClass('success-icon').removeClass('error-icon');
        center('.success-dialog').fadeIn();
        $('.success-dialog').off('touchstart').on('touchstart', function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        })
    }
    function hideLoading(immediately) {
        if(!!immediately){
            $('.success-dialog').hide();
        }else {
            $('.success-dialog').fadeOut();
        }
    }

    function confirm(title, text, callback, hideCancel, confirmText) {
        var $cancelBtn = $('.confirm-dialog .dialog-btn.cancle');
        var $confirmBtn = $('.confirm-dialog .dialog-btn.confirm');
        $confirmBtn.text(confirmText ? confirmText : '确定');
        if (hideCancel)
            $cancelBtn.hide();
        else
            $cancelBtn.show();

        $dialog = $('.confirm-dialog');
        if ($dialog.get(0)) {
            $dialog.find('.title').html(title);
            $dialog.find('.text').html(text);
            center($dialog).fadeIn();
        }
        else {
            alert(text);
        }
        if (callback) {
            $cancelBtn.off('click').on('click', function() {
                $('.confirm-dialog').hide();
            });
            $confirmBtn.show().off('click').on('click', function() {
                callback();
                $('.confirm-dialog').hide();
            });
        }
        else {
            $cancelBtn.hide();
            $confirmBtn.hide();
            setTimeout(function() {
                $dialog.fadeOut();
            }, 2000);
        }
    };

    function resizeImageUrl(elem, imgUrl) {
        var dpr = window.devicePixelRatio;
        sizeDpr = Math.max(1.5, dpr);
        if (imgUrl.substr(0, 2) == '[[')
            return;
        if (imgUrl.substr(0, 2) == '<[')
            return;
        if (imgUrl.substr(0, 3) == '[{[')
            return;
        //if (imgUrl.substr(0, 1) != '/')
        //    return;
        var imgSize = getImageSize(elem);
        var maxWidth = $(window).width();
        if (!imgSize)
            imgSize = {width:maxWidth, height:9999};
        //if (imgSize)
        imgUrl = resize(imgUrl, imgSize.width * sizeDpr, imgSize.height * sizeDpr);
        return imgUrl;
    };

    function resizeImages(root) {
        var dpr = window.devicePixelRatio;
        sizeDpr = Math.max(1.5, dpr);
        $('img[resize-src]').each(function(i, elem) {
            var imgUrl = $(elem).attr('resize-src');
            imgUrl = resizeImageUrl(elem, imgUrl);
            if (imgUrl) {
                $(elem).attr('src', imgUrl);
                $(elem).removeAttr('resize-src');
            }
        });
        $('[resize-bgimg]').each(function(i, elem) {
            var imgUrl = $(elem).attr('resize-bgimg');
            if (imgUrl.substr(0, 2) == '[[')
                return;
            //if (imgUrl.substr(0, 1) == '/') {
                var imgSize = getImageSize(elem);
                if (imgSize)
                    imgUrl = resize(imgUrl, imgSize.width * sizeDpr, imgSize.height * sizeDpr, getPixel(imgSize.width) / getPixel(imgSize.height));
            //}
            $(elem).css('background-image', 'url(' + imgUrl + ')');
            $(elem).removeAttr('resize-bgimg');
        });
    };

    function showLogin() {
        if (typeof AndroidNative !== 'undefined') {
            AndroidNative.login();
            return;
        }
        var backUrl = utils.urlParam('redirect_url');
        if (!backUrl)
            backUrl = location.href;
        if (backUrl.indexOf('#') >= 0)
            backUrl = backUrl.substr(0, backUrl.indexOf('#'));
        backUrl = backUrl.replace(':81/', '/');
        if (App.isWekuoApp()) {
            App.postMessage({
                event: 'confirm-login',
                data: { url: location.href },
            });
        }
        else if (App.utils.isPC()) {
            var redirectUrl = "http://api.wekuo.com/api/weixin/login?next=" + encodeURIComponent(backUrl);
            console.log('redirectUrl:', redirectUrl);
            var options = {
                id:"login-container",
                appid: "wx96110b5422b2c0dc",
                scope: "snsapi_login",
                redirect_uri: redirectUrl,
                state: App.options.defaultWebAppId,
                style: "",
                href: ""
            };
            var obj = new WxLogin(options);
            $('#login-container').show();
            $('#weiku-login-area').show();
        }
        else if (App.utils.isMobile() && !App.utils.isWeixin()) {
            $('#wx-login-container').show();
        }
        else {
            center('#login-container').show();
            $('#login-container .cancle').off('click').on('click', function() {
                $('#login-container').hide();
            });
            $('#login-container .confirm').off('click').on('click', function() {
                var loginUrl = '/user/login?next=' + encodeURIComponent(location.href);
                location = loginUrl;
            });
        }
    };

    function showWaitPost(el, text, callback) {
        $(el).attr('disabled', true);
        text ? text = text : text = '正在提交';
        if (!$('.dialog.success-dialog').get(0)) {
            showLoading(text);
        }
        if (callback) {
            callback();
        }
    }
    function hideWaitPost(el, callback) {
        $(el).removeAttr('disabled');
        hideLoading();
        if (callback) {
            callback();
        }
    }

    //保存请求到localStorage
    function pendingApi(uri, data) {
        if (localStorage) {
            localStorage.setItem('pending_api:' + uri, JSON.stringify(data));
        }
    }

    //app_id
    function getAppId() {
        if (typeof __AppId !== 'undefined')
            return __AppId;
        return App.data.appId;
    }

    //唯库app
    function isWekuoApp() { 
        return navigator.userAgent.indexOf(' Wekuo/') > 0;
    }

    //访问链接优化协议
    function fixHttps(preUrl) {
        if(preUrl.substr(0, 5) == 'https'){
            return preUrl;
        }else if(preUrl.substr(0, 4) != 'http'){
            return preUrl;
        }
        if ('https:' == document.location.protocol){
            return preUrl.replace(/http/, 'https')
        }
        return preUrl;
    }

    $(function() {
        if (localStorage && isLogined()) {
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                var data = localStorage.getItem(key);
                if (data[0] == '{' && data[data.length - 1] == '}') {
                    var data = eval('(' + data + ')');
                    (function(key, data) {
                        //删除过期数据
                        if (data.expires && data.expires < Date.now()) {
                            setTimeout(function() {
                                console.log('删除过期数据:' + key);
                                localStorage.removeItem(key);
                            }, 100);
                        }
                        //发起localStorage的请求
                        if (key && utils.startsWith(key, 'pending_api:')) {
                            var uri = key.split(':')[1];
                            console.log('发起待定请求:' + uri);
                            App.api(uri, data, function(rspData) {
                                if (!rspData) {
                                    console.log('异常，移除待定请求:' + key);
                                    localStorage.removeItem(key);
                                }
                                else if (rspData.result) {
                                    console.log('成功，移除待定请求:' + key);
                                    localStorage.removeItem(key);
                                }
                            }, function() {
                                //服务器异常
                                console.log('异常，移除待定请求:' + key);
                                localStorage.removeItem(key);
                            });
                        }
                    })(key, data);
                }
            }
        }
    });

    init();

    $(document).ready(resizeImages);

    return {
        addCtrl: function(name, ctrl) {
            ctrls[name] = ctrl;
        },
        /*
        start: function() {
            var names = Object.keys(ctrls);
            $(names).each(function(i, name) {
                var ctrl = ctrls[name];
                if (ctrl.start) {
                    console.log('--> ' + name + '.start');
                    ctrl.start();
                }
            })
        },
        */
        http: function(url, data, callback, errback) {
            url = fixHttps(url);
            if (typeof(data) == 'function') {
                errback = callback;
                callback = data;
                data = null;
            }
            // console.log('获取:' + url);
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function(e) {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        callback(this.responseText);
                    }
                    else {
                        if (errback === true)
                            callback(this.status);
                        else if (errback)
                            errback(this.status);
                    }
                }
            }
            xhr.send();
        },
        apiGet: function(uri, callback, errback) {
            App.api(uri, null, callback, errback, {method:'GET'});
        },
        api: function(uri, data, callback, errback, apiOptions) {
            if (typeof(data) == 'function') {
                apiOptions = errback;
                errback =  callback;
                callback = data;
                data = null;
            }
            if (errback && typeof(errback) == 'object') {
                apiOptions = errback;
                errback = null;
            }
            apiOptions = apiOptions || {};

            //命中缓存
            if (cache[uri]) {
                handleResponse(cache[uri]);
                return;
            }

            //尝试从七牛获取数据
            /*
            if (apiOptions && apiOptions.tryQiniu) {
                apiOptions.cacheRsp = true;
                var qiniuKey = uri;
                if (qiniuKey.substr(0, 1) != '/')
                    qiniuKey = '/' + qiniuKey;
                qiniuKey = 'cache_rsp' + qiniuKey.replace(/\?/g, '$').replace(/&/g, '$');
                App.http(App.utils.qiniuUrl(qiniuKey), handleResponse,
                    //失败则从服务器获取
                    function() {
                        apiOptions.tryQiniu = false;
                        //alert('123');
                        App.api(uri, data, callback, errback, apiOptions);
                    }
                )
                return;
            }
            */

            //加上"/api"前缀
            var url = uri;
            if (!utils.startsWith(url, '/live_/') && !utils.startsWith(url, '/api/')) {
                if (uri.substr(0, 1) == '/')
                    uri = uri.substr(1);
                url = '/api/' + uri;
            }

            //使用子域名
            var oriDomainUrl = url;
            if (window.location.hostname != 'live.wekuo.com'
                    && window.location.hostname != 'gray.wekuo.com'
                    && window.location.href.substr(0, 7) == 'http://'
                    && window.location.href.indexOf('/cjkb/') == -1
                    && App.options.apiDomains
                    && !App.utils.isAndroidApp()
                    && !App.utils.isIosApp()
                    && App.options.apiDomains.length
                    && !apiOptions.noApiDomains
                    && url.substr(0, 5) == '/api/') {
                var apiDomain = App.options.apiDomains[Math.floor(Math.random() * App.options.apiDomains.length)];
                url = 'http://' + apiDomain + url;
            }
            url = fixHttps(url);

            //var crossDomain = false;
            //if (location.host.indexOf(':') > 0) {
            //    url = 'http://' + location.hostname + url;
            //    crossDomain = true;
            //}

            //console.log('REQUEST ' + url);

            //发起请求
            var xhr = new XMLHttpRequest();

            //跨域通过url传输登录数据
            /*
            if (crossDomain) {
                var loginData = utils.getCookie(options.loginCookieName);
                if (url.indexOf('?') >= 0)
                    url += '&_login_data=' + encodeURIComponent(loginData);
                else
                    url += '?_login_data=' + encodeURIComponent(loginData);
            }
            */

            function handleResponse(responseText) {
                //缓存结果
                if (apiOptions && apiOptions.cacheRsp && !cache[uri])
                    cache[uri] = responseText;

                var result = null;
                try {
                    result = eval('(' + responseText + ')');
                }catch (err){
                    console.error(err);
                    result = JSON.parse(responseText);
                }

                if (result.success) {
                    if (callback) {
                        try {
                            callback(result.data);
                        } catch(err) {
                            App.debug('Exception:' + err.message + '<br>' + err.stack);
                        }
                    }
                }
                else if (result.code == 1)
                    App.showLogin();
                else {
                    var title = '提示';
                    var message = result.message;
                    if (!message) {
                        title = '错误';
                        message = '程序错误！';
                    }
                    App.confirm('提示', message);
                    if (errback)
                        errback();
                }
            }


            var method = apiOptions.method || 'POST';
            //if (apiOptions && apiOptions.nocache)
            //    method = 'POST';
            if (apiOptions.enableCache && !data)
                method = 'GET';
            try { 
                if (url != oriDomainUrl)
                    xhr.withCredentials = true;
            } catch(err) {
                url = oriDomainUrl;
            }
            xhr.open(method, url, true);
            xhr.setRequestHeader('X-Xsrftoken', App.data.xsrfToken);
            if (getAppId())
                xhr.setRequestHeader('X-AppId', getAppId());
            if (utils.urlParam('_refresh') || apiOptions.refresh)
                xhr.setRequestHeader('X-Refresh', true);

            var urlSession = utils.urlParam('_session');
            if (urlSession)
                xhr.setRequestHeader('X-Session', urlSession);

            xhr.onreadystatechange = function(e) {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        handleResponse(this.responseText);
                    }
                    else if (this.status == 403) {
                        if(options.login_url && !App.data.user.id){
                            window.location.href = options.login_url;
                        }else{
                            App.alertResult(false, '没有权限');
                            if (errback)
                                errback();
                        }

                    }
                    else if (this.status == 504) {
                        console.log('网关超时');
                        if(errback)
                            errback();
                    }
                    else if (this.status == 0) {
                        //禁用跨域请求再重试
                        if (! apiOptions.noApiDomains && App.options.apiDomains) {
                            apiOptions.noApiDomains = true;
                            App.api(uri, data, callback, errback, apiOptions);
                        }
                    }
                    else if (this.status > 0) {
                        App.alertResult(false, '程序出错了');
                        console.log('请求错误:' + this.status);
                        if (errback)
                            errback();
                    }
                }
            };
            /*
            if (progress) {
                xhr.upload.addEventListener("progress",
                    function(evt){
                        console.log(evt);
                        if (evt.lengthComputable) {
                            var percent = evt.loaded / evt.total;
                            progress(percent);
                        }
                        else {
                            console.log('loaded: ' + evt.loaded);
                        }
                    }, false
                );
            }
            */
            if (!data)
                xhr.send();
            else if (data instanceof Blob)
                xhr.send(data);
            else if (typeof data == 'object') {
                var dataStr = JSON.stringify(data);
                xhr.send(dataStr);
            }
            else
                xhr.send(data);
        },
        render: render,
        isRendered: isRendered,
        resetTpl: resetTpl,
        isLogined: isLogined,
        showLogin: showLogin,
        utils: utils,
        ctrls: ctrls,
        data: data,
        resize: resize,
        resizeImages: resizeImages,
        alertResult: alertResult,
        alertSuccess: function(msg) {
            alertResult(true, msg);
        },
        showLoading: showLoading,
        hideLoading: hideLoading,
        confirm: confirm,
        alert: function(text) {
            App.confirm('', text);
        },
        showWaitPost: showWaitPost,
        hideWaitPost: hideWaitPost,
        resizeImageUrl: resizeImageUrl,
        

        config: function(args) {
            for (key in args) {
                options[key] = args[key];
            }
            //var loginData = utils.getCookie(options.loginCookieName);
            var loginData = '123';
            if(options.login_url && !loginData){
                //登录
                window.location.href=options.login_url;
            }
        },
        loginUrl: function () {
            return options.login_url;
        },
        debug: function(msg) {
            console.log(msg);
            if (!App.utils.urlParam('_debugjs'))
                return;
            msg = msg + '';
            while (msg.indexOf('\n') >= 0)
                msg = msg.replace('\n', '<br>');
            $('#debug').append($('<div>' + msg + '</div>')).show();
        },
        catchErr: function(func) {
            try {
                func();
            } catch(err) {
                App.debug('Exception:' + err.message + '<br>' + err.stack);
            }
        },
        setTitle: function(title) {
            if (utils.isPC())
                document.title = title + ' | 年轻人的技能学习神器';
            else
                document.title = title;
        },
        options: options,
        loadUserData: function (initUrl, callback) {
            var loginData = utils.getCookie(options.loginCookieName);
            if(!options.login_url || loginData){
                var xhr = new XMLHttpRequest();
                xhr.open('GET', initUrl, true);
                xhr.onreadystatechange = function(e) {
                    if (this.readyState == 4) {
                        if (this.status == 200 || this.status == 304) {
                            var rspData = eval('(' + this.responseText + ')');
                            if((!rspData.user || !rspData.user.id) && options.login_url){
                                window.location.href=options.login_url;
                                return
                            }
                            App.data = rspData;
                            callback();
                        }else if (this.status == 403){
                            if (options.login_url){
                                window.location.href=options.login_url;
                            }else {
                                alertResult(false, '请登录');
                            }
                        }else {
                            //TODO：出错处理
                        }
                    }
                };
                xhr.send();
            }else{
                window.location.href=options.login_url;
            }
        },
        ensureXsrfToken: ensureXsrfToken,
        ensureLogin: ensureLogin,
        ensureUnionId: ensureUnionId,
        logShare: logShare,
        vue: vue,
        require: require,
        getPrivileges: getPrivileges,
        pendingApi: pendingApi,
        postMessage: function(data) {
            App.debug('postMessage');
            if (typeof data == 'object')
                data = JSON.stringify(data);
            try {
                window.postMessage(data);
            } catch(err) {
                App.debug('postMessage err:'+err);
                setTimeout(function() {
                    App.debug('msg timeout');
                    App.postMessage(data);
                }, 500);
            }
        },
        getAppId: getAppId,
        isWekuoApp: isWekuoApp,
    };
})();


$(document).ready(function () {
    setTimeout(function () {
        //百度统计:cdb.wekuo.com
        var _hmt = _hmt || [];
        (function() {
            var hm = document.createElement("script");
            hm.src = "//hm.baidu.com/hm.js?40614682cfde5e829b91e313e316fc26";
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(hm, s);
        })();

        //百度统计:www.wekuo.com
        (function() {
            var hm = document.createElement("script");
            hm.src = "https://hm.baidu.com/hm.js?6cfa7389d4710fb5d507d0760890e334";
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(hm, s);
        })();
    }, 1000);
});
