 // 'use strict';

 var elegantNewTabApp=(function($, document, chromeLocalStorage) {

 	if(!chromeLocalStorage.removedSites) {
 		var arr=[];
 		chromeLocalStorage.setItem("removedSites", JSON.stringify(arr));
 	}

 	var setPageBG= function (){
 		$.ajax({
 			url: 'http://www.bing.com/HPImageArchive.aspx',
 			data: {
 				format: "js",
 				idx: "0",
 				n: "1",
 				mkt: "en-US"
 			}
 		}).success(function(data){
 			var imgUrl= "http://www.bing.com"+data.images[0].url;
 			document.querySelector(".bg").style.backgroundImage="url("+imgUrl+")";
 		});
 	};

 	var getQuote= function() {
 		var timestamp= chromeLocalStorage.quoteTimestamp;

		//If cached weather is less than 300 mins old
		if(timestamp && timestamp>Date.now()-18000000 && chromeLocalStorage.quote) {
			return chromeLocalStorage.quote;
		}

		else {
			$.ajax({
				url: 'http://api.theysaidso.com/qod.json',
				data: {
					maxlength: 100
				}
			}).success(function(quoteJson) {
				var q='"'+quoteJson.contents.quote+'" -'+quoteJson.contents.author;
				chromeLocalStorage.quote=q;
				chromeLocalStorage.quoteTimestamp=Date.now();
				return q;
			});
		}
		
	};

	var getWeatherUnit = function() {
		if(!chromeLocalStorage.unit) {
			chromeLocalStorage.unit="Fahrenheit";
		}
		return chromeLocalStorage.unit;
	};

	var setWeatherUnit = function(unitToBeSet) {
		chromeLocalStorage.unit=unitToBeSet;
	}

	var getWeatherIcon= function (weatherCode, sunset) {
		var rain = [200,201,202,300,301,302,310,311,312,313,314,321,500,501,502,503,504,511,520,521,522,531];
		var thunderstorm = [210,211,212,221,230,231,232,956,957,958,959,960,961,962];
		var snow= [600,601,602,611,612,615,616,620,621,622,906];
		var sunny = [800,801];
		var clouds= [802,803,804,900,901,902,905];
		var rainbow = [951,952,953,954,955];
		var haze = [701,711,721,731,741,751,761,762,771,781];
		if(rain.indexOf(weatherCode)>-1) {
			return "rainy";
		}
		if(thunderstorm.indexOf(weatherCode)>-1) {
			return "stormy";
		}
		if(snow.indexOf(weatherCode)>-1) {
			return "snowy";
		}
		if(sunny.indexOf(weatherCode)>-1) {
			if(Date.now()/1000<sunset) {
				return "sunny";
			}
			return "starry";
		}
		if(clouds.indexOf(weatherCode)>-1) {
			return "cloudy";
		}
		if(rainbow.indexOf(weatherCode)>-1) {
			return "rainbow";
		}
		else {
			return "haze";
		}
	};

	var getAndSetWeatherWithLocation= function (location, callbackFunction, cached) {
		var timestamp= chromeLocalStorage.weatherTimestamp;
		
		//If cached weather is less than 30 mins old
		if(timestamp && Date.now()-timestamp>1800000 && chromeLocalStorage.weatherData && cached) {
			callbackFunction(JSON.parse(chromeLocalStorage.weatherData));
		}

		//If cached weather is older than 30 mins
		else {
			var returnObj;
			var weatherCode;
			var sunset;
			$.ajax({
				url: "http://api.openweathermap.org/data/2.5/weather",
				data: {
					lat: location.coords.latitude,
					lon: location.coords.longitude
				}
			}).success(function (data){
				weatherCode=data.weather[0].id;
				sunset=data.sys.sunset;
				var iconClass= getWeatherIcon(weatherCode, sunset);
				var cur_temp=parseInt(data.main.temp);
				
				returnObj= {
					"iconClass" : iconClass,
					"cityName" : data.name,
					"weatherDesc" : data.weather[0].main,
					"cur_temp" : cur_temp
				};
				chromeLocalStorage.weatherData=JSON.stringify(returnObj);
				chromeLocalStorage.weatherTimestamp=Date.now();
				callbackFunction(returnObj);	
			});
		}
	}


	var removeSite = function(url) {
		var arr=JSON.parse(chromeLocalStorage.getItem("removedSites"));
		arr.push(url);
		chromeLocalStorage.setItem("removedSites", JSON.stringify(arr));
		chrome.topSites.get(elegantNewTabApp.showTopSites);
	}

	var showTopSites= function (d) {
		var arrObj= JSON.parse(chromeLocalStorage.getItem("removedSites"));
		var i=0;
		var counter=0;
		while(counter<12 && d[i]) {
			var top = document.querySelector("#top .row"+parseInt(counter/3));
			if(counter%3==0) {
				var topSiteHTML="";
				top.innerHTML="";
			}
			if(arrObj.indexOf(d[i].url)<0) {
				counter++;
				var tmp = document.createElement ('a');
				tmp.href = d[i].url;
				var arr = tmp.hostname.split(".");
				var logoUrl = "chrome://favicon/http://"+tmp.hostname;
				var favIco= "<img class='favico' src='"+logoUrl+"'/>";
				topSiteHTML+="<a href='" +d[i].url+ "'class='top-site btn btn-default top-site-animate'>"+favIco+"<span class='favico-text'>"+d[i].title+"</span><span class='close hidden' data-link='"+d[i].url+"'></span></a>";
			}
			if(counter%3==0) {
				top.innerHTML=topSiteHTML;
			}
			i++;
		}
		
		$(".top-site-animate").each(function(index){
			var that=$(this);
			setTimeout(function() {
				that.addClass("animate-up");
			}, 50*index);
		})
	};


	return {
		setPageBG:setPageBG,
		getQuote:getQuote,
		getAndSetWeatherWithLocation:getAndSetWeatherWithLocation,
		getWeatherUnit:getWeatherUnit,
		setWeatherUnit:setWeatherUnit,
		removeSite:removeSite,
		showTopSites:showTopSites
	}


})(jQuery, document, localStorage);



