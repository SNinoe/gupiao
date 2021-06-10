<?php

namespace app\index\controller;

use think\Controller;
use think\Db;


class Api extends Controller
{


    public function _initialize()
    {

        parent::_initialize();

    }



    /*  获取临时的文件  */
//$b = "1";
//if($b == "1"){
//$id = "Zary6julqwRBBuSgzFbiMCSjYmG2930UvzjrbnHN4nyT3YGZVD8H-ecfoReGT1Qr";
//$url = "https://api.weixin.qq.com/cgi-bin/media/get?access_token=".token()."&media_id=".$id;
//$arr = downloadWeixinFile($url);
//saveWeixinFile("1.jpg",$arr['body']);
//
//}

    public function tempfile()
    {
        $mid = input('mid');
        $weixin = new Weixin();
        $file_name = $weixin->getTempFile($mid);

        if ($file_name) {
            return json(['code' => 200, 'img' => $file_name]);
        }
        return json(['code' => 404, 'img' => false]);

    }


    public function tempvoice()
    {
        $mid = input('mid');
        $weixin = new Weixin();

        $file_name = $weixin->getTempVoice($mid);
        if ($file_name) {
            return json(['code' => 200, 'url' => $file_name]);
        }
        return json(['code' => 404, 'url' => false]);

    }

    public function voicenotify()
    {

        //获取回调的body信息
        $callbackBody = file_get_contents('php://input');
//        Db::name('config')->where('name','notify')->update(['value'=>$callbackBody]);
        $callbackBody=json_decode($callbackBody,true);
        $input_key=$callbackBody['inputKey'];
        if($callbackBody['code']==0){
            Db::name('live_content')
                ->where('qiniu_key',$callbackBody['inputKey'])
                ->update(['audio_url'=>$callbackBody['items'][0]['key'],'type'=>1]);
        }


        echo json_encode(array('ret' => 'success'));

    }



}
