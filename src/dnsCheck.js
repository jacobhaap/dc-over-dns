const dns = require('dns').promises;

async function checkDNSTxtRecord(domain) {
    const prefix = '_dcdns';
    const fullDomain = `${prefix}.${domain}`;
    try {
        const records = await dns.resolveTxt(fullDomain);
        const txtRecords = records.flat().join(';');
        return parseTxtRecord(txtRecords);
    } catch (error) {
        console.error(`Failed to resolve TXT records for ${fullDomain}:`, error);
        return null;
    }
}

function parseTxtRecord(txtRecord) {
    const parts = txtRecord.split(';').map(part => part.trim());
    const dcPart = parts.find(part => part.startsWith('dc='));
    if (!dcPart) return null;

    const dcValue = dcPart.substring(3);
    let result = { dc: dcValue };

    if (dcValue === 'address' || dcValue === 'hybrid') {
        const addrPart = parts.find(part => part.startsWith('addr='));
        if (addrPart) result.addr = addrPart.substring(5);
    }

    if (dcValue === 'content' || dcValue === 'hybrid') {
        const contPart = parts.find(part => part.startsWith('cont='));
        if (contPart) result.cont = contPart.substring(5);
    }

    return result;
}

function getValue(parsedRecord) {
    if (!parsedRecord) return 'Record not found or could not be parsed';

    let values = [];
    if (parsedRecord.addr) values.push(parsedRecord.addr);
    if (parsedRecord.cont) values.push(parsedRecord.cont);

    return values.join(', ');
}

exports.checkDNSTxtRecord = checkDNSTxtRecord;
exports.getValueFromRecord = async (domain) => {
    const parsedRecord = await checkDNSTxtRecord(domain);
    return getValue(parsedRecord);
};
