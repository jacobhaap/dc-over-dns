const dns = require('dns').promises;
const { Resolver } = require('dns');

let customResolver = null;

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

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
                    reject(new Error(`Failure: Unable to resolve TXT records for ${fullDomain} with configured resolver, ${err.message}`));
                } else {
                    try {
                        const txtRecords = records.flat().join(';');
                        if (!validateTxtRecord(txtRecords)) {
                            resolve(null);
                        } else {
                            resolve(txtRecords);
                        }
                    } catch (validationError) {
                        reject(validationError);
                    }
                }
            });
        });
    };

    const resolveWithDefaultResolver = async () => {
        const records = await dns.resolveTxt(fullDomain);
        const txtRecords = records.flat().join(';');
        if (!validateTxtRecord(txtRecords)) {
            return null;
        }
        return txtRecords;
    };

    if (customResolver) {
        return await resolveWithCustomResolver();
    } else {
        try {
            return await resolveWithDefaultResolver();
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new Error(`Failure: Unable to resolve TXT records for ${fullDomain} with default resolver, ${error.message}`);
        }
    }
}

function validateTxtRecord(txtRecord) {
    const parts = txtRecord.split(';').map(part => part.trim());
    const dcPart = parts.find(part => part.startsWith('dc='));
    if (!dcPart) {
        throw new ValidationError('Rejection: Missing "dc=" in TXT record');
    }

    const dcValue = dcPart.substring(3);
    if (!['address', 'content', 'hybrid', 'redirect'].includes(dcValue)) {
        throw new ValidationError(`Rejection: Invalid "dc=" value: "${dcValue}"`);
    }

    const protocols = new Set();

    for (const part of parts) {
        if (part.startsWith('addr=') || part.startsWith('cont=')) {
            if (dcValue === 'redirect') {
                throw new ValidationError('Rejection: "dc=" type "redirect" cannot include "addr=" or "cont=" values');
            }
            const [, protocol] = part.split('/');
            if (protocols.has(protocol)) {
                throw new ValidationError(`Rejection: Duplicate protocol "${protocol}" in ${part.startsWith('addr=') ? "addr=" : "cont="} value`);
            }
            protocols.add(protocol);
        }
    }

    const addrParts = parts.filter(part => part.startsWith('addr='));
    const contParts = parts.filter(part => part.startsWith('cont='));
    const redirParts = parts.filter(part => part.startsWith('redir='));

    if (dcValue === 'address' && contParts.length > 0 || dcValue === 'content' && addrParts.length > 0) {
        throw new ValidationError(`Rejection: Invalid content for "dc=" type "${dcValue}"`);
    }

    if (dcValue === 'redirect') {
        if (redirParts.length !== 1) {
            throw new ValidationError('Rejection: "dc=" type "redirect" must have exactly one "redir=" value');
        }
        if (addrParts.length > 0 || contParts.length > 0) {
            throw new ValidationError('Rejection: "dc=" type "redirect" cannot include "addr=" or "cont=" values');
        }
    } else {
        if (redirParts.length > 0) {
            throw new ValidationError('Rejection: Value "redir=" is exclusive to "dc=" type "redirect"');
        }
    }

    return true;
}

module.exports = { fetchDNSTxtRecord, setResolver };
