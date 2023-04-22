<template>
    <div class="container background" style="margin-top: 50px;">
        <div class="row">
            <div class="offset-md-3 col-md-6">
                <form method="POST" v-on:submit.prevent="doRegister">
                    <div class="form-group">
                        <label class="text-white">Enter name</label>
                        <input type="text" class="form-control" name="name" required />
                    </div>
                    <br />
                    <div class="form-group">
                        <label class="text-white">Enter email</label>
                        <input type="email" class="form-control" name="email" required />
                    </div>

                    <br />

                    <div class="form-group">
                        <label class="text-white">Enter password</label>
                        <input type="password" class="form-control" name="password" required />
                    </div>

                    <br />

                    <input type="submit" v-bind:value="isLoading ? 'Loading...' : 'Register'"
                        v-bind:disabled="isLoading" name="submit" class="btn btn-primary" />

                </form>
                <br />
                <div class="register-button">
                    Already have an account?&nbsp;<a>
                        <router-link class="register-link" to="/login">Login</router-link>
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import axios from "axios"
import swal from "sweetalert2"

export default {
    data() {
        return {
            "isLoading": false
        }
    },
    methods: {
        doRegister: async function () {
            const form = event.target;
            const formData = new FormData(form);

            this.isLoading = true;

            const response = await axios.post(
                this.$apiURL + "/registration",
                formData
            );
            this.isLoading = false;
            swal.fire("Registration", response.data.message, response.data.status)

            if (response.data.status == "success") {
                form.reset();
            }
        }
    }
}
</script>