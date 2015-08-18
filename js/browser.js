var serverList = {
servers: []
}; 
var serverCount = 0;
var playerCount = 0;
var gameVersion = 0;
var selectedID = 0;
var controllersOn = false;
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

Handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Mousetrap.bind('f11', function() {
    closeBrowser();
});

function closeBrowser() {
    setTimeout(function() {
        dewRcon.send('menu.show');
        dewRcon.send('Game.SetMenuEnabled 0');
    }, "1000");
}

function setBrowser() {
    dewRcon.send('Game.MenuURL http://scooterpsu.github.io/');
    dewRcon.send('writeconfig');
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
    $('.closeButton').show();
    dewRcon.send('game.version');
    setTimeout(function() {
        if (dewRcon.lastMessage.length > 0) {
            gameVersion = dewRcon.lastMessage;
            console.log(gameVersion);
        }
    }, "400");
}

var gamepad = new Gamepad();

gamepad.bind(Gamepad.Event.CONNECTED, function(device) {
    console.log("a new gamepad connected");
    setTimeout(function() {
        $('.controllerButton').show();
        $("#serverList tbody tr").eq(selectedID).addClass('selected');
        controllersOn = true;
    }, "400");
});

gamepad.bind(Gamepad.Event.DISCONNECTED, function(device) {
    console.log("gamepad disconnected");
    $('.controllerButton').hide();
    $('#serverList tbody tr.selected').removeClass('selected');
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
                joinServer(selectedID);
            }
        }else if (e.control == "FACE_2"){
            //console.log("B");
            if($('.sweet-overlay').is(':visible')){
                sweetAlert.close();   
            } else {
                closeBrowser();
            }
        }else if (e.control == "FACE_3"){
            //console.log("X");
            updateServerInfo(selectedID);
        }else if (e.control == "FACE_4"){
           //console.log("Y");
           window.location.reload();
        }else if (e.control == "DPAD_UP"){
            //console.log("UP");
            if (selectedID > 0) {
                selectedID--;
                updateSelection();
            }
        }else if (e.control == "DPAD_DOWN"){
            //console.log("DOWN");
            if (selectedID < ($("#serverList tbody tr").length - 1)){
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
        }  
    }
});

gamepad.bind(Gamepad.Event.BUTTON_UP, function(e) {
    //console.log(e.control + " of gamepad " + e.gamepad + " released");
});

gamepad.bind(Gamepad.Event.AXIS_CHANGED, function(e) {
    //console.log(e.axis + " changed to value " + e.value + " for gamepad " + e.gamepad);
});

gamepad.bind(Gamepad.Event.TICK, function(gamepads) {
    //console.log("gamepads were updated (around 60 times a second)");
});

if (!gamepad.init()) {
    // Your browser does not support gamepads, get the latest Google Chrome or Firefox
}

function updateSelection() {
    $('#serverList tbody tr.selected').removeClass('selected');
    $("#serverList tbody tr").eq(selectedID).addClass('selected');
}    