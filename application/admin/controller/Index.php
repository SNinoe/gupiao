<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\captcha\Captcha;

class Index extends Base
{
	/**
	 * 首页
	 * @return [type] [description]
	 */
    public function index()
    {
        $this->assign('uid',Session::get('uid'));
        $this->assign('username',Session::get('username'));
        $this->assign('name',Session::get('name'));

        return $this->fetch();
    }

    /**
     * 首页welcome页
     */
    public function welcome()
    {
        $info = array(
            'a'=>PHP_OS,                                                                        // 操作系统
            'c'=>$_SERVER['SERVER_NAME'],                                                       // 域名
            'd'=>$_SERVER['SERVER_PORT'],                                                       // 端口号
            'e'=>$_SERVER["DOCUMENT_ROOT"],                                                     // 根目录
            'i'=>THINK_VERSION,                                                                 // 框架版本
            'l'=>date("Y年n月j日 H:i:s"),                                                       // 当前时间
            'm'=>gmdate("Y年n月j日 H:i:s",time()+8*3600),                                       // 当前时间
            'n'=>$_SERVER['SERVER_NAME'].' [ '.gethostbyname($_SERVER['SERVER_NAME']).' ]',     // 域名（IP）
            'o'=>$_SERVER['REMOTE_ADDR'],                                                       // ip
            'p'=>round((disk_free_space(".")/(1024*1024)),2).'M',                               // 内存
        );
        $this->assign('info',$info);

        $u_info     = Model('manager')->getOne(['id'=>Session::get('uid')]);
        $this->assign('u_info',$u_info);

        return $this->fetch();
    }

}
