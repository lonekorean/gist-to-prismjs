const fs = require('fs');
const minimist = require('minimist');
const request = require('request');

// map certain gist langs to prism langs
// additional mapping logic is in translateLanguage()
const languageMap = {
	'batchfile': 'batch',
	'c++': 'cpp',
	'c#': 'csharp',
	'f#': 'fsharp',
	'html': 'markup',
	'shell': 'bash',
	'xml': 'markup'
};

// global vars the multiple functions use
let argv, fileContent, gists = [];

function init() {
	argv = minimist(process.argv.slice(2), {
		string: [
			'input',
			'user',
			'pass'
		]
	});
	
	if (!argv.input) {
		console.log('Input file not specified.');
	} else {
		readInputFile();
		processFileContent();
	}
}

function readInputFile() {
	try {
		fileContent = fs.readFileSync(argv.input, 'utf8');
	} catch (ex) {
		console.log('Unable to read input file.');
		console.log(ex.message);
	}
}

function processFileContent() {
	let regex = (/<script src="https:\/\/gist\.github\.com\/[^\/]+\/(\d+)\.js"><\/script>/gi);
	let match;
	while ((match = regex.exec(fileContent)) !== null) {
		gists.push({
			isProcessed: false,
			scriptTag: match[0],
			id: match[1],
			language: '',
			content: ''
		});
	}

	console.log('Found ' + gists.length + ' gists.');

	gists.forEach(gist => {
		let options = {
			url: 'https://api.github.com/gists/' + gist.id,
			headers: {
				'User-Agent': 'gist-to-prismjs'
			}
		};
		if (argv.user && argv.pass) {
			options.auth = {
				user: argv.user,
				pass: argv.pass
			};
		}
		request.get(options, gistGetCallback.bind(this, gist));
	});
}

function gistGetCallback(gist, error, response, body) {
	if (error) {
		console.log('Unable to get gist content.');
		console.log(error);
	} else if (response.statusCode !== 200) {
		console.log('Response status code ' + response.statusCode + ' received.');
		console.log(body);
	} else {
		let json = JSON.parse(body);

		// gists can have multiple files, but we assume the first here
		let firstGistFile = Object.values(json.files)[0];
		gist.language = firstGistFile.language;
		gist.content = firstGistFile.content;
	}

	// mark this gist as processed and check if all are now processed
	gist.isProcessed = true;
	if (gists.every(gist => gist.isProcessed)) {
		writeOutputFile();
	}
}

function writeOutputFile() {
	// replace each gist script tag in file content with a code block
	gists.forEach(gist => {
		let prismLang = translateLanguage(gist.language);
		let classAttr = prismLang ? ' class="language-' + prismLang + '"' : '';
		let codeBlock = '<pre><code' + classAttr + '>' + gist.content + '</code></pre>';
		fileContent = fileContent.replace(gist.scriptTag, codeBlock);
	});

	// output filename is just the input filename suffixed with "-output"
	let outputFile = argv.input.replace('.', '-output.');
	fs.writeFile(outputFile, fileContent, (err) => {
		if (err) {
			console.log('Unable to write output file.');
			console.log(err);
		} else {
			console.log('Wrote ' + outputFile + '.');
		}
	});
}

function translateLanguage(gistLang) {
	gistLang = (gistLang || '').toLowerCase();
	if (!gistLang || gistLang === 'text') {
		// a gist lang of null (can happen) or "Text" means no highlighting
		return null;
	} else {
		// attempt to find mapped lang, otherwise use the lowercased lang as-is
		let prismLang = languageMap[gistLang] || gistLang;
		return prismLang;
	}
}

// it's go time!
init();
