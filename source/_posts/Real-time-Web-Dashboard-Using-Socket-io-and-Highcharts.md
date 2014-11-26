title: Real-time Web Dashboard Using Socket.io and Highcharts
comments: true
date: 2014-10-19 20:28:19
toc: true
categories:
- Tech
tags:
- Socket.io
- Node.js
- Real-time
- Chart
- Web
---
The traditional way to accomplish a real-time web dashboard is through automatically refreshing charts or long polling ajax requests. 
[Socket.io](http://socket.io) is a Node.js library provides a duplex communication method between browsers and web servers using [WebSocket](http://en.wikipedia.org/wiki/WebSocket).
And as for those outdated clients that not support WebSocket, it can automatically fallback to traditional polling mechanisms. 
This article is a guide to implement a real-time web dashboard using Socket.io. You may need some basic knowledge about [Node.js](http://nodejs.org/) for better understanding.

<!-- more -->

#Quick Start

Let us start with an example, a single chart that automatically updates in real-time. In this example, the data is stored in MySQL. 
## Server Side

The server should keep data updated and push data to client. 
Clients need two types of data: **(1)** complete data points for the chart when first connects to the server, **(2)** and updated data points for the chart after connected.

If you are using traditional databases like MySQL, you can query and cache the data every second like the following example. 
But I highly recommend [Redis](http://redis.io/) as the storage system of real-time dashboards, you can store all your data that need real-time visualization in Redis. 
Redis has a feature named `SUBSCRIBE`, with which clients will be notified when data changes so that you don't need to query periodically.

``` javascript app.js
var app = require('http').Server();
var io = require('socket.io')(app);
var debug = require('debug')('realdash');
var mysql = require('mysql');

// Connection configuration
var conn = mysql.createConnection({
    host: 'xx.xx.xx.xx',
    user: 'xxx',
    password: 'xxx',
    database: 'xxx'
});

// merge new data to cache, return the diff
function mergediff(orig_data, new_data) {
    var diff = {needUpdate:false, data:{}};
    var diff_data = diff.data;

    for (var key in new_data) {
        if (!orig_data.hasOwnProperty(key)
         || JSON.stringify(orig_data[key])!== JSON.stringify(new_data[key])) {
            diff.needUpdate = true;
            orig_data[key] = new_data[key];
            diff_data[key] = new_data[key];
        }
    }

    if (Object.keys(orig_data).length > 50) {
        var ordered = Object.keys(orig_data).sort();
        var delNum = ordered.length - 50;
        for (var i = 0; i < delNum; i++) {
            delete orig_data[ordered[i]];
        }
    }
    return diff;
}

// this is the query loop.
function dataSync(conn, orig_data, lastUpdate) {
    var queryString = mysql.format("select `time`,value,updateTime from `KPI` where network='vzwca' and " +
        "`kpi`='xxx' and updateTime > ? order by `time` desc limit 50", lastUpdate);
    conn.query(queryString, function(err, rows, fields) {
        if (err) {
            console.log('Query [' + queryString + '] failed: ', err);
        } else {
            debug('query success. rows: ', rows.length);
            if (rows && rows.length >= 0) {
                var new_data = {};
                for (var i = 0; i < rows.length; i++) {
                    var row = {};
                    var row_key = 'time';
                    for (var field in rows[i]) {
                        var value = rows[i][field];
                        if (value instanceof Date) {
                            value = value.getTime();
                        }
                        if (field === 'updateTime') {
                            if (rows[i][field] > lastUpdate) {
                                lastUpdate = rows[i][field];
                            }
                        } else if (field === row_key) {
                            row_key = value;
                        } else {
                            row[field] = value;
                        }
                    }
                    new_data[row_key] = row;
                }
                var diff = mergediff(orig_data, new_data);
                if (diff.needUpdate) {
                    pushUpdate(diff.data);
                }
            }
        }
        setTimeout(function() {dataSync(conn, orig_data, lastUpdate);}, 1000);
    });
}

app.listen(80);

// cache 
var data = {};

// start data sychonization
dataSync(conn, data, 0);

// send complete data at the first connect
io.on('connection', function(socket) {
    socket.emit('completeData', data);
});

// push new data
function pushUpdate(new_data) {
    io.sockets.emit('dataUpdate', new_data);
}
```

## Client Side

Please see the corresponding code for the client as below. [Highcharts](http://http://www.highcharts.com/) a good choice for dynamic charts.

``` html index.html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Dashboard</title>
    <style>
        #hchart {
            width: 800px;
            height: 500px;
            border: 1px solid #bbb
        }
    </style>
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="http://code.highcharts.com/highcharts.js"></script>
    <script src="socket.io.js"></script>
    <script>
        var socket = io('http://xx.xx.xx.xx');
        var hchart = null;
        socket.on('completeData', function (data) {
            document.getElementById('complete-data').innerHTML = JSON.stringify(data);

            var series = {};
            series.name = 'KPI';
            series.data = [];
            Object.keys(data).sort().forEach(function (key) {
                if (data.hasOwnProperty(key)) {
                    var point = {};
                    point.x = key;
                    point.y = data[key].value;
                    series.data.push(point);
                }
            });
            $('#hchart').highcharts({
                chart: {
                    type: 'spline',
                    animation: Highcharts.svg, // don't animate in old IE
                    marginRight: 10,
                    events: {
                        load: function () {
                            hchart = this;
                        }
                    }
                },
                colors: ['#7cb5ec', '#ff8528', '#90ed7d', '#f7a35c', '#8085e9',
                    '#f15c80', '#e4d354', '#8085e8', '#8d4653', '#91e8e1'],
                title: {
                    text: 'Example'
                },
                xAxis: {
                    type: 'datetime',
                    tickPixelInterval: 150
                },
                yAxis: {
                    title: {
                        text: 'Value'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                tooltip: {
                    formatter: function () {
                        return '<b>' + this.series.name + '</b><br/>' +
                            Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                            Highcharts.numberFormat(this.y, 2);
                    }
                },
                legend: {
                    enabled: true
                },
                exporting: {
                    enabled: false
                },
                series: [series],
                credits: {
                    enabled: false
                }
            });
        });
        socket.on('dataUpdate', function (data) {
            document.getElementById('updated-data').innerHTML += JSON.stringify(data) + "\n";

            var series = hchart.series[0].data;
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var bOld = false;
                    for (var i = 0; i < series.length; i++) {
                        if (series[i].x === key) {
                            bOld = true;
                            series[i].update(data[key].value);
                            break;
                        }
                    }
                    if (!bOld) {
                        console.log('new point');
                        hchart.series[0].addPoint([parseInt(key), data[key].value], true, true);
                    }
                }
            }
        });
    </script>
  </head>
  <body>
    <h1>Real-time Dashboard</h1>
    <div id='hchart'></div>
    <h2>Initial Data</h2>
    <pre id='complete-data'></pre><br/>
    <h2>Data Updates</h2>
    <pre id='updated-data'></pre>
  </body>
</html>
```

#System Design

Now we consider a generic real-time web analytics system, with which we can easily add more charts and configure different data sources.

## Rooms
The largest problem in the example above is that the server simply pushes all the data updates to all the clients. 
In the real use case, each user only view one dashboard at a time, so how to send data only to those clients that have opened the related dashboards?
Socket.io's [Rooms and Namespaces](http://socket.io/docs/rooms-and-namespaces/) can solve this problem easily. 
We can change the above code like this to support rooms (not runnable, just to show the concept):
``` javascript Server Side
io.sockets.on('connection', function(socket) {
    socket.on('join', function(event) {
        //leave all existing rooms
        for (var i = 0; i < socket.rooms.length; i++) {
            debug('leave:', socket.rooms[i]);
            socket.leave(socket.rooms[i]);
        }

        //join the new room
        debug('join:', event.room);
        socket.join(event.room);

        // send complete data when joining a room
        socket.emit('completeData', getRoomData(event.room));
    })
});

// push new data
function pushUpdate(new_data) {
    var sockets = null;

    //a room list that needs this data
    var registered_rooms = this.query.registered_rooms;
    for (var i = 0; i < registered_rooms.length; i++) {
        if (sockets == null) {
            sockets = io.to(registered_rooms[i]);
        } else {
            sockets = sockets.to(registered_rooms[i]);
        }
    }
    sockets.emit('dataUpdate', {name: this.query.name, data: new_data});
}
```
## DataSychonizer
Then we need to decouple all these stuff, first create a class to handle the data sychonization for each query. 
This one can only handle MySQL queries, but you can continue the decoupling to support more databases.
``` javascript DataSynchronizor
var debug = require('debug')('DataSync');
var g_mysql = require('mysql');

function extend(orig, extended) {
    for (var key in extended) {
        if (orig.hasOwnProperty(key)) {
            orig[key] = extended[key]
        }
    }
};

function DataSynchronizer(dbconfig, query, options, onUpdateFun) {
    this.dbconfig = dbconfig || g_dbconfig;
    this.connection = g_mysql.createConnection(this.dbconfig);
    this.query = query;
    this.options = {
        connect_retry_timeout: 2000,
        data_refresh_interval: 3000
    };
    extend(this.options, options||{});
    this.data = {};
    this.onUpdateFun = onUpdateFun || null;
    this.lastUpdateTime = 0;
}

DataSynchronizer.prototype.mergediff = function(new_data) {
    var diff = {needUpdate:false, data:{}};
    var diff_data = diff.data;

    for (var key in new_data) {
        if (!this.data.hasOwnProperty(key) || JSON.stringify(this.data[key])!== JSON.stringify(new_data[key])) {
            diff.needUpdate = true;
            this.data[key] = new_data[key];
            diff_data[key] = new_data[key];
        }
    }

    if (this.query.num && Object.keys(this.data).length > this.query.num) {
        var ordered = Object.keys(this.data).sort();
        var delNum = ordered.length - this.query.num;
        for (var i = 0; i < delNum; i++) {
            delete this.data[ordered[i]];
        }
    }
    return diff;
}

DataSynchronizer.prototype.start = function(arg) {
    var obj = arg||this;
    debug(g_mysql.format(this.query.query_string, this.lastUpdateTime));
    this.connection.query(g_mysql.format(this.query.query_string, this.lastUpdateTime), function(err, rows, fields) {
        if (err) {
            console.log('Query [' + obj.query.query_string + '] failed: ', err);
        } else {
            debug('query success. rows: ', rows.length);
            if (rows && rows.length >= 0) {
                var new_data = {};
                for (var i = 0; i < rows.length; i++)
                {
                    var row = {};  var row_key = '';
                    for (var field in rows[i]) {
                        var value = rows[i][field];
                        if (value instanceof Date) {
                            value = value.getTime();
                        }
                        if (field === 'updateTime') {
                            if (rows[i][field] > obj.lastUpdateTime) {
                                obj.lastUpdateTime = rows[i][field];
                            }
                        } else if (field === obj.query.key) {
                            row_key = value;
                        } else {
                            row[field] = value;
                        }
                    }
                    new_data[row_key] = row;
                }
                var diff = obj.mergediff(new_data);
                //debug(diff);
                if (diff.needUpdate) {
                    obj.onUpdateFun(diff.data);
                }
            }
        }
        setTimeout(function() {obj.start(obj)}, obj.options.data_refresh_interval);
    });
};

module.exports = DataSynchronizer;
```
## Data Model
Each room represents a chart. Each chart contains several series. Each series has a `DataSynchronizer`. 
Different charts can have common data series, thus each `DataSynchronizer` should be registered to several rooms. 
As for the user authorizations, you can bind them with charts or even series, depends on your needs.

Going into too much details is not the purpose of this article, I'd better publish a open-source project with my work later. 
Thanks for reading. :)