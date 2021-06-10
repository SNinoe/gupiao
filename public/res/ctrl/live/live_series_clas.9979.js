/**
 * Created by huanghongwei on 2017/4/19.
 */

(function() {
    // var seriesId = null;
    // var sortData = null;
    //
    // function loadLives() {
    //     App.ctrls.scrollLoader.start({
    //         url: '/live_/series/series_live_list?ser_id='+seriesId,
    //         limit: 10,
    //         // scroller: '#series-info',
    //         handler: function(rspData) {
    //             var items = rspData.items;
    //             var sortInfo = sortData.sort_info;
    //             var sortedLiveIds = sortData.live_ids;
    //             for(var i=0; i<items.length; i++){
    //                 item = items[i];
    //                 var _liveId = item['id'];
    //                 if((!!sortInfo) && (!!sortInfo[(''+_liveId)])){
    //                     App.render('#live-list', {'isSort': true, 'name': sortInfo[(''+_liveId)]}, 'append');
    //                 }
    //                 App.render('#live-list', item, 'append');
    //                 if(sortedLiveIds.indexOf(_liveId) == (sortedLiveIds.length-1) && !!sortInfo['0']){
    //                     App.render('#live-list', {'isSort': true, 'name': sortInfo['0']}, 'append');
    //                 }
    //             }
    //         }
    //     });
    // }
    //
    // function submitData() {
    //     console.log('submit');
    //     var liveIds = [];
    //     var sortInfo = {};
    //     var tempSortName = null;
    //     $('#live-list .item').each(function (index, e) {
    //         var type = $(this).attr('data-type');
    //         if(type == 'live'){
    //             var liveId = $(this).attr('data-id');
    //             liveIds.push(parseInt(liveId));
    //             if(!!tempSortName){
    //                 sortInfo[liveId] = tempSortName;
    //                 tempSortName = null;
    //             }
    //         }else{
    //             var sortName = $(this).find('.clas-inp').val();
    //             if(sortName.length <= 0){
    //                 App.alertResult(false, '存在未填写名称的分类');
    //                 return;
    //             }
    //             tempSortName = sortName;
    //         }
    //     });
    //     if(!!tempSortName){
    //         sortInfo['0'] = tempSortName;
    //     }
    //
    //     App.showLoading('提交中');
    //     App.api('/live_/series/reset_series_sort', {'sortInfo': sortInfo, 'liveIds': liveIds, 'series_id':seriesId}, function (rspData) {
    //         App.hideLoading();
    //         App.alertSuccess('已修改');
    //         window.location.href = '/lv/s/'+seriesId;
    //     }, function () {
    //         App.hideLoading();
    //     });
    // }
    //
    // function bindEvents() {
    //     var liveListSelector = '#live-list';
    //     $('#append-sort-btn').off('click').on('click', function (e) {
    //         var appedHtml = $('#one-sort-html').html();
    //         $('#live-list').append(appedHtml);
    //     });
    //
    //     $(liveListSelector).on('click', '.sort-del-btn', function (e) {
    //         App.confirm('警告', '确定要删除该分类吗？', function () {
    //             $(e.target).parents('li.item').remove();
    //         });
    //     });
    //
    //     $(liveListSelector).on('click', '.item-up-btn', function (e) {
    //         var optHtml = $(e.target).parents('li.item').prop('outerHTML');
    //         var node = $(e.target).parents('li.item').prev();
    //         if(node.length > 0){
    //             $(node).before(optHtml);
    //             $(e.target).parents('li.item').remove();
    //         }
    //     });
    //
    //     $(liveListSelector).on('click', '.item-down-btn', function (e) {
    //         var optHtml = $(e.target).parents('li.item').prop('outerHTML');
    //         var node = $(e.target).parents('li.item').next();
    //         if(node.length > 0){
    //             $(node).after(optHtml);
    //             $(e.target).parents('li.item').remove();
    //         }
    //     });
    //
    //     $(liveListSelector).on('blur', '.clas-inp', function (e) {
    //         $(e.target).attr('value', $(e.target).val());
    //     });
    //
    //     $('#save-submit-btn').off('click').on('click', function (e) {
    //         App.confirm('提示', '确定要提交吗？', function () {
    //             submitData();
    //         });
    //     });
    // }

    var seriesId = null;
    var vue = null;
    $(document).ready(function () {
        seriesId = App.utils.urlParam('id');
        vue = App.vue({
            el: '#app',
            data: {
                SORT_NAME: 23,
                FEATURED: 12,
                LIVE: 10,
                seriesObjects: []
            },
            created: function() {
                this.$nextTick(initPage);
            },
            methods: {
                deleteTheSort: deleteTheSort,
                moveUp: moveUp,
                moveDown: moveDown,
                addOneSort: addOneSort,
                saveObjects: saveObjects
            }
        });
    });

    function initPage() {
        App.api('/live_/series/series_sort_data?ser_id='+seriesId, function (rspData) {
            vue.seriesObjects = rspData.objects;
            // sortData = rspData;
            // loadLives();
        });
        // bindEvents();
    }

    function deleteTheSort(index) {
        vue.seriesObjects.splice(index, 1);
    }
    function moveUp(index) {
        if(index > 0){
            var oneItem = vue.seriesObjects.splice(index, 1)[0];
            vue.seriesObjects.splice(index-1, 0, oneItem);
        }else {
            App.alertResult(false, '已经到顶咯~');
        }
    }
    function moveDown(index) {
        if(index < (vue.seriesObjects.length-1)) {
            var oneItem = vue.seriesObjects.splice(index, 1)[0];
            vue.seriesObjects.splice(index+1, 0, oneItem);
        }else {
            App.alertResult(false, '已经到底咯~');
        }
    }
    function addOneSort() {
        var oneSort = {'name': '', 'object_type': vue.SORT_NAME};
        vue.seriesObjects.push(oneSort);
    }
    function saveObjects() {
        App.confirm('提示', '确定要提交修改吗？', function () {
            App.showLoading('提交中...');
            var tempObjects = [];
            for(var i=0; i<vue.seriesObjects.length; i++){
                var _oneObject = vue.seriesObjects[i];
                var _temp = {};
                if(_oneObject.object_id){
                    _temp.object_id = _oneObject.object_id;
                }
                if(_oneObject.object_type){
                    _temp.object_type = _oneObject.object_type;
                }
                if(_oneObject.name){
                    _temp.name = _oneObject.name;
                }
                tempObjects.push(_temp);
            }
            App.api('/live_/series/reset_series_sort', {'series_id': seriesId, 'objects': tempObjects}, function (rspData) {
                App.hideLoading(true);
                App.alertSuccess('已保存!');
                initPage();
            }, function (err) {
                App.hideLoading(true);
                App.alertResult(false, '发生错误');
            });
        })
    }

})();