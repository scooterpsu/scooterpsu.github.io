/**
 *
 *
 *
 *
 **/
 


var friendServer,
	friendServerConnected = false,
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
				friendServer.send("{'type':'connection', 'message':'" + res + ":" + ret.split(' ')[2] + " has connected.'}");
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
			var result = JSON.parse(message.data);
			switch (result.type.ToString()) {
				case "pm":
					console.log(result.message);
				break;
				default:
					console.log("Unhandled packet: ");
				break;
			}
		} catch (e) {
			console.log(message.data);
		}
		
		if (typeof friendServer.callback == 'function')
            friendServer.callback(message.data);
        friendServer.lastMessage = message.data;
				//console.log(friendServer.lastMessage);
    };
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
