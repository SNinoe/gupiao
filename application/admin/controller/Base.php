<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\Db;

/**
 * Base(封装底层继承)控制器
 */
class Base extends Controller
{
    protected $uid     = 0;            // 管理员id
    
    public function __construct()
    {
        parent::__construct();

        // 是否登陆
        Session::get('uid') == null || $this->uid = Session::get('uid');
        if($this->uid <= 0){
            $this->redirect('login/logIn');
        }
        
        // 验证用户权限
        // 

    }


}
