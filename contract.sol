pragma solidity ^0.4.0;

contract Keychain {
    struct Key {
        uint addDate;
        uint removeDate;
    }

    // Owner address
    address public owner;

    // Minimal balance to allow withdraw
    mapping(address => mapping(bytes32 => Key)) keys;

    event KeyAdded(address indexed from, bytes32 key);
    event KeyRemoved(address indexed from, bytes32 key);

    function Keychain() public {
        owner = msg.sender;
    }

    // Payable method wich allows to send coins to a contract balance
    function addKey(bytes32 _key) public {
        Key storage key = keys[msg.sender][_key];
        require(key.addDate == 0);

        keys[msg.sender][_key].addDate = now;
        KeyAdded(msg.sender, _key);
    }

    function removeKey(bytes32 _key) public {
        Key storage key = keys[msg.sender][_key];
        require(key.addDate != 0);
        require(key.removeDate == 0);

        keys[msg.sender][_key].removeDate = now;
        KeyRemoved(msg.sender, _key);
    }

    function getKeyAddDate(address _owner, bytes32 _key) public constant returns(uint) {
        return keys[_owner][_key].addDate;
    }

    function getKeyRemoveDate(address _owner, bytes32 _key) public constant returns(uint) {
        return keys[_owner][_key].removeDate;
    }

    function isActiveNow(address _owner, bytes32 _key) public constant returns(bool) {
        Key storage key = keys[_owner][_key];

        return key.addDate > 0 && key.removeDate == 0;
    }

    function isActiveAt(address _owner, bytes32 _key, uint time) public constant returns(bool) {
        Key storage key = keys[_owner][_key];

        return key.addDate > 0 && key.addDate < time && key.removeDate == 0 || key.removeDate > time;
    }
}
