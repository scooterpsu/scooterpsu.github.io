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
        StartRconConnection();
    };
    dewRcon.dewWebSocket.onmessage = function(message) {
        dewRcon.lastMessage = message.data;
        console.log(dewRcon.lastMessage);
        console.log(dewRcon.lastCommand);
        //We can display the latest messages from dew using the code below
        console.log(message.data);

        //myCodeMirror.replaceRange(message.data, CodeMirror.Pos(myCodeMirror.lastLine()));
    };
}
dewRconHelper = function() {
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    this.dewWebSocket = new WebSocket('ws://127.0.0.1:11776', 'dew-rcon');
    this.lastMessage = "";
    this.lastCommand = "";
    this.open = false;

    this.send = function(command) {
        this.dewWebSocket.send(command);
        this.lastCommand = command;
    }
}