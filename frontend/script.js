const API = "http://localhost:3000";

let web3;
let contract;
let currentAccount;
const CONTRACT_ADDRESS = "0xbBf9F0ddBA2c8f46a24Dd4b109E93B3ef5858929";

const CONTRACT_ABI =[
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_refugeeId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_cid",
				"type": "string"
			}
		],
		"name": "approveRefugee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "refugeeId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "cid",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "approvedAt",
				"type": "uint256"
			}
		],
		"name": "RefugeeApproved",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_refugeeId",
				"type": "uint256"
			}
		],
		"name": "verifyRefugee",
		"outputs": [
			{
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "cid",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "approvedAt",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
/* ---------------- METAMASK CONNECT ---------------- */

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not installed");
    return;
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts"
  });

  currentAccount = accounts[0];
  web3 = new Web3(window.ethereum);
  contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

  console.log("Connected:", currentAccount);
}




/* Refugee Register */
async function register() {
  const name = document.getElementById("name").value;
  const address = document.getElementById("address").value;
  const age = document.getElementById("age").value;
  const fingerprint = document.getElementById("fingerprint").value;


  const res = await fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, address, age, fingerprint })

  });

  const data = await res.json();
  if (!res.ok) {
    document.getElementById("result").innerText =
      "❌ " + data.error;
    return;
  }

  document.getElementById("result").innerText =
    "✅ Registered ID: " + data.id;
}

/* Demo Login */
function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;

  if (u === "admin" && p === "admin123") {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

      connectWallet();
  } else {
    document.getElementById("loginMsg").innerText = "Invalid login";
  }
}

/* Load Pending */
async function loadPending() {
  const res = await fetch(API + "/pending");
  const list = await res.json();

  const ul = document.getElementById("pendingList");
  ul.innerHTML = "";

  if (list.length === 0) {
    ul.innerHTML = "<li>No pending refugees</li>";
    return;
  }

  list.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `
      <b>ID:</b> ${r.id}<br>
      <button onclick="viewDetails(${r.id})">View Details</button>
      <button onclick="approve(${r.id})">Approve</button>
      <button onclick="rejectRefugee(${r.id})">Reject</button>
      <hr>
    `;
    ul.appendChild(li);
  });
}

/* View Details */
async function viewDetails(id) {
  const res = await fetch(API + "/details/" + id);
  const data = await res.json();

  alert(
    "Name: " + data.details.name + "\n" +
    "Age: " + data.details.age + "\n" +
    "Address: " + data.details.address
  );
}


/* ---------------- APPROVE (MetaMask) ---------------- */
async function approve(id) {
  try {
    if (!window.ethereum) {
      alert("MetaMask not installed");
      return;
    }

    // 1️⃣ connect MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    // 2️⃣ backend থেকে CID আনা
    const res = await fetch(API + "/details/" + id);
    const data = await res.json();

    const cid = data.cid;

    // 3️⃣ MetaMask popup → blockchain transaction
    const tx = await contract.approveRefugee(id, cid);
    await tx.wait();

    // 4️⃣ backend update (status = APPROVED)
    const save = await fetch(API + "/approve/" + id, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txHash: tx.hash
      })
    });

    const result = await save.json();

    if (!save.ok) {
      alert("Backend update failed");
      return;
    }

    alert("✅ Approved successfully!\nTX:\n" + tx.hash);

    loadPending();

  } catch (err) {
    console.error(err);
    alert("❌ Transaction rejected or failed");
  }
}





/* Reject */
async function rejectRefugee(id) {
  const res = await fetch(API + "/reject/" + id, { method: "POST" });
  const data = await res.json();
  alert(data.message);
  loadPending();
}

/* Hospital Verify */
async function verify() {
  const id = document.getElementById("verifyId").value;
  const res = await fetch(API + "/verify/" + id);
  const data = await res.json();
  document.getElementById("verifyResult").innerText =
    JSON.stringify(data, null, 2);
}
