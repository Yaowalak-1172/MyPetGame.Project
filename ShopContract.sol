
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ShopContract is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public petToken;

    struct Item {
        string name;
        uint256 price;
        bool exists;
    }

    // Item ID => Item information
    mapping(uint256 => Item) public items;

    // Buyer => Item ID => Has purchased
    mapping(address => mapping(uint256 => bool)) public hasPurchased;

    // Buyer => list of purchased item IDs
    mapping(address => uint256[]) private purchasedItems;

    event ItemPurchased(
        address indexed buyer,
        uint256 indexed itemId,
        uint256 price
    );

    event PetTokenUpdated(
        address indexed oldToken,
        address indexed newToken
    );

    event Withdrawn(
        address indexed recipient,
        uint256 amount
    );

    constructor(address _petTokenAddress) Ownable(msg.sender) {
        require(
            _petTokenAddress != address(0),
            "Invalid token address"
        );

        petToken = IERC20(_petTokenAddress);

        // Accessories
        items[1] = Item("Hat", 15 ether, true);
        items[2] = Item("Glasses", 10 ether, true);
        items[3] = Item("Ribbon", 15 ether, true);
        items[4] = Item("Hoodie", 25 ether, true);

        // Furniture
        items[5] = Item("Bed", 10 ether, true);
        items[6] = Item("Table", 5 ether, true);
        items[7] = Item("Frame", 5 ether, true);

        // Backgrounds - prices match the game UI
        items[8] = Item("Garden", 10 ether, true);
        items[9] = Item("Forest", 5 ether, true);
        items[10] = Item("Beach", 10 ether, true);
    }

    // Purchase an item using PET
    function buyItem(uint256 itemId) external {
        Item memory item = items[itemId];

        require(item.exists, "Item does not exist");
        require(
            !hasPurchased[msg.sender][itemId],
            "Item already purchased"
        );

        // Transfer PET from buyer to this contract
        petToken.safeTransferFrom(
            msg.sender,
            address(this),
            item.price
        );

        // Record the purchase on-chain
        hasPurchased[msg.sender][itemId] = true;
        purchasedItems[msg.sender].push(itemId);

        emit ItemPurchased(
            msg.sender,
            itemId,
            item.price
        );
    }

    // Get item information
    function getItem(uint256 itemId)
        external
        view
        returns (
            string memory name,
            uint256 price,
            bool exists
        )
    {
        Item memory item = items[itemId];

        return (
            item.name,
            item.price,
            item.exists
        );
    }

    // Get an item's price
    function getItemPrice(uint256 itemId)
        external
        view
        returns (uint256)
    {
        require(
            items[itemId].exists,
            "Item does not exist"
        );

        return items[itemId].price;
    }

    // Check whether a buyer has purchased an item
    function checkPurchased(
        address buyer,
        uint256 itemId
    ) external view returns (bool) {
        return hasPurchased[buyer][itemId];
    }

    // Get the number of items purchased by a buyer
    function getPurchasedItemCount(
        address buyer
    ) external view returns (uint256) {
        return purchasedItems[buyer].length;
    }

    // Get the purchased item ID at a given index
    function getPurchasedItemAt(
        address buyer,
        uint256 index
    ) external view returns (uint256) {
        require(
            index < purchasedItems[buyer].length,
            "Index out of bounds"
        );

        return purchasedItems[buyer][index];
    }

    // Allow owner to withdraw PET collected by the shop
    function withdrawPet(
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(
            recipient != address(0),
            "Invalid recipient"
        );

        require(
            amount > 0,
            "Amount must be greater than zero"
        );

        petToken.safeTransfer(recipient, amount);

        emit Withdrawn(recipient, amount);
    }

    // Allow owner to update the PET token address if necessary
    function setPetToken(
        address newTokenAddress
    ) external onlyOwner {
        require(
            newTokenAddress != address(0),
            "Invalid token address"
        );

        address oldTokenAddress = address(petToken);
        petToken = IERC20(newTokenAddress);

        emit PetTokenUpdated(
            oldTokenAddress,
            newTokenAddress
        );
    }
}
