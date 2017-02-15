/**
 * @file 处理任务
 * @author kaivean(kaisey2012@163.com)
 */


/**
 * PNG lossless compression
 * OptiPNG is a PNG optimizer that recompresses image files to a smaller size, without losing any information.
 *
 * @param {string} filepath 路径
 * @return {Object} task对象
 */
exports.optipng = function (filepath) {
    var args = [];
    // args.push('-i 1');  //
    args.push('-strip all'); // remove metadata
    // args.push('-fix'); //
    args.push('-o2'); //
    args.push('-force'); //
    args.push(filepath);
    return {
        name: 'optipng',
        path: require('optipng-bin'),
        args: args
    };
};

/**
 * PNG lossy compression
 * pngquant is a command-line utility for converting 24/32-bit PNG images to paletted (8-bit) PNGs.
 * The conversion reduces file sizes significantly (often as much as 70%) and preserves full alpha transparency.
 *
 * @param {string} filepath 路径
 * @param {number} lossyValue 压缩强度
 * @return {Object} task对象
 */
exports.pngquant = function (filepath, lossyValue) {
    var args = [];

    lossyValue = lossyValue || 0;
    var quality = 100 - lossyValue;
    // args.push('--ext=.png');
    args.push('--quality=' + quality);
    args.push('--speed=3');
    args.push('--force');
    // args.push('256');
    args.push('--output=' + filepath);
    args.push(filepath);

    return {
        name: 'pngquant',
        path: require('pngquant-bin'),
        args: args
    };
};

/**
 * JPG lossless compression
 *
 * @param {string} filepath 路径
 * @return {Object} task对象
 */
exports.jpegtran = function (filepath) {
    var args = [];

    // args.push('-copy');
    // args.push('none'); // Copy no extra markers from source file
    // args.push('-progressive'); // Create progressive JPEG file
    // args.push('-optimize'); // Optimize Huffman table (smaller file, but slow compression)
    args.push('-outfile');
    args.push(filepath);
    args.push(filepath);
    return {
        name: 'jpegtran',
        path: require('jpegtran-bin'),
        args: args
    };
};

/**
 * JPG lossy compression
 *
 * @param {string} filepath 路径
 * @param {number} lossyValue 压缩强度
 * @return {Object} task对象
 */
exports.jpegoptim = function (filepath, lossyValue) {
    lossyValue = lossyValue || 20;
    var quality = 100 - lossyValue;

    var args = [];
    args.push('--strip-all');
    args.push('--all-progressive');
    args.push('-m');
    args.push(quality);
    args.push(filepath);

    return {
        name: 'jpegoptim',
        path: require('jpegoptim-bin'),
        args: args
    };
};

/**
 * GIF lossy compression
 *
 * @param {string} filepath 路径
 * @param {number} lossyValue 压缩强度
 * @return {Object} task对象
 */
exports.gifsicle = function (filepath, lossyValue) {
    lossyValue = lossyValue || 20;
    var quality = 100 - lossyValue;
    var color = Math.round(256 * (quality / 100));

    var args = [];
    // console.log('fwe');
    // args.push('--careful');
    // args.push('--interlace');
    args.push('-O=3');
    args.push('--colors');
    args.push(color);
    args.push('--output');
    args.push(filepath);
    args.push(filepath);

    return {
        name: 'gifsicle',
        path: require('gifsicle'),
        args: args
    };
};
