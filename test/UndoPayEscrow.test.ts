import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { UndoPayEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("UndoPayEscrow", function () {
  let escrow: UndoPayEscrow;
  let owner: HardhatEthersSigner;
  let sender: HardhatEthersSigner;
  let receiver: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  const ONE_ETH = ethers.parseEther("1");
  const RECLAIM_WINDOW = 30; // seconds
  const FIRST_PAYMENT_ID = 1; // paymentCounter starts at 0, first id is 1 (pre-increment)

  beforeEach(async function () {
    [owner, sender, receiver, stranger] = await ethers.getSigners();

    const UndoPayEscrowFactory = await ethers.getContractFactory("UndoPayEscrow", owner);
    escrow = (await UndoPayEscrowFactory.deploy()) as unknown as UndoPayEscrow;
    await escrow.waitForDeployment();
  });

  describe("createPayment", function () {
    it("creates a payment starting at id 1 and stores correct details", async function () {
      const tx = await escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const payment = await escrow.getPayment(FIRST_PAYMENT_ID);
      expect(payment.sender).to.equal(sender.address);
      expect(payment.receiver).to.equal(receiver.address);
      expect(payment.amount).to.equal(ONE_ETH);
      expect(payment.createdAt).to.equal(block!.timestamp);
      expect(payment.expiresAt).to.equal(block!.timestamp + RECLAIM_WINDOW);
      expect(payment.status).to.equal(0); // Pending
    });

    it("increments paymentCounter", async function () {
      await escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH });
      await escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH });
      expect(await escrow.paymentCounter()).to.equal(2);
    });

    it("emits PaymentCreated", async function () {
      await expect(escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH }))
        .to.emit(escrow, "PaymentCreated")
        .withArgs(FIRST_PAYMENT_ID, sender.address, receiver.address, ONE_ETH, anyValue);
    });

    it("reverts on zero address receiver", async function () {
      await expect(
        escrow.connect(sender).createPayment(ethers.ZeroAddress, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(escrow, "InvalidReceiver");
    });

    it("reverts on zero value", async function () {
      await expect(
        escrow.connect(sender).createPayment(receiver.address, { value: 0 })
      ).to.be.revertedWithCustomError(escrow, "ZeroAmount");
    });

    it("escrows the ETH in the contract", async function () {
      await escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH });
      expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(ONE_ETH);
    });

    it("reverts while paused", async function () {
      await escrow.connect(owner).pause();
      await expect(
        escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });
  });

  describe("reclaimPayment", function () {
    beforeEach(async function () {
      await escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH });
    });

    it("refunds the sender before the window expires", async function () {
      const balanceBefore = await ethers.provider.getBalance(sender.address);

      const tx = await escrow.connect(sender).reclaimPayment(FIRST_PAYMENT_ID);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(sender.address);
      expect(balanceAfter).to.equal(balanceBefore + ONE_ETH - gasUsed);

      const payment = await escrow.getPayment(FIRST_PAYMENT_ID);
      expect(payment.status).to.equal(1); // Reclaimed
      expect(payment.amount).to.equal(0); // zeroed out
    });

    it("emits PaymentReclaimed", async function () {
      await expect(escrow.connect(sender).reclaimPayment(FIRST_PAYMENT_ID))
        .to.emit(escrow, "PaymentReclaimed")
        .withArgs(FIRST_PAYMENT_ID, sender.address, ONE_ETH);
    });

    it("reverts if called by non-sender", async function () {
      await expect(
        escrow.connect(stranger).reclaimPayment(FIRST_PAYMENT_ID)
      ).to.be.revertedWithCustomError(escrow, "NotSender");
    });

    it("reverts if reclaim window has expired", async function () {
      await time.increase(RECLAIM_WINDOW + 1);
      await expect(
        escrow.connect(sender).reclaimPayment(FIRST_PAYMENT_ID)
      ).to.be.revertedWithCustomError(escrow, "PaymentExpired");
    });

    it("reverts on double reclaim", async function () {
      await escrow.connect(sender).reclaimPayment(FIRST_PAYMENT_ID);
      await expect(
        escrow.connect(sender).reclaimPayment(FIRST_PAYMENT_ID)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("reverts for a nonexistent payment", async function () {
      await expect(escrow.connect(sender).reclaimPayment(999)).to.be.revertedWithCustomError(
        escrow,
        "PaymentNotFound"
      );
    });

    it("still works while contract is paused", async function () {
      await escrow.connect(owner).pause();
      await expect(escrow.connect(sender).reclaimPayment(FIRST_PAYMENT_ID)).to.not.be.reverted;
    });
  });

  describe("releasePayment", function () {
    beforeEach(async function () {
      await escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH });
    });

    it("reverts if the window has not expired yet", async function () {
      await expect(
        escrow.connect(stranger).releasePayment(FIRST_PAYMENT_ID)
      ).to.be.revertedWithCustomError(escrow, "PaymentNotExpired");
    });

    it("releases funds to receiver after expiry, callable by anyone", async function () {
      await time.increase(RECLAIM_WINDOW + 1);

      const balanceBefore = await ethers.provider.getBalance(receiver.address);
      await escrow.connect(stranger).releasePayment(FIRST_PAYMENT_ID);
      const balanceAfter = await ethers.provider.getBalance(receiver.address);

      expect(balanceAfter).to.equal(balanceBefore + ONE_ETH);

      const payment = await escrow.getPayment(FIRST_PAYMENT_ID);
      expect(payment.status).to.equal(2); // Released
    });

    it("emits PaymentReleased", async function () {
      await time.increase(RECLAIM_WINDOW + 1);
      await expect(escrow.connect(stranger).releasePayment(FIRST_PAYMENT_ID))
        .to.emit(escrow, "PaymentReleased")
        .withArgs(FIRST_PAYMENT_ID, receiver.address, ONE_ETH);
    });

    it("reverts on double release", async function () {
      await time.increase(RECLAIM_WINDOW + 1);
      await escrow.releasePayment(FIRST_PAYMENT_ID);
      await expect(escrow.releasePayment(FIRST_PAYMENT_ID)).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus"
      );
    });

    it("reverts if already reclaimed", async function () {
      await escrow.connect(sender).reclaimPayment(FIRST_PAYMENT_ID);
      await time.increase(RECLAIM_WINDOW + 1);
      await expect(escrow.releasePayment(FIRST_PAYMENT_ID)).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus"
      );
    });

    it("reverts while paused, even after expiry", async function () {
      await time.increase(RECLAIM_WINDOW + 1);
      await escrow.connect(owner).pause();
      await expect(
        escrow.connect(stranger).releasePayment(FIRST_PAYMENT_ID)
      ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });
  });

  describe("pause / unpause", function () {
    it("only owner can pause", async function () {
      await expect(escrow.connect(stranger).pause()).to.be.revertedWithCustomError(
        escrow,
        "OwnableUnauthorizedAccount"
      );
    });

    it("only owner can unpause", async function () {
      await escrow.connect(owner).pause();
      await expect(escrow.connect(stranger).unpause()).to.be.revertedWithCustomError(
        escrow,
        "OwnableUnauthorizedAccount"
      );
    });

    it("owner can pause and unpause", async function () {
      await escrow.connect(owner).pause();
      expect(await escrow.paused()).to.equal(true);

      await escrow.connect(owner).unpause();
      expect(await escrow.paused()).to.equal(false);
    });

    it("createPayment works again after unpause", async function () {
      await escrow.connect(owner).pause();
      await escrow.connect(owner).unpause();
      await expect(
        escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH })
      ).to.not.be.reverted;
    });
  });

  describe("getTimeRemaining", function () {
    beforeEach(async function () {
      await escrow.connect(sender).createPayment(receiver.address, { value: ONE_ETH });
    });

    it("returns close to the full window right after creation", async function () {
      const remaining = await escrow.getTimeRemaining(FIRST_PAYMENT_ID);
      expect(remaining).to.be.closeTo(RECLAIM_WINDOW, 2);
    });

    it("returns 0 after the window expires", async function () {
      await time.increase(RECLAIM_WINDOW + 1);
      expect(await escrow.getTimeRemaining(FIRST_PAYMENT_ID)).to.equal(0);
    });

    it("returns 0 once reclaimed", async function () {
      await escrow.connect(sender).reclaimPayment(FIRST_PAYMENT_ID);
      expect(await escrow.getTimeRemaining(FIRST_PAYMENT_ID)).to.equal(0);
    });

    it("decreases over time", async function () {
      await time.increase(10);
      const remaining = await escrow.getTimeRemaining(FIRST_PAYMENT_ID);
      expect(remaining).to.be.closeTo(RECLAIM_WINDOW - 10, 2);
    });
  });

  describe("getPayment", function () {
    it("reverts for a nonexistent payment", async function () {
      await expect(escrow.getPayment(999)).to.be.revertedWithCustomError(escrow, "PaymentNotFound");
    });

    it("reverts for payment id 0", async function () {
      await expect(escrow.getPayment(0)).to.be.revertedWithCustomError(escrow, "PaymentNotFound");
    });
  });
});
