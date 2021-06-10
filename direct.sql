/*
Navicat MySQL Data Transfer

Source Server         : 本地库
Source Server Version : 50553
Source Host           : localhost:3306
Source Database       : direct

Target Server Type    : MYSQL
Target Server Version : 50553
File Encoding         : 65001

Date: 2018-02-02 19:04:30
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for zb_article
-- ----------------------------
DROP TABLE IF EXISTS `zb_article`;
CREATE TABLE `zb_article` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nav_id` int(11) DEFAULT '0' COMMENT '导航id',
  `uid` int(11) DEFAULT '0' COMMENT '用户id',
  `title` varchar(50) DEFAULT NULL COMMENT '文章标题',
  `author` varchar(10) DEFAULT NULL COMMENT '作者',
  `num` int(10) DEFAULT '0' COMMENT '阅读量',
  `create_time` varchar(10) DEFAULT NULL COMMENT '创建时间',
  `update_time` varchar(10) DEFAULT NULL COMMENT '更新时间',
  `is_show` tinyint(1) DEFAULT '0' COMMENT '0隐藏 1显示',
  `is_del` tinyint(1) DEFAULT '0' COMMENT '0未删除 1删除',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of zb_article
-- ----------------------------

-- ----------------------------
-- Table structure for zb_banner
-- ----------------------------
DROP TABLE IF EXISTS `zb_banner`;
CREATE TABLE `zb_banner` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) DEFAULT NULL COMMENT '标题',
  `pic` varchar(255) DEFAULT NULL COMMENT '图片地址',
  `url` varchar(255) DEFAULT NULL COMMENT '跳转链接',
  `sort` tinyint(5) DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) DEFAULT '1' COMMENT '默认1显示 0隐藏',
  `is_del` tinyint(1) DEFAULT '0' COMMENT '0未删除 1删除',
  `create_time` varchar(10) DEFAULT NULL COMMENT '创建时间',
  `update_time` varchar(10) DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of zb_banner
-- ----------------------------
INSERT INTO `zb_banner` VALUES ('1', '直播', '/uploads/20180129\\e165e3e752d1e2621e4f5ff796ac044f.png', 'http://shop.maliangss.com', '0', '1', '0', '1517211964', '1517211964');
INSERT INTO `zb_banner` VALUES ('2', '商家公告', '/uploads/20180129\\bb8f0e3b63b0375fc7b1a3c9f9329247.jpg', 'http://www.163.com', '0', '0', '1', '1517211964', '1517211964');
INSERT INTO `zb_banner` VALUES ('3', '直播', '/uploads/20180129\\b04a20fea75b22f21efbe9a449914192.jpg', 'http://weibo.com/', '0', '0', '0', '1517222157', '1517222157');
INSERT INTO `zb_banner` VALUES ('4', '直播', '/uploads/20180130\\8daf8c2d3401add809a44cc6fea473fb.jpg', 'http://wq.gexinec.net/api.php?id=2', '0', '1', '0', '1517276415', '1517276415');

-- ----------------------------
-- Table structure for zb_classify
-- ----------------------------
DROP TABLE IF EXISTS `zb_classify`;
CREATE TABLE `zb_classify` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL COMMENT '导航名',
  `icon` varchar(255) DEFAULT NULL COMMENT '图标',
  `sort` tinyint(5) DEFAULT '0' COMMENT '排序',
  `is_del` tinyint(1) DEFAULT '0' COMMENT '0未删除 1删除',
  `is_show` tinyint(1) DEFAULT '1' COMMENT '默认1显示 0隐藏',
  `create_time` varchar(10) DEFAULT NULL COMMENT '创建时间',
  `update_time` varchar(10) DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of zb_classify
-- ----------------------------
INSERT INTO `zb_classify` VALUES ('1', '语文', '/uploads/20180130\\947df6d31a723d3f905327a965ed02c4.png', '0', '0', '1', '1517281454', '1517282145');
INSERT INTO `zb_classify` VALUES ('2', '数学', '/uploads/20180130\\9ba5fae200f994986125a913edab7f99.png', '0', '0', '1', '1517281483', '1517304026');
INSERT INTO `zb_classify` VALUES ('3', '英语', '/uploads/20180130\\d2628dd8fd64b2b54d7ad92a65b18906.png', '0', '0', '1', '1517281563', '1517304036');
INSERT INTO `zb_classify` VALUES ('4', '物理', '/uploads/20180130\\1876dc0314b775005d008a1e4bd7124a.png', '0', '0', '1', '1517281690', '1517304047');
INSERT INTO `zb_classify` VALUES ('5', '化学', '/uploads/20180130\\e885c80ed6b1380d074c2e56ca13369f.png', '0', '0', '1', '1517281708', '1517304055');
INSERT INTO `zb_classify` VALUES ('6', '生物', '/uploads/20180130\\1130b039dbd4841f604c9b9f46df864b.png', '0', '0', '1', '1517281792', '1517304064');
INSERT INTO `zb_classify` VALUES ('7', '历史', '/uploads/20180130\\85f0f73488515238fe6c65a2b6bec0ba.png', '0', '0', '1', '1517281878', '1517304195');
INSERT INTO `zb_classify` VALUES ('8', '政治', '/uploads/20180130\\1cf1db76e3b3708e60dfeab8bfb7921f.png', '0', '0', '1', '1517283845', '1517304110');
INSERT INTO `zb_classify` VALUES ('9', '地理', '/uploads/20180130\\0a1d9bd4dd414ed3d55ed4d843ff986b.png', '0', '0', '1', '1517304223', '1517304223');
INSERT INTO `zb_classify` VALUES ('10', '奥数', '/uploads/20180130\\d4db2bdd29cf5105e788ce4e74035ac0.png', '0', '0', '1', '1517304238', '1517304238');
INSERT INTO `zb_classify` VALUES ('11', '科学', null, '0', '0', '1', '1517304238', '1517304238');
INSERT INTO `zb_classify` VALUES ('12', '社会', null, '0', '0', '1', '1517304238', '1517304238');

-- ----------------------------
-- Table structure for zb_grade
-- ----------------------------
DROP TABLE IF EXISTS `zb_grade`;
CREATE TABLE `zb_grade` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL COMMENT '导航名',
  `icon` varchar(255) DEFAULT NULL COMMENT '图标',
  `sort` tinyint(5) DEFAULT '0' COMMENT '排序',
  `is_del` tinyint(1) DEFAULT '0' COMMENT '0未删除 1删除',
  `is_show` tinyint(1) DEFAULT '1' COMMENT '默认1显示 0隐藏',
  `create_time` varchar(10) DEFAULT NULL COMMENT '创建时间',
  `update_time` varchar(10) DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of zb_grade
-- ----------------------------
INSERT INTO `zb_grade` VALUES ('1', '一年级', null, '0', '0', '1', '1517284496', '1517284650');
INSERT INTO `zb_grade` VALUES ('2', '二年级', null, '0', '0', '1', '1517296955', '1517296955');

-- ----------------------------
-- Table structure for zb_lives
-- ----------------------------
DROP TABLE IF EXISTS `zb_lives`;
CREATE TABLE `zb_lives` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) DEFAULT NULL COMMENT '标题',
  `uid` int(10) NOT NULL DEFAULT '0' COMMENT '用户id',
  `cover_pic` varchar(255) NOT NULL DEFAULT '' COMMENT '封面图片',
  `author` varchar(10) DEFAULT NULL COMMENT '主讲嘉宾 作者',
  `classify` tinyint(5) DEFAULT NULL COMMENT '分类',
  `grade` tinyint(5) DEFAULT NULL COMMENT '年级',
  `price` decimal(10,2) DEFAULT '0.00' COMMENT '价格',
  `enlist` int(11) DEFAULT '0' COMMENT '加入人数',
  `begin_time` varchar(10) DEFAULT NULL COMMENT '开课时间',
  `end_time` int(10) DEFAULT '0' COMMENT '结束时间',
  `desc` varchar(255) DEFAULT NULL COMMENT '简介',
  `create_time` varchar(10) DEFAULT NULL COMMENT '创建时间',
  `update_time` varchar(10) DEFAULT NULL COMMENT '更新时间',
  `is_del` tinyint(1) DEFAULT '0' COMMENT '0未删除 1删除',
  `is_show` tinyint(1) DEFAULT '1' COMMENT '0关闭 1开启',
  `close_reason` varchar(255) DEFAULT NULL COMMENT '关闭原因',
  `is_recomm` tinyint(1) DEFAULT '0' COMMENT '0为推荐 1推荐',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of zb_lives
-- ----------------------------
INSERT INTO `zb_lives` VALUES ('1', '小学数学思维训练营（竞赛）', '1', 'https://n1image.hjfile.cn/hjclass/lesson/intro/201701/8c008919-6f70-4c4b-9a7c-baed290663a9.png', '李老师', '2', '1', '19.99', '5685', '1517308096', '0', '小学一年加减混合运算快速提分技巧', '1517293322', '1517293322', '0', '1', '', '0');
INSERT INTO `zb_lives` VALUES ('2', '\r\n朗文国际英语教程SBS第一册', '1', 'https://f1.c.hjfile.cn/lesson/intro/201603/86bc780e-18af-4c5d-b15f-5a7980694e61.png', '周教授', '3', '2', '9.99', '135', '1517311800', '0', '纯正美式英语课程，融入全球新文化信息，真正提高英语交际能力！', '1517293322', '1517293322', '0', '1', null, '0');
INSERT INTO `zb_lives` VALUES ('3', ' 少儿英语自然拼读法第一级', '1', '', '周老师', '3', '1', '9.99', '0', '1517747400', '0', '“音”“形”自然结合，发音规则轻松掌握！', '1517565694', '1517565694', '0', '1', null, '0');

-- ----------------------------
-- Table structure for zb_manager
-- ----------------------------
DROP TABLE IF EXISTS `zb_manager`;
CREATE TABLE `zb_manager` (
  `id` int(6) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL DEFAULT '' COMMENT '登陆名',
  `name` varchar(20) NOT NULL COMMENT '姓名',
  `phone` char(12) NOT NULL DEFAULT '' COMMENT '手机号',
  `password` varchar(40) NOT NULL COMMENT '密码',
  `login_time` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '上次登录时间',
  `login_ip` varchar(15) NOT NULL DEFAULT '' COMMENT '上次登陆ip',
  `rose` tinyint(5) NOT NULL DEFAULT '0' COMMENT '角色',
  `login_num` int(10) NOT NULL DEFAULT '0' COMMENT '登录次数',
  `usable` tinyint(4) NOT NULL DEFAULT '1' COMMENT '0不可用 1启用',
  `isdel` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '0不删除 1删除',
  `create_time` bigint(20) NOT NULL COMMENT '注册时间',
  `update_time` bigint(20) NOT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COMMENT='管理员表';

-- ----------------------------
-- Records of zb_manager
-- ----------------------------
INSERT INTO `zb_manager` VALUES ('1', 'admin', '管理员', '18236922800', 'e10adc3949ba59abbe56e057f20f883e', '1517542404', '127.0.0.1', '0', '13', '1', '0', '1516851688', '1516851688');
INSERT INTO `zb_manager` VALUES ('2', 'ka', '客服', '13599256655', 'e34a8899ef6468b74f8a1048419ccc8b', '1516874522', '127.0.0.1', '1', '1', '0', '0', '1516851688', '1516851688');

-- ----------------------------
-- Table structure for zb_orders
-- ----------------------------
DROP TABLE IF EXISTS `zb_orders`;
CREATE TABLE `zb_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) DEFAULT '0' COMMENT '用户id',
  `live_id` int(11) DEFAULT '0' COMMENT '直播id',
  `amount` double(10,2) DEFAULT '0.00' COMMENT '购买金额',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of zb_orders
-- ----------------------------
INSERT INTO `zb_orders` VALUES ('1', '1', '1', '9.99');
INSERT INTO `zb_orders` VALUES ('2', '1', '2', '0.00');

-- ----------------------------
-- Table structure for zb_users
-- ----------------------------
DROP TABLE IF EXISTS `zb_users`;
CREATE TABLE `zb_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nickname` varchar(20) DEFAULT '' COMMENT '昵称',
  `openid` varchar(50) DEFAULT '' COMMENT '微信用户标志',
  `photo` varchar(255) DEFAULT NULL COMMENT '头像',
  `tel` varchar(11) DEFAULT NULL COMMENT '手机号',
  `name` varchar(20) DEFAULT NULL COMMENT '姓名',
  `ID_card` varchar(20) DEFAULT NULL,
  `sex` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1男士 2女士',
  `age` int(2) DEFAULT NULL COMMENT '年龄',
  `introduce` varchar(50) DEFAULT NULL COMMENT '一句话自我介绍',
  `attest` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0未认证 1申请认证 2认证通过 -1r认证拒绝',
  `att_desc` varchar(255) DEFAULT NULL COMMENT '认证备注',
  `identity` tinyint(1) NOT NULL DEFAULT '0' COMMENT '身份 0会员 1讲师',
  `promoter` int(10) NOT NULL DEFAULT '0' COMMENT '推广人id',
  `be_guanzhu` int(10) DEFAULT '0' COMMENT '被关注数',
  `create_time` varchar(10) DEFAULT NULL COMMENT '创建时间',
  `update_time` varchar(10) DEFAULT NULL COMMENT '更新时间',
  `is_del` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0未删除 1删除',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of zb_users
-- ----------------------------
INSERT INTO `zb_users` VALUES ('1', '善行天下', 'o11iD1ADedzH1MuElVEpVTrQTNZw', 'http://shop.maliangss.com/addons/ewei_shopv2/static/images/noface.png', '15539442800', '单文斌', '412701199002283070', '1', '28', '专业、务实、求真！', '2', null, '1', '0', '124', '1517294956', '1517294956', '0');
INSERT INTO `zb_users` VALUES ('2', '千年老二', 'o11iD1ADedzH1MuElVEpVTrQT4552', 'http://shop.maliangss.com/addons/ewei_shopv2/static/images/noface.png', '18866998899', '张翔', '412701198566558859', '1', '59', null, '1', '地地道道的', '0', '0', '0', '1517294956', '1517294956', '0');

-- ----------------------------
-- Table structure for zb_web_config
-- ----------------------------
DROP TABLE IF EXISTS `zb_web_config`;
CREATE TABLE `zb_web_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) DEFAULT NULL COMMENT '字段名',
  `config` varchar(50) DEFAULT NULL COMMENT '配置信息',
  `create_time` varchar(10) DEFAULT NULL COMMENT '创建时间',
  `update_time` varchar(10) DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of zb_web_config
-- ----------------------------
