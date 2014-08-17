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
        if (storedAnswer.length != studentAnswer.length) {
            var comparative = 'fewer';
            if (studentAnswer.length > storedAnswer.length) {
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
        var niceDiv = $("<div>Question " + (this.index + 1).toString() + "<br/></div>");
        var _ = this.section.getTwoStreams(),
            tnStream = _[0],
            s = _[1];
        
        if (this.isPractice) {
            niceDiv.append( $("<div style='padding-left: 10px; position: relative; top: 0px'><b>Example:</b> Click to listen</div>") );
            tnStream.appendNewCanvas(niceDiv);
        } else {
            s.renderOptions.width = 500;
            var canvasDiv = $("<div style='width: 500px'/>");
            s.appendNewCanvas(canvasDiv);
            var rc = new music21.widgets.RhythmChooser(s, canvasDiv[0]);
            rc.values = this.section.rhythmChooserValues.concat('undo');
            var rcHolder = $("<div/>");

            var b = $("<button style='font-size: 30pt; float: left; position: relative; top: 60px;'>Play</button>");
            b.click( (function() { this.playStream(); }).bind(tnStream) );
            
            var b2 = $("<button style='font-size: 30pt; float: left;  position: relative; top: 60px;'>Check</button>");                
            b2.click( this.checkTrigger );
            rcHolder.append(b);
            rcHolder.append(b2);
            var rhythmChooser = rc.addDiv();
            rhythmChooser.css('width', 'auto');
            rhythmChooser.css('float', 'left');
            
            this.storedAnswer = tnStream;
            this.studentAnswer = s;
            
            rcHolder.append(rhythmChooser);
            niceDiv.append(rcHolder);
            niceDiv.append($("<br clear='all'/>"));
            niceDiv.append(canvasDiv);            
        }
        this.$questionDiv = niceDiv;
        return niceDiv;
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
		this.possibleRhythms = {
		    '4/4': ['2 2 4 4 4 4 2 2',
		            '4 2 4 4 4 2 1',
		            '1 2 4 4 2 4 4 4 4 2',
		            '2 2 4 2 4 1',
		            '1 4 4 2 4 4 4 4 4 2 4',
		            '1 2 2 2 2 4 4 2',
		            '4 4 4 4 1 2 4 4 2 4 4',
		            '4 4 2 4 2 4 4 4 4 4',
		            '2 4 4 4 4 2 4 4 2',
		            '2 2 1 2 2 1',
		            '4 4 2 2 2 4 4 4 4 1',
		            '2 2 2 2 1 4 4 2',
		            ],
		    '3/4': ['2 4 4 4 4 2 4 2.',
		            '2. 4 2 4 2 2.',
		            '4 4 4 2. 2 4 2.',
		            '4 2 2 4 2.',
		            '2. 4 4 4 2.',
		            '2 4 2 4 2.',
		            ],
		};


		this.getTwoStreams = function () {
		    var chosenMeter = random.choice(this.allowableMeters);
		    var chosenRhythm = random.choice(this.possibleRhythms[chosenMeter]);
		    var values = chosenRhythm.split(' ');
		    var tn = chosenMeter + " ";
		    var tsObj = new music21.meter.TimeSignature(chosenMeter);
		    var numQtrs = parseInt(tsObj.barDuration.quarterLength);
		    for (var j = 0; j < numQtrs; j++) {
		        tn += "b4 ";
		    }
		    for (var j = 0; j < values.length; j++) {
		        var note = "b" + values[j];
		        if (j < values.length - 1) {
		            note += " ";
		        }
		        tn += note;
		    }
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
		    tnStream.tempo = this.tempo;
		    // for practice questions
		    tnStream.renderOptions.scaleFactor.x = 0.9;
		    tnStream.renderOptions.scaleFactor.y = 0.9;

		    
			var s = new music21.stream.Part();
			s.renderOptions.scaleFactor.x = 0.9;
            s.renderOptions.scaleFactor.y = 0.9;
			s.tempo = this.tempo;
			s.autoBeam = true;
			s.clef = new music21.clef.PercussionClef();
			s.timeSignature = chosenMeter;

			m = new music21.stream.Measure();
			m.renderOptions.staffLines = 1;
	        for (var j = 0; j < numQtrs; j++) {
	            var n =  new music21.note.Note('B4');
	            n.stemDirection = 'up';
	            m.append( n );
	        }
		    s.append(m);
		    return [tnStream, s];		    		    
		};


	};

	ThisTest.prototype = new section.Generic();
	ThisTest.prototype.constructor = ThisTest;
	return ThisTest;
});