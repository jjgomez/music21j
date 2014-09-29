define("m21theory/sections/scaleWriting", 
        ["m21theory/section", "m21theory/random", 'm21theory/question', 'm21theory/misc'], 
        function (section, random, question, misc) {
    
    var ScaleQuestion = function (handler, index) {
        question.Question.call(this, handler, index);   
        this.checkTrigger = (function () { 
            if (this.section.useJazz == false) {
                this.stream.playStream(); 
            }
            return this.validateAnswer(); 
        }).bind(this);

    };
    ScaleQuestion.prototype = new question.Question();
    ScaleQuestion.prototype.constructor = ScaleQuestion;
    ScaleQuestion.prototype.checkAnswer = function (studentAnswer, storedAnswer){
        return (storedAnswer.toLowerCase().replace(/\s*/g, "") == 
            studentAnswer.toLowerCase().replace(/\s*/g, "").replace(/n/g, "") );
    };
    ScaleQuestion.prototype.postAnswerRestore = function () {
        this.lyricsChanged();
    };
    
    ScaleQuestion.prototype.lyricsChanged = function () {
        this.stream.elements = [];
        var inputNotes = this.$inputBox.val().split(/\s+/);
        for (var i = 0; i < inputNotes.length; i++) {
            var pName = inputNotes[i].substring(0,1).toUpperCase() + inputNotes[i].substring(1);
            pName = pName.replace(/b/, '-');
            if (pName == "") {
                continue;
            }
            var p = new music21.pitch.Pitch(pName);
            p.octave = this.initialOctave;
            if (this.direction == 'ascending') {
                while (p.diatonicNoteNum < this.tonicPitch.diatonicNoteNum) {
                    p.octave += 1;
                }
                if (i == this.scalePitches.length - 1) {
                    p.octave += 1;
                }
            } else {
                while (p.diatonicNoteNum > this.tonicPitch.diatonicNoteNum) {
                    p.octave -= 1;
                }                
                if (i == this.scalePitches.length - 1) {
                    p.octave -= 1;
                }
            }
            var n = new music21.note.Note(p);
            this.stream.append(n);
        }
        misc.lyricsFromValue(this.$inputBox, this.stream);
        this.canvas = this.stream.replaceCanvas(this.canvas, true); // preserve canvas size...
        //console.log(lyricsSplit);
    };
    
    ScaleQuestion.prototype.render = function () {
        var sec = this.section;
        var s = sec.getStream();
        s.clef = new music21.clef.Clef( random.choice(sec.allowableClefs) );
        var direction = random.choice(sec.allowableDirections);
        var allowable;
        if (direction == 'ascending') {
            allowable = sec.allowableScales; 
        } else {
            allowable = sec.allowableScalesDescending; 
        }
        this.direction = direction;
        var scaleType = random.choice(allowable);
        
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

        this.tonicPitch = tonicPitch;        
        if (direction == 'descending' ) {
            scalePitches.reverse();
            this.tonicPitch = scalePitches[0];
        }
        this.initialOctave = this.tonicPitch.octave;
        this.scalePitches = scalePitches;
        
        var tonic = new music21.note.Note(scalePitches[0]);        
        s.append(tonic);        
        s.autoBeam = false;

        var answerList = [];
        for (var i = 0 ; i < scalePitches.length; i++) {
            answerList.push(scalePitches[i].name.replace(/\-/, 'b'));            
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
        
        var niceScaleName = this.section.niceScaleNames[direction][scaleType];
        $questionDiv.append( $("<div style='padding-left: 20px'>" + this.tonicPitch.name.replace(/\-/, 'b') 
                                + " " + niceScaleName + ", " + direction + "</div>"));
                                
        if (this.isPractice) {
            for (var i = 1 ; i < scalePitches.length; i++) {
                var n = new music21.note.Note(scalePitches[i]);
                s.append(n);
            }
            s.replaceCanvas($questionDiv);
            
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
            } else {
                this.$inputBox.val(tonic.name.replace(/\-/, 'b'));
            }
            
            $inputWrapper.append(this.$inputBox);
            $questionDiv.append( $inputWrapper );
        }
        this.$questionDiv = $questionDiv;
        return $questionDiv;
    };

    ScaleQuestion.prototype.setActiveJazz = function () {
        if (this.isPractice) { return; }
        //console.log('setting Jazz to ', this.index);
        music21.jazzMidi.callBacks.sendOutChord = this.receiveJazz.bind(this);
        m21theory.feedback.glow(this.$questionDiv, 30);
        return true;
    };
    
    ScaleQuestion.prototype.receiveJazz = function (n) {
        var p = n.pitch;
        if (n.pitches !== undefined) {
            p = n.pitches[0]; // take lowest pitch from a chord;
        }
        var newVal = this.$inputBox.val();

        if (newVal.length > 0) {
            newVal += " ";
        }
        var oldLength = newVal.split(/\s+/).length;
        var associatedPitch = this.scalePitches[oldLength - 1];
                
        if (associatedPitch !== undefined) {
            if ((associatedPitch.ps % 12) ==  (p.ps % 12)) {
                // sub with .pitchClass when available;
                p.name = associatedPitch.name; // use correct enharmonic.
            } else {
                console.log('looking for ' + associatedPitch.name + " got: " + p.name);
            }
        } else {
            console.log('no associatedPitch');
        }
        
        newVal += p.name.replace(/\-/, 'b');
        this.$inputBox.val(newVal);
        this.lyricsChanged();
        if (newVal.split(/\s+/).length == this.scalePitches.length) {
            var status = this.checkTrigger();
            if (status == 'correct') {
                if (this.section !== undefined && (this.index + 1) < this.section.totalQs) {
                    this.section.questions[ this.index + 1 - this.section.practiceQs ].setActiveJazz();
                }
            }
        }
        
        //m21theory.feedback.alert(p.nameWithOctave, 'ok');
    };
    
    ScaleQuestion.prototype.clearJazz = function (n) {
        this.$inputBox.val("");
        this.lyricsChanged();
    };
    
    var ThisSection = function () {
        section.Generic.call(this);
        this.questionClass = ScaleQuestion;

        this.id = 'scaleWriting';
        this.totalQs = 6;
        this.practiceQs = 1;
        this.allowableLedgerLines = 0;
        this.allowableClefs = ['treble','bass'];
        this.allowableAccidentals = [0, 1, -1];
        this.allowableDirections = ['ascending', 'descending'];
        this.minSharps = -3;
        this.maxSharps = 3;
        this.allowableScales = ['major', 'natural', 'harmonic', 'melodic'];
        this.allowableScalesDescending = ['major', 'natural', 'harmonic'];
        this.usedKeySignatures = [];
        
        this.title = "Scale Writing";
        this.instructions = "<p>" +
            "Write one octave of the indicated scale in the boxes below. Use <b>#</b> and <b>b</b> " +
            "for sharp and flat.  You may write in uppercase or lowercase.  Place a space " +
            "after each note. The first note is given. End by including the initial note an octave higher. " +
            "When you submit the exercise, you will hear the scale you have written." +
            "</p>" + 
            "<p><b>Suggestion</b>: begin by writing the notes of the scale as naturals then cursor back " + 
            "and add in # and b in a second step.  Use the keyboard above to help figure out the pattern " +
            "of whole steps needed for the scale.</p>"
            ;
        this.lastPs = 0.0;
        this.numNotes = 7;
        this.autoBeam = true;
        this.niceScaleNames = {
                'ascending': {
                    'major': 'Major',
                    'natural': 'Natural minor',
                    'harmonic': 'Harmonic minor collection',
                    'melodic': 'Melodic minor'
                },
                'descending': {
                    'major': 'Major',
                    'natural': 'Melodic or natural minor',
                    'harmonic': 'Harmonic minor collection'
                }
        };
        
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