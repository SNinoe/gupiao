<?php

namespace app\index\controller;

use think\Controller;
use think\Db;


class Pay extends Controller
{
    public function _initialize()
    {
        parent::_initialize();
    }

    /**
     * 微信支付回调 （直播购买）
     */
    public function WxReturnOrders()
    {
        $xml = $GLOBALS['HTTP_RAW_POST_DATA'];

        // 记录微信回调数据
        // file_put_contents('1.txt',$xml);  
         
        libxml_disable_entity_loader(true);
        $arr= json_decode(json_encode(simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA)), true);

        if($arr['return_code'] == 'SUCCESS'){
            Db::name('orders')->where('order_id',$arr['out_trade_no'])->update(['status'=>1,'update_time'=>time(),'trade_no'=>$arr['transaction_id']]);

            // 记录日志
            $this->doLog(1,'购买课程',$arr['transaction_id']);

            echo 'success';
        }
    }

    /**
     * 支付回调 （打赏）
     */
    public function WxReturnReward()
    {
        $xml = $GLOBALS['HTTP_RAW_POST_DATA'];

        // 记录微信回调数据
        // file_put_contents('1.txt',$xml);  
         
        libxml_disable_entity_loader(true);
        $arr= json_decode(json_encode(simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA)), true);

        if($arr['return_code'] == 'SUCCESS'){

            // 查询订单合法性
            $order_info = Db::name('lives_reward_log')->where('order_id',$arr['out_trade_no'])->find();
            if($order_info && $order_info['state'] == 0){

                // 更改状态
                Db::name('lives_reward_log')->where('order_id',$arr['out_trade_no'])->update(['state'=>1,'update_time'=>time(),'trade_no'=>$arr['transaction_id']]);

                // 查询用户信息
                $user_info = Db::name('users')->field('balance,total_balance')->where('id',$order_info['zhubo_id'])->find();

                // 增加用户收益
                $re = Db::name('users')
                ->where('id',$order_info['zhubo_id'])
                ->update([
                        'balance'       =>$user_info['balance']+$order_info['reward_money'],
                        'total_balance' =>$user_info['total_balance']+$order_info['reward_money']
                ]);

                // 记录日志
                $this->doLog(3,'打赏',$arr['transaction_id']);

            }

            echo 'success';
        }

    }

    /**
     * 插入日志
     */
    public function doLog($type=1,$log='',$order_no='')
    {
        $params['type']         = $type;
        $params['log']          = $log;
        $params['order_no']     = $order_no;
        $params['create_time']  = time();
        return $re = Db::name('pay_log')->insert($params);
    }


}
