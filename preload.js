const Vue = require('vue/dist/vue');
const io = require('socket.io-client');
const timeago = require('timeago.js');
const marked = require('marked');
const createDOMPurify = require('dompurify');
const { clipboard } = require('electron');

let markdownRenderer = marked.Renderer();
markdownRenderer.link = (href, title, text) => {
  let link = marked.Renderer.prototype.link.call(this, href, title, text);
  link.addEventListener('click', e => {
    e.preventDefault();

    clipboard.writeText(href);
  });
  return link;
};

marked.setOptions({
  renderer: markdownRenderer,
  gfm: true
});

window.DOMPurify = createDOMPurify(window);
window.marked = marked;
window.Vue = Vue;
window.io = io;
window.timeago = timeago;
