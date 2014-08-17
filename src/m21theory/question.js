/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/question -- a single Blank Question for subclassing.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['m21theory/random', 'm21theory/userData', 'jquery'], function (random, userData, $) {
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
            sa = this.$inputBox.val();
        } else if (this.studentAnswer != undefined) {
            return this.studentAnswer;
        }
        return sa;
    };
    
    // to be overridden...
    question.GeneralQuestion.prototype.getStoredAnswer = function () {
        return this.storedAnswer;
    };
    
    // returns true false..
    question.GeneralQuestion.prototype.checkAnswer = function (studentAnswer, storedAnswer) {        
        return (studentAnswer == storedAnswer);
    };
    
    question.GeneralQuestion.prototype.validateAnswer = function () {
        var studentAnswer = this.getStudentAnswer();
        var storedAnswer = this.getStoredAnswer();
        var isCorrect = this.checkAnswer(studentAnswer, storedAnswer);
        //console.log(studentAnswer, storedAnswer, isCorrect);
        this.answerStatus = isCorrect ? "correct" : "incorrect";
        if (isCorrect != true && this.ignoreMistakes == false) {
            this.incorrectAnswerAttempts += 1;
        }        
        this.section.questionStatusChanged(this.answerStatus, this);
        this.changeStatusClass(isCorrect);
        if (isCorrect && this.correctCallback !== undefined) {
            this.correctCallback();
        }
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
    
    
    if (m21theory !== undefined) {
        m21theory.question = question;
    }
    return question;
});
