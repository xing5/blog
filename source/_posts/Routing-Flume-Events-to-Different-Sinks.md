title: Routing Flume Events to Multiple Sinks
date: 2014-10-11 15:07:46 -0400
comments: true
categories:
- Tech
tags:
- Big Data
- Flume
- Route
---

When importing data using [Flume](http://flume.apache.org/), you might want to route Flume events to multiple destinations (e.g.: different directories in HDFS) based on their content.
Flume has a functionality called [Multiplexing](https://flume.apache.org/FlumeUserGuide.html#multiplexing-the-flow) to achieve this goal, this article is a guide to the configuration.

<!-- more -->

Example
-------
We have a source with events contain header *State*. As we only care about data in California and New York, we want to filter the events and route events from CA/NY to different sinks.
The configuration is as below, we create a **_null_** sink to discards uninterested events:

``` 
# list the sources, sinks and channels in the agent
agent_foo.sources = avro-AppSrv-source1
agent_foo.sinks = hdfs-ca-sink hdfs-ny-sind null-sink
agent_foo.channels = mem-channel-ca mem-channel-ny mem-channel-other

# set channels for source
agent_foo.sources.avro-AppSrv-source1.channels = mem-channel-ca mem-channel-ny mem-channel-other

# set channel for sinks
agent_foo.sinks.hdfs-ca-sink.channel = mem-channel-ca
agent_foo.sinks.hdfs-ny-sink.channel = mem-channel-ny
agent_foo.sinks.null-sink.channel = mem-channel-other

# channel selector configuration
agent_foo.sources.avro-AppSrv-source1.selector.type = multiplexing
agent_foo.sources.avro-AppSrv-source1.selector.header = State
agent_foo.sources.avro-AppSrv-source1.selector.mapping.NY = mem-channel-ny
agent_foo.sources.avro-AppSrv-source1.selector.mapping.CA = mem-channel-ca
agent_foo.sources.avro-AppSrv-source1.selector.default = mem-channel-other

# define all sinks, sources, channels

# null sink
agent-foo.sinks.null-sink.type = null
other configurations...
```
> **Note:**  
> If the events do not have headers and the state infomation is inside the content, you can implement a custom `Interceptor` to modify the events.

