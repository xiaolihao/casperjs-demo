

var tesseract=require('node-tesseract');
var fs=require('fs');
var exec = require('child_process').exec;
var mysql=require('mysql');
var uuid=require('node-uuid');

console.log('--------SPIDER DEAMON--------');

var conn;
function connect_to_mysql(){
	conn=mysql.createConnection({
    	host: '192.168.1.10',
    	user: 'lf_dev',
    	password: '123456',
    	database: 'lf',
    	port: '3306'
	});

	conn.connect(function(err){
		if(err){
			console.log('err when connecting to db:', err);
			setTimeout(connect_to_mysql, 2000);
		}
	});

	conn.on('error', function(err){
		console.log('db error', err);

		if(err.code==='PROTOCOL_CONNECTION_LOST')
			connect_to_mysql();
		else
			throw err;
	});
}

connect_to_mysql();

var counter=1;

/* id code */
fs.watchFile('qunar_cpt.png', function(curr, prev){
  	tesseract.process(__dirname+'/qunar_cpt.png', function(err, text){
		console.log('['+new Date()+'] cpt code:'+text);
		fs.writeFile('qunar_cpt_result.txt', text);
	});
});

 
/* spider reboot */
fs.watchFile('spider_stop.txt', function(curr, prev){

	exec('nohup casperjs spider.js 20 MASTER > spider.log&');
  	console.log('['+new Date()+'] spider reboot '+counter++);
});


/* data */

/*

{"dep":"重庆","arv":"澳门","type":0,"from_time":"2014-10-26","fc_name":"澳门航空","direct":1,
"fc_price":"670","fc_tax":"税费358","o1_name":"康途航空",
"o1_price":"1021","o1_tax":"¥358税费","o2_name":"秦天下商旅网","o2_price":"1029","o2_tax":"¥358税费"}

*/
fs.watchFile('flight_data.txt', function(curr, prev){

  	var data=fs.readFileSync('flight_data.txt');
  	var json_data=JSON.parse(data.toString());
  	console.log(data.toString());

  	var flag=0;
  	if(json_data.o1_name.indexOf('联丰')==-1)
  		flag=1;

  	var sql='INSERT INTO flight_result VALUES('+
            '\''+uuid.v1()+'\''+','+
            '\''+json_data.dep+'\''+','+
            '\''+json_data.arv+'\''+','+
            '\''+'OnewayFlight'+'\''+','+
            '\''+json_data.from_time+'\''+','+
            '\''+'NULL'+'\''+','+
            '\''+json_data.fc_name+'\''+','+
            '\''+json_data.fc_price+'\''+','+
            '\''+json_data.fc_tax+'\''+','+
            '\''+json_data.o1_name+'\''+','+
            '\''+json_data.o1_price+'\''+','+
            '\''+json_data.o1_tax+'\''+','+
            '\''+json_data.o2_name+'\''+','+
            '\''+json_data.o2_price+'\''+','+
            '\''+json_data.o2_tax+'\''+','+
            '\''+flag+'\''+','+
            '\''+0+'\''+','+
            '\''+'S'+'\''+
            ')';
	

	conn.query(sql, function (err, res){
        if (err){
            console.log(err);
        }
    });


});









