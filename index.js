const fs = require('fs');
const minimist = require('minimist');
const request = require('request');

const languageMap = {
    'batchfile': 'batch',
    'c++': 'cpp',
    'c#': 'csharp',
    'f#': 'fsharp',
    'html': 'markup',
    'shell': 'bash',
    'xml': 'markup'
};

let argv, fileContent, gists = [];

function init() {
	argv = minimist(process.argv.slice(2), {
		string: [
            'input',
            'username',
            'token'
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
        if (argv.username && argv.token) {
            options.auth = {
                user: argv.username,
                pass: argv.token
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
        let firstGistFile = Object.values(json.files)[0];
        gist.language = firstGistFile.language;
        gist.content = firstGistFile.content;
    }

    gist.isProcessed = true;
    if (gists.every(gist => gist.isProcessed)) {
        writeOutputFile();
    }
}

function writeOutputFile() {
    gists.forEach(gist => {
        let prismLang = translateLanguage(gist.language);
        let classAttr = prismLang ? ' class="language-' + prismLang + '"' : '';
        let codeBlock = '<pre><code' + classAttr + '>' + gist.content + '</code></pre>';
        fileContent = fileContent.replace(gist.scriptTag, codeBlock);
    });

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
        return null;
    } else {
        let prismLang = languageMap[gistLang] || gistLang;
        return prismLang;
    }
}

// it's go time!
init();
