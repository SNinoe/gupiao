<?php

namespace app\index\controller;

use think\Controller;
use think\Session;
use think\Db;


class Orders extends Base
{


    public function _initialize()
    {

        parent::_initialize();

    }

    /**
     * 免费领取
     */
    public function freeGet()
    {
        if(input('post.')){

            $params['uid']          = $this->uid;
            $params['live_id']      = input('post.live_id');                    // 直播id
            $params['order_id']     = time().rand(1000,9999).$this->uid;        // 订单编号
            $params['amount']       = 0;                                        // 支付金额
            $params['create_time']  = time();
            $params['update_time']  = time();
            $params['status']       = 1;

            $re = Db::name('orders')->insert($params);
            if($re){

                // 更改加入人数
                Db::name('lives')->where('id',input('post.live_id'))->setInc('enlist');

                return $this->success('成功领取');
            }else{
                return $this->error('网络繁忙 稍后重试');
            }

        }else{
            return $this->error('网络繁忙 稍后重试');
        }

    }

    /**
     * 入单
     */
    public function buy()
    {
        if(input('get.')){

            // 用户存在已下单未付款的本课程订单
            $order_info = Db::name('orders')
                        ->field('order_id,amount,live_name')
                        ->where('uid',$this->uid)
                        ->where('live_id',input('get.live_id'))
                        ->where('status',0)
                        ->find();
            if($order_info){
                return $this->pay($order_info['order_id'],$order_info['amount'],$this->request->domain()."/index/pay/WxReturnOrders",'付款【'.$order_info['live_name'].'】');
            }else{

                // 直播详情
                $live_info = Db::name('lives')->where('id',input('get.live_id'))->where('is_del',0)->find();
                if(!$live_info){
                    return $this->success('课程走丢了');
                }

                $params['uid']          = $this->uid;
                $params['live_id']      = input('get.live_id');                     // 直播id
                $params['live_name']    = $live_info['title'];                      // 直播名称
                $params['zhubo_id']     = $live_info['uid'];                        // 主播id
                $params['order_id']     = time().rand(1000,9999).$this->uid;        // 订单编号
                $params['amount']       = $live_info['price'];                      // 支付金额
                $params['photo']        = $this->photo;
                $params['create_time']  = time();
                $params['update_time']  = time();
                $params['status']       = 0;

                $re = Db::name('orders')->insert($params);
                if($re){
                    return $this->pay($params['order_id'],$params['amount'],$this->request->domain()."/index/pay/WxReturnOrders",'付款【'.$params['live_name'].'】');
                }
            }

            // return $this->fetch('pay');
                
        }
    }

    /**
     * 打赏
     */
    public function reward()
    {
        
        if(input('get.')){

            $params['live_id']      = input('get.live_id');
            $params['zhubo_id']     = input('get.uid');
            $params['reward_money'] = input('get.money');

            $params['order_id']     = 'DS'.time().rand(1000,9999).$this->uid;
            $params['uid']          = $this->uid;
            $params['create_time']  = time();

            $re = Db::name('lives_reward_log')->insert($params);

            if($re){
                return $this->pay($params['order_id'],$params['reward_money'],$this->request->domain()."/index/pay/WxReturnReward",'打赏主播');
            }

        }

    }
    


    /**
     * 支付
     * @param  [type] $order_id     [订单号]
     * @param  [type] $amount       [支付金额]
     * @param  [type] $call_back    [回调地址]
     */
    public function pay($order_id,$amount,$call_back='',$note='消费付款')
    {
        // 
        $openid = Session::get('openid');

        // 统一下单
        header('Content-Type:text/html;charset=UTF-8');

        // 导入微信支付sdk
        Vendor('Weixinpay.WxPayConfig');
        Vendor('Weixinpay.WxPayApi');
        Vendor('Weixinpay.JsApiPay');
        Vendor('Weixinpay.WxPayResults');

        $tools=new  \JsApiPay();
        // $openid = $tools->GetOpenid();

        //②、统一下单
        $input = new \WxPayUnifiedOrder();
        $input->SetBody($note);
        $input->SetAttach("test");
        $input->SetOut_trade_no($order_id);
        $input->SetTotal_fee($amount*100);
        $input->SetTime_start(date("YmdHis"));
        $input->SetTime_expire(date("YmdHis", time() + 600));
        $input->SetGoods_tag("test");
        $input->SetNotify_url($call_back);
        $input->SetTrade_type("JSAPI");

        $input->SetOpenid($openid);
        $order = \WxPayApi::unifiedOrder($input);

        //echo '<font color="#f00"><b>统一下单支付单信息</b></font><br/>';

        $jsApiParameters = $tools->GetJsApiParameters($order);
        //获取共享收货地址js函数参数
        $editAddress = $tools->GetEditAddressParameters();
        // $this->assign("jsApiParameters",$jsApiParameters);
        // $this->assign("editAddress",$editAddress);
        if($jsApiParameters){
            $aa = json_decode($jsApiParameters);
            $tt['appId']        = $aa->appId;
            $tt['nonceStr']     = $aa->nonceStr;
            $tt['package']      = $aa->package;
            $tt['signType']     = $aa->signType;
            $tt['timeStamp']    = $aa->timeStamp;
            $tt['paySign']      = $aa->paySign;
        }
// echo "<pre>";
return json($tt);
// die;
// return $this->success($jsApiParameters);
        // $this->display();

    }

    

}
