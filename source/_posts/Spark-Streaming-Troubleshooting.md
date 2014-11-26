title: Spark Streaming Troubleshooting
comments: true
date: 2014-10-15 15:33:18
categories:
- Tech
tags:
- Spark
- Spark Streaming
- Troubleshooting
- Big Data
---
This article is a record for the problems I met when developing Spark Streaming applications. 

<!-- more -->

## Where are the logs?
### Which log4j.properties the Spark is using?
**_Log4j_** reads the first *log4j.properties* it finds in the class path. 
So if you want to use `$SPARK_PATH/conf/log4j.properties`, make sure it's the first one to be found in your class path.
![](/images/spark-classpath.png)

### Some logs just don't show up?
This probably because of that you search the wrong place. The application you submit to Spark is just a `driver program` that creates the `SparkContext`. 
DStreams is processed by Spark workers, all the logs inside DStreams transformation functions are going through workers' standard output and written to `$SPARK_PATH/tmp/APPDIR/workerNo/stdout`.
You can also view them through the Spark web UI, which is at `$MASTER_IP:8080` by default. Click the app and then you will see links to the logs on workers.

## Cannot Launch App?
When lauching several apps you may meet a problem like this:

> org.apache.spark.scheduler.TaskSchedulerImpl: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient memory

This is because of either not enough cores or memory. To solve this problem, first make sure which one you are short of by checking the cluster status on the Spark web UI. Then adjust them as following.

### More Workers?
1\. Add more slaves to `$SPARK_PATH/conf/slaves`
2\. Adjust worker instances per slave:
``` bash $SPARK_PATH/conf/spark-env.sh
export SPARK_WORKER_INSTANCES=2
```
### Memory Size per Worker

``` bash $SPARK_PATH/conf/spark-env.sh
export SPARK_DAEMON_MEMORY=1g
export SPARK_WORKER_MEMORY=1g
```

### Memory Size per App
You can set the memory usage of your app when you submit it:
``` bash
./bin/spark-submit --class org.apache.spark.examples.SparkPi --master spark://CentOS65-001:7077 --executor-memory 128M lib/spark-examples-1.0.2-hadoop1.0.3-mapr-3.0.3.jar
```

### Core Numbers per Worker
``` bash $SPARK_PATH/conf/spark-env.sh
export SPARK_WORKER_CORES=2
```

### Core Numbers per App
Specify the core numbers in your app. Or in `$SPARK_PATH/conf/spark-defaults.conf`:
``` 
spark.cores.max 2
```