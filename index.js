const http = require("http");
const { spawn } = require("child_process");
const crypto = require("crypto");
let SECRET = "123456";

function sign(body) {
    return `sha1=` + crypto.createHmac("sha1", SECRET).update(body).digest("hex");
}

const server = http.createServer(function (req, res) {
    console.log(req.method, req.url);
    if (req.method === "POST" && req.url == "/webhook") {
        const buffers = [];
        req.on("data", function(buffer) {
            console.log(buffer);
            buffers.push(buffer);
        });
        console.log(buffers);
        req.on("end", function () {
            const body = Buffer.concat(buffers);
            const event = req.headers['x-gitHub-event'];
            const signature = req.headers["x-hub-signature"];
            if (signature !== sign(body)) {
                return res.end("Not Allowed");
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ok: true}));

            if (event == "push") {
                console.log("event:", event == "push")
                const payload = JSON.parse(body);
                console.log("payload:", payload, payload.repository.name);
                const child = spawn("sh", [`./${payload.repository.name}.sh`]);
                const buffers = [];
                let size = 0;
                child.stdout.on("data", function(buffer) {
                    buffers.push(buffer);
                    size = buffer.length;
                });
                child.stdout.on("end", function() {
                    const log = Buffer.concat(buffers, size);
                    console.log(log);
                });
            }
        });
        
    } else {
        res.end("Not Found");
    }
});

server.listen(4000, () => {
    console.log("webhook server is open in port 4000");
});