var fs = require('fs');

var configPath = __dirname + '/config.json';
var elementsPath = __dirname + '/elements.json';

var sys = require('sys')
var exec = require('child_process').exec;

if (!fs.existsSync(configPath)) {
	console.log('Please create a config.json file before beginning. See config.json.tpl for an example.');
	return;
}

var config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
var elements = JSON.parse(fs.readFileSync(elementsPath, 'utf-8'));
var remainingElements = Object.keys(elements);

// Create the working directory if we need to.
var checkoutDir = __dirname + '/' + config.checkoutDir;
if (!fs.existsSync(checkoutDir)) {
	console.log('No working checkout dir found. Cloning repos into: ' + checkoutDir);
	fs.mkdirSync(checkoutDir);
	cloneRepos();
	return;
} else {
	// We can start.
	exportNextElement();
}

function cloneRepos() {
	var remainingRepos = remainingElements;
	var index = 0;

	eachRepo();

	function eachRepo() {
		var repo = remainingRepos[index];

		// If there is no repo remaining, start exporting.
		if (!repo) {
			return exportNextElement();
		}

		console.log('Processing repo: ' + repo);

		// Create the element working directory.
		var elementRepoPath = checkoutDir + repo;

		index++;

		// Clone the repos in order.
		fetchRepo(elementRepoPath, repo);
	}

	function fetchRepo(elementRepoPath, elementName) {
		var command = [
			'cd ' + checkoutDir,
			'git clone ' + config.remote + elementName + '.git'
		].join(' && ');
		console.log('Running: ' + command);
		exec(command, function() {
			console.log('args: ', arguments)
			eachRepo();
		});
	}
}

function exportNextElement() {
	var elementKey = remainingElements.shift();

	// If there is no key, we're done.
	if (!elementKey) {
		return done();
	}

	var element = elements[elementKey];
	element.name = elementKey;

	console.log('Exporting: ' + elementKey);
	copyElement(element);
}

function copyElement(element) {
	var repoFolder = checkoutDir + element.name + '/element';
	var gaiaElementFolder = config.gaiaPath + 'shared/elements/gaia_' + element.name;

	// If the element folder does not exist, create it.
	if (!fs.existsSync(repoFolder)) {
		fs.mkdirSync(repoFolder);
	}

	var command = [
		'cp -R ' + gaiaElementFolder + '/* ' + repoFolder + '/',
		'cd ' + repoFolder,
		'git add *',
		'git commit -m "Import ' + element.name + ' custom element from gaia."',
		'git push origin'
	].join(' && ');
	console.log('Running: ' + command);
	exec(command, function() {
		console.log('args: ', arguments)
		exportNextElement();
	});
}

function done() {
	console.log('All done.');
}
