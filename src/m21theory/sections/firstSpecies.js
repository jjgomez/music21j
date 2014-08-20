define("m21theory/sections/firstSpecies", 
        ["m21theory/section", "m21theory/random", 'm21theory/question', 'm21theory/feedback'], 
        function (section, random, question, feedback) {
    
    var FirstQ = function (handler, index) {
        question.Question.call(this, handler, index);  
        this.ignoreMistakes = true;
        this.correctCallback = function () { 
            feedback.alert("Great Work! It's all set; listen to what you've done, then click Submit.", 'ok');
            this.stream.playStream(); 
        };
    };
    FirstQ.prototype = new question.Question();
    FirstQ.prototype.constructor = FirstQ;
    
    FirstQ.prototype.noteChanged = (function (clickedDiatonicNoteNum, foundNote, canvas) {          
        if (foundNote != undefined) {
            var n = foundNote;
            var part = n.activeSite.activeSite;
            var score = part.activeSite;
            if (part == score.get(1)) {
                this.testHandler.showAlert(
                        "No...you can't alter the given line.  That'd be too easy. :-)", 'alert');
                return;
            }
            n.unchanged = false;
            p = new music21.pitch.Pitch("C");
            p.diatonicNoteNum = clickedDiatonicNoteNum;
            var stepAccidental = score.keySignature.accidentalByStep(p.step);
            if (stepAccidental == undefined) {
                stepAccidental = new music21.pitch.Accidental(0);
            }
            p.accidental = stepAccidental;
            n.pitch = p;
            n.stemDirection = undefined;
            //this.clef.setStemDirection(n);
            score.activeNote = n;
            score.activeCanvas = canvas;
            score.redrawCanvas(canvas);
            if (score.changedCallbackFunction != undefined) {
                score.changedCallbackFunction();
            }
        } else {
            if (music21.debug) {
                console.log("No note found at: " + xPx);        
            }
        }

    }).bind(this);

    FirstQ.prototype.render = function () {
        var s = this.section.getNewStream();
        s.noteChanged = this.noteChanged;
        s.renderOptions.events['click'] = s.canvasChangerFunction;
        s.changedCallbackFunction = this.checkTrigger;

        this.stream = s;
        var width = $(this.section.bank.testBankSelector).width() || 700;
        width = width.toString() + "px";
        console.log(width);
        var niceDiv = $("<div/>").css({
            'position':'relative',
            'width': width,
            'float': 'left',
            'padding-bottom': '20px',
            });
        var buttonDiv = s.getPlayToolbar();
        niceDiv.append(buttonDiv);
        s.appendNewCanvas(niceDiv); //, width);        
        this.$questionDiv = niceDiv;
        return niceDiv;
    };
    FirstQ.prototype.changeStatusClass = function (unused) {
        
    };
    FirstQ.prototype.checkAnswer = function (unused_a, unused_b) {
        var s = this.stream;
        var activeCanvas = s.activeCanvas;
        var existingAlerts = this.section.testSectionDiv.find('#alertDiv');
        if (existingAlerts.length > 0) {
            $(existingAlerts[0]).remove();
        }
        var studentLine = s.get(0).flat.elements;
        var cf = s.get(1).flat.elements;
        var totalUnanswered = 0;
        var niceNames = {
                1: "unison or octave",
                2: "second",
                3: "third",
                4: "fourth",
                5: "fifth",
                6: "sixth",
                7: "seventh",
        };
        var allowableIntervalStr = "thirds, perfect fifths, sixths, or perfect octaves/unisons (or octave equivalents).";
        var prevNote = undefined;
        var prevInt = undefined;
        var prevPrevInt = undefined;
        var unansweredNumbers = [];
        var studentPartObj = s.get(0);
        for (var i = 0; i < studentPartObj.length; i++) {
            var measureNumber = i + 1;
            var studentNote = studentLine[i];
            var cfNote = cf[i];
            var genericInterval = 1 + (studentNote.pitch.diatonicNoteNum - cfNote.pitch.diatonicNoteNum) % 7;
            if (studentNote.unchanged) {
                totalUnanswered ++;
                unansweredNumbers.push(measureNumber);
                prevPrevInt = prevInt;
                prevInt = genericInterval;
                prevNote = studentNote;
                continue;
            }
            if (genericInterval <= 0) {
                feedback.alert("Your lines cross in measure " + measureNumber + "; keep your line above the given line.");              
                return false;
            }
            if (genericInterval != 1 && genericInterval != 3 && genericInterval != 5 && genericInterval != 6) {
                feedback.alert("You have a " + niceNames[genericInterval] + " in measure " + measureNumber +
                        ".  Acceptable intervals are " + allowableIntervalStr);
                return false;
            }
            if (genericInterval == 5) {
                var semitones = (studentNote.pitch.ps - cfNote.pitch.ps) % 12;
                if (semitones == 6) {
                    feedback.alert("Not all fifths are perfect fifths! In measure " +
                            measureNumber + " you wrote a diminished fifth. Listen to " +
                            " what you wrote and hit Play to listen to it in context before " +
                            " fixing it."
                    );
                    var newS = new music21.stream.Stream();
                    var oldCFNoteactiveSite = cfNote.activeSite; 
                    var oldStudentNoteactiveSite = studentNote.activeSite;
                    newS.append(cfNote);
                    newS.append(studentNote);
                    newS.playStream();
                    cfNote.activeSite = oldCFNoteactiveSite; 
                    studentNote.activeSite = oldStudentNoteactiveSite;
                    return false;
                }
            }
            if (prevInt != undefined) {
                var prevMeasure = measureNumber - 1;
                if (prevNote.pitch.ps == studentNote.pitch.ps) {
                    feedback.alert("Remember, you cannot repeat notes, like you do between measures " +
                            prevMeasure + " and " + measureNumber);
                    return false;
                }
                if (prevInt == 1 && genericInterval == 1) {
                    feedback.alert("You have parallel unisons or octaves between measures " + prevMeasure + " and " +
                            measureNumber);
                    return false;
                }
                if (Math.abs(studentNote.pitch.diatonicNoteNum - prevNote.pitch.diatonicNoteNum) >= 4) {
                    feedback.alert("Between measures " + prevMeasure + " and " +
                            measureNumber + " you have a leap greater than a Perfect 4th.");
                    return false;
                }
                if (prevPrevInt != undefined) {
                    if (prevPrevInt == prevInt && prevInt == genericInterval) {
                        feedback.alert(
                                "In measures " + (prevMeasure - 1) + "-" + measureNumber + 
                                " you have used three " + niceNames[genericInterval] + "s in a row. " +
                                "The limit is two in a row."
                        );
                        return false;
                    }   
                }
            }
            if (measureNumber > 4) {
                var numSkips = 0;
                for (var j = measureNumber - 4; j < measureNumber; j++) {
                    if (Math.abs(
                            studentLine[j-1].pitch.diatonicNoteNum - 
                            studentLine[j].pitch.diatonicNoteNum
                    ) >= 2) {
                        numSkips++;
                    }
                }
                if (numSkips > 2) {
                    feedback.alert("You have " + numSkips + " skips " + 
                            "between measures " + (measureNumber - 4) + " and " +
                            measureNumber + ". The maximum is 2 per 4 melodic intervals."
                    );
                    return false;
                }
            }
            prevPrevInt = prevInt;
            prevInt = genericInterval;
            prevNote = studentNote;
        }
        s.redrawCanvas(activeCanvas);
        if (totalUnanswered > 5) {
            feedback.alert(":-)", 'update');
            return false;
        } else if (totalUnanswered > 0) {
            feedback.alert("Almost there... you need to give an answer for measures " +
                    unansweredNumbers.join(', ') + ". (If the note is right, just click it again).",
                    'update');
            return false;
        } else {
            return true;
        }
    };

    
    
	var ThisSection = function () {
		/*
		 * First species counterpoint in a tonal context.
		 */		
		section.Generic.call(this);
		this.questionClass = FirstQ;
		
		this.id = 'firstSpeciesTest';
		this.totalQs = 1;
		this.practiceQs = 0;
		this.title = "Counterpoint (Two part) in First Species";
		this.instructions = 'Create a two part counterpoint by altering one line to fit the other. ' +
			'Hit play to get an update on your work. Your piece will play automatically when it\'s right! ' +
			'<b>To be done and submitted THREE TIMES with different given lines.</b><br/><br/>' +
			'Remember the 21m.051 rules:<ul>' +
			'<li>Each note must be a Unison, m3 or M3, P5, m6 or M6, P8 above (or an octave + those intervals)</li>'+
			'<li>No more than two 3rds (major or minor), 6ths (major or minor), or P5s in a row (better, no 2 P5s in a row).</li>' +
			'<li>No Parallel Octaves/Unisons</li>' +
			'<li>Do not repeat notes.</li>' +
			'<li>Do not make melodic leaps larger than a melodic perfect 4th.</li>' +
			'<li>No more than two leaps per 4 melodic intervals.</li>' +
			'<li>No accidentals (the system won\'t let you).</li>' +
			'<li>Watch out for the tritone (fifth that is not perfect).</li>' +
			'</ul>' +
			'Beyond all those rules, try to make the most beautiful, singable line you can.'
			;
		this.minSharps = -3;
		this.maxSharps = 2;
		this.cfs = ["C1 D E D F E G A G E F D E D C",
		            "G1 A F G c B A F D E G F D C",
		            "C1 E D F E F D E AA BB C E D C BB C",
		            "c1 B A E F F G A G E D C",
		            "c1 c B A G A G F E F E G A B c"];
		this.usedCfs = [];
		
		this.getNewStream = function () {
            var thisSharps = random.randint(this.minSharps, this.maxSharps);
            var thisCfNum = undefined;
            var thisCf = undefined;
            while (thisCfNum === undefined) {
                thisCfNum = random.randint(0, this.cfs.length - 1);
                thisCf = this.cfs[thisCfNum];
                for (var i = 0; i < this.usedCfs.length; i++) {
                    if (this.usedCfs[i] == thisCfNum) {
                        thisCfNum = undefined;
                    }
                }
                
            }
            this.usedCfs.push(thisCfNum);
            
            var s = new music21.stream.Score();
            s.renderOptions.scaleFactor = {x: .9, y: .9};
            var ks = new music21.key.KeySignature(thisSharps);
            var pStudent = new music21.stream.Part();
            var pCF = new music21.stream.Part();
            var tnCF = music21.tinyNotation.TinyNotation(thisCf);
                        
            $.each(tnCF.flat.elements, function(j, el) { 
                var mStudent = new music21.stream.Measure();
                if (j != 0) {
                    mStudent.renderOptions.showMeasureNumber = true;
                    mStudent.renderOptions.measureIndex = j;
                }
                
                var studentNote = new music21.note.Note('C4');
                studentNote.duration.type = 'whole';
                studentNote.pitch = ks.transposePitchFromC(studentNote.pitch);
                studentNote.unchanged = true;
                mStudent.append(studentNote);
                
                pStudent.append(mStudent);
                var mCF = new music21.stream.Measure();
                el.pitch = ks.transposePitchFromC(el.pitch);
                mCF.append(el);
                pCF.append(mCF);
            });
            pStudent.clef = new music21.clef.Clef('treble');
            pCF.clef = new music21.clef.Clef('bass');
            s.append(pStudent);
            s.append(pCF);
            s.timeSignature = '4/4';
            s.keySignature = ks;
            s.tempo = 200;
            s.maxSystemWidth = 500;
            return s;  
		};
		
	};
	ThisSection.prototype = new section.Generic();
	ThisSection.prototype.constructor = ThisSection;
	return ThisSection;
});