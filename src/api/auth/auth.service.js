const crypto = require('crypto');
const models = require('../../models');
const AppError = require('../../common/error/error');
const { httpStatus } = require('../../common/error/http-status');

const authIvSecret = process.env.AUTH_IV_SECRET || '5180387877947babaac76447e441651d';
const authKeySecret = process.env.AUTH_KEY_SECRET || 'c8c27795ca5ffac0c863a407d5715fb6fe785fe7c6bdbda1fa7844b9d1536a53';

module.exports = {
    // --- for AUTHENTICATE
    validLocal: async function(credentials) {
        const info = await models.account.validateAccountCredentials(credentials);
        if (!info) {
            throw new AppError(
                httpStatus.UNAUTHORIZED,
                'Username or password is incorrect',
                true,
            );
        }
        // if account is inactive
        if ( !info.isActive ) {
            throw new AppError(
                httpStatus.METHOD_NOT_ALLOWED,
                'Account is inactive',
                true,
            );
        }
        // if account is locked
        if ( info.isLock) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                'Account is locked',
                true,
            );
        }
        return {
            account: {
                id: info.id,
                username: info.username,
                role: info.role,
            },
            token: '',
            exprires: '',
        };
    },

    // --- for TOKEN
    createTk: function (dataNotEncrypt) {
        const keyBuffer = Buffer.from(authKeySecret, 'hex');
        const ivBuffer = Buffer.from(authIvSecret, 'hex');
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(keyBuffer), ivBuffer);
        let encrypted = cipher.update(dataNotEncrypt);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('hex');
    },
    getTk: async function (token) {
        const keyBuffer = Buffer.from(authKeySecret, 'hex');
        const ivBuffer = Buffer.from(authIvSecret, 'hex');
        const encryptedText = Buffer.from(token, 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(keyBuffer), ivBuffer);
        let decrypted;
        try {
            decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
        } catch (error) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'Token của bạn không hợp lệ!',
                true,
            )
        }
        return decrypted.toString();
    },

    // --- SUPPORT -------------------------------

};
