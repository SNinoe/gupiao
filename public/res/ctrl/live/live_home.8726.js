(function(){var vue=null;var scrollLoader=null;var pageStorage={};var allLoadingTypes=[];var isPc=App.utils.isPC();var listScroll=null;var SOURCE_BANNER='live_main_banner';var SOURCE_DAILY='live_main_daily';var SOURCE_TAG='live_main_tag';var SOURCE_ABOUT_TO='live_main_about_to';var SOURCE_ALL='live_main_all';var vueInitData={hideToTop:'',bannerItems:[],allAboutToItems:[],aboutToItems:[],dailyItems:[],indexTagItems:[],featuredItems:[],featuredHasMore:true,allItems:[],allHasMore:true,TYPE_LIVE:10,TYPE_SERIES:6,searchModel:false,searchKeyword:'',userTagIds:[],normalTagIds:[],allTags:{},selectTagId:0,subscribeModel:false,scrollUrl:'',suggestWords:[],fixedSubscribe:false,showHotword:true,popupAdData:null,MAX_FEATURED:5,SOURCE_BANNER:SOURCE_BANNER,SOURCE_DAILY:SOURCE_DAILY,SOURCE_TAG:SOURCE_TAG,SOURCE_ABOUT_TO:SOURCE_ABOUT_TO,SOURCE_ALL:SOURCE_ALL};var scrollOptions={url:'/live_/info/index_query',limit:10,handler:function(rspData){if(!!rspData){vue.allItems=vue.allItems.concat(rspData.items);}},finishCallback:function(){vue.allHasMore=false;}};function checkPopupAd(){App.api('/live_/info/popup_ad',function(rspData){var record=window.localStorage.getItem('popupAdRecord.'+rspData.id);if(!record){vue.popupAdData=rspData;}})}
function hidePopupAd(){if(vue.popupAdData){window.localStorage.setItem('popupAdRecord.'+vue.popupAdData.id,'1');}
vue.popupAdData=null;}
function loadBanners(){var url='/live_/info/banner_query';App.api(url,function(rspData){vue.bannerItems=rspData.items;Vue.nextTick(function(){_initFlickity();});hideLoading('banner');});}
function loadAboutTo(){App.api('/live_/info/about_to_query?limit=30',function(rspData){vue.allAboutToItems=rspData.items;if(vue.allAboutToItems.length>3){vue.aboutToItems=vue.allAboutToItems.slice(0,3);}else{vue.aboutToItems=vue.allAboutToItems;}
hideLoading('aboutTo');})}
function _initFlickity(){var flkty=new Flickity('.main-carousel',{cellAlign:'left',contain:true,accessibility:true,wrapAround:true,groupCells:1,autoPlay:3000,prevNextButtons:isPc,adaptiveHeight:true});}
function loadTags(){App.api('/live_/info/tag_query',function(rspData){for(var i=0;i<rspData.items.length;i++){var oneItem=rspData.items[i];vue.allTags[oneItem.id]=oneItem;}
hideLoading('tags');App.api('/live_/user/user_tag_ids',function(rspData){vue.userTagIds=rspData;for(var _key in vue.allTags){var _oneItem=vue.allTags[_key];if(vue.userTagIds.indexOf(_oneItem.id)<0){vue.normalTagIds.push(_oneItem.id);}}
Vue.nextTick(function(){listScroll=new BScroll(document.getElementById('control-wrapper'),{scrollY:false,scrollX:true,click:!isPc});})});});}
function loadFeatures(){App.api('/live_/featured/query?limit='+vue.MAX_FEATURED,function(rspData){vue.featuredItems=rspData.items;vue.featuredHasMore=rspData.count>vue.MAX_FEATURED;})}
function hideLoading(hideType){if(!hideType){$('#page-loading').hide();}
var _index=allLoadingTypes.indexOf(hideType);if(_index>=0){allLoadingTypes=allLoadingTypes.slice(0,_index).concat(allLoadingTypes.slice(_index+1));}
if(allLoadingTypes.length<=0){$('#page-loading').hide();}}
function initPageData(){if(!!vue.scrollUrl){pageStorage.scroll.url=vue.scrollUrl;}
scrollLoader=App.ctrls.scrollLoader.start(pageStorage.scroll);if(!pageStorage.storage){allLoadingTypes=['banner','aboutTo','tags'];loadBanners();loadAboutTo();loadTags();loadFeatures();checkPopupAd();}else{$('body').scrollTop(pageStorage.scrollTop);setTimeout(hideLoading,300);}}
function fixUrlSource(url,source){if(!source){source='live_main';}
return App.utils.fixUrlSource(url,source);}
function subscribeTag(tagId){if(vue.userTagIds.indexOf(tagId)<0){vue.userTagIds.push(tagId);}
var normalIndex=vue.normalTagIds.indexOf(tagId);if(normalIndex>=0){vue.normalTagIds.splice(normalIndex,1);}}
function unSubscribeTag(tagId){if(vue.normalTagIds.indexOf(tagId)<0){vue.normalTagIds.push(tagId);}
var userIndex=vue.userTagIds.indexOf(tagId);if(userIndex>=0){vue.userTagIds.splice(userIndex,1);}}
function submitUserTags(){App.api('/live_/user/submit_user_tags',{'tag_ids':vue.userTagIds},function(rspData){listScroll.refresh();});}
function changeTag(tagId){vue.selectTagId=tagId;vue.allItems=[];scrollLoader.pause();vue.$nextTick(function(){vue.allHasMore=true;scrollOptions.url=vue.selectTagId>0?('/live_/info/tag_live_query?tag_id='+vue.selectTagId):'/live_/info/index_query';scrollLoader=App.ctrls.scrollLoader.start(scrollOptions);});var featuredUrl='/live_/featured/query?limit='+vue.MAX_FEATURED;if(tagId&&parseInt(tagId)>0){featuredUrl=featuredUrl+'&tag_id='+tagId;}
App.api(featuredUrl,function(rspData){vue.featuredItems=rspData.items;vue.featuredHasMore=rspData.count>vue.MAX_FEATURED;})}
function showSearchModel(){vue.searchModel=true;vue.$nextTick(function(){$('#search-form').focus();});}
function chooseKeyword(word){vue.searchKeyword=word;window.location.href='/live/search?kw='+encodeURIComponent(vue.searchKeyword);}
function clearKeyword(){vue.searchKeyword='';$('#search-form').focus();}
function search(){if(!vue.searchKeyword)
alert('请输入搜索关键词！');else{location='/live/search?kw='+encodeURIComponent(vue.searchKeyword);}
return false;}
function modelMethod(){if(vue.searchModel||vue.subscribeModel){$('html, body').css({'height':'100%','position':'fixed','overflow':'hidden'});}
else{$('html, body').removeAttr('style');}}
$(document).ready(function(){pageStorage=slResumeTools.resumePage(vueInitData,scrollOptions);vue=App.vue({el:'#app',data:pageStorage.vue,methods:{beautyTimeStr:BeautyTools.beautyTimeStr,beautyPrice:BeautyTools.beautyPrice,countLeftHours:BeautyTools.countLeftHours,fixUrlSource:fixUrlSource,unSubscribeTag:unSubscribeTag,subscribeTag:subscribeTag,submitUserTags:submitUserTags,changeTag:changeTag,showSearchModel:showSearchModel,savePageStorage:function(url,source){url=fixUrlSource(url,source);return slResumeTools.jumpPage(url,vue.$data,scrollLoader);},updateSuggestWords:function(){if(!vue.searchKeyword){vue.suggestWords=[];return;}
App.api('search/suggest_words?kw='+encodeURIComponent(vue.searchKeyword),function(rspData){console.log(rspData);vue.suggestWords=rspData.items;});},fixedSubscribeTop:function(){var subscribeOffsetTop=this.$refs.homeSubscribeBar.offsetTop;document.body.scrollTop>=subscribeOffsetTop?this.fixedSubscribe=true:this.fixedSubscribe=false;},modelMethod:modelMethod,chooseKeyword:chooseKeyword,clearKeyword:clearKeyword,search:search,hidePopupAd:hidePopupAd},created:function(){Vue.nextTick(initPageData);},mounted:function(){window.addEventListener('scroll',this.fixedSubscribeTop);},watch:{searchModel:'modelMethod',subscribeModel:'modelMethod'}});});})();