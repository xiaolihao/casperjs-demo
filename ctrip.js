var conf=require('./ctrip_settings.js').conf;

var _cb;
var err=0;

function ctrip(url, params, type, cb){
	 _cb=cb;
    this.start();

	this.open(url,{

    	/* jump to english by default */
    	headers:{
        	'Accept-Language':'zh-CN'
    	}
	});

	/* wait dynamic js*/
	this.wait(1000,function(){});

	/* set depart */
	this.then(function(){
		this.sendKeys(conf.depart_selector, params.fromCity, {keepFocus:true});
        this.waitUntilVisible(conf.address_tip_selector, 

        	function(){
            	this.sendKeys(conf.depart_selector, this.page.event.key.Enter, {keepFocus:true});
			},

			function(){
				this.echo('[timeout]wait for '+conf.depart_selector);
				err=1;
			},

			5000
		);
    });

    /* set arrive */
    this.then(function(){
    	if(err)
    		return;

    	this.sendKeys(conf.arrive_selector, params.toCity, {keepFocus:true});
        this.waitUntilVisible(conf.address_tip_selector, 

        	function(){
            	this.sendKeys(conf.arrive_selector, this.page.event.key.Enter, {keepFocus:true});
			},

			function(){
				err=1;
			},

			5000
		);
    });


    /* set date */
    this.then(function(){
    	if(err)
    		return;

    	this.evaluate(function(selector, value){
            document.querySelector(selector).value=value;
    	}, conf.date_selector, params.fromDate);

    	// do search
    	this.then(function(){
        	this.sendKeys(conf.date_selector, this.page.event.key.Enter, {keepFocus:true});
        	this.capture('ctrip.png');
        	this.echo(params.fromDate);
    	});

    });
	
   
    /* wait result */
    this.waitForSelector('div.searchresult_content', 
    	function(){},

    	function(){
    		this.echo('[timeout]wait for '+conf.search_result_selector);
    		err=1;
    	},

    	5000
    );

    this.then(function(){
    	if(err)
    		return;

        var lst=this.evaluate(function(){
            var items=[];

            $('div.search_box').each(function(){
                var item={};

                /* name */
                item.name=$(this).find('td.logo div.clearfix span').text();

                /* flight id */
                item.id=$(this).find('td.logo div.clearfix strong').text();

                /* model */
                item.model=$(this).find('td.logo div.low_text span').text();
                
                if(item.model===''){
                    var str=$(this).find('td.logo span').text().split(' ');
                    if(str.length==2)
                        item.model=str[1];
                    else
                        item.model='';
                }   

                /* time info */
                item.dep_time=$(this).find('td.right strong.time').text();
                item.arv_time=$(this).find('td.left strong.time').text();
                
                /* airport info */
                item.dep_port=$(this).find('td.right div:last').text();
                item.arv_port=$(this).find('td.left div:last').text();

                // /* ontime rate */
                item.ontime_rate='';
                item.price=$(this).find('table.search_table_header td.price span').text();

                // /* sale */
                item.sale='';

                /* as debug info to remote.message */
                console.log(JSON.stringify(item));
                

                items.push(item);
            });
            
            return items;
        });
        
        if(lst.length==0){
            fs.write('empty.html', this.getHTML(), 'w');
            return;
        }

        var info={};
        info.src='CTRIP';
        info.params=params;
        info.result=lst;

        this.echo(JSON.stringify(info));
    });

	this.run(_cb);
}


exports.ctrip=ctrip;










