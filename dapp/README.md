# dapp

## Local Development

```bash
npx hardhat node

npx hardhat run scripts/deploy.js --network localhost
```

## Testnet (Arbtirum Deployment)

```bash
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

## Contract Addresses

Reward Token:0x1997D63b4C4560DdEdA4ADED1F8C81198e07999e
LP TOKEN 1: 0x4bc2f9549AF2a7D28d583E4b8761ff184Efdc273
LP TOKEN 2: 0x936B2301EB2A3fb8ec8AE1f9Af78aD0d55dd53D1
LP TOKEN 3: 0x424Cc8260e7Cfb16EFE715B760d8EC94d0C8B972
LP TOKEN FRAM: 0x3211B05D268Ae384faE566f11A99aD4A0Ff94Cb1

## Verify

LP TOKEN FARM

```bash
npx hardhat verify --network arbitrumSepolia "0x3211B05D268Ae384faE566f11A99aD4A0Ff94Cb1" "0x1997D63b4C4560DdEdA4ADED1F8C81198e07999e" 135254940
```
