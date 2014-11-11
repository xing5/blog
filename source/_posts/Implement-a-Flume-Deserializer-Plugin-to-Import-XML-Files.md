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

1 Background
----------
[Flume](https://flume.apache.org/) is an open-source Apache project, it is a distributed, reliable, and available service for efficiently collecting, aggregating, and moving large amounts of log data. This article shows how to import XML Files with Flume, including the development of a deserializer plugin and the corresponding configurations of Flume.
We are using Flume 1.5.0 integrated with MapR.

The secenario is that XML files are sychronized to a directory periodically, we need to config a *Spooling Directory Source* to load these XML files into Flume.

2 Implement a Flume Deserializer 
------------------------------
The default deserializer of Flume's *Spooling Directory Source* is **LineDeserializer**, which simply parses each line as an Flume event. In our case, we need to implement a deserializer for XML files based on the structure.

<!-- more -->

### 2.1 Programming Environment
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

<img class="align-left" src="flume-plugins-project.png">

### 2.2 Development
Custom deserializer has to implement **_EventDeserializer_** interface. 
We need to read input stream from **_ResettableInputStream_** and output a list of **_Event_** through __readEvents()__ function.
``` java EventDeserializer.java https://github.com/apache/flume/blob/trunk/flume-ng-core/src/main/java/org/apache/flume/serialization/EventDeserializer.java
/**
 * Establishes a contract for reading events stored in arbitrary formats from
 * reliable, resettable streams.
 */
@InterfaceAudience.Public
@InterfaceStability.Evolving
public interface EventDeserializer extends Resettable, Closeable {

  /**
   * Read a single event from the underlying stream.
   * @return Deserialized event or {@code null} if no events could be read.
   * @throws IOException
   * @see #mark()
   * @see #reset()
   */
  public Event readEvent() throws IOException;

  /**
   * Read a batch of events from the underlying stream.
   * @param numEvents Maximum number of events to return.
   * @return List of read events, or empty list if no events could be read.
   * @throws IOException
   * @see #mark()
   * @see #reset()
   */
  public List<Event> readEvents(int numEvents) throws IOException;

  /**
   * Marks the underlying input stream, indicating that the events previously
   * returned by this EventDeserializer have been successfully committed.
   * @throws IOException
   * @see #reset()
   */
  @Override
  public void mark() throws IOException;

  /**
   * Resets the underlying input stream to the last known mark (or beginning
   * of the stream if {@link #mark()} was never previously called. This should
   * be done in the case of inability to commit previously-deserialized events.
   * @throws IOException
   * @see #mark()
   */
  @Override
  public void reset() throws IOException;

  /**
   * Calls {@link #reset()} on the stream and then closes it.
   * In the case of successful completion of event consumption,
   * {@link #mark()} MUST be called before {@code close()}.
   * @throws IOException
   * @see #mark()
   * @see #reset()
   */
  @Override
  public void close() throws IOException;

  /**
   * Knows how to construct this deserializer.<br/>
   * <b>Note: Implementations MUST provide a public a no-arg constructor.</b>
   */
  public interface Builder {
    public EventDeserializer build(Context context, ResettableInputStream in);
  }

}

```


### 2.3 Build and Deployment
blahblah