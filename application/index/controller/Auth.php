<?php

namespace app\index\controller;

use app\common\controller\Frontend;
use app\index\controller\Weixin;
use app\admin\model\User;

use fast\Random;
use fast\Tree;
use think\Cookie;
use think\Db;
use think\Exception;
use think\Request;
use think\Session;

class Auth extends Frontend
{


    public function __construct()
    {
        parent::__construct();
    }



    public function index()
    {

        $wxConfig = config('weixin');
        $wx_appid = $wxConfig['appid'];
        $back_url = url("index/auth/oauth2");
        $back_url = $this->request->domain() . $back_url;
        $back_url = urlencode($back_url);
//        $login_url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=$wx_appid&redirect_uri=$back_url&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect";
        $login_url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=$wx_appid&redirect_uri=$back_url&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect";
        $this->redirect($login_url);

    }

    public function oauth2()
    {


        try {
            $weixin = new Weixin();
            $url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=$weixin->appid&secret=$weixin->appsecret&code=" . $_GET['code'] . "&grant_type=authorization_code";
            $res = $weixin->https_request($url);
            $res = (json_decode($res, true));
            $row = $weixin->get_user_info($res['openid']);
            \session('wx', $row);
            $this->redirect(url('index/user/index'));

        } catch (Exception $exception) {

//            echo "<script>alert('授权出错,请重试!');</script>";
            $this->redirect(url('index/auth/autherror'));
            //$this->error('授权出错,请重新授权!',url('index/auth/index'));

        }


    }


    /**
     * 授权出错
     */
    public function autherror()
    {

       return $this->view->fetch();
    }


    public function bind()
    {

        //是否微信授权
        $wx = \session('wx');
        if (!$wx) {
            $this->redirect('index/auth/index');
        }
        //是否绑定过
        $user = Db::name('user')->where('open_id', $wx['openid'])->find();
        if ($user) {
            \session('user', $user);
            $this->redirect('index/user/index');
        }


        if ($this->request->isAjax()) {
            $mobile = input('tel');
            $ack = input('ack');
            if (!$mobile || !$ack) {
                $this->error('失 败');
            }
            $userTable = Db::name('user');
            if (isMobileNum($mobile)) {

                try {
                    $res = $userTable->where('mobile', $mobile)->field('id,ack,open_id')->find();
                    if ($res) {
                        if ($res['open_id']) {
                            $this->error('手机号已被绑定');
                        }

                        if ($res['ack'] == $ack) {
                            $update = [];
                            $update['auth_time'] = time();
                            $wx = \session('wx');
                            $update['open_id'] = $wx['openid'];
                            $userTable->where('id', $res['id'])->update($update);
                            $user = $userTable->where('id', $res['id'])->find();
                            \session('user', $user);
                            $this->success('成 功', url('index/user/index'));
                        } else {
                            $this->error('激活码不正确');
                        }

                        $this->error('失 败');
                    } else {
                        $this->error('手机号未注册');
                    }

                } catch (Exception $exception) {
                    $this->error('失 败');
                }


            } else {
                $this->error('手机号不正确');
            }


        } else {

        }
        return $this->view->fetch();

    }


    public function login($username, $password, $keeptime = 0)
    {
        $User = User::get(['username' => $username]);
        if (!$User) {
            return false;
        }
        if ($User->password != md5(md5($password) . $User->salt)) {
            $User->loginfailure++;
            $User->save();
            return false;
        }
        $User->loginfailure = 0;
        $User->logintime = time();
        $User->token = Random::uuid();
        $User->save();
        Session::set("User", $User);
        $this->keeplogin($keeptime);
        return true;
    }

    /**
     * 注销登录
     */
    public function logout()
    {
        $User = User::get(intval($this->id));
        if (!$User) {
            return true;
        }
        $User->token = '';
        $User->save();
        Session::delete("User");
        Cookie::delete("keeplogin");
        return true;
    }

    /**
     * 自动登录
     * @return boolean
     */
    public function autologin()
    {
        $keeplogin = Cookie::get('keeplogin');
        if (!$keeplogin) {
            return false;
        }
        list($id, $keeptime, $expiretime, $key) = explode('|', $keeplogin);
        if ($id && $keeptime && $expiretime && $key && $expiretime > time()) {
            $User = User::get($id);
            if (!$User || !$User->token) {
                return false;
            }
            //token有变更
            if ($key != md5(md5($id) . md5($keeptime) . md5($expiretime) . $User->token)) {
                return false;
            }
            Session::set("User", $User);
            //刷新自动登录的时效
            $this->keeplogin($keeptime);
            return true;
        } else {
            return false;
        }
    }

    /**
     * 刷新保持登录的Cookie
     * @param int $keeptime
     * @return boolean
     */
    protected function keeplogin($keeptime = 0)
    {
        if ($keeptime) {
            $expiretime = time() + $keeptime;
            $key = md5(md5($this->id) . md5($keeptime) . md5($expiretime) . $this->token);
            $data = [$this->id, $keeptime, $expiretime, $key];
            Cookie::set('keeplogin', implode('|', $data));
            return true;
        }
        return false;
    }


    /**
     * 检测是否登录
     *
     * @return boolean
     */
    public function isLogin()
    {
        if ($this->isAuth()) {
            $this->success();
        } else {
            $this->error();
        }
    }


}
