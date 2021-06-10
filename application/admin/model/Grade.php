<?php
namespace app\admin\model;

use think\Model;

/**
 * 分类模型类
 */
class Grade extends model
{
    /**
     * 获取所有数据
     * @return [type] [description]
     */
    public function getAll($where=1)
    {
        $data = $this->where($where)->select();
        return $data;
    }

    /**
     * 获取单条数据
     * @param  Arr $where sql条件语句
     */
    public function getOne($where=1)
    {
        $data = $this->where($where)->find();
        return $data;
    }

    /**
     * 
     */
    



}
