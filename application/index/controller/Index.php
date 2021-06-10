<?php

namespace app\index\controller;

use think\Controller;
use think\Session;
use think\Db;


class Index extends Base
{
    /**
     * 首页
     * @return [type] [description]
     */
    public function index()
    {
        // 实例化模型类
        $Obj_keywords   = Model('keywords');                            // 关键字
        $Obj_classify   = Model('classify');                            // 课程分类
        $Obj_lives      = Model('lives');                               // 直播

        // 热门搜索
        $Obj_keywords->B_where = ['is_show'=>1];                        // 条件语句
        $Obj_keywords->B_order = 'sort desc , search_count desc';                           // 排序方式
        $Obj_keywords->B_limit = 50;                                    // 数据个数
        $this->assign('hot_search',$Obj_keywords->getAll());

        // 推荐搜索
        $Obj_keywords->B_where = ['is_show'=>1,'is_recomm'=>1];         // 条件语句
        $Obj_keywords->B_order = 'sort desc , search_count desc';                           // 排序方式
        $Obj_keywords->B_limit = 50;                                    // 数据个数
        $this->assign('recomm_rearch',$Obj_keywords->getAll());

        // 时间条件
        $new_time   = time();               // 当前时间
        $be_time    = time()+12*60*60;      // 即将开始时间

        $classify = $more_class = $newClass = array();

        // 分类
        $Obj_classify->B_field = 'id,name,icon';
        $Obj_classify->B_where = ['is_del'=>0,'is_show'=>1];
        // $Obj_classify->printSql = true;                              // 打印sql语句
        $classify = $Obj_classify->getAll();   

        $line_num = 5;              // 每行显示个数
        $i = $j = $z = 0;

        foreach ($classify as $key => $value) {

            $i++;
            $z++;

            if((($key+$line_num) % $line_num) == 0){
                $j++;
                $i = 1;
            }

            if($z <= $line_num*2){
                $newClass[$j][$i] = $value;
            }else{
                $more_class[] = $value;
            }

        }

        $this->assign('classify',$newClass);                    // 导航分类
        $this->assign('more_class',$more_class);                // 更多分类

        // 正在直播
        $Obj_lives->B_where = [
                                'is_del'    =>0 , 
                                'is_show'   =>1 , 
                                'state'     =>0 , 
                                'begin_time'=>['<=',$new_time]
                            ];
        $Obj_lives->B_limit = 5;
        $this->assign('livesing',$Obj_lives->getAll());

        // 即将开始
        $Obj_lives->B_where = [
                                'is_del'    =>0 , 
                                'is_show'   =>1 , 
                                'state'     =>0 , 
                                'begin_time'=>['between',"$new_time,$be_time"]
                            ];
        $Obj_lives->B_limit = 5;
        $this->assign('be_lives',$Obj_lives->getAll());

        // 推荐
        $Obj_lives->B_where = [
                                'is_del'    =>0 , 
                                'is_show'   =>1 , 
                                'is_recomm' =>1                              
                            ];
        $Obj_lives->B_limit = 10;
        $this->assign('recomm_lives',$Obj_lives->getAll());

        return $this->fetch();
    }

    /**
     * 我的 -- 用户中心
     * @return [type] [description]
     */
    public function mine()
    {
        $Obj_users = Model('users');                            // 用户模型

        $Obj_users->B_where = ['id'=>$this->uid];               // 条件
        $Obj_users->B_field = 'id,photo,nickname,name';         // 字段
        $this->assign('user_info',$Obj_users->getOne());

        return $this->fetch();
    }

