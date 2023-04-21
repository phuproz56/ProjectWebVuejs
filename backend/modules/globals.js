const baseURL = "http://localhost:3000"
global.baseURL = baseURL

const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; // Using AES encryption
const key = "adnan-tech-programming-computers"; // must be of 32 characters
const fileSystem = require("fs");

global.encrypt = function (text) {
    const iv = crypto.randomBytes(16);

    // protected data
    const message = text;

    // the cipher function
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    // encrypt the message
    // input encoding
    // output encoding
    let encryptedData = cipher.update(message, "utf-8", "hex");
    encryptedData += cipher.final("hex");

    const base64data = Buffer.from(iv, 'binary').toString('base64');
    return {
        iv: base64data,
        encryptedData: encryptedData
    };
};

global.decrypt = function (text) {
    const origionalData = Buffer.from(text.iv, 'base64')

    const decipher = crypto.createDecipheriv(algorithm, key, origionalData);
    let decryptedData = decipher.update(text.encryptedData, "hex", "utf-8");
    decryptedData += decipher.final("utf8");
    return decryptedData;
};

// function to encode file data to base64 encoded string
global.base64Encode = function (file) {
    // read binary data
    var bitmap = fileSystem.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer.from(bitmap).toString('base64');
};

global.getGroupChat = async function (request, group) {
    const page = request.fields.page ?? 0;
    const limit = 10;

    const messages = await db.collection("messages").find({
        $and: [{
            "receiver._id": group._id
        }, {
            type: "group"
        }]
    })
    .sort("createdAt", -1)
    .skip(page * limit)
    .limit(limit)
    .toArray();

    const data = [];
    for (let a = 0; a < messages.length; a++) {
        data.push({
            _id: messages[a]._id.toString(),
            message: decrypt(messages[a].message),
            sender: {
                email: messages[a].sender.email,
                name: messages[a].sender.name
            },
            createdAt: messages[a].createdAt,
            attachment: messages[a].attachment
        });
    }

    return data;
};