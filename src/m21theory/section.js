/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/section -- a blank Test for subclassing.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['./random', './userData', './question', 
        './feedback', './serverSettings'], 
        function(random, userData, question, feedback, serverSettings) {
	var section = {};


	/* Test Type -- general -- inherited by other tests... */

	section.Generic = function () {
		this.bank = undefined;
		this.testSectionDiv = undefined;
		this.id = 'unknownTestSection';
		this.title = "Assignment";
		this.instructions = "<p>" + "Answer the following questions" + "</p>";

		this.startTime = new Date().getTime();

		this.totalQs = 34;
		this.practiceQs = 4;
		this.weight = 1;
		
		this.numRight = 0;
		this.numWrong = 0;
		this.numMistakes = 0;

		this.maxWrong = 0;
		this.maxMistakes = 8;
		
		this.possibleOutcomes = {};
		
		this.questionClass = question.Question;
        this.practiceQuestions = [];
        this.questions = [];
		
		
		// hidden variables masked by properties
        this._autoSubmit = undefined;
		this._allowEarlySubmit = undefined;
		this._allowSubmitWithErrors = undefined; // n.b. if allowEarlySubmit is true then this is ignored...

		this._testResponseURL = undefined;
		this._profEmail = undefined;
		this._studentFeedback = undefined;
		
        this._restoreAnswers = undefined;

		
	    Object.defineProperties(this, {
	        'bankIndex': {
	            get: function () {
	                if (this.bank === undefined) {
	                    return undefined;
	                }  
	                for (var i = 0; i < this.bank.sections.length; i++) {
	                    if (this === this.bank.sections[i]) {
	                        return i;
	                    }	                    
	                }
	                return undefined;
	            },
	        },
	        'progressBar': {
	            get: function () {
                    var bankIndex = this.bankIndex;
                    if (bankIndex === undefined) {
                        return undefined;
                    }      
                    return this.bank.scoreboard.pbSubparts[bankIndex];
	            },
	        },
	    	'profEmail': {
	    		get: function () {
	    			var tempEmail = this._profEmail;
	    			if (tempEmail == undefined) {
	    				if (this.bank != undefined) {
	    					tempEmail = this.bank.profEmail;
	    				}
	    			}
	    			return tempEmail;
				},
				set: function (newEmail) {
					this._profEmail = newEmail;
				}
			},
	    	'allowEarlySubmit': {
	    		get: function () {
	    			var allow = this._allowEarlySubmit;
	    			if (allow == undefined) {
	    				if (this.bank != undefined) {
	    					allow = this.bank.allowEarlySubmit;
	    				} else {
	    					allow = true;
	    				}
	    			}
	    			return allow;
				},
				set: function (newAllow) {
					this._allowEarlySubmit = newAllow;
				}
			},
	    	'allowSubmitWithErrors': {
	    		get: function () {
	    			var allow = this._allowSubmitWithErrors;
	    			if (allow == undefined) {
	    				if (this.bank != undefined) {
	    					allow = this.bank.allowSubmitWithErrors;
	    				} else {
	    					allow = true;
	    				}
	    			}
	    			return allow;
				},
				set: function (newAllow) {
					this._allowEarlySubmit = newAllow;
				}
			},
            'autoSubmit': {
                get: function () {
                    var allow = this._autoSubmit;
                    if (allow == undefined) {
                        if (this.bank != undefined) {
                            allow = this.bank.autoSubmit;
                        } else {
                            allow = true;
                        }
                    }
                    return allow;
                },
                set: function (newAllow) {
                    this._autoSubmit = newAllow;
                }
            },
	    	'studentFeedback': {
	    		get: function () {
	    			var allow = this._studentFeedback;
	    			if (allow == undefined) {
	    				if (this.bank != undefined) {
	    					allow = this.bank.studentFeedback;
	    				} else {
	    					allow = true;
	    				}
	    			}
	    			return allow;
				},
				set: function (newAllow) {
					this._studentFeedback = newAllow;
				}
	    	},
	    	'restoreAnswers': {
                get: function () {
                    var allow = this._restoreAnswers;
                    if (allow == undefined) {
                        if (this.bank != undefined) {
                            allow = this.bank.restoreAnswers;
                        } else {
                            allow = true;
                        }
                    }
                    return allow;
                },
                set: function (newAllow) {
                    this._restoreAnswers = newAllow;
                }	    	    
	    	}            
	    });
		

		this.initPossibleOutcomes = function () { 
			this.possibleOutcomes['noFeedback'] =	$("<br clear='all'/>" + 
				  "<div class='submissionContents' style='float: right'><b>All done!</b>" +
				  "<br/>You might want to check your work again just to be sure, but click submit to send. " +
				  "<br/> Make sure your <b>name</b> is filled in above and "+
				  "click " + 
				  "<input class='emptyButton' type='button' />" +
				  "to finish. <br/></div><br clear='all'/>");

			this.possibleOutcomes['success'] =	$("<br clear='all'/>" + 
				  "<div class='submissionContents' style='float: right'><b>Great Work!</b>" +
				  "<br/> Make sure your <b>name</b> is filled in above and "+
				  "click " + 
				  "<input class='emptyButton' type='button' />" +
				  "to finish. <br/></div><br clear='all'/>");
			this.possibleOutcomes['submitted'] =   $("<br clear='all'/>" + 
	                  "<div class='submissionContents' style='float: right'><b>Submitted!</b>" +
	                  "<br/>Your work has been submitted and recorded. "+
	                  "But if you'd like to keep trying and improving, click " + 
	                  "<input class='emptyButton' type='button' />" +
	                  "to submit again. <br/></div><br clear='all'/>");
			this.possibleOutcomes['moreWork'] =  $("<br clear='all'/>" + 
				"<div class='submissionContents' style='float: right'><b>You got them all!</b><br/>" +
				"You can submit your work here... <input class='emptyButton' type='button' /> ..."+
				"<b>But you need more practice</b> (too many mistakes). " +
				"After submitting return to the main menu and <b>try a new sheet</b> and " +
				"see if you can work slowly and have fewer errors next time.<br/></div><br clear='all'/>");
            this.possibleOutcomes['submittedMoreWork'] =   $("<br clear='all'/>" + 
                    "<div class='submissionContents' style='float: right'><b>Submitted!</b>" +
                    "<br/>Your work has been submitted and recorded. "+
                    "But if you'd like to keep trying and improving, <b>highly recommended, because " +
                    "you could get better at this</b>, return to the main menu to try a new sheet, then click " + 
                    "<input class='emptyButton' type='button' />" +
                    "to submit again. <br/></div><br clear='all'/>");

			if (this.allowEarlySubmit || this.allowSubmitWithErrors) {
				this.possibleOutcomes['errors'] =  $("<br clear='all'/>" + 
					"<div class='submissionContents' style='float: right'>" +
					"You still have some errors; look closely at the answers and " +
					"fix any where the answers are red.<br/>" +
					"If you cannot find them, you may submit anyhow.<br/>" +
					"<input class='emptyButton' type='button' /> ...<br/></div><br clear='all'/>");

			} else {
				this.possibleOutcomes['errors'] =  $("<br clear='all'/>" + 
					"<div class='submissionContents' style='float: right'>" +
					"You still have some errors; look closely at the answers and " +
					"fix any where the answers are red" +
					"</div><br clear='all'/>"
					);
			}
		
			if (this.allowEarlySubmit) {
				this.possibleOutcomes['incomplete'] =  $("<br clear='all'/>" + 
				"<div class='submissionContents' style='float: right'><i>Unanswered questions remain...</i><br>" +
				"You can submit your work here if you are out of time <br/> or cannot understand the problems..." +
				"<input class='emptyButton' type='button' /> ...<br/></div><br clear='all'/>");
			} else {
				this.possibleOutcomes['incomplete'] = $("<br clear='all'/>" + 
					"<div class='submissionContents' style='float: right'>" +
					"<i><i>Unanswered questions remain...</i>. A submission box will appear here when you are done</i>" +
					"</div><br clear='all'/>"
					);
			}

			for (var oc in this.possibleOutcomes) {
				var eb1 = this.possibleOutcomes[oc].find('.emptyButton');
				if (eb1.length == 0) {
					continue;
				}
				var submitButton = $("<input type='button' value='SUBMIT' class='submitButton'/> ");
				submitButton[0].testHandler = this;
				submitButton.click( (function () { this.submitWork(); }).bind(this) );
				eb1.replaceWith(submitButton);
			}
		};

		
		this.render = function (jsSelector) {
			if (jsSelector == undefined) {
				jsSelector = '#testBank';
			}
		
			this.initPossibleOutcomes();
			var newTestSection = $("<div>").attr('class','testSection').css('position','relative');
			newTestSection.append( $("<h2>" + this.title + "</h2>")
									.attr('class','testSectionTitle') );
			newTestSection.append( $("<div>" + this.instructions + "</div>")
									.attr('class','testSectionInstructions') );

			var testSectionBody = $("<div>").attr('class','testSectionBody');
			this.testSectionBody = testSectionBody;
			this.renderBody(testSectionBody);
			testSectionBody.append( $("<br clear='all' />") );
			newTestSection.append(testSectionBody);
			
			this.renderPostBody(newTestSection);
			
			var submissionContents = $("<div />").attr('class','submissionContents');
			var submissionSection = $("<div style='text-align: right;'/>").attr('class','testSectionSubmit');
			this.submissionContents = submissionContents;
			this.submissionSection = submissionSection;
			submissionSection.append(submissionContents);
			newTestSection.append(submissionSection);
			this.testSectionDiv = newTestSection;
			
			this.changeOutcome('incomplete');
			$(jsSelector).append(newTestSection);
			this.renderPostAppend();
			this.startTime = new Date().getTime();
		};	

		this.renderBody = function (testSectionBody) {
			if (testSectionBody === undefined) {
			    if (this.testSectionBody === undefined) {
	                throw("Cannot renderBody without testSectionBody -- a $('<div>') with class, testSectionBody");			        
			    } else {
			        testSectionBody = this.testSectionBody;
			    }			    
			} else if (this.testSectionBody === undefined) {
			    this.testSectionBody = testSectionBody;
			}
		    for (var i = 0; i < this.totalQs; i++) {
		        var q = new this.questionClass(this, i);
		        if (i < this.practiceQs) {
		            q.isPractice = true;
		            this.practiceQuestions.push(q);
		        } else {
                    this.questions.push(q);
		        }
		        q.append();
		    }
		};
				
		this.renderPostBody = function (newTestSection) {
			// does nothing here...
		};
		
		this.renderPostAppend = function () {
			// does nothing here...
		};
		
		this.renderOneQ = function (i) {
			return $("<div>Blank question " + i.toString() + "</div>");
		}; 
		
		this.questionStatusChanged = function (new_status, changed_question) {		    		   
		    // correct and question are currently unused;
		    this.recalculateScore();
            this.checkEndCondition();
            this.bank.questionStatusChanged(this.bankIndex, new_status, changed_question);
		};
		
		this.recalculateScore = function () {
		    this.numRight = 0;
		    this.numWrong = 0;
		    this.numMistakes = 0;
		    for (var i = 0; i < this.questions.length; i++) {
		        var question = this.questions[i];
		        if (question.answerStatus == 'correct') {
		            this.numRight += 1;
		        } else if (question.answerStatus == 'incorrect') {
		            this.numWrong += 1;
		        }
		        this.numMistakes += question.incorrectAnswerAttempts;
		    }
            if (m21theory.debug) {
                console.log("Right " + this.numRight + " ; Wrong " + this.numWrong + 
                            " ; Mistakes " + this.numMistakes);
            }  
		};
		    		
		this.currentOutcome = undefined;
		this.checkEndCondition = function (params) {
			var outcome = undefined;
		    if (this.numRight == this.totalQs - this.practiceQs) {
				//console.log("end condition met...");				
				if (this.studentFeedback === true) {
					if (this.numMistakes <= this.maxMistakes) {
						outcome = 'success';
					} else {
						//console.log('more work needed');
						outcome = 'moreWork';
					}
				} else {
					outcome = 'noFeedback';
				}
				this.changeOutcome(outcome, params);
			} else if (this.numRight + this.numWrong == this.totalQs - this.practiceQs) {
				if (this.studentFeedback === true) {
				    outcome = 'errors';
				} else {
					outcome = 'noFeedback';			
				}
                this.changeOutcome(outcome, params);
			}
			return outcome;
		};
		
		this.changeOutcome = function (outcome, options) {
		    var params = {
		            submit: this.autoSubmit,
		    };
		    music21.common.merge(params, options);
		    
		    if (outcome != this.currentOutcome) {
				var thisOutcome = this.possibleOutcomes[outcome];
				this.submissionSection.empty();
				this.submissionSection.append(thisOutcome);
				this.submissionContents = thisOutcome;	
				if (outcome == 'noFeedback' || outcome == 'success' || outcome == 'moreWork') {
				    if (this.autoSubmit == true) {
				        var newOutcome = 'submitted';
				        if (outcome == 'moreWork') {
				            newOutcome = 'submittedMoreWork';
				        }
				        if (newOutcome != this.currentOutcome) {
	                        this.currentOutcome = newOutcome;              
	                        if (params.submit == true) { // not true if restoring from db...
	                            this.submitWork();        	                            
	                        }
				        }
				        var newOutcomeContents = this.possibleOutcomes[newOutcome];
                        this.submissionSection.empty();
                        this.submissionSection.append(newOutcomeContents);
                        this.submissionContents = newOutcomeContents;                              
				    }
				} else {
	                this.currentOutcome = outcome;
				}
				
			}
		};
		
		this.answerInformation = function () {
			var answerInformation = {};
			answerInformation['right'] = this.numRight;
			answerInformation['wrong'] = this.numWrong;
			answerInformation['unanswered'] = this.totalQs - this.practiceQs - this.numRight - this.numWrong;
			answerInformation['mistakes'] = this.numMistakes;
			answerInformation['totalQs'] = this.totalQs - this.practiceQs;
			return answerInformation;
		};
		
		this.submitWork = function () {
		    var scores = this.answerInformation();
            var bankId = 'unknownTestBank';
            if (this.bank != undefined) {
                bankId = this.bank.id;
            }
		    var info = {
	                studentData: userData.studentData,
	               	bankId: bankId,
	               	sectionId: this.id,
	               	sectionIndex: this.bankIndex,
	               	numRight: scores.right,
	               	numWrong: scores.wrong,
	               	numMistakes: scores.mistakes,
	               	numUnanswered: scores.unanswered,
	               	totalQs: scores.totalQs,
	               	startTime: this.startTime,
	               	endTime: Date.now(),
	               	seed: random.seed,
	               	outcome: this.currentOutcome,
	        };
	        serverSettings.makeAjax(info, { 
	            url: serverSettings.submitSection,
	            success: (function (retObj) {
	                if (retObj.success == true) {
	                    feedback.alert('Section successfully submitted', 'ok', 
	                            {
	                                top: '400px', 
	                                delayFade: 1000
	                             });
	                    this.progressBar.find('.correctBar').text('SUBMITTED');
	                    // SWITCH OUTCOME...
	                } else {
	                    if (retObj.login == false) {
	                        feedback.alert('You need to LOG IN before submitting', 'alert');
	                    } else {
	                        feedback.alert('Oh crap, something happened...', 'alert');
	                        console.log(retObj);
	                    }
	                }
	                
	                if (this.studentFeedback == 'onSubmit') {
	                    feedback.alert('You got ' + this.numRight + ' right and ' + 
	                            this.numWrong + ' wrong.', 'update', {top: '0px'});
	                }
	            }).bind(this),
	        });	
		};
		
	};

	// end of define
	if (typeof(m21theory) != "undefined") {
		m21theory.section = section;
	}		
	return section;
});