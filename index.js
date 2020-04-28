/* Require external APIs and start our application instance */
var express = require('express');
var mysql = require('mysql');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt');
var app = express();

/* Configure our server to read public folder and ejs files */
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'top secret code!',
    resave: true,
    saveUninitialized: true
}));
app.set('trust proxy', 1); // from https://stackoverflow.com/questions/48966013/nodejs-heroku-express-sessions
app.set('view engine', 'ejs');

/* Configure MySQL DBMS */
const connection = mysql.createConnection({
    host: 'un0jueuv2mam78uv.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'm6p63nd8yypcno2c',
    password: 'v4f5mzdjd1b6tlpm',
    database: 'wgqij9oon6gipvu9', 
    multipleStatements: true
});

connection.connect();

/* The handler for the DEFAULT route */
app.get('/', function(req, res){
    var stmtCategory = 'select distinct category from l9_quotes';
    var stmtAuthor = 'select distinct firstName, lastName from l9_author';
    
    var queries = stmtCategory + ';' + stmtAuthor
    connection.query(queries, function(error, found) {
        var categories = null; 
        var authors = null; 
        if (error) throw error; 
        if (found.length) {
            categories = found[0]; 
            authors = found[1]; 
        }
        res.render('home', {categories: categories, authors: authors, isLoggedIn: req.session.authenticated});
    }); 
    
    
});

// Login/Logout Routes
app.get('/login', function(req, res) {
    res.render('login');    
}); 


app.post('/login', function(req, res){
    // console.log("username = " + req.body.username + " password = " + req.body.password);
    let isLoginValid = checkLoginCredentials(req.body.username, req.body.password); 
    console.log(isLoginValid);
    if(isLoginValid){
        req.session.authenticated = true;
        req.session.user = req.body.username;
        res.redirect('/author');
    }
    else{
        res.render('login', {error: true});
    }
});

app.get('/logout', function(req, res){
   req.session.destroy();
   res.redirect('/');
});


// Admin Author Routes
app.get("/author", isAuthenticated, function(req, res) {
    var stmt = 'SELECT * FROM l9_author;';
    console.log(stmt);
    var authors = null;
    connection.query(stmt, function(error, results){
        if(error) {
            console.log("error in /author");
            throw error;
        }
        if(results.length) authors = results;
        // console.log(authors);
        res.render('author', {authors: authors});
    });
}); 

app.get("/author/:aid/bio", isAuthenticated, function(req, res) {
    var stmt = 'SELECT * FROM l9_author WHERE authorId=' + req.params.aid + ';';
    console.log(stmt);
    connection.query(stmt, function(error, results){
       if(error) throw error;
       if(results.length){
           var author = results[0];
           author.dob = author.dob.toString().split(' ').slice(0,4).join(' ');
           author.dod = author.dod.toString().split(' ').slice(0,4).join(' ');
           res.render('author_bio', {author: author});
       }
    });
})


// ADD NEW AUTHOR
/* Create a new author - Get author information */
app.get('/author/new', isAuthenticated, function(req, res){
    res.render('author_new');
});

/* Create a new author - Add author into DBMS */
app.post('/author/new', isAuthenticated, function(req, res){
   //console.log(req.body);
   connection.query('SELECT COUNT(*) FROM l9_author;', function(error, result){
       if(error) throw error;
       if(result.length){
            var authorId = result[0]['COUNT(*)'] + 1;
            var stmt = 'INSERT INTO l9_author ' +
                      '(authorId, firstName, lastName, dob, dod, sex, profession, country, biography) '+
                      'VALUES ' +
                      '(' + 
                       authorId + ',"' +
                       req.body.firstname + '","' +
                       req.body.lastname + '","' +
                       req.body.dob + '","' +
                       req.body.dod + '","' +
                       req.body.sex + '","' +
                       req.body.profession + '","' +
                       req.body.country + '","' +
                       req.body.biography + '"' +
                       ');';
            console.log(stmt);
            connection.query(stmt, function(error, result){
                if(error) throw error;
                res.redirect('/author');
            })
       }
   });
});

