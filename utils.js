const fs = require('fs');
const mime = require('mime');
var filepath = require('path');

module.exports = {
    getFile(path) {
	const reqPath = filepath.join('/home/ubuntu/nginx_web_root', path);

        try {
            const content = fs.openSync(reqPath, 'r');

            return {
                content,
                headers: {
                    'content-type': mime.getType(reqPath)
                }
            };
        } catch (error) {
            return null;
        }
    }
};
