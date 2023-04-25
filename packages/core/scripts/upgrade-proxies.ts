/* eslint-disable no-console */
import { ethers, upgrades } from 'hardhat';
import fs from 'fs';
import prettier from 'prettier';
import { ApolloClient, gql, InMemoryCache } from '@apollo/client';

async function main() {
  const subgraph = process.env.SUBGRAPH;
  const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS;
  const stakingAddress = process.env.STAKING_ADDRESS;
  const reputationAddress = process.env.REPUTATION_ADDRESS;
  const rewardPoolAddress = process.env.REWARD_POOL_ADDRESS;
  let blockNumber = 0;
  if (
    (!escrowFactoryAddress &&
      !stakingAddress &&
      !rewardPoolAddress &&
      !reputationAddress) ||
    !subgraph
  ) {
    console.error('Env variable missing');
    return;
  }

  if (escrowFactoryAddress) {
    const EscrowFactory = await ethers.getContractFactory('EscrowFactory');
    // await upgrades.forceImport(escrowFactoryAddress, EscrowFactory, { kind: 'uups' });  //use this to get ./openzeppelin/[network].json
    const escrowFactoryContract = await upgrades.upgradeProxy(
      escrowFactoryAddress,
      EscrowFactory
    );
    const contract = await escrowFactoryContract.deployed();
    const txReceipt = await ethers.provider.getTransactionReceipt(
      contract.deployTransaction.hash
    );

    if (
      txReceipt.blockNumber &&
      (txReceipt.blockNumber < blockNumber || blockNumber == 0)
    ) {
      blockNumber = txReceipt.blockNumber;
    }

    console.log(
      'Escrow Factory Proxy Address: ',
      escrowFactoryContract.address
    );
    console.log(
      'New Escrow Factory Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        escrowFactoryContract.address
      )
    );
  }

  if (stakingAddress) {
    const Staking = await ethers.getContractFactory('Staking');
    const stakingContract = await upgrades.upgradeProxy(
      stakingAddress,
      Staking
    );
    const contract = await stakingContract.deployed();
    const txReceipt = await ethers.provider.getTransactionReceipt(
      contract.deployTransaction.hash
    );

    if (
      txReceipt.blockNumber &&
      (txReceipt.blockNumber < blockNumber || blockNumber == 0)
    ) {
      blockNumber = txReceipt.blockNumber;
    }

    console.log('Staking Proxy Address: ', stakingContract.address);
    console.log(
      'New Staking Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(stakingContract.address)
    );
  }

  if (rewardPoolAddress) {
    const RewardPool = await ethers.getContractFactory('RewardPool');
    const rewardPoolContract = await upgrades.upgradeProxy(
      rewardPoolAddress,
      RewardPool
    );
    const contract = await rewardPoolContract.deployed();
    const txReceipt = await ethers.provider.getTransactionReceipt(
      contract.deployTransaction.hash
    );

    if (
      txReceipt.blockNumber &&
      (txReceipt.blockNumber < blockNumber || blockNumber == 0)
    ) {
      blockNumber = txReceipt.blockNumber;
    }

    console.log('Reward Pool Proxy Address: ', rewardPoolContract.address);
    console.log(
      'New Reward Pool Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        rewardPoolContract.address
      )
    );
  }

  if (reputationAddress) {
    const Reputation = await ethers.getContractFactory('Reputation');
    const reputationContract = await upgrades.upgradeProxy(
      reputationAddress,
      Reputation
    );
    const contract = await reputationContract.deployed();
    const txReceipt = await ethers.provider.getTransactionReceipt(
      contract.deployTransaction.hash
    );

    if (
      txReceipt.blockNumber &&
      (txReceipt.blockNumber < blockNumber || blockNumber == 0)
    ) {
      blockNumber = txReceipt.blockNumber;
    }

    console.log('Reputation Proxy Address: ', reputationContract.address);
    console.log(
      'New Reputation Implementation Address: ',
      await upgrades.erc1967.getImplementationAddress(
        reputationContract.address
      )
    );
  }

  if (blockNumber > 0)
    updateGraftingConfig(blockNumber, await getSubgraphId(subgraph), subgraph);
}

interface JSONData {
  [key: string]: any;
}

const GET_SUBGRAPH_ID = gql`
  query MyQuery {
    _meta {
      deployment
    }
  }
`;

function getSubgraphId(subgraphName: string) {
  const hostedServiceEndpoint = `https://api.thegraph.com/subgraphs/name/humanprotocol/${subgraphName}`;
  const client = new ApolloClient({
    uri: hostedServiceEndpoint,
    cache: new InMemoryCache(),
  });

  return client.query({ query: GET_SUBGRAPH_ID }).then((result) => {
    const subgraphId: string = result.data._meta.deployment;
    return subgraphId;
  });
}

function updateGraftingConfig(
  blockNumber: number,
  subgraphId: string,
  subgraphName: string
) {
  const filename = `../sdk/typescript/subgraph/config/${subgraphName}.json`;
  const data: JSONData = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const currentObject = data;
  currentObject['graft']['block'] = blockNumber;
  currentObject['graft']['base'] = subgraphId;
  const formattedData = prettier.format(JSON.stringify(data), {
    parser: 'json',
  });

  fs.writeFileSync(filename, formattedData);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
