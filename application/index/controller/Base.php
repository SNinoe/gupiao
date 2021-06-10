<?php

namespace app\index\controller;

use think\Controller;
use think\Session;
use think\Db;


class Base extends Controller
{
    protected $uid      = 0;                // 用户id（session缓存）
    protected $photo    = '';
    protected $limit    = 10;               // 默认查询数据个数

    public function _initialize(){
        // 测试数据
//        Session::set('uid',1);
//        Session::set('openid','o11iD1ADedzH1MuElVEpVTrQTNZw');

        parent::_initialize();

        $this->photo = Session::get('photo');

        // 如果未授权，请求代理授权地址
        $this->uid = Session::get('uid');
        if($this->uid <= 0){
            $this->redirect('Wauth/request');
        }

    }



}
