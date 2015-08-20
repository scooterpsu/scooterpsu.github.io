var serverList = {
servers: []
}; 
var serverTable = [];
var serverCount = 0;
var playerCount = 0;
var gameVersion = 0;
var selectedID = 1;
var selectedIndex = 0;
var controllersOn = false;
var VerifyIPRegex = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)(?:\:(?:\d|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;
$(document).ready(function() {
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
	}
	selectedID = jQuery(this).closest('tr').index();
	selectedID++;
	$('#serverTable tr.selected').removeClass('selected');
	$("#serverTable tr:eq(" + selectedID + ")").addClass("selected");
});  
var table = $('#serverTable').DataTable( {
    "autoWidth": true,
    columns: [
		{
			"className":      'details-control',
			"orderable":      false,
			"data":           null,
			"defaultContent": ''
		},
		{ title: "ID", visible: false},
        { title: "IP" },
        { title: "Name"},
        { title: "Host" },
        { title: "Map" },
        { title: "Map File", visible: false},
        { title: "Variant" },
        { title: "Variant Type" },
        { title: "Status" },
        { title: "Num Players" },
        { title: "Max Players" },
        { title: "Private" },
        { title: "Version"}
    ],
	"order": [[ 0 ]]
} );
    // Add event listener for opening and closing details
    $('#serverTable tbody').on('click', 'td.details-control', function () {
        var tr = $(this).closest('tr');
        var row = table.row( tr );
 
        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            row.child( format(row.data()) ).show();
            tr.addClass('shown');
        }
    } );
var jqhxr = $.getJSON( "http://192.99.124.162/list", null)
        .done(function( data ) {
                for(var i = 0; i < data.result.servers.length; i++)
                {
                        var serverIP = data.result.servers[i];
                        //because sometimes jackasses inject into the server list

                        if(VerifyIPRegex.test(serverIP)){
                                serverList.servers.push({serverIP, i});
                                (function(i, serverIP) {
									/*
                                    var jqhxrGeoInfo = $.getJSON("http://www.telize.com/geoip/" + serverIP.substr(0, serverIP.indexOf(':')), null )
                                    .done(function(data) {
                                            if(data.region){
                                            $("#region" + i).html(data.region + ", " + data.country);
                                            }else{
                                            $("#region" + i).html(data.country);
                                            }                                                       
                                        });
									*/
                                    var jqhrxServerInfo = $.getJSON("http://" + serverIP, null )
                                    .done(function(serverInfo) {
                                            serverInfo["serverId"] = i;
                                            serverInfo["serverIP"] = serverIP;
											if (serverInfo.maxPlayers <= 16 ) {
												if(serverInfo.map.length > 0){ //blank map means glitched server entry
													//var html = serverListInfoTemplate(serverInfo);
													//$("#serverid" + i).html(html);
													for (var j = 0; j < serverList.servers.length; j++)
													{
														if (serverList.servers[j]["i"] == i)
														{
																serverList.servers[j] = serverInfo;
																serverCount++;
																playerCount+=serverInfo.numPlayers;
																$('.serverCount').html(serverCount + " servers");
																//console.log(serverCount);
																$('.playerCount').html(playerCount + " players");
																//console.log(playerCount);
														}
													}
													console.log(serverInfo);
                                                    if(!serverInfo.hasOwnProperty("passworded")){
                                                        serverInfo["passworded"] = false;
                                                    };
													table.row.add([
														null,
														serverInfo.serverId,
                                                        serverInfo.serverIP,
                                                        serverInfo.name,
                                                        serverInfo.hostPlayer,
                                                        serverInfo.map,
                                                        serverInfo.mapFile,
                                                        serverInfo.variant,
                                                        serverInfo.variantType,
                                                        serverInfo.status,
                                                        serverInfo.numPlayers,
                                                        serverInfo.maxPlayers,
                                                        serverInfo.passworded,
                                                        serverInfo.eldewritoVersion
                                                    ]).draw();
                                                    table.columns.adjust().draw();
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
} );

function joinServer(i) {
	console.log(serverList.servers[i].serverIP);
    if(dewRconConnected){
        if(serverList.servers[i].numPlayers < serverList.servers[i].maxPlayers) {
            if(serverList.servers[i].eldewritoVersion === gameVersion) {
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
	$('#serverTable_filter').css("right","125");
    dewRcon.send('game.version');
    setTimeout(function() {
        if (dewRcon.lastMessage.length > 0) {
            gameVersion = dewRcon.lastMessage;
            console.log(gameVersion);
        }
    }, "400");
}

function closeBrowser() {
    setTimeout(function() {
        dewRcon.send('menu.show');
        dewRcon.send('Game.SetMenuEnabled 0');
    }, "1000");
}

function updateSelection(){
	$('#serverTable tr.selected').removeClass('selected');
	$("#serverTable tr:eq(" + selectedID + ")").addClass("selected");
}

function joinSelected(){
	var ip = $("#serverTable tr:eq(" + selectedID + ")").find('td:eq(1)').text();
	console.log(ip);
	}

Mousetrap.bind('f11', function() {
    closeBrowser();
});

//Testing gamepad functions without a gamepad...
/*
Mousetrap.bind('space', function() {
	//mimic gamepad connection
	$('.controllerButton').show();
	//$('.closeButton').show();
	updateSelection();
	controllersOn = true;
});
Mousetrap.bind('up', function() {
	if (controllersOn){
		if (selectedID > 1) {
			selectedID--;
			updateSelection();
		}
	}
});
Mousetrap.bind('down', function() {
	if (controllersOn){
		if (selectedID < ($("#serverTable tbody tr").length)){
			selectedID++;
			updateSelection();
		}
	}
});
Mousetrap.bind('a', function() {
	if (controllersOn){
		//A button
		if($('.sweet-overlay').is(':visible')){
			sweetAlert.close();   
		} else {
			setTimeout(function() {
				//console.log("Joining " + $("#serverTable tr:eq(" + selectedID + ")").find('td:eq(0)').text());
				joinSelected();
			}, "200");
		}
	}
});
Mousetrap.bind('b', function() {
	if (controllersOn){
		//B button
		sweetAlert.close();   	
	}
});
Mousetrap.bind('y', function() {
	if (controllersOn){
		//Y button
		window.location.reload(); 	
	}
});
*/

/* Formatting function for row details - modify as you need */
function format ( d ) {
	//console.log(d[d.length - 1]);
    // `d` is the original data object for the row
    return '<div id="leftside"><img src="images/maps/' + serverList.servers[d[1]].mapFile + '.png"></div>'+
		'<div id="rightside"><table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">'+
        '<tr>'+
            '<td>Name:</td>'+
            '<td>'+serverList.servers[d[1]].name+'</td>'+
        '</tr>'+
		        '<tr>'+
            '<td>Host:</td>'+
            '<td>'+serverList.servers[d[1]].hostPlayer+'</td>'+
        '</tr>'+
		        '<tr>'+
            '<td>Map:</td>'+
            '<td>'+serverList.servers[d[1]].map+'</td>'+
        '</tr>'+
		        '<tr>'+
            '<td>Variant:</td>'+
            '<td>'+serverList.servers[d[1]].variant+'</td>'+
        '</tr>'+
    '</table></div>';
}