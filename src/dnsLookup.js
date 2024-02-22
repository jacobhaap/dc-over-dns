const dns = require('dns').promises;

async function fetchDNSTxtRecord(domain) {
    const prefix = '_dcdns';
    const fullDomain = `${prefix}.${domain}`;
    try {
        const records = await dns.resolveTxt(fullDomain);
        const txtRecords = records.flat().join(';');
        return txtRecords;
    } catch (error) {
        console.error(`Failed to resolve TXT records for ${fullDomain}:`, error);
        return null;
    }
}

module.exports = fetchDNSTxtRecord;
