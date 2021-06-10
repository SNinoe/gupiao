(function () {
    var scrollLoaderObj = null;
    var liveScrollSetting = null;
    var featuredScrollSetting = null;
    var lessonScrollSetting = null;
    var vue = null;
    var currentMod = App.utils.urlParam('mod');
    if (!currentMod) {
        currentMod = 'live';
    }
    var querySort = App.utils.urlParam('sort');
    if (!querySort) {
        querySort = 'new';
    }
    var oriUrl = '/live/all?sort=' + querySort;
    var vueInitData = {
        hideToTop: false,
        allLives: null,
        liveHasMore: true,
        allFeatures: null,
        featuredHasMore: true,
        allLessons: null,
        lessonHasMore: true,
        currentShowMod: '',
        MOD_LIVE: 'live',
        MOD_FEATURED: 'featured',
        MOD_LESSON: 'lesson',
        TYPE_LIVE: 10,
        TYPE_SERIES: 6
    };
    $(document).ready(function () {
        var vueStorageData = slResumeTools.resumeVueData(vueInitData);
        vue = App.vue({
            el: '#app', data: vueStorageData.vue, methods: {
                beautyTimeStr: BeautyTools.beautyTimeStr,
                beautyPrice: BeautyTools.beautyPrice,
                countLeftHours: BeautyTools.countLeftHours,
                changeToLives: changeToLives,
                changeToFeatured: changeToFeatured,
                changeToLesson: changeToLesson,
                toggleMenuType: function (str) {
                    if (str == this.currentShowMod) {
                        return
                    }
                    var fixSuccess = true;
                    if (str == this.MOD_LIVE) {
                        this.changeToLives();
                    } else if (str == this.MOD_FEATURED) {
                        this.changeToFeatured();
                    } else if (str == this.MOD_LESSON) {
                        this.changeToLesson();
                    } else {
                        fixSuccess = false;
                    }
                    if (fixSuccess) {
                        this.currentShowMod = str;
                        var curUrl = App.utils.addParam(oriUrl, 'mod', str);
                        window.history.replaceState(null, null, curUrl);
                    }
                },
                savePageStorage: function (url, source) {
                    url = fixUrlSource(url, source);
                    return slResumeTools.jumpPage(url, vue.$data, scrollLoaderObj);
                }
            }, created: function () {
                this.$nextTick(function () {
                    if (!vue.currentShowMod) {
                        vue.currentShowMod = currentMod;
                    }
                    if (vue.currentShowMod == this.MOD_LIVE) {
                        this.changeToLives();
                    } else if (vue.currentShowMod == this.MOD_FEATURED) {
                        this.changeToFeatured();
                    } else if (vue.currentShowMod == this.MOD_LESSON) {
                        this.changeToLesson();
                    }
                });
            }
        });
    });
    function fixUrlSource(url, source) {
        if (!source) {
            source = 'live_all';
        }
        return App.utils.fixUrlSource(url, source);
    }

    function _savePreSetting(setting) {
        if (!setting) {
            return
        }
        switch (vue.currentShowMod) {
            case vue.MOD_LIVE:
                liveScrollSetting = setting;
                break;
            case vue.MOD_FEATURED:
                featuredScrollSetting = setting;
                break;
            case vue.MOD_LESSON:
                lessonScrollSetting = setting;
                break;
            default:
                break;
        }
    }

    function changeToLives() {
        var preSetting = null;
        if ((!liveScrollSetting) || (!scrollLoaderObj)) {
            var url = '/live_/info/index_query';
            if (querySort == 'hot') {
                url = App.utils.addParam(url, 'sort', 'leaner');
            }
            var defaultOptions = {
                url: url, limit: 10, handler: function (rspData) {
                    if (vue.allLives == null) {
                        vue.allLives = [];
                    }
                    if (rspData) {
                        for (var i = 0; i < rspData.items.length; i++) {
                            console.log('rspData.items[i]:', rspData.items[i]);
                            vue.allLives.push(rspData.items[i]);
                        }
                    }
                }, finishCallback: function () {
                    vue.liveHasMore = false;
                }
            };
            var storageData = slResumeTools.resumeScrollOptions(defaultOptions, true);
            var scrollOptions = storageData.scroll;
            if (!!scrollLoaderObj) {
                preSetting = scrollLoaderObj.getSetting();
                scrollLoaderObj.start(scrollOptions);
            } else {
                scrollLoaderObj = App.ctrls.scrollLoader.start(scrollOptions);
            }
            if (storageData.storage) {
                $('body').scrollTop(storageData.scrollTop);
            }
        } else {
            preSetting = scrollLoaderObj.getSetting();
            scrollLoaderObj.resumeSetting(liveScrollSetting);
        }
        if (!!preSetting) {
            _savePreSetting(preSetting);
        }
    }

    function changeToFeatured() {
        var preSetting = null;
        if ((!featuredScrollSetting) || (!scrollLoaderObj)) {
            var url = '/live_/featured/query';
            if (querySort == 'hot') {
                url = App.utils.addParam(url, 'sort', 'leaner');
            }
            var defaultOptions = {
                url: url, limit: 10, handler: function (rspData) {
                    if (vue.allFeatures == null) {
                        vue.allFeatures = [];
                    }
                    if (rspData) {
                        for (var i = 0; i < rspData.items.length; i++) {
                            vue.allFeatures.push(rspData.items[i]);
                        }
                    }
                }, finishCallback: function () {
                    vue.featuredHasMore = false;
                }
            };
            var storageData = slResumeTools.resumeScrollOptions(defaultOptions, true);
            var scrollOptions = storageData.scroll;
            if (!!scrollLoaderObj) {
                preSetting = scrollLoaderObj.getSetting();
                scrollLoaderObj.start(scrollOptions);
            } else {
                scrollLoaderObj = App.ctrls.scrollLoader.start(scrollOptions);
            }
            if (storageData.storage) {
                $('body').scrollTop(storageData.scrollTop);
            }
        } else {
            preSetting = scrollLoaderObj.getSetting();
            scrollLoaderObj.resumeSetting(featuredScrollSetting);
        }
        _savePreSetting(preSetting);
    }

    function changeToLesson() {
        var preSetting = null;
        if ((!lessonScrollSetting) || (!scrollLoaderObj)) {
            var url = 'lesson/series/query?state=2&is_free=0';
            if (querySort == 'hot') {
                url = App.utils.addParam(url, 'order_by', 'sale_count');
            }
            var defaultOptions = {
                url: url, limit: 10, handler: function (rspData) {
                    if (vue.allLessons == null) {
                        vue.allLessons = [];
                    }
                    if (rspData) {
                        for (var i = 0; i < rspData.items.length; i++) {
                            var lesson = rspData.items[i];
                            var coverSelector = '#lesson-config-covers .lesson-config-cover-' + lesson.id;
                            var liveCover = $(coverSelector).val();
                            if (!!liveCover) {
                                lesson.cover_image = liveCover;
                            }
                            vue.allLessons.push(lesson);
                        }
                    }
                }, finishCallback: function () {
                    vue.lessonHasMore = false;
                }
            };
            var storageData = slResumeTools.resumeScrollOptions(defaultOptions, true);
            var scrollOptions = storageData.scroll;
            if (!!scrollLoaderObj) {
                preSetting = scrollLoaderObj.getSetting();
                scrollLoaderObj.start(scrollOptions);
            } else {
                scrollLoaderObj = App.ctrls.scrollLoader.start(scrollOptions);
            }
            if (storageData.storage) {
                $('body').scrollTop(storageData.scrollTop);
            }
        } else {
            preSetting = scrollLoaderObj.getSetting();
            scrollLoaderObj.resumeSetting(lessonScrollSetting);
        }
        _savePreSetting(preSetting);
    }
})();