/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/userData -- keep track of users
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['jquery', './feedback', './serverSettings', './userData'], 
        function($, feedback, serverSettings, userData) {
    // Student Name Routines 
    // calling m21theory.fillNameDiv() will 
    // append a name box to a div called "#studentDataDiv"

    var grades = {};
    
    grades.getByType = function (type) {
       serverSettings.makeAjax({bankType: type},
               {url: serverSettings.getGradesByType, }       
       );  
    };
     
    // end of define
    if (typeof(m21theory) != "undefined") {
        m21theory.grades = grades;
    }       
    return grades;
});