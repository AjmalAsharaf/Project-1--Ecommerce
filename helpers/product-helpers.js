var db=require('../config/connection')
var collection = require('../config/collection')

var objId=require('mongodb').ObjectID
const { ObjectId } = require('mongodb')
const { response } = require('express')

module.exports={
    addProducts:function(product){
        
        product.productPrice=parseInt(product.productPrice)
        product.productQty=parseInt(product.productQty)
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
               
                resolve(data.ops[0]._id)
            })
            
        })
    },
    viewAllProducts:function(){
        return new Promise(async(resolve,reject)=>{
            let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()

            resolve(products)
        })
    },
    deleteProduct:function(proId){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objId(proId)})
            resolve()
        })
    },
    viewOnePorduct:function(proId){
        return new Promise(async(resolve,reject)=>{
            let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objId(proId)})
            resolve(product)
        })
    },
    updateProduct:function(proId,product){
        product.productPrice=parseInt(product.productPrice)
        product.productQty=parseInt(product.productQty)

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objId(proId)},{
                $set:{
                    productName:product.productName,
                    productCategory:product.productCategory,
                    productSubCat:product.productSubCat,
                    productPrice:product.productPrice,
                    productQty:product.productQty,
                    productDes:product.productDes
                }
            }).then((response)=>{
                resolve()
            })
            
        })
    },
    insertCategory:function (data){
        return new Promise(async(resolve,reject)=>{
            let category= await db.get().collection(collection.CATEGORY).findOne({productSubCat:data.productSubCat})
            if(category){
                reject()
            }else{
                db.get().collection(collection.CATEGORY).insertOne({productSubCat:data.productSubCat})
                resolve()
            }
        })
    },
    showCategory:function(){
        return new Promise(async(resolve,reject)=>{
            let category= await db.get().collection(collection.CATEGORY).find().toArray()
            resolve(category)
        })
    },
    deleteCategory:function(proId){
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.CATEGORY).removeOne({_id:objId(proId)})
            resolve()
        })
    },
    showOneCategory:function(proId){
        return new Promise(async(resolve,reject)=>{
            category=await db.get().collection(collection.CATEGORY).findOne({_id:objId(proId)})

            resolve(category)
        })
    },
    updateCategory:function(proId,subCategory){
        
        return new Promise(async(resolve,reject)=>{
            category=await db.get().collection(collection.CATEGORY).findOne({productSubCat:subCategory})
            if(category){
                reject()
            }else{
                
                db.get().collection(collection.CATEGORY).updateOne({_id:objId(proId)},{
                    $set:{
                        productSubCat:subCategory
                    }
                }).then((response)=>{
                    resolve()
                })
                
            }
        })
    },
    productFileter:(category)=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({productCategory:category}).toArray()

            resolve(products)
        })
    },
    searchProduct:(data)=>{
        console.log('Mongo data',data);
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({productName:data}).toArray()
            
            if(products.length>0){
                resolve(products)
            }else{
                reject()
            }
        })
    }
       
}