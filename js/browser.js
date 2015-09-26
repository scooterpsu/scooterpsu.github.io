var serverList = {
servers: []
}; 
var serverTable = [];
var pingTable = [];

var serverCount = 0;
var playerCount = 0;
var gameVersion = 0;
var selectedID = 1;
var selectedIndex = 0;
var controllersOn = false;
var VerifyIPRegex = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)(?:\:(?:\d|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;
$(document).ready(function() {
    buildTable();
    // Add event listener for opening and closing details
    $('#serverTable tbody').on('click', 'td.details-control', function () {
        var tr = $(this).closest('tr');
        var row = $('#serverTable').DataTable().row( tr );

        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            row.child( expansionLine(row.data()) ).show();
            tr.addClass('shown');
        }
    } );
	window.addEventListener('resize', function(){
		setTimeout(function() {
			var infoPos = (window.innerWidth*0.48 - $('#serverTable_info').text().length*3 - 10);
			console.log($('#serverTable_info').text().length);
			console.log(infoPos);
			$('#serverTable_info').css("padding-left",infoPos);
		}, "10");	
	}, true);
} );
        
function buildTable(){
	$('#serverTable').on('click', 'tr:not(:first) td:not(".details-control") ', function() {
		/*
		console.log("ip: " + $(this).find('td:eq(0)').text());
		console.log("numplayers: " + $(this).find('td:eq(8)').text());
		console.log("maxplayers: " + $(this).find('td:eq(9)').text());
		console.log("private: " + $(this).find('td:eq(10)').text());
		console.log("version: " + $(this).find('td:eq(11)').text());
		*/
		//joinServer($(this).find('td:eq(0)').text(), $(this).find('td:eq(8)').text(), $(this).find('td:eq(9)').text(), $(this).find('td:eq(10)').text(), $(this).find('td:eq(11)').text());
		var tr = $(this).closest('tr');
		var row = table.row( tr );
		if (row.data()){
			joinServer(row.data()[1]);
			/*
            selectedID = jQuery(this).closest('tr').index();
			selectedID++;
			$('#serverTable tr.selected').removeClass('selected');
			$("#serverTable tr:eq(" + selectedID + ")").addClass("selected");
            */
		} else {
            var trChild = $(this).closest('tr').prev();
            var rowChild = table.row(trChild);
            rowChild.child.hide();
            trChild.removeClass('shown');
        }
	});  
	var table = $('#serverTable').DataTable( {
		"footerCallback": function ( row, data, start, end, display ) {
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
			$('.playerCount').html(playerOut);
			$('.serverCount').html(serverOut);
			setTimeout(function() {
				var infoPos = (window.innerWidth*0.48 - $('#serverTable_info').text().length*3 - 10);
				console.log($('#serverTable_info').text().length);
				console.log(infoPos);
				$('#serverTable_info').css("padding-left",infoPos);
			}, "10");
        },
        destroy: true,
        "iDisplayLength": 10,
		//stateSave: true,
        "lengthMenu": [[10, 15, 25, -1], [10, 15, 25, "All"]],
        columnDefs: [
            { type: 'ip-address', targets: 2 }
        ],
		columns: [
			{
				"className":      'details-control',
				"orderable":      false,
				"data":           null,
				"defaultContent": '',
                "width": "0.5%",
			},
			{ title: "ID", visible: false},
			{ title: "IP", "width": "1%"},
            { title: "Location"},
			{ title: "Name", "width": "15%" },
			{ title: "Host" },
			{ title: "Map" },
			{ title: "Map File", visible: false},
			{ title: "Variant" },
			{ title: "Variant Type", "width": "1%"},
			{ title: "Status", visible: false},
			{ title: "Num Players", "width": "1%"},
			{ title: "Max Players", "width": "1%"},
			{ title: "Private", "width": "1%"},
			{ title: "Version", "width": "1%"}
		],
		"order": [[ 0 ]],
		"language": {
			"emptyTable": "No servers found",
            "zeroRecords": "No matching servers found",
			"infoEmpty": "No servers found",
            "info": "Showing servers _START_ to _END_ of _TOTAL_"
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
																	playerCount+=serverInfo.numPlayers;
																	//$('.serverCount').html(serverCount + " servers");
																	//console.log(serverCount);
																	//$('.playerCount').html(playerCount + " players");
																	//console.log(playerCount);
															}
														}
														//console.log(serverInfo);
														if(!serverInfo.hasOwnProperty("passworded")){
															serverInfo["passworded"] = false;
														};
														table.row.add([
															null,
															serverInfo.serverId,
															serverInfo.serverIP,
                                                            "Loading...",
															serverInfo.name,
															serverInfo.hostPlayer,
															serverInfo.map,
															serverInfo.mapFile,
															capitalizeFirstLetter(serverInfo.variant),
															capitalizeFirstLetter(serverInfo.variantType),
															serverInfo.status,
															serverInfo.numPlayers,
															serverInfo.maxPlayers,
															serverInfo.passworded,
															serverInfo.eldewritoVersion,
                                                            serverInfo.sprintEnabled,
                                                            serverInfo.sprintUnlimitedEnabled
														]).draw();
														table.columns.adjust().draw();
                                                        getLocation(serverInfo.serverIP, $("#serverTable tbody tr").length-1);
													} else {
														console.log(serverInfo.serverIP + " is glitched");
													}
												} else {
													console.log(serverInfo.serverIP + " is hacked (maxPlayers over 16)");
												}
										});
									})(i, serverIP);
							} else {
								console.log("Invalid IP, skipping.");
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
            //if(serverList.servers[i].eldewritoVersion === gameVersion) {
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
            /*} else {
				sweetAlert({
				title:"Error", 
				text:"Host running different version.<br /> Unable to join!", 
				type:"error",
				html: true
				});
            }*/
        } else {
                sweetAlert("Error", "Game is full or unavailable!", "error");
        }
    } else {
        sweetAlert("Error", "dewRcon is not connected!", "error");        
    }
}

