<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\Db;

/**
 * 年级控制器
 */
class Grade extends Controller
{
    /**
     * 年级列表
     */
    public function lists()
    {
        // 初始化变量/数组
        $data = $where = [];

        // 条件
        $where['is_del']    = 0;                    // 未删除状态

        $model = Model('grade');
        $data = $model->getAll($where);

        $this->assign('data',$data);

        return $this->fetch();
    }

    /**
     * 添加年级
     */
    public function add()
    {
        // 添加
        if(input('post.')){

            $post = input('post.');
            
            // 获取表单上传文件 例如上传了001.jpg
            // $file = request()->file('icon');

            // // 移动到框架应用根目录/public/uploads/ 目录下
            // if($file){
            //     $info = $file->move(ROOT_PATH . 'public' . DS . 'uploads');

            //     if($info){
            //         $post['icon']  = '/uploads/'.$info->getSaveName(); 
            //     }else{
            //         // 上传失败获取错误信息
            //         echo $file->getError();
            //         die;
            //     }
            // }

            // 创建时间
            $post['create_time']   = time();
            $post['update_time']   = time();

            $model = Model('grade');
            $re = $model->insert($post);

            // 关闭弹出层
            echo "<script>
                    var index = parent.layer.getFrameIndex(window.name);
                    parent.layer.close(index);
                </script>";

        }
        return $this->fetch();
    }

    /**
     * 年级编辑
     */
    public function edit()
    {
        if(input('post.')){
            $post = input('post.');

            // 获取表单上传文件 例如上传了001.jpg
            // $file = request()->file('icon');

            // // 移动到框架应用根目录/public/uploads/ 目录下
            // if($file){
            //     $info = $file->move(ROOT_PATH . 'public' . DS . 'uploads');

            //     if($info){
            //         $post['icon']  = '/uploads/'.$info->getSaveName(); 
            //     }else{
            //         // 上传失败获取错误信息
            //         echo $file->getError();
            //         die;
            //     }
            // }

            $post['update_time'] = time(); 

            $model = Model('grade');
            $re = $model->update($post);

            // 关闭弹出层
            echo "<script>
                    var index = parent.layer.getFrameIndex(window.name);
                    parent.layer.close(index);
                </script>";

        }

        // 初始化变量/数组
        $data = $where = [];

        $get = request()->get();

        $where['id']    = $get['id'];

        $model = Model('grade');
        $data = $model->getOne($where);

        $this->assign('data',$data);

        return $this->fetch();

    }

    /**
     * 开启/关闭
     */
    public function onOff()
    {
        $id         = input('post.id');
        $is_show    = input('post.is_show'); 

        $re = Model('grade')->where('id',$id)->update(['is_show'=>$is_show]);
        if($re){
            return $this->success('成功');
        }else{
            return $this->error('网络错误');
        }

    }



}
