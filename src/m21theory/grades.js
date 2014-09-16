/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/userData -- keep track of users
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['jquery', './feedback', './serverSettings', './userData', './random'], 
        function($, feedback, serverSettings, userData, random) {
    // Student Name Routines 
    // calling m21theory.fillNameDiv() will 
    // append a name box to a div called "#studentDataDiv"

    var grades = {};
    
    grades.getByType = function (type) {
        if (type === undefined) {
            type = 'all';
        }
        serverSettings.makeAjax(
               { bankType: type },
               { url: serverSettings.getGradesByType,
                 success: grades.displayJS }
        );  
    };
     
    grades.displayJS = function (js) {
        if (js.grades === undefined) {
            feedback.alert('Could not find grades for you!', 'alert');
        }
        for (var i = 0; i < js.grades.length; i++) {
            var thisBank = js.grades[i];
            grades.displayJSForBank(thisBank);
        }
        $("#noGradesSection").css('display', 'none');
        $("#gradesSection").css('display', 'block');                 
    };
    
    grades.displayJSForBank = function (thisBank) {
        var bankType = thisBank.type;
        if (bankType == 'cl' && thisBank.active == false) {
            return;
        }
        var $appendTo = $("#assign_" + bankType);
        if ($appendTo.length == 0) {
            return;
        }
        var $outerDiv = $("<div></div>").css('margin-bottom', '10px');
        var $newDiv = $("<span>" + thisBank.title + "</span>").css('font-weight', 'bold');
        if (thisBank.active == false) {
            $newDiv.css('text-decoration', 'line-through');
            $newDiv.css('font-weight', 'normal');
        }
        if (thisBank.xkeyWarn == 'TRUE') {
            $newDiv.append($("<span><img  alt='Xkey' src='../css/piano_icon14.jpg' style='padding: 0px 0px 0px 10px'/></span>"));
        }                             
        $outerDiv.append($newDiv);
        
        // submitted banks
        var hasPerfectSection = false;
        if (thisBank.submitted !== undefined && thisBank.submitted.length > 0) {
            for (var sIndex = 0; sIndex < thisBank.submitted.length; sIndex++) {
                var submission = thisBank.submitted[sIndex];
                if (submission.numRight / submission.totalQs == 1) {
                    hasPerfectSection = true;
                }
                var $oldBank = grades.oneSubmission(submission, thisBank);
                $outerDiv.append($oldBank);
            }
        }
        
        // find isolated sections if no 100% submitted...
        if (hasPerfectSection == false) {
            var $isolatedSections = grades.findIsolatedSections(thisBank);
            if ($isolatedSections !== undefined) {
                $outerDiv.append($isolatedSections);            
            }            
        }
        
        // new set...
        var bankUrl = thisBank.url;
        if (thisBank.seedRandom != 'FALSE') {
            var randomSeed = random.getRandomSeed();
            bankUrl += '?seed=' + randomSeed;   
        }
        if (bankType == 'quiz' && thisBank.active == false) {
            // do nothing...
        } else {
            var $startNew = $("<div><a href='" + bankUrl + "'>Start assignment anew</a></div>");
            $outerDiv.append($startNew);                                 
        }
                                             
        $appendTo.append($outerDiv);  
    };
    
    grades.findIsolatedSections = function (thisBank) {
        var hasIsolatedSection = false;
        
        var $isolatedDiv = $("<div><span>Sections not connected to submissions:</span></div>");
        for (var secIndex = 0; secIndex < thisBank.sections.length; secIndex++) {
            var sec = thisBank.sections[secIndex];
            var hasMatchingSubmission = false;
            for (var sIndex = 0; sIndex < thisBank.submitted.length; sIndex++) {
                var submission = thisBank.submitted[sIndex];
                if (sec.seed == submission.seed) {
                    hasMatchingSubmission = true;
                }
            }
            if (hasMatchingSubmission == false) {
                hasIsolatedSection = true;
                $isolatedDiv.append( grades.sectionInfo(sec, thisBank));
            }
        }
        if (hasIsolatedSection == true) {
            return $isolatedDiv;
        } else {
            return undefined;
        }
    };
    
    grades.oneSubmission = function (submission, thisBank) {
        var $oldBank = $("<div></div>");
        if ((thisBank.closeAtEnd != 'TRUE' || thisBank.active == true) && submission.seed != -1) {
            $oldBank.append( $("<a href='" + thisBank.url + '?seed=' + 
                    submission.seed +"'>Variation no. " + submission.seed + "</a>: ") );
        } else if (thisBank.closeAtEnd == 'TRUE' && thisBank.active == false) {
            $oldBank.append( $("<span>This quiz or exercise is closed. </span>"));
        } else if (submission.numRight > 0) {
            $oldBank.append( $("<span>Composite from multiple submissions.</span>") );
        } else {
            $oldBank.append( $("<span>No submission recorded.</span>") );                                         
        }
        var $oldGrades = $("<span> <b>" + parseInt(submission.numRight*100/submission.totalQs).toString() + "%</b> " + 
            "<span style='color: #00aa00'>" + submission.numRight + " Right </span>/ " +
            "<span style='color: #aa0000'>" + submission.numWrong + " Wrong </span>/ " +
            "<span style='color: #0000aa'>" + submission.numUnanswered + " Skipped </span>" +
            "</span> ");                        
        $oldBank.append($oldGrades);
        var $detailButton = $("<img src='../css/arrow_down.png' height='12'/>")
            .on('click', function() { 
                    var $this = $(this);    
                    var dataDown = $this.data('down');
                    var newDisplay = dataDown ? 'block' : 'none';
                    if (dataDown) {
                        $this.css('transform', 'rotate(180deg)');                                                     
                    } else {
                        $this.css('transform', 'rotate(0deg)');     
                    }
                    $this.data('down', !dataDown);
                    $this.parent().find(".sections").css('display', newDisplay);  
                }).css('padding', '0px 0px 0px 0px').data('down', true);
        $oldBank.append($detailButton);
        var $sections = $("<div class='sections'></div>")
            .css('display', 'none');                                     

        var foundSeed = false;
        if (thisBank.sections !== undefined && thisBank.sections.length > 0) {
            for (var k = 0; k < thisBank.sections.length; k++) {
                var sec = thisBank.sections[k];
                if (sec.seed != submission.seed) {
                    continue;
                }
                foundSeed = true;
                var $oneSection = grades.sectionInfo(sec, false);
                $sections.append($oneSection);
            }
        } 
        if (foundSeed === false) {
            $sections.append($("<span>No further information available</span>"));
        }
        $oldBank.append($sections);
        return $oldBank;
    };

    grades.sectionInfo = function (sec, linkBank) {
        var $oneSection = $("<div></div>").css('padding-left', '20px');
        if (linkBank != false && linkBank != undefined) {
            $oneSection.append($("<span><a href='" + linkBank.url + "?seed=" + sec.seed +"'>Id: " + sec.sectionId + "</a>: </span>"));            
        } else {
            $oneSection.append($("<span>" + sec.sectionId + "</span>"));
        }
        $oneSection.append($("<span style='color: #00aa00'> " + sec.numRight + " </span>/ " +
                "<span style='color: #aa0000'>" + sec.numWrong + " </span>/ " +
                "<span style='color: #0000aa'>" + sec.numUnanswered + " </span>"));
        return $oneSection;
    };
    
    // end of define
    if (typeof(m21theory) != "undefined") {
        m21theory.grades = grades;
    }       
    return grades;
});