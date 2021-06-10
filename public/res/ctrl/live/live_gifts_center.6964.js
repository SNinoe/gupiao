
(function(){
    
    var loadItemNums = 0;

    var vue = App.vue({
        el: '#app',
        data: {
            hideToTop: false,
            giftsHasMorn: true,
            giftsList: [],
        },
        created: function() {
            App.loadUserData('/live_/load_data', initPage);
        },
        methods: {

        }
    });

    function initPage() {
        var listUrl = '/live_/ticket_collection/ticket_collection_list';
        App.ctrls.scrollLoader.start({
            url: listUrl,
            limit: 10,
            handler: function(rspData) {
                if(!rspData || rspData.count <= 0){
                    $('#empty-content').show();
                }else {

                    for(var i=0; i<rspData.items.length; i++){
                        var item = rspData.items[i];
                        item['leftCount'] = (parseInt(item['total_count']) - parseInt(item['adopt_count']));
                        item['scale'] = 100*((item.adopt_count/item.total_count).toFixed(2));
                        vue.giftsList.push(item);
                    }
                    loadItemNums = loadItemNums + rspData.items.length;
                    vue.giftsHasMorn = (loadItemNums < rspData.count);
                }
            }
        });
    }

    // function loadLiveInfo(data) {
    //     App.api('/live_/user/live_detail?id='+data.object_id, function(liveData){
    //         data.liveData = liveData;
    //         vue.giftsList.push(data);
    //     }, null, {enableCache:true})
    // }
})();
