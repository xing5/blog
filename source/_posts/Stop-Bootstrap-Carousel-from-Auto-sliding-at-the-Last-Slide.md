title: Stop Bootstrap Carousel from Auto-sliding at the Last Slide
comments: true
date: 2014-11-04 20:37:44
categories:
- Tech
tags:
- Web
- Bootstrap
- Carousel
- Javascript
---
Sometimes we need [Bootstrap Carousel](http://getbootstrap.com/javascript/#carousel) to stop auto-sliding at the last slide, one possible way to achieve this is to set the `wrap` to `false`. 
But this causes another problem that you cannot click the *next arrow* to jump to the beginning when you are at the last slide. 

My solution is to stop the Carousel from sliding at the last slide, and reactivate the auto-sliding at the first page. Please see the example below.

<!-- more -->


{% jsfiddle xingwu/qjb8bzLd js,html,result light 800 320 %}
