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
        //When we are connected do something
        jQuery("#connectionStatus").text('Connected!');
        //myCodeMirror.replaceRange('Connected to Eldewrito!', CodeMirror.Pos(myCodeMirror.lastLine()));
        dewRconConnected = true;
        connectionTrigger(); //my addition
    };
    dewRcon.dewWebSocket.onerror = function() {
        //Something bad happened
        jQuery("#connectionStatus").text('Not connected. Is the game running?!');
        dewRconConnected = false;
        if (!dewRconConnected) {
            if (DewRconPortIndex == 0) {
                DewRconPortIndex = 1;
                StartRconConnection();
            } else {
                DewRconPortIndex = 0;
                setTimeout(StartRconConnection, 1000);
            }
        }
    };
    dewRcon.dewWebSocket.onmessage = function(message) {
        dewRcon.lastMessage = message.data;
        console.log(dewRcon.lastMessage);
        console.log(dewRcon.lastCommand);
        console.log(message.data);
    };
	dewRcon.dewWebSocket.onclose = function(message) {
        //console.log(message.code);
		dewRconConnected = false;
		//disconnectTrigger();
    };
}
var DewRconPortIndex = 0;
var DewRconPorts = [11764, 11776];
dewRconHelper = function() {
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    this.dewWebSocket = new WebSocket('ws://127.0.0.1:' + DewRconPorts[DewRconPortIndex], 'dew-rcon');
    this.lastMessage = "";
    this.lastCommand = "";
    this.open = false;

    this.send = function(command) {
        try {
            this.dewWebSocket.send(command);
            this.lastCommand = command;
        } catch (e) {
			console.log(e);
            dewRconConnected = false;
        }
    }
}