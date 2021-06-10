<?php

namespace app\index\controller;

use think\Controller;
use think\Db;


class Live extends Base
{


    public function _initialize()
    {

        parent::_initialize();

    }

    //微信案例
    public function weixin()
    {
        $weixin = new Weixin();
        $url = request()->domain() . url('index/live/weixin');
        $js_config = $weixin->js_config($url);
        $this->assign('jsconfig', $js_config);
        return $this->fetch();

    }

    public function in()
    {
        $weixin = new Weixin();

        $url = request()->domain() . $this->request->url();
        $js_config = $weixin->js_config($url);
        $this->assign('jsconfig', $js_config);

        // 直播详情
        $id = input('get.id');

        $info = Db::name('lives')
            ->alias('l')
            ->join('users u', 'l.uid=u.id', 'left')
            ->field('l.* , u.photo , u.live_name , u.be_guanzhu')
            ->where('l.id', $id)
            ->find();

        $info['endTime'] = $info['begin_time'] * 1000;
        $info['newTime'] = time() * 1000;

        if ($info['state'] == 1) {
            $info['state'] = '已结束';
        } elseif ($info['state'] == 0 && $info['begin_time'] < time()) {
            $info['state'] = '直播中';
        } else {
            $info['state'] = '未开始';
        }
        $this->assign('userid', $this->uid);
        $user = Db::name('users')->where('id', $this->uid)->find();
        $this->assign('user', $user);


        $this->assign('info', $info);

        return $this->fetch();

    }

    /**
     * 讨论消息
     */
    public function get_talk()
    {

        $id = input('id');
        // 留言
        $talks = Db::name('live_talk')
            ->field('id as data_id , name , content , time , type , uid as data_uid , avatar')
            ->where('live_id', $id)
            ->where('is_del', 0)
            ->select();
        foreach ($talks as $index => $talk) {
            if ($talk['time'] > strtotime(date('Ymd', time()))){
                $talks[$index]['time'] = date('H:i:s',$talk['time']);
            }else{
                $talks[$index]['time'] = date('Y-m-d H:i:s',$talk['time']);
            }
            $res=Db::name('orders')->where('uid',$talk['data_uid'])->where('live_id',$id)
                ->value('jinyan');
            if($res==1){
                $talks[$index]['jinyan']=1;
            }else{
                $talks[$index]['jinyan']=0;
            }


        }
        return json(['code' => 1, 'data' => $talks]);


    }

    /**
     * 直播内容
     */
    public function get_live_content()
    {

        $id = input('id');
        $talks = Db::name('live_content')
            ->field(' *,id as data_id ')
            ->where('live_id', $id)
            ->where('is_del', 0)
            ->select();
        //处理数据
        $q_domain=config('qiniu.domain');
        foreach ($talks as $index => $talk) {

            if($talk['datatype']=='img'){
                $talks[$index]['img']=$q_domain.$talk['img'];
            }
            if($talk['audio_url']){
                $talks[$index]['audio']=$q_domain.$talk['audio_url'];
            }

        }



        return json(['code' => 1, 'data' => $talks]);


    }

    /**
     * 打赏记录
     * @return mixed
     */
    public function reward()
    {
        $id = input('get.id');
        $this->assign('id', $id);

        $reward = Db::name('lives_reward_log')
            ->alias('lr')
            ->join('users u', 'lr.uid=u.id', 'left')
            ->field('lr.*,u.nickname,u.photo')
            ->where('live_id', $id)
            ->where('state', 1)
            ->select();
        $this->assign('reward', $reward);

        return $this->fetch();
    }

    /**
     * 邀请好友
     * @return mixed
     */
    public function invite()
    {
        $params['invite_lives_id']  = input('get.live_id');
        $params['uid']              = $this->uid;
        $params['id']               = input('get.live_id');
        // $params['rand']             = rand(1000,9999); 

        $par = http_build_query($params);

        $url = $this->request->domain().'/index/index/live_detail?'.$par;
        $this->assign('url',$url);
        
        return $this->fetch();
    }




}
