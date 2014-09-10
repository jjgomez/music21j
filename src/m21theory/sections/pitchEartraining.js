define("m21theory/sections/pitchEartraining", 
        ["m21theory/section", "m21theory/random", 'm21theory/question'], 
        function (section, random, question) {

    var PQuestion = function (handler, index) {
        question.Question.call(this, handler, index);   
    };
    PQuestion.prototype = new question.Question();
    PQuestion.prototype.constructor = PQuestion;
    
    PQuestion.prototype.render = function () {
        var _ = this.section.getRandomValidIntervalAndNotes(),
            n1 = _[0],
            n2 = _[1],
            fullInterval = _[2];

        var s = new music21.stream.Stream();
        if (random.randint(0,1)) {
            s.clef = new music21.clef.Clef('treble');
        } else {
            s.clef = new music21.clef.Clef('bass');
            var octaveShift = 0;
            if (n1.pitch.diatonicNoteNum > 32) {
                octaveShift = -2;
            } else {
                octaveShift = -1;
            }
            n1.pitch.octave = n1.pitch.octave + octaveShift;
            n2.pitch.octave = n2.pitch.octave + octaveShift;
        }       
        s.append(n1);
        s.autoBeam = false;
        this.stream = s;
        
        var nc = s.createCanvas();
        s.append(n2);

        var $questionDiv = $("<div style='width: 180px; float: left;'></div>");
        $questionDiv.append(nc);
        if (this.isPractice) {
            $questionDiv.append( 
                    $("<div style='padding-left: 50px; position: relative; top: 0px'>" + 
                            fullInterval.name + "</div>") 
                );
        } else {
            var inputBox = $('<div/>').css('position', 'relative');
            this.storedAnswer = scaleType;
            var answers = ['higher', 'lower', 'same'];
            for (var j = 0; j < answers.length; j++) {
                var thisOption = answers[j];
                var fieldInput =  $('<label><input type="radio" name="' + 
                            this.id + this.index.toString() + '" value="' + thisOption + '" /> ' + 
                            thisOption + '<br/></label>');
                fieldInput.change( this.checkTrigger );
                inputBox.append(fieldInput);
            }
            this.storedAnswer = fullInterval.name;
            this.$inputBox = inputBox;
            $questionDiv.append( $("<div style='padding-left: 10px; position: relative; top: 0px'/>")
                             .append(this.$inputBox) );
        }
        this.$questionDiv = $questionDiv;
        return $questionDiv;
        
        
    };
	var ThisSection = function () {
		section.Generic.call(this);
		this.questionClass = PQuestion;

		this.id = 'pitchEartraining';
		
		this.noteNames = ['C','D','E','F','G','A','B'];
		this.accidentals = ["", "", "", "#", "-"];
		
		this.allowablePerfectSpecifiers = ["P"];
		this.allowableImperfectSpecifiers = ["m","M"];
			
		this.minInterval = -3;
		this.maxInterval = 5;
		
		this.skipP1 = false;
			
		this.disallowDoubleAccs = true;
		this.disallowWhiteKeyAccidentals = true;
		
		this.lastRenderedNote1 = undefined;
		this.lastRenderedNote2 = undefined;
			
		this.title = "Interval identification (General and Specific)";
		this.instructions = "<p>Each score has a single note written. " +
			"When you click on the score, you will hear several notes played. " + 			
			"Determine whether the LAST note is higher, lower, or the same as the first note.</p>";
		
		this.getRandomInterval = function () {
			var randomGeneric = undefined;		
			do {
				randomGeneric = random.randint(this.minInterval, this.maxInterval);
			} while (randomGeneric == 0 || randomGeneric == -1);

			if (this.skipP1) {
				if (randomGeneric == 1) {
					randomGeneric = 2;
				}
			}

			var genericInterval = new music21.interval.GenericInterval(randomGeneric);
			var diatonicSpecifier = undefined;

			if (genericInterval.perfectable == false) {
				diatonicSpecifier = random.choice(this.allowableImperfectSpecifiers);
			} else {
				diatonicSpecifier = random.choice(this.allowablePerfectSpecifiers);		
			}
			if (diatonicSpecifier == 'd' && randomGeneric == 1) {
				diatonicSpecifier = 'A';
			}

			var diatonicInterval = new music21.interval.DiatonicInterval(diatonicSpecifier, genericInterval);
			var fullInterval = new music21.interval.Interval(diatonicInterval);
			return fullInterval;
		};	
			
		this.getRandomIntervalAndNotes = function () {
			var fullInterval = this.getRandomInterval();
			var noteNames = this.noteNames;
			var accidentals = this.accidentals;
			var noteName = random.choice(noteNames);
			var accName = random.choice(accidentals);
			var n1 = new music21.note.Note(noteName + accName);
			var p2 = fullInterval.transposePitch(n1.pitch);
			var n2 = new music21.note.Note("C");
			n2.pitch = p2;
			if ((n1.pitch.step == n2.pitch.step) &&
				(n1.pitch.name != n2.pitch.name) &&
				( (n2.pitch.accidental == undefined) || (n2.pitch.accidental.name == 'natural'))
				) {
				n2.pitch.accidental = new music21.pitch.Accidental('natural');
				n2.pitch.accidental.displayStatus = true;
			}
			return [n1, n2, fullInterval];
		};
		
		this.getRandomValidIntervalAndNotes = function () {
			//console.log("starting getRandomValidIntervalAndNotes");
			var validIntervals = false;
			do {
				var _ = this.getRandomIntervalAndNotes(),
					n1 = _[0],
					n2 = _[1],
					fullInterval = _[2];
				validIntervals = true;
				if (m21theory.debug) {
					console.log('Get interval ' + fullInterval.name + ': checking if valid');
				}
				if ((this.lastRenderedNote1 == n1.pitch.nameWithOctave) &&
					(this.lastRenderedNote2 == n2.pitch.nameWithOctave)) {
					validIntervals = false;
					continue;
				} 
				if (this.disallowDoubleAccs) {
					if ((n1.pitch.accidental != undefined) &&
						(Math.abs(n1.pitch.accidental.alter) > 1)) {
						validIntervals = false;	
					} else if ((n2.pitch.accidental != undefined) &&
						(Math.abs(n2.pitch.accidental.alter) > 1)) {
						validIntervals = false;			
					} 
				} else { // triple sharps/flats cannot render
					if ((n1.pitch.accidental != undefined) &&
						(Math.abs(n1.pitch.accidental.alter) > 2)) {
						validIntervals = false;	
					} else if ((n2.pitch.accidental != undefined) &&
						(Math.abs(n2.pitch.accidental.alter) > 2)) {
						validIntervals = false;			
					} 
				
				}
				if (this.disallowWhiteKeyAccidentals) {
					if ((n1.pitch.name == "C-") ||
								(n1.pitch.name == "F-") ||
								(n1.pitch.name == "B#") ||
								(n1.pitch.name == "E#")) {
						validIntervals = false;
						// n.b. we allow intervals that create these notes, but not starting.			
					} else if ((n2.pitch.name == "C-") ||
								(n2.pitch.name == "F-") ||
								(n2.pitch.name == "B#") ||
								(n2.pitch.name == "E#")) {
						// not for assignment 1 we dont...
						validIntervals = false;
					}		
				}
			} while (validIntervals == false);
			this.lastRenderedNote1 = n1.pitch.nameWithOctave;
			this.lastRenderedNote2 = n2.pitch.nameWithOctave;
			return [n1, n2, fullInterval];	
		};
	};

	ThisSection.prototype = new section.Generic();
	ThisSection.prototype.constructor = ThisSection;
	return ThisSection;
});