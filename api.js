
var restify=require('restify'),
	mysql=require('mysql');

/* start server */
var server = restify.createServer({name:'job_api'});
server.listen(9001, function() {
  console.log('%s listening at %s', server.name, server.url);
});


/* parse POST params */
server.use(restify.bodyParser());
/* parse GET params */
server.use(restify.queryParser());

/* connect to mysql */
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


var job=[
	
	{
		url:'http://flight.qunar.com/', 
		source:'QUNAR',
		type:'internal',
		filter:'S',								//直飞
		params:{
            	searchType:'OnewayFlight',
            	fromCity:'shanghai',
            	toCity:'munich',
            	fromDate:'2014-10-28'
			}						
	},

	{url:'http://flight.qunar.com/', 
				source:'QUNAR',
				type:'internal',
				filter:'S',
				params:{
                	searchType:'OnewayFlight',	//往返RoundTripFlight
                	fromCity:'重庆',
                	toCity:'澳门',
                	//toDate:'2014-11-01'//,			//返回日期
                	fromDate:'2014-10-26',
                	//searchType:'RoundTripFlight',	//往返RoundTripFlight
                	//fromCity:'北京',
                	//toCity:'悉尼',
                	//toDate:'2014-11-12',			//返回日期
                	//fromDate:'2014-11-01'//,
                }}
];


function update_job(rid){
	var incr_str = 'UPDATE flight_task SET flag=1 WHERE id=\''+rid+'\'';
	conn.query(incr_str, function (err, rows){
            if (err) console.log(err);
       });
}

server.get('/api/job', function(req, res, next){

	var query_str = 'SELECT * FROM flight_task WHERE flag=0 LIMIT 1';
	var message={};

	conn.query(query_str, function (err, rows) {
            if (err){
            	console.log(err);
            	message={
							status:'ERROR',
							job:err						
						};
            }

            else if(rows.length==0)
            	message={
							status:'NO_JOB',
							job:'NULL'						
						};

			else{
				update_job(rows[0].id);

				var job={
					url:'http://flight.qunar.com/', 
					source:'QUNAR',
					type:'internal',
					filter:rows[0].filter,
					params:{
            			searchType:rows[0].search_type,
            			fromCity:rows[0].from_city,
            			toCity:rows[0].to_city,
            			fromDate:rows[0].from_date
					}	
				};

				message.status='OK',
				message.job=job;
			}
			


			console.log(message);
			res.writeHead(200, {'Content-Type':'application/json;charset=utf-8' });
			res.write(JSON.stringify(message));
			res.end();
 
        });

	/*
	var i=Math.floor(Math.random()*2);
	console.log(job[i]);
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8' });
	res.write(JSON.stringify({
		status:'OK',
		job:job[1]
	}));
	res.end();
	*/
});































