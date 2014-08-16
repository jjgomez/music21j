define("m21theory/tests/keySignature", 
        ["m21theory/section", "m21theory/random", "m21theory/question", 'music21/key'], 
        function (section, random, question, key) {
    var KSQuestion = function (handler, index) {
        question.Question.call(this, handler, index);   
    };
    KSQuestion.prototype = new question.Question();
    KSQuestion.prototype.constructor = KSQuestion;

    KSQuestion.prototype.render = function () {
        var s = new music21.stream.Stream();
        s.clef = new music21.clef.Clef( random.choice(['treble', 'bass']));
        var ks = this.section.getKeySignature();        
        s.keySignature = ks;
        
        var tonicName;
        if (this.section.mode == 'minor') {
            tonicName = ks.minorName();
            tonicName = tonicName.toLowerCase();
        } else {
            tonicName = ks.majorName();
        }
        tonicName = tonicName.replace(/\-/g, "b");
        var nc = s.createCanvas();
        var $questionDiv = $("<div style='width: 180px; float: left; padding-bottom: 20px'></div>");
        $questionDiv.append(nc);
        this.$questionDiv = $questionDiv;
        
        if (this.isPractice) {
            $questionDiv.append( $("<div style='padding-left: 20px; position: relative; top: 0px'>" + 
                    tonicName + "</div>") );
        } else {
            this.storedAnswer = tonicName;
            this.$inputBox = $("<input type='text' size='5' class='unanswered'/>")
                             .change( this.checkTrigger )
                             ;
            $questionDiv.append( $("<div style='padding-left: 15px; position: relative; top: 0px'/>")
                             .append(this.$inputBox) );
        }
        return $questionDiv;
    };
    
	var ThisTest = function () {
		section.Generic.call(this);
		this.questionClass = KSQuestion;
		
		this.assignmentId = 'keySignatures';
		this.totalQs = 16;
		this.minSharps = -6;
		this.maxSharps = 6;
		this.practiceQs = 2;
		this.mode = 'major';
		
		this.title = "Major KeySignature Test";
		this.instructions = "<p>Identify the following major keys by their key signatures. " +
			'Use <b>"#"</b> for sharps and lowercase <b>"b"</b> for flat, but write the key name ' +
			'in <b>CAPITAL</b> letters (why? when we get to minor, the convention is lowercase).' +
			"</p>";

		this.usedKeySignatures = [];
	};

	ThisTest.prototype = new section.Generic();
	ThisTest.prototype.constructor = ThisTest;

	ThisTest.prototype.getKeySignature = function () {
        if (this.usedKeySignatures.length == (this.maxSharps - this.minSharps)) {
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
        var ks = new key.KeySignature(keySignatureSharps);
        return ks;
	};
	
	return ThisTest;
});