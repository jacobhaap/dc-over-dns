const fetchDNSTxtRecord = require('./dnsLookup');

async function checkDNSTxtRecord(domain) {
    const txtRecords = await fetchDNSTxtRecord(domain);
    if (txtRecords === null) {
        return null;
    }
    return parseTxtRecord(txtRecords);
}

function parseTxtRecord(txtRecord) {
    const parts = txtRecord.split(';').map(part => part.trim());
    const dcPart = parts.find(part => part.startsWith('dc='));
    if (!dcPart) return null;

    const dcValue = dcPart.substring(3);
    let result = {
        type: `_dcdns.${dcValue}`
    };

    const addrOrContParts = parts.filter(part => part.startsWith('addr=') || part.startsWith('cont='));

    if (addrOrContParts.length > 0) {
        result.contents = addrOrContParts.map(part => {
            const [, protocol, content] = part.split(/\/+/);
            return { protocol, content };
        });
    }

    return result;
}

exports.getJsonValueFromRecord = async (domain) => {
    const parsedRecord = await checkDNSTxtRecord(domain);
    if (!parsedRecord) return null;

    return JSON.stringify(parsedRecord, null, 2);
};
