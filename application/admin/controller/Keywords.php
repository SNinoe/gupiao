<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\Db;

/**
 * 关键字控制器
 */
class Keywords extends Controller
{
    /**
     * 关键字列表
     */
    public function lists()
    {
        $data = Db::name('keywords')->select();
        $this->assign('data',$data);

        return $this->fetch();

    }

    public function add()
    {
        if(input('post.')){
            $params['keyword']      = input('keyword');
            $params['search_count'] = input('search_count',0);
            $params['sort']         = input('sort',0);
            $params['is_show']      = input('is_show',1);
            $params['is_recomm']    = input('is_recomm',0);
            $params['create_time']  = time();
            $params['update_time']  = time();

            Db::name('keywords')->insert($params);

        }

        return $this->fetch();
    }

    /**
     * 开启/关闭
     */
    public function onOff()
    {
        $id         = input('post.id');
        $is_show    = input('post.is_show'); 

        $re = Db::name('keywords')->where('id',$id)->update(['is_show'=>$is_show]);
        if($re){
            return $this->success('成功');
        }else{
            return $this->error('网络错误');
        }

    }
    
    /**
     * 推荐/未推荐
     */
    public function is_recomm()
    {
        $id         = input('post.id');
        $is_recomm    = input('post.is_recomm'); 

        $re = Db::name('keywords')->where('id',$id)->update(['is_recomm'=>$is_recomm]);
        if($re){
            return $this->success('成功');
        }else{
            return $this->error('网络错误');
        }

    }



}
