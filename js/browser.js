var serverList = {
servers: []
}; 
var serverTable = [];
var pingTable = [];
var isThrottled = false;
var throttleDuration = 30000; // ms
var serverCount = 0;
var playerCount = 0;
var gameVersion = 0;
var selectedID = 1;
var selectedIndex = 0;
var controllersOn = false;
var VerifyIPRegex = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)(?:\:(?:\d|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;
$(document).ready(function() {
    buildTable();
} );
        
function buildTable(){
	$('#serverTable').on('click', 'tr', function() {
		var tr = $(this).closest('tr');
		var row = table.row( tr );
		if (row.data()){
			joinServer(row.data()[0]);
		} 
    });  
    $('#serverTable').on('mouseover', 'tr', function() {
		var tr = $(this).closest('tr');
		var row = table.row( tr );
		if (row.data()){
			fillGameCard(row.data()[0]);
        }
    });
  
	var table = $('#serverTable').DataTable( {
		"footerCallback": function ( row, data, start, end, display ) {
            /*
            var api = this.api(), data;
            visiblePlayers = api
                .column( 11, { page: 'current'} )
                .data()
                .reduce( function (a, b) {
                    return a + b;
                }, 0 );
			visibleServers = this.fnSettings().fnRecordsDisplay();
			var playerOut = visiblePlayers + " players";
			if(playerCount > visiblePlayers){
				playerOut += " (" + playerCount + " total)";
			}
			var serverOut = visibleServers + " servers";
			if(serverCount > visibleServers){
				serverOut += " (" + serverCount + " total)";
			}
            */
            var playerOut = playerCount + " players";
			var serverOut = serverCount + " servers";
			$('.playerCount').html(playerOut);
			$('.serverCount').html(serverOut);
        },
        destroy: true,
        "iDisplayLength": 10,
		stateSave: true,
        "lengthMenu": [[10, 15, 25, -1], [10, 15, 25, "All"]],
        columnDefs: [
            { type: 'ip-address', targets: 2 }
        ],
		columns: [
			{ title: "ID", visible: false},
			{ title: "IP", "width": "1%", visible: false},
            { title: "", "width": "0.5%"},
			{ title: "Name" },
			{ title: "Host" },
            { title: "Ping" , "width": "1%"},
			{ title: "Map" },
			{ title: "Map File", visible: false},
			{ title: "Gametype"},
			{ title: "Variant" },
			{ title: "Status", visible: false},    
 			{ title: "Num Players", visible: false},  
			{ title: "Players", "sType": "playerCount", "width": "1%"},
			{ title: "Version", "width": "1%", visible: false}
		],
		"order": [[ 0 ]],
		"language": {
			"emptyTable": "No servers found",
            "zeroRecords": "No matching servers found",
			"infoEmpty": "No servers found",
            "info": "Showing servers _START_ to _END_ of _TOTAL_",
            "lengthMenu": "Show _MENU_ servers"
		}
	} );

	var jqhxr = $.getJSON( "http://eldewrito.red-m.net/list", null)
			.done(function( data ) {
					for(var i = 0; i < data.result.servers.length; i++)
					{
							var serverIP = data.result.servers[i];
							if(VerifyIPRegex.test(serverIP)){
									serverList.servers.push({serverIP, i});
									(function(i, serverIP) {
										var jqhrxServerInfo = $.getJSON("http://" + serverIP, null )
										.done(function(serverInfo) {
												serverInfo["serverId"] = i;
												serverInfo["serverIP"] = serverIP;
												if (serverInfo.maxPlayers <= 16 ) {
                                                    
													if(serverInfo.map.length > 0){ //blank map means glitched server entry
														for (var j = 0; j < serverList.servers.length; j++)
														{
															if (serverList.servers[j]["i"] == i)
															{
																	serverList.servers[j] = serverInfo;
																	serverCount++;
																	playerCount+=parseInt(serverInfo.numPlayers);
															}
														}
														//console.log(serverInfo);
														if(!serverInfo.hasOwnProperty("passworded")){
															serverInfo["passworded"] = "";
														} else {
                                                           serverInfo["passworded"] = "🔒";
                                                        };
														table.row.add([
															serverInfo.serverId,
															serverInfo.serverIP,
                                                            serverInfo.passworded,
															serverInfo.name,
															serverInfo.hostPlayer,
                                                            "000",
															serverInfo.map,
															serverInfo.mapFile,
															capitalizeFirstLetter(serverInfo.variantType),
															capitalizeFirstLetter(serverInfo.variant),
															serverInfo.status,
                                                            parseInt(serverInfo.numPlayers),
															parseInt(serverInfo.numPlayers) + "/" + parseInt(serverInfo.maxPlayers),
															serverInfo.eldewritoVersion,
                                                            serverInfo.sprintEnabled,
                                                            serverInfo.sprintUnlimitedEnabled
														]).draw();
														table.columns.adjust().draw();
                                                        pingMe(serverInfo.serverIP, $("#serverTable").DataTable().column(0).data().length-1);
                                                        fillGameCard(serverInfo.serverId);
													} else {
														console.log(serverInfo.serverIP + " is glitched");
													}
												} else {
													console.log(serverInfo.serverIP + " is hacked (maxPlayers over 16)");
												}
										});
									})(i, serverIP);
							} else {
								console.log(serverIP + " is invalid, skipping.");
							}
					}                 
			for (var j = 0; j < serverList.servers.length; j++)
			{
					//console.log(serverList.servers[j]);
			}
		}
	);
}

function joinServer(i) {
	//console.log(serverList.servers[i].serverIP);
    if(dewRconConnected){
        if(serverList.servers[i].numPlayers < serverList.servers[i].maxPlayers) {
            if(serverList.servers[i].eldewritoVersion === gameVersion) {
                ga('send', 'event', 'serverlist', 'connect');
                if(serverList.servers[i].passworded){
                    sweetAlert({   
                    title: "Private Server",   
                    text: "Please enter password",   
                    type: "input", 
                    inputType: "password",
                    showCancelButton: true,   
                    closeOnConfirm: false,
                    inputPlaceholder: "Password goes here" 
                    }, 
                    function(inputValue){
                        if (inputValue === false) return false;      
                        if (inputValue === "") {     
                         sweetAlert.showInputError("Passwords are never blank");     
                         return false   
                        } else {
                            dewRcon.send('connect ' + serverList.servers[i].serverIP + ' ' + inputValue);
                            setTimeout(function() {
                                if (dewRcon.lastMessage === "Incorrect password specified.") {
                                    sweetAlert.showInputError(dewRcon.lastMessage);
                                    return false
                                }else {
                                    sweetAlert.close();
                                    closeBrowser();
                                }
                            }, "400");
                        }
                    });
                } else {
                    dewRcon.send('connect ' + serverList.servers[i].serverIP);
                    closeBrowser();
                }
            } else {
				sweetAlert({
				title:"Error", 
				text:"Host running different version.<br /> Unable to join!", 
				type:"error",
				html: true
				});
            }
        } else {
                sweetAlert("Error", "Game is full or unavailable!", "error");
        }
    } else {
        sweetAlert("Error", "dewRcon is not connected!", "error");        
    }
}

function connectionTrigger(){
    $('.closeButton').show();
	$('#serverTable_filter').css("right","-160px");
    dewRcon.send('game.version');
    setTimeout(function() {
        if (dewRcon.lastMessage.length > 0) {
            gameVersion = dewRcon.lastMessage;
            $('#serverTable').dataTable().fnFilter( gameVersion, 14 );
            setTimeout(function() {
                $('#serverTable').dataTable().api().column( 14 ).visible( false );
            }, "200");
        }
    }, "200");
}

function disconnectTrigger(){
    $('.closeButton').hide();
+	$('#serverTable_filter').css("right","-264px");
}

function closeBrowser() {
	if(dewRconConnected){
		setTimeout(function() {
			dewRcon.send('menu.show');
			dewRcon.send('Game.SetMenuEnabled 0');
		}, "1000");
	}else{
		window.close();
	}
}

function updateSelection(){
	$('#serverTable tr.selected').removeClass('selected');
	$("#serverTable tr:eq(" + selectedID + ")").addClass("selected");
	var row = $('#serverTable').dataTable().fnGetData($("#serverTable tr:eq(" + selectedID + ")"));
    fillGameCard(row[0]);
}

function joinSelected(){
	var row = $('#serverTable').dataTable().fnGetData($("#serverTable tr:eq(" + selectedID + ")"));
	joinServer(row[0]);
}

function pingMe(ip, rowNum) {
    var startTime = Date.now();
    var endTime;
    var ping;
    //console.log(ip);
    $.ajax({
        type: "GET",
        url: "http://" + ip + "/",
        async: true,
        timeout: 5000,
        success: function() {
            endTime = Date.now();
            ping = Math.round((endTime - startTime) * .45);
            $('#serverTable').dataTable().fnUpdate(ping, rowNum, 5);
            $('#serverTable').DataTable().columns.adjust().draw();
        }
    });
}

function fillGameCard(i){
    var html = serverTemplate(serverList.servers[i]);
    $("#gamecard").html(html)
}

Mousetrap.bind('f11', function() {
    closeBrowser();
});

var gamepad = new Gamepad();

gamepad.bind(Gamepad.Event.CONNECTED, function(device) {
    console.log("a new gamepad connected");
    setTimeout(function() {
        $('.controllerButton').show();
        updateSelection();
        controllersOn = true;
    }, "400");
});

gamepad.bind(Gamepad.Event.DISCONNECTED, function(device) {
    console.log("gamepad disconnected");
    $('.controllerButton').hide();
    $('#serverTable tr.selected').removeClass('selected');
    controllersOn = false;
});

gamepad.bind(Gamepad.Event.UNSUPPORTED, function(device) {
    console.log("an unsupported gamepad connected (add new mapping)");
});

gamepad.bind(Gamepad.Event.BUTTON_DOWN, function(e) {
    if (controllersOn){
        //console.log(e.control + " of gamepad " + e.gamepad + " pressed down");
        if (e.control == "FACE_1"){
            //console.log("A");
            if($('.sweet-overlay').is(':visible')){
                sweetAlert.close();   
            } else {
                joinSelected();
            }
        }else if (e.control == "FACE_2"){
            //console.log("B");
            sweetAlert.close();   
        }else if (e.control == "FACE_3"){
            //console.log("X");
            //toggleDetails();
        }else if (e.control == "FACE_4"){
           //console.log("Y");
           window.location.reload();
        }else if (e.control == "DPAD_UP"){
            //console.log("UP");
            if (selectedID > 1) {
                selectedID--;
                updateSelection();
            }
        }else if (e.control == "DPAD_DOWN"){
            //console.log("DOWN");
            if (selectedID < ($("#serverTable tbody tr").length)){
                selectedID++;
                updateSelection();
            }
        }else if (e.control == "DPAD_LEFT"){
            //console.log("LEFT");
            if($('#serverTable').DataTable().page.info().page > 0){
                $('#serverTable').DataTable().page( 'previous' ).draw( 'page' );
                selectedID = 1;
                updateSelection();
            }
        }else if (e.control == "DPAD_RIGHT"){
            //console.log("RIGHT");
            if(($('#serverTable').DataTable().page.info().page +1)<$('#serverTable').DataTable().page.info().pages){
                $('#serverTable').DataTable().page( 'next' ).draw( 'page' ); 
                selectedID = 1;
                updateSelection();                
            }  
        }else if (e.control == "SELECT_BACK"){
            //console.log("BACK");
            closeBrowser();
        }else if (e.control == "START_FORWARD"){
            //console.log("START");
        }else if (e.control == "RIGHT_TOP_SHOULDER"){
            //console.log("RIGHT BUMPER");
            if(($('#serverTable').DataTable().page.info().page +1)<$('#serverTable').DataTable().page.info().pages){
                $('#serverTable').DataTable().page( 'next' ).draw( 'page' ); 
                selectedID = 1;
                updateSelection();                
            }            
        }else if (e.control == "LEFT_TOP_SHOULDER"){
            //console.log("LEFT BUMPER");
            if($('#serverTable').DataTable().page.info().page > 0){
                $('#serverTable').DataTable().page( 'previous' ).draw( 'page' );
                selectedID = 1;
                updateSelection();
            }
        }else if (e.control == "LEFT_STICK"){
            //console.log("LEFT STICK");
            //Because I use weird mapping.
            toggleDetails();
        }          
    }
});

//initializes Gamepads (needed)
if (!gamepad.init()) {
    // Your browser does not support gamepads, get the latest Google Chrome or Firefox
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function sortByKey(array, key) {
    return array.sort(function(b, a) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function refreshTable(){
    //Throttle refresh so people can't spam and break the count
    if (isThrottled) { return; }
    isThrottled = true;
    setTimeout(function () { isThrottled = false; }, throttleDuration);
    ga('send', 'event', 'serverlist', 'refresh-list');
    serverList = {
        servers: []
    };
    serverTable = [];
    serverCount = 0;
    playerCount = 0;
    $('.serverCount').html(serverCount + " servers");
    $('.playerCount').html(playerCount + " players");
    $('#serverTable').DataTable().clear(); 
    selectedID = 1;
    buildTable();
    if(dewRconConnected){
        connectionTrigger();   
    }
}

String.prototype.contains = function(it) {
	return this.indexOf(it) != -1;
};

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "ip-address-pre": function ( a ) {
        var m = a.split("."), x = "";
 
        for(var i = 0; i < m.length; i++) {
            var item = m[i];
            if(item.length == 1) {
                x += "00" + item;
            } else if(item.length == 2) {
                x += "0" + item;
            } else {
                x += item;
            }
        }
        return x;
    },
 
    "ip-address-asc": function ( a, b ) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },
 
    "ip-address-desc": function ( a, b ) {
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
} );

Handlebars.registerHelper('eachByScore', function(context,options){
    var output = '';
    var contextSorted = context.concat()
        .sort( function(a,b) { return b.score - a.score } );
    for(var i=0, j=contextSorted.length; i<j; i++) {
        output += options.fn(contextSorted[i]);
    }
    return output;
});

Handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper('capitalize', function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, 'string');
  
Handlebars.registerHelper('lowerCase', function(str) {
    return new Handlebars.SafeString(str.toLowerCase());
});

function switchBrowser(){
    setTimeout(function() {
        dewRcon.send('game.menuurl "http://halo.thefeeltra.in/"');
        dewRcon.send('writeconfig');
    }, "1000");  
}

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "playerCount-pre": function ( a ) {
        var pCount = a.split('/');
        return (pCount[1] + pCount[0]) * 1;
    },

    "playerCount-asc": function ( a, b ) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },

    "playerCountdesc": function ( a, b ) {
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
} );