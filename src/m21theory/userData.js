/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/userData -- keep track of users
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['jquery', 'm21theory/feedback'], function($, feedback) {
	// Student Name Routines 
	// calling m21theory.fillNameDiv() will 
	// append a name box to a div called "#studentNameDiv"

	var userData = {};
	userData.studentName = {}; 
	
	
	userData.fillNameDiv = function () {
		var nameDivContents = $("<h3>Enter your name here</h3>" +
								"<table><tr><td style='text-align: right'><b>First name: </b><span id='first'></span>" +
								" &raquo; " + 
								"</td><td><b>Last name: </b><span id='last'></span>" +
								"</td><td/></tr>" +
								"<tr><td style='text-align: right'><b>Email: </b><span id='email'></span>" +
                                " &raquo; " + 
                                "</td><td><b>Password: </b>&nbsp;<span id='password'></span>" +
								"</td><td><b>Save info on this computer? </b><span id='saveinfo'></span></tr></table>");
		var $nameDiv = $("<div>").attr("id","studentNameDiv");
		$nameDiv.append(nameDivContents);
        
		var testBank = $("#testBank");
		if (testBank.length == 0) {
			$("body").append("<div id='testBank'/>");
			testBank = $("#testBank");
		}
		testBank.append($nameDiv);
		this.getFromLocalStorage();
		this.nameDivInputboxes($nameDiv);		
	};
	
	userData.nameDivInputboxes = function ($nameDiv) {
	    $.each(['first', 'last', 'email', 'password'], function (i, v) {
	        var inputType = (v == 'password') ? 'password' : 'text'; 
	        var $input = $("<input type='" + inputType + "' size='20' value='" + 
	                userData.studentName[v] + "'/>")
	           .attr('onchange','m21theory.userData.changeData("' + v + '",this.value)')
	           .addClass('lightInput');
	        $nameDiv.find('#' + v).append($input);
        });
	    var $saveInfo = $("<input type='checkbox' id='saveInfo' />").click( function () { 
            userData.studentName.saveInfo = this.checked;
	        if (this.checked == false) {
	            delete(localStorage['studentInfo']);
	        } else {	            
	            $.each(['first','last','email','password'], function (i, v) {
	                userData.changeData(v, userData.studentName[v]);
	            });
	        }
	    });
	    if (userData.studentName.saveInfo) {
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
           userData.studentName = JSON.parse(tempStudentInfo);
       }
        $.each(['first', 'last', 'email', 'password'], function (i, v) {
            if (userData.studentName[v] == undefined) {
                userData.studentName[v] = "";
            }            
        });
        if (userData.studentName != undefined) {
            userData.checkLogin();
        }
	};
	
	userData.changeData = function (which, newData) {
	    userData.studentName[which] = newData;
	    if (userData.studentName.saveInfo) {
	        localStorage["studentInfo"] = JSON.stringify(userData.studentName);	        
	    }
		userData.checkLogin();
	};

	userData.checkLogin = function () {
	    var ud = {'userData': userData.studentName};
	    
        $.ajax({
            type: "GET",
            url: serverSettings.checkLogin,
            data: {json: JSON.stringify(ud) },
            dataType: 'json',
            error: function (data, errorThrown) { 
                feedback.alert("SERVER IS DOWN! Email cuthbert@mit.edu or CALL! " + data, "alert"); 
            },
            success: (function (successCall) { 
                if (successCall === null) {
                    feedback.alert("Your email cannot be found in the database","alert");
                } else if (successCall == false) {
                    feedback.alert("Your password did not match the stored password", "alert");                    
                } else {
                    feedback.alert("Login successful.", "update");
                }                
            }).bind(this)        
        });
	};
	
	// end of define
	if (typeof(m21theory) != "undefined") {
		m21theory.userData = userData;
	}		
	return userData;
});