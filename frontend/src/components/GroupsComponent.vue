<template>
    <div class="container">
        <div class="row">
            <div class="offset-md-10 col-md-2">
                <router-link class="btn btn-primary" to="/groups/add">Add group</router-link>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-md-12">
            <table class="table table-hover">
            
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Created by</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="group in groups" v-bind:key="group._id">
                        <td>
                         
                            <router-link v-text="group.name" v-bind:to="'/groups/detail/' + group._id"></router-link>
                            <span v-if="unreadMessages(group) > 0" v-text="' (' + unreadMessages(group) + ')'"
                                class="text-danger"></span>
                        </td>

                       
                        <td v-text="group.createdBy.name"></td>

                        <td style="display: flex;">

                            <template v-if="user != null && group.createdBy._id == user._id">
                                
                            </template>
                            <template v-else-if="getMemberStatus(user, group) == 'pending'">
                                <form v-on:submit.prevent="acceptInvite">
                                    <input type="hidden" name="_id" v-bind:value="group._id" required />
                                    <input type="submit" v-bind:value="isLoading ? 'Accepting...' : 'Join'"
                                        v-bind:isLoading="disabled" class="btn btn-success" />
                                </form>
                            </template>

                            <template v-else-if="getMemberStatus(user, group) == 'accepted'">
                                <form v-on:submit.prevent="leaveGroup">
                                    <input type="hidden" name="_id" v-bind:value="group._id" required />
                                    <input type="submit" v-bind:value="isLoading ? 'Leaving...' : 'Leave group'"
                                        v-bind:isLoading="disabled" class="btn btn-danger" />
                                </form>
                            </template>
                            <a v-bind:data-id="group._id" v-on:click.prevent="inviteMember" class="btn btn-success"
                                style="margin-left: 10px;">Invite member</a>

                        </td>

                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>


<script>
import axios from "axios"
import swal from "sweetalert2"
import store from "../vuex/store"

export default {
    data() {
        return {
            isDeleting: false,
            user: null,
            isLoading: false,

        }
    },

    computed: {
        groups() {
            return store.getters.getGroups
        }
    },
    methods: {
        getData: async function (request, result) {
            const response = await axios.post(
                this.$apiURL + "/groups/fetch",
                null,
                {
                    headers: this.$headers
                }
            )
            if (response.data.status == "success") {
                this.user = response.data.user
                store.commit("setGroups", response.data.groups)
            } else {
                swal.fire("Error", response.data.message, "error");
            }
        },
        inviteMember: function () {
            const self = this
            const _id = event.target.getAttribute("data-id")
            swal.fire({
                title: 'Enter user email',
                input: 'text',
                inputAttributes: {
                    autocapitalize: 'off'
                },
                showCancelButton: true,
                confirmButtonText: 'Invite User',
                showLoaderOnConfirm: true,
                preConfirm: async function (email) {
                    const formData = new FormData()
                    formData.append("_id", _id)
                    formData.append("email", email)
                    return fetch(self.$apiURL + "/groups/inviteMember", {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem(self.$accessTokenKey)
                        }
                    })
                        .then(function (response) {
                            if (!response.ok) {
                                throw new Error(response.statusText)
                            }

                            // check if there isn't any error from server
                            return response.json().then(function (value) {
                                if (value.status == "error") {
                                    throw new Error(value.message)
                                }
                                return value
                            })
                        })
                        .catch(function (error) {
                            swal.showValidationMessage(`Request failed: ${error}`)
                        })
                },
                allowOutsideClick: function () {
                    !swal.isLoading()
                }
            }).then(function (result) {
                if (result.isConfirmed) {
                    swal.fire("Invite member", result.value.message, "success")
                }
            })
        },
        getMemberStatus: function (user, group) {
            for (let a = 0; a < group.members.length; a++) {
                if (user != null && group.members[a].user._id == user._id) {
                    return group.members[a].status
                }
            }
            return ""
        },
        acceptInvite: function () {
            const self = this
            const form = event.target
            const _id = form._id.value
            const formData = new FormData(form)
            swal.fire({
                title: 'Join group',
                text: "Are you sure you want to join this group ?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes'
            }).then(async function (result) {
                if (result.isConfirmed) {
                    const response = await axios.post(
                        self.$apiURL + "/groups/acceptInvite",
                        formData,
                        {
                            headers: self.$headers
                        }
                    )
                    if (response.data.status == "success") {
                        const user = response.data.user
                        const groups = store.getters.getGroups
                        for (let a = 0; a < groups.length; a++) {
                            if (groups[a]._id == _id) {
                                for (let b = 0; b < groups[a].members.length; b++) {
                                    if (groups[a].members[b].user._id == user._id) {
                                        groups[a].members[b].status = "accepted"
                                        break
                                    }
                                }
                                break
                            }
                        }
                        store.commit("setGroups", groups)

                        swal.fire("Group Invitation", response.data.message, "success")
                    } else {
                        swal.fire("Error", response.data.message, "error")
                    }

                }
            })
        },

        leaveGroup: function () {
            const self = this
            const form = event.target
            const _id = form._id.value
            const formData = new FormData(form)
            swal.fire({
                title: 'Leave group',
                text: "Are you sure you want to leave this group ?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes'
            }).then(async function (result) {
                if (result.isConfirmed) {
                    const response = await axios.post(
                        self.$apiURL + "/groups/leaveGroup",
                        formData,
                        {
                            headers: self.$headers
                        }
                    )
                    if (response.data.status == "success") {
                        // remove the group from local array
                        const groups = store.getters.getGroups
                        for (let a = 0; a < groups.length; a++) {
                            if (groups[a]._id == _id) {
                                groups.splice(a, 1)
                                break
                            }
                        }
                        store.commit("setGroups", groups)

                        swal.fire("Leave group", response.data.message, "success")
                    } else {
                        swal.fire("Error", response.data.message, "error")
                    }

                }
            })
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
        unreadMessages: function (group) {
            if (this.user == null) {
                return 0
            }
            for (let a = 0; a < this.user.groups.length; a++) {
                if (this.user.groups[a]._id.toString() == group._id.toString()) {
                    return this.user.groups[a].unreadMessages
                }
            }
            return 0
        },
    },
    mounted: function () {
        this.getData()
    },
}
</script>