<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\Db;

/**
 * 提现控制器
 */
class Withdraw extends Controller
{
    /**
     * 提现列表
     */
    public function lists()
    {
        // 初始化变量/数组
        $data = $where = [];
        
        // 条件
        $where['l.is_del']    = 0;                      // 未删除状态

        $data = Db::name('withdraw_cash')
                ->alias('wc')
                ->join('users u','wc.uid=u.id','left')
                ->field('wc.*,u.nickname,u.photo')
                ->select();
        $this->assign('data',$data);

        return $this->fetch();
    }

    
    /**
     * 审核
     */
    public function check()
    {
        $id         = input('post.id');
        $state      = input('post.state'); 

        $re = Model('withdraw_cash')->where('id',$id)->update(['state'=>$state]);
        if($re){
            return $this->success('成功');
        }else{
            return $this->error('网络错误');
        }
    }



}
