
var conf=require('./qunar_settings.js').conf;
var fs=require('fs');
var child_process=require('child_process');

var _cb;
function qunar(url, params, type, filter, cb, master){
    _cb=cb;

    this.start();
	this.open(url);

	this.waitForSelector(conf.search_form_selector,
    
    	/* then */
    	function(){
        	this.fill('form', params, true);
    	},

    	/* timeout */
    	function(){
    		this.echo('[timeout]'+url);
	});

    function cpt_check(){
        if(this.exists(conf.cpt_selector)){
            this.echo('[decoding]:'+this.getCurrentUrl());

            this.then(function(){
                if(master=='MASTER')
                    child_process.execFile('casperjs', ['qunar_crack_cpt.js',this.getCurrentUrl()], null, function(err, stdout, stderr){
                    // console.log(err);
                    // console.log(JSON.stringify(stdout));
                    // console.log(JSON.stringify(stderr));
                    
                    });
            });
            

            this.wait(1000*15, function(){});
            this.then(function(){
                var _url=this.getCurrentUrl();
            
                var idx=_url.indexOf('ret');

                this.open(_url.substr(idx+4));
                cpt_check.call(this);
            });
            
        }
    }

    this.then(function(){
        cpt_check.call(this);
    });

    if(filter=='S'){
        this.then(function(){
            this.mouseEvent('click', 'input.inp-chk');
        });
        
    }


    /* price will change a little bit */
    this.then(wait_for_search_complete);

    
    this.then(function(){
        //this.echo(this.getCurrentUrl());
        trace_page.call(this, params, type);
    })


    this.run(_cb);
};


function wait_for_search_complete(){
    this.wait(1000, function(){});

    this.then(function(){
        this.capture('dynamic_price.png');
        var ret=this.evaluate(function(){
            var str=$('span.dec b.highlight').last().text();
            if(isNaN(str))
                return 1;
            else
                return 0;
        });

        if(ret == 1)
            wait_for_search_complete.call(this);
    });
    
}


function trace_page(params, type){

    /* parse html... */
    if(this.exists(conf.no_flight_selector)){
        return;
    }

    this.then(function(){
        var lst=null;
        var info={};

        this.then(function(){
            if(type=='internal'){

                if(params.searchType=='RoundTripFlight')
                    lst=this.evaluate(internal_round_trip_parse);
                else if(params.searchType=='OnewayFlight')
                    lst=this.evaluate(internal_oneway_parse);
            }
            else
                lst=this.evaluate(demostic_oneway_parse);
        
            if(!lst||lst.length==0){
                fs.write('empty.html', this.getHTML(), 'w');
                return;
            }


            info.src='QUNAR';
            info.params=params;
            info.result=lst;
            info.type=type;

            //this.echo(JSON.stringify(info));
        });

        

        this.then(function(){
            if(!info.result)
                return;

            //fs.write('empty.html', this.getHTML(), 'w');

            /* just ext first */
            this.mouseEvent('click', 'div.a_booking a.btn_book');
        });


        this.then(wait_for_other_price_complete);
        this.then(function(){
            var other_price=null;
            if(type=='internal')
                other_price=this.evaluate(internal_parse_other_price);

            info.result[0].other_price=other_price;

            this.echo(JSON.stringify(info));

            var result={};
            result.dep=info.params.fromCity;
            result.arv=info.params.toCity;

            if(info.params.searchType=='OnewayFlight')
                result.type=0;
            else
                result.type=1;

            result.from_time=info.params.fromDate;
            if(result.type==1)
                result.to_time=info.params.toDate;

            if(info.result[0].type=='direct'){
                result.fc_name=info.result[0].info.name;
                result.direct=1;
                
            }
            else{
                result.fc_name=info.result[0].g1_info.name+'/'+info.result[0].g2_info.name;
                result.direct=0;
            }

            result.fc_price=info.result[0].price;
            result.fc_tax=info.result[0].tax;

            if(info.result[0].other_price.length>=1){
                result.o1_name=info.result[0].other_price[0].name;
                if(info.result[0].other_price[0].ofc==1)
                    result.o1_name='官网';
                result.o1_price=info.result[0].other_price[0].price;
                result.o1_tax=info.result[0].other_price[0].tax;
            }

            if(info.result[0].other_price.length>=2){
                result.o2_name=info.result[0].other_price[1].name;
                if(info.result[0].other_price[1].ofc==1)
                    result.o2_name='官网';
                result.o2_price=info.result[0].other_price[1].price;
                result.o2_tax=info.result[0].other_price[1].tax;
            }

            fs.write('flight_data.txt', JSON.stringify(result), 'w'); 
        });

        function wait_for_other_price_complete(){
            if(!info.result)
                 return;

            this.wait(500, function(){});

            this.then(function(){
                var ret=this.evaluate(function(){
                    var f=$('div.avt_column').first();

                    if($(f).find('div.b_qvt_lst').length>0)
                        return 0;
                    else
                        return 1;
                });
            if(ret)
                wait_for_other_price_complete.call(this);
            });
        }


        // this.wait(2000,function(){
        //     if(!info.result)
        //         return;

        //     var other_price=null;
        //     if(type=='internal')
        //         other_price=this.evaluate(internal_parse_other_price);

        //     info.result[0].other_price=other_price;

        //     this.echo(JSON.stringify(info));
        // });


        //this.wait(5000, function(){});
    });
    
    
    
    /* next page */
    /* not need to current requirement */
    /*this.then(function(){
        if(this.exists(conf.next_page_selector)){
            this.click(conf.next_page_selector);
            this.then(function(){
                trace_page.call(this, params, type);
            });
        }
    });*/
    

};



