var pageFocus = false;
var zoomRatio;
var scoreBoardVisible = false;
var mapList = [[]];
var EDVersion = 0;
var serverList = {
servers: []
}; 
var serverTable = [];
var isThrottled = false;
var throttleDuration = 30000; // ms
var serverCount = 0;
var playerCount = 0;
var totalSlotCount = 0;
var openSlotCount = 0;
var gameVersion = 0;
var pname = "";
var puid = "";
var color = "#000000"
var selectedID = 0;
var controllersOn = false;
var VerifyIPRegex = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)(?:\:(?:\d|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;
swal.setDefaults({
    customClass: "alertWindow",
    confirmButtonClass: "alertConfirm",
    cancelButtonClass: "alertCancel",
    buttonsStyling: false,
    html: true
})
$(document).ready(function() {
    getCurrentRelease();
    buildTable();
    setInterval( CheckPageFocus, 200 );

    $( "#chatBorder" ).draggable({ containment: "body", scroll: false, snap: true, handle: "#chatHeader", cancel: "button" });
    $( "#partyBorder" ).draggable({ containment: "body", scroll: false, snap: true, handle: "#partyHeader", cancel: "button" });

    $( "#zoomSlider" ).slider({
        value:1,
        min: 0.75,
        max: 2,
        step: 0.05,
        stop: function( event, ui ) {
            var percentage = ui.value * 100;
            adjustResolution( ui.value );
            $('#zoomSlider .ui-slider-handle').text( percentage.toFixed(0) );
        }
    });
    $(document).on('click','#scoreBoardHeader',function(){
        toggleScoreboard();
    });
});

/* Sets zoom level to specified value or reset if not specified */
function adjustResolution(newZoom) {
    if (!newZoom) { newZoom = 1; }
    $('body').stop().animate({zoom: newZoom}, 500);
}

function getCurrentRelease() {
    var fgjkfld = $.getJSON( "http://eldewrito.anvilonline.net/update.json", null)
    .done(function( data ) {
        EDVersion = Object.keys(data)[0];
    })
}

var clickDelay = 300;  
var isDelayed = false;   
function buildTable() {
    $('#serverTable').on('click', 'tr', function() {
        var tr = $(this).closest('tr');
        var row = table.row( tr );
        if (row.data()) {                 
            if(!isDelayed){
                isDelayed = true;
                joinServer(row.data()[0]);
                setTimeout(function(){
                    isDelayed = false;
                }, clickDelay);
            }
        } 
    });  
    $('#serverTable').on('mouseover', 'tr', function() {
        var tr = $(this).closest('tr');
        var row = table.row( tr );
        if (row.data()) {
            fillGameCard(row.data()[0]);
        }
    });
  
    var table = $('#serverTable').DataTable( {
        "footerCallback": function ( row, data, start, end, display ) {
            var playerOut = playerCount + " players";
            var serverOut = serverCount + " servers";
            $('.playerCount').html(playerOut);
            $('.serverCount').html(serverOut);
            if (playerCount >= 420 && playerCount < 426) {
                $('.playerCount').css("color", "#007700");
            } else {
                $('.playerCount').css("color", "white");
            }
        },
        bPaginate: false,
        scrollY: "-webkit-calc(100% - 137px)",
        scroller: true,
        destroy: true,
        "iDisplayLength": 10,
        stateSave: true,
        "stateSaveParams": function (settings, data) {
            for (var i = 0;i < data.columns.length; i++){
              delete data.columns[i].search;
            }
        },
        "lengthMenu": [[10, 15, 25, -1], [10, 15, 25, "All"]],
        columnDefs: [
            { type: 'ip-address', targets: 2 },
            { type: "playerCount", targets: 13 },
            { targets: [ 5 ], orderData: [ 6 ]},
            { "mRender": function (data, type, row) {
                img_str = '<img class="pingbars" src="images/' + data.split(':')[1] + 'bars.png"/>  '+ data.split(':')[0];
                return img_str;
            }, "aTargets":[ 5 ]}
        ],
        columns: [
            { title: "ID", visible: false},
            { title: "IP", "width": "1%", visible: false},
            { title: "", "width": "0.5%"},
            { title: "Name" },
            { title: "Host" },
            { title: "Ping" , "width": "45px"},
            { title: "PingNum" , visible: false},           
            { title: "Map" },
            { title: "Map File", visible: false},
            { title: "Gametype"},
            { title: "Variant" },
            { title: "Status", visible: false},    
             { title: "Num Players", visible: false},  
            { title: "Players", "width": "1%"},
            { title: "IsFull", "width": "1%", visible: false},
            { title: "Version", "width": "1%", visible: false}
        ],
        "order": [[ 0 ]],
        "language": {
            "emptyTable": "No servers found",
            "zeroRecords": "No matching servers found",
            "infoEmpty": "No servers found",
            "info": "Showing servers _START_ to _END_ of _TOTAL_",
            "lengthMenu": "Show _MENU_ servers"
        }
    });

    var master_servers = [];
    var server_list = [];
    var mshxr = $.getJSON("https://raw.githubusercontent.com/ElDewrito/ElDorito/master/dewrito.json")
    .done(function( data ) {
        var master_count = 0;
        for (var i = 0; i<data.masterServers.length; i++){
            master_count++
            window.master_length = data.masterServers.length;
            var jqhxr = $.ajax({
            url: data.masterServers[i].list, 
                type: 'GET',
                datatype: 'json',
                async: false
                //headers : {
                //    'X-Player' : pname+":"+puid
                //}
            })
            .done(function( data ) {
                for(var ii = 0; ii < data.result.servers.length; ii++) {
                    if (!(data.result.servers[ii] in server_list)) {
                        server_list.push(data.result.servers[ii]);
                    }
                }
            });
        }
        server_list = unique(server_list);
        var pingDelay = 120;
        for (var i = 0; i < server_list.length; i++){
            serverIP = server_list[i];
            if(VerifyIPRegex.test(serverIP)) {
                serverList.servers.push({serverIP, i});
                (function(i, serverIP) {
                    setTimeout(function() {
                    var startTime = Date.now();
                    var endTime;
                    var ping;
                    var pingDisplay;
                    var rePing = false;
                    var jqhrxServerInfo = $.getJSON("http://" + serverIP, null )
                    .done(function(serverInfo) {
                        endTime = Date.now();
                        ping = Math.round((endTime - startTime) * .45);
                        if (ping > 0 && ping <= 100) {
                            pingDisplay = ping+":3";
                        }   else if(ping > 100 && ping <= 200) {
                            pingDisplay = ping+":2";
                        }   else if(ping > 200 && ping <= 500) {
                            pingDisplay = ping+":1";  
                            rePing = true;
                        }   else {
                            pingDisplay = ping+":0";
                            rePing = true;
                        }
                        serverInfo["serverId"] = i;
                        serverInfo["serverIP"] = serverIP;
                        if (serverInfo.maxPlayers <= 16 ) {
                            if(serverInfo.map.length > 0) { //blank map means glitched server entry
                                for (var j = 0; j < serverList.servers.length; j++) {
                                    if (serverList.servers[j]["i"] == i) {
                                        serverList.servers[j] = serverInfo;
                                        playerCount+=parseInt(serverInfo.numPlayers);
                                    }
                                }
                                if(!serverInfo.hasOwnProperty("passworded")) {
                                    serverInfo["passworded"] = "";
                                    var openSlots = serverInfo.maxPlayers - serverInfo.numPlayers;
                                    totalSlotCount += serverInfo.maxPlayers;
                                    openSlotCount += openSlots;
                                    $(".serverPool").attr('value', openSlotCount);
                                    $(".serverPool").attr('max', totalSlotCount);
                                } else {
                                    serverInfo["passworded"] = "🔒";
                                };
                                var isFull = "full";
                                if((parseInt(serverInfo.maxPlayers)-parseInt(serverInfo.numPlayers))>0) {
                                    isFull = "open";
                                }
                                table.row.add([
                                    serverInfo.serverId,
                                    serverInfo.serverIP,
                                    serverInfo.passworded,
                                    serverInfo.name,
                                    serverInfo.hostPlayer,
                                    pingDisplay,
                                    ping,
                                    serverInfo.map,
                                    serverInfo.mapFile,
                                    capitalizeFirstLetter(serverInfo.variantType),
                                    capitalizeFirstLetter(serverInfo.variant),
                                    serverInfo.status,
                                    parseInt(serverInfo.numPlayers),
                                    parseInt(serverInfo.numPlayers) + "/" + parseInt(serverInfo.maxPlayers),
                                    isFull,
                                    serverInfo.eldewritoVersion,
                                    serverInfo.sprintEnabled,
                                    serverInfo.sprintUnlimitedEnabled,
                                    serverInfo.assassinationEnabled
                                ]).draw();
                                serverCount++;
                                table.columns.adjust().draw();
                                fillGameCard(serverInfo.serverId);
                                if(rePing) {
                                    console.log("repinging "+serverInfo.serverIP);
                                    pingMe(serverInfo.serverIP, $("#serverTable").DataTable().column(0).data().length-1, 200); 
                                }
                            } else {
                                console.log(serverInfo.serverIP + " is glitched");
                            }
                        } else {
                            console.log(serverInfo.serverIP + " is hacked (maxPlayers over 16)");
                        }
                    });
                  }, (i * pingDelay));  
                })(i, serverIP);
            } else {
                console.log(serverIP + " is invalid, skipping.");
            }
        }
        
    });
}

function joinServer(i) {
    if(dewRconConnected) {
        if(serverList.servers[i].numPlayers < serverList.servers[i].maxPlayers) {
            if(serverList.servers[i].eldewritoVersion === gameVersion) {
                if(hasMap(serverList.servers[i].mapFile)) {
                    if(friendServerConnected && (serverList.servers[i].maxPlayers - serverList.servers[i].numPlayers) < party.length) {
                        swal("Party Too Large","You have too many people in your party to join this game.", "error");
                    } else {
                        ga('send', 'event', 'serverlist', 'connect');
                        if(serverList.servers[i].passworded) {
                            swal({   
                                title: "Private Server", text: "Please enter password",   
                                type: "input", inputType: "password", showCancelButton: true, closeOnConfirm: false,
                                inputPlaceholder: "Password goes here" 
                            }, 
                            function(inputValue) {
                                if (inputValue === false) return false;      
                                if (inputValue === "") {     
                                    sweetAlert.showInputError("Passwords are never blank");     
                                    return false   
                                } else {
                                    dewRcon.send('connect ' + serverList.servers[i].serverIP + ' ' + inputValue, function(res) {
                                        if (res.length > 0) {
                                            if (res != "Command/Variable not found") {
                                                if (res === "Incorrect password specified.") {
                                                    sweetAlert.showInputError(res);
                                                    return false
                                                } else if (res.startsWith("Attempting connection to ")){
                                                    if (friendServerConnected && party.length > 1) {
                                                        partyConnect(serverList.servers[i].serverIP, inputValue);
                                                    } else {
                                                        closeBrowser();
                                                    }
                                                    sweetAlert.close();
                                                } 
                                            }
                                        }
                                    });
                                }
                            });
                        } else {
                            dewRcon.send('connect ' + serverList.servers[i].serverIP, function(res) {
                                if (res.length > 0) {
                                    console.log(res);
                                    if (res.startsWith("Attempting connection to ")){
                                        if (friendServerConnected && party.length > 1) {
                                            partyConnect(serverList.servers[i].serverIP, null);
                                        } else {
                                            closeBrowser();
                                        }
                                    }
                                }
                            });
                        }
                    }
                } else {    
                    swal({
                        title: "Map File Missing",
                        text: "You do not have the required 3rd party map.<br /><br />Please check reddit.com/r/HaloOnline for the applicable mod.", 
                        type: "error"
                    });
                }
            } else {
                swal({
                    title: "Version Mismatch", 
                    text: "Host running different version.<br /> Unable to join.", 
                    type: "error"
                });
            }
        } else {
            swal("Full Game", "Game is full or unavailable.", "error");
        }
    } else {
        swal({
        title: "Communication Error", 
        text: "Unable to connect to Eldewrito.<br /><br />Please restart game and try again.", 
        type: "error"
        });        
    }
}

function pingMe(ip, rowNum, delay) {
    setTimeout(function() { 
        var startTime = Date.now();
        var endTime;
        var ping;
        var pingDisplay
        $.ajax({
            type: "GET",
            url: "http://" + ip + "/",
            async: true,
            timeout: 1000,
            success: function() {
                endTime = Date.now();
                ping = Math.round((endTime - startTime) * .45);
                if (ping > 0 && ping <= 100) {
                    pingDisplay = ping+":3";
                }   else if(ping > 100 && ping <= 200) {
                    pingDisplay = ping+":2";
                }   else if(ping > 200 && ping <= 500) {
                    pingDisplay = ping+":1";  
                }   else {
                    pingDisplay = ping+":0";
                }
                $('#serverTable').dataTable().fnUpdate(pingDisplay, rowNum, 5);
                $('#serverTable').dataTable().fnUpdate(ping, rowNum, 6);
                $('#serverTable').DataTable().columns.adjust().draw();
            }
        });
    }, delay);   
}

function fillGameCard(i) {
    var html = serverTemplate(serverList.servers[i]);
    $("#gamecard").html(html);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function unique(list) {
  var result = [];
  $.each(list, function(i, e) {
    if ($.inArray(e, result) == -1) result.push(e);
  });
  return result;
}

function refreshTable() {
    //Throttle refresh so people can't spam and break the count
    if (isThrottled) { return; }
    isThrottled = true;
    setTimeout(function () { isThrottled = false; }, throttleDuration);
    ga('send', 'event', 'serverlist', 'refresh-list');
    serverList = {
        servers: []
    };
    serverTable = [];
    serverCount = 0;
    playerCount = 0;
    $('.serverCount').html(serverCount + " servers");
    $('.playerCount').html(playerCount + " players");
    $('#serverTable').DataTable().clear(); 
    selectedID = 0;
    buildTable();
    if(dewRconConnected) {
        connectionTrigger();   
    }
}

function quickMatch() {
    bestFrac = 0;
    bestPing = 1000000;
    var possibleServers = $('#serverTable').DataTable().rows( function (index, data, node){
        if (data[2] != ""){
            //console.log("Removing for private: " + data);
            return false;   //Remove private servers
        }
        if (1.0*eval(data[13]) == 1){
            //console.log("Removing for full: " + data);
            return false;       //Remove full servers
        }
        if (friendServerConnected && (serverList.servers[index].maxPlayers - serverList.servers[index].numPlayers) < party.length){
            //console.log("Removing for party: " + data);
            return false;   //Remove servers without enough space for your party
        }
        if (eval(data[13]) < bestFrac){
            //console.log("Removing for frac: " + data);
            return false;   //Better player fraction available
        }
        if (eval(data[13]) == bestFrac && data[6] > bestPing){
            /*console.log("Removing for ping: " + data);
            console.log(bestPing + " | " + data[6]);
            console.log(bestFrac + " | " + data[13]);*/
            return false;   //Better ping available
        }
        bestFrac = eval(data[13]);
        bestPing = data[6];
        /*console.log(data);
        console.log(bestFrac);
        console.log(bestPing);*/
        return true;
  }
    ).order([13, 'fracDesc']).draw().data();
    //console.log(possibleServers[possibleServers.length-1][0]);
    joinServer(possibleServers[possibleServers.length-1][0]);
}

function switchBrowser(browser) {
    swal({   
        title: "Change Server Browser",   
        text: "Would you like to change your default server browser to "+browser+"?",   
        showCancelButton: true,   
        confirmButtonText: "Yes, change it!",   
        closeOnConfirm: false   
    }, function() {        
        if (browser == "theFeelTrain") {
            var browserURL = "http://halo.thefeeltra.in/";
            ga('send', 'event', 'change-menu', 'thefeeltrain');

        } else if (browser == "DewMenu") {
            var browserURL = "http://dewmenu.click/";
            ga('send', 'event', 'change-menu', 'dewmenu');
        }
        setTimeout(function() {
            dewRcon.send('game.menuurl ' + browserURL);
            dewRcon.send('writeconfig');
        }, "1000");  
        sweetAlert.close();
    });
}

function checkUpdate(ver) {
    if (EDVersion == 0) {
        setTimeout(function() {
            checkUpdate(ver);
        }, "500");  
    } else {
        ga('send', 'event', 'version', ver);
        if (ver != EDVersion) {

            swal({   
                title: "Version Outdated!",
                text: "In order to sort out prevalent issues, version " + EDVersion + " has been released.<br /><br />Please see reddit.com/r/HaloOnline for more info.",
                type: "error", allowEscapeKey: false
            });
        }
    }
}

function hasMap(map) {
    if(mapList[0].length == 0) {
        return true;
    } else if($.inArray(map, mapList[0]) > -1) {
        return true;
    } else {
        return false;
    }
}

function closeBrowser() {
    ga('send', 'event', 'close-menu');
    if(dewRconConnected) {
        setTimeout(function() {
            dewRcon.send('menu.show');
            dewRcon.send('Game.SetMenuEnabled 0');
        }, "1000");
    } else{
        window.close();
    }
}

String.prototype.contains = function(it) {
    return this.indexOf(it) != -1;
};

function CheckPageFocus() {
  //var info = document.getElementById("message");

  if ( document.hasFocus() ) {
    pageFocus = true;
  } else {
    pageFocus = false;
  }
}

function mapMatch(thing, mapFile) {
    if (thing.src.contains("_ver")){
        thing.src='images/maps/' + mapFile.toLowerCase().split("_ver")[0] + '.png';
    } else {
        thing.src='images/maps/unknown.png';
    }
}

function noSTEAMLockout(){
    swal({   
        title: "noSTEAM Release Detected",
        text: "We have detected that you are using the nosTEAM release of Halo Online.<br/><br />We would appreciate if you downloaded an official Eldewrito release (which is also free).<br/><br/>Please see http://redd.it/423you for more info.",
        type: "error", allowEscapeKey: false, showConfirmButton: false, allowOutsideClick: false
    });
}

function howToServe(){
    swal({   
        title: "How to Host a Server",
        text: 
        "Hosting a server requires UDP ports 9987 & 11774 and TCP port 11775 to be forwarded on your router to your server's private IP address.<br/>"+
        "Please refer to the following online guide for detailed instructions on how to do so.<br/>"+
        "<a href='http://www.howtogeek.com/66214/how-to-forward-ports-on-your-router/' target='_blank'>http://www.howtogeek.com/66214/how-to-forward-ports-on-your-router/</a><br/><br/>"+
        "Then open the game and select 'Multiplayer' or 'Forge', change the network type to 'Online', and select 'Host Game'.",
        width: "1000", customClass: "howToServeWindow", imageUrl: "images/eldorito.png", imageWidth: "102", imageHeight: "88"
    });
}

function toggleScoreboard(){
    if (!scoreBoardVisible){
        $('#scoreBoardHeader').text("Scoreboard (-)"); 
        scoreBoardVisible = true;
    } else{
        $('#scoreBoardHeader').text("Scoreboard (+)");
        scoreBoardVisible = false;    
    }
     $('.statBreakdown').toggle('blind', 500); 
}


//==================================
//===== Friendserver Functions =====
//==================================

function partyConnect(ip, pass) {
    if (party[0].split(':')[1] == puid) {
        if(party.length > 1){
            for (var p = 0; p < party.length; p++ ) {
                if (party[p].split(':')[1] != puid) {
                    friendServer.send(JSON.stringify({
                        type: 'connect',
                        guid: party[p].split(':')[1],
                        address: ip,
                        password: pass
                    }));
                }
            }
        }
    }
}

function loadOnline() {
    $('#allOnline').empty();
    if(onlinePlayers.length > 0) {
        for(var i=0; i < onlinePlayers.length; i++) {
            if($.inArray(onlinePlayers[i], party) == -1){
                if (onlinePlayers[i].split(":")[1] != "not" && onlinePlayers[i].split(":")[0].length > 0 && onlinePlayers[i].split(":")[1].length > 0){
                    $('<div>', {
                        class: 'friend',
                        text: onlinePlayers[i].split(":")[0],
                        'data-pid': onlinePlayers[i].split(":")[1]
                    }).appendTo('#allOnline');
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
                sendPartyMessage(text);
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

//============================
//===== dewRcon triggers =====
//============================

function connectionTrigger() {
    if(!friendServerConnected) {
        setTimeout(StartConnection, 2000);
    }
    $('.closeButton').show();
    $('#serverTable_filter').css("right","-160px");
    loadSettings(0);
}

var settingsToLoad = [['mapList', 'game.listmaps'],['gameVersion', 'game.version'],['pname', 'player.name'],['puid', 'player.printUID'],['color', 'Player.Colors.Primary']];
function loadSettings(i){
	if (i != settingsToLoad.length) {
		dewRcon.send(settingsToLoad[i][1], function(response) {
			if(settingsToLoad[i][1].contains("listmaps")){
				window[settingsToLoad[i][0]] = [[]];
				mapList = new Array(response.split(','));
			} else if(settingsToLoad[i][1].contains("printUID")){
				window[settingsToLoad[i][0]] = response.split(' ')[2];
			} else {
				window[settingsToLoad[i][0]] = response;
			}
			i++;
			loadSettings(i);
		});
	} else {
        checkUpdate(gameVersion);
        $('#serverTable').dataTable().fnFilter( gameVersion, 15 );
	}
}

function disconnectTrigger() {
    $('.closeButton').hide();
    $('#serverTable_filter').css("right","-264px");
}

//==============================
//===== Keyboard functions =====
//==============================

Mousetrap.bind('f11', function() {
    closeBrowser();
});

//=============================
//===== Gamepad functions =====
//=============================

function updateSelection() {
    $('#serverTable tbody tr.selected').removeClass('selected');
    $("#serverTable tbody tr:eq(" + selectedID + ")").addClass("selected");
    var row = $('#serverTable').dataTable().fnGetData($("#serverTable tbody tr:eq(" + selectedID + ")"));
    fillGameCard(row[0]);
}

function joinSelected() {
    var row = $('#serverTable').dataTable().fnGetData($("#serverTable tbody tr:eq(" + selectedID + ")"));
    joinServer(row[0]);
}

var gamepad = new Gamepad();

gamepad.bind(Gamepad.Event.CONNECTED, function(device) {
    //console.log("a new gamepad connected");
    setTimeout(function() {
        $('.controllerButton').show();
        updateSelection();
        controllersOn = true;
    }, "400");
});

gamepad.bind(Gamepad.Event.DISCONNECTED, function(device) {
    //console.log("gamepad disconnected");
    $('.controllerButton').hide();
    $('#serverTable tr.selected').removeClass('selected');
    controllersOn = false;
});

gamepad.bind(Gamepad.Event.UNSUPPORTED, function(device) {
    //console.log("an unsupported gamepad connected (add new mapping)");
});

gamepad.bind(Gamepad.Event.BUTTON_DOWN, function(e) {
    if (pageFocus) {
        if (controllersOn) {
            //console.log(e.control + " of gamepad " + e.gamepad + " pressed down");
            if (e.control == "FACE_1") {
                //console.log("A");
                if($('.sweet-overlay').is(':visible')) {
                    sweetAlert.close();   
                } else {
                    joinSelected();
                }
            } else if (e.control == "FACE_2") {
                //console.log("B");
                sweetAlert.close();   
            } else if (e.control == "FACE_3") {
                //console.log("X");
            } else if (e.control == "FACE_4") {
               //console.log("Y");
               window.location.reload();
            } else if (e.control == "DPAD_UP") {
                //console.log("UP");
                if (selectedID > 0) {
                    selectedID--;
                    updateSelection();
                }
            } else if (e.control == "DPAD_DOWN") {
                //console.log("DOWN");
                if (selectedID < ($("#serverTable tbody tr").length-1)) {
                    selectedID++;
                    updateSelection();
                }
            } else if (e.control == "DPAD_LEFT") {
                //console.log("LEFT");
            } else if (e.control == "DPAD_RIGHT") {
                //console.log("RIGHT");
            } else if (e.control == "SELECT_BACK") {
                //console.log("BACK");
                closeBrowser();
            } else if (e.control == "START_FORWARD") {
                //console.log("START");
            } else if (e.control == "RIGHT_TOP_SHOULDER") {
                //console.log("RIGHT BUMPER");        
            } else if (e.control == "LEFT_TOP_SHOULDER") {
                //console.log("LEFT BUMPER");
            } else if (e.control == "LEFT_STICK") {
                //console.log("LEFT STICK");
            }          
        }
    }
});

if (!gamepad.init()) {
}

//==========================
//==== Datatable Sorts =====
//==========================

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "ip-address-pre": function ( a ) {
        var m = a.split("."), x = "";
 
        for(var i = 0; i < m.length; i++) {
            var item = m[i];
            if(item.length == 1) {
                x += "00" + item;
            } else if(item.length == 2) {
                x += "0" + item;
            } else {
                x += item;
            }
        }
        return x;
    },
 
    "ip-address-asc": function ( a, b ) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },
 
    "ip-address-desc": function ( a, b ) {
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
});

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "playerCount-pre": function ( a ) {
        var pCount = a.split('/');
        return (pCount[0]) * 1;
    },

    "playerCount-asc": function ( a, b ) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },

    "playerCount-desc": function ( a, b ) {
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    },
    
    "playerCount-fracAsc": function ( c, d ) {
        var a = c;
        var b = d;
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },

    "playerCount-fracDesc": function ( c, d ) {
        var a = c;
        var b = d;
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
});

//===========================
//==== Handlebar Helpers ====
//===========================

Handlebars.registerHelper('eachByScore', function(context,options) {
    var output = '';
    var contextSorted = context.concat()
        .sort( function(a,b) { return b.score - a.score });
    for(var i=0, j=contextSorted.length; i<j; i++) {
        output += options.fn(contextSorted[i]);
    }
    return output;
});

Handlebars.registerHelper('ifCond', function(v1, v2, options) {
    if(v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('capitalize', function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}, 'string');
  
Handlebars.registerHelper('lowerCase', function(str) {
    return new Handlebars.SafeString(str.toLowerCase());
});

Handlebars.registerHelper('trimString', function(passedString, startstring, endstring) {
   var theString = passedString.substring( startstring, endstring );
   return new Handlebars.SafeString(theString)
});

Handlebars.registerHelper('scoreBoardPlus', function(str) {
    ret = "";
    if(scoreBoardVisible){
        ret = "(-)";
    } else {
        ret = "(+)" 
    }
    return ret;
});

Handlebars.registerHelper('scoreBoardHidden', function(str) {
    ret = "";
    if(scoreBoardVisible){
        ret = "display:table;";
    } else{
        ret = "display:none;";        
    }
    return ret;
});