    /**
     * 热门
     * @return [type] [description]
     */
    public function hot()
    {
        $Obj_lives1 = $Obj_lives2 = Model('lives');

        $Obj_lives1->B_where = ['is_del'=>0,'is_show'=>1];
        $Obj_lives1->B_order = "rand()";
        $Obj_lives1->B_limit = 20;
        $hot = $Obj_lives1->getAll();

        // 时间条件
        $new_time   = time();             // 当前时间
        $be_time    = time()+2*60*60;     // 即将开始时间
        
        foreach ($hot as $key => $value) {
            if($value['begin_time'] <= $new_time && $value['end_time'] < 1){
                $hot[$key]['state'] = '正在直播';
            }elseif ($value['begin_time'] <= $be_time && $value['begin_time'] >= $new_time) {
                $hot[$key]['state'] = '即将开始';
            }elseif ($value['end_time'] >1) {
                $hot[$key]['state'] = '精彩回听';
            }else{
                $hot[$key]['state'] = date('Y-m-d H:i',$value['begin_time']).' 开始';
            }
        }
        $this->assign('hot',$hot);

        // 直播总数
        $Obj_lives2->B_where = ['is_show'=>1,'is_del'=>0];
        $this->assign('count',$Obj_lives2->getCount());

        return $this->fetch();
    }

    /**
     * 所有直播
     * @return [type] [description]
     */
    public function all()
    {
        $Obj_classify   = Model('classify');                            // 课程分类
        $Obj_grade      = Model('grade');                               // 课程分类
        $Obj_lives      = Model('lives');                               // 直播
        $Obj_keywords   = Model('keywords');                            // 关键字

        $where['is_del']        = 0;
        $where['is_show']       = 1;

        input('get.classify')       == null || $where['classify']   = input('get.classify');
        input('get.grade')          == null || $where['grade']      = input('get.grade');

        // 参数
        $getStr = '?c=ou';
        input('get.classify')       == null || $getStr .= '&classify='.input('get.classify');
        input('get.grade')          == null || $getStr .= '&grade='.input('get.grade');
        $this->assign('getStr',$getStr);

        $p_title = "全部";

        // sql条件处理
        $type = input('get.type','all');        // 页面类型
        switch ($type) {
            // 所有
            case 'all':
                // 输出所有
                break;

            // 正在直播
            case 'livesing':
                $where['begin_time']        = ['<=',time()];
                $where['state']             = 0;
                $p_title = "直播中";
                break;

            // 即将开始
            case 'be_lives':
                $where['begin_time']        = ['>',time()];
                $p_title = "即将开始";
                break;

            // 推荐
            case 'recomm_lives':
                $where['is_recomm']         = 1;
                $p_title = "推荐";
                break;
        }

        $this->assign('p_title',$p_title); 
        
        // 查询条件
        if(input('get.kw')){
            $where['title'] = ['like','%'.input('get.kw').'%'];

            // 查询关键字是否存在
            $Obj_keywords->B_where = ['keyword'=>input('get.kw')];
            $keyw = $Obj_keywords->getOne();
            // 存在 +1
            if($keyw){
                $Obj_keywords->B_where = ['keyword'=>input('get.kw')];
                $Obj_keywords->fieldArr = ['search_count'=>$keyw['search_count']+1,'update_time'=>time()];
                $Obj_keywords->editIntro();
            // 不存在 新增
            }else{
                $par = [
                    'keyword'       => input('get.kw'),
                    'search_count'  => 1,
                    'create_time'   => time(),
                    'update_time'   => time(),
                ];
                $Obj_keywords->B_data = $par;
                $Obj_keywords->newInsert();
            }

        }
        // input('get.kw')         == null || $where['title'] = ['like','%'.input('get.kw').'%'];

        $Obj_lives->B_where = $where;                   // 条件语句

        // 查询数据
        $lives = $Obj_lives->getAll();

        // 时间条件
        $new_time   = time();             // 当前时间
        $be_time    = time()+2*60*60;     // 即将开始时间

        foreach ($lives as $key => $value) {
            if($value['begin_time'] <= $new_time && $value['end_time'] < 1){
                $lives[$key]['state'] = '正在直播';
            }elseif ($value['begin_time'] <= $be_time && $value['begin_time'] >= $new_time) {
                $lives[$key]['state'] = '即将开始';
            }elseif ($value['end_time'] >1) {
                $lives[$key]['state'] = '精彩回听';
            }else{
                $lives[$key]['state'] = date('Y-m-d H:i',$value['begin_time']).' 开始';
            }
        }
        $this->assign('lives',$lives);

        // 分类
        $Obj_classify->B_where = ['is_del'=>0,'is_show'=>1];
        $Obj_classify->B_field = 'id,name,icon';
        $this->assign('classify',$Obj_classify->getAll());

        // 年级
        $Obj_grade->B_where = ['is_del'=>0,'is_show'=>1];
        $this->assign('grade',$Obj_grade->getAll());

        return $this->fetch();
    }

