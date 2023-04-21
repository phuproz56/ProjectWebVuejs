import {
    createStore
} from "vuex"

export default createStore({
    state() {
        return {
            messages: [],
            contacts: [],
            groups: [],
            unreadNotifications: 0,
            notifications: [],
            groupMessages: [],
        }
    },

    mutations: {
        
        setGroups(state, newGroups) {
            state.groups = newGroups
        },
        appendMessage(state, newMessage) {
            state.messages.push(newMessage)
        },

        prependMessage(state, newMessage) {
            state.messages.unshift(newMessage)
        },

        setMessages(state, newMessages) {
            state.messages = newMessages
        },
        setContacts(state, newContacts) {
            state.contacts = newContacts
        },
        setUnreadNotifications(state, unreadNotifications) {
            state.unreadNotifications = unreadNotifications
        },
        setNotifications(state, notifications) {
            state.notifications = notifications
        },
        prependGroupMessage(state, newMessage) {
            state.groupMessages.unshift(newMessage)
        },

        setGroupMessages(state, newMessages) {
            state.groupMessages = newMessages
        },
        appendGroupMessage (state, newMessage) {
            state.groupMessages.push(newMessage)
        },

    },

    getters: {
        getGroupMessages (state) {
            return state.groupMessages
        },
        getGroups(state) {
            return state.groups
        },
        getMessages(state) {
            return state.messages
        },
        getContacts(state) {
            return state.contacts
        },
        getNotifications(state) {
            return state.notifications
        },

    }
})