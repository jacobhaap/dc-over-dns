# Decentralized Content over DNS
Decentralized Content over DNS (**dc-over-dns** or **dcdns**) is a library that allows for using Domain Name System (DNS) `TXT` records as a method to associate decentralized content with domains, such as content identifiers and paths, blockchain wallet and contract addresses, and redirection to non-DNS domains. The library remains agnostic to specific content, address, or domain protocols, and does not provide any resolution service for decentralized content identified from records. Instead, the library offers a DNS lookup function with validation of the data from the `TXT` record to ensure it meets the specification included in this README.

## Record Specification
There are a number of components in a `TXT` record for **dc-over-dns** that are used to properly communicate information about the content contained by the record and to prevent conflicting or problematic data.

| example.com | Record Type | Value | Recommended TTL |
|--|--|--|--|
| _dcdns | TXT | dc=hybrid; addr=/eth/0x0000000000000000000000000000000000000000; cont=/ipfs/QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH | 60 |
| _dcdns.eth | TXT | dc=address; addr=/eth/0x0000000000000000000000000000000000000000 | 60 |
| _dcdns.ipfs | TXT | dc=content; cont=/ipfs/QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH | 60 |
| _dcdns.ens | TXT | dc=redirect; redir=/ens/ethereum.eth | 60 |

### Components
 - **`dc=`**: The `dc=` component of a record (dc for decentralized content) is used to specify a type of content or behavior the domain is associated with so that it may be properly handled by users of the library. This has four possible values: `address`, `content`, `hybrid`, and `redirect`.
	 - **`address`**: The `address` type for `dc=` indicates the record value supports a blockchain wallet or contract address so that the domain can be used as an alias for the address. For example, the domains `example.com` with `dc=` type `address` can be used as an alias of an Ethereum wallet address. This allows the domain to act as a mutable pointer for an address.
	 - **`content`**: The `content` type for `dc=` indicates the record value supports content identifiers/content hashes for decentralized content sources. For example, a viable value in this record is a content identifier (CID) for the InterPlanetary File System (IPFS).
	 - **`hybrid`**: The `hybrid` type for `dc=` indicates the record value supports both address and decentralized content data as a hybrid of the previously described `address` and `content` types.
	 - **`redirect`**: The `redirect` type for `dc=` indicates the record supports data for the redirection to a non-DNS domain. For example, the record can indicate that `example.com` is to redirect to the Ethereum Name Service (ENS) domain `example.eth`.
- **`addr=`**: The `addr=` component of a record is used to specify the value for an address the domain acts as a mutable pointer for when the `dc=` type is either `address` or `hybrid`.
- **`cont=`**: The `cont=` component of a record is used to specify the value for a decentralized content source the domain points to when the `dc=` type is either `content` or `hybrid`.
- **`redir=`**: The `redir=` component of a record is used to specify the value for a non-DNS domain the domain is to redirect to when the `dc=` type is `redirect`.

### Validation
The `validateTxtRecord` function from the `dnsLookup.js` module is designed to validate the structure and content of the `TXT` record data, ensuring that the records comply with the specification. Within the validation, a common format for the content values (the value for the `addr=`, `cont=`, and `redir=` components) is enforced, where the expected format of a content value is `/{protocol}/{content}`. As part of remaining protocol agnostic, no checks of a valid protocol or valid content are performed, only validation for adherence for the protocol-content pairing format as previously described. This allows for any protocol and any content to be accepted.
- **`dc=` Validation**: The first validation step is ensuring the presence of a `dc=` component, which is required for defining the type of decentralized content the record is meant to handle. If `dc=` does not contain an acceptable value (a type that is not `address`, `content`, `hybrid`, or `redirect`), or does not exist at all, the domain will be rejected for failed validation. If the `dc=` validation check passes, the context of the resolved `dc=` type is used to determine the remaining validation checks.
- **Protocol Duplication Check**: For the `dc=` types allowing for `addr=` or `cont=` components, multiple `addr=` or `cont=` values may be passed, as long as they use unique protocols. For example, a record with `dc=` type `address` can support multiple `addr=` components (in this example, two), as long as a protocol is not repeated. If the two addresses are a Bitcoin address and an Ethereum address, recorded as `addr=/btc/{btc-address}; addr=/eth/{eth-address}`, this would pass validation since there is no duplicate appearance of the protocol in the protocol-content pairing. If instead the record contained something such as two Solana addresses, recorded as `addr=/sol/{address-1}; addr=/sol/{address-2}`, this would fail validation for the duplicate appearance of `sol` in the protocol position.
- **Content and Address Restrictions**: Depending on the `dc=` type, there are restrictions on the presence of `addr=` and `cont=` components in a record. Non-compliance with these restrictions will result in a rejection.
	- If the `dc=` type is `address`, the record cannot contain any `cont=` components, as this is solely intended for blockchain addresses.
	- If the `dc=` type is `content`, the record cannot include any `addr=` components, as this is solely intended for serving decentralized content sources.
	- For `hybrid` types, these restrictions do not apply, allowing for a mix of address and content components in the record.
- **`redir=` Component Validation**: When the `dc=` type of a record is `redirect`, this validation step ensures that there is exactly one `redir=` component present in the record. Additionally, the record cannot contain any `addr=` or `cont=` components, as the `redirect` type is incompatible with direct references to addresses or content.
- **Exclusivity of `redir=`**: If the `dc=` type is anything other than `redirect`, the presence of any `redir=` component is deemed invalid, which will result in a rejection. This rule maintains the exclusivity of the redirection functionality to the `redirect` type to prevent any confusion or misconfiguration.

## Usage
To utilize this library, install it via `npm i dc-over-dns`. Two imports are supported, `dcDNS` for the record resolution, and `configureResolver` to set a DNS resolver other than the default resolver. The `dcDNS` function supports two methods, `resolve`, which returns the resolved data in plaintext separated by commas and spaces, and `jsonResolve`, which returns the resolved data as a JSON object.

### Example Usage for `dcDNS.resolve`
```javascript
// This sample does not use configureResolver
const { dcDNS } = require('dc-over-dns');
    
dcDNS.resolve('example.com').then(value  => {
    console.log(value);
    });
```

This will return plaintext output, as seen in the following examples:
- _Example 1_, Ethereum Address: `/eth/0x0000000000000000000000000000000000000000`
- _Example 2_, IPFS CID: `/ipfs/QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH`
- _Example 3_, Redirect Domain: `/ens/ethereum.eth`

### Example Usage for `dcDNS.jsonResolve`

```javascript
// This sample uses configureResolver 
const { dcDNS, configureResolver } = require('dc-over-dns');
    
configureResolver(['8.8.8.8']);
    
dcDNS.jsonResolve('example.com').then(value  => {
    console.log(value);
    });
```

This will return a JSON object, as seen in the following examples:

_Example 1_, `dc=address`.
```json
{
  "type": "_dcdns.address",
  "protocol": "eth",
  "content": "0x0000000000000000000000000000000000000000"
}
```

_Example 2_, `dc=content`.
```json
{
  "type": "_dcdns.content",
  "protocol": "ipfs",
  "content": "QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH"
}
```

_Example 3_, `dc=hybrid`.
```json
{
  "type": "_dcdns.hybrid",
  "contents": [
    {
      "protocol": "eth",
      "content": "0x0000000000000000000000000000000000000000"
    },
    {
      "protocol": "ipfs",
      "content": "QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH"
    }
  ]
}
```

_Example 4_, `dc=redirect`.
```json
{
  "type": "_dcdns.redirect",
  "redirect": {
    "protocol": "ens",
    "name": "ethereum.eth"
  }
}
```

