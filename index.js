const http = require("http");
const crypto = require("crypto");
let SECRET = "123456";

function sign(body) {
    return `sha1=` + crypto.createHmac("sha1", SECRET).update(body).digest("hex");
}

const server = http.createServer(function (req, res) {
    console.log(req.method, req.url);
    if (req.method === "POST" && req.url == "/webhook") {
        let buffers = [];
        req.on("data", function(buffer) {
            buffers.push(buffer);
        });
        req.on("end", function (buffer) {
            let body = Buffer.concat(buffer);
            const event = req.headers['x-gitHub-event'];
            const signature = req.headers["x-hub-signature"];
            if (signature !== sign(body)) {
                return res.end("Not Allowed");
            }
        });
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ok: true}));
    } else {
        res.end("Not Found");
    }
});

server.listen(4000, () => {
    console.log("webhook server is open in port 4000");
});