var friendServer,
	friendServerConnected = false,
	pname,
	puid,
	onlinePlayers = {},
	party = [];
jQuery(function() {
	if(dewRconConnected) {
		StartConnection();
	} 
});

StartConnection = function() {
    friendServer = new friendServerHelper();
    friendServer.friendsServerSocket.onopen = function() {
		dewRcon.send('player.name', function(rez) {
			dewRcon.send('player.printUID', function(rey) {
				pname = rez;
				puid = rey.split(' ')[2];
				
				friendServer.send(JSON.stringify({
					type: "connection",
					message: " has connected.",
					guid: rey.split(' ')[2],
					player: rez
				}));

				party.push(rez + ":" + rey.split(' ')[2]);
				loadParty();
			});
		});
        console.log('Connected to Friend Server!');
        friendServerConnected = true;
    };
    friendServer.friendsServerSocket.onerror = function() {
		console.log('Connection to Friend Server failed, retrying.');
        friendServerConnected = false;
        if(!friendServerConnected) {
    		setTimeout(StartConnection, 1000);
		}
    };
    friendServer.friendsServerSocket.onmessage = function(message) {
		try {
			var result = JSON.parse(JSON.stringify(eval('(' + message.data + ')')));
			switch (result.type) {
				case "disconnected":
					if ($.inArray(result.player + ":" + result.guid, party) != -1) {
						party = $.grep(party, function(value) {
						  return value != (result.player + ":" + result.guid);
						});
						
						for (var i = 0; i < party.length; i++) {
							friendServer.send(JSON.stringify({
								type: "updateparty",
								party: JSON.stringify(party),
								guid: party[i].split(':')[1]
							}));
							
							if (party[i].split(':')[1] == result.pguid || party[i].split(':')[1] == puid)
								continue;
							
							friendServer.send(JSON.stringify({
								type: "notification",
								message: result.player + " has left the party.",
								guid: party[i].split(':')[1]
							}));
						}

						console.log(result.player + ' has left your party.');
						$("#chat").append("<p id='statusLine'>"+ result.player + " has left your party.</p><br/>");
                        updateScroll();
						loadParty();
					}
				break;
				case "pm":
                //console.log(message);
					console.log(result.player + ": " + result.message);

                    swal({   
                        html: true,
                        imageUrl: "images/eldorito.png",  
                        showCancelButton: true,   
                        closeOnConfirm: false,   
                        closeOnCancel: true, 
                        title: "Private Message",   
                        text: result.player + ": " + result.message,   
                        confirmButtonText: "Reply",   
                        cancelButtonText: "Close",   
                        }, function(isConfirm){
                            if (isConfirm) {
                            //Reply window   
                                swal({   
                                    html: true,
                                    imageUrl: "images/eldorito.png",  
                                    showCancelButton: true,   
                                    closeOnConfirm: false,   
                                    closeOnCancel: true, 
                                    title: "Reply",   
                                    text: "To " + result.player +":",   
                                    type: "input",   
                                    confirmButtonText: "Send",   
                                    cancelButtonText: "Close",   
                                    showCancelButton: true,   
                                    closeOnConfirm: false,   
                                    }, function(inputValue){   
                                    if (inputValue === false) return false;      
                                    if (inputValue === "") {     
                                    swal.showInputError("You need to write something!");     
                                    return false}
                                    sendPM(senderguid, inputValue);
                                    sweetAlert.close();
                                });
                        } else {
                            
                        }
                    });
                break;
                case "partymessage":
                    console.log(result.player + ": " + result.message);
                    //if($.inArray(result.player + ":" + result.senderguid, party) == -1){
                        $("#chat").append(new Date().timeNow()+ "<b> "+ result.player + ":</b> " + result.message + "<br/>");
                        updateScroll();
                        $("#chatBorder").css("display", "block");
                    //}
				break;
				case "partyinvite":
                    swal({   
                        html: true,
                        imageUrl: "images/eldorito.png",  
                        showCancelButton: true,   
                        closeOnConfirm: false,   
                        closeOnCancel: true, 
                        title: "Party Invite",   
                        text: result.player + " has sent you a party invite. <br /><br /> Would you like to join?",   
                        confirmButtonText: "Accept",   
                        cancelButtonText: "Decline",   
                        showCancelButton: true, 
                     }, function(isConfirm){
                        if (isConfirm) {
                            partyInvite(true, result.senderguid);
                            sweetAlert.close();
                        } else {
                            partyInvite(false, result.senderguid);  
                            sweetAlert.close();                             
                        }
                    });
						//callback: partyInvite

				break;
				case "gameinvite":
                    swal({   
                        html: true,
                        imageUrl: "images/eldorito.png",  
                        showCancelButton: true,   
                        closeOnConfirm: false,   
                        closeOnCancel: true, 
                        title: "Game Invite",   
                        text: result.player + " has sent you a game invite. <br /><br /> Would you like to join?",   
                        confirmButtonText: "Accept",   
                        cancelButtonText: "Decline",   
                     }, function(isConfirm){
                        if (isConfirm) {
                            gameInvite(true, result.senderguid);
                            sweetAlert.close();
                        } else {
                            gameInvite(false, result.senderguid);  
                            sweetAlert.close();                             
                        }
                    });
						//callback: gameInvite

				break;
				case "acceptparty":
                    console.log(result.player + ' has joined your party.');
                   $("#chat").append("<p id='statusLine'>"+ result.player + " has joined your party.</p><br/>");
                    updateScroll();
                    party.push(result.player + ":" + result.pguid);
                    
                    for (var i = 0; i < party.length; i++) {
                        friendServer.send(JSON.stringify({
                            type: "updateparty",
                            party: JSON.stringify(party),
                            guid: party[i].split(':')[1]
                        }));
                        
                        if(party[i].split(':')[1] == puid || party[i].split(':')[1] == result.pguid)
                            continue;
                        
                        friendServer.send(JSON.stringify({
                            type: "notification",
                            message: result.player + " has joined the party.",
                            guid: party[i].split(':')[1]
                        }));
                    }
                    
                    loadParty();
				break;
				case "acceptgame":

				break;
				case "connect":
					dewRcon.send('connect ' + result.address + ' ' + result.password);
				break;
				case "notification":
					console.log(result.message);
				break;
				case "updateparty":
					party = JSON.parse(result.party);
					loadParty();
				break;
				case "updateplayers":
					onlinePlayers = JSON.parse(result.players);
					//console.log(onlinePlayers);
                    loadOnline();
					//updateFriends();
					//loadFriends();
				break;
				default:
					console.log("Unhandled packet: " + result.type);
				break;
			}
		} catch (e) {
			console.log(e);
			console.log(message.data);
		}

		if (typeof friendServer.callback == 'function')
			friendServer.callback(message.data);
        friendServer.lastMessage = message.data;
		//console.log(friendServer.lastMessage);
    };
}

