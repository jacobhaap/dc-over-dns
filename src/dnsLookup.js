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
            throw new Error(`Failure: Unable to resolve TXT records for ${fullDomain} with default resolver`, error);
        }
    };

    if (customResolver) {
        try {
            return await resolveWithCustomResolver();
        } catch (error) {
            throw new Error(`Failure: Unable to resolve TXT records for ${fullDomain} with configured resolver`, error);
        }
    } else {
        return await resolveWithDefaultResolver();
    }
}

function validateTxtRecord(txtRecord) {
    const parts = txtRecord.split(';').map(part => part.trim());
    const dcPart = parts.find(part => part.startsWith('dc='));
    if (!dcPart) {
        throw new Error('Rejection: Missing "dc=" in TXT record');
    }

    const dcValue = dcPart.substring(3);
    if (!['address', 'content', 'hybrid', 'redirect'].includes(dcValue)) {
        throw new Error(`Rejection: Invalid "dc=" value: "${dcValue}"`);
    }

    const protocols = new Set();

    for (const part of parts) {
        if (part.startsWith('addr=') || part.startsWith('cont=')) {
            if (dcValue === 'redirect') {
                throw new Error('Rejection: "dc=" type "redirect" cannot include "addr=" or "cont=" values');
            }
            const [, protocol] = part.split('/');
            if (protocols.has(protocol)) {
                throw new Error(`Rejection: Duplicate protocol "${protocol}" in ${part.startsWith('addr=') ? "addr=" : "cont="} value`);
            }
            protocols.add(protocol);
        }
    }

    const addrParts = parts.filter(part => part.startsWith('addr='));
    const contParts = parts.filter(part => part.startsWith('cont='));
    const redirParts = parts.filter(part => part.startsWith('redir='));

    if (dcValue === 'address' && contParts.length > 0 || dcValue === 'content' && addrParts.length > 0) {
        throw new Error(`Rejection: Invalid content for "dc=" type "${dcValue}"`);
    }

    if (dcValue === 'redirect') {
        if (redirParts.length !== 1) {
            throw new Error('Rejection: "dc=" type "redirect" cannot exceed more than one "redir=" value');
        }
        if (addrParts.length > 0 || contParts.length > 0) {
            throw new Error('Rejection: "dc=" type "redirect" cannot include "addr=" or "cont=" values');
        }
    } else {
        if (redirParts.length > 0) {
            throw new Error('Rejection: Value "redir=" is exclusive to "dc=" type "redirect"');
        }
    }

    return true;
}

module.exports = { fetchDNSTxtRecord, setResolver };
