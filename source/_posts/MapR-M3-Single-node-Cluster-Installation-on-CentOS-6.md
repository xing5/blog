title: MapR M3 Single-node Cluster Installation on CentOS 6
comments: true
date: 2014-09-21 15:35:46
categories:
- Tech
tags:
- MapR
- Installation
- CentOS
---
If you need a single-node MapR cluster and you are not able to use the official MapR sandbox image, you can use this guide to install MapR on a CentOS.

<!-- more -->
## MapR Installation:

1\. Add a file maprtech.repo to /etc/yum.repo.d/
```
[maprtech]
 name=MapR Technologies
 baseurl=http://package.mapr.com/releases/v3.1.1/redhat/
 enabled=1
 gpgcheck=0
 protect=1
 
 [maprecosystem]
 name=MapR Technologies
 baseurl=http://package.mapr.com/releases/ecosystem/redhat
 enabled=1
 gpgcheck=0
 protect=1
```

2\. Installation.
``` bash
wget http://dl.fedoraproject.org/pub/epel/5/x86_64/epel-release-5-4.noarch.rpm
rpm -Uvh epel-release-*.rpm

wget http://package.mapr.com/releases/v3.1.1/redhat/mapr-setup
chmod 755 mapr-setup
./mapr-setup
```
3\. Create a configuration file for single node environment
```
# Each Node section can specify nodes in the following format
# Node: disk1, disk2, disk3
# Specifing disks is optional. In which case the default disk information
# from the Default section will be picked up
[Control_Nodes]
#This is the hostname of the node. Run 'hostname' to get it.
CentOS65-001
[Data_Nodes]
[Client_Nodes]
[Options]
MapReduce = true
HBase = true
M7 = false
ControlNodesAsDataNodes = true
WirelevelSecurity = false
LocalRepo = false
[Defaults]
ClusterName = my.cluster.com
User = mapr
Group = mapr
Password = mapr
UID = 2000
GID = 2000
Disks = /dev/sdb
CoreRepoURL = http://package.mapr.com/releases
EcoRepoURL = http://package.mapr.com/releases/ecosystem
Version = 3.1.1
MetricsDBHost
MetricsDBUser
MetricsDBPassword
MetricsDBSchema
```

4\. Run `/opt/mapr-maprinstaller/bin/install`. 
Follow the instructions, remember to load the configuration file above.

5\. After installation, log in `https://hostname:8443` with user `mapr` pwd `mapr`.

6\. Register your license. Otherwise some services couldn't launch.

7\. After registration, reboot (or just simply stop all the MapR services, but I suggest you reboot) and start mapr services:

``` bash
service mapr-zookeeper start
service mapr-warden start
```

8\. Then you are good to go with MapR Hadoop! Try some examples.
``` bash
hadoop jar /opt/mapr/hadoop/hadoop-0.20.2/hadoop-0.20.2-dev-examples.jar pi 2 50
```

## Spark Installation
This part is from the [original guide](http://doc.mapr.com/display/MapR/Spark+and+Shark), with a few modifications.

1\. Install Scala 2.10+
``` bash
yum localinstall http://www.scala-lang.org/files/archive/scala-2.11.2.rpm
```

2\. Install Spark
``` bash
yum install mapr-spark-master
```

3\. change the owner of spark dir to mapr (or warden cannot start spark due to file permission)
``` bash
chown -R mapr:mapr /opt/mapr/spark
```

4\. refresh warden to start spark
``` bash
/opt/mapr/server/configure.sh -R
```

5\. Edit the configuration of worker node as you wish. (default is localhost for single node)
``` bash
vim /opt/mapr/spark/spark-1.0.2/conf/slaves
```

6\. Start slave (spark master has been started by warden)
``` bash
su mapr
/opt/mapr/spark/spark-1.0.2/sbin/start-slaves.sh
```

7\. check spark-master website (http://hostname:8080/) to see if work nodes are set.

8\. run spark-pi example
``` bash
/opt/mapr/spark/spark-1.0.2/bin/run-example org.apache.spark.examples.SparkPi 10
```