function internal_parse_other_price(){
    var lst=$('div.e_qvt_hd').next();

    var other_price=[];
    $(lst).find('div.qvt_column').each(function(){
        var item={};

        item.name=$(this).find('div.t_name').text();
        item.tax=$(this).find('div.t_prc_tax').text();
        item.price=$(this).find('div.t_prc em.prc').last().text();

        if($(this).hasClass('qvt_column_ofc')||$(this).find('div.v0 i').first().hasClass('ico_official'))
            item.ofc=1;
        else
            item.ofc=0;

        //console.log(JSON.stringify(item));
        other_price.push(item);
    });
    return other_price;
}



function demostic_oneway_parse(){
    var items=[];

    $('div.b_avt_lst').each(function(){
        var item={};

        if($(this).children().length != 9)
            return;

        /* name */
        var clone=$(this).find('div.a_name').clone();
        $(clone).find('strong').remove();
        item.name=$(clone).text();

        /* flight id */
        item.id=$(this).find('div.a_name strong').text();

        /* model */
        clone=$(this).find('div.a_model').clone();
        $(clone).find('span').remove();
        item.model=$(clone).text();

        /* time info */
        item.dep_time=$(this).find('div.a_tm_dep').text();
        item.arv_time=$(this).find('div.a_tm_arv').text();
        
        /* airport info */
        item.dep_port=$(this).find('div.a_lacal_dep').text();
        item.arv_port=$(this).find('div.a_local_arv').text();

        /* ontime rate */
        item.ontime_rate=$(this).find('p.a_pty_mint').first().text();

        /* price */
        var price_body=$(this).find('em.prc').children();
        var len=$(price_body).length;

        var price_str=$(price_body).first().text();
        if(isNaN(parseInt(price_str)))
            return;

        var price=price_str.split('');
        var _width=$(price_body).first().css('width');
        var width=parseInt(_width);

        var base=width/price.length;
        for(var i=1; i<len; ++i){
            var value ='';
            var offset=0;

            offset=parseInt($(price_body[i]).css('left'))/base;
            if(offset<0) offset=-offset;

            value=$(price_body[i]).text();
            price[price.length-offset]=value;
        }

        item.price=price.join('');

        /* sale */
        item.sale=$(this).find('div.a_low_dsc').first().text();

        /* as debug info to remote.message */
        //console.log(JSON.stringify(item));
        

        items.push(item);
    });

    return items;
}


function internal_oneway_parse(){
    function space_trim(str){   
        return str.replace(/(^\s*)|(\s*$)/g, '');   
    }

    function get_single_info(root){
        var base_info={};

        base_info.name=$(root).find('div.a_name').text();
        base_info.id=$(root).find('div.a_model strong').text();

        /* model */
        var clone=$(root).find('div.a_model').clone();
        $(clone).find('strong').remove();
        base_info.model=$(clone).text();     
        base_info.model=space_trim(base_info.model);

        /* time info */
        base_info.dep_time=$(root).find('div.a_tm_dep').text();
        base_info.arv_time=$(root).find('div.a_tm_arv').text();
        
        /* airport info */
        base_info.dep_port=$(root).find('div.a_local_dep').text();
        base_info.arv_port=$(root).find('div.a_local_arv').text();

        return base_info;
    }

    function get_trans_info(root, flag){
        var base_info={};
        base_info.name=$(root).find('div.a_name').text();

        /* flight id */
        base_info.id=$(root).find('div.a_model strong').text();

        /* model */
        var clone=$(root).find('div.a_model').clone();
        $(clone).find('strong').remove();
        base_info.model=$(clone).text();     
        base_info.model=space_trim(base_info.model);

        if(!flag)
            base_info.dep_time=$(root).find('div.a_tm_dep').text();
        else
            base_info.dep_time=$(root).find('div.a_tm_zj').text();

        base_info.dep_time=space_trim(base_info.dep_time);

        if(!flag)
            base_info.arv_time=$(root).find('div.a_tm_zj').text();
        else
            base_info.arv_time=$(root).find('div.a_tm_arv').text();

        base_info.arv_time=space_trim(base_info.arv_time);
        
        if(!flag)
            base_info.dep_port=$(root).find('div.a_local_dep').text();
        else
            base_info.arv_port=$(root).find('div.a_local_arv').text();

        return base_info;
    }

    function get_price(root){
        /* price */
        var price_body=$(root).find('em.prc').children();
        var len=$(price_body).length;

        var price_str=$(price_body).first().text();
        if(isNaN(parseInt(price_str)))
            return '';

        var price=price_str.split('');
        var _width=$(price_body).first().css('width');
        var width=parseInt(_width);

        var base=width/price.length;
        for(var i=1; i<len; ++i){
            var value ='';
            var offset=0;

            offset=parseInt($(price_body[i]).css('left'))/base;
            if(offset<0) offset=-offset;

            value=$(price_body[i]).text();
            price[price.length-offset]=value;
        }

        return price.join('');
    }

    var _info={};

    var lineone=$('div.b_avt_lst').first();

    /* trans */
    if($(lineone).has('div.avt_trans').length){
        var t=$(lineone).find('div.avt_column_1st');
        var g1=$(t).first();
        var g2=$(t).last();
        
        _info.g1_info=get_trans_info(g1, 0);
        _info.g2_info=get_trans_info(g2, 1);
        _info.trans_port=$(lineone).find('div.avt_column_sp').text();
        _info.price=get_price(lineone);

        _info.tax=$(lineone).find('div.a_prc_tax').text();
        _info.type='trans';
                
    }

    /* no trans */
    else{

        _info.info=get_single_info(lineone);
        _info.price=get_price(lineone);
        var clone=$(lineone).find('div.a_prc_tax').clone();
        $(clone).find('i').remove();
        _info.tax=$(clone).text();
        _info.type="direct";
    }

    var items=[];
    items.push(_info);
    return items;
}

