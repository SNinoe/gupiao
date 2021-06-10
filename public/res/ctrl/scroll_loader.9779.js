(function () {
    function ScrollLoader() {
        var changeVersion = 0;
        var versionFunc = {};
        var url;
        var handler;
        var limit;
        var timeout;
        var offset;
        var noMore;
        var isLoading;
        var maxId;
        var pager;
        var container;
        var scroller = window;
        var loading = '#loading';
        var finishCallback = null;
        var loadTimeout = null;

        function setLoading(flag) {
            isLoading = flag;
            if(!!flag){
                loadTimeout = setTimeout(function () {
                    isLoading = false;
                    loadMore();
                }, 3000);
            }else {
                if(!!loadTimeout){
                    window.clearTimeout(loadTimeout);
                }
            }
        }

        function reset() {
            url = null;
            handler = null;
            limit = 10;
            timeout = 300;
            offset = 0;
            noMore = false;
            setLoading(false);
            maxId = 0;
            pager = 'offset';
            finishCallback = null;
            //$(window).unbind("_scroll_bottom");
            //$('#loading').hide();
        }
        function getSetting() {
            return {
                url: url,
                handler: handler,
                limit: limit,
                timeout: timeout,
                offset: offset,
                noMore: noMore,
                isLoading: isLoading,
                maxId: maxId,
                pager: pager,
                finishCallback: finishCallback,
                changeVersion: changeVersion,
                scroller: scroller == window ? null : scroller,
                container: container
            }
        }
        function resumeSetting(setting, notMore) {
            changeVersion = changeVersion+1;
            changeVersion = changeVersion+1;
            url = setting.url;
            handler = setting.handler;
            limit = setting.limit;
            timeout = setting.timeout;
            offset = setting.offset;
            noMore = setting.noMore;
            setLoading(setting.isLoading);
            maxId = setting.maxId;
            pager = setting.pager;
            finishCallback = setting.finishCallback;

            preVersion = setting.changeVersion;
            if(versionFunc[preVersion]){
                versionFunc[preVersion]();
                delete versionFunc[preVersion];
            }
        }

        function config(options) {
            if (options.url)
                url = options.url;
            if (options.handler)
                handler = options.handler;
            if (options.limit)
                limit = options.limit;
            if (options.offset)
                offset = options.offset;
            if (options.timeout)
                timeout = options.timeout;
            if (options.offset)
                offset = options.offset;
            if (options.noMore)
                noMore = options.noMore;
            if (options.maxId)
                maxId = options.maxId;
            if (options.pager)
                pager = options.pager;
            if (options.container)
                container = options.container;
            if (options.loading)
                loading = options.loading;
            if (options.finishCallback)
                finishCallback = options.finishCallback;
            if (options.scroller) {
                scroller = options.scroller;
                if (!$(scroller).attr('_scroll_loader_bind')) {
                    $(scroller).attr('_scroll_loader_bind', 1);
                    $(scroller).scroll(function(){
                        var container = $(scroller).get(0);
                        // App.debug('scroll: scrollTop=' + container.scrollTop + ', clientHeight=' + container.clientHeight + ', scrollHeight=' + container.scrollHeight);
                        if (container.scrollTop + container.clientHeight + 1 >= container.scrollHeight)
                            $(window).trigger("_scroll_bottom");
                    });
                }
            }
            if (options.finishCallback){
                finishCallback = options.finishCallback;
            }
        }

        function start(options) {
            changeVersion = changeVersion+1;
            reset();
            config(options);

            loadMore();
            $(window).bind("_scroll_bottom", function() {
                if (!container || $(container).is(':visible'))
                    loadMore();
            })
        }
        function start2(options) {
            changeVersion = changeVersion+1;
            config(options);

            loadMore();
            $(window).bind("_scroll_bottom", function() {
                if (!container || $(container).is(':visible'))
                    loadMore();
            })
        }

        function pause() {
            $(window).unbind("_scroll_bottom");
        }

        function resume() {
            $(window).bind("_scroll_bottom", function() {
                loadMore();
            })
        }

        function atBottom() {
            var result = App.utils.isAtBottom();
            if (scroller != window) {
                var scrollElem = $(scroller).get(0);
                result = scrollElem.scrollTop + scrollElem.clientHeight >= scrollElem.scrollHeight
            }
            return result;
        }

        function scrollToBottom() {
            if (scroller == window)
                window.scrollTo(0, document.body.clientHeight);
            else {
                $(scroller).scrollTop($(scroller).get(0).scrollHeight - $(scroller).height());
            }
        }

        function loadMore() {
            if (noMore)
                return;
            if (isLoading)
                return;
            setLoading(true);
            $(loading).show();
            if (offset > 0 && $(scroller).scrollTop() > 100) {
                scrollToBottom();
            }

            //处理参数
            args = [];
            args.push('limit=' + limit);
            if (pager == 'max_id')
                args.push('max_id=' + maxId);
            else if (pager == 'offset')
                args.push('offset=' + offset);

            //生成url
            var reqUrl = url;
            if (reqUrl.indexOf('?') == -1)
                reqUrl += '?';
            else
                reqUrl += '&';
            reqUrl += args.join('&');
            var tempVersion = changeVersion;
            setTimeout(function() {
                App.apiGet(reqUrl, function(data) {
                    var updateFunc = function () {
                        $(loading).hide();
                        if (!data || !data.items || !data.items.length) {
                            noMore = true;
                            if (offset == 0)
                                handler(null);
                            if (!!finishCallback){
                                finishCallback();
                            }
                            return;
                        }
                        offset += limit;

                        if (pager == 'max_id') {
                            $(data.items).each(function(i, item) {
                                if (!maxId || item.id < maxId)
                                    maxId = item.id;
                            });
                        }
                        handler(data);
                        setTimeout(function() {
                            if (atBottom()) {
                                if (!container || $(container).is(':visible'))
                                    loadMore();
                            }
                        }, 100);
                        setLoading(false);
                    };

                    if(tempVersion != changeVersion){
                        versionFunc[tempVersion] = updateFunc;
                    }else {
                        updateFunc();
                    }
                }, function () {
                    setLoading(false);
                });
            }, timeout);
        }

        function resetUrl(newUrl) {
            url = newUrl;
        }

        this.start = start;
        this.start2 = start2;
        this.pause = pause;
        this.resume = resume;
        this.getSetting = getSetting;
        this.resumeSetting = resumeSetting;
        this.reset = reset;
        this.resetUrl = resetUrl;
        return this;
    }

    App.addCtrl('scrollLoader', {
        start: function(config) {
            var scrollLoader = ScrollLoader();
            scrollLoader.start(config);
            return scrollLoader;
        },
        create: function(){
            return ScrollLoader();
        }
    });

})();
