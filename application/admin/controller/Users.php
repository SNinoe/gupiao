<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\Db;

/**
 * 会员控制器
 */
class Users extends Controller
{
    /**
     * 会员列表
     */
    public function lists()
    {
        // 初始化变量/数组
        $data = $where = [];

        $model = Model('Users');
        $data = $model->getAll();

        $this->assign('data',$data);

        return $this->fetch();
    }

    /**
     * 认证申请列表
     */
    public function attList()
    {
        // 初始化变量/数组
        $data = $where = [];

        // 条件
        $where['attest']    = 1;                // 申请认证状态
        $where['is_del']    = 0;                // 未封号状态

        $model = Model('Users');
        $data = $model->getAll($where);

        $this->assign('data',$data);

        return $this->fetch();
    }

    /**
     * 认证通过
     */
    public function attPass()
    {
        $id     = input('get.id');

        $re = Model('users')->where('id',$id)->update(['attest'=>2]);
        if($re){
            return json([
                    'msg'       => '成功',
                    'status'    => 200

                ]);
        }else{
            return json([
                    'msg'       => '网络错误',
                    'status'    => 400
                ]);
        }
    }

    /**
     * 认证失败
     */
    public function attFalse()
    {
        $id = input('get.id');

        if(input('post.')){
            $params['att_desc']     = input('post.att_desc');
            $params['attest']       = -1;

            $re = Model('Users')->where('id',$id)->update($params);

            // 关闭弹出层
            echo "<script>
                    var index = parent.layer.getFrameIndex(window.name);
                    parent.layer.close(index);
                </script>";
        }

        $this->assign('id',$id);

        return $this->fetch();
    }

    /**
     * 开启/关闭
     */
    public function onOff()
    {
        $id         = input('post.id');
        $is_del     = input('post.is_del'); 

        $re = Model('users')->where('id',$id)->update(['is_del'=>$is_del]);
        if($re){
            return $this->success('成功');
        }else{
            return $this->error('网络错误');
        }

    }



}
