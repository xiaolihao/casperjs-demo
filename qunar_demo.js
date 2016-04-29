var fs=require('fs');

var casper_option={   
    verbose: true, 
    logLevel: 'debug',
    pageSettings: {
         loadImages:  false,        
         loadPlugins: false,         
         userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36'
    },
    viewportSize: {width: 1680, height: 1080},
    clientScripts: ['jquery-2.1.0.min.js']
};

var casper=require('casper').create(casper_option);

casper.start().then(function(){
    this.echo('starting');
});


casper.start();
casper.open('http://flight.qunar.com/');

casper.waitForSelector('form#ifsForm',

    /* then */
    function(){
        /* then */
            this.fill('form', {
                //searchType:'RoundTripFlight',//往返
                searchType:'OnewayFlight',
                fromCity:'上海',
                toCity:'慕尼黑',
                //toDate:'2014-08-29',//返回日期
                fromDate:'2014-10-29',
                }, true);
    },

    /* timeout */
    function(){
        this.echo('[timeout]'+url);
    });

/* price will change a little bit */
casper.wait(5000, function(){});


casper.then(function(){
    /* parse html... */
    if(this.exists('div.e_fly_lst div.loading')){
        return;
    }

    else{
        this.then(function(){
            var info=this.evaluate(function(){

                function space_trim(str){   
                    return str.replace(/(^\s*)|(\s*$)/g, '');   
                }

                function get_single_info(root){
                    var base_info={};

                    base_info.name=$(root).find('div.a_name');
                    base_info.id=$(root).find('div.a_model strong');

                    /* model */
                    var clone=$(root).find('div.a_model').clone();
                    $(clone).find('strong').remove();
                    base_info.model=$(clone).text();     
                    base_info.model=space_trim(base_info.model);

                    /* time info */
                    item.dep_time=$(root).find('div.a_tm_dep').text();
                    item.arv_time=$(root).find('div.a_tm_arv').text();
                    
                    /* airport info */
                    item.dep_port=$(root).find('div.a_local_dep').text();
                    item.arv_port=$(root).find('div.a_local_arv').text();

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

                //$(lineone).find('div.a_booking a.btn_book').click();

                /* trans */
                if($(lineone).has('div.avt_trans').length){
                    var t=$(lineone).find('div.avt_column_1st');
                    var g1=$(t).first();
                    var g2=$(t).last();
                    
                    _info.g1_info=get_trans_info(g1, 0);
                    _info.g2_info=get_trans_info(g2, 1);
                    _info.trans_port=$(lineone).find('div.avt_column_sp').text();
                    _info.price=get_price(lineone);

                    var clone=$(lineone).find('div.a_prc_tax span.hv').clone();
                    $(clone).find('i').remove();
                    _info.tax=$(clone).text();
                    _info.type='trans';
                    
                    console.log(JSON.stringify(_info));        
                }

                /* no trans */
                else{

                    _info.info=get_single_info(lineone);
                    _info.price=get_price(lineone);
                    var clone=$(lineone).find('div.a_prc_tax span.hv').clone();
                    $(clone).find('i').remove();
                    _info.tax=$(clone).text();
                    _info.type="direct";
                }
                return _info;
            });/* evaluate */

            
            this.then(function(){

                /* just ext first */
                this.mouseEvent('click', 'div.a_booking a.btn_book');
            });


            this.wait(5000,function(){

                this.evaluate(function(){

                    //$('div.b_spc_list').each(function(){
                        var lst=$('div.b_spc_list').first();
                        $(lst).find('div.qvt_column').each(function(){

                            var item={};
                            item.name=$(this).find('div.t_name').text();
                            item.tax=$(this).find('div.t_prc_tax span').text();
                            item.price=$(this).find('div.t_prc em.prc').text();

                            console.log(JSON.stringify(item));
                        });
                        

                    //});

                });

                this.capture('demo.png');
            });

        });/* then */
    }/* else */
});


casper.on('remote.message', function(msg){
    this.echo('remote message:'+msg);
});

casper.run(function(){
    this.exit();
});




