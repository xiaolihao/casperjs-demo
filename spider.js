/*
    CASPERJS RUNNING SEQUENCE

    code outside of only then will be run firstly
    in nested then function:
        this.then(function(){
            // some code ...                    1

            this.then(function step1(){...})    5

            function(){
                
                // nest code ...                2

                this.then(function(){...})      6

            }();

            // some other code ...              3

            this.then(function step2(){...})    7

            // some another code ..             4
        })
*/



var fs=require('fs');
var conf=require('./spider_settings.js').conf;
var qunar=require('./qunar.js').qunar;
//var ctrip=require('./ctrip.js').ctrip;

var casper_option={   
    verbose: true, 
    //logLevel: 'info',
    exitOnError: false,
    pageSettings: {
         loadImages:  false,        
         loadPlugins: false,         
         userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36'
    },
    viewportSize: {width: 1680, height: 1080},
    clientScripts: ['jquery-2.1.0.min.js'],
};

var casper=require('casper').create(casper_option);

casper.start().then(function(){
    this.echo('starting');
});
casper.run(load_job);


var res=null;
var reboot_max_done_jobs=casper.cli.get(0);

var counter=0;
var master=casper.cli.get(1);

function load_job(){
    ++counter;
    this.echo('counter:'+counter);

    if(counter > reboot_max_done_jobs){
        fs.write('spider_stop.txt', '', 'w');
        this.exit();
    }

    this.start();
    this.open(conf.job_address, {
            method: conf.job_method
    });

    this.then(function(){
        this.echo('JOB:'+this.page.plainText);

        try{
            res=JSON.parse(this.page.plainText);
        }
        catch(e){
            this.echo('EXCEPTION:'+e);
            res=null;
        }
        
    });

    this.then(function(){
        if(res&&res.status != 'OK')
            this.wait(1000*60, function(){});
    });

    this.run(spider);
}


function spider(){
    if(!res || res.status != 'OK'){
        load_job.call(this);
        return;
    }

    if(res.job.source==conf.source.qunar)
        qunar.call(this, res.job.url, res.job.params, res.job.type, res.job.filter,load_job, master);
    else/* if(job.source===conf.source.ctrip)
        ctrip.call(this, job.url, job.params, job.type, load_job);*/
        load_job.call(this);
};

casper.on('remote.message', function(msg){
    this.echo('remote message:'+msg);
});

casper.on('error', function(msg, backtrace){
    this.echo(msg);
    // this.clear();
    // this.then(function(){
    //     load_job.call(this);
    // });
    fs.write('spider_stop.txt', '', 'w');
    this.exit();
});


