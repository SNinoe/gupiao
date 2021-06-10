<?php
/**
 * 微信SDK
 * pan041ymail@gmail.com
 */

namespace app\index\controller;

vendor('qiniu.autoload');
use Qiniu\Auth;
use Qiniu\Storage\BucketManager;
use Qiniu\Processing\PersistentFop;


use think\Db;
use think\Exception;

class Weixin
{
    public $appid = "";
    public $appsecret = "";
    public $access_token = "";

    //构造函数
    public function __construct($appid = NULL, $appsecret = NULL)
    {

        $wxConfig = config('weixin');
        $this->appsecret = $wxConfig['appsecret'];
        $this->appid = $wxConfig['appid'];
        if ($appid) {
            $this->appid = $appid;
        }
        if ($appsecret) {
            $this->appsecret = $appsecret;
        }

    }

    /**
     *          "touser":"OPENID",
     * "template_id":"ngqIpbwh8bUfcSsECmogfXcV14J0tQlEpBO27izEYtY",
     * "url":"http://weixin.qq.com/download",
     * "miniprogram":{
     * "appid":"xiaochengxuappid12345",
     * "pagepath":"index?foo=bar"
     * },
     * "data":{
     * "first": {
     * "value":"恭喜你购买成功！",
     * "color":"#173177"
     * },
     * "keynote1":{
     * "value":"巧克力",
     * "color":"#173177"
     * },
     * "keynote2": {
     * "value":"39.8元",
     * "color":"#173177"
     * },
     * "keynote3": {
     * "value":"2014年9月22日",
     * "color":"#173177"
     * },
     * "remark":{
     * "value":"欢迎再次购买！",
     * "color":"#173177"
     * }
     * }
     *
     * {{first.DATA}}
     *
     * 提交时间：{{tradeDateTime.DATA}}
     * 订单类型：{{orderType.DATA}}
     * 客户信息：{{customerInfo.DATA}}
     * {{orderItemName.DATA}}：{{orderItemData.DATA}}
     * {{remark.DATA}}
     *
     */

    public function sentMsg($open_id, $url = '', $cu_name = '订单成功了')
    {
        $access_token = $this->getAccessToken();
        dump($access_token);

        $api = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token={$access_token}";
        $data['touser'] = $open_id;
        $data['template_id'] = 'Y1PIq-V8l2Evb68Iu5bkPV59rATA4FDdA55YOtSb5ic';
        $data['url'] = request()->domain() . $url;
        $data_arr = [];
        $data_arr['first'] = ['value' => '收到了一条新的订单', 'color' => '#173177'];
        $data_arr['tradeDateTime'] = ['value' => date('Y-m-d H:i:s', time()), 'color' => '#173177'];
        $data_arr['orderType'] = ['value' => '商家订单', 'color' => '#173177'];
        $data_arr['customerInfo'] = ['value' => $cu_name, 'color' => '#173177'];
        $data_arr['remark'] = ['value' => '感谢使用', 'color' => '#173177'];
        $data['data'] = $data_arr;
        $data = json_encode($data);
        dump($data);
        $res = $this->https_request($api, $data);
        $res = json_decode($res, true);
        if ($res['errcode'] != 0) {
            session('access_token', false);
        }

        return $res;

    }


    public function getAccessToken()
    {

//        $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={$this->appid}&secret={$this->appsecret}";
//        $res = $this->https_request($url);
//        $res = json_decode($res, true);
//        dump($res);die;

        $token = false;
        $acc_token = Db::name('config')->where('name', 'access_token')->find();
        if ($acc_token && $acc_token['extend'] > time()) {
            $token = $acc_token['value'];
        } else {
            $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={$this->appid}&secret={$this->appsecret}";
            $res = $this->https_request($url);
            $res = json_decode($res, true);
//            dump($res);

            try {
                if ($res['access_token']) {
                    $update = [];
                    $update['value'] = $res['access_token'];
                    $update['extend'] = time() + 7000;
                    Db::name('config')->where('name', 'access_token')->update($update);
                    $token = $res['access_token'];
                }
            } catch (Exception $exception) {

            }
        }
        return $token;

    }

