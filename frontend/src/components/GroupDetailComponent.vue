
<template>
    <!-- check if group data has been fetched from the API -->
    <template v-if="group != null">

        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <!-- show group name -->
                    <h1 v-text="group.name" class="text-center"></h1>

                    <!-- show group picture if uploaded -->
                    <template v-if="typeof group.picture !== 'undefined'">
                        <p class="text-center"><img v-bind:src="$apiURL + '/' + group.picture.path"
                                style="height: 300px;" /></p>
                    </template>

                    <!-- button to show group members -->
                    <a class="btn btn-link" v-on:click.prevent="groupMembers">Group members</a>
                </div>
            </div>
        </div>
        <!-- Modal -->
        <div class="modal" id="group-members-modal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Group members</h5>

                        <!-- modal close button -->
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>

                    <div class="modal-body">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Invited by</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- loop through all members -->
                                <tr v-for="member in group.members" v-bind:key="member._id">
                                    <td v-text="member.user.name"></td>
                                    <td v-text="member.sentBy.name"></td>
                                    <td v-text="member.status"></td>
                                    <td style="display: flex;" v-if="user != null && group.createdBy._id == user._id">
                                        <form v-on:submit.prevent="removeMember">
                                            <input type="hidden" name="_id" v-bind:value="member._id" required />
                                            <input type="hidden" name="groupId" v-bind:value="group._id" required />
                                            <input type="submit" v-bind:value="isDeleting ? 'Deleting...' : 'Remove'"
                                                v-bind:isDeleting="disabled" class="btn btn-danger" />
                                        </form>
                                        <!-- form to change group admin -->
                                        <form v-on:submit.prevent="makeAdmin" style="margin-left: 10px;">
                                            <input type="hidden" name="_id" v-bind:value="member.user._id" required />
                                            <input type="hidden" name="groupId" v-bind:value="group._id" required />
                                            <input type="submit" value="Make Admin" v-bind:isMakingAdmin="disabled"
                                                class="btn btn-success" />
                                        </form>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>

        <div class="row clearfix" style="margin-top: 30px;">
            <div class="col-lg-12">
                <div class="card chat-app">
                    <div class="chat">
                        <div class="chat-header clearfix">
                            <div class="row">
                                <div class="col-lg-12 text-white">
                                    <span v-if="attachment != null"
                                        style="margin-right: 10px; position: relative; top: 7px;"
                                        v-text="attachment.name"></span>
                                    <a href="javascript:void(0);" class="btn btn-outline-secondary pull-right text-white"
                                        v-on:click="selectFile"><i class="fa fa-paperclip"></i></a>
                                    <input type="file" id="attachment" style="display: none;" v-on:change="fileSelected" />
                                </div>
                            </div>
                        </div>

                        <div class="chat-history">
                            <ul class="m-b-0">
                                <li style="text-align: center;">
                                    <i v-bind:class="btnLoadMoreClass + ' btnLoadMore'" v-on:click="loadMore"
                                        v-if="hasMoreMessages"></i>
                                </li>

                                <li v-for="msg in messages" class="clearfix" v-bind:key="msg._id">
                                    <div
                                        v-bind:class="'message-data ' + (user != null && user.email == msg.sender.email ? 'text-right' : '')">
                                        <span class="message-data-time text-white"
                                            v-text="getMessageTime(msg.createdAt)"></span>
                                        <img src="https://bootdey.com/img/Content/avatar/avatar7.png" alt="avatar"
                                            style="width: 50px;" />
                                    </div>

                                    <div
                                        v-bind:class="'message ' + (user != null && user.email == msg.sender.email ? 'my-message float-right' : 'other-message')">
                                        <p v-text="msg.message"
                                            v-bind:class="(user != null && user.email == msg.sender.email ? 'text-right' : '')"
                                            style="margin-bottom: 0px;"></p>

                                        <template v-if="msg.attachment != null">
                                            <a href="javascript:void(0)" v-bind:data-id="msg._id"
                                                v-on:click.prevent="downloadAttachment" v-text="msg.attachment.displayName"
                                                class="text-info" target="_blank"></a>
                                        </template>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div class="chat-message clearfix">
                            <div class="input-group mb-0">
                                <div class="input-group mb-3">
                                    <input type="text" class="form-control" placeholder="Enter text here..."
                                        v-model="message" />

                                    <button class="btn btn-primary" v-on:click="sendMessage" type="button">Send</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </template>
    <a v-bind:href="base64Str" ref="btnDownloadAttachment" v-bind:download="downloadFileName"></a>
</template>
<script>
import axios from "axios"
import jquery from "jquery"
import swal from "sweetalert2"
import store from "../vuex/store"
// import _ from 'lodash';

