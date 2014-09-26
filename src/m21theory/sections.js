/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/tests -- load all tests.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
var knownSectionTypes = ['intervalTraining','chordCreation','chordIdentification','firstSpecies','keySignature',
                  'noteIdentification','scaleEar','scaleMajorMinorWritten', 
                  'rhythmMatch', 'pulseIdentify', 'noteLength', 'doOnPaper', 'pitchEartraining',
                  'scaleWriting'];
var knownSectionTypesPrefixed = [];
for (var i = 0; i < knownSectionTypes.length; i ++) {
    knownSectionTypesPrefixed.push("./sections/" + knownSectionTypes[i]);
}

var dependencies = ['require'];
dependencies.push.apply(dependencies, knownSectionTypesPrefixed);

define(dependencies, function (require) {
	var sections = {};
    var sectionVariables = Array.prototype.slice.call(arguments, 1);
	for (var i = 0; i < knownSectionTypes.length; i++) {
	    var kst = knownSectionTypes[i];
	    var sv = sectionVariables[i];
	    sections[kst] = sv;
	}
	
	sections.get = function (sectionName) {	    
		// return a newly created object by test name...
	    if (sections[sectionName] === undefined) {	        
	        var sectionPrefixed = './sections/' + sectionName;
	        var sectionObj = require(sectionPrefixed);
	        sections[sectionName] = sectionObj;
	    } else {
	        //console.log('already loaded', sectionName);
	    }
	    thisSection = sections[sectionName];
	    return new thisSection();
	};
	
	// end of define
	if (typeof(m21theory) != "undefined") {
	    m21theory.sections = sections;
	}
	return sections;
});