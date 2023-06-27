const express = require("express")
const path = require("path")
const dotenv = require("dotenv")
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const cors = require("cors")
const { v4 } = require('uuid');

const {Response, bufferToStream} = require('./utils')

const s3storage = require("./s3")

const config = path.join(__dirname, ".env")
dotenv.config({ path: config })

const PORT = process.env.PORT;

const app = express()

app.use(bodyParser.json())

app.use(cors());
app.use(fileUpload())

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"))
})

const s3ClientConfig = {
    username: process.env.S3_USERNAME,
    password: process.env.S3_PASSWORD,
    savePath: process.env.S3_PATH
}

console.log(s3ClientConfig)

const allowedAudioTypes = [ //OPTIONAL
    "wav"
]

app.get("/listen", async (req, res) => {
    let { id } = req.query

    if(!id) return Response(res, {"data": "Invalid photo", "status": 400})

    res.setHeader('Content-Type', 'audio/wav; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let readStream = await s3storage.downloadFile(`${s3ClientConfig.savePath}/${id}`)

    readStream.pipe(res)
})

app.post("/sendAudio", (req, res) => {
    if(!req.files) return Response(res, {"data": "Invalid audio", "status": 400})
    const { audio } = req.files

    if(!audio) return Response(res, {"data": "Invalid photo", "status": 400})

    if (audio.mimetype.substr(0,6) !== 'audio/' && audio.mimetype !== 'application/octet-stream') return Response(res, {"data": "Invalid filetype", "status": 400})

    const fileSizeInMegabytes = audio.size / ( 1024*1024);
    if(fileSizeInMegabytes > 5) return Response(res, {"data": "Invalid Size of file, > 5 mb"})

    const type = audio.name.split(".").slice(-1)[0]

    if(!allowedAudioTypes.includes(type)) {
        return Response(res, {"data": "Invalid filetype", "status": 400})
    }

    const filename = v4();

    const readableStream = bufferToStream(audio.data);

    s3storage.uploadFile(`${s3ClientConfig.savePath}/"${filename}.${type}`, readableStream).then(r => {
        return Response(res, {"result": "sucessfully"})
    })
})

const PUBLIC = path.join(__dirname, "..", "public")

app.use(express.static(PUBLIC))

const startServer = async () => {
    return new Promise((resolve, reject) => {
        try {
            app.listen(PORT, () => {
                console.log(`Server started on port ${PORT}`)
                resolve();
            })
        } catch(e) {
            reject(e);
        }
    })
}

const start = async () => {
    try {
        await s3storage.login(s3ClientConfig.username, s3ClientConfig.password);
        await startServer()
    } catch(e) {
        console.warn(e.toString())
    }
}

start();
