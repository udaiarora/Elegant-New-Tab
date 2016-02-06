// 'use strict';

var elegantNewTabApp = (function ($, document, chromeLocalStorage, navigator, console) {

	var _colorAdapt = function() {
		// Add color to ripple effect | Color Thief
		var colorThief= new ColorThief();
		$(".top-site-animate").each(function(index){
			var that=$(this);
			var favIco=that.find(".favico");
			try {
				var dominantColor=colorThief.getPalette(favIco[0],3)[0];
				var inkbg= "background: rgb("+dominantColor[0]+","+dominantColor[1]+","+dominantColor[2]+")"
				that.find(".ink").attr("style",inkbg);
			}
			catch(e) {
				console.log("Problem with ColorThief: "+e)
			}

		});
	}


	//Weather
	var _getAndSetWeather = function (cached) {
		var timestamp= chromeLocalStorage.getItem("weatherTimestamp");
		
		//If cached weather is less than 30 mins old
		if(cached && timestamp && Date.now()-timestamp<30*60*1000 && chromeLocalStorage.getItem("weatherData")) {
			console.log("Cached Weather");
			_setWeather(JSON.parse(chromeLocalStorage.getItem("weatherData")));
		}

		//If cached weather is older than 30 mins
		else {
			navigator.geolocation.getCurrentPosition(
				function(location) {
					console.log("AJAXED Weather");
					var returnObj, weatherCode, sunset, sunrise;


					$.simpleWeather({
						location: location.coords.latitude+", "+location.coords.longitude,
						woeid: '',
						unit: 'f',
						success: function(weather) {
							weather.code=31;
							var iconClass = _getWeatherIcon(parseInt(weather.code), weather.sunset, weather.sunrise);
							returnObj = {
								"iconClass" : iconClass,
								"cityName" : weather.city,
								"weatherDesc" : weather.text,
								"cur_temp" : weather.temp
							};
							chromeLocalStorage.setItem("weatherData",JSON.stringify(returnObj));
							chromeLocalStorage.setItem("weatherTimestamp",Date.now());
							_setWeather(returnObj);	

						},
						error: function(error) {
							$("#weather").html('<p>'+error+'</p>');
						}
					});


					
					

				});

		}


	}


	var _setWeather = function (weatherObj) {
		console.log("----",weatherObj)
		var user_preffered_unit = _getWeatherUnit();
		var cur_temp = parseInt(weatherObj.cur_temp);

		if(user_preffered_unit=="Kelvin") {
			cur_temp=(cur_temp+459.67)/ 1.8;
		}
		else if(user_preffered_unit=="Celsius") {
			cur_temp=(cur_temp-32)/1.8;
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
		if(!chromeLocalStorage.getItem("unit")) {
			chromeLocalStorage.setItem("unit","Fahrenheit");
		}
		return chromeLocalStorage.getItem("unit");
	};


	var _setWeatherUnit = function(unitToBeSet) {
		chromeLocalStorage.setItem("unit",unitToBeSet);
	}


	var _getWeatherIcon= function (weatherCode) {
		var rain = [5,6,7,8,9,10,11,12,35,40,45,47];
		var thunderstorm = [0,1,2,3,4,37,38,39];
		var snow= [13,14,15,16,17,18,41,42,43,46];
		var sunny = [32,34,36];
		var starry = [31,33]
		var clouds= [26,27,28,29,30,44];
		var rainbow = [951,952,953,954,955];
		var haze = [20,21,22,23,24,25];
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
				return "sunny";
		}
		if(starry.indexOf(weatherCode)>-1) {
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
		if(!chromeLocalStorage.getItem("removedSites")) {
			var arr=[];
			chromeLocalStorage.setItem("removedSites", JSON.stringify(arr));
		}

	//Setup Up Weather vs Agenda
	(function(){
		$(".onoffswitch-checkbox")[0].checked=chromeLocalStorage.getItem("weatherVsAgenda")==="true";
		if($(".onoffswitch-checkbox")[0].checked) {
			$("#weathers").addClass("hidden");
			$("#notes").removeClass("hidden");
		}
		else {
			$("#notes").addClass("hidden");
			$("#weathers").removeClass("hidden");
		}
	}())

	//Ripple Effect Handler
	$(function(){
		var ink, d, x, y;
		$("body").on("click", ".ripplelink", function(e){
			if($(this).find(".ink").length === 0){
				$(this).prepend("<span class='ink'></span>");
			}

			ink = $(this).find(".ink");
			ink.removeClass("animate");

			if(!ink.height() && !ink.width()){
				d = Math.max($(this).outerWidth(), $(this).outerHeight());
				ink.css({height: d, width: d});
			}

			x = e.pageX - $(this).offset().left - ink.width()/2;
			y = e.pageY - $(this).offset().top - ink.height()/2;

			ink.css({top: y+'px', left: x+'px'}).addClass("animate");
		});
	});

	//Autocomplete
	$( "#search-bar" ).autocomplete({
		source: function(request, response) {
			var q= "http://suggestqueries.google.com/complete/search";
			$.ajax({
				url: q,
				data: {
					"client": "firefox",
					"q": request.term
				}
			}).done(function (data){
				data=$.parseJSON(data)
				var key= data[0];
				response(data[1].slice(0,5));
			});
		},
		select: function( event, ui ) {
			if (event.which === 13) {
				window.open("https://www.google.com/#q="+ui.item.value,"_self");
			}
		}
	});

	//Load Persona Info and Agenda
	if(chromeLocalStorage.getItem("personName")) {
		$("#personName").val(chromeLocalStorage.getItem("personName"));
	}

	if(chromeLocalStorage.getItem("agenda")) {
		$("#agenda").val(chromeLocalStorage.getItem("agenda"));
	}

	//Load Clock
	(function(){
		var date = new Date(),
		year = date.getFullYear(),
		month = date.getMonth(),
		day = date.getDate(),
		months = [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

		document.getElementById('daymonth').innerHTML = months[month] + " " + day;

		var clockH = $(".hours");
		var clockM = $(".minutes");

		function time() {     
			var d = new Date(),
			s = d.getSeconds() * 6,
			m = d.getMinutes() * 6 + (s / 60),
			h = d.getHours() % 12 / 12 * 360 + (m / 12);  
			clockH.css("transform", "rotate("+h+"deg)");
			clockM.css("transform", "rotate("+m+"deg)");  
		}

		var clock = setInterval(time, 60000);
		time();
	}())

}







var setPageBG= function (){
	var timestamp= chromeLocalStorage.getItem("AjaxedBGTimestamp");
	if(chromeLocalStorage.getItem("custombgurl")) {
		document.querySelector(".bg").style.backgroundImage="url("+chromeLocalStorage.getItem("custombgurl")+")";
		$(".bg").css("opacity",1);
	}
	else if(chromeLocalStorage.getItem("ajaxedBG") && timestamp && Date.now()-timestamp<1800000) {
		document.querySelector(".bg").style.backgroundImage="url("+chromeLocalStorage.getItem("ajaxedBG")+")";
		$(".bg").css("opacity",1);
	}
	else {
		$.ajax({
			url: 'https://peaceful-plateau-2815.herokuapp.com/'
		}).done(function(data){
			var imgUrl= "https://peaceful-plateau-2815.herokuapp.com/Stocks/"+data.bgurl;
			document.querySelector(".bg").style.backgroundImage="url("+imgUrl+")";
			$(".bg").css("opacity",1);
			chromeLocalStorage.setItem("ajaxedBG", imgUrl);
			chromeLocalStorage.setItem("AjaxedBGTimestamp", Date.now());

		}).fail(function(data){
			var imgUrl= "/resources/images/ent-default-background.jpg";
			document.querySelector(".bg").style.backgroundImage="url("+imgUrl+")";
		});
	}

};








var displayQuote= function() {
	var timestamp= chromeLocalStorage.getItem("quoteTimestamp");

		//If cached quote is less than 1 mins old
		if(timestamp && Date.now()-timestamp<1*60*1000 && chromeLocalStorage.getItem("quote")) {
			var quote= chromeLocalStorage.getItem("quote");
			$("#search-bar").attr('placeholder',quote).attr('title',quote);	
		}

		else {
			$.ajax({
				url: 'http://www.swanandmokashi.com/Homepage/Webservices/QuoteOfTheDay.asmx/GetQuote'
			}).success(function(quoteJson) {
				var quote=quoteJson['childNodes'][0]['children'][0]['innerHTML']
				chromeLocalStorage.setItem("quote", quote);
				chromeLocalStorage.setItem("quoteTimestamp", Date.now());
				$("#search-bar").attr('placeholder',quote).attr('title',quote);	
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

				var logoUrl = "chrome://favicon/"+tmp.href;
				// var logoUrl = "https://www.google.com/s2/favicons?domain=http://"+tmp.hostname;

				var favIco= "<img class='favico' src='"+logoUrl+"'/>";

				topSiteHTML+="<a href='" +d[i].url+ "'class='animate-up top-site ripplelink btn btn-default top-site-animate'><span class='ink'></span>"+favIco+"<span class='favico-text'>"+d[i].title+"</span><span class='close hidden' data-link='"+d[i].url+"'></span></a>";

			}
			i++;
			if(counter%3==0 || !d[i] || counter==12) {
				top.innerHTML=topSiteHTML;
			}


		}

		setTimeout(function(){_colorAdapt();},100);

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

		$("#optionsMenu").on("click", function(e){
			e.stopPropagation();
		});

		$("#custombgurl").on("keypress", function(e){
			if (e.which==13) {
				chromeLocalStorage.setItem("custombgurl", $(this).val().trim());
				location.reload();
			}
		});

		$("#restore").on("click", function(e){
			var arr=[];
			chromeLocalStorage.setItem("removedSites", JSON.stringify(arr));
			chrome.topSites.get(_showTopSites);
			e.stopPropagation();
		});

		$("#restorebg").on("click", function(e){
			delete chromeLocalStorage.custombgurl;
			e.stopPropagation();
			location.reload();
		});

		$(".apps").on("click", function() {
			chrome.tabs.create({url: 'chrome://apps/'});
		});

		$(".history").on("click", function() {
			chrome.tabs.create({url: 'chrome://history/'});
		});

		$(".chrome-bookmarks").on("click", function() {
			chrome.tabs.create({url: 'chrome://bookmarks'});
		});

		$("#like").on("click", function() {
			chrome.tabs.create({url:'https://www.facebook.com/ElegantNewTab'});
		});

		$("#follow").on("click", function() {
			chrome.tabs.create({url:'https://www.twitter.com/elegantnewtab'});
		});

		$("#developer").on("click", function() {
			chrome.tabs.create({url:'http://www.udaiarora.com'});
		});
	}

	var handleClickEvents = function() {	
		$("body").on("click", ".bg-holder", function(){
			$("#optionsMenu").addClass("hidden");
			document.querySelector("#search-bar").focus();
		});

		$("body").on("click", ".top-site, .weather-info-button, .trip-overlay", function(e){
			e.stopPropagation();
		});

		$("body").on("click", "a", function(e){
			console.log($(this).attr('href'))
		});

		//Weather vs Agenda
		$(".onoffswitch-checkbox").on("change", function(){
			chromeLocalStorage.setItem("weatherVsAgenda",$(".onoffswitch-checkbox")[0].checked);

			if($(".onoffswitch-checkbox")[0].checked) {
				$("#weathers").addClass("hidden");
				$("#notes").removeClass("hidden");
			}
			else {
				$("#notes").addClass("hidden");
				$("#weathers").removeClass("hidden");
			}
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

		//Profile and Agenda
		$("#personName").on("change", function(){
			chromeLocalStorage.setItem("personName",$("#personName").val());
		});

		$("#agenda").on("change", function(){
			chromeLocalStorage.setItem("agenda",$("#agenda").val());
		});

		//Search
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
