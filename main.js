$(document).ready(function(){
	//Initialize Material Design
	$.material.init()

	//Focus on the Search Bar
	document.querySelector("#search-bar").focus();

	//GET image URL from Bing for the picture of the day.
	var xhr = new XMLHttpRequest();
	xhr.open("GET", 'http://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US', false);
	xhr.onload = (function() {
		var imgUrl= "http://www.bing.com"+$.parseJSON(xhr.responseText).images[0].url;
		document.querySelector(".bg").style.backgroundImage="url("+imgUrl+")";
	});
	xhr.send(null);

	//Get Top Sites of Chrome
	chrome.topSites.get(cb);
})

function cb(d) {
	for(i=0;i<12;i++) {
		var top = document.querySelector("#top .row"+parseInt(i/3));
		if(d[i]) {
			var tmp       = document.createElement ('a');
			tmp.href   = d[i].url;
			var arr = tmp.hostname.split(".");
			var logoUrl="http://data.scrapelogo.com/"+arr[arr.length-2]+"."+arr[arr.length-1]+"/nlogo";
			// document.querySelector("#top").innerHTML="<img src="+logoUrl+"/>"

			top.innerHTML+="<a href='" +d[i].url+ "'class='top-site btn btn-default' style='postion:relative'>"+d[i].title+"</a>"
			//<div style='background-image: linear-gradient(160deg,#1111aa,blue);' class='top-site-overlay'>&nbsp;</div>
		}
		
	}
}

