/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/random -- a variety of reproduceable pseudoRandom generators.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['music21/common'], function(common) {
	var random = {};
	// ---------------
	// Random number routines...

	/*  randomGeneratorType -- how to generate random numbers.

	    Javascript does not have a random number seed, so if we
	    want pseudo-pseudo random numbers, we take the trailing
	    values of sine(x) where x is an integer.
	    
	    All m21theory calls MUST use m21theory.random.random() to
	    ensure that they are deterministic based on the random seed.

	    valid values are:
	        'random' -- use Math.random to seed the sine generator;
	        'fixed'  -- use a sine generator beginning at a fixed index.
	                    gives the same numbers every time.		    
		    'day'    -- use a sine generator beginning at an index
		                tied to the current day of the month (so everyone taking a
		                quiz on the same day gets the same Qs, but
		                people taking makeups, etc. get different ones).
		                will not repeat the next month, year, etc.
            'year'   -- same as day, but tied to the year.
		    'semester' -- same as year, but tied to the half year (Jan - June; July-Dec).
		    'trimester' -- same as year, but tied to the 1/3 year (Jan - Apr; May-Aug; Sep.-Dec).
            'hour'   -- same as day, but tied to the hour.
            'month'  -- same as day, but tied to the month.
            'minute' -- same as day, but tied to the minute. (for testing)
	*/ 

	random.generatorType = 'random';
	random.index = 1;
	random.seed = 1;
	random.getRandomSeed = function () {
	    return Math.floor(Math.random() * 65535);
	};
	random.setSeedFromGeneratorType = function (generatorType) {
	    if (generatorType == undefined) {
	        var urlSeed = common.urlParam('seed');
	        if (urlSeed !== undefined && urlSeed !== null && urlSeed != "") {
	            random.seed = parseInt(urlSeed);
	            if (isNaN(random.seed)) {
	                generatorType = random.generatorType;
	            } else {
	                generatorType = 'fixed';	                
	            }
	        } else {
	            generatorType = random.generatorType;	            
	        }
	    }
	    var d = new Date();
	    var seed = random.seed;
	    if (generatorType == 'random') {
	        seed = random.getRandomSeed();
	    } else if (generatorType == 'fixed') {
	        // do nothing -- seed needs to be set elsewhere.
	    } else if (generatorType == 'day') {
	        seed = d.getDate() * (d.getMonth() + 1) * d.getFullYear();
        } else if (generatorType == 'minute') {
            seed = d.getDate() * (d.getMonth() + 1) * d.getFullYear() * (d.getHours() + 1) * (d.getMinutes() + 1);        
	    } else if (generatorType == 'hour') {
            seed = d.getDate() * (d.getMonth() + 1) * d.getFullYear() * (d.getHours() + 1);            
        } else if (generatorType == 'month') {
            seed = (d.getMonth() + 1) * d.getFullYear();             
        } else if (generatorType == 'semester') {
            seed = (Math.floor(d.getMonth()/6) + 1) * d.getFullYear();                         
        } else if (generatorType == 'trimester') {
            seed = (Math.floor(d.getMonth()/4) + 1) * d.getFullYear();                        
        } else if (generatorType == 'year') {
            seed = d.getFullYear();            
        }
	    random.seed = seed;
	    random.index = 1 + seed;
	};
	
	random.random = function () {
		var randOut = parseFloat("." + Math.sin(random.index)
										.toString()
										.substr(5));		
		random.index += 1;
		return randOut;
	};

	// same format as python's random.randint() where low <= n <= high

	random.randint = function (low, high) {
		return Math.floor((random.random() * (high - low + 1)) + low);
	};

	random.choice = function (inList) {
		var inListLength = inList.length;
		if (inListLength == undefined) {
			throw("m21theory.random.choice: called without a list");
		} else {
			var choiceNum = random.randint(0, inListLength - 1);
			return inList[choiceNum];
		}
	};
	
	random.choiceWithoutDuplicates = function (inList, usedList) {
	    var thisChoice = undefined;
	    if (usedList.length >= inList.length) {
	        // fastest algorithm via:
	        // http://stackoverflow.com/questions/1232040/how-to-empty-an-array-in-javascript
	        while(usedList.length > 0) {            
	            usedList.pop();
	        }
	    }
	    var maxIterations = inList.length;
	    while (thisChoice === undefined && maxIterations > -2) {
            if (maxIterations == 0) {                
                // duplicates in inList causing impossibility to use them all...
                while(usedList.length > 0) {
                    usedList.pop();
                }   
            }
	        thisChoice = random.choice(inList);
	        if (usedList.indexOf(thisChoice) != -1) {
	            thisChoice = undefined;
	        }
	        maxIterations -= 1;
	    }
	    usedList.push(thisChoice);
	    return thisChoice;
	};

	//+ Jonas Raoni Soares Silva
	//@ http://jsfromhell.com/array/shuffle [v1.0]
	random.shuffle = function (o) { //v1.0
	    for(var j, x, i = o.length; i; j = Math.floor(random.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	    return o;
	};

	// end of define
	if (typeof(m21theory) != "undefined") {
		m21theory.random = random;
	}		
	return random;
});