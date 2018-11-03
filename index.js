const fs = require('fs');
const minimist = require('minimist');
const path = require('path');
const request = require('request');

function init() {
	argv = minimist(process.argv.slice(2), {
		string: [
			'input'
		],
		default: {
			input: 'export.xml'
		}
	});

    let outputFilename = argv.input.replace('.', '-output.');
	let content = readFile(argv.input);
	processContent(content, outputFilename);
}

function readFile(path) {
	try {
		return fs.readFileSync(path, 'utf8');
	} catch (ex) {
		console.log('Unable to read file.');
		console.log(ex.message);
	}
}

function processContent(content, outputFilename) {
	console.log('Do stuff...');
}

// it's go time!
init();
