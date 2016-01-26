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
    swal.setDefaults({ 
        html: true,
        imageUrl: "images/eldorito.png",  
        showCancelButton: true,   
        confirmButtonText: "Yes",   
        cancelButtonText: "No",   
        closeOnConfirm: false,   
        closeOnCancel: true 
    });
    friendServer = new friendServerHelper();
    friendServer.friendsServerSocket.onopen = function() {
		dewRcon.send('player.name', function(res) {
			dewRcon.send('player.printUID', function(ret) {
				pname = res;
				puid = ret.split(' ')[2];
				
				friendServer.send(JSON.stringify({
					type: "connection",
					message: " has connected.",
					guid: ret.split(' ')[2],
					player: res
				}));

				party.push(res + ":" + ret.split(' ')[2]);
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
						
						loadParty();
					}
				break;
				case "pm":
					console.log(result.player + ": " + result.message);
                    swal({   
                        title: "Private Message",   
                        text: result.player + ": " + result.message,   
                        confirmButtonText: "Reply",   
                        cancelButtonText: "Close",   
                        }, function(isConfirm){
                            if (isConfirm) {
                            //Reply window   
                                swal({   
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
				case "partyinvite":
                    swal({   
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
						callback: partyInvite

				break;
				case "gameinvite":
                    swal({   
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
						callback: gameInvite

				break;
				case "acceptparty":
                    console.log(result.player + ' has joined your party.');
                    
                    party.push(result.player + ":" + result.pguid);
                    
                    for (var i = 0; i < party.length; i++) {
                        friendServer.send(JSON.stringify({
                            type: "updateparty",
                            party: JSON.stringify(party),
                            guid: party[i].split(':')[1]
                        }));
                        
                        if(party[i].split(':')[1] == puid || party[i].split(':')[1] == result.guid)
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
					jumpToServer(result.address);
					setTimeout(function() {
						startgame(result.address, 'JOIN GAME'.split(' '));
					}, 500);
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
					console.log(onlinePlayers);
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
        this.lastCommand = command;
    }
}

function loadParty() {
	$('#party').empty();
	if(party.length > 0) {
		for(var i=0; i < party.length; i++) {
            var partyEntry = "<div class='friend'>"+party[i].split(":")[0]
            if (party[i].split(":")[1] == puid){
                partyEntry += "<button class='pmButton' onClick='console.log("+party[i].split(":")[1]+")'>PM</button>"
            }
            partyEntry += "</div>"
			$('#party').append(partyEntry);
		}
		$('#party .friend:first-of-type').attr('title','Party Leader');
	} else {
		$('#party').append("<div class='nofriends'>You're not partying :(</div>");
	}
}