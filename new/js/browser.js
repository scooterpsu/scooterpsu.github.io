var zoomAmount;
var scoreBoardVisible = false;
var mapList = [[]];
var EDVersion = 0;
var serverList = {
servers: []
}; 
var serverTable = [];
var officialServers = [];
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
var controllerType = "360";
var axisThreshold = .5;
var stickTicks = { left: 0, right: 0, up: 0, down: 0 };
var repGP;
var lastHeldUpdated = 0;
var VerifyIPRegex = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)(?:\:(?:\d|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;
var pageVisible = false;
var stopTableBuilding = false

swal.setDefaults({
    customClass: "alertWindow",
    target: "#zoomBox",
    reverseButtons: true,
    imageWidth: "102", 
    imageHeight: "88",
    confirmButtonClass: "alertButton okButton",
    cancelButtonClass: "alertButton cancelButton",
    confirmButtonText: "<img class='button'>Ok",
    cancelButtonText: "<img class='button'>Cancel",
    onOpen: () => {
        if(hasGP){
            $('.okButton .button').attr('src','dew://assets/buttons/'+controllerType+'_A.png');
            $('.cancelButton .button').attr('src','dew://assets/buttons/'+controllerType+'_B.png');
            $('.button').show();
        }
    }
})
$(document).ready(function() {
    $(document).keyup(function (e) {
        if (e.keyCode === 27) {
            if(swal.isVisible()) {
                sweetAlert.close();  
            } else {        
                closeBrowser();
            }
        }
    });
    $(document).keydown(function (e) {
        if(e.keyCode == 38){ //Up
            upNav();
        }
        if(e.keyCode == 40){ //Down
            downNav();
        }
        if(e.keyCode == 13){ //Enter        
            joinSelected();
        }
        if(e.keyCode == 32 && !$('#searchBox').is(':focus')){ //Space  
            joinSelected();
        }
    });
    initTable();
    //getOfficial();
    $.getScript( "dew://lib/dew.js" )
    .done(function() {
        dewConnected = true;
        //Hopefully the only remote fix we need to push like this
        dew.command('Game.FPSLimiter 0');
        
        //Keep FirstRun set until we stop messing with the server browser
        dew.command('Game.FirstRun 1');
        window.location.href = 'http://rabidsquabbit.github.io/';
        dew.getVersion().then(function (version) {
            if(version.contains('-')){
                gameVersion = version.split('-')[0];
            }else{
                gameVersion = version;
            }
            $('#serverTable').dataTable().fnFilter(gameVersion, 17 );
        });
        dew.command('Game.ListMaps', {}).then(function(response) {
            mapList = new Array(response.split(','));
        });
        $("body").css("background-color", "transparent");
        dew.on("show", function (event) {
            pageVisible = true;
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
            dew.command('game.hideh3ui 1');
        });
        dew.on('hide', function(e){
            stopTableBuild();
            pageVisible = false;
            if(repGP){
                window.clearInterval(repGP);
            }
            sweetAlert.close();
            dew.command('game.hideh3ui 0');
        });
        dew.on("pong", function (event) {
            setPing(event.data.address, event.data.latency);
        });
        dew.on("serverconnect", function (event) {
            if(pageVisible){
                if(event.data.success){
                    closeBrowser();
                }else{
                    swal({
                        title: "Joining Game",
                        text: "Attempting to join selected game...", 
                        imageUrl: "images/eldorito.png"
                    });
                }
            }
        });
        dew.on('controllerinput', function(e){       
            if(hasGP){
                if(e.data.A == 1){
                    if(swal.isVisible()) {
                        sweetAlert.close();   
                    } else {
                        joinSelected();
                    }
                }
                if(e.data.B == 1){
                    if(swal.isVisible()) {
                        sweetAlert.close();  
                    } else {        
                        closeBrowser();
                    }
                }
                if(e.data.X == 1){
                    quickMatch();
                }
                if(e.data.Y == 1){
                    refreshTable();
                }
                if(e.data.Up == 1){
                    upNav();
                }
                if(e.data.Down == 1){
                    downNav();
                }
                if(e.data.Select == 1){
                    toggleScoreboard(); 
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
        //initCachejson();
        initDewjson();     
    });
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

var URLIndex = 0;
var cacheJSONList = [
    "http://204.12.198.11/privateapi/getServers",
    "http://162.216.0.145/api/getServers"
];
var dewritoURLList = [
    "https://raw.githubusercontent.com/ElDewrito/ElDorito/master/dist/mods/dewrito.json",
    "http://scooterpsu.github.io/dewrito.json"
];

function initCachejson() {
    var cacheJSON = cacheJSONList[URLIndex];
    $.ajax({
        url: cacheJSON,
        error: function()
        {
           console.log("cache retrieval error, trying next source: "+cacheJSON);
           URLIndex += 1;
           if (cacheJSONList.length == URLIndex) {
               URLIndex = 0;
               initDewjson();
               return
           } else if (cacheJSONList.length-1<URLIndex) {
               URLIndex = 0;
           }
           initCachejson();
        },
        success: function(data){
           buildTable(data);
        },
        timeout: 10000
    });
}

function initDewjson() {
    var dewritoURL = dewritoURLList[URLIndex];
    $.ajax({
        url: dewritoURL,
        error: function()
        {
           console.log("dewrito.json error, trying next source: "+dewritoURL);
           URLIndex += 1;
           if (dewritoURLList.length-1<URLIndex) {
               URLIndex = 0;
           }
           initDewjson();
        },
        success: function()
        {
           buildList(dewritoURL);
        },
        timeout: 10000
    });
}

function buildList(dewritoURL) {
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
                oldBuildTable(new_server_list);
            });
        }
    });
}

function getOfficial(){
    $.ajax({
        url: 'http://new.halostats.click/api/officialservers',
        headers: { 'Accept': "application/json" },
        success: function(data){
            for(i = 0; i < data.length; i++){
                officialServers.push([data[i].address, data[i].ranked]);
            }
        }
    });
}

function checkOfficial(ip){
    $.grep(officialServers, function(result, index){
        if(result){
            if(result[0] == ip){
                var officialType = "social:Social Dedicated Server";
                if(result[1]){
                    officialType = "ranked:Ranked Dedicated Server";
                }
                var matchingLines = $('#serverTable').dataTable().fnFindCellRowIndexes( ip, 1 );
                $('#serverTable').dataTable().fnUpdate(officialType, matchingLines[0], 3, false, false);
                $('#serverTable').dataTable().fnUpdate(officialType, matchingLines[0], 4, false, false);
            }
        }
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
    var filter = true;
    var blamRegex = new RegExp(blamList.join("|"), "gi");
    var table = $('#serverTable').DataTable( {
        "createdRow": function( nRow, aData, iDisplayIndex ) {
            if(filter){
                //console.log('name:'+aData[5]+' host:'+aData[6]+' map:'+aData[9]+' variant:'+aData[12]);
                $('td:eq(2)', nRow).text( aData[5].replace(blamRegex, "BLAM!")); //Name
                $('td:eq(3)', nRow).text( aData[6].replace(blamRegex, "BLAM!")); //Host
                $('td:eq(5)', nRow).text( aData[9].replace(blamRegex, "BLAM!")); //Map
                $('td:eq(7)', nRow).text( aData[12].replace(blamRegex, "BLAM!")); //Variant
            }
            if(hasGP){
                updateSelection(false, false);
            }
            if(iDisplayIndex == 0){
                fillGameCard(aData[0]);
            }
            return nRow;
        },
        "preDrawCallback": function (settings) {
            pageScrollPos = $('div.dataTables_scrollBody').scrollTop();
        },
        "drawCallback": function (settings) {
            $('div.dataTables_scrollBody').scrollTop(pageScrollPos);
        },
        bPaginate: false,
        scrollY: "-webkit-calc(100% - 137px)",
        scroller: true,
        destroy: true,
        "iDisplayLength": 10,
        stateSave: false,
        bInfo: false,
        "lengthMenu": [[10, 15, 25, -1], [10, 15, 25, "All"]],
        columnDefs: [
            { type: 'ip-address', targets: 2 },
            { type: "playerCount", targets: 15 },
            { targets: [ 7 ], orderData: [ 8 ]},
            { "mRender": function (data, type, row) {
                img_str = '<img class="pingbars" src="images/' + data.split(':')[1] + 'bars.png"/>  '+ data.split(':')[0];
                return img_str;
            }, "aTargets":[ 7 ]},
            { "mRender": function (data, type, row) {
                img_str="";
                if(data){
                    img_str = '<div class="tooltip"><img class="serverIcon" src="images/' + data.split(':')[0] + '.png"/><span class="tooltiptext">' + data.split(':')[1] + '</span></div>';
                } 
                return img_str;
            }, "aTargets":[ 3 ]},
            { targets: [ 3 ], orderData: [ 4 ]},
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
            { title: "Type", "width": "1.5%"},
            { title: "TypeText", visible: false},
            { title: "Name", "width": "25%"},
            { title: "Host" },
            { title: "Ping", "width": "6%"},
            { title: "PingNum" , visible: false},           
            { title: "Map" },
            { title: "Map File", visible: false},
            { title: "Gametype"},
            { title: "Variant" },
            { title: "Status", visible: false},    
            { title: "Num Players", visible: false},  
            { title: "Players", "width": "0.5%"},
            { title: "IsFull", visible: false},
            { title: "Version", visible: false},
            { title: "IPnoPort", visible: false}
        ],
        "order": [[ 0, "asc" ]],
        "language": {
            "emptyTable": "<b>Loading...</b>",
            "zeroRecords": "No matching servers found",
            "infoEmpty": "No servers found",
            "info": "Showing servers _START_ to _END_ of _TOTAL_",
            "lengthMenu": "Show _MENU_ servers"
        }
    })
    table.column(7).visible(true);
    table.state.clear();
    table.search('').columns().search('').draw();
    $('#searchBox').keyup(function(){
        table.search($(this).val()).draw();
        if($('#serverTable').find('tbody tr td').not('.dataTables_empty').length>0) {
            $('#gamecard').show();
        }else{
            $('#gamecard').hide();
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
    for (var i = 0; i <= server_list.length; i++){
        if(i < server_list.length){
            serverIP = server_list[i].IP;
            serverList.servers.push({serverIP, i});
            var ping = 0;
            var pingDisplay = "0:0";
            var rePing = false;
            serverInfo = server_list[i].data;
            serverInfo["serverId"] = i;
            serverInfo["serverIP"] = serverIP;
            if (serverInfo.maxPlayers <= 16 ) {
                if(serverInfo.map.length > 0) { //blank map means glitched server entry
                    for (var j = 0; j < serverList.servers.length; j++) {
                        if (serverList.servers[j]["i"] == i) {
                            serverList.servers[j] = serverInfo;
                            if(serverInfo.eldewritoVersion.contains(gameVersion)|| gameVersion == 0){
                                playerCount+=parseInt(serverInfo.numPlayers);
                                serverCount++;
                            } 
                        }
                    }
                    var locked;
                    if(!serverInfo.hasOwnProperty("passworded")) {
                        locked = false;
                        if(serverInfo.eldewritoVersion.contains(gameVersion) || gameVersion == 0){
                            var openSlots = serverInfo.maxPlayers - serverInfo.numPlayers;
                            totalSlotCount += serverInfo.maxPlayers;
                            openSlotCount += openSlots;
                        }
                    } else {
                        locked = true;
                        serverInfo["passworded"] = "lock";
                    };
                    var serverType = "";
                    if(serverInfo.hasOwnProperty("isDedicated")){
                        if(serverInfo.isDedicated){
                            serverType = "dedicated:Dedicated Server";
                        }
                    }
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
                        serverType,
                        serverType,
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
                    if(serverInfo.eldewritoVersion.contains(gameVersion) || gameVersion == 0){
                        //fillGameCard(serverInfo.serverId);
                        if(dewConnected){
                            dew.ping(serverInfo.serverIP.split(":")[0], serverInfo.port);
                        }
                        //checkOfficial(serverInfo.serverIP);
                        /*if(!locked){
                            getFlag(serverIP,$("#serverTable").DataTable().column(0).data().length-1);
                        }*/
                    }
                } else {
                    //console.log(serverInfo.serverIP + " is glitched");
                }
            }
        }else{ //Stuff to run after the list is parsed
            var playerOut = playerCount + " players";
            var serverOut = serverCount + " servers";
            $('.playerCount').html(playerOut);
            $('.serverCount').html(serverOut);
            if (playerCount >= 420 && playerCount < 426) {
                $('.playerCount').css("color", "#007700");
            } else {
                $('.playerCount').css("color", "white");
            }
            $(".serverPool").attr('value', openSlotCount);
            $(".serverPool").attr('max', totalSlotCount);
        }
    }
}

function oldBuildTable(server_list){
    var table = $('#serverTable').DataTable();
    //if(!dewConnected){
        var pingDelay = 145;
    /*}else{
        var pingDelay = 10;
    }*/
    for (var i = 0; i < server_list.length; i++){
        serverIP = server_list[i];
        if(VerifyIPRegex.test(serverIP)) {
            serverList.servers.push({serverIP, i});
            (function(i, serverIP) {
                setTimeout(function() {
                if (stopTableBuilding) return;                    
                var startTime = Date.now();
                var endTime;
                var ping = 0;
                var pingDisplay = "0:0";
                var rePing = false;
                var jqhrxServerInfo = $.getJSON("http://" + serverIP, null )
                .done(function(serverInfo) {
                    //if(!dewConnected){
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
                    //}
                    serverInfo["serverId"] = i;
                    serverInfo["serverIP"] = serverIP;

                    if (stopTableBuilding) return;
                    
                    if (serverInfo.maxPlayers <= 16) {
                        if(serverInfo.map.length > 0) { //blank map means glitched server entry
                            for (var j = 0; j < serverList.servers.length; j++) {
                                if (serverList.servers[j]["i"] == i) {
                                    serverList.servers[j] = serverInfo;
                                    if(serverInfo.eldewritoVersion.contains(gameVersion) || gameVersion == 0){
                                        playerCount+=parseInt(serverInfo.numPlayers);
                                        var playerOut = playerCount + " players";
                                        var serverOut = serverCount + " servers";
                                        $('.playerCount').html(playerOut);
                                        $('.serverCount').html(serverOut);
                                    }                                  
                                }
                            }
                            var locked;
                            if(!serverInfo.hasOwnProperty("passworded")) {
                                locked = false;
                                if(serverInfo.eldewritoVersion.contains(gameVersion) || gameVersion == 0){
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
                            var serverType = "";
                            if(serverInfo.hasOwnProperty("isDedicated")){
                                if(serverInfo.isDedicated){
                                    serverType = "dedicated:Dedicated Server";
                                }
                            }
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
                                serverType,
                                serverType,
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
                                if(serverInfo.eldewritoVersion.contains(gameVersion) || gameVersion == 0){
                                serverCount++;
                            }
                            //fillGameCard(serverInfo.serverId);
                            //if(!dewConnected){
                                /*if(rePing) {
                                    //console.log("repinging "+serverInfo.serverIP);
                                    pingMe(serverInfo.serverIP, $("#serverTable").DataTable().column(0).data().length-1, 200); 
                                }*/
                            //} else {
                            //    dew.ping(serverInfo.serverIP.split(":")[0], serverInfo.port);
                            //}
                            //checkOfficial(serverInfo.serverIP);
                            /*if(!locked){
                                getFlag(serverIP,$("#serverTable").DataTable().column(0).data().length-1);
                            }*/
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
                        title: "Private Server", 
                        text: "Please enter password",   
                        imageUrl: "images/eldorito.png",
                        input: "password",
                        inputPlaceholder: "Password goes here",
                        showCancelButton: true,
                        preConfirm: function (inputValue) {
                            return new Promise(function (resolve, reject) {  
                                if (inputValue === "") {     
                                    reject("Passwords are never blank");     
                                } else {
                                    dew.command('connect ' + serverList.servers[i].serverIP + ' ' + inputValue, function() {
                                        swal.close();
                                    }).catch(function (error) {
                                        reject(error.message);
                                    });
                                }
                            })
                        }
                    });
                } else {
                    dew.command('connect ' + serverList.servers[i].serverIP, function() {
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
                    html: "You do not have the required 3rd party map.<br /><br />Please check <a href='https://www.reddit.com/r/HaloOnline' target='_blank'>https://www.reddit.com/r/HaloOnline</a> for the applicable mod.", 
                    type: "error"
                });
            }
        } else {
            swal({
                title: "Full Game", 
                html: "Game is full or unavailable.", 
                type: "error"
            });
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
                $('#serverTable').dataTable().fnUpdate(pingDisplay, rowNum, 7, false, false);
                $('#serverTable').dataTable().fnUpdate(ping, rowNum, 8, false, false);
            }
        });
    }, delay);   
}

async function setPing(ip, ping){
    var matchingLines = $('#serverTable').dataTable().fnFindCellRowIndexes( ip, 18 );
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
        $('#serverTable').dataTable().fnUpdate(pingDisplay, matchingLines[i], 7, false, false);
        $('#serverTable').dataTable().fnUpdate(ping, matchingLines[i], 8, false, false);
    }
}

function fillGameCard(i) {
    serverList.servers[i].hostPlayerhostPlayer = escapeHtml(serverList.servers[i].hostPlayer)
    serverList.servers[i].name = escapeHtml(serverList.servers[i].name);
    serverList.servers[i].map = escapeHtml(serverList.servers[i].map)
    serverList.servers[i].mapFile = escapeHtml(serverList.servers[i].mapFile);
    serverList.servers[i].variant = escapeHtml(serverList.servers[i].variant)
    serverList.servers[i].variantType = escapeHtml(serverList.servers[i].variantType);
    var html = serverTemplate(serverList.servers[i]);
    $("#gamecard").html(html);
}

function escapeHtml(str) {
    if(str){
        var div = document.createElement('div');
        var fixedText = div.appendChild(document.createTextNode(str)).textContent;   
        fixedText = fixedText.replace(/[^\x00-\x7F]/g, ""); //ASCII Only
        for (var i = 0; i < blamList.length; i++) {
            fixedText = fixedText.replace(/\</g,"&lt;").replace(/\>/g,"&gt;").replace(/&#x3C;/g,'&lt;').replace(/&#x3E;/g,'&gt;');
        }
        return fixedText.trim().substring(0,128);
    } else {
        return "None";
    }
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function getFlag(ip, rowNum){
    var ipSplit = ip.split(":")[0];
    $.getJSON( 'http://geoip.nekudo.com/api/'+ipSplit, function( data ) {
        $('#serverTable').dataTable().fnUpdate(data.country.code.toLowerCase(), rowNum, 2, false, false); 
    });
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
    $('#serverTable').DataTable().clear().draw();
    selectedID = 0;
    stopTableBuilding = false;
    //initCachejson();
    initDewjson();
}

function stopTableBuild() {
    stopTableBuilding = true;
}

function quickMatch() {
    bestFrac = 0;
    bestPing = 1000000;
    var possibleServers = $('#serverTable').DataTable().rows( function (index, data, node){
        if (data[2] == "lock"){
            //console.log("Removing for private: " + data);
            return false;   //Remove private servers
        }
        if (1.0*eval(data[15]) == 1){
            //console.log("Removing for full: " + data);
            return false;       //Remove full servers
        }
        if (eval(data[15]) < bestFrac){
            //console.log("Removing for frac: " + data);
            return false;   //Better player fraction available
        }
        if (eval(data[15]) == bestFrac && data[6] > bestPing){
            /*console.log("Removing for ping: " + data);
            console.log(bestPing + " | " + data[6]);
            console.log(bestFrac + " | " + data[13]);*/
            return false;   //Better ping available
        }
        if (data[17] != gameVersion){
            //console.log("Removing for version mismatch: " + data);
            return false;   //Remove different version servers
        }
        bestFrac = eval(data[15]);
        bestPing = data[8];
        /*console.log(data);
        console.log(bestFrac);
        console.log(bestPing);*/
        return true;
    }
    ).order([15, 'fracDesc']).draw().data();
    //console.log(possibleServers[possibleServers.length-1][0]);
    joinServer(possibleServers[possibleServers.length-1][0]);
}

function switchBrowser() {   
    swal({
        title: 'Switch Server Browser',
        input: 'select',
        imageUrl: "images/eldorito.png",
        inputOptions: {
            //'http://new.halostats.click/servers': 'HaloStats',
            'http://halo.thefeeltra.in/': 'theFeelTrain'
        },
        inputPlaceholder: 'Select alternate server browser',
        showCancelButton: true,
        inputValidator: function (value) {
            return new Promise(function (resolve, reject) {
                dew.command('Game.MenuURL '+value, {}).then(function(response) {
                    dew.command('game.hideh3ui 0');
                    window.location.href = value;
                    resolve();
                })
            })
        }
    }).then(function (result) {
        ga('send', 'event', 'change-menu', result.toLowerCase());
        dew.command('writeconfig');
    })
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
        html: 
        "0.6 features UPnP, which automatically opens and forwards ports for you.<br/><br/>"+
        "If your router does not support this, you will need to open UDP port "+gamePort+" and TCP ports "+
        announcePort+" & "+signalServerPort+" and forward them on your router to your server's private IP address.<br/><br/>"+
        "Please refer to the following online guide for detailed instructions on how to do so.<br/>"+
        "<a href='http://www.howtogeek.com/66214/how-to-forward-ports-on-your-router/' target='_blank'>http://www.howtogeek.com/66214/how-to-forward-ports-on-your-router/</a><br/><br/>"+
        "Then open the game and select 'Host Multiplayer', go up to 'Host Settings' and change the Network Mode to 'Online'.",
        width: "1000", customClass: "howToServeWindow", imageUrl: "images/eldorito.png"
    });
}

//=============================
//===== Gamepad functions =====
//=============================

function updateSelection(sound, scroll) {
    $('#serverTable tbody tr.selected').removeClass('selected');
    $("#serverTable tbody tr:eq(" + selectedID + ")").addClass("selected");
    var row = $('#serverTable').dataTable().fnGetData($("#serverTable tbody tr:eq(" + selectedID + ")"));
    if(row){
        fillGameCard(row[0]);
    }
    if(scroll){
    $(".dataTables_scrollBody tbody tr:eq(" + selectedID + ")")[0].scrollIntoView(false);
    }
    if(dewConnected && sound){
        dew.command('Game.PlaySound 0xAFE');
    }
}

function joinSelected() {
    if(dewConnected){
        var row = $('#serverTable').dataTable().fnGetData($("#serverTable tbody tr:eq(" + selectedID + ")"));
        joinServer(row[0]);
        dew.command('Game.PlaySound 0x0B00'); 
    }
}

function onControllerConnect(){
    dew.command('Game.IconSet', {}).then(function(res){
        controllerType = res;
        $('#xboxLabel').html('<img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_Y.png">Refresh List <img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_X.png">Quick Match <img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_A.png">Join Game <img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_Back.png">Toggle Player list/Scoreboard <img class="controllerButton" src="dew://assets/buttons/'+controllerType+'_B.png">Close');
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
        upNav();
    }
    if(stickTicks.down == 1 || (shouldUpdateHeld && stickTicks.down > 25)){
        downNav();
    }
};

function upNav(){
    if (selectedID > 0) {
        selectedID--;
        updateSelection(true, true);
    }
}

function downNav(){
    if (selectedID < ($("#serverTable tbody tr").length-1)) {
        selectedID++;
        updateSelection(true, true);
    }  
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
   return new Handlebars.SafeString(escapeHtml(theString))
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
