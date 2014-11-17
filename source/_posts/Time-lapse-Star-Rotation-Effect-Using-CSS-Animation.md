title: Time-lapse Star Rotation Effect Using CSS Animation
comments: true
date: 2014-11-11 20:42:30
categories:
- Tech
tags:
- CSS
- Animation
- Time-lapse
- Star Rotation
- Hexo
- Theme
---
[Landscape](http://hexo.io/hexo-theme-landscape/) is the default theme of Hexo 2.4+. 
I really like the background picture of the header.
And I think it will be cool if the stars can rotate slowly in the sky.
Check the demo [here](http://demo.xingwu.me/animastars). 

![Landscape Theme](/images/landscape-theme.png)

<!-- more -->

With CSS animation we can easily implement this idea. 
But we need to process the photos first.
Our goal is to get a clean backgound without stars, a picture of stars with transparent background and
a solid image as a mask.

![Three Layers](/images/star-rotation-principle.jpg)

1\. To get the background, erase all the stars with the **Spot Healing Brush** and **Clone Stamp** tool in *Photoshop*.

![Erase Stars](/images/newplant-ps.gif)

2\. The mask is easy, just selete and delete the dark area of the background.

![Mask](/images/mask.jpg)

3\. The stars are hard to extract. You can try the **Magic Wand** or **Background Eraser** tool. 
And we need to copy the stars several times to get a bigger image so even when it is spinning, the stars can still show up on the background (The size depends on where the center of the rotation is). 

4\. Setting up CSS and adjust the animation parameters. Please refer to the [Demo](http://demo.xingwu.me/animastars). 

The idea in this article is inspired by Joe Howard's [Animating Images With CSS Keyframes](http://www.pencilscoop.com/2014/04/animating-images-with-css-keyframes/). He shows a step-by-step example and the article is really worth reading.
