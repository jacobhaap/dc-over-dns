# Decentralized Content over DNS
Decentralized Content over DNS (**dc-over-dns** or **dcdns**) is a basic concept for using DNS `txt` records to point domains to decentralized content sources or addresses, such as IPFS Content Identifiers, and Ethereum Addresses.

| example.com | record type | value |
|--|--|--|
| _dcdns | txt | dc=hybrid; cont=/ipfs/QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH; addr=/eth/0x0000000000000000000000000000000000000000 |

This repository contains a basic library that accepts a domain as input, validates the `txt` record, and returns the content/address values. For example, the domain `example.com` can be passed, where the library will locate the `txt` record on `_dcdns.example.com`, validates the format of the record, and returns the value. This also works on subdomains, where for `sub.example.com`, a `txt` record on `_dcdns.sub.example.com` will validate the record and return the value.

This library does not focus on a specific type of address to accept, or a specific content type, and does not provide methods for resolving any content records. For example, while this library can allow you to find a record of an IPFS CID on a traditional DNS domain, it does not provide resolution of the IPFS content itself or a gateway to access content.

The data returned by default will directly return the `cont` or `addr` value(s) corresponding to the record by calling `dcDNS.resolve`. Alternatively, the data can be returned in a JSON object, using `dcDNS.jsonResolve`.

## Usage
Install with `npm i dc-over-dns`, and then import with `const { dcDNS } =  require('dc-over-dns');`.

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
