const client = new WebTorrent()
let myKey = null
let room = null
let dataStore = []

// Country detect
fetch("https://ipapi.co/json/")
  .then(r => r.json())
  .then(d => {
    room = d.country_name
    document.getElementById("country").innerText = "🌍 " + room
  })

// Generate key
genKey.onclick = () => {
  const key = crypto.randomUUID()
  alert("SAVE THIS KEY:\n" + key)
  keyInput.value = key
}

// Login
loginBtn.onclick = () => {
  myKey = keyInput.value.trim()
  if (!myKey) return alert("Key required")

  login.style.display = "none"
  app.style.display = "block"

  loadLocal()
  joinRoom()
}

// Join P2P room
function joinRoom() {
  const magnet = `magnet:?xt=urn:btih:${btoa(room)}`
  client.add(magnet, torrent => {
    torrent.on('wire', wire => {
      wire.use({
        name: 'sync',
        onHandshake () {},
        onExtendedHandshake () {},
        onMessage (buf) {
          const msg = JSON.parse(buf.toString())
          receive(msg)
        }
      })
    })
  })
}

// Broadcast
function broadcast(msg) {
  client.torrents.forEach(t => {
    t.wires.forEach(w => {
      w.extended('sync', Buffer.from(JSON.stringify(msg)))
    })
  })
}

// Receive
function receive(msg) {
  if (dataStore.find(x => x.id === msg.id)) return
  dataStore.push(msg)
  saveLocal()
  render()
}

// Post
postBtn.onclick = () => {
  const msg = {
    id: crypto.randomUUID(),
    type: "post",
    text: postText.value,
    owner: myKey
  }
  receive(msg)
  broadcast(msg)
  postText.value = ""
}

// Poll
pollBtn.onclick = () => {
  const msg = {
    id: crypto.randomUUID(),
    type: "poll",
    q: pollQ.value,
    a: pollA.value,
    b: pollB.value,
    votes: { a: 0, b: 0 }
  }
  receive(msg)
  broadcast(msg)
}

// Render
function render() {
  feed.innerHTML = ""
  dataStore.forEach(m => {
    const d = document.createElement("div")
    d.className = "post"

    if (m.type === "post") {
      d.innerText = m.text
    }

    if (m.type === "poll") {
      d.innerHTML = `
        <b>${m.q}</b><br>
        <button>A (${m.votes.a})</button>
        <button>B (${m.votes.b})</button>
      `
    }
    feed.appendChild(d)
  })
}

// Local save/load
function saveLocal() {
  localStorage.setItem("data-" + myKey, JSON.stringify(dataStore))
}

function loadLocal() {
  const d = localStorage.getItem("data-" + myKey)
  if (d) dataStore = JSON.parse(d)
  render()
    }
