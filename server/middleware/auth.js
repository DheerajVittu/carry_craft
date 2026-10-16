
const jwt = require('jsonwebtoken')

function requireCustomer(req, res, next) {
    const authorization = req.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Please log in to access your cart.'
        })
    }

    const token = authorization.slice(7)

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (decoded.role !== 'customer') {
            return res.status(403).json({
                message: 'Only customers can access this cart.'
            })
        }

        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired login session. Please log in again.'
        })
    }
}

module.exports = requireCustomer
