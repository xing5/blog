title: Load Data to Hive Using Flume
comments: true
date: 2014-10-07 15:20:43
categories:
- Tech
tags:
- Hive
- Flume
- Hadoop
- Big Data
---

[Flume](http://flume.apache.org/) has a built-in HDFS sink. Importing data to Hive is almost the same as saving data to HDFS directories, with a little difference.
This is a guide about the Flume configuration and the corresoponding Hive-QL to load the data table.

<!-- more -->

Example
------
The events from the source have headers and contents with following format 
(please refer to [another article](/2014/10/04/Implement-a-Flume-Deserializer-Plugin-to-Import-XML-Files/) if you are interested in how to customize events):

> Headers: {table: 'TableA', timestamp: 1415912506}  
> Body: "key1|123|345|2,1,3"

The events could have different table names and corresponding body format. We want to store all events to different Hive tables based on the table names in their headers.
The `timestamp` header is required if we want to partition the data by date (the date variables in the configuration file require `timestamp` header).
The Flume configuration for the sink is as below:

```
agent.sources.MeXingWuXMLs.selector.type = multiplexing
agent.sources.MeXingWuXMLs.selector.header = table
agent.sources.MeXingWuXMLs.selector.mapping.TableA = channel_a
agent.sources.MeXingWuXMLs.selector.mapping.TableB = channel_b
agent.sources.MeXingWuXMLs.selector.default = channel_default
 
agent.sinks.sink_a.type = hdfs
agent.sinks.sink_a.hdfs.path = maprfs:///flume/tables/TableA/dt=%Y%m
agent.sinks.sink_a.hdfs.rollInterval = 0
agent.sinks.sink_a.hdfs.rollCount = 20000
agent.sinks.sink_a.hdfs.rollSize = 0
agent.sinks.sink_a.hdfs.fileType = DataStream
agent.sinks.sink_a.hdfs.timeZone = UTC
agent.sinks.sink_a.channel = channel_a
 
agent.sinks.sink_b.type = hdfs
agent.sinks.sink_b.hdfs.path = maprfs:///flume/tables/TableB/dt=%Y%m
agent.sinks.sink_b.hdfs.rollInterval = 0
agent.sinks.sink_b.hdfs.rollCount = 100000
agent.sinks.sink_b.hdfs.rollSize = 0
agent.sinks.sink_b.hdfs.fileType = DataStream
agent.sinks.sink_b.hdfs.timeZone = UTC
agent.sinks.sink_b.channel = channel_b
```

Create table in Hive:

``` sql
CREATE TABLE TableA (
    id STRING,
    v1 int,
    v2 int,
    v3 array<int>
)
PARTITIONED BY (dt STRING)
row format delimited
fields terminated by '|'
collection items terminated by ','
LOCATION '/flume/tables/TableA/';
```
Also, you need to add partitions periodically:

``` sql
ALTER TABLE TableA 
ADD PARTITION (dt = 201409);
```

