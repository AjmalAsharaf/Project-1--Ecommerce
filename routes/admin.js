var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const orderHelpers=require('../helpers/order-helpers')
/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.admin){
    orderHelpers.getTotalOrderNum().then((orderNum)=>{
      orderHelpers.graphStatus().then((response)=>{
        res.render('admin/admin',{admin:true,orderNum,response})
      })
     
    }).catch(()=>{
      res.render('admin/admin',{admin:true})

    })
    
  }else{
    res.redirect('/')
  }
 
});

router.get('/user-management',function(req,res){
  if(req.session.admin){
    userHelpers.getAllUsers().then((userDetails)=>{
      console.log('All users',userDetails);
      res.render('admin/user-management',{admin:true,userDetails})
    })
    
  }else{
    res.redirect('/')
  }
})

router.get('/product-management',function(req,res){
  if(req.session.admin){
    productHelpers.viewAllProducts().then((products)=>{
      
      res.render('admin/product-management',{admin:true,products})
    })
  
  }else{
    res.redirect('/')
  }
})

router.get('/add-product',(req,res)=>{
  if(req.session.admin){
    productHelpers.showCategory().then((category)=>{
      
      res.render('admin/add-product',{admin:true,category})
    })
   
  }else{
    res.redirect('/')
  }
})

router.post('/add-product',(req,res)=>{
  if(req.session.admin){
   
    productHelpers.addProducts(req.body).then((id)=>{
      
      let image=req.files.Image
      
      image.mv('./assets/product-images/'+id+'.jpg',(err,done)=>{
        if(!err){
          res.redirect('/admin/product-management')
        }else{
          console.log('Image upload failed');
        }
      })
      
    })
  }else{    
    res.redirect('/')
  }
})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  
  if(req.session.admin){
    productHelpers.deleteProduct(proId).then(()=>{
      res.redirect('/admin/product-management')
    })
  }else{
    res.redirect('/')
  }
})

router.get('/edit-product/:id',(req,res)=>{
  let proId=req.params.id
  
  if(req.session.admin){
    productHelpers.viewOnePorduct(proId).then((product)=>{
      productHelpers.showCategory().then((category)=>{
        res.render('admin/edit-product',{admin:true,product,category})
      })
     
    })
  }else{
    res.redirect('/')
  }
})

router.post('/update-product/:id',(req,res)=>{
  let proId=req.params.id
  if(req.session.admin){
    product=req.body
    productHelpers.updateProduct(proId,product).then(()=>{
      res.redirect('/admin/product-management')
      if(req.files.Image){
        image=req.files.Image
        image.mv('./assets/product-images/'+proId+'.jpg',(err,done)=>{

        })


      }
    })
    
  }else{
    res.redirect('/')
  }
})

router.get('/block-user/:id',(req,res)=>{
  if(req.session.admin){
    proId=req.params.id
    userHelpers.blockUser(proId).then(()=>{
      res.redirect('/admin/user-management')
    })
    
  }else{
    res.redirect('/')
  }

})
router.get('/unblock-user/:id',(req,res)=>{
  if(req.session.admin){
    proId=req.params.id
    userHelpers.unblockUser(proId).then(()=>{
      res.redirect('/admin/user-management')
    })
  }else{
    res.redirect('/')
  }
})

router.get('/add-category',(req,res)=>{
  if(req.session.user){
    res.render('admin/add-category',({admin:true}))
  }else{
    res.redirect('/')
  }
  
})
router.post('/add-category',(req,res)=>{
  console.log(req.body,'add-category');
  if(req.session.admin){
   
  productHelpers.insertCategory(req.body).then(()=>{
    res.json({status:true})
  }).catch(()=>{
    res.json({status:false})
  })
  }else{
    res.redirect('/')
  }
  
})
router.get('/category-management',(req,res)=>{
  if(req.session.admin){
    productHelpers.showCategory().then((category)=>{
      res.render('admin/category-manager',{admin:true,category})
    })
  }else{
    res.redirect('/')
  }
  
 
})

router.get('/delete-category/:id',(req,res)=>{
  if(res.session.admin){
    proId=req.params.id
  productHelpers.deleteCategory(proId).then(()=>{
    res.redirect('/admin/category-management')
  })
  }else{
    res.redirect('/')
  }
  
})

router.get('/edit-category/:id',(req,res)=>{
  if(req.session.admin){
    proId=req.params.id

  productHelpers.showOneCategory(proId).then((category)=>{
    res.render('admin/edit-category',{admin:true,category})
  })
  }else{
    res.redirect('/')
  }
  
})

router.post('/edit-category',(req,res)=>{
  if(req.session.admin){
    productHelpers.updateCategory(req.body.proId,req.body.productSubCat).then(()=>{
      res.json({status:true})
    })
    .catch(()=>{
      res.json({status:false})
    })
  }else{
    res.redirect('/')
  }
 
})
router.get('/get-all-orders',(req,res)=>{
  userHelpers.getAllOrders().then((allorders)=>{
    
    res.render('admin/order-details',{admin:true,allorders})
  })
})

router.get('/cancel-order/:id',(req,res)=>{
  console.log('cancel',req.params.id);
  userHelpers.cancelOrder(req.params.id).then(()=>{
    res.redirect('/admin/get-all-orders')
  })
})

router.get('/ship-order/:id',(req,res)=>{
  userHelpers.shipOrder(req.params.id).then(()=>{
    res.redirect('/admin/get-all-orders')
  })
})




module.exports = router;
