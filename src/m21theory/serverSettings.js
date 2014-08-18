/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/serverSettings -- user settings in one place
 * 
 * Copyright (c) 2014, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['jquery'], function($) {
    var s = {}; 
    s.checkLogin = '/server/cgi-bin/check_login.cgi';
    s.testResponseURL = "http://ciconia.mit.edu/m21j/testSectionResponse2.cgi";

    serverSettings = s;
    
    // end of define
    if (typeof(m21theory) != "undefined") {
        m21theory.serverSettings = serverSettings;
    }       
    return serverSettings;
});