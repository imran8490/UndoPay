// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UndoPayEscrow
 * @author UndoPay
 * @notice Escrow contract that provides a 30-second reclaim window before
 *         funds are released to the receiver.
 * @dev Includes Pausable so the owner can freeze new deposits and releases
 *      in an emergency. Reclaiming is intentionally left unpausable so
 *      users can always recover funds they've already deposited.
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UndoPayEscrow is ReentrancyGuard, Pausable, Ownable {

    /*//////////////////////////////////////////////////////////////
                              CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant RECLAIM_WINDOW = 30 seconds;

    /*//////////////////////////////////////////////////////////////
                                ENUMS
    //////////////////////////////////////////////////////////////*/

    enum PaymentStatus {
        Pending,
        Reclaimed,
        Released
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Payment {
        address sender;
        address receiver;
        uint256 amount;
        uint256 createdAt;
        uint256 expiresAt;
        PaymentStatus status;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    uint256 public paymentCounter;

    mapping(uint256 => Payment) public payments;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        uint256 expiresAt
    );

    event PaymentReclaimed(
        uint256 indexed paymentId,
        address indexed sender,
        uint256 amount
    );

    event PaymentReleased(
        uint256 indexed paymentId,
        address indexed receiver,
        uint256 amount
    );

    /*//////////////////////////////////////////////////////////////
                            CUSTOM ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidReceiver();
    error ZeroAmount();
    error PaymentNotFound();
    error NotSender();
    error PaymentExpired();
    error PaymentNotExpired();
    error InvalidStatus();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() Ownable(msg.sender) {}

    /*//////////////////////////////////////////////////////////////
                        CREATE PAYMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new escrow payment.
     * @dev Blocked while paused — no new deposits during an emergency pause.
     * @param receiver Address that will receive the funds
     * @return paymentId Newly created payment ID
     */
    function createPayment(
        address receiver
    ) external payable whenNotPaused returns (uint256 paymentId) {

        if (receiver == address(0)) revert InvalidReceiver();
        if (msg.value == 0) revert ZeroAmount();

        paymentId = ++paymentCounter;

        payments[paymentId] = Payment({
            sender: msg.sender,
            receiver: receiver,
            amount: msg.value,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + RECLAIM_WINDOW,
            status: PaymentStatus.Pending
        });

        emit PaymentCreated(
            paymentId,
            msg.sender,
            receiver,
            msg.value,
            block.timestamp + RECLAIM_WINDOW
        );
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL VALIDATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Reverts if payment doesn't exist.
     */
    function _paymentExists(
        uint256 paymentId
    ) internal view {

        if (
            paymentId == 0 ||
            paymentId > paymentCounter
        ) {
            revert PaymentNotFound();
        }
    }

    /**
     * @dev Returns payment storage reference.
     */
    function _getPayment(
        uint256 paymentId
    ) internal view returns (Payment storage payment) {

        _paymentExists(paymentId);

        payment = payments[paymentId];
    }

    /*//////////////////////////////////////////////////////////////
                        RECLAIM PAYMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Allows the sender to reclaim funds before the reclaim window expires.
     * @dev Intentionally NOT gated by whenNotPaused — users must always be
     *      able to recover funds they've already deposited, even during an
     *      emergency pause.
     * @param paymentId The payment ID.
     */
    function reclaimPayment(
        uint256 paymentId
    ) external nonReentrant {

        Payment storage payment = _getPayment(paymentId);

        if (msg.sender != payment.sender) revert NotSender();
        if (payment.status != PaymentStatus.Pending) revert InvalidStatus();
        if (block.timestamp >= payment.expiresAt) revert PaymentExpired();

        // Effects
        payment.status = PaymentStatus.Reclaimed;

        uint256 amount = payment.amount;
        payment.amount = 0;

        // Interaction
        (bool success, ) = payable(payment.sender).call{value: amount}("");

        if (!success) revert TransferFailed();

        emit PaymentReclaimed(
            paymentId,
            payment.sender,
            amount
        );
    }

    /*//////////////////////////////////////////////////////////////
                        RELEASE PAYMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Releases escrowed funds after the reclaim window expires.
     * @dev Anyone can trigger this after expiry. Blocked while paused.
     * @param paymentId The payment ID.
     */
    function releasePayment(
        uint256 paymentId
    ) external nonReentrant whenNotPaused {

        Payment storage payment = _getPayment(paymentId);

        if (payment.status != PaymentStatus.Pending) revert InvalidStatus();
        if (block.timestamp < payment.expiresAt) revert PaymentNotExpired();

        // Effects
        payment.status = PaymentStatus.Released;

        uint256 amount = payment.amount;
        payment.amount = 0;

        // Interaction
        (bool success, ) = payable(payment.receiver).call{value: amount}("");

        if (!success) revert TransferFailed();

        emit PaymentReleased(
            paymentId,
            payment.receiver,
            amount
        );
    }

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY CONTROLS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Pauses new payment creation and releases.
     * @dev Reclaiming stays available so users can always recover deposited
     *      funds. Only callable by the owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resumes normal operation.
     * @dev Only callable by the owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns payment details.
     * @param paymentId The payment ID.
     */
    function getPayment(
        uint256 paymentId
    )
        external
        view
        returns (
            address sender,
            address receiver,
            uint256 amount,
            uint256 createdAt,
            uint256 expiresAt,
            PaymentStatus status
        )
    {
        Payment storage payment = _getPayment(paymentId);

        return (
            payment.sender,
            payment.receiver,
            payment.amount,
            payment.createdAt,
            payment.expiresAt,
            payment.status
        );
    }

    /**
     * @notice Returns the remaining reclaim time in seconds.
     * @param paymentId The payment ID.
     * @return Remaining time in seconds.
     */
    function getTimeRemaining(
        uint256 paymentId
    ) external view returns (uint256) {

        Payment storage payment = _getPayment(paymentId);

        if (
            payment.status != PaymentStatus.Pending ||
            block.timestamp >= payment.expiresAt
        ) {
            return 0;
        }

        return payment.expiresAt - block.timestamp;
    }
}
