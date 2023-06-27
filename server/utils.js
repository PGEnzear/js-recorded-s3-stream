const {Duplex} = require('stream')

const Response = async (res, result, req = undefined) => {
    if(!result) {
      if(req) {
        return res.status(500).json({"data": 'Something went wrong', "status": 400, "timestamp": String(Date.now())});
      } else {
        return res.sendStatus(500) 
      }
    }
    let status = result.status || 200
    if(!result.status && result.error) status = 400
    const error = result.error
    const data = result.data
    const dtime = Date.now()
    res.status(status);
    if(error) {
      res.json({status, error, dtime})
    } else {
      res.json({status, data, dtime})
    }
}

function bufferToStream(myBuffer) {
    let tmp = new Duplex();
    tmp.push(myBuffer);
    tmp.push(null);
    return tmp;
}

module.exports = {
    Response,
    bufferToStream
}