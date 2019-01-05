var express = require('express');
var mysql = require('./dbcon.js');
var bodyParser = require('body-parser');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var url = require('url');

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('mysql', mysql);
app.set('port', 2098);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));


/* HELPER FUNCTIONS */
function displayInventoryForView(res, mysql, context, complete){
	mysql.pool.query("SELECT i.product_id, name, quantity, price, round(AVG(ratings),2) as rating FROM inventory i left join rating r on r.product_id = i.product_id GROUP BY i.product_id" , function(err, results, fields){
		if(err){
                res.write(JSON.stringify(err));
                res.end();
        }
        /*
        // This works, but is long.
        var params = [];
        for (var row in results){
        	var addItem = {'product_id': results[row].product_id,
        				   'name': results[row].name,
        				   'quantity': results[row].quantity,
        				   'price': results[row].price
        				  };
        	params.push(addItem);
        }
        context.inventoryDisplay = params;
        console.log(params);
        */
        context.inventoryDisplay = results;
	//console.log(context.inventoryDisplay);
        complete();
	});
};

function displayOwner(req,mysql, context, complete){
	mysql.pool.query("SELECT product_id, name, quantity, price from inventory", function(err,results, fields){
		if(err){
			res.write(JSON.stringify(error));
                	res.end();
		}
		else{
			context.display  = results;
		            complete();
		}
	});
}

function getPurchaseHistory(res, mysql, context, complete){
	let sqlString = "SELECT c.account_id, concat(first_name, \" \", last_name) AS fullname,i.product_id, i.name, p.quantity from purchases p \
					 join customer c on  p.account_id = c.account_id \
					 join inventory i on p.product_id = i.product_id";
	mysql.pool.query(sqlString, function(err,results,fields){
	if(err){
		res.write(JSON.stringify(err));
		res.end();
	}
	context.purchaseHistory = results;
	complete();
});
}

function getInventoryForCart(res,mysql,context, complete){
	mysql.pool.query("select name from inventory", function(err,results,fields){
	if(err){
		res.write(JSON.stringify(err));
		res.end();
	}
	context.items = results;
	complete();
});
};

function getInventoryForRating(res,mysql,context, complete){
	mysql.pool.query("select name from inventory", function(err,results,fields){
        if(err){
                res.write(JSON.stringify(err));
                res.end();
        }
        context.inv = results;
        complete();
});
};


/**************  sql stuff 			************************/

app.get('/',function(req,res,next){
   res.render('index');
});

app.get('/owner',function(req,res,next){
	var callbackCount = 0;
	var context = {};
	displayOwner(res, mysql, context, complete);
	getPurchaseHistory(res, mysql, context, complete);
	function complete(){
		callbackCount++;
		if(callbackCount >= 2){
			res.render('owner',context);
		}
	}
});

app.get('/customer',function(req,res,next){
  res.render('customer');
});

app.post('/add_product',function(req,res,next){
  var mysql = req.app.get('mysql');
  var sql = "INSERT INTO inventory(name, quantity, price) VALUES (?,?,?)";
  var insert = [req.body.name, req.body.quantity, req.body.price];
  sql = mysql.pool.query(sql,insert, function(error,results,fields){
        if(error){
          res.write(JSON.stringify(error));
          res.end();
        }else{
          res.redirect('/owner');
        }
  });

});

app.post('/add_customer', function(req,res,next){
  var mysql = req.app.get('mysql');
  var sql = "INSERT INTO customer (first_name, last_name, email, password, street, state, city, zip, phone_number) VALUES (?,?,?,?,?,?,?,?,?)";
  var insert = [req.body.first_name, req.body.last_name, req.body.email, req.body.password, req.body.street, req.body.state, req.body.city, req.body.zip, req.body.phone_number];
  sql = mysql.pool.query(sql,insert, function(error,results,fields){
        if (error){
            res.write(JSON.stringify(error));
            res.end();
        }else{
          res.redirect('/');
        }

  });
});

