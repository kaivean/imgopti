imgopti
==========

imgopti is a tool for optimizing images.

### Installation

```
    $ [sudo] npm install imgopti -g
```

### Usage

```
    imgopti [file | directory]
```

### Options

    1. -o, --output         the path to save
    2. -l, --lossy=<lossy value>          compress images lossyly, lossy value: 0 - 100, default lossy value is 20. lossy value is bigger, images compression is bigger
    3. -s        '<width>' || 'x<height>' || '<width>x<height>'. resize the image in proportion
    4. -f, --force     do not save original image
    5. -h, --help           print the help page
    6. -v, --version        print program version

### Api

```
var Imgoptimizer = require('imgopti');
var opt = {
    input: [], // directory or file
    output: null, // output directory, if not , overwrite original file and save original file like xxx-old.xxx
    matchRules: [ // image filter rules
        '*.jpeg',
        '*.jpg',
        '*.png',
        '*.gif'
    ],
    lossy: 20, // default value: 20
    size: '', // '<width>' || 'x<height>' || '<width>x<height>'. resize the image in proportion
    force: 0, //  overwrite original file and  do not save original image
    onFileProcessed: function (newFile, oldFile) { // callback when a file is processed

    },
    onComplete: function(count) { // callback when all files are processed

    }
};
var imgopti = new Imgoptimizer(opt);
imgopti.process();
```

### ChangeLog
#### 2016.7.24
fix a problem that there is a bug when actual mimeType is not equal to the extension
