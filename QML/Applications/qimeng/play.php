<?php
/**
 * Created by PhpStorm.
 * User: qaz
 * Date: 2017/10/25
 * Time: 17:32
 */

namespace doudz;

use \GatewayWorker\Lib\Gateway;
use \GatewayWorker\Lib\Db;
use doudz\poker;

error_reporting(E_ALL ^ E_NOTICE);
// 自动加载类
require_once __DIR__ . '/../../vendor/autoload.php';


class play
{
    public $db;
    public $uid;
    public $count;

    public function __construct()
    {
        $this->db = Db::instance('qimeng');
        $this->uid = $_SESSION['id'];
    }

    /**
     *
     * @param $token
     * @param $client_id
     */
    public function bindUid($token, $client_id)
    {

        $token_arr = $this->db->select('user_id,expire_time')
            ->from('yc_user_token')
            ->where("token='{$token}'")
            ->row();
        if ($token_arr) {
            //是否过期
            if ($token_arr['expire_time'] < time()) {
                $this->error($client_id, 'token 过期');
                return false;
            }
            $user = $this->db->select('*')
                ->from('yc_user')
                ->where('id= :id')
                ->bindValues(array('id' => $token_arr['user_id']))->row();
            //判断是否多开
            //非必要勿用 Gateway::sendToUid();
            //Gateway::bindUid($client_id, $token_arr['user_id']);

            Gateway::updateSession($client_id, $user);
            Gateway::sendToClient($client_id, json_encode(array('type' => 'success', 'value' => 200, 'msg' => 'auth ok')));

        } else {
            $this->error($client_id, '参数有误');
            return false;
        }

    }


    public function bindUid2($token, $client_id, $live_id)
    {

        $user_arr = $this->db->select('id')
            ->from('zb_users')
            ->where("openid='{$token}'")
            ->row();

        if ($user_arr['id']) {

            //判断是否多开
            //非必要勿用 Gateway::sendToUid();
            Gateway::bindUid($client_id, $user_arr['id']);

            Gateway::updateSession($client_id, $user_arr);
            Gateway::joinGroup($client_id, $live_id);
            Gateway::sendToClient($client_id, json_encode(array('type' => 'success', 'value' => 200, 'msg' => 'auth ok')));

        } else {
            $this->error($client_id, '参数有误');
            return false;
        }

    }


    public function error($client_id, $msg = '')
    {
        Gateway::sendToClient($client_id, json_encode(array('type' => 'error', 'value' => 1, 'msg' => $msg)));
    }


    /**
     * 将当前连接加入指定的组
     * @param $uid
     * @param $room_id
     */
    public function joinGroup($client_id, $room_id)
    {
        Gateway::joinGroup($client_id, $room_id);
    }


    public function getElement($key, $arr, $who = 'next')
    {
        //查找键为$key元素的位置
        $offset = 0;
        foreach ($arr as $_k => $_v) {
            if ($_k == $key) break;
            ++$offset;
        }

        //查找哪个元素，前一个或后一个？
        if ('prev' == $who) {
            $arr = array_reverse($arr);
        } else if ('next' == $who) {

        } else {
            echo '错误的参数';
            return false;
        }
        //ArrayIterator
        $iterator = new \ArrayIterator($arr);
        $iterator->seek($offset);
        $iterator->next();

        //返回数组当前指针指向元素的键值数组
        return array($iterator->key(), $iterator->current());
    }


    /**
     * 主要处理
     * 出牌过程中的异常
     */
    public function groupError($room_id, $type = 1, $msg = '')
    {

        Gateway::sendToGroup($room_id, json_encode(array('type' => 'error', 'code' => $type, 'msg' => $msg)));

    }

    public function clinetError($clinet_id, $type = 1, $msg = '')
    {
        Gateway::sendToClient($clinet_id, json_encode(array('type' => 'error', 'code' => $type, 'msg' => $msg)));
    }