app.post('/add_rating', function(req, res ,next){
  var mysql = req.app.get('mysql');
  var sql = "INSERT INTO rating (product_id, ratings) VALUES ((SELECT product_id from inventory where name = ?),?)";
  var insert = [req.body.product_name, req.body.rating];
  sql = mysql.pool.query(sql,insert, function(err,results,fields){
	if(err){
		res.write(JSON.stringify(err));
		res.end();
	}else{
		res.redirect('/shopping');
	} 

  });
});

app.post('/add_purchase',function(req,res,next){
  var sql = "INSERT INTO purchases (account_id, product_id, quantity) VALUES((SELECT account_id from customer where email = ?),(SELECT product_id from inventory where name = ?), ?)";
  var insert = [req.body.email, req.body.product_name, req.body.quantity];
  sql = mysql.pool.query(sql,insert, function(err, results, fields){
	if(err){
		res.write(JSON.stringify(err));
		res.end();
	}else{
		res.redirect('/');
	}

 });
});

app.get('/checkout',function(req,res,next){
  
  
  res.render('checkout');
});

app.get('/shopping', function(req,res,next){
	var callbackCount = 0;
	var context = {};
	getInventoryForCart(res,mysql,context,complete);
	getInventoryForRating(res,mysql,context,complete);
	displayInventoryForView(res, mysql, context, complete);
	function complete(){
		callbackCount++;
		if(callbackCount >= 3){
			res.render('shopping',context);
		}
	}

});
//Search functionality
function searchResult(insert, res, mysql, context, complete){

        console.log(insert);
        var sql = 'SELECT i.product_id, name, quantity, price, round(AVG(ratings),2) as rating FROM inventory i left join rating r on r.product_id = i.product_id where name like ? GROUP BY r.product_id';
        //var sql = 'SELECT product_id, name, quantity, price FROM inventory where name like ?';

        mysql.pool.query(sql, '%' + insert + '%', function(err,results,fields){
        if(err){
                res.write(JSON.stringify(err));
                res.end();
        }
        context.inventoryDisplay = results;
        complete();


        });
}
app.get('/search', function(req,res,next){
        var callbackCount = 0;
        var context = {};
        var insert = req.query.item;
        searchResult(insert,res, mysql,context,complete);
        getInventoryForCart(res,mysql,context,complete);
        getInventoryForRating(res,mysql,context,complete);

        function complete(){
                callbackCount++;
                if(callbackCount >= 3){
                        //console.log(context.inventoryDisplay);
                        res.render('shopping',context);
                }
        }

});


app.get('/search', function(req,res,next){
	var callbackCount = 0;
	var context = {};
	var insert = req.query.item;
	searchResult(insert,res, mysql,context,complete);
	getInventoryForCart(res,mysql,context,complete);
        getInventoryForRating(res,mysql,context,complete);
		
	function complete(){
                callbackCount++;
                if(callbackCount >= 3){
			//console.log(context.inventoryDisplay);
                        res.render('shopping',context);
                }
        }
	
});


//Delete for owner page

app.delete('/delete/:product_id', function(req,res){
	var mysql = req.app.get('mysql');
        var sql = "DELETE FROM inventory WHERE product_id = ?";
        var inserts = [req.params.product_id];
	console.log(inserts);
        sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            }else{
                res.status(202).end();
            }
        })	
});

//update
app.get('/item/:id',function(req,res){
        var sql = "Select product_id, name, quantity, price from inventory where product_id = ?"
        var context = {};
        var inserts = [req.params.id];
        mysql.pool.query(sql, inserts, function(error, results, fields){
                if(error){
                        res.write(JSON.stringify(error));
                        res.end();
                }
                context.item = results[0];
                console.log(context);
                res.render('update-item',context);
        });


});

app.put('/item/:product_id', function(req, res){
        var sql = "UPDATE inventory SET name=?, quantity=?, price=? WHERE product_id=?";
        var inserts = [req.body.name, req.body.quantity, req.body.price, req.params.product_id];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.status(200);
                res.end();
            }
        });
    });


app.use(function(req,res){
    res.status(404);
    res.render('404');
});

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function(){
    console.log('Express started on http://flip3.engr.oregonstate.edu:' + app.get('port') + '; press Ctrl-C to terminate.');
});
