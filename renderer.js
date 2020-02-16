const API_URL = 'http://localhost:5000';
// TODO: get id dynamically
const id = 'Cg0KCzJQcVF2bnFzcWNnKicKGFVDTE5ndV9PdXB3b2VFU2d0YWIzM0NDdxILMlBxUXZucXNxY2c';

const commands = [
  "!drop",
  "!c4"
];
const commandsRegex = new RegExp("^("+commands.join('|')+")"); 

function sanitize(message) {
  message.sanitized = marked(
    DOMPurify.sanitize(message.message, {
      FORBID_ATTR: [
        'style',
        'onerror',
        'onload',
      ],
      FORBID_TAGS: [
        'table',
        'script',
        'audio',
        'video',
        'style',
        'iframe',
        'textarea',
        'frame',
        'frameset'
      ],
    }),
  );
}

function hideCommands(message) {
  return commandsRegex.test(message);
}

function setTimesent(message) {
  message.timesent = timeago.format(message.publishedAt);
}

function processMessage(message) {
  setTimesent(message);
  sanitize(message);
  message.showSource = false;
  message.isPotentiallyNaughty = message.message.match(/(<([^>]+)>)/i);
}

new Vue({
  el: '#messages',
  data: {
    messages: [],
    authors: {},
  },
  async created() {
    this.loadMessages();
    this.listen();
  },
  methods: {
    listen() {
      const socket = io(API_URL);
      socket.on(`messages/${id}`, this.addLatestMessages);
      socket.on(`authors/${id}`, this.addLatestAuthors);
    },
    async loadMessages() {
      const [messages, authors] = await Promise.all([
        fetch(`${API_URL}/messages?id=${id}`).then(res => res.json()),
        fetch(`${API_URL}/authors?id=${id}`).then(res => res.json()),
      ]);
      console.log(messages, authors);
      const messageIds = new Set();
      this.messages = messages.reduceRight((all, message) => {
        if (!messageIds.has(message.id) && !hideCommands(message.message)) {
          all.push(message);
          processMessage(message);
          messageIds.add(message.id);
        }
        return all;
      }, []).slice(0, 100);
      this.authors = authors;

      setInterval(() => {
        this.messages.forEach(setTimesent);
      }, 1000);
    },
    addLatestMessages(data) {
      const newMessages = data.reduce((all, message) => {
        if (!hideCommands(message.message)) {
          processMessage(message);
          all.push(message);
        }
        return all;
      }, []);
      this.messages = [...newMessages, ...this.messages];
    },
    addLatestAuthors(data) {
      data.forEach((author) => {
        this.$set(this.authors, author.channelId, author);
      });
    }
  }
});
