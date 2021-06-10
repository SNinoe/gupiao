<?php

namespace app\index\controller;

use app\common\controller\Frontend;
use think\Db;

class Token extends Frontend
{

    protected $layout = '';

    public function _initialize()
    {
        parent::_initialize();
    }

    public function msg()
    {
        $weixin = new Weixin();
        $weixin->sentMsg('oD-lzwFI3SL4Ci32zaDgpDxSRhVY', '');

    }


    public function index()
    {
        $type = input('type');
        if ($type == 'access_token') {
            //7200
            $weixin = new Weixin();
//
//            $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={$weixin->appid}&secret={$weixin->appsecret}";
//            $res = $weixin->https_request($url);
//            $res = json_decode($res, true);
//
//            try {
//                if ($res['access_token']) {
//                    $update = [];
//                    $update['value'] = $res['access_token'];
//                    $update['extend'] = time() + 7000;
//                    $rt = Db::name('config')->where('name', 'access_token')->update($update);
//                    return $res['access_token'];
//                }
//            } catch (Exception $exception) {
//
//            }
//            return;



            $row = Db::name('config')->where('name', 'access_token')->find();

            if ($row['value'] && $row['extend'] > time()) {
                return $row['value'];
            } else {
                $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={$weixin->appid}&secret={$weixin->appsecret}";
                $res = $weixin->https_request($url);
                $res = json_decode($res, true);

                try {
                    if ($res['access_token']) {
                        $update = [];
                        $update['value'] = $res['access_token'];
                        $update['extend'] = time() + 7000;
                        $rt = Db::name('config')->where('name', 'access_token')->update($update);
                        return $res['access_token'];
                    }
                } catch (Exception $exception) {

                }

            }
        }
    }


}
