define("m21theory/sections/noteIdentification", 
        ["m21theory/section", "m21theory/random", 'm21theory/question', 'm21theory/misc'], 
        function (section, random, question, misc) {
	
    var NoteQuestion = function (handler, index) {
        question.Question.call(this, handler, index);   
    };
    NoteQuestion.prototype = new question.Question();
    NoteQuestion.prototype.constructor = NoteQuestion;
    NoteQuestion.prototype.checkAnswer = function (studentAnswer, storedAnswer){
        return (storedAnswer.toLowerCase().replace(/\s*/g, "") == 
            studentAnswer.toLowerCase().replace(/\s*/g, "").replace(/n/g, "") );
    };
    NoteQuestion.prototype.lyricsChanged = function () {
        misc.lyricsFromValue(this.$inputBox, this.stream);
        this.canvas = this.stream.replaceCanvas(this.canvas, true); // preserve canvas size...
        //console.log(lyricsSplit);
    };
    
    NoteQuestion.prototype.render = function () {
        var s = this.section.getStream();
        var minDiatonicNoteNum = s.clef.firstLine - 1 - (2 * this.section.allowableLedgerLines);
        var maxDiatonicNoteNum = s.clef.firstLine + 9 + (2 * this.section.allowableLedgerLines);
        var answerList = [];
        for (var j = 0; j < this.section.numNotes; j++) {
            var n;
            do {
                var chosenDiatonicNoteNum = random.randint(minDiatonicNoteNum,
                                                                maxDiatonicNoteNum);
                var p = new music21.pitch.Pitch("C");
                p.diatonicNoteNum = chosenDiatonicNoteNum;
                var newAlter = random.choice(this.section.allowableAccidentals);
                p.accidental = new music21.pitch.Accidental( newAlter );
                
                if (this.section.practiceScales == true) {
                    // override -- ignore all that...                    
                    p.diatonicNoteNum = 30 + this.index + j;
                    if (j > 4) {
                        p.diatonicNoteNum = p.diatonicNoteNum - ( (j - 4) * 2);
                    }
                    if (s.clef.name == 'bass') {
                        p.octave = p.octave - 1;                        
                    }
                }
                
                n = new music21.note.Note("C");
                n.duration.quarterLength = 0.5; // Not Working: type = 'eighth';
                n.pitch = p;
            } while ( (n.pitch.name == 'B#') ||
                      (n.pitch.name == 'E#') ||
                      (n.pitch.name == 'F-') ||
                      (n.pitch.name == 'C-') );
            s.append(n);
            answerList.push(n.pitch.name.replace(/\-/, 'b'));
        }
        
        if (this.section.practiceScales != true) {
            // last answer is always an earlier note with same accidental
            var foundPitch = undefined;
            for (var j = 0; j < this.section.numNotes; j++) {
                var p = s.get(j).pitch;
                if (p.accidental.alter != 0) {
                    foundPitch = p;
                    break;
                }
            }
            if (foundPitch == undefined) {
                // default
                var chosenDiatonicNoteNum = random.randint(minDiatonicNoteNum,
                                                                maxDiatonicNoteNum);
                foundPitch = new music21.pitch.Pitch("C");
                foundPitch.diatonicNoteNum = chosenDiatonicNoteNum;
                var newAlter = random.choice(this.section.allowableAccidentals);
                foundPitch.accidental = new music21.pitch.Accidental( newAlter );
            }
            var n = new music21.note.Note("C");
            n.duration.quarterLength = 0.5; // Not Working: type = 'eighth';
            n.pitch.diatonicNoteNum = foundPitch.diatonicNoteNum;
            n.pitch.accidental = new music21.pitch.Accidental(foundPitch.accidental.alter);
            s.append(n);
            answerList.push(n.pitch.name.replace(/\-/, 'b'));            
        }
        
        // done adding pitches
        s.makeAccidentals();
        var streamAnswer = answerList.join(' ');
        s.renderOptions.events['click'] = undefined;
        var nc = s.createCanvas(400, 125);
        this.canvas = nc;
        
        var $questionDiv = $("<div style='width: 420px; float: left; padding-bottom: 20px'></div>");
        $questionDiv.append(nc);
        if (this.section.useJazz == true) {
            $questionDiv.on('click', this.setActiveJazz.bind(this) );            
        } 
                                
        if (this.isPractice) {
            $questionDiv.append( $("<div style='padding-left: 10px; position: relative; top: 0px'>" +
                    "Example: <b>" + 
                    streamAnswer + 
                    "</b></div>") );
        } else {
            this.stream = s;
            var bindLyrics = (function () { this.lyricsChanged(); } ).bind(this);
            this.storedAnswer = streamAnswer;
            
            var $inputWrapper = $("<div style='padding-left: 70px; position: relative; top: 10px'/>");
            this.$inputBox = $("<input type='text' size='24' class='unanswered'/>")
                             .change( this.checkTrigger )
                             .on('input propertychange paste', bindLyrics );
            if (this.section.useJazz == true) {
                this.$inputBox.css('display', 'none');
                var $b = $("<button>clear</button>").on('click', this.clearJazz.bind(this));
                $inputWrapper.append($b);
            }
            
            $inputWrapper.append(this.$inputBox);
            $questionDiv.append( $inputWrapper );
        }
        this.$questionDiv = $questionDiv;
        return $questionDiv;
    };

    NoteQuestion.prototype.setActiveJazz = function () {
        if (this.isPractice) { return; }
        //console.log('setting Jazz to ', this.index);
        music21.jazzMidi.callBacks.sendOutChord = this.receiveJazz.bind(this);
        m21theory.feedback.glow(this.$questionDiv, 30);
        return true;
    };
    
    NoteQuestion.prototype.receiveJazz = function (n) {
        var p = n.pitch;
        if (n.pitches !== undefined) {
            p = n.pitches[0]; // take lowest pitch from a chord;
        }
        var newVal = this.$inputBox.val();

        if (newVal.length > 0) {
            newVal += " ";
        }
        var oldLength = newVal.split(/\s+/).length;
        var associatedNote = this.stream.get(oldLength - 1); // gets next note...
        
        if (associatedNote !== undefined && associatedNote.pitch !== undefined) {
            console.log(associatedNote.pitch);
            if ((associatedNote.pitch.ps % 12) ==  (p.ps % 12)) {
                // sub with .pitchClass when available;
                p.name = associatedNote.pitch.name; // use correct enharmonic.
            }
        }
        
        newVal += p.name.replace(/\-/, 'b');
        this.$inputBox.val(newVal);
        this.lyricsChanged();
        if (newVal.split(/\s+/).length == this.stream.length) {
            var status = this.checkTrigger();
            if (status == 'correct') {
                if (this.section !== undefined && (this.index + 1) < this.section.totalQs) {
                    this.section.questions[ this.index + 1 - this.section.practiceQs ].setActiveJazz();
                }
            }
        }
        
        //m21theory.feedback.alert(p.nameWithOctave, 'ok');
    };
    
    NoteQuestion.prototype.clearJazz = function (n) {
        this.$inputBox.val("");
        this.lyricsChanged();
    };
    
    var ThisSection = function () {
		section.Generic.call(this);
        this.questionClass = NoteQuestion;

        this.id = 'noteIdentificationTest';
		this.totalQs = 6;
		this.practiceQs = 1;
		this.allowableLedgerLines = 0;
		this.allowableClefs = ['treble','bass'];
		this.allowableAccidentals = [0, 1, -1];
		this.title = "Note Identification";
		this.instructions = "<p>" +
			"Identify the notes in the following excerpts. Use <b>#</b> and <b>b</b> " +
			"for sharp and flat.  You may write in uppercase or lowercase.  Place a space " +
			"after each note for clarity." +
			"</p>";
		this.lastPs = 0.0;
		this.numNotes = 7;
		this.autoBeam = true;
        
		this.practiceScales = false;
		
		this.getStream = function () {
	        var s = new music21.stream.Stream();
	        s.renderOptions.scaleFactor.x = 0.9;
	        s.renderOptions.scaleFactor.y = 0.9;
	        s.autoBeam = this.autoBeam;
	        s.clef = new music21.clef.Clef( random.choice(this.allowableClefs) );
	        s.timeSignature = '4/4';
	        return s;
		};
	};

	ThisSection.prototype = new section.Generic();
	ThisSection.prototype.constructor = ThisSection;
	
	return ThisSection;
});