/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/userData -- keep track of users
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['jquery', './feedback', './serverSettings'], 
        function($, feedback, serverSettings) {
	// Student Name Routines 
	// calling m21theory.fillNameDiv() will 
	// append a name box to a div called "#studentDataDiv"

	var userData = {};
	userData.studentData = {}; 
		
	userData.fillNameDiv = function (whereId) {
	    if (whereId == undefined) {
	        whereId = "testBank";
	    }
	    var nameDivContents = $("<h3>Enter your name here</h3>" +
								"<table><tr><td style='text-align: right'><b>First name: </b><span id='first'></span>" +
								" &raquo; " + 
								"</td><td><b>Last name: </b><span id='last'></span>" +
								"</td><td/></tr>" +
								"<tr><td style='text-align: right'><b>Email: </b><span id='email'></span>" +
                                " &raquo; " + 
                                "</td><td><b>Password: </b>&nbsp;<span id='password'></span>" +
								"</td></tr><tr><td colspan='2' style='text-align: center'><b>Save info on this computer? </b><span id='saveinfo'></span></td></tr></table>");
		var $nameDiv = $("<div>").attr("id","studentDataDiv");
		$nameDiv.append(nameDivContents);
        
		var testBank = $("#" + whereId);
		if (testBank.length == 0) {
			$("body").append("<div id='" + whereId + "'/>");
			testBank = $("#" + whereId);
		}
		testBank.append($nameDiv);
		this.getFromLocalStorage();
		this.nameDivInputboxes($nameDiv);		
	};
	
	userData.nameDivInputboxes = function ($nameDiv) {
	    $.each(['first', 'last', 'email', 'password'], function (i, v) {
	        var inputType = (v == 'password') ? 'password' : 'text'; 
	        var $input = $("<input type='" + inputType + "' size='20' value='" + 
	                userData.studentData[v] + "'/>")
	           .attr('onchange','m21theory.userData.changeData("' + v + '",this.value)')
	           .addClass('lightInput');
	        $nameDiv.find('#' + v).append($input);
        });
	    var $saveInfo = $("<input type='checkbox' id='saveInfo' />").click( function () { 
            userData.studentData.saveInfo = this.checked;
	        if (this.checked == false) {
	            delete(localStorage['studentInfo']);
	        } else {	            
	            $.each(['first','last','email','password'], function (i, v) {
	                userData.changeData(v, userData.studentData[v]);
	            });
	        }
	    });
	    if (userData.studentData.saveInfo) {
	        $saveInfo.attr('checked', true);
	    }
	    var $si_wrapper = $nameDiv.find("#saveinfo");
	    $si_wrapper.addClass('lightInput');
	    $si_wrapper.append($saveInfo);
	    return $nameDiv;
	};
	
	
	userData.getFromLocalStorage = function () {
       var tempStudentInfo = localStorage["studentInfo"];
       if (tempStudentInfo !== undefined) {
           userData.studentData = JSON.parse(tempStudentInfo);
       }
        $.each(['first', 'last', 'email', 'password'], function (i, v) {
            if (userData.studentData[v] == undefined) {
                userData.studentData[v] = "";
            }            
        });
        if (userData.studentData != undefined) {
            userData.checkLogin();
        }
	};
	
	userData.changeData = function (which, newData, silent) {
	    userData.studentData[which] = newData;
	    if (userData.studentData.saveInfo) {
	        localStorage["studentInfo"] = JSON.stringify(userData.studentData);	        
	    }
	    if (which == 'email' || which == 'password') {
	        userData.checkLogin(silent);	        
	    }
	};
	
	userData.feedbackCallback = function (successCall, silent) {
        if (silent != true) {            
            if (successCall === null) {
                feedback.alert("Your email cannot be found in the database","alert");
            } else if (successCall == false) {
                feedback.alert("Your password did not match the stored password", "alert");                    
            } else {
                feedback.alert("Login successful.", "update");
            }                                   
        }	
	};
	
	userData.checkLoginCallbacks = [userData.feedbackCallback];
	
	userData.checkLogin = function (silent) {
	    var ud = {'studentData': userData.studentData};
	    serverSettings.makeAjax(ud, { 
	        url: serverSettings.checkLogin,
	        success: (function (successCall, silent) { 
	            for (var i = 0; i < userData.checkLoginCallbacks.length; i++) {
	                var callbackFn = userData.checkLoginCallbacks[i];
	                (callbackFn.bind(this))(successCall, silent);
	            }
            }).bind(this),	        
	    });
	};
		
	// end of define
	if (typeof(m21theory) != "undefined") {
		m21theory.userData = userData;
	}		
	return userData;
});