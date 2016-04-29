var fs=require('fs');

var casper_option={   
    verbose: true, 
    logLevel: 'info',
    pageSettings: {
         loadImages:  true,        
         loadPlugins: false,         
         userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36'
    },
    viewportSize: {width: 1680, height: 1080},
    clientScripts: ['jquery-2.1.0.min.js']
};

var casper=require('casper').create(casper_option);

var _url=casper.cli.get(0);
//var _url='http://flight.qunar.com/twelli/flight/busy.jsp?inter=true&ret=http://flight.qunar.com/site/oneway_list_inter.htm?searchDepartureAirport=%E4%B8%8A%E6%B5%B7&searchArrivalAirport=%E6%85%95%E5%B0%BC%E9%BB%91&searchDepartureTime=2014-10-29&searchArrivalTime=2014-08-26&nextNDays=0&startSearch=true&from=fi_dom_search';

var idx=_url.indexOf('ret');
var url=_url.substr(idx+4);

casper.start().then(function(){
    this.echo('starting');
});

cpt_check();


function capture_code(){
	this.captureSelector('qunar_cpt.png', 'img#captcha_Img');
}

function space_trim(str){   
        return str.replace(/(^\s*)|(\s*$)/g, '');   
}

function cpt_check(){

	casper.open(url);

	/* wait for redirect */
	casper.wait(2000, function(){
		if(!this.exists('div.cpt')){
        	this.exit();
    	}
	});


	casper.then(capture_code);

	casper.wait(2000, function(){
		var data=fs.read('qunar_cpt_result.txt');
		data=space_trim(data);
		var param={};
		param.captcha=data;

		this.fill('form', param, true);

		//this.wait(1000, function(){});
	});


	// casper.then(function(){
	// 	if(this.exists('div.cpt')){
 //        	cpt_check();
 //    	}
	// });
	
}

casper.run(function(){
	this.exit();
});