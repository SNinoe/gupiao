<?php
namespace app\index\model;

use think\Model;

/**
 * 自定义集成类
 */
class Base extends model
{
    // where 语句结构
    public $B_where     = 1;                    // where 条件
    public $B_order     = '';                   // 排序方式
    public $B_limit     = '';                   // 查询数量
    public $B_field     = '*';                  // 字段
    public $S_field     = 'id';                 // 求和字段
    public $V_field     = 'id';                 // 查询单个字段

    public $B_data      = '';                   // 插入数据

    public $fieldArr    = '';                   // 更新字段

    public $printSql    = false;                // 是否打印sql语句


	/**
	 * 获取所有数据
	 */
    public function getAll()
    {
    	return $data = $this->where($this->B_where)
                        ->field($this->B_field)
                        ->order($this->B_order)
                        ->limit($this->B_limit)
                        ->fetchSql($this->printSql)
                        ->select();
    }


    /**
     * 获取单条数据
     */
    public function getOne()
    {
    	return $data = $this->where($this->B_where)
                        ->field($this->B_field)
                        ->order($this->B_order)
                        ->limit($this->B_limit)
                        ->fetchSql($this->printSql)
                        ->find();
    }


    /**
     * 获取单个字段的值
     */
    public function getOneVal()
    {
        return $field = $this->where($this->B_where)
                        ->fetchSql($this->printSql)
                        ->value($this->V_field);
    }


    /**
     * 统计总数
     */
    public function getCount()
    {
        return $count = $this->where($this->B_where)->count();
    }


    /**
     * 求和
     */
    public function getSum()
    {
        return $sum = $this->where($this->B_where)->sum($this->S_field);
    }

    
    /**
     * 插入数据
     */
    public function newInsert($get_ID=false)
    {
        // 返回新增id
    	if($get_ID !=false){
    		return $re = $this->insertGetId($this->B_data);
    	}else{
    		return $re = $this->insert($this->B_data);
    	}
    	
    }


    /**
     * 编辑信息
     */
    public function editIntro()
    {
    	return $re = $this->where($this->B_where)->update($this->fieldArr);
    }


}
