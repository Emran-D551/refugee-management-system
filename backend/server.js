const express = require("express");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");
const { ethers } = require("ethers");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

/* ---------- Blockchain Config ---------- */
const GANACHE_RPC = "http://127.0.0.1:7545";

// ⚠️ MUST be the SAME account that deployed the contract
const PRIVATE_KEY = "0xa8b658e52a36871ddd046ba0831200ed21bd950269a14011b9bccd4868c7e526";

const CONTRACT_ADDRESS = "0xbBf9F0ddBA2c8f46a24Dd4b109E93B3ef5858929";

const CONTRACT_ABI = [
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

const provider = new ethers.JsonRpcProvider(GANACHE_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  wallet
);

/* ---------- IPFS ---------- */
const PINATA_API_KEY = "61f08f1ac3854cc90729";
const PINATA_SECRET = "76b1018c47f1087733bf82987025585a09fd30332ebe9918a074914ce66edc04";

/* ---------- File ---------- */
const DATA_FILE = "./data.json";

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function uploadToIPFS(data) {
  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    data,
    {
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET
      }
    }
  );
  return res.data.IpfsHash;
}
function hashFingerprint(fp) {
  return crypto.createHash("sha256").update(fp).digest("hex");
}

/* ---------- Routes ---------- */

// Register
app.post("/register", async (req, res) => {
  const { name, address, age, fingerprint } = req.body;

  if (!fingerprint) {
    return res.status(400).json({ message: "Fingerprint required" });
  }

  const data = readData();

  const fingerprintHash = hashFingerprint(fingerprint);

  // 🔒 DUPLICATE CHECK
  const exists = data.refugees.find(
    r => r.fingerprintHash === fingerprintHash
  );

  if (exists) {
    return res.status(409).json({
      message: "Duplicate fingerprint detected"
    });
  }

  const id = Date.now();

  const cid = await uploadToIPFS({
    id,
    name,
    address,
    age,
    fingerprintHash
  });

  data.refugees.push({
    id,
    cid,
    fingerprintHash,
    status: "PENDING"
  });

  writeData(data);

  res.json({
    message: "Registered successfully",
    id,
    cid
  });
});


// Pending
app.get("/pending", (req, res) => {
  const data = readData();
  res.json(data.refugees.filter(r => r.status === "PENDING"));
});

// ✅ View Details (from IPFS)
app.get("/details/:id", async (req, res) => {
  const data = readData();
  const refugee = data.refugees.find(r => r.id == req.params.id);

  if (!refugee) return res.status(404).json({ message: "Not found" });

  const ipfsData = await axios.get(
    `https://gateway.pinata.cloud/ipfs/${refugee.cid}`
  );

  res.json({
    id: refugee.id,
	cid: refugee.cid, 
    status: refugee.status,
    details: ipfsData.data
  });
});

// ✅ APPROVE ( + Backend)
app.post("/approve/:id", async (req, res) => {
  try {
    const data = readData();
    const id = Number(req.params.id);

    const index = data.refugees.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({ message: "Refugee not found" });
    }

    // frontend থেকে txHash আসবে
    const { txHash } = req.body;

    if (!txHash) {
      return res.status(400).json({ message: "Transaction hash required" });
    }

    data.refugees[index].status = "APPROVED";
    data.refugees[index].txHash = txHash;

    writeData(data);

    res.json({
      message: "Approved successfully",
      txHash
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Approval failed" });
  }
});






// ❌ Reject (Backend only)
app.post("/reject/:id", (req, res) => {
  const data = readData();
  const refugee = data.refugees.find(r => r.id == req.params.id);

  if (!refugee) {
    return res.status(404).json({ message: "Not found" });
  }

  refugee.status = "REJECTED";
  writeData(data);

  res.json({ message: "Rejected successfully" });
});




// Verify
app.get("/verify/:id", async (req, res) => {
  const data = readData();
  const id = Number(req.params.id);

  const refugee = data.refugees.find(r => r.id === id);

  if (!refugee) {
    return res.status(404).json({ message: "Not found" });
  }

  if (refugee.status !== "APPROVED") {
    return res.json({
      approved: false,
      message: "Not approved yet"
    });
  }

  return res.json({
    approved: true,
    cid: refugee.cid,
    status: refugee.status
  });
});





/* ---------- Server ---------- */
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
