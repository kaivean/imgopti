/**
 * @file 工具函数
 * @author kaivean(kaisey2012@163.com)
 */

var fs = require('fs');
var path = require('path');
var imageinfo = require('imageinfo');
var minimatch = require('minimatch');
var _ = require('underscore');

/**
 * is file
 *
 * @param {string} filepath 路径
 * @return {Blooean} is file
 */
exports.isFile = function (filepath) {
    var stat = fs.statSync(filepath);
    return stat.isFile();
};

/**
 * is dir
 *
 * @param {string} filepath 路径
 * @return {Blooean} is dir
 */
exports.isDir = function (filepath) {
    var stat = fs.statSync(filepath);
    return stat.isDirectory();
};

/**
 * 文件是否满足规则
 *
 * @param {Array} matchRules 需要满足的规则
 * @param {string} matchValue 将匹配值
 * @return {Blooean}  是否匹配
 */
exports.matchFile = function (matchRules, matchValue) {
    // 循环匹配每个规则，直到回调函数返回true便结束，此时some也将返回true
    return matchRules.some(function (matchRule) {
        if (minimatch(matchValue, matchRule, {matchBase: true})) {
            return true;
        }
    });
};

/**
 * 获取文件，并过滤不匹配的文件
 *
 * @param {Mixed} input 路径，可以是单个也可以是多个
 * @param {Array} matchRules 需要满足的规则
 * @return {Array}  文件集合
 */
exports.getFiles = function (input, matchRules) {
    if (_.isString(input)) {
        input = [input];
    }

    var fileList = [];
    input.forEach(function (path) {
        if (!fs.existsSync(path)) {
            console.warn(path + '  doesn`t exist');
            return;
        }

        var res = exports.readFiles(path);
        fileList = fileList.concat(res);
    });

    // 过滤文件
    fileList = fileList.filter(function (fileinfo) {
        // 不符合匹配规则，就过滤掉
        if (!exports.matchFile(matchRules, fileinfo.path)) {
            return false;
        }
        return true;
    });

    return fileList;
};

/**
 * recursively read files of dir
 *
 * @param {string} file 路径
 * @return {Blooean} all files
 */
exports.readFiles = function (file) {
    if (!fs.existsSync(file)) {
        return [];
    }

    var fileList = [];
    if (exports.isDir(file)) {
        fs.readdirSync(file).forEach(function (filename) {
            var filepath = path.resolve(file, filename);
            fileList = fileList.concat(exports.readFiles(filepath));
        });
    }
    else {
        fileList.push(exports.readFileInfo(file));
    }

    return fileList;
};

/**
 * get file info
 *
 * @param {string} filepath 路径
 * @return {Object} file info
 */
exports.readFileInfo = function (filepath) {
    var stat = fs.statSync(filepath);
    var obj = {};
    obj.size = stat.size; // 文件大小，以字节b为单位
    obj.path = filepath; // 文件绝对路径

    var ext = path.extname(filepath);
    obj.ext = ext.substring(1);
    obj.name = path.basename(filepath, ext); // 文件名
    obj.dir = path.dirname(filepath);

    obj.mime = 'image/' + obj.ext;
    var imageData = require('fs').readFileSync(filepath);
    if (imageData) {
        var info = imageinfo(imageData);
        obj.mime = info.mimeType;
    }

    return obj;
};
