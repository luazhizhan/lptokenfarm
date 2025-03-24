import ethers from "ethers";

/// <reference types="vite/client" />

declare global {
  declare module "*.css";

  interface Window {
    ethereum: ethers.providers.ExternalProvider;
  }

  interface ImportMetaEnv {
    readonly VITE_FARM_ADDRESS: string;
    readonly VITE_REWARD_TOKEN_ADDRESS: string;
    readonly VITE_RPC_URL: string;
    readonly VITE_LP_TOKEN_ADDRESS_1: string;
    readonly VITE_LP_TOKEN_ADDRESS_2: string;
    readonly VITE_LP_TOKEN_ADDRESS_3: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
