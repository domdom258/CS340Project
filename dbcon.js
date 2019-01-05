var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            	: 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_nievesr',
  password        : '5146',
  database        : 'cs340_nievesr'
 //user	    : 'cs340_cruzst',
  //password	    : '5343',
  //database	    : 'cs340_cruzst'
});

module.exports.pool = pool;
