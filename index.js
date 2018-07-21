'use strict';
const Canvas = require('canvas');
const express = require('express');
const log = require('./logs');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const rand = require('random-js')();

const filedir = process.env.FILEDIR || './corpus'

const config = {
    maxWidth : 8000,
    maxHeight : 8000,
    backgroundStyle : '#CCC',
    textStyle : '#FFF',
    fontFamily : 'Impact',
    fontSizeParam : 5
};
const exts = ['.png','.jpg', '.jpeg'];

const servestream = async function (stream, res) {
    return new Promise((resolve, reject) => {
        return stream.pipe(res, function (err) {
            if (err) return reject(err)
            return resolve(true);
        })    
    })
}

const randimage = async function () {
    let dir;
    let file;
    let filePath;

    try {
        dir = await fs.readdir(filedir);
    } catch (err) {
        log.error(`Error reading directory ${filedir}`, err);
        return false
    }
    dir = dir.filter(file => {
        if ((file + '').substring(0, 1) !== '.') return file;
    })
    if (dir.length === 0) return false;
    file = dir[rand.integer(0, dir.length - 1)];
    filePath = path.join(filedir, file);
    log.info(`Sending file`, { filePath });
    return await fs.readFile(filePath);
}

const genimage = async function (width, height, ext) {
    let canvas;
    let ctx;
    let stream;
    let fontSize;
    let data;
    let img;
    let rat;
    let imgRat;
    let h;
    let w;
    let x;
    let y;

    try {
        data = await randimage();
    } catch (err) {
        log.error('Error getting random image', err);
    }

    canvas = new Canvas(width, height);
    ctx = canvas.getContext('2d');

    if (data) {
        img = new Canvas.Image; // Create a new Image
        img.src = data;
        rat = width / height; //ratio of requested image
        imgRat = img.width / img.height; // ratio of source image
        //center
        if (rat > imgRat) {
            h = width * imgRat
            y = Math.round((h - height) / 2)
            ctx.drawImage(img, 0, -y, width, h);
        } else if (rat < imgRat ) {
            w = height * imgRat
            x = Math.round((w - width) / 2)
            ctx.drawImage(img, -x, 0, w, height);
        } else {
            ctx.drawImage(img, 0, 0, width, height);
        }
        log.info(`Generating image`, {source_width : img.width, source_height : img.height, height, width });
    } else {
        ctx.save();
        ctx.fillStyle = config.backgroundStyle;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    fontSize = Math.round(Math.min(width/config.fontSizeParam,height));

    ctx.save();
    ctx.font = fontSize + 'px ' + config.fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(width + '×' + height, (width / 2) + 1, (height / 2) + 1 - fontSize * 0.1);
    ctx.fillStyle = config.textStyle;
    ctx.fillText(width + '×' + height, width / 2, height / 2 - fontSize * 0.1);
    ctx.restore();

    if (ext === 'png') {
        stream = canvas.createPNGStream();
    } else if (ext === '.jpg' || ext === '.jpeg') {
        stream = canvas.createJPEGStream();
    }

    return stream
}

/**
 * Generate image for placeholder use
 * url /placeholder/400x300.png
 * url /placeholder/400x300.jpg
 * url /placeholder/400x300.gif
 */
const placeholder = async function (req, res, next) {
    let width;
    let height;
    let ext;
    let match = false;
    let parsed;
    let split;
    let stream;
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (req.params && req.params.size) {
        parsed = path.parse(req.params.size);
        split = parsed.name.split('x');
        if (split.length === 2) {
            match = true;
        }
    }

    if (!match) {
        return next();
    }



    width = parseInt(split[0]);
    height = parseInt(split[1]);

    ext = parsed.ext.toLowerCase();

    log.info(`Placeholder requested for ${width}x${height}${ext}`, { ip })

    if(width < 0 || width > config.maxWidth || height < 0 || height > config.maxHeight){
        throw new Error('placeholder: Size out of range');
        return next();
    }

    if(exts.indexOf(ext) === -1) {
        throw new Error('placeholder: Extension not support');
        return next();
    }

    if (ext === '.png') {
        res.header('Content-Type','image/png');
    } else if (ext === '.jpg' || ext === '.jpeg') {
        res.header('Content-Type','image/jpeg');
    } else {
        log.error(`Incorrect extension ${ext} requested`);
        return next();
    }
    //TODO: gif

    stream = await genimage(width, height, ext);

    if (!stream) {
        return next()
    }

    try {
        await servestream(stream, res);
    } catch (err) {
        log.error(`Error serving stream`, err);
        return next();
    }
    res.end();

};

// express setup
const app = express();

app.use(helmet());
app.use(cookieParser());

//app.get('/', index)
app.get('/:size', placeholder) //add tracking


module.exports = app;


