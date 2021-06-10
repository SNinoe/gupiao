<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\Db;

/**
 * 直播控制器
 */
class Lives extends Controller
{
    /**
     * 直播列表
     */
    public function lists()
    {
        // 初始化变量/数组
        $data = $where = [];
        
        // 条件
        $where['l.is_del']    = 0;                      // 未删除状态

        $data = Db::table('zb_lives')
                ->alias('l')
                ->join('zb_classify c','l.classify = c.id','left')
                ->join('zb_grade g','l.grade = g.id','left')
                ->field('l.* , c.name as cname , g.name as gname')
                ->where($where)
                ->select();

        $this->assign('data',$data);

        return $this->fetch();
    }

    /**
     * 推荐 / 取消
     */
    public function recomment()
    {
        $id         = input('post.id');
        $is_recomm  = input('post.is_recomm'); 

        $re = Model('lives')->where('id',$id)->update(['is_recomm'=>$is_recomm]);
        if($re){
            return $this->success('成功');
        }else{
            return $this->error('网络错误');
        }

    }

    /**
     * 开启/关闭
     */
    public function onOff()
    {
        $id         = input('post.id');
        $is_show    = input('post.is_show'); 

        $re = Model('lives')->where('id',$id)->update(['is_show'=>$is_show]);
        if($re){
            return $this->success('成功');
        }else{
            return $this->error('网络错误');
        }

    }

    /**
     * 删除
     */
    public function del()
    {
        $id     = input('post.id');
        if($id<1){
            return $this->error('缺少ID');
        }

        $re = Model('lives')->where('id',$id)->update(['is_del'=>1]);
        if($re){
            return $this->success('删除成功');
        }else{
            return $this->error('网络错误');
        }

    }



}
