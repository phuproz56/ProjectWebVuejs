import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'

import RegisterComponent from "./components/RegisterComponent.vue"
import LoginComponent from "./components/LoginComponent.vue"
import HomeComponent from "./components/HomeComponent.vue"
import AddContactComponent from "./components/AddContactComponent.vue"
import ChatComponent from "./components/ChatComponent.vue"
import ContactPageComponent from "./components/ContactPageComponent.vue"
import GroupsComponent from "./components/GroupsComponent.vue"
import AddGroupComponent from "./components/AddGroupComponent.vue"
import NotificationsComponent from "./components/NotificationsComponent.vue"
import GroupDetailComponent from "./components/GroupDetailComponent.vue"

window.$ = window.jQuery = require("jquery")

const routes = [
    { path: '/', component: HomeComponent },
    { path: "/register", component: RegisterComponent },
    { path: '/login', component: LoginComponent },
    { path: "/contacts/add", component: AddContactComponent },
    { path: "/chat/:email", component: ChatComponent },
    { path: "/contact", component: ContactPageComponent },
    { path: "/groups", component: GroupsComponent },
    { path: "/groups/add", component: AddGroupComponent },
    { path: "/notifications", component: NotificationsComponent },
    { path: "/groups/detail/:_id", component: GroupDetailComponent },

];

const router = createRouter({
    history: createWebHistory(),
    routes: routes, 
})

const app = createApp(App)
app.use(router)

app.config.globalProperties.$mainURL = "http://localhost:8080"
app.config.globalProperties.$apiURL = "http://localhost:3000"
app.config.globalProperties.$accessTokenKey = "accessTokenKey"

app.config.globalProperties.$user = null;
app.config.globalProperties.$login = false;
app.config.globalProperties.$headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem("accessTokenKey")
};

app.mount('#app')