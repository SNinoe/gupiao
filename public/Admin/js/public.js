/**
 * Created by Administrator on 17-7-11.
 */
/*单条 删除*/
function onedel(obj,url,id){
    layer.confirm('确认要删除吗？',function(){
            $.ajax({
                type: 'POST',
                url: url,
                data:{id:id},
                dataType: 'json',
                success: function(data){
                    if(data){
                        if(data == 9){
                            layer.msg('您没此权限!',{icon:4,time:1000});
                        }else if(data == 5){
                            layer.msg('此分类下有菜品，不可删除!',{icon:4,time:1000});
                        }else if(data == 1){
                            $(obj).parents("tr").remove();
                            layer.msg('已删除!',{icon:1,time:1000});
                        }
                    }else{
                        layer.msg('删除失败!',{icon:0,time:1000});
                        console.log(data.msg);
                    }
                },
                error:function(data) {
                    layer.msg('删除失败e!',{icon:0,time:1000});
                    console.log(data.msg);
                }
            })
        }
    );
}

//恢复用户
function restore(obj,url,id){
        layer.confirm('确认要恢复吗？',function(){
                $.ajax({
                    type: 'POST',
                    url: url,
                    data:{id:id},
                    dataType: 'json',
                    success: function(data){
                        if(data){
                            if(data == 9){
                                layer.msg('您没此权限!',{icon:4,time:1000});
                            }else{
                                $(obj).parents("tr").remove();
                                layer.msg('已恢复!',{icon:6,time:1000});
                            }
                        }else{
                            layer.msg('恢复失败!',{icon:0,time:1000});
                            console.log(data.msg);
                        }
                    },
                    error:function(data) {
                        layer.msg('恢复失败!',{icon:0,time:1000});
                        console.log(data.msg);
                    }
                })
            }
        );
}


//用户的停用ajax方法
function disable(obj,url,id){
    var obj_value = $(obj).parents('tr').children('.td-status').children('span').html();
    if(obj_value == '已禁用'){
        layer.confirm('确认要启用吗？',function(){
                $.ajax({
                    type: 'POST',
                    url: url,
                    data:{id:id},
                    dataType: 'json',
                    success: function(data){
                        if(data){
                            if(data == 9){
                                layer.msg('您没此权限!',{icon:4,time:1000});
                            }else{
                                $(obj).html('<i class="Hui-iconfont">&#xe631;</i>');
                                $(obj).attr('title',"禁用");
                                $(obj).parents("tr").find(".td-status").html('<span class="label label-success radius">已启用</span>');
                                layer.msg('已启用!',{icon:6,time:1000});
                            }
                        }else{
                            layer.msg('启用失败!',{icon:0,time:1000});
                        }
                    },
                    error:function(data) {
                        layer.msg('启用失败e!',{icon:0,time:1000});
                    }
                })
            }
        );
    }else{
        layer.confirm('确认要禁用吗？',function(){
                $.ajax({
                    type: 'POST',
                    url: url,
                    data:{id:id},
                    dataType: 'json',
                    success: function(data){
                        if(data){
                            if(data == 9){
                                layer.msg('您没此权限!',{icon:4,time:1000});
                            }else{
                                $(obj).html('<i class="Hui-iconfont">&#xe615;</i>');
                                $(obj).attr('title',"启用");
                                $(obj).parents("tr").find(".td-status").html('<span class="label  radius">已禁用</span>');
                                layer.msg('已禁用!',{icon:6,time:1000});
                            }
                        }else{
                            layer.msg('禁用失败!',{icon:0,time:1000});
                            console.log(data.msg);
                        }
                    },
                    error:function(data) {
                        layer.msg('停用失败e!',{icon:0,time:1000});
                        console.log(data.msg);
                    }
                })
            }
        );
    }

}

/*批量删除*/
function batchdel(url){
    var da = new Array();
    var i=0;
    $(".check-tr input[type='checkbox']").each(function(){
        if($(this).is(':checked')){
            da[i] = $(this).val();
            i++;
        }
    });
    var la = '';
    for(var i=0;i<da.length;i++){
        la +=da[i]+','
    }
    if(la.length>0){
        la=la.substring(0,la.length-1);
        layer.confirm('确认要删除吗？',function(){
                $.ajax({
                    type: 'POST',
                    url: url,
                    data:{la:la},
                    dataType: 'json',
                    success: function(data){
                        if(data){
                            if(data == 9){
                                layer.msg('您没此权限!',{icon:4,time:1000});
                            }else{
                                var obj = eval('(' + data + ')');
                                for(var i in obj){
                                    $('#tr'+obj[i]).remove();
                                }
                                layer.msg('已删除!',{icon:1,time:1000});
                            }
                        }else{
                            layer.msg('删除失败!',{icon:0,time:1000});
                        }
                    },
                    error:function(data) {
                        layer.msg('删除失败e!',{icon:0,time:1000});
                    }
                })
            }
        );
    }
}

/*批量还原*/
function batchRestore(url){
    var da = new Array();
    var i=0;
    $(".check-tr input[type='checkbox']").each(function(){
        if($(this).is(':checked')){
            da[i] = $(this).val();
            i++;
        }
    });
    var la = '';
    for(var i=0;i<da.length;i++){
        la +=da[i]+','
    }
    if(la.length>0){
        la=la.substring(0,la.length-1);
        layer.confirm('确认要还原吗？',function(){
                $.ajax({
                    type: 'POST',
                    url: url,
                    data:{la:la},
                    dataType: 'json',
                    success: function(data){
                        if(data){
                            if(data == 9){
                                layer.msg('您没此权限!',{icon:4,time:1000});
                            }else{
                                var obj = eval('(' + data + ')');
                                for(var i in obj){
                                    $('#tr'+obj[i]).remove();
                                }
                                layer.msg('已还原!',{icon:1,time:1000});
                            }
                        }else{
                            layer.msg('还原失败!',{icon:0,time:1000});
                        }
                    },
                    error:function(data) {
                        layer.msg('还原失败!',{icon:0,time:1000});
                    }
                })
            }
        );
    }
}