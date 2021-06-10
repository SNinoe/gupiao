<?php
/**
 * This file is part of workerman.
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the MIT-LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @author walkor<walkor@workerman.net>
 * @copyright walkor<walkor@workerman.net>
 * @link http://www.workerman.net/
 * @license http://www.opensource.org/licenses/mit-license.php MIT License
 */

/**
 * 用于检测业务代码死循环或者长时间阻塞等问题
 * 如果发现业务卡死，可以将下面declare打开（去掉//注释），并执行php start.php reload
 * 然后观察一段时间workerman.log看是否有process_timeout异常
 */

//declare(ticks=1);


use \GatewayWorker\Lib\Gateway;
use \GatewayWorker\Lib\Db;
use Workerman\Lib\Timer;

require_once 'play.php';

use doudz\play;

// 全局变量 主要用于保存部分数据
$poker_arr = array();
$game_info = array();
$player_arr = array();
$chupai_flag = 0;

/**
 * 主逻辑
 * 主要是处理 onConnect onMessage onClose 三个方法
 * onConnect 和 onClose 如果不需要可以不用实现并删除
 */
class Events
{

    //服务启动时
    public static function onWorkerStart($businessWorker)
    {

        //如果任务较重 可另开进程根据任务类型分别调度
        $play = new play();
        //只在id编号为0的进程上设置定时器。
        if ($businessWorker->id === 0) {
            Timer::add(0.5, function () use ($play) {
                $play->startImgQueue();
            });
        }
        if ($businessWorker->id === 0) {
            Timer::add(0.5, function () use ($play) {
                $play->startAudioQueue();
            });
        }


    }

    // 当有客户端连接时，将client_id返回，让mvc框架判断当前uid并执行绑定
    public static function onConnect($client_id)
    {
        Gateway::sendToClient($client_id, json_encode(array(
            'type' => 'init',
            'client_id' => $client_id
        )));

    }

    // 交互
    public static function onMessage($client_id, $message)
    {

        $message = json_decode($message, true);
        $message_type = $message['type'];

        $play = new play();
        //预留授权
        if ($message_type == 'auth') {
            $content = $message['content'];

            $play->bindUid2($content['token'], $client_id, $content['live_id']);
            return;
        }

        $uid = $_SESSION['id'];

        if (!$uid) {
            $play->error($client_id, '未认证');
            return;
        }

        switch ($message_type) {


            //发送语音
            case 'voice':

                $content = $message['content'];
                $play->sendVoice($content);
                return;

            //发送文字
            case 'text':

                $play->liveMeTex($message['content']);
                return;

            //发送图片
            case 'img':
                //Gateway::sendToAll(json_encode(array('type' => 'img', 'content' => $message['content'])));
                //插入队列
                $content = $message['content'];
                $mid = $content['img'];
                $content = json_encode($content);
                $play->insertImgQueue($mid, $content);

                return;

            //发送讨论
            case 'talk':

                $re = $play->talkMessage($message['content']);

                // Gateway::sendToAll(json_encode(array('type' => 'talk', 'content' => $message['content'])));
                return;

            //删除讨论的一条信息
            case 'talk_del':

                $live_id = $message['live_id'];
                $data_id = $message['data_id'];
                $play->talk_del($live_id,$data_id);

                return;


            //禁言
            case 'talk_jinyan':
                $play->talk_jinyan($message['data_uid'],$message['live_id'],$message['status']);
                return;
            //撤回一条信息
            case 'recall':

                $play->recall($message['data_id'],$message['live_id']);


                return;

            // 结束直播
            case 'live_over':

                $play->liveOver($message['room_id']);

                return;

            //加入
            case 'comein':
                return;
            case 'ping':
                return;
            default:
                echo "unknown message $message";
        }

    }


    /**
     * 当用户断开连接时触发
     * @param int $client_id 连接id
     */
    public static function onClose($client_id)
    {
        //增加SESSION功能
        //var_dump($_SESSION);
        //增加数据库功能 需要单独配置Config/Db.php
        //使用方式 http://doc.workerman.net/315205

        //离开游戏 未来进行游戏状态判断
        if ($_SESSION['id']) {
            $uid = $_SESSION['id'];

        }

    }
}