    /**
     * 新建直播
     * @return [type] [description]
     */
    public function live_add()
    {
        // 添加
        if(input('post.')){

            if(input('post.title') == null || input('post.classify') == null || input('post.grade') == null ){
                
                // $this->redirect('index/live_add');
                $this->error('必填项不可为空');
            }

            // 获取表单上传文件 例如上传了001.jpg
            $file = request()->file('pic');

            // 移动到框架应用根目录/public/uploads/ 目录下
            if($file){
                $info = $file->move(ROOT_PATH . 'public' . DS . 'uploads');

                if($info){
                    $params['cover_pic']  = '/uploads/'.$info->getSaveName(); 
                }else{
                    // 上传失败获取错误信息
                    echo $file->getError();
                    die;
                }
            }
            
            // 数据整理
            $params['uid']          = $this->uid;                           // 用户id
            $params['title']        = input('post.title');                  // 标题
            $params['author']       = input('post.author');                 // 主讲嘉宾
            $params['classify']     = input('post.classify');               // 分类
            $params['grade']        = input('post.grade');                  // 年级
            $params['price']        = input('post.price','0.00');           // 金额
            $params['begin_time']   = strtotime(input('post.begin_time'));  // 直播开讲时间
            $params['desc']         = trim(input('post.desc'));             // 直播描述
            $params['create_time']  = time();
            $params['update_time']  = time();

            $Obj_lives = Model('lives');
            $Obj_lives->B_data = $params;
            $re = $Obj_lives->newInsert();
            if($re){
                $this->redirect('index/accounts');
            }
        }

        // 分类
        $Obj_classify = Model('classify');
        $Obj_classify->B_where = ['is_show'=>1,'is_del'=>0];
        $this->assign('classify',$Obj_classify->getAll());

        // 年级
        $Obj_grade = Model('grade');
        $Obj_grade->B_where = ['is_show'=>1,'is_del'=>0];
        $this->assign('grade',$Obj_grade->getAll());

        return $this->fetch();
    }

    public function live_edit()
    {

        $Obj_lives = Model('lives');

        if(input('post.')){
            // 获取表单上传文件 例如上传了001.jpg
            $file = request()->file('pic');

            // 移动到框架应用根目录/public/uploads/ 目录下
            if($file){
                $info = $file->move(ROOT_PATH . 'public' . DS . 'uploads');

                if($info){
                    $params['cover_pic']  = '/uploads/'.$info->getSaveName(); 
                }else{
                    // 上传失败获取错误信息
                    echo $file->getError();
                    die;
                }
            }
            
            input('post.title')         == null || $params['title']        = input('post.title');                  // 标题
            input('post.author')        == null || $params['author']       = input('post.author');                 // 主讲嘉宾
            input('post.classify')      == null || $params['classify']     = input('post.classify');               // 分类
            input('post.grade')         == null || $params['grade']        = input('post.grade');                  // 年级
            input('post.price','0.00')  == null || $params['price']        = input('post.price','0.00');           // 金额
            input('post.begin_time')    == null || $params['begin_time']   = strtotime(input('post.begin_time'));  // 直播开讲时间
            input('post.desc')          == null || $params['desc']         = trim(input('post.desc'));             // 直播描述
            $params['update_time']  = time();

            $Obj_lives->B_where     = ['id'=>input('post.id')];
            $Obj_lives->fieldArr    = $params;
            $re = $Obj_lives->editIntro();
            if($re){
                $this->redirect('index/accounts');
            }
        }

        $uid = $this->uid;

        $id = input('get.id');

        // 直播详情
        $Obj_lives->B_where = ['id'=>$id,'uid'=>$uid];
        $live_info = $Obj_lives->getOne();

        if(!$live_info['cover_pic']){
            $live_info['cover_pic'] = '/uploads/20180209\8759911c9bf79287ce93791e51e3e72a.png';
        }
        $this->assign('live_info',$live_info);

        // 分类
        $Obj_classify = Model('classify');
        $Obj_classify->B_where = ['is_show'=>1,'is_del'=>0];
        $this->assign('classify',$Obj_classify->getAll());

        // 年级
        $Obj_grade = Model('grade');
        $Obj_grade->B_where = ['is_show'=>1,'is_del'=>0];
        $this->assign('grade',$Obj_grade->getAll());

        return $this->fetch();
    }

