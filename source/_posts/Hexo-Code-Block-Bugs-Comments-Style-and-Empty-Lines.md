title: "Hexo Code Block Bugs: Comments Style and Empty Lines"
comments: true
date: 2014-11-08 21:36:41
categories:
- Tech
tags:
- Hexo
- Blog
- Code Block
- Bug
---
[Hexo](http://hexo.io) is a static blog framework powered by Node.js. It supports embedding code block but there are a few bugs. 

1. Unclosed html elements in code block. [#902](https://github.com/hexojs/hexo/issues/902)
2. Problems related to empty lines. [#795](https://github.com/hexojs/hexo/pull/795)  

As you can see, these problems do not exist in my blog. I fixed the bugs with a small patch and sent a [pull request](https://github.com/hexojs/hexo/pull/904) to the [Hexo project](https://github.com/hexojs/hexo) on Github. 
<!-- more -->

``` diff
diff --git a/lib/util/highlight.js b/lib/util/highlight.js
index 293ef55..5e46369 100644
--- a/lib/util/highlight.js
+++ b/lib/util/highlight.js
@@ -5,6 +5,19 @@ hljs.configure({
   classPrefix: ''
 });

+hljs.highlightByLine = function(name, value, ignore_illegals) {
+  var result = {value: ''};
+  var lines = value.split('\n');
+  var state = null;
+  lines.forEach(function(line, index) {
+    if (index !== 0) result.value += '\n';
+    var tmpRst = hljs.highlight(name, line, ignore_illegals, state);
+    state = tmpRst.top;
+    result.value += tmpRst.value;
+  });
+  return result;
+};
+
 var alias = {
   js: 'javascript',
   jscript: 'javascript',
@@ -74,7 +87,7 @@ module.exports = function(str, options){
     if (keys.indexOf(lang) !== -1) lang = alias[lang];

     try {
-      compiled = hljs.highlight(lang, str).value;
+      compiled = hljs.highlightByLine(lang, str).value;
     } catch (e){
       compiled = hljs.highlightAuto(str).value;
     }
@@ -88,8 +101,12 @@ module.exports = function(str, options){
     firstLine = options.first_line;

   lines.forEach(function(item, i){
-    numbers += '<div class="line">' + (i + firstLine) + '</div>';
-    content += '<div class="line">' + item + '</div>';
+    if (i !== 0) {
+      numbers += '\n';
+      content += '\n';
+    }
+    numbers += '<span class="line">' + (i + firstLine) + '</span>';
+    content += '<span class="line">' + item + '</span>';
   });

   var result = '<figure class="highlight' + (options.lang ? ' ' + options.lang : '') + '">' +
```

