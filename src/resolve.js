const { fetchDNSTxtRecord } = require('./dnsLookup');

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
    let result = { dc: dcValue };

    if (dcValue === 'address' || dcValue === 'hybrid') {
        const addrParts = parts.filter(part => part.startsWith('addr=')).map(part => part.substring(5));
        if (addrParts.length) result.addr = addrParts.join(', ');
    }

    if (dcValue === 'content' || dcValue === 'hybrid') {
        const contParts = parts.filter(part => part.startsWith('cont=')).map(part => part.substring(5));
        if (contParts.length) result.cont = contParts.join(', ');
    }

    return result;
}

function getValue(parsedRecord) {
    if (!parsedRecord) return null;

    let values = [];
    if (parsedRecord.addr) values.push(parsedRecord.addr);
    if (parsedRecord.cont) values.push(parsedRecord.cont);

    return values.join(', ');
}

exports.getValueFromRecord = async (domain) => {
    const parsedRecord = await checkDNSTxtRecord(domain);
    return getValue(parsedRecord);
};
