/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/question -- a single Blank Question for subclassing.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['./random', './userData', 'jquery', './feedback', './serverSettings'], 
        function (random, userData, $, feedback, serverSettings) {
    var question = {};
    
    question.GeneralQuestion = function (section, index) {
        this.section = section;
        this.index = index;
        this.singlePointQuestion = true;
        this.ignoreMistakes = false; // for things where many wrong answers will be given first.
        
        this.storedAnswer = undefined; // for quick lookups;
        this.studentAnswer = undefined;
        this.answerStatus = 'unanswered';
        this.$inputBox = undefined; // for inputbox based questions.
        this.$questionDiv = undefined;
        this._$feedbackDiv = undefined;
        this.incorrectAnswerAttempts = 0;
        
        this.isPractice = false;
        
        if (section !== undefined) {
            this.testSectionBody = section.testSectionBody;
            if (this.testSectionBody !== undefined) {
                this.questionPosition = this.testSectionBody.position; // function
                this.questionOffset = this.testSectionBody.offset; // function                
            } 
        }
        
        this.correctCallback = undefined; // callback for correct answers, such as playing.
        this.checkTrigger = (function () { this.validateAnswer(); }).bind(this);
        
        Object.defineProperties(this, {
            '$feedbackDiv': {
                // a separate Div to change class to give students feedback on results.
                get: function () {
                    if (this._$feedbackDiv !== undefined) {
                        return this._$feedbackDiv;
                    } else {
                        return this.$questionDiv;
                    }
                },
                set: function ($fbd) {
                    this._$feedbackDiv = $fbd;
                }
            },
        });
    
    };

    // function to define how to get the student's answer 
    question.GeneralQuestion.prototype.getStudentAnswer = function () {
        var sa = undefined;
        if (this.$inputBox != undefined) {
            sa = this.$inputBox.val().replace(/^\s+|\s+$/g,'');
        } else if (this.studentAnswer != undefined) {
            return this.studentAnswer;
        }
        return sa;
    };
    
    
    // if we want to store a different version for the database. For overriding...
    question.GeneralQuestion.prototype.studentAnswerForStorage = function () {
        var sa = this.getStudentAnswer();
        if (sa instanceof music21.stream.Stream) {
            return ""; // no stream storage (yet...)
        } else {
            return sa;
        }
    };
    
    /**
     * For storing...
     * 
     * @param dbAnswer
     * @returns
     */
    question.GeneralQuestion.prototype.restoreStudentAnswer = function (dbAnswer) {
        if (dbAnswer !== undefined && dbAnswer !== null && dbAnswer != "") {
            if (this.$inputBox != undefined) {
                this.$inputBox.val(dbAnswer);
            }
            this.studentAnswer = dbAnswer;
        }
    };
        
    // to be overridden...
    question.GeneralQuestion.prototype.getStoredAnswer = function () {
        return this.storedAnswer;
    };
    
    question.GeneralQuestion.prototype.storedAnswerForStorage = function () {
        var sa = this.getStoredAnswer();
        if (sa instanceof music21.stream.Stream) {
            return ""; // no stream storage (yet...)
        } else {
            return sa;
        }
        
    };
    
    
    // Don't do anything... should be right...
    question.GeneralQuestion.prototype.restoreStoredAnswer = function (dbAnswer) {
        if (dbAnswer !== undefined && dbAnswer !== null && dbAnswer != "") {
            // this.storedAnswer = dbAnswer;
        }
    };
    
    
    // returns true false..
    question.GeneralQuestion.prototype.checkAnswer = function (studentAnswer, storedAnswer) {        
        return (studentAnswer == storedAnswer);
    };
    
    question.GeneralQuestion.prototype.validateAnswer = function () {
        var studentAnswer = this.getStudentAnswer();
        var storedAnswer = this.getStoredAnswer();
        console.log(studentAnswer, storedAnswer);
        var isCorrect = this.checkAnswer(studentAnswer, storedAnswer);
        //console.log(studentAnswer, storedAnswer, isCorrect);
        this.answerStatus = isCorrect ? "correct" : "incorrect";
        if (isCorrect != true && this.ignoreMistakes == false) {
            this.incorrectAnswerAttempts += 1;
        }
        this.questionStatusChanged();
        this.section.questionStatusChanged(this.answerStatus, this);
        this.changeStatusClass(isCorrect);
        if (isCorrect && this.section.studentFeedback && this.correctCallback !== undefined) {
            this.correctCallback();
        }
    };
    question.GeneralQuestion.prototype.questionStatusChanged = function () { 
        var bankId = 'unknownTestBank';
        var sectionId = 'unknownSection';
        var sectionIndex = -1;
        var startTime = 0;
        if (this.section != undefined) {
            sectionId = this.section.id;
            startTime = this.section.startTime;
            sectionIndex = this.section.bankIndex;
            if (this.section.bank != undefined) {
                bankId = this.section.bank.id;
            }            
        }
        var info = {
            studentData: userData.studentData,
            bankId: bankId,
            sectionId: sectionId,
            sectionIndex: sectionIndex,
            questionIndex: this.index,
            answerStatus: this.answerStatus,
            startTime: startTime,
            endTime: Date.now(),
            seed: random.seed,
            studentAnswer: this.studentAnswerForStorage(),
            storedAnswer: this.storedAnswerForStorage(),
            numMistakes: this.incorrectAnswerAttempts,
        };
        serverSettings.makeAjax(info, { 
            url: serverSettings.submitQuestion,
            success: function (d) { 
                if (d.success != true) {
                    if (d.login != true) {
                        feedback.alert('Not logged in -- answers not stored; log in now', 'update');
                    } else if (d.dbSuccess != true) {
                        feedback.alert('Database error -- contact Cuthbert and try again later!', 'update');
                    }
                }                
            },
            error: function () { 
                feedback.alert('Server unavailable -- question not stored', 'update', 
                        {delayFade: 1000}); 
                },
        });
    };
    question.GeneralQuestion.prototype.changeStatusClass = function (isCorrect) {
        var possibleClasses = 'correct incorrect answered unanswered';
        if (isCorrect) {
            if (this.section.studentFeedback === true) {
                this.$feedbackDiv.removeClass(possibleClasses);
                this.$feedbackDiv.addClass("correct");
            } else {
                this.$feedbackDiv.removeClass(possibleClasses);
                this.$feedbackDiv.addClass("answered");
            }
        } else { // incorrect
            if (this.section.studentFeedback === true) {
                this.$feedbackDiv.removeClass(possibleClasses);
                if (this.ignoreMistakes == false) {
                    this.$feedbackDiv.addClass("incorrect");                    
                }
            } else {
                this.$feedbackDiv.removeClass(possibleClasses);
                this.$feedbackDiv.addClass("answered");
            }
        }
    };

    
    
    question.GeneralQuestion.prototype.render = function () {
        return $("<div>Blank question " + this.index.toString() + "</div>");
    };

    question.GeneralQuestion.prototype.append = function () {
        var $section = this.render();
        this.testSectionBody.append($section);
    };
    
    question.GeneralQuestion.prototype.restoreAnswers = function (dbAnswer) {
        if (dbAnswer.studentAnswer !== undefined) {
            this.restoreStudentAnswer(dbAnswer.studentAnswer);            
        }
        if (dbAnswer.storedAnswer !== undefined) {
            this.restoreStoredAnswer(dbAnswer.storedAnswer);            
        }
        if (dbAnswer.numMistakes !== undefined) {
            this.incorrectAnswerAttempts = dbAnswer.numMistakes;
        }
        if (dbAnswer.answerStatus !== undefined) {
            this.answerStatus = dbAnswer.answerStatus;
            if (dbAnswer.answerStatus == 'correct' || dbAnswer.answerStatus == 'incorrect') {
                var isCorrect = (dbAnswer.answerStatus == 'correct') ? true : false;
                this.changeStatusClass(isCorrect);
            }            
        }
    };
        
    question.PracticeQuestion = function (section, index) {
        question.GeneralQuestion.call(this, section, index);
    };
    question.PracticeQuestion.prototype = new question.GeneralQuestion();
    question.PracticeQuestion.prototype.constructor = question.PracticeQuestion;
    
    question.Question = function (section, index) {
        question.GeneralQuestion.call(this, section, index);
    };
    question.Question.prototype = new question.GeneralQuestion();
    question.Question.prototype.constructor = question.Question;
    
    
    if (typeof m21theory != "undefined") {
        m21theory.question = question;
    }
    return question;
});
