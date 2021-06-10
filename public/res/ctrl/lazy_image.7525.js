(function() {
    var finished = true;
    var imageSizes = {};
    var imageId = 0;

    //设置灰色方块
    function setupPlaceHolders() {
        $('img[lazy-src]').each(function(i, elem) {
            var lazySrc = $(elem).attr('lazy-src');
            var imageItem = imageSizes[lazySrc];
            if (imageItem) {
                //图替换成一个灰色div
                var className = '_lazy_image_' + imageItem.id;
                if ($(elem).hasClass(className))
                    return;
                $(elem).addClass(className).hide();

                //适应页面尺寸
                var imageWidth = imageItem.width || 100;
                var imageHeight = imageItem.height || 100;
                var $parent = $(elem).parent();
                while ($parent && $parent.innerWidth() == 0) {
                    $parent = $parent.parent();
                }
                if ($parent && $parent.innerWidth() < imageWidth) {
                    imageHeight = Math.floor(imageHeight * $parent.innerWidth() / imageWidth);
                    imageWidth = $parent.innerWidth();
                }
                var placeHolder = $('<center><div><img style="width:32px" src="' + App.res.imageSpin + '"></div></center>')
                        .addClass('_lazy_placeholder')
                        .attr('data-id', imageItem.id)
                        .children()
                        .css('width', imageWidth + 'px')
                        .css('height', imageHeight + 'px')
                        .css('background-color', '#eeeeee')
                        .css('display', 'table-cell')
                        .css('text-align', 'center')
                        .css('vertical-align', 'middle')
                        .parent();
                placeHolder.insertBefore(elem);

                finished = false;
                setTimeout(updateImages, 100);
            }
        });
    }

    App.ctrls.lazyImage = {
        //替换html的图片
        processHtml: function(html) {
            var imgPattern = new RegExp('<img [^>]*>', 'g');
            var srcPattern = new RegExp('\\ssrc=[\'"](.*?)[\'"]');
            var match = html.match(imgPattern);
            $(match).each(function(i, item) {
                var matchSrc = item.match(srcPattern);
                if (matchSrc) {
                    var realSrc = matchSrc[1];
                    var sizeUrl = realSrc.split('?')[0] + '/size';
                    App.http(sizeUrl, function(rspText) {
                        rspData = eval('(' + rspText + ')');
                        //if (rspData.width && rspData.height) {
                            imageId += 1;
                            var imageItem = {
                                id: imageId,
                                width: rspData.width,
                                height: rspData.height,
                            };
                            imageSizes[realSrc] = imageItem;
                            setTimeout(setupPlaceHolders, 100);
                        //}
                    }, true);
                }
                //var newItem = item.replace(/\bsrc=/, 'src="' + App.res.loadingSpin + '" lazy-src=');
                var newItem = item.replace(/\ssrc=/, ' lazy-src=').replace(/\b_lazy_image_\d+\b/, '');
                html = html.replace(item, newItem);
                finished = false;
            });
            return html;
        }
    };

    //更新图片
    function updateImages() {
        if (finished)
            return;

        var images = $("._lazy_placeholder");
        $(images).each(function (index) {
            var rect = this.getBoundingClientRect();
            if (rect.bottom <= $(window).height() * 1.3) {
                var $placeHolder = $(this);
                if ($placeHolder.attr('loading'))
                    return;
                var curId = $placeHolder.attr('data-id');
                var $imgElem = $placeHolder.next('img');
                var lazySrc = $imgElem.attr("lazy-src");
                var imageItem = imageSizes[lazySrc];
                $placeHolder.attr('loading', 1);

                //压缩图片
                var resizeSrc = App.resizeImageUrl($imgElem.get(0), lazySrc);

                //开始加载图片
                //$placeHolder.append($('<img>').attr('src', App.res.imageSpin).css('width', '32px'));
                var image = new Image();
                image.src = resizeSrc;
                image.onload = function() {
                    //图片加载完成
                    $imgElem.attr("src", resizeSrc).removeAttr("lazy-src").show();
                    $placeHolder.remove();

                    //保存图片尺寸
                    if (!imageItem.width && !imageItem.height) {
                        if (image.width && image.height) {
                            App.api('upload/save_image_size', {url:lazySrc, width:image.width, height:image.height});
                        }
                    }
                }
            }
        });
        if (images.length == 0) {
            finished = true;
        }
    }

    //滑动加载图片
    $(window).on('DOMContentLoaded load resize scroll', function () {;
        updateImages();
    })
})();