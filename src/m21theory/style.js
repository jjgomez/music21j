
define(['jquery', 'music21/common'], 
        function($, common) {
    var style = {};
    style.apply = function (options) {
        //var params = {};
        //common.merge(params, options);
        var $head = $('head');
        var titleText = document.title;
        $head.append($('<link rel="stylesheet" href="../css/m21theory.css" type="text/css" />'));
        $('#loadingBox').remove();
        var $related = $('<div class="related"><ul><li><a href="#">21m.051 Cuthbert</a> &raquo; ' + 
                '<a href="#">' + titleText + '</a></li></ul></div>');
        var $mainDocument = $('<div class="document"><div class="documentwrapper">' + 
                '<div class="sidebar" id="infoDiv"/>' + 
                '<div class="bodywrapper"><div class="body" id="testBank"></div></div></div></div>');
        $(document.body).append($related, $mainDocument);        
    };
    
    if (music21j !== undefined) {
        music21j.style = style;
    }
    return style;
});