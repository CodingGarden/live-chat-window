/* eslint-env browser */
(async () => {
	DOMPurify.addHook('afterSanitizeAttributes', node => {
		console.log('after sanitize...', node.getAttribute('src'));

		if (node.hasAttribute('src')) {
			node.setAttribute(
				'src',
				`https://yacdn.org/serve/${node.getAttribute('src')}`
			);
		}
	});

	const API_URL = 'http://localhost:5000';
	const id = await fetch(`${API_URL}/streams`)
		.then(res => res.json())
		.then(events => {
			if (events.length) {
				const event = events[0];
				return event.snippet.liveChatId;
			}
			return new Date().toLocaleDateString();
		});

	console.log(id);

	function sanitize(message) {
		message.sanitized = DOMPurify.sanitize(marked(message.message), {
			FORBID_ATTR: ['style', 'onerror', 'onload'],
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
			]
		});
	}

	function setTimesent(message) {
		message.timesent = timeago.format(message.publishedAt);
	}

	function processMessage(message) {
		setTimesent(message);
		sanitize(message);
		message.showSource = false;
		message.isPotentiallyNaughty = message.message.match(/<|>/i);
	}

	new Vue({
		el: '#messages',
		data: {
			messages: [],
			authors: {}
		},
		async created() {
			this.loadMessages();
			this.listen();
		},
		methods: {
			handleClick(e) {
				const { tagName: tag, href } = e.target;
				if (tag === 'A') {
					e.preventDefault();
					clipboard.writeText(href);
				}
			},
			listen() {
				const socket = io(API_URL);
				socket.on(`messages/${id}`, this.addLatestMessages);
				socket.on(`authors/${id}`, this.addLatestAuthors);
			},
			removeMessage(message) {
				localStorage.setItem(`delete-${message.id}`, true);
				this.messages = this.messages.filter(
					m => !localStorage[`delete-${m.id}`]
				);
			},
			async loadMessages() {
				const [messages, authors] = await Promise.all([
					fetch(`${API_URL}/messages?id=${id}`).then(res => res.json()),
					fetch(`${API_URL}/authors?id=${id}`).then(res => res.json())
				]);
				console.log(messages, authors);
				const messageIds = new Set();
				this.messages = messages
					.reduceRight((all, message) => {
						if (
							!messageIds.has(message.id) &&
							!message.message.startsWith('!')
						) {
							all.push(message);
							processMessage(message);
							messageIds.add(message.id);
						}
						return all;
					}, [])
					.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
					.filter(m => !localStorage[`delete-${m.id}`])
					.slice(0, 100);
				this.authors = authors;

				setInterval(() => {
					this.messages.forEach(setTimesent);
				}, 1000);
			},
			addLatestMessages(data) {
				const newMessages = data.reduce((all, message) => {
					if (!message.message.match(/^!\w/)) {
						processMessage(message);
						all.push(message);
					}
					return all;
				}, []);
				this.messages = [...newMessages, ...this.messages].filter(
					m => !localStorage[`delete-${m.id}`]
				);
			},
			addLatestAuthors(data) {
				data.forEach(author => {
					this.$set(this.authors, author.channelId, author);
				});
			}
		}
	});
})();
