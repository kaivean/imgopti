/**
 * @file command line interface
 * @author kaivean(kaisey2012@163.com)
 */

var fs = require('fs');
var Imgoptimizer = require('./');
var parseArgs = require('minimist');
var path = require('path');
var chalk = require('chalk');
var filesize = require('filesize');

// 参数解析映射表配置别名和默认值， recursive和force的都是布尔型
var argv = parseArgs(process.argv.slice(2), {
    'boolean': ['r', 'recursive', 'f', 'force'],
    'alias': {
        l: 'lossy',
        r: 'recursive',
        h: 'help',
        v: 'version',
        f: 'force',
        s: 'size'
    }
});

var command = {

    /**
     * 打印帮助信息
     */
    help: function () {
        console.log(
            [
                'Usage: imgopti [options] files|directory',
                '',
                'Description: reduce your image size.',
                '   the image optimized overwrite the original image, which is save as xxx-old.xxx',
                '',
                'Options:',
                '   -o, --output     the path to save',
                '   -l, --lossy=<lossy value>  compress images lossyly',
                '        lossy value: 0 - 100, default lossy value is 20.',
                '        lossy value is bigger, images compression is bigger',
                '   -f, --force     do not save original image',
                '   -s      <width> || x<height> || <width>x<height> . resize the image in proportion',
                '',
                '   Other:',
                '   -h, --help       print this help page',
                '   -v, --version        print program version',
                '',
                'Examples:',
                '   Single File',
                '   eg: imgopti image.png',
                '',
                '   Single Directory',
                '   eg: imgopti ~/images',
                '',
                '   Multiple Files',
                '   eg: imgopti foo.png bar.png baz.png qux.png',
                ''
            ].join('\n')
        );
    },

    /**
     * 打印版本号
     */
    version: function () {
        var pkg = require('./package.json');
        console.log(pkg.version);
    }
};


var cli = {
    exec: function () {
        // 获取 ：是否打印帮助信息
        if (argv.help) {
            command.help();
            return;
        }

        // 获取 是否打印版本号
        if (argv.version) {
            command.version();
            return;
        }

        var opt = {};

        // 获取 压缩文件后的输出目录
        if (argv.output || argv.o) {
            opt.output = argv.output || argv.o;
        }

        // 获取 压缩强度
        if ('lossy' in argv) {
            if (argv.lossy === true) {
                opt.lossy = 20;
            }
            else {
                opt.lossy = argv.lossy;
            }
        }

        // 获取 压缩图片尺寸信息
        if (argv.s) {
            opt.size = argv.s;
        }

        // 获取所有传进来的文件和目录
        var files = argv._;
        if (files.length === 0) {
            console.warn('no file');
            return false;
        }

        // 获取绝对路径
        files = files.map(function (f) {
            return path.resolve(process.env.PWD, f);
        });

        // 转化成字符串，表示目录
        opt.input = files;

        if (!opt.input) {
            // 数组，表示文件路径数组
            opt.input = files.map(function (item) {
                return path.resolve(item);
            });
        }

        // 当一个图片文件被处理完后的回调
        opt.onFileProcessed = function (newFile, oldFile) {
            var oldPath = oldFile.path;
            var newPath = newFile.path;

            var oldSize = oldFile.size;
            var newSize = newFile.size;
            var diffSize = oldSize - newSize;

            // 保留小数点后一位
            var percent = 0;

            // >0 || specify size
            if (diffSize >= 0 || opt.size) {
                diffSize = diffSize < 0 ? 0 : diffSize;

                // 有除法有乘法时，最好选乘后除，先乘后除，避免过早丢失精度
                // percent已经是字符串了
                percent = (diffSize * 100 / oldSize).toFixed(1);

                var ts = percent.split('.');
                percent = ts[1] === '0' ? ts[0] : percent;
                // 如果强制覆盖，则不保存旧图片
                if (!argv.force) {
                    var original = path.resolve(oldFile.dir, 'old-' + oldFile.name + '.' + oldFile.ext);
                    fs.writeFileSync(original, oldFile.content);
                }

                // 输出文件
                fs.writeFileSync(newPath, newFile.content);

                console.log(
                    chalk.green('✔ ') + oldPath + chalk.gray(' -> ') + newPath + '   '
                    + chalk.yellow(filesize(oldSize)) + chalk.gray(' -> ')
                    + chalk.cyan(filesize(newSize)) + chalk.gray(' reduced: ')
                    + chalk.green.underline(filesize(diffSize)) + '(' + percent + '%)'
                );
            }
            else {
                console.log(
                    chalk.red('X ') + oldPath + '   '
                    + chalk.yellow(filesize(oldSize)) + chalk.gray(' fail to optimize. ')
                );
            }
        };

        // 压缩工具主类,初始化
        var imgopti = new Imgoptimizer(opt);
        // 开始处理
        imgopti.process();
    }
};

module.exports = cli;
