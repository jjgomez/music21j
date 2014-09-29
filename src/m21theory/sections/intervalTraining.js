define("m21theory/sections/intervalTraining", 
        ["m21theory/section", "m21theory/random", 'm21theory/question'], 
        function (section, random, question) {

    var IntervalQuestion = function (handler, index) {
        question.Question.call(this, handler, index);   
    };
    IntervalQuestion.prototype = new question.Question();
    IntervalQuestion.prototype.constructor = IntervalQuestion;
    
    IntervalQuestion.prototype.render = function () {
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
        if (m21theory.debug) {
            console.log("name1: " + n1.pitch.name);
            console.log("octave: " + n1.pitch.octave);
            console.log("name2: " + n2.pitch.name);
            console.log("octave: " + n2.pitch.octave);
        }
        this.stream = s;
        s.autoBeam = false;
        
        var c1 = undefined; // chord for harmonic intervals...
        
        if (this.section.intervalWritten == 'melodic') {
            s.append(n1);
            if (this.section.showSecondNote != false) {
                s.append(n2);            
            }            
        } else if (this.section.intervalWritten == 'harmonic') {            
            if (this.section.showSecondNote != false) {
                c1 = new music21.chord.Chord([n1, n2]);                
            } else {
                // show only lower...
                var lower = (n1.pitch.ps <= n2.pitch.ps) ? n1 : n2;
                c1 = new music21.chord.Chord([lower]);                
            }                        
            c1.duration.type = 'whole';
            s.append(c1);
        }
        
        if (this.isPractice == false) {
            s.renderOptions.events['click'] = (function () { 
                this.$inputBox.focus(); // will play stream... 
            }).bind(this);            
        }
        
        var nc = s.createCanvas();
        if (this.section.showSecondNote == false) {
            if (this.section.intervalWritten == 'melodic') {
                s.append(n2);
            } else if (this.section.intervalWritten == 'harmonic') { 
                var higher = (n1.pitch.ps > n2.pitch.ps) ? n1 : n2;
                c1.add(higher);
            }
            
        }
        
        
        var $questionDiv = $("<div style='width: 180px; float: left;'></div>");
        $questionDiv.append(nc);
        var intervalName = fullInterval.name;
        if (this.section.genericOnly === true) {
            intervalName = fullInterval.generic.undirected.toString();
        }
        if (this.isPractice) {           
            $questionDiv.append( 
                    $("<div style='padding-left: 50px; position: relative; top: 0px'>" + 
                            intervalName + "</div>") 
                );
        } else {
            this.$inputBox = $("<input type='text' size='5' class='unanswered'/>")
                             .change( this.checkTrigger )
                             .focus( (function () { this.stream.playStream(); }).bind(this) )
                             ;
            this.storedAnswer = intervalName;
            $questionDiv.append( $("<div style='padding-left: 30px; position: relative; top: 0px'/>")
                             .append(this.$inputBox) );
        }
        this.$questionDiv = $questionDiv;
        return $questionDiv;
        
        
    };
	var ThisSection = function () {
		section.Generic.call(this);
		this.questionClass = IntervalQuestion;

		this.id = 'interval';
		
		this.noteNames = ['C','D','E','F','G','A','B'];
		this.accidentals = ["", "", "", "#", "-"];
		
		this.allowablePerfectSpecifiers = ["P"];
		this.allowableImperfectSpecifiers = ["m","M"];
			
		this.minInterval = -3;
		this.maxInterval = 5;
		this.filterIntervals = undefined; // can be a list of generic intervals... for ear training.
		
		this.skipP1 = false;
		this.intervalWritten = 'melodic'; // can be harmonic
		this.genericOnly = false;
			
		this.disallowDoubleAccs = true;
		this.disallowWhiteKeyAccidentals = true;
		
		this.showSecondNote = true; // real ear training...
		
		this.lastRenderedNote1 = undefined;
		this.lastRenderedNote2 = undefined;
		
			
		this.title = "Interval identification (General and Specific)";
		this.instructions = "<p>" +
			"For each set of <b>ascending</b> or <b>descending</b> intervals below, write in the " +
			"yellow box the abbreviated name of the interval using the terms " +	
			"\"<b>m</b>\" for <b>minor</b>, \"<b>M</b>\" for <b>major</b>, or \"<b>P</b>\" " +
			"for <b>perfect</b> (<i>N.B.: capital P</i>). The intervals range in size " +
			"from m2 to P5.  The first four are done for you.<p>" +
			"<p><b>Click any score fragment to hear the intervals played</b>.  Practice " +
			"learning the sounds of these intervals." +
			"</p>";
		
		this.getRandomInterval = function () {
			var randomGeneric = undefined;		
			do {
				randomGeneric = random.randint(this.minInterval, this.maxInterval);
				if (this.filterIntervals !== undefined) {
				    if (this.filterIntervals.indexOf(randomGeneric) == -1) {
				        randomGeneric = -1;
				    }
				}
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
			if (m21theory.debug) {
				console.log("m21theory.IntervalTest.getRandomInterval: " + fullInterval.name);
			}
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