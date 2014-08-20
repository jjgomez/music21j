/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/bank -- a wrapper for multiple sections.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['m21theory/misc', 'm21theory/userData', 'm21theory/feedback', 'm21theory/random', 'jquery'], 
        function(misc, userData, feedback, random, $) {
	var bank = {};
	/* Test Bank */

	bank.TestBank = function () {
		this.sections = [];
		this.autoSubmit = true;
		this.addStudentData = true;
		this.startTime = 0;
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
		};
		
		
		this.append = function (newTest) {
			newTest.bank = this;
			this.sections.push(newTest);
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