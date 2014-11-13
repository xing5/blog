layout: post
title: "Implement a Flume Deserializer Plugin to Import XML Files"
date: 2014-10-04 15:50:51 -0500
comments: true
gallery: false
categories: 
- Tech
tags:
- Big Data
- Flume

---

Background
----------
[Flume](https://flume.apache.org/) is an open-source Apache project, it is a distributed, reliable, and available service for efficiently collecting, aggregating, and moving large amounts of log data. This article shows how to import XML Files with Flume, including the development of a deserializer plugin and the corresponding configurations of Flume.
We are using Flume 1.5.0 integrated in MapR.

The secenario is that XML files are sychronized to a directory periodically, we need to config a **Spooling Directory Source** to load these XML files into Flume.

Implement a Flume Deserializer 
------------------------------
The default deserializer of Flume's **Spooling Directory Source** is `LineDeserializer`, which simply parses each line as an Flume event. In our case, we need to implement a deserializer for XML files based on the structure.

<!-- more -->

### Programming Environment
I prefer [Gradle](http://www.gradle.org/docs/current/userguide/installation.html) as the build automation and Eclispe as the IDE for java programming. Make sure you have them installed.

1\. Create a folder for the project and create a **_build.gradle_** file using the template below.

{% gist 0d5716717f2bc7b26515 build.gradle %}

2\. Add dependencies to the **_build.gradle_**.

``` diff
@@ -25,6 +25,8 @@ repositories {

 dependencies {
     //compile 'commons-collections:commons-collections:3.2'
+    compile 'org.apache.flume:flume-ng-sdk:1.5.0'
+    compile 'org.apache.flume:flume-ng-core:1.5.0'
     testCompile 'junit:junit:4.+'
 }
```

3\. Initialize source folders and the Eclipse project.

```
$ gradle initSourceFolders eclipse
```
4\. Import the project to Eclipse and now you can start coding.

{% img align-left /images/flume-plugins-project.png Eclipse Project %}

### Development
Create a custom deserializer implements the `EventDeserializer` interface. For instance, here we name it `MyXMLDeserializer`.
It reads input stream from `ResettableInputStream` and output `List<Event>` through the `readEvents()` function.
``` java MyXMLDeserializer.java 
package me.xingwu.flume.plugins;

import java.io.IOException;
import java.util.List;

import org.apache.flume.Event;
import org.apache.flume.serialization.EventDeserializer;

public class MyXMLDeserializer implements EventDeserializer {

    public MyXMLDeserializer() {
        // TODO Auto-generated constructor stub
    }

    @Override
    public Event readEvent() throws IOException {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public List<Event> readEvents(int numEvents) throws IOException {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public void mark() throws IOException {
        // TODO Auto-generated method stub

    }

    @Override
    public void reset() throws IOException {
        // TODO Auto-generated method stub

    }

    @Override
    public void close() throws IOException {
        // TODO Auto-generated method stub

    }

}
```

It is better to read the XML files as a stream using `javax.xml.stream.XMLStreamReader` instead of parse the whole file to a XML object and then extract the events. 
So we need to wrap up `ResettableInputStream` to `java.io.InputStream` first:

``` java
package me.xingwu.flume.plugins;

import java.io.IOException;
import java.io.InputStream;

import org.apache.flume.serialization.ResettableInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FlumeInputStream extends InputStream {
    private static final Logger logger = LoggerFactory.getLogger(FlumeInputStream.class);

    private final ResettableInputStream in;

    public FlumeInputStream(ResettableInputStream input) {
        this.in = input;
    }

    @Override
    public int read() throws IOException {
        try {
            return this.in.read();
        } catch (Exception e) {
            logger.error("input stream read failed:" + e.getMessage());
            return 0;
        }
    }

}
```

Now we can start working on the XML parsing and Flume Events generating. Be sure to set the event headers if you get to route the events to different sinks later. 
>For details of events routing please refer to [another post](/2014/10/11/Routing-Flume-Events-to-Different-Sinks/)

The source code of the deserializer is as below (I changed some class/variable names and I can't provide the XML structure, but you can get the idea from it):

{% include_code MyXMLDeserializer.java lang:java /MyXMLDeserializer.java %}

### Unittest

We can build a unittest file and run as *JUnit Test*:

{% include_code lang:java /MyXMLDeserializerTest.java %}


### Build and Deployment

Run `gradle build` then you can find the lib at `build/libs/the-package-name-0.1.0.jar`.
You can change the jar name and version in the **_build.grale_**.

For the deployment, simply put the jar in `$FLUME_HOME/plugins.d/ANY_NAME_YOU_LIKE/lib/` and configure the Flume this way:

``` ini
# Source
agent.sources = helloXMLs
agent.sources.helloXMLs.type = spooldir
agent.sources.helloXMLs.spoolDir = /opt/data/spooltest
agent.sources.helloXMLs.deletePolicy = immediate
agent.sources.helloXMLs.deserializer = me.xingwu.flume.plugins.MyXMLDeserializer$Build
```

Make sure you put a `$Build` after your class name, or you will get an error like this:
> org.apache.flume.FlumeException: Unable to instantiate Builder from me.xingwu.flume.plugins.MyXMLDeserializer: does not appear to implement org.apache.flume.serialization.EventDeserializer$Builder

Now the XML source has been set up! Configure channels and sinks for Flume and enjoy! Leave a comment if you get any questions :)
