var nodeunit = require("nodeunit");
var fs = require('fs');
var path = require('path');

var Imgoptimizer = require('../');
var imgopti;
var file = [];

exports['imgopti'] = nodeunit.testCase({

    init: function(callback) {

        var opt = {
            // 字符串数组，内容为 文件或目录路径
            input: [
                path.resolve(__dirname, 'icon.png'),
                path.resolve(__dirname, 'small.jpg'),
                path.resolve(__dirname, 'my.txt')
            ],
            // 输出目录，如果设置了，所有文件将保存在该目录下，否则，会覆盖旧文件，并在同级目录下保存旧文件
            // output: null,
            matchRules: [ // 处理的文件匹配规则, 目前支持四种类型文件压缩
                '*.jpeg',
                '*.jpg',
                '*.png',
                '*.gif'
            ],
            lossy: false, // 是否进行有损压缩
            onFileProcessed: function (newFile, oldFile) { // 每当处理完一个文件时执行，会返回处理后的文件信息和旧文件信息
                file.push(newFile);
            },
            onComplete: function(count) { //所有文件处理完成时， 返回处理的文件个数

            }
        };
        imgopti = new Imgoptimizer(opt);
        imgopti.process();
        callback();
    },

    "test": function(test){

        console.log(file.length);
        test.equal(2, file.length);
        test.done();
    },

    "end": function(test){
        test.done();
    }

});