    /**
     * workerman sendToGroup方法
     * 改写此方法
     * @param $room_id
     * @param $data
     */
    public function sendToGroup($room_id, $type, $data)
    {
//        $player = $this->db->select('player')
//            ->from('yc_doudz_room')
//            ->where("id='{$room_id}'")
//            ->single();
        $message = array();
        $message['type'] = $type;
        $message['data'] = $data;
        Gateway::sendToGroup($room_id, json_encode($message));

//        if (!empty($player)) {
//            $player = json_decode($player, true);
//            foreach ($player as $index => $item) {
//                if ($item['uid'] > 0 || $item['uid']) {
//                    Gateway::sendToUid($item['uid'], json_encode($message));
//                }
//
//            }
//        }
    }

    public function liveOver($id)
    {

        if (!$this->isZhubo($id)) {
            return false;
        }

        $update_data['state'] = 1;
        $update_data['end_time'] = time();
        $update_data['update_time'] = time();

        $re = $this->db->update('zb_lives')->cols($update_data)->where("id='{$id}'")->query();
        if ($re) {
            $msg = "已结束";
        } else {
            $msg = "关闭失败";
        }
        Gateway::sendToGroup($id, json_encode(array('type' => 'live_over', 'content' => $msg)));
    }

    /**
     *  主播发送文字消息
     * @return [type] [description]
     */
    public function liveMeTex($content)
    {
        unset($content['data_id']);
        $row_count = $this->db
            ->insert('zb_live_content')
            ->cols($content)
            ->query();

        $content['data_id'] = $row_count;
        Gateway::sendToGroup($content['live_id'], json_encode(array('type' => 'text', 'content' => $content)));


    }

    public function sendVoice($content)
    {
        $live_id=$content['live_id'];
        //加入队列 暂不处理
        $data['mid'] = $content['audio'];
        $data['content'] = json_encode($content);
        $row_count = $this->db
            ->insert('zb_query_voice')
            ->cols($data)
            ->query();

        unset($content['data_id']);
        $content['createtime']=time();
        //七牛文件KEY
        $key_name=date('Ymd',time()).'/'.$data['mid'];
        $key = $key_name. '.amr';
        $content['qiniu_key']=$key;

        $row_count = $this->db
            ->insert('zb_live_content')
            ->cols($content)
            ->query();

        $content['data_id'] = $row_count;

        Gateway::sendToGroup($live_id,json_encode(array('type' => 'voice', 'content' => $content)));
    }


    /**
     * 消息撤回
     * @param $data_id
     * @param $live_id
     * @return bool
     */
    public function recall($data_id, $live_id)
    {
        if (!$this->isZhubo($live_id)) {
            return false;
        }

        $res = $this->db->update('zb_live_content')
            ->cols(['is_del' => 1])
            ->where("live_id='{$live_id}'  and id=$data_id")
            ->query();
        if ($res) {
            Gateway::sendToGroup($live_id, json_encode(array('type' => 'recall', 'data_id' => $data_id)));
        }


    }


    /**
     * 讨论消息
     */
    public function talkMessage($content)
    {
        //是否禁言
//        $live = $this->db->select('jinyan')
//            ->from('zb_orders')
//            ->where("uid='{$content['uid']}' and live_id='{$content['live_id']}'")
//            ->row();

        $param['uid'] = $content['uid'];
        $param['live_id'] = $content['live_id'];
        $param['content'] = $content['content'];
        $param['type'] = $content['type'];
        $param['name'] = $content['name'];
        $param['avatar'] = $content['avatar'];

        $param['time'] = time();

        $row_count = $this->db
            ->insert('zb_live_talk')
            ->cols($param)
            ->query();

        $content['data_id'] = $row_count;
        $content['time'] = date('H:i:s', $param['time']);

        Gateway::sendToGroup($param['live_id'], json_encode(array('type' => 'talk', 'content' => $content)));


    }


