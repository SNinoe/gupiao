<?php

namespace app\index\controller;

use think\Controller;
use think\Db;


class Crontab extends Controller
{
    public function _initialize()
    {
        parent::_initialize();
    }

    /**
     * 关闭24小时以上直播间
     * URL : index/crontab/end_lives
     * @return [type] [description]
     */
    public function end_lives()
    {
        $ago_24h = time()-24*60*60;

        // 关闭直播间
        $re = Db::name('lives')->where('begin_time','<=',$ago_24h)
                                ->where('end_time','=',0)
                                ->where('state',0)
                                ->update([
                                    'end_time'=>time(),
                                    'state'=>1
                                ]);
        echo $re;
    }


}
