var friendServer,
	friendServerConnected = false,
	onlinePlayers = {},
	party = [];

StartConnection = function() {
    friendServer = new friendServerHelper();
    friendServer.friendsServerSocket.onopen = function() {
        if (!friendServerConnected){
            friendServer.send(JSON.stringify({
                type: "connection",
                message: " has connected.",
                guid: puid,
                player: pname
            }));
            party = [];
            party.push(pname + ":" + puid);
            loadParty();
            console.log('Connected to Friend Server!');
            friendServerConnected = true;
        }
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
            swal.setDefaults({ html: true });
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

							if (party[0].split(':')[1] == puid)
								continue;

							friendServer.send(JSON.stringify({
								type: "notification",
								message: result.player + " has left the party.",
								guid: party[i].split(':')[1]
							}));
						}

						console.log(result.player + ' has left your party.');
						$("#chat").append("<span id='statusLine'>"+ result.player + " has left your party.</span><br/>");
                        updateScroll();
						loadParty();
					}
				break;

				case "pm":
 					console.log(result.player + ": " + result.message);
                    swal({   
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
                                imageUrl: "images/eldorito.png",  
                                imageWidth: "102", 
                                imageHeight: "88",
                                showCancelButton: true,   
                                closeOnConfirm: false,   
                                closeOnCancel: true, 
                                title: "Reply",   
                                html: "To " + result.player +":",   
                                type: "input",   
                                confirmButtonText: "Send",   
                                cancelButtonText: "Close",   
                                showCancelButton: true,   
                                closeOnConfirm: false,   
                            }, function(inputValue){   
                                if (inputValue === false) return false;      
                                if (inputValue === "") {     
                                    swal.showInputError("You need to write something!");     
                                    return false
                                }
                                sendPM(senderguid, inputValue);
                                sweetAlert.close();
                            });
                        } else {
                            
                        }
                    });
                break;

                case "partymessage":
                    //console.log(result.player + ": " + result.message);
                    $("#chat").append(new Date().timeNow()+ "<b> "+ result.player + ":</b> " + result.message + "<br/>");
                    updateScroll();
                    $("#chatBorder").css("display", "block");
				break;

				case "partyinvite":
                    swal({   
                        imageUrl: "images/eldorito.png",  
                        imageWidth: "102", 
                        imageHeight: "88",
                        showCancelButton: true,   
                        closeOnConfirm: false,   
                        closeOnCancel: true, 
                        title: "Party Invite",   
                        html: result.player + " has sent you a party invite. <br /><br /> Would you like to join?",   
                        confirmButtonText: "Accept",   
                        cancelButtonText: "Decline",   
                        showCancelButton: true, 
                    }, function(isConfirm){
                        if (isConfirm) {
                            partyInvite(true, result.senderguid);
                            sweetAlert.closeModal();
                        } else {
                            partyInvite(false, result.senderguid);  
                            sweetAlert.closeModal();                             
                        }
                    });
				break;

				case "gameinvite":
                    swal({   
                        imageUrl: "images/eldorito.png",  
                        imageWidth: "102", 
                        imageHeight: "88",
                        showCancelButton: true,   
                        closeOnConfirm: false,   
                        closeOnCancel: true, 
                        title: "Game Invite",   
                        html: result.player + " has sent you a game invite. <br /><br /> Would you like to join?",   
                        confirmButtonText: "Accept",   
                        cancelButtonText: "Decline",   
                    }, function(isConfirm){
                        if (isConfirm) {
                            gameInvite(true, result.senderguid);
                            sweetAlert.closeModal();
                        } else {
                            gameInvite(false, result.senderguid);  
                            sweetAlert.closeModal();                             
                        }
                    });
				break;

				case "acceptparty":
                    $("#chat").append("<span id='statusLine'>"+ result.player + " has joined your party.</span><br/>");
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
					onlinePlayers = JSON.parse(result.players).sort();
					//console.log(onlinePlayers);
                    loadOnline();
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
    this.friendsServerSocket = new WebSocket('ws://158.69.166.144:55555', 'friendServer');
    this.lastMessage = "";
    this.lastCommand = "";
    this.open = false;
	this.callback = {};
    this.send = function(command, cb) {
		this.callback = cb;
        this.friendsServerSocket.send(command);
        //console.log(command);
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