export default {
    data() {
        return {
            // get ID from URL
            _id: this.$route.params._id,
            page: 0,
            message: "",
            // group object
            group: null,

            // logged-in user object
            user: null,
            isDeleting: false,
            isMakingAdmin: false,
            
            btnLoadMoreClass: "fa fa-repeat",
            hasMoreMessages: true,
            base64Str: "",
            downloadFileName: "",
            attachment: null,
            
        }
    },

    methods: {
        loadMore: function () {
            this.btnLoadMoreClass = "fa fa-spinner fa-spin"
            this.page++
            this.getData()
        },

        downloadAttachment: async function () {
            const anchor = event.target
            const id = anchor.getAttribute("data-id")
            const originalHtml = anchor.innerHTML
            anchor.innerHTML = "Loading..."

            const formData = new FormData()
            formData.append("messageId", id)

            const response = await axios.post(
                this.$apiURL + "/groups/attachment",
                formData,
                {
                    headers: this.$headers
                }
            )

            if (response.data.status == "success") {
                this.base64Str = response.data.base64Str
                this.downloadFileName = response.data.fileName

                const btnDownloadAttachment = this.$refs["btnDownloadAttachment"]
                setTimeout(function () {
                    btnDownloadAttachment.click()
                    anchor.innerHTML = originalHtml
                }, 500)
            } else {
                swal.fire("Error", response.data.message, "error")
            }
        },

        // get group document from AJAX
        getData: async function () {
            const formData = new FormData()
            formData.append("_id", this._id)
            formData.append("page", this.page)

            const response = await axios.post(
                this.$apiURL + "/groups/detail",
                formData,
                {
                    headers: this.$headers
                }
            )
            if (response.data.status == "success") {
                this.group = response.data.group
                this.user = response.data.user 
                for (let a = 0; a < response.data.messages.length; a++) {
                    store.commit("prependGroupMessage", response.data.messages[a])
                }
                
                this.btnLoadMoreClass = "fa fa-repeat"   
                this.hasMoreMessages = (response.data.messages.length == 0) ? false : true
            } else {
                swal.fire("Error", response.data.message, "error")
            }
        },

        groupMembers: function () {
            jquery("#group-members-modal").modal("show")
        },
        // method to remove member
        removeMember: function () {
            const self = this

            // create form data object
            const form = event.target
            const _id = form._id.value
            const formData = new FormData(form)

            // ask for confirmation
            swal.fire({
                title: 'Remove member',
                text: "Are you sure you want to remove this member ?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes'
            }).then(async function (result) {
                if (result.isConfirmed) {

                    // call an AJAX
                    const response = await axios.post(
                        self.$apiURL + "/groups/removeMember",
                        formData,
                        {
                            headers: self.$headers
                        }
                    )

                    if (response.data.status == "success") {
                        // remove member from local object
                        for (let a = 0; a < self.group.members.length; a++) {
                            if (self.group.members[a]._id == _id) {
                                self.group.members.splice(a, 1)
                                break
                            }
                        }

                        swal.fire("Remove member", response.data.message, "success")
                    } else {
                        swal.fire("Error", response.data.message, "error")
                    }
                }
            })
        },

        makeAdmin: function () {
            const self = this

            // create form data object
            const form = event.target
            const _id = form._id.value
            const formData = new FormData(form)

            // ask for confirmation
            swal.fire({
                title: 'Make admin',
                text: "Are you sure you want to make this member an admin ? You will lose your privileges as an admin.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes'
            }).then(async function (result) {
                if (result.isConfirmed) {

                    // call an AJAX
                    const response = await axios.post(
                        self.$apiURL + "/groups/makeAdmin",
                        formData,
                        {
                            headers: self.$headers
                        }
                    )

                    if (response.data.status == "success") {
                        // update local object
                        self.group = response.data.group

                        swal.fire("Make admin", response.data.message, "success")
                    } else {
                        swal.fire("Error", response.data.message, "error")
                    }
                }
            })
        },

        sendMessage: async function () {
            const formData = new FormData()
            formData.append("_id", this._id)
            formData.append("message", this.message)
            if (this.attachment != null) {
                formData.append("attachment", this.attachment)
            }
            const response = await axios.post(
                this.$apiURL + "/groups/sendMessage",
                formData,
                {
                    headers: this.$headers
                }
            )
            if (response.data.status == "success") {
                this.message = ""
                this.attachment = null
                document.getElementById("attachment").value = null
                store.commit("appendGroupMessage", response.data.messageObject)
            } else {
                swal.fire("Error", response.data.message, "error")
            }
        },
        fileSelected: function () {
            const files = event.target.files
            if (files.length > 0) {
                this.attachment = files[0]
            }
        },
        selectFile: function () {
            document.getElementById("attachment").click()
        },
        markAsRead: async function () {
            const formData = new FormData()
            formData.append("_id", this._id)

            const response = await axios.post(
                this.$apiURL + "/groups/markAsRead",
                formData,
                {
                    headers: this.$headers
                }
            )
            console.log(response)
        },

        getMessageTime: function (time) {
            const dateObj = new Date(time)
            let timeStr = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate() + " " + dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds()
            return timeStr
        },
    },

    // get data when component is loaded
    mounted: function () {
        this.getData()
        this.markAsRead()
    },

    computed: {
        messages() {
            return store.getters.getGroupMessages
        }
    },

    watch: {
        $route: function (to, from) {
            if (from.href.includes("/groups/detail/" + this._id)) {
                store.commit("setGroupMessages", [])
            }
        }
    },
}
</script>