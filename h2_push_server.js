var HTTP_PORT = 4433;

var fs = require('fs');
var http2 = require('http2');
var mime = require("mime");
var filepath = require('path');
const utils = require('./utils');
const url = require('url');

const { 
        HTTP2_HEADER_PATH,
        HTTP2_HEADER_STATUS,
        HTTP2_HEADER_CONTENT_TYPE,
        HTTP2_HEADER_CACHE_CONTROL,
} = http2.constants;

const httpServer = http2.createSecureServer({
                key: fs.readFileSync('/home/ubuntu/ssl/private/nginx-selfsigned.key'),
                cert: fs.readFileSync('/home/ubuntu/ssl/certs/nginx-selfsigned.crt')
        });

const sendFile = (stream, fileName) => {
        const fd = fs.openSync(fileName, "r");

        let headers = {
                "content-type": mime.getType(fileName),
                "cache-control": "no-cache",
		"Access-Control-Allow-Origin": '*'
        };

        stream.respondWithFD(fd, headers);
};

function pushFile(stream, path) {
        stream.pushStream({ [HTTP2_HEADER_PATH]: path }, (pushStream) => {
             	const file = utils.getFile(path);
                pushStream.respondWithFD(file.content, { ...file.headers, [HTTP2_HEADER_CACHE_CONTROL]: 'no-cache', "Access-Control-Allow-Origin": '*' });
        });
}

httpServer.on('stream', (stream, headers) => 
{
	const path = headers[HTTP2_HEADER_PATH];
        console.log('Incoming request:', path);

  	let requestPath = path === '/' ? '/index.html' : url.parse(path).pathname;
	requestPath = filepath.join('/home/ubuntu/nginx_web_root/', requestPath);

	switch(path) {
		case '/TOS/manifest.mpd':
                	console.log("mpd request");

			/*
			let audioInitSegName = "/home/ubuntu/nginx_web_root/TOS/r1/audio/en/init.mp4";
			let videoInitSegName = "/home/ubuntu/nginx_web_root/TOS/r1/video/1/init.mp4";
			let audioSegment1Name = "/home/ubuntu/nginx_web_root/TOS/r1/audio/en/seg-1.m4f";
			let videoSegment1Name = "/home/ubuntu/nginx_web_root/TOS/r1/video/1/seg-1.m4f";
			*/

			let audioInitSegPath = "/TOS/r1/audio/en/init.mp4";
			let videoInitSegPath = "/TOS/r1/video/1/init.mp4";
			let audioSegment1Path = "/TOS/r1/audio/en/seg-1.m4f";
			let videoSegment1Path = "/TOS/r1/video/1/seg-1.m4f";

			//console.log("Name: " + videoInitSegName + " Path: " + videoInitSegPath);

			pushFile(stream, audioInitSegPath);
			pushFile(stream, videoInitSegPath);
			pushFile(stream, audioSegment1Path);
			pushFile(stream, videoSegment1Path);

			sendFile(stream, requestPath);

        		break;

			/*
		case '/TOS/r1/audio/en/seg-1.m4f':
			sendFile(stream, requestPath);
			break;

		case '/TOS/r1/video/1/seg-1.m4f':
			sendFile(stream, requestPath);
                        break;
			*/

		default:
                        stream.respond({ [HTTP2_HEADER_STATUS]: 404 }, {endStream: true});
	}
});

httpServer.listen(HTTP_PORT, (err) => {
        if (err) {
                return console.log('something bad happened', err);
        }

        console.log(`server is listening on ` + HTTP_PORT);
});
