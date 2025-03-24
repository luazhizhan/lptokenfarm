// These addresses should be updated after deployment
export const farmAddress = import.meta.env.VITE_FARM_ADDRESS; // Replace with your deployed farm address

export const rewardTokenAddress = import.meta.env.VITE_REWARD_TOKEN_ADDRESS; // Replace with your deployed reward token address
console.log(rewardTokenAddress);
// LP token addresses (replace with your deployed LP token addresses)
export const lpTokenAddresses = [
  import.meta.env.VITE_LP_TOKEN_ADDRESS_1, // LP Token 1 address (50% allocation)
  import.meta.env.VITE_LP_TOKEN_ADDRESS_2, // LP Token 2 address (30% allocation)
  import.meta.env.VITE_LP_TOKEN_ADDRESS_3, // LP Token 3 address (20% allocation)
];

// Pool allocation percentages
export const poolAllocations = [50, 30, 20];

export const rpcUrl = import.meta.env.VITE_RPC_URL; // Replace with your RPC URL
