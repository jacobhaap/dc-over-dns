const { getValueFromRecord } = require('./resolve');

const dcDNS = {
    resolve: function(domain) {
        return getValueFromRecord(domain);
    }
};

module.exports = { dcDNS };
