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
        this.storedAnswer = undefined; // for quick lookups;
        this.studentAnswer = undefined;
        this.answerStatus = 'unanswered';
        this.$inputBox = undefined; // for inputbox based questions.
        this.$questionDiv = undefined;
        this.isPractice = false;
        
        if (section !== undefined) {
            this.testSectionBody = section.testSectionBody;
            if (this.testSectionBody !== undefined) {
                this.questionPosition = this.testSectionBody.position; // function
                this.questionOffset = this.testSectionBody.offset; // function                
            } 
        }
        this.checkTrigger = (function () { this.validateAnswer(); }).bind(this);
    };

    // function to define how to get the student's answer 
    question.GeneralQuestion.prototype.getStudentAnswer = function () {
        var sa = undefined;
        if (this.$inputBox != undefined) {
            sa = this.$inputBox.val();
        }
        this.studentAnswer = sa;
        return sa;
    };
    
    // returns true false..
    question.GeneralQuestion.prototype.validateAnswer = function () {
        return this.section.validateAnswerNew(this);
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
