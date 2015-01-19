// 'use strict';

var elegantNewTabApp = (function ($, document, chromeLocalStorage, navigator, console) {

	//Weather

	var _getAndSetWeatherWithLocation= function (location, callbackFunction, cached) {
		var timestamp= chromeLocalStorage.weatherTimestamp;
		
		//If cached weather is less than 15 mins old
		if(cached && timestamp && Date.now()-timestamp<900000 && chromeLocalStorage.weatherData) {
			console.log("Cached Weather");
			callbackFunction(JSON.parse(chromeLocalStorage.weatherData));
		}

		//If cached weather is older than 30 mins
		else {
			console.log("AJAXED Weather");
			var returnObj, weatherCode, sunset, sunrise;
			$.ajax({
				url: "http://api.openweathermap.org/data/2.5/weather",
				data: {
					lat: location.coords.latitude,
					lon: location.coords.longitude
				}
			}).done(function (data){
				console.log("Weather GET Success.");
				weatherCode = data.weather[0].id;
				sunset = data.sys.sunset;
				sunrise = data.sys.sunrise;
				var iconClass = _getWeatherIcon(weatherCode, sunset, sunrise);
				var cur_temp = parseInt(data.main.temp);
				
				returnObj = {
					"iconClass" : iconClass,
					"cityName" : data.name,
					"weatherDesc" : data.weather[0].main,
					"cur_temp" : cur_temp
				};
				chromeLocalStorage.weatherData=JSON.stringify(returnObj);
				chromeLocalStorage.weatherTimestamp=Date.now();
				callbackFunction(returnObj);	
			}).fail(function(){
				console.log("Failed to fetch weather");
			});
		}
	}


	var _getAndSetWeather = function (cached) {
		navigator.geolocation.getCurrentPosition(
			function(location) {
				_getAndSetWeatherWithLocation(location,_setWeather,cached);
			});
	}


	var _setWeather = function (weatherObj) {
		var user_preffered_unit = _getWeatherUnit();
		var cur_temp = weatherObj.cur_temp;

		if(user_preffered_unit=="Fahrenheit") {
			cur_temp=(weatherObj.cur_temp-273)* 1.8 + 32.0;
		}
		else if(user_preffered_unit=="Celsius") {
			cur_temp-=273;
		}
		cur_temp=parseInt(cur_temp);

		$("#weather").removeClass();
		$("#weather").addClass("inline-block").addClass(weatherObj.iconClass);
		$("#loc").html(weatherObj.cityName);
		$("#cond").html(weatherObj.weatherDesc);
		$("#curr").html(cur_temp);
		$("#thermo").html(_getWeatherUnit());
	}


	var _getWeatherUnit = function() {
		if(!chromeLocalStorage.unit) {
			chromeLocalStorage.unit="Fahrenheit";
		}
		return chromeLocalStorage.unit;
	};


	var _setWeatherUnit = function(unitToBeSet) {
		chromeLocalStorage.unit=unitToBeSet;
	}


	var _getWeatherIcon= function (weatherCode, sunset, sunrise) {
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
			if(Date.now()/1000<sunset && Date.now()/1000>sunrise) {
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


	var displayWeather = function() {
		_getAndSetWeather(true);
	}
	









 
 	var initialize = function() {
		if(!chromeLocalStorage.removedSites) {
	 		var arr=[];
	 		chromeLocalStorage.setItem("removedSites", JSON.stringify(arr));
		 }

		 //Material Design Intialization
		$.material.init();

		console.log("Developed by Udai Arora http://www.udaiarora.com")
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
		}).done(function(data){
			var imgUrl= "http://www.bing.com"+data.images[0].url;
			document.querySelector(".bg").style.backgroundImage="url("+imgUrl+")";
		}).fail(function(data){
			var imgUrl= "/resources/images/default-background.jpg";
			document.querySelector(".bg").style.backgroundImage="url("+imgUrl+")";
		});
 	};








 	var displayQuote= function() {
 		var timestamp= chromeLocalStorage.quoteTimestamp;

		//If cached quote is less than 1 mins old
		if(timestamp && Date.now()-timestamp<60000 && chromeLocalStorage.quote) {
			var quote= chromeLocalStorage.quote;
			$("#search-bar").attr('placeholder','Google Search | '+quote).attr('title',quote);	
		}

		else {
			$.ajax({
				url: 'http://iheartquotes.com/api/v1/random',
				data: {
					format:"json",
					max_characters: 60
				}
			}).success(function(quoteJson) {
				var quote=quoteJson.quote;
				chromeLocalStorage.quote=quote;
				chromeLocalStorage.quoteTimestamp=Date.now();
				$("#search-bar").attr('placeholder','Google Search | '+quote).attr('title',quote);	
			});
		}		
	};









	var _showTopSites= function (d) {
		var arrObj= JSON.parse(chromeLocalStorage.getItem("removedSites"));
		var i=0;
		var counter=0;
		for(var k=0;k<4;k++) {
			document.querySelector("#top .row"+parseInt(k)).innerHTML="";
		}
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

				// var logoUrl = "chrome://favicon/http://"+tmp.hostname;
				var logoUrl = "http://www.google.com/s2/favicons?domain=http://"+tmp.hostname;
				var favIco= "<img class='favico' src='"+logoUrl+"'/>";
				topSiteHTML+="<a href='" +d[i].url+ "'class='top-site btn btn-default top-site-animate'>"+favIco+"<span class='favico-text'>"+d[i].title+"</span><span class='close hidden' data-link='"+d[i].url+"'></span></a>";
			}
			i++;
			if(counter%3==0 || !d[i] || counter==12) {
				top.innerHTML=topSiteHTML;
			}
		}
		
		$(".top-site-animate").each(function(index){
			var that=$(this);
			setTimeout(function() {
				that.addClass("animate-up");
			}, 70*index);
		})
	};


	var displayTopSites = function() {
		//Get Top Sites of Chrome
		chrome.topSites.get(_showTopSites);
	}









	var _removeSite = function(url) {
		var arr=JSON.parse(chromeLocalStorage.getItem("removedSites"));
		arr.push(url);
		chromeLocalStorage.setItem("removedSites", JSON.stringify(arr));
		chrome.topSites.get(_showTopSites);
	}

	var handleTopSiteRemoval = function(){
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
			_removeSite($(this).data("link"));
		});
	}







	
	var handleSettings = function() {
		//Settings
		$(".settings").on("click", function(e){
			$("#optionsMenu").toggleClass("hidden");
			e.stopPropagation();
		});

		$("#restore").on("click", function(e){
			var arr=[];
	 		chromeLocalStorage.setItem("removedSites", JSON.stringify(arr));
			chrome.topSites.get(_showTopSites);
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
	}

	var handleClickEvents = function() {	
		$("body").on("click", function(){
			$("#optionsMenu").addClass("hidden");
			document.querySelector("#search-bar").focus();
		});

		$("body").on("click", ".top-site, .weather-info-button", function(e){
			e.stopPropagation();
		});

		$("#location").on("click", function(){
			_getAndSetWeather(false);
		});

		$("#weatherInfo").on("click", function(){
			var unit=_getWeatherUnit();
			if(unit=="Kelvin") {
				unit="Celsius";
				_setWeatherUnit("Celsius");
			}
			else if(unit=="Celsius") {
				unit="Fahrenheit";
				_setWeatherUnit("Fahrenheit");
			}
			else {
				unit="Kelvin";
				_setWeatherUnit("Kelvin");
			}
			_getAndSetWeather(true);
		});

		$("#search-bar").keypress(function(e) {
			if(e.which == 13) {
				window.open("https://www.google.com/#q="+$("#search-bar").val(),"_self");
			}
		});
	}

	return {
		setPageBG:setPageBG,
		displayQuote:displayQuote,
		handleTopSiteRemoval: handleTopSiteRemoval,
		handleSettings: handleSettings,
		handleClickEvents: handleClickEvents,
		displayWeather: displayWeather,
		displayTopSites: displayTopSites,
		initialize: initialize
	}


})(jQuery, document, localStorage, navigator, console);





//Event Handlers
$(document).ready(function(){
	//Initialize Stuff
	elegantNewTabApp.initialize();

	//Get Quote of the day
	elegantNewTabApp.displayQuote();
	elegantNewTabApp.displayTopSites();
	elegantNewTabApp.displayWeather();

	//Handle Stuff
	elegantNewTabApp.handleClickEvents();
	elegantNewTabApp.handleTopSiteRemoval();
	elegantNewTabApp.handleSettings();

	//Get image URL from Bing for the picture of the day.
	elegantNewTabApp.setPageBG();

});