function connectionTrigger(){
    $('.closeButton').show();
	$('#serverTable_filter').css("right","125");
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
    //$('.closeButton').hide();
	//$('#serverTable_filter').css("right","10");
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
}

function joinSelected(){
	var row = $('#serverTable').dataTable().fnGetData(selectedID-1);
	//console.log(row[1]);
	joinServer(row[1]);
}

function toggleDetails(){
    $('#serverTable tr:eq(' + selectedID + ') td.details-control').trigger( "click" );
}

function getLocation(ip, rowNum){ 
    if (ip.contains(":")){
        ip = ip.split(":")[0];
    }
    var geoInfo = $.getJSON("http://www.telize.com/geoip/" + ip, null )
    .done(function(data) {
        if ($('#serverTable').dataTable().fnGetData(rowNum, 3)=="Loading..."){
            var location = "[" + data.continent_code + "] "
            //if(data.city){location += data.city + ", "} //since sometimes data.city is missing
            if(data.region){location += data.region + ", "} //since sometimes data.city is missing
            if(location.length > 5){
                location += data.country_code3;
            } else {
                location += data.country;
            }
            $('#serverTable').dataTable().fnUpdate(location, rowNum, 3);
            $('#serverTable').DataTable().columns.adjust().draw();
        }
    });
}

