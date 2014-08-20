/**
 * doOnPaper -- a placeholder to be overwritten by an assignment to do on paper.
 */

define("m21theory/sections/doOnPaper", 
        ["m21theory/section", "m21theory/question", 'jquery'], 
        function (section, question, $) {
    var OnlyQuestion = function (handler, index) {
        question.Question.call(this, handler, index);   
        this.studentAnswer = true;
        this.storedAnswer = true;
    };
    OnlyQuestion.prototype = new question.Question();
    OnlyQuestion.prototype.constructor = OnlyQuestion;

    
    OnlyQuestion.prototype.render = function () {
        var $questionDiv = $("<div/>");
        this.$questionDiv = $questionDiv;
        $questionDiv.append(this.section.$specifics);
        var $cb = $("<input type='checkbox'/>").click( (function () {             
            this.studentAnswer = this.$checkBox.prop('checked') || false;
            this.checkTrigger();
            //console.log(this.section.numRight, this.section.numWrong);
        }).bind(this));
        
        this.$checkBox = $cb;
        var $cbContainer = $("<span class='lightInput'/>");
        $cbContainer.append($cb);
        $questionDiv.append( $("<br/>") );
        
        var $submitBox = $("<div>" + this.section.checkboxInstructions + " <br/>" + 
                "<span style='font-weight: bold; font-size: 125%'>Check This Box</span>: " + 
                "</div>"
        );
        $submitBox.append($cbContainer);
        $questionDiv.append($submitBox);
        return $questionDiv;
    };
    
    var ThisSection = function () {
        section.Generic.call(this);
        this.questionClass = OnlyQuestion;

        this.title = 'Assignment on Paper';
        this.assignmentId = 'doOnPaper';
        this.totalQs = 1;
        this.practiceQs = 0;
        this.studentFeedback = true;
        this.allowEarlySubmit = true;
        this.instructions = '<p><i>Read the following assignment, do it on paper (if needed), and click the complete button.</i></p>';
        this.$specifics = $('<p>This is an assignment to do on paper. If you are seeing this message ' +
            "Cuthbert screwed up and forgot to put in an assignment. :-) Click submit and send him " +
            "an email, please?." +
            "</p>")
        ;
        this.checkboxInstructions = "When you have done the assignment, to acknowledge " +
                "that you have read the instructions here,";
        
    };
    ThisSection.prototype = new section.Generic();
    ThisSection.prototype.constructor = ThisSection;
    
    return ThisSection;    
});