    /**
     * 直播課程置頂
     */
    public function Top()
    {
        $Obj_lives = Model('lives');

        $params['is_top']       = input('post.is_top',1);
        $params['update_time']  = time();

        $Obj_lives->B_where     = ['id'=>input('post.id')];
        $Obj_lives->fieldArr    = $params;
        $re = $Obj_lives->editIntro();
        if($re){
            $this->success('已更新');
        }else{
            $this->error('系統繁忙！');
        }
    }

    /**
     * 直播課下架
     */
    public function Loff()
    {
        $Obj_lives = Model('lives');

        $params['is_show']      = input('post.is_show',1);
        $params['update_time']  = time();

        $Obj_lives->B_where     = ['id'=>input('post.id')];
        $Obj_lives->fieldArr    = $params;
        $re = $Obj_lives->editIntro();
        if($re){
            $this->success('已更新');
        }else{
            $this->error('系統繁忙！');
        }
    }

    /**
     * 重開直播
     */
    public function re_start()
    {

        $Obj_lives = Model('lives');

        $params['state']        = 0;
        $params['end_time']     = 0;
        $params['update_time']  = time();

        $Obj_lives->B_where     = ['id'=>input('post.id')];
        $Obj_lives->fieldArr    = $params;
        $re = $Obj_lives->editIntro();
        if($re){
            $this->success('重新開始');
        }else{
            $this->error('系統繁忙！');
        }
    }


    //我关注的直播间
    public function follow()
    {
        $uid = $this->uid;

        $interest = Db::name('interest_lives')
                    ->alias('il')
                    ->join('lives l','l.id=il.live_id')
                    ->field('l.*,il.id as lid')
                    ->where('il.uid',$uid)
                    ->where('il.is_del',0)
                    ->select();
        $this->assign('interest',$interest);

        return $this->fetch();
    }

    /**
     * 关注直播间
     */
    public function doFollow()
    {
        $uid = $this->uid;
        $id = input('post.id');

        // 是否已关注
        $live = Db::name('interest_lives')
                ->where('live_id',$id)
                ->where('uid',$uid)
                ->find();
        if($live){
            $re = Db::name('interest_lives')->where('live_id',$id)->where('uid',$uid)->update(['is_del'=>0,'update_time'=>time()]);
        }else{
            $params['uid']          = $uid;
            $params['live_id']      = $id;
            $params['create_time']  = time();
            $params['update_time']  = time();
            $re = Db::name('interest_lives')->insert($params);
        }

        if($re){
            $this->success('已关注');
        }else{
            $this->error('关注失败');
        }
    }

    /**
     * 取消关注直播间
     */
    public function unFollow()
    {
        $Obj = Model('interest_lives');

        $uid = $this->uid;
        $id = input('post.id');

        $Obj->B_where   = ['id'=>$id , 'uid'=>$uid];
        $Obj->fieldArr  = ['is_del'=>1,'update_time'=>time()];
        $re = $Obj->editIntro();
        if($re){
            $this->success('取消关注');
        }else{
            $this->error('取消失败');
        }
    }


    //我的课程 -- 购买的直播
    public function joinlive()
    {
        $uid = $this->uid;

        // 购买的课程
        $lives  = Db::name('orders')
                ->alias('o')
                ->join('lives l','o.live_id=l.id','left')
                ->field('l.*')
                ->where('o.uid',$uid)
                ->where('o.status',1)
                ->select();
        $this->assign('lives',$lives);

        return $this->fetch();
    }


