(function () {
    function scroll_top() {
        $('.scrolling-main').animate({scrollTop: $('.flex-main').offset().top}, 300);
    }

    function scroll_bottom() {
        $('.scrolling-main').animate({scrollTop: $('.room-footer-bar').offset().top + 500}, 300);
    }

    var h = 76;

    function talk_scroll_bottom() {
        h = h + 76;
        setTimeout(function () {
            $('#discuss-room').animate({scrollTop: $('.talk-footer-bar').offset().top + $('#discuss-room').height() + h}, 300);
        }, 1000)

    }

})();