    /**
     * 删除留言
     * @param $live_id
     * @param $data_id
     * @return bool
     */
    public function talk_del($live_id, $data_id)
    {

        if (!$this->isZhubo($live_id)) {
            return false;
        }

        $row_count = $this->db
            ->update('zb_live_talk')
            ->cols(array('is_del' => 1))
            ->where("id='{$data_id}'")->query();

        Gateway::sendToGroup($live_id, json_encode(array('type' => 'talk_del', 'data_id' => $data_id)));


    }

    /**
     * 禁言 有BUG
     * @param $uid
     * @param $live_id
     * @param $status
     * @return bool
     */
    public function talk_jinyan($uid, $live_id, $status)
    {

        if (!$this->isZhubo($live_id)) {
            return false;
        }

        $this->db->update('zb_orders')
            ->cols(['jinyan' => $status])
            ->where("live_id='{$live_id}' and uid=$uid")
            ->query();

        Gateway::sendToUid($uid, json_encode(array('type' => 'talk_jinyan', 'live_id' => $live_id)));
    }


    //是否为主播
    public function isZhubo($live_id)
    {
        $live = $this->db->select('uid')
            ->from('zb_lives')
            ->where("id='{$live_id}'")
            ->row();
        if ($live && $live['uid'] == $_SESSION['id']) {
            return true;
        }
        return false;
    }


    public function sentMsgToClient($client_id, $code, $msg)
    {
        $message = array();
        $message['code'] = $code;
        $message['msg'] = $message;
        Gateway::sendToClient($client_id, json_encode($message));
    }


    /**
     * 断线处理
     * @param $uid
     */
    public function offLine($uid, $client_id)
    {

        $room_id = $this->getRoomId($client_id, $uid);
        if (!$room_id) {
            return false;
        }
        $game_info = $this->getGameInfo($room_id);
        //解绑
        //Gateway::unbindUid($client_id, $uid);

        $game_status = $game_info['game_status'];
        $cur_count = $game_info['cur_count'];
        $player = $this->getPlayer($room_id);
        $player2 = $player;

        $update_data = array();
        $update_data['online'] = 0;
        if ($game_status == 0) {
            //避免重新开局后 游戏状态影响判断
//            if (!$cur_count) {
            //清除房间号
            $update_data['room_id'] = 0;
            //删除玩家位置
            foreach ($player2 as $index => $item) {
                if ($item['uid'] == $uid) {
                    $player2[$index]['uid'] = 0;
                    $player2[$index]['ready'] = 0;
                    $player2[$index]['qiangdizhu'] = 0;
                    $player2[$index]['client_id'] = 0;
                    break;
                }
            }
            $row_count = $this->db
                ->update('yc_doudz_room')
                ->cols(array('player' => json_encode($player2)))
                ->where("id='{$room_id}'")->query();
//            }

        }
        $row_count = $this->db->update('yc_user')
            ->cols($update_data)
            ->where("id='{$uid}'")->query();


        $user_info = array();
        $user_info['game_status'] = $game_status;
        foreach ($player as $index => $item) {
            if ($item['uid'] == $uid) {
                $user_info['postion'] = $index;
                break;
            }
        }
        $user_info['uid'] = $uid;
        //离开游戏 源自魔兽世界
        $this->sendToGroup($room_id, 'afk', $user_info);


    }

    ////////////////////////////////////////////queue调度相关/////////////////////////////////////////////////
    ////////////////////////////////////////////queue调度相关/////////////////////////////////////////////////
    ////////////////////////////////////////////queue调度相关/////////////////////////////////////////////////
    ////////////////////////////////////////////queue调度相关/////////////////////////////////////////////////

