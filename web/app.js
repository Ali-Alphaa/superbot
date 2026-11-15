// Prototype UI with mock data. No backend yet.

const SHAPES = {
  round: "M24 5c11.5 0 19 7.5 19 18.5S35 43 23.5 43 5 35.5 5 24.5 12.5 5 24 5z",
  wide: "M4 23c0-8.5 9-13.5 20-13.5S44 14.5 44 23s-9 15-20 15S4 31.5 4 23z",
  star: "M24 3c2.6 9.4 6.6 14.2 21 21-14.4 6.8-18.4 11.6-21 21-2.6-9.4-6.6-14.2-21-21C17.4 17.2 21.4 12.4 24 3z",
  cloud: "M13 14c2-5 7-8 12-7 4 .7 6 3 7 5 6-.5 11 3 11 9 0 7-5 11-12 11-2 4-7 6-12 5-6-1-9-5-9-9-4-1-6-4-5-8 1-4 4-6 8-6z",
};

function avatar(color, shape = "round", size = 48) {
  return `<svg class="avatar" viewBox="0 0 48 48" width="${size}" height="${size}" style="stroke:none;width:${size}px;height:${size}px">
    <path d="${SHAPES[shape]}" fill="${color}"/>
    <rect x="25" y="16" width="3.2" height="7" rx="1.6" fill="#141414" transform="rotate(-18 26.6 19.5)"/>
    <rect x="32" y="15" width="3.2" height="7" rx="1.6" fill="#141414" transform="rotate(-18 33.6 18.5)"/>
  </svg>`;
}

const bots = [
  { id: "calorie", name: "Calorie Tracker", color: "#4cc06a", shape: "wide", unread: true,
    messages: [
      { from: "bot", time: "Today 8:02 AM", html: "<p>Morning! Log breakfast whenever you're ready.</p>" },
      { from: "user", html: "2 eggs, toast, coffee with milk" },
      { from: "bot", html: "<p>You're at 1,880 kcal and 78.3g protein, so ~60g protein left for today.</p>" },
    ] },
  { id: "tech", name: "Technical Explainer", color: "#3b7ff0", shape: "star",
    messages: [
      { from: "bot", time: "Today 5:17 PM", html: "<p>Hey David! I'm here to break down technical stuff into plain English, from code and architecture to new AI tools and whatever else shows up on your radar.</p>" },
      { from: "bot", question: { title: "What do you mostly want explained?", options: [
        "Code and repos I'm working with",
        "New AI tools, models, and papers",
        "CS and engineering fundamentals",
        "A mix, whatever I throw at you",
      ] } },
      { from: "user", html: "tell me about your VM, what are all the specs" },
      { from: "bot", html: "<p>Checking my computer's specs now.</p>" },
      { from: "bot", html: `<p>It's a modest cloud Linux box, more like a solid dev machine than a powerhouse:</p>
        <ul>
          <li><strong>OS:</strong> Debian 13 (trixie), Linux kernel 6.12, x86_64</li>
          <li><strong>CPU:</strong> 8 cores of an Intel Xeon (1 thread per core, so 8 threads total), with AVX2 and AVX-512 support</li>
          <li><strong>RAM:</strong> 15 GB with no swap. About 13 GB of that is in use right now and only around 2 GB is free.</li>
          <li><strong>Disk:</strong> 128 GB, with 8 GB used and 120 GB free</li>
          <li><strong>GPU:</strong> none</li>
        </ul>
        <p>The core idea: one shared machine, but every Bot gets its own screen on it.</p>` },
    ] },
  { id: "time", name: "Time Auditor", color: "#f0a243", shape: "round",
    messages: [{ from: "bot", time: "Yesterday 9:00 PM", html: "<p>Yesterday, Saturday 14.11.2026: David's time went 4h to deep work, 2h to calls, 1.5h to email.</p>" }] },
  { id: "todoist", name: "David Todoist", color: "#ef4b4b", shape: "round",
    messages: [{ from: "bot", time: "Today 7:30 AM", html: "<p>Done, the Morning Todoist reminders routine now runs daily at 7:30.</p>" }] },
  { id: "github", name: "GitHub Viewer", color: "#f2f2f2", shape: "round",
    messages: [{ from: "bot", time: "Today 3:41 PM", html: "<p>No — that 1–8 list is not the final build order. Steps 3 and 5 depend on the adapter work.</p>" }] },
  { id: "yt", name: "YouTube Titles", color: "#f2f2f2", shape: "cloud",
    messages: [{ from: "bot", time: "Today 1:12 PM", html: "<p>Step 1 only — lock deletes. Don't connect the channel until you approve.</p>" }] },
  { id: "discord", name: "New Discord Manager", color: "#8b5cf6", shape: "wide",
    messages: [{ from: "bot", time: "Today 11:05 AM", html: "<p>How should I get access to david-internal/... ? A bot token or an invite?</p>" }] },
];

