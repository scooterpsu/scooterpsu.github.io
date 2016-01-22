/**
 *
 *
 *
 *
 **/
 
var PlayerName;
var PlayerUID;

var friendServer,
	friendServerConnected = false,
	snacking = 0,
	played = 0;
jQuery(function() {
	if(dewRconConnected) {
		StartConnection();
	}
});

StartConnection = function() {
    friendServer = new friendServerHelper();
    friendServer.friendsServerSocket.onopen = function() {
		dewRcon.send('player.name', function(res) {
			dewRcon.send('player.printUID', function(ret) {
                PlayerName = res;
                PlayerUID = ret.split(' ')[2];
				friendServer.send("{'type':'connection', 'message':'" + res + ":" + ret.split(' ')[2] + " has connected.'}");
			});
		});
        console.log('Connected to Friend Server!');
		//$('#notification')[0].currentTime = 0;
		//$('#notification')[0].play();
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
        swal.setDefaults({ 
            html: true,
            imageUrl: "images/eldorito.png",  
            showCancelButton: true,   
            confirmButtonText: "Yes",   
            cancelButtonText: "No",   
            closeOnConfirm: false,   
            closeOnCancel: true 
        });
		try {
			var result = JSON.parse(JSON.stringify(eval('(' + message.data + ')')));
			switch (result.type) {
				case "pm":
					console.log(result.message);
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
                                var response ={
                                    type:'pm', 
                                    player:PlayerName, 
                                    senderguid:PlayerUID, 
                                    message:inputValue, 
                                    guid:result.senderguid
                                    }
                                friendServer.send(JSON.stringify(response));
                                sweetAlert.close();
                            });
                        } else {
                            
                        }
                    });
				break;
				case "partyinvite":
					//Party invite accept/decline screen
					console.log('Party invite from ' + result.player);
                    swal({   
                        title: "Party Invite",   
                        text: result.player + " has sent you a party invite. <br /><br /> Would you like to join?",   
                    }, function(isConfirm){
                        if (isConfirm) {
                            
                        } else {
                            
                        }
                    });
				break;
				case "gameinvite":
					//Game invite accept/decline screen
					console.log('Game invite from ' + result.player);
                    swal({   
                        title: "Game Invite",   
                        text: result.player + " has sent you a game invite. <br /><br /> Would you like to join?",   
                    }, function(isConfirm){
                        if (isConfirm) {
                            
                        } else {
                            
                        }
                    });
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

function partyInvite(accepted) {
	console.log(accepted);
}

function gameInvite(accepted) {
	console.log(accepted);
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

function after(ms, fn){ setTimeout(fn, ms); }