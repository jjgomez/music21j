/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/feedback -- messages to the student and score updates.
 * 
 * Copyright (c) 2014, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['./random', './userData', 'jquery', './misc', 'music21/common'], 
        function (random, userData, $, misc, common) {
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

        var $pb = this.getProgressBar(30, this.bank.studentFeedback);
        this.mainPB = $pb;
        $d.append($pb);
        $d.append($("<br/>"));
        
        for (var i = 0; i < this.bank.sections.length; i++) {            
            var $subPB = this.getProgressBar(20, this.bank.sections[i].studentFeedback);
            this.pbSubparts.push( $subPB );
            $d.append($subPB);
        }
        var $comments = this.getCommentsSection();
        $d.append($comments);
        var $submitBank = this.bank.getSubmitButton();
        $d.append($submitBank);
        misc.addScrollFixed($d, $where);
        this.updateProgressBars();
        return $d;        
    };
    feedback.Scoreboard.prototype.updateProgressBars = function () {
        var totalQs = 0;
        var totalRight = 0;
        var totalWrong = 0;
        
        for (var i = 0; i < this.bank.sections.length; i++) {
            var t = this.bank.sections[i];
            var $pb = this.pbSubparts[i];
            var numQs = t.totalQs - t.practiceQs;
            var numRight = t.numRight;
            var numWrong = t.numWrong;
            if (t.studentFeedback == true) {
                var $rightBar = $pb.find('.correctBar');                
                if (t.maxMistakes > 0 && t.numMistakes > t.maxMistakes) {
                    $rightBar.css('background-color', '#dddd66');
                } else {
                    $rightBar.css('background-color', '#66aa66');                    
                }
            }
            totalQs += numQs;
            totalRight += numRight;
            totalWrong += numWrong;
            this.updateProgressBarPercentages($pb, numQs, numRight, numWrong, t.studentFeedback);
        };
        this.updateProgressBarPercentages(this.mainPB, totalQs, totalRight, totalWrong, this.bank.studentFeedback);
    };
        
    feedback.Scoreboard.prototype.updateProgressBarPercentages = function ($pb, numQs, numRight, numWrong, studentFeedback) {
        var rightPercent = 100 * numRight/numQs;
        var wrongPercent = 100 * numWrong/numQs;
        if (studentFeedback != true) {
            rightPercent = rightPercent + wrongPercent;
            wrongPercent = 0;
        }
        

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
            if (this.bank.studentFeedback == true) {
                feedback.glow($rightBar);                    
                $rightBar.text('DONE');
            };
            $pb.data('hasGlowed', true);
        }

                

    };
    
    feedback.Scoreboard.prototype.getProgressBar = function (height, studentFeedback) {
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
        if (studentFeedback != true) {
            $correct.css('background-color', '#666666');
            $incorrect.css('display', 'none');
        }        
        $pb.append($correct);
        $pb.append($incorrect);
        $pb.find(".progressBarPart").css({
            color: 'white',
            'text-align': 'center',
            width: '0%',
            display: 'inline-block',
            height: '100%',
        });
        return $pb;
    };
    feedback.Scoreboard.prototype.getCommentsSection = function () {
        var $cs = $("<div style='text-align: center'></div>");
        var $b = $("<button class='lightInput'>Questions? Comments?</button>");
        $b.on('click', (function () { 
            var $commentHeader = $("<div>Comment from " + m21theory.userData.studentData.first + "<br/></div>")
                .css({'font-size': '16pt',});
            var $ta = $("<textarea id='commentTextArea'></textarea>").css({
                'margin-top': '10px',
                'width': '90%',
                'height': '80%',
                'background-color': '#ffffd0',
                'padding': '5px 5px 5px 5px',
                'border': '1px black dotted',
            });

            var $submitButton = $("<button>Send</button>").css({
                'position': 'absolute',
                'bottom': '20px',
                'right': '40px',
                'font-size': '18pt',
                'border-radius': '10px',
                'background-color': '#60df60',
                'color': 'white',
                'width': '80px',
                'height': '40px',
            }).on('click', (function (e) {
                var comment = $("#commentTextArea").val();
                var bank = this.bank;
                var section = (bank.lastSectionWorkedOn !== undefined) ? bank.lastSectionWorkedOn.id : "unknown";
                var seed = m21theory.random.seed;
                var jsonObj = {
                        'comment': comment,
                        'bankId': bank.id,
                        'sectionId': section,
                        'seed': seed,
                        };
                this.commentMessage = comment;
                m21theory.serverSettings.makeAjax(jsonObj, {
                    url: m21theory.serverSettings.commentUrl,
                    success: (function () {
                        $(".overlayCloseButton").click();
                        feedback.alert("Your message has been sent", 'ok');
                    }).bind(this),                  
                    error: (function (xhr) {
                        $(".overlayCloseButton").click();
                        feedback.alert("There was an error sending your message.  Copy it below and " +
                                "email it to Cuthbert also noting that there was an error in sending the " +
                                "comment: <br/>&nbsp;<br/><div style='font-size: 8px; text-align: left'>" + 
                                this.commentMessage + "</div>", 'alert', {
                            delayFade: 90 * 1000
                        });                        
                    }).bind(this),
                });
            }).bind(this));
            var lastSection = this.bank.lastSectionWorkedOn;
            var lastId = (lastSection !== undefined) ? lastSection.id : "unknown";
            var $information = $("<div><i>Last section worked on:</i> " + lastId  + 
                    "<br/><i>Problem set name:</i> " + this.bank.title + "</div>").css({
                        'position': 'absolute',
                        'bottom': '25px',
                        'left': '40px',
                        'text-align': 'left',
                    });
            
            var appendInner = [$commentHeader, $ta];
            var appendOuter = [$submitButton, $information];
            
            
            feedback.overlay(appendInner, appendOuter);
                        
            $ta.focus();
        }).bind(this));
        $cs.append($b);
        return $cs;
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
            common.merge(cssParams, feedback.alertTypes[type]);            
        }
        common.merge(cssParams, params);
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
    
    feedback.glow = function ($what, size, animateTime) {
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
                        } else {
                            $what.css('box-shadow', '');
                        }
                    }
                }); 
            },
        }
        );
        return $what; // passthrough..
    };

    feedback.overlay = function (appendInner, appendOuter, options) {
        var params = {
           horizontalFraction: .6,
           verticalFraction: .6,
           innerHorizontalFraction: .9,
           innerVerticalFraction: .7,
        };
        music21.common.merge(params, options);
        
        var docHeight = $(document).height();
        var $commentOverlay = $("<div class='overlay'></div>")
            .height(docHeight)
            .css({
                'opacity' : 0.6,
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'background-color': 'black',
                'width': '100%',
                'z-index': 100       
            });
        var ww = $(window).width();
        var wh = $(window).height();
        var $commentBody = $("<div class='overlayBody'></div>")
           .css({
               'background-color': '#909090',
               'position': 'fixed',
               'top': wh * (1 - params.verticalFraction)/2,
               'left': ww * (1 - params.horizontalFraction)/2,
               'width': ww * params.horizontalFraction,
               'height': wh * params.verticalFraction,
               'z-index': 101,
               'border-radius': '40px',
           });
        
        var $closeButton = $("<div class='overlayCloseButton'>X</div>");
        $closeButton.on('click', function () { 
            $('.overlay').remove();
            $('.overlayBody').remove();
        });
        $closeButton.css({
            'font-size': '40px',
            'position': 'absolute',
            'top': '-20px',
            'right': '-20px',
            'background-color': 'white',
            'padding': '20px 20px 20px 20px',
            'border-radius': '20px',
            'width': '20px',
            'height': '20px',
            'opacity': 0.9,
            'border': '4px #333333 solid',
            'text-align': 'center',
            'cursor': 'pointer',
            'z-index': 102,
        });
        $commentBody.append($closeButton);
        
        if (appendInner != undefined) {
            var $commentInnerBody = $("<div></div>").css({
                width: (params.innerHorizontalFraction * 100).toString() + '%',
                height: (params.innerVerticalFraction * 100).toString() + '%',
                'text-align': 'center',
                'position': 'relative',
                left: '5%',
                top: '5%',
                'border-radius': '10px',
                'padding-top': '20px',
                'background-color': 'white',
                border: '2px #999999 solid',
            });
            $commentInnerBody.append(appendInner);
            $commentBody.append($commentInnerBody);
        }         
        
        if (appendOuter != undefined) {
            $commentBody.append(appendOuter);
        }
        
        $("body").append($commentOverlay);
        $("body").append($commentBody);
        return $commentBody;
    };
    
    
    if (typeof m21theory != "undefined") {
        m21theory.feedback = feedback;
    }
    
    return feedback;
});