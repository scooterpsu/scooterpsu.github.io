var zoomAmount;
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
var selectedID = 0;
var lastArray = [];
var dewConnected = false;
var hasGP = false;
var axisThreshold = .5;
var stickTicks = { left: 0, right: 0, up: 0, down: 0 };
var repGP;
var lastHeldUpdated = 0;
var VerifyIPRegex = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)(?:\:(?:\d|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;

var dewritoURL = "https://raw.githubusercontent.com/ElDewrito/ElDorito/master/dist/dewrito.json";
swal.setDefaults({
    customClass: "alertWindow",
    html: true
})
$(document).ready(function() {
    $(document).keyup(function (e) {
        if (e.keyCode === 27) {
            dew.hide();
        }
    });
    initTable();
    $.getScript( "dew://lib/dew.js" )
    .done(function() {
        dewConnected = true;
        dew.getVersion().then(function (version) {
            gameVersion = version;
            checkUpdate(gameVersion);
            $('#serverTable').dataTable().fnFilter(gameVersion, 15 );
        });
        dew.command('Game.ListMaps', {}).then(function(response) {
            mapList = new Array(response.split(','));
        });
        $("body").css("background-color", "transparent");
        dew.on("show", function (event) {
            refreshTable();
            dew.command('Settings.Gamepad', {}).then(function(result){
                if(result == 1){
                    onControllerConnect();
                    hasGP = true;
                    repGP = window.setInterval(checkGamepad,1000/60);
                }else{
                    onControllerDisconnect();
                    hasGP = false;
                    if(repGP){
                        window.clearInterval(repGP);
                    }
                }
            });
        });
        dew.on('hide', function(e){
            if(repGP){
                window.clearInterval(repGP);
            }
            sweetAlert.close();
        });
        dew.on("pong", function (event) {
            setPing(event.data.address, event.data.latency);
        });
        dew.on("serverconnect", function (event) {
            if(event.data.success){
                closeBrowser();
            }else{
                swal({
                    title: "Joining Game",
                    text: "Attempting to join selected game...", 
                    imageUrl: "images/eldorito.png"
                });
            }
        });
        dew.on('controllerinput', function(e){       
            if(hasGP){
                if(e.data.A == 1){
                    if($('.sweet-overlay').is(':visible')) {
                        sweetAlert.close();   
                    } else {
                        joinSelected();
                    }
                }
                if(e.data.B == 1){
                    if($('.sweet-overlay').is(':visible')) {
                        sweetAlert.close();  
                    } else {        
                        toggleScoreboard(); 
                    }
                }
                if(e.data.X == 1){
                    quickMatch();
                }
                if(e.data.Y == 1){
                    refreshTable();
                }
                if(e.data.Up == 1){
                    if (selectedID > 0) {
                        selectedID--;
                        updateSelection();
                    }
                }
                if(e.data.Down == 1){
                    if (selectedID < ($("#serverTable tbody tr").length-1)) {
                        selectedID++;
                        updateSelection();
                    }  
                }
                if(e.data.Select == 1){
                    closeBrowser();
                }
                if(e.data.AxisLeftX != 0){
                    if(e.data.AxisLeftX > axisThreshold){
                        stickTicks.right++;
                    };
                    if(e.data.AxisLeftX < -axisThreshold){
                        stickTicks.left++;
                    };
                }else{
                    stickTicks.right = 0;
                    stickTicks.left = 0;
                }
                if(e.data.AxisLeftY != 0){
                    if(e.data.AxisLeftY > axisThreshold){
                        stickTicks.up++;
                    };
                    if(e.data.AxisLeftY < -axisThreshold){
                        stickTicks.down++;
                    };
                }else{
                    stickTicks.up = 0;
                    stickTicks.down = 0;               
                }
            }
        });
    })
    .fail(function() {
        $.ajax({
            url: dewritoURL,
            error: function()
            {
               console.log("dewrito.json error, using backup");
               dewritoURL = "http://scooterpsu.github.io/dewrito.json";
               buildList();
            },
            success: function()
            {
                buildList();
            }
        });               
    });
    getCurrentRelease();
    if(typeof(Storage) !== "undefined") {
        if(localStorage.getItem("zoom") !== null){
            zoomAmount = localStorage.getItem("zoom");
            $('#zoomBox').css("zoom", zoomAmount );	      
        }      
    }
    $("#zoomSlider").slider({
        value:zoomAmount,
        min: 0.5,
        max: 2,
        step: 0.05,
        slide: function( event, ui ) {
            adjustResolution( ui.value );
        }
    });
    $(document).on('click','#scoreBoardHeader',function(){
        toggleScoreboard();
    });
    $("#settingsWindow").draggable({
        handle: "#settingsHeader"
    });
    $('#backgroundFrame').on('click', function(){
        unorderList();
    });
});

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

/* Sets zoom level to specified value or reset if not specified */
function adjustResolution(newZoom) {
    if (!newZoom) { newZoom = 1; }
    var percentage = newZoom * 100;
    $('#zoomSlider .ui-slider-handle').text( percentage.toFixed(0) );
    zoomAmount = newZoom;
    localStorage.setItem("zoom", newZoom);
    $('#zoomBox').stop().animate({zoom: newZoom}, 500, function() {
        $('#serverTable').DataTable().draw(); 
    });
    $( "#zoomSlider" ).slider({ value:newZoom });
}

function getCurrentRelease() {
    var fgjkfld = $.getJSON( "http://eldewrito.anvilonline.net/update.json", null)
    .done(function( data ) {
        EDVersion = Object.keys(data)[0];
    })
}

var clickDelay = 300;
var isDelayed = false;           
function initTable() {   
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
        bInfo: false,
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
            }, "aTargets":[ 5 ]},
            { "mRender": function (data, type, row) {
                img_str="";
                if(data){
                    img_str = '<img class="flag" src="images/flags/' + data + '.png"/>';
                } 
                return img_str;
            }, "aTargets":[ 2 ]}
        ],
        columns: [
            { title: "ID", visible: false},
            { title: "IP", visible: false},
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
            { title: "IsFull", visible: false},
            { title: "Version", visible: false},
            { title: "IPnoPort", visible: false}
        ],
        "order": [[ 0, "asc" ]],
        "language": {
            "emptyTable": "No servers found",
            "zeroRecords": "No matching servers found",
            "infoEmpty": "No servers found",
            "info": "Showing servers _START_ to _END_ of _TOTAL_",
            "lengthMenu": "Show _MENU_ servers"
        },
        "drawCallback": function(settings) {
            if(settings.aoRowCreatedCallback){
                if($('#serverTable tbody tr').length == 1 && !$('.dataTables_empty').length) {  
                    var row = $('#serverTable').dataTable().fnGetData($("#serverTable tbody tr:eq(0)"));
                    if(row){
                        fillGameCard(row[0]);
                    }
                    if(hasGP && !$('.selected').length){
                        selectedID = 0;
                        updateSelection(0);
                    }
                }
            }
        }
    });
    $('#searchBox').keyup(function(){
        table.search($(this).val()).draw() ;
    });
    $('#serverTable').on('search.dt', function(){
        if($('#serverTable').find('tbody tr td').not('.dataTables_empty').length>0) {
            $('#gamecard').show();
        }else{
            $('#gamecard').hide();
        }
    });
}
    
