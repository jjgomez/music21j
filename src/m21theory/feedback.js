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

        var rightBarPriorPercent = $rightBar.data('priorPercentage');
        var wrongBarPriorPercent = $wrongBar.data('priorPercentage');
        if (rightPercent == rightBarPriorPercent && wrongPercent == wrongBarPriorPercent) {
            return;
        }
        
                       
        if (numRight == numQs) {
            $rightBar.css({
                'border-top-right-radius': '7px',
                'border-bottom-right-radius': '7px',
            });
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
                
        //console.log(wrongPercent, wrongBarPriorPercent);
        //$rightBar.text("");
        if (rightPercent == 0) {
            $rightBar.css('display', 'none');
        } else {
            $rightBar.css('display', 'inline-block');
        }
        if (wrongPercent == 0) {
            $wrongBar.css('display', 'none');
        } else {
            $wrongBar.css('display', 'inline-block');
        }
        
        $rightBar.animate({'width': rightPercent.toString() + "%"}, 
                {
                        duration: 30 * (1 + Math.abs(rightPercent - rightBarPriorPercent)),
                });            
        $wrongBar.animate({'width': wrongPercent.toString() + "%"}, 
                {
                       duration: 30 * (1 + Math.abs(wrongPercent - wrongBarPriorPercent))
                });   
        $rightBar.data('priorPercentage', rightPercent);
        $wrongBar.data('priorPercentage', wrongPercent);
        
        if (numRight == numQs && $pb.data('hasGlowed') != true) {
            if (this.bank.studentFeedback) {
                this.glow($rightBar);                    
                $rightBar.text('DONE');
            };
            $pb.data('hasGlowed', true);
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
            'border-top-left-radius': '7px',
            'border-bottom-left-radius': '7px',
            'font-weight': 'bold',
        }).data('priorPercentage', 0);
        var $incorrect = $("<div class='progressBarPart incorrectBar'>&nbsp;</div>").css({
            'background-color': '#995555', 
        }).data('priorPercentage', 0);
        $pb.append($correct);
        $pb.append($incorrect);
        $pb.find(".progressBarPart").css({
            color: 'white',
            'text-align': 'center',
            width: '0%',
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
    
    feedback.alertTypes = {
        'alert': { // something bad happened
            'background-color': 'red',
            color: 'white',
            'font-weight': 'bold',
            delayFade: 10 * 1000,
        },
        'ok': { // fine -- all good. green
            'background-color': '#99ff99',
            delayFade: 10 * 1000,
            fadeTime: 2 * 1000,            
        },
        'update': {  // neutral -- could be a bit good or neutral
            'background-color': '#e4f0f0',
            delayFade: 4 * 1000,
        },
        'normal': { }, // default -- yellow, alert
    };
    
    feedback.alert = function (msg, type, params) {
        type = type || 'normal';
                        
        cssParams = {
                top: '80px',
                'background-color': '#ffff99',
                color: 'black',
                'font-weight': 'normal',
                'position': 'fixed',
                'left': '750px',
                'width': '200px',
                'opacity': .9,
                'border-radius': '15px',
                'box-shadow': '0px 0px 19px #999',
                'padding': '30px 30px 30px 30px',
                'z-index': 20,
                
                delayFade: 4 * 1000,
                fadeTime:  0.5 * 1000,
        };
        
        if (feedback.alertTypes[type] != undefined) {
            music21.common.merge(cssParams, feedback.alertTypes[type]);            
        }
        music21.common.merge(cssParams, params);
        var delayFade = cssParams.delayFade;
        var fadeTime = cssParams.fadeTime;
        delete(cssParams.delayFade);
        delete(cssParams.fadeTime);
                
        if (typeof(cssParams.top) != 'string') {
            cssParams.top = cssParams.top + 'px';
        }
                
        var tdiv = document.body;
        var alertDiv = $("<div>" + msg + "</div>")
            .attr('id', 'alertDiv')
            .css(cssParams)
            .delay(delayFade)
            .fadeOut(fadeTime, function () { this.remove(); } );
        $(tdiv).append(alertDiv);
    };
    if (m21theory !== undefined) {
        m21theory.feedback = feedback;
    }
    
    return feedback;
});