    //我的钱包
    public function wallet()
    {
        $Obj_users      = Model('users');
        $Obj_with_cash  = Model('withdraw_cash');
        $Obj_orders     = Model('orders');

        // 可提现金额
        $Obj_users->B_where = ['id'=>$this->uid];
        $Obj_users->B_field = 'balance,total_balance';
        $this->assign('user_info',$Obj_users->getOne());

        // 申请中的提现
        $Obj_with_cash->B_where = ['uid'=>$this->uid,'state'=>0];
        $this->assign('withdraw_ing',$Obj_with_cash->getOne());

        // 提现记录
        $withdraw_list = Db::name('withdraw_cash')
                        ->where('uid',$this->uid)
                        ->order('id desc')
                        ->select();
        $this->assign('withdraw_list',$withdraw_list);

        // 今日开始时间
        $today = strtotime(date("Y-m-d"),time()); 

        // 打赏收益(列表)
        $list_reward  = Db::name('lives_reward_log')
                    ->alias('lrl')
                    ->join('users u','lrl.uid=u.id','left')
                    ->join('lives l','lrl.live_id=l.id','left')
                    ->field('lrl.reward_money,lrl.create_time,u.nickname,u.photo,l.title')
                    ->where('lrl.zhubo_id',$this->uid)
                    ->where('lrl.state',1)
                    ->select();
        $this->assign('list_reward',$list_reward);

        // 初始化条件变量
        $count_where = $today_where = 1;

        // 打赏收益(总计)
        $count_where = [
            'zhubo_id'  => $this->uid,
            'state'     => 1
        ];
        $count_reward = $this->sumReward($count_where);
        $this->assign('count_reward',$count_reward);

        // 今日打赏收益(今日)
        $today_where = [
            'zhubo_id'      => $this->uid,
            'state'         => 1,
            'create_time'   => ['>=',$today]
        ];
        $today_reward = $this->sumReward($today_where);
        $this->assign('today_reward',$today_reward);

        // 订单明细
        $order_list = Db::name('orders')
                    ->where('zhubo_id',$this->uid)
                    ->where('status',1)
                    ->select();
        $this->assign('order_list',$order_list);

        // 订单合计
        $Obj_orders->B_where = ['zhubo_id'=>$this->uid , 'status'=>1];
        $Obj_orders->S_field = 'amount';
        $this->assign('count_order',$Obj_orders->getSum());

        return $this->fetch();
    }

    /**
     * 打赏合计
     * @param  integer $where [description]
     * @return [type]         [description]
     */
    private function sumReward($where=1)
    {
        $Obj_lives_reward_log = Model('lives_reward_log');
        $Obj_lives_reward_log->B_where = $where;
        $Obj_lives_reward_log->S_field = 'reward_money';
        return $Obj_lives_reward_log->getSum();
    }

    /**
     * 申请提现
     */
    public function applyCash()
    {
        $Obj_users      = Model('users');
        $withdraw_cash  = Model('withdraw_cash');

        if(input('post.')){
            // 获取用户可提现余额
            $Obj_users->B_where = ['id'=>$this->uid];
            $Obj_users->V_field = 'balance';
            $balance = $Obj_users->getOneVal();
            if($balance < input('post.money')){
                return $this->error("余额不足");
            }

            if(input('post.money') <=0){
                return $this->error('提现金额有误');
            }

            $params['uid']          = $this->uid;
            $params['money']        = input('post.money');
            $params['create_time']  = $params['update_time'] = time();
            $params['state']        = 0;

            $withdraw_cash->B_data = $params;
            $re = $withdraw_cash->newInsert();
            if($re){

                $Obj_users->B_where     = ['id'=>$this->uid];
                $Obj_users->fieldArr    = ['balance'=>$balance-$params['money']];
                $Obj_users->editIntro();

                return $this->success('已申请,请耐心等待财务系统审核');
            }else{
                return $this->error('系统繁忙,稍后重试');
            }

        }

        return $this->error('提现手势不对呦 TnT');

    }