//EDIT AUTHOR
/* Edit an author record - Display an author information */
app.get('/author/:aid/edit', isAuthenticated, function(req, res){
    console.log("AUTHOR ID:"); 
    console.log(req.params.aid);
    var stmt = 'SELECT * FROM l9_author WHERE authorId=' + req.params.aid + ';';
    connection.query(stmt, function(error, results){
       if(error){ 
           console.log("error in /author/:aid/edit");
           throw error;
       }
       if(results.length){
           var author = results[0];
           author.dob = author.dob.toISOString().split('T')[0];
           author.dod = author.dod.toISOString().split('T')[0];
           res.render('author_edit', {author: author});
       }
    });
});

/* Edit an author record - Update an author in DBMS */
app.put('/author/:aid', isAuthenticated, function(req, res){
    console.log(req.body);
    var stmt = 'UPDATE l9_author SET ' +
                'firstName = "'+ req.body.firstname + '",' +
                'lastName = "'+ req.body.lastname + '",' +
                'dob = "'+ req.body.dob + '",' +
                'dod = "'+ req.body.dod + '",' +
                'sex = "'+ req.body.sex + '",' +
                'profession = "'+ req.body.profession + '",' +
                'portrait = "'+ req.body.portrait + '",' +
                'country = "'+ req.body.country + '",' +
                'biography = "'+ req.body.biography + '"' +
                'WHERE authorId = ' + req.params.aid + ";"
    //console.log(stmt);
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/author/' + req.params.aid + "/bio");
    });
});

// DELETE AUTHOR
/* Delete an author record */
app.get('/author/:aid/delete', isAuthenticated, function(req, res){
    var stmt = 'DELETE from l9_author WHERE authorId='+ req.params.aid + ';';
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/author');
    });
});



// Quote Routes
app.get('/quotes', function(req, res) {
    var stmt = getSQLStatement(req);
    connection.query(stmt, function(error, found){
	    if(error) throw error;
	    res.render('quotes', {quotes: found, clickedAuthor: null});
	});
    // console.log(stmt);
    
});

app.get("/author/:id/modal", function(req, res) {
    var stmt = "select * from l9_author where authorId=" + req.params.id + ";";
    connection.query(stmt, function(error, found){
	    if(error) throw error;
	    res.send(found);
	});
});


/* The handler for undefined routes */
app.get('*', function(req, res){
   res.render('error'); 
});

/* Start the application server */
app.listen(process.env.PORT || 3000, function(){
    console.log('Server has been started');
})



function isAuthenticated(req, res, next){
    if(!req.session.authenticated) res.redirect('/login');
    else next();
}


function checkLoginCredentials(username, password) {
    if (username != 'admin' || password != 'password') {
        return false;
    }
    return true;
}


function getSQLStatement(req) {
    var stmt = "select * from l9_author, l9_quotes where "; 
    var phrase = null; 
    var flag1 = 0;
    var flag2 = 0
    var flag3 = 0; 
    var flag4 = 0; 
    var allEmpty = true; 
    
    if (req.query.keyword.length) {
        flag1 = 1; 
        allEmpty = false; 
        phrase = "quote like '%" + req.query.keyword + "%'";
        stmt = stmt.concat(phrase);
    }
    if (req.query.category.length) {
        allEmpty = false; 
        flag2 = 1; 
        if (flag1) {
            stmt = stmt.concat(" and "); 
        }
        phrase = "category='" + req.query.category + "'"; 
        stmt = stmt.concat(phrase); 
    }
    if (req.query.author.length) {
        allEmpty = false; 
        flag3 = 1; 
        if (flag1 || flag2) {
            stmt = stmt.concat(" and "); 
        }
        var firstName = req.query.author.split(" ")[0]; 
        var lastName = req.query.author.split(" ")[1]; 
        phrase = "firstName ='" + firstName + "' and lastName='" + lastName + "'";
        stmt = stmt.concat(phrase); 
    }
    if (req.query.gender.length) {
        allEmpty = false; 
        flag4 = 1; 
        if (flag1 || flag2 || flag3) {
            stmt = stmt.concat(" and "); 
        }
        phrase = "sex='" + req.query.gender.toUpperCase() + "'";
        stmt = stmt.concat(phrase);
    }
    
    if (flag1 || flag2 || flag3 || flag4) {
        stmt = stmt.concat(" and "); 
    }
    stmt = stmt.concat('l9_author.authorId = l9_quotes.authorId'); 
    return stmt; 
}
