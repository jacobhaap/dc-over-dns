const { getValueFromRecord } = require('./dnsCheck');

function dcDNS(domain) {
    return getValueFromRecord(domain);
}

module.exports = { dcDNS };