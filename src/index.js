const { getValueFromRecord } = require('./resolve');
const { getJsonValueFromRecord } = require('./jsonResolve');

const dcDNS = {
    resolve: function(domain) {
        return getValueFromRecord(domain);
    },
    jsonResolve: function(domain) {
        return getJsonValueFromRecord(domain);
    }
};

module.exports = { dcDNS };
