define("m21theory/sections/scaleEar", ["m21theory/section", "m21theory/random", 'm21theory/question'], 
        function (section, random, question) {
    
    var ScaleQuestion = function (handler, index) {
        question.Question.call(this, handler, index);   
    };
    ScaleQuestion.prototype = new question.Question();
    ScaleQuestion.prototype.constructor = ScaleQuestion;
    ScaleQuestion.prototype.postAnswerRestore = function () {
        var $radio = this.$inputBox.find("input[value='" + this.studentAnswer + "']");
        $radio.prop("checked", true);
    };
    
    ScaleQuestion.prototype.render = function () {
        i = this.index;
        var s = new music21.stream.Stream();
        s.tempo = 60;
        if (random.randint(0,1)) {
            s.clef = new music21.clef.Clef('treble');
        } else {
            s.clef = new music21.clef.Clef('bass');
        }
        var ks = this.section.getKeySignature();
        var tonic = ks.majorName();
        var tonicPitch = new music21.pitch.Pitch(tonic);
        if (s.clef.name == 'bass') {
            if (tonicPitch.step == 'B' || tonicPitch.step == 'A' || tonicPitch.step == 'G') {
                tonicPitch.octave = 2;
            } else {
                tonicPitch.octave = 3;      
            }
        }
        var scalePitches = music21.scale.ScaleSimpleMajor(tonicPitch); // no new needed yet...
        for (var j = 0; j < scalePitches.length; j ++ ) {
            var n = new music21.note.Note();
            //n.duration.quarterLength = 0.5;
            n.pitch = scalePitches[j];
            n.stemDirection = 'noStem';
            s.append(n);
        }
        s.autoBeam = false;
        var nc = s.createCanvas(320);
        //console.log(s.renderOptions.events['click']);
        var $questionDiv = $("<div style='width: 330px; float: left; padding-bottom: 20px'></div>");
        $questionDiv.append(nc);
        
        var doIt = random.randint(0,10);

        // always make it so that the first two are normal, screwy
        if (i == 0) { doIt = 10; }
        else if (i == 1) { doIt = 0; } 
        var whichNote = 0;
        if (doIt < 10 * this.section.screwyFraction ) {
            // screw a note...
            whichNote = random.randint(2,8);
            var thisDirection = 0;
            if (whichNote == 3 || whichNote == 7) {
                // only down...
                thisDirection = -1;
            } else if (whichNote == 4 || whichNote == 8) {
                // only up...
                thisDirection = 1;
            } else {
                // down 2/3 of the time
                thisDirection = random.randint(-1,1);
                if (thisDirection == 0) { 
                    thisDirection = -1;
                }
            }
            var tempPitch = s.get(whichNote - 1).pitch;
            //console.log(whichNote + " " + tempPitch.name + " ");
            if (tempPitch.accidental == undefined) {
                tempPitch.accidental = new music21.pitch.Accidental(thisDirection);
            } else {
                tempPitch.accidental.set( parseInt (tempPitch.accidental.alter + thisDirection) );
            }
            //console.log(whichNote + " " + tempPitch.name + " ");
            
        } else {
            whichNote = 0;
        }
        this.storedAnswer = whichNote.toString();
        
                        
        if (this.isPractice) {
            var niceChoice = whichNote.toString();
            if (whichNote == 0) {
                niceChoice = 'No error';
            }

            $questionDiv.append( $("<div style='padding-left: 80px; position: relative; top: 0px'>Example: <b>" + niceChoice + "</b></div>") );
        } else {
           var inputBox = $('<div/>').css('position', 'relative');
           for (var j = 0; j < 9; j++) {
                if (j == 1) { continue; }
                var niceChoice = j.toString();
                if (j == 0) {
                    niceChoice = "No error";
                }
                var fieldInput =  $('<label><input type="radio" name="' + 
                            this.id + this.index.toString() + '" value="' + j.toString() + '" /> ' + 
                            niceChoice + '&nbsp;</label>');
                fieldInput.change( this.checkTrigger );
                inputBox.append(fieldInput);
            }
            this.$inputBox = inputBox;
            $questionDiv.append( $("<div style='padding-left: 10px; position: relative; top: 0px'/>")
                             .append(this.$inputBox) );
        }
        this.$questionDiv = $questionDiv;
        return $questionDiv;
    };

    
    var ThisSection = function () {
        section.Generic.call(this);
        this.id = 'scaleEar';
        this.questionClass = ScaleQuestion;

        this.totalQs = 16;
        this.practiceQs = 2;
        this.screwyFraction = .6;
        this.minSharps = -6;
        this.maxSharps = 6;

        
        this.title = "Hearing Major Scales Test";
        this.instructions = "<p>" +
            "Each of the following questions presents a properly written major " +
            "scale in a given key. However! approximately half of the scales will " +
            "not sound like major scales when they are played back because one scale " +
            "degree is off by a half step. Identify the incorrect scale degree with a " +
            "number from <b>'2' to '8'</b>. Or if there is no problem, enter <b>'0'</b>.</p>" +
            "<p><b>Click the scales to hear them.</b> They do not play automatically." +
            "</p>";
        this.usedKeySignatures = [];        
        this.getKeySignature = function () {            
            if (this.usedKeySignatures.length == 12) {
                // could be 13; but might as well, let one be unused...
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
            var ks = new music21.key.KeySignature(keySignatureSharps);
            return ks;            
        };
        
    };
    
    ThisSection.prototype = new section.Generic();
    ThisSection.prototype.constructor = ThisSection;
    
    return ThisSection;
});