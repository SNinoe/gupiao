<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\Db;

/**
 * banner控制器
 */
class Banner extends Controller
{
    /**
     * banner列表
     */
    public function lists()
    {
        // 初始化变量/数组
        $data = $where = [];

        // 条件
        $where['is_del']    = 0;                    // 未删除状态

        $model = Model('banner');
        $data = $model->getAll($where);

        $this->assign('data',$data);

        return $this->fetch();
    }

    /**
     * banner添加
     */
    public function add()
    {
        // 添加
        if(input('post.')){

            $post = input('post.');
            
            // 获取表单上传文件 例如上传了001.jpg
            $file = request()->file('pic');

            // 移动到框架应用根目录/public/uploads/ 目录下
            if($file){
                $info = $file->move(ROOT_PATH . 'public' . DS . 'uploads');

                if($info){
                    $post['pic']  = '/uploads/'.$info->getSaveName(); 
                }else{
                    // 上传失败获取错误信息
                    echo $file->getError();
                    die;
                }
            }

            // 创建时间
            $post['create_time']   = time();
            $post['update_time']   = time();

            $model = Model('banner');
            $re = $model->insert($post);

            $this->redirect('banner/lists');

        }
        return $this->fetch();
    }

    /**
     * banner 编辑
     */
    public function edit()
    {
        if(input('post.')){
            $post = input('post.');

            // 获取表单上传文件 例如上传了001.jpg
            $file = request()->file('pic');

            // 移动到框架应用根目录/public/uploads/ 目录下
            if($file){
                $info = $file->move(ROOT_PATH . 'public' . DS . 'uploads');

                if($info){
                    $post['pic']  = '/uploads/'.$info->getSaveName(); 
                }else{
                    // 上传失败获取错误信息
                    echo $file->getError();
                    die;
                }
            }

            $model = Model('banner');
            $re = $model->update($post);

            $this->redirect('banner/lists');

        }

        // 初始化变量/数组
        $data = $where = [];

        $get = request()->get();

        $where['id']    = $get['id'];

        $model = Model('banner');
        $data = $model->getOne($where);

        $this->assign('data',$data);

        return $this->fetch();

    }

    /**
     * 开启/关闭
     */
    public function onOff()
    {
        $id         = input('get.id');
        $is_show    = input('get.is_show'); 

        $re = Model('banner')->where('id',$id)->update(['is_show'=>$is_show]);
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
     * 删除
     */
    public function del()
    {
        $id     = input('get.id');
        if($id<1){
            return json([
                    'msg'       => '缺少ID',
                    'status'    => 400
                ]);
        }

        $re = Model('banner')->where('id',$id)->update(['is_del'=>1]);
        if($re){
            return json([
                    'msg'       => '已删除成功',
                    'status'    => 200

                ]);
        }else{
            return json([
                    'msg'       => '网络错误',
                    'status'    => 400
                ]);
        }

    }



}
