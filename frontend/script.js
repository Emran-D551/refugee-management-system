const API = "http://localhost:3000";

let web3;
let contract;
let currentAccount;
const CONTRACT_ADDRESS = "0xA1f97582D416ea1117eDd76f1979BC53b0d7Ede6";

window.onload = function(){

   if(localStorage.getItem("loggedIn") === "true"){

      const loginBox =
      document.getElementById("loginBox");

      const dashboard =
      document.getElementById("dashboard");

      if(loginBox && dashboard){

         loginBox.style.display = "none";
         dashboard.style.display = "block";
      }
   }
}

window.onload = function(){

   const lastId =
   localStorage.getItem(
      "lastRefugeeId"
   );

   if(lastId){

      const result =
      document.getElementById(
         "result"
      );

      if(result){

         result.innerText =
         "Last Registered ID: " +
         lastId;
      }
   }
}

const CONTRACT_ABI =[
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

// Current Authority Type (bd, unhcr, ngo)

function showPanel(type){

   currentAuthority = type;

   if(type==="bd"){
      document.getElementById(
      "panelTitle"
      ).innerText =
      "Bangladesh Authority";
   }

   if(type==="unhcr"){
      document.getElementById(
      "panelTitle"
      ).innerText =
      "UNHCR Authority";
   }

   if(type==="ngo"){
      document.getElementById(
      "panelTitle"
      ).innerText =
      "NGO Authority";
   }
}


//METAMASK CONNECTION

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
if(Number(age) < 15){

   alert(
      "Registration is only allowed for refugees aged 15 years or above."
   );

   return;
}

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

    localStorage.setItem(
   "lastRefugeeId",
   data.id
);
    
}
// Track Status
async function trackStatus(){

   const id =
   document.getElementById(
      "trackId"
   ).value;

   const res =
   await fetch(
      API + "/status/" + id
   );

   const data =
   await res.json();

   if(!res.ok){

      document.getElementById(
      "trackResult"
      ).innerHTML =
      "❌ Refugee Not Found";

      return;
   }

   document.getElementById(
   "trackResult"
   ).innerHTML =

   `
   <b>ID:</b> ${data.id}
   <br><br>

   <b>Status:</b> ${data.status}
   <br>

   BD:
   ${data.bdApproved ? "✅" : "⏳"}
   <br>

   UNHCR:
   ${data.unhcrApproved ? "✅" : "⏳"}
   <br>

   NGO:
   ${data.ngoApproved ? "✅" : "⏳"}
   `;
}


/* Demo Login */
function loginBD(){

    const u =
    document.getElementById(
    "username"
    ).value;

    const p =
    document.getElementById(
    "password"
    ).value;

    if(
      
        u==="bd" &&
        p==="bd123"
    ){
      localStorage.setItem(
   "loggedIn",
   "true"
);

        document.getElementById(
        "loginBox"
        ).style.display="none";

        document.getElementById(
        "dashboard"
        ).style.display="block";
        connectWallet();
    }else{

        document.getElementById(
        "loginMsg"
        ).innerText=
        "Invalid Login";
    }
}
function loginUNHCR(){

    const u =
    document.getElementById(
    "username"
    ).value;

    const p =
    document.getElementById(
    "password"
    ).value;



    if(
        u==="unhcr" &&
        p==="unhcr123"
    ){
localStorage.setItem(
   "loggedIn",
   "true"
);
        document.getElementById(
        "loginBox"
        ).style.display="none";

        document.getElementById(
        "dashboard"
        ).style.display="block";
        connectWallet();

    }else{

        document.getElementById(
        "loginMsg"
        ).innerText=
        "Invalid Login";
    }
}
function loginNGO(){

    const u =
    document.getElementById(
    "username"
    ).value;

    const p =
    document.getElementById(
    "password"
    ).value;

    if(
        u==="ngo" &&
        p==="ngo123"
    ){
      localStorage.setItem(
   "loggedIn",
   "true"
);

        document.getElementById(
        "loginBox"
        ).style.display="none";

        document.getElementById(
        "dashboard"
        ).style.display="block";
        connectWallet();

    }else{

        document.getElementById(
        "loginMsg"
        ).innerText=
        "Invalid Login";
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

    const li =
    document.createElement("li");

    li.innerHTML = `

      <b>ID:</b> ${r.id}

      <br>

      BD:
      ${r.bdApproved ? "✅" : "⏳"}

      |

      UNHCR:
      ${r.unhcrApproved ? "✅" : "⏳"}

      |

      NGO:
      ${r.ngoApproved ? "✅" : "⏳"}

      <br><br>

      <button onclick="viewDetails(${r.id})">
      View Details
      </button>

        ${getApproveButton(r)}

      <button onclick="rejectRefugee(${r.id})">
      Reject
      </button>

      <hr>

    `;

    ul.appendChild(li);

  });

}

function getApproveButton(r){

   if(
      currentAuthority === "bd" &&
      r.bdApproved
   ){
      return `
      <button disabled>
      Already Approved
      </button>
      `;
   }

   if(
      currentAuthority === "unhcr" &&
      r.unhcrApproved
   ){
      return `
      <button disabled>
      Already Approved
      </button>
      `;
   }

   if(
      currentAuthority === "ngo" &&
      r.ngoApproved
   ){
      return `
      <button disabled>
      Already Approved
      </button>
      `;
   }

   return `
   <button onclick="approve(${r.id})">
      Approve
   </button>
   `;
}



/* ---------------- APPROVE WITH METAMASK ---------------- */

async function approve(id){

  try{

    if(!window.ethereum){

      alert("MetaMask not installed");
      return;
    }

    const provider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    await provider.send(
      "eth_requestAccounts",
      []
    );

    const signer =
      await provider.getSigner();

    const contract =
      new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

    let tx;

    if(currentAuthority === "bd"){

      tx =
      await contract.approveByBD(id);

    }

    else if(currentAuthority === "unhcr"){

      tx =
      await contract.approveByUNHCR(id);

    }

    else if(currentAuthority === "ngo"){

      tx =
      await contract.approveByNGO(id);

    }

    else{

      alert("Authority not found");
      return;
    }

    await tx.wait();

    const res =
    await fetch(

      API +
      "/approve/" +
      currentAuthority +
      "/" +
      id,

      {
        method:"POST"
      }

    );

    const data =
    await res.json();

    if(!res.ok){

      alert(data.error);
      return;
    }

    alert(
      "✅ Approval Successful\n\nTX Hash:\n" +
      tx.hash
    );

    loadPending();

  }

catch(err){

   console.error(err);

   alert(
      "❌ " + err.message
   );
}

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
