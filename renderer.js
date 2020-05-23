/* eslint-env browser */
(async () => {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {    
    if (node.hasAttribute('src')) {
      node.setAttribute('src', `https://external-content.duckduckgo.com/iu/?u=${node.getAttribute('src')}`);
    }
  });

  const API_URL = 'http://localhost:5000';
  const id = await fetch(`${API_URL}/streams`)
    .then(res => res.json())
    .then((events) => {
      if (events.length) {
        const event = events[0];
        return event.snippet.liveChatId;
      }
      return new Date().toLocaleDateString();
    });

  console.log(id);

  function sanitize(message) {
    message.sanitized = DOMPurify
      .sanitize(marked(message.message), {
        FORBID_ATTR: [
          'style',
          'onerror',
          'onload',
          'class',
        ],
        FORBID_TAGS: [
          'table',
          'script',
          'audio',
          'video',
          'style',
          'iframe',
          'object',
          'embed',
          'textarea',
          'frame',
          'frameset'
        ],
      });
  }

  function setTimesent(message) {
    message.timesent = timeago.format(message.publishedAt);
  }

  const rewardColors = {
    '19c49b5f-bf65-4b3f-b0e0-68d2666f0db8': '#454ADEEE',
    '87b6d20b-8c36-4bd1-8d4f-e005e29e1b9a': '#C52233EE',
    'a34d5787-9270-4e93-9cc2-2594a22aa81f': '#191923EE'
  };

  function processMessage(message) {
    setTimesent(message);
    sanitize(message);
    if (message.reward) {
      message.bgColor = rewardColors[message.rewardId] || '#496A81EE';
    }
    message.showSource = false;
    message.isPotentiallyNaughty = message.message.match(/<|>/i);
  }

  const messageIds = new Set();
  new Vue({
    el: '#app',
    data: {
      showSearch: false,
      messages: [],
      authors: {},
      focus: false,
      botId: '519135902',
      broadcasterId: '413856795',
      filter: '',
      teams: {
        vanilla: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/JavaScript-logo.png/240px-JavaScript-logo.png',
        vue: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Vue.js_Logo_2.svg/277px-Vue.js_Logo_2.svg.png',
        react: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/320px-React-icon.svg.png',
        svelte: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Svelte_Logo.svg/199px-Svelte_Logo.svg.png',
        angular: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Angular_full_color_logo.svg/240px-Angular_full_color_logo.svg.png'
      }
    },
    async created() {
      this.loadMessages();
      this.listen();
      window.addEventListener('keydown', (event) => {
        if (event.code === 'KeyF' && event.metaKey) {
          this.showSearch = !this.showSearch;
          setTimeout(() => {
            this.$refs.input.focus();
          }, 200);
        }
      });
    },
    computed: {
      filteredMessages() {
        if (!this.filter) return this.messages;
        const filterMatch = new RegExp(this.filter, 'gi');
        return this.messages.filter((message) => (
          message.message.match(filterMatch)
            || message.author.displayName.match(filterMatch)
        ));
      }
    },
    methods: {
      highlightMessage(message) {
        localStorage.highlightedMessage = JSON.stringify(message);
        window.highlightMessage();
      },
      listen() {
        const socket = io(API_URL);
        socket.on(`messages/${id}`, this.addLatestMessages);
        socket.on(`authors/${id}`, this.addLatestAuthors);
        socket.on(`message-deleted/${id}`, (messageId) => {
          this.removeMessage({ id: messageId });
        });
      },
      removeMessage(message) {
        localStorage.setItem(`delete-${message.id}`, true);
        this.messages = this.messages.filter(m => !localStorage[`delete-${m.id}`]);
      },
      async loadMessages() {
        const [messages, authors] = await Promise.all([
          fetch(`${API_URL}/messages?id=${id}`).then(res => res.json()),
          fetch(`${API_URL}/authors?id=${id}`).then(res => res.json()),
        ]);
        this.messages = messages.reduceRight((all, message) => {
            if (message.author.channelId === this.botId && message.message.includes('Focus mode ended')) {
              this.focus = false;
            }
            if (!messageIds.has(message.id) && !message.message.match(/^!\w/)) {
              all.push(message);
              processMessage(message);
              messageIds.add(message.id);
            } else if (message.author.channelId === this.broadcasterId && message.message.startsWith('!focus')) {
              const command = message.message;
              if (command.startsWith('!focus-start') || command.startsWith('!focus-resume')) {
                this.focus = true;
              } else if (command.startsWith('!focus-pause') || command.startsWith('!focus-end')) {
                this.focus = false;
              }
            }
            return all;
          }, [])
          .filter(m => !localStorage[`delete-${m.id}`])
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          .slice(0, 500);
        this.authors = authors;

        setInterval(() => {
          this.messages.forEach(setTimesent);
        }, 1000);
      },
      addLatestMessages(data) {
        const newMessages = data.reduce((all, message) => {
          if (message.author.channelId === this.botId && message.message.includes('Focus mode ended')) {
            this.focus = false;
          }
          if (!messageIds.has(message.id) && !message.message.match(/^!\w/)) {
            all.push(message);
            processMessage(message);
            messageIds.add(message.id);
          } else if (message.author.channelId === this.broadcasterId && message.message.startsWith('!focus')) {
            const command = message.message;
            if (command.startsWith('!focus-start') || command.startsWith('!focus-resume')) {
              this.focus = true;
            } else if (command.startsWith('!focus-pause') || command.startsWith('!focus-end')) {
              this.focus = false;
            }
          }
          return all;
        }, []);
        this.messages = [...newMessages, ...this.messages]
          .filter(m => !localStorage[`delete-${m.id}`])
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          .slice(0, 500);
      },
      addLatestAuthors(data) {
        data.forEach((author) => {
          this.$set(this.authors, author.channelId, author);
        });
      }
    }
  });
})();