/*
function pingList(){ 
    //fakePongs();
    pingTable.length = 0;
    $('#serverTable').dataTable().api().column( 3 ).visible( true );
    var rowNum = 0;
    var rowData = "";
    var ip = "";
    var ping = "";
    while(rowNum <= $("#serverTable tbody tr").length-1){
        rowData = $('#serverTable').dataTable().fnGetData(rowNum, 2);
        if (rowData.contains(":")){
            ip = rowData.split(":")[0];
        }
		if(dewRconConnected){
			dewRcon.send('ping ' + ip);
			if (dewRcon.lastMessage.length > 0) {
				storePong(dewRcon.lastMessage);
			} 
		}
        $('#serverTable').dataTable().fnUpdate(lookupPing(ip), rowNum, 3);  
        rowNum++;
    }
    console.log(pingTable);
}

function storePong(reply){
    if (reply.contains("PONG")){
        pingTable.push(reply.split(" "));
    }
}

function lookupPing(ip) {
    for (var i=0; i<pingTable.length; i++)
        if (pingTable[i][1] === ip && pingTable[i].length > 3)                    
            return pingTable[i][3];
    return "?";
}

function fakePongs(){
    storePong("PONG 100.12.94.137 5849583405 14ms");
    storePong("PONG 184.153.214.35 5849583405 26ms");
    storePong("PONG 69.244.172.233 5849583405 4ms");
    storePong("PONG 206.188.91.153 5849503859 20ms");
}
*/

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
    //console.log("an unsupported gamepad connected (add new mapping)");
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
            toggleDetails();
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
        }else if (e.control == "DPAD_RIGHT"){
            //console.log("RIGHT");
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

function expansionLine(d) {
    var output = "";
    output += '<div id="gamecard"><img id="mapPic" class="img-responsive" src="images/maps/' + serverList.servers[d[1]].mapFile + '.png">'+
    '<img id="gameTypePic" class="img-responsive" src="images/gametypes/' + capitalizeFirstLetter(serverList.servers[d[1]].variantType) + '.png">'+
    '<h3 id="hostName">'+serverList.servers[d[1]].hostPlayer+'</h3>'+
    '<h4 id="gameStatus">In '+serverList.servers[d[1]].status.split("In")[1]+'</h4>'+
    '<h5 id="gameName">'+serverList.servers[d[1]].name+'</h5>';
    if (serverList.servers[d[1]].sprintEnabled == "1"){
        if (serverList.servers[d[1]].sprintUnlimitedEnabled == "1") {
            output +='<img id="sprintVars" src="images/infsprint.png">';
        } else {
             output +='<img id="sprintVars" src="images/sprint.png">'; 
        }
    }  else {
             output +='<img id="sprintVars" src="images/nosprint.png">'; 
    }
    if (serverList.servers[d[1]].VoIP) {
        output +='<img id="voipIcon" src="images/mic.png"></div>';
    }   else {
       output +='<img id="voipIcon" src="images/nomic.png"></div>'; 
    }
    if(!serverList.servers[d[1]].passworded){ 
        output += '<div id="scoreboard"><table class="statBreakdown"><thead class="tableHeader">'+
            '<th>Name</th>'+
            '<th><center>Score</center></th>'+
            '<th><center>K</center></th>'+
            '<th><center>D</center></th>'+
            '<th><center>A</center></th>'+
            '<th><center>Ratio</center></th>'+
            '</thead><tbody>';
        var playerNum = 0;
            while (playerNum < serverList.servers[d[1]].players.length) {
                var playerList = serverList.servers[d[1]].players;
                playerList = sortByKey(playerList, 'score');
                var ratio = 0;
                if(playerList[playerNum].name){
                    if(playerList[playerNum].kills>0){
                        ratio = ((playerList[playerNum].kills+(playerList[playerNum].assists/3))/playerList[playerNum].deaths).toFixed(2);
                    }
                    output +=  '<tr>'+
                        '<td class="statLines">'+playerList[playerNum].name+'</td>'+
                        '<td class="statLines"><center>'+playerList[playerNum].score+'</center></td>'+
                        '<td class="statLines"><center>'+playerList[playerNum].kills+'</center></td>'+
                        '<td class="statLines"><center>'+playerList[playerNum].deaths+'</center></td>'+
                        '<td class="statLines"><center>'+playerList[playerNum].assists+'</center></td>'+
                        '<td class="statLines"><center>'+ratio+'</center></td>'+
                    '</tr>';
                }
                playerNum++;
            }
        output += '</tbody></table></div>';  
    }   else {
    output += "<div id='scoreboard' class='private'><center><h3>Private Game</h3><br /><h3>Player Data Unavailable</h3></center></div>";
    }
    return output;
}

function sortByKey(array, key) {
    return array.sort(function(b, a) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function refreshTable(){
    serverList = {
        servers: []
    };
    serverTable = [];
    serverCount = 0;
    playerCount = 0;
    $('.serverCount').html(serverCount + " servers");
    $('.playerCount').html(playerCount + " players");
    $('#serverTable').DataTable().clear(); 
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

$(document).ready(function() {
    $('#example').DataTable( {

    } );
} );