    /**
     * 处理队列
     */
    public function queue()
    {
        $time = time();
        $queue = $this->getQueueByWhere("start_time <= '{$time}'");
        if (!empty($queue)) {
            //var_dump($queue);
            foreach ($queue as $index => $item) {


                if ($item['type'] == 1) {
                    $this->buqiang($item['uid'], $item['room_id']);
                    $this->queueEcho(date('Y-m-d H:i:s', time()) . " Doudz queue type buqiang uid={$item['uid']} \n");
                } elseif ($item['type'] == 2) {
                    //必须出牌
                    if ($item['arg'] == 2) {
                        $shoupai = $this->getPai($item['uid'], $item['room_id']);
                        $shoupai = json_decode($shoupai, true);
                        //预留的AI出牌
                        $data = $this->AiChupai($shoupai);
                        $this->chupai($item['uid'], $data, $item['room_id']);
                    } else {
                        //允许不出
                        $this->buchu($item['uid'], $item['room_id']);
                    }
                    $this->queueEcho(date('Y-m-d H:i:s', time()) . " Doudz queue type chupai/buchu uid={$item['uid']} \n");
                } elseif ($item['type'] == 3) {
                    //处理房间锁定
                    $this->lockRoom($item['room_id']);
                    $this->queueEcho(date('Y-m-d H:i:s', time()) . " Doudz queue type lock room  \n");
                }


            }
        }


    }


    /**
     * 开启图片消息队列
     */
    public function startImgQueue()
    {

        $queue = $this->getQueueByWhere();
        if (!empty($queue)) {
            //var_dump($queue);
            foreach ($queue as $index => $item) {

                $this->queueEcho(date('Y-m-d H:i:s', time()) . "  queue ... \n");
                $url = "qm.aliycl.com/index/api/tempfile/mid/" . $item['mid'];
                $res = $this->https_request($url);
//                $res2 = $this->https_request('www.baidu.com');
//                var_dump($res2);
                $res = json_decode($res, true);
                var_dump($res);
                if ($res['code'] == 200) {
                    $this->delQueue($item['id']);
                    $content = json_decode($item['content'], true);
                    $content['img'] = $res['img'];
                    $content['createtime']=time();

                    unset($content['data_id']);
                    $row_count = $this->db
                        ->insert('zb_live_content')
                        ->cols($content)
                        ->query();

                    $content['data_id'] = $row_count;
                    $content['img']='http://img.chuaii.com/'.$content['img'];
                    Gateway::sendToGroup($content['live_id'], json_encode(array('type' => 'img', 'content' => $content)));


                }

            }
        }


    }

    /**
     * 开启语音消息队列
     */
    public function startAudioQueue()
    {

        $queue = $this->getAudioQueueByWhere();
        if (!empty($queue)) {
            //var_dump($queue);
            foreach ($queue as $index => $item) {

                $this->queueEcho(date('Y-m-d H:i:s', time()) . "  queue ... \n");
                $url = "qm.aliycl.com/index/api/tempvoice/mid/" . $item['mid'];
                $res = $this->https_request($url);
//                $res2 = $this->https_request('www.baidu.com');
//                var_dump($res2);
                $res = json_decode($res, true);
                var_dump($res);
                if ($res['code'] == 200) {
                    $this->delAudioQueue($item['id']);
//                    $content = json_decode($item['content'], true);
//                    $content['img'] = $res['img'];
//                    $content['createtime']=time();
//
//                    unset($content['data_id']);
//                    $row_count = $this->db
//                        ->insert('zb_live_content')
//                        ->cols($content)
//                        ->query();
//
//                    $content['data_id'] = $row_count;
//                    $content['img']='http://img.chuaii.com/'.$content['img'];
//                    Gateway::sendToGroup($content['live_id'], json_encode(array('type' => 'img', 'content' => $content)));


                }

            }
        }


    }



