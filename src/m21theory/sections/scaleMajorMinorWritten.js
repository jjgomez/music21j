define("m21theory/sections/scaleMajorMinorWritten", 
        ["m21theory/section", "m21theory/random", 'm21theory/question'], 
        function (section, random, question) {
    var ScaleWriteQuestion = function (handler, index) {
        question.Question.call(this, handler, index);   
    };
    ScaleWriteQuestion.prototype = new question.Question();
    ScaleWriteQuestion.prototype.constructor = ScaleWriteQuestion;
    
    ScaleWriteQuestion.prototype.getStudentAnswer = function () {
        var selected = this.$inputBox.find("input[type='radio']:checked");
        var val = undefined;
        if (selected.length > 0) {
            val = selected.val();
            //console.log(val);
        } 
        return val;
    };
    
    ScaleWriteQuestion.prototype.render = function () {
        var sec = this.section;
        var s = new music21.stream.Stream();
        this.stream = s;
        
        s.tempo = 60;
        s.clef = new music21.clef.Clef( random.choice(sec.allowableClefs) );
        var direction = random.choice(sec.allowableDirections);
        var allowable;
        if (direction == 'ascending') {
            allowable = sec.allowableScales; 
        } else {
            allowable = sec.allowableScalesDescending; 
        }
        var scaleType = random.choice(allowable);
        
        if (this.isPractice) {
            direction = 'ascending';
            scaleType = sec.allowableScales[this.index % sec.allowableScales.length];
        }
        
        
        if (sec.usedKeySignatures.length == sec.maxSharps - sec.minSharps) {
            sec.usedKeySignatures = []; // clear for new work.
        }
        var keySignatureSharps = undefined;
        while (keySignatureSharps == undefined) {
            keySignatureSharps = random.randint(sec.minSharps, sec.maxSharps);
            for (var j = 0; j < sec.usedKeySignatures.length; j++) {
                if (sec.usedKeySignatures[j] == keySignatureSharps) {
                    keySignatureSharps = undefined;
                }
            }
        }
        sec.usedKeySignatures.push(keySignatureSharps);
        
        var ks = new music21.key.KeySignature(keySignatureSharps);
        var tonic;
        if (scaleType == 'major') {
            tonic = ks.majorName(); 
        } else {
            tonic = ks.minorName();
        }
        var tonicPitch = new music21.pitch.Pitch(tonic);
        if (s.clef.name == 'bass') {
            if (tonicPitch.step == 'B' || tonicPitch.step == 'A' || tonicPitch.step == 'G') {
                tonicPitch.octave = 2;
            } else {
                tonicPitch.octave = 3;      
            }
        }
        var scalePitches = undefined;
        if (scaleType == 'major') {
            scalePitches = music21.scale.ScaleSimpleMajor(tonicPitch); // no new needed yet...
        } else {
            scalePitches = music21.scale.ScaleSimpleMinor(tonicPitch, scaleType);
        }
        if (direction == 'descending' ) {
            scalePitches.reverse();
        }
        for (var j = 0; j < scalePitches.length; j ++ ) {
            var n = new music21.note.Note();
            //n.duration.quarterLength = 0.5;
            n.pitch = scalePitches[j];
            n.stemDirection = 'noStem';
            s.append(n);
        }
        s.autoBeam = false;
        
        var removedNotes = [];
        var remEls; 
        if (direction == 'descending') {
            remEls = [1, 2, 5]; // 7th, 6th, third...
        } else {
            remEls = [2, 5, 6]; // third, 6th, 7th...
        }
        
        // hide notes until canvas is drawn;
        if (sec.hide367) {
            for (var j = 0; j < remEls.length; j++) {
                removedNotes.push( s.get(remEls[j]) );
                s.elements[remEls[j]] = new music21.note.Rest();
            }
        }
        
        var nc = s.createCanvas(320);
        
        // replace hidden notes for stream playback
        if (sec.hide367) {
            for (j = 0; j < remEls.length; j++) {
                s.elements[remEls[j]] = removedNotes[j];
            }
        }
        
        var $questionDiv = $("<div style='width: 330px; float: left; padding-bottom: 20px;'></div>");
        this.$questionDiv = $questionDiv;
        if (this.isPractice) {
            $questionDiv.css('height', '190px');
        }
        $questionDiv.append(nc);
                                
        if (this.isPractice) {
            var niceAnswer = sec.niceScaleNames[direction][scaleType];
            $questionDiv.append( $("<div style='padding-left: 20px; position: relative; top: 0px'>Example: <b>" + 
                    niceAnswer + "</b></div>") );
        } else {
            
            var inputBox = $('<div class="unanswered"/>').css('position', 'relative');
            this.storedAnswer = scaleType;
            for (var j = 0; j < allowable.length; j++) {
                var thisOption = allowable[j];
                var niceChoice = sec.niceScaleNames[direction][thisOption];
                var fieldInput =  $('<label><input type="radio" name="' + 
                            this.id + this.index.toString() + '" value="' + thisOption + '" /> ' + 
                            niceChoice + '<br/></label>');
                fieldInput.change( this.checkTrigger );
                inputBox.append(fieldInput);
            }
            if (allowable.length < 4) {
                inputBox.append($('<br/>'));
            }
            this.$inputBox = inputBox;
            $questionDiv.append( $("<div style='position: relative; top: 0px;'/>")
                             .append(inputBox) );

        }
        return $questionDiv;
    };    
    var ThisSection = function () {
		section.Generic.call(this);
		this.questionClass = ScaleWriteQuestion;
		
		this.id = 'scaleMajorMinor';
		this.totalQs = 16;
		this.practiceQs = 4;
		this.allowableClefs = ['treble', 'bass'];
		this.allowableScales = ['major', 'natural', 'harmonic', 'melodic'];
		this.allowableScalesDescending = ['major', 'natural', 'harmonic'];
		this.allowableDirections = ['ascending', 'descending'];
		this.minSharps = -3;
		this.maxSharps = 3;
		
		this.hide367 = false; 
		
		this.niceScaleNames = {
				'ascending': {
					'major': 'Major',
					'natural': 'Natural minor',
					'harmonic': 'Harmonic minor collection',
					'melodic': 'Ascending melodic minor'
				},
				'descending': {
					'major': 'Major',
					'natural': 'Natural or descending melodic minor',
					'harmonic': 'Harmonic minor collection'
				}
		};
		
		this.title = "Major vs. Minor Scale Identification";
		this.instructions = "<p>" +
			"Each of the following questions presents a properly written major " +
			"or minor scale in a given key. Identify the type of scale as major, " +
			"natural minor (or the identical melodic minor descending), harmonic minor collection, " +
			"or melodic minor ascending." + 
			"</p><p><b>Click the scales to hear them.</b> They do not play automatically." +
			"</p>";
		this.usedKeySignatures = [];

	};

	ThisSection.prototype = new section.Generic();
	ThisSection.prototype.constructor = ThisSection;
	return ThisSection;
});