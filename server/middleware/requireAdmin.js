
const jwt = require('jsonwebtoken')

function requireAdmin(req, res, next) {
    const authorization = req.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Admin authentication required.',
        })
    }

    const token = authorization.slice(7)

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (decoded.role !== 'admin' || !decoded.id) {
            return res.status(403).json({
                message: 'Admin access only.',
            })
        }

        req.user = decoded
        next()
    } catch {
        return res.status(401).json({
            message: 'Invalid or expired login session. Please log in again.',
        })
    }
}

module.exports = requireAdmin
