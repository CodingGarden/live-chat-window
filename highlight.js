/* eslint-env browser */
(async () => {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {    
    if (node.hasAttribute('src')) {
      node.setAttribute('src', `https://external-content.duckduckgo.com/iu/?u=${node.getAttribute('src')}`);
    }
  });

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

  new Vue({
    el: '#app',
    data: {
      messages: [],
      focus: false,
      botId: '519135902',
      broadcasterId: '413856795',
    },
    async created() {
      if (localStorage.highlightedMessage) {
        setTimeout(() => {
          this.messages = [JSON.parse(localStorage.highlightedMessage)];
          setTimeout(() => {
            window.resizeTo(window.innerWidth, this.$refs.app.clientHeight + 10);
          }, 700);
        }, 100);
        setInterval(() => {
          this.messages.forEach(setTimesent);
        }, 1000);
      } else {
        window.close();
      }
      window.addEventListener('storage', () => {
        if (localStorage.highlightedMessage) {
          this.messages = [JSON.parse(localStorage.highlightedMessage)];
          setTimeout(() => {
            window.resizeTo(window.innerWidth, this.$refs.app.clientHeight + 10);
          }, 700);
        }
      });
    },
    methods: {
      clearHighlight() {
        this.messages = [];
        setTimeout(() => {
          window.close();
        }, 700);
      }
    }
  });
})();