define("m21theory/tests/rhythmMatch", ["m21theory/section", "m21theory/random"], 
        function (section, random) {
	var ThisTest = function () {
		section.Generic.call(this);
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

		this.checkAnswer = function (storedAnswer, answerGiven) {
		    var gt = storedAnswer.flat.notes;
		    var student = answerGiven.flat.notes;
            if (storedAnswer.length != answerGiven.length) {
                var comparative = 'fewer';
                if (answerGiven.length > storedAnswer.length) {
                    comparative = 'more';
                }
                this.showAlert("Your line has " + comparative + " measures than the played line.");
                return false;
            }
		    if (gt.length != student.length) { 
		        this.showAlert(
                        "Your line doesn't have the same number of notes as was played; look for that.");
		        return false; 
		    }
		    
		    
		    for (var i = 0; i < gt.length; i++) {
		        var gtN = gt.get(i);
		        var studentN = student.get(i);
		        if (gtN.duration.quarterLength != studentN.duration.quarterLength) {
		            return false;
		        }
		    }
		    answerGiven.niceDiv.css('background-color', '#99ff99');
		    return true;
		};

		this.renderOneQ = function (i) {
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
		    
			var s = new music21.stream.Part();
			s.renderOptions.scaleFactor.x = 1.0;
            s.renderOptions.scaleFactor.y = 1.0;
			s.tempo = this.tempo;
			s.autoBeam = true;
			s.clef = new music21.clef.PercussionClef();
			s.timeSignature = chosenMeter;
			var answerList = [];
			m = new music21.stream.Measure();
			m.renderOptions.staffLines = 1;
	        for (var j = 0; j < numQtrs; j++) {
	            var n =  new music21.note.Note('B4');
	            n.stemDirection = 'up';
	            m.append( n );
	        }
		    s.append(m);			
			var niceDiv = $("<div>Question " + (i+1).toString() + "<br/></div>");
									
			if (i < this.practiceQs) {
				niceDiv.append( $("<div style='padding-left: 10px; position: relative; top: 0px'>Click to listen</div>") );
				tnStream.appendNewCanvas(niceDiv);
			} else {
			    var canvasDiv = $("<div/>");
			    s.appendNewCanvas(canvasDiv);
	            var rc = new music21.widgets.RhythmChooser(s, canvasDiv[0]);
	            rc.values = this.rhythmChooserValues.concat('undo');
	            var rcHolder = $("<div/>");
                var b = $("<button style='font-size: 30pt; float: left; position: relative; top: 60px;'>Play</button>");
                b.click( (function() { this.playStream(); }).bind(tnStream) );
                var b2 = $("<button style='font-size: 30pt; float: left;  position: relative; top: 60px;'>Check</button>");                
                b2.click( (function(sts) { this.checkAnswer(sts[0], sts[1]); }).bind(this, [tnStream, s]) );
                rcHolder.append(b);
                rcHolder.append(b2);
	            var rhythmChooser = rc.addDiv();
	            rhythmChooser.css('width', 'auto');
                rhythmChooser.css('float', 'left');
	            
	            rcHolder.append(rhythmChooser);
	            niceDiv.append(rcHolder);
	            niceDiv.append($("<br clear='all'/>"));
                niceDiv.append(canvasDiv);
                s.niceDiv = niceDiv;
			}
			return niceDiv;
		};


	};

	ThisTest.prototype = new section.Generic();
	ThisTest.prototype.constructor = ThisTest;
	return ThisTest;
});