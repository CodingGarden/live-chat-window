const Vue = require('vue/dist/vue');
const io = require('socket.io-client');
const timeago = require('timeago.js');
const marked = require('marked');
const createDOMPurify = require('dompurify');
const electron = require('electron');

window.DOMPurify = createDOMPurify(window);
window.marked = marked;
window.Vue = Vue;
window.io = io;
window.timeago = timeago;
window.highlightMessage = (message) => {
  electron.ipcRenderer.send('highlightMessage');
};