//Global Functions

var setWeather = function (weatherObj) {
	var user_preffered_unit = elegantNewTabApp.getWeatherUnit();
	var cur_temp = weatherObj.cur_temp;

	if(user_preffered_unit=="Fahrenheit") {
		cur_temp=(weatherObj.cur_temp-273)* 1.8 + 32.0;
	}
	else if(user_preffered_unit=="Celcius") {
		cur_temp-=273;
	}
	cur_temp=parseInt(cur_temp);

	$("#weather").addClass(weatherObj.iconClass);
	$("#loc").html(weatherObj.cityName);
	$("#cond").html(weatherObj.weatherDesc);
	$("#curr").html(cur_temp);
	$("#thermo").html(elegantNewTabApp.getWeatherUnit());
}


var getAndSetWeather = function (cached) {
	navigator.geolocation.getCurrentPosition(
		function(location) {
			elegantNewTabApp.getAndSetWeatherWithLocation(location,setWeather,cached);
		});
}



//Event Handlers
$(document).ready(function(){
	//Initialize Material Design
	$.material.init();

	//Focus on the Search Bar
	document.querySelector("#search-bar").focus();

	//Get image URL from Bing for the picture of the day.
	elegantNewTabApp.setPageBG();

	//Get Quote of the day
	var quote = elegantNewTabApp.getQuote();
	if(quote) {
		$("#search-bar").attr('placeholder','Google Search | '+quote);	
	}

	//Get Top Sites of Chrome
	chrome.topSites.get(elegantNewTabApp.showTopSites);

	//Get Geolocation for Weather
	getAndSetWeather(true);


	$("body").on("click", function(){
		$("#optionsMenu").addClass("hidden");
		document.querySelector("#search-bar").focus();
	});

	$("body").on("click", ".top-site, .weather-info-button", function(e){
		e.stopPropagation();
	});

	$("#location").on("click", function(){
		getAndSetWeather(false);
	});

	$("#weatherInfo").on("click", function(){
		var unit=elegantNewTabApp.getWeatherUnit();
		if(unit=="Kelvin") {
			unit="Celcius";
			elegantNewTabApp.setWeatherUnit("Celcius");
		}
		else if(unit=="Celcius") {
			unit="Fahrenheit";
			elegantNewTabApp.setWeatherUnit("Fahrenheit");
		}
		else {
			unit="Kelvin";
			elegantNewTabApp.setWeatherUnit("Kelvin");
		}
		getAndSetWeather(true);
	});

	$("#search-bar").keypress(function(e) {
		if(e.which == 13) {
			window.open("https://www.google.com/#q="+$("#search-bar").val(),"_self");
		}
	});



	// Handle Removing a Top site
	$("body").on("mouseover", ".top-site", function(){
		$(this).find(".close").removeClass("hidden");
	});

	$("body").on("mouseout", ".top-site", function(){
		$(this).find(".close").addClass("hidden");
	});

	$("body").on("click", ".close", function(e){
		e.stopPropagation();
		e.preventDefault();
		elegantNewTabApp.removeSite($(this).data("link"));
	});



	//Settings
	$(".settings").on("click", function(e){
		$("#optionsMenu").toggleClass("hidden");
		e.stopPropagation();
	});

	$("#restore").on("click", function(e){
		var arr=[];
 		localStorage.setItem("removedSites", JSON.stringify(arr));
		chrome.topSites.get(elegantNewTabApp.showTopSites);
		e.stopPropagation();
	});

	$(".apps").on("click", function() {
		chrome.tabs.create({url:'chrome://apps/'})
	});

	$(".history").on("click", function() {
		chrome.tabs.create({url:'chrome://history/'})
	});

	$("#like").on("click", function() {
		chrome.tabs.create({url:'https://www.facebook.com/ElegantNewTab'})
	});

	$("#developer").on("click", function() {
		chrome.tabs.create({url:'http://www.udaiarora.com'})
	});


	console.log("Developed by Udai Arora http://www.udaiarora.com")


});
