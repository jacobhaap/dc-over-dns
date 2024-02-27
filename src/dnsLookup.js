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
            console.error(`Failure: Unable to resolve TXT records for ${fullDomain} with default resolver`, error);
            return null;
        }
    };

    if (customResolver) {
        try {
            return await resolveWithCustomResolver();
        } catch (error) {
            console.error(`Failure: Unable to resolve TXT records for ${fullDomain} with configured resolver`, error);
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
        console.error('Rejection: Missing "dc=" in TXT record');
        return false;
    }

    const dcValue = dcPart.substring(3);
    if (!['address', 'content', 'hybrid', 'redirect'].includes(dcValue)) {
        console.error(`Rejection: Invalid "dc=" value: "${dcValue}"`);
        return false;
    }

    const protocols = new Set();

    for (const part of parts) {
        if (part.startsWith('addr=') || part.startsWith('cont=')) {
            if (dcValue === 'redirect') {
                console.error('Rejection: "dc=" type "redirect" cannot include "addr=" or "cont=" values');
                return false;
            }
            const [, protocol] = part.split('/');
            if (protocols.has(protocol)) {
                console.error(`Rejection: Duplicate protocol "${protocol}" in ${part.startsWith('addr=') ? "addr=" : "cont="} value`);
                return false;
            }
            protocols.add(protocol);
        }
    }

    const addrParts = parts.filter(part => part.startsWith('addr='));
    const contParts = parts.filter(part => part.startsWith('cont='));
    const redirParts = parts.filter(part => part.startsWith('redir='));

    if (dcValue === 'address' && contParts.length > 0 || dcValue === 'content' && addrParts.length > 0) {
        console.error(`Rejection: Invalid content for "dc=" type "${dcValue}"`);
        return false;
    }

    if (dcValue === 'redirect') {
        if (redirParts.length !== 1) {
            console.error('Rejection: "dc=" type "redirect" cannot exceed more than one "redir=" value');
            return false;
        }
        if (addrParts.length > 0 || contParts.length > 0) {
            console.error('Rejection: "dc=" type "redirect" cannot include "addr=" or "cont=" values');
            return false;
        }
    } else {
        if (redirParts.length > 0) {
            console.error('Rejection: Value "redir=" is exclusive to "dc=" type "redirect"');
            return false;
        }
    }

    return true;
}

module.exports = { fetchDNSTxtRecord, setResolver };
