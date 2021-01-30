var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
var objId = require('mongodb').ObjectID
const { ObjectID, ObjectId } = require('mongodb')
const { response } = require('express')

module.exports={
    getTotalOrderNum:()=>{
        let orderNum={}
        return new Promise(async(resolve,reject)=>{
            orderNum.totalOrders=await db.get().collection(collection.ORDER_COLLECTION).find().count()
            orderNum.readyToship=await db.get().collection(collection.ORDER_COLLECTION).find({status:'placed',ship:'Not Dispatched'}).count()
            orderNum.completedOrder=await db.get().collection(collection.ORDER_COLLECTION).find({ship:'Order Dispatched'}).count()
            orderNum.cancelOrder=await db.get().collection(collection.ORDER_COLLECTION).find({ship:'Order Cancelled'}).count()
            if(orderNum==null){
                reject()
            }else{
                orderNum.readyToshipPers=((orderNum.totalOrders-(orderNum.totalOrders-orderNum.readyToship))/orderNum.totalOrders)*100
                orderNum.completedOrderPers=((orderNum.totalOrders-(orderNum.totalOrders-orderNum.completedOrder))/orderNum.totalOrders)*100
                orderNum.cancelOrderPers=((orderNum.totalOrders-(orderNum.totalOrders-orderNum.cancelOrder
                    ))/orderNum.totalOrders)*100
               console.log('operations','alldata',orderNum);
                resolve(orderNum)
            }
            
        })
    },
    graphStatus:()=>{
        return new Promise(async(resolve,reject)=>{
            let graph= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        ship:'Order Dispatched'
                    }
                },
                {
                    $project:{
                        date:1,
                        _id:0,
                        totalAmount:1
                    }
                },
                {
                    $group:{
                        _id:{month:'$date'},
                        count:{$sum:1},
                        total:{$sum:'$totalAmount'}
                    }
                },
                {
                    $project:{
                        _id:1,
                        total:1
                    }
                },
                {
                    $sort:{_id:1    }
                }

            ]).toArray()
            console.log('My data',graph);
            let response={
                date:[],
                total:[]
            }
           for(i=0;i<graph.length;i++){
            response.date[i]=graph[i]._id.month
            response.total[i]=graph[i].total
           }
            console.log('response',response);
            resolve(response)

        })
    }
}