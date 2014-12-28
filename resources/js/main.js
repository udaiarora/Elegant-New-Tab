 // 'use strict';

 //Globals

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
		var sunny = [800,801,802];
		var clouds= [803,804,900,901,902,905];
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
			if(Date.now()<sunset) {
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
		console.log(location);
		//40.3247917,-74.55568219999999
		// "http://maps.googleapis.com/maps/api/geocode/json?latlng="++"&sensor=true"
		var timestamp= chromeLocalStorage.weatherTimestamp;
		
		//If cached weather is less than 30 mins old
		if(timestamp && timestamp>Date.now()-1800000 && chromeLocalStorage.weatherData && cached) {
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
				console.log(data)
				weatherCode=data.weather[0].id;
				sunset=data.sys.susnet;
				var iconClass= getWeatherIcon(weatherCode, sunset);
				var cur_temp=parseInt(data.main.temp);
				// var min_temp=parseInt(data.main.temp_min);
				// var max_temp=parseInt(data.main.temp_max);
				
				returnObj= {
					"iconClass" : iconClass,
					"cityName" : data.name,
					"weatherDesc" : data.weather[0].main,
					"cur_temp" : cur_temp
					// "min_temp" : min_temp,
					// "max_temp" : max_temp
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
		// chromeLocalStorage.removedSites='{"removed":"'+str.substring(0,str.length)+'"}';
		chrome.topSites.get(elegantNewTabApp.showTopSites);
	}

	var showTopSites= function (d) {
		var arrObj= JSON.parse(chromeLocalStorage.getItem("removedSites"));
		var i=0;
		var counter=0;
		while(counter<12 && d[i]) {
			var top = document.querySelector("#top .row"+parseInt(counter/3));
			if(counter%3==0) {
				top.innerHTML="";
			}
			if(arrObj.indexOf(d[i].url)<0) {
				counter++;
				var tmp = document.createElement ('a');
				tmp.href = d[i].url;
				var arr = tmp.hostname.split(".");
				// var logoUrl="http://data.scrapelogo.com/"+arr[arr.length-2]+"."+arr[arr.length-1]+"/nlogo";
				// var logoUrl="http://"+arr[arr.length-2]+"."+arr[arr.length-1]+"/favicon.ico";
				var logoUrl = "chrome://favicon/http://"+tmp.hostname;
				var favIco= "<img class='favico' src='"+logoUrl+"'/>";

				// document.querySelector("#top").innerHTML="<img src="+logoUrl+"/>"

				top.innerHTML+="<a href='" +d[i].url+ "'class='top-site btn btn-default animate-up'>"+favIco+"<span class='favico-text'>"+d[i].title+"</span><span class='close hidden' data-link='"+d[i].url+"'></span></a>";
				//<div style='background-image: linear-gradient(160deg,#1111aa,blue);' class='top-site-overlay'>&nbsp;</div>	
			}

			i++;
		}
	};


	return {
		setPageBG:setPageBG,
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
	// var min_temp = weatherObj.min_temp;
	// var max_temp = weatherObj.max_temp;

	if(user_preffered_unit=="Fahrenheit") {
		cur_temp=(weatherObj.cur_temp-273)* 1.8 + 32.0;
		// min_temp=(weatherObj.min_temp-273)* 1.8 + 32.0;
		// max_temp=(weatherObj.max_temp-273)* 1.8 + 32.0;
	}
	else if(user_preffered_unit=="Celcius") {
		cur_temp-=273;
		// min_temp-=273;
		// max_temp-=273;
	}
	cur_temp=parseInt(cur_temp);
	// min_temp=parseInt(min_temp);
	// max_temp=parseInt(max_temp);

	$("#weather").addClass(weatherObj.iconClass);
	$("#loc").html(weatherObj.cityName);
	$("#cond").html(weatherObj.weatherDesc);
	$("#curr").html(cur_temp);
	// $("#min").html(min_temp);
	// $("#max").html(max_temp);
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

	//GET image URL from Bing for the picture of the day.
	elegantNewTabApp.setPageBG();

	//Get Top Sites of Chrome
	chrome.topSites.get(elegantNewTabApp.showTopSites);

	//Get Geolocation for Weather
	getAndSetWeather(true);



	

	$("body").on("click", function(){
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



});
