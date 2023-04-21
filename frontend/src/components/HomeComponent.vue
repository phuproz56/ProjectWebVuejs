<template>
    <div class="container homepageTitle">
        <h2>Welcome to V-chat</h2>
        <div>
            <button class="startButton"><router-link class="nav-link active" to="/contact">Chat START</router-link></button>
        </div>
    </div>
</template>
 
<script>

    import ContactComponent from "./ContactComponent"
     
    export default {
        components: {
            ContactComponent
        }
    }
</script>