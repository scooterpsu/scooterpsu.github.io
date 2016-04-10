//Coded by DARKC0DE
var dewRcon;
var dewRconConnected = false;
jQuery(function() {
    StartRconConnection();
    if (!dewRconConnected) {
        setTimeout(StartRconConnection, 2000);
    }
});
StartRconConnection = function() {
    dewRcon = new dewRconHelper();
    dewRcon.dewWebSocket.onopen = function() {
        if(!dewRconConnected){
            jQuery("#connectionStatus").text('Connected');
            dewRconConnected = true;
            connectionTrigger();
        }
    };
    dewRcon.dewWebSocket.onerror = function() {
        //jQuery("#connectionStatus").text('Not connected. Is the game running?');
        dewRconConnected = false;
        if (!dewRconConnected) {
            StartRconConnection();
        }
    };
    dewRcon.dewWebSocket.onmessage = function(message) {
		if (typeof dewRcon.callback == 'function')
			dewRcon.callback(message.data);
        dewRcon.lastMessage = message.data;
        //console.log(dewRcon.lastMessage);
        //console.log(dewRcon.lastCommand);
        //console.log(message.data);
    };
	dewRcon.dewWebSocket.onclose = function(message) {
		//jQuery("#connectionStatus").text('Disconnected');
        //console.log(message.code);
		dewRconConnected = false;
		disconnectTrigger();
    };
}

dewRconHelper = function() {
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    this.dewWebSocket = new WebSocket('ws://127.0.0.1:11776', 'dew-rcon');
    this.lastMessage = "";
    this.lastCommand = "";
	this.callback = {};
    this.open = false;

    this.send = function(command, cb) {
        try {
            this.dewWebSocket.send(command);
            this.lastCommand = command;
			this.callback = cb;
            //console.log(command);
        } catch (e) {
			console.log(e);
            dewRconConnected = false;
        }
    }
}