# dapp

## Local Development

```bash
npx hardhat node

npx hardhat run scripts/deploy.js --network hardhat
```

## Testnet (Arbtirum Deployment)

```bash
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

## Contract Addresses

Reward Token:0x4Da2D3EFa52366e925AD6b18cC8d526195b7Af98
LP TOKEN 1: 0xC283b9016cCFa4Fb92da89A74Aae9EF4AA395858
LP TOKEN 2: 0x6649219c2ba882D62838BEfaC5d8Ae227d96f4a1
LP TOKEN 3: 0x1A773060002154Fb7F2037B97cC0Ac17f052d2dE
LP TOKEN FRAM: 0xB1c2f1A2fd8f618b8377D603471a196c7d8aA51C

## Verify

LP TOKEN FARM

```bash
npx hardhat verify --network arbitrumSepolia "0xB1c2f1A2fd8f618b8377D603471a196c7d8aA51C" "0x4Da2D3EFa52366e925AD6b18cC8d526195b7Af98" 7998178
```

LP TOKEN 1

```bash
npx hardhat verify --network arbitrumSepolia "0xC283b9016cCFa4Fb92da89A74Aae9EF4AA395858" "LP Token 1" "LP1" 1000000000000000000000000
```
