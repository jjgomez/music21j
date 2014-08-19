/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/misc -- miscellaneous routines.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['music21','loadMIDI', 'jquery'], function(music21, MIDI, $) {
	var misc = {};
	misc.playMotto = function (MIDI) {
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
	};
	
	misc.addKeyboard = function(where, startDNN, endDNN) {    	    
	    if (startDNN === undefined) {
	        startDNN = 18;
	    }
	    if (endDNN === undefined) {
	        endDNN = 39;
	    }
	    
	    var keyboardNewDiv = $('<div/>');	    
	    var k = new music21.keyboard.Keyboard();
	    k.appendKeyboard(keyboardNewDiv, startDNN, endDNN, {hideable: true});
	    k.markMiddleC();
	    
	    misc.addScrollFixed(keyboardNewDiv, where);	    
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
	    };
	    music21.common.merge(params, options);
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
        for (var i = 0; i < streamLength; i++) {
            var n = sFlat.get(i);
            var setLyricText = returnVal[i] || "";
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
	
	// end of define
	if (typeof(m21theory) != "undefined") {
		m21theory.misc = misc;
	}		
	return misc;
});