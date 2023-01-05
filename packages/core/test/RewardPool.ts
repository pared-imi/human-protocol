import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import {
  EscrowFactory,
  HMToken,
  RewardPool,
  Staking,
} from '../typechain-types';
import { expect } from 'chai';

describe('RewardPool', function () {
  let token: HMToken,
    escrowFactory: EscrowFactory,
    staking: Staking,
    rewardPool: RewardPool;
  let owner: Signer,
    validator: Signer,
    validator2: Signer,
    operator: Signer,
    exchangeOracle: Signer,
    reputationOracle: Signer,
    recordingOracle: Signer,
    externalAccount: Signer;

  const minimumStake = 2;
  const lockPeriod = 2;
  const rewardFee = 2;

  this.beforeAll(async () => {
    [
      owner,
      validator,
      validator2,
      operator,
      exchangeOracle,
      reputationOracle,
      recordingOracle,
      externalAccount,
    ] = await ethers.getSigners();

    // Deploy HMTToken Contract
    const HMToken = await ethers.getContractFactory('HMToken');
    token = await HMToken.deploy(1000000000, 'Human Token', 18, 'HMT');

    // Deploy Staking Conract
    const Staking = await ethers.getContractFactory('Staking');
    staking = await Staking.deploy(token.address, minimumStake, lockPeriod);

    // Deploy Escrow Factory Contract
    const EscrowFactory = await ethers.getContractFactory('EscrowFactory');

    escrowFactory = await EscrowFactory.deploy();
    await escrowFactory.initialize(token.address, staking.address);
  });

  this.beforeEach(async () => {
    // Send HMT tokens to contract participants
    [
      validator,
      validator2,
      operator,
      exchangeOracle,
      reputationOracle,
      recordingOracle,
      externalAccount,
    ].forEach(async (account) => {
      await token.connect(owner).approve(await account.getAddress(), 1000);
      await token
        .connect(account)
        .transferFrom(
          await owner.getAddress(),
          await account.getAddress(),
          1000
        );
    });

    // Deploy Reward Pool Conract
    const RewardPool = await ethers.getContractFactory('RewardPool');
    rewardPool = await RewardPool.deploy(
      token.address,
      staking.address,
      rewardFee
    );

    // Configure RewardPool in Staking
    await staking.setRewardPool(rewardPool.address);

    // Approve spend HMT tokens staking contract
    [
      validator,
      validator2,
      operator,
      exchangeOracle,
      reputationOracle,
      recordingOracle,
      externalAccount,
    ].map(async (account) => {
      await token.connect(account).approve(staking.address, 1000);
    });
  });

  it('Should set eip20 address given to constructor', async () => {
    expect(await rewardPool.eip20()).to.equal(token.address);
  });

  it('Should set fee given to constructor', async () => {
    expect(await rewardPool.fees()).to.equal(rewardFee);
  });

  describe('Add Reward', () => {
    let escrowAddress: string;
    const stakedTokens = 10;
    const allocatedTokens = 5;

    beforeEach(async () => {
      await staking.connect(validator).stake(stakedTokens);

      await staking.connect(operator).stake(stakedTokens);

      const result = await (
        await escrowFactory
          .connect(operator)
          .createEscrow([ethers.constants.AddressZero])
      ).wait();
      const event = result.events?.[0].args;

      expect(event?.eip20).to.equal(token.address, 'token address is correct');
      expect(event?.escrow).to.not.be.null;

      escrowAddress = event?.escrow;

      await staking.connect(operator).allocate(escrowAddress, allocatedTokens);
    });

    it('Only staking can add reward', async () => {
      await expect(
        rewardPool
          .connect(operator)
          .addReward(
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            1
          )
      ).to.be.revertedWith('Caller is not staking contract');
    });

    it('When slashed is lower than fee, reward record is not created', async () => {
      const slashedTokens = 1;

      await staking
        .connect(owner)
        .slash(
          await validator.getAddress(),
          await operator.getAddress(),
          escrowAddress,
          slashedTokens
        );

      expect(await token.balanceOf(rewardPool.address)).to.equal(slashedTokens);

      const rewards = await rewardPool.getRewards(escrowAddress);
      expect(rewards.length).to.equal(0);
    });

    it('When slashed is higher than fee, reward record is created', async () => {
      const slashedTokens = 3;
      await expect(
        await staking
          .connect(owner)
          .slash(
            await validator.getAddress(),
            await operator.getAddress(),
            escrowAddress,
            slashedTokens
          )
      )
        .to.emit(rewardPool, 'RewardAdded')
        .withArgs(
          escrowAddress,
          await validator.getAddress(),
          slashedTokens - rewardFee
        );

      expect(await token.balanceOf(rewardPool.address)).to.equal(slashedTokens);

      const rewards = await rewardPool.getRewards(escrowAddress);
      expect(rewards.length).to.equal(1);
      expect(rewards[0].escrowAddress).to.equal(escrowAddress);
      expect(rewards[0].slasher).to.equal(await validator.getAddress());
      expect(rewards[0].tokens).to.equal(slashedTokens - rewardFee);
    });
  });

  describe('Distribute Reward', () => {
    let escrowAddress: string;
    const stakedTokens = 10;
    const allocatedTokens = 8;

    beforeEach(async () => {
      await staking.connect(validator).stake(stakedTokens);

      await staking.connect(validator2).stake(stakedTokens);

      await staking.connect(operator).stake(stakedTokens);

      const result = await (
        await escrowFactory
          .connect(operator)
          .createEscrow([ethers.constants.AddressZero])
      ).wait();
      const event = result.events?.[0].args;

      expect(event?.eip20).to.equal(token.address, 'token address is correct');
      expect(event?.escrow).to.not.be.null;

      escrowAddress = event?.escrow;

      await staking.connect(operator).allocate(escrowAddress, allocatedTokens);
    });

    it('Should distribute the reward.', async () => {
      const vSlashAmount = 2;
      const v2SlashAmount = 3;
      await staking
        .connect(owner)
        .slash(
          await validator.getAddress(),
          await operator.getAddress(),
          escrowAddress,
          vSlashAmount
        );
      await staking
        .connect(owner)
        .slash(
          await validator2.getAddress(),
          await operator.getAddress(),
          escrowAddress,
          v2SlashAmount
        );

      const vBalanceBefore = await token.balanceOf(
        await validator.getAddress()
      );
      const v2BalanceBefore = await token.balanceOf(
        await validator2.getAddress()
      );

      await rewardPool.distributeReward(escrowAddress);

      expect(await token.balanceOf(await validator.getAddress())).to.equal(
        vBalanceBefore.add(vSlashAmount - rewardFee)
      );

      expect(await token.balanceOf(await validator2.getAddress())).to.equal(
        v2BalanceBefore.add(v2SlashAmount - rewardFee)
      );

      expect(await token.balanceOf(rewardPool.address)).to.equal(rewardFee * 2);
    });
  });
});
