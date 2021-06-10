<?php
namespace app\admin\controller;

use think\Controller;
use think\Session;
use think\captcha\Captcha;

/**
 * 后台登陆控制器
 */
class Login extends Controller
{
    /**
     * 构造函数
     */
    public function index()
    {
        $this->redirect('login/logIn');
    }

    /**
     * 登陆页
     */
    public function logIn()
    {
        return $this->fetch();
    }

    /**
     * 登陆操作
     */
    public function logOk()
    {
        if(request()->post()){

            $verify     = input('post.verify');  
            $captcha    = new Captcha();  
            $result     = $captcha->check($verify);  
            if($result===false){  
                return $this->error('验证码错误');
            }  

            $username   = input('post.username','');
            $password   = input('post.password','');

            if(!$username || !$password){
                return $this->error('必填项不可为空');
            }

            $where['username']  = trim($username);

            $model = Model('manager');
            $u_info = $model->getOne($where);

            if(!$u_info){
                return $this->error('用户不存在');
            }

            if($u_info['password'] != md5(trim($password))){
                return $this->error('密码错误');
            }

            // 更新用户信息
            $params['id']           = $u_info['id'];
            $params['login_time']   = time();
            $params['login_num']    = $u_info['login_num'] + 1;
            $params['login_ip']     = request()->ip();
            $model->update($params);

            Session::set('uid',$u_info['id']);
            Session::set('username',$u_info['username']);
            Session::set('name',$u_info['name']);

            return $this->success('登陆成功');
        }

        return $this->error('未正确登陆');
            
    }

    /**
     * 生成验证码
     *
     * 参考：http://blog.csdn.net/leejianjun/article/details/78720698
     */
    public function verify()
    {
        $captcha = new Captcha();  

        $captcha->imageW    = 121;              // 图片宽
        $captcha->imageH    = 35;               // 图片高  
        $captcha->fontSize  = 14;               // 字体大小  
        $captcha->length    = 4;                // 字符数  
        $captcha->fontttf   = '5.ttf';          // 字体  
        $captcha->expire    = 30;               // 有效期  
        $captcha->useCurve  = false;            // 是否加混淆曲线
        $captcha->useNoise  = true;             // 不添加杂点  

        return $captcha->entry();  
    }

    /**
     * 退出 / 切换账户
     */
    public function logOut()
    {
        Session(null);
        $this->redirect('login/logIn');
    }
}
