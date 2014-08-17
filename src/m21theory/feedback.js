/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/feedback -- messages to the student and score updates.
 * 
 * Copyright (c) 2014, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['m21theory/random', 'm21theory/userData', 'jquery'], function (random, userData, $) {
    var feedback = {};
    
    feedback.Scoreboard = function (bank) {
        this.bank = bank;
        
    };
    
    feedback.alert = function (msg, type, params) {
        var bgColor = '#ffff99';
        var fontColor = 'black';
        if (params == undefined) {
            params = {};
        }
        var top = ('top' in params) ? params.top : '80px';
        var delayFade = ('delayFade' in params) ? params.delayFade : 5000;
        var fadeTime = ('fadeTime' in params) ? params.fadeTime : 500;
        
        if (typeof(top) != 'string') {
            top = top + 'px';
        }
        
        if (type == 'alert') {
            bgColor = 'red';
            fontColor = 'white';
        } else if (type == 'ok') {
            bgColor = '#99ff99';
            fontColor = 'black';
            delayFade = 10 * 1000;
            fadeTime = 2 * 1000;
        } else if (type == 'update') {
            bgColor = '#e4f0f0';
            fontColor = 'black';
            delayFade = 4 * 1000;
            
        }
        var tdiv = document.body;
        var alertDiv = $("<div>" + msg + "</div>")
            .attr('id', 'alertDiv')
            .css('position', 'fixed')
            .css('top', top)
            .css('left', '750px')
            .css('padding', '30px 30px 30px 30px')
            .css('width', '200px')
            .css('background', bgColor)
            .css('color', fontColor)
            .css('opacity', .9)
            .css('border-radius', '15px')
            .css('box-shadow', '0px 0px 19px #999')
            .delay(delayFade)
            .fadeOut(fadeTime, function () { this.remove(); } );
        $(tdiv).append(alertDiv);
    };
    if (m21theory !== undefined) {
        m21theory.feedback = feedback;
    }
    
    return feedback;
});