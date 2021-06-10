<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\Db;

/**
 * 管理员控制器
 */
class Manager extends Base
{
    /**
     * 管理员列表
     */
    public function lists()
    {
        // 初始化变量/数组
        $data = $where = [];

        $model = Model('manager');
        $data = $model->getAll($where);

        $this->assign('data',$data);

        return $this->fetch();
    }

    /**
     * 管理员信息
     */
    public function info()
    {
        // 初始化变量/数组
        $data = $where = [];

        $get = request()->get();

        $where['id']    = $get['id'];

        $model = Model('manager');
        $data = $model->getOne($where);

        $this->assign('data',$data);

        return $this->fetch();

    }

    /**
     * 管理员添加
     */
    public function add()
    {
        // 添加
        if(input('post.')){
            $post = input('post.');

        }
        return $this->fetch();
    }

    /**
     * 修改管理员密码
     */
    public function changePwd()
    {
        if(request()->post()){

            $post = request()->post();

            if($post['uid']<=0){
                return "参数有误";
            }

            if($post['newpassword'] != $post['okpassword'] || $post['newpassword'] == null){
                return "请输入正确的密码";
            }

            // 更新数据
            $model = Model('manager');
            $re = $model->where('id',$post['uid'])->update(['password'=>md5($post['newpassword']),'update_time'=>time()]);
            if($re){
                // 关闭弹出层
                echo "<script>
                        var index = parent.layer.getFrameIndex(window.name);
                        parent.layer.close(index);
                    </script>";
            }
                
        }
            
        $this->assign('uid', Session::get('uid'));
        
        return $this->fetch();

    }   



}
