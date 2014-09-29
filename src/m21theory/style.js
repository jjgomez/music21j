
define(['jquery', 'music21/common'], 
        function($, common) {
    var style = {};
    style.apply = function (options) {
        var params = {loadCss: true};
        common.merge(params, options);
        var titleText = document.title;

        if (params.loadCss == true) {
            var $head = $('head');
            $head.append($('<link rel="stylesheet" href="../css/m21theory.css" type="text/css" />'));            
        }
        var $related = $('<div class="related"><ul><li><a href="#">21m.051 Cuthbert</a> &raquo; ' + 
                '<a href="#">' + titleText + '</a></li></ul></div>');
        var $mainDocument = $('<div class="document"><div class="documentwrapper">' + 
                '<div class="sidebar" id="infoDiv"/>' + 
                '<div class="bodywrapper"><div class="body" id="testBank"></div></div></div></div>');
        $('#loadingBox').remove();
        $(document.body).append($related, $mainDocument);        
    };
    
    if (typeof m21theory != "undefined") {
        m21theory.style = style;
    }
    return style;
});