function internal_round_trip_parse(){

    function get_single_base_info(root){
        var base_info={};

        var name=[];
        name.push($(root).find('div.a_name span').text());
        base_info.name=name;

        var fi_num=$(root).find('p.fi_num');

        /* trans */
        if($(fi_num).children().length > 1){
            base_info.type='trans';
            var model=[];

            model.push($(fi_num).children().first().text());
            model.push($(fi_num).children().last().text());
            base_info.model=model;

            base_info.dep_time=$(root).find('div.a_tm_dep').text();
            base_info.dep_port=$(root).find('div.a_lacal_dep').text();
            base_info.arv_time=$(root).find('div.a_tm_arv').text();
            base_info.arv_port=$(root).find('div.a_local_arv').text();
            base_info.trans_port=$(root).find('p.ico_sp_zhuan').text();
        }   

        /* direct */
        else{
            base_info.type='direct';
            var model=[];

            model.push($(fi_num).children().first().text());
            base_info.model=model;

            base_info.dep_time=$(root).find('div.a_tm_dep').text();
            base_info.dep_port=$(root).find('div.a_lacal_dep').text();
            base_info.arv_time=$(root).find('div.a_tm_arv').text();
            base_info.arv_port=$(root).find('div.a_local_arv').text();
            base_info.trans_port='';
        }

        return base_info;
    }

    function get_multi_base_info(root){
        var base_info={};
        var name=[];

        var name=[];
        name.push($(root).find('div.a_name span').first().text());
        name.push($(root).find('div.a_name span').last().text());
        base_info.name=name;

        base_info.type='trans';
        var model=[];

        model.push($(root).find('p.fi_num').first().text());
        model.push($(root).find('p.fi_num').last().text());
        base_info.model=model;

        base_info.dep_time=$(root).find('div.a_tm_dep').text();
        base_info.dep_port=$(root).find('div.a_lacal_dep').text();
        base_info.arv_time=$(root).find('div.a_tm_arv').text();
        base_info.arv_port=$(root).find('div.a_local_arv').text();
        base_info.trans_port=$(root).find('p.ico_sp_zhuan').text();

        return base_info;
    }

    function get_price(root){
        /* price */
        var price_body=$(root).find('em.prc').children();
        var len=$(price_body).length;

        var price_str=$(price_body).first().text();
        if(isNaN(parseInt(price_str)))
            return '';

        var price=price_str.split('');
        var _width=$(price_body).first().css('width');
        var width=parseInt(_width);

        var base=width/price.length;
        for(var i=1; i<len; ++i){
            var value ='';
            var offset=0;

            offset=parseInt($(price_body[i]).css('left'))/base;
            if(offset<0) offset=-offset;

            value=$(price_body[i]).text();
            price[price.length-offset]=value;
        }

        return price.join('');
    }


    var _info={};
    var lineone=$('div.b_avt_lst').first();
    
    var out_info={};
    var ret_info={};
    var out=$(lineone).find('div.avt_column_1st');
    var ret=$(lineone).find('div.avt_column_2nd');

    /* same flight corp */
    if($(out).hasClass('single_ca')){
        out_info=get_single_base_info(out);
    }
    else if($(out).hasClass('multi_ca')){
        out_info=get_multi_base_info(out);
    }

    if($(ret).hasClass('single_ca')){
        ret_info=get_single_base_info(ret);
    }
    else if($(ret).hasClass('multi_ca')){
        ret_info=get_multi_base_info(ret);
    }

    _info.out=out_info;
    _info.ret=ret_info;
    _info.price=get_price(lineone);

    _info.tax=$(lineone).find('div.a_inc_tax').text();
    

    var items=[];
    items.push(_info);
    return items;
}


exports.qunar=qunar;







