<?php

namespace app\index\controller;

use think\Controller;
use think\Db;
use think\Session;

/**
 * 请求代理服务器获取微信用户信息
 */
class Wauth extends Controller
{
    /**
     * 请求
     * @return [type] [description]
     */
    public function request()
    {
        $request = request();

        // 请求代理地址
        $request_url    = "http://shop.maliangss.com/addons/wx_agency/request_info.php";

        // 本人回调地址参数 -- 重要
        $params['call_back'] = $request->domain().'/index/Wauth/getOk';
        
        // 生成 url-encoded 之后的请求字符串 
        $newArr = http_build_query($params);
        
        // 请求代理授权
        header('Location:'.$request_url.'?'.$newArr);
        // die;

    }

    /**
     * 获取
     * @return [type] [description]
     */
    public function getOk()
    {
        // 获取到用户信息并做数据类型转换
        $userInfo = json_decode($_GET['info']);

        // 验证用户是否存在
        $u_info = Db::name('users')
                ->where('openid',$userInfo->openid)
                ->find();

        if(!empty($u_info) && isset($u_info)){

            // 写入缓存
            Session::set('openid',$userInfo->openid);
            Session::set('uid',$u_info['id']);
            Session::set('photo',$u_info['photo']);

            $this->uid = $u_info['id'];

        }else{
            $params['nickname']     = $userInfo->nickname;          // 微信昵称
            $params['openid']       = $userInfo->openid;            // openid
            $params['photo']        = $userInfo->headimgurl;        // 头像
            $params['sex']          = $userInfo->sex;               // 性别 1男士 2女士
            $params['create_time']  = time();
            $params['update_time']  = time();

            $in_id = Db::name('users')->insertGetId($params);

            Session::set('openid',$userInfo->openid);
            Session::set('uid',$in_id);
            Session::set('photo',$params['photo']);

            $this->uid = $in_id;
        }

        $this->redirect('index/index');
    }

    /**
     * 模拟登陆
     * @return [type] [description]
     */
    public function login()
    {
        Session::set('openid','o11iD1ADedzH1MuElVEpVTrQTNZw');
        Session::set('uid',1);
        Session::set('photo','http://wx.qlogo.cn/mmopen/vi_32/OqpUmPBhyzT2hRicDR2klbt4A3RYcQlAiaiaRrjqQ6gJ2kljJNuPL46ovKxYQweBXLr10RmdG9G28ASUtlYIfeiacA/132');

        $this->success('模拟登陆成功~',url('index/index'));
    }


}
