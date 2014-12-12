title: Build A Resume From Your LinkedIn Profile
comments: true
date: 2014-12-11 19:48:17
categories:
- Tech
tags:
- Javascript
- doT
- Resume
- LinkedIn
- LaTeX
---
Recently I am populating [my LinkedIn page](https://www.linkedin.com/in/xingwu) to prepare for job hunting.
Besides LinkedIn, I also need to update my resume. 
When I was copying and pasting text from LinkedIn to my LaTeX resume, I realized that I should develop something to do this automatically.
I quickly checked LinkedIn's JavaScript API and found that this idea can be easily implemented. 
So I developed [AutoResume](http://autoresume.github.io/), which has two major objectives:

1\. Automatically load your LinkedIn profile into resume templates.  
2\. Create a place for people to share resume templates (LaTeX, HTML, or maybe more formats).

<!-- more -->
![Screenshot of AutoResume](/images/screenshot-autoresume.png)

## Future Work
Right now I have built only two LaTeX templates as examples, but my intention is to let users participate and contribute. 
I have two solutions to enable the expansibility of resume templates:

1\. Search all Github projects contain **autoresume-template** in the project name (this could be achieved by Github's [Search API](https://help.github.com/articles/searching-repositories/#scope-the-search-fields)), each of which should be a project with a resume template file, a preview image, and a description json file. 
Then load the template file and test it with several linkedIn profiles to see if it works perfectly. Save all the projects that have passed the test into [Firebase](https://www.firebase.com/) and order them by the number of forks/stars. All of this can be implemented in a test script so that [Travis](https://travis-ci.org/) can help us update the template list.

2\. Let template creators send pull requests to AutoResume's repository. This is easier to implement but it is inconvenient for template creators to maintain their templates.





