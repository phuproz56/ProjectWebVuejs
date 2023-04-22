const auth = require("./auth");
const fileSystem = require("fs");
var ObjectId = require("mongodb").ObjectId;
require("./globals");

module.exports = {
    socketIO: null,
    init: function (app, express) {
        // create a new router object from express
        const router = express.Router();

        const self = this;
        router.post("/add", auth, async function (request, result) {
            const user = request.user;
            const name = request.fields.name;
            const picture = request.files.picture;
            const createdAt = new Date().getTime();
            const object = {
                name: name,
                createdBy: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                },
                members: [],
                createdAt: createdAt
            };

            if (picture != null && picture.size > 0 && (picture.type == "image/png" || picture.type == "image/jpeg" || picture.type == "image/HEIC")) {

                const dateObj = new Date();
                const datetimeStr = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate() + " " + dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds();
                const fileName = "ChatStation-" + name + "-" + datetimeStr + "-" + picture.name;

                const filePath = "uploads/groups/" + fileName;

                object.picture = {
                    size: picture.size,
                    path: filePath,
                    name: fileName,
                    displayName: picture.name,
                    type: picture.type
                };
                fileSystem.readFile(picture.path, function (error, data) {
                    if (error) {
                        console.error(error);
                    }
                    fileSystem.writeFile(filePath, data, function (error) {
                        if (error) {
                            console.error(error);
                        }
                    });
                    fileSystem.unlink(picture.path, function (error) {
                        if (error) {
                            console.error(error);
                        }
                    });
                });
            }
            const group = await db.collection("groups").insertOne(object);
            object._id = group.insertedId;
            result.json({
                status: "success",
                message: "Group has been created.",
                group: object
            });
            const userMember = await db.collection("users").findOne({
                $and: [{
                    _id: user._id
                }, {
                    "groups._id": {
                        $ne: object._id
                    }
                }]
            });
            if (userMember != null) {
                await db.collection("users").findOneAndUpdate({
                    _id: user._id
                }, {
                    $push: {
                        groups: {
                            _id: object._id,
                            unreadMessages: 0
                        }
                    }
                });
            }

        });

        router.post("/fetch", auth, async function (request, result) {
            const user = request.user;
            const groups = await db.collection("groups").find({
                    $or: [{
                        "createdBy._id": user._id
                    }, {
                        "members.user._id": user._id
                    }]
                })
                .sort({
                    "createdAt": -1
                })
                .toArray();

            result.json({
                status: "success",
                message: "Groups has been fetched.",
                groups: groups,
                user: user
            });
        });
        router.post("/inviteMember", auth, async function (request, result) {
            const user = request.user;
            const _id = request.fields._id;
            const email = request.fields.email;
            const group = await db.collection("groups").findOne({
                "_id": ObjectId(_id)
            });
            if (group == null) {
                result.json({
                    status: "error",
                    message: "Group does not exists."
                });
                return;
            }
            const member = await db.collection("users").findOne({
                "email": email
            });
            if (member == null) {
                result.json({
                    status: "error",
                    message: "User does not exists."
                });
                return;
            }
            let isAlreadyMember = false;
            for (let a = 0; a < group.members.length; a++) {
                if (group.members[a].user.email == email) {
                    isAlreadyMember = true;
                    break;
                }
            }
            if (group.createdBy.email == email || isAlreadyMember) {
                result.json({
                    status: "error",
                    message: "User is already a member of this group."
                });
                return;
            }
            await db.collection("groups").findOneAndUpdate({
                _id: group._id
            }, {
                $push: {
                    members: {
                        _id: ObjectId(),
                        status: "pending", 
                        sentBy: {
                            _id: user._id,
                            name: user.name,
                            email: user.email
                        },
                        user: {
                            _id: member._id,
                            name: member.name,
                            email: member.email
                        },
                        createdAt: new Date().getTime()
                    }
                }
            });

            await db.collection("users").findOneAndUpdate({
                _id: member._id
            }, {
                $push: {
                    notifications: {
                        _id: ObjectId(),
                        type: "group_invite",
                        group: {
                            _id: group._id,
                            name: group.name
                        },
                        isRead: false,
                        sentBy: {
                            _id: user._id,
                            name: user.name,
                            email: user.email
                        },
                        createdAt: new Date().getTime()
                    }
                }
            });

            result.json({
                status: "success",
                message: "Invitation has been sent."
            });

            const userMember = await db.collection("users").findOne({
                $and: [{
                    _id: member._id
                }, {
                    "groups._id": {
                        $ne: group._id
                    }
                }]
            });

            if (userMember != null) {
                await db.collection("users").findOneAndUpdate({
                    _id: member._id
                }, {
                    $push: {
                        groups: {
                            _id: group._id,
                            unreadMessages: 0
                        }
                    }
                });
            }
        });

        router.post("/acceptInvite", auth, async function (request, result) {
            const user = request.user;
            const _id = request.fields._id;
            const group = await db.collection("groups").findOne({
                "_id": ObjectId(_id)
            });
            if (group == null) {
                result.json({
                    status: "error",
                    message: "Group does not exists."
                });
                return;
            }

            await db.collection("groups").findOneAndUpdate({
                $and: [{
                    _id: group._id
                }, {
                    "members.user._id": user._id
                }]
            }, {
                $set: {
                    "members.$.status": "accepted"
                }
            });

            result.json({
                status: "success",
                message: "Invitation has been accepted.",
                user: user
            });
        });

        router.post("/leaveGroup", auth, async function (request, result) {
            const user = request.user;
            const _id = request.fields._id;
            const group = await db.collection("groups").findOne({
                "_id": ObjectId(_id)
            });

            if (group == null) {
                result.json({
                    status: "error",
                    message: "Group does not exists."
                });
                return;
            }
            if (group.createdBy._id.toString() == user._id.toString()) {
                result.json({
                    status: "error",
                    message: "Sorry, you are an admin. Please make anyone else the admin before leaving."
                });
                return;
            }
            let isMember = false;
            for (let a = 0; a < group.members.length; a++) {
                if (group.members[a].user._id.toString() == user._id.toString()) {
                    isMember = true;
                    break;
                }
            }
            if (!isMember) {
                result.json({
                    status: "error",
                    message: "Sorry, you are not a member of this group."
                });
                return;
            }
            await db.collection("groups").findOneAndUpdate({
                _id: group._id
            }, {
                $pull: {
                    members: {
                        "user._id": user._id
                    }
                }
            });

            result.json({
                status: "success",
                message: "Group has been left."
            });
        });

        router.post("/detail", auth, async function (request, result) {
            const user = request.user;
            const _id = request.fields._id;
            const group = await db.collection("groups").findOne({
                _id: ObjectId(_id)
            });

            if (group == null) {
                result.json({
                    status: "error",
                    message: "Group does not exists."
                });
                return;
            }

            let isMember = false;
            for (let a = 0; a < group.members.length; a++) {
                if (group.members[a].user._id.toString() == user._id.toString()) {
                    isMember = true;
                    break;
                }
            }

            if (group.createdBy._id.toString() != user._id.toString() && !isMember) {
                result.json({
                    status: "error",
                    message: "You are not a member of this group."
                });
                return;
            }

            result.json({
                status: "success",
                message: "Data has been fetched.",
                group: group,
                user: user
            });

            // // get messages
            // const messages = getGroupChat(request, group);
            // messages.then(function (chatMessages) {
            //     result.json({
            //         status: "success",
            //         message: "Data has been fetched.",
            //         group: group,
            //         user: user,
            //         messages: chatMessages
            //     });
            // });
        });

        router.post("/removeMember", auth, async function (request, result) {
            const user = request.user;
            const _id = request.fields._id;
            const groupId = request.fields.groupId;
            const group = await db.collection("groups").findOne({
                _id: ObjectId(groupId)
            });

            if (group == null) {
                result.json({
                    status: "error",
                    message: "Group does not exists."
                });
                return;
            }

            if (group.createdBy._id.toString() != user._id.toString()) {
                result.json({
                    status: "error",
                    message: "Sorry, you are not group admin."
                });
                return;
            }

            let isMember = false;
            for (let a = 0; a < group.members.length; a++) {
                if (group.members[a]._id.toString() == _id) {
                    isMember = true;
                    break;
                }
            }

            if (!isMember) {
                result.json({
                    status: "error",
                    message: "Sorry, the user is not a member of this group."
                });
                return;
            }

            await db.collection("groups").findOneAndUpdate({
                _id: group._id
            }, {
                $pull: {
                    members: {
                        _id: ObjectId(_id)
                    }
                }
            });

            result.json({
                status: "success",
                message: "Member has been removed."
            });
        });

        router.post("/makeAdmin", auth, async function (request, result) {
            const user = request.user;
            const _id = request.fields._id;
            const groupId = request.fields.groupId;
            const group = await db.collection("groups").findOne({
                _id: ObjectId(groupId)
            });

            if (group == null) {
                result.json({
                    status: "error",
                    message: "Group does not exists."
                });
                return;
            }

            const memberUser = await db.collection("users").findOne({
                _id: ObjectId(_id)
            });

            if (memberUser == null) {
                result.json({
                    status: "error",
                    message: "User does not exists."
                });
                return;
            }
            if (group.createdBy._id.toString() != user._id.toString()) {
                result.json({
                    status: "error",
                    message: "Sorry, you are not group admin."
                });
                return;
            }
            let isMember = false;
            for (let a = 0; a < group.members.length; a++) {
                if (group.members[a].user._id.toString() == _id) {
                    isMember = true;
                    break;
                }
            }
            if (!isMember) {
                result.json({
                    status: "error",
                    message: "Sorry, the user is not a member of this group."
                });
                return;
            }
            await db.collection("groups").findOneAndUpdate({
                _id: group._id
            }, {
                $pull: {
                    members: {
                        "user._id": memberUser._id
                    }
                }
            });

            await db.collection("groups").findOneAndUpdate({
                _id: group._id
            }, {
                $set: {
                    createdBy: {
                        _id: memberUser._id,
                        name: memberUser.name,
                        email: memberUser.email
                    }
                }
            });

            await db.collection("groups").findOneAndUpdate({
                _id: group._id
            }, {
                $push: {
                    members: {
                        _id: ObjectId(),
                        status: "accepted",
                        sentBy: {
                            _id: user._id,
                            name: user.name,
                            email: user.email
                        },
                        user: {
                            _id: user._id,
                            name: user.name,
                            email: user.email
                        },
                        createdAt: new Date().getTime()
                    }
                }
            });

            const updatedGroup = await db.collection("groups").findOne({
                _id: ObjectId(groupId)
            });

            result.json({
                status: "success",
                message: "Admin has been changed.",
                group: updatedGroup
            });
        });

        router.post("/sendMessage", auth, async function (request, result) {

            const user = request.user;
            const _id = request.fields._id;
            const message = request.fields.message;
            const createdAt = new Date().getTime();
            const attachment = request.files.attachment; 

            if (!_id || !message) {
                result.json({
                    status: "error",
                    message: "Please enter all fields."
                });
                return;
            }
            const hw = encrypt(message);
            const group = await db.collection("groups").findOne({
                _id: ObjectId(_id)
            });

            if (group == null) {
                result.json({
                    status: "error",
                    message: "Group does not exists."
                });
                return;
            }

            let isMember = false;
            let status = "";
            for (let a = 0; a < group.members.length; a++) {
                if (group.members[a].user._id.toString() == user._id.toString()) {
                    isMember = true;
                    status = group.members[a].status;
                    break;
                }
            }
            const isAdmin = (group.createdBy._id.toString() == user._id.toString());

            if (!isAdmin && !isMember) {
                result.json({
                    status: "error",
                    message: "You are not a member of this group."
                });
                return;
            }

            if (!isAdmin && status != "accepted") {
                result.json({
                    status: "error",
                    message: "Sorry, you have not accepted the invitation to join this group yet."
                });
                return;
            }

            const object = {
                message: hw,
                sender: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                },
                receiver: {
                    _id: group._id,
                    name: group.name
                },
                type: "group",
                createdAt: createdAt
            };

            if (attachment != null && attachment.size > 0) {
                const dateObj = new Date();
                const datetimeStr = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate() + " " + dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds();
                const fileName = "ChatStation-" + datetimeStr + "-" + attachment.name;
                const filePath = "uploads/groups/" + fileName;

                object.attachment = {
                    size: attachment.size,
                    path: filePath,
                    name: fileName,
                    displayName: attachment.name,
                    type: attachment.type
                };

                fileSystem.readFile(attachment.path, function (error, data) {
                    if (error) {
                        console.error(error);
                    }

                    fileSystem.writeFile(filePath, data, function (error) {
                        if (error) {
                            console.error(error);
                        }
                    });

                    fileSystem.unlink(attachment.path, function (error) {
                        if (error) {
                            console.error(error);
                        }
                    });
                });
            }

            const document = await db.collection("messages").insertOne(object);

            const messageObject = {
                _id: document.insertedId,
                message: message,
                sender: object.sender,
                receiver: object.receiver,
                attachment: object.attachment,
                type: "group",
                isRead: false,
                createdAt: createdAt
            };

            for (let a = 0; a < group.members.length; a++) {
                if (group.members[a].user._id.toString() != user._id.toString()) {
                    if (typeof global.users[group.members[a].user.email] !== "undefined") {
                        self.socketIO.to(global.users[group.members[a].user.email]).emit("sendMessage", {
                            title: "New message has been received.",
                            data: messageObject
                        });
                    }
                }
            }

            if (group.createdBy._id.toString() != user._id.toString()) {
                self.socketIO.to(global.users[group.createdBy.email]).emit("sendMessage", {
                    title: "New message has been received.",
                    data: messageObject
                });
            }
            result.json({
                status: "success",
                message: "Message has been sent.",
                messageObject: messageObject
            });

            const membersIds = [];
            for (let a = 0; a < group.members.length; a++) {
                if (group.members[a].user._id.toString() != user._id.toString()) {
                    membersIds.push(ObjectId(group.members[a].user._id));
                }
            }

            if (membersIds.length > 0) {
                await db.collection("users").updateMany({
                    $and: [{
                        _id: {
                            $in: membersIds
                        }
                    }, {
                        "groups._id": group._id
                    }]
                }, {
                    $inc: {
                        "groups.$.unreadMessages": 1
                    }
                }, {
                    upsert: true
                });
            }

            if (group.createdBy._id.toString() != user._id.toString()) {
                await db.collection("users").updateMany({
                    $and: [{
                        _id: group.createdBy._id
                    }, {
                        "groups._id": group._id
                    }]
                }, {
                    $inc: {
                        "groups.$.unreadMessages": 1
                    }
                }, {
                    upsert: true
                });
            }

        });

        router.post("/attachment", auth, async function (request, result) {
            const messageId = request.fields.messageId;
            const user = request.user;

            const message = await db.collection("messages").findOne({
                _id: ObjectId(messageId)
            });

            if (message == null) {
                result.status(404).json({
                    status: "error",
                    message: "Message not found."
                });
                return;
            }

            const group = await db.collection("groups").findOne({
                _id: message.receiver._id
            });

            if (group == null) {
                result.status(404).json({
                    status: "error",
                    message: "Group does not exists."
                });
                return;
            }

            let isMember = false;
            for (let a = 0; a < group.members.length; a++) {
                if (group.members[a].user._id.toString() == user._id.toString()) {
                    isMember = true;
                    break;
                }
            }

            const isAdmin = group.createdBy._id.toString() == user._id.toString();
            if (!isAdmin && !isMember) {
                result.json({
                    status: "error",
                    message: "Sorry, you are not a member of this group."
                });
                return;
            }

            let attachment = message.attachment;
            const base64Str = "data:" + attachment.type + ";base64," + base64Encode(attachment.path);
            result.json({
                status: "success",
                message: "Attachment has been fetched",
                base64Str: base64Str,
                fileName: attachment.displayName
            });
        });
        router.post("/markAsRead", auth, async function (request, result) {
            const user = request.user;
            const _id = request.fields._id;

            const group = await db.collection("groups").findOne({
                _id: ObjectId(_id)
            });

            if (group == null) {
                result.status(404).json({
                    status: "error",
                    message: "Group does not exists."
                });
                return;
            }

            await db.collection("users").findOneAndUpdate({
                $and: [{
                    _id: user._id
                }, {
                    "groups._id": group._id
                }]
            }, {
                $set: {
                    "groups.$.unreadMessages": 0
                }
            });

            result.json({
                status: "success",
                message: "Messages has been marked as read."
            });
        });

        app.use("/groups", router);
    }
};