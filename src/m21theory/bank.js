/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/bank -- a wrapper for multiple sections.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['m21theory/misc', 'm21theory/userData', 'm21theory/feedback', 'jquery'], 
        function(misc, userData, feedback, $) {
	var bank = {};
	/* Test Bank */

	bank.TestBank = function () {
		this.allTests = [];
		this.autoSubmit = false;
		this.addStudentData = true;
		this.startTime = 0;
		this.submissionBox = true;
		this.testId = 'unknownTestBank';
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
		
		this.render = function () {
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
			for (var i = 0; i < this.allTests.length; i ++) {
				var thisTest = this.allTests[i];
				thisTest.render(this.testBankSelector);
			}
			testBank.append( $("<br clear='all' />") );
			this.scoreboard.render();
			this.startTime = new Date().getTime();
		};
		
		
		this.append = function (newTest) {
			newTest.bank = this;
			this.allTests.push(newTest);
		};
		
		this.questionStatusChanged = function () {
		    this.scoreboard.updateProgressBars();
		};
	};
	// end of define
	if (typeof(m21theory) != "undefined") {
		m21theory.bank = bank;
	}		
	return bank;
});