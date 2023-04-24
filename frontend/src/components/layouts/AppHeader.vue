<template>
    <nav class="navbar navbar-expand-lg navbar-dark bg-info" style="margin-bottom: 50px;">
        <div class="container-fluid">
            <router-link class="navbar-brand" to="/">
                S-CHAT
            </router-link>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarColor01"
                aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarColor01">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <router-link class="nav-link active" to="/">
                            Home
                            <span class="visually-hidden">(current)</span>
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link active" to="/contact">
                            Contact
                            <span class="visually-hidden">(current)</span>
                        </router-link>
                    </li>

                    <li class="nav-item" v-if="login">
                        <router-link class="nav-link" to="/groups">Groups</router-link>
                    </li>

                    <li class="nav-item" v-if="!login">
                        <router-link class="nav-link" to="/login">Login/Register</router-link>
                    </li>
                    <li class="nav-item dropdown" v-if="login">
                        <a v-text="$user.name" class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button"
                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></a>
                        <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <li class="nav-item">
                        <router-link class="dropdown-item" to="/register">Register a new account</router-link>
                    </li>
                    <a class="dropdown-item" v-on:click="doLogout" href="javascript:void(0);">Logout</a>
            </div>
            </li>
            <li class="nav-item" v-if="login">
                <router-link class="nav-link" to="/notifications">
                    <i class="fa fa-bell"></i>
                    <span class="badge" v-if="unreadNotifications > 0" v-text="unreadNotifications"></span>
                </router-link>
            </li>
            </ul>

            <form class="d-flex" v-on:submit.prevent="doSearch">
                <input class="form-control me-sm-2" type="text" v-model="query" placeholder="search contact"
                    v-on:keyup.enter="stop">
                <button class="btn btn-secondary my-2 my-sm-0" type="submit">Search</button>
            </form>
        </div>
        </div>
    </nav>
</template>
<script>
import axios from "axios"
import swal from "sweetalert2"
import { io } from 'socket.io-client'
import store from "../../vuex/store"

export default {
    data() {
        return {
            login: false,
            user: null,

            query: "",
        }
    },
    mounted: function () {
        this.getUser();
        global.socketIO = io(this.$apiURL)
    },
    computed: {
        unreadNotifications() {

            return store.getters.getUnreadNotifications
        }
    },
    methods: {
        doSearch: async function () {
            const formData = new FormData()
            formData.append("query", this.query)
            const response = await axios.post(
                this.$apiURL + "/search",
                formData,
                {
                    headers: this.$headers
                }
            )
            if (response.data.status == "success") {
                store.commit("setContacts", response.data.contacts)

            } else {
                swal.fire("Error", response.data.message, "error")
            }
        },
        doLogout: async function () {
            const response = await axios.post(
                this.$apiURL + "/logout",
                null,
                {
                    headers: this.$headers
                }
            );

            if (response.data.status == "success") {
                localStorage.removeItem(this.$accessTokenKey)
                window.location.href = "/login"
            } else {
                swal.fire("Error", response.data.message, "error");
            }
        },
        getUser: async function () {
            const self = this
            if (localStorage.getItem(this.$accessTokenKey)) {
                const response = await axios.post(
                    this.$apiURL + "/getUser",
                    null,
                    {
                        headers: this.$headers
                    }
                )
                if (response.data.status == "success") {
                    store.commit("setUnreadNotifications", response.data.unreadNotifications)
                    store.commit("setNotifications", response.data.user.notifications)
                    // user is logged in
                    this.$user = response.data.user
                    // console.log(this.$user)

                    socketIO.emit("connected", this.$user.email)

                    socketIO.on("sendMessage", async function (data) {

                        if (self.$route.path == "/chat/" + data.data.sender.email) {
                            store.commit("appendMessage", data.data)
                        }
                        if (self.$route.path == "/groups/detail/" + data.data.receiver._id.toString()) {
                            store.commit("appendGroupMessage", data.data)
                        }
                        let tempContacts = self.$user.contacts
                        for (let a = 0; a < tempContacts.length; a++) {
                            if (tempContacts[a]._id == data.data.sender._id) {
                                tempContacts[a].unreadMessages++
                            }
                        }
                        store.commit("setContacts", tempContacts)
                        const Toast = swal.mixin({
                            toast: true,
                            position: 'bottom-right',
                            customClass: {
                                popup: 'colored-toast'
                            },
                            showConfirmButton: false,
                            timer: 10000,
                            timerProgressBar: true
                        })
                        await Toast.fire({
                            title: data.title
                        })
                    })
                } else {
                    // user is logged out
                    localStorage.removeItem(this.$accessTokenKey);
                }

                this.login = (localStorage.getItem(this.$accessTokenKey) != null);
            } else {
                this.login = false;
            }
            global.user = this.user
        },
    },
}
</script>