// App.tsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

// Import ABIs and contract addresses
import farmAbi from "./abis/LPTokenFarm.json";
import tokenAbi from "./abis/ERC20.json";
import { farmAddress, lpTokenAddresses, rewardTokenAddress } from "./config";

// Type definitions
interface Pool {
  id: number;
  name: string;
  allocation: number;
  address: string;
  yourStake: string;
  pendingRewards: string;
}

function App() {
  // State variables
  const [account, setAccount] = useState<ethers.JsonRpcSigner | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [farmContract, setFarmContract] = useState<ethers.Contract | null>(
    null
  );
  const [rewardTokenContract, setRewardTokenContract] =
    useState<ethers.Contract | null>(null);
  const [lpTokenContracts, setLpTokenContracts] = useState<{
    [key: string]: ethers.Contract;
  }>({});
  const [pools, setPools] = useState<Pool[]>([]);
  const [rewardBalance, setRewardBalance] = useState<string>("0");
  const [lpToken1Balance, setLpToken1Balance] = useState<string>("0");
  const [lpToken2Balance, setLpToken2Balance] = useState<string>("0");
  const [lpToken3Balance, setLpToken3Balance] = useState<string>("0");

  const [selectedPool, setSelectedPool] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Connect to wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3Provider.listAccounts();
        const web3Signer = await web3Provider.getSigner();

        setSigner(web3Signer);
        setAccount(accounts[0]);

        return {
          provider: web3Provider,
          signer: web3Signer,
          account: accounts[0],
        };
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask or another Ethereum wallet.");
    }
    return null;
  };

  // Initialize contracts
  const initContracts = async (signer: ethers.Signer) => {
    const farm = new ethers.Contract(farmAddress, farmAbi, signer);
    const rewardToken = new ethers.Contract(
      rewardTokenAddress,
      tokenAbi,
      signer
    );

    const lpTokens: { [key: string]: ethers.Contract } = {};
    for (const address of lpTokenAddresses) {
      lpTokens[address] = new ethers.Contract(address, tokenAbi, signer);
    }

    setFarmContract(farm);
    setRewardTokenContract(rewardToken);
    setLpTokenContracts(lpTokens);

    return { farm, rewardToken, lpTokens };
  };

  // Load user data
  const loadUserData = async (
    account: string,
    farm: ethers.Contract,
    rewardToken: ethers.Contract,
    lpTokens: { [key: string]: ethers.Contract }
  ) => {
    setLoading(true);
    try {
      // Get reward token balance
      const rewardTokenBalance = await rewardToken.balanceOf(account);
      setRewardBalance(ethers.formatEther(rewardTokenBalance));

      // Get pool data
      const poolLength = await farm.poolLength();
      const poolData: Pool[] = [];

      for (let i = 0; i < Number(poolLength); i++) {
        const poolInfo = await farm.poolInfo(i);
        const userInfo = await farm.userInfo(i, account);
        const pendingReward = await farm.pendingRewards(i, account);

        // Get LP token name
        const lpToken = lpTokens[poolInfo.lpToken];
        const name = await lpToken.name();
        const lpTokenBalance = await lpToken.balanceOf(account);
        if (i === 0) {
          setLpToken1Balance(ethers.formatEther(lpTokenBalance));
        }
        if (i === 1) {
          setLpToken2Balance(ethers.formatEther(lpTokenBalance));
        }
        if (i === 2) {
          setLpToken3Balance(ethers.formatEther(lpTokenBalance));
        }
        poolData.push({
          id: i,
          name,
          allocation: Number(poolInfo.allocPoint),
          address: poolInfo.lpToken,
          yourStake: ethers.formatEther(userInfo.amount),
          pendingRewards: ethers.formatEther(pendingReward),
        });
      }

      setPools(poolData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  // Initial setup
  useEffect(() => {
    const init = async () => {
      const connection = await connectWallet();
      if (connection) {
        const { signer, account } = connection;
        const contracts = await initContracts(signer);
        await loadUserData(
          account?.address,
          contracts.farm,
          contracts.rewardToken,
          contracts.lpTokens
        );
      }
    };
    init();

    // Add event listener for account changes
    if (window.ethereum) {
      window.ethereum.on(
        "accountsChanged",
        (accounts: ethers.JsonRpcSigner[]) => {
          setAccount(accounts[0]);
          window.location.reload();
        }
      );
    }

    return () => {
      // Remove event listener
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  // Refresh data when account changes
  useEffect(() => {
    const fetchData = async () => {
      if (
        account &&
        farmContract &&
        rewardTokenContract &&
        Object.keys(lpTokenContracts).length > 0
      ) {
        loadUserData(
          account.address,
          farmContract,
          rewardTokenContract,
          lpTokenContracts
        );
      }

      fetchData();
    };
  }, [account, farmContract, rewardTokenContract, lpTokenContracts]);

  // Approve and deposit LP tokens
  const handleDeposit = async () => {
    if (!farmContract || !signer || !account || !stakeAmount) return;

    setLoading(true);
    try {
      debugger;
      const pool = pools[selectedPool];
      const lpToken = lpTokenContracts[pool.address];
      const amount = ethers.parseEther(stakeAmount);

      // Check allowance
      const allowance = await lpToken.allowance(account, farmAddress);
      if (Number(allowance) < amount) {
        // Approve if needed
        const approveTx = await lpToken.approve(farmAddress, ethers.MaxUint256);
        await approveTx.wait();
      }

      // Deposit
      const tx = await farmContract.deposit(selectedPool, amount);
      await tx.wait();

      if (!rewardTokenContract) {
        throw new Error("Reward token contract not found.");
      }

      // Refresh data
      await loadUserData(
        account.address,
        farmContract,
        rewardTokenContract,
        lpTokenContracts
      );
      setStakeAmount("");
    } catch (error) {
      console.error("Error depositing:", error);
      alert("Failed to deposit. See console for details.");
    }
    setLoading(false);
  };

  // Withdraw LP tokens
  const handleWithdraw = async () => {
    if (!farmContract || !account || !withdrawAmount) return;

    setLoading(true);
    try {
      const amount = ethers.parseEther(withdrawAmount);
      const tx = await farmContract.withdraw(selectedPool, amount);
      await tx.wait();

      if (!rewardTokenContract) {
        throw new Error("Reward token contract not found.");
      }

      // Refresh data
      await loadUserData(
        account.address,
        farmContract,
        rewardTokenContract,
        lpTokenContracts
      );
      setWithdrawAmount("");
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("Failed to withdraw. See console for details.");
    }
    setLoading(false);
  };

  // Claim rewards
  const handleClaim = async () => {
    if (!farmContract || !account) return;

    setLoading(true);
    try {
      const tx = await farmContract.claimRewards(selectedPool);
      await tx.wait();

      if (!rewardTokenContract) {
        throw new Error("Reward token contract not found.");
      }

      // Refresh data
      await loadUserData(
        account.address,
        farmContract,
        rewardTokenContract,
        lpTokenContracts
      );
    } catch (error) {
      console.error("Error claiming rewards:", error);
      alert("Failed to claim rewards. See console for details.");
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>LP Token Farming dApp</h1>
        {!account ? (
          <button onClick={connectWallet} disabled={loading}>
            Connect Wallet
          </button>
        ) : (
          <div className="account-info">
            <p>Connected: {account?.address}</p>
            <p>Reward Balance: {parseFloat(rewardBalance).toFixed(4)} RWT</p>
            <p>
              LP Token 1 Balance: {parseFloat(lpToken1Balance).toFixed(4)} LP
            </p>
            <p>
              LP Token 2 Balance: {parseFloat(lpToken2Balance).toFixed(4)} LP
            </p>
            <p>
              LP Token 3 Balance: {parseFloat(lpToken3Balance).toFixed(4)} LP
            </p>
          </div>
        )}
      </header>

      {account && (
        <main className="main">
          <section className="pools">
            <h2>Available Pools</h2>
            <div className="pools-list">
              {pools.map((pool) => (
                <div
                  key={pool.id}
                  className={`pool-card ${
                    selectedPool === pool.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedPool(pool.id)}
                >
                  <h3>{pool.name}</h3>
                  <p>Allocation: {pool.allocation}%</p>
                  <p>Your Stake: {parseFloat(pool.yourStake).toFixed(4)} LP</p>
                  <p>
                    Pending Rewards:{" "}
                    {parseFloat(pool.pendingRewards).toFixed(4)} RWT
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="actions">
            <h2>Farm Actions</h2>
            {pools.length > 0 && (
              <div className="selected-pool-info">
                <h3>Selected Pool: {pools[selectedPool]?.name}</h3>
                <p>
                  Your Stake:{" "}
                  {parseFloat(pools[selectedPool]?.yourStake).toFixed(4)} LP
                </p>
                <p>
                  Pending Rewards:{" "}
                  {parseFloat(pools[selectedPool]?.pendingRewards).toFixed(4)}{" "}
                  RWT
                </p>
              </div>
            )}

            <div className="action-forms">
              <div className="action-form">
                <h3>Deposit LP Tokens</h3>
                <input
                  type="number"
                  placeholder="Amount to deposit"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <button
                  onClick={handleDeposit}
                  disabled={loading || !stakeAmount}
                >
                  {loading ? "Processing..." : "Deposit"}
                </button>
              </div>

              <div className="action-form">
                <h3>Withdraw LP Tokens</h3>
                <input
                  type="number"
                  placeholder="Amount to withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount}
                >
                  {loading ? "Processing..." : "Withdraw"}
                </button>
              </div>

              <div className="action-form">
                <h3>Claim Rewards</h3>
                <p>
                  Claimable: {pools[selectedPool]?.pendingRewards || "0"} RWT
                </p>
                <button onClick={handleClaim} disabled={loading}>
                  {loading ? "Processing..." : "Claim Rewards"}
                </button>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
