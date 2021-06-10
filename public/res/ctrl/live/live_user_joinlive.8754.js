(function(){MOD_LIVE='live';MOD_LESSON='lesson';MOD_FEATURED='featured';var currentMod=App.utils.urlParam('mod');if(!currentMod){currentMod='live';}
var oriUrl='/live/user/joinlive';var vue=App.vue({el:'#app',data:{hideToTop:false,currentShowMod:currentMod,MOD_LIVE:MOD_LIVE,MOD_LESSON:MOD_LESSON,MOD_FEATURED:MOD_FEATURED,joinSeries:null,isLoadingSeries:false,seriesHasMore:true,joinLives:null,isLoadingLives:false,liveHasMore:true,joinFeatures:null,isLoadingFeatures:false,featuredHasMore:true,joinLessons:null,isVip:false,},created:function(){this.$nextTick(function(){loadLives();loadSeries(3);loadFeatures();loadLessons();});},methods:{beautyTimeStr:BeautyTools.beautyTimeStr,beautyPrice:BeautyTools.beautyPrice,countLeftHours:BeautyTools.countLeftHours,loadLives:loadLives,loadSeries:loadSeries,loadFeatures:loadFeatures,changeMod:changeMod,getLessonHotCover:getLessonHotCover,}});function changeMod(newMod){vue.currentShowMod=newMod;window.history.replaceState(null,null,App.utils.addParam(oriUrl,'mod',newMod));}
function loadLives(){var limit=10;var offset=vue.joinLives==null?0:vue.joinLives.length;var url=App.utils.buildUrl('/live_/user/join_lives',{'offset':offset,'limit':limit});vue.isLoadingLives=true;App.api(url,function(rspData){vue.isLoadingLives=false;if(vue.joinLives==null){vue.joinLives=[];}
for(var i=0;i<rspData.items.length;i++){var item=rspData.items[i];if(item&&item.id){vue.joinLives.push(rspData.items[i]);}}
vue.liveHasMore=rspData.items.length>0&&rspData.count>vue.joinLives.length;},function(){vue.isLoadingLives=false;})}
function loadSeries(limit){if(!limit){limit=10;}
var offset=vue.joinSeries==null?0:vue.joinSeries.length;var url=App.utils.buildUrl('/live_/user/join_series',{'offset':offset,'limit':limit});vue.isLoadingSeries=true;App.api(url,function(rspData){vue.isLoadingSeries=false;if(vue.joinSeries==null){vue.joinSeries=[];}
for(var i=0;i<rspData.items.length;i++){vue.joinSeries.push(rspData.items[i]);}
vue.seriesHasMore=rspData.items.length>0&&rspData.count>vue.joinSeries.length;},function(){vue.isLoadingSeries=false;})}
function loadFeatures(){var limit=10;var offset=vue.joinFeatures==null?0:vue.joinFeatures.length;var url=App.utils.buildUrl('/live_/user/join_features',{'offset':offset,'limit':limit});vue.isLoadingFeatures=true;App.api(url,function(rspData){vue.isLoadingFeatures=false;if(vue.joinFeatures==null){vue.joinFeatures=[];}
for(var i=0;i<rspData.items.length;i++){vue.joinFeatures.push(rspData.items[i]);}
vue.featuredHasMore=rspData.items.length>0&&rspData.count>vue.joinFeatures.length;},function(){vue.isLoadingFeatures=false;})}
function loadLessons(){App.api('/lesson/bought_list',function(rspData){vue.joinLessons=rspData.items;});}
function getLessonHotCover(item){var coverImgUrl=$('.lesson-config-cover-'+item.id).val();if(!coverImgUrl){coverImgUrl=item.cover_image;}
return coverImgUrl}
App.api('user/vip_info',function(rspData){vue.isVip=rspData.id?true:false;});})();