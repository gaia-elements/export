var fs = require('fs');

var configPath = __dirname + '/config.json';
var elementsPath = __dirname + '/elements.json';

var sys = require('sys');
var exec = require('child_process').exec;

if (!fs.existsSync(configPath)) {
	console.log('Please create a config.json file before beginning. See config.json.tpl for an example.');
	return;
}

var config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
var elements = JSON.parse(fs.readFileSync(elementsPath, 'utf8'));
// Do these in reverse order so the org pages stays in alphabetical order.
var remainingElements = Object.keys(elements).reverse();

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
			console.log('args: ', arguments);
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

	element.repoFolder = checkoutDir + element.name + '/';
	element.gaiaElementFolder = config.gaiaPath + 'shared/elements/gaia_' + element.name;

	console.log('Exporting: ' + elementKey);
	copyElement(element);
}

function copyElement(element) {
	// If the element folder does not exist, create it.
	if (!fs.existsSync(element.repoFolder + 'element')) {
		fs.mkdirSync(element.repoFolder + 'element');
	}

	// Format templates
	formatTemplatesSync(element);

	var command = [
		'cp -R ' + element.gaiaElementFolder + '/* ' + element.repoFolder + 'element/',

		// Super hack for component utils.
		// These will be removed in the future, but for now copy the file and replace any reference to it in examples
		'cp ' + element.gaiaElementFolder + '/../../js/component_utils.js ' + element.repoFolder + 'element/.',
		'cd ' + element.repoFolder,
		'find ./ -type f -name "*.html" -exec sed -i -e \'s/\\.\\.\\/\\.\\.\\/\\.\\.\\/js\\/component_utils\\.js/\\.\\.\\/component_utils\\.js/g\' {} \\;',
		'rm element/examples/*.html-e 2>/dev/null',

		'cd ' + element.repoFolder,
		'git add *',
		'git commit -m "[' + element.name + '] ' + config.commitMessage + '"',

		// Commented out intentionally. You better be sure you want to do this.
		//'git push origin && git checkout gh-pages && git merge master && git push origin && git checkout master'
	].join(' && ');
	console.log('Running: ' + command);
	exec(command, function() {
		console.log('args: ', arguments);
		exportNextElement(element);
	});
}

function formatTemplatesSync(element) {
	var files = [
		'README.md'
	];

	files.forEach(function(file) {
		var fileContent = fs.readFileSync(__dirname + '/templates/' + file, 'utf8');
		fileContent = fileContent.replace(/\{name\}/g, element.name);

		fs.writeFileSync(element.repoFolder + file, fileContent, 'utf8');
	});
}

function done() {
	console.log('All done.');
}
