var serverList = {
servers: []
}; 
var serverCount = 0;
var playerCount = 0;
var VerifyIPRegex = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)(?:\:(?:\d|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;

var jqhxr = $.getJSON( "http://192.99.124.162/list", null)
        .done(function( data ) {
                for(var i = 0; i < data.result.servers.length; i++)
                {
                        var serverIP = data.result.servers[i];
                        //because sometimes jackasses inject into the server list

                        if(VerifyIPRegex.test(serverIP)){
                                serverList.servers.push({serverIP, i});
                                (function(i, serverIP) {
                                    var jqhxrGeoInfo = $.getJSON("http://www.telize.com/geoip/" + serverIP.substr(0, serverIP.indexOf(':')), null )
                                    .done(function(data) {
                                            if(data.region){
                                            $("#region" + i).html(data.region + ", " + data.country);
                                            }else{
                                            $("#region" + i).html(data.country);
                                            }                                                       
                                        });
                                    var jqhrxServerInfo = $.getJSON("http://" + serverIP, null )
                                    .done(function(serverInfo) {
                                            serverInfo["serverId"] = i;
                                            serverInfo["serverIP"] = serverIP;
											if (serverInfo.maxPlayers <= 16 ) {
												if(serverInfo.map.length > 0){ //blank map means glitched server entry
													var html = serverListInfoTemplate(serverInfo);
													$("#serverid" + i).html(html);
													for (var j = 0; j < serverList.servers.length; j++)
													{
														if (serverList.servers[j]["i"] == i)
														{
																serverList.servers[j] = serverInfo;
																serverCount++;
																playerCount+=serverInfo.numPlayers;
																$('.serverCount').html(serverCount + " servers");
																console.log(serverCount);
																$('.playerCount').html(playerCount + " players");
																console.log(playerCount);
														}
													}
													console.log(serverInfo);
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
                var listHtml = serverListTemplate(serverList);
                $("#serverList").html(listHtml);

        for (var j = 0; j < serverList.servers.length; j++)
        {
                console.log(serverList.servers[j]);
        }
    }
);
            
function updateServerInfo(i) {
    var html = serverTemplate(serverList.servers[i]);
    $("#serverInfo").html(html)
}

function joinServer(i) {
    if(dewRconConnected){
        if(serverList.servers[i].numPlayers < serverList.servers[i].maxPlayers) {
            if(serverList.servers[i].passworded){
                swal({   
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
                     swal.showInputError("Passwords are never blank");     
                     return false   
                    } else {
                        dewRcon.send('connect ' + serverList.servers[i].serverIP + ' ' + inputValue);
                        setTimeout(function() {
                            if (dewRcon.lastMessage === "Incorrect password specified.") {
                                swal.showInputError(dewRcon.lastMessage);
                                return false
                            }else {
                                swal.close();
                                dewRcon.send('Game.SetMenuEnabled 0');
                            }
                        }, "400");
                    }
                });
            }else {
                dewRcon.send('connect ' + serverList.servers[i].serverIP);
                dewRcon.send('Game.SetMenuEnabled 0');
            }
        } else {
            sweetAlert("Error", "Game is full or unavailable!", "error");
        }
    } else {
        sweetAlert("Error", "dewRcon is not connected!", "error");        
    }
}

Handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Mousetrap.bind('f11', function() {

    setTimeout(function() {
        dewRcon.send('Game.SetMenuEnabled 0');
    }, "400");
    
});

function setBrowser() {
    if(dewRconConnected){
        dewRcon.send('Game.MenuURL http://scooterpsu.github.io/');
        dewRcon.send('writeconfig');
    } else {
        sweetAlert("Error", "dewRcon is not connected!", "error");        
    }
}

Handlebars.registerHelper('eachByScore', function(context,options){
    var output = '';
    var contextSorted = context.concat()
        .sort( function(a,b) { return b.score - a.score } );
    for(var i=0, j=contextSorted.length; i<j; i++) {
        output += options.fn(contextSorted[i]);
    }
    return output;
});

function connectionTrigger(){
    document.getElementById('setBrowser').style.display = "block";      
}