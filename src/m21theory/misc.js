/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/misc -- miscellaneous routines.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['loadMIDI', 'jquery', './random', 
        'music21/common', 'music21/tinyNotation', 'music21/clef', 'music21/stream', 'music21/keyboard'], 
        function(MIDI, $, random, common, tinyNotation, clef, stream, keyboard) {
	var misc = {};
	misc.playMotto = function (MIDI, long) {
	    //return;
		var delay = 0; // play one note every quarter second
		var note = 65; // the MIDI note
		var velocity = 110; // how hard the note hits
		// play the note
		MIDI.noteOn(0, note, velocity - 50, delay);
		MIDI.noteOff(0, note, delay + 0.75);
		MIDI.noteOn(0, note + 6, velocity, delay + 0.4);
		MIDI.noteOff(0, note + 6, delay + 0.75 + 0.8);
		MIDI.noteOn(0, note + 4, velocity - 90, delay + 1.35);
		MIDI.noteOff(0, note + 4, delay + 0.75 + 1.35);
		if (long == true) {
	        MIDI.noteOn(0, note + 5, velocity - 50, delay + 2.0);
	        MIDI.noteOff(0, note + 5, delay + 1.25 + 2.0);		    
            MIDI.noteOn(0, note + 6, velocity - 25, delay + 2.5);
            MIDI.noteOff(0, note + 6, delay + 1.25 + 2.5);          
            MIDI.noteOn(0, note + 7, velocity, delay + 3.0);
            MIDI.noteOff(0, note + 7, delay + 2.25 + 3.0);          
            MIDI.noteOn(0, note + 12, velocity, delay + 4.0);
            MIDI.noteOff(0, note + 12, delay + 2.25 + 4.0);          
		}
	};
    misc.tnRhythmScore = function (chosenRhythm, chosenMeter, options) {
        var params = {
                noteValue: 'b',
                randomizeNotesAndRests: false,
        };
        common.merge(params, options);
        tn = "";
        if (chosenMeter !== undefined) {
            tn = chosenMeter + " " + tn;            
        }
        var values = chosenRhythm.split(/\s+/);
        lastNoteTied = true;
        for (var j = 0; j < values.length; j++) {
            var note = values[j];
            var nv = params.noteValue;
            if (note.match(/^[0-9]/) != null) {
                if (params.randomizeNotesAndRests && lastNoteTied == false) {
                    nv = random.choice([params.noteValue, 'r']);
                }
                note = nv + note; 
            }
            if (nv == 'r' && note.indexOf('~') != -1) {
                //strip ties from rests...                
                note = note.slice(0, note.indexOf('~'));
            }
            if (note.indexOf('~') != -1) {
                lastNoteTied = true;
            } else {
                lastNoteTied = false;
            }
            if (j < values.length - 1) {
                note += " ";
            }
            tn += note;
        }
        
        var tnStream = tinyNotation.TinyNotation(tn);           
        for (var j = 0; j < tnStream.length; j++ ) {
            tnStream.get(j).renderOptions.staffLines = 1;
            tnStream.get(j).get(0).volume = 85;
        }
        var tnStreamFlatNotes = tnStream.flat.notes;
        for (var j = 0; j < tnStreamFlatNotes.length; j++) {
            tnStreamFlatNotes.get(j).stemDirection = 'up';
        }
        
        tnStream.clef = new clef.PercussionClef();
        // for practice questions
        tnScore = new stream.Score();
        tnScore.renderOptions.scaleFactor.x = 0.9;
        tnScore.renderOptions.scaleFactor.y = 0.9;
        tnScore.append(tnStream);
        return tnScore;
    };

	misc.addKeyboard = function(where, startDNN, endDNN) {    	    
	    if (startDNN === undefined) {
	        startDNN = 18;
	    }
	    if (endDNN === undefined) {
	        endDNN = 39;
	    }
	    
	    var keyboardNewDiv = $('<div/>');	    
	    var k = new keyboard.Keyboard();
	    k.startPitch = startDNN;
	    k.endPitch = endDNN;
	    k.hideable = true;

	    k.appendKeyboard(keyboardNewDiv);
	    k.markMiddleC();
	    
	    misc.addScrollFixed(keyboardNewDiv, where);
	    return k;
	};
	
	/**
	 * Add a Div (newdiv) to Where (or document.body) such that when it scrolls off the page
	 * it becomes fixed at the top.
	 */
	misc.addedScrollFixedAlready = false;
	misc.addScrollFixed = function (newdiv, where) {
        if (where === undefined) {
            where = document.body;
        }
        if (where.jquery !== undefined) {
            where = $(where);
        }

	    newdiv.addClass('fixedScrollContent');
	    newdiv.css({
            position: 'static',
            'z-index': 9,
        });
        
        var groupingDiv = $('<div class="fixedScrollGroup"/>');
        groupingDiv.append(newdiv);
        // need to append early to get height below...
        where.append(groupingDiv);
                
        // the spacer div makes it so that when keyboard shifts to fixed there isn't a jump of the
        /// properties below to underneath the keyboard.
        var spacerDiv = $('<div class="fixedScrollSpacer" ' + 
                'style="height: ' + newdiv.height() + 'px; display: none"/>');
        
        groupingDiv.append(spacerDiv);

        if (!misc.addedScrollFixedAlready) {
            misc.addedScrollFixedAlready = true; // only add event once...
            
            $(window).scroll( function(unused_event) {
                var $window = $(this);
                $(".fixedScrollGroup").each( function() {
                    var $el = $(this).find(".fixedScrollContent");
                    var $spacer = $(this).find(".fixedScrollSpacer");
                    // make fixed...
                    if ($window.scrollTop() > $el.offset().top && 
                            $el.css('position') != 'fixed') {
                        $el.data("startOffsetTop", $el.offset().top);
                        $el.css({
                            'position': 'fixed', 
                            'top': '0px'
                        });
                        $spacer.css({'display': 'block'});            
                    }
                    // make scrolling
                    if ($window.scrollTop() < $el.data("startOffsetTop") && 
                            $el.css('position') == 'fixed') {
                        $el.css({
                            'position': 'static', 
                            'top': '0px'
                        });
                        $spacer.css({'display': 'none'});            
                    }
                });
                
            } );
            
            if ($.fn.attrchange !== undefined) {
                // make spacer height always the same..
                // http://meetselva.github.io/attrchange/ -- really great jQuery plugin...
                $(".fixedScrollContent").attrchange({
                   callback: function (e) {
                       var fss = $(this).siblings('.fixedScrollSpacer');
                       fss.css('height', $(this).css('height'));
                   },
                });
            }
            
            
        }    
	};
	
	
	misc.lyricsFromValue = function (val, s, options) {
	    var params = {
	        useIntervals: false,
	        separator: /\s+/,
	        convertFlats: true,
	        convertSharps: true,
	        convertNaturals: true,
	        skipTies: false,
	    };
	    common.merge(params, options);
	    var returnVal;
	    if (typeof val == 'string') {
	        returnVal = val.split(params.separator);
	    } else if (val instanceof Array) {
	        returnVal = val;
	    } else if (typeof val == 'object' && val.jquery != undefined) {
	        returnVal = val.val().split(params.separator);
	    } else { // ??
	        console.log("misc.lyricsFromValue called on unknown val");
	        returnVal = val;
	    }
	    var sFlat = s.flat.notesAndRests;
        var streamLength = sFlat.length;
        var returnValDisplacement = 0;
        for (var i = 0; i < streamLength; i++) {
            var n = sFlat.get(i);
            if (params.skipTies && n.tie && n.tie.type != 'start') {
                returnValDisplacement -= 1;
                continue;
            }
            var setLyricText = returnVal[i + returnValDisplacement] || "";
            if (params.convertSharps) {
                setLyricText = setLyricText.replace(/\#/g, '♯');
            }
            if (params.convertFlats) {
                setLyricText = setLyricText.replace(/([a-zA-Z])b/g, '$1♭');
            }
            if (params.convertNaturals) {
                setLyricText = setLyricText.replace(/([a-zA-Z])n/g, '$1♮');
            }
            n.lyric = setLyricText;
        }	    
	    return returnVal;
	};
	
	misc.fractionStringFromFloat = function (floatIn) {
	    // ridiculous little function -- take a float like 0.33333 or 0.25 and convert it to
	    // a string like 1/3 or 1/4; ridiculous, because it's really limited right now...
	    // returns a string of a float if it can't convert...
	    if (Math.abs(floatIn - Math.round(floatIn)) < 0.001) {
	        return Math.round(floatIn).toString();
	    }
	    
	    var denoms = [2, 3, 4, 5, 6, 7, 8, 16, 32, 64];
	    for (var i = 0; i < denoms.length; i++) {
	        var d = denoms[i];
	        if (Math.abs(floatIn * d - Math.round(floatIn * d)) < 0.001) {
	            return Math.round(floatIn * d) + "/" + d;  
	        }
	    }
	    
        var dqs = floatIn.toString();
        if (dqs.length >= 5) {
            // tuplets, etc.
            dqs = floatIn.toFixed(3);
        }
        return dqs;
	};
	
	misc.niceTimestamp = function (ts, include_seconds) {
	    var now;
	    if (ts === undefined) {
	        now = Date.now();
	    } if (ts.getMonth === undefined) {
	        if (ts < 10000000000) {
	            ts = ts * 1000; // seconds to milliseconds
	        }
	        now = new Date(ts);
	    } else {
	        now = ts;
	    }
	    // Create an array with the current month, day and time
	    var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
	   
	    // Create an array with the current hour, minute and second
	    
	    var time = [ now.getHours(), now.getMinutes()];
	    if (include_seconds == true) {
	        time.push( now.getSeconds() );
	    }
	    // Determine AM or PM suffix based on the hour
	    var suffix = ( time[0] < 12 ) ? "AM" : "PM";
	   
	    // Convert hour from military time
	    time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
	   
	    // If hour is 0, set it to 12
	    time[0] = time[0] || 12;
	   
	    // If seconds and minutes are less than 10, add a zero
	    for ( var i = 1; i < time.length; i++ ) {
	      if ( time[i] < 10 ) {
	        time[i] = "0" + time[i];
	      }
	    }
	   
	    // Return the formatted string
	    return date.join("/") + " " + time.join(":") + " " + suffix;
	};
	// end of define
	if (typeof(m21theory) != "undefined") {
		m21theory.misc = misc;
	}		
	return misc;
});