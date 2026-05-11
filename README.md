# 🛡️ RugShield

**Real-time Solana Token Security Scanner & Safe Trading Terminal**

RugShield empowers Solana DeFi traders to navigate the wild west of memecoins and new tokens safely. By combining deep on-chain analytics with smart routing, we ensure your swaps are both secure and MEV-protected.

🔗 **[Live Application (Vercel)](https://rugshield-app.vercel.app/)**
🎥 **[Watch the Demo Video](OYAGE_YOUTUBE_LINK_EKA_METHANATA_DANNA)**

---

## 🚀 The Architecture & "Hidden Value"

We didn't just build a standard dApp; we engineered a resilient, production-ready product:

* **Hybrid Generation & Customization:** The foundation of the app was scaffolded using **Eitherway** AI, allowing us to rapidly prototype. We then exported, manually optimized, and deployed to **Vercel** to meet true production-ready standards.
* **Resilient Swap Routing:** While we natively integrate **DFlow** for superior MEV protection, we built a **Custom Jupiter API Fallback**. If the DFlow network is ever unreachable (as demonstrated in our testing), the app seamlessly routes trades through Jupiter, guaranteeing 100% swap uptime.
* **Serverless Backend:** API keys and sensitive operations are hidden behind Vercel Serverless Functions (`/api/*`), keeping the frontend secure while bypassing browser CORS limitations.

## ✨ Core Features

1. **The Rug Score (0-100):** Real-time analysis of tokens using the **Birdeye API**. We audit 6 weighted pillars:
   * Liquidity Depth
   * Deployer Behavior & Holdings
   * Top 10 Holder Concentration
   * Mint Authority Status
   * Metadata Mutability
   * Market Health (Volume/Transactions)
2. **Dynamic UI:** Intuitive dashboard with color-coded risk indicators (Danger, High Risk, Caution, Safe).
3. **MEV-Protected Trading:** Integrated trading panel ensuring users get the exact output they expect without front-running risks.

## 🛠️ Tech Stack

* **Frontend:** React, Vite, TypeScript, Tailwind CSS
* **Blockchain/Web3:** `@solana/web3.js`, Wallet Adapters (Phantom, Solflare)
* **APIs:** Birdeye (Data/Security), DFlow (Routing), QuickNode (RPC)
* **Deployment:** Vercel (Edge Network & Serverless Functions)

## 🏃‍♂️ Running Locally

1. Clone the repository: `git clone https://github.com/hasitha481/rugshield-app.git`
2. Install dependencies: `npm install`
3. Create a `.env` file with your keys:
   ```env
   VITE_RPC_URL="your_quicknode_or_mainnet_rpc_url"
   BIRDEYE_API_KEY="your_birdeye_key"
   DFLOW_API_KEY="your_dflow_key"