const primary = { name: "Grok Bot", color: "#f5f5f5", shape: "round" };
let activeId = "tech";
let filter = "";

const $ = (id) => document.getElementById(id);
const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function preview(bot) {
  const last = [...bot.messages].reverse().find((m) => m.html);
  return last ? strip(last.html) : "";
}

function renderSidebar() {
  $("primary-bot").innerHTML = `<div class="avatar-wrap">${avatar(primary.color, primary.shape, 82)}
    <span class="badge"><svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z"/></svg></span></div>
    <span>${primary.name}</span>`;

  const q = filter.toLowerCase();
  $("bot-list").innerHTML = bots
    .filter((b) => !q || b.name.toLowerCase().includes(q) || preview(b).toLowerCase().includes(q))
    .map((b) => `<button class="bot-row ${b.id === activeId ? "active" : ""}" data-id="${b.id}">
      ${avatar(b.color, b.shape, 52)}
      <div class="meta"><div class="name">${b.name}</div><div class="preview">${esc(preview(b))}</div></div>
      ${b.unread ? '<span class="unread"></span>' : ""}
    </button>`).join("");
}

const ACTIONS = `<div class="actions">
  <button title="React"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5c1 1.3 2.1 2 3.5 2s2.5-.7 3.5-2"/><path d="M9.5 10v.5M14.5 10v.5"/></svg></button>
  <button title="Reply"><svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6"/></svg></button>
  <button title="More"><svg viewBox="0 0 24 24"><path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="3"/></svg></button>
</div>`;

function renderMessage(m, i) {
  let out = m.time ? `<div class="timestamp">${m.time}</div>` : "";
  if (m.question) {
    const q = m.question;
    out += `<div class="msg-row bot"><div class="bubble question ${q.picked != null ? "answered" : ""}" data-i="${i}">
      <h4>${q.title}</h4>
      ${q.options.map((o, k) => `<button class="option ${q.picked === k ? "picked" : ""}" data-k="${k}">
        <span class="key">${"ABCD"[k]}</span>${esc(o)}</button>`).join("")}
    </div>${ACTIONS}</div>`;
  } else if (m.typing) {
    out += `<div class="msg-row bot"><div class="bubble typing"><span></span><span></span><span></span></div></div>`;
  } else {
    out += `<div class="msg-row ${m.from}"><div class="bubble">${m.html}</div>${m.from === "bot" ? ACTIONS : ""}</div>`;
  }
  return out;
}

function renderChat() {
  const bot = bots.find((b) => b.id === activeId);
  $("bot-pill").innerHTML = `${avatar(bot.color, bot.shape, 30)}<span>${bot.name}</span>`;
  $("input").placeholder = `Message ${bot.name}`;
  $("messages").innerHTML = bot.messages.map(renderMessage).join("");
  scrollToBottom();
}

function scrollToBottom() {
  const el = $("messages");
  el.scrollTop = el.scrollHeight;
  updateScrollBtn();
}

function updateScrollBtn() {
  const el = $("messages");
  $("scroll-down").classList.toggle("show", el.scrollHeight - el.scrollTop - el.clientHeight > 80);
}

function reply(bot, text) {
  bot.messages.push({ from: "user", html: esc(text) });
  bot.messages.push({ from: "bot", typing: true });
  render();
  setTimeout(() => {
    bot.messages.pop();
    bot.messages.push({ from: "bot", html: `<p>Got it. This is a UI prototype, so there's no agent behind me yet. You said: “${esc(text)}”.</p>` });
    render();
  }, 900);
}

function render() { renderSidebar(); renderChat(); }

// Events
$("bot-list").addEventListener("click", (e) => {
  const row = e.target.closest(".bot-row");
  if (!row) return;
  activeId = row.dataset.id;
  bots.find((b) => b.id === activeId).unread = false;
  render();
});

$("messages").addEventListener("click", (e) => {
  const opt = e.target.closest(".option");
  if (!opt) return;
  const bot = bots.find((b) => b.id === activeId);
  const q = bot.messages[+opt.closest(".question").dataset.i].question;
  if (q.picked != null) return;
  q.picked = +opt.dataset.k;
  reply(bot, q.options[q.picked]);
});

$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("input").value.trim();
  if (!text) return;
  $("input").value = "";
  reply(bots.find((b) => b.id === activeId), text);
});

$("search-btn").addEventListener("click", () => {
  const s = $("search");
  s.hidden = !s.hidden;
  if (!s.hidden) s.focus(); else { filter = ""; s.value = ""; renderSidebar(); }
});
$("search").addEventListener("input", (e) => { filter = e.target.value; renderSidebar(); });
$("messages").addEventListener("scroll", updateScrollBtn);
$("scroll-down").addEventListener("click", () => $("messages").scrollTo({ top: $("messages").scrollHeight, behavior: "smooth" }));

render();
