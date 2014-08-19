define("m21theory/tests/rhythmMatch", 
        ["m21theory/section", "m21theory/random", "m21theory/question", "m21theory/feedback"], 
        function (section, random, question, feedback) {
    var RhythmDict = function (handler, index) {
        question.Question.call(this, handler, index);  
        this.ignoreMistakes = true;
    };
    RhythmDict.prototype = new question.Question();
    RhythmDict.prototype.constructor = RhythmDict;
    RhythmDict.prototype.checkAnswer = function (studentAnswer, storedAnswer) {
        var gt = storedAnswer.flat.notes;
        var student = studentAnswer.flat.notes;
        if (storedAnswer.parts[0].length != studentAnswer.parts[0].length) {
            var comparative = 'fewer';
            if (studentAnswer.parts[0].length > storedAnswer.parts[0].length) {
                comparative = 'more';
            }
            feedback.alert("Your line has " + comparative + " measures than the played line.");
            return false;
        }
        if (gt.length != student.length) { 
            feedback.alert(
                    "Your line doesn't have the same number of notes as was played; look for that.");
            return false; 
        }                       
        
        for (var i = 0; i < gt.length; i++) {
            var gtN = gt.get(i);
            var studentN = student.get(i);
            if (gtN.duration.quarterLength != studentN.duration.quarterLength) {
                feedback.alert(
                "You have at least one wrong rhythm. Listen closely again by hitting 'Play'.");
                return false;
            }
        }
        return true;
    };

    RhythmDict.prototype.render = function () {
        var $questionDiv = $("<div>Question " + (this.index + 1).toString() + "<br/></div>");
        var _ = this.section.getTwoStreams(),
            tnScore = _[0],
            s = _[1];

        this.storedAnswer = tnScore;
        this.studentAnswer = s;
        
        if (this.isPractice) {
            tnScore.maxSystemWidth = 500;
            tnScore.parts[0].renderOptions.systemPadding = -20;
            $questionDiv.append( $("<div style='padding-left: 10px; position: relative; top: 0px'><b>Example:</b> Click to listen</div>") );
            tnScore.appendNewCanvas($questionDiv);
        } else {            
            s.maxSystemWidth = 500;
            s.parts[0].renderOptions.systemPadding = -20;
            var canvasDiv = $("<div/>");//"<div style='width: 500px'/>");
            s.appendNewCanvas(canvasDiv);
                        
            var rc = new music21.widgets.RhythmChooser(s.parts[0], canvasDiv[0]);
            rc.values = this.section.rhythmChooserValues.concat('undo');
            var rcHolder = $("<div style='inline-block'/>");

            var b = $("<button style='font-size: 32pt; display: inline-block; position: relative;'>Play</button>");
            b.click( (function() { this.playStream(); }).bind(tnScore) );
            
            var b2 = $("<button style='font-size: 32pt; display: inline-block; position: relative;'>Check</button>");                
            b2.click( this.checkTrigger );
            rcHolder.append(b);
            rcHolder.append(b2);
            var rhythmChooser = rc.addDiv();
            rhythmChooser.css('width', 'auto');
            rhythmChooser.css('display', 'inline-block');
            rcHolder.append(rhythmChooser);
            rcHolder.css({
                '-ms-transform': 'scale(.5, .5)',
                '-webkit-transform': 'scale(.5, .5)',                
                'transform': 'scale(.5, .5)',                
            });
            
            $questionDiv.append($("<div>Click 'Play' to hear the rhythm to be transcribed. Use the " +
                    "yellow buttons to add rhythms to the staff below. When you are satisfied that " +
                    		"the lines are the same, click 'Check'.</div>"));
            $questionDiv.append(rcHolder);
            $questionDiv.append($("<br clear='all'/>"));
            $questionDiv.append(canvasDiv);            
        }
        this.$questionDiv = $questionDiv;
        return $questionDiv;
    };
    var ThisTest = function () {
		section.Generic.call(this);
		this.questionClass = RhythmDict;
		
		this.assignmentId = 'rhythmMatch';
		this.totalQs = 6;
		this.practiceQs = 2;
		this.tempo = 100;
		this.title = "Rhythm Matching";
		this.instructions = "<p>" +
			"Click 'play' to hear an excerpt played; then use the rhythm buttons to " +
			"write a rhythm that matches the rhythm that is played. Each rhythm begins with a measure " + 
			"of quarter notes. Barlines will automatically " +
			"be drawn for you. Click on your score to hear it played. When you think you've matched " +
			"the rhythm that's played, click the check button to check your work." +
			"</p>";
		this.lastPs = 0.0;
		this.rhythmChooserValues = ['whole', 'half','quarter'];
		this.allowableMeters = ['4/4','3/4'];
		this.usedRhythms = {};
		this.possibleRhythms = {
		    '4/4': ['2 2 4 4 4 4 2 2',
		            '4 2 4 4 4 2 1',
		            '1 2 4 4 2 4 4 2 2',
		            '2 2 4 2 4 1',
		            '1 4 4 2 4 4 4 4 1',
		            '1 2 2 2 2 4 4 2',
		            '4 4 4 4 2 4 4 1',
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


		this.getTwoStreams = function () {
		    var chosenMeter = random.choice(this.allowableMeters);
		    if (this.usedRhythms[chosenMeter] == undefined) {
		        this.usedRhythms[chosenMeter] = [];
		    }
		    var chosenRhythm = random.choiceWithoutDuplicates(
	            this.possibleRhythms[chosenMeter],
	            this.usedRhythms[chosenMeter]                
		    );
		    var tn = chosenRhythm;
		    var tsObj = new music21.meter.TimeSignature(chosenMeter);
		    var numQtrs = parseInt(tsObj.barDuration.quarterLength);
		    for (var j = 0; j < numQtrs; j++) {
		        tn = "b4 " + tn;
		    }
		    tnScore = m21theory.misc.tnRhythmScore(tn, chosenMeter);
		    tnScore.tempo = this.tempo;
		    
			var s = new music21.stream.Score();
            s.renderOptions.scaleFactor.x = 0.9;
            s.renderOptions.scaleFactor.y = 0.9;
			p = new music21.stream.Part();
			p.tempo = this.tempo;
			p.autoBeam = true;
			p.clef = new music21.clef.PercussionClef();
			p.timeSignature = chosenMeter;

			m = new music21.stream.Measure();
			m.renderOptions.staffLines = 1;
	        for (var j = 0; j < numQtrs; j++) {
	            var n =  new music21.note.Note('B4');
	            n.stemDirection = 'up';
	            m.append( n );
	        }
		    p.append(m);
		    s.append(p);
		    return [tnScore, s];		    		    
		};


	};

	ThisTest.prototype = new section.Generic();
	ThisTest.prototype.constructor = ThisTest;
	return ThisTest;
});