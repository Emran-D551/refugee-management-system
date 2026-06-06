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
const PRIVATE_KEY = "0xac52ca8de11488b110678c0f5a81dbc700d007e5144fdd9e21c230910fb2cb58";

const CONTRACT_ADDRESS = "0xA1f97582D416ea1117eDd76f1979BC53b0d7Ede6";

const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_bd",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_unhcr",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_ngo",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "ApprovedByBD",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "ApprovedByNGO",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "ApprovedByUNHCR",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "FinalApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "cid",
        "type": "string"
      }
    ],
    "name": "RefugeeRegistered",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "approveByBD",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "approveByNGO",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "approveByUNHCR",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bangladeshAuthority",
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
    "inputs": [],
    "name": "ngoAuthority",
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
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "refugees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "bdApproved",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "unhcrApproved",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "ngoApproved",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "finalApproved",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_cid",
        "type": "string"
      }
    ],
    "name": "registerRefugee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unhcrAuthority",
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
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "verifyRefugee",
    "outputs": [
      {
        "internalType": "bool",
        "name": "finalApproved",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "bd",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "unhcr",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "ngo",
        "type": "bool"
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
if (Number(age) < 15) {

   return res.status(400).json({
      error: "Refugee must be at least 15 years old"
   });

}
  if (!fingerprint) {
    return res.status(400).json({ message: "Fingerprint required" });
  }

  const data = readData();

  const fingerprintHash = hashFingerprint(fingerprint);

  //  DUPLICATE CHECK
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

   bdApproved:false,
   unhcrApproved:false,
   ngoApproved:false,

   status:"PENDING"
});

  writeData(data);

  res.json({
    message: "Registered successfully",
    id,
    cid
  });
});

app.get("/status/:id", (req,res)=>{

   const data = readData();

   const refugee =
   data.refugees.find(
      r => r.id == req.params.id
   );

   if(!refugee){

      return res.status(404).json({
         error:"Refugee not found"
      });
   }

   res.json({
      id: refugee.id,
      status: refugee.status,
      bdApproved: refugee.bdApproved,
      unhcrApproved: refugee.unhcrApproved,
      ngoApproved: refugee.ngoApproved
   });

});

// Pending
app.get("/pending", (req, res) => {
  const data = readData();
  res.json(data.refugees.filter(r => r.status === "PENDING"));
});

//  View Details (from IPFS)
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



//  Reject (Backend only)
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

// Authority Approval
app.post(
"/approve/:authority/:id",

async (req,res)=>{

   const authority =
      req.params.authority;

   const id =
      Number(req.params.id);

   const data = readData();

   const refugee =
      data.refugees.find(
         r => r.id === id
      );

   if(!refugee){
      return res.status(404)
      .json({error:"Not found"});
   }

   if(authority==="bd"){

      refugee.bdApproved = true;

   }

   if(authority==="unhcr"){

      refugee.unhcrApproved = true;

   }

   if(authority==="ngo"){

      refugee.ngoApproved = true;

   }

if(
   refugee.bdApproved &&
   refugee.unhcrApproved &&
   refugee.ngoApproved
){

   const tx =
   await contract.registerRefugee(
      refugee.id,
      refugee.cid
   );

   await tx.wait();

   refugee.status = "APPROVED";
   refugee.txHash = tx.hash;
}

writeData(data);

res.json({
   success:true
});

});



/* ---------- Server ---------- */
app.listen(3000, () => {
  console.log("Server running on http://127.0.0.1:5500/frontend/index.html");
})
;
