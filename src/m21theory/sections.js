/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/tests -- load all tests.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

var knownSectionTypes = ['interval','chordCreation','chordIdentification','firstSpecies','keySignature',
                  'noteIdentification','scaleEar','scaleMajorMinorWritten', 
                  'rhythmMatch', 'pulseIdentify', 'noteLength', 'doOnPaper', 'pitchEartraining'];

var knownSectionTypesPrefixed = [];
for (var i = 0; i < knownSectionTypes.length; i ++) {
	knownSectionTypesPrefixed.push("./sections/" + knownSectionTypes[i]);
}
var dependencies = ['require'].concat(knownSectionTypesPrefixed);

define(dependencies, function(require) {
	var sectionHandler = {};
	for (var i = 0; i < knownSectionTypes.length; i ++) {
		var sectionModuleName = knownSectionTypes[i];
		var sectionPrefixed = knownSectionTypesPrefixed[i];
		sectionHandler[sectionModuleName] = require(sectionPrefixed);
	}
	sectionHandler.get = function (sectionName) {
		// return a newly created object by test name...
		thisSection = sectionHandler[sectionName];
		return new thisSection();
	};
	
	// end of define
	if (typeof(m21theory) != "undefined") {
	    if (m21theory.sections === undefined) {
	        m21theory.sections = {};
	    }
		m21theory.sections.get = sectionHandler.get;
	}
	return sectionHandler;
});