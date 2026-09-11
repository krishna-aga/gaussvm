// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import { ReentrancyGuard } from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

contract OutcomeToken is ERC20 {
    address public immutable market;
    error OnlyMarket();
    constructor(string memory label, string memory ticker) ERC20(label, ticker) { market = msg.sender; }
    function mint(address to, uint256 amount) external {
        if (msg.sender != market) revert OnlyMarket();
        _mint(to, amount);
    }
    function burn(address from, uint256 amount) external {
        if (msg.sender != market) revert OnlyMarket();
        _burn(from, amount);
    }
}

/// @notice Fully collateralized demo outcomes; explicit manual resolver and public timeout cancellation.
contract BinaryMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;
    enum Status { Open, Yes, No, Cancelled }
    IERC20 public immutable collateral;
    OutcomeToken public immutable yes;
    OutcomeToken public immutable no;
    address public immutable resolver;
    uint64 public immutable expiry;
    uint64 public constant RESOLUTION_GRACE = 1 days;
    string public question;
    Status public status;
    error InvalidMarket();
    error MarketClosed();
    error ResolutionNotAllowed();
    error ZeroAmount();
    event Split(address indexed account, uint256 amount);
    event Merged(address indexed account, uint256 amount);
    event Resolved(Status outcome);
    event Redeemed(address indexed account, uint256 yesAmount, uint256 noAmount, uint256 collateralAmount);

    constructor(address collateral_, address resolver_, uint64 expiry_, string memory question_) {
        if (collateral_ == address(0) || resolver_ == address(0) || expiry_ <= block.timestamp || bytes(question_).length == 0) revert InvalidMarket();
        collateral = IERC20(collateral_); resolver = resolver_; expiry = expiry_; question = question_;
        yes = new OutcomeToken('GaussVM YES outcome', 'YES');
        no = new OutcomeToken('GaussVM NO outcome', 'NO');
    }

    function split(uint256 amount) external nonReentrant {
        if (status != Status.Open || block.timestamp >= expiry) revert MarketClosed();
        if (amount == 0) revert ZeroAmount();
        uint256 beforeBalance = collateral.balanceOf(address(this));
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        if (collateral.balanceOf(address(this)) != beforeBalance + amount) revert InvalidMarket();
        yes.mint(msg.sender, amount); no.mint(msg.sender, amount);
        emit Split(msg.sender, amount);
    }
    function merge(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        yes.burn(msg.sender, amount); no.burn(msg.sender, amount);
        collateral.safeTransfer(msg.sender, amount);
        emit Merged(msg.sender, amount);
    }
    function resolve(bool outcome) external {
        if (msg.sender != resolver || status != Status.Open || block.timestamp < expiry || block.timestamp >= expiry + RESOLUTION_GRACE) revert ResolutionNotAllowed();
        status = outcome ? Status.Yes : Status.No;
        emit Resolved(status);
    }
    function cancelUnresolved() external {
        if (status != Status.Open || block.timestamp < expiry + RESOLUTION_GRACE) revert ResolutionNotAllowed();
        status = Status.Cancelled;
        emit Resolved(status);
    }
    function redeem(uint256 yesAmount, uint256 noAmount) external nonReentrant returns (uint256 payout) {
        if (status == Status.Open) revert MarketClosed();
        if (yesAmount == 0 && noAmount == 0) revert ZeroAmount();
        // Each side is worth half on cancellation. Floor rounding leaves at most one wei per call.
        payout = status == Status.Yes ? yesAmount : status == Status.No ? noAmount : (yesAmount + noAmount) / 2;
        if (yesAmount != 0) yes.burn(msg.sender, yesAmount);
        if (noAmount != 0) no.burn(msg.sender, noAmount);
        collateral.safeTransfer(msg.sender, payout);
        emit Redeemed(msg.sender, yesAmount, noAmount, payout);
    }
}
