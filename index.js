/**
 * @file image optmizer
 * @author kaivean(kaisey2012@163.com)
 */

var fs = require('fs');
var path = require('path');
var execFile = require('child_process').execFile;

var chalk = require('chalk');
var asyncMod = require('async');
var tempfile = require('tempfile');
var _ = require('underscore');
var gm = require('gm');
var util = require('./lib/util');
var task = require('./lib/task');

var defaultOpt = {
    // match
    matchRules: [
        '*.jpeg',
        '*.jpg',
        '*.png',
        '*.gif'
    ],

    // [] is files or string is directory， if directory, we will recurse with directory
    input: [],

    // When set the output directory, If the input is a directory.
    // When doesn`t set the output directory, filename is added '-optimized'
    // and the new file is saved in the same directory as the original
    output: '',

    // Triggered when each file is processed
    onFileProcessed: function (newFilepath, oldFilepath) {}
};


/**
 * 压缩工具主类
 *
 * @constructor
 * @param {Object} opt 参数
 */
function Imgoptimizer(opt) {
    this.init(opt);
}

/**
 * 压缩工具主类－初始化
 * 获取需要处理文件、创建输出目录等
 *
 * @param {Object} opt 参数
 */
Imgoptimizer.prototype.init = function (opt) {
    _.extend(this, defaultOpt, opt);

    this.fileList = util.getFiles(this.input, this.matchRules);

    // 目录不存在,则创建
    if (this.output && !fs.existsSync(this.output)) {
        fs.mkdirSync(this.output);
    }
};

/**
 * 压缩工具主类－处理
 * 开始处理文件
 */
Imgoptimizer.prototype.process = function () {
    var me = this;

    this.count = 0;
    this.fileList.forEach(function (fileInfo) {
        me.processSingle(fileInfo);
    });
};

/**
 * 获取处理文件的任务集合，比如png，会分别采用optipng和pngquant进行处理，则有两个task
 *
 * @param {Object} fileInfo 处理文件对象
 * @return {Array}  返回可以执行的任务函数队列
 */
Imgoptimizer.prototype.getProcessors = function (fileInfo) {
    var workflow = [];
    switch (fileInfo.mime) {
        // png 采用optipng、pngquant
        case 'image/png':
            workflow.push(task.optipng(fileInfo.tmpFile));

            if (this.lossy) {
                workflow.push(task.pngquant(fileInfo.tmpFile, this.lossy));
            }
            break;

        // JPG采用jpegoptim工具进行压缩
        // 针对jpg做了容错
        case 'image/jpg':
        case 'image/jpeg':
            workflow.push(task.jpegoptim(fileInfo.tmpFile, this.lossy));
            break;

        // gif采用gifsicle工具进行压缩
        case 'image/gif':
            workflow.push(task.gifsicle(fileInfo.tmpFile, this.lossy));
            break;

        default:
            break;
    }

    if (!workflow.length) {
        console.warn(chalk.red('it can`t handle the image type'), fileInfo.path);
    }

    // 是否压缩图片尺寸
    if (this.size) {
        // 处理参数
        var arr  = this.size.toString().split(/[,xX]/);
        var width = arr[0] ? parseInt(arr[0], 10) : null;
        var height = (arr.length > 1 && arr[1]) ? parseInt(arr[1], 10) : null;

        // 增加压缩尺寸的task
        workflow.push({
            name: 'resize',
            width: width,
            height: height
        });
    }

    // 将每个任务转化成可以执行的函数队列等待执行
    return workflow.map(function (item) {
        return function (callback) {
            if (item.name === 'resize') {
                var width = item.width;
                var height = item.height;

                // 调用gm工具进行尺寸压缩
                gm(fileInfo.path).size(function (err, size) {
                    if (err) {
                        if (err.toString().indexOf('gm/convert binaries can not be found') > -1) {
                            console.log('resize fail',
                            'install graphicsmagick to solve the problem: brew install graphicsmagick');
                        }
                        callback(null, item.name);
                        return;
                    }
                    if (width > size.width  || height > size.height) {
                        callback(null, item.name);
                        return;
                    }

                    gm(fileInfo.tmpFile)
                        .resize(width, height)
                        .write(fileInfo.tmpFile, function (err) {
                            if (err) {
                                // console.log('gm resize write');
                            }
                            callback(null, item.name);
                        });
                });
            }
            else {
                // 执行相关图片处理的命令工具
                execFile(item.path, item.args, function (err) {
                    if (err) {
                        // console.log(err);
                    }
                    callback(null, item.name);
                });
            }
        };
    });
};

/**
 * 获取输出目录
 *
 * @param {Object} oldFile 源文件路径
 * @return {string}  返回目录路径
 */
Imgoptimizer.prototype.getOutputPath = function (oldFile) {
    var ret = '';
    if (this.output) {
        // file
        if (_.isArray(this.input)) {
            ret = path.resolve(this.output, oldFile.name + '.' + oldFile.ext);
        }
        // dir
        else if (_.isString(this.input)) {
            var relative = path.relative(this.input, oldFile.path);
            ret = path.resolve(this.output, relative);
        }
    }
    else {
        ret = oldFile.path;
        // ret = path.resolve(oldFile.dir, oldFile.name + '-optimized.' + oldFile.ext);
    }
    return ret;
};

/**
 * 当个文件处理完成的回调
 *
 * @param {Object} oldFile 源文件路径
 */
Imgoptimizer.prototype.processSingleCompleted = function (oldFile) {
    oldFile.content = fs.readFileSync(oldFile.path);

    var tempFile = oldFile.tmpFile;

    // 获取将要输出的文件的信息
    var newFile = util.readFileInfo(oldFile.tmpFile);
    newFile.content = fs.readFileSync(tempFile);
    newFile.path = this.getOutputPath(oldFile);

    delete oldFile.tmpFile;
    this.onFileProcessed(newFile, oldFile);
    fs.unlinkSync(tempFile);

    // 通过count计数，判断是否所有文件都处理完成
    this.count++;
    // 执行用户回调
    if (this.count === this.fileList.length) {
        this.onComplete && this.onComplete(this.count);
    }
};

/**
 * 开始处理一个文件
 *
 * @param {Object} fileInfo 源文件信息
 */
Imgoptimizer.prototype.processSingle = function (fileInfo) {
    var me = this;

    // 创建临时空文件
    fileInfo.tmpFile = tempfile('.' + fileInfo.ext);

    // 将原文件临时copy一份，处理队列只是针对临时文件处理，保证不影响原文件
    fs.writeFileSync(fileInfo.tmpFile, fs.readFileSync(fileInfo.path));

    // 获取该文件的处理task队列
    var workflowProccessors = me.getProcessors(fileInfo);

    // 开始调度task进行处理
    asyncMod.series(workflowProccessors, function (error, result) {
        me.processSingleCompleted(fileInfo);
    });
};

module.exports = Imgoptimizer;
