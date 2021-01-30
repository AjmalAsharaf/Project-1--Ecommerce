var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
var objId = require('mongodb').ObjectID

const moment=require('moment')

const { ObjectID, ObjectId } = require('mongodb')
const { response } = require('express')

const Razorpay = require('razorpay')
const { resolve } = require('path')

var instance = new Razorpay({
    key_id: 'rzp_test_PsmupTEePvHbkM',
    key_secret: 'lo61AtQi3r6jAwcgaxtdwT5k',
});

module.exports = {
    doSignup: function (userData) {
        let response = { status: true }
        return new Promise(async (resolve, reject) => {
            let email = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (email) {
                response.status = false
                reject(response)
            } else {
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne({
                    name: userData.name,
                    email: userData.email,
                    password: userData.password,

                    admin: false,
                    block: false
                })
                response.user = userData
                response.status = true
                resolve(response)
            }


        })
    },
    doLogin: function (userData) {

        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (user && user.block == false) {

                if (user.admin) {
                    bcrypt.compare(userData.password, user.password).then((status) => {

                        if (status) {
                            response.status = true
                            response.user = user
                            response.admin = true
                            resolve(response)
                        } else {
                            response.status = false
                            reject(response)
                        }

                    })
                } else {
                    bcrypt.compare(userData.password, user.password).then((status) => {

                        if (status) {
                            response.user = user
                            response.status = true
                            resolve(response)

                        } else {
                            response.status = false
                            reject(response)

                        }
                    })
                }
            } else {
                response.status = false
                reject(response)

            }
        })
    },
    getSingleUser: function (userData) {

        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            resolve(user)
        })

    },
    addToCart: function (proId, userId) {

        let proObj = {
            item: objId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(products => products.item == proId)

                if (proExist != -1) {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ 'products.item': objId(proId), user: objId(userId) }, {
                        $inc: { 'products.$.quantity': 1 }
                    }).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objId(userId) }, {

                        $push: { products: proObj }

                    }).then((response) => {
                        resolve()
                    })

                }

            } else {
                let cartObj = {
                    user: objId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: function (userId) {

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objId(userId) })
            if (userCart) {

                let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ['$product', 0] },
                            singleProTotal: { $multiply: [{ $arrayElemAt: ["$product.productPrice", 0] }, "$quantity"] }

                        },
                    },

                ]).toArray()

                resolve(cartItems)
            } else {

                reject()
            }

        })
    },
    getAllUsers: function () {
        return new Promise(async (resolve, reject) => {
            users = await db.get().collection(collection.USER_COLLECTION).find({ admin: false }).toArray()
            resolve(users)
        })
    },
    blockUser: function (proId) {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objId(proId) }, {
                $set: {
                    block: true
                }
            }).then(() => {
                resolve()
            })
        })
    },
    unblockUser: function (proId) {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objId(proId) }, {
                $set: {
                    block: false
                }
            }).then(() => {
                resolve()
            })
        })
    },
    getCartCount: function (userId) {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objId(userId) })
            if (cart) {
                count = cart.products.length

            }
            resolve(count)
        })
    },
    changeProductQuantity: function (details) {

        quantity = parseInt(details.quantity)
        count = parseInt(details.count)
        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objId(details.cart) },
                    {
                        $pull: { products: { item: objId(details.product) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })

            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objId(details.cart), 'products.item': objId(details.product) }, {
                    $inc: { 'products.$.quantity': count }
                }).then((response) => {

                    resolve({ status: true })
                })
            }

        })
    },
    deleteOneCartItem: function (details) {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objId(details.cart) },
                {
                    $pull: { products: { item: objId(details.product) } }
                }).then((response) => {
                    resolve(true)
                })
        })
    },
    deleteCart: function (details) {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).removeOne({ user: objId(details.user) }).then((response) => {
                resolve(true)
            })
        })
    },
    otpSignup: function (userData) {


        return new Promise(async (resolve, reject) => {

            db.get().collection(collection.USER_COLLECTION).insertOne({
                name: userData.name,
                mobile: userData.mobile,
                email: userData.email,
                admin: false,
                block: false
            }).then(() => {

                resolve()
            })


        })
    },
    otpUserCheck: function (userData) {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: userData.mobile })

            if (user) {

                reject()
            } else {
                resolve()
            }
        })
    },
    otpEmailCheck: function (userData) {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {

                reject()
            } else {

                resolve()
            }
        })
    },

    otpLogin: function (userData) {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: userData.mobile })
            if (user.block) {
                reject()
            } else {
                resolve(user)
            }


        })
    },
    getTotalAmount: function (userId) {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    //use project instead of group for each product price
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.productPrice'] } }
                    }
                    
                }

            ]).toArray()

            resolve(total[0].total)



        })

    },
    getSingeTotal: (userId, proId) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objId(userId) }

                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',

                    }
                },
                {
                    $match: { item: objId(proId) }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product',
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }

                    }
                },
                {
                    $project: {
                        singleTotal: { $multiply: ['$quantity', '$product.productPrice'] }
                    }
                }


            ]).toArray()

            resolve(total[0].singleTotal)



        })

    },
    placeOrder: (order, products, total) => {

        return new Promise((resolve, reject) => {
            let status = order.payment_method === 'cod' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    firstName: order.fname,
                    lastName: order.lname,
                    houseName: order.houseName,
                    streetAddress: order.streetAddress,
                    town: order.town,
                    state: order.state,
                    zip: order.zip,
                    phone: order.phone

                },
                user: objId(order.user),
                paymentMethod: order.payment_method,
                totalAmount: total,
                products: products,
                status: status,
                ship: 'Not Dispatched',
                date:moment(new Date()).format('L')
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: objId(order.user) })
                db.get().collection(collection.ADDRESS_COLLECTION).insert({
                    user: objId(order.user),
                    firstName: order.fname,
                    lastName: order.lname,
                    houseName: order.houseName,
                    streetAddress: order.streetAddress,
                    town: order.town,
                    state: order.state,
                    zip: order.zip,
                    phone: order.phone,


                })
                resolve(response.ops[0]._id)
            })


        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objId(userId) })
            resolve(cart.products)
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ user: objId(userId) }).toArray()
            
            resolve(orders)

        })
    },
    generateRazorpay: (userId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + userId
            };
            instance.orders.create(options, function (err, order) {

                resolve(order)
            });


        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'lo61AtQi3r6jAwcgaxtdwT5k');

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ user: objId(userId) }).toArray()

            if (address.length > 0) {
                resolve(address)
            } else {

                reject()
            }
        })
    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let allOrders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(allOrders)
        })
    },
    cancelOrder: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objId(id) }, {
                $set: {
                    ship: 'Order Cancelled',
                }
            }).then(() => {
                resolve()
            })

        })
    },
    shipOrder: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objId(id) }, {
                $set: {
                    ship: 'Order Dispatched',
                }
            }).then(() => {
                resolve()
            })
        })
    },
    addAddress: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).insert({
                user: objId(details.user),
                firstName: details.firstName,
                lastName: details.lastName,
                houseName: details.houseName,
                streetAddress: details.streetAddress,
                town: details.town,
                state: details.state,
                zip: details.zip,
                phone: details.phone
            })
            resolve()
        })
    },
    editOneaddress: (id) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objId(id) })
            resolve(address)
        })
    },
    updateAddress: (details) => {
        console.log('udate address', details);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: objId(details.id) }, {
                $set: {
                    firstName: details.firstName,
                    lastName: details.lastName,
                    houseName: details.houseName,
                    streetAddress: details.streetAddress,
                    town: details.town,
                    state: details.state,
                    zip: details.zip,
                    phone: details.phone
                }
            }).then(() => {
                resolve()
            })


        })
    },
    getUserProfile: (userId) => {
        return new Promise(async (resolve, reject) => {
            let profile = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objId(userId) })
            resolve(profile)
        })
    },
    updateUserProfile: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {


            let count = await db.get().collection(collection.USER_COLLECTION).find({ email: data.email }).count()
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objId(data.id) })
            // if(user.email==data.email || count==0){
            //     console.log('Not problem');
            // }else{
            //     console.log('Problem');
            // }

            console.log('user in mongo', user);
            if (user.email == data.email || count == 0) {

                response.email=true
                bcrypt.compare(data.password, user.password).then(async (status) => {
                    if (status) {
                        response.status = true
                        if (data.newPassword == '') {
                            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objId(data.id) }, {
                                $set: {
                                    name: data.name,
                                    email: data.email,

                                }
                            })
                            response.user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objId(data.id) })
                            resolve(response)
                        } else {
                            console.log('new passswrod is here');
                            data.newPassword = await bcrypt.hash(data.newPassword, 10)
                            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objId(data.id) }, {
                                $set: {
                                    name: data.name,
                                    email: data.email,
                                    password: data.newPassword
                                }
                            })
                            response.user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objId(data.id) })
                            resolve(response)
                        }

                    } else {
                        console.log('password wrong');
                        response.status = false
                        reject(response)
                    }
                })
            }else{
                response.email=false
                reject(response)
            }
        })
    },
    AllorderStatus:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).find()
        })
    }


}