# gist-to-prismjs

Converts embedded GitHub gists into PrismJS code blocks.

Takes an input file of any type and searches it for embedded gist `<script>` tags that look something like this:

``` html
<script src="https://gist.github.com/lonekorean/6042c732c624d53b105fa03abcecc597.js"></script>
```

The code within each gist is fetched and put directly into [PrismJS](https://prismjs.com/)-compatible code blocks that look something like this:

``` html
<pre><code class="language-javascript">var dataURL = canvas.toDataURL();</code></pre>
```

A new file is created for you with all the aforementioned gist `<script>` tags replaced with PrismJS code blocks.

## How To Use

Make sure you have [Node.js](https://nodejs.org/) installed. Then open your terminal to this package's directory and run `npm install`.

The easiest thing to do is put the file you want to convert into this package's directory, then run the following command (replacing arguments as needed):

```
node index.js --input=file.txt --user=github_username --pass=github_password
```

In this case, a file named `file-output.txt` will be created with all the replacements.

Done!

## Rate Limiting

You technically don't need to provide `--user` and `--pass`, but without them GitHub will severely limit you to [60 API requests per hour](https://developer.github.com/v3/#rate-limiting). If you have more than 60 gists to convert, then they won't all succeed. By providing `--user` and `--pass` the limit goes up to 5,000 per hour.

If you have [2FA](https://help.github.com/articles/about-two-factor-authentication/) enabled on your GitHub account or just prefer not to use your actual password on the command line (respect) then you can use a [personal API token](https://blog.github.com/2013-05-16-personal-api-tokens/). It's easy to create one and you simply use it for `--pass` instead of your GitHub password.

## Command Line Arguments

You can use command line arguments to control how the script runs.

### --input

- Type: String

The file to process. Can be any file type. The output file will have the same filename as the input file, except suffixed with "-output".

### --user

- Type: String

Your GitHub username. Not required, but providing it (along with `--pass`) will substantially increase the number of gists that can be converted. See the Rate Limiting section above.

### --pass

- Type: String

Your GitHub password or API token. Not required, but providing it (along with `--user`) will substantially increase the number of gists that can be converted. See the Rate Limiting section above.

### --escape

- Type: String
- Default: `htmlencode`

Code blocks typically require some sort of treatment to ensure that the code renders correctly (especially with HTML). There are several options for how to handle this.

| Value | Description |
| - | - |
| `htmlencode` | Encodes `<` and `>` to `&lt;` and `&gt;`. |
| `script` | Wraps code blocks with specialized `<script>` tags, compatible with the [unescaped-markup](https://prismjs.com/plugins/unescaped-markup/) plugin. |
| `comment` | Wraps the code inside of code blocks in an HTML comment (`<!--  -->`), compatible with the [unescaped-markup](https://prismjs.com/plugins/unescaped-markup/) plugin. |
| `none` | Does no additional processing. Useful if you have your own additional processing to take care of things. Be warned, by itself, this can lead to improperly rendered code blocks. |
