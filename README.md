## Decentralized Content over DNS
Decentralized Content over DNS (**dc-over-dns** or **dcdns**) is a basic concept for using DNS `txt` records to point domains to decentralized content sources or addresses, such as IPFS Content Identifiers, and Ethereum Wallet Addresses.

| example.com | record type | value |
|--|--|--|
| _dcdns | txt | dc=hybrid; cont=/ipfs/QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH; addr=/eth/0x0000000000000000000000000000000000000000 |

This repository contains a basic library that accepts a domain as input, validates the `txt` record, and returns the content/address values. For example, the domain `example.com` can be passed, where the library will locate the `txt` record on `_dcdns.example.com` and validates the format of the record value, and returns the value.
