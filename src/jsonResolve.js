const fetchDNSTxtRecord = require('./dnsLookup');

async function checkDNSTxtRecord(domain) {
    const txtRecords = await fetchDNSTxtRecord(domain);
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
        if (dcValue === 'hybrid') {
            result.contents = addrOrContParts.map(part => {
                const [, protocol, content] = part.split(/\/+/);
                return { 'protocol': protocol, 'content': content };
            });
        } else {
            const [, protocol, content] = addrOrContParts[0].split(/\/+/);
            if (protocol && content) {
                result['protocol'] = protocol;
                result['content'] = content;
            }
        }
    }

    return result;
}

exports.getJsonValueFromRecord = async (domain) => {
    const parsedRecord = await checkDNSTxtRecord(domain);
    if (!parsedRecord) return JSON.stringify({ error: 'Record not found or could not be parsed' });

    return JSON.stringify(parsedRecord, null, 2);
};
