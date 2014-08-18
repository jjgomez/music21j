/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/feedback -- messages to the student and score updates.
 * 
 * Copyright (c) 2014, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['m21theory/random', 'm21theory/userData', 'jquery', 'm21theory/misc'], 
        function (random, userData, $, misc) {
    var feedback = {};
    
    feedback.Scoreboard = function (bank) {
        this.bank = bank;
        this.scoreDiv = undefined;
        this.mainPB = undefined;
        this.pbSubparts = [];
    };
    feedback.Scoreboard.prototype.render = function ($where) {        
        if ($where === undefined) {
            $where = $('#infoDiv');
            if ($where === undefined && this.bank !== undefined) {
                $where = $(this.bank.testBankSelector).parent(); 
            } else if ($where === undefined) {
                $where = $(document.body);
            }
        }
        var $d = $("<div id='scoreBoard' class='sidebarContent'/>");
        var $title = $("<p class='sidebarTitle'>Progress</p>");
        $d.append($title);

        var $pb = this.getProgressBar(30);
        this.mainPB = $pb;
        $d.append($pb);
        $d.append($("<br/>"));
        
        for (var i = 0; i < this.bank.allTests.length; i++) {            
            var $subPB = this.getProgressBar(20);
            this.pbSubparts.push( $subPB );
            $d.append($subPB);
        }
        
        misc.addScrollFixed($d, $where);
        this.updateProgressBars();
        return $d;        
    };
    feedback.Scoreboard.prototype.updateProgressBars = function () {
        var totalQs = 0;
        var totalRight = 0;
        var totalWrong = 0;
        
        for (var i = 0; i < this.bank.allTests.length; i++) {
            var t = this.bank.allTests[i];
            var $pb = this.pbSubparts[i];
            var numQs = t.totalQs - t.practiceQs;
            var numRight = t.numRight;
            var numWrong = t.numWrong;
            if (t.studentFeedback) {
                var $rightBar = $pb.find('.correctBar');                
                if (t.numMistakes > t.maxMistakes) {
                    $rightBar.css('background-color', '#dddd66');
                } else {
                    $rightBar.css('background-color', '#66aa66');                    
                }
            }
            totalQs += numQs;
            totalRight += numRight;
            totalWrong += numWrong;
            this.updateProgressBarPercentages($pb, numQs, numRight, numWrong);
        };
        this.updateProgressBarPercentages(this.mainPB, totalQs, totalRight, totalWrong);
    };
        
    feedback.Scoreboard.prototype.updateProgressBarPercentages = function ($pb, numQs, numRight, numWrong) {
        var rightPercent = 100 * numRight/numQs;
        var wrongPercent = 100 * numWrong/numQs;
        var $rightBar = $pb.find('.correctBar');
        var $wrongBar = $pb.find('.incorrectBar');
        $rightBar.css('width', rightPercent.toString() + "%");
        $wrongBar.css('width', wrongPercent.toString() + "%");        
        if (numRight == numQs) {
            $rightBar.css({
                'border-top-right-radius': '7px',
                'border-bottom-right-radius': '7px',
            });
            if ($pb.data('hasGlowed') != true) {
                if (this.bank.studentFeedback) {
                    this.glow($rightBar);                    
                    $rightBar.text('DONE');
                };
                $pb.data('hasGlowed', true);
            }
        } else {
            $rightBar.css({
                'border-top-right-radius': '0px',
                'border-bottom-right-radius': '0px',
            });            
        }
        if (numRight == 0 && numWrong > 0) {
            $wrongBar.css({
                'border-top-left-radius': '7px',
                'border-bottom-left-radius': '7px',
            });            
        } else {
            $wrongBar.css({
                'border-top-left-radius': '0px',
                'border-bottom-left-radius': '0px',
            });                       
        }
        if (numRight + numWrong == numQs) {
            $wrongBar.css({
                'border-top-right-radius': '7px',
                'border-bottom-right-radius': '7px',
            });            
        } else {
            $wrongBar.css({
                'border-top-right-radius': '0px',
                'border-bottom-right-radius': '0px',
            });                    
        }
    };
    
    feedback.Scoreboard.prototype.getProgressBar = function (height) {
        if (height === undefined) {
            height = 20;
        }
        var $pb = $("<div class='progressBarHolder'></div>").css({
            width:'100%',
            'background-color': '#eee',
            border: '1px black solid',
            'margin-bottom': '5px',
            'border-radius': '7px',
            'height': height.toString() + 'px',
            });
        var $correct = $("<div class='progressBarPart correctBar'>&nbsp;</div>").css({
            'background-color': '#66aa66',
            color: 'white',
            'border-top-left-radius': '7px',
            'border-bottom-left-radius': '7px',
            'text-align': 'center',
            'font-weight': 'bold',
        });
        var $incorrect = $("<div class='progressBarPart incorrectBar'>&nbsp;</div>").css({
            'background-color': '#995555', 
            color: 'white',
        });
        $pb.append($correct);
        $pb.append($incorrect);
        $pb.find(".progressBarPart").css({
            width: '33%',
            display: 'inline-block',
            height: '100%',
        });
        if (this.bank.studentFeedback == false) {
            $pb.find(".progressBarPart").css('background-color', '#666666');                    
        }
        return $pb;
    };
    feedback.Scoreboard.prototype.glow = function ($what, size, animateTime) {
        var stepFunc = function (currentTempPropertyValue) {            
            var goldColor = "#006644";
            var computed = '0px 0px ' + currentTempPropertyValue + 'px ' + goldColor;                
            $(this).css('box-shadow', computed);
        };
        var stepFunc2 = function (currentTempPropertyValue) {            
            var goldColor = "#006644";
            var computed = '0px 0px ' + (size - currentTempPropertyValue) + 'px ' + goldColor;                
            $(this).css('box-shadow', computed);
        };
        
        var storedTextShadow = $what.css('box-shadow');
        size = size || 50;
        animateTime = animateTime || 3000;        
        $what.css('-m21j-TempProperty', 0);
        $what.animate({'-m21j-TempProperty': size}, {
            duration: animateTime,
            step: stepFunc,
            complete: function () { 
                $(this).animate({'-m21j-TempProperty': size}, {
                    duration: animateTime,
                    step: stepFunc2,   
                    complete: function () { 
                        $what.css('-m21j-TempProperty', "");
                        if (storedTextShadow !== undefined) {
                            $what.css('box-shadow', storedTextShadow);
                        }
                    }
                }); 
            },
        }
        );
        return $what; // passthrough..
    };
    
    feedback.alert = function (msg, type, params) {
        var bgColor = '#ffff99';
        var fontColor = 'black';
        var fontWeight = 'normal';
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
            fontWeight = 'bold';
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
            .css('font-weight', fontWeight)
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