function partyInvite(accepted, guid) {
	console.log(guid);
	if (accepted) {
		friendServer.send(JSON.stringify({
			type: 'acceptparty',
			player: pname,
			guid: guid,
			pguid: puid
		}));
	}
	console.log(accepted);
}

function gameInvite(accepted, guid) {
	if (accepted) {
		friendServer.send({
			type: 'acceptgame',
			player: pname,
			guid: puid
		});
	}
	console.log(accepted);
}

function sendPM(targetGuid, messageText){
    var response ={
        type:'pm', 
        player:pname, 
        senderguid:puid, 
        message:messageText, 
        guid:targetGuid
        }
    friendServer.send(JSON.stringify(response));
}

function inviteToParty(targetGuid){
    var response ={
        type:'partyinvite', 
        player:pname, 
        senderguid:puid, 
        guid:targetGuid
    }
    friendServer.send(JSON.stringify(response));
    showOnline();
}

friendServerHelper = function() {
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    this.friendsServerSocket = new WebSocket('ws://192.99.124.166:55555', 'friendServer');
    this.lastMessage = "";
    this.lastCommand = "";
    this.open = false;
	this.callback = {};
    this.send = function(command, cb) {
		this.callback = cb;
        this.friendsServerSocket.send(command);
        console.log(command);
        this.lastCommand = command;
    }
}

function loadParty() {
	$('#party').empty();
	if(party.length > 0) {
		for(var i=0; i < party.length; i++) {
			$('#party').append("<div class='friend'>"+party[i].split(":")[0]+"</div>");
		}
		$('#party .friend:first-of-type').attr('title','Party Leader');
	} else {
		$('#party').append("<div class='nofriends'>You're not partying :(</div>");
	}
}

function loadOnline() {
	$('#allOnline').empty();
	if(onlinePlayers.length > 0) {
		for(var i=0; i < onlinePlayers.length; i++) {
            if($.inArray(onlinePlayers[i], party) == -1){
                if (onlinePlayers[i].split(":")[1] != "not"){
                    $('#allOnline').append("<div class='friend'>"+onlinePlayers[i].split(":")[0]+"<button class='addToParty' onClick=\"inviteToParty('"+onlinePlayers[i].split(":")[1]+"');\">+</button></div>");
                }
            }
		}
	}
}

$(function() {
    $("#messageBox").keypress(function (e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            $('#submitButton').click();
            return false;
        } else {
            return true;
        }
    });
});

function chatInput(text){
    if(friendServerConnected){
        if(text.length > 0){
            $("#chat").append(new Date().timeNow()+ "<b> "+ pname + ":</b> " + text + "<br/>");
            updateScroll();
            if(party.length > 0) {
                for(var i=0; i < party.length; i++) {
                    if(party[i].split(":")[1] != puid){
                        sendPartyMessage(text);
                    }
                }
            }
            $("#messageBox").val("");
        }
    } else {
        console.log("not connected");
        $("#messageBox").val("");
    }
}

Date.prototype.timeNow = function () {
     return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes();
}

function sendPartyMessage(message){
    friendServer.send(JSON.stringify({
        type: "partymessage",
        message: message,
        player: pname,
        senderguid: puid,
        partymembers: party
    }));  
}

var onlineShown = false;
function showOnline(){
    if (!onlineShown){
        $("#allOnline").css("display", "block");
        $("#party").css("display", "none");
        onlineShown = true;
    } else {
        $("#allOnline").css("display", "none");
        $("#party").css("display", "block");
        onlineShown = false;
    }
}

var chatShown = false;
function showChat(){
    if (!chatShown){
        $("#chatBorder").css("display", "block");
        chatShown = true;
    } else {
        $("#chatBorder").css("display", "none");
        chatShown = false;
    }
}

var partyListShown = false;
function showPartyList(){
    if (!partyListShown){
        $("#partyBorder").css("display", "block");
        partyListShown = true;
    } else {
        $("#partyBorder").css("display", "none");
        partyListShown = false;
    }
}

var scrolled = false;
function updateScroll(){
    if(!scrolled){
        var element = document.getElementById("chat");
        element.scrollTop = element.scrollHeight;
    }
}

$("#chat").on('scroll', function(){
    scrolled=true;
});