    public function getTicket()
    {

        $this->access_token = $this->getAccessToken();
        if (!$this->access_token) {
            echo 'access_token error';
            die;
        }
        $jsapi_ticket = false;
        $ticket = Db::name('config')->where('name', 'ticket')->find();

        if ($ticket && $ticket['extend'] > time()) {
            $jsapi_ticket = $ticket['value'];
        } else {

            $tick_url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=$this->access_token&type=jsapi";
            $res = $this->https_request($tick_url);
            //  {
            //  "errcode":0,
            //"errmsg":"ok",
            //"ticket":"bxLdikRXVbTPdHSM05e5u5sUoXNKd8-41ZO3MhKoyN5OfkWITDGgnr2fwJ0m9E8NYzWKVZvdVtaUgWvsdshFKA",
            //"expires_in":7200
            //}
            //获取JS_TICKET
            $res = json_decode($res, true);
            try {
                if ($res['errmsg'] == 0) {
                    $update = [];
                    $update['value'] = $res['ticket'];
                    $update['extend'] = time() + 7000;
//                    session('ticket', $update);
                    Db::name('config')->where('name', 'ticket')->update($update);
                    $jsapi_ticket = $res['ticket'];
                }
            } catch (Exception $exception) {


            }
        }
        return $jsapi_ticket;

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


    public function getTempVoice($id)
    {
        $this->access_token = $this->getAccessToken();
        $url = "https://api.weixin.qq.com/cgi-bin/media/get?access_token=" . $this->access_token . "&media_id=" . $id;
        //使用七牛抓取
        $qnConfig = config('qiniu');
        $accessKey = $qnConfig['ak'];
        $secretKey = $qnConfig['sk'];
        $bucket = $qnConfig['bk'];

        $auth = new Auth($accessKey, $secretKey);
        $bucketManager = new BucketManager($auth);

        $key_name=date('Ymd',time()).'/'.$id;
        $key = $key_name. '.amr';

// 指定抓取的文件保存名称
        list($err) = $bucketManager->fetch($url, $bucket, $key);
//        echo "=====> fetch $url to bucket: $bucket  key: $key\n";
        if ($err !== null) {
//            var_dump($err);
            //转码
//            $auth = new Auth($accessKey, $secretKey);

//要转码的文件所在的空间和文件名。
//            $key = $key;

//转码是使用的队列名称。 https://portal.qiniu.com/mps/pipeline
            $pipeline = 'qimeng';

//转码完成后通知到你的业务服务器。
//            $notifyUrl = 'http://375dec79.ngrok.com/notify.php';
//            $notifyUrl = url('index/api/voicenotify');
//            $notifyUrl = 'http://wx007.imwork.net/index/api/voicenotify';
            $notifyUrl = request()->domain().'/index/api/voicenotify';
            $force = false;

            $config = new \Qiniu\Config();
            $config->useHTTPS = true;
            $pfop = new PersistentFop($auth, $config);

//要进行视频截图操作

            $fops = "avthumb/mp3/ab/128k/ar/44100/acodec/libmp3lame|saveas/" .
                \Qiniu\base64_urlSafeEncode($bucket . ":$key_name.mp3");

            list($id, $err2) = $pfop->execute($bucket, $key, $fops, $pipeline, $notifyUrl, $force);
//            echo "\n====> pfop avthumb result: \n";
//            if ($err != null) {
//                var_dump($err);
//            } else {
//                echo "PersistentFop Id: $id\n";
//            }
//
////查询转码的进度和状态
//            list($ret, $err) = $pfop->status($id);
//            echo "\n====> pfop avthumb status: \n";
//            if ($err != null) {
//                var_dump($err);
//            } else {
//                var_dump($ret);
//            }




            return $err['key'];
        } else {
//            print_r($ret);
            return false;
        }


//// 不指定key时，以文件内容的hash作为文件名
//        $key = null;
//        list($ret, $err) = $bucketManager->fetch($url, $bucket, $key);
//        echo "=====> fetch $url to bucket: $bucket  key: $(etag)\n";
//        if ($err !== null) {
//            var_dump($err);
//        } else {
//            print_r($ret);
//        }




        $arr = $this->downloadWeixinFile($url);
        $file_name = time() . rand(0000, 9999) . '.amr';
        return $this->saveWeixinFile($file_name, $arr['body']);

    }


    public function getTempFile($id)
    {

        $this->access_token = $this->getAccessToken();
        $url = "https://api.weixin.qq.com/cgi-bin/media/get?access_token=" . $this->access_token . "&media_id=" . $id;
        //使用七牛抓取
        $qnConfig = config('qiniu');
        $accessKey = $qnConfig['ak'];
        $secretKey = $qnConfig['sk'];
        $bucket = $qnConfig['bk'];
//        $domain = $qnConfig['domain'];


        $auth = new Auth($accessKey, $secretKey);
        $bucketManager = new BucketManager($auth);


        $key = date('Ymd',time()).'/'.$id. '.jpg';

// 指定抓取的文件保存名称
        list($err) = $bucketManager->fetch($url, $bucket, $key);
//        echo "=====> fetch $url to bucket: $bucket  key: $key\n";
        if ($err !== null) {
//            var_dump($err);
//            return $domain.$err['key'];
            return $err['key'];
        } else {
//            print_r($ret);
            return false;
        }




        $arr = $this->downloadWeixinFile($url);

        return $this->saveWeixinFile2($arr['body']);

    }


    public function downloadWeixinFile($url)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_NOBODY, 0);    //只取body头
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $package = curl_exec($ch);
        $httpinfo = curl_getinfo($ch);
        curl_close($ch);
        $imageAll = array_merge(array('header' => $httpinfo), array('body' => $package));
        return $imageAll;
    }


    public function saveWeixinFile2($filecontent)
    {

        $filename2=$filename = time() . rand(0000, 9999) . '.jpg';
        //动态的创建一个文件夹
        $path = date('Ymd');
        $save_path = $_SERVER['DOCUMENT_ROOT'] . "/live/" . $path;
        //判断该文件夹是否已经有这个文件夹
        if (!file_exists($save_path)) {
            mkdir($save_path);
        }
        $filename=$save_path . '/' . $filename;



        try {

            $local_file = fopen($filename, 'w');
            if (false !== $local_file) {
                if (false !== fwrite($local_file, $filecontent)) {
                    fclose($local_file);
                }
            }

            return '/live/' . $path . '/' . $filename2;
        } catch (Exception $exception) {

            return false;
        }


        return false;


    }




    public function js_config($url)
    {

        $jsapi_ticket = $this->getTicket();
        if (!$jsapi_ticket) {
            echo 'ticket error';
            die;
        }
        //noncestr=Wm3WZYTPz0wzccnW
        //jsapi_ticket=sM4AOVdWfPE4DxkXGEs8VMCPGGVi4C3VM0P37wVUCFvkVAy_90u5h9nbSlYy3-Sl-HhTdfl2fzFy1AOcHKP7qg
        //timestamp=1414587457
        //url=http://mp.weixin.qq.com?params=value
        $noncestr = "Wm3WZYTPz0wz" . rand(0000, 9999);
        $timestamp = time();

        $sha1_str = "jsapi_ticket=$jsapi_ticket&noncestr=$noncestr&timestamp=$timestamp&url=$url";
        $signature = sha1($sha1_str);

        $config = [];
        $config['timestamp'] = $timestamp;
        $config['noncestr'] = $noncestr;
        $config['signature'] = $signature;
        $config['appId'] = $this->appid;

        return $config;


    }


//获取用户基本信息
    public function get_user_info($openid)
    {
        $this->access_token = $this->getAccessToken();
        $url = "https://api.weixin.qq.com/cgi-bin/user/info?access_token=" . $this->access_token . "&openid=" . $openid . "&lang=zh_CN";
        $res = $this->https_request($url);
        return json_decode($res, true);
    }

//https请求
    public function https_request($url, $data = null)
    {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE);
        if (!empty($data)) {
            curl_setopt($curl, CURLOPT_POST, 1);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
        }
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        $output = curl_exec($curl);
        curl_close($curl);
        return $output;
    }
}