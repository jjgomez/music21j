define("m21theory/sections/chordCreation", 
        ["m21theory/section", "m21theory/random", "m21theory/question", 'music21/key', 'music21/chord'], 
        function (section, random, question, key, chord) {
    var CCQuestion = function (handler, index) {
        question.Question.call(this, handler, index);  
        this.ignoreMistakes = true;
        this.correctCallback = function () { this.stream.playStream(); };
    };
    CCQuestion.prototype = new question.Question();
    CCQuestion.prototype.constructor = CCQuestion;
    CCQuestion.prototype.studentAnswerForStorage = function () {
        var sa = this.getStudentAnswer(); // a list of pitch.Pitch objects
        console.log(sa);
        var outNotes = [];
        for (var i = 0; i < sa.length; i++) {
            outNotes.push(sa[i].nameWithOctave);
        }
        return outNotes; // a list of nameWithOctave strings
    };
    CCQuestion.prototype.storedAnswerForStorage = function () {
        var sa = this.getStoredAnswer(); // a list of pitch.Pitch objects
        var outNotes = [];
        for (var i = 0; i < sa.length; i++) {
            outNotes.push(sa[i].nameWithOctave);
        }
        return outNotes; // a list of nameWithOctave strings
    };
    CCQuestion.prototype.restoreStudentAnswer = function (dbAnswer) {
        if (dbAnswer !== undefined && dbAnswer !== null && dbAnswer != "") {
            dbAnswerArr = JSON.parse(dbAnswer);
            for (var i = 0; i < dbAnswerArr.length; i++) {
                var dba = dbAnswerArr[i];
                this.stream.get(i).pitch.nameWithOctave = dba;
            }
        }
    };

    CCQuestion.prototype.restoreStoredAnswer = function (dbAnswer) {
        if (dbAnswer !== undefined && dbAnswer !== null && dbAnswer != "") {
            dbAnswerArr = JSON.parse(dbAnswer);
            var chordPitches = [];
            for (var i = 0; i < dbAnswerArr.length; i++) {
                chordPitches.push( new music21.pitch.Pitch(dbAnswerArr[i]));
            }
            this.storedAnswer = chordPitches;
        }
    };
    
    CCQuestion.prototype.checkAnswer = function (studentAnswer, storedAnswer) {
        //m21theory.debug = true;
        if (m21theory.debug) {
            var answerStr = "";
            for (var j =0; j < storedAnswer.length; j++ ) {
                answerStr += storedAnswer[j].name + " ";
            }
            console.log(answerStr);
        }
        var correct = true;
        for (var i = 0; i < storedAnswer.length; i++) {
            var foundIt = false;
            for (var j = 0; j < studentAnswer.length; j++) {
                if (storedAnswer[i].name == studentAnswer[j].name) {
                    foundIt = true;
                    break;
                }
            }
            if (foundIt != true) {
                correct = false;
                break;
            }
        }
        if (correct) { // possible correct 
            //find bass note -- for inversion, etc...
            var givenChord = new music21.chord.Chord(studentAnswer);
            var storedChord = new music21.chord.Chord(storedAnswer);
            var givenBass = givenChord.bass();
            var storedBass = storedChord.bass();
            if (givenBass.name != storedBass.name) {
                correct = false;
            }
        }
        return correct;
    };
    
    
    CCQuestion.prototype.getStudentAnswer = function () {
        var givenAnswer = [];
        var s = this.stream;
        for (var i = 0; i < s.length; i++) {
            givenAnswer.push(s.get(i).pitch);
        }
        return givenAnswer;
    };
    
    CCQuestion.prototype.postAnswerRestore = function () {
        this.stream.replaceCanvas(this.$questionDiv);        
    };
    
    CCQuestion.prototype.render = function () {
        var section = this.section;
        var chordRN = section.getRomanNumeral();
        var $infoDiv = section.getDisplayForRN(chordRN);            
        var chordPitches = chordRN.pitches;
        var s = section.getStream(chordPitches.length);

        this.stream = s;
        this.storedAnswer = new chord.Chord(chordPitches).pitches;
    
        var d = $("<div/>").css('text-align','left').css('position','relative');
        var buttonDivPlay = s.getPlayToolbar();
        buttonDivPlay.css('top', '0px');
        d.append(buttonDivPlay);
        d.append( $("<br clear='all'/>") );
        var buttonDiv = s.getAccidentalToolbar();
        buttonDiv.css('top', '15px');
        d.append(buttonDiv);
        d.append( $("<br clear='all'/>") );
        s.appendNewCanvas(d); // var can = ...

        s.changedCallbackFunction = (function () { this.validateAnswer(); }).bind(this);
        
        d.css('float', 'left');
        
        d.append($infoDiv);
        this.$questionDiv = d;
        
        
        if (m21theory.debug) {
            var answerStr = "";
            for (var j =0; j < chordPitches.length; j++ ) {
                answerStr += chordPitches[j].nameWithOctave + " ";
            }
            console.log(answerStr);
        }
        
        // store answers, etc. on Stream!
        return d;
    };

    
	var ThisSection = function () {
		section.Generic.call(this);
		
		this.questionClass = CCQuestion;

		this.id = 'chordCreationTest';
		this.totalQs = 9;
		this.practiceQs = 0;
		this.maxMistakes = 999999; // okay...
		this.allowEarlySubmit = true; // necessary
		this.minSharps = -4;
		this.maxSharps = 4;
		this.inversionChoices = undefined;
		this.displayChoices = ['roman','degreeName'];
		this.chordChoices = ['Tonic', 'Dominant','Subdominant', 'Submediant', 'Supertonic', 'Mediant', 'Leading-tone'];
		this.modeChoices = ['major','minor'];
		this.chordChoicesMode = {
				'major': ['I','ii','iii','IV','V','vi','viio'],
				'minor': ['i','iio','III','iv','V','VI','viio']
		};
		
		this.chordDefinitions = {
			'major': ['M3', 'm3'],
			'minor': ['m3', 'M3'],
			'diminished': ['m3', 'm3'],
			'augmented': ['M3', 'M3'],
			'major-seventh': ['M3', 'm3', 'M3'],
			'dominant-seventh': ['M3','m3','m3'],
			'minor-seventh': ['m3', 'M3', 'm3'],
			'diminished-seventh': ['m3','m3','m3'],
			'half-diminished-seventh': ['m3','m3','M3'],
		};
		this.chordTranspositions = {
				'Tonic': ["P1", 'major'],
				'Dominant': ["P5", 'major'], 
				'Dominant-seventh': ["P5", 'dominant-seventh'], 
				'Subdominant': ["P4", 'major'], 
				'Submediant': ["M6", 'minor'],
				'Supertonic': ["M2", 'minor'],
				'Mediant': ["M3", 'minor'],
				'Leading-tone': ["M7", 'diminished'],
				'Leading-tone-seventh': ["M7", "diminished-seventh"]
				}; 

		this.title = "Chord Spelling";
		this.instructions = "<p>" +
			"Give the notes in the following chords from lowest to highest.<br/>" +
			"The notes will be written melodically to make them easier to edit, " +
			"but imagine that they would be played together</p>" +
			"<p>" +
			"Click above or below a note on a line or space to move it up or down, and " +
			"click the accidental buttons above the staff to add the appropriate accidental " +
			"to the last edited note. " +
			"</p><p>&nbsp;</p>";

		this.usedKeySignatures = [];
			
		this.getKeySignature = function () {
		    if (this.usedKeySignatures.length == (this.maxSharps - this.minSharps)) {
                this.usedKeySignatures = []; // clear for new work.
            }
            var keySignatureSharps = undefined;
            while (keySignatureSharps == undefined) {
                keySignatureSharps = random.randint(this.minSharps, this.maxSharps);
                for (var j = 0; j < this.usedKeySignatures.length; j++) {
                    if (this.usedKeySignatures[j] == keySignatureSharps) {
                        keySignatureSharps = undefined;
                    }
                }
            }
            this.usedKeySignatures.push(keySignatureSharps);
            var ks = new key.KeySignature(keySignatureSharps);
            return ks;
		};
		
		this.getKey = function () {
            var ks = this.getKeySignature();            
            var mode = random.choice(this.modeChoices);         
            var tonic;
            if (mode == 'major') {
                tonic = ks.majorName();
            } else {
                tonic = ks.minorName();
            }
            var keyObj = new key.Key(tonic, mode);
            return keyObj;
		};
		
		this.getRomanNumeral = function () {
		    var keyObj = this.getKey();
		    var modalChoices = this.chordChoicesMode[keyObj.mode];
            var chordRNstr = random.choice(modalChoices);
            var chordRN = new music21.roman.RomanNumeral(chordRNstr, keyObj);
            return chordRN;            		    
		};

	    this.getDisplayForRN = function (chordRN) {
            var keyObj = chordRN.key;
            var tonic = keyObj.tonic;
            var mode = keyObj.mode;
            
            var displayType = random.choice(this.displayChoices);
            
            var inversionName = "";
            if (this.inversionChoices != undefined) {
                var thisInversion = random.choice(this.inversionChoices);
                if (thisInversion != 0) {
                    if (thisInversion == 1) {
                        chordRN.pitches[0].octave += 1;
                        if (displayType == 'roman') {
                            inversionName = '6';
                        } else {
                            inversionName = ' (first inversion)';
                        }
                    } else if (thisInversion == 2) {
                        chordRN.pitches[0].octave += 1;
                        chordRN.pitches[1].octave += 1;
                        if (displayType == 'roman') {
                            inversionName = '64';
                        } else {
                            inversionName = ' (second inversion)';
                        }
                    }
                }
            }
            var fullChordName;
            if (displayType == 'roman') {
                fullChordName = chordRN.figure;
            } else {
                fullChordName = chordRN.degreeName;
                if (chordRN.numbers != undefined) {
                    fullChordName += " " + chordRN.numbers.toString();
                }
            }
            var tonicDisplay = tonic.replace(/\-/, 'b');
            if (mode == 'minor') {
                tonicDisplay = tonicDisplay.toLowerCase();
            }
            var $infoDiv = $("<div style='padding-left: 20px; margin-top: -18px; margin-bottom: 50px'>" +
                    fullChordName + inversionName + " in " + tonicDisplay + " " + mode + "</div>");
            return $infoDiv;
	    };
        this.getStream = function(len) {
            var s = new music21.stream.Measure();
            for (var j =0; j < len; j++ ) {
                var gPitch = new music21.note.Note("G2");
                s.append(gPitch);
            }
            s.clef = new music21.clef.Clef('bass');
            s.renderOptions.events['click'] = s.canvasChangerFunction;
            s.renderOptions.scaleFactor.x = 1.0;
            s.renderOptions.scaleFactor.y = 1.0;            
            return s;
        };

	};

	ThisSection.prototype = new section.Generic();
	ThisSection.prototype.constructor = ThisSection;
	return ThisSection;
});