function buildList() {
    var master_servers = [];
    var entire_server_list = [];
    var mshxr = $.getJSON(dewritoURL)
    .done(function( data ) {
        for (var i = 0; i<data.masterServers.length; i++){
            window.master_length = data.masterServers.length;
            var jqhxr = $.ajax({
            url: data.masterServers[i].list, 
                type: 'GET',
                datatype: 'json'
            })
            .done(function( data ) {
                if(data.result.servers){
                    var server_list = [];
                    for(var ii = 0; ii < data.result.servers.length; ii++) {
                        if (!(data.result.servers[ii] in server_list)) {
                            server_list.push(data.result.servers[ii]);
                        }
                    }
                }
                new_server_list = server_list.filter( function( el ) {
                  return entire_server_list.indexOf( el ) < 0;
                });
                entire_server_list.push.apply(entire_server_list, new_server_list);
                buildTable(new_server_list);
            });
        }
    });
}

function buildTable(server_list){
    var table = $('#serverTable').DataTable();
    if(!dewConnected){
        var pingDelay = 120;
    }else{
        var pingDelay = 10;
    }
    for (var i = 0; i < server_list.length; i++){
        serverIP = server_list[i];
        if(VerifyIPRegex.test(serverIP)) {
            serverList.servers.push({serverIP, i});
            (function(i, serverIP) {
                setTimeout(function() {
                var startTime = Date.now();
                var endTime;
                var ping = 0;
                var pingDisplay = "0:0";
                var rePing = false;
                var jqhrxServerInfo = $.getJSON("http://" + serverIP, null )
                .done(function(serverInfo) {
                    if(!dewConnected){
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
                    }
                    serverInfo["serverId"] = i;
                    serverInfo["serverIP"] = serverIP;
                    if (serverInfo.maxPlayers <= 16 ) {
                        if(serverInfo.map.length > 0) { //blank map means glitched server entry
                            for (var j = 0; j < serverList.servers.length; j++) {
                                if (serverList.servers[j]["i"] == i) {
                                    serverList.servers[j] = serverInfo;
                                    if(serverInfo.eldewritoVersion == gameVersion || gameVersion == 0){
                                    	playerCount+=parseInt(serverInfo.numPlayers);
                                    }
                                }
                            }
                            var locked;
                            if(!serverInfo.hasOwnProperty("passworded")) {
                                locked = false;
                                if(serverInfo.eldewritoVersion == gameVersion || gameVersion == 0){
                                    var openSlots = serverInfo.maxPlayers - serverInfo.numPlayers;
                                    totalSlotCount += serverInfo.maxPlayers;
                                    openSlotCount += openSlots;
                                    $(".serverPool").attr('value', openSlotCount);
                                    $(".serverPool").attr('max', totalSlotCount);
                                }
                            } else {
                                locked = true;
                                serverInfo["passworded"] = "lock";
                            };
                            var isFull = "full";
                            if((parseInt(serverInfo.maxPlayers)-parseInt(serverInfo.numPlayers))>0) {
                                isFull = "open";
                            }
                            if(!serverInfo.variantType || serverInfo.variantType == "none"){
                                serverInfo.variantType = "Slayer"
                            }
                            table.row.add([
                                serverInfo.serverId,
                                serverInfo.serverIP,
                                serverInfo.passworded,
                                escapeHtml(serverInfo.name),
                                escapeHtml(serverInfo.hostPlayer),
                                pingDisplay,
                                ping,
                                escapeHtml(serverInfo.map),
                                escapeHtml(serverInfo.mapFile),
                                capitalize(escapeHtml(serverInfo.variantType)),
                                capitalize(escapeHtml(serverInfo.variant)),
                                serverInfo.status,
                                parseInt(serverInfo.numPlayers),
                                parseInt(serverInfo.numPlayers) + "/" + parseInt(serverInfo.maxPlayers),
                                isFull,
                                serverInfo.eldewritoVersion,
                                serverInfo.serverIP.split(":")[0],
                                serverInfo.sprintEnabled,
                                serverInfo.sprintUnlimitedEnabled,
                                serverInfo.assassinationEnabled
                            ]).draw();
                             if(serverInfo.eldewritoVersion == gameVersion || gameVersion == 0){
                                serverCount++;
                            }
                            table.columns.adjust().draw();
                            //fillGameCard(serverInfo.serverId);
                            if(!dewConnected){
                                if(rePing) {
                                    console.log("repinging "+serverInfo.serverIP);
                                    pingMe(serverInfo.serverIP, $("#serverTable").DataTable().column(0).data().length-1, 200); 
                                }
                            } else {
                                dew.ping(serverInfo.serverIP.split(":")[0]);
                            }
                            if(!locked){
                                getFlag(serverIP,$("#serverTable").DataTable().column(0).data().length-1);
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
}

function joinServer(i) {
    if(dewConnected) {
        if(serverList.servers[i].numPlayers < serverList.servers[i].maxPlayers) {
            if(hasMap(serverList.servers[i].mapFile)) {
                    ga('send', 'event', 'serverlist', 'connect');
                    if(serverList.servers[i].passworded) {
                        swal({   
                            title: "Private Server", text: "Please enter password",   
                            type: "input", inputType: "password", showCancelButton: true, closeOnConfirm: false,
                            inputPlaceholder: "Password goes here",
                            imageUrl: "images/eldorito.png", imageWidth: "102", imageHeight: "88"
                        }, 
                        function(inputValue) {
                            if (inputValue === false) return false;      
                            if (inputValue === "") {     
                                sweetAlert.showInputError("Passwords are never blank");     
                                return false   
                            } else {
                                dew.command('connect ' + serverList.servers[i].serverIP + ' ' + inputValue, function(res) {
                                    sweetAlert.close();
                                }).catch(function (error) {
                                    sweetAlert.showInputError(error.message);
                                    return false
                                });
                            }
                        });
                    } else {
                        dew.command('connect ' + serverList.servers[i].serverIP, function(res) {
                        }).catch(function (error) {
                            swal({
                                title: error.name, 
                                text: error.message, 
                                type: "error"
                            });
                        });
                    }
                } else {    
                    swal({
                        title: "Map File Missing",
                        text: "You do not have the required 3rd party map.<br /><br />Please check reddit.com/r/HaloOnline for the applicable mod.", 
                        type: "error"
                    });
                }
        } else {
            swal("Full Game", "Game is full or unavailable.", "error");
        }
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

function setPing(ip, ping){
    var matchingLines = $('#serverTable').dataTable().fnFindCellRowIndexes( ip, 16 );
    for (i = 0; i < matchingLines.length; i++) { 
        var pingDisplay;
        if (ping > 0 && ping <= 100) {
            pingDisplay = ping+":3";
        }   else if(ping > 100 && ping <= 200) {
            pingDisplay = ping+":2";
        }   else if(ping > 200 && ping <= 500) {
            pingDisplay = ping+":1";  
        }   else {
            pingDisplay = ping+":0";
        }
        $('#serverTable').dataTable().fnUpdate(pingDisplay, matchingLines[i], 5);
        $('#serverTable').dataTable().fnUpdate(ping, matchingLines[i], 6);
        $('#serverTable').DataTable().columns.adjust().draw();
    }
}

function fillGameCard(i) {
    serverList.servers[i].hostPlayer = escapeHtml(serverList.servers[i].hostPlayer)
    serverList.servers[i].name = escapeHtml(serverList.servers[i].name);
    serverList.servers[i].map = escapeHtml(serverList.servers[i].map)
    serverList.servers[i].mapFile = escapeHtml(serverList.servers[i].mapFile);
    serverList.servers[i].variant = escapeHtml(serverList.servers[i].variant)
    serverList.servers[i].variantType = escapeHtml(serverList.servers[i].variantType);
    var html = serverTemplate(serverList.servers[i]);
    $("#gamecard").html(html);
}

var blamList = [];
$.getJSON("https://scooterpsu.github.io/blamList/blamList.json", function(json) {
    blamList = json.words;
})

function escapeHtml(str) {
    if(str){
        var div = document.createElement('div');
        var fixedText = div.appendChild(document.createTextNode(str)).textContent;   
        fixedText = fixedText.replace(/[^\x00-\x7F]/g, ""); //ASCII Only
        for (var i = 0; i < blamList.length; i++) {
            fixedText = fixedText.replace(new RegExp(blamList[i], "ig"), "BLAM!").replace(/\</g,"&lt;").replace(/\>/g,"&gt;").replace(/&#x3C;/g,'&lt;').replace(/&#x3E;/g,'&gt;');
        }
        return fixedText.trim();
    } else {
        return "None";
    }
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getFlag(ip, rowNum){
    var ipSplit = ip.split(":")[0];
    $.getJSON("http://ip-api.com/json/"+ipSplit, function(json) {
        $('#serverTable').dataTable().fnUpdate(json.countryCode.toLowerCase(), rowNum, 2);        
    })
}

function refreshTable() {
    //Throttle refresh so people can't spam and break the count
    if (isThrottled) { return; }
    isThrottled = true;
    var throttle;
    if(dewConnected){
        throttleDuration = 5000;
    }
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
    buildList();
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
        confirmButtontext: "Yes, change it!",   
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
    if(dewConnected) {
        dew.hide();
    } 
}

function unorderList(){
    var table = $('#serverTable').DataTable();
    table.order([0, 'asc']).draw();
}

String.prototype.contains = function(it) {
    return this.indexOf(it) != -1;
};

function mapMatch(thing, mapFile) {
    if (thing.src.contains("_ver")){
        thing.src='images/maps/' + mapFile.toLowerCase().split("_ver")[0] + '.png';
    } else {
        thing.src='images/maps/unknown.png';
    }
}

function howToServe(){
    var gamePort = 11774;
    var announcePort = 11775;
    var signalServerPort = 11777;
    if(dewConnected){
        dew.command('Server.GamePort', {}).then(function(x){
            dew.command('Server.Port', {}).then(function(y){
                dew.command('Server.SignalServerPort', {}).then(function(z){
                    gamePort = x;
                    announcePort = y;
                    signalServerPort = z;
                });
            });
        });
    }
    swal({   
        title: "How to Host a Server",
        text: 
        "Hosting a server requires UDP ports "+gamePort+" & "+signalServerPort+" and TCP port "+11775+" to be forwarded on your router to your server's private IP address.<br/>"+
        "Please refer to the following online guide for detailed instructions on how to do so.<br/>"+
        "<a href='http://www.howtogeek.com/66214/how-to-forward-ports-on-your-router/' target='_blank'>http://www.howtogeek.com/66214/how-to-forward-ports-on-your-router/</a><br/><br/>"+
        "Then open the game and select 'Multiplayer' or 'Forge', change the network type to 'Online', and select 'Host Game'.",
        width: "1000", customClass: "howToServeWindow", imageUrl: "images/eldorito.png", imageWidth: "102", imageHeight: "88", confirmButtonClass: "alertConfirm"
    });
}

//=============================
//===== Gamepad functions =====
//=============================

function updateSelection() {
    $('#serverTable tbody tr.selected').removeClass('selected');
    $("#serverTable tbody tr:eq(" + selectedID + ")").addClass("selected");
    var row = $('#serverTable').dataTable().fnGetData($("#serverTable tbody tr:eq(" + selectedID + ")"));
    if(row){
        fillGameCard(row[0]);
    }
        $(".dataTables_scrollBody tbody tr:eq(" + selectedID + ")")[0].scrollIntoView(false);
    dew.command('Game.PlaySound 0xAFE');
}

function joinSelected() {
    var row = $('#serverTable').dataTable().fnGetData($("#serverTable tbody tr:eq(" + selectedID + ")"));
    joinServer(row[0]);
    dew.command('Game.PlaySound 0x0B00'); 
}

function onControllerConnect(){
    dew.command('Game.IconSet', {}).then(function(controllerType){
        $('#xboxLabel').html('<img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_Y.png">Refresh List <img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_X.png">Quick Match <img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_A.png">Join Game <img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_B.png">Show Scoreboard <img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_Back.png">Close Browser');
    });
}

function onControllerDisconnect(){
    $('#xboxLabel').html('');
    $('#serverTable tbody tr.selected').removeClass('selected');
}

function checkGamepad(){
    var shouldUpdateHeld = false;
    if(Date.now() - lastHeldUpdated > 100) {
        shouldUpdateHeld = true;
        lastHeldUpdated = Date.now();
    }
    if(stickTicks.up == 1 || (shouldUpdateHeld && stickTicks.up > 25)){
        if (selectedID > 0) {
            selectedID--;
            updateSelection();
        }
    }
    if(stickTicks.down == 1 || (shouldUpdateHeld && stickTicks.down > 25)){
        if (selectedID < ($("#serverTable tbody tr").length-1)) {
            selectedID++;
            updateSelection();
        }  
    }
};

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

jQuery.fn.dataTableExt.oApi.fnFindCellRowIndexes = function ( oSettings, sSearch, iColumn ){
    var i,iLen, j, jLen, val, aOut = [], aData, columns = oSettings.aoColumns;
    for ( i=0, iLen=oSettings.aoData.length ; i<iLen ; i++ ){
        aData = oSettings.aoData[i]._aData;
        if ( iColumn === undefined ){
            for ( j=0, jLen=columns.length ; j<jLen ; j++ ){
                val = this.fnGetData(i, j);
                if ( val == sSearch ) {
                    aOut.push( i );
                }
            }
        }
        else if (this.fnGetData(i, iColumn) == sSearch ){
            aOut.push( i );
        }
    }
    return aOut;
};

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
