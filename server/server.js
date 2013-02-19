var express = require('express');

var app = express();

app.configure(function(){
	app.set('view engine', 'jade');
	//app.set('view options', { layout: false });
	app.use(express.logger('dev'));
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "appsession" }));
	app.use(express.errorHandler({showStack: true, dumpExceptions: true}));
	//app.use(app.router);
	app.use('/styles/', express.static(__dirname + '/../app/stylesheets/'));
	app.use('/images/', express.static(__dirname + '/../app/images/'));
	app.use('/scripts/', express.static(__dirname + '/../app/scripts/'));
	app.set('views', __dirname + '/../app/views');
});

var util = require('util');   
var fs = require('fs'); //moving files
var formidable = require('formidable');
var command_output = ''; //this will contain output of commands that we're run with runCommand function...
var files = []; //array of files uploaded

//interface with pronsole.py.
var spawn    = require('child_process').spawn;

var pronsole = spawn('python', ['printrun/pronsole.py','']);

function moveFile( source_file, target_file ){
	var is = fs.createReadStream(source_file)
	var os = fs.createWriteStream(target_file);

	util.pump(is, os, function() {
		fs.unlinkSync( source_file ); 
		//we update the directory after the move...
		runCommand( 'ls', '-tr1', 'gcode_files' );
	});
}

//needs both request and response vars (request to get file data, response to show results...)
function parseFileUpload( req, res ){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {

		showPrintPage( res ); 

		var tempfile    = files['upload']['path'];
		var targetfile  = 'gcode_file/'+files['upload']['name'];
		moveFile( tempfile, targetfile );

		res.send({successMessage:'Thanks for the upload. saved file to:' + targetfile});
	});

}

function runCommand( command, args, dir ){
  var command = spawn(command, [args, dir]);

  command_output = '';
  command.stdout.on('data', function (data) {
  	console.log('stdout: ' + data);
  	command_output = command_output+ data;
  });

  command.stderr.on('data', function (data) {
  	command_output = command_output + data;
  });

  command.on('exit', function (code) {
  	files = command_output.toString().split('\n');
	files.splice(files.length-1,1); //removes last empty entry here...
});
  
}

function is_mobile(req) {
	var ua = req.header('user-agent');
	if (/mobile/i.test(ua)) return true;
	else return false;
};

app.get('/', function(req,res) {
	if (is_mobile(req))
	{
		res.render('index', { fileName : 'stretchy_band.stl' });
	}else
	{
		console.log("this is not a mobile device");
		res.render('mobile/index', { fileName : '3dpE stretchy_band.stl' });
	}
});

app.post('/upload/', function(req, res){
	if(req.method.toLowerCase() == 'post')
	{
		parseFileUpload( req, res );
	}
});

app.get('/printfile', function(req, res){
	var lastfile = files[files.length-1].toString();
	console.log('last file='+lastfile +"\n");
	pronsole.stdin.write( 'load gcode_file/'+lastfile+"\n" );
	pronsole.stdin.write( 'print\n' );
	updatePage( req, res );
});

app.get('/movex/:amount', function(req, res){
	pronsole.stdin.write('move x ' + req.param('amount') + '\n');
	console.log("move left " + req.param('amount'));
});

app.get('/movez', function(req, res){
	pronsole.stdin.write('move z ' + req.param('amount') + '\n');
	updatePage( req, res );
});

app.get('/movey', function(req, res){
	pronsole.stdin.write('move y ' + req.param('amount') + '\n');
	updatePage( req, res );
});

app.get('/homexy', function(req, res){
	pronsole.stdin.write('home xy\n');
	updatePage( req, res );
});

app.get('/homez', function(req, res){
	pronsole.stdin.write('home z\n');
	updatePage( req, res );
});

app.get('/heaton', function(req, res){
	pronsole.stdin.write('settemp ' + req.param('amount') + '\n');
	updatePage( req, res );
});

app.get('/extrude', function(req, res){
	pronsole.stdin.write('extrude ' + req.param('amount') + '\n');
	updatePage( req, res );
});

app.get('/retract', function(req, res){
	pronsole.stdin.write('extrude ' + req.param('amount') + '\n');
	updatePage( req, res );
});

app.get('/heatoff', function(req, res){
	pronsole.stdin.write( 'settemp 0\n' );
	updatePage( req, res );
});


runCommand( 'ls', '-tr1', 'gcode_fil' );

setTimeout( function(){
	pronsole.stdin.write('connect\n');
}, 3000 );


pronsole.stdout.on('data', function (data) {
	console.log( 'pronsole: '+data );
});

pronsole.stderr.on('data', function (data) {
	console.log('pronsole err: ' + data);
});

pronsole.stdout.on('end', function(data) {
	pronsole.stdout.end();
} );

pronsole.on('exit', function (code) {
	if (code !== 0) {
		console.log('pronsole process exited with code ' + code);
	}
	console.log('pronsole exited!');
	pronsole.stdin.end(); 
});

app.listen(3000);
console.log('Listening on port 3000');