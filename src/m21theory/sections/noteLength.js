define("m21theory/sections/noteLength", 
        ["m21theory/section", "m21theory/random", "m21theory/question", "m21theory/feedback", 'm21theory/misc'], 
        function (section, random, question, feedback, misc) {
    var NL = function (handler, index) {
        question.Question.call(this, handler, index); 
    };
    
        
    NL.prototype = new question.Question();
    NL.prototype.constructor = NL;

    NL.prototype.render = function () {
        var chosenMeter = random.choice(this.section.allowableMeters);
        if (this.section.usedRhythms[chosenMeter] == undefined) {
            this.section.usedRhythms[chosenMeter] = [];
        }
        var chosenRhythm = random.choiceWithoutDuplicates(
            this.section.possibleRhythms[chosenMeter],
            this.section.usedRhythms[chosenMeter]                
        );
        //console.log(chosenRhythm);
        var tnScore = m21theory.misc.tnRhythmScore(chosenRhythm, chosenMeter, {
            noteValue: this.section.displayTNName,
            randomizeNotesAndRests: this.section.randomizeNotesAndRests,
        });
        tnScore.autoBeam = this.section.autoBeam;
        tnScore.renderOptions.maxSystemWidth = 400;
        tnScore.tempo = this.section.tempo;
        
        var streamAnswer = [];
        var tnsfn = tnScore.flat.notesAndRests;
        var lastTiedI = 0;
        for (var i = 0; i < tnsfn.length; i++) {
            var n = tnsfn.get(i);
            if (n.tie !== undefined && n.tie.type == 'start') {
                lastTiedI = streamAnswer.length;
                //console.log('tie starting at ', i, this.index);
                streamAnswer.push(n.quarterLength);
            } else if (n.tie !== undefined) {
                //console.log('tie at ', lastTiedI, ' getting additional length from ', i, this.index);
                streamAnswer[lastTiedI] = streamAnswer[lastTiedI] + n.quarterLength;
            } else {
                streamAnswer.push(n.quarterLength);                
            }
        }
        this.storedAnswer = this.normalizeAnswer(streamAnswer);
        //console.log(streamAnswer);
        //console.log(this.storedAnswer);
        var nc = tnScore.createCanvas();
        this.stream = tnScore;
        this.canvas = nc;        
        var $questionDiv = $("<div style='width: 100%; padding-bottom: 20px'></div>");
        $questionDiv.append(nc);

        if (this.isPractice) {
            misc.lyricsFromValue(this.storedAnswer, this.stream, {skipTies: true});
            this.canvas = this.stream.replaceCanvas(this.canvas);
            $questionDiv.append( $("<div style='padding-left: 10px; position: relative; top: 10px'>" +
                    "Example: <b>" + 
                    this.storedAnswer.join(' &nbsp; ') + 
                    "</b></div>") );
        } else {
            var bindLyrics = (function () { this.lyricsChanged(); } ).bind(this);
            this.$inputBox = $("<input type='text' size='24' class='unanswered'/>")
                             .change( this.checkTrigger )
                             .on('input propertychange paste', bindLyrics );
            $questionDiv.append( $("<div style='padding-left: 70px; position: relative; top: 10px'/>")
                             .append(this.$inputBox) );
            
        }        
        this.$questionDiv = $questionDiv;
        return $questionDiv;
    };
    
    NL.prototype.getStudentAnswer = function () {
        var sa = question.Question.prototype.getStudentAnswer.call(this);
        var saArray = this.normalizeAnswer(sa);
        return saArray;
    };    
    NL.prototype.checkAnswer = function (studentAnswer, storedAnswer) {
        if (studentAnswer.length != storedAnswer.length) {
            return false;
        }
        for (var i = 0; i < studentAnswer.length; i++) {
            if (studentAnswer[i] != storedAnswer[i]) {
                return false;
            }
        }
        return true;
    };
    
    NL.prototype.normalizeAnswer = function (val) {
        var valArr;
        if (val instanceof Array) {
            valArr = val;
        } else {
            valArr = val.split(/\s+/);            
        }
        var outValues = [];
        for (var i = 0; i < valArr.length; i++) {
            var v = valArr[i];       
            if (typeof v != 'string' && v !== undefined) {
                v = v.toString();
            }
            if (v === undefined || v == "") {
                outValues.push("");
                continue;
            }
            var slashIndex = v.indexOf('/');
            if (slashIndex == v.length - 1) {
                v = v.slice(0, slashIndex);
                outValues.push(misc.fractionStringFromFloat(parseFloat(v)));                
            } else if (slashIndex != -1) {
                var num = v.slice(0, slashIndex);
                var den = v.slice(slashIndex + 1);
                if (den == '0' || den === undefined || isNaN(parseInt(den))) {
                    outValues.push('∞');
                } else if (num == '0' || num == undefined || isNaN(parseInt(num))) {
                    outValues.push('?');
                } else {
                    outValues.push(misc.fractionStringFromFloat(parseInt(num) / parseInt(den)));
                }
            } else {
                outValues.push(misc.fractionStringFromFloat(parseFloat(v)));
            }
        }
        return outValues;
    };
    NL.prototype.lyricsChanged = function () {
        var outValues = this.normalizeAnswer(this.$inputBox.val().replace(/^\s+|\s+$/g,''));
        misc.lyricsFromValue(outValues, this.stream, {skipTies: true});
        this.canvas = this.stream.replaceCanvas(this.canvas);
        //console.log(lyricsSplit);
    };
    
    var ThisSection = function () {
        section.Generic.call(this);
        this.questionClass = NL;

        this.id = 'noteLength';
        this.displayTNName = 'b';
        this.randomizeNotesAndRests = false;
        this.autoBeam = false;
        
        this.title = 'Note Lengths';
        this.instructions = '<p>Give the length in number of quarter notes ' +
                            'for each of the following notes. If a note follows a <b>tie</b>, skip it, ' +
                            'but add its duration to the last untied note. You may use fractions or decimals' +
                            '</p>';
        this.totalQs = 4;
        this.practiceQs = 1;
        this.tempo = 80;
        this.usedRhythms = [];
        this.allowableMeters = ['4/4'];
        this.possibleRhythms = {
            '4/4': [
                '8 4 8 2 8~ 8~ 8~ 8 2',
                '2. 16 16 16 16 4 4 32 32 32 32 8 4',
                '1 2 16 4 8.',
                '16. 2.. 32 2. 4',
                '2~ 4 4 4~ 2 4',
                '2. 4 4. 8~ 2',
                '2 2 2. 4 2.. 8 2... 16 1',
                '8 16 16 4 16 8 16 4 1',
            ],
        };
    };
    ThisSection.prototype = new section.Generic();
    ThisSection.prototype.constructor = ThisSection;
    
    return ThisSection;

});