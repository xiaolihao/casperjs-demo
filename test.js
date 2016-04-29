var casper=require('casper').create({
	exitOnError: false,
	
});
casper.start();
casper.then(function(){});
casper.run(start_again);





function start_again(){
	casper.start();
	casper.open('http://www.baidu.com');
	casper.then(function(){
		this.mouseEvent('click', 'div.a_booking a.btn_book');
	});
	casper.run(start_again);
}

casper.on('error', function(msg, backtrace){
	this.echo(msg);
	this.echo(backtrace);
});



// var fs=require('fs');
// var casper=require('casper').create();
// casper.start();
// casper.then(function(){
// 	var fd=fs.open('test.xls', 'a+');

// 	fd.write('id\tname\n');
// 	fd.write('1\tlihao\n');
// 	fd.close();
// });

// casper.run(function(){
// 	this.exit();
// });


// NodeUglifier = require("node-uglifier");
// nodeUglifier = new NodeUglifier("./qunar.js");
// mergedSource = nodeUglifier.merge().uglify().toString();

// console.log(mergedSource);

// var casper=require('casper').create();

// casper.start();

// casper.echo('step1');

// casper.then(function(){
// 	this.echo('step5');

// 	this.then(function(){

// 		this.echo('step7');
// 		x.call(this,2);
// 		this.echo('step9');

// 	})

// 	this.echo('step6');
// })

// casper.echo('step2');

// casper.then(function (){
// 	this.echo('step11');
// })
// casper.echo('step3');

// casper.run(function(){
// 	this.echo('exit');
// })

// casper.echo('step4');


// function x(i){

// 	if(i==1){
// 		this.echo('x');
// 	}

// 	else if(i==2){
// 		this.then(function(){
// 			this.echo('step10');
// 		})
// 	}

// 	this.echo('step8');


// 	// this.start();
// 	// this.then(function(){
// 	// 	this.echo('nest then');
// 	// })
// 	// this.run(function(){
// 	// 	this.echo('nest exit');
// 	// })
// }