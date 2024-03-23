const { getValueFromRecord } = require('./resolve');
const { getJsonValueFromRecord } = require('./jsonResolve');
const { setResolver } = require('./dnsLookup');

const dcDNS = {
    resolve: function(domain) {
        return getValueFromRecord(domain);
    },
    jsonResolve: function(domain) {
        return getJsonValueFromRecord(domain);
    }
};

function configureResolver(servers) {
    if (Array.isArray(servers)) {
        setResolver(servers);
    } else {
        throw new Error('configureResolver Error: Address array expected');
    }
}

module.exports = { dcDNS, configureResolver };