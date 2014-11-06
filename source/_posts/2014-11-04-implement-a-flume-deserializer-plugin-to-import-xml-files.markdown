---
layout: post
title: "Implement a Flume Deserializer Plugin to Import XML Files"
date: 2014-11-04 15:50:51 -0500
comments: true
categories: [Big Data, Flume]
---

Background
----------
[Flume](https://flume.apache.org/) is an open-source Apache project, it is a distributed, reliable, and available service for efficiently collecting, aggregating, and moving large amounts of log data. 
This article shows how to import XML Files with Flume, including the development of a deserializer plugin and the corresponding configurations of Flume.

The secenario is that XML files are sychronized to a directory periodically, we need to config a *Spooling Directory Source* to load these XML files into Flume.

Implement a Flume Deserializer 
------------------------------
The default deserializer of Flume's *Spooling Directory Source* is **LineDeserializer**, which simply parses each line as an Flume event. 
In our case, we need to implement a deserializer for XML files based on the structure.
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

{% img /assets/flume-plugins-project.png %}

### Development
blahblah

### Build and Deployment
blahblah