title: My AWS Account Got Compromised
comments: true
date: 2014-12-10 16:51:04
categories:
- Tech
tags:
- AWS
- EC2
- Amazon
---
I made a terrible mistake last week. I accidentally uploaded my access and secret key of Amazon Web Services (AWS) to Github. 
These keys have the root authority of my AWS account. I used them with AWS's java SDK to launch EC2 instances. 
Obviously some crawlers found these keys and they launched a bunch of EC2 instances all over the world with my account. 

This is the result:
<!-- more -->

![AWS Bill](/images/aws-bill.png)

## How did I know the keys were leaked?
I didn't know until I saw an email from AWS warned me that my account might be compromised, and my current usage is over $10,000 per day. 
By the time I saw the mails, they have already laid in my mailbox, which is an email address I do not check very often, for two days.
Through the mails I acknowledged that Amazon tried to contact me but my number could not be connected (That is an old number I used a year ago). They have already found the Github repository where I leaked the keys (probably they also have crawlers).
After several failed attempts to contact me, Amazon decided to shut down all my services in AWS. 

## What did I do after?
I followed guide in AWS's email, and deleted those access keys immediately.
Then I replied the case that Amazon opened for me in the support page. I left my current number and got a call from them. 
I explained what happened and asked them how to deal with the $20,000 bill.
Fortunetely, they told me that if they confirmed that my account was compromised after they reviewed my case, I will not be charged. Right now I am still waiting for the result. I will update the post when it's over.

## How to prevent?
Well, of course you should never put your keys in public. Moreover, I think you should never use these root credentials.
It is better to create IAM users with limited permissions and IP whitelist.