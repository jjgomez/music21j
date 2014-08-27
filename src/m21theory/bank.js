/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/bank -- a wrapper for multiple sections.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['./misc', './userData', './feedback', './random', 'jquery'], 
        function(misc, userData, feedback, random, $) {
	var bank = {};
	/* Test Bank */

	bank.TestBank = function () {
		this.sections = [];
		this.autoSubmit = true;
		this.addStudentData = true;
		this.startTime = Date.now();
		this.submissionBox = true;
		this.id = 'unknownTestBank';
		this.title = $('title').text() || "Exercise";
		this.instructions = "";
		this.testBankSelector = "#testBank";	
		this.addKeyboard = true;
		this.scoreboard = new feedback.Scoreboard(this);
		// test defaults...
		this.profEmail = 'cuthbert';
		this.allowEarlySubmit = true;
		this.allowSubmitWithErrors = false;
		this.studentFeedback = true;
		this.lastSectionWorkedOn = undefined;
		this.playedLongMotto = false;
		this.restoreAnswers = true;
		
		this.render = function () {
		    random.setSeedFromGeneratorType();
			testBank = $(this.testBankSelector);
			if (this.title != "") {
				testBank.append( $("<h1>" + this.title + "</h1>")
									.attr('class','testBankTitle'));
			}
			if (this.instructions != "") {
				testBank.append(  $("<div>" + this.instructions + "</div>")
									.attr('class','testBankInstructions') );
			}

			if (this.addStudentData) {
				userData.fillNameDiv();
			}
			if (this.addKeyboard) {
			    misc.addKeyboard(testBank);
			}
			for (var i = 0; i < this.sections.length; i ++) {
				var thisTest = this.sections[i];
				thisTest.render(this.testBankSelector);
			}
			testBank.append( $("<br clear='all' />") );
			this.scoreboard.render();
			this.startTime = new Date().getTime();
            if (this.restoreAnswers) {
	            serverSettings.makeAjax({
	                'seed': random.seed,
	                'bankId': this.id,
                }, {
                    url: serverSettings.retrieveAnswer,
                    success: (function (j) { this.restoreAnswersCallback(j); }).bind(this),
                });  // this is actually a tinybit unsafe since in theory callback could register
            }        // before questions are created.  Would that actually happen? NAH!	                        

		};
		
		this.restoreAnswersCallback = function (j) {
            if (j.success != true) {
                return j;
            } else if (j.sectionDict === undefined) {
                return j;
            } else {
                for (var sectionIndex in j.sectionDict) {
                    var answerList = j.sectionDict[sectionIndex];
                    var thisSection = this.sections[sectionIndex];
                    for (var i = 0; i < answerList.length; i++) {
                        var a = answerList[i];
                        var qListIndex = a.questionIndex - thisSection.practiceQs;
                        var q = thisSection.questions[qListIndex];
                        if (q !== undefined) {
                            q.restoreAnswers(a);
                        }
                    }                    
                    thisSection.recalculateScore();
                    thisSection.checkEndCondition({submit: false});                    
                }
                this.scoreboard.updateProgressBars();
            }
        };
		
		this.append = function (newTest) {
			newTest.bank = this;
			this.sections.push(newTest);
		};
		
		this.questionStatusChanged = function (bankId, new_status, changed_question) {
		    this.lastSectionWorkedOn = this.sections[bankId];
		    this.scoreboard.updateProgressBars();
		    this.checkAllOutcomes();
		};
		this.checkAllOutcomes = function () {
		    for (var i = 0; i < this.sections.length; i++) {
		        var o = this.sections[i].checkEndCondition();
		        if (o === undefined) {
		            return false;
		        }
		    }
            if (this.autoSubmit == true) {
                this.submitWork();
            }
		};
        this.submitWork = function () {
            var scores = this.answerInformation();
            this.lastScore = scores;
            var info = {
                    studentData: userData.studentData,
                    bankId: this.id,
                    numRight: scores.right,
                    numWrong: scores.wrong,
                    numMistakes: scores.mistakes,
                    numUnanswered: scores.unanswered,
                    totalQs: scores.totalQs,
                    startTime: this.startTime,
                    endTime: Date.now(),
                    seed: random.seed,                  
            };
            serverSettings.makeAjax(info, { 
                url: serverSettings.submitBank,
                success: (function (retObj) {
                    if (retObj.success == true) {
                        feedback.alert('Assignment successfully submitted', 'ok', 
                                {
                                    top: '400px', 
                                    delayFade: 1000
                                 });
                        this.scoreboard.mainPB.find('.correctBar').text('SUBMITTED');
                        // SWITCH OUTCOME...
                    } else {
                        if (retObj.login == false) {
                            feedback.alert('You need to LOG IN before submitting', 'alert');
                        } else {
                            feedback.alert('Oh crap, something happened...', 'alert');
                            console.log(retObj);
                        }
                    }
                    if (this.playedLongMotto == false) {
                        this.playedLongMotto = true;
                        m21theory.misc.playMotto(MIDI, true);
                    }
                    if (this.studentFeedback == 'onSubmit') {
                        feedback.alert('You got ' + this.lastScore.numRight + ' points out of ' + 
                                this.lastScore.totalQs + ' total.', 'update', {top: '0px'});
                    }
                }).bind(this),
            }); 
        };
		
		this.answerInformation = function () {
		    var a = {
		      right: 0,
		      wrong: 0,
		      unanswered: 0,
		      mistakes: 0,
		      totalQs: 0,
		    };
		    
		    for (var i = 0; i < this.sections.length; i++) {
		        var s = this.sections[i];
		        var o = s.answerInformation();
		        for (var k in a) {
		            a[k] += o[k] * s.weight;
		        }
            }
		    return a;
		};
	};
	// end of define
	if (typeof(m21theory) != "undefined") {
		m21theory.bank = bank;
	}		
	return bank;
});