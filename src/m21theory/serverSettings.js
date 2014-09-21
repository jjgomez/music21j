/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/serverSettings -- user settings in one place
 * 
 * Copyright (c) 2014, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['jquery', './feedback', 'music21/common', './userData'], 
        function($, feedback, common, userData) {
    var s = {}; 
    
    // hacky!!!!
    s._host = undefined;
    s.useJsonP = false;
    
    s.setUrls = function () {
        this.commentUrl = this.host + '/server/cgi-bin/send_comment.cgi';
        this.gradebookUrl = this.host + '/server/cgi-bin/gradebook.cgi';
        this.changePassword = this.host + '/server/cgi-bin/change_pw.cgi';
        this.addUser = this.host + '/server/cgi-bin/add_user.cgi';
        this.checkLogin = this.host + '/server/cgi-bin/check_login.cgi';

        this.submitQuestion = this.host + '/server/cgi-bin/submit_question.cgi';
        this.submitSection = this.host + '/server/cgi-bin/submit_section.cgi';        
        this.submitBank = this.host + '/server/cgi-bin/submit_bank.cgi';        
        
        this.getGradesByType = this.host + '/server/cgi-bin/grades_by_type.cgi';
        
        this.retrieveAnswer = this.host + '/server/cgi-bin/retrieve_answer.cgi';
    };
    
    s.setHostFromLocation = function () {
        var l = window.location;
        if (l.hostname == 'ciconia.mit.edu' ) {
            this.host = l.origin + '/m21j';
        } else if (l.hostname == 'zachara.mit.edu' ) {
            this.host = l.origin + '/m21j';
        } else if (l.hostname == 'web.mit.edu') {
            this.host = 'http://zachara.mit.edu/m21j'; // web.mit.edu has no mysql...
            this.useJsonP = true; // necessary for cross domain XHR requests.
        } else if (l.hostname == 'localhost' && common.urlParam('dbRemote') != '') { // starting to use main DB -- dangerous!
            this.host = 'http://zachara.mit.edu/m21j';
            this.useJsonP = true; // necessary for cross domain XHR requests.
        } else if (l.hostname == 'scripts.mit.edu') {
            this.host = l.origin + '/~cuthbert/music21j';
        } else {
            this.host = ""; // necessary to run setUrls
        }
        //console.log(this.commentUrl);
    };
    
    Object.defineProperties( s, {
       'host': {
           get: function () { return this._host; },
           set: function (h) { this._host = h; this.setUrls(); },
       },
    });
    
    s.setHostFromLocation();
    
    serverSettings = s;
    
    s.makeAjax = function (objToMakeJSON, options) {
        if (objToMakeJSON === undefined) {
            objToMakeJSON = {};
        }
        if (objToMakeJSON.studentData === undefined) {
            // userData alone was giving problems...
            objToMakeJSON.studentData = m21theory.userData.studentData;
        }
        if (common.urlParam('forUser') != '') {
            objToMakeJSON.forUser = common.urlParam('forUser');
        }
        var jsonObj = JSON.stringify(objToMakeJSON);
        var params = {
                type: "POST",
                url: serverSettings.testResponseURL,
                data: { json: jsonObj },
                dataType: 'json',
                success: function (jsonData) { 
                    feedback.alert(jsonData, 'ok');
                },
                error: function (xhr, errorThrown) { 
                    if (m21theory.debug) {
                        var $tempDiv = $("<div style='background-color: white; text-align: left; z-index: 1000'></div>");
                        var $tt = $(xhr.responseText);
                        $tempDiv.append($tt);
                        $(document.body).append($tempDiv);                            
                    }
                    m21theory.feedback.alert("Got a problem! -- print this page as a PDF and email it to cuthbert@mit.edu: " + errorThrown);
                    console.log(xhr.responseText);
                },
        };
        if (this.useJsonP == true) {            
            params.dataType = 'jsonp';
        }
        common.merge(params, options);        
        $.ajax(params);
    };
    
    
    // end of define
    if (typeof(m21theory) != "undefined") {
        m21theory.serverSettings = serverSettings;
    }       
    return serverSettings;
});