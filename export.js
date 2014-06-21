var fs = require('fs');

if (!fs.existsSync(__dirname + '/config.json')) {
	console.log('Please create a config.json file before beginning. See config.json.tpl for an example.');
	return;
}

