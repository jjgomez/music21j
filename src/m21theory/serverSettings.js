/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/serverSettings -- user settings in one place
 * 
 * Copyright (c) 2014, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['jquery', 'm21theory/feedback', 'music21/common', 'm21theory/userData'], 
        function($, feedback, common, userData) {
    var s = {}; 
    
    // hacky!!!!
    s._host = undefined;
    
    s.setUrls = function () {
        this.commentUrl = this.host + '/server/cgi-bin/send_comment.cgi';
        this.gradebookUrl = this.host + '/server/cgi-bin/gradebook.cgi';
        this.changePassword = this.host + '/server/cgi-bin/change_pw.cgi';
        this.checkLogin = this.host + '/server/cgi-bin/check_login.cgi';
        this.submitSection = this.host + '/server/cgi-bin/submit_section.cgi';        
    };
    
    s.setHostFromLocation = function () {
        var l = window.location;
        if (l.hostname == 'ciconia.mit.edu' ) {
            this.host = l.origin + '/m21j';
        } else if (l.hostname == 'web.mit.edu') {
            this.host = 'http://ciconia.mit.edu/m21j'; // web.mit.edu has no mysql...
        } else {
            this.host = '';
        }
        console.log(this.commentUrl);
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
        var jsonObj = JSON.stringify(objToMakeJSON);
        var params = {
                type: "POST",
                url: serverSettings.testResponseURL,
                data: { json: jsonObj },
                dataType: 'json',
                success: function (jsonData) { 
                    feedback.alert(jsonData, 'ok');
                },
                error: function (data, errorThrown) { 
                    alert("Got a problem! -- print this page as a PDF and email it to cuthbert@mit.edu: " + errorThrown);
                    console.log(data);
                },
        };
        common.merge(params, options);
        $.ajax(params);
    };
    
    
    // end of define
    if (typeof(m21theory) != "undefined") {
        m21theory.serverSettings = serverSettings;
    }       
    return serverSettings;
});