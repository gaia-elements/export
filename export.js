var fs = require('fs');

var configPath = __dirname + '/config.json';
var elementsPath = __dirname + '/elements.json';

if (!fs.existsSync(configPath)) {
	console.log('Please create a config.json file before beginning. See config.json.tpl for an example.');
	return;
}

var config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
var elements = JSON.parse(fs.readFileSync(elementsPath, 'utf-8'));
var remainingElements = Object.keys(elements);

console.log('Exporting elements from ' + config.GAIA_PATH);

exportNextElement();

function exportNextElement() {
	var elementKey = remainingElements.shift();
	if (!elementKey) {
		return done();
	}

	console.log('Exporting: ' + elementKey);
	exportNextElement();
}

function done() {
	console.log('All done.');
}
