define("m21theory/tests/pulseIdentify", 
        ["m21theory/section", "m21theory/random", "m21theory/question", "m21theory/feedback"], 
        function (section, random, question, feedback) {
    var PI = function (handler, index) {
        question.Question.call(this, handler, index); 
        this.noteTiming = [];
        this.timeStart = undefined;
    };
    PI.prototype = new question.Question();
    PI.prototype.constructor = PI;
    
    PI.prototype.render = function () {
        if (this.isPratice) {
            return $("<div>Error: No Practice Questions!</div>");
        }
        var $questionDiv = $("<div>Question " + (this.index + 1).toString() + "<br/></div>");
        this.$questionDiv = $questionDiv;
        var _ = this.section.getTwoStreams(),
            tnScore = _[0],
            tnDisplay = _[1];
        this.tnScore = tnScore;
        this.storedAnswer = tnDisplay;

        tnDisplay.renderOptions.events.click = (function () { 
            this.startTest();
            this.tnScore.playStream({done: this.evaluateResults.bind(this)}); 
        }).bind(this);
        tnDisplay.appendNewCanvas($questionDiv);  
        return $questionDiv;
    };
    
    PI.prototype.registerPresses = function () {
        //console.log('registering bind', this);
        this.keyboardBinder = this.keydownHandler.bind(this);
        $(document).bind('keydown', this.keyboardBinder);
    };
    PI.prototype.unregisterPresses = function () {
        //console.log('unregistering bind');
        $(document).unbind('keydown', this.keyboardBinder);
    };

    PI.prototype.startTest = function () {
        this.noteTiming = [];
        this.timeStart = Date.now();
        this.registerPresses();
    };
    
    PI.prototype.evaluateResults = function () {
        this.unregisterPresses();
        var quarterLengthInMS = 60 * 1000/this.tnScore.tempo;
        var noteTimingOffset = this.tnScore.timeSignature.numerator * quarterLengthInMS;
        for (var i = 0; i < this.noteTiming.length; i++) {
            this.noteTiming[i] = (this.noteTiming[i] - noteTimingOffset)/quarterLengthInMS;
        }
        this.studentAnswer = this.noteTiming;
        this.validateAnswer();
    };

    PI.prototype.checkAnswer = function (studentAnswer, storedAnswer) {
        var correct = true;
        var safn = storedAnswer.flat.notes;
        if (studentAnswer.length > safn.length) {
            studentAnswer = studentAnswer.slice(0, safn.length - 1);
            correct = false;
        } else if (studentAnswer.length < safn.length) {
            correct = false;
        }
        var correctValues = [];
        for (var i = 0; i < studentAnswer.length; i++) {
            var sa = studentAnswer[i];
            if (sa === undefined) {
                continue;
            }
            var n = safn.get(i);
            var absOffsetDifference = Math.abs(sa - n.offset);
            var offsetLimit = this.section.offsetLimit;
            if (this.section.offsetLimitFluctuates) {
                var prevDuration = 1.0;
                if (i > 0) {
                    prevDuration = safn.get(i-1).duration.quarterLength;
                }
                offsetLimit *= prevDuration; // greater limit for whole notes, etc.                
            }
            if (absOffsetDifference < offsetLimit) {
                correctValues.push('✓');
            } else {
                correctValues.push('X');
                correct = false;
            }
        }
        if (this.section.studentFeedback == true) {            
            for (var i = 0; i < correctValues.length; i++) {
                safn.get(i).lyric = correctValues[i] || "";
            }
            this.storedAnswer.replaceCanvas(this.$questionDiv);
        }        
        return correct;
    };
    
    
    PI.prototype.keydownHandler = function (e) {
        switch(e.which) {
            case 32: // space
                break;
            default:
                return; // exit for all other keys;
        }
        e.preventDefault();
        //console.log('space', this);
        var currentTime = Date.now();
        var timeOffset = currentTime - this.timeStart;
        this.noteTiming.push(timeOffset);
        feedback.alert("*", "ok", {width: '10px', delayFade: 50, fadeTime: 10});
    };
    
    var ThisTest = function () {
        section.Generic.call(this);
        this.questionClass = PI;
        
        this.assignmentId = 'pulseIdentify';
        this.totalQs = 6;
        this.practiceQs = 0;
        this.tempo = 80;
        this.offsetLimitFluctuates = true;
        this.offsetLimit = 0.24; // maximum mistake value
        this.title = "Pulse identification";
        this.instructions = "<p>" +
            "Click the score to here it played <b>preceeded by a measure of quarter notes</b>. " +
            "After the measure of quarter notes is finished, press <b>SPACE</b> when each note should play. " +
            "When the excerpt is done you will get feedback on how accurately you played the rhythm. " +
            "</p>";
        this.allowableMeters = ['4/4','3/4'];
        this.usedRhythms = {};
        this.possibleRhythms = {
            '4/4': ['2 2 4 4 4 4 2 2',
                    '4 2 4 4 4 2 1',
                    '1 2 4 4 2 4 4 2 2',
                    '2 2 4 2 4 1',
                    '1 4 4 2 4 4 4 4 1',
                    '1 2 2 2 2 4 4 2',
                    '4 4 4 4 1 2 4 4 1',
                    '4 2 4 4 4 4 4',
                    '2 4 4 4 4 2 4 4 2',
                    '2 2 1 2 2 1',
                    '4 4 2 2 2 4 4 4 4 1',
                    '2 2 2 2 1',
                    ],
            '3/4': ['2 4 4 4 4 2.',
                    '2. 4 2 4 2 2.',
                    '4 4 4 2 4 2.',
                    '4 2 2 4 2.',
                    '2. 4 4 4 2.',
                    '2 4 2 4 2.',
                    ],
        };
    };
    
    ThisTest.prototype = new section.Generic();
    ThisTest.prototype.constructor = ThisTest;

    ThisTest.prototype.getTwoStreams = function () {
        var chosenMeter = random.choice(this.allowableMeters);
        if (this.usedRhythms[chosenMeter] == undefined) {
            this.usedRhythms[chosenMeter] = [];
        }
        var chosenRhythm = random.choiceWithoutDuplicates(
            this.possibleRhythms[chosenMeter],
            this.usedRhythms[chosenMeter]                
        );
        var values = chosenRhythm.split(' ');
        var tn = chosenMeter + " ";
        var tnDisplay = tn;
        var tsObj = new music21.meter.TimeSignature(chosenMeter);
        var numQtrs = parseInt(tsObj.barDuration.quarterLength);
        for (var j = 0; j < numQtrs; j++) {
            tn += "b'4 ";
        }
        for (var j = 0; j < values.length; j++) {
            var note = "b" + values[j];
            if (j < values.length - 1) {
                note += " ";
            }
            tn += note;
            tnDisplay += note;
        }
        var tnScore = this.getTnScore(tn);
        var tnScoreDisplay = this.getTnScore(tnDisplay);
        tnScore.timeSignature = tsObj;
        tnScoreDisplay.timeSignature = tsObj;
        return [tnScore, tnScoreDisplay];
    };  
    
    ThisTest.prototype.getTnScore = function (tn) {
        var tnStream = music21.tinyNotation.TinyNotation(tn);           
        for (var j = 0; j < tnStream.length; j++ ) {
            tnStream.get(j).renderOptions.staffLines = 1;
            tnStream.get(j).get(0).volume = 85;
        }
        var tnStreamFlatNotes = tnStream.flat.notes;
        for (var j = 0; j < tnStreamFlatNotes.length; j++) {
            tnStreamFlatNotes.get(j).stemDirection = 'up';
        }
        
        tnStream.clef = new music21.clef.PercussionClef();
        // for practice questions
        tnScore = new music21.stream.Score();
        tnScore.tempo = this.tempo;
        tnScore.renderOptions.scaleFactor.x = 0.9;
        tnScore.renderOptions.scaleFactor.y = 0.9;
        tnScore.append(tnStream);
        return tnScore;
    };
    
    
    return ThisTest;
 
});