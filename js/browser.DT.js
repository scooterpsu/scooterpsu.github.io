var serverList = {
servers: []
}; 
var serverTable = [];
var serverCount = 0;
var playerCount = 0;
var gameVersion = 0;
var selectedID = 0;
var controllersOn = false;
var VerifyIPRegex = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)(?:\:(?:\d|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;
$(document).ready(function() {
    var table = $('#serverTable').DataTable( {
        columns: [
            { title: "ID", visible: false},
            { title: "IP" },
			{ title: "Name" },
            { title: "Host" },
			{ title: "Map" },
            { title: "Map File"},
            { title: "Variant" },
            { title: "Variant Type" },
            { title: "Status" },
			{ title: "Num Players" },
            { title: "Max Players" },
			{ title: "Private" },
            { title: "Version" }
        ]
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
																//$('.serverCount').html(serverCount + " servers");
																//console.log(serverCount);
																//$('.playerCount').html(playerCount + " players");
																//console.log(playerCount);
														}
													}
													console.log(serverInfo);
                                                    if(!serverInfo.hasOwnProperty("passworded")){
                                                        serverInfo["passworded"] = false;
                                                    };
													table.row.add([
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


