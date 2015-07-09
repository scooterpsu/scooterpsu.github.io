        var serverList = {
        servers: []
        }; 
        var VerifyIPRegex = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)(?:\:(?:\d|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;
       
        var jqhxr = $.getJSON( "http://192.99.124.162/list", null)
                .done(function( data ) {
                        for(var i = 0; i < data.result.servers.length; i++)
                        {
                                var serverIP = data.result.servers[i];
                                //because sometimes jackasses inject into the server list

                                if(VerifyIPRegex.test(serverIP)){
                                        serverList.servers.push({serverIP, i});
                                        (function(i, serverIP) {
                                            var jqhxrGeoInfo = $.getJSON("http://www.telize.com/geoip/" + serverIP.substr(0, serverIP.indexOf(':')), null )
                                            .done(function(data) {
                                                    $("#region" + i).html(data.region + ", " + data.country);
                                                });
                                            var jqhrxServerInfo = $.getJSON("http://" + serverIP, null )
                                            .done(function(serverInfo) {
                                                    serverInfo["serverId"] = i;
												    serverInfo["serverIP"] = serverIP;
                                                    var html = serverListInfoTemplate(serverInfo);
                                                    $("#serverid" + i).html(html);
                                                    for (var j = 0; j < serverList.servers.length; j++)
                                                    {
                                                        if (serverList.servers[j]["i"] == i)
                                                        {
                                                            serverList.servers[j] = serverInfo;
                                                        }
                                                    }
                                                    console.log(serverInfo);
                                            });
                                        })(i, serverIP);
                                } else {
                                    console.log("Invalid IP, skipping.");
                                }
                        }
                        var listHtml = serverListTemplate(serverList);
                        $("#serverList").html(listHtml);

                for (var j = 0; j < serverList.servers.length; j++)
                {
                        console.log(serverList.servers[j]);
                }
                });
    function updateServerInfo(i) {
        var html = serverTemplate(serverList.servers[i]);
        $("#serverInfo").html(html)
    }
	function joinServer(i) {
		//console.log(serverList.servers[i].serverIP);
		dewRcon.send('connect ' + serverList.servers[i].serverIP);
    }