    //https请求
    public function https_request($url, $data = null)
    {

        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE);
        if (!empty($data)) {
            curl_setopt($curl, CURLOPT_POST, 1);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
        }
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        $output = curl_exec($curl);
        curl_close($curl);
        var_dump($output);
        return $output;
    }


    /**
     * 主要用于服务器重启后 处理队列的数据
     */
    public function queueReset()
    {
        $queue = $this->getQueue();
        if ($queue) {
            //关闭房间
            foreach ($queue as $index => $item) {
                //$this->setRoomStatus('出牌阶段', $room_id, 3);
                $this->setRoomStatus('服务器重启锁定', $item['room_id'], 6);
                Gateway::sendToGroup($item['room_id'], json_encode(array('type' => 'error', 'value' => 2, 'msg' => '网络连接失败')));

            }
            //清除所有队列
            $this->db->delete('yc_doudz_queue')->query();
        }


    }


    /**
     * 观察队列
     * @param $log
     */
    public function queueEcho($log)
    {
        echo $log;
    }

    /**
     * 获取队列中指定房间锁定执行的时间
     * @param $uid
     * @param $room_id
     */

    public function getQueueLockRoomTime($room_id)
    {
        return $this->db->select('start_time')
            ->from('yc_doudz_queue')
            ->where("type='3' and room_id='{$room_id}'")
            ->single();
    }

    /**
     * 获取队列中指定房间中玩家的执行的时间
     * @param $uid
     * @param $room_id
     */
    public function getQueueStartTime($uid, $room_id)
    {
        return $this->db->select('start_time')
            ->from('yc_doudz_queue')
            ->where("uid='{$uid}' and room_id='{$room_id}'")
            ->single();
    }


    public function insertImgQueue($mid, $content)
    {
        $data = array();
        $data['mid'] = $mid;
        $data['content'] = $content;
        return $this->insertQueue($data);

    }


    /**
     * 插入任务
     * @param array $data
     */
    public function insertQueue($data = array())
    {

        $row_count = $this->db
            ->insert('zb_query_img')
            ->cols($data)
            ->query();
        return $row_count;

//        if ($data['uid']) {
//            $row_count = $this->db
//                ->insert('yc_doudz_queue')
//                ->cols($data)
//                ->query();
//            return $row_count;
//        }

    }

    /**
     * 获取任务
     */
    public function getQueue()
    {
        return $this->db->select('*')->from('yc_doudz_queue')
            ->query();
    }

    /**
     * 获取指定用户和房间的队列信息
     * @param $uid
     */
    public function getQueueByWhere($where = '1=1')
    {
        return $this->db->select('*')
            ->from('zb_query_img')
            ->where($where)
            ->query();
    }


    public function getAudioQueueByWhere($where = '1=1')
    {
        return $this->db->select('*')
            ->from('zb_query_voice')
            ->where($where)
            ->query();
    }


    /**
     * 删除任务
     * @param $id
     */
    public function delQueue($id)
    {
        $row_count = $this->db->delete('zb_query_img')->where("id=$id")->query();
        return $row_count;
    }

    public function delAudioQueue($id)
    {
        $row_count = $this->db->delete('zb_query_voice')->where("id=$id")->query();
        return $row_count;
    }

    public function delQueueByWhere($where)
    {
        $row_count = $this->db->delete('yc_doudz_queue')->where($where)->query();
        return $row_count;
    }


    public function maopao($arr)
    {
        $len = count($arr);
        for ($i = 1; $i < $len; $i++)//最多做n-1趟排序
        {
            $flag = false;    //本趟排序开始前，交换标志应为假
            for ($j = $len - 1; $j >= $i; $j--) {
                if ($arr[$j] < $arr[$j - 1])//交换记录
                {//如果是从大到小的话，只要在这里的判断改成if($arr[$j]>$arr[$j-1])就可以了
                    $x = $arr[$j];
                    $arr[$j] = $arr[$j - 1];
                    $arr[$j - 1] = $x;
                    $flag = true;//发生了交换，故将交换标志置为真
                }
            }
            if (!$flag)//本趟排序未发生交换，提前终止算法
                return $arr;
        }
    }


}
