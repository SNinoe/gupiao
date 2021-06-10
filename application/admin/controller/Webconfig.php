<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\Db;

/**
 * 网站设置控制器
 */
class Webconfig extends Controller
{
    /**
     * 设置信息
     */
    public function lists()
    {
        
        if(input('post.')){


        	foreach (input('post.') as $key => $value) {
        		Db::name('web_config')->where(['config'=>$key])->update(['value'=>$value]);
        	}

        	// $re = Db::name('web_config')->update(input('post.'));
        }

        $data = Db::name('web_config')->where('is_del',0)->select();
        $this->assign('data',$data);

        return $this->fetch();

    }

    
    



}
