# Decentralized Content over DNS
Decentralized Content over DNS (**dc-over-dns** or **dcdns**) is a concept for using DNS `txt` records to point domains to decentralized content sources or addresses, such as IPFS Content Identifiers, and Ethereum Addresses.

| example.com | record type | value |
|--|--|--|
| _dcdns | txt | dc=hybrid; cont=/ipfs/QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH; addr=/eth/0x0000000000000000000000000000000000000000 |

The key components of the `txt` record are:
- `dc`: Specifies the type of the record, which can be `content`, `address`, or `hybrid`. `content` is limited to accepting `cont`, `address` is limited to accepting `addr`, while `hybrid` may accept both. Multiple `cont` or `addr` values may be passed, granted that they do not use the same protocol.
- `cont`: Points to decentralized content, such as IPFS or Arweave.
- `addr`: Points to addresses, such as an Ethereum address or Bitcoin wallet address.

Both `cont` and `addr` must follow the same formatting for their values, the format being `/{protocol}/{content}`.

This repository contains a basic library that accepts a domain as input, validates the `txt` record, and returns the content/address values. For example, the domain `example.com` can be passed, where the library will locate the `txt` record on `_dcdns.example.com`, validates the format of the record, and returns the value. This also works on subdomains, where for `sub.example.com`, a `txt` record on `_dcdns.sub.example.com` will validate the record and return the value.

The library remains agnostic to specific address or content types and does not offer resolution services for the content records identified. For example, while it enables the discovery of an IPFS CID linked to a traditional DNS domain, it does not resolve the IPFS content or provide access to it. 

By default, the `dcDNS.resolve` function directly returns the `cont` or `addr` value(s) found within the record. Alternatively, `dcDNS.jsonResolve` can return the data in a structured JSON format.

## Usage
To utilize this library, install it via `npm i dc-over-dns`, and then import it using `const { dcDNS } =  require('dc-over-dns');`.

### Example Usage for `dcDNS.resolve`:

    const { dcDNS } =  require('dc-over-dns');
    
    dcDNS.resolve('example.com').then(value  => {
    console.log(value);
    });

**This will return the default output as seen in the following examples:**

_Example 1_, Ethereum Address: `/eth/0x0000000000000000000000000000000000000000`

_Example 2_, IPFS CID: `/ipfs/QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH`

### Example Usage for `dcDNS.jsonResolve`:

    const { dcDNS } =  require('dc-over-dns');
    
    dcDNS.jsonResolve('example.com').then(value  => {
    console.log(value);
    });

**This will return the JSON object format, as seen in the following examples:**

_Example 1_, `dc=address`.

    {
    "type": "_dcdns.address",
    "protocol": "eth",
    "content": "0x0000000000000000000000000000000000000000"
    }

_Example 2_, `dc=content`.

    {
    "type": "_dcdns.content",
    "protocol": "ipfs",
    "content": "QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH"
    }

_Example 3_, `dc=hybrid`.

    {
    "type": "_dcdns.hybrid",
    "contents": [
        {
        "protocol": "eth",
        "content": "0x0000000000000000000000000000000000000000"
        },
        {
        "protocol": "ipns",
        "content": "QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH"
        }
    ]
    }
