// ----------------------------
// Minimal P2P + Distributed Fraction Copy Simulation
// ----------------------------

// Simulated Local Storage for this peer
let localPosts = []; // full posts for this peer

// Max copies per post
const MAX_COPIES = 30;

// Simulated network (all live peers)
let networkPeers = []; // array of {peerId, localPosts}

// Unique ID for this peer (secret key)
const peerId = crypto.randomUUID();
console.log("Peer ID:", peerId);

// Simulate Country Detection
let country = "Bangladesh"; // fallback for demo
document.getElementById('status').innerText = `Connected: ${country}`;

// HTML Elements
const feedEl = document.getElementById('feed');
const postInput = document.getElementById('postInput');
const postBtn = document.getElementById('postBtn');

// ----------------------------
// Helper: Render Feed
// ----------------------------
function renderFeed() {
  // Merge all posts from network + local
  let merged = [...localPosts];
  networkPeers.forEach(peer => merged.push(...peer.localPosts));

  // Remove duplicates by ID
  const map = {};
  merged.forEach(p => map[p.id] = p);
  merged = Object.values(map);

  // Sort by timestamp descending
  merged.sort((a,b)=>b.timestamp - a.timestamp);

  // Render
  feedEl.innerHTML = "";
  merged.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `<strong>${p.author}</strong>: ${p.content}<br><small>${new Date(p.timestamp).toLocaleTimeString()}</small>`;
    feedEl.appendChild(div);
  });
}

// ----------------------------
// Post Button Click
// ----------------------------
postBtn.addEventListener('click',()=>{
  const text = postInput.value.trim();
  if(!text) return;
  postInput.value="";

  // Create Post Object
  const post = {
    id: crypto.randomUUID(),
    author: peerId,
    content: text,
    timestamp: Date.now(),
    copies: MAX_COPIES
  };

  // Save full locally
  localPosts.push(post);

  // Broadcast fractionally to live peers
  networkPeers.forEach(peer=>{
    const fraction = Math.ceil(post.copies / (networkPeers.length + 1)); // simple distribution
    const copyPost = {...post, copies: fraction};
    peer.localPosts.push(copyPost);
  });

  renderFeed();
});

// ----------------------------
// Simulate New Peer Joining
// ----------------------------
function joinNetwork(newPeer){
  // Give fractional copies from existing posts
  networkPeers.forEach(peer=>{
    peer.localPosts.forEach(p=>{
      const fraction = Math.ceil(p.copies / (networkPeers.length + 2)); // distribute evenly
      const copyPost = {...p, copies: fraction};
      newPeer.localPosts.push(copyPost);
    });
  });

  // Add new peer to network
  networkPeers.push(newPeer);

  renderFeed();
}

// ----------------------------
// Demo: Add a simulated peer after 5 sec
// ----------------------------
setTimeout(()=>{
  const newPeer = {peerId: crypto.randomUUID(), localPosts: []};
  joinNetwork(newPeer);
  console.log("New peer joined:", newPeer.peerId);
  renderFeed();
},5000);

// ----------------------------
// Initial Render
// ----------------------------
renderFeed();
