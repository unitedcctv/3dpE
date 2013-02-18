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
	  app.use('/styles/', express.static(__dirname + '/../app/styles/'));
	  app.use('/images/', express.static(__dirname + '/../app/images/'));
	  app.use('/scripts/', express.static(__dirname + '/../app/scripts/'));
	  app.set('views', __dirname + '/../app/views');
	  console.log(__dirname)
	  //app.set('view engine', 'hbs');
	});

var util = require('util');   
var fs = require('fs'); //moving files
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
		runCommand( 'ls', '-tr1', 'gcode_uploads' );
	});
}

//needs both request and response vars (request to get file data, response to show results...)
function parseFileUpload( req, res ){
	// parse a file upload
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {

		showPrintPage( res ); 

		var tempfile    = files['upload']['path'];
		var targetfile  = 'gcode_uploads/'+files['upload']['name'];
		moveFile( tempfile, targetfile );

		res.send({successMessage:'Thanks for the upload. saved file to:' + targetfile});
	});

}

function runCommand( command, args, dir ){
  //var spawn   = require('child_process').spawn;
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

app.get('/home/', function(req, res){
	res.render('mobile/home', { fileName : '3dpE stretchy_band.stl' });
});

app.get('/direct_control/', function(req, res){
	res.render('mobile/direct_control', { fileName : '3dpE stretchy_band.stl' });
});

app.get('/upload', function(req, res){
	if(req.method.toLowerCase() == 'post')
	{
		parseFileUpload( req, res );
	}
});

app.get('/files', function(req, res){
	showFilesWidget( req, res );
});

app.get('/printer', function(req, res){
	showPrinterPage( req, res );
});

app.get('/moveleft/:amount', function(req, res){
	pronsole.stdin.write('move x ' + req.param('amount') + '\n');
	console.log("move left " + req.param('amount'));
});

app.get('/moveright', function(req, res){
	pronsole.stdin.write('move x ' + req.param('amount') + '\n');
	showPrinterPage( req, res );
});

app.get('/moveup', function(req, res){
	pronsole.stdin.write('move z ' + req.param('amount') + '\n');
	showPrinterPage( req, res );
});

app.get('/movedown', function(req, res){
	pronsole.stdin.write('move z ' + req.param('amount') + '\n');
	showPrinterPage( req, res );
});

app.get('/moveback', function(req, res){
	pronsole.stdin.write('move y ' + req.param('amount') + '\n');
	showPrinterPage( req, res );
});

app.get('/moveforward', function(req, res){
	pronsole.stdin.write('move y ' + req.param('amount') + '\n');
	showPrinterPage( req, res );
});

app.get('/homexy', function(req, res){
	pronsole.stdin.write('home xy\n');
	showPrinterPage( req, res );
});

app.get('/homez', function(req, res){
	pronsole.stdin.write('home z\n');
	showPrinterPage( req, res );
});

app.get('/heaton', function(req, res){
	pronsole.stdin.write('settemp ' + req.param('amount') + '\n');
	showPrinterPage( req, res );
});

app.get('/extrude', function(req, res){
	pronsole.stdin.write('extrude ' + req.param('amount') + '\n');
	showPrinterPage( req, res );
});

app.get('/retract', function(req, res){
	pronsole.stdin.write('extrude ' + req.param('amount') + '\n');
	showPrinterPage( req, res );
});

app.get('/printfile', function(req, res){
	var lastfile = files[files.length-1].toString();
	console.log('last file='+lastfile +"\n");
	pronsole.stdin.write( 'load gcode_uploads/'+lastfile+"\n" );
	pronsole.stdin.write( 'print\n' );
	showPrinterPage( req, res );
});

app.get('/heatoff', function(req, res){
	pronsole.stdin.write( 'settemp 0\n' );
	showPrinterPage( req, res );
});


runCommand( 'ls', '-tr1', 'gcode_uploads' );

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