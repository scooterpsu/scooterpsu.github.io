/**
 *
 *
 *
 *
 **/
 


var friendServer,
	friendServerConnected = false,
	pname,
	puid;
	party = [];
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
				pname = res;
				puid = ret.split(' ')[2];
				friendServer.send("{'type':'connection', 'message':'" + res + ":" + ret.split(' ')[2] + " has connected.'}");
				
				console.log({
					type: 'acceptparty',
					player: pname,
					guid: puid
				})
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
						
						console.log(result.player + ' has left your party.');
					}
				break;
				case "pm":
					console.log(result.player + ": " + result.message);
				break;
				case "partyinvite":
					dewAlert({
						title: "Party Invitation",
						content: result.player + " has invited you to a party",
						cancel: true,
						cancelText: "Decline"
					});
				break;
				case "gameinvite":
					dewAlert({
						title: "Game Invitation",
						content: result.player + " has invited you join " + result.server,
						cancel: true,
						cancelText: "Decline",
						callback: "gameInvite"
					});
				break;
				case "acceptparty":
					console.log(result.player + ' has joined your party.');
					party.push(result.player + ":" + result.pguid);
				break;
				case "acceptgame":
					
				break;
				case "connect":
					jumpToServer(result.address);
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
	if (accepted) {
		friendServer.send({
			type: 'acceptparty',
			player: pname,
			guid: puid
		});
	}
	console.log(accepted);
}

function gameInvite(accepted) {
	if (accepted) {
		friendServer.send({
			type: 'acceptgame',
			player: pname,
			guid: puid
		});
	}
	console.log(accepted);
}

function jumpToServer(address){
    dewRcon.send('connect ' + address);
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