    //我的直播间 -- 我是主播
    public function accounts()
    {
        $Obj_users = Model('users');
        $Obj_lives = Model('lives');

        // 用户基本信息
        $Obj_users->B_where = ['id'=>$this->uid];
        $this->assign('user_info',$Obj_users->getOne());

        // 本用户课程
        $Obj_lives->B_where = ['uid'=>$this->uid,'is_del'=>0];
        $Obj_lives->B_order = 'is_top desc';                    // 置顶排序
        $this->assign('lives',$Obj_lives->getAll());

        return $this->fetch();
    }

    /**
     * 编辑主播描述
     */
    public function editIntro()
    {
        $Obj_users = Model('users');

        if(input('post.')){
            $introduce = input('post.introduce','');

            $Obj_users->B_where     = ['id'=>$this->uid];
            $Obj_users->fieldArr    = ['introduce'=>input('post.introduce','') , 'update_time'=>time()];
            $re = $Obj_users->editIntro();
            if($re){
                $this->success('已更新');
            }else{
                $this->success('失败');
            }
        }

    }
    

    //直播间收益
    public function profits()
    {
        return $this->fetch();
    }

    /**
     * 赠送给好友的直播
     * @return [type] [description]
     */
    public function center()
    {
        $uid = $this->uid;

        $gifts = Db::name('gift_lives')
                ->alias('gl')
                ->join('lives l','gl.live_id=l.id')
                ->field('l.cover_pic , l.title , gl.total_num , gl.be_userd_num')
                ->where('gl.uid',$uid)
                ->where('gl.state',1)
                ->select();
        $this->assign('gifts',$gifts);

        return $this->fetch();
    }


    /**
     * 直播详情
     * @return [type] [description]
     */
    public function live_detail()
    {
        $uid = $this->uid;

        // 直播详情
        $id = input('get.id');
        $info = Db::name('lives')
                ->where('is_del',0)
                ->where('id',$id)
                ->find();
        $this->assign('info',$info);

        // 主播信息
        $u_info = Db::name('users')
                ->where('id',$info['uid'])
                ->find();
        $this->assign('anchor',$u_info);

        // 是否关注
        $is_follow = Db::name('interest_lives')
                    ->where('live_id',$id)
                    ->where('uid',$uid)
                    ->where('is_del',0)
                    ->count();
        $this->assign('is_follow',$is_follow ? 1 : 0);

        // 是否已购买
        $is_vip = Db::name('orders')
                ->where('uid',$uid)
                ->where('live_id',$id)
                ->where('status',1)
                ->count();
        $this->assign('is_vip',$is_vip ? 1 : 0);

        return $this->fetch();
    }


    //主播首页
    public function zhubo()
    {
        $id = input('get.id');
        $uid = $this->uid;

        $anchor_info = Db::name('users')->where('id',$id)->find();
        $this->assign('anchor',$anchor_info);

        // 是否关注
        $is_follow = Db::name('interest_zhubo')
                    ->where('zb_id',$id)
                    ->where('uid',$uid)
                    ->where('is_del',0)
                    ->count();
        $this->assign('is_follow',$is_follow ? 1 : 0);

        // 主播的课程
        $lives = Db::name('lives')
                ->where('uid',$id)
                ->where('is_show',1)
                ->where('is_del',0)
                ->select();
        $this->assign('lives',$lives);

        return $this->fetch();
    }

    //直播间 -- 观众页
    public function live_in()
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

        $this->assign('jinyan',$this->is_jinyan($this->uid,$id));

        $this->assign('info', $info);
        $this->assign('nowTime',time());

        return $this->fetch();
    }


    public function is_jinyan($uid,$live_id)
    {
        $res=Db::name('orders')->where('uid',$uid)->where('live_id',$live_id)
            ->value('jinyan');
        if($res==1){
            return 1;
        }else{
            return 0;
        }

    }


}
