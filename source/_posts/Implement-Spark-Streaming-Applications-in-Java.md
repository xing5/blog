title: Implement Spark Streaming Applications in Java
comments: true
date: 2014-10-11 15:32:21
toc: true
categories:
- Tech
tags:
- Spark Streaming
- Spark
- Big Data
- Java
- Flume
---
The [Official Guide](https://spark.apache.org/docs/latest/streaming-programming-guide.html) of Spark Streaming does not show you how to set up the environment, build and deploy the apps. 
This article shows you how to implement a Spark Streaming Application in Java from scratch. 

<!-- more -->
## Programming Environment

I prefer [Gradle](http://www.gradle.org/docs/current/userguide/installation.html) as the build automation and Eclispe as the IDE for java programming. 
Please make sure you have them installed.

The first step for any Java project is always creating a folder and a **_build.gradle_** file using the [template](https://gist.github.com/xing5/0d5716717f2bc7b26515#file-build-gradle).
Then modify it according to the project. The one I use for Spark Streaming Apps is as below.

```
buildscript {
  repositories { jcenter() }
  dependencies {
    classpath 'com.github.jengelman.gradle.plugins:shadow:1.1.1'
  }
}

apply plugin: 'java'
apply plugin: 'eclipse'

// This plugin provides the 'shadowJar' task, which create an assembly jar.
// Because Spark requires your jar to bundle everything except spark and hadoop. 
apply plugin: 'com.github.johnrengelman.shadow' 
 
sourceCompatibility = 1.7
version = '0.1.0'


shadowJar {
    dependencies {
        exclude(dependency('org.apache.spark:spark-core_2.10'))
        exclude(dependency('org.apache.hadoop:hadoop-core_2.10'))
        exclude(dependency('org.apache.hadoop:hadoop-client_2.10'))
    }
}

jar {
    baseName = 'spark-streaming-apps'
    manifest {
        attributes 'Implementation-Title': 'title',
                   'Implementation-Version': version
    }
}
 
task initSourceFolders {
   sourceSets*.java.srcDirs*.each { it.mkdirs() }
   sourceSets*.resources.srcDirs*.each { it.mkdirs() }
}
 
repositories {
    mavenLocal()
    mavenCentral()
}
 
dependencies {
    // Logging and spark streaming. 
    compile 'org.slf4j:slf4j-api:1.7.5'
    compile 'log4j:log4j:1.2.17'
    compile 'org.slf4j:slf4j-log4j12:1.7.5'
    compile 'org.apache.spark:spark-streaming_2.10:1.0.2'

    // Libs required by your apps.
    compile 'org.apache.spark:spark-streaming-flume_2.10:1.0.2'
    compile 'mysql:mysql-connector-java:5.1.33'
    compile 'com.google.inject:guice:3.0'
    compile 'com.google.guava:guava:18.0'
    compile 'com.beust:jcommander:1.25'

    // Declare the dependency for your favourite test framework you want to use in your tests.
    // TestNG is also supported by the Gradle Test task. Just change the
    // testCompile dependency to testCompile 'org.testng:testng:6.8.1' and add
    // 'test.useTestNG()' to your build script.
    testCompile "junit:junit:4.11"
    testCompile 'mysql:mysql-connector-java:5.1.33'
}
```

Now `cd` to the project directory, initialize the source folders, create a Eclipse project. 
```
$ gradle initSourceFolders eclipse
```
After the command is done, you can import this project to Eclipse. All dependencies are set up automatically. 

## Create an App

Create a new package, then create a new class for the app. You do not need to inherit any class or implement any interface.
Please find below as an example app, it receives data from Flume and does some simple aggregations. 
``` java
package example.package.name;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.spark.*;
import org.apache.spark.storage.StorageLevel;
import org.apache.spark.streaming.Duration;
import org.apache.spark.streaming.api.java.*;
import org.apache.spark.streaming.flume.FlumeUtils;
import org.apache.spark.streaming.flume.SparkFlumeEvent;

import scala.Tuple2;
import scala.Tuple4;

import com.beust.jcommander.JCommander;
import com.beust.jcommander.Parameter;

public class ExampleApp {

    private static final Logger logger = LoggerFactory.getLogger(ExampleApp.class);

    @Parameter(names = "-host", variableArity = true, 
        description = "destination of the flume data", required = false)
    String host = "localhost"; 

    @Parameter(names = "-port", variableArity = true, 
        description = "Port of the destination", required = false)
    int port = 4445;

    @Parameter(names = "-uiport", variableArity = true, description = "port of spark UI", required = false)
    String uiport = "4041";

    public static void main(String[] args) {

        ExampleApp app = new ExampleApp();
        JCommander jc = new JCommander(app);
        try {
            jc.parse(args);
        } catch (Exception e) {
            logger.error(e.getMessage());
            jc.usage();
            return;
        }


        SparkConf conf = new SparkConf().setAppName("ExampleApp").set("spark.ui.port", app.uiport);
        JavaStreamingContext ssc = new JavaStreamingContext(conf, new Duration(10 * 1000));
        ssc.checkpoint("hdfs://HDFS_HOST:HDFS_PORT/spark/checkpoints/ExampleApp/");

        JavaReceiverInputDStream < SparkFlumeEvent > flumeStream = FlumeUtils.createStream(ssc,
        app.host, app.port, StorageLevel.MEMORY_ONLY());

        JavaPairDStream < Tuple2 < String, String > , Tuple4 < Integer, Integer, Integer, Integer >> 
            sampleStream = flumeStream.flatMapToPair(new ExampleAppFunctions.ExtractPairFromEvents())
            .reduceByKey(new ExampleAppFunctions.ReduceCellByNode());

        sampleStream.foreachRDD(new ExampleAppFunctions.OutputNode());

        ssc.start();
        ssc.awaitTermination();
    }
}
```
For the usage of built-in functions such as `foreachRDD`, `reduceByKey`, etc., please refer to [Transformation on DStreams](https://spark.apache.org/docs/latest/streaming-programming-guide.html#transformations-on-dstreams).

## Process RStreams
As for the custom functions (e.g.: `ExtractPairFromEvents`, `ReduceCellByNode`, etc.), 
I put them in another class and make them public static, so that the code are more readable. 

``` java
package example.package.name;

import java.nio.charset.Charset;
import java.util.List;

import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.function.FlatMapFunction;
import org.apache.spark.api.java.function.Function;
import org.apache.spark.api.java.function.Function2;
import org.apache.spark.api.java.function.PairFlatMapFunction;
import org.apache.spark.api.java.function.PairFunction;
import org.apache.spark.streaming.flume.SparkFlumeEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import scala.Tuple2;
import scala.Tuple3;
import scala.Tuple4;

import com.google.common.base.Optional;
import com.google.common.collect.Lists;
import com.google.inject.Guice;
import com.google.inject.Injector;

public class ExampleAppFunctions {

    private static final Logger logger = LoggerFactory.getLogger(ExampleAppFunctions.class);

    public static class ExtractPairFromEvents implements 
        PairFlatMapFunction < SparkFlumeEvent, Tuple2 < String, String > ,
        Tuple4 < Integer, Integer, Integer, Integer >> {

        private static final long serialVersionUID = 1L;

        private int[] parseQci(String strQciArray) {
            int[] qci = new int[12];
            String[] s = strQciArray.split(",", -1);
            int qciIndex = 0;
            for (int i = 1; i < s.length; i++) {
                if (i % 2 == 1) {
                    qciIndex = Integer.valueOf(s[i]);
                } else {
                    qci[qciIndex] = Integer.valueOf(s[i]);
                }
            }
            return qci;
        }

        @Override
        public Iterable < Tuple2 < Tuple2 < String, String > , 
        Tuple4 < Integer, Integer, Integer, Integer >>> call(SparkFlumeEvent event)
        throws Exception {
            List < Tuple2 < Tuple2 < String, String > , Tuple4 < Integer, Integer, Integer, Integer >>> 
                rstList = Lists.newArrayList();

            try {
                String body = new String(event.event().getBody().array(), Charset.forName("UTF-8"));
                String timestamp = "0";
                for (CharSequence cs: event.event().getHeaders().keySet()) {
                    if (cs.toString().equals("timestamp")) {
                        timestamp = event.event().getHeaders().get(cs).toString();
                    }
                }

                String[] cols = body.split("\\|", -1);
                if (cols.length > 514) {
                    logger.trace("MSG: {}|{}|{}|{}|{}|{}", 
                        cols[0], cols[507], cols[511], cols[509], cols[518], cols[514]);
                    int[] ExampleAbnormalEnbActQci = parseQci(cols[507]);
                    int[] ExampleAbnormalMmeActQci = parseQci(cols[511]);
                    int[] ExampleAbnormalEnbQci = parseQci(cols[509]);
                    int[] ExampleNormalEnbQci = parseQci(cols[518]);
                    int[] ExampleMmeQci = parseQci(cols[514]);

                    Tuple2 < String, String > key = new Tuple2 < String, String > (timestamp, cols[0]);
                    Tuple4 < Integer, Integer, Integer, Integer > val = 
                        new Tuple4 < Integer, Integer, Integer, Integer > 
                        (ExampleAbnormalEnbActQci[1] + ExampleAbnormalMmeActQci[1],
                    ExampleAbnormalEnbQci[1] + ExampleNormalEnbQci[1] + ExampleMmeQci[1],
                    ExampleAbnormalEnbActQci[8] + ExampleAbnormalMmeActQci[8],
                    ExampleAbnormalEnbQci[8] + ExampleNormalEnbQci[8] + ExampleMmeQci[8]);
                    logger.trace("{} qci: {},{},{},{}", cols[0], val._1(), val._2(), val._3(), val._4());
                    rstList.add(new Tuple2 < Tuple2 < String, String > , 
                        Tuple4 < Integer, Integer, Integer, Integer >> (key, val));
                }
            } catch (Exception e) {
                logger.error(e.getMessage());
            }
            return rstList;
        }

    }

    public static class ReduceCellByNode implements Function2 
    < Tuple4 < Integer, Integer, Integer, Integer > , Tuple4 < Integer, Integer, Integer, Integer > ,
    Tuple4 < Integer, Integer, Integer, Integer >> {

        private static final long serialVersionUID = 42L;


        @Override
        public Tuple4 < Integer, Integer, Integer, Integer > call(
        Tuple4 < Integer, Integer, Integer, Integer > v1,
        Tuple4 < Integer, Integer, Integer, Integer > v2) throws Exception {
            return new Tuple4 < Integer, Integer, Integer, Integer > (
            v1._1() + v2._1(),
            v1._2() + v2._2(),
            v1._3() + v2._3(),
            v1._4() + v2._4());
        }

    }

    public static class OutputNode implements Function < JavaPairRDD < Tuple2 < String, String > ,
    Tuple4 < Integer, Integer, Integer, Integer >> , Void > {

        private static final long serialVersionUID = 42L;

        @Override
        public Void call(
        JavaPairRDD < Tuple2 < String, String > , Tuple4 < Integer, Integer, Integer, Integer >> v1)
        throws Exception {
            Injector inj = Guice.createInjector(new ExampleInjector());
            ExampleOutputService service = inj.getInstance(ExampleOutputService.class);
            service.outputNode(v1.collect());
            return null;
        }

    }

}

```

You may find that the super long `Tuple` type names and class names are really annoying, 
so I do recommend you to try Scala instead of Java when developing Spark Streaming applications.
It can definitely ease a lot of pain.

## Build and Run

Build
```
$ gradle shadowJar
```
You can find the jar in `build/libs/` with a suffix `-all` to the name. To run the app as a service:
```
$ cd $SPARK_DIR
$ nohup ./bin/spark-submit --class example.package.name.ExampleApp --master spark://SPARK_HOST:7077 
--executor-memory 256M "/full/path/to/the/jar/of/your/app" -host localhost -port 4444 > exampleapp.log 
2>&1 < /dev/null &
```
Please note that `-host localhost -port 4444` are the parameters for `ExampleApp`, they are passed to `JCommander`.
