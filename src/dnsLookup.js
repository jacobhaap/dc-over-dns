const dns = require('dns').promises;
const { Resolver } = require('dns');

let customResolver = null;

function setResolver(servers) {
    if (Array.isArray(servers) && servers.length > 0) {
        customResolver = new Resolver();
        customResolver.setServers(servers);
    } else {
        customResolver = null;
    }
}

async function fetchDNSTxtRecord(domain) {
    const prefix = '_dcdns';
    const fullDomain = `${prefix}.${domain}`;

    const resolveWithCustomResolver = () => {
        return new Promise((resolve, reject) => {
            customResolver.resolveTxt(fullDomain, (err, records) => {
                if (err) {
                    reject(err);
                } else {
                    const txtRecords = records.flat().join(';');
                    if (!validateTxtRecord(txtRecords)) {
                        resolve(null);
                    } else {
                        resolve(txtRecords);
                    }
                }
            });
        });
    };

    const resolveWithDefaultResolver = async () => {
        try {
            const records = await dns.resolveTxt(fullDomain);
            const txtRecords = records.flat().join(';');
            if (!validateTxtRecord(txtRecords)) {
                return null;
            }
            return txtRecords;
        } catch (error) {
            console.error(`Failed to resolve TXT records for ${fullDomain} using default resolver:`, error);
            return null;
        }
    };

    if (customResolver) {
        try {
            return await resolveWithCustomResolver();
        } catch (error) {
            console.error(`Failed to resolve TXT records for ${fullDomain} using custom resolver:`, error);
            return null;
        }
    } else {
        return await resolveWithDefaultResolver();
    }
}

function validateTxtRecord(txtRecord) {
    const parts = txtRecord.split(';').map(part => part.trim());
    const dcPart = parts.find(part => part.startsWith('dc='));
    if (!dcPart) {
        console.error('Missing "dc=" in TXT record');
        return false;
    }

    const dcValue = dcPart.substring(3);
    if (!['address', 'content', 'hybrid'].includes(dcValue)) {
        console.error(`Invalid "dc=" value: ${dcValue}`);
        return false;
    }

    const protocols = new Set();

    for (const part of parts) {
        if (part.startsWith('addr=') || part.startsWith('cont=')) {
            const [, protocol] = part.split('/');
            if (protocols.has(protocol)) {
                console.error(`Duplicate protocol found: ${protocol} in ${part.startsWith('addr=') ? 'addr' : 'cont'}`);
                return false;
            }
            protocols.add(protocol);
        }
    }

    const addrParts = parts.filter(part => part.startsWith('addr='));
    const contParts = parts.filter(part => part.startsWith('cont='));

    if (dcValue === 'address' && contParts.length > 0 || dcValue === 'content' && addrParts.length > 0) {
        console.error(`Invalid content for "dc=" type ${dcValue}`);
        return false;
    }

    return true;
}

module.exports = { fetchDNSTxtRecord, setResolver };
