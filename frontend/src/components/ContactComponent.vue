<template>
    <div class="row">
        <div class="col-md-12">
            <h1 class="text-center text-white">Contacts</h1>
        </div>
    </div>
    <div class="row">
        <div class="col-md-12">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="contact in contacts" v-bind:key="contact._id">
                        <td>
                            <span v-text="contact.name"></span>
                            <span v-if="(contact.unreadMessages > 0)" v-text="' (' + contact.unreadMessages + ')'" class="text-danger"></span>
                        </td>

                        <td v-text="contact.email"></td>
                        <td style="display: flex;">
                            <form v-on:submit.prevent="deleteContact">
                                <input type="hidden" name="email" v-bind:value="contact.email" required />
                                <input type="submit" v-bind:value="isDeleting ? 'Deleting...' : 'Delete'" v-bind:isDeleting="disabled" class="btn btn-danger" />
                            </form>
                            <router-link v-bind:to="'/chat/' + contact.email" class="btn btn-primary" style="margin-left: 10px;">Chat</router-link>
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
            //
        }
    },

    computed: {
        contacts() {
            return store.getters.getContacts
        }
    },

    methods: {

        deleteContact: async function () {
            const self = this
            const form = event.target
        
            swal.fire({
                title: 'Are you sure?',
                text: "This will be removed from your contact",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            }).then(async function(result) {
                if (result.isConfirmed) {
        
                    self.isDeleting = true;
                    const formData = new FormData(form);
        
                    const response = await axios.post(
                        self.$apiURL + "/contact/delete",
                        formData,
                        {
                            headers: self.$headers
                        }
                    );
                    self.isDeleting = false;
        
                    if (response.data.status == "success") {
                        swal.fire(
                            'Deleted!',
                            response.data.message,
                            'success'
                        );
        
                        const contactsArr = self.contacts;
                        for (let a = 0; a < contactsArr.length; a++) {
                            if (contactsArr[a].email == form.email.value) {
                                contactsArr.splice(a, 1);
                                break;
                            }
                        }
                        self.contacts = contactsArr;
                    } else {
                        swal.fire("Error", response.data.message, "error");
                    }
                }
            })
        },

        getData: async function () {
            // const self = this;
            const response = await axios.post(
                this.$apiURL + "/contact/fetch",
                null,
                {
                    headers: this.$headers
                }
            )
            console.log(response)

            if (response.data.status == "success") {
                store.commit("setContacts", response.data.contacts)
            } else {
                swal.fire("Error", response.data.message, "error");
            }
        }
    },
    mounted() {
        this.getData()
    }
}
</script>