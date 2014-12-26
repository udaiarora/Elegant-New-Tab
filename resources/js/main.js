 // 'use strict';

 //Globals

var elegantNewTabApp=(function($, document, chromeLocalStorage) {

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
			chromeLocalStorage.unit="F";
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

	var getAndSetWeatherWithLocation= function (location, callbackFunction) {
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
			sunset=data.sys.susnet;
			var iconClass= getWeatherIcon(weatherCode, sunset);
			var cur_temp=parseInt(data.main.temp);
			var min_temp=parseInt(data.main.temp_min);
			var max_temp=parseInt(data.main.temp_max);
			var unit = elegantNewTabApp.getWeatherUnit();
			if(unit=="F") {
				cur_temp=(cur_temp-273.15)* 1.8000 + 32.00;
				min_temp=(min_temp-273.15)* 1.8000 + 32.00;
				max_temp=(max_temp-273.15)* 1.8000 + 32.00;
			}
			else if(unit=="C") {
				cur_temp-=273.15;
				min_temp-=273.15;
				max_temp-=273.15;
			}
			cur_temp=parseInt(cur_temp);
			min_temp=parseInt(min_temp);
			max_temp=parseInt(max_temp);

			returnObj= {
				"iconClass" : iconClass,
				"cityName" : data.name,
				"weatherDesc" : data.weather[0].main,
				"cur_temp" : cur_temp,
				"min_temp" : min_temp,
				"max_temp" : max_temp,
				"unit" : unit
			};

			callbackFunction(returnObj);	
		});
	};

	var showTopSites= function (d) {
		for(var i=0;i<12;i++) {
			var top = document.querySelector("#top .row"+parseInt(i/3));
			if(d[i]) {
				var tmp       = document.createElement ('a');
				tmp.href   = d[i].url;
				var arr = tmp.hostname.split(".");
			// var logoUrl="http://data.scrapelogo.com/"+arr[arr.length-2]+"."+arr[arr.length-1]+"/nlogo";
			// var logoUrl="http://"+arr[arr.length-2]+"."+arr[arr.length-1]+"/favicon.ico";
			var logoUrl = "chrome://favicon/http://"+tmp.hostname;
			var favIco= "<img class='favico' src='"+logoUrl+"'/>";

			// document.querySelector("#top").innerHTML="<img src="+logoUrl+"/>"

			top.innerHTML+="<a href='" +d[i].url+ "'class='top-site btn btn-default'>"+favIco+"<span class='favico-text'>"+d[i].title+"</span></a>";
			//<div style='background-image: linear-gradient(160deg,#1111aa,blue);' class='top-site-overlay'>&nbsp;</div>
			}
		}
	};


	return {
		setPageBG:setPageBG,
		getAndSetWeatherWithLocation:getAndSetWeatherWithLocation,
		getWeatherUnit:getWeatherUnit,
		setWeatherUnit:setWeatherUnit,
		showTopSites:showTopSites
	}


})(jQuery, document, localStorage);



//Global Functions

var setWeather = function (weatherObj) {
	$("#weather").addClass(weatherObj.iconClass);
	$("#loc").html(weatherObj.cityName);
	$("#cond").html(weatherObj.weatherDesc);
	$("#curr").html(weatherObj.cur_temp);
	$("#min").html(weatherObj.min_temp);
	$("#max").html(weatherObj.max_temp);
	$("#thermo").html(weatherObj.unit);
}


var getAndSetWeather = function () {
	navigator.geolocation.getCurrentPosition(
		function(location) {
			elegantNewTabApp.getAndSetWeatherWithLocation(location,setWeather);
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
	getAndSetWeather();


	$("body").on("click", function(){
		document.querySelector("#search-bar").focus();
	});

	$(".top-site").on("click", function(e){
		e.stopPropagation();
	});

	$("#location").on("click", function(){
		getAndSetWeather();
	});

	$("#weatherInfo").on("click", function(){
		var unit=elegantNewTabApp.getWeatherUnit();
		if(unit=="K") {
			unit="C";
			elegantNewTabApp.setWeatherUnit("C");
		}
		else if(unit=="C") {
			unit="F";
			elegantNewTabApp.setWeatherUnit("F");
		}
		else {
			unit="K";
			elegantNewTabApp.setWeatherUnit("K");
		}
		getAndSetWeather();
	});

	$("#search-bar").keypress(function(e) {
		if(e.which == 13) {
			window.open("https://www.google.com/#q="+$("#search-bar").val(),"